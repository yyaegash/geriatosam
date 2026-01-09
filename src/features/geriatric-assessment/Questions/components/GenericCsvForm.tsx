/**
 * Composant générique pour les formulaires CSV
 */

import React, { useImperativeHandle, useMemo } from "react";
import { QuestionField } from "@/components/QuestionField";
import { useCsvForm, useFormLock, useFormReport } from "../shared/hooks";
import { GenericSummary } from "../shared/types";
import type { FormConfig } from "@/data/forms.config";
import { calculateQualityColor, norm } from "../shared/utils";

export type GenericCsvFormHandle = {
  buildSummary: () => GenericSummary;
  clearLocal: () => void;
};

type Props = {
  config: FormConfig;
  mode?: "generic" | "isolement";
};

export default React.forwardRef<GenericCsvFormHandle, Props>(function GenericCsvForm(
  { config, mode = "generic" },
  ref
) {
  const { questions, answers, isLoading, setAnswer, clearLocal } = useCsvForm(config);

  const isLocked = useFormLock(questions, answers);
  const report = useFormReport(questions, answers, isLocked);

  // Calcul de la couleur
  const color = useMemo(() => {
    return calculateQualityColor(questions, answers);
  }, [questions, answers]);

  // Construction du résumé
  const buildSummary = (): GenericSummary => {
    let totalScore = 0;

    const relevantQuestions = isLocked
      ? questions.filter(q => q.role === "lock")
      : questions;

    relevantQuestions.forEach((q) => {
      const value = answers[q.id];
      if (!value) return;

      // Addition des scores si présents
      const option = q.options.find((o) => norm(o.label) === norm(value));
      if (option?.score) {
        totalScore += Number(option.score);
      }
    });

    const score = Math.max(0, Math.min(100, Math.round(totalScore)));

    return {
      kind: "generic",
      score,
      color,
      report
    };
  };

  useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [
    questions,
    answers,
    isLocked,
    color,
    report
  ]);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;
    }

    return (
      <div className="space-y-4">
        {questions.map((q) => {
          const disabled = isLocked && q.role !== "lock";

          return (
            <div
              key={q.id}
              className={disabled ? "opacity-50 pointer-events-none select-none" : ""}
              aria-disabled={disabled}
            >
              <QuestionField
                def={{
                  id: q.id,
                  label: q.label,
                  type: q.type,
                  options: q.options.map((o) => o.label),
                  tooltip: q.tooltip
                }}
                value={answers[q.id]}
                onChange={setAnswer}
              />
            </div>
          );
        })}
      </div>
    );
  }, [questions, answers, isLocked, setAnswer]);

  return content;
});