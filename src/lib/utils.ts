import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine et fusionne intelligemment des classes Tailwind.
 * Exemple :
 * cn("p-2", condition && "bg-gray-100")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
