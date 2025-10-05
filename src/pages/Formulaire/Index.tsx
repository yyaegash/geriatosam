import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QUESTIONS, FORM_CATEGORIES, FRAGILITE_SUBTABS } from "@/data/questions";
import { QuestionField } from "@/components/QuestionField";
import { useLocalAnswers } from "@/hooks/useLocalAnswers";

export default function FormulaireIndex() {
  const formPaneRef = useRef<HTMLElement>(null);
  // Onglet principal (Fragilité en premier par défaut)
  const [activeCategory, setActiveCategory] = useState<string>("Fragilité");
  // Sous-onglet Fragilité (uniquement quand activeCategory === "Fragilité")
  const [activeFragTab, setActiveFragTab] = useState<string>(FRAGILITE_SUBTABS[0]);

  // Persistance locale
  const [answers, setAnswer, clearAnswers] = useLocalAnswers();

  const isFragilite = activeCategory === "Fragilité";

  // Questions affichées en fonction de l’onglet actif
  const currentQuestions = useMemo(() => {
    if (isFragilite) {
      const bySub = (QUESTIONS["Fragilité"] as Record<string, any[]>) || {};
      return bySub[activeFragTab] || [];
    }
    // catégories classiques (tableau de questions)
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
    <div
      className={
        isFragilite
          ? "mx-auto max-w-7xl px-4 py-8 grid gap-6 grid-cols-[240px_260px_minmax(0,1fr)]"
          : "mx-auto max-w-7xl px-4 py-8 grid gap-6 grid-cols-[240px_minmax(0,1fr)]"
      }
    >
      {/* Colonne 1 : catégories principales */}
      <aside>
        <VerticalTabs
          items={FORM_CATEGORIES}
          active={activeCategory}
          onSelect={(v) => {
            setActiveCategory(v);
            if (v === "Fragilité") setActiveFragTab(FRAGILITE_SUBTABS[0]);
          }}
        />
      </aside>

      {/* Colonne 2 : sous-onglets de Fragilité */}
      {isFragilite && (
        <aside>
          <VerticalTabs
            items={FRAGILITE_SUBTABS}
            active={activeFragTab}
            onSelect={setActiveFragTab}
          />
        </aside>
      )}

      {/* Colonne 3 : questions */}
      <section ref={formPaneRef}>
        <motion.div
          key={isFragilite ? `${activeCategory}/${activeFragTab}` : activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold mb-4">
            {isFragilite ? `Fragilité / ${activeFragTab}` : activeCategory}
          </h2>

          {currentQuestions.length > 0 ? (
            <div className="space-y-5">
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

        <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef}/>
      </section>
    </div>
  );
}
