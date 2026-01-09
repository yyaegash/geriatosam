/**
 * Services PDF pour l'évaluation gériatrique
 */

// Builders
export { buildPdfPayload } from "./builders/payloadBuilder";
export { generateGeriatriePdf, reconstructGenericFromCsv } from "./builders/pdfBuilder";

// Types
export type {
  PdfPayload,
  FormHandles,
  ReconstructedAideData,
  HistoBar,
  HistoColor
} from "./types";