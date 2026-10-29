import { describe, it, expect } from 'vitest'
import { extract, validate, detectDuplicate, PRESET_DOC_IDS, Money } from '../index'

describe('invoice presets suite', () => {
  it('exposes all 4 required presets', () => {
    expect(PRESET_DOC_IDS).toEqual([
      'DOC-CLEAN',
      'DOC-DUPLICATE',
      'DOC-MISSING',
      'DOC-MISMATCH',
    ])
  })

  it('DOC-CLEAN validates with 0 errors and 0 warnings', () => {
    const ext = extract('DOC-CLEAN')
    const issues = validate(ext)
    expect(issues).toHaveLength(0)
  })

  it('DOC-DUPLICATE matches DOC-CLEAN as an exact duplicate', () => {
    const clean = extract('DOC-CLEAN')
    const duplicate = extract('DOC-DUPLICATE')
    const result = detectDuplicate(duplicate, [clean])
    expect(result.isDuplicate).toBe(true)
    expect(result.matchType).toBe('EXACT')
    expect(result.confidence).toBe(1.0)
  })

  it('DOC-MISSING flags missing mandatory VAT ID and IBAN', () => {
    const ext = extract('DOC-MISSING')
    const issues = validate(ext)
    const vatMissing = issues.find((i) => i.id === 'missing_vat_id')
    const ibanMissing = issues.find((i) => i.id === 'missing_iban')

    expect(vatMissing).toBeDefined()
    expect(vatMissing?.severity).toBe('error')

    expect(ibanMissing).toBeDefined()
    expect(ibanMissing?.severity).toBe('warn')
  })

  it('DOC-MISMATCH flags line_sum error due to discrepancy', () => {
    const ext = extract('DOC-MISMATCH')
    const issues = validate(ext)
    const lineSumIssue = issues.find((i) => i.kind === 'line_sum')

    expect(lineSumIssue).toBeDefined()
    expect(lineSumIssue?.severity).toBe('error')
    expect(lineSumIssue?.message).toContain('Line items sum to 265,00 € but net reads 250,00 €')
  })

  it('all money fields across all presets strictly enforce integer cents', () => {
    for (const id of PRESET_DOC_IDS) {
      const ext = extract(id)
      const cents = [
        ext.netCents.value,
        ext.vatCents.value,
        ext.grossCents.value,
        ...ext.lineItems.flatMap((l) => [l.unitPriceCents, l.lineTotalCents]),
      ]
      for (const c of cents) {
        expect(Number.isInteger(c)).toBe(true)
        // Check Money class invariant
        expect(() => new Money(c)).not.toThrow()
      }
    }
  })
})
