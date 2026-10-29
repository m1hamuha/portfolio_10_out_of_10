import { describe, it, expect } from 'vitest'
import { calculateRoiMetrics, ROI_CONSTANTS } from '../roi'

describe('RoiCalculator engine (calculateRoiMetrics)', () => {
  describe('Standard Baseline Calculations (Default Slider State)', () => {
    it('computes exact baseline metrics for 250 docs/mo and €45/hr wage', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 250, hourlyWageEur: 45 })

      // Annual volume: 250 * 12 = 3000
      expect(result.annualVolume).toBe(3000)

      // Time savings: (3000 * 411s) / 3600 = 342.5 hrs -> rounded 343 hrs
      expect(result.annualSavedHours).toBe(343)

      // Labor savings: 342.5 hrs * 4500 cents = 1,541,250 cents (€15,412.50)
      expect(result.annualLaborSavingsCents).toBe(1_541_250)

      // Error prevention: 3000 * 0.025 = 75 errors
      expect(result.annualErrorsPrevented).toBe(75)

      // Error savings: 75 * 15000 cents = 1,125,000 cents (€11,250.00)
      expect(result.annualErrorSavingsCents).toBe(1_125_000)

      // Net benefit: 1,541,250 + 1,125,000 - (9900 * 12) = 2,547,450 cents (€25,474.50)
      expect(result.netAnnualBenefitCents).toBe(2_547_450)

      // Payback period: 118,800 / (2,666,250 / 365) = 16.26 days -> 16 days
      expect(result.paybackDays).toBe(16)

      // Speedup percentage: (420 - 9) / 420 = 97.85% -> 98%
      expect(result.speedupPct).toBe(98)
    })
  })

  describe('Slider Boundary Conditions', () => {
    it('computes correct metrics at minimum slider bounds (50 docs/mo, €25/hr)', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 50, hourlyWageEur: 25 })

      expect(result.annualVolume).toBe(600)
      // (600 * 411) / 3600 = 68.5 -> rounded 69 hrs
      expect(result.annualSavedHours).toBe(69)
      // 68.5 * 2500 = 171,250 cents (€1,712.50)
      expect(result.annualLaborSavingsCents).toBe(171_250)
      // 600 * 0.025 = 15 errors
      expect(result.annualErrorsPrevented).toBe(15)
      // 15 * 15000 = 225,000 cents (€2,250.00)
      expect(result.annualErrorSavingsCents).toBe(225_000)
      // 171,250 + 225,000 - 118,800 = 277,450 cents (€2,774.50)
      expect(result.netAnnualBenefitCents).toBe(277_450)
      // 118,800 / (396,250 / 365) = 109.43 -> 109 days
      expect(result.paybackDays).toBe(109)
    })

    it('computes correct metrics at maximum slider bounds (2,500 docs/mo, €85/hr)', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 2500, hourlyWageEur: 85 })

      expect(result.annualVolume).toBe(30_000)
      // (30000 * 411) / 3600 = 3425 hrs
      expect(result.annualSavedHours).toBe(3425)
      // 3425 * 8500 = 29,112,500 cents (€291,125.00)
      expect(result.annualLaborSavingsCents).toBe(29_112_500)
      // 30000 * 0.025 = 750 errors
      expect(result.annualErrorsPrevented).toBe(750)
      // 750 * 15000 = 11,250,000 cents (€112,500.00)
      expect(result.annualErrorSavingsCents).toBe(11_250_000)
      // 29,112,500 + 11,250,000 - 118,800 = 40,243,700 cents (€402,437.00)
      expect(result.netAnnualBenefitCents).toBe(40_243_700)
      // 118,800 / (40,362,500 / 365) = 1.07 -> 1 day
      expect(result.paybackDays).toBe(1)
    })
  })

  describe('Adversarial & Edge Cases', () => {
    it('handles zero monthly volume safely without NaN or division by zero', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 0, hourlyWageEur: 45 })

      expect(result.annualVolume).toBe(0)
      expect(result.annualSavedHours).toBe(0)
      expect(result.annualLaborSavingsCents).toBe(0)
      expect(result.annualErrorsPrevented).toBe(0)
      expect(result.annualErrorSavingsCents).toBe(0)
      // Net benefit is negative platform subscription fee (-€1,188.00)
      expect(result.netAnnualBenefitCents).toBe(-118_800)
      // Payback period safely falls back to 365 days when daily savings is zero
      expect(result.paybackDays).toBe(365)
    })

    it('handles zero hourly wage gracefully (unpaid/volunteer processing)', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 250, hourlyWageEur: 0 })

      expect(result.annualLaborSavingsCents).toBe(0)
      // Error prevention savings still accrue
      expect(result.annualErrorSavingsCents).toBe(1_125_000)
      expect(result.netAnnualBenefitCents).toBe(1_006_200)
      // Payback based solely on error prevention savings: 118,800 / (1,125,000 / 365) = 38.5 -> 39 days
      expect(result.paybackDays).toBe(39)
    })

    it('clamps payback period to minimum of 1 day even for massive enterprise volumes', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 50_000, hourlyWageEur: 120 })

      expect(result.paybackDays).toBe(1)
      expect(result.netAnnualBenefitCents).toBeGreaterThan(0)
    })
  })

  describe('Financial Invariants & Determinism', () => {
    it('guarantees integer-cent invariants across all financial metrics', () => {
      const testCases = [
        { monthlyVolume: 75, hourlyWageEur: 33 },
        { monthlyVolume: 183, hourlyWageEur: 47 },
        { monthlyVolume: 611, hourlyWageEur: 62 },
        { monthlyVolume: 1420, hourlyWageEur: 79 },
      ]

      for (const tc of testCases) {
        const metrics = calculateRoiMetrics(tc)
        expect(Number.isInteger(metrics.annualLaborSavingsCents)).toBe(true)
        expect(Number.isInteger(metrics.annualErrorSavingsCents)).toBe(true)
        expect(Number.isInteger(metrics.netAnnualBenefitCents)).toBe(true)
        expect(Number.isInteger(metrics.paybackDays)).toBe(true)
      }
    })

    it('demonstrates strict monotonic increase in savings as volume expands', () => {
      const low = calculateRoiMetrics({ monthlyVolume: 100, hourlyWageEur: 45 })
      const mid = calculateRoiMetrics({ monthlyVolume: 500, hourlyWageEur: 45 })
      const high = calculateRoiMetrics({ monthlyVolume: 1000, hourlyWageEur: 45 })

      expect(mid.netAnnualBenefitCents).toBeGreaterThan(low.netAnnualBenefitCents)
      expect(high.netAnnualBenefitCents).toBeGreaterThan(mid.netAnnualBenefitCents)
      expect(mid.paybackDays).toBeLessThanOrEqual(low.paybackDays)
      expect(high.paybackDays).toBeLessThanOrEqual(mid.paybackDays)
    })

    it('verifies ROI_CONSTANTS values', () => {
      expect(ROI_CONSTANTS.MANUAL_SEC_PER_DOC).toBe(420)
      expect(ROI_CONSTANTS.AUTO_SEC_PER_DOC).toBe(9)
      expect(ROI_CONSTANTS.SAVED_SEC_PER_DOC).toBe(411)
      expect(ROI_CONSTANTS.ERROR_RATE).toBe(0.025)
      expect(ROI_CONSTANTS.AVG_ERROR_FIX_EUR_CENTS).toBe(15000)
      expect(ROI_CONSTANTS.PLATFORM_FEE_MONTHLY_CENTS).toBe(9900)
    })
  })
})
