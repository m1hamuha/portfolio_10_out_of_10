import { describe, it, expect } from 'vitest'
import {
  extract,
  validate,
  applyFix,
  applyAllFixes,
  isValidVatId,
  postToLedger,
  emptyLedger,
  ledgerGrossCents,
  ALL_DOC_IDS,
  SAVED_PER_DOC_SEC,
  MANUAL_SEC,
  AUTO_SEC,
  formatEur,
  formatDuration,
  type DocId,
  type Extraction,
} from '../index'

const round = (n: number) => Math.round(n)

function expectReconciled(ext: Extraction) {
  const lineSum = ext.lineItems.reduce((a, l) => a + l.lineTotalCents, 0)
  expect(lineSum).toBe(ext.netCents.value)
  expect(ext.vatCents.value).toBe(round((ext.netCents.value * ext.vatRatePct.value) / 100))
  expect(ext.netCents.value + ext.vatCents.value).toBe(ext.grossCents.value)
  for (const l of ext.lineItems) {
    expect(l.lineTotalCents).toBe(l.qty * l.unitPriceCents)
  }
}

// ── Invariant 1: extract deterministic; boxes & confidences in [0,1]; cents ──
describe('extract — determinism & value integrity', () => {
  it('is deterministic: same docId → identical output', () => {
    for (const id of ALL_DOC_IDS) {
      expect(extract(id)).toEqual(extract(id))
    }
  })

  it('returns a fresh clone each call (no shared mutable state)', () => {
    const a = extract('DOC-1')
    a.supplier.value = 'TAMPERED'
    a.lineItems[0].unitPriceCents = -999
    const b = extract('DOC-1')
    expect(b.supplier.value).not.toBe('TAMPERED')
    expect(b.lineItems[0].unitPriceCents).not.toBe(-999)
  })

  it('every Box is within [0,1] and every confidence in [0,1]', () => {
    for (const id of ALL_DOC_IDS) {
      const ext = extract(id)
      const boxes = [
        ext.supplier.box, ext.vatId.box, ext.invoiceNo.box, ext.invoiceDate.box,
        ext.dueDate.box, ext.netCents.box, ext.vatRatePct.box, ext.vatCents.box,
        ext.grossCents.box, ...ext.lineItems.map((l) => l.box),
      ]
      for (const b of boxes) {
        for (const v of [b.x, b.y, b.w, b.h]) {
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
        expect(b.x + b.w).toBeLessThanOrEqual(1.00001)
        expect(b.y + b.h).toBeLessThanOrEqual(1.00001)
      }
      const confs = [
        ext.supplier.confidence, ext.vatId.confidence, ext.invoiceNo.confidence,
        ext.invoiceDate.confidence, ext.dueDate.confidence, ext.netCents.confidence,
        ext.vatRatePct.confidence, ext.vatCents.confidence, ext.grossCents.confidence,
        ...ext.lineItems.map((l) => l.confidence),
      ]
      for (const c of confs) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })

  it('all money fields are integer cents', () => {
    for (const id of ALL_DOC_IDS) {
      const ext = extract(id)
      const cents = [
        ext.netCents.value, ext.vatCents.value, ext.grossCents.value,
        ...ext.lineItems.flatMap((l) => [l.unitPriceCents, l.lineTotalCents]),
      ]
      for (const c of cents) expect(Number.isInteger(c)).toBe(true)
    }
  })

  it('exposes exactly 3 documents with correct countries', () => {
    expect(ALL_DOC_IDS).toEqual(['DOC-1', 'DOC-2', 'DOC-3'])
    expect(extract('DOC-1').country).toBe('DE')
    expect(extract('DOC-2').country).toBe('FR')
    expect(extract('DOC-3').country).toBe('IT')
  })
})

// ── Invariant 2: DOC-2 (clean) → validate returns [] ─────────────────────────
describe('validate — clean document', () => {
  it('DOC-2 validates clean (no issues)', () => {
    expect(validate(extract('DOC-2'))).toEqual([])
  })

  it('DOC-3 validates clean despite low-confidence supplier field', () => {
    expect(validate(extract('DOC-3'))).toEqual([])
  })
})

// ── Invariant 3: DOC-1 → price_anomaly warn (the typo) ───────────────────────
describe('validate — planted typo', () => {
  it('DOC-1 raises exactly one price_anomaly warning', () => {
    const issues = validate(extract('DOC-1'))
    const anomalies = issues.filter((i) => i.kind === 'price_anomaly')
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].severity).toBe('warn')
    expect(anomalies[0].lineIndex).toBe(1)
  })

  it('DOC-1 has no error-level issues (totals are genuine pre-fix)', () => {
    const errors = validate(extract('DOC-1')).filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
  })

  it('the suggested fix is the corrected unit price 12,00 € (1200 cents)', () => {
    const anomaly = validate(extract('DOC-1')).find((i) => i.kind === 'price_anomaly')!
    expect(anomaly.suggestedFixCents).toBe(1200)
  })
})

// ── Invariant 4: applyFix on DOC-1 → re-validate [] and reconciled ───────────
describe('applyFix — corrects the typo and reconciles', () => {
  it('clears all issues after fixing DOC-1', () => {
    const ext = extract('DOC-1')
    const anomaly = validate(ext).find((i) => i.kind === 'price_anomaly')!
    const fixed = applyFix(ext, anomaly.id)
    expect(validate(fixed)).toEqual([])
    expectReconciled(fixed)
  })

  it('sets the corrected unit price and a consistent line total', () => {
    const ext = extract('DOC-1')
    const anomaly = validate(ext).find((i) => i.kind === 'price_anomaly')!
    const fixed = applyFix(ext, anomaly.id)
    const line = fixed.lineItems[1]
    expect(line.unitPriceCents).toBe(1200)
    expect(line.lineTotalCents).toBe(line.qty * line.unitPriceCents)
  })

  it('does NOT mutate the input extraction (pure)', () => {
    const ext = extract('DOC-1')
    const snapshot = structuredClone(ext)
    const anomaly = validate(ext).find((i) => i.kind === 'price_anomaly')!
    applyFix(ext, anomaly.id)
    expect(ext).toEqual(snapshot)
  })

  it('is a safe no-op for an unknown issue id', () => {
    const ext = extract('DOC-2')
    expect(applyFix(ext, 'does-not-exist')).toEqual(ext)
  })

  it('applyAllFixes leaves every document clean', () => {
    for (const id of ALL_DOC_IDS) {
      const clean = applyAllFixes(extract(id))
      expect(validate(clean)).toEqual([])
      expectReconciled(clean)
    }
  })
})

// ── Invariant 5: every doc (after fix) reconciles fully ──────────────────────
describe('reconciliation invariants across all docs', () => {
  it('net+vat===gross, Σ lineTotals===net, vat===round(net*rate) after fixes', () => {
    for (const id of ALL_DOC_IDS) {
      expectReconciled(applyAllFixes(extract(id)))
    }
  })
})

// ── Invariant 6: isValidVatId accepts samples, rejects malformed ─────────────
describe('isValidVatId', () => {
  it('accepts the three sample VAT IDs', () => {
    expect(isValidVatId('DE', 'DE811569876')).toBe(true)
    expect(isValidVatId('FR', 'FRAB123456782')).toBe(true)
    expect(isValidVatId('IT', 'IT04915310487')).toBe(true)
  })

  it('rejects malformed IDs', () => {
    expect(isValidVatId('DE', 'DE8115')).toBe(false) // too short
    expect(isValidVatId('DE', 'DE81156987X')).toBe(false) // non-digit
    expect(isValidVatId('FR', 'FR12345')).toBe(false)
    expect(isValidVatId('IT', 'IT123')).toBe(false)
    expect(isValidVatId('DE', 'FR811569876')).toBe(false) // wrong country prefix
    expect(isValidVatId('DE', '')).toBe(false)
  })

  it('flags a malformed VAT id as a warn issue', () => {
    const ext = extract('DOC-1')
    ext.vatId.value = 'DE-BROKEN'
    const issue = validate(ext).find((i) => i.kind === 'vat_id_format')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warn')
  })
})

// ── Invariant 7: postToLedger math ───────────────────────────────────────────
describe('postToLedger', () => {
  it('increments docCount by 1 and savedSeconds by 411', () => {
    const ext = applyAllFixes(extract('DOC-2'))
    const l1 = postToLedger(emptyLedger(), ext, { postedAtMs: 1000, hadFix: false, target: 'Xero' })
    expect(l1.docCount).toBe(1)
    expect(l1.savedSeconds).toBe(SAVED_PER_DOC_SEC)
    expect(SAVED_PER_DOC_SEC).toBe(MANUAL_SEC - AUTO_SEC)
    expect(SAVED_PER_DOC_SEC).toBe(411)
  })

  it('counts errorsPrevented only for docs that needed a fix', () => {
    let l = emptyLedger()
    l = postToLedger(l, applyAllFixes(extract('DOC-1')), { postedAtMs: 1, hadFix: true, target: 'DATEV' })
    l = postToLedger(l, applyAllFixes(extract('DOC-2')), { postedAtMs: 2, hadFix: false, target: 'Xero' })
    expect(l.docCount).toBe(2)
    expect(l.savedSeconds).toBe(2 * SAVED_PER_DOC_SEC)
    expect(l.errorsPrevented).toBe(1)
  })

  it('prepends the newest entry and stores reconciled totals', () => {
    const ext = applyAllFixes(extract('DOC-1'))
    const l = postToLedger(emptyLedger(), ext, { postedAtMs: 42, hadFix: true, target: 'DATEV' })
    const entry = l.entries[0]
    expect(entry.docId).toBe('DOC-1')
    expect(entry.netCents + entry.vatCents).toBe(entry.grossCents)
    expect(entry.postedAtMs).toBe(42)
    expect(entry.target).toBe('DATEV')
  })

  it('does not mutate the input ledger (pure)', () => {
    const l0 = emptyLedger()
    const snapshot = structuredClone(l0)
    postToLedger(l0, applyAllFixes(extract('DOC-2')), { postedAtMs: 1, hadFix: false, target: 'Xero' })
    expect(l0).toEqual(snapshot)
  })

  it('ledgerGrossCents sums all posted gross amounts', () => {
    let l = emptyLedger()
    const docs: DocId[] = ['DOC-1', 'DOC-2', 'DOC-3']
    let expected = 0
    for (const id of docs) {
      const ext = applyAllFixes(extract(id))
      expected += ext.grossCents.value
      l = postToLedger(l, ext, { postedAtMs: 0, hadFix: id === 'DOC-1', target: 'Xero' })
    }
    expect(ledgerGrossCents(l)).toBe(expected)
  })
})

// ── Invariant 8: purity of validate ──────────────────────────────────────────
describe('purity', () => {
  it('validate does not mutate its input', () => {
    for (const id of ALL_DOC_IDS) {
      const ext = extract(id)
      const snapshot = structuredClone(ext)
      validate(ext)
      expect(ext).toEqual(snapshot)
    }
  })
})

// ── Formatting helpers ───────────────────────────────────────────────────────
describe('formatting helpers', () => {
  it('formats EUR cents with two decimals', () => {
    expect(formatEur(1200)).toContain('12,00')
    expect(formatEur(21265)).toContain('212,65')
  })

  it('formats durations', () => {
    expect(formatDuration(9)).toBe('9 sec')
    expect(formatDuration(420)).toBe('7 min')
    expect(formatDuration(5880)).toBe('1 h 38 min')
  })
})
