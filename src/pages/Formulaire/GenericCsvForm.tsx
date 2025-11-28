import React, { useEffect, useImperativeHandle, useMemo, useState } from "react";
import Papa from "papaparse";
import { QuestionField } from "@/components/QuestionField";

/* =======================
 * Types exposés (pour Index)
 * ======================= */

export type GenericSummary =
  | {
      kind: "generic";
      score: number; // 0..100 (capé)
      color: "green" | "orange" | "red" | "grey";
      report: { reperage: string[]; proposition: string[] };
    }

export type GenericCsvFormHandle = {
  buildSummary: () => GenericSummary;
  clearLocal: () => void;
};

type Mode = "generic";

/* =======================
 * Types internes
 * ======================= */

type CsvRow = {
  Group?: string;
  Section?: string;
  QPos?: string | number;
  Question: string;
  Type?: string;           // radio | checkbox | text | textarea
  Options?: string;        // "Oui|Non" ou multilignes ; support "Libellé:Score"
  Role?: string;           // "lock" | "color" | "freq" (on gère lock + color ici)
  TriggerOn?: string;      // pour lock : valeurs déclenchantes ("Oui" par défaut si vide)
  TriggerReportOn?: string; // valeurs qui déclenchent un ajout au rapport (ex: "Oui") ; "*" = tout
  Surveillance?: string;   // lignes à ajouter à la colonne Repérage
  Actions?: string;        // lignes à ajouter à la colonne Proposition
};

type Option = { label: string; score?: number };
type Question = {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea";
  options: Option[];
  role: "" | "lock" | "color";
  triggerOnLock: string[];       // role=lock → valeurs déclenchantes (par défaut ["Oui"])
  triggerOnReport: string[];     // valeurs déclenchant l'ajout au rapport (peut être ["*"])
  surveillanceItems: string[];   // éléments Repérage
  actionItems: string[];         // éléments Proposition
};

type Props = {
  csvPath: string;          // ex: "/generic.csv"
  sectionName: string;      // ex: "Isolement" / "Polypathologie"
  storageKey: string;       // ex: "geriatrie.form.isolement.v1"
  mode: Mode;               // "isolement" | "generic"
};

/* =======================
 * Utils
 * ======================= */

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function norm(s: string) {
  return stripDiacritics(String(s)).trim().toLowerCase();
}
function normalizeId(section: string, label: string, pos: number) {
  return `csv.${norm(section)}.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}
function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw.replace(/\r\n/g, "\n").split(/\n|\|/g).map((t) => t.trim()).filter(Boolean);
}
function parseChoices(raw?: string): Option[] {
  if (!raw) return [];
  const all = raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+(?:[.,][0-9]+)?)\s*$/);
      if (m) return { label: m[1].trim(), score: Number(m[2].replace(",", ".")) };
      return { label: line, score: undefined };
    });
  // règle produit : on n’affiche pas "Non" (oui-only)
  return all.filter((o) => norm(o.label) !== "non");
}

/* =======================
 * Composant
 * ======================= */

export default React.forwardRef<GenericCsvFormHandle, Props>(function GenericCsvForm(
  { csvPath, sectionName, storageKey, mode },
  ref
) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Lecture CSV + parsing
  useEffect(() => {
    fetch(csvPath)
      .then((r) => r.text())
      .then((csvText) => {
        // Détection automatique du séparateur : ; ou ,
        const delimiter = csvText.includes(';Group;Section;') ? ';' : ',';
        const parsed = Papa.parse<CsvRow>(csvText, { header: true, skipEmptyLines: true, delimiter });
        const rows = (parsed.data || []) as CsvRow[];

        const filtered = rows
          .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && norm(String(x)) === norm(sectionName)))
          .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

        const qs: Question[] = filtered.map((r, idx) => {
          const pos = Number(r.QPos || idx + 1);
          const type = (r.Type || "radio").toLowerCase() as Question["type"];

          // Role
          const roleRaw = (r.Role || "").trim().toLowerCase();
          let role: Question["role"] = roleRaw === "lock" ? "lock" : roleRaw === "color" ? "color" : "";

          // Si une question s'appelle "À revoir" / "A revoir" et pas de Role, on force lock
          const isARevoir = ["a revoir", "à revoir"].includes(norm(r.Question));
          if (!role && isARevoir) role = "lock";

          const triggerOnLock = (parseList(r.TriggerOn).length ? parseList(r.TriggerOn) : ["Oui"]).map((s) => s.trim());
          const triggerOnReport = parseList(r.TriggerReportOn);

          return {
            id: normalizeId(sectionName, r.Question.trim(), pos),
            label: r.Question.trim(),
            type: (["radio", "checkbox", "text", "textarea"] as const).includes(type) ? type : "radio",
            options: parseChoices(r.Options),
            role,
            triggerOnLock,
            triggerOnReport,
            surveillanceItems: parseList(r.Surveillance),
            actionItems: parseList(r.Actions),
          };
        });

        setQuestions(qs);
      })
      .catch((err) => {
        console.error("Erreur de lecture CSV:", err);
        setQuestions([]);
      });
  }, [csvPath, sectionName]);

  // Persistance locale
  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  // Lock actif ?
  const locked = useMemo(() => {
    const locks = questions.filter((q) => q.role === "lock");
    return locks.some((q) => {
      const v = answers[q.id];
      if (!v) return false;
      return q.triggerOnLock.some((t) => norm(t) === norm(v));
    });
  }, [questions, answers]);

  // Couleur (mode isolement) à partir d’une question Role=color
  const isoColor: "green" | "orange" | "red" | "grey" = useMemo(() => {
    if (mode !== "generic") return "grey";
    const qc = questions.find((q) => q.role === "color");
    if (!qc) return "grey";
    const v = answers[qc.id];
    if (!v) return "grey";
    const n = norm(v);
    if (n.includes("bonne")) return "green";
    if (n.includes("partielle")) return "orange";
    if (n.includes("insuffisante")) return "red";
    return "grey";
  }, [mode, questions, answers]);

  // Summary
  const buildSummary = (): GenericSummary => {
    if (mode === "generic") {
      // Score = somme des scores des options sélectionnées (cap à 100)
      let total = 0;
      const reperageSet = new Set<string>();
      const actionSet = new Set<string>();

      const list = locked ? questions.filter((q) => q.role === "lock") : questions;

      list.forEach((q) => {
        const v = answers[q.id];
        if (!v) return;

        // Addition des scores si présents
        const opt = q.options.find((o) => norm(o.label) === norm(v));
        if (opt?.score) total += Number(opt.score || 0);

        // Rapport : si triggerReportOn contient "*" OU la valeur
        const shouldReport =
          q.triggerOnReport.includes("*") || q.triggerOnReport.some((t) => norm(t) === norm(v));
        if (shouldReport) {
          q.surveillanceItems.forEach((s) => reperageSet.add(s));
          q.actionItems.forEach((a) => actionSet.add(a));
        }
      });

      const score = Math.max(0, Math.min(100, Math.round(total)));

      return {
        kind: "generic",
        score,
        color: isoColor,
        report: {
          reperage: Array.from(reperageSet),
          proposition: Array.from(actionSet),
        },
      };
    }

    // generic
    const list = locked ? questions.filter((q) => q.role === "lock") : questions;
    const rows: { question: string; answer: string }[] = [];
    list.forEach((q) => {
      const v = answers[q.id];
      if (v == null || v === "") return;
      rows.push({ question: q.label, answer: String(v) });
    });

    return { kind: "generic", rows };
  };

  const clearLocal = () => {
    localStorage.removeItem(storageKey);
    setAnswers({});
  };

  useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [questions, answers, locked, isoColor]);

  // Rendu
  const content = useMemo(() => {
    if (!questions.length) return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;

    return (
      <div className="space-y-4">
        {questions.map((q) => {
          const isDisabled = locked && q.role !== "lock";
          return (
            <div key={q.id} className={isDisabled ? "opacity-50 pointer-events-none select-none" : ""} aria-disabled={isDisabled}>
              <QuestionField
                def={{ id: q.id, label: q.label, type: q.type, options: q.options.map((o) => o.label) }}
                value={answers[q.id]}
                onChange={setAnswer}
              />
            </div>
          );
        })}
      </div>
    );
  }, [questions, answers, locked]);

  return content;
});
