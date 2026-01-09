/**
 * Composant spécialisé pour le formulaire Dépendance
 */

import React, { useImperativeHandle, useMemo } from "react";
import { QuestionField } from "@/components/QuestionField";
import { useCsvForm, useFormLock } from "../shared/hooks";
import { DependenceSummary, BaseQuestion } from "../shared/types";
import { norm, getEffectiveAnswer, calculateQualityColor } from "../shared/utils";
import { FORM_CONSTANTS } from "../shared/constants";
import { CSV_VULNERABILITY_FORMS } from "@/data/forms.config";

export type DependenceHandle = {
  buildSummary: () => DependenceSummary;
  clearLocal: () => void;
};

type Props = {
  csvPath?: string;
};

const DEP_CONFIG = CSV_VULNERABILITY_FORMS.find(f => f.component === "dep")!;
const GROUP_NAME = DEP_CONFIG.label;
const STORAGE_KEY = DEP_CONFIG.storageKey;

export default React.forwardRef<DependenceHandle, Props>(function DependenceForm(
  { csvPath = "/dependance.csv" },
  ref
) {
  const { questions, answers, isLoading, setAnswer, clearLocal } = useCsvForm({
    csvPath,
    storageKey: STORAGE_KEY,
    groupName: GROUP_NAME
  });

  const isLocked = useFormLock(questions, answers);

  // Construction du résumé spécialisé
  const buildSummary = (): DependenceSummary => {
    let adlPenalty = 0;
    let iadlPenalty = 0;

    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    // Si formulaire verrouillé, on ne calcule pas les scores
    const shouldCalculateScores = !isLocked;

    questions.forEach((q) => {
      const selected = getEffectiveAnswer(q.rawOptions, answers[q.id]);

      // Calcul des scores seulement si non verrouillé
      if (shouldCalculateScores && selected) {
        // ADL: Aide partielle = 0.5, Dépendant = 1 (pénalités)
        if (isADLQuestion(q)) {
          const selectedOption = q.rawOptions.find((opt) =>
            norm(opt.label) === norm(selected)
          );
          if (selectedOption?.score !== undefined) {
            adlPenalty += selectedOption.score;
          }
        }

        // IADL: utilise les scores directs des options (1 si difficulté, 0 si Non)
        if (isIADLQuestion(q)) {
          const selectedOption = q.rawOptions.find((opt) =>
            norm(opt.label) === norm(selected)
          );
          if (selectedOption?.score !== undefined) {
            iadlPenalty += selectedOption.score;
          }
        }
      }

      // Rapport
      if (selected && shouldAddToReport(q, selected)) {
        // Si formulaire verrouillé, seule la question "lock" contribue
        if (isLocked) {
          if (q.role === "lock") {
            q.surveillanceItems.forEach((s) => reperageSet.add(s));
            q.actionItems.forEach((a) => propositionSet.add(a));
          }
        } else {
          q.surveillanceItems.forEach((s) => reperageSet.add(s));
          q.actionItems.forEach((a) => propositionSet.add(a));
        }
      }
    });

    const adlScore = Math.max(0, Math.min(FORM_CONSTANTS.ADL_MAX, FORM_CONSTANTS.ADL_MAX - adlPenalty));
    const iadlScore = Math.max(0, Math.min(FORM_CONSTANTS.IADL_MAX, FORM_CONSTANTS.IADL_MAX - iadlPenalty));

    // Score de dépendance unifié
    let dependanceScore = 0;
    if (adlScore <= 5.5) dependanceScore = 50;
    if (adlScore <= 5 && iadlScore <= 6) dependanceScore = 100;

    const color = calculateQualityColor(questions, answers, "qualité de la prise en charge actuelle");

    return {
      kind: "dependence",
      adlScore,
      adlMax: FORM_CONSTANTS.ADL_MAX,
      iadlScore,
      iadlMax: FORM_CONSTANTS.IADL_MAX,
      dependanceScore,
      color,
      report: {
        reperage: Array.from(reperageSet),
        proposition: Array.from(propositionSet),
      },
    };
  };

  useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [questions, answers, isLocked]);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;
    }

    // Trier par position
    const sortedQuestions = [...questions].sort((a, b) => a.qpos - b.qpos);

    return (
      <div className="space-y-4">
        {sortedQuestions.map((q) => {
          const disabled = isLocked && q.role !== "lock";

          return (
            <QuestionField
              key={q.id}
              def={{
                id: q.id,
                label: q.label,
                type: q.type,
                options: q.options.map((o) => o.label),
                tooltip: q.tooltip
              }}
              value={answers[q.id]}
              onChange={setAnswer}
              disabled={disabled}
            />
          );
        })}
      </div>
    );
  }, [questions, answers, isLocked, setAnswer]);

  return content;
});

// Utilitaires spécifiques au formulaire Dépendance
function isADLQuestion(q: BaseQuestion): boolean {
  // Vérifier si la question concerne ADL (autonomie pour les activités de base)
  return q.label.toLowerCase().includes("autonomie pour");
}

function isIADLQuestion(q: BaseQuestion): boolean {
  // Questions IADL : difficultés pour utiliser téléphone, faire courses, etc.
  const iadlKeywords = [
    "utiliser un téléphone", "faire les courses", "préparer des repas",
    "faire le ménage", "faire la lessive", "utiliser les transports",
    "prendre de médicaments", "gérer des finances", "téléphone", "courses",
    "repas", "ménage", "lessive", "transport", "médicament", "finance"
  ];

  const labelLower = q.label.toLowerCase();
  return iadlKeywords.some(keyword => labelLower.includes(keyword));
}

function shouldAddToReport(q: BaseQuestion, selectedValue: string): boolean {
  // TriggerReportOn explicite
  if (q.triggerOnReport.includes("*")) return true;
  if (q.triggerOnReport.some((t) => norm(t) === norm(selectedValue))) return true;

  // Cas spécial ADL
  if (isADLQuestion(q)) {
    const lab = norm(selectedValue);
    return ["aide partielle", "dependant", "dépendant"].includes(lab);
  }

  return false;
}