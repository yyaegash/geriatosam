import React, { useEffect, useImperativeHandle, useMemo, useState } from "react";
import Papa from "papaparse";
import { QuestionField } from "@/components/QuestionField";

export type SummaryRow = { question: string; answer: string };
export type AideEnPlaceHandle = {
  buildSummary: () => { freq: SummaryRow[]; other: SummaryRow[] };
  clearLocal: () => void;
};

type CsvRow = {
  Group?: string;
  Section?: string;
  QPos?: string | number;
  Question: string;
  Type?: string;        // radio | checkbox | text | textarea (défaut radio)
  Options?: string;     // "Oui|Non" ou multi-lignes; permet "Libellé:Score"
  Role?: string;        // "freq" pour tableau fréquences
  TriggerReportOn?: string; // non utilisé ici (spécifique rapport Isolement)
  Surveillance?: string;
  Actions?: string;
};

type Option = { label: string; score?: number };
type Question = {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea";
  options: Option[];
  role?: "freq" | "color" | "";
};

const STORAGE_KEY = "geriatrie_aide_en_place_simpleplus_v1";
const SECTION_NAME = "Aide en place et fréquence";

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function norm(s: string) {
  return stripDiacritics(s).trim().toLowerCase();
}
function normalizeId(label: string, pos: number) {
  return `frag.aide.simple.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
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
function isNoAnswer(val?: string) {
  if (!val) return false;
  const n = norm(val);
  return n === "non";
}

export default React.forwardRef<AideEnPlaceHandle, { csvPath?: string }>(function AideEnPlaceCsv(
  { csvPath = "/aide_en_place.csv" },
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
          const role = (r.Role || "").trim().toLowerCase() as Question["role"];
          return {
            id: normalizeId(r.Question.trim(), pos),
            label: r.Question.trim(),
            type: ["radio", "checkbox", "text", "textarea"].includes(type) ? type : "radio",
            options: parseChoices(r.Options),
            role: role === "freq" ? "freq" : role === "color" ? "color" : "",
          };
        });

        setQuestions(qs);
      })
      .catch((err) => {
        console.error("Erreur de lecture CSV (Aide en place):", err);
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

  // Résumé (2 tableaux) — filtre "Non"
  const buildSummary = () => {
    const freq: SummaryRow[] = [];
    const other: SummaryRow[] = [];

    questions.forEach((q) => {
      const val = answers[q.id];
      if (!val || isNoAnswer(val)) return;

      const row = { question: q.label, answer: String(val) };
      if (q.role === "freq") freq.push(row);
      else other.push(row);
    });

    return { freq, other };
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
