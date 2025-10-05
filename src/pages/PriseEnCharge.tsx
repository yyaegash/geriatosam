import { motion } from "framer-motion";

export default function PriseEnCharge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl p-8"
    >
      <h2 className="text-xl font-semibold mb-3">Aide à la prise en charge</h2>
      <p className="text-gray-600 text-sm leading-relaxed">
        Cette section contiendra les recommandations et les protocoles relatifs
        à la prise en charge gériatrique en établissement.
      </p>
    </motion.div>
  );
}
