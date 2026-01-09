import Papa from "papaparse";
import { CSV_VULNERABILITY_FORMS, CSV_MEDICAL_ISSUES_FORMS } from "@/data/forms.config";
import { normalizeId } from "../../Questions/shared/utils";
import { reconstructGenericFromCsv } from "./pdfBuilder";
import type {
  AideEnPlaceSummary,
  DependenceSummary,
  GenericSummary
} from "../../Questions";
import type {
  PdfPayload,
  FormHandles,
  ReconstructedAideData
} from "../types";

function tryGetFromStorage(...keys: string[]): Record<string, string> | null {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}
const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const norm = (s: string) => stripDiacritics(String(s)).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
const normLabel = (s: string) => stripDiacritics(s).trim().toLowerCase();

interface CsvRow {
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
}
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

function isNoAnswer(val?: string): boolean {
  return !!val && normLabel(val) === "non";
}

function normalizeAideId(label: string, pos: number): string {
  return `frag.aide.simple.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}


async function reconstructAideFromLocalStorage(): Promise<ReconstructedAideData | null> {
  try {
    const AIDE_CONFIG = CSV_VULNERABILITY_FORMS.find(f => f.component === "aide")!;
    const SECTION_NAME = AIDE_CONFIG.label;
    const csvPath = AIDE_CONFIG.path;

    const answers = tryGetFromStorage(
      AIDE_CONFIG.storageKey,
      "geriatrie_aide_en_place_simpleplus_v2",
      "geriatrie_aide_en_place_simpleplus_v1"
    );

    if (!answers || Object.keys(answers).length === 0) {
      return null;
    }

    // Utiliser csvImport si disponible, sinon fetch
    const text = AIDE_CONFIG.csvImport
      ? await AIDE_CONFIG.csvImport()
      : await fetch(csvPath, { cache: "no-store" }).then(response => response.text());

    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header, index) => header || `column_${index}`
    });
    const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

    const filtered = rows
      .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && normLabel(String(x)) === normLabel(SECTION_NAME)))
      .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

    const freq: Array<{ question: string; answer: string }> = [];
    const other: Array<{ question: string; answer: string }> = [];

    filtered.forEach((r) => {
      const pos = Number(r.QPos || 0);
      const roleRaw = (r.Role || "").trim().toLowerCase();
      const role = roleRaw === "freq" ? "freq" : roleRaw === "lock" ? "lock" : roleRaw === "color" ? "color" : "";

      const idStandard = normalizeId(SECTION_NAME, r.Question.trim(), pos);
      const idAide = normalizeAideId(r.Question.trim(), pos);
      const val = answers[idStandard] || answers[idAide];

      if (!val || isNoAnswer(val)) return;

      const row = { question: r.Question.trim(), answer: String(val) };
      if (role === "freq") {
        freq.push(row);
      } else if (role !== "lock") {
        other.push(row);
      }
    });

    return { freq, other };
  } catch (error) {
    console.error("Erreur lors de la reconstruction des données Aide en place:", error);
    return null;
  }
}

async function reconstructDependenceFromLocalStorage(): Promise<DependenceSummary | null> {
  const { reconstructGenericFromCsv } = await import("./pdfBuilder");

  const DEP_CONFIG = CSV_VULNERABILITY_FORMS.find(f => f.component === "dep")!;

  const answers = tryGetFromStorage(
    DEP_CONFIG.storageKey,
    "geriatrie_dependance_simpleplus_v1",
    "geriatrie_dependence_simpleplus_v1"
  );

  if (!answers || Object.keys(answers).length === 0) return null;

  try {
    // Utiliser csvImport si disponible, sinon fetch
    const text = DEP_CONFIG.csvImport
      ? await DEP_CONFIG.csvImport()
      : await fetch(DEP_CONFIG.path, { cache: "no-store" }).then(response => response.text());

    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header, index) => header || `column_${index}`
    });
    const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

    const filtered = rows
      .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && normLabel(String(x)) === normLabel(DEP_CONFIG.label)))
      .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

    let adlPenalty = 0;
    let iadlPenalty = 0;
    const reperageSet = new Set<string>();
    const propositionSet = new Set<string>();

    filtered.forEach((q) => {
      const pos = Number(q.QPos || 0);
      const questionNorm = norm(q.Question).replace(/[^a-z0-9]+/g, "-");
      const sectionNorm = norm(DEP_CONFIG.label);

      const isADL = norm(q.Section) === norm("ADL") || q.Question.toLowerCase().includes("autonomie pour");
      const isIADL = norm(q.Section) === norm("IADL") || ["téléphone", "courses", "repas", "ménage", "lessive", "transport", "médicament", "finance"]
        .some(keyword => q.Question.toLowerCase().includes(keyword));

      const possibleIds = [
        `${sectionNorm}.${String(pos).padStart(2, "0")}.${questionNorm}`,
        `dependance.${String(pos).padStart(2, "0")}.${questionNorm}`,
        `csv.${sectionNorm}.${String(pos).padStart(2, "0")}.${questionNorm}`
      ];

      if (isADL) {
        possibleIds.push(`adl.${String(pos).padStart(2, "0")}.${questionNorm}`);
      }
      if (isIADL) {
        possibleIds.push(`iadl.${String(pos).padStart(2, "0")}.${questionNorm}`);
      }

      let val: string | undefined;
      for (const id of possibleIds) {
        val = answers[id];
        if (val) break;
      }

      if (!val || isNoAnswer(val)) return;

      const choices = parseChoices(q.Options);
      const found = choices.find(ch => normLabel(ch.label) === normLabel(val));
      if (found?.score !== undefined) {
        if (isADL) {
          adlPenalty += found.score;
        } else if (isIADL) {
          iadlPenalty += found.score;
        }
      }

      const triggerReportOn = q.TriggerReportOn ? parseList(q.TriggerReportOn) : [];
      const shouldTrigger = triggerReportOn.length === 0 || triggerReportOn.some(trigger =>
        normLabel(trigger) === normLabel(val)
      );

      if (shouldTrigger) {
        const surveillance = parseList(q.Surveillance);
        const actions = parseList(q.Actions);

        surveillance.forEach(s => reperageSet.add(s.trim()));
        actions.forEach(a => propositionSet.add(a.trim()));
      }
    });

    const ADL_MAX = 6;
    const IADL_MAX = 8;

    const adlScore = Math.max(0, Math.min(ADL_MAX, ADL_MAX - adlPenalty));
    const iadlScore = Math.max(0, Math.min(IADL_MAX, IADL_MAX - iadlPenalty));

    let dependanceScore = 0;
    if (adlScore <= 5.5) dependanceScore = 50;
    if (adlScore <= 5 && iadlScore <= 6) dependanceScore = 100;

    let color: "green" | "orange" | "red" | "grey" = "grey";
    const qualityQuestion = filtered.find(q =>
      norm(q.Question).includes(norm("qualité de la prise en charge actuelle"))
    );
    if (qualityQuestion) {
      const qId = `dependance.${String(qualityQuestion.QPos).padStart(2, "0")}.${norm(qualityQuestion.Question).replace(/[^a-z0-9]+/g, "-")}`;
      const qualityAnswer = answers[qId];
      if (qualityAnswer) {
        const vNorm = normLabel(qualityAnswer);
        if (vNorm.includes("bonne")) color = "green";
        else if (vNorm.includes("partielle")) color = "orange";
        else if (vNorm.includes("insuffisante")) color = "red";
      }
    }

    return {
      kind: "dependence",
      adlScore,
      adlMax: ADL_MAX,
      iadlScore,
      iadlMax: IADL_MAX,
      dependanceScore,
      color,
      report: {
        reperage: Array.from(reperageSet),
        proposition: Array.from(propositionSet)
      }
    };

  } catch (error) {
    console.error("Erreur lors de la reconstruction de la dépendance:", error);
    return null;
  }
}


export async function buildPdfPayload({
  aideRef,
  depRef,
  genericRef,
  currentCsvKey,
}: FormHandles): Promise<PdfPayload> {
  let aidePayload: { rows: Array<{ question: string; answer: string }> } | undefined;

  const aideSum = aideRef.current?.buildSummary?.();
  if (aideSum) {
    aidePayload = { rows: [...aideSum.freq, ...aideSum.other] };
  } else {
    const reconstructed = await reconstructAideFromLocalStorage();
    if (reconstructed) {
      aidePayload = { rows: [...reconstructed.freq, ...reconstructed.other] };
    }
  }

  let dep: DependenceSummary | null = null;
  const depSum = depRef.current?.buildSummary?.();
  if (depSum) {
    dep = depSum as DependenceSummary;
  } else {
    dep = await reconstructDependenceFromLocalStorage();
  }

  const genericPayload: Array<{ label: string; summary: GenericSummary }> = [];

  // Traiter les formulaires de vulnérabilité et de problèmes médicaux
  const allGenericForms = [
    ...CSV_VULNERABILITY_FORMS.filter(f => f.component === "generic-generic"),
    ...CSV_MEDICAL_ISSUES_FORMS.filter(f => f.component === "generic-generic")
  ];

  for (const entry of allGenericForms) {

    const storageKey = entry.storageKey;
    let summary: GenericSummary | null = null;

    if (currentCsvKey === entry.key && genericRef.current?.buildSummary) {
      const fromRef = genericRef.current.buildSummary();
      if (fromRef && fromRef.kind === "generic") {
        summary = fromRef;
      }
    }

    if (!summary) {
      const rebuilt = await reconstructGenericFromCsv(entry);
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