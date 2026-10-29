import { describe, it, expect } from 'vitest'
import { generateStore } from '../generate'
import {
  computePortfolioHealthScore,
  buildExecutiveReportData,
  generateExecutiveReportHtml,
} from '../report'

describe('Executive Audit Report Engine', () => {
  it('computes portfolio health score within [0, 100] bounds', () => {
    const store = generateStore(42, 50000)
    const health = computePortfolioHealthScore(store)

    expect(health.score).toBeGreaterThanOrEqual(0)
    expect(health.score).toBeLessThanOrEqual(100)
    expect(health.breakdown.marginHealth).toBeGreaterThanOrEqual(0)
    expect(health.breakdown.marginHealth).toBeLessThanOrEqual(35)
    expect(health.breakdown.bleedControl).toBeGreaterThanOrEqual(0)
    expect(health.breakdown.bleedControl).toBeLessThanOrEqual(30)
    expect(health.breakdown.costIntegrity).toBeGreaterThanOrEqual(0)
    expect(health.breakdown.costIntegrity).toBeLessThanOrEqual(20)
    expect(health.breakdown.feeEfficiency).toBeGreaterThanOrEqual(0)
    expect(health.breakdown.feeEfficiency).toBeLessThanOrEqual(15)

    expect(['Critical Risk', 'Needs Attention', 'Healthy', 'Exceptional']).toContain(health.grade)
  })

  it('builds executive report data with priority directives and integer cent sums', () => {
    const store = generateStore(777, 100000)
    const reportData = buildExecutiveReportData(store, 'Test Store')

    expect(reportData.storeName).toBe('Test Store')
    expect(reportData.totalSkus).toBe(store.skus.length)
    expect(reportData.directives.length).toBeGreaterThan(0)
    expect(reportData.monthlyGrossRevenueCents).toBeGreaterThan(0)
    expect(Number.isInteger(reportData.monthlyGrossRevenueCents)).toBe(true)
    expect(Number.isInteger(reportData.monthlyRecoverableBleedCents)).toBe(true)
    expect(Number.isInteger(reportData.annualizedRecoverableBleedCents)).toBe(true)

    // Annualized = monthly * 12
    expect(reportData.annualizedRecoverableBleedCents).toBe(reportData.monthlyRecoverableBleedCents * 12)
  })

  it('generates print-ready HTML containing vector CSS and required sections', () => {
    const store = generateStore(999, 50000)
    const reportData = buildExecutiveReportData(store, 'Alpha Retail')
    const html = generateExecutiveReportHtml(reportData)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('@media print')
    expect(html).toContain('MarginPulse Executive Audit — Alpha Retail')
    expect(html).toContain('MarginPulse Financial Health Audit')
    expect(html).toContain('Alpha Retail')
    expect(html).toContain('Portfolio Health Status')
    expect(html).toContain('Prioritized Action Directives')
    expect(html).toContain('Top Bleeding SKUs Requiring Remediation')
  })
})
