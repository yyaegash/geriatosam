import { useMemo } from "react";

type Props = {
  onSubmit: () => void;       // ouvre la preview du formulaire courant
  onValidate?: () => void;    // compile TOUT et génère le PDF
  anchorRef?: React.RefObject<HTMLElement>; // non obligatoire, conservé pour compat
  submitLabel?: string;
  validateLabel?: string;
};

export function SubmitBar({
  onSubmit,
  onValidate,
  anchorRef, // non utilisé activement, gardé pour compat future
  submitLabel = "Preview",
  validateLabel = "Valider",
}: Props) {
  // Si un jour tu veux conditionner la largeur à anchorRef, tu peux le faire ici.
  const hasValidate = useMemo(() => typeof onValidate === "function", [onValidate]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] pointer-events-none"
      // safe area iOS
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {/* Conteneur fluide plein écran sur mobile, centré + max-w sur grands écrans */}
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 pb-3 pointer-events-none">
        {/* Carte responsive : plein écran mobile, compacte desktop */}
        <div
          className="
            pointer-events-auto
            mx-0 sm:mx-auto
            rounded-xl md:rounded-2xl
            border bg-white/95 shadow-lg backdrop-blur
            px-3 py-2 sm:px-4 sm:py-3
            // Layout largeur :
            w-full
            lg:w-auto lg:ml-auto
            // Gestion de l'empilement des boutons :
            flex flex-col gap-2
            xs:flex-row xs:flex-wrap xs:justify-end
          "
        >
          <button
            type="button"
            onClick={onSubmit}
            className="
              inline-flex items-center justify-center
              rounded-lg border
              px-4 py-2 text-sm font-medium
              hover:bg-gray-50
              focus:outline-none focus-visible:ring-2 focus-visible:ring-black
              w-full xs:w-auto
            "
            aria-label={submitLabel}
          >
            {submitLabel}
          </button>

          {hasValidate && (
            <button
              type="button"
              onClick={onValidate}
              className="
                inline-flex items-center justify-center
                rounded-lg bg-black text-white
                px-4 py-2 text-sm font-medium
                hover:bg-gray-800
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black
                w-full xs:w-auto
              "
              aria-label={validateLabel}
            >
              {validateLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
