import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BIOMARKER_DEFINITIONS, BIOMARKER_CATEGORIES, type BiomarkerDefinition } from "@convex/biomarkerDefinitions";

// ── Shared constants ─────────────────────────────────────────────────────────

const PRIMARY: [number, number, number] = [15, 23, 42]; // #0f172a slate-900
const ACCENT: [number, number, number] = [37, 99, 235]; // #2563eb blue-600
const SUCCESS: [number, number, number] = [22, 163, 74]; // #16a34a
const WARNING: [number, number, number] = [202, 138, 4]; // #ca8a04
const DANGER: [number, number, number] = [220, 38, 38]; // #dc2626
const TEXT_DARK: [number, number, number] = [51, 51, 51];
const TEXT_MUTED: [number, number, number] = [120, 120, 120];
const MARGIN = 14;

function formatEUR(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDateDE(date?: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date ?? new Date());
}

// ── Shared header helper ─────────────────────────────────────────────────────

function drawPDFHeader(doc: jsPDF, title: string, subtitle?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerHeight = 44;

  // Dark navy banner
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, bannerHeight, "F");

  // Branding
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CELLJEVITY", MARGIN, 18);

  // Tagline
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text("Longevity & Regenerative Medicine", MARGIN, 26);

  // Title on right
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, pageWidth - MARGIN, 18, { align: "right" });

  if (subtitle) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, pageWidth - MARGIN, 28, { align: "right" });
  }

  // Date on right
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text(formatDateDE(), pageWidth - MARGIN, 38, { align: "right" });

  // Accent line under banner
  doc.setFillColor(...ACCENT);
  doc.rect(0, bannerHeight, pageWidth, 1.5, "F");

  return bannerHeight + 8;
}

// ── Shared page footer ───────────────────────────────────────────────────────

function drawPageNumbers(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, pageHeight - 18, pageWidth - MARGIN, pageHeight - 18);

    // Company info left
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Celljevity \u2014 Longevity & Regenerative Medicine", MARGIN, pageHeight - 12);

    // Page number right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - MARGIN, pageHeight - 12, { align: "right" });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTE / INVOICE PDF
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuotePDFData {
  type: "quote" | "invoice";
  quoteNumber: string;
  status?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
}

export function generateQuotePDF(data: QuotePDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const typeLabel = data.type === "invoice" ? "INVOICE" : "QUOTE";

  // Status badge text
  const statusLabel = data.status
    ? ` \u2014 ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`
    : "";

  let y = drawPDFHeader(doc, typeLabel + statusLabel, data.quoteNumber);

  // ── Bill To card ────────────────────────────────────────────────────
  y += 4;
  const cardTop = y - 4;
  const cardLeft = MARGIN;
  const cardWidth = 90;
  let cardBottom = y + 6;

  // Collect customer lines
  const customerLines: string[] = [data.customerName];
  if (data.customerEmail) customerLines.push(data.customerEmail);
  if (data.customerPhone) customerLines.push(data.customerPhone);
  cardBottom = cardTop + 10 + customerLines.length * 6 + 4;

  // Light background card
  doc.setFillColor(245, 247, 252);
  doc.setDrawColor(220, 225, 235);
  doc.roundedRect(cardLeft, cardTop, cardWidth, cardBottom - cardTop, 2, 2, "FD");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text("BILL TO", cardLeft + 6, y + 2);

  y += 8;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  for (const line of customerLines) {
    doc.text(line, cardLeft + 6, y);
    y += 6;
  }

  y = cardBottom + 10;

  // ── Items table ─────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    head: [["#", "Service", "Qty", "Unit Price", "Total"]],
    body: data.items.map((item, i) => [
      (i + 1).toString(),
      item.serviceName,
      item.quantity.toString(),
      formatEUR(item.unitPrice),
      formatEUR(item.total),
    ]),
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      font: "Helvetica",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      font: "Helvetica",
      fontSize: 10,
      textColor: TEXT_DARK,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "right", cellWidth: 40 },
      4: { halign: "right", cellWidth: 40 },
    },
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      cellPadding: 4,
    },
  });

  // ── Totals ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 12;
  const totalsX = pageWidth - MARGIN;
  const labelsX = pageWidth - 80;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);

  doc.text("Subtotal:", labelsX, y, { align: "right" });
  doc.text(formatEUR(data.subtotal), totalsX, y, { align: "right" });

  y += 8;
  doc.text(`Tax (${data.taxRate}%):`, labelsX, y, { align: "right" });
  doc.text(formatEUR(data.taxAmount), totalsX, y, { align: "right" });

  y += 4;
  doc.setDrawColor(180, 180, 180);
  doc.line(labelsX - 10, y, totalsX, y);

  y += 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL:", labelsX, y, { align: "right" });
  doc.text(formatEUR(data.total), totalsX, y, { align: "right" });

  // ── Payment terms ───────────────────────────────────────────────────
  y += 14;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  const terms =
    data.type === "invoice" ? "Payment due upon receipt." : "This quote is valid for 30 days.";
  doc.text(terms, MARGIN, y);

  // ── Notes ───────────────────────────────────────────────────────────
  if (data.notes) {
    y += 12;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.text("Notes:", MARGIN, y);

    y += 7;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - MARGIN * 2);
    doc.text(splitNotes, MARGIN, y);
  }

  // ── Page numbers ────────────────────────────────────────────────────
  drawPageNumbers(doc);

  doc.save(`${data.quoteNumber}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIOMARKER REPORT PDF
// ═══════════════════════════════════════════════════════════════════════════════

export interface BiomarkerReportPDFData {
  patientName: string;
  dateOfBirth?: string;
  gender?: string;
  reportDateRange?: { from: string; to: string };
  biomarkers: Array<{
    biomarkerCode: string;
    biomarkerName?: string;
    value: number;
    unit?: string;
    measuredAt: string;
    source?: string;
    refRangeLow?: number | null;
    refRangeHigh?: number | null;
    category?: string;
  }>;
}

type ValueStatus = "normal" | "borderline" | "out-of-range" | "unknown";

function getValueStatus(
  value: number,
  refLow?: number | null,
  refHigh?: number | null,
): ValueStatus {
  if (refLow == null || refHigh == null) return "unknown";
  if (value < refLow || value > refHigh) return "out-of-range";
  const margin = (refHigh - refLow) * 0.1;
  if (value < refLow + margin || value > refHigh - margin) return "borderline";
  return "normal";
}

const STATUS_LABEL: Record<ValueStatus, string> = {
  normal: "Normal",
  borderline: "Borderline",
  "out-of-range": "Out of range",
  unknown: "\u2014",
};

const STATUS_COLOR: Record<ValueStatus, [number, number, number]> = {
  normal: SUCCESS,
  borderline: WARNING,
  "out-of-range": DANGER,
  unknown: TEXT_MUTED,
};

const CATEGORY_ICONS: Record<string, string> = {
  Aging: "\u23F3",
  Inflammation: "\uD83D\uDD25",
  Metabolic: "\u26A1",
  Hormonal: "\uD83E\uDDEC",
  Thyroid: "\uD83E\uDD8B",
  Cardiovascular: "\u2764\uFE0F",
  Lipids: "\uD83E\uDDE0",
  Vitamins: "\u2600\uFE0F",
  Liver: "\uD83E\uDEAB",
  Kidney: "\uD83E\uDEB8",
  Hematology: "\uD83E\uDE78",
  Immune: "\uD83D\uDEE1\uFE0F",
};

export function generateBiomarkerReportPDF(data: BiomarkerReportPDFData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Group biomarkers by category ────────────────────────────────────
  // Use latest result per biomarker code
  const latestByCode: Record<string, (typeof data.biomarkers)[0]> = {};
  for (const b of data.biomarkers) {
    const existing = latestByCode[b.biomarkerCode];
    if (!existing || b.measuredAt > existing.measuredAt) {
      latestByCode[b.biomarkerCode] = b;
    }
  }

  const categoryGroups: Record<
    string,
    Array<{
      name: string;
      value: number;
      unit: string;
      refRange: string;
      status: ValueStatus;
      def?: BiomarkerDefinition;
    }>
  > = {};

  for (const b of Object.values(latestByCode)) {
    const def = BIOMARKER_DEFINITIONS.find((d) => d.code === b.biomarkerCode);
    const category = def?.category || b.category || "Other";
    const refLow = def?.refRangeLow ?? b.refRangeLow;
    const refHigh = def?.refRangeHigh ?? b.refRangeHigh;
    const unit = def?.unit || b.unit || "";
    const name = def?.name || b.biomarkerName || b.biomarkerCode;
    const status = getValueStatus(b.value, refLow, refHigh);
    const refRange =
      refLow != null && refHigh != null ? `${refLow} \u2013 ${refHigh}` : "\u2014";

    if (!categoryGroups[category]) categoryGroups[category] = [];
    categoryGroups[category].push({ name, value: b.value, unit, refRange, status, def });
  }

  // Sort categories by BIOMARKER_CATEGORIES order
  const catOrder = BIOMARKER_CATEGORIES as readonly string[];
  const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
    const ai = catOrder.indexOf(a);
    const bi = catOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Compute totals
  let totalMarkers = 0;
  let totalInRange = 0;
  const categoryStats: Array<{ category: string; tested: number; inRange: number }> = [];

  for (const cat of sortedCategories) {
    const markers = categoryGroups[cat];
    let inRange = 0;
    for (const m of markers) {
      if (m.status !== "unknown") {
        totalMarkers++;
        if (m.status === "normal" || m.status === "borderline") {
          inRange++;
          totalInRange++;
        }
      }
    }
    categoryStats.push({ category: cat, tested: markers.length, inRange });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAGE 1: Cover & Summary
  // ═══════════════════════════════════════════════════════════════════
  let y = drawPDFHeader(doc, "BIOMARKER REPORT");

  // Patient info block
  y += 4;
  doc.setFillColor(245, 247, 252);
  doc.setDrawColor(220, 225, 235);
  const infoBoxTop = y;
  const infoLines: string[] = [];
  infoLines.push(`Patient: ${data.patientName}`);
  if (data.dateOfBirth) infoLines.push(`Date of Birth: ${data.dateOfBirth}`);
  if (data.gender)
    infoLines.push(`Gender: ${data.gender.charAt(0).toUpperCase() + data.gender.slice(1)}`);
  if (data.reportDateRange)
    infoLines.push(`Report Period: ${data.reportDateRange.from} \u2013 ${data.reportDateRange.to}`);
  infoLines.push(`Report Generated: ${formatDateDE()}`);

  const infoBoxHeight = 8 + infoLines.length * 6 + 4;
  doc.roundedRect(MARGIN, infoBoxTop, pageWidth - MARGIN * 2, infoBoxHeight, 2, 2, "FD");

  y = infoBoxTop + 8;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  for (const line of infoLines) {
    doc.text(line, MARGIN + 6, y);
    y += 6;
  }

  y = infoBoxTop + infoBoxHeight + 10;

  // Overall score
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text(
    `${totalInRange} / ${totalMarkers} biomarkers within reference range`,
    pageWidth / 2,
    y,
    { align: "center" },
  );

  y += 14;

  // Category summary table
  autoTable(doc, {
    startY: y,
    head: [["Category", "Markers Tested", "In Range", "Status"]],
    body: categoryStats.map((cs) => {
      const pct = cs.tested > 0 ? Math.round((cs.inRange / cs.tested) * 100) : 0;
      let statusText = `${pct}% in range`;
      if (pct === 100) statusText = "All normal";
      return [
        `${CATEGORY_ICONS[cs.category] || "\u25CF"} ${cs.category}`,
        cs.tested.toString(),
        cs.inRange.toString(),
        statusText,
      ];
    }),
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      font: "Helvetica",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      font: "Helvetica",
      fontSize: 10,
      textColor: TEXT_DARK,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 35 },
      2: { halign: "center", cellWidth: 30 },
      3: { halign: "center", cellWidth: 40 },
    },
    margin: { left: MARGIN, right: MARGIN },
    theme: "grid",
    styles: {
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      cellPadding: 4,
    },
    didParseCell(hookData) {
      // Color the status column
      if (hookData.section === "body" && hookData.column.index === 3) {
        const text = hookData.cell.raw as string;
        if (text === "All normal") {
          hookData.cell.styles.textColor = SUCCESS;
          hookData.cell.styles.fontStyle = "bold";
        } else if (text.includes("100")) {
          hookData.cell.styles.textColor = SUCCESS;
        } else {
          const pct = parseInt(text);
          if (pct >= 80) hookData.cell.styles.textColor = SUCCESS;
          else if (pct >= 50) hookData.cell.styles.textColor = WARNING;
          else hookData.cell.styles.textColor = DANGER;
        }
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY DETAIL PAGES
  // ═══════════════════════════════════════════════════════════════════
  for (const cat of sortedCategories) {
    const markers = categoryGroups[cat];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable?.finalY ?? 0;
    const spaceNeeded = 30 + markers.length * 10;
    const pageHeight = doc.internal.pageSize.getHeight();

    // Start new page if not enough space
    if (lastY + spaceNeeded > pageHeight - 30) {
      doc.addPage();
      y = 20;
    } else {
      y = lastY + 14;
    }

    // Category header divider
    const icon = CATEGORY_ICONS[cat] || "\u25CF";
    doc.setFillColor(...ACCENT);
    doc.rect(MARGIN, y, pageWidth - MARGIN * 2, 0.8, "F");

    y += 8;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...PRIMARY);
    doc.text(`${icon}  ${cat}`, MARGIN, y);
    y += 6;

    // Detail table
    autoTable(doc, {
      startY: y,
      head: [["Biomarker", "Value", "Unit", "Reference Range", "Status"]],
      body: markers.map((m) => [
        m.name,
        m.value.toString(),
        m.unit,
        m.refRange,
        STATUS_LABEL[m.status],
      ]),
      headStyles: {
        fillColor: PRIMARY,
        textColor: [255, 255, 255],
        font: "Helvetica",
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        font: "Helvetica",
        fontSize: 9,
        textColor: TEXT_DARK,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 25 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 38 },
        4: { halign: "center", cellWidth: 30 },
      },
      margin: { left: MARGIN, right: MARGIN },
      theme: "grid",
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        cellPadding: 3,
      },
      didParseCell(hookData) {
        if (hookData.section !== "body") return;
        const rowIdx = hookData.row.index;
        const marker = markers[rowIdx];
        if (!marker) return;

        // Color status column
        if (hookData.column.index === 4) {
          hookData.cell.styles.textColor = STATUS_COLOR[marker.status];
          if (marker.status === "out-of-range") {
            hookData.cell.styles.fontStyle = "bold";
          }
        }
        // Bold red for out-of-range values
        if (hookData.column.index === 1 && marker.status === "out-of-range") {
          hookData.cell.styles.textColor = DANGER;
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // FINAL PAGE: Footer Notes
  // ═══════════════════════════════════════════════════════════════════
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = ((doc as any).lastAutoTable?.finalY ?? 200) + 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 30;
  }

  // Source info
  doc.setDrawColor(...ACCENT);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 8;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text("Data Sources", MARGIN, y);
  y += 6;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.text(
    "Results sourced from uploaded lab reports (automated extraction) and manually entered data.",
    MARGIN,
    y,
  );

  y += 12;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text("Disclaimer", MARGIN, y);
  y += 6;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  const disclaimer = doc.splitTextToSize(
    "This report is for informational purposes only and does not constitute medical advice. " +
      "Reference ranges may vary by laboratory and individual patient factors. " +
      "Always consult a qualified healthcare professional for interpretation of results " +
      "and medical decisions. Values flagged as out of range should be reviewed by your physician.",
    pageWidth - MARGIN * 2,
  );
  doc.text(disclaimer, MARGIN, y);

  // ── Page numbers on all pages ───────────────────────────────────────
  drawPageNumbers(doc);

  // Save
  const safeName = data.patientName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`biomarker-report-${safeName}-${dateStr}.pdf`);
}
