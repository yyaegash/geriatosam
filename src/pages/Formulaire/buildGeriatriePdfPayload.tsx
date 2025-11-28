// src/pages/Formulaire/buildGeriatriePdfPayload.ts
import type { AideEnPlaceHandle, SummaryRow } from "./AideEnPlaceCsv";
import type { DependanceHandle, DependanceSummary } from "./DependanceCsv";
import type {
  GenericCsvFormHandle,
  GenericSummary,
} from "./GenericCsvForm";
import { CSV_VULNERABILITY_FORMS } from "./GeriatricAssessment/Vulnerability";
import { reconstructGenericFromCsv } from "./exportGeriatricPdf";
import type { PdfPayload } from "./exportGeriatricPdf";

// Helpers pour normaliser les labels comme dans exportGeriatricPdf
const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const norm = (s: string) =>
  stripDiacritics(String(s)).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

type Handles = {
  aideRef: React.RefObject<AideEnPlaceHandle | null>;
  depRef: React.RefObject<DependanceHandle | null>;
  genericRef: React.RefObject<GenericCsvFormHandle | null>;
  currentCsvKey?: string; // <- juste la key de l’entrée active
};

export async function buildGeriatriePdfPayload({
  aideRef,
  depRef,
  genericRef,
  currentCsvKey,
}: Handles): Promise<PdfPayload> {
  // 1) Aide
  const aideSum = aideRef.current?.buildSummary?.();
  const aidePayload = aideSum
    ? { rows: [...aideSum.freq, ...aideSum.other] as SummaryRow[] }
    : undefined;

  // 2) Dépendance
  const dep = (depRef.current?.buildSummary?.() || null) as DependanceSummary | null;

  // 3) Tous les GenericCsvForm (mode "generic")
  const genericPayload: Array<{ label: string; summary: GenericSummary }> = [];

  for (const entry of CSV_VULNERABILITY_FORMS) {
    if (entry.component !== "generic-generic") continue;

    // 🔑 Clé de stockage identique à GenericCsvForm :
    // - si entry.storageKey est défini, on le respecte
    // - sinon on dérive depuis le label
    const storageKey =
      entry.storageKey || `csv.${norm(entry.label)}`;

    let summary: GenericSummary | null = null;

    // a) Si l'onglet courant correspond à cette entrée et que le ref est monté,
    //    on utilise buildSummary (données les plus fraîches)
    if (currentCsvKey === entry.key && genericRef.current?.buildSummary) {
      const fromRef = genericRef.current.buildSummary();
      if (fromRef && fromRef.kind === "generic") {
        summary = fromRef;
      }
    }

    // b) Sinon (ou si le ref n’a rien), on reconstruit depuis CSV + localStorage
    if (!summary) {
      const rebuilt = await reconstructGenericFromCsv(
        entry.label,
        entry.path,
        storageKey
      );
      if (rebuilt && rebuilt.kind === "generic") {
        summary = rebuilt;
      }
    }

    if (summary) {
      genericPayload.push({ label: entry.label, summary });
    }
  }

  // (optionnel) log de debug
  console.log(
    "=== PAYLOAD PDF (buildGeriatriePdfPayload) ===",
    JSON.stringify(
      {
        dependance: dep,
        generics: genericPayload.map((g) => ({
          label: g.label,
          score: g.summary.score,
          reperage: g.summary.report.reperage,
          proposition: g.summary.report.proposition,
        })),
      },
      null,
      2
    )
  );

  return {
    aide: aidePayload,
    dependance: dep,
    generics: genericPayload,
  };
}
