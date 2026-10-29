// Money is integer CENTS everywhere in the engine. Float only at the display edge.

export type Cents = number

export interface MoneyValue {
  readonly cents: Cents
  add(other: MoneyValue): MoneyValue
  subtract(other: MoneyValue): MoneyValue
  multiplyByQuantity(qty: number): MoneyValue
  applyBasisPoints(bps: number): MoneyValue
  format(currency?: string, locale?: string): string
}

export class Money implements MoneyValue {
  readonly cents: Cents

  constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new TypeError(`Money invariant violated: cents must be an integer, got ${cents}`)
    }
    this.cents = cents
  }

  static fromCents(cents: number): Money {
    return new Money(Math.round(cents))
  }

  static fromEuros(euros: number): Money {
    return new Money(Math.round(euros * 100))
  }

  add(other: MoneyValue): Money {
    return new Money(this.cents + other.cents)
  }

  subtract(other: MoneyValue): Money {
    return new Money(this.cents - other.cents)
  }

  multiplyByQuantity(qty: number): Money {
    return new Money(Math.round(this.cents * qty))
  }

  applyBasisPoints(bps: number): Money {
    // e.g. 1900 bps = 19.00%
    return new Money(Math.round((this.cents * bps) / 10000))
  }

  format(currency = 'EUR', locale = 'de-DE'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.cents / 100)
  }
}

export const euros = (e: number): number => Math.round(e * 100)
export const toEuros = (cents: number): number => cents / 100

// European-style EUR formatting (e.g. "1.200,00 €") to match the EU SMB context.
const eur2 = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const eur0 = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** Format integer cents as EUR. Defaults to two decimals (invoice precision). */
export function formatEur(cents: number, opts: { whole?: boolean } = {}): string {
  const value = cents / 100
  const fmt = opts.whole ? eur0 : eur2
  return value < 0 ? `−${fmt.format(Math.abs(value))}` : fmt.format(value)
}

/** Round half-up to the nearest cent for a cents * rate computation. */
export const roundCents = (n: number): number => Math.round(n)

export const pct = (n: number, decimals = 0): string => `${n.toFixed(decimals)} %`

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n))

/** Human duration from seconds: "7 min", "1 h 38 min", "9 sec". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} sec`
  const mins = Math.round(s / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
