import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, Home, Stethoscope, Building2, BookOpen } from "lucide-react";

const tabs = [
  { label: "Présentation", path: "/", icon: Home },
  { label: "Evaluation gériatrique globale", path: "/formulaire", icon: ClipboardList },
  { label: "Aide à la consultation", path: "/prise-en-charge", icon: Stethoscope },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-lg md:text-xl font-semibold">Outil gériatrique</h1>
          <span className="hidden md:block text-xs text-gray-500">
            Prototype visuel — Données locales
          </span>
        </div>

        {/* Nav scrollable sur mobile */}
        <nav className="border-t pt-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 md:gap-3 min-w-max">
            {tabs.map(({ label, path, icon: Icon }) => {
              const active = location.pathname === path || location.pathname.startsWith(path + "/");
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2 rounded-t-xl border-b-2 px-3 md:px-4 py-2 text-sm md:text-[0.95rem] font-medium transition",
                    active
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={16} />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
