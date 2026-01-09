import { useState, useMemo } from "react";
import { CSV_VULNERABILITY_FORMS, CSV_MEDICAL_ISSUES_FORMS, CSV_SOCIAL_ENVIRONMENTAL_ISSUES, CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS, CSV_BIOLOGICAL_IDENTIFICATION_ISSUES_FORMS, type FormConfig } from "@/data/forms.config";

/**
 * Hook personnalisé pour gérer la navigation entre sections et formulaires
 * Centralise toute la logique de navigation des formulaires
 */
export function useFormNavigation() {
  // États de navigation
  const [activeCategory, setActiveCategory] = useState("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>("");

  // Normalisation robuste qui ignore les espaces et caractères invisibles
  const normalize = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFC');

  const normalizedCategory = normalize(activeCategory);

  // Calculer les sous-onglets dynamiques selon la section
  const dynamicSubtabs = useMemo(() => {
    if (normalizedCategory.includes('fragilité') || normalizedCategory.includes('fragilit')) {
      return CSV_VULNERABILITY_FORMS.map((c) => c.label);
    } else if (normalizedCategory.includes('problèmes médicaux') ||
               normalizedCategory.includes('problemes medicaux') ||
               normalizedCategory.includes('medical')) {
      return CSV_MEDICAL_ISSUES_FORMS.map((c) => c.label);
    } else if (normalizedCategory.includes('problèmes sociaux-environnementaux') ||
               normalizedCategory.includes('problemes sociaux-environnementaux') ||
               normalizedCategory.includes('problèmes sociaux-environementaux') ||
               normalizedCategory.includes('problemes sociaux-environementaux') ||
               normalizedCategory.includes('social') ||
               normalizedCategory.includes('environnement') ||
               normalizedCategory.includes('environement')) {
      return CSV_SOCIAL_ENVIRONMENTAL_ISSUES.map((c) => c.label);
    } else if (normalizedCategory.includes('repérage clinique') ||
               normalizedCategory.includes('reperage clinique') ||
               normalizedCategory.includes('clinique')) {
      return CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS.map((c) => c.label);
    } else if (normalizedCategory.includes('repérage biologique') ||
               normalizedCategory.includes('reperage biologique') ||
               normalizedCategory.includes('biologique')) {
      return CSV_BIOLOGICAL_IDENTIFICATION_ISSUES_FORMS.map((c) => c.label);
    } else {
      return [];
    }
  }, [normalizedCategory]);

  // Initialiser le premier onglet si pas encore défini
  useMemo(() => {
    if (!activeFragTab && dynamicSubtabs.length > 0) {
      setActiveFragTab(dynamicSubtabs[0]);
    }
  }, [activeFragTab, dynamicSubtabs]);

  // Calculer les états dérivés
  const isFragilite = normalizedCategory.includes('fragilité') || normalizedCategory.includes('fragilit');
  const isProblemsMedicaux = normalizedCategory.includes('problèmes médicaux') ||
                            normalizedCategory.includes('problemes medicaux') ||
                            normalizedCategory.includes('medical');
  const isProblemsSociauxEnvironnementaux = normalizedCategory.includes('problèmes sociaux-environnementaux') ||
                                           normalizedCategory.includes('problemes sociaux-environnementaux') ||
                                           normalizedCategory.includes('problèmes sociaux-environementaux') ||
                                           normalizedCategory.includes('problemes sociaux-environementaux') ||
                                           normalizedCategory.includes('social') ||
                                           normalizedCategory.includes('environnement') ||
                                           normalizedCategory.includes('environement');
  const isReperageClinique = normalizedCategory.includes('repérage clinique') ||
                            normalizedCategory.includes('reperage clinique') ||
                            normalizedCategory.includes('clinique');
  const isReperageBiologique = normalizedCategory.includes('repérage biologique') ||
                              normalizedCategory.includes('reperage biologique') ||
                              normalizedCategory.includes('biologique');
  const hasSubtabs = isFragilite || isProblemsMedicaux || isProblemsSociauxEnvironnementaux || isReperageClinique || isReperageBiologique;

  // Trouver le formulaire actuel
  const currentForm = useMemo<FormConfig | null>(() => {
    const allForms = [...CSV_VULNERABILITY_FORMS, ...CSV_MEDICAL_ISSUES_FORMS, ...CSV_SOCIAL_ENVIRONMENTAL_ISSUES, ...CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS, ...CSV_BIOLOGICAL_IDENTIFICATION_ISSUES_FORMS];
    return allForms.find((c) => c.label === activeFragTab) ?? null;
  }, [activeFragTab]);

  /**
   * Gestionnaire pour changer de section principale
   */
  const handleCategoryChange = (newCategory: string) => {
    setActiveCategory(newCategory);
    // Réinitialiser l'onglet actif selon la nouvelle section
    const newSubtabs = newCategory === "Fragilité"
      ? CSV_VULNERABILITY_FORMS.map((c) => c.label)
      : newCategory === "Problèmes médicaux"
      ? CSV_MEDICAL_ISSUES_FORMS.map((c) => c.label)
      : (newCategory === "Problèmes sociaux-environnementaux" || newCategory === "Problèmes sociaux-environementaux")
      ? CSV_SOCIAL_ENVIRONMENTAL_ISSUES.map((c) => c.label)
      : newCategory === "Repérage clinique"
      ? CSV_CLINIC_IDENTIFICATION_ISSUES_FORMS.map((c) => c.label)
      : newCategory === "Repérage biologique"
      ? CSV_BIOLOGICAL_IDENTIFICATION_ISSUES_FORMS.map((c) => c.label)
      : [];

    if (newSubtabs.length > 0) {
      setActiveFragTab(newSubtabs[0]);
    } else {
      setActiveFragTab("");
    }
  };

  /**
   * Gestionnaire pour changer de sous-section (formulaire)
   */
  const handleFragTabChange = (newTab: string) => {
    setActiveFragTab(newTab);
  };

  return {
    // États
    state: {
      activeCategory,
      activeFragTab,
      isFragilite,
      isProblemsMedicaux,
      isProblemsSociauxEnvironnementaux,
      isReperageClinique,
      isReperageBiologique,
      hasSubtabs,
      currentForm,
      dynamicSubtabs,
    },

    // Actions
    actions: {
      handleCategoryChange,
      handleFragTabChange,
    },
  };
}