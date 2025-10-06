import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  items: string[];
  active: string;
  onSelect: (key: string) => void;
  title?: string;
}

export function VerticalTabs({ items, active, onSelect, title }: Props) {
  return (
    <>
      {/* Mobile: pills horizontaux sticky sous le header */}
      <div className="md:hidden sticky top-16 z-20 -mx-4 border-b bg-white/90 backdrop-blur px-4 py-2">
        {title && <div className="text-xs font-semibold text-gray-500 mb-1">{title}</div>}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {items.map((item) => {
            const isActive = active === item;
            return (
              <button
                key={item}
                onClick={() => onSelect(item)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                  isActive ? "bg-black text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tablette/Desktop: liste verticale */}
      <div className="hidden md:flex flex-col gap-2">
        {title && <div className="text-xs font-semibold text-gray-500 mb-1">{title}</div>}
        {items.map((item) => {
          const isActive = active === item;
          return (
            <motion.button
              key={item}
              onClick={() => onSelect(item)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full text-left rounded-xl border border-gray-300 px-4 py-2 text-sm transition",
                isActive ? "bg-black text-white shadow-sm" : "hover:bg-gray-50 text-gray-700"
              )}
            >
              {item}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
