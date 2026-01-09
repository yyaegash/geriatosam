import { VerticalTabs } from "@/components/VerticalTabs";
import { FORM_CATEGORIES } from "@/data/questions";

interface NavigationSidebarProps {
  /** Catégorie active */
  activeCategory: string;

  /** Handler pour changer de catégorie */
  onCategoryChange: (category: string) => void;

  /** Onglet de fragilité actif */
  activeFragTab: string;

  /** Handler pour changer d'onglet fragilité */
  onFragTabChange: (tab: string) => void;

  /** Liste des onglets de fragilité disponibles */
  dynamicFragSubtabs: string[];

  /** Si c'est la vue mobile (stacked) */
  isMobile?: boolean;
}

/**
 * Composant de navigation pour les sections et sous-sections des formulaires
 * Gère l'affichage desktop (sidebar) et mobile (stacked)
 */
export function NavigationSidebar({
  activeCategory,
  onCategoryChange,
  activeFragTab,
  onFragTabChange,
  dynamicFragSubtabs,
  isMobile = false
}: NavigationSidebarProps) {
  const isFragilite = activeCategory === "Fragilité";

  if (isMobile) {
    return (
      <div className="space-y-2">
        <VerticalTabs
          title="Sections"
          items={[...FORM_CATEGORIES]}
          active={activeCategory}
          onSelect={onCategoryChange}
        />
        {isFragilite && (
          <VerticalTabs
            title="Fragilité — catégories"
            items={[...dynamicFragSubtabs]}
            active={activeFragTab}
            onSelect={onFragTabChange}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Sections principales */}
      <aside>
        <VerticalTabs
          items={[...FORM_CATEGORIES]}
          active={activeCategory}
          onSelect={onCategoryChange}
          title="Sections"
        />
      </aside>

      {/* Sous-sections Fragilité */}
      <aside>
        {isFragilite ? (
          <VerticalTabs
            items={[...dynamicFragSubtabs]}
            active={activeFragTab}
            onSelect={onFragTabChange}
            title="Fragilité — catégories"
          />
        ) : (
          <div className="text-sm text-gray-500 px-1 pt-1">—</div>
        )}
      </aside>
    </>
  );
}