import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { QuestionField } from "@/components/QuestionField";

import AideEnPlaceCsv, { AideEnPlaceHandle, SummaryRow } from "./AideEnPlaceCsv";
import DependanceCsv, { DependanceHandle, DependanceSummary } from "./DependanceCsv";

import GenericCsvForm, {
  GenericCsvFormHandle,
  GenericSummary,
} from "./GenericCsvForm";

import { FORM_CATEGORIES, QUESTIONS } from "@/data/questions";

/* ============================================================
   1) Déclaration DYNAMIQUE des formulaires CSV (ordre = ordre ici)
   - Pour ajouter un formulaire : ajoute une ligne ci-dessous.
   - component:
       "aide" -> AideEnPlaceCsv (overlay listing)
       "dep"  -> DependanceCsv  (overlay scores)
       "generic-isolement" -> GenericCsvForm en mode "isolement" (overlay isolement)
       "generic-generic"   -> GenericCsvForm en mode "generic"   (overlay générique Q/R)
   ============================================================ */

const CSV_FORMS = [
  {
    key: "aide",
    label: "Aide en place et fréquence",
    path: "/aide_en_place.csv",
    component: "aide" as const,
    storageKey: "geriatrie.form.aide.v1"
  },
  {
    key: "iso",
    label: "Isolement",
    path: "/isolement.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.isolement.v1"
  },
  {
    key: "dep",
    label: "Dépendance",
    path: "/dependance.csv",
    component: "dep" as const,
    storageKey: "geriatrie.form.dependance.v1"
  },
  {
    key: "poly",
    label: "Polypathologie",
    path: "/polypathologie.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.polypathologie.v1"
  },
  {
    key: "denut",
    label: "Dénutrition",
    path: "/denutrition.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.denutrition.v1"
  },
  {
    key: "habit",
    label: "Habitation inadaptée",
    path: "/habitation_inadaptee.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.habitation.v1"
  },
  {
    key: "polymed",
    label: "Polymédication et traitements à risque",
    path: "/polymedication.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.polymedication.v1"
  },
  {
    key: "psy",
    label: "Troubles psychiques",
    path: "/trouble_psy.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.psy.v1"
  },
  {
    key: "neuro",
    label: "Troubles neurosensoriels",
    path: "/trouble_neuro.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.neuro.v1"
  },
  {
    key: "neuroco",
    label: "Troubles neurocognitifs",
    path: "/trouble_neuroco.csv",
    component: "generic-isolement" as const,
    storageKey: "geriatrie.form.neuroco.v1"
  },

];

type CsvFormEntry = typeof CSV_FORMS[number];
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
    const csvLabels = CSV_FORMS.map((c) => c.label);
    const extras = Object.keys(QUESTIONS.Fragilité || {}).filter((l) => !csvLabels.includes(l));
    return [...csvLabels, ...extras];
  }, []);

  // Navigation
  const [activeCategory, setActiveCategory] = useState<string>(FORM_CATEGORIES[0] || "Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>(dynamicFragSubtabs[0]);

  const isFragilite = activeCategory === "Fragilité";
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // Quel formulaire CSV correspond à l’onglet courant ?
  const currentCsvForm = useMemo<CsvFormEntry | undefined>(
    () => CSV_FORMS.find((c) => isFragilite && c.label === activeFragTab),
    [isFragilite, activeFragTab]
  );

  // Présence CSV
  const csvHas = useCsvPresence(CSV_FORMS);

  // Refs (composants)
  const formPaneRef = useRef<HTMLElement>(null!);
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const depRef = useRef<DependanceHandle | null>(null);
  const genericRef = useRef<GenericCsvFormHandle | null>(null);
  const fallbackRef = useRef<FallbackHandle | null>(null);

  // Overlays (résultats)
  const [resultsAide, setResultsAide] = useState<{ freq: SummaryRow[]; other: SummaryRow[] } | null>(null);
  const [resultsDep, setResultsDep] = useState<DependanceSummary | null>(null);
  const [resultsIso, setResultsIso] = useState<GenericSummary | null>(null);     // kind: "isolement"
  const [resultsGeneric, setResultsGeneric] = useState<{ title: string; rows: { question: string; answer: string }[] } | null>(null);

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
  function handleSubmit() {
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
        case "generic-isolement": {
          const sum = genericRef.current?.buildSummary();
          if (sum && sum.kind === "isolement") { setResultsIso(sum); return; }
          if (sum && sum.kind === "generic") {
            setResultsGeneric({ title: currentCsvForm.label, rows: sum.rows });
            return;
          }
          break;
        }
      }
    }

    // Fallback (QUESTIONS.ts)
    const rows = fallbackRef.current?.buildSummary() || [];
    const title = isFragilite ? activeFragTab : activeCategory;
    setResultsGeneric({ title, rows });
  }

  function handleConfirmAndClearAll() {
    aideRef.current?.clearLocal?.();
    depRef.current?.clearLocal?.();
    genericRef.current?.clearLocal?.();
    fallbackRef.current?.clearLocal?.();

    setResultsAide(null);
    setResultsDep(null);
    setResultsIso(null);
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
          ) : currentCsvForm.component === "generic-isolement" ? (
            <GenericCsvForm
              ref={genericRef}
              csvPath={currentCsvForm.path}
              sectionName={currentCsvForm.label}
              storageKey={currentCsvForm.storageKey}
              mode="isolement"
            />
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
            <SubmitBar onSubmit={handleSubmit} anchorRef={formPaneRef} />
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

      {/* OVERLAY — Formulaires CSV (GenericCsvForm en mode isolement) */}
      {resultsIso && resultsIso.kind === "isolement" && (
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

      {/* OVERLAY — Générique (sert pour Polypathologie et fallback QUESTIONS.ts) */}
      {resultsGeneric && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">Récapitulatif — {resultsGeneric.title}</h3>
              <p className="text-xs text-gray-500">Synthèse des réponses.</p>
            </div>
            <div className="p-4">
              {resultsGeneric.rows.length ? (
                <ul className="divide-y divide-gray-200">
                  {resultsGeneric.rows.map((r, i) => (
                    <li key={`fb-${i}`} className="py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-sm sm:text-base">{r.question}</span>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-800">
                            {r.answer}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Aucune réponse.</p>
              )}
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
