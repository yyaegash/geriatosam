import type { SummaryRow } from "../../pages/Forms/Questions/AideEnPlaceCsv";
import type { DependenceSummary } from "../../pages/Forms/Questions/DependenceCsv";
import type { GenericSummary } from "../../pages/Forms/Questions/GenericCsvForm";

export type HistoColor = "green" | "orange" | "red" | "grey" | "black";
export type HistoBar = { label: string; valuePct: number; color: HistoColor };

/** Données d’entrée de la génération PDF */
export type PdfPayload = {
  aide?: { rows: SummaryRow[] };                 // Aide en place -> Q/R listées (à gauche)
  dependence?: DependenceSummary | null;         // Dépendence -> repérage/proposition + barres ADL/IADL
  generics: Array<{ label: string; summary: GenericSummary }>; // Tous les GenericCsvForm (mode "generic")
  extraHistos?: HistoBar[];                      // Barres additionnelles si besoin
};

/* -------------------------------------------------
   Helpers normalisation & parsing (pour relecture CSV)
-------------------------------------------------- */
const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
export const norm = (s: string) => stripDiacritics(String(s)).trim().toLowerCase();

const normalizeId = (section: string, label: string, pos: number) =>
  `csv.${norm(section)}.${String(pos).padStart(2, "0")}.${norm(label).replace(/[^a-z0-9]+/g, "-")}`;

const parseChoices = (raw?: string): { label: string; value?: number }[] => {
  if (!raw) return [];
  const lines = String(raw)
    .replace(/\r\n/g, "\n")
    .split(/\n|\|/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const out: { label: string; value?: number }[] = [];
  for (const line of lines) {
    // "Oui:50" → label="Oui", value=50
    const m = line.match(/^(.+?):\s*([0-9]+(?:[.,][0-9]+)?)\s*$/);
    if (m) out.push({ label: m[1].trim(), value: Number(m[2].replace(",", ".")) });
    else out.push({ label: line });
  }
  // règle produit : retirer "Non"
  return out.filter((o) => norm(o.label) !== "non");
};

/** Reconstitue un GenericSummary depuis un CSV + localStorage, sans monter de composant */
export async function reconstructGenericFromCsv(
  sectionLabel: string,
  csvPath: string,
  storageKey: string
): Promise<GenericSummary | null> {
  try {
    const r = await fetch(csvPath, { cache: "no-store" });
    if (!r.ok) return null;
    const text = await r.text();

    const Papa = (await import("papaparse")).default;
    const parsed = Papa.parse<any>(text, { header: true, skipEmptyLines: true });
    const rows = (parsed.data || []) as any[];

    const filtered = rows
      .filter(
        (row) =>
          row &&
          row.Question &&
          [row.Section, row.Group].some((x) => x && norm(String(x)) === norm(sectionLabel))
      )
      .sort((a, b) => Number(a.QPos || 0) - Number(b.QPos || 0));

    let answers: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      answers = raw ? JSON.parse(raw) : {};
    } catch {}

    const reperage = new Set<string>();
    const proposition = new Set<string>();
    let score = 0;
    let color: "green" | "orange" | "red" | "grey" = "grey";
    let scoreFound = false;

    filtered.forEach((row: any, idx: number) => {
      const qid = normalizeId(sectionLabel, String(row.Question).trim(), Number(row.QPos || idx + 1));
      const val = answers[qid];
      if (!val) return;

      // Si réponse ≠ "Non" → on pousse Surveillance/Action
      const vNorm = norm(String(val));
      if (vNorm !== "non") {
        if (row.Surveillance) reperage.add(String(row.Surveillance).trim());
        if (row.Actions) proposition.add(String(row.Actions).trim());
      }

      // Score à partir de "Options" de type "Oui:50"
      if (row.Options && !scoreFound) {
        const opts = parseChoices(row.Options);
        const hit = opts.find((o) => norm(o.label) === vNorm && typeof o.value === "number");
        if (hit && typeof hit.value === "number") {
          score = Math.min(100, Math.max(0, Math.round(hit.value)));
          scoreFound = true;
        }
      }

      // Couleur via "Qualité de la prise en charge actuelle"
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

/* -------------------------------------------------
   GÉNÉRATION DU PDF (2 colonnes + histogrammes fin)
-------------------------------------------------- */
export async function generateGeriatriePdf(payload: PdfPayload) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  const colGap = 24;
  const colW = (pageW - marginX * 2 - colGap) / 2;

  console.log("=== PAYLOAD PDF ===", JSON.stringify(payload, null, 2));

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

  const sectionTitle = (t: string) => {
    ensureSpace(32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    // bande grise derrière le titre
    const textW = doc.getTextWidth(t);
    const boxH = 20;
    doc.setFillColor("#e5e7eb");
    doc.rect(marginX - 6, y - 12, textW + 12, boxH, "F");
    doc.setTextColor("#111827");
    doc.text(t, marginX, y + 2);
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

  const getLines = (t: string): string[] => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const maxW = colW - 12;
    return doc.splitTextToSize(t, maxW) as string[];
  };

  const getTextHeight = (lines: string[]): number => {
    if (!lines.length) return 0;
    const fontSize = 10;
    const lineHeight = fontSize * (doc.getLineHeightFactor
      ? doc.getLineHeightFactor()
      : 1.3); // fallback 1.3 si pas dispo
    return lines.length * lineHeight;
  };

  const bulletsTwoCols = (reperage: string[], proposition: string[]) => {
    const maxRows = Math.max(reperage.length, proposition.length);
    if (!maxRows) return;

    for (let i = 0; i < maxRows; i++) {
      const leftRaw = reperage[i] ?? "";
      const rightRaw = proposition[i] ?? "";

      const leftText = String(leftRaw);
      const rightText = String(rightRaw);

      // si les deux côtés sont vraiment vides → on saute la ligne
      if (!leftText.trim() && !rightText.trim()) continue;

      const leftLines = leftText.trim() ? getLines(leftText) : [];
      const rightLines = rightText.trim() ? getLines(rightText) : [];

      const rowHeight = Math.max(
        getTextHeight(leftLines),
        getTextHeight(rightLines),
        18 // hauteur minimale
      );

      ensureSpace(rowHeight + 6);

      const lineHeight = 14;
      const baseY = y + lineHeight;

      // Colonne gauche
      if (leftText.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("•", marginX, baseY);
        doc.setFontSize(10);
        doc.text(leftLines, marginX + 10, baseY);
      }

      // Colonne droite
      if (rightText.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text("•", marginX + colW + colGap, baseY);
        doc.setFontSize(10);
        doc.text(rightLines, marginX + colW + colGap + 10, baseY);
      }

      y += rowHeight + 6;
    }

    y += 6;
  };



  // On collecte les histogrammes ici et on les tracera en fin
  const histos: HistoBar[] = [];

  // En-tête de la première page
  addPageHeader();

  // Page de garde (bloc titre + date)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Synthèse gériatrique — Compte rendu", marginX, y + 20);
  y += 40;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const dt = new Date();
  const dateStr = dt.toLocaleDateString();
  const timeStr = dt.toLocaleTimeString();
  doc.setTextColor("#4b5563");
  doc.text(`Généré le ${dateStr} à ${timeStr}`, marginX, y);
  doc.setTextColor("#000000");
  y += 24;

  // Ligne de séparation
  doc.setDrawColor("#d1d5db");
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageW - marginX, y);
  y += 16;
  doc.setDrawColor("#000000");

  /* ========= Aide en place et fréquence ========= */
  if (payload.aide && payload.aide.rows.length) {
    // On ne garde que les lignes avec une réponse non vide
    const answeredRows = payload.aide.rows.filter(
      (r) => r.answer != null && String(r.answer).trim().length > 0
    );

    if (answeredRows.length) {
      sectionTitle("Aide en place et fréquence");
      sectionHeader("Repérage gériatrique", "Proposition de prise en charge");
      const left = answeredRows.map(
        (r) => `${r.question} : ${String(r.answer).trim()}`
      );
      const right: string[] = [];
      bulletsTwoCols(left, right);
    }
  }

  /* ==================== Dépendance ==================== */
  if (payload.dependence) {
    const dep = payload.dependence;
    const hasText =
      (dep.report.reperage && dep.report.reperage.length > 0) ||
      (dep.report.proposition && dep.report.proposition.length > 0);

    const hasScores =
      Number.isFinite(dep.adlScore) &&
      Number.isFinite(dep.adlMax) &&
      Number.isFinite(dep.iadlScore) &&
      Number.isFinite(dep.iadlMax) &&
      dep.adlMax > 0 &&
      dep.iadlMax > 0;

    if (hasText || hasScores) {
      sectionTitle("Dépendance");
    }

    if (hasText) {
      sectionHeader("Repérage gériatrique", "Proposition de prise en charge");
      bulletsTwoCols(dep.report.reperage || [], dep.report.proposition || []);
    }

    // Histogrammes ADL/IADL (barres noires) uniquement si les scores sont valides
    if (hasScores) {
      const adlPct = Math.max(
        0,
        Math.min(100, Math.round((dep.adlScore / dep.adlMax) * 100))
      );
      const iadlPct = Math.max(
        0,
        Math.min(100, Math.round((dep.iadlScore / dep.iadlMax) * 100))
      );

      if (adlPct > 0) {
        histos.push({ label: "ADL", valuePct: adlPct, color: "black" });
      }
      if (iadlPct > 0) {
        histos.push({ label: "IADL", valuePct: iadlPct, color: "black" });
      }
    }
  }

  /* ============= Formulaires génériques ============= */
  for (const g of payload.generics) {
    const rep = g.summary.report?.reperage || [];
    const prop = g.summary.report?.proposition || [];

    const hasText =
      rep.some((s: string) => s && s.trim().length > 0) ||
      prop.some((s: string) => s && s.trim().length > 0);

    const hasScore =
      g.summary.score != null &&
      Number.isFinite(g.summary.score) &&
      g.summary.score >= 0 &&
      g.summary.score <= 100;

    // 1) Texte : on n'affiche la section que s'il y a au moins une phrase
    if (hasText) {
      sectionTitle(g.label);
      sectionHeader("Repérage gériatrique", "Proposition de prise en charge");
      bulletsTwoCols(rep, prop);
    }

    // 2) Histogramme : on l'ajoute même si le texte est vide (mais score OK)
      if (hasScore) {
        const pct = Math.max(
          0,
          Math.min(100, Math.round(Number(g.summary.score)))
        );

        if (pct > 0) {
          const c: HistoColor =
            g.summary.color === "green"
              ? "green"
              : g.summary.color === "orange"
              ? "orange"
              : g.summary.color === "red"
              ? "red"
              : "grey";

          histos.push({ label: g.label, valuePct: pct, color: c });
        }
      }
  }

  // Ajoute d’éventuelles barres supplémentaires (en filtrant celles sans valeur)
  if (payload.extraHistos?.length) {
    for (const h of payload.extraHistos) {
      const v = Number(h.valuePct);
      if (!Number.isFinite(v)) continue;
      histos.push({ ...h, valuePct: Math.max(0, Math.min(100, Math.round(v))) });
    }
  }

  /* ==================== Histogrammes fin ==================== */
  if (histos.length) {
    doc.addPage();
    addPageHeader();
    y = marginY + 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Histogrammes de synthèse", marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#4b5563");
    doc.text("Valeurs en pourcentage (0–100).", marginX, y);
    doc.setTextColor("#000000");
    y += 18;

    const barH = 18;
    const gapY = 26;
    const axisOffsetY = 6; // espace entre barre et graduations
    const maxW = pageW - marginX * 2 - 40; // un peu plus large

    const colorMap: Record<HistoColor, string> = {
      green: "#16a34a",
      orange: "#f59e0b",
      red: "#dc2626",
      grey: "#9ca3af",
      black: "#111827",
    };

    histos.forEach((h) => {
      const v = Number(h.valuePct);
      if (!Number.isFinite(v) || v <= 0) return; // on n'affiche pas 0

      ensureSpace(barH + gapY + 24);

      // 1) Titre de l'histogramme au-dessus
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const labelY = y + 10;
      doc.text(h.label, marginX, labelY);

      // 2) Barre horizontale juste en dessous
      const barY = labelY + 8;
      const barX = marginX;
      const w = Math.round((v / 100) * maxW);

      // fond
      doc.setFillColor("#e5e7eb");
      doc.setDrawColor("#d1d5db");
      doc.rect(barX, barY, maxW, barH, "F");

      // barre colorée
      doc.setFillColor(colorMap[h.color] || "#111827");
      doc.rect(barX, barY, w, barH, "F");

      // 3) Valeur à droite de la barre
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#374151");
      const valueText = `${v}%`;
      const valueWidth = doc.getTextWidth(valueText);
      doc.text(valueText, barX + maxW - valueWidth, barY - 4);
      doc.setTextColor("#000000");

      // 4) Axe + graduations 0-50-100
      const axisY = barY + barH + axisOffsetY;
      const axisX0 = barX;
      const axisX100 = barX + maxW;

      // axe
      doc.setDrawColor("#9ca3af");
      doc.setLineWidth(0.7);
      doc.line(axisX0, axisY, axisX100, axisY);

      doc.setFontSize(9);
      doc.setTextColor("#6b7280");

      // 0
      doc.text("0", axisX0, axisY + 10);

      // 50
      const midX = axisX0 + maxW / 2;
      doc.line(midX, axisY - 3, midX, axisY + 3);
      doc.text("50", midX - doc.getTextWidth("50") / 2, axisY + 10);

      // 100
      doc.line(axisX100, axisY - 3, axisX100, axisY + 3);
      const t100 = "100";
      doc.text(t100, axisX100 - doc.getTextWidth(t100), axisY + 10);

      doc.setTextColor("#000000");
      doc.setLineWidth(0.5);
      doc.setDrawColor("#000000");

      // on avance le curseur Y à la prochaine "ligne" d'histogramme
      y = axisY + 10 + gapY;
    });
  }

  // Pieds de page (numéros de page)
  addPageFooter();

  doc.save("synthese_geriatrie.pdf");
}

