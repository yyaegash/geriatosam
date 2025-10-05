import { Routes, Route, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

import Header from "./components/Header";
import Presentation from "./pages/Presentation";
import FormulaireIndex from "./pages/Formulaire/Index";
import PriseEnCharge from "./pages/PriseEnCharge";
import EnVille from "./pages/EnVille";
import References from "./pages/References";

export default function App() {
  const location = useLocation();

  // Scroll en haut lors du changement de page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
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
              <Route path="/formulaire/*" element={<FormulaireIndex />} />
              <Route path="/prise-en-charge" element={<PriseEnCharge />} />
              <Route path="/en-ville" element={<EnVille />} />
              <Route path="/references" element={<References />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pied de page */}
      <footer className="text-center text-xs text-gray-400 py-6 border-t">
        © {new Date().getFullYear()} Outil gériatrique — Prototype visuel
      </footer>
    </div>
  );
}
