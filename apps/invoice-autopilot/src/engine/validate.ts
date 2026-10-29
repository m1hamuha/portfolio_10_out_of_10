import type { Country, Extraction, Issue } from './types'
import { formatEur } from './money'

// ---- VAT-ID format checks (structural, not checksum) -----------------------
const VAT_ID_PATTERNS: Record<Country, RegExp> = {
  DE: /^DE\d{9}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  IT: /^IT\d{11}$/,
}

export function isValidVatId(country: Country, id: string): boolean {
  const pattern = VAT_ID_PATTERNS[country]
  return pattern ? pattern.test(id) : false
}

const round = (n: number): number => Math.round(n)

/**
 * Pure validation of an extraction against the reconciliation rules.
 * Returns issues in stable, deterministic order. Empty array === clean.
 */
export function validate(ext: Extraction): Issue[] {
  const issues: Issue[] = []
  const net = ext.netCents.value
  const vat = ext.vatCents.value
  const gross = ext.grossCents.value
  const rate = ext.vatRatePct.value

  // Rule 1: line items sum to the net.
  const lineSum = ext.lineItems.reduce((a, l) => a + l.lineTotalCents, 0)
  if (lineSum !== net) {
    issues.push({
      id: 'line_sum',
      kind: 'line_sum',
      severity: 'error',
      field: 'netCents',
      message: `Line items sum to ${formatEur(lineSum)} but net reads ${formatEur(net)}.`,
    })
  }

  // Rule 2: VAT equals round(net * rate / 100).
  const expectedVat = round((net * rate) / 100)
  if (vat !== expectedVat) {
    issues.push({
      id: 'vat_math',
      kind: 'vat_math',
      severity: 'error',
      field: 'vatCents',
      message: `VAT should be ${formatEur(expectedVat)} (${rate} % of net) but reads ${formatEur(vat)}.`,
    })
  }

  // Rule 3: net + VAT equals gross.
  if (net + vat !== gross) {
    issues.push({
      id: 'gross_math',
      kind: 'gross_math',
      severity: 'error',
      field: 'grossCents',
      message: `Net + VAT = ${formatEur(net + vat)} but gross reads ${formatEur(gross)}.`,
    })
  }

  // Rule 4: each line total equals qty * unit price (warn — likely a key/OCR slip).
  ext.lineItems.forEach((l, i) => {
    const expected = l.qty * l.unitPriceCents
    if (l.lineTotalCents !== expected) {
      // Heuristic correction: trust the line total, derive the plausible unit price.
      const suggested = Math.round(l.lineTotalCents / l.qty)
      issues.push({
        id: `price_anomaly:${i}`,
        kind: 'price_anomaly',
        severity: 'warn',
        field: `lineItems[${i}].unitPriceCents`,
        lineIndex: i,
        // Suggest the unit price that reconciles qty × unit = line total OR,
        // when the unit price is the off-by-100 typo, the corrected unit price.
        suggestedFixCents: suggestPlausibleUnitPrice(l.unitPriceCents, l.qty, l.lineTotalCents) ?? suggested,
        message: `“${l.desc}”: ${l.qty} × ${formatEur(l.unitPriceCents)} = ${formatEur(
          expected,
        )}, but the line shows ${formatEur(l.lineTotalCents)}.`,
      })
    }
  })

  // Rule 5: Mandatory fields (VAT ID, IBAN) & VAT-ID structural format.
  if (!ext.vatId.value || ext.vatId.value.trim() === '') {
    issues.push({
      id: 'missing_vat_id',
      kind: 'missing_mandatory',
      severity: 'error',
      field: 'vatId',
      message: 'Mandatory field missing: Supplier VAT ID is required for European tax deduction compliance.',
    })
  } else if (!isValidVatId(ext.country, ext.vatId.value)) {
    issues.push({
      id: 'vat_id_format',
      kind: 'vat_id_format',
      severity: 'warn',
      field: 'vatId',
      message: `VAT ID “${ext.vatId.value}” is not a valid ${ext.country} format.`,
    })
  }

  if (ext.iban && (!ext.iban.value || ext.iban.value.trim() === '')) {
    issues.push({
      id: 'missing_iban',
      kind: 'missing_mandatory',
      severity: 'warn',
      field: 'iban',
      message: 'Mandatory payment detail missing: Supplier IBAN was not detected on this invoice.',
    })
  }

  return issues
}

/**
 * When a line is anomalous because the *unit price* was mis-keyed (classic
 * decimal slip, e.g. 1 200,00 instead of 12,00), recover the unit price that
 * makes qty × unit === lineTotal. Returns null if no clean integer fix exists.
 */
function suggestPlausibleUnitPrice(
  _unitPriceCents: number,
  qty: number,
  lineTotalCents: number,
): number | null {
  if (qty <= 0) return null
  if (lineTotalCents % qty !== 0) return null
  return lineTotalCents / qty
}
