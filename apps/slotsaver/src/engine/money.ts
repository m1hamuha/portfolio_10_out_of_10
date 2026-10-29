// Money is integer CENTS everywhere in the engine. Float only at the display edge.

/** Convert whole euros (number) to integer cents. */
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

/** Format integer cents as EUR. Defaults to two decimals; `whole` drops them. */
export function formatEur(cents: number, opts: { whole?: boolean } = {}): string {
  const value = cents / 100
  const fmt = opts.whole ? eur0 : eur2
  return value < 0 ? `−${fmt.format(Math.abs(value))}` : fmt.format(value)
}

/** Minutes-from-midnight → "HH:MM" (24h, zero-padded). */
export function formatTime(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export const pct = (n: number, decimals = 0): string => `${n.toFixed(decimals)} %`

export const clamp = (n: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, n))
