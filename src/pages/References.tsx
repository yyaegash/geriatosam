import { motion } from "framer-motion";

export default function References() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl p-8"
    >
      <h2 className="text-xl font-semibold mb-3">Références</h2>
      <ul className="list-disc list-inside text-sm text-gray-600">
        <li>Haute Autorité de Santé (HAS) – Évaluation gériatrique globale.</li>
        <li>OMS – Bonnes pratiques du vieillissement en santé.</li>
        <li>Collège National de Gériatrie – Protocoles de fragilité.</li>
      </ul>
    </motion.div>
  );
}
