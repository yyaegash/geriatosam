import type { AideEnPlaceHandle, SummaryRow } from "../../pages/Forms/Questions/AideEnPlaceCsv";
import type { DependenceHandle, DependenceSummary } from "../../pages/Forms/Questions/DependenceCsv";
import type { GenericCsvFormHandle, GenericSummary } from "../../pages/Forms/Questions/GenericCsvForm";
import { CSV_VULNERABILITY_FORMS } from "../../pages/Forms/GeriatricAssessment/Vulnerability";
import { reconstructGenericFromCsv } from "./ExportGeriatricPdf";
import type { PdfPayload } from "./ExportGeriatricPdf";
import Papa from "papaparse";

// Helpers pour normaliser les labels comme dans exportGeriatricPdf
const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const norm = (s: string) =>
  stripDiacritics(String(s)).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

const normLabel = (s: string) =>
  stripDiacritics(s).trim().toLowerCase();

type CsvRow = {
  Group?: string;
  Section?: string;
  QPos?: string | number;
  Question: string;
  Type?: string;
  Options?: string;
  Role?: string;
  TriggerOn?: string;
  TriggerReportOn?: string;
  Surveillance?: string;
  Actions?: string;
};

function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw.replace(/\r\n/g, "\n").split(/\n|\|/g).map((t) => t.trim()).filter(Boolean);
}

function parseChoices(raw?: string): Array<{ label: string; score?: number }> {
  if (!raw) return [];
  const all = raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+)\s*$/);
      if (m) return { label: m[1].trim(), score: Number(m[2]) };
      return { label: line, score: undefined };
    });
  return all.filter((o) => normLabel(o.label) !== "non");
}

function isNoAnswer(val?: string) {
  return !!val && normLabel(val) === "non";
}

function normalizeAideId(label: string, pos: number) {
  return `frag.aide.simple.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}

/** Reconstitue les données "Aide en place" depuis localStorage + CSV */
async function reconstructAideFromLocalStorage(): Promise<{ freq: SummaryRow[]; other: SummaryRow[] } | null> {
  try {
    const STORAGE_KEY = "geriatrie_aide_en_place_simpleplus_v2";
    const SECTION_NAME = "Aide en place et fréquence";
    const csvPath = "/aide_en_place.csv";

    // Récupérer les réponses depuis localStorage
    let answers: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      answers = raw ? JSON.parse(raw) : {};
    } catch {
      return null;
    }

    // Si aucune donnée sauvegardée, pas de résultat
    if (Object.keys(answers).length === 0) {
      return null;
    }

    // Charger le CSV pour obtenir la structure des questions
    const r = await fetch(csvPath, { cache: "no-store" });
    if (!r.ok) return null;
    const text = await r.text();

    const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
    const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

    const filtered = rows
      .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && normLabel(String(x)) === normLabel(SECTION_NAME)))
      .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

    const freq: SummaryRow[] = [];
    const other: SummaryRow[] = [];

    filtered.forEach((r) => {
      const pos = Number(r.QPos || 0);
      const roleRaw = (r.Role || "").trim().toLowerCase();
      const role = roleRaw === "freq" ? "freq" : roleRaw === "lock" ? "lock" : roleRaw === "color" ? "color" : "";

      const id = normalizeAideId(r.Question.trim(), pos);
      const val = answers[id];

      if (!val || isNoAnswer(val)) return;

      const row = { question: r.Question.trim(), answer: String(val) };
      if (role === "freq") {
        freq.push(row);
      } else if (role !== "lock") { // on n'affiche pas la question de lock
        other.push(row);
      }
    });

    return { freq, other };
  } catch (error) {
    console.error("Erreur lors de la reconstruction des données Aide en place:", error);
    return null;
  }
}

type Handles = {
  aideRef: React.RefObject<AideEnPlaceHandle | null>;
  depRef: React.RefObject<DependenceHandle | null>;
  genericRef: React.RefObject<GenericCsvFormHandle | null>;
  currentCsvKey?: string;
};

export async function BuildGeriatriePdfPayload({
  aideRef,
  depRef,
  genericRef,
  currentCsvKey,
}: Handles): Promise<PdfPayload> {
  // 1) Aide - essayer d'abord le ref, puis reconstruire depuis localStorage
  let aidePayload: { rows: SummaryRow[] } | undefined;

  const aideSum = aideRef.current?.buildSummary?.();
  if (aideSum) {
    aidePayload = { rows: [...aideSum.freq, ...aideSum.other] as SummaryRow[] };
  } else {
    // Tenter de reconstruire depuis localStorage
    const reconstructed = await reconstructAideFromLocalStorage();
    if (reconstructed) {
      aidePayload = { rows: [...reconstructed.freq, ...reconstructed.other] as SummaryRow[] };
    }
  }

  // 2) Dépendance
  const dep = (depRef.current?.buildSummary?.() || null) as DependenceSummary | null;

  // 3) Tous les GenericCsvForm (mode "generic")
  const genericPayload: Array<{ label: string; summary: GenericSummary }> = [];

  for (const entry of CSV_VULNERABILITY_FORMS) {
    if (entry.component !== "generic-generic") continue;

    // 🔑 Clé de stockage identique à GenericCsvForm :
    // - si entry.storageKey est défini, on le respecte
    // - sinon on dérive depuis le label
    const storageKey =
      entry.storageKey || `csv.${norm(entry.label)}`;

    let summary: GenericSummary | null = null;

    // a) Si l'onglet courant correspond à cette entrée et que le ref est monté,
    //    on utilise buildSummary (données les plus fraîches)
    if (currentCsvKey === entry.key && genericRef.current?.buildSummary) {
      const fromRef = genericRef.current.buildSummary();
      if (fromRef && fromRef.kind === "generic") {
        summary = fromRef;
      }
    }

    // b) Sinon (ou si le ref n’a rien), on reconstruit depuis CSV + localStorage
    if (!summary) {
      const rebuilt = await reconstructGenericFromCsv(
        entry.label,
        entry.path,
        storageKey
      );
      if (rebuilt && rebuilt.kind === "generic") {
        summary = rebuilt;
      }
    }

    if (summary) {
      genericPayload.push({ label: entry.label, summary });
    }
  }

  return {
    aide: aidePayload,
    dependence: dep,
    generics: genericPayload,
  };
}
