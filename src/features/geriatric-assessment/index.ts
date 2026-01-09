/**
 * Feature: Geriatric Assessment
 * Module d'évaluation gériatrique complet
 */

// Page principale
export { default as GeriatricAssessmentPage } from "./GeriatricAssessmentPage";

// Hooks principaux
export { useFormState } from "./hooks/useFormState";
export { useFormNavigation } from "./hooks/useFormNavigation";

// Composants principaux
export { FormRenderer } from "./components/FormRenderer";
export { NavigationSidebar } from "./components/NavigationSidebar";
export { FormSection } from "./components/FormSection";

// Types et interfaces (si nécessaire d'exporter)
// export type { ... } from "./types";