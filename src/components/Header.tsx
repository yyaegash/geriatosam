import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, Home, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { label: "Présentation", path: "/", icon: Home },
  { label: "Evaluation gériatrique globale", path: "/formulaire", icon: ClipboardList },
  { label: "Aide à la consultation", path: "/aide-a-la-consultation", icon: Stethoscope },
];

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 w-full glass-effect border-b" style={{ borderColor: 'var(--color-medical-border)' }}>
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Navigation médicale */}
        <nav className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 md:gap-4 min-w-max justify-center md:justify-start">
            {tabs.map(({ label, path, icon: Icon }, index) => {
              const active = location.pathname === path || location.pathname.startsWith(path + "/");
              return (
                <motion.div
                  key={path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={path}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 rounded-2xl font-medium smooth-transition medical-focus group relative",
                      active
                        ? "medical-container shadow-lg text-white"
                        : "hover:bg-white/50 text-slate-700 hover:shadow-sm"
                    )}
                    style={active ? {
                      background: 'linear-gradient(135deg, var(--color-medical-primary) 0%, var(--color-medical-primary-dark) 100%)'
                    } : {}}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        "transition-colors",
                        active ? "text-blue-100" : "text-blue-500 group-hover:text-blue-600"
                      )}
                    />
                    <span className="whitespace-nowrap text-sm md:text-base">
                      {label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="active-tab"
                        className="absolute inset-0 border-2 border-white/20 rounded-2xl"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
