import type { Extraction, LedgerEntry, DatevExtfConfig } from './types'
import { toEuros, formatEur } from './money'

export type ExportableRecord = Extraction | LedgerEntry

export interface NormalizedExportRow {
  docId: string
  supplier: string
  country: string
  vatId: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  currency: string
  netCents: number
  vatRatePct: number
  vatCents: number
  grossCents: number
  postedAtMs: number
}

export function normalizeRecordForExport(rec: ExportableRecord): NormalizedExportRow {
  if ('lineItems' in rec) {
    return {
      docId: rec.docId,
      supplier: rec.supplier.value,
      country: rec.country,
      vatId: rec.vatId.value,
      invoiceNo: rec.invoiceNo.value,
      invoiceDate: rec.invoiceDate.value,
      dueDate: rec.dueDate.value,
      currency: rec.currency,
      netCents: rec.netCents.value,
      vatRatePct: rec.vatRatePct.value,
      vatCents: rec.vatCents.value,
      grossCents: rec.grossCents.value,
      postedAtMs: Date.now(),
    }
  } else {
    return {
      docId: rec.docId,
      supplier: rec.supplier,
      country: rec.country,
      vatId: '',
      invoiceNo: rec.invoiceNo,
      invoiceDate: new Date(rec.postedAtMs).toISOString().split('T')[0],
      dueDate: '',
      currency: 'EUR',
      netCents: rec.netCents,
      vatRatePct: Math.round((rec.vatCents / Math.max(rec.netCents, 1)) * 100),
      vatCents: rec.vatCents,
      grossCents: rec.grossCents,
      postedAtMs: rec.postedAtMs,
    }
  }
}

/** RFC 4180 CSV value escaping: wrap in quotes and escape internal quotes */
function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""'
  const str = String(val)
  return `"${str.replace(/"/g, '""')}"`
}

/**
 * 1. RFC 4180 Compliant CSV Export
 */
export function exportToCsv(records: ExportableRecord[]): string {
  const headers = [
    'DocID',
    'Supplier',
    'Country',
    'VAT_ID',
    'Invoice_No',
    'Invoice_Date',
    'Due_Date',
    'Currency',
    'Net_EUR',
    'VAT_Rate_Pct',
    'VAT_EUR',
    'Gross_EUR',
    'Net_Cents',
    'VAT_Cents',
    'Gross_Cents',
  ]

  const rows = records.map(normalizeRecordForExport).map((r) => [
    escapeCsv(r.docId),
    escapeCsv(r.supplier),
    escapeCsv(r.country),
    escapeCsv(r.vatId),
    escapeCsv(r.invoiceNo),
    escapeCsv(r.invoiceDate),
    escapeCsv(r.dueDate),
    escapeCsv(r.currency),
    escapeCsv((r.netCents / 100).toFixed(2)),
    escapeCsv(r.vatRatePct),
    escapeCsv((r.vatCents / 100).toFixed(2)),
    escapeCsv((r.grossCents / 100).toFixed(2)),
    escapeCsv(r.netCents),
    escapeCsv(r.vatCents),
    escapeCsv(r.grossCents),
  ])

  // RFC 4180 specifies CRLF line endings
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n') + '\r\n'
}

/**
 * 2. Standard Structured JSON Export
 */
export function exportToJson(records: ExportableRecord[]): string {
  const normalized = records.map(normalizeRecordForExport)
  const totalGrossCents = normalized.reduce((acc, r) => acc + r.grossCents, 0)

  const payload = {
    generator: 'InvoiceAutopilot',
    version: '1.0.0',
    exportTimestamp: new Date().toISOString(),
    recordsCount: normalized.length,
    currency: 'EUR',
    totalGrossCents,
    totalGrossFormatted: formatEur(totalGrossCents),
    documents: normalized.map((doc) => ({
      ...doc,
      netEur: toEuros(doc.netCents),
      vatEur: toEuros(doc.vatCents),
      grossEur: toEuros(doc.grossCents),
    })),
  }

  return JSON.stringify(payload, null, 2)
}

/**
 * 3. DATEV EXTF 700 Accounting Export
 * Standard German accounting exchange format (Kanzlei-Rechnungswesen / Unternehmen online).
 * Character set: UTF-8 with BOM or ISO-8859-1; Semicolon delimiter; CRLF line endings.
 */
export function exportToDatevExtf(
  records: ExportableRecord[],
  config: DatevExtfConfig = {},
): string {
  const beraternummer = config.beraternummer ?? 1001
  const mandantennummer = config.mandantennummer ?? 99999
  const wjBeginn = config.wirtschaftsjahrBeginn ?? '20260101'
  const sachkontenLaenge = config.sachkontenLaenge ?? 4
  const bezeichnung = config.bezeichnung ?? 'InvoiceAutopilot Buchungsstapel'

  const now = new Date()
  const genDate = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const genTime = now.toTimeString().slice(0, 8).replace(/:/g, '') // HHMMSS

  // Header Record (Line 1): Format definition EXTF version 700
  // "EXTF";Version;Kategorie;Formatname;Formatversion;ErzeugtAm;Importiert;Herkunft;ExportiertVon;ImportiertVon;Berater;Mandant;WJ-Beginn;Sachkontenlänge;DatumVon;DatumBis;Bezeichnung;Diktatkürzel;Buchungstyp;Rechnungslegungszweck;Festschreibung;WKZ
  const header1 = [
    '"EXTF"',
    '700',
    '21', // 21 = Buchungsstapel
    '"Buchungsstapel"',
    '12', // Format version 12
    `${genDate}${genTime}`,
    '',
    '"IA"', // Herkunft: InvoiceAutopilot
    '"Autopilot"',
    '',
    String(beraternummer),
    String(mandantennummer),
    wjBeginn,
    String(sachkontenLaenge),
    genDate,
    genDate,
    `"${bezeichnung}"`,
    '"IA"',
    '1', // 1 = Dialogbuchung / Stapel
    '0',
    '0',
    '"EUR"',
  ].join(';')

  // Column Title Record (Line 2): Standard DATEV field definitions
  const header2 = [
    '"Umsatz (ohne Soll/Haben-Kz)"',
    '"Soll/Haben-Kennzeichen"',
    '"WKZ Umsatz"',
    '"Kurs"',
    '"Basis-Umsatz"',
    '"WKZ Basis-Umsatz"',
    '"Konto"',
    '"Gegenkonto (ohne BU-Schlüssel)"',
    '"BU-Schlüssel"',
    '"Belegdatum"',
    '"Belegfeld 1"',
    '"Belegfeld 2"',
    '"Skonto"',
    '"Buchungstext"',
  ].join(';')

  // Data Records
  const normalized = records.map(normalizeRecordForExport)
  const dataRows = normalized.map((r) => {
    // Umsatz formatted in German decimal with comma e.g. "178,70"
    const umsatzFormatted = `"${(r.grossCents / 100).toFixed(2).replace('.', ',')}"`
    const shFlag = '"S"' // Soll / Expense debit
    const wkz = '"EUR"'
    const konto = '"3400"' // Wareneingang / Expense account (SKR03 standard)
    const gegenkonto = '"70000"' // Kreditoren-Sammelkonto (Vendor liability)
    const buSchluessel = r.vatRatePct === 19 ? '"9"' : '""' // 9 = automatic 19% input tax in SKR03

    // Belegdatum: DDMM format (e.g. "1206" for June 12th)
    const parts = r.invoiceDate.split('-')
    const belegdatum = parts.length === 3 ? `"${parts[2]}${parts[1]}"` : `"${genDate.slice(6, 8)}${genDate.slice(4, 6)}"`

    // Belegfeld 1: Invoice number (max 36 chars)
    const belegfeld1 = `"${r.invoiceNo.slice(0, 36).replace(/"/g, '')}"`

    // Buchungstext: Supplier description (max 60 chars)
    const buchungstext = `"${r.supplier.slice(0, 60).replace(/"/g, '')}"`

    return [
      umsatzFormatted,
      shFlag,
      wkz,
      '', // Kurs
      '', // Basis-Umsatz
      '', // WKZ Basis-Umsatz
      konto,
      gegenkonto,
      buSchluessel,
      belegdatum,
      belegfeld1,
      '""', // Belegfeld 2
      '""', // Skonto
      buchungstext,
    ].join(';')
  })

  // Prepend UTF-8 Byte Order Mark (\uFEFF) for compatibility with Excel and DATEV
  return '\uFEFF' + [header1, header2, ...dataRows].join('\r\n') + '\r\n'
}

/**
 * Universal browser file download helper
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
