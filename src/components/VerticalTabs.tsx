import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  items: string[];
  active: string;
  onSelect: (key: string) => void;
}

export function VerticalTabs({ items, active, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2">
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
  );
}
