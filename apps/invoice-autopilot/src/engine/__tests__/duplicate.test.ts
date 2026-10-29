import { describe, it, expect } from 'vitest'
import {
  extract,
  detectDuplicate,
  normalizeSupplier,
  normalizeInvoiceNo,
} from '../index'

describe('duplicate detection engine', () => {
  it('normalizes supplier names ignoring case, diacritics, and legal entities', () => {
    expect(normalizeSupplier('Torréfaction Lyonnaise SARL')).toBe(
      normalizeSupplier('Torrefaction Lyonnaise S.A.R.L.'),
    )
    expect(normalizeSupplier('Bauer Industriebedarf GmbH')).toBe('bauerindustriebedarf')
    expect(normalizeSupplier('Alpine Tools GmbH & Co. KG')).toBe(
      normalizeSupplier('Alpine Tools'),
    )
  })

  it('normalizes invoice numbers removing spaces, hyphens, and slashes', () => {
    expect(normalizeInvoiceNo('FAC-2026-0883')).toBe('FAC20260883')
    expect(normalizeInvoiceNo('fac 2026/0883')).toBe('FAC20260883')
    expect(normalizeInvoiceNo('RE-2026-04417')).toBe('RE202604417')
  })

  it('detects exact duplicate when supplier, invoiceNo, and gross match', () => {
    const clean = extract('DOC-CLEAN')
    const duplicate = extract('DOC-DUPLICATE')

    const result = detectDuplicate(duplicate, [clean])
    expect(result.isDuplicate).toBe(true)
    expect(result.confidence).toBe(1.0)
    expect(result.matchType).toBe('EXACT')
    expect(result.matchedWithInvoiceNo).toBe('FAC-2026-0883')
    expect(result.matchedFields).toContain('supplier')
    expect(result.matchedFields).toContain('invoiceNo')
    expect(result.matchedFields).toContain('grossCents')
  })

  it('detects fuzzy duplicate when supplier and invoiceNo match but date or amount differ', () => {
    const original = extract('DOC-CLEAN')
    const modified = extract('DOC-CLEAN')
    modified.docId = 'DOC-DUPLICATE'
    modified.grossCents.value = 999_00 // Different amount

    const result = detectDuplicate(modified, [original])
    expect(result.isDuplicate).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(0.85)
    expect(result.matchType).toBe('FUZZY_SUSPECTED')
    expect(result.divergentFields).toContain('grossCents')
  })

  it('returns false for completely unrelated documents', () => {
    const doc1 = extract('DOC-1')
    const docClean = extract('DOC-CLEAN')

    const result = detectDuplicate(doc1, [docClean])
    expect(result.isDuplicate).toBe(false)
    expect(result.confidence).toBe(0)
    expect(result.matchType).toBe('NONE')
  })

  it('does not match a document with itself', () => {
    const doc = extract('DOC-CLEAN')
    const result = detectDuplicate(doc, [doc])
    expect(result.isDuplicate).toBe(false)
  })
})
