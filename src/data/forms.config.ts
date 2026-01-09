/**
 * Configuration centralisée pour tous les formulaires de l'application
 */

export type FormComponentType = "aide" | "dep" | "generic-generic";

export interface FormConfig {
  key: string;
  label: string;
  csvImport?: () => Promise<string>;  // Import dynamique pour les CSV
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
    csvImport: () => import("@/assets/csv/vulnerability/aide_en_place.csv?raw").then(m => m.default),
    component: "aide" as const,
    storageKey: "geriatrie.form.aide.v1"
  },
  {
    key: "iso",
    label: "Isolement",
    csvImport: () => import("@/assets/csv/vulnerability/isolement.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.isolement.v1"
  },
  {
    key: "dep",
    label: "Dépendance",
    csvImport: () => import("@/assets/csv/vulnerability/dependance.csv?raw").then(m => m.default),
    component: "dep" as const,
    storageKey: "geriatrie.form.dependance.v1"
  },
  {
    key: "habit",
    label: "Habitation inadaptée",
    csvImport: () => import("@/assets/csv/vulnerability/habitation_inadaptee.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.habitation.v1"
  },
  {
    key: "neuroco",
    label: "Troubles neurocognitifs",
    csvImport: () => import("@/assets/csv/vulnerability/trouble_neuroco.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.neuroco.v1"
  },
  {
    key: "psy",
    label: "Troubles psychiques",
    csvImport: () => import("@/assets/csv/vulnerability/trouble_psy.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.psy.v1"
  },
  {
    key: "musculo",
    label: "Troubles musculosquelettiques",
    csvImport: () => import("@/assets/csv/vulnerability/trouble_musculo.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.musculo.v1"
  },
  {
    key: "denut",
    label: "Dénutrition",
    csvImport: () => import("@/assets/csv/vulnerability/denutrition.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.denutrition.v1"
  },
  {
    key: "neuro",
    label: "Troubles neurosensoriels",
    csvImport: () => import("@/assets/csv/vulnerability/trouble_neuro.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.neuro.v1"
  },
  {
    key: "polypathologie",
    label: "Polypathologie",
    csvImport: () => import("@/assets/csv/vulnerability/polypathologie.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.polypathologie.v1"
  },
  {
    key: "polymedication",
    label: "Polymédication et traitement à risque",
    csvImport: () => import("@/assets/csv/vulnerability/polymedication.csv?raw").then(m => m.default),
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
    csvImport: () => import("@/assets/csv/medicalIssue/vaccination.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.vaccination.v1"
  },
  {
    key: "sommeil",
    label: "Troubles du sommeil",
    csvImport: () => import("@/assets/csv/medicalIssue/trouble_sommeil.csv?raw").then(m => m.default),
    component: "generic-generic" as const,
    storageKey: "geriatrie.form.sommeil.v1"
  },
   {
     key: "incontinence",
     label: "Incontinence urinaire",
     csvImport: () => import("@/assets/csv/medicalIssue/incontinence_urinaire.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.incontinence_urinaire.v1"
   },
   {
     key: "constipation",
     label: "Constipation",
     csvImport: () => import("@/assets/csv/medicalIssue/constipation.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.constipation.v1"
   },
   {
     key: "douleur",
     label: "Douleur",
     csvImport: () => import("@/assets/csv/medicalIssue/douleur.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.douleur.v1"
   },
   {
     key: "hypotension",
     label: "Hypotension orthostatique",
     csvImport: () => import("@/assets/csv/medicalIssue/hypotension.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.hypotension.v1"
   },
   {
     key: "alitement",
     label: "Alitement prolongé",
     csvImport: () => import("@/assets/csv/medicalIssue/alitement.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.alitement.v1"
   },
   {
     key: "trouble_erection",
     label: "Troubles de l'érection",
     csvImport: () => import("@/assets/csv/medicalIssue/erection.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.trouble_erection.v1"
   },
];

export const CSV_SOCIAL_ENVIRONMENTAL_ISSUES: FormConfig[] = [
  {
     key: "doute_conduite",
     label: "Doute sur l'aptitude à la conduite",
     csvImport: () => import("@/assets/csv/socialEnvironmentalIssues/doute_conduite.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.doute_conduite.v1"
  },
  {
     key: "epuisement_aidant",
     label: "Doute sur épuisement de l'aidant",
     csvImport: () => import("@/assets/csv/socialEnvironmentalIssues/epuisement_aidant.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.epuisement_aidant.v1"
  },
  {
     key: "doute_maltraitance",
     label: "Doute sur maltraitance",
     csvImport: () => import("@/assets/csv/socialEnvironmentalIssues/doute_maltraitance.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.doute_maltraitance.v1"
  },
  {
     key: "fin_de_vie",
     label: "Choix de fin de vie à exprimer",
     csvImport: () => import("@/assets/csv/socialEnvironmentalIssues/fin_de_vie.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.fin_de_vie.v1"
  },
];

export const CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS: FormConfig[] = [
  {
     key: "reperage_clinique",
     label: "Repérage clinique",
     csvImport: () => import("@/assets/csv/clinicalIdentification/reperage_clinique.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.reperage_clinique.v1"
  }
]

export const CSV_BIOLOGICAL_IDENTIFICATION_ISSUES_FORMS: FormConfig[] = [
  {
     key: "reperage_biologique",
     label: "Repérage biologique",
     csvImport: () => import("@/assets/csv/biologicalIdentification/reperage_biologique.csv?raw").then(m => m.default),
     component: "generic-generic" as const,
     storageKey: "geriatrie.form.reperage_biologique.v1"
  }
]

/**
 * Mappage des sections vers leurs formulaires
 */
export const FORM_SECTIONS = {
  vulnerability: CSV_VULNERABILITY_FORMS,
  medicalIssues: CSV_MEDICAL_ISSUES_FORMS,
  socialEnvironmentalIssues: CSV_SOCIAL_ENVIRONMENTAL_ISSUES,
  clinicIdentificationIssues: CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS,
} as const;

/**
 * Union de tous les formulaires pour le typage
 */
export type AllFormConfigs =
  typeof CSV_VULNERABILITY_FORMS[number] |
  typeof CSV_MEDICAL_ISSUES_FORMS[number] |
  typeof CSV_SOCIAL_ENVIRONMENTAL_ISSUES[number] |
  typeof CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS[number];