import { useRef } from "react";
import { SubmitBar } from "@/components/SubmitBar";
import { FormRenderer } from "./FormRenderer";
import type { FormConfig } from "@/data/forms.config";
import type {
  AideEnPlaceHandle,
  DependenceHandle,
  GenericCsvFormHandle
} from "../Questions";

interface FormSectionProps {
  /** Configuration du formulaire actuel */
  currentForm: FormConfig | null;

  /** Titre du formulaire */
  title: string;

  /** Clé d'animation pour le formulaire */
  animationKey: string;

  /** Références vers les handles des formulaires */
  refs: {
    aideRef: React.RefObject<AideEnPlaceHandle | null>;
    depRef: React.RefObject<DependenceHandle | null>;
    genericRef: React.RefObject<GenericCsvFormHandle | null>;
  };

  /** Handler pour la preview */
  onPreview: () => void;

  /** Handler pour la validation */
  onValidate: () => void;

  /** Si les boutons sont cachés */
  buttonsHidden: boolean;
}

/**
 * Section formulaire avec SubmitBar
 * Encapsule le rendu du formulaire et ses contrôles
 */
export function FormSection({
  currentForm,
  title,
  animationKey,
  refs,
  onPreview,
  onValidate,
  buttonsHidden
}: FormSectionProps) {
  const formPaneRef = useRef<HTMLElement>(null!);

  return (
    <section ref={formPaneRef} className="medical-container smooth-transition">
      <FormRenderer
        currentForm={currentForm}
        title={title}
        animationKey={animationKey}
        refs={refs}
      />

      <div aria-hidden className="h-24 md:h-0"></div>

      <SubmitBar
        onSubmit={onPreview}
        anchorRef={formPaneRef}
        onValidate={onValidate}
        submitLabel="Preview"
        validateLabel="Valider"
        hidden={buttonsHidden}
      />
    </section>
  );
}