/** Ordre des catégories principales dans la page Formulaire */
export const FORM_CATEGORIES: string[] = [
  "Fragilité",
  "Problèmes médicaux",
  "Problèmes sociaux-environementaux",
  "Repérage clinique",
  "Repérage biologique",
  "Fiche de fragilités phénotypiques",
  "Fiche d'informations personnelles",
];


/** Modèle de données questions (placeholder prêt à être remplacé par les vraies questions) */
export const QUESTIONS: Record<string, any> = {
  // ▼▼▼ FRAGILITÉ a un niveau de sous-onglets ▼▼▼
  Fragilité: {
    "Aide en place et fréquence": [
      { id: "frag.aide.type", label: "Type d’aide actuelle", type: "text" },
      {
        id: "frag.aide.frequence",
        label: "Fréquence",
        type: "radio",
        options: ["Quotidienne", "Hebdomadaire", "Ponctuelle"],
      },
      { id: "frag.aide.details", label: "Détails complémentaires", type: "textarea" },
    ],
    Isolement: [
      { id: "frag.isolement.vitseul", label: "Vit seul ?", type: "radio", options: ["Oui", "Non"] },
      {
        id: "frag.isolement.reseau",
        label: "Réseau de soutien disponible ?",
        type: "radio",
        options: ["Faible", "Modéré", "Satisfaisant"],
      },
      { id: "frag.isolement.comment", label: "Commentaires", type: "textarea" },
    ],
    Dépendance: [
      { id: "frag.dep.niveau", label: "Niveau (ADL/IADL/AGGIR)", type: "text" },
      { id: "frag.dep.aideNecessaire", label: "Aides nécessaires", type: "textarea" },
    ],
    "Habitation inadaptée": [
      {
        id: "frag.habitat.contraintes",
        label: "Contraintes (escaliers, salle de bain non adaptée, etc.)",
        type: "textarea",
      },
      { id: "frag.habitat.adaptations", label: "Adaptations présentes", type: "text" },
    ],
    "Troubles neurocognitifs": [
      { id: "frag.neuro.diagnostic", label: "Diagnostic / suspicion", type: "text" },
      { id: "frag.neuro.score", label: "Score cognitif (ex : MMS)", type: "text" },
    ],
    "Troubles psychiques": [
      {
        id: "frag.psy.symptomes",
        label: "Symptômes",
        type: "checkbox",
        options: ["Anxiété", "Dépression", "Troubles du comportement"],
      },
      { id: "frag.psy.suivi", label: "Suivi / traitement en cours", type: "textarea" },
    ],
    "Troubles musculosquelettiques": [
      { id: "frag.msk.chutes", label: "Chutes dans les 12 derniers mois", type: "text" },
      { id: "frag.msk.douleurs", label: "Douleurs / limitations", type: "textarea" },
    ],
    Dénutrition: [
      { id: "frag.denut.imc", label: "IMC", type: "text" },
      { id: "frag.denut.perte", label: "Perte de poids (6 derniers mois)", type: "text" },
      { id: "frag.denut.mnacf", label: "Score MNA-SF (si disponible)", type: "text" },
    ],
    "Troubles neurosensoriels": [
      { id: "frag.sens.auditif", label: "Troubles auditifs", type: "radio", options: ["Oui", "Non"] },
      { id: "frag.sens.visuel", label: "Troubles visuels", type: "radio", options: ["Oui", "Non"] },
      { id: "frag.sens.appareillages", label: "Appareillages (prothèses, lunettes…)", type: "text" },
    ],
    Polypathologie: [
      { id: "frag.poly.nb", label: "Nombre de pathologies", type: "text" },
      { id: "frag.poly.principales", label: "Pathologies principales", type: "textarea" },
    ],
    "Polymédication et traitement à risque": [
      { id: "frag.polymed.nb", label: "Nombre total de médicaments", type: "text" },
      {
        id: "frag.polymed.risque",
        label: "Traitements potentiellement inappropriés",
        type: "checkbox",
        options: ["Benzodiazépines", "Anticholinergiques", "AINS", "Autres"],
      },
    ],
  },

  // ▼▼▼ autres catégories (exemples de base, tu pourras enrichir) ▼▼▼
  "Évaluation clinique": [
    {
      id: "eval.clinique.anomalies",
      label: "Anomalies cliniques",
      type: "checkbox",
      options: ["Neurologique", "Cardio-vasculaire", "Respiratoire", "Autre"],
    },
    { id: "eval.clinique.details", label: "Détails / Observations", type: "textarea" },
  ],
  "Évaluation biologique": [
    { id: "eval.bio.anomalies", label: "Anomalies biologiques", type: "textarea" },
    { id: "eval.bio.date", label: "Date des derniers bilans", type: "text" },
  ],
};
