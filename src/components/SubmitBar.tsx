import React from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

// ---------- Types
type AnchorRef = React.RefObject<HTMLElement | null>;

// ---------- Hooks
/** Compute left/width from an anchor ref (safe & optional). */
function useAnchorBox(anchorRef?: AnchorRef) {
  const [state, setState] = React.useState<{ left: number; width: number; ready: boolean }>({
    left: 16,
    width: 360,
    ready: false,
  });

  React.useEffect(() => {
    if (!anchorRef?.current) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const left = rect.left + window.scrollX;
      const width = rect.width;
      setState({ left, width, ready: true });
    };

    update();

    const ro = new ResizeObserver(() => update());
    // cast is safe because we check el exists above
    ro.observe(anchorRef.current as Element);

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

/** Keep the bar above the footer when it enters the viewport. */
function useFooterBottomOffset(margin = 16) {
  const [bottom, setBottom] = React.useState(margin);

  React.useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      if (!footer) return setBottom(margin);
      const rect = footer.getBoundingClientRect();
      const overlap = window.innerHeight - rect.top;
      setBottom(overlap > 0 ? overlap + margin : margin);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

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

// ---------- Component
interface Props {
  onSubmit: () => void;
  /** Anchor element (the <section> that contains the form). Optional. */
  anchorRef?: AnchorRef;
}

/**
 * Fixed submit bar:
 * - always visible
 * - aligns with the LEFT edge of the form panel
 * - responsive width (full panel if narrow, compact otherwise)
 * - never overlaps the footer
 */
export function SubmitBar({ onSubmit, anchorRef }: Props) {
  const { left, width, ready } = useAnchorBox(anchorRef);
  const bottom = useFooterBottomOffset(16);

  const maxCompact = 520; // px
  const barWidth = Math.max(240, Math.min(ready ? width : 360, maxCompact));

  return (
    <div
      style={{
        position: "fixed",
        left: ready ? left : 16,
        bottom,
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
