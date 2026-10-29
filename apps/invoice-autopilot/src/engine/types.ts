// InvoiceAutopilot deterministic engine — framework-free, integer CENTS everywhere.
// Money is NEVER a float in here; format only at the display edge (money.ts).

export type PresetId = 'clean' | 'duplicate' | 'missing_field' | 'calc_mismatch'
export type DocId =
  | 'DOC-1'
  | 'DOC-2'
  | 'DOC-3'
  | 'DOC-CLEAN'
  | 'DOC-DUPLICATE'
  | 'DOC-MISSING'
  | 'DOC-MISMATCH'

export type Country = 'DE' | 'FR' | 'IT'
export type Currency = 'EUR'

/** Normalized box over the document image; all components in [0, 1]. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** An extracted scalar field with its source location and OCR confidence. */
export interface Field<T> {
  value: T
  box: Box
  confidence: number // 0..1
}

export interface LineItem {
  desc: string
  qty: number
  unitPriceCents: number
  lineTotalCents: number
  box: Box
  confidence: number // 0..1
}

export interface Extraction {
  docId: DocId
  presetId?: PresetId
  country: Country
  currency: Currency
  supplier: Field<string>
  vatId: Field<string>
  iban?: Field<string> // IBAN for payment verification
  invoiceNo: Field<string>
  invoiceDate: Field<string> // ISO yyyy-mm-dd
  dueDate: Field<string>
  lineItems: LineItem[]
  netCents: Field<number>
  vatRatePct: Field<number>
  vatCents: Field<number>
  grossCents: Field<number>
}

export type IssueSeverity = 'warn' | 'error'
export type IssueKind =
  | 'line_sum'
  | 'vat_math'
  | 'gross_math'
  | 'price_anomaly'
  | 'vat_id_format'
  | 'missing_mandatory'
  | 'duplicate_detected'

export interface Issue {
  id: string
  kind: IssueKind
  severity: IssueSeverity
  field: string
  message: string
  /** For a fixable anomaly: the corrected unit price (cents). */
  suggestedFixCents?: number
  /** Index of the offending line item, when applicable. */
  lineIndex?: number
}

export interface LedgerEntry {
  docId: DocId
  supplier: string
  country: Country
  invoiceNo: string
  netCents: number
  vatCents: number
  grossCents: number
  postedAtMs: number
  /** Did this doc require a correction before posting? */
  hadFix: boolean
  /** Destination accounting system. */
  target: AccountingTarget
}

export type AccountingTarget = 'Xero' | 'DATEV'

export interface Ledger {
  entries: LedgerEntry[]
  docCount: number
  savedSeconds: number
  errorsPrevented: number
}

// --- Duplicate Detection Types ---
export interface DuplicateFieldComparison {
  field: string
  label: string
  incomingValue: string | number
  existingValue: string | number
  isMatch: boolean
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean
  confidence: number // 0..1
  matchType: 'EXACT' | 'FUZZY_SUSPECTED' | 'NONE'
  matchedWithDocId?: string
  matchedWithInvoiceNo?: string
  matchedWithSupplier?: string
  matchedWithGrossCents?: number
  matchedWithDate?: string
  fields: DuplicateFieldComparison[]
  matchedFields: string[]
  divergentFields: string[]
  remediationAdvice: string
}

// --- Multi-Step Review Workflow States ---
export type ReviewState = 'PENDING' | 'VALIDATED' | 'FLAGGED' | 'APPROVED' | 'EXPORTED'

export interface ManagerOverride {
  approvedBy: string
  reason: string
  timestampMs: number
}

export interface ReviewStatus {
  state: ReviewState
  canExport: boolean
  canApprove: boolean
  requiresOverride: boolean
  blockingReason?: string
  managerOverride?: ManagerOverride
}

// --- Structured Export Types ---
export type ExportFormat = 'CSV' | 'JSON' | 'DATEV'

export interface DatevExtfConfig {
  beraternummer?: number // e.g. 1001
  mandantennummer?: number // e.g. 99999
  wirtschaftsjahrBeginn?: string // YYYYMMDD, e.g. 20260101
  sachkontenLaenge?: number // e.g. 4
  bezeichnung?: string // e.g. 'InvoiceAutopilot Export'
}
