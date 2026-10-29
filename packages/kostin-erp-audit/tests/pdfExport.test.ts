import { describe, it, expect, vi } from "vitest";
import { erpPdfExportService, ErpExecutivePdfService } from "../src/pdfExport";
import { generateReport } from "../src/generateReport";
import { PRESETS } from "../src/presets";
import { emptyAnswers } from "../src/questions";
import type { ExecutiveExportService, Report } from "../src/types";
import { jsPDF } from "jspdf";

describe("Executive PDF Export Service (F21, F22)", () => {
  it("satisfies the ExecutiveExportService interface contract", () => {
    const service: ExecutiveExportService<Report, jsPDF> = erpPdfExportService;
    expect(service).toBeDefined();
    expect(typeof service.generate).toBe("function");
    expect(typeof service.download).toBe("function");
    expect(erpPdfExportService).toBeInstanceOf(ErpExecutivePdfService);
  });

  it("generates a valid 1-page vector PDF for standard reports", async () => {
    const report = generateReport(emptyAnswers, "en");
    const doc = await erpPdfExportService.generate(report);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);

    const buffer = doc.output("arraybuffer");
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(2000); // Substantial PDF output
  });

  it("generates vector PDFs for all 4 employer demonstration presets", async () => {
    for (const preset of PRESETS) {
      const report = generateReport(preset.answers, "en");
      const doc = await erpPdfExportService.generate(report);

      expect(doc).toBeDefined();
      expect(doc.getNumberOfPages()).toBe(1);
      const buffer = doc.output("arraybuffer");
      expect(buffer.byteLength).toBeGreaterThan(2000);
    }
  });

  it("handles Ukrainian language reports gracefully with safe font encoding", async () => {
    const ukPreset = PRESETS[0];
    const report = generateReport(ukPreset.answers, "uk");
    const doc = await erpPdfExportService.generate(report);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(1);
    const buffer = doc.output("arraybuffer");
    expect(buffer.byteLength).toBeGreaterThan(2000);
  });

  it("handles extreme boundary reports (min score and max score)", async () => {
    // Extreme low
    const lowReport = generateReport(
      {
        ...emptyAnswers,
        system: "1c",
        market: "ua",
        size: "200+",
        manualHours: "40+",
        pains: ["manual", "compliance", "support", "disconnected", "scaling", "errors", "cost"],
      },
      "en",
    );
    const lowDoc = await erpPdfExportService.generate(lowReport);
    expect(lowDoc.getNumberOfPages()).toBe(1);

    // Extreme high
    const highReport = generateReport(
      {
        ...emptyAnswers,
        system: "odoo",
        market: "eu",
        size: "21-50",
        integrations: ["bank", "ecommerce", "crm", "einvoice"],
        manualHours: "lt5",
      },
      "en",
    );
    const highDoc = await erpPdfExportService.generate(highReport);
    expect(highDoc.getNumberOfPages()).toBe(1);
  });

  it("executes download method safely in test/Node environment", async () => {
    const report = generateReport(emptyAnswers, "en");
    const doc = await erpPdfExportService.generate(report);

    // Should not throw in Node environment where window.save is not present
    expect(() => {
      erpPdfExportService.download(doc, "test-report.pdf");
    }).not.toThrow();

    // Mock doc.save
    const saveSpy = vi.fn();
    (doc as unknown as { save: typeof saveSpy }).save = saveSpy;

    // Simulate browser window
    const originalWindow = globalThis.window;
    (globalThis as unknown as { window: unknown }).window = {};

    erpPdfExportService.download(doc, "custom-filename.pdf");
    expect(saveSpy).toHaveBeenCalledWith("custom-filename.pdf");

    // Restore window
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });
});
