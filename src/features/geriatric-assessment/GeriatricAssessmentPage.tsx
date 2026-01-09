import { useIsMdUp } from "@/hooks/useMediaQuery";
import { useFormNavigation } from "./hooks/useFormNavigation";
import { useFormState } from "./hooks/useFormState";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { FormSection } from "./components/FormSection";
import HelpOverlay from "./Results/HelpOverlay";
import DepOverlay from "./Results/DepOverlay";
import GenericCsvOverlay from "./Results/GenericOverlay";

/**
 * Page principale des formulaires gériatriques
 * Orchestrateur simple qui coordonne la navigation, l'état et l'affichage
 */
export default function FormulaireIndex() {
  // Hooks pour la gestion d'état et navigation
  const navigation = useFormNavigation();
  const formState = useFormState();
  const isMdUp = useIsMdUp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {isMdUp ? (
        // Layout Desktop : 3 colonnes (sections, sous-sections, formulaire)
        <div className="grid gap-4 md:grid-cols-[220px_220px_minmax(0,1fr)]">
          <NavigationSidebar
            activeCategory={navigation.state.activeCategory}
            onCategoryChange={navigation.actions.handleCategoryChange}
            activeFragTab={navigation.state.activeFragTab}
            onFragTabChange={navigation.actions.handleFragTabChange}
            dynamicFragSubtabs={navigation.state.dynamicFragSubtabs}
          />

          <FormSection
            currentForm={navigation.state.currentForm}
            title={navigation.state.activeFragTab}
            animationKey={`${navigation.state.activeCategory}/${navigation.state.activeFragTab}`}
            refs={formState.refs}
            onPreview={() => formState.actions.handlePreview(navigation.state.currentForm)}
            onValidate={() => formState.actions.handleValidateAll(navigation.state.currentForm)}
            buttonsHidden={formState.state.buttonsHidden}
          />
        </div>
      ) : (
        // Layout Mobile : empilé
        <>
          <NavigationSidebar
            activeCategory={navigation.state.activeCategory}
            onCategoryChange={navigation.actions.handleCategoryChange}
            activeFragTab={navigation.state.activeFragTab}
            onFragTabChange={navigation.actions.handleFragTabChange}
            dynamicFragSubtabs={navigation.state.dynamicFragSubtabs}
            isMobile={true}
          />

          <div className="mt-3">
            <FormSection
              currentForm={navigation.state.currentForm}
              title={navigation.state.activeFragTab}
              animationKey={`${navigation.state.activeCategory}/${navigation.state.activeFragTab}`}
              refs={formState.refs}
              onPreview={() => formState.actions.handlePreview(navigation.state.currentForm)}
              onValidate={() => formState.actions.handleValidateAll(navigation.state.currentForm)}
              buttonsHidden={formState.state.buttonsHidden}
            />
          </div>
        </>
      )}

      {/* Overlays de résultats */}
      <HelpOverlay
        results={formState.state.resultsAide}
        onClose={formState.actions.handleCloseAideOverlay}
        onValidate={formState.actions.handleValidateAndClearAide}
      />

      <DepOverlay
        results={formState.state.resultsDep}
        onClose={formState.actions.handleCloseDepOverlay}
        onValidate={formState.actions.handleValidateAndClearDep}
      />

      <GenericCsvOverlay
        results={formState.state.resultsGeneric}
        currentCsvForm={navigation.state.currentForm}
        onClose={formState.actions.handleCloseGenericOverlay}
        onValidate={formState.actions.handleValidateAndClearGeneric}
      />
    </div>
  );
}
