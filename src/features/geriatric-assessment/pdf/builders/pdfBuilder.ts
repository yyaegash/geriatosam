import Papa from "papaparse";
import type { PdfPayload, HistoColor } from "../types";
import type { GenericSummary } from "../../Questions";

/* -------------------------------------------------
   Helpers normalisation & parsing
-------------------------------------------------- */
const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const norm = (s: string) =>
  stripDiacritics(String(s)).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

const normLabel = (s: string) =>
  stripDiacritics(s).trim().toLowerCase();

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

function tryGetFromStorageGeneric(...keys: string[]): Record<string, string> | null {
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

export async function reconstructGenericFromCsv(
  sectionName: string,
  csvPath: string,
  storageKey: string
): Promise<GenericSummary | null> {
  try {
    const csvName = csvPath.replace(/^\//, '').replace(/\.csv$/, '');
    const sectionNorm = norm(sectionName).replace(/-/g, '_');
    const csvNorm = csvName.replace(/[^a-zA-Z0-9]/g, '_');

    const answers = tryGetFromStorageGeneric(
      storageKey,
      `geriatrie_${sectionNorm}_simpleplus_v1`,
      `geriatrie_${csvNorm}_simpleplus_v1`,
      `geriatrie_${sectionNorm}_v1`,
      `geriatrie_${csvNorm}_v1`,
      `${sectionNorm}_v1`,
      `${csvNorm}_v1`,
      `geriatrie_${csvName}_simpleplus_v1`,
      `geriatrie.${csvName}.v1`,
      `geriatrie.form.${csvName}.v1`
    );

    if (!answers || Object.keys(answers).length === 0) return null;

    const response = await fetch(csvPath, { cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();

    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header, index) => header || `column_${index}`
    });
    const rows: CsvRow[] = (parsed.data || []) as CsvRow[];

    const filtered = rows
      .filter((r) => r && r.Question && [r.Section, r.Group].some((x) => x && normLabel(String(x)) === normLabel(sectionName)))
      .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

    let score = 0;
    let color: HistoColor = "grey";
    const reperage = new Set<string>();
    const proposition = new Set<string>();

    filtered.forEach((row) => {
      const pos = Number(row.QPos || 0);
      const questionNorm = norm(row.Question).replace(/[^a-z0-9]+/g, "-");
      const sectionNormalized = norm(sectionName);

      const sectionVariants = [
        sectionNormalized,
        norm(sectionName).replace(/-/g, ' '),
        stripDiacritics(sectionName).toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim(),
        norm(csvName),
        csvName.replace(/_/g, ' ')
      ];

      const possibleIds = [];
      for (const section of sectionVariants) {
        possibleIds.push(
          `${section}.${String(pos).padStart(2, "0")}.${questionNorm}`,
          `csv.${section}.${String(pos).padStart(2, "0")}.${questionNorm}`,
          `${section}.${pos}.${questionNorm}`,
          `csv.${section}.${pos}.${questionNorm}`
        );
      }

      let val: string | undefined;
      for (const id of possibleIds) {
        val = answers[id];
        if (val) break;
      }

      if (!val || isNoAnswer(val)) return;

      const vNorm = normLabel(val);
      const choices = parseChoices(row.Options);
      const found = choices.find((ch) => normLabel(ch.label) === vNorm);

      if (found?.score !== undefined) {
        score += found.score;
      }

      const surveillance = parseList(row.Surveillance);
      surveillance.forEach((s) => reperage.add(s.trim()));

      const actions = parseList(row.Actions);
      actions.forEach((a) => proposition.add(a.trim()));

      if (norm(String(row.Question)) === norm("Qualité de la prise en charge actuelle")) {
        if (vNorm === "bonne") color = "green";
        else if (vNorm === "partielle") color = "orange";
        else if (vNorm === "insuffisante") color = "red";
        else color = "grey";
      }
    });

    return {
      kind: "generic",
      score,
      color,
      report: { reperage: Array.from(reperage), proposition: Array.from(proposition) },
    };
  } catch {
    return null;
  }
}

export async function generateGeriatriePdf(payload: PdfPayload): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  const colGap = 24;
  const colW = (pageW - marginX * 2 - colGap) / 2;

  let y = marginY;
  const ensureSpace = (need: number) => {
    if (y + need > pageH - marginY) {
      doc.addPage();
      addPageHeader();
      y = marginY + 40;
    }
  };

  const addPageHeader = () => {
    const headerH = 32;
    doc.setFillColor("#f3f4f6");
    doc.rect(0, 0, pageW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Synthèse gériatrique", marginX, 20);
  };

  const addPageFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const footerText = `Page ${i}/${pageCount}`;
      const w = doc.getTextWidth(footerText);
      doc.setTextColor("#6b7280");
      doc.text(footerText, pageW - marginX - w, pageH - 24);
      doc.setTextColor("#000000");
    }
  };

  const sectionTitle = (title: string) => {
    ensureSpace(32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    // bande grise derrière le titre
    const textW = doc.getTextWidth(title);
    const boxH = 20;
    doc.setFillColor("#e5e7eb");
    doc.rect(marginX - 6, y - 12, textW + 12, boxH, "F");
    doc.setTextColor("#111827");
    doc.text(title, marginX, y + 2);
    doc.setTextColor("#000000");
    y += 24;
  };

  const sectionHeader = (left: string, right: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    ensureSpace(24);
    doc.text(left, marginX, y);
    doc.text(right, marginX + colW + colGap, y);
    y += 8;
    doc.setLineWidth(0.5);
    doc.setDrawColor("#d1d5db");
    doc.line(marginX, y, marginX + colW, y);
    doc.line(marginX + colW + colGap, y, marginX + colW * 2 + colGap, y);
    y += 8;
    doc.setDrawColor("#000000");
  };

  const getLines = (text: string): string[] => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const maxW = colW - 12;
    return doc.splitTextToSize(text, maxW) as string[];
  };

  const getTextHeight = (lines: string[]): number => {
    if (!lines.length) return 0;
    const fontSize = 10;
    const lineHeight = fontSize * 1.3;
    return lines.length * lineHeight;
  };

  addPageHeader();
  y += 16;

  doc.setDrawColor("#e5e7eb");
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageW - marginX, y);
  y += 16;
  doc.setDrawColor("#000000");
  if (payload.aide && payload.aide.rows.length) {
    const answeredRows = payload.aide.rows.filter(
      (r) => r.answer != null && String(r.answer).trim().length > 0
    );

    if (answeredRows.length) {
      sectionTitle("Aide en place et fréquence");

      for (const row of answeredRows) {
        const text = `${row.question} : ${String(row.answer).trim()}`;
        const lines = getLines(text);
        const rowHeight = getTextHeight(lines);

        ensureSpace(rowHeight + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("•", marginX, y + 14);
        doc.setFontSize(10);
        doc.text(lines, marginX + 10, y + 14);

        y += rowHeight + 8;
      }

      y += 24;
    }
  }


  const allFormsWithReport = [];

  for (const item of payload.generics) {
    if (item.summary.kind === "generic" && item.summary.report) {
      allFormsWithReport.push({
        label: item.label,
        report: item.summary.report
      });
    }
  }

  if (payload.dependence?.report &&
      (payload.dependence.report.reperage.length > 0 || payload.dependence.report.proposition.length > 0)) {
    allFormsWithReport.push({
      label: "Dépendance",
      report: payload.dependence.report
    });
  }

  const configOrder = ["Isolement", "Dépendance", "Habitation inadaptée", "Troubles neurocognitifs", "Troubles psychiques", "Troubles musculosquelettiques", "Dénutrition", "Troubles neurosensoriels", "Polypathologie", "Polymédication et traitement à risque"];

  allFormsWithReport.sort((a, b) => {
    const indexA = configOrder.indexOf(a.label);
    const indexB = configOrder.indexOf(b.label);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  allFormsWithReport.forEach(({ label, report }) => {
    const { reperage, proposition } = report;
    if (!reperage.length && !proposition.length) return;

    sectionTitle(label);
    sectionHeader("Repérage", "Proposition");

    const maxRows = Math.max(reperage.length, proposition.length);
    for (let i = 0; i < maxRows; i++) {
      const leftText = reperage[i] ?? "";
      const rightText = proposition[i] ?? "";

      const leftLines = leftText ? getLines(leftText) : [];
      const rightLines = rightText ? getLines(rightText) : [];
      const maxHeight = Math.max(getTextHeight(leftLines), getTextHeight(rightLines));

      ensureSpace(maxHeight + 12);

      if (leftLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("•", marginX, y + 14);
        doc.text(leftLines, marginX + 10, y + 14);
      }

      if (rightLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("•", marginX + colW + colGap, y + 14);
        doc.text(rightLines, marginX + colW + colGap + 10, y + 14);
      }

      y += maxHeight + 12;
    }

    y += 24;
  });


  const hasDependenceScore = payload.dependence && payload.dependence.dependanceScore > 0;
  const hasGenericScores = payload.generics.some(item =>
    item.summary.kind === "generic" && (item.summary.score || 0) > 0
  );

  if (hasDependenceScore || hasGenericScores) {
    sectionTitle("Scores");

    if (payload.dependence && payload.dependence.dependanceScore > 0) {
      const dep = payload.dependence;

      ensureSpace(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Dépendance", marginX, y);
      y += 20;

      const scoreValue = Math.min(100, dep.dependanceScore || 0);
      y = drawHistoBar(doc, "", scoreValue, dep.color || "grey", marginX, y, pageW - marginX * 2);
      y += 16;
    }

    payload.generics.forEach((item) => {
      const { label, summary } = item;
      if (summary.kind !== "generic") return;

      const scoreValue = Math.min(100, summary.score || 0);
      if (scoreValue <= 0) return;

      ensureSpace(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, marginX, y);
      y += 20;

      y = drawHistoBar(doc, "", scoreValue, summary.color || "grey", marginX, y, pageW - marginX * 2);
      y += 16;
    });
  }

  addPageFooter();

  const fileName = `evaluation-geriatrique-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
function drawHistoBar(
  doc: any,
  label: string,
  value: number,
  color: HistoColor,
  x: number,
  y: number,
  maxWidth: number
): number {
  const barHeight = 20;
  const barWidth = Math.min(maxWidth - 60, 200);
  const valuePct = Math.max(0, Math.min(100, value));
  const fillWidth = (valuePct / 100) * barWidth;

  // Couleurs
  const colorMap: Record<HistoColor, [number, number, number]> = {
    green: [76, 175, 80],
    orange: [255, 152, 0],
    red: [244, 67, 54],
    grey: [158, 158, 158],
    black: [33, 33, 33],
  };

  const [r, g, b] = colorMap[color] || [158, 158, 158];

  doc.setFillColor(240, 240, 240);
  doc.rect(x, y - barHeight + 4, barWidth, barHeight, "F");

  if (fillWidth > 0) {
    doc.setFillColor(r, g, b);
    doc.rect(x, y - barHeight + 4, fillWidth, barHeight, "F");
  }

  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y - barHeight + 4, barWidth, barHeight);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  if (label && label.trim()) {
    doc.text(label, x, y - barHeight - 4);
  }
  doc.text(`${value}%`, x + barWidth + 8, y - 6);

  return y + 8;
}