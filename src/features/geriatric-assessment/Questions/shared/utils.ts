/**
 * Utilitaires communs pour le parsing et la normalisation des formulaires CSV
 */

export type Option = {
  label: string;
  score?: number;
};

/**
 * Supprime les accents et diacritiques d'une chaîne
 */
export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normalise une chaîne pour les comparaisons (supprime accents, minuscules, trim)
 */
export function norm(s: string): string {
  return stripDiacritics(String(s)).trim().toLowerCase();
}

/**
 * Parse une liste délimitée par | ou \n
 */
export function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Parse les options d'une question avec support des scores
 * @param raw Chaîne brute des options
 * @param hideNon Si true, filtre les options "Non"
 */
export function parseChoices(raw?: string, hideNon = true): {
  shown: Option[];
  raw: Option[];
} {
  if (!raw) return { shown: [], raw: [] };

  const all: Option[] = raw
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?):\s*([0-9]+(?:[.,][0-9]+)?)\s*$/);
      if (m) {
        return {
          label: m[1].trim(),
          score: Number(m[2].replace(",", "."))
        };
      }
      return { label: line, score: undefined };
    });

  const shown = hideNon ? all.filter((o) => norm(o.label) !== "non") : all;
  return { shown, raw: all };
}

/**
 * Génère un ID unique pour une question
 */
export function normalizeId(section: string, label: string, pos: number): string {
  const prefix = section ? norm(section) : "unknown";
  return `${prefix}.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;
}

/**
 * Détermine si une réponse équivaut à "Non"
 */
export function isNoAnswer(val?: string): boolean {
  return !!val && norm(val) === "non";
}

/**
 * Détecte automatiquement le délimiteur CSV
 */
export function detectCsvDelimiter(csvText: string): string {
  // Recherche de patterns typiques dans les headers
  if (csvText.includes(';Group;Section;') || csvText.includes(';Question;')) {
    return ';';
  }
  if (csvText.includes(',Group,Section,') || csvText.includes(',Question,')) {
    return ',';
  }
  // Par défaut, essaie de détecter par fréquence
  const semicolonCount = (csvText.match(/;/g) || []).length;
  const commaCount = (csvText.match(/,/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Calcule une couleur basée sur une question de qualité
 */
export function calculateQualityColor(
  questions: Array<{ id: string; label: string; role?: string; rawOptions?: Option[] }>,
  answers: Record<string, string>,
  qualityQuestionPattern = "qualité de la prise en charge"
): "green" | "orange" | "red" | "grey" {
  const qualityQuestion = questions.find((q) =>
    norm(q.label).includes(norm(qualityQuestionPattern))
  );

  if (qualityQuestion) {
    // Utilise getEffectiveAnswer si rawOptions est disponible
    const selected = qualityQuestion.rawOptions
      ? getEffectiveAnswer(qualityQuestion.rawOptions, answers[qualityQuestion.id])
      : answers[qualityQuestion.id];

    if (selected) {
      const vNorm = norm(selected);
      if (vNorm.includes("bonne")) return "green";
      if (vNorm.includes("partielle")) return "orange";
      if (vNorm.includes("insuffisante")) return "red";
    }
  }

  return "grey";
}

/**
 * Gère les réponses avec "Non" implicite pour les questions binaires
 */
export function getEffectiveAnswer(
  rawOptions: Option[],
  value?: string
): string | undefined {
  if (value?.trim()) return value;

  const hasOui = rawOptions.some((o) => norm(o.label) === "oui");
  const hasNon = rawOptions.some((o) => norm(o.label) === "non");

  if (hasOui && hasNon) return "Non";
  return undefined;
}