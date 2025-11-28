import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QuestionField } from "@/components/QuestionField";
import { CSV_VULNERABILITY_FORMS } from "./GeriatricAssessment/Vulnerability";

import AideEnPlaceCsv, { AideEnPlaceHandle, SummaryRow } from "./AideEnPlaceCsv";
import DependanceCsv, { DependanceHandle, DependanceSummary } from "./DependanceCsv";

import GenericCsvForm, {
  GenericCsvFormHandle,
  GenericSummary,
} from "./GenericCsvForm";

import { FORM_CATEGORIES, QUESTIONS } from "@/data/questions";

import { buildGeriatriePdfPayload } from "./buildGeriatriePdfPayload";
import { generateGeriatriePdf, reconstructGenericFromCsv } from "./exportGeriatricPdf";

type CsvFormEntry = typeof CSV_VULNERABILITY_FORMS[number];
type ComponentKind = CsvFormEntry["component"];

/* ============================================================
   2) Utilities (media query + check CSV presence)
   ============================================================ */

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

// Vérifie la présence/vides de tous les CSV déclarés
function useCsvPresence(config: CsvFormEntry[]) {
  const [has, setHas] = useState<Record<string, boolean>>({});

  useEffect(() => {
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
      const entries = await Promise.all(
        config.map(async (c) => [c.key, await check(c.path)] as const)
      );
      const map: Record<string, boolean> = {};
      for (const [k, ok] of entries) map[k] = ok;
      setHas(map);
    })();
  }, [config]);

  return has;
}

/* ============================================================
   3) Fallback générique (QUESTIONS.ts) pour tout onglet sans CSV
   ============================================================ */

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

/* ============================================================
   4) Page principale
   ============================================================ */

export default function FormulaireIndex() {
  // Sous-onglets Fragilité dynamiques : d’abord les CSV (ordre défini ci-dessus), puis le reste de QUESTIONS.Fragilité
  const dynamicFragSubtabs = useMemo(() => {
    const csvLabels = CSV_VULNERABILITY_FORMS.map((c) => c.label);
    const extras = Object.keys(QUESTIONS.Fragilité || {}).filter((l) => !csvLabels.includes(l));
    return [...csvLabels, ...extras];
  }, []);

  // Navigation
  const [activeCategory, setActiveCategory] = useState<string>("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>(dynamicFragSubtabs[0]);

  const isFragilite = activeCategory === "Fragilité";
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Quel formulaire CSV correspond à l’onglet courant ?
  const currentCsvForm = useMemo<CsvFormEntry | undefined>(
    () => CSV_VULNERABILITY_FORMS.find((c) => isFragilite && c.label === activeFragTab),
    [isFragilite, activeFragTab]
  );

  // Présence CSV
  const csvHas = useCsvPresence(CSV_VULNERABILITY_FORMS);

  // Refs (composants)
  const formPaneRef = useRef<HTMLElement>(null!);
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const depRef = useRef<DependanceHandle | null>(null);
  const genericRef = useRef<GenericCsvFormHandle | null>(null);

  // Overlays (résultats)
  const [resultsAide, setResultsAide] = useState<{ freq: SummaryRow[]; other: SummaryRow[] } | null>(null);
  const [resultsDep, setResultsDep] = useState<DependanceSummary | null>(null);
  const [resultsGeneric, setResultsGeneric] = useState<GenericSummary | null>(null);

  // Questions fallback selon l’onglet
  const fallbackQuestions: FallbackQuestion[] = useMemo(() => {
    if (isFragilite) {
      const arr = (QUESTIONS.Fragilité && QUESTIONS.Fragilité[activeFragTab]) || [];
      return Array.isArray(arr) ? arr : [];
    }
    const arr = QUESTIONS[activeCategory] || [];
    return Array.isArray(arr) ? arr : [];
  }, [activeCategory, activeFragTab, isFragilite]);

  // Décide si on rend CSV (si déclaré ET présent) ou fallback
  const showCsvForCurrent = useMemo(() => {
    if (!currentCsvForm) return false;
    return !!csvHas[currentCsvForm.key];
  }, [currentCsvForm, csvHas]);

  // Submit (route dynamiquement vers le bon overlay)
  function handlePreview() {
    if (showCsvForCurrent && currentCsvForm) {
      switch (currentCsvForm.component as ComponentKind) {
        case "aide": {
          const sum = aideRef.current?.buildSummary();
          if (sum) { setResultsAide(sum); return; }
          break;
        }
        case "dep": {
          const sum = depRef.current?.buildSummary();
          if (sum) { setResultsDep(sum); return; }
          break;
        }
        case "generic-generic": {
          const sum = genericRef.current?.buildSummary();
          if (sum && sum.kind === "generic") { setResultsGeneric(sum); return; }
          break;
        }
      }
    }
  }

  async function handleValidateAll() {
    const payload = await buildGeriatriePdfPayload({
        aideRef,
        depRef,
        genericRef,
        currentCsvKey: currentCsvForm?.key,
      });

    console.log(
      "PDF PAYLOAD",
      payload.generics.map(g => ({
        label: g.label,
        reperage: g.summary.report.reperage,
        proposition: g.summary.report.proposition,
      }))
    );

    await generateGeriatriePdf(payload);
  }

  function handleConfirmAndClearAll() {
    aideRef.current?.clearLocal?.();
    depRef.current?.clearLocal?.();
    genericRef.current?.clearLocal?.();

    setResultsAide(null);
    setResultsDep(null);
    setResultsGeneric(null);
  }

  // Rendu du contenu (colonne formulaire)
  const renderFormContent = () => {
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

        {showCsvForCurrent && currentCsvForm ? (
          currentCsvForm.component === "aide" ? (
            <AideEnPlaceCsv ref={aideRef} />
          ) : currentCsvForm.component === "dep" ? (
            <DependanceCsv ref={depRef} csvPath={currentCsvForm.path} />
          ) : currentCsvForm.component === "generic-generic" ? (
            <GenericCsvForm
              ref={genericRef}
              csvPath={currentCsvForm.path}
              sectionName={currentCsvForm.label}
              storageKey={currentCsvForm.storageKey}
              mode="generic"
            />
          ) : null
        ) : (
          null
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
                if (v === "Fragilité") setActiveFragTab(dynamicFragSubtabs[0]);
              }}
              title="Sections"
            />
          </aside>

          {/* Colonne 2 : Sous-onglets Fragilité (dynamiques) */}
          <aside>
            {isFragilite ? (
              <VerticalTabs
                items={[...dynamicFragSubtabs]}
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
            <SubmitBar
               onSubmit={handlePreview}
               anchorRef={formPaneRef}
               onValidate={handleValidateAll}
               submitLabel="Preview"
               validateLabel="Valider"
             />
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
                if (v === "Fragilité") setActiveFragTab(dynamicFragSubtabs[0]);
              }}
            />
            {isFragilite && (
              <VerticalTabs
                title="Fragilité — catégories"
                items={[...dynamicFragSubtabs]}
                active={activeFragTab}
                onSelect={setActiveFragTab}
              />
            )}
          </div>

          <section ref={formPaneRef} className="mt-3">
            {renderFormContent()}

            <div aria-hidden className="h-24 md:h-16"></div>
            <SubmitBar
              onSubmit={handlePreview}
              anchorRef={formPaneRef}
              onValidate={handleValidateAll}
              submitLabel="Preview"
              validateLabel="Valider"
            />
          </section>
        </>
      )}

      {/* OVERLAY — Aide (listing lisible mobile) */}
      {resultsAide && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Récapitulatif — Aide en place et fréquence</h3>
              <p className="text-xs text-gray-500">Synthèse de vos réponses.</p>
            </div>

            <div className="p-4">
              {(() => {
                const combined = [
                  ...resultsAide.freq.map((r) => ({ ...r, _freq: true })),
                  ...resultsAide.other.map((r) => ({ ...r, _freq: false })),
                ];
                if (combined.length === 0) {
                  return <p className="text-sm text-gray-500">Aucune réponse à afficher.</p>;
                }
                return (
                  <ul className="divide-y divide-gray-200">
                    {combined.map((item, idx) => (
                      <li key={idx} className="py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-medium text-sm sm:text-base">{item.question}</span>
                          </div>
                          <div className="shrink-0">
                            <span className="inline-block px-2.5 py-1 text-xs text-gray-800">{item.answer}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>

            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsAide(null)}>
                Fermer
              </button>
              <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={handleConfirmAndClearAll}>
                Valider et effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {resultsDep && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Synthèse — Dépendance</h3>
              <p className="text-xs text-gray-500">Scores ADL / IADL et rapport.</p>
            </div>

            <div className="p-4 space-y-6">
              {/* Barres ADL / IADL */}
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

              {/* Rapport 2 colonnes */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
                  {resultsDep.report.reperage.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsDep.report.reperage.map((it, i) => <li key={`r-${i}`}>{it}</li>)}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Aucun élément.</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
                  {resultsDep.report.proposition.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsDep.report.proposition.map((it, i) => <li key={`p-${i}`}>{it}</li>)}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">Aucune proposition.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsDep(null)}>
                Fermer
              </button>
              <button
                className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
                onClick={() => { setResultsDep(null); /* si tu veux, efface aussi local: */ /* dependanceRef.current?.clearLocal(); */ }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY — Formulaires CSV (GenericCsvForm) */}
      {resultsGeneric && resultsGeneric.kind === "generic" && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Synthèse — {currentCsvForm?.label || "Formulaire"}</h3>
              <p className="text-xs text-gray-500">Score agrégé et rapport de prise en charge.</p>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{currentCsvForm?.label || "Score"}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, resultsGeneric.score))}%`,
                        backgroundColor:
                          resultsGeneric.color === "green" ? "#16a34a"
                            : resultsGeneric.color === "orange" ? "#f59e0b"
                            : resultsGeneric.color === "red" ? "#dc2626"
                            : "#9ca3af",
                      }}
                    />
                  </div>
                  <div className="w-10 text-sm">{resultsGeneric.score}</div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
                  {resultsGeneric.report.reperage.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsGeneric.report.reperage.map((it, i) => <li key={`rep-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucun élément.</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
                  {resultsGeneric.report.proposition.length ? (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {resultsGeneric.report.proposition.map((it, i) => <li key={`prop-${i}`}>{it}</li>)}
                    </ul>
                  ) : <p className="text-xs text-gray-500">Aucune proposition.</p>}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setResultsGeneric(null)}>
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
