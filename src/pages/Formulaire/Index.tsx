import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QUESTIONS, FORM_CATEGORIES, FRAGILITE_SUBTABS } from "@/data/questions";
import { QuestionField } from "@/components/QuestionField";
import { useLocalAnswers } from "@/hooks/useLocalAnswers";

import AideEnPlaceCsv, {
  AideEnPlaceHandle,
} from "./AideEnPlaceCsv";

import IsolementCsv, {
  IsolementHandle,
  IsolementSummary,
} from "./IsolementCsv";

type Row = { question: string; answer: string };

const AIDE_TAB = "Aide en place et fréquence";
const ISOLEMENT_TAB = "Isolement";

/** Media query hook : true si la MQ est satisfaite */
function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatch(e.matches);
    setMatch(m.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);
  return match;
}

/** Helper: détecte la réponse "Non" (sans casse ni accents) */
function isNoAnswer(val: unknown) {
  if (typeof val !== "string") return false;
  const norm = val
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return norm === "non";
}

export default function FormulaireIndex() {
  const [activeCategory, setActiveCategory] = useState<string>("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>(FRAGILITE_SUBTABS[0]);

  // Réponses "classiques" (hors sous-onglets CSV)
  const [answers, setAnswer, clearAnswers] = useLocalAnswers();

  // Résultats overlays
  const [resultsTable, setResultsTable] = useState<{ freq: Row[]; other: Row[] } | null>(null);
  const [resultsIso, setResultsIso] = useState<IsolementSummary | null>(null);

  // Refs
  const formPaneRef = useRef<HTMLElement | null>(null);
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const isoRef = useRef<IsolementHandle | null>(null);

  // Etats de navigation
  const isFragilite = activeCategory === "Fragilité";
  const isAideCsv = isFragilite && activeFragTab === AIDE_TAB;
  const isIsoCsv = isFragilite && activeFragTab === ISOLEMENT_TAB;

  // Responsive: on ne monte qu'une seule vue (mobile OU desktop)
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Questions "classiques" (si ce n'est PAS un sous-onglet CSV)
  const currentQuestions = useMemo(() => {
    if (isAideCsv || isIsoCsv) return []; // délégué aux composants CSV
    if (isFragilite) {
      const bySub = (QUESTIONS["Fragilité"] as Record<string, any[]>) || {};
      return bySub[activeFragTab] || [];
    }
    return (QUESTIONS[activeCategory] as any[]) || [];
  }, [activeCategory, activeFragTab, isFragilite, isAideCsv, isIsoCsv]);

  function handleSubmit() {
    // Cas Isolement (CSV → score + rapport)
    if (isIsoCsv) {
      const sum = isoRef.current?.buildSummary();
      if (sum) {
        setResultsIso(sum);
        return;
      }
    }

    // Cas Aide en place (CSV → 2 tableaux freq/other)
    if (isAideCsv) {
      const sum: { freq: Row[]; other: Row[] } | undefined =
        (aideRef.current as any)?.buildSummary?.();
      if (sum) {
        setResultsTable({ freq: sum.freq, other: sum.other });
        return;
      }
    }

    // Autres sections (tableaux freq/other + filtre "Non")
    const defs = currentQuestions as Array<{ id: string; label: string; freq?: boolean }>;
    const freq: Row[] = [];
    const other: Row[] = [];

    defs.forEach((d) => {
      const val = (answers as any)[d.id];
      const hasValue = Array.isArray(val) ? val.length > 0 : String(val ?? "").trim() !== "";
      if (!hasValue) return;
      if (isNoAnswer(val)) return;

      const display =
        Array.isArray(val) ? val.join(", ") : typeof val === "string" ? val : String(val);
      const row = { question: d.label, answer: display };

      if (d.freq) freq.push(row);
      else other.push(row);
    });

    setResultsTable({ freq, other });
  }

  function handleConfirmAndClear() {
    clearAnswers();
    aideRef.current?.clearLocal?.();
    isoRef.current?.clearLocal?.();
    setResultsTable(null);
    setResultsIso(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {isMdUp ? (
        // ======== TABLETTE / DESKTOP (>= md) — rendu unique ========
        <div
          className={
            isFragilite
              ? "grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)]"
              : "grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]"
          }
        >
          {/* Colonne 1 : catégories */}
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

          {/* Colonne 2 : sous-onglets Fragilité */}
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

          {/* Colonne 3 : contenu */}
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

              {/* Contenu */}
              {isAideCsv ? (
                <AideEnPlaceCsv ref={aideRef} />
              ) : isIsoCsv ? (
                <IsolementCsv ref={isoRef} />
              ) : currentQuestions.length > 0 ? (
                <div className="space-y-4 lg:space-y-5">
                  {currentQuestions.map((q: any) => (
                    <QuestionField
                      key={q.id}
                      def={q}
                      value={(answers as any)[q.id]}
                      onChange={setAnswer}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune question pour cette section.</p>
              )}
            </motion.div>

            {/* Espace anti-recouvrement pour la barre fixe */}
            <div aria-hidden className="h-24 md:h-16"></div>

            {/* Bouton fixed aligné au bord gauche de la colonne */}
            <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
          </section>
        </div>
      ) : (
        // ======== MOBILE (< md) — rendu unique ========
        <>
          {/* Pills horizontaux */}
          <div className="space-y-2">
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

          {/* Contenu */}
          <section ref={formPaneRef} className="mt-3">
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

              {isAideCsv ? (
                <AideEnPlaceCsv ref={aideRef} />
              ) : isIsoCsv ? (
                <IsolementCsv ref={isoRef} />
              ) : currentQuestions.length > 0 ? (
                <div className="space-y-4">
                  {currentQuestions.map((q: any) => (
                    <QuestionField
                      key={q.id}
                      def={q}
                      value={(answers as any)[q.id]}
                      onChange={setAnswer}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune question pour cette section.</p>
              )}
            </motion.div>

            {/* Espace anti-recouvrement pour la barre fixe (mobile) */}
            <div aria-hidden className="h-24 md:h-16"></div>

            {/* Bouton fixed plein écran (marges 16px) sur mobile */}
            <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
          </section>
        </>
      )}

      {/* OVERLAY — Aide en place (tableaux) */}
      {resultsTable && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">
                Récapitulatif — {isFragilite ? `Fragilité / ${activeFragTab}` : activeCategory}
              </h3>
              <p className="text-xs text-gray-500">Les réponses sont classées en deux tableaux.</p>
            </div>

            <div className="p-4 grid gap-4 sm:grid-cols-2">
              {resultsTable.freq.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Avec fréquences</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 w-2/3">Question</th>
                          <th className="text-left p-2">Réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsTable.freq.map((r, i) => (
                          <tr key={`f-${i}`} className="border-t">
                            <td className="p-2">{r.question}</td>
                            <td className="p-2">{r.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {resultsTable.other.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Sans fréquences</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 w-2/3">Question</th>
                          <th className="text-left p-2">Réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultsTable.other.map((r, i) => (
                          <tr key={`o-${i}`} className="border-t">
                            <td className="p-2">{r.question}</td>
                            <td className="p-2">{r.answer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {resultsTable.freq.length === 0 && resultsTable.other.length === 0 && (
                <div className="sm:col-span-2 text-sm text-gray-500">Aucune réponse à afficher.</div>
              )}
            </div>

            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setResultsTable(null)}
              >
                Fermer
              </button>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
                onClick={handleConfirmAndClear}
              >
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY — Isolement (barre 0..100 + rapport 2 colonnes) */}
      {resultsIso && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Synthèse — Fragilité / Isolement</h3>
              <p className="text-xs text-gray-500">Score agrégé et rapport de prise en charge.</p>
            </div>

            <div className="p-4 space-y-6">
              {/* "Histogramme" horizontal 0..100 (axe x) avec label "Isolement" */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">Isolement</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, resultsIso.score))}%`,
                        backgroundColor:
                          resultsIso.color === "green"
                              ? "#16a34a"
                              : resultsIso.color === "orange"
                              ? "#f59e0b"
                              : resultsIso.color === "red"
                              ? "#dc2626"
                              : "#9ca3af", /* "grey" */
                      }}
                    />
                  </div>
                  <div className="w-10 text-sm">{resultsIso.score}</div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              {/* Rapport 2 colonnes */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
                  {resultsIso.report.reperage.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsIso.report.reperage.map((it, i) => (
                        <li key={`rep-${i}`}>{it}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Aucun élément.</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
                  {resultsIso.report.proposition.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsIso.report.proposition.map((it, i) => (
                        <li key={`prop-${i}`}>{it}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Aucune proposition.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => setResultsIso(null)}
              >
                Fermer
              </button>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
                onClick={handleConfirmAndClear}
              >
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
