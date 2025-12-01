import React from "react";

export interface DepResults {
  adlScore: number;
  adlMax: number;
  iadlScore: number;
  iadlMax: number;
  report: {
    reperage: string[];
    proposition: string[];
  };
}

interface DepOverlayProps {
  results: DepResults | null;
  onClose: () => void;
  onValidate: () => void;
}

const DepOverlay: React.FC<DepOverlayProps> = ({ results, onClose, onValidate }) => {
  if (!results) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold">Synthèse — Dépendance</h3>
          <p className="text-xs text-gray-500">Scores ADL / IADL et rapport.</p>
        </div>

        <div className="p-4 space-y-6">
          {[
            { label: "ADL", score: results.adlScore, max: results.adlMax },
            { label: "IADL", score: results.iadlScore, max: results.iadlMax },
          ].map(({ label, score, max }) => {
            const pct = Math.round((Math.max(0, Math.min(max, score)) / max) * 100);

            return (
              <div key={label}>
                <div className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{label}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, backgroundColor: "#111827" }} />
                  </div>
                  <div className="w-16 text-sm text-right">{score} / {max}</div>
                </div>
              </div>
            );
          })}

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
              {results.report.reperage.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {results.report.reperage.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              ) : <p className="text-xs text-gray-500">Aucun élément.</p>}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
              {results.report.proposition.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {results.report.proposition.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              ) : <p className="text-xs text-gray-500">Aucune proposition.</p>}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50" onClick={onClose}>
            Fermer
          </button>
          <button className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800" onClick={onValidate}>
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepOverlay;
