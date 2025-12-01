import React, { useEffect, useImperativeHandle, useMemo, useState } from "react";
import Papa from "papaparse";
import { QuestionField } from "@/components/QuestionField";

export type DependenceSummary = {
  adlScore: number;
  adlMax: number;
  iadlScore: number;
  iadlMax: number;
  dependanceScore: number; // Nouveau score unifié pour l'histogramme (0-100%)
  color: "green" | "orange" | "red" | "grey"; // Couleur basée sur "Qualité de la prise en charge actuelle"
  report: { reperage: string[]; proposition: string[] };
};

export type DependenceHandle = {
  buildSummary: () => DependenceSummary;
  clearLocal: () => void;
};

type CsvRow = {
  Group?: string;        // "Dépendance"
  Section?: string;      // "ADL" | "IADL"
  QPos?: string | number;
  Question: string;
  Type?: string;         // radio | ...
  Options?: string;      // ex ADL: "Aide partielle:0,5|Dépendant:1" ; IADL: "Oui|Non" etc.
  Role?: string;         // "lock" pour désactiver le reste du formulaire
  TriggerReportOn?: string; // ex: "Aide partielle|Dépendant" (optionnel, ajoute au rapport)
  Surveillance?: string; // "|" ou sauts de ligne
  Actions?: string;
};

type Option = { label: string; score?: number };

type Q = {
  id: string;
  section: "Dépendance" | "ADL" | "IADL" | "";
  label: string;
  type: "radio" | "checkbox" | "text" | "textarea" | "information";
  qpos: number;
  role?: string;                 // "lock" pour verrouiller le formulaire
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

/** Calcule la couleur de l'histogramme basée sur "Qualité de la prise en charge actuelle" */
function calculateColor(questions: Q[], answers: Record<string, string>): "green" | "orange" | "red" | "grey" {
  const qualityQuestion = questions.find((q) =>
    norm(q.label) === norm("Qualité de la prise en charge actuelle")
  );

  if (qualityQuestion) {
    const selected = getEffectiveAnswer(qualityQuestion, answers[qualityQuestion.id]);
    if (selected) {
      const vNorm = norm(selected);
      if (vNorm === "bonne") return "green";
      else if (vNorm === "partielle") return "orange";
      else if (vNorm === "insuffisante") return "red";
    }
  }

  return "grey";
}

export default React.forwardRef<DependenceHandle, { csvPath?: string }>(function DependenceCsv(
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
            r && (r.Question || r.Type === "Information" || r.Options) &&
            [r.Group].some((x) => x && norm(String(x)) === norm(GROUP_NAME))
          )
          .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

        const qs: Q[] = filtered.map((r) => {
          const pos = Number(r.QPos || 0);
          const sectionRaw = String(r.Section || "").trim();
          let section: Q["section"] = "";

          if (sectionRaw.toUpperCase() === "ADL") {
            section = "ADL";
          } else if (sectionRaw.toUpperCase() === "IADL") {
            section = "IADL";
          } else if (sectionRaw === "Dépendance") {
            section = "Dépendance";
          }

          const type = (r.Type || "radio").toLowerCase() as Q["type"];
          const { shown, raw } = parseChoices(r.Options, /*hideNon*/ true);
          const triggerReportOn = parseList(r.TriggerReportOn);

          // Générer le label de la question
          let questionLabel = r.Question ? r.Question.trim() : "";

          return {
            id: normalizeId(section || "unknown", questionLabel, pos),
            section,
            qpos: pos,
            label: questionLabel,
            type: (["radio", "checkbox", "text", "textarea", "information"] as const).includes(type) ? type : "radio",
            role: r.Role,
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
  const buildSummary = (): DependenceSummary => {
    let adlPenalty = 0;   // à soustraire de 6
    let iadlPenalty = 0;  // à soustraire de 8

    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    // Vérifier si la question "lock" est cochée "Oui"
    const lockQuestion = questions.find((q) => q.role === "lock");
    const isFormLocked = lockQuestion && answers[lockQuestion.id] &&
                        norm(answers[lockQuestion.id]) === "oui";

    questions.forEach((q) => {
      const selected = getEffectiveAnswer(q, answers[q.id]); // "Non" implicite si binaire & non coché

      // *** Si formulaire verrouillé ("À revoir" cochée), ne pas calculer les scores ***
      if (!isFormLocked) {
        // ==== ADL : Aide partielle => 0.5 ; Dépendant => 1
        if (q.section === "ADL" && selected) {
          const lab = norm(selected);
          if (lab === "aide partielle") adlPenalty += 0.5;
          else if (lab === "dépendant" || lab === "dependant") adlPenalty += 1;
        }

        // ==== IADL : nouvelles méthodes - utilise les scores directs des options
        if (q.section === "IADL" && selected) {
          const selectedOption = q.rawOptions.find((opt) => norm(opt.label) === norm(selected));
          if (selectedOption && selectedOption.score !== undefined) {
            iadlPenalty += selectedOption.score;
          }
        }
      }

      // ==== Rapport : détermine si la réponse déclenche l'ajout au rapport
      let triggerHit = false;

      // Pour toutes les sections : si TriggerReportOn contient la réponse sélectionnée
      if (selected && q.triggerReportOn.length > 0) {
        triggerHit = q.triggerReportOn.some((t) => norm(t) === norm(selected));
      }

      // Cas spécial pour ADL : Aide partielle/Dépendant déclenche automatiquement
      if (q.section === "ADL" && selected) {
        const lab = norm(selected);
        if (["aide partielle", "dependant", "dépendant"].includes(lab)) {
          triggerHit = true;
        }
      }

      // Trigger universel avec "*"
      if (q.triggerReportOn.includes("*")) {
        triggerHit = true;
      }

      // *** NOUVELLE LOGIQUE : Si formulaire verrouillé, seule la question "lock" contribue au rapport ***
      if (triggerHit) {
        if (isFormLocked) {
          // Formulaire verrouillé : seule la question "lock" ajoute ses surveillances/actions
          if (q.role === "lock") {
            q.surveillanceItems.forEach((s) => reperageSet.add(s));
            q.actionItems.forEach((a) => propositionSet.add(a));
          }
          // Les autres questions n'ajoutent rien au rapport
        } else {
          // Formulaire normal : toutes les questions peuvent ajouter au rapport
          q.surveillanceItems.forEach((s) => reperageSet.add(s));
          q.actionItems.forEach((a) => propositionSet.add(a));
        }
      }
    });

    const adlScore = Math.max(0, Math.min(ADL_MAX, ADL_MAX - adlPenalty));
    const iadlScore = Math.max(0, Math.min(IADL_MAX, IADL_MAX - iadlPenalty));

    // ==== NOUVEAU CALCUL : Score de dépendance unifié pour l'histogramme ====
    let dependanceScore = 0;

    // Si ADL ≤ 5,5 alors 50%
    if (adlScore <= 5.5) {
      dependanceScore = 50;
    }

    // Si ADL ≤ 5 ET IADL ≤ 6 alors 100%
    if (adlScore <= 5 && iadlScore <= 6) {
      dependanceScore = 100;
    }

    // ==== COULEUR : basée sur "Qualité de la prise en charge actuelle" ====
    const color = calculateColor(questions, answers);

    return {
      adlScore,
      adlMax: ADL_MAX,
      iadlScore,
      iadlMax: IADL_MAX,
      dependanceScore,
      color,
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

    // Trier par position et déterminer l'état de verrouillage
    const sortedQuestions = [...questions].sort((a, b) => a.qpos - b.qpos);
    const lockQuestion = questions.find((q) => q.role === "lock");
    const isFormLocked = lockQuestion && answers[lockQuestion.id] &&
                        norm(answers[lockQuestion.id]) === "oui";

    return (
      <div className="space-y-4">
        {sortedQuestions.map((q) => (
          <QuestionField
            key={q.id}
            def={{ id: q.id, label: q.label, type: q.type, options: q.options.map((o) => o.label) }}
            value={answers[q.id]}
            onChange={setAnswer}
            disabled={isFormLocked && q.role !== "lock"}
          />
        ))}
      </div>
    );
  }, [questions, answers]);

  return content;
});
