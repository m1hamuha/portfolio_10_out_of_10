import { describe, it, expect, vi } from 'vitest'
import { STRESS_1000_PRESET } from '../presets'
import { importRawExports } from '../raw-import'
import { buildStoreFromSkus } from '../generate'
import { computeCanonicalWaterfall } from '../waterfall'
import { buildExecutiveReportData, generateExecutiveReportHtml } from '../report'

describe('Zero Data Exfiltration Invariant', () => {
  it('performs entire financial audit, waterfall analysis, and report generation with zero network requests', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    // Run end-to-end import, analysis, report generation
    const result = importRawExports(STRESS_1000_PRESET.files)
    const store = buildStoreFromSkus(result.skus, 100000, 'Security Audit Store')
    const waterfall = computeCanonicalWaterfall(store)
    const reportData = buildExecutiveReportData(store, 'Security Audit Store')
    const html = generateExecutiveReportHtml(reportData)

    expect(waterfall).toHaveLength(7)
    expect(html.length).toBeGreaterThan(100)

    // Invariant: fetch was never called
    expect(fetchSpy).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
