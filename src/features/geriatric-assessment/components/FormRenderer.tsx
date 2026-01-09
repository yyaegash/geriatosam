import { motion } from "framer-motion";
import type { FormConfig } from "@/data/forms.config";
import {
  AideEnPlaceForm,
  DependenceForm,
  GenericCsvForm,
  type AideEnPlaceHandle,
  type DependenceHandle,
  type GenericCsvFormHandle,
} from "../Questions";

export interface FormRendererProps {
  /** Configuration du formulaire actuel */
  currentForm: FormConfig | null;

  /** Titre affiché dans le formulaire */
  title: string;

  /** Clé unique pour l'animation (changement de formulaire) */
  animationKey: string;

  /** Références vers les handles des formulaires */
  refs: {
    aideRef: React.RefObject<AideEnPlaceHandle | null>;
    depRef: React.RefObject<DependenceHandle | null>;
    genericRef: React.RefObject<GenericCsvFormHandle | null>;
  };
}

/**
 * Composant responsable du rendu des différents types de formulaires
 * Encapsule la logique de sélection et de rendu selon le type de formulaire
 */
export function FormRenderer({
  currentForm,
  title,
  animationKey,
  refs
}: FormRendererProps) {
  if (!currentForm) {
    return (
      <div className="rounded-2xl border p-4 lg:p-6 shadow-sm">
        <p className="text-gray-500 text-center">Aucun formulaire sélectionné</p>
      </div>
    );
  }

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border p-4 lg:p-6 shadow-sm"
    >
      <h2 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4">
        {title}
      </h2>

      {renderFormByType(currentForm, refs)}
    </motion.div>
  );
}

/**
 * Fonction helper qui rend le bon composant selon le type de formulaire
 */
function renderFormByType(
  form: FormConfig,
  refs: FormRendererProps["refs"]
) {
  switch (form.component) {
    case "aide":
      return <AideEnPlaceForm ref={refs.aideRef} />;

    case "dep":
      return (
        <DependenceForm
          ref={refs.depRef}
          csvPath={form.path}
        />
      );

    case "generic-generic":
      return (
        <GenericCsvForm
          ref={refs.genericRef}
          config={form}
          mode="generic"
        />
      );

    default:
      // Type guard pour s'assurer que tous les cas sont traités
      const _exhaustive: never = form.component;
      return (
        <div className="text-red-500 p-4 text-center">
          Type de formulaire non supporté: {String(_exhaustive)}
        </div>
      );
  }
}