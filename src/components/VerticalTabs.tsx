import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Activity, FileText, Shield, Stethoscope, Zap } from "lucide-react";

interface Props {
  items: string[];
  active: string;
  onSelect: (key: string) => void;
  title?: string;
}

// Icônes pour chaque catégorie médicale
const getCategoryIcon = (category: string) => {
  if (category.includes('Fragilité')) return <Activity className="w-4 h-4" />;
  if (category.includes('médicaux')) return <Stethoscope className="w-4 h-4" />;
  if (category.includes('sociaux')) return <Shield className="w-4 h-4" />;
  if (category.includes('clinique')) return <FileText className="w-4 h-4" />;
  if (category.includes('biologique')) return <Zap className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

export function VerticalTabs({ items, active, onSelect, title }: Props) {
  return (
    <>
      {/* Mobile: pills horizontaux avec glassmorphism */}
      <div className="md:hidden sticky top-16 z-20 -mx-4 glass-effect border-b border-white/20 px-4 py-3">
        {title && (
          <div className="text-xs font-semibold mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span style={{ color: 'var(--color-medical-primary)' }}>{title}</span>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {items.map((item) => {
            const isActive = active === item;
            return (
              <motion.button
                key={item}
                onClick={() => onSelect(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium smooth-transition flex items-center gap-2 medical-focus",
                  isActive
                    ? "btn-medical-primary shadow-lg"
                    : "bg-white/80 backdrop-blur border border-white/30 text-gray-700 hover:bg-white hover:shadow-md"
                )}
              >
                {getCategoryIcon(item)}
                <span className="whitespace-nowrap">{item}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Desktop: liste verticale élégante */}
      <div className="hidden md:flex flex-col gap-3">
        {title && (
          <div className="text-xs font-bold mb-2 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span style={{ color: 'var(--color-medical-primary)' }}>{title}</span>
          </div>
        )}
        <div className="space-y-2">
          {items.map((item, index) => {
            const isActive = active === item;
            return (
              <motion.button
                key={item}
                onClick={() => onSelect(item)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{
                  scale: 1.02,
                  x: 4,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full text-left rounded-2xl px-5 py-4 text-sm font-medium smooth-transition flex items-center gap-3 medical-focus group",
                  isActive
                    ? "medical-container shadow-lg border-l-4 border-l-blue-500"
                    : "medical-container border-transparent hover:border-blue-200 hover:shadow-md"
                )}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--color-medical-primary) 0%, var(--color-medical-primary-dark) 100%)'
                    : 'var(--color-medical-surface)',
                  color: isActive ? 'white' : 'var(--color-medical-neutral)'
                }}
              >
                <div className={cn(
                  "transition-colors",
                  isActive ? "text-blue-100" : "text-blue-500 group-hover:text-blue-600"
                )}>
                  {getCategoryIcon(item)}
                </div>
                <span className={cn(
                  "flex-1 transition-colors",
                  isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
                )}>
                  {item}
                </span>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-white opacity-80"></div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
