import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, Home, Stethoscope, Building2, BookOpen } from "lucide-react";

const tabs = [
  { label: "Présentation", path: "/", icon: Home },
  { label: "Formulaire", path: "/formulaire", icon: ClipboardList },
  { label: "Prise en charge", path: "/prise-en-charge", icon: Stethoscope },
  { label: "Suivi en ville", path: "/en-ville", icon: Building2 },
  { label: "Références", path: "/references", icon: BookOpen },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        {/* Ligne supérieure avec le titre */}
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-semibold">Outil gériatrique</h1>
          <span className="hidden text-xs text-gray-500 md:block">
            Prototype visuel — Données non sauvegardées côté serveur
          </span>
        </div>

        {/* Onglets de navigation */}
        <nav className="flex gap-1 md:gap-3 border-t pt-2">
          {tabs.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + "/");
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-2 rounded-t-xl border-b-2 px-3 py-2 text-sm font-medium transition",
                  active
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
