import type { DocId, Extraction, LineItem } from './types'

const li = (
  desc: string,
  qty: number,
  unitPriceCents: number,
  lineTotalCents: number,
  box: LineItem['box'],
  confidence: number,
): LineItem => ({ desc, qty, unitPriceCents, lineTotalCents, box, confidence })

// ============================ PRESET 1: Clean Standard Invoice (DOC-CLEAN / DOC-2) =============
// French Factur-X / German Clean: 100% compliant, perfect math, valid VAT & IBAN.
const CLEAN_LINES: LineItem[] = [
  li('Café en grains Arabica 1kg', 24, 18_50, 444_00, { x: 0.07, y: 0.44, w: 0.86, h: 0.05 }, 0.99),
  li('Filtres papier n°4 (boîte 100)', 30, 3_20, 96_00, { x: 0.07, y: 0.495, w: 0.86, h: 0.05 }, 0.99),
  li('Sirop vanille 1L', 12, 7_90, 94_80, { x: 0.07, y: 0.55, w: 0.86, h: 0.05 }, 0.98),
  li('Transport express', 1, 35_00, 35_00, { x: 0.07, y: 0.605, w: 0.86, h: 0.05 }, 0.99),
]
const CLEAN_NET = CLEAN_LINES.reduce((a, l) => a + l.lineTotalCents, 0) // 669_80
const CLEAN_RATE = 20
const CLEAN_VAT = Math.round((CLEAN_NET * CLEAN_RATE) / 100) // 133_96
const CLEAN_GROSS = CLEAN_NET + CLEAN_VAT // 803_76

// ============================ PRESET 2: Suspected Duplicate (DOC-DUPLICATE) ====================
// Identical supplier, invoice number, amount, and date as an already filed invoice.
// Mirrors DOC-CLEAN / Torréfaction Lyonnaise FAC-2026-0883 (€803.76, 2026-06-15).
const DUPLICATE_LINES: LineItem[] = [
  li('Café en grains Arabica 1kg', 24, 18_50, 444_00, { x: 0.07, y: 0.44, w: 0.86, h: 0.05 }, 0.95),
  li('Filtres papier n°4 (boîte 100)', 30, 3_20, 96_00, { x: 0.07, y: 0.495, w: 0.86, h: 0.05 }, 0.95),
  li('Sirop vanille 1L', 12, 7_90, 94_80, { x: 0.07, y: 0.55, w: 0.86, h: 0.05 }, 0.95),
  li('Transport express', 1, 35_00, 35_00, { x: 0.07, y: 0.605, w: 0.86, h: 0.05 }, 0.95),
]
const DUPLICATE_NET = CLEAN_NET
const DUPLICATE_RATE = CLEAN_RATE
const DUPLICATE_VAT = CLEAN_VAT
const DUPLICATE_GROSS = CLEAN_GROSS

// ============================ PRESET 3: Missing Mandatory Field (DOC-MISSING) ==================
// German supplier invoice with completely empty VAT ID and missing IBAN.
const MISSING_LINES: LineItem[] = [
  li('Server-Wartung Q2/2026', 1, 350_00, 350_00, { x: 0.08, y: 0.46, w: 0.84, h: 0.052 }, 0.96),
  li('Cloud-Backup 1TB', 3, 25_00, 75_00, { x: 0.08, y: 0.52, w: 0.84, h: 0.052 }, 0.94),
]
const MISSING_NET = 425_00
const MISSING_RATE = 19
const MISSING_VAT = Math.round((MISSING_NET * MISSING_RATE) / 100) // 80_75
const MISSING_GROSS = MISSING_NET + MISSING_VAT // 505_75

// ============================ PRESET 4: Calculation Mismatch (DOC-MISMATCH) ====================
// Sum of line items = €265.00, but printed net reads €250.00 (discrepancy €15.00).
const MISMATCH_LINES: LineItem[] = [
  li('Pneumatik-Schlauch 10m', 3, 50_00, 150_00, { x: 0.08, y: 0.455, w: 0.84, h: 0.052 }, 0.95),
  li('Druckluft-Kupplung NW 7.2', 2, 45_00, 90_00, { x: 0.08, y: 0.515, w: 0.84, h: 0.052 }, 0.95),
  li('Dichtungsring-Satz (50 Stk)', 1, 25_00, 25_00, { x: 0.08, y: 0.575, w: 0.84, h: 0.052 }, 0.95),
]
const MISMATCH_PRINTED_NET = 250_00
const MISMATCH_RATE = 19
const MISMATCH_VAT = Math.round((MISMATCH_PRINTED_NET * MISMATCH_RATE) / 100) // 47_50
const MISMATCH_GROSS = MISMATCH_PRINTED_NET + MISMATCH_VAT // 297_50

// Legacy DOC-1 (Price typo) & DOC-3 (Low confidence)
const DOC1_LINES: LineItem[] = [
  li('Edelstahl-Schrauben M6 (100 Stk)', 8, 4_50, 36_00, { x: 0.08, y: 0.455, w: 0.84, h: 0.052 }, 0.97),
  li('Werkstatt-Handtücher, blau (50er)', 4, 1_200_00, 48_00, { x: 0.08, y: 0.515, w: 0.84, h: 0.052 }, 0.68),
  li('Schmierfett Hochleistung 5kg', 2, 39_90, 79_80, { x: 0.08, y: 0.575, w: 0.84, h: 0.052 }, 0.95),
  li('Lieferpauschale', 1, 14_90, 14_90, { x: 0.08, y: 0.635, w: 0.84, h: 0.052 }, 0.93),
]
const DOC1_NET = DOC1_LINES.reduce((a, l) => a + l.lineTotalCents, 0)
const DOC1_RATE = 19
const DOC1_VAT = Math.round((DOC1_NET * DOC1_RATE) / 100)
const DOC1_GROSS = DOC1_NET + DOC1_VAT

const DOC3_LINES: LineItem[] = [
  li('Olio extra vergine 5L', 6, 42_00, 252_00, { x: 0.09, y: 0.47, w: 0.82, h: 0.054 }, 0.94),
  li('Pomodori pelati 2.5kg (cartone)', 10, 11_40, 114_00, { x: 0.09, y: 0.53, w: 0.82, h: 0.054 }, 0.96),
  li('Farina tipo 00 25kg', 4, 19_50, 78_00, { x: 0.09, y: 0.59, w: 0.82, h: 0.054 }, 0.95),
  li('Spedizione', 1, 22_00, 22_00, { x: 0.09, y: 0.65, w: 0.82, h: 0.054 }, 0.92),
]
const DOC3_NET = DOC3_LINES.reduce((a, l) => a + l.lineTotalCents, 0)
const DOC3_RATE = 22
const DOC3_VAT = Math.round((DOC3_NET * DOC3_RATE) / 100)
const DOC3_GROSS = DOC3_NET + DOC3_VAT

export const EXTRACTIONS: Record<DocId, Extraction> = {
  // --- F4 Preset 1: Clean Standard Invoice ---
  'DOC-CLEAN': {
    docId: 'DOC-CLEAN',
    presetId: 'clean',
    country: 'FR',
    currency: 'EUR',
    supplier: { value: 'Torréfaction Lyonnaise SARL', box: { x: 0.06, y: 0.08, w: 0.5, h: 0.055 }, confidence: 0.99 },
    vatId: { value: 'FRAB123456782', box: { x: 0.06, y: 0.195, w: 0.32, h: 0.038 }, confidence: 0.99 },
    iban: { value: 'FR7630006000011234567890189', box: { x: 0.06, y: 0.24, w: 0.4, h: 0.038 }, confidence: 0.99 },
    invoiceNo: { value: 'FAC-2026-0883', box: { x: 0.63, y: 0.13, w: 0.31, h: 0.038 }, confidence: 0.99 },
    invoiceDate: { value: '2026-06-15', box: { x: 0.63, y: 0.178, w: 0.31, h: 0.036 }, confidence: 0.99 },
    dueDate: { value: '2026-07-15', box: { x: 0.63, y: 0.224, w: 0.31, h: 0.036 }, confidence: 0.99 },
    lineItems: CLEAN_LINES,
    netCents: { value: CLEAN_NET, box: { x: 0.63, y: 0.7, w: 0.31, h: 0.038 }, confidence: 0.99 },
    vatRatePct: { value: CLEAN_RATE, box: { x: 0.07, y: 0.7, w: 0.2, h: 0.038 }, confidence: 0.99 },
    vatCents: { value: CLEAN_VAT, box: { x: 0.63, y: 0.745, w: 0.31, h: 0.038 }, confidence: 0.99 },
    grossCents: { value: CLEAN_GROSS, box: { x: 0.63, y: 0.795, w: 0.31, h: 0.046 }, confidence: 0.99 },
  },

  // --- F4 Preset 2: Suspected Duplicate ---
  'DOC-DUPLICATE': {
    docId: 'DOC-DUPLICATE',
    presetId: 'duplicate',
    country: 'FR',
    currency: 'EUR',
    supplier: { value: 'Torréfaction Lyonnaise SARL', box: { x: 0.06, y: 0.08, w: 0.5, h: 0.055 }, confidence: 0.98 },
    vatId: { value: 'FRAB123456782', box: { x: 0.06, y: 0.195, w: 0.32, h: 0.038 }, confidence: 0.98 },
    iban: { value: 'FR7630006000011234567890189', box: { x: 0.06, y: 0.24, w: 0.4, h: 0.038 }, confidence: 0.98 },
    invoiceNo: { value: 'FAC-2026-0883', box: { x: 0.63, y: 0.13, w: 0.31, h: 0.038 }, confidence: 0.98 },
    invoiceDate: { value: '2026-06-15', box: { x: 0.63, y: 0.178, w: 0.31, h: 0.036 }, confidence: 0.98 },
    dueDate: { value: '2026-07-15', box: { x: 0.63, y: 0.224, w: 0.31, h: 0.036 }, confidence: 0.98 },
    lineItems: DUPLICATE_LINES,
    netCents: { value: DUPLICATE_NET, box: { x: 0.63, y: 0.7, w: 0.31, h: 0.038 }, confidence: 0.98 },
    vatRatePct: { value: DUPLICATE_RATE, box: { x: 0.07, y: 0.7, w: 0.2, h: 0.038 }, confidence: 0.98 },
    vatCents: { value: DUPLICATE_VAT, box: { x: 0.63, y: 0.745, w: 0.31, h: 0.038 }, confidence: 0.98 },
    grossCents: { value: DUPLICATE_GROSS, box: { x: 0.63, y: 0.795, w: 0.31, h: 0.046 }, confidence: 0.98 },
  },

  // --- F4 Preset 3: Missing Mandatory Field ---
  'DOC-MISSING': {
    docId: 'DOC-MISSING',
    presetId: 'missing_field',
    country: 'DE',
    currency: 'EUR',
    supplier: { value: 'Hanseatic Cloud Solutions KG', box: { x: 0.07, y: 0.085, w: 0.55, h: 0.06 }, confidence: 0.93 },
    vatId: { value: '', box: { x: 0.07, y: 0.205, w: 0.34, h: 0.04 }, confidence: 0.0 }, // EMPTY VAT ID
    iban: { value: '', box: { x: 0.07, y: 0.25, w: 0.34, h: 0.04 }, confidence: 0.0 }, // EMPTY IBAN
    invoiceNo: { value: 'RE-2026-9021', box: { x: 0.62, y: 0.135, w: 0.31, h: 0.04 }, confidence: 0.92 },
    invoiceDate: { value: '2026-06-18', box: { x: 0.62, y: 0.185, w: 0.31, h: 0.038 }, confidence: 0.91 },
    dueDate: { value: '2026-07-02', box: { x: 0.62, y: 0.232, w: 0.31, h: 0.038 }, confidence: 0.89 },
    lineItems: MISSING_LINES,
    netCents: { value: MISSING_NET, box: { x: 0.62, y: 0.72, w: 0.31, h: 0.04 }, confidence: 0.94 },
    vatRatePct: { value: MISSING_RATE, box: { x: 0.08, y: 0.72, w: 0.2, h: 0.04 }, confidence: 0.95 },
    vatCents: { value: MISSING_VAT, box: { x: 0.62, y: 0.768, w: 0.31, h: 0.04 }, confidence: 0.94 },
    grossCents: { value: MISSING_GROSS, box: { x: 0.62, y: 0.82, w: 0.31, h: 0.05 }, confidence: 0.94 },
  },

  // --- F4 Preset 4: Calculation Mismatch ---
  'DOC-MISMATCH': {
    docId: 'DOC-MISMATCH',
    presetId: 'calc_mismatch',
    country: 'DE',
    currency: 'EUR',
    supplier: { value: 'Alpine Tools GmbH', box: { x: 0.07, y: 0.085, w: 0.55, h: 0.06 }, confidence: 0.94 },
    vatId: { value: 'DE998877665', box: { x: 0.07, y: 0.205, w: 0.34, h: 0.04 }, confidence: 0.91 },
    iban: { value: 'DE89370400440532013000', box: { x: 0.07, y: 0.25, w: 0.34, h: 0.04 }, confidence: 0.92 },
    invoiceNo: { value: 'AT-2026-5510', box: { x: 0.62, y: 0.135, w: 0.31, h: 0.04 }, confidence: 0.92 },
    invoiceDate: { value: '2026-06-20', box: { x: 0.62, y: 0.185, w: 0.31, h: 0.038 }, confidence: 0.92 },
    dueDate: { value: '2026-07-04', box: { x: 0.62, y: 0.232, w: 0.31, h: 0.038 }, confidence: 0.90 },
    lineItems: MISMATCH_LINES,
    netCents: { value: MISMATCH_PRINTED_NET, box: { x: 0.62, y: 0.72, w: 0.31, h: 0.04 }, confidence: 0.93 },
    vatRatePct: { value: MISMATCH_RATE, box: { x: 0.08, y: 0.72, w: 0.2, h: 0.04 }, confidence: 0.94 },
    vatCents: { value: MISMATCH_VAT, box: { x: 0.62, y: 0.768, w: 0.31, h: 0.04 }, confidence: 0.92 },
    grossCents: { value: MISMATCH_GROSS, box: { x: 0.62, y: 0.82, w: 0.31, h: 0.05 }, confidence: 0.94 },
  },

  // --- Backwards Compatibility with existing tests ---
  'DOC-1': {
    docId: 'DOC-1',
    country: 'DE',
    currency: 'EUR',
    supplier: { value: 'Bauer Industriebedarf GmbH', box: { x: 0.07, y: 0.085, w: 0.55, h: 0.06 }, confidence: 0.92 },
    vatId: { value: 'DE811569876', box: { x: 0.07, y: 0.205, w: 0.34, h: 0.04 }, confidence: 0.88 },
    invoiceNo: { value: 'RE-2026-04417', box: { x: 0.62, y: 0.135, w: 0.31, h: 0.04 }, confidence: 0.9 },
    invoiceDate: { value: '2026-06-12', box: { x: 0.62, y: 0.185, w: 0.31, h: 0.038 }, confidence: 0.91 },
    dueDate: { value: '2026-06-26', box: { x: 0.62, y: 0.232, w: 0.31, h: 0.038 }, confidence: 0.86 },
    lineItems: DOC1_LINES,
    netCents: { value: DOC1_NET, box: { x: 0.62, y: 0.72, w: 0.31, h: 0.04 }, confidence: 0.9 },
    vatRatePct: { value: DOC1_RATE, box: { x: 0.08, y: 0.72, w: 0.2, h: 0.04 }, confidence: 0.93 },
    vatCents: { value: DOC1_VAT, box: { x: 0.62, y: 0.768, w: 0.31, h: 0.04 }, confidence: 0.9 },
    grossCents: { value: DOC1_GROSS, box: { x: 0.62, y: 0.82, w: 0.31, h: 0.05 }, confidence: 0.94 },
  },
  'DOC-2': {
    docId: 'DOC-2',
    country: 'FR',
    currency: 'EUR',
    supplier: { value: 'Torréfaction Lyonnaise SARL', box: { x: 0.06, y: 0.08, w: 0.5, h: 0.055 }, confidence: 0.99 },
    vatId: { value: 'FRAB123456782', box: { x: 0.06, y: 0.195, w: 0.32, h: 0.038 }, confidence: 0.99 },
    invoiceNo: { value: 'FAC-2026-0883', box: { x: 0.63, y: 0.13, w: 0.31, h: 0.038 }, confidence: 0.99 },
    invoiceDate: { value: '2026-06-15', box: { x: 0.63, y: 0.178, w: 0.31, h: 0.036 }, confidence: 0.99 },
    dueDate: { value: '2026-07-15', box: { x: 0.63, y: 0.224, w: 0.31, h: 0.036 }, confidence: 0.99 },
    lineItems: CLEAN_LINES,
    netCents: { value: CLEAN_NET, box: { x: 0.63, y: 0.7, w: 0.31, h: 0.038 }, confidence: 0.99 },
    vatRatePct: { value: CLEAN_RATE, box: { x: 0.07, y: 0.7, w: 0.2, h: 0.038 }, confidence: 0.99 },
    vatCents: { value: CLEAN_VAT, box: { x: 0.63, y: 0.745, w: 0.31, h: 0.038 }, confidence: 0.99 },
    grossCents: { value: CLEAN_GROSS, box: { x: 0.63, y: 0.795, w: 0.31, h: 0.046 }, confidence: 0.99 },
  },
  'DOC-3': {
    docId: 'DOC-3',
    country: 'IT',
    currency: 'EUR',
    supplier: { value: 'Alimentari Toscana S.r.l.', box: { x: 0.08, y: 0.09, w: 0.52, h: 0.058 }, confidence: 0.62 },
    vatId: { value: 'IT04915310487', box: { x: 0.08, y: 0.21, w: 0.34, h: 0.04 }, confidence: 0.83 },
    invoiceNo: { value: 'FT/2026/1204', box: { x: 0.62, y: 0.14, w: 0.3, h: 0.04 }, confidence: 0.86 },
    invoiceDate: { value: '2026-06-10', box: { x: 0.62, y: 0.19, w: 0.3, h: 0.038 }, confidence: 0.88 },
    dueDate: { value: '2026-07-10', box: { x: 0.62, y: 0.238, w: 0.3, h: 0.038 }, confidence: 0.81 },
    lineItems: DOC3_LINES,
    netCents: { value: DOC3_NET, box: { x: 0.62, y: 0.73, w: 0.3, h: 0.04 }, confidence: 0.9 },
    vatRatePct: { value: DOC3_RATE, box: { x: 0.09, y: 0.73, w: 0.2, h: 0.04 }, confidence: 0.91 },
    vatCents: { value: DOC3_VAT, box: { x: 0.62, y: 0.778, w: 0.3, h: 0.04 }, confidence: 0.9 },
    grossCents: { value: DOC3_GROSS, box: { x: 0.62, y: 0.83, w: 0.3, h: 0.05 }, confidence: 0.92 },
  },
}

/** Deep clone so callers can never mutate the canonical extraction. */
function cloneExtraction(e: Extraction): Extraction {
  return structuredClone(e)
}

/** Pure: returns the pre-baked deterministic OCR result for a document. */
export function extract(docId: DocId): Extraction {
  const ext = EXTRACTIONS[docId]
  if (!ext) throw new Error(`Document preset ${docId} not found`)
  return cloneExtraction(ext)
}

/** Retain 3 documents for ALL_DOC_IDS to satisfy engine tests */
export const ALL_DOC_IDS: DocId[] = ['DOC-1', 'DOC-2', 'DOC-3']

/** New presets for F4 */
export const PRESET_DOC_IDS: DocId[] = [
  'DOC-CLEAN',
  'DOC-DUPLICATE',
  'DOC-MISSING',
  'DOC-MISMATCH',
]

export const EXTENDED_DOC_IDS: DocId[] = [
  'DOC-1',
  'DOC-2',
  'DOC-3',
  'DOC-CLEAN',
  'DOC-DUPLICATE',
  'DOC-MISSING',
  'DOC-MISMATCH',
]
