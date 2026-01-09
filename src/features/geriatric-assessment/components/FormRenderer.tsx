import { motion } from "framer-motion";
import { FileX } from "lucide-react";
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="medical-container p-8 lg:p-12 text-center animate-fade-in-up"
      >
        <FileX className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Aucun formulaire sélectionné</p>
        <p className="text-gray-400 text-sm mt-2">Choisissez une section pour commencer l'évaluation</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{
        duration: 0.4,
        ease: "easeOut"
      }}
      className="p-6 lg:p-8 animate-slide-in-right"
    >
      <div className="flex items-center gap-3 mb-6 lg:mb-8">
        <div className="w-3 h-8 rounded-full bg-gradient-to-b from-blue-500 to-blue-600"></div>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800">
          {title}
        </h2>
      </div>

      <div className="animate-fade-in-up">
        {renderFormByType(currentForm, refs)}
      </div>
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
      return <DependenceForm ref={refs.depRef} />;

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