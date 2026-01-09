import React from "react";

export interface AideResult {
  freq: { question: string; answer: string }[];
  other: { question: string; answer: string }[];
}

interface HelpOverlayProps {
  results: AideResult | null;
  onClose: () => void;
  onValidate: () => void;
}

const HelpOverlay: React.FC<HelpOverlayProps> = ({ results, onClose, onValidate }) => {
  if (!results) return null;

  const combined = [
    ...results.freq.map((r) => ({ ...r, _freq: true })),
    ...results.other.map((r) => ({ ...r, _freq: false })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold">Récapitulatif — Aide en place et fréquence</h3>
          <p className="text-xs text-gray-500">Synthèse de vos réponses.</p>
        </div>

        <div className="p-4">
          {combined.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune réponse à afficher.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {combined.map((item, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-medium text-sm sm:text-base">{item.question}</span>
                    <span className="inline-block px-2.5 py-1 text-xs text-gray-800">{item.answer}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={onClose}>
            Fermer
          </button>
          <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={onValidate}>
            Valider et effacer
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
