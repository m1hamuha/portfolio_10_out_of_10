import { create } from 'zustand'
import {
  extract,
  validate,
  applyFix,
  applyAllFixes,
  postToLedger,
  emptyLedger,
  detectDuplicate,
  type AccountingTarget,
  type DocId,
  type Extraction,
  type Issue,
  type Ledger,
  type DuplicateDetectionResult,
  type ReviewState,
} from '../engine'

// Demo wall-clock base (deterministic; engine never reads Date.now()).
const BASE_MS = Date.UTC(2026, 5, 19, 9, 14, 0)

/** Number of extractable fields per doc — drives the scan progress sequencing. */
export function fieldCount(ext: Extraction): number {
  return 5 + ext.lineItems.length + 3
}

export type Phase =
  | 'idle' // no doc selected
  | 'ready' // doc selected, awaiting scan
  | 'scanning' // scan-line sweeping
  | 'review' // extracted; may have an open anomaly
  | 'posted' // sent to accounting

export interface DocMeta {
  id: DocId
  label: string
  kind: string
  flag: string // emoji flag for the rail chip (decorative, not a UI icon)
  note: string
  skew: number // degrees, for the photo tilt
}

export const DOCS: DocMeta[] = [
  {
    id: 'DOC-CLEAN',
    label: 'Facture — Torréfaction (Clean)',
    kind: 'Factur-X PDF · France',
    flag: '🇫🇷',
    note: 'Clean standard invoice · 0 errors',
    skew: 0,
  },
  {
    id: 'DOC-DUPLICATE',
    label: 'Facture — Torréfaction (Duplicate)',
    kind: 'Duplicate Scan · France',
    flag: '⚠️',
    note: 'Suspected duplicate of filed invoice',
    skew: 0.8,
  },
  {
    id: 'DOC-MISSING',
    label: 'Rechnung — Hanseatic Cloud',
    kind: 'Missing Mandatory Fields · Germany',
    flag: '🇩🇪',
    note: 'Missing supplier VAT ID & IBAN',
    skew: -1.2,
  },
  {
    id: 'DOC-MISMATCH',
    label: 'Rechnung — Alpine Tools',
    kind: 'Calculation Mismatch · Germany',
    flag: '🇩🇪',
    note: 'Sum of lines ≠ printed net (€15 slip)',
    skew: 1.1,
  },
  {
    id: 'DOC-1',
    label: 'Rechnung — Bauer Industriebedarf',
    kind: 'Phone photo · Germany',
    flag: '🇩🇪',
    note: 'Crooked photo with line unit price typo',
    skew: -1.7,
  },
]

interface AppState {
  ledger: Ledger
  selectedDoc: DocId | null
  phase: Phase
  reviewState: ReviewState
  /** 0..1 progress of the scan sweep, drives field reveal + confidence meter. */
  scanProgress: number
  extraction: Extraction | null
  issues: Issue[]
  /** issue ids the user has resolved (fixed or confirmed). */
  resolved: Set<string>
  hadFix: boolean // did this doc require a fix before posting?
  target: AccountingTarget
  toast: { title: string; sub: string } | null
  duplicateResult: DuplicateDetectionResult | null
  isDiffModalOpen: boolean
  managerOverrideReason: string | null

  seed: () => void
  selectDoc: (id: DocId) => void
  startScan: () => void
  setScanProgress: (p: number) => void
  finishScan: () => void
  fixIssue: (issueId: string) => void
  confirmIssue: (issueId: string) => void
  setTarget: (t: AccountingTarget) => void
  post: () => void
  reset: () => void
  clearToast: () => void
  setDiffModalOpen: (open: boolean) => void
  forceApprove: (reason: string) => void
  rejectDuplicate: () => void
}

export const useStore = create<AppState>((set, get) => ({
  ledger: emptyLedger(),
  selectedDoc: null,
  phase: 'idle',
  reviewState: 'PENDING',
  scanProgress: 0,
  extraction: null,
  issues: [],
  resolved: new Set(),
  hadFix: false,
  target: 'Xero',
  toast: null,
  duplicateResult: null,
  isDiffModalOpen: false,
  managerOverrideReason: null,

  seed: () => {
    if (get().ledger.docCount > 0) return
    let ledger = emptyLedger()
    const clean: DocId[] = ['DOC-CLEAN', 'DOC-3']
    clean.forEach((id, i) => {
      ledger = postToLedger(ledger, applyAllFixes(extract(id)), {
        postedAtMs: BASE_MS + i * 9000,
        hadFix: false,
        target: i === 0 ? 'Xero' : 'DATEV',
      })
    })
    const ext = extract('DOC-1')
    set({
      ledger,
      selectedDoc: 'DOC-1',
      phase: 'review',
      reviewState: 'FLAGGED',
      scanProgress: 1,
      extraction: ext,
      issues: validate(ext),
      resolved: new Set(),
      hadFix: false,
      target: 'DATEV',
      duplicateResult: null,
      isDiffModalOpen: false,
      managerOverrideReason: null,
    })
  },

  selectDoc: (id) => {
    if (get().phase === 'scanning') return
    set({
      selectedDoc: id,
      phase: 'ready',
      reviewState: 'PENDING',
      scanProgress: 0,
      extraction: null,
      issues: [],
      resolved: new Set(),
      hadFix: false,
      duplicateResult: null,
      isDiffModalOpen: false,
      managerOverrideReason: null,
    })
  },

  startScan: () => {
    const id = get().selectedDoc
    if (!id) return
    set({
      phase: 'scanning',
      reviewState: 'PENDING',
      scanProgress: 0,
      extraction: extract(id),
      issues: [],
      duplicateResult: null,
      isDiffModalOpen: false,
    })
  },

  setScanProgress: (p) => set({ scanProgress: Math.max(0, Math.min(1, p)) }),

  finishScan: () => {
    const ext = get().extraction
    if (!ext) return
    const issues = validate(ext)
    // Run duplicate detection against existing ledger entries or other known presets
    const dupResult = detectDuplicate(ext, get().ledger.entries)
    if (dupResult.isDuplicate) {
      issues.push({
        id: 'duplicate_detected',
        kind: 'duplicate_detected',
        severity: 'warn',
        field: 'invoiceNo',
        message: dupResult.remediationAdvice,
      })
    }

    const hasErrors = issues.some((i) => i.severity === 'error')
    const hasWarns = issues.length > 0

    set({
      phase: 'review',
      reviewState: hasErrors || dupResult.isDuplicate ? 'FLAGGED' : hasWarns ? 'FLAGGED' : 'VALIDATED',
      scanProgress: 1,
      issues,
      duplicateResult: dupResult.isDuplicate ? dupResult : null,
      isDiffModalOpen: dupResult.isDuplicate,
    })
  },

  fixIssue: (issueId) => {
    const ext = get().extraction
    if (!ext) return
    const fixed = applyFix(ext, issueId)
    const resolved = new Set(get().resolved)
    resolved.add(issueId)
    const newIssues = validate(fixed)
    set({
      extraction: fixed,
      issues: newIssues,
      resolved,
      hadFix: true,
      reviewState: newIssues.length === 0 ? 'VALIDATED' : 'FLAGGED',
      toast: {
        title: 'Price corrected',
        sub: 'Totals re-reconciled · VAT, net and gross now match',
      },
    })
  },

  confirmIssue: (issueId) => {
    const resolved = new Set(get().resolved)
    resolved.add(issueId)
    const newIssues = get().issues.filter((i) => i.id !== issueId)
    set({
      resolved,
      issues: newIssues,
      reviewState: newIssues.some((i) => i.severity === 'error') ? 'FLAGGED' : 'VALIDATED',
    })
  },

  setTarget: (t) => set({ target: t }),

  post: () => {
    const { extraction, ledger, target, hadFix, phase } = get()
    if (!extraction || phase !== 'review') return
    // Block posting while a hard error is still open (unless manager overridden).
    const openErrors = validate(extraction).filter((i) => i.severity === 'error')
    if (openErrors.length && !get().managerOverrideReason) return
    const next = postToLedger(ledger, extraction, {
      postedAtMs: BASE_MS + ledger.docCount * 9000,
      hadFix,
      target,
    })
    set({
      ledger: next,
      phase: 'posted',
      reviewState: 'EXPORTED',
      toast: {
        title: `Posted to ${target}`,
        sub: hadFix ? '1 error prevented before it hit the books' : 'Entry created — clean on first pass',
      },
    })
  },

  reset: () =>
    set({
      selectedDoc: null,
      phase: 'idle',
      reviewState: 'PENDING',
      scanProgress: 0,
      extraction: null,
      issues: [],
      resolved: new Set(),
      hadFix: false,
      duplicateResult: null,
      isDiffModalOpen: false,
      managerOverrideReason: null,
    }),

  clearToast: () => set({ toast: null }),

  setDiffModalOpen: (open: boolean) => set({ isDiffModalOpen: open }),

  forceApprove: (reason: string) => {
    const resolved = new Set(get().resolved)
    resolved.add('duplicate_detected')
    set({
      isDiffModalOpen: false,
      managerOverrideReason: reason,
      reviewState: 'APPROVED',
      issues: get().issues.filter((i) => i.kind !== 'duplicate_detected'),
      resolved,
      toast: {
        title: 'Manager Override Recorded',
        sub: `Authorized by Manager: “${reason.slice(0, 40)}…”`,
      },
    })
    get().post()
  },

  rejectDuplicate: () => {
    set({
      isDiffModalOpen: false,
      toast: {
        title: 'Duplicate Rejected',
        sub: 'Invoice marked as duplicate. Payment blocked to prevent double debit.',
      },
      phase: 'ready',
      reviewState: 'FLAGGED',
    })
  },
}))
