import { describe, it, expect } from 'vitest'
import {
  extract,
  exportToCsv,
  exportToJson,
  exportToDatevExtf,
} from '../index'

describe('structured export engine', () => {
  const sampleDocs = [extract('DOC-CLEAN'), extract('DOC-1')]

  it('exports RFC 4180 compliant CSV with CRLF line endings and escaped quotes', () => {
    const csv = exportToCsv(sampleDocs)
    expect(csv.endsWith('\r\n')).toBe(true)

    const lines = csv.split('\r\n').filter(Boolean)
    expect(lines.length).toBe(3) // 1 header + 2 data rows

    const header = lines[0]
    expect(header).toContain('DocID,Supplier,Country,VAT_ID,Invoice_No')

    const row1 = lines[1]
    expect(row1).toContain('"Torréfaction Lyonnaise SARL"')
    expect(row1).toContain('"FAC-2026-0883"')
    expect(row1).toContain('"803.76"')
  })

  it('exports structured JSON with metadata envelope, ISO dates, and integer cents', () => {
    const jsonStr = exportToJson(sampleDocs)
    const parsed = JSON.parse(jsonStr)

    expect(parsed.generator).toBe('InvoiceAutopilot')
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.currency).toBe('EUR')
    expect(parsed.recordsCount).toBe(2)
    expect(typeof parsed.totalGrossCents).toBe('number')
    expect(Number.isInteger(parsed.totalGrossCents)).toBe(true)

    expect(parsed.documents).toHaveLength(2)
    expect(parsed.documents[0].docId).toBe('DOC-CLEAN')
    expect(parsed.documents[0].grossCents).toBe(80376)
    expect(parsed.documents[0].grossEur).toBe(803.76)
  })

  it('exports DATEV EXTF 700 format with UTF-8 BOM, standard headers, and German decimals', () => {
    const datev = exportToDatevExtf(sampleDocs, {
      beraternummer: 1001,
      mandantennummer: 99999,
      bezeichnung: 'Test DATEV Stapel',
    })

    // Prepend UTF-8 BOM \uFEFF
    expect(datev.startsWith('\uFEFF')).toBe(true)

    const cleanDatev = datev.slice(1) // strip BOM for splitting
    const lines = cleanDatev.split('\r\n').filter(Boolean)
    expect(lines.length).toBe(4) // Header 1 + Header 2 + 2 data rows

    // Header 1: EXTF 700
    expect(lines[0]).toContain('"EXTF";700;21;"Buchungsstapel"')
    expect(lines[0]).toContain('"Test DATEV Stapel"')

    // Header 2: Column titles
    expect(lines[1]).toContain('"Umsatz (ohne Soll/Haben-Kz)"')
    expect(lines[1]).toContain('"Soll/Haben-Kennzeichen"')

    // Data line 1: German decimal comma format e.g. "803,76"
    expect(lines[2]).toContain('"803,76"')
    expect(lines[2]).toContain(';"S";"EUR"')
  })
})
