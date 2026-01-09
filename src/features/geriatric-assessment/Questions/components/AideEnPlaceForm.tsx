/**
 * Composant spécialisé pour le formulaire Aide en Place
 */

import React, { useImperativeHandle, useMemo } from "react";
import { QuestionField } from "@/components/QuestionField";
import { useCsvForm, useFormLock } from "../shared/hooks";
import { AideEnPlaceSummary } from "../shared/types";
import { isNoAnswer } from "../shared/utils";
import { CSV_VULNERABILITY_FORMS } from "@/data/forms.config";

export type AideEnPlaceHandle = {
  buildSummary: () => AideEnPlaceSummary;
  clearLocal: () => void;
};

type Props = {
  csvPath?: string;
};

const AIDE_CONFIG = CSV_VULNERABILITY_FORMS.find(f => f.component === "aide")!;
const SECTION_NAME = AIDE_CONFIG.label;
const STORAGE_KEY = AIDE_CONFIG.storageKey;

export default React.forwardRef<AideEnPlaceHandle, Props>(function AideEnPlaceForm(
  { csvPath = "/aide_en_place.csv" },
  ref
) {
  const { questions, answers, isLoading, setAnswer, clearLocal } = useCsvForm({
    csvPath,
    storageKey: STORAGE_KEY,
    sectionName: SECTION_NAME
  });

  const isLocked = useFormLock(questions, answers);

  // Construction du résumé spécialisé
  const buildSummary = (): AideEnPlaceSummary => {
    const freq: Array<{ question: string; answer: string }> = [];
    const other: Array<{ question: string; answer: string }> = [];

    questions.forEach((q) => {
      const val = answers[q.id];
      if (!val || isNoAnswer(val)) return;

      const row = { question: q.label, answer: String(val) };

      if (q.role === "freq") {
        freq.push(row);
      } else if (q.role !== "lock") {
        // On n'affiche pas la question de lock dans le résumé
        other.push(row);
      }
    });

    return {
      kind: "aide-en-place",
      freq,
      other
    };
  };

  useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [questions, answers]);

  const content = useMemo(() => {
    if (isLoading) {
      return <p className="text-gray-500 text-sm">Chargement du formulaire…</p>;
    }

    return (
      <div className="space-y-4">
        {questions.map((q) => {
          const isLockQuestion = q.role === "lock";
          const disabled = isLocked && !isLockQuestion;

          return (
            <div
              key={q.id}
              className={disabled ? "opacity-50 pointer-events-none" : ""}
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
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    );
  }, [questions, answers, isLocked, setAnswer]);

  return content;
});