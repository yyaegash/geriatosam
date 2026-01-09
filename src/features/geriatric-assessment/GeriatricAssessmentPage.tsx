import { useIsMdUp } from "@/hooks/useMediaQuery";
import { useFormNavigation } from "./hooks/useFormNavigation";
import { useFormState } from "./hooks/useFormState";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { FormSection } from "./components/FormSection";
import HelpOverlay from "./Results/HelpOverlay";
import DepOverlay from "./Results/DepOverlay";
import GenericCsvOverlay from "./Results/GenericOverlay";
import { Activity } from "lucide-react";

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-medical-bg)' }}>
      {/* Header médical professionnel */}
      <header className="medical-header border-b-0 rounded-none mb-6">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Évaluation Gériatrique</h1>
                <p className="text-sm text-slate-600">Système d'évaluation médicale complète</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-6">
        {isMdUp ? (
          // Layout Desktop : 3 colonnes avec design médical
          <div className="grid gap-6 md:grid-cols-[240px_240px_minmax(0,1fr)]">
          <NavigationSidebar
            activeCategory={navigation.state.activeCategory}
            onCategoryChange={navigation.actions.handleCategoryChange}
            activeFragTab={navigation.state.activeFragTab}
            onFragTabChange={navigation.actions.handleFragTabChange}
            dynamicSubtabs={navigation.state.dynamicSubtabs}
            hasSubtabs={navigation.state.hasSubtabs}
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
            dynamicSubtabs={navigation.state.dynamicSubtabs}
            hasSubtabs={navigation.state.hasSubtabs}
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
    </div>
  );
}
