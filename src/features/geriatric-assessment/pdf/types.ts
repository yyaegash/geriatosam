import type {
  AideEnPlaceSummary,
  DependenceSummary,
  GenericSummary,
  AideEnPlaceHandle,
  DependenceHandle,
  GenericCsvFormHandle
} from "../Questions";
import type { FormConfig } from "@/data/forms.config";

/** Couleurs disponibles pour les barres d'histogramme */
export type HistoColor = "green" | "orange" | "red" | "grey" | "black";

/** Configuration d'une barre d'histogramme */
export type HistoBar = {
  label: string;
  valuePct: number;
  color: HistoColor
};

/** Données d'entrée pour la génération PDF */
export type PdfPayload = {
  /** Aide en place -> Questions/réponses listées */
  aide?: { rows: Array<{ question: string; answer: string }> };
  /** Dépendance -> repérage/proposition + barres ADL/IADL */
  dependence?: DependenceSummary | null;
  /** Tous les formulaires génériques (mode "generic") */
  generics: Array<{ label: string; summary: GenericSummary }>;
  /** Barres additionnelles si besoin */
  extraHistos?: HistoBar[];
};

/** Références vers les handles des formulaires */
export interface FormHandles {
  aideRef: React.RefObject<AideEnPlaceHandle | null>;
  depRef: React.RefObject<DependenceHandle | null>;
  genericRef: React.RefObject<GenericCsvFormHandle | null>;
  currentCsvKey?: string;
}

/** Données reconstruites depuis localStorage pour l'aide en place */
export interface ReconstructedAideData {
  freq: Array<{ question: string; answer: string }>;
  other: Array<{ question: string; answer: string }>;
}

/** Options pour la reconstruction des données génériques */
export interface GenericReconstructionOptions {
  label: string;
  csvPath: string;
  storageKey: string;
}