/**
 * Constantes communes pour les formulaires
 */

export const FORM_CONSTANTS = {
  // Scores maximums
  ADL_MAX: 6,
  IADL_MAX: 8,

  // Délais et timeouts
  DEBOUNCE_DELAY: 300,

  // Valeurs par défaut
  DEFAULT_TRIGGER_LOCK: ["Oui"],
  DEFAULT_QUESTION_TYPE: "radio" as const,

  // Patterns communs
  QUALITY_QUESTION_PATTERNS: [
    "qualité de la prise en charge",
    "qualite de la prise en charge"
  ],

  // Réponses standardisées
  STANDARD_RESPONSES: {
    OUI: "Oui",
    NON: "Non",
    BONNE: "Bonne",
    PARTIELLE: "Partielle",
    INSUFFISANTE: "Insuffisante",
    AIDE_PARTIELLE: "Aide partielle",
    DEPENDANT: "Dépendant"
  },

  // Rôles de questions
  QUESTION_ROLES: {
    LOCK: "lock",
    COLOR: "color",
    FREQ: "freq",
    SCORE: "score"
  } as const,

  // Types de questions
  QUESTION_TYPES: {
    RADIO: "radio",
    CHECKBOX: "checkbox",
    TEXT: "text",
    TEXTAREA: "textarea",
    INFORMATION: "information"
  } as const
} as const;

/**
 * Préfixes pour les clés de stockage local
 */
export const STORAGE_PREFIXES = {
  GERIATRIE: "geriatrie",
  AIDE_EN_PLACE: "geriatrie_aide_en_place",
  DEPENDANCE: "geriatrie_dependance",
  GENERIC: "geriatrie_generic"
} as const;