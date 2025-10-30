import React, { useEffect, useImperativeHandle, useMemo, useState } from "react";
import Papa from "papaparse";
import { QuestionField } from "@/components/QuestionField";

export type DependanceSummary = {
  adlScore: number;
  adlMax: number;
  iadlScore: number;
  iadlMax: number;
  report: { reperage: string[]; proposition: string[] };
};

export type DependanceHandle = {
  buildSummary: () => DependanceSummary;
  clearLocal: () => void;
};

type CsvRow = {
  Group?: string;        // "Dépendance"
  Section?: string;      // "ADL" | "IADL"
  QPos?: string | number;
  Question: string;
  Type?: string;         // radio | ...
  Options?: string;      // ex ADL: "Aide partielle:0,5|Dépendant:1" ; IADL: "Oui|Non" etc.
  Role?: string;         // toléré mais pas nécessaire ici
  TriggerReportOn?: string; // ex: "Aide partielle|Dépendant" (optionnel, ajoute au rapport)
  Surveillance?: string; // "|" ou sauts de ligne
  Actions?: string;
};

type Option = { label: string; score?: number };

type Q = {
  id: string;
  section: "ADL" | "IADL";
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea";
  options: Option[];             // options affichées (sans "Non")
  rawOptions: Option[];          // options brutes (pour détecter Oui/Non caché)
  triggerReportOn: string[];     // labels qui déclenchent le rapport (en plus de Aide partielle/Dépendant)
  surveillanceItems: string[];
  actionItems: string[];
};

const STORAGE_KEY = "geriatrie_dependance_simpleplus_v1";
const GROUP_NAME = "Dépendance";
const ADL_MAX = 6;
const IADL_MAX = 8;

function stripDiacritics(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function norm(s: string) { return stripDiacritics(s).trim().toLowerCase(); }
function normalizeId(section: string, label: string, pos: number) {
  return `dependance.${norm(section)}.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}
function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw.replace(/\r\n/g, "\n").split(/\n|\|/g).map((t) => t.trim()).filter(Boolean);
}
function parseChoices(raw?: string, hideNon = true): { shown: Option[]; raw: Option[] } {
  if (!raw) return { shown: [], raw: [] };
  const all: Option[] = raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+(?:[.,][0-9]+)?)\s*$/); // gère "0,5"
      if (m) return { label: m[1].trim(), score: Number(m[2].replace(",", ".")) };
      return { label: line, score: undefined };
    });
  const shown = hideNon ? all.filter((o) => norm(o.label) !== "non") : all;
  return { shown, raw: all };
}

/** Si rien n'est coché et que la question est binaire Oui/Non, on considère "Non" implicitement. */
function getEffectiveAnswer(q: Q, val?: string): string | undefined {
  if (val && val.trim()) return val;
  const hasOui = q.rawOptions.some((o) => norm(o.label) === "oui");
  const hasNon = q.rawOptions.some((o) => norm(o.label) === "non");
  if (hasOui && hasNon) return "Non";
  return undefined;
}

export default React.forwardRef<DependanceHandle, { csvPath?: string }>(function DependanceCsv(
  { csvPath = "/dependance.csv" },
  ref
) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
    catch { return {}; }
  });

  // Lecture CSV
  useEffect(() => {
    fetch(csvPath)
      .then((r) => r.text())
      .then((csvText) => {
        const parsed = Papa.parse<CsvRow>(csvText, { header: true, skipEmptyLines: true });
        const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

        const filtered = rows
          .filter((r) =>
            r && r.Question &&
            [r.Group].some((x) => x && norm(String(x)) === norm(GROUP_NAME)) &&
            [r.Section].some((x) => x && ["adl","iadl"].includes(norm(String(x))))
          )
          .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

        const qs: Q[] = filtered.map((r) => {
          const pos = Number(r.QPos || 0);
          const section = (String(r.Section).toUpperCase() === "IADL" ? "IADL" : "ADL") as "ADL" | "IADL";
          const type = (r.Type || "radio").toLowerCase() as Q["type"];
          const { shown, raw } = parseChoices(r.Options, /*hideNon*/ true);
          const triggerReportOn = parseList(r.TriggerReportOn);
          return {
            id: normalizeId(section, r.Question.trim(), pos),
            section,
            label: r.Question.trim(),
            type: (["radio", "checkbox", "text", "textarea"] as const).includes(type) ? type : "radio",
            options: shown,
            rawOptions: raw,
            triggerReportOn,
            surveillanceItems: parseList(r.Surveillance),
            actionItems: parseList(r.Actions),
          };
        });

        setQuestions(qs);
      })
      .catch((err) => {
        console.error("Erreur de lecture CSV (Dépendance):", err);
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

  // Calcul des scores + rapport
  const buildSummary = (): DependanceSummary => {
    let adlPenalty = 0;   // à soustraire de 6
    let iadlPenalty = 0;  // à soustraire de 8

    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    questions.forEach((q) => {
      const selected = getEffectiveAnswer(q, answers[q.id]); // "Non" implicite si binaire & non coché

      // ==== ADL : Aide partielle => 0.5 ; Dépendant => 1
      if (q.section === "ADL" && selected) {
        const lab = norm(selected);
        if (lab === "aide partielle") adlPenalty += 0.5;
        else if (lab === "dépendant" || lab === "dependant") adlPenalty += 1;
      }

      // ==== IADL : perd 1 point à chaque réponse COCHÉE (on ne pénalise pas le "Non" implicite)
      if (q.section === "IADL") {
        const selectedRaw = answers[q.id]; // uniquement si l'utilisateur a effectivement coché
        if (selectedRaw && selectedRaw.trim()) {
          // une sélection utilisateur -> -1
          iadlPenalty += 1;
        }
      }

      // ==== Rapport : si (Aide partielle | Dépendant) OU si TriggerReportOn contient la réponse
      const triggerHit =
        (selected && ["aide partielle", "dependant", "dépendant"].includes(norm(selected))) ||
        (selected && q.triggerReportOn.length > 0 && q.triggerReportOn.some((t) => norm(t) === norm(selected))) ||
        q.triggerReportOn.includes("*");

      if (triggerHit) {
        q.surveillanceItems.forEach((s) => reperageSet.add(s));
        q.actionItems.forEach((a) => propositionSet.add(a));
      }
    });

    const adlScore = Math.max(0, Math.min(ADL_MAX, ADL_MAX - adlPenalty));
    const iadlScore = Math.max(0, Math.min(IADL_MAX, IADL_MAX - iadlPenalty));

    return {
      adlScore,
      adlMax: ADL_MAX,
      iadlScore,
      iadlMax: IADL_MAX,
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

  // Rendu : deux blocs (ADL / IADL) sur une même page — SANS “(max X)” dans le titre
  const adlQs = questions.filter((q) => q.section === "ADL");
  const iadlQs = questions.filter((q) => q.section === "IADL");

  const content = useMemo(() => {
    if (!questions.length) return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;
    return (
      <div className="space-y-8">
        {adlQs.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2">ADL</h3>
            <div className="space-y-4">
              {adlQs.map((q) => (
                <QuestionField
                  key={q.id}
                  def={{ id: q.id, label: q.label, type: q.type, options: q.options.map((o) => o.label) }}
                  value={answers[q.id]}
                  onChange={setAnswer}
                />
              ))}
            </div>
          </div>
        )}

        {iadlQs.length > 0 && (
          <div>
            <h3 className="text-base font-semibold mb-2">IADL</h3>
            <div className="space-y-4">
              {iadlQs.map((q) => (
                <QuestionField
                  key={q.id}
                  def={{ id: q.id, label: q.label, type: q.type, options: q.options.map((o) => o.label) }}
                  value={answers[q.id]}
                  onChange={setAnswer}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [questions, answers]);

  return content;
});
