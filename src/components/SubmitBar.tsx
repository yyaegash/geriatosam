import React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

/** Calcule left/width à partir d’un ref d’ancrage (optionnel & safe) */
function useAnchorBox(anchorRef?: React.RefObject<HTMLElement>) {
  const [state, setState] = React.useState<{ left: number; width: number; ready: boolean }>({
    left: 16,
    width: 360,
    ready: false,
  });

  React.useEffect(() => {
    if (!anchorRef?.current) return;

    const update = () => {
      const el = anchorRef.current!;
      const rect = el.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const width = rect.width;
      setState({ left, width, ready: true });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(anchorRef.current);

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  return state;
}

/** Détermine le décalage bottom pour rester au-dessus du footer quand il apparaît */
function useFooterBottomOffset(margin = 16) {
  const [bottom, setBottom] = React.useState(margin);

  React.useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) return setBottom(margin);

      const rect = footer.getBoundingClientRect();
      // Chevauchement du footer dans la fenêtre (si > 0, il est visible)
      const overlap = window.innerHeight - rect.top;
      setBottom(overlap > 0 ? overlap + margin : margin);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    // si le footer change de taille (ex: responsive), on réajuste
    const footer = document.querySelector("footer");
    let ro: ResizeObserver | undefined;
    if (footer) {
      ro = new ResizeObserver(update);
      ro.observe(footer);
    }

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [margin]);

  return bottom;
}

interface Props {
  onSubmit: () => void;
  /** Élément d’ancrage (le <section> qui contient le formulaire). Optionnel. */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function SubmitBar({ onSubmit, anchorRef }: Props) {
  const { left, width, ready } = useAnchorBox(anchorRef);
  const bottom = useFooterBottomOffset(16);

  // largeur : pleine largeur du panneau si étroit, sinon compact
  const maxCompact = 520;
  const barWidth = Math.max(240, Math.min(ready ? width : 360, maxCompact));

  return (
    <div
      style={{
        position: "fixed",
        left: ready ? left : 16, // aligné sur le bord gauche du panneau
        bottom,                   // se décale automatiquement au-dessus du footer
        width: barWidth,
        zIndex: 50,
      }}
      className="pointer-events-auto"
    >
      <div className="flex w-full items-center gap-3 rounded-2xl border bg-white/95 px-3 py-2 shadow-xl">
        <p className="hidden sm:block text-xs text-gray-600">
          Vous pouvez valider à tout moment.
        </p>
        <Button onClick={onSubmit} size="lg" className="h-10">
          <Send size={16} className="mr-2" />
          Soumettre
        </Button>
      </div>
    </div>
  );
}
