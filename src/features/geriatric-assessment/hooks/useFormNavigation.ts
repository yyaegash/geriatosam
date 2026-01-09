import { useState, useMemo } from "react";
import { CSV_VULNERABILITY_FORMS, CSV_MEDICAL_ISSUES_FORMS, type FormConfig } from "@/data/forms.config";

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
  const hasSubtabs = isFragilite || isProblemsMedicaux;

  // Trouver le formulaire actuel
  const currentForm = useMemo<FormConfig | null>(() => {
    const allForms = [...CSV_VULNERABILITY_FORMS, ...CSV_MEDICAL_ISSUES_FORMS];
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