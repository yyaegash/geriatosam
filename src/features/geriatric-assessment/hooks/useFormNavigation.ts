import { useState, useMemo } from "react";
import { CSV_VULNERABILITY_FORMS, type FormConfig } from "@/data/forms.config";

/**
 * Hook personnalisé pour gérer la navigation entre sections et formulaires
 * Centralise toute la logique de navigation des formulaires
 */
export function useFormNavigation() {
  // États de navigation
  const [activeCategory, setActiveCategory] = useState("Fragilité");
  const [activeFragTab, setActiveFragTab] = useState<string>("");

  // Calculer les sous-onglets dynamiques pour la section Fragilité
  const dynamicFragSubtabs = useMemo(
    () => CSV_VULNERABILITY_FORMS.map((c) => c.label),
    []
  );

  // Initialiser le premier onglet si pas encore défini
  useMemo(() => {
    if (!activeFragTab && dynamicFragSubtabs.length > 0) {
      setActiveFragTab(dynamicFragSubtabs[0]);
    }
  }, [activeFragTab, dynamicFragSubtabs]);

  // Calculer les états dérivés
  const isFragilite = activeCategory === "Fragilité";

  // Trouver le formulaire actuel
  const currentForm = useMemo<FormConfig | null>(
    () => CSV_VULNERABILITY_FORMS.find((c) => c.label === activeFragTab) ?? null,
    [activeFragTab]
  );

  /**
   * Gestionnaire pour changer de section principale
   */
  const handleCategoryChange = (newCategory: string) => {
    setActiveCategory(newCategory);
    // Si on revient à Fragilité, réinitialiser le premier onglet
    if (newCategory === "Fragilité" && dynamicFragSubtabs.length > 0) {
      setActiveFragTab(dynamicFragSubtabs[0]);
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
      currentForm,
      dynamicFragSubtabs,
    },

    // Actions
    actions: {
      handleCategoryChange,
      handleFragTabChange,
    },
  };
}