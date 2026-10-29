import type { Extraction, Issue } from './types'
import { validate } from './validate'

const round = (n: number): number => Math.round(n)

/**
 * Re-derive net / VAT / gross from the (possibly corrected) line items so the
 * whole extraction reconciles. Pure: mutates only the passed clone.
 */
function reconcileTotals(ext: Extraction): void {
  const net = ext.lineItems.reduce((a, l) => a + l.lineTotalCents, 0)
  const vat = round((net * ext.vatRatePct.value) / 100)
  ext.netCents.value = net
  ext.vatCents.value = vat
  ext.grossCents.value = net + vat
}

/**
 * Apply the suggested fix for a given issue and return a NEW, reconciled
 * extraction. The input is never mutated. If the issue is unknown or has no
 * fix, returns a faithful clone (no-op) so the call is always safe.
 *
 * For a price_anomaly: rewrite the offending line's unit price to the
 * suggested value so qty × unit === lineTotal, then re-derive the totals.
 */
export function applyFix(ext: Extraction, issueId: string): Extraction {
  const next = structuredClone(ext)
  const issue = validate(ext).find((i) => i.id === issueId)
  if (!issue) return next

  if (
    issue.kind === 'price_anomaly' &&
    issue.lineIndex != null &&
    issue.suggestedFixCents != null
  ) {
    const line = next.lineItems[issue.lineIndex]
    if (line) {
      line.unitPriceCents = issue.suggestedFixCents
      // Keep the genuine printed line total; re-key it to the consistent value.
      line.lineTotalCents = line.qty * line.unitPriceCents
      line.confidence = Math.max(line.confidence, 0.97)
      reconcileTotals(next)
    }
  }

  return next
}

/** Convenience: apply every fixable issue in sequence; returns a clean clone. */
export function applyAllFixes(ext: Extraction): Extraction {
  let next = structuredClone(ext)
  let guard = 0
  let issues: Issue[] = validate(next).filter((i) => i.suggestedFixCents != null)
  while (issues.length && guard < 20) {
    next = applyFix(next, issues[0].id)
    issues = validate(next).filter((i) => i.suggestedFixCents != null)
    guard++
  }
  return next
}
