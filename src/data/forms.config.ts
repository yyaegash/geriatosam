/**
 * Configuration centralisée pour tous les formulaires de l'application
 */

export type FormComponentType = "aide" | "dep" | "generic-generic";

export interface FormConfig {
  key: string;
  label: string;
  path: string;
  component: FormComponentType;
  storageKey: string;
}

/**
 * Formulaires de la section Fragilité/Vulnérabilité
 */
export const CSV_VULNERABILITY_FORMS: FormConfig[] = [
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
    component: "generic-generic" as const,
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
    key: "habit",
    label: "Habitation inadaptée",
    path: "/habitation_inadaptee.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.habitation.v1"
  },
  {
    key: "neuroco",
    label: "Troubles neurocognitifs",
    path: "/trouble_neuroco.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.neuroco.v1"
  },
  {
    key: "psy",
    label: "Troubles psychiques",
    path: "/trouble_psy.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.psy.v1"
  },
  {
    key: "musculo",
    label: "Troubles musculosquelettiques",
    path: "/trouble_musculo.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.musculo.v1"
  },
  {
    key: "denut",
    label: "Dénutrition",
    path: "/denutrition.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.denutrition.v1"
  },
  {
    key: "neuro",
    label: "Troubles neurosensoriels",
    path: "/trouble_neuro.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.neuro.v1"
  },
  {
    key: "polypathologie",
    label: "Polypathologie",
    path: "/polypathologie.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.polypathologie.v1"
  },
  {
    key: "polymedication",
    label: "Polymédication et traitement à risque",
    path: "/polymedication.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.polymedication.v1"
  },
];

/**
 * Formulaires de la section Problèmes médicaux
 */
export const CSV_MEDICAL_ISSUES_FORMS: FormConfig[] = [
  {
    key: "vaccination",
    label: "Vaccinations à compléter",
    path: "/vaccination.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.vaccination.v1"
  },
  {
    key: "sommeil",
    label: "Troubles du sommeil",
    path: "/trouble_sommeil.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.sommeil.v1"
  },
  {
    key: "incontinence",
    label: "Incontinence urinaire",
    path: "/incontinence_ur.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.incontinence_ur.v1"
  },
  {
    key: "constipation",
    label: "Constipation",
    path: "/constipation.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.constipation.v1"
  },
  {
    key: "douleur",
    label: "Douleur",
    path: "/douleur.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.douleur.v1"
  },
  {
    key: "hypotension",
    label: "Hypotension orthostatique",
    path: "/hypotension.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.hypotension.v1"
  },
  {
    key: "alitement",
    label: "Alitement prolongé",
    path: "/alitement.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.alitement.v1"
  },
  {
    key: "trouble_erection",
    label: "Troubles de l'érection",
    path: "/trouble_erection.csv",
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.trouble_erection.v1"
  },
];

/**
 * Mappage des sections vers leurs formulaires
 */
export const FORM_SECTIONS = {
  vulnerability: CSV_VULNERABILITY_FORMS,
  medicalIssues: CSV_MEDICAL_ISSUES_FORMS,
} as const;

/**
 * Union de tous les formulaires pour le typage
 */
export type AllFormConfigs = typeof CSV_VULNERABILITY_FORMS[number] | typeof CSV_MEDICAL_ISSUES_FORMS[number];