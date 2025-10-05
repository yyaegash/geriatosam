import { motion } from "framer-motion";

export default function EnVille() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl p-8"
    >
      <h2 className="text-xl font-semibold mb-3">Prise en charge en ville</h2>
      <p className="text-gray-600 text-sm leading-relaxed">
        Informations et orientations destinées à la coordination entre les soins
        hospitaliers et les intervenants à domicile.
      </p>
    </motion.div>
  );
}
