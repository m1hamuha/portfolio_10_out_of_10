import { describe, it, expect } from 'vitest'
import { calculateRoiMetrics, ROI_CONSTANTS } from '../roi'

describe('Challenger Empirical Stress Suite: ROI Engine Invariants & Adversarial Math', () => {
  describe('Invariant 1: Strict Integer-Cent Guarantee Under 10,000 Randomized Floats', () => {
    it('guarantees integer-cent invariants for 10,000 randomized float volumes and wages', () => {
      // Deterministic PRNG for reproducible adversarial challenge
      let seed = 42
      function pseudoRandom() {
        seed = (seed * 16807) % 2147483647
        return (seed - 1) / 2147483646
      }

      for (let i = 0; i < 10000; i++) {
        // Generate diverse floating point volumes and fractional hourly wages
        const monthlyVolume = pseudoRandom() * 5000 // 0 to 5000 with fractional decimals
        const hourlyWageEur = pseudoRandom() * 150 // 0 to 150 with fractional cents e.g. 45.33333

        const metrics = calculateRoiMetrics({ monthlyVolume, hourlyWageEur })

        // Check integer invariant across all currency outputs
        expect(Number.isInteger(metrics.annualLaborSavingsCents)).toBe(true)
        expect(Number.isInteger(metrics.annualErrorSavingsCents)).toBe(true)
        expect(Number.isInteger(metrics.netAnnualBenefitCents)).toBe(true)

        // Check integer invariant across all operational metrics
        expect(Number.isInteger(metrics.paybackDays)).toBe(true)
        expect(Number.isInteger(metrics.annualSavedHours)).toBe(true)
        expect(Number.isInteger(metrics.annualErrorsPrevented)).toBe(true)
        expect(Number.isInteger(metrics.speedupPct)).toBe(true)

        // Check for NaN or Infinite corruptions
        expect(Number.isNaN(metrics.annualLaborSavingsCents)).toBe(false)
        expect(Number.isNaN(metrics.annualErrorSavingsCents)).toBe(false)
        expect(Number.isNaN(metrics.netAnnualBenefitCents)).toBe(false)
        expect(Number.isNaN(metrics.paybackDays)).toBe(false)
        expect(Number.isFinite(metrics.paybackDays)).toBe(true)

        // Payback period lower bound invariant: must never be < 1
        expect(metrics.paybackDays).toBeGreaterThanOrEqual(1)

        // Bridge invariant: net benefit = labor savings + error savings - annual platform fee
        const annualPlatformCostCents = ROI_CONSTANTS.PLATFORM_FEE_MONTHLY_CENTS * 12
        expect(metrics.netAnnualBenefitCents).toBe(
          metrics.annualLaborSavingsCents + metrics.annualErrorSavingsCents - annualPlatformCostCents,
        )
      }
    })
  })

  describe('Invariant 2: Boundary & Extreme Values', () => {
    it('handles exact zero inputs without division by zero or NaN', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 0, hourlyWageEur: 0 })

      expect(result.annualVolume).toBe(0)
      expect(result.annualSavedHours).toBe(0)
      expect(result.annualLaborSavingsCents).toBe(0)
      expect(result.annualErrorsPrevented).toBe(0)
      expect(result.annualErrorSavingsCents).toBe(0)
      expect(result.netAnnualBenefitCents).toBe(-ROI_CONSTANTS.PLATFORM_FEE_MONTHLY_CENTS * 12)
      expect(result.paybackDays).toBe(365)
    })

    it('handles negative inputs safely via floor clamping', () => {
      const result = calculateRoiMetrics({ monthlyVolume: -500, hourlyWageEur: -45 })

      expect(result.annualVolume).toBe(0)
      expect(result.annualSavedHours).toBe(0)
      expect(result.annualLaborSavingsCents).toBe(0)
      expect(result.netAnnualBenefitCents).toBe(-ROI_CONSTANTS.PLATFORM_FEE_MONTHLY_CENTS * 12)
      expect(result.paybackDays).toBe(365)
    })

    it('handles massive enterprise volumes up to 10,000,000 invoices/month without integer overflow', () => {
      const result = calculateRoiMetrics({ monthlyVolume: 10_000_000, hourlyWageEur: 150 })

      // Annual volume: 120,000,000 docs
      expect(result.annualVolume).toBe(120_000_000)
      expect(Number.isSafeInteger(result.annualLaborSavingsCents)).toBe(true)
      expect(Number.isSafeInteger(result.annualErrorSavingsCents)).toBe(true)
      expect(Number.isSafeInteger(result.netAnnualBenefitCents)).toBe(true)
      expect(result.paybackDays).toBe(1)
    })

    it('handles micro-fractions and IEEE 754 float drift gracefully', () => {
      // 0.1 + 0.2 = 0.30000000000000004
      const result = calculateRoiMetrics({
        monthlyVolume: 0.1 + 0.2,
        hourlyWageEur: 0.1 + 0.2,
      })

      expect(Number.isInteger(result.annualLaborSavingsCents)).toBe(true)
      expect(Number.isInteger(result.annualErrorSavingsCents)).toBe(true)
      expect(Number.isInteger(result.netAnnualBenefitCents)).toBe(true)
      expect(Number.isInteger(result.paybackDays)).toBe(true)
    })
  })

  describe('Invariant 3: Economic Monotonicity & Payback Bounds', () => {
    it('strictly satisfies monotonic increase in savings as monthly volume scales', () => {
      const volumes = [10, 50, 100, 250, 500, 1000, 2500, 5000]
      let prevBenefit = -Infinity
      let prevPayback = Infinity

      for (const vol of volumes) {
        const metrics = calculateRoiMetrics({ monthlyVolume: vol, hourlyWageEur: 45 })
        expect(metrics.netAnnualBenefitCents).toBeGreaterThan(prevBenefit)
        expect(metrics.paybackDays).toBeLessThanOrEqual(prevPayback)
        prevBenefit = metrics.netAnnualBenefitCents
        prevPayback = metrics.paybackDays
      }
    })

    it('strictly satisfies monotonic increase in savings as hourly wage scales', () => {
      const wages = [15, 25, 45, 65, 85, 120, 200]
      let prevBenefit = -Infinity
      let prevPayback = Infinity

      for (const wage of wages) {
        const metrics = calculateRoiMetrics({ monthlyVolume: 250, hourlyWageEur: wage })
        expect(metrics.netAnnualBenefitCents).toBeGreaterThan(prevBenefit)
        expect(metrics.paybackDays).toBeLessThanOrEqual(prevPayback)
        prevBenefit = metrics.netAnnualBenefitCents
        prevPayback = metrics.paybackDays
      }
    })
  })
})
