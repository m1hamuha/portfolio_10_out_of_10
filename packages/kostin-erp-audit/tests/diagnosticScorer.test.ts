import { describe, it, expect } from "vitest";
import {
  generateReport,
  computeSubScores,
  repWeeklyHours,
  hourlyRate,
  computeImpact,
  clampScore,
} from "../src/generateReport";
import { emptyAnswers, getSteps } from "../src/questions";
import type { Answers } from "../src/types";

describe("Diagnostic Scorer & Architectural Sub-Scores (F19, F22)", () => {
  it("provides 7 clean diagnostic assessment steps", () => {
    const stepsEn = getSteps("en");
    const stepsUk = getSteps("uk");
    expect(stepsEn).toHaveLength(7);
    expect(stepsUk).toHaveLength(7);

    // Verify key step types and ordering
    expect(stepsEn[0].kind).toBe("single"); // system
    expect(stepsEn[1].kind).toBe("single"); // market
    expect(stepsEn[2].kind).toBe("single"); // size
    expect(stepsEn[3].kind).toBe("multi"); // integrations
    expect(stepsEn[4].kind).toBe("metrics"); // manual workload & volume
    expect(stepsEn[5].kind).toBe("metrics"); // reconciliation & double-entry
    expect(stepsEn[6].kind).toBe("pains"); // architectural pains & text
  });

  it("computes baseline score and clamps within [8, 98] range", () => {
    const report = generateReport(emptyAnswers, "en");
    expect(report.score).toBeGreaterThanOrEqual(8);
    expect(report.score).toBeLessThanOrEqual(98);
  });

  it("computes all 4 architectural sub-scores clamped within [10, 98]", () => {
    const answers: Answers = {
      ...emptyAnswers,
      system: "spreadsheets",
      market: "eu",
      size: "21-50",
      integrations: ["none"],
      manualHours: "15-40",
      doubleEntry: "yes",
      closeDays: "6-10",
      pains: ["manual", "disconnected", "reporting", "errors"],
    };

    const subScores = computeSubScores(answers, "implement", "en");
    expect(subScores).toHaveLength(4);

    const ids = subScores.map((s) => s.id);
    expect(ids).toEqual([
      "dataConsistency",
      "processBottlenecks",
      "migrationReadiness",
      "systemArchitecture",
    ]);

    for (const sub of subScores) {
      expect(sub.value).toBeGreaterThanOrEqual(10);
      expect(sub.value).toBeLessThanOrEqual(98);
      expect(typeof sub.label).toBe("string");
      expect(sub.label.length).toBeGreaterThan(0);
    }
  });

  it("localizes architectural sub-scores labels in Ukrainian (uk)", () => {
    const subScoresUk = computeSubScores(emptyAnswers, "implement", "uk");
    const labelsUk = subScoresUk.map((s) => s.label);
    expect(labelsUk).toEqual([
      "Узгодженість даних",
      "Вузькі місця процесів",
      "Готовність до міграції",
      "Архітектура системи",
    ]);
  });

  it("handles worst-case answers by strictly clamping score to 8 and sub-scores to 10", () => {
    const worstAnswers: Answers = {
      system: "1c",
      market: "ua",
      size: "200+",
      integrations: ["none"],
      manualHours: "40+",
      volume: "2000+",
      closeDays: "10+",
      doubleEntry: "yes",
      pains: [
        "manual",
        "disconnected",
        "reporting",
        "scaling",
        "errors",
        "compliance",
        "support",
        "cost",
      ],
      painText: "Catastrophic failure across all operations.",
    };

    const report = generateReport(worstAnswers, "en");
    expect(report.score).toBe(8);
    expect(report.zone).toBe("red");

    const subMap = Object.fromEntries(
      report.subScores.map((s) => [s.id, s.value]),
    );
    expect(subMap.migrationReadiness).toBe(10);
    expect(subMap.processBottlenecks).toBe(18);
    expect(subMap.dataConsistency).toBe(21);
    expect(subMap.systemArchitecture).toBe(56);
  });

  it("handles best-case Odoo answers by capping score at 98 and applying Odoo bonus", () => {
    const bestAnswers: Answers = {
      system: "odoo",
      market: "eu",
      size: "21-50",
      integrations: ["bank", "ecommerce", "crm", "einvoice"],
      manualHours: "lt5",
      volume: "500-2000",
      closeDays: "1-2",
      doubleEntry: "no",
      pains: [],
      painText: "",
    };

    const report = generateReport(bestAnswers, "en");
    expect(report.score).toBe(98);
    expect(report.zone).toBe("green");

    for (const sub of report.subScores) {
      expect(sub.value).toBeGreaterThanOrEqual(80);
      expect(sub.value).toBeLessThanOrEqual(98);
    }
  });

  describe("Deterministic Financial Impact Math", () => {
    it("maps weekly manual hours correctly for all answers and fallbacks", () => {
      expect(repWeeklyHours({ ...emptyAnswers, manualHours: "lt5" })).toBe(3);
      expect(repWeeklyHours({ ...emptyAnswers, manualHours: "5-15" })).toBe(10);
      expect(repWeeklyHours({ ...emptyAnswers, manualHours: "15-40" })).toBe(25);
      expect(repWeeklyHours({ ...emptyAnswers, manualHours: "40+" })).toBe(50);

      // Fallback by org size
      expect(repWeeklyHours({ ...emptyAnswers, size: "1-5" })).toBe(6);
      expect(repWeeklyHours({ ...emptyAnswers, size: "6-20" })).toBe(14);
      expect(repWeeklyHours({ ...emptyAnswers, size: "21-50" })).toBe(28);
      expect(repWeeklyHours({ ...emptyAnswers, size: "51-200" })).toBe(45);
      expect(repWeeklyHours({ ...emptyAnswers, size: "200+" })).toBe(70);
      expect(repWeeklyHours(emptyAnswers)).toBe(12);

      // Double entry 1.2x multiplier
      expect(
        repWeeklyHours({ ...emptyAnswers, manualHours: "15-40", doubleEntry: "yes" }),
      ).toBe(30); // 25 * 1.2 = 30
    });

    it("applies market-aware hourly rates strictly", () => {
      expect(hourlyRate("us")).toBe(35);
      expect(hourlyRate("eu")).toBe(32);
      expect(hourlyRate("ua")).toBe(15);
      expect(hourlyRate("other")).toBe(28);
      expect(hourlyRate("")).toBe(28);
    });

    it("calculates monthly hours, cost, and savings multipliers deterministically", () => {
      // Case A: doubleEntry !== 'yes' -> 60% savings
      const impactA = computeImpact({
        ...emptyAnswers,
        manualHours: "5-15", // 10 hrs/week
        market: "eu", // €32/hr
        doubleEntry: "no",
      });

      expect(impactA.weeklyHours).toBe(10);
      expect(impactA.monthlyHours).toBe(43); // Math.round(10 * 4.33)
      expect(impactA.hourlyRate).toBe(32);
      expect(impactA.monthlyCost).toBe(1380); // Math.round((43 * 32) / 10) * 10 = 1376 -> 1380
      expect(impactA.savingsPct).toBe(0.6);
      expect(impactA.savedHoursMonth).toBe(26); // Math.round(43 * 0.6) = 26
      expect(impactA.savedCostMonth).toBe(830); // Math.round((1380 * 0.6) / 10) * 10 = 828 -> 830
      expect(impactA.savedCostYear).toBe(10000); // Math.round((830 * 12) / 100) * 100 = 9960 -> 10000

      // Case B: doubleEntry === 'yes' -> 1.2x hours & 65% savings
      const impactB = computeImpact({
        ...emptyAnswers,
        manualHours: "15-40", // 25 -> 30 hrs/week
        market: "us", // €35/hr
        doubleEntry: "yes",
      });

      expect(impactB.weeklyHours).toBe(30);
      expect(impactB.monthlyHours).toBe(130); // Math.round(30 * 4.33)
      expect(impactB.hourlyRate).toBe(35);
      expect(impactB.monthlyCost).toBe(4550); // 130 * 35 = 4550
      expect(impactB.savingsPct).toBe(0.65);
      expect(impactB.savedHoursMonth).toBe(85); // Math.round(130 * 0.65) = 84.5 -> 85
      expect(impactB.savedCostMonth).toBe(2960); // Math.round((4550 * 0.65) / 10) * 10 = 2957.5 -> 2960
      expect(impactB.savedCostYear).toBe(35500); // Math.round((2960 * 12) / 100) * 100 = 35520 -> 35500
    });
  });

  describe("clampScore boundary testing", () => {
    it("clamps values below 10 to 10", () => {
      expect(clampScore(-50)).toBe(10);
      expect(clampScore(0)).toBe(10);
      expect(clampScore(9.4)).toBe(10);
    });

    it("clamps values above 98 to 98", () => {
      expect(clampScore(99)).toBe(98);
      expect(clampScore(120)).toBe(98);
    });

    it("rounds intermediate floats correctly", () => {
      expect(clampScore(45.4)).toBe(45);
      expect(clampScore(45.6)).toBe(46);
    });
  });
});
