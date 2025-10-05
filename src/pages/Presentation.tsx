import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";

export default function Presentation() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border bg-white p-8 shadow-sm"
      >
        <h2 className="text-2xl font-semibold mb-3">Bienvenue dans l’Outil gériatrique</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Cet outil a pour objectif de faciliter l’évaluation gériatrique globale,
          le repérage de la fragilité et l’aide à la prise en charge des situations complexes,
          aussi bien à l’hôpital qu’en ville.
        </p>

        <p className="text-gray-600 mb-6">
          Vous pouvez naviguer via les onglets supérieurs, ou commencer directement une évaluation complète
          à l’aide du formulaire structuré par thématiques.
        </p>

        <Button
          onClick={() => navigate("/formulaire")}
          className="flex items-center gap-2 text-base px-5 py-3"
        >
          <ClipboardList size={18} />
          Commencer l’évaluation
        </Button>
      </motion.div>
    </div>
  );
}
