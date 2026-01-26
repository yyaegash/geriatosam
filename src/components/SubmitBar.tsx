import { useMemo } from "react";
import { FileText, CheckCircle } from "lucide-react";

type Props = {
  onSubmit: () => void;       // ouvre la preview du formulaire courant
  onValidate?: () => void;    // compile TOUT et génère le PDF
  anchorRef?: React.RefObject<HTMLElement>; // non obligatoire, conservé pour compat
  submitLabel?: string;
  validateLabel?: string;
  hidden?: boolean;          // contrôle la visibilité des boutons
};

export function SubmitBar({
  onSubmit,
  onValidate,
  anchorRef, // non utilisé activement, gardé pour compat future
  submitLabel = "Preview",
  validateLabel = "Valider",
  hidden = false,
}: Props) {
  // Si un jour tu veux conditionner la largeur à anchorRef, tu peux le faire ici.
  const hasValidate = useMemo(() => typeof onValidate === "function", [onValidate]);

  if (hidden) return null;

  return (
    <div
      className="
        md:static md:flex md:justify-start md:mt-3 md:mb-0
        fixed inset-x-0 bottom-0 z-[60] pointer-events-none
      "
      // safe area iOS (mobile seulement)
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {/* Conteneur fluide plein écran sur mobile, compact sur desktop */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 pb-3 pointer-events-none md:mx-0 md:w-auto md:px-0 md:pb-0">
        {/* Carte responsive avec design médical */}
        <div className="
            pointer-events-auto
            mx-0 sm:mx-auto
            medical-container
            px-4 py-3 sm:px-6 sm:py-4
            w-full
            lg:w-auto lg:ml-auto
            flex flex-col gap-3
            xs:flex-row xs:flex-wrap xs:justify-end
            md:mx-0 md:w-auto md:px-3 md:py-2 md:gap-2 md:flex-row
          "
          style={{ background: 'rgba(248, 250, 252, 0.95)' }}
        >
          <button
            type="button"
            onClick={onSubmit}
            className="
              btn-medical-secondary medical-focus inline-flex items-center justify-center gap-2 w-full xs:w-auto
              md:w-auto md:px-3 md:py-1.5 md:text-sm
            "
            aria-label={submitLabel}
          >
            <FileText className="w-4 h-4 md:w-3.5 md:h-3.5" />
            {submitLabel}
          </button>

          {hasValidate && (
            <button
              type="button"
              onClick={onValidate}
              className="
                btn-medical-primary medical-focus inline-flex items-center justify-center gap-2 w-full xs:w-auto
                md:w-auto md:px-3 md:py-1.5 md:text-sm
              "
              aria-label={validateLabel}
            >
              <CheckCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
              {validateLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
