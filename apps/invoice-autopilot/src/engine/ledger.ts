import type { AccountingTarget, Extraction, Ledger, LedgerEntry } from './types'

// Time economics of the demo: a bookkeeper keys a doc in ~7 min by hand;
// Autopilot lands it in ~9 sec. Every posted doc banks the difference.
export const MANUAL_SEC = 420
export const AUTO_SEC = 9
export const SAVED_PER_DOC_SEC = MANUAL_SEC - AUTO_SEC // 411

export function emptyLedger(): Ledger {
  return { entries: [], docCount: 0, savedSeconds: 0, errorsPrevented: 0 }
}

/**
 * Append a posted extraction to the ledger and return a NEW ledger.
 * Pure — the input ledger is never mutated.
 *   docCount      += 1
 *   savedSeconds  += SAVED_PER_DOC_SEC (411)
 *   errorsPrevented += hadFix ? 1 : 0
 */
export function postToLedger(
  ledger: Ledger,
  ext: Extraction,
  opts: { postedAtMs: number; hadFix: boolean; target: AccountingTarget },
): Ledger {
  const entry: LedgerEntry = {
    docId: ext.docId,
    supplier: ext.supplier.value,
    country: ext.country,
    invoiceNo: ext.invoiceNo.value,
    netCents: ext.netCents.value,
    vatCents: ext.vatCents.value,
    grossCents: ext.grossCents.value,
    postedAtMs: opts.postedAtMs,
    hadFix: opts.hadFix,
    target: opts.target,
  }
  return {
    entries: [entry, ...ledger.entries],
    docCount: ledger.docCount + 1,
    savedSeconds: ledger.savedSeconds + SAVED_PER_DOC_SEC,
    errorsPrevented: ledger.errorsPrevented + (opts.hadFix ? 1 : 0),
  }
}

/** Sum of gross across all posted entries (cents). */
export function ledgerGrossCents(ledger: Ledger): number {
  return ledger.entries.reduce((a, e) => a + e.grossCents, 0)
}
