// Money is integer CENTS everywhere in the engine. Float only at the display edge.

export const euros = (e: number): number => Math.round(e * 100)
export const toEuros = (cents: number): number => cents / 100

const eur0 = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const eur2 = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Format cents as EUR. `cents`=true keeps two decimals (live odometer); default rounds. */
export function formatEur(
  cents: number,
  opts: { cents?: boolean; signed?: boolean } = {},
): string {
  const value = cents / 100
  const fmt = opts.cents ? eur2 : eur0
  const base = fmt.format(Math.abs(value))
  if (opts.signed) {
    const sign = value < 0 ? '−' : value > 0 ? '+' : ''
    return `${sign}${base}`
  }
  return value < 0 ? `−${base}` : base
}

export const pct = (n: number, decimals = 1): string => `${n.toFixed(decimals)}%`

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n))
