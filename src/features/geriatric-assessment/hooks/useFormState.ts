import { useRef, useState } from "react";
import type { FormConfig } from "@/data/forms.config";
import type {
  AideEnPlaceHandle,
  DependenceHandle,
  GenericCsvFormHandle,
  AideEnPlaceSummary,
  DependenceSummary,
  GenericSummary
} from "../Questions";
import { buildPdfPayload, generateGeriatriePdf } from "../pdf";

/**
 * Hook personnalisé pour gérer l'état des formulaires et leurs interactions
 * Centralise la gestion des refs, des résultats et des overlays
 */
export function useFormState() {
  // Références vers les handles des formulaires
  const aideRef = useRef<AideEnPlaceHandle | null>(null);
  const depRef = useRef<DependenceHandle | null>(null);
  const genericRef = useRef<GenericCsvFormHandle | null>(null);

  // États des résultats pour les overlays
  const [resultsAide, setResultsAide] = useState<AideEnPlaceSummary | null>(null);
  const [resultsDep, setResultsDep] = useState<DependenceSummary | null>(null);
  const [resultsGeneric, setResultsGeneric] = useState<GenericSummary | null>(null);
  const [buttonsHidden, setButtonsHidden] = useState(false);

  /**
   * Gère la preview d'un formulaire selon son type
   */
  const handlePreview = (currentForm: FormConfig | null) => {
    if (!currentForm) return;

    // Cacher les boutons quand on ouvre la preview
    setButtonsHidden(true);

    switch (currentForm.component) {
      case "aide": {
        const sum = aideRef.current?.buildSummary();
        if (sum) setResultsAide(sum);
        break;
      }
      case "dep": {
        const sum = depRef.current?.buildSummary();
        if (sum) setResultsDep(sum);
        break;
      }
      case "generic-generic": {
        const sum = genericRef.current?.buildSummary();
        if (sum?.kind === "generic") setResultsGeneric(sum);
        break;
      }
    }
  };

  /**
   * Génère et télécharge le PDF avec toutes les données
   */
  const handleValidateAll = async (currentForm: FormConfig | null) => {
    const payload = await buildPdfPayload({
      aideRef,
      depRef,
      genericRef,
      currentCsvKey: currentForm?.key,
    });

    await generateGeriatriePdf(payload);
  };

  /**
   * Vide toutes les données locales des formulaires
   */
  const handleConfirmAndClearAll = () => {
    aideRef.current?.clearLocal?.();
    depRef.current?.clearLocal?.();
    genericRef.current?.clearLocal?.();
    setResultsAide(null);
    setResultsDep(null);
    setResultsGeneric(null);
  };

  /**
   * Handlers pour fermer les overlays
   */
  const handleCloseAideOverlay = () => {
    setResultsAide(null);
    setButtonsHidden(false);
  };

  const handleCloseDepOverlay = () => {
    setResultsDep(null);
    setButtonsHidden(false);
  };

  const handleCloseGenericOverlay = () => {
    setResultsGeneric(null);
    setButtonsHidden(false);
  };

  /**
   * Handlers pour valider et nettoyer après overlay
   */
  const handleValidateAndClearAide = () => {
    handleConfirmAndClearAll();
    setButtonsHidden(false);
  };

  const handleValidateAndClearDep = () => {
    depRef.current?.clearLocal?.(); // Effacer les données du formulaire
    setResultsDep(null);
    setButtonsHidden(false);
  };

  const handleValidateAndClearGeneric = () => {
    handleConfirmAndClearAll();
    setButtonsHidden(false);
  };

  return {
    // Références
    refs: {
      aideRef,
      depRef,
      genericRef,
    },

    // États
    state: {
      resultsAide,
      resultsDep,
      resultsGeneric,
      buttonsHidden,
    },

    // Actions
    actions: {
      handlePreview,
      handleValidateAll,
      handleConfirmAndClearAll,
      handleCloseAideOverlay,
      handleCloseDepOverlay,
      handleCloseGenericOverlay,
      handleValidateAndClearAide,
      handleValidateAndClearDep,
      handleValidateAndClearGeneric,
    },
  };
}