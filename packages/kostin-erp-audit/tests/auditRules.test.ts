import { describe, it, expect } from "vitest";
import { decidePath, generateReport } from "../src/generateReport";
import { PRESETS } from "../src/presets";
import { emptyAnswers } from "../src/questions";

describe("Audit Decision Rules & Scenarios (F19, F20, F22)", () => {
  describe("Path Decision Trees (decidePath)", () => {
    it("routes 1C and BAS in Ukraine to migrate-urgent", () => {
      expect(decidePath({ ...emptyAnswers, system: "1c", market: "ua" })).toBe(
        "migrate-urgent",
      );
      expect(decidePath({ ...emptyAnswers, system: "bas", market: "ua" })).toBe(
        "migrate-urgent",
      );
    });

    it("routes 1C and BAS in other markets to migrate", () => {
      expect(decidePath({ ...emptyAnswers, system: "1c", market: "eu" })).toBe(
        "migrate",
      );
      expect(decidePath({ ...emptyAnswers, system: "bas", market: "us" })).toBe(
        "migrate",
      );
      expect(decidePath({ ...emptyAnswers, system: "1c", market: "other" })).toBe(
        "migrate",
      );
    });

    it("routes spreadsheets to implement", () => {
      expect(decidePath({ ...emptyAnswers, system: "spreadsheets" })).toBe(
        "implement",
      );
    });

    it("routes QuickBooks and SAP to replace", () => {
      expect(decidePath({ ...emptyAnswers, system: "quickbooks" })).toBe(
        "replace",
      );
      expect(decidePath({ ...emptyAnswers, system: "sap" })).toBe("replace");
    });

    it("routes Odoo to optimize", () => {
      expect(decidePath({ ...emptyAnswers, system: "odoo" })).toBe("optimize");
    });

    it("falls back to implement for other/unrecognized systems", () => {
      expect(decidePath({ ...emptyAnswers, system: "other" })).toBe("implement");
      expect(decidePath(emptyAnswers)).toBe("implement");
    });
  });

  describe("Risk Deduplication and Severity Rules", () => {
    it("flags legal-ban high severity risk for 1C in Ukraine", () => {
      const report = generateReport(
        { ...emptyAnswers, system: "1c", market: "ua" },
        "en",
      );
      const legalBan = report.risks.find((r) => r.id === "legal-ban");
      expect(legalBan).toBeDefined();
      expect(legalBan?.severity).toBe("high");
    });

    it("flags legacy-foreign high severity risk for 1C outside Ukraine", () => {
      const report = generateReport(
        { ...emptyAnswers, system: "1c", market: "eu" },
        "en",
      );
      const legacyRisk = report.risks.find((r) => r.id === "legacy-foreign");
      expect(legacyRisk).toBeDefined();
      expect(legacyRisk?.severity).toBe("high");
    });

    it("deduplicates risks and preserves highest severity", () => {
      const report = generateReport(
        {
          ...emptyAnswers,
          system: "spreadsheets",
          size: "51-200", // triggers high severity spreadsheets risk
          integrations: ["none"],
          pains: ["manual", "disconnected", "reporting"],
        },
        "en",
      );

      // Verify no duplicate IDs
      const ids = report.risks.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);

      // Verify sorted high -> med -> low
      const severityOrder = { high: 0, med: 1, low: 2 };
      for (let i = 0; i < report.risks.length - 1; i++) {
        const cur = severityOrder[report.risks[i].severity];
        const next = severityOrder[report.risks[i + 1].severity];
        expect(cur).toBeLessThanOrEqual(next);
      }
    });

    it("correctly determines health zone based on final score", () => {
      // Green zone >= 75
      const greenReport = generateReport(
        { ...emptyAnswers, system: "odoo", integrations: ["bank", "crm"] },
        "en",
      );
      expect(greenReport.score).toBeGreaterThanOrEqual(75);
      expect(greenReport.zone).toBe("green");

      // Amber zone 50..74
      const amberReport = generateReport(
        {
          ...emptyAnswers,
          system: "quickbooks",
          size: "51-200",
          integrations: ["none"],
          pains: ["manual", "reporting"],
        },
        "en",
      );
      expect(amberReport.score).toBeGreaterThanOrEqual(50);
      expect(amberReport.score).toBeLessThan(75);
      expect(amberReport.zone).toBe("amber");

      // Red zone < 50
      const redReport = generateReport(
        {
          ...emptyAnswers,
          system: "1c",
          market: "ua",
          size: "51-200",
          pains: ["manual", "compliance", "support", "disconnected"],
        },
        "en",
      );
      expect(redReport.score).toBeLessThan(50);
      expect(redReport.zone).toBe("red");
    });
  });

  describe("Four 1-Click Employer Presets (F20)", () => {
    it("contains exactly the 4 required production scenarios", () => {
      expect(PRESETS).toHaveLength(4);
      const ids = PRESETS.map((p) => p.id);
      expect(ids).toEqual([
        "legacy-1c",
        "spreadsheets-chaos",
        "quickbooks-outgrown",
        "optimized-odoo",
      ]);
    });

    it("verifies Preset 1: Legacy 1C Enterprise", () => {
      const preset = PRESETS.find((p) => p.id === "legacy-1c")!;
      expect(preset).toBeDefined();
      const report = generateReport(preset.answers, "en");

      expect(report.pathKind).toBe("migrate-urgent");
      expect(report.zone).toBe("red");
      expect(report.score).toBeLessThanOrEqual(35);
      expect(report.risks.some((r) => r.id === "legal-ban")).toBe(true);
      expect(report.recommendedPackage).toBe("implementation");
      expect(report.impact.savedCostYear).toBeGreaterThan(0);
    });

    it("verifies Preset 2: Spreadsheets Chaos", () => {
      const preset = PRESETS.find((p) => p.id === "spreadsheets-chaos")!;
      expect(preset).toBeDefined();
      const report = generateReport(preset.answers, "en");

      expect(report.pathKind).toBe("implement");
      expect(report.zone === "red" || report.zone === "amber").toBe(true);
      expect(report.risks.some((r) => r.id === "spreadsheets")).toBe(true);
      expect(report.recommendedPackage).toBe("implementation");
    });

    it("verifies Preset 3: QuickBooks Outgrown", () => {
      const preset = PRESETS.find((p) => p.id === "quickbooks-outgrown")!;
      expect(preset).toBeDefined();
      const report = generateReport(preset.answers, "en");

      expect(report.pathKind).toBe("replace");
      expect(report.zone).toBe("amber");
      expect(report.risks.some((r) => r.id === "quickbooks-outgrown")).toBe(true);
      expect(report.recommendedPackage).toBe("implementation");
    });

    it("verifies Preset 4: Optimized Odoo Modern", () => {
      const preset = PRESETS.find((p) => p.id === "optimized-odoo")!;
      expect(preset).toBeDefined();
      const report = generateReport(preset.answers, "en");

      expect(report.pathKind).toBe("optimize");
      expect(report.zone).toBe("green");
      expect(report.score).toBeGreaterThanOrEqual(85);
      expect(report.recommendedPackage).toBe("support");
    });
  });

  describe("Strategic Remediation Roadmap and Deliverables", () => {
    it("tailors implementation stages to the chosen migration path", () => {
      const migrationReport = generateReport(
        { ...emptyAnswers, system: "1c", market: "ua" },
        "en",
      );
      expect(
        migrationReport.plan.some((stage) =>
          stage.title.toLowerCase().includes("migration"),
        ),
      ).toBe(true);

      const optimizeReport = generateReport(
        { ...emptyAnswers, system: "odoo" },
        "en",
      );
      expect(
        optimizeReport.plan.some((stage) =>
          stage.title.toLowerCase().includes("audit"),
        ),
      ).toBe(true);
    });

    it("recommends custom package for Odoo setups with unresolved pains", () => {
      const odooWithPains = generateReport(
        { ...emptyAnswers, system: "odoo", pains: ["manual", "reporting"] },
        "en",
      );
      expect(odooWithPains.recommendedPackage).toBe("custom");
    });
  });
});
