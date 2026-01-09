import { VerticalTabs } from "@/components/VerticalTabs";
import { FORM_CATEGORIES } from "@/data/questions";

interface NavigationSidebarProps {
  /** Catégorie active */
  activeCategory: string;

  /** Handler pour changer de catégorie */
  onCategoryChange: (category: string) => void;

  /** Onglet actif dans la section courante */
  activeFragTab: string;

  /** Handler pour changer d'onglet dans la section courante */
  onFragTabChange: (tab: string) => void;

  /** Liste des onglets disponibles pour la section courante */
  dynamicSubtabs: string[];

  /** Si la section courante a des sous-onglets */
  hasSubtabs: boolean;

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
  dynamicSubtabs,
  hasSubtabs,
  isMobile = false
}: NavigationSidebarProps) {

  if (isMobile) {
    return (
      <div className="space-y-2">
        <VerticalTabs
          title="Sections"
          items={[...FORM_CATEGORIES]}
          active={activeCategory}
          onSelect={onCategoryChange}
        />
        {hasSubtabs && (
          <VerticalTabs
            title={`${activeCategory} — catégories`}
            items={[...dynamicSubtabs]}
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
        />
      </aside>

      {/* Sous-sections dynamiques */}
      <aside>
        {hasSubtabs ? (
          <VerticalTabs
            items={[...dynamicSubtabs]}
            active={activeFragTab}
            onSelect={onFragTabChange}
          />
        ) : (
          <div className="text-sm text-gray-500 px-1 pt-1">—</div>
        )}
      </aside>
    </>
  );
}