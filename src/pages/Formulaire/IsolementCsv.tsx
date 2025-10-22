import React, { useEffect, useImperativeHandle, useMemo, useState } from "react";
import Papa from "papaparse";
import { QuestionField } from "@/components/QuestionField";

export type IsolementSummary = {
  score: number; // 0..100
  color: "green" | "orange" | "red" | "grey";
  report: { reperage: string[]; proposition: string[] };
};

export type IsolementHandle = {
  buildSummary: () => IsolementSummary;
  clearLocal: () => void;
};

type CsvRow = {
  Group?: string;
  Section?: string;
  QPos?: string | number;
  Question: string;
  Type?: string;        // radio | checkbox | text | textarea
  Options?: string;     // "Oui:50|Non:0" ou multi-lignes; affiche le libellé, garde le score
  Role?: string;        // "color" => définit la couleur de la barre si répondu
  TriggerReportOn?: string; // liste d'options qui déclenchent le rapport (ex: "Oui|Partielle" ou "*")
  Surveillance?: string;    // éléments séparés par | ou sauts de ligne
  Actions?: string;         // idem
};

type Option = { label: string; score?: number };
type Question = {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea";
  options: Option[];
  role?: "color" | "freq" | "";
  triggerOn: string[];          // options qui déclenchent le rapport
  surveillanceItems: string[];
  actionItems: string[];
};

const STORAGE_KEY = "geriatrie_isolement_simpleplus_v1";
const SECTION_NAME = "Isolement";

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function norm(s: string) {
  return stripDiacritics(s).trim().toLowerCase();
}
function normalizeId(label: string, pos: number) {
  return `frag.isolement.simple.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}
function parseChoices(raw?: string): Option[] {
  if (!raw) return [];
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+)\s*$/);
      if (m) return { label: m[1].trim(), score: Number(m[2]) };
      return { label: line, score: undefined };
    });
}
function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean);
}
function defaultTriggerOnFromOptions(options: Option[]): string[] {
  const labels = options.map((o) => o.label);
  if (labels.some((l) => norm(l) === "oui")) return ["Oui"];
  if (labels.some((l) => norm(l) === "non")) return ["Non"];
  return []; // rien ne déclenche par défaut si aucune convention
}
function findQualityColor(answer?: string): "green" | "orange" | "red" | "grey" {
  // si pas de réponse => grey
  if (!answer || !answer.trim()) return "grey";
  const a = norm(answer);
  if (a.startsWith("bonne")) return "green";
  if (a.startsWith("partielle")) return "orange";
  if (a.startsWith("insuffisante")) return "red";
  return "orange";
}

export default React.forwardRef<IsolementHandle, { csvPath?: string }>(function IsolementCsv(
  { csvPath = "/isolement.csv" },
  ref
) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Lecture CSV
  useEffect(() => {
    fetch(csvPath)
      .then((r) => r.text())
      .then((csvText) => {
        const parsed = Papa.parse<CsvRow>(csvText, { header: true, skipEmptyLines: true });
        const rows = (parsed.data || [])
          .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && norm(String(x)) === norm(SECTION_NAME)))
          .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

        const qs: Question[] = rows.map((r) => {
          const pos = Number(r.QPos || 0);
          const type = (r.Type || "radio").toLowerCase() as Question["type"];
          const roleRaw = (r.Role || "").trim().toLowerCase();
          const options = parseChoices(r.Options);
          const trig = parseList(r.TriggerReportOn);
          const triggerOn = trig.length ? trig : defaultTriggerOnFromOptions(options);

          return {
            id: normalizeId(r.Question.trim(), pos),
            label: r.Question.trim(),
            type: ["radio", "checkbox", "text", "textarea"].includes(type) ? type : "radio",
            options,
            role: roleRaw === "color" ? "color" : roleRaw === "freq" ? "freq" : "",
            triggerOn,
            surveillanceItems: parseList(r.Surveillance),
            actionItems: parseList(r.Actions),
          };
        });

        setQuestions(qs);
      })
      .catch((err) => {
        console.error("Erreur de lecture CSV (Isolement):", err);
        setQuestions([]);
      });
  }, [csvPath]);

  // Persistance locale
  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const buildSummary = (): IsolementSummary => {
    let total = 0;
    let qualiteAnswer: string | undefined;

    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (!selected) return;

      // Détermination de la couleur si role=color
      if (q.role === "color") {
        qualiteAnswer = selected;
      }

      // Score (additionne si l'option sélectionnée porte un nombre)
      const opt = q.options.find((o) => norm(o.label) === norm(selected));
      if (opt?.score) total += opt.score;

      // Rapport : seulement si l'option sélectionnée fait partie de TriggerReportOn
      if (q.triggerOn.length === 0 || q.triggerOn.some((t) => norm(t) === norm(selected)) || q.triggerOn.includes("*")) {
        q.surveillanceItems.forEach((s) => reperageSet.add(s));
        q.actionItems.forEach((a) => propositionSet.add(a));
      }
    });

    const score = Math.max(0, Math.min(100, total));

    return {
      score,
      color: findQualityColor(qualiteAnswer),
      report: {
        reperage: Array.from(reperageSet),
        proposition: Array.from(propositionSet),
      },
    };
  };

  const clearLocal = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
  };

  useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [questions, answers]);

  const content = useMemo(() => {
    if (!questions.length) {
      return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;
    }
    return (
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            def={{ id: q.id, label: q.label, type: "radio", options: q.options.map((o) => o.label) }}
            value={answers[q.id]}
            onChange={setAnswer}
          />
        ))}
      </div>
    );
  }, [questions, answers]);

  return content;
});
