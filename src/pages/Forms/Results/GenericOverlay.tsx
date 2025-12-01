import React from "react";

export interface GenericCsvReport {
  reperage: string[];
  proposition: string[];
}

export interface GenericCsvResults {
  kind: "generic";
  score: number;
  color: "green" | "orange" | "red" | string;
  report: GenericCsvReport;
}

export interface CsvFormInfo {
  label: string;
}

interface GenericCsvOverlayProps {
  results: GenericCsvResults | null;
  currentCsvForm: CsvFormInfo | null;
  onClose: () => void;
  onValidate: () => void;
}

const GenericCsvOverlay: React.FC<GenericCsvOverlayProps> = ({
  results,
  currentCsvForm,
  onClose,
  onValidate,
}) => {
  if (!results || results.kind !== "generic") return null;

  const pct = Math.min(100, Math.max(0, results.score));

  const barColor =
    results.color === "green"
      ? "#16a34a"
      : results.color === "orange"
      ? "#f59e0b"
      : results.color === "red"
      ? "#dc2626"
      : "#9ca3af";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border overflow-hidden">

        {/* HEADER */}
        <div className="px-4 py-3 border-b">
          <h3 className="text-base font-semibold">
            Synthèse — {currentCsvForm?.label || "Formulaire"}
          </h3>
          <p className="text-xs text-gray-500">Score agrégé et rapport de prise en charge.</p>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-6">

          {/* SCORE BAR */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-gray-600">
                {currentCsvForm?.label || "Score"}
              </div>

              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              <div className="w-10 text-sm">{results.score}</div>
            </div>

            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* REPORT — 2 COLUMNS */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Col 1 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Repérage gériatrique</h4>
              {results.report.reperage.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {results.report.reperage.map((it, i) => (
                    <li key={`rep-${i}`}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Aucun élément.</p>
              )}
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Proposition de prise en charge</h4>
              {results.report.proposition.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {results.report.proposition.map((it, i) => (
                    <li key={`prop-${i}`}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Aucune proposition.</p>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            Fermer
          </button>

          <button
            className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
            onClick={onValidate}
          >
            Valider et effacer
          </button>
        </div>

      </div>
    </div>
  );
};

export default GenericCsvOverlay;
