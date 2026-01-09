/**
 * Types communs pour les formulaires CSV
 */

import { Option } from './utils';

/**
 * Structure d'une ligne CSV brute
 */
export type CsvRow = {
  Group?: string;
  Section?: string;
  QPos?: string | number;
  Question: string;
  Type?: string;
  Options?: string;
  Role?: string;
  TriggerOn?: string;
  TriggerReportOn?: string;
  Surveillance?: string;
  Actions?: string;
  Tooltip?: string;
};

/**
 * Types de questions supportés
 */
export type QuestionType = "radio" | "checkbox" | "text" | "textarea" | "information";

/**
 * Rôles possibles pour une question
 */
export type QuestionRole = "" | "lock" | "color" | "freq" | "score";

/**
 * Question processée et normalisée
 */
export type BaseQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  options: Option[];
  rawOptions: Option[];
  role: QuestionRole;
  qpos: number;
  triggerOnLock: string[];
  triggerOnReport: string[];
  surveillanceItems: string[];
  actionItems: string[];
  tooltip?: string;
};

/**
 * Configuration d'un formulaire CSV
 */
export type FormConfig = {
  csvPath: string;
  storageKey: string;
  sectionName?: string;
  groupName?: string;
};

/**
 * État d'un formulaire
 */
export type FormState = {
  questions: BaseQuestion[];
  answers: Record<string, string>;
  isLoading: boolean;
  error?: string;
};

/**
 * Résumé générique d'un formulaire
 */
export type BaseFormSummary = {
  kind: string;
  score?: number;
  color?: "green" | "orange" | "red" | "grey";
  report?: {
    reperage: string[];
    proposition: string[];
  };
};

/**
 * Handle pour contrôler un formulaire depuis l'extérieur
 */
export type BaseFormHandle = {
  buildSummary: () => BaseFormSummary;
  clearLocal: () => void;
};

/**
 * Props communes pour les composants de formulaire
 */
export type BaseFormProps = {
  config: FormConfig;
  onAnswerChange?: (questionId: string, value: string) => void;
  disabled?: boolean;
};

/**
 * Types spécifiques pour AideEnPlace
 */
export type AideEnPlaceSummary = {
  kind: "aide-en-place";
  freq: Array<{ question: string; answer: string }>;
  other: Array<{ question: string; answer: string }>;
};

/**
 * Types spécifiques pour Dependence
 */
export type DependenceSummary = {
  kind: "dependence";
  adlScore: number;
  adlMax: number;
  iadlScore: number;
  iadlMax: number;
  dependanceScore: number;
  color: "green" | "orange" | "red" | "grey";
  report: {
    reperage: string[];
    proposition: string[];
  };
};

/**
 * Types spécifiques pour Generic
 */
export type GenericSummary = {
  kind: "generic";
  score: number;
  color: "green" | "orange" | "red" | "grey";
  report: {
    reperage: string[];
    proposition: string[];
  };
};

/**
 * Union de tous les types de résumés
 */
export type FormSummary = AideEnPlaceSummary | DependenceSummary | GenericSummary;