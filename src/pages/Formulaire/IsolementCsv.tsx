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
  Type?: string;
  Options?: string;
  Role?: string;             // "color" | "lock" | ...
  TriggerOn?: string;        // (nouveau) options de verrouillage, ex "Oui"
  TriggerReportOn?: string;  // ex: "Oui|Partielle" ou "*"
  Surveillance?: string;
  Actions?: string;
};

type Option = { label: string; score?: number };
type Question = {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea";
  options: Option[];
  role?: "color" | "lock" | "freq" | "";
  triggerOnLock: string[];
  triggerOnReport: string[];
  surveillanceItems: string[];
  actionItems: string[];
};

const STORAGE_KEY = "geriatrie_isolement_simpleplus_v2";
const SECTION_NAME = "Isolement";

function stripDiacritics(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function norm(s: string) { return stripDiacritics(s).trim().toLowerCase(); }
function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw.replace(/\r\n/g, "\n").split(/\n|\|/g).map((t) => t.trim()).filter(Boolean);
}
function normalizeId(label: string, pos: number) {
  return `frag.isolement.simple.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}
function parseChoices(raw?: string): Option[] {
  if (!raw) return [];
  const all = raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+)\s*$/);
      if (m) return { label: m[1].trim(), score: Number(m[2]) };
      return { label: line, score: undefined };
    });
  // ⚙️ Ne garder que "Oui", supprimer "Non"
  return all.filter((o) => norm(o.label) !== "non");
}
function findQualityColor(answer?: string): "green" | "orange" | "red" | "grey" {
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
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
    catch { return {}; }
  });

  useEffect(() => {
    fetch(csvPath)
      .then((r) => r.text())
      .then((csvText) => {
        const parsed = Papa.parse<CsvRow>(csvText, { header: true, skipEmptyLines: true });
        const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

        const filtered = rows
          .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && norm(String(x)) === norm(SECTION_NAME)))
          .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

        const qs: Question[] = filtered.map((r) => {
          const pos = Number(r.QPos || 0);
          const type = (r.Type || "radio").toLowerCase() as Question["type"];
          const roleRaw = (r.Role || "").trim().toLowerCase();
          const options = parseChoices(r.Options);

          const trigLock = parseList(r.TriggerOn);
          const triggerOnLock = trigLock.length ? trigLock : ["Oui"]; // défaut

          const trigReport = parseList(r.TriggerReportOn);

          const surveillanceItems = parseList(r.Surveillance);
          const actionItems = parseList(r.Actions);

          return {
            id: normalizeId(r.Question.trim(), pos),
            label: r.Question.trim(),
            type: (["radio", "checkbox", "text", "textarea"] as const).includes(type) ? type : "radio",
            options,
            role: roleRaw === "color" ? "color" : roleRaw === "lock" ? "lock" : roleRaw === "freq" ? "freq" : "",
            triggerOnLock,
            triggerOnReport: trigReport,
            surveillanceItems,
            actionItems,
          };
        });

        setQuestions(qs);
      })
      .catch((err) => {
        console.error("Erreur de lecture CSV (Isolement):", err);
        setQuestions([]);
      });
  }, [csvPath]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // 🔒 section verrouillée ?
  const locked = useMemo(() => {
    return questions.some((q) => {
      if (q.role !== "lock") return false;
      const selected = answers[q.id];
      if (!selected) return false;
      return q.triggerOnLock.some((t) => norm(t) === norm(selected)) || q.triggerOnLock.includes("*");
    });
  }, [questions, answers]);

  // Synthèse
  const buildSummary = () => {
    let total = 0;
    let qualiteAnswer: string | undefined;

    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    questions.forEach((q) => {
      const selected = answers[q.id];
      if (!selected) return;

      if (q.role === "color") qualiteAnswer = selected;

      const opt = q.options.find((o) => norm(o.label) === norm(selected));
      if (opt?.score) total += opt.score;

      // Rapport : uniquement si la réponse appartient à TriggerReportOn (ou si '*')
      if (q.triggerOnReport.includes("*") || q.triggerOnReport.some((t) => norm(t) === norm(selected))) {
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
    if (!questions.length) return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;

    return (
      <div className="space-y-4">
        {questions.map((q) => {
          const isLock = q.role === "lock";
          const disabled = locked && !isLock;
          return (
            <div key={q.id} className={disabled ? "opacity-50 pointer-events-none" : ""}>
              <QuestionField
                def={{ id: q.id, label: q.label, type: q.type, options: q.options.map((o) => o.label) }}
                value={answers[q.id]}
                onChange={setAnswer}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    );
  }, [questions, answers, locked]);

  return content;
});
