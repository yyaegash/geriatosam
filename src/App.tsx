import { Routes, Route, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import Header from "./components/Header";
import Presentation from "./pages/Presentation";
import GeriatricAssessment from "./pages/GeriatricAssessment";
import ConsultationAssistance from "./pages/ConsultationAssistance";

export default function App() {
  const location = useLocation();

  // Scroll en haut lors du changement de page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col text-gray-900" style={{ backgroundColor: 'var(--color-medical-bg)' }}>
      {/* Barre de navigation */}
      <Header />

      {/* Contenu avec animation de transition */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Presentation />} />
              <Route path="/formulaire/*" element={<GeriatricAssessment />} />
              <Route path="/aide-a-la-consulation" element={<ConsultationAssistance />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pied de page médical */}
      <footer className="text-center text-xs py-6 border-t medical-container mx-4 mb-4 rounded-2xl" style={{ borderColor: 'var(--color-medical-border)', color: 'var(--color-medical-neutral)' }}>
        © {new Date().getFullYear()} Évaluation Gériatrique
      </footer>
    </div>
  );
}
