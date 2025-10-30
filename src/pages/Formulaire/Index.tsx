import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QuestionField } from "@/components/QuestionField";

import AideEnPlaceCsv, { AideEnPlaceHandle, SummaryRow } from "./AideEnPlaceCsv";
import IsolementCsv, { IsolementHandle, IsolementSummary } from "./IsolementCsv";
import DependanceCsv, { DependanceHandle, DependanceSummary } from "./DependanceCsv";

import { FORM_CATEGORIES, FRAGILITE_SUBTABS, QUESTIONS } from "@/data/questions";

// ---- Hook media query ----
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

// ---- Vérifie si un asset CSV existe (et non vide)
function useCsvPresence() {
  const [has, setHas] = useState<{ [k: string]: boolean }>({});

  useEffect(() => {
    const paths = {
      aide: "/aide_en_place.csv",
      iso: "/isolement.csv",
      dep: "/dependance.csv",
    };

    async function check(url: string) {
      try {
        const r = await fetch(url, { method: "GET", cache: "no-store" });
        if (!r.ok) return false;
        const txt = await r.text();
        return txt.trim().length > 0;
      } catch {
        return false;
      }
    }

    (async () => {
      const [a, i, d] = await Promise.all([check(paths.aide), check(paths.iso), check(paths.dep)]);
      setHas({ aide: a, iso: i, dep: d });
    })();
  }, []);

  return has;
}

// ---- Fallback generic form (pour QUESTIONS.*)
type FallbackQuestion = { id: string; label: string; type: "text" | "textarea" | "radio" | "checkbox"; options?: string[] };
type FallbackHandle = {
  buildSummary: () => { question: string; answer: string }[];
  clearLocal: () => void;
};

const FallbackForm = forwardRef<FallbackHandle, { storageKey: string; questions: FallbackQuestion[] }>(
  ({ storageKey, questions }, ref) => {
    const [answers, setAnswers] = useState<Record<string, any>>(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    });

    const setAnswer = (id: string, value: any) => {
      setAnswers((prev) => {
        const next = { ...prev, [id]: value };
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    };

    const buildSummary = () => {
      const rows: { question: string; answer: string }[] = [];
      questions.forEach((q) => {
        const v = answers[q.id];
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
        rows.push({ question: q.label, answer: Array.isArray(v) ? v.join(", ") : String(v) });
      });
      return rows;
    };

    const clearLocal = () => {
      localStorage.removeItem(storageKey);
      setAnswers({});
    };

    useImperativeHandle(ref, () => ({ buildSummary, clearLocal }), [answers, questions]);

    if (!questions.length) {
      return <p className="text-gray-500 text-sm">Aucune question à afficher.</p>;
    }

    return (
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            def={{ id: q.id, label: q.label, type: q.type, options: q.options }}
            value={answers[q.id]}
            onChange={setAnswer}
          />
        ))}
      </div>
    );
  }
);

// ---- Page principale
export default function FormulaireIndex() {
  // Navigation
  const [activeCategory, setActiveCategory] = useState<string>(FORM_CATEGORIES[0] || "Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>(FRAGILITE_SUBTABS[0]);

  const isFragilite = activeCategory === "Fragilité";
  const isAide = isFragilite && activeFragTab === "Aide en place et fréquence";
  const isIso = isFragilite && activeFragTab === "Isolement";
  const isDep = isFragilite && activeFragTab === "Dépendance";

  // Responsive
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Présence des CSV
  const csvHas = useCsvPresence();

  // Refs
  const formPaneRef = useRef<HTMLElement>(null!);
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const isoRef = useRef<IsolementHandle | null>(null);
  const depRef = useRef<DependanceHandle | null>(null);
  const fallbackRef = useRef<FallbackHandle | null>(null);

  // Résultats overlays
  const [resultsTable, setResultsTable] = useState<{ freq: SummaryRow[]; other: SummaryRow[] } | null>(null);
  const [resultsIso, setResultsIso] = useState<IsolementSummary | null>(null);
  const [resultsDep, setResultsDep] = useState<DependanceSummary | null>(null);
  const [resultsFallback, setResultsFallback] = useState<{ rows: { question: string; answer: string }[]; title: string } | null>(null);

  // Questions fallback actuelles selon l’onglet
  const fallbackQuestions: FallbackQuestion[] = useMemo(() => {
    if (isFragilite) {
      const arr = (QUESTIONS.Fragilité && QUESTIONS.Fragilité[activeFragTab]) || [];
      return Array.isArray(arr) ? arr : [];
    }
    const arr = QUESTIONS[activeCategory] || [];
    return Array.isArray(arr) ? arr : [];
  }, [activeCategory, activeFragTab, isFragilite]);

  const showCsvForCurrent = useMemo(() => {
    // Afficher le CSV si présent ET si on est sur l’un des trois onglets dédiés
    if (isAide) return !!csvHas.aide;
    if (isIso) return !!csvHas.iso;
    if (isDep) return !!csvHas.dep;
    return false; // les autres sous-onglets n'ont pas de CSV
  }, [isAide, isIso, isDep, csvHas]);

  // Submit
  function handleSubmit() {
    if (showCsvForCurrent) {
      if (isDep) {
        const sum = depRef.current?.buildSummary();
        if (sum) { setResultsDep(sum); return; }
      }
      if (isIso) {
        const sum = isoRef.current?.buildSummary();
        if (sum) { setResultsIso(sum); return; }
      }
      if (isAide) {
        const sum = aideRef.current?.buildSummary();
        if (sum) { setResultsTable(sum); return; }
      }
    }

    // Fallback
    const rows = fallbackRef.current?.buildSummary() || [];
    const title = isFragilite ? activeFragTab : activeCategory;
    setResultsFallback({ rows, title });
  }

  function handleConfirmAndClearAll() {
    aideRef.current?.clearLocal?.();
    isoRef.current?.clearLocal?.();
    depRef.current?.clearLocal?.();
    fallbackRef.current?.clearLocal?.();
    setResultsTable(null);
    setResultsIso(null);
    setResultsDep(null);
    setResultsFallback(null);
  }

  // Rendu du contenu de la 3e colonne (form)
  const renderFormContent = () => {
    // Titre : sans "Fragilité /"
    const title = isFragilite ? activeFragTab : activeCategory;

    return (
      <motion.div
        key={`${activeCategory}/${activeFragTab}/${showCsvForCurrent ? "csv" : "fallback"}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border p-4 lg:p-6 shadow-sm"
      >
        <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">{title}</h2>

        {showCsvForCurrent ? (
          isAide ? (
            <AideEnPlaceCsv ref={aideRef} />
          ) : isIso ? (
            <IsolementCsv ref={isoRef} />
          ) : isDep ? (
            <DependanceCsv ref={depRef} />
          ) : null
        ) : (
          <FallbackForm
            ref={fallbackRef}
            storageKey={`fallback.${isFragilite ? `frag.${activeFragTab}` : activeCategory}`}
            questions={fallbackQuestions}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {isMdUp ? (
        <div className="grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)]">
          {/* Colonne 1 : Sections */}
          <aside>
            <VerticalTabs
              items={[...FORM_CATEGORIES]}
              active={activeCategory}
              onSelect={(v) => {
                setActiveCategory(v);
                if (v === "Fragilité") setActiveFragTab(FRAGILITE_SUBTABS[0]);
              }}
              title="Sections"
            />
          </aside>

          {/* Colonne 2 : Sous-onglets Fragilité */}
          <aside>
            {isFragilite ? (
              <VerticalTabs
                items={[...FRAGILITE_SUBTABS]}
                active={activeFragTab}
                onSelect={setActiveFragTab}
                title="Fragilité — catégories"
              />
            ) : (
              <div className="text-sm text-gray-500 px-1 pt-1">—</div>
            )}
          </aside>

          {/* Colonne 3 : Contenu */}
          <section ref={formPaneRef}>
            {renderFormContent()}

            {/* Espace anti-recouvrement */}
            <div aria-hidden className="h-24 md:h-16"></div>

            {/* Bouton fixed */}
            <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
          </section>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <VerticalTabs
              title="Sections"
              items={[...FORM_CATEGORIES]}
              active={activeCategory}
              onSelect={(v) => {
                setActiveCategory(v);
                if (v === "Fragilité") setActiveFragTab(FRAGILITE_SUBTABS[0]);
              }}
            />
            {isFragilite && (
              <VerticalTabs
                title="Fragilité — catégories"
                items={[...FRAGILITE_SUBTABS]}
                active={activeFragTab}
                onSelect={setActiveFragTab}
              />
            )}
          </div>

          <section ref={formPaneRef} className="mt-3">
            {renderFormContent()}

            <div aria-hidden className="h-24 md:h-16"></div>
            <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
          </section>
        </>
      )}

      {/* OVERLAY — Aide (tableaux) */}
      {resultsTable && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Récapitulatif — {activeFragTab}</h3>
              <p className="text-xs text-gray-500">Synthèse de vos réponses.</p>
            </div>

            <div className="p-4">
              {(() => {
                const combined = [
                  ...resultsTable.freq.map((r) => ({ ...r, _freq: true })),
                  ...resultsTable.other.map((r) => ({ ...r, _freq: false })),
                ];

                if (combined.length === 0) {
                  return <p className="text-sm text-gray-500">Aucune réponse à afficher.</p>;
                }

                return (
                  <ul className="divide-y divide-gray-200">
                    {combined.map((item, idx) => (
                      <li key={idx} className="py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          {/* Question + tag éventuel */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-sm sm:text-base">{item.question}</span>
                            </div>
                          </div>

                          {/* Réponse en badge */}
                          <div className="shrink-0">
                            <span className="inline-block px-2.5 py-1 text-xs text-gray-800">
                              {item.answer}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
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
                onClick={handleConfirmAndClearAll}
              >
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY — Isolement */}
      {resultsIso && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Synthèse — Isolement</h3>
              <p className="text-xs text-gray-500">Score agrégé et rapport de prise en charge.</p>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">Isolement</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, resultsIso.score))}%`,
                        backgroundColor:
                          resultsIso.color === "green" ? "#16a34a"
                            : resultsIso.color === "orange" ? "#f59e0b"
                            : resultsIso.color === "red" ? "#dc2626"
                            : "#9ca3af",
                      }}
                    />
                  </div>
                  <div className="w-10 text-sm">{resultsIso.score}</div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
                  {resultsIso.report.reperage.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsIso.report.reperage.map((it, i) => <li key={`rep-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucun élément.</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
                  {resultsIso.report.proposition.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsIso.report.proposition.map((it, i) => <li key={`prop-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucune proposition.</p>}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsIso(null)}>
                Fermer
              </button>
              <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={handleConfirmAndClearAll}>
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY — Dépendance */}
      {resultsDep && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Synthèse — Dépendance</h3>
              <p className="text-xs text-gray-500">Scores ADL / IADL et rapport.</p>
            </div>
            <div className="p-4 space-y-6">
              {[
                { label: "ADL", score: resultsDep.adlScore, max: resultsDep.adlMax },
                { label: "IADL", score: resultsDep.iadlScore, max: resultsDep.iadlMax },
              ].map(({ label, score, max }) => {
                const pct = Math.round((Math.max(0, Math.min(max, score)) / max) * 100);
                return (
                  <div key={label}>
                    <div className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-600">{label}</div>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: "#111827" }} />
                      </div>
                      <div className="w-16 text-sm text-right">{score} / {max}</div>
                    </div>
                  </div>
                );
              })}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
                  {resultsDep.report.reperage.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsDep.report.reperage.map((it, i) => <li key={`r-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucun élément.</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
                  {resultsDep.report.proposition.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsDep.report.proposition.map((it, i) => <li key={`p-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucune proposition.</p>}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsDep(null)}>
                Fermer
              </button>
              <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={handleConfirmAndClearAll}>
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY — Fallback générique */}
      {resultsFallback && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Récapitulatif — {resultsFallback.title}</h3>
              <p className="text-xs text-gray-500">Synthèse des réponses (fallback).</p>
            </div>
            <div className="p-4">
              {resultsFallback.rows.length ? (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 w-2/3">Question</th>
                        <th className="text-left p-2">Réponse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsFallback.rows.map((r, i) => (
                        <tr key={`fb-${i}`} className="border-t">
                          <td className="p-2">{r.question}</td>
                          <td className="p-2">{r.answer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune réponse.</p>
              )}
            </div>
            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsFallback(null)}>
                Fermer
              </button>
              <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={handleConfirmAndClearAll}>
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
