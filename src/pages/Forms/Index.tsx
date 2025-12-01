import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SubmitBar } from "@/components/SubmitBar";
import { VerticalTabs } from "@/components/VerticalTabs";
import { FORM_CATEGORIES } from "@/data/questions";

import { CSV_VULNERABILITY_FORMS } from "./GeriatricAssessment/Vulnerability";

import AideEnPlaceCsv, { AideEnPlaceHandle, SummaryRow } from "./Questions/AideEnPlaceCsv";
import DependenceCsv, { DependenceHandle, DependenceSummary } from "./Questions/DependenceCsv";
import GenericCsvForm, { GenericCsvFormHandle, GenericSummary } from "./Questions/GenericCsvForm";

import HelpOverlay from "./Results/HelpOverlay";
import DepOverlay from "./Results/DepOverlay";
import GenericCsvOverlay from "./Results/GenericOverlay";

import { BuildGeriatriePdfPayload } from "@/lib/pdf/BuildGeriatriePdfPayload";
import { generateGeriatriePdf } from "@/lib/pdf/ExportGeriatricPdf";

type CsvFormEntry = typeof CSV_VULNERABILITY_FORMS[number];
type ComponentKind = CsvFormEntry["component"];

/* ===================== MEDIA QUERY ===================== */

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useMemo(() => {
    const m = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatch(e.matches);
    setMatch(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, [query]);
  return match;
}

/* ===================== PAGE PRINCIPALE ===================== */

export default function FormulaireIndex() {
  const dynamicFragSubtabs = useMemo(
    () => CSV_VULNERABILITY_FORMS.map((c) => c.label),
    []
  );

  const [activeCategory, setActiveCategory] = useState("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState(dynamicFragSubtabs[0]);

  const isFragilite = activeCategory === "Fragilité";
  const isMdUp = useMediaQuery("(min-width: 768px)");

  // juste sélectionner le CSV correspondant
  const currentCsvForm = useMemo<CsvFormEntry | null>(
    () => CSV_VULNERABILITY_FORMS.find((c) => c.label === activeFragTab) ?? null,
    [activeFragTab]
  );

  const formPaneRef = useRef<HTMLElement>(null!);
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const depRef = useRef<DependenceHandle | null>(null);
  const genericRef = useRef<GenericCsvFormHandle | null>(null);

  const [resultsAide, setResultsAide] = useState<{ freq: SummaryRow[]; other: SummaryRow[] } | null>(null);
  const [resultsDep, setResultsDep] = useState<DependenceSummary | null>(null);
  const [resultsGeneric, setResultsGeneric] = useState<GenericSummary | null>(null);

  /* ===================== PREVIEW ===================== */

  function handlePreview() {
    if (!currentCsvForm) return;

    switch (currentCsvForm.component as ComponentKind) {
      case "aide": {
        const sum = aideRef.current?.buildSummary();
        if (sum) setResultsAide(sum);
        break;
      }
      case "dep": {
        const sum = depRef.current?.buildSummary();
        if (sum) setResultsDep(sum);
        break;
      }
      case "generic-generic": {
        const sum = genericRef.current?.buildSummary();
        if (sum?.kind === "generic") setResultsGeneric(sum);
        break;
      }
    }
  }

  /* ===================== GENERATE PDF ===================== */

  async function handleValidateAll() {
    const payload = await BuildGeriatriePdfPayload({
      aideRef,
      depRef,
      genericRef,
      currentCsvKey: currentCsvForm?.key,
    });

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

  /* ===================== RENDER FORM ===================== */

  const renderFormContent = () => {
    const title = activeFragTab;

    return (
      <motion.div
        key={`${activeCategory}/${activeFragTab}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border p-4 lg:p-6 shadow-sm"
      >
        <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">{title}</h2>

        {currentCsvForm?.component === "aide" && <AideEnPlaceCsv ref={aideRef} />}
        {currentCsvForm?.component === "dep" && (
          <DependenceCsv ref={depRef} csvPath={currentCsvForm.path} />
        )}
        {currentCsvForm?.component === "generic-generic" && (
          <GenericCsvForm
            ref={genericRef}
            csvPath={currentCsvForm.path}
            sectionName={currentCsvForm.label}
            storageKey={currentCsvForm.storageKey}
            mode="generic"
          />
        )}
      </motion.div>
    );
  };

  /* ===================== RENDER PAGE ===================== */

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {isMdUp ? (
        <div className="grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)]">
          {/* Sections */}
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

          {/* Sous-sections Fragilité */}
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

          {/* Formulaire */}
          <section ref={formPaneRef}>
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

      <HelpOverlay
        results={resultsAide}
        onClose={() => setResultsAide(null)}
        onValidate={handleConfirmAndClearAll}
      />

      <DepOverlay
        results={resultsDep}
        onClose={() => setResultsDep(null)}
        onValidate={() => setResultsDep(null)}
      />

      <GenericCsvOverlay
        results={resultsGeneric}
        currentCsvForm={currentCsvForm}
        onClose={() => setResultsGeneric(null)}
        onValidate={handleConfirmAndClearAll}
      />
    </div>
  );
}
