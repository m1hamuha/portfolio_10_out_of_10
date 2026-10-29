import type { Cents } from './money'

export interface RoiInputs {
  monthlyVolume: number
  hourlyWageEur: number
}

export interface RoiMetrics {
  annualVolume: number
  annualSavedHours: number
  annualLaborSavingsCents: Cents
  annualErrorsPrevented: number
  annualErrorSavingsCents: Cents
  netAnnualBenefitCents: Cents
  paybackDays: number
  speedupPct: number
}

export const ROI_CONSTANTS = {
  MANUAL_SEC_PER_DOC: 420, // 7 minutes
  AUTO_SEC_PER_DOC: 9, // 9 seconds
  SAVED_SEC_PER_DOC: 411, // 420 - 9 = 411 seconds (97.8% speedup)
  ERROR_RATE: 0.025, // 2.5% industry manual invoice error rate
  AVG_ERROR_FIX_EUR_CENTS: 150_00, // €150 per corrected mismatch (labour + penalty)
  PLATFORM_FEE_MONTHLY_CENTS: 99_00, // €99/month SMB subscription
} as const

/**
 * Calculates quantifiable AP ROI and cost savings strictly in integer cents.
 *
 * Invariants:
 * 1. Financial values are integer cents (`Number.isInteger(cents) === true`).
 * 2. Payback days is strictly clamped to >= 1 when daily savings > 0, and 365 if savings <= 0.
 * 3. Pure deterministic function with zero side effects.
 */
export function calculateRoiMetrics({
  monthlyVolume,
  hourlyWageEur,
}: RoiInputs): RoiMetrics {
  const annualVolume = Math.max(0, monthlyVolume) * 12
  const wageCents = Math.max(0, hourlyWageEur) * 100

  // Time calculations
  const annualSavedSeconds = annualVolume * ROI_CONSTANTS.SAVED_SEC_PER_DOC
  const annualSavedHours = annualSavedSeconds / 3600

  // Labor cost savings in cents (integer invariant)
  const annualLaborSavingsCents = Math.round(annualSavedHours * wageCents)

  // Error prevention savings in cents
  const annualErrorsPrevented = Math.round(annualVolume * ROI_CONSTANTS.ERROR_RATE)
  const annualErrorSavingsCents = annualErrorsPrevented * ROI_CONSTANTS.AVG_ERROR_FIX_EUR_CENTS

  // Net financial ROI in cents
  const annualPlatformCostCents = ROI_CONSTANTS.PLATFORM_FEE_MONTHLY_CENTS * 12
  const netAnnualBenefitCents =
    annualLaborSavingsCents + annualErrorSavingsCents - annualPlatformCostCents

  // Payback period in integer days
  const totalDailySavingsCents = (annualLaborSavingsCents + annualErrorSavingsCents) / 365
  const paybackDays =
    totalDailySavingsCents > 0
      ? Math.max(1, Math.round(annualPlatformCostCents / totalDailySavingsCents))
      : 365

  return {
    annualVolume,
    annualSavedHours: Math.round(annualSavedHours),
    annualLaborSavingsCents,
    annualErrorsPrevented,
    annualErrorSavingsCents,
    netAnnualBenefitCents,
    paybackDays,
    speedupPct: Math.round(
      ((ROI_CONSTANTS.MANUAL_SEC_PER_DOC - ROI_CONSTANTS.AUTO_SEC_PER_DOC) /
        ROI_CONSTANTS.MANUAL_SEC_PER_DOC) *
        100,
    ),
  }
}
