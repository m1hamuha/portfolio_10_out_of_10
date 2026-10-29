import { jsPDF } from "jspdf";
import type { Report, ExecutiveExportService } from "./types";
import { formatEur } from "./i18n";

export class ErpExecutivePdfService implements ExecutiveExportService<Report, jsPDF> {
  async generate(report: Report): Promise<jsPDF> {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 42, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("ERP ARCHITECTURE HEALTH AUDIT - EXECUTIVE REPORT", margin, 14);

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("System Diagnostic & Remediation Blueprint", margin, 24);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    const dateStr = new Date().toISOString().split("T")[0];
    const safeProfile = (report.profileLine || "Enterprise System Audit")
      .replace(/[^\x00-\x7F]/g, " ");
    doc.text(
      `Profile: ${safeProfile} | Generated: ${dateStr}`,
      margin,
      34
    );

    // 2. Health Score Card & Verdict
    let y = 52;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 36, 3, 3, "S");

    // Status pill
    const statusColor: Record<Report["zone"], [number, number, number]> = {
      red: [220, 38, 38],
      amber: [217, 119, 6],
      green: [22, 163, 74],
    };
    const color = statusColor[report.zone] || [71, 85, 105];

    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(margin + 6, y + 6, 38, 24, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(`${report.score}`, margin + 12, y + 21);
    doc.setFontSize(10);
    doc.text("/100", margin + 30, y + 21);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    const statusText =
      report.zone === "green"
        ? "HEALTHY"
        : report.zone === "amber"
          ? "NEEDS WORK"
          : "AT RISK";
    doc.text(`Status: ${statusText}`, margin + 50, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const safeVerdict = (report.verdict || "System diagnostic completed.")
      .replace(/[^\x00-\x7F]/g, " ");
    const splitSummary = doc.splitTextToSize(safeVerdict, contentWidth - 56);
    doc.text(splitSummary, margin + 50, y + 22);

    // 3. Architectural Sub-Scores
    y = 96;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Architectural Sub-Scores", margin, y);

    y += 6;
    const colWidth = (contentWidth - 6) / 2;
    report.subScores.forEach((sub, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = margin + col * (colWidth + 6);
      const by = y + row * 18;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(bx, by, colWidth, 14, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const safeLabel = sub.label.replace(/[^\x00-\x7F]/g, " ") || sub.id;
      doc.text(safeLabel, bx + 4, by + 6);

      doc.setFontSize(9);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(`${sub.value}%`, bx + colWidth - 14, by + 6);

      // Bar
      doc.setFillColor(226, 232, 240);
      doc.rect(bx + 4, by + 9, colWidth - 8, 2.5, "F");
      const subR = sub.value >= 75 ? 22 : sub.value >= 50 ? 217 : 220;
      const subG = sub.value >= 75 ? 163 : sub.value >= 50 ? 119 : 38;
      const subB = sub.value >= 75 ? 74 : sub.value >= 50 ? 6 : 38;
      doc.setFillColor(subR, subG, subB);
      doc.rect(bx + 4, by + 9, ((colWidth - 8) * sub.value) / 100, 2.5, "F");
    });

    // 4. Financial Impact Analysis
    y = 142;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentWidth, 30, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("QUANTIFIED FINANCIAL IMPACT", margin + 6, y + 8);

    const statWidth = contentWidth / 3;
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`${report.impact.monthlyHours} hrs`, margin + 6, y + 18);
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text("Monthly Lost to Manual Work", margin + 6, y + 24);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    const monthlyCostStr = formatEur(report.impact.monthlyCost).replace(/[^\x00-\x7F]/g, "EUR ");
    doc.text(monthlyCostStr, margin + statWidth + 4, y + 18);
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text("Monthly Labor Overhead", margin + statWidth + 4, y + 24);

    doc.setFontSize(14);
    doc.setTextColor(52, 211, 153); // emerald-400
    const annualRoiStr = formatEur(report.impact.savedCostYear).replace(/[^\x00-\x7F]/g, "EUR ");
    doc.text(annualRoiStr, margin + statWidth * 2 + 4, y + 18);
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text("Annual Recoverable ROI", margin + statWidth * 2 + 4, y + 24);

    // 5. Prioritized Risks
    y = 180;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Prioritized Architectural Risks", margin, y);

    y += 6;
    report.risks.slice(0, 3).forEach((risk) => {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      const safeTitle = risk.title.replace(/[^\x00-\x7F]/g, " ");
      doc.text(`[${risk.severity.toUpperCase()}] ${safeTitle}`, margin + 4, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const safeWhat = (risk.what || "").replace(/[^\x00-\x7F]/g, " ");
      const splitWhat = doc.splitTextToSize(safeWhat, contentWidth - 8);
      doc.text(splitWhat[0] || "", margin + 4, y + 10.5);

      y += 16;
    });

    // 6. Remediation Plan
    y = 236;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Recommended Remediation Roadmap", margin, y);

    y += 6;
    report.plan.slice(0, 3).forEach((stage) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const safeStageTitle = stage.title.replace(/[^\x00-\x7F]/g, " ");
      doc.text(`Stage ${stage.n}: ${safeStageTitle}`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const itemsText = stage.items.join(" | ").replace(/[^\x00-\x7F]/g, " ");
      const splitItems = doc.splitTextToSize(itemsText, contentWidth);
      doc.text(splitItems[0] || "", margin, y + 4.5);

      y += 10;
    });

    // 7. Executive Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "ERP Health Audit - Confidential Executive Diagnostic Summary",
      margin,
      287
    );
    doc.text("Page 1 of 1", pageWidth - margin - 18, 287);

    return doc;
  }

  download(doc: jsPDF, filename = "erp-health-audit-executive-report.pdf"): void {
    if (typeof window !== "undefined" && typeof doc.save === "function") {
      doc.save(filename);
    }
  }
}

export const erpPdfExportService = new ErpExecutivePdfService();
