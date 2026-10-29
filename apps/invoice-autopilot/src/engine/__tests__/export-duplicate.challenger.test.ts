import { describe, it, expect } from 'vitest'
import {
  extract,
  detectDuplicate,
  normalizeSupplier,
  normalizeInvoiceNo,
  exportToCsv,
  exportToJson,
  exportToDatevExtf,
} from '../index'
import type { DocId, Extraction } from '../types'

describe('Challenger Empirical Stress Suite: Duplicate Detection & Export Engine', () => {
  describe('Duplicate Detection Stress Testing', () => {
    it('never produces false-positive duplicates when supplier or invoice number are empty', () => {
      const docA = extract('DOC-CLEAN')
      docA.supplier.value = ''
      docA.invoiceNo.value = ''

      const docB = extract('DOC-CLEAN')
      docB.docId = 'DOC-2' as DocId
      docB.supplier.value = ''
      docB.invoiceNo.value = ''

      const result = detectDuplicate(docA, [docB])
      expect(result.isDuplicate).toBe(false)
      expect(result.confidence).toBe(0)
    })

    it('robustly matches vendor names with diacritics, legal entities, and whitespace variations', () => {
      const variations = [
        'Kaffee Rösterei München GmbH',
        'Kaffee Rosterei Munchen G.m.b.H.',
        'kaffee-rosterei-munchen inc.',
        'Kaffee Rösterei München GmbH & Co. KG',
      ]

      const normalized = variations.map(normalizeSupplier)
      // All should normalize to 'kaffeerostereimunchen'
      for (const norm of normalized) {
        expect(norm).toBe('kaffeerostereimunchen')
      }

      // Verify invoice number normalization
      expect(normalizeInvoiceNo(' inv-2026 / 001 ')).toBe('INV2026001')
    })

    it('handles duplicate scan over 1,000 existing ledger documents in sub-100ms', () => {
      const thousandDocs: Extraction[] = []

      for (let i = 0; i < 1000; i++) {
        const d = extract('DOC-CLEAN')
        d.docId = `DOC-${(i % 3) + 1}` as DocId
        d.invoiceNo.value = `INV-2025-${String(i).padStart(5, '0')}`
        d.supplier.value = `Supplier Number ${i}`
        d.grossCents.value = 10000 + i * 10
        thousandDocs.push(d)
      }

      // Add one true duplicate at index 999
      const trueDuplicate = extract('DOC-CLEAN')
      trueDuplicate.docId = 'DOC-DUPLICATE' as DocId
      trueDuplicate.invoiceNo.value = thousandDocs[999].invoiceNo.value
      trueDuplicate.supplier.value = thousandDocs[999].supplier.value
      trueDuplicate.grossCents.value = thousandDocs[999].grossCents.value

      const start = performance.now()
      const result = detectDuplicate(trueDuplicate, thousandDocs)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // sub-100ms across 1,000 docs
      expect(result.isDuplicate).toBe(true)
      expect(result.matchType).toBe('EXACT')
      expect(result.confidence).toBe(1.0)
      expect(result.matchedWithInvoiceNo).toBe(thousandDocs[999].invoiceNo.value)
    })
  })

  describe('Export Engine Stress Testing', () => {
    it('handles empty documents array without crashing across all formats', () => {
      const csv = exportToCsv([])
      expect(csv.startsWith('DocID,Supplier')).toBe(true)
      expect(csv.endsWith('\r\n')).toBe(true)

      const jsonStr = exportToJson([])
      const parsed = JSON.parse(jsonStr)
      expect(parsed.recordsCount).toBe(0)
      expect(parsed.totalGrossCents).toBe(0)
      expect(parsed.documents).toHaveLength(0)

      const datev = exportToDatevExtf([])
      expect(datev.startsWith('\uFEFF"EXTF"')).toBe(true)
      const lines = datev.slice(1).split('\r\n').filter(Boolean)
      expect(lines).toHaveLength(2) // Header 1 and Header 2 only
    })

    it('sanitizes adversarial strings (embedded quotes, semicolons, commas) in exports', () => {
      const doc = extract('DOC-CLEAN')
      doc.supplier.value = 'Müller, "Acme" & Söhne; G.m.b.H.'
      doc.invoiceNo.value = 'INV-"2026";001'

      // CSV export must escape quotes according to RFC 4180
      const csv = exportToCsv([doc])
      expect(csv).toContain('""Acme""')

      // DATEV export must escape internal quotes and preserve semicolon delimiters
      const datev = exportToDatevExtf([doc])
      expect(datev.startsWith('\uFEFF')).toBe(true)
      const lines = datev.slice(1).split('\r\n').filter(Boolean)
      expect(lines).toHaveLength(3) // 2 headers + 1 row
      const dataCols = lines[2].split(';')
      expect(dataCols.length).toBeGreaterThanOrEqual(13)

      // JSON export must parse cleanly back into object
      const jsonStr = exportToJson([doc])
      const parsed = JSON.parse(jsonStr)
      expect(parsed.documents[0].supplier).toBe('Müller, "Acme" & Söhne; G.m.b.H.')
    })

    it('enforces DATEV field length truncations (36 chars for invoiceNo, 60 for supplier)', () => {
      const doc = extract('DOC-CLEAN')
      doc.invoiceNo.value = 'A'.repeat(100)
      doc.supplier.value = 'B'.repeat(100)

      const datev = exportToDatevExtf([doc])
      const lines = datev.slice(1).split('\r\n').filter(Boolean)
      const dataCols = lines[2].split(';')

      // Belegfeld 1 is at index 10
      const belegfeld1 = dataCols[10].replace(/"/g, '')
      expect(belegfeld1.length).toBe(36)

      // Buchungstext is at index 13
      const buchungstext = dataCols[13].replace(/"/g, '')
      expect(buchungstext.length).toBe(60)
    })
  })
})
