import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QUESTIONS, FORM_CATEGORIES, FRAGILITE_SUBTABS } from "@/data/questions";
import { QuestionField } from "@/components/QuestionField";
import { useLocalAnswers } from "@/hooks/useLocalAnswers";

export default function FormulaireIndex() {
  const [activeCategory, setActiveCategory] = useState<string>("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>(FRAGILITE_SUBTABS[0]);
  const [answers, setAnswer, clearAnswers] = useLocalAnswers();
  const formPaneRef = useRef<HTMLElement | null>(null);

  const isFragilite = activeCategory === "Fragilité";

  const currentQuestions = useMemo(() => {
    if (isFragilite) {
      const bySub = (QUESTIONS["Fragilité"] as Record<string, any[]>) || {};
      return bySub[activeFragTab] || [];
    }
    return (QUESTIONS[activeCategory] as any[]) || [];
  }, [activeCategory, activeFragTab, isFragilite]);

  function handleSubmit() {
    const nonEmpty = Object.entries(answers).filter(([_, v]) =>
      Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== ""
    );
    alert(`Formulaire soumis (${nonEmpty.length} réponses).`);
    clearAnswers();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Mobile/Tablet < md : pills horizontaux */}
      <div className="md:hidden space-y-2">
        <VerticalTabs
          title="Sections"
          items={FORM_CATEGORIES}
          active={activeCategory}
          onSelect={(v) => {
            setActiveCategory(v);
            if (v === "Fragilité") setActiveFragTab(FRAGILITE_SUBTABS[0]);
          }}
        />
        {isFragilite && (
          <VerticalTabs
            title="Fragilité — catégories"
            items={FRAGILITE_SUBTABS}
            active={activeFragTab}
            onSelect={setActiveFragTab}
          />
        )}
      </div>

      {/* ≥ md : grille adaptative */}
      <div
        className={
          isFragilite
            ? "hidden md:grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)]"
            : "hidden md:grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]"
        }
      >
        <aside>
          <VerticalTabs
            items={FORM_CATEGORIES}
            active={activeCategory}
            onSelect={(v) => {
              setActiveCategory(v);
              if (v === "Fragilité") setActiveFragTab(FRAGILITE_SUBTABS[0]);
            }}
            title="Sections"
          />
        </aside>

        {isFragilite && (
          <aside>
            <VerticalTabs
              items={FRAGILITE_SUBTABS}
              active={activeFragTab}
              onSelect={setActiveFragTab}
              title="Fragilité — catégories"
            />
          </aside>
        )}

        <section ref={formPaneRef}>
          <motion.div
            key={isFragilite ? `${activeCategory}/${activeFragTab}` : activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border p-4 lg:p-6 shadow-sm"
          >
            <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">
              {isFragilite ? `Fragilité / ${activeFragTab}` : activeCategory}
            </h2>

            {currentQuestions.length > 0 ? (
              <div className="space-y-4 lg:space-y-5">
                {currentQuestions.map((q: any) => (
                  <QuestionField
                    key={q.id}
                    def={q}
                    value={answers[q.id]}
                    onChange={setAnswer}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune question pour cette section.</p>
            )}
          </motion.div>

          <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
        </section>
      </div>

      {/* < md : 1 colonne */}
      <section ref={formPaneRef} className="md:hidden mt-3">
        <motion.div
          key={isFragilite ? `${activeCategory}/${activeFragTab}` : activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border p-4 shadow-sm"
        >
          <h2 className="text-base md:text-xl font-semibold mb-3">
            {isFragilite ? `Fragilité / ${activeFragTab}` : activeCategory}
          </h2>

          {currentQuestions.length > 0 ? (
            <div className="space-y-4">
              {currentQuestions.map((q: any) => (
                <QuestionField
                  key={q.id}
                  def={q}
                  value={answers[q.id]}
                  onChange={setAnswer}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune question pour cette section.</p>
          )}
        </motion.div>

        <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
      </section>
    </div>
  );
}
