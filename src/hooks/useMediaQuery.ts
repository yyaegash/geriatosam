import { useMemo, useState } from "react";

/**
 * Hook personnalisé pour réagir aux changements de media queries
 * Utilise matchMedia pour détecter les breakpoints CSS
 */
export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(false);

  useMemo(() => {
    const mediaQuery = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatch(e.matches);

    // Définir l'état initial
    setMatch(mediaQuery.matches);

    // Écouter les changements
    mediaQuery.addEventListener("change", listener);

    // Cleanup
    return () => mediaQuery.removeEventListener("change", listener);
  }, [query]);

  return match;
}

/**
 * Hooks pré-configurés pour les breakpoints courants
 */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsMdUp = () => useMediaQuery("(min-width: 768px)");