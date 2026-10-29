import { Cents } from './types';

export function assertInteger(val: number, context: string): void {
  if (!Number.isInteger(val)) {
    throw new TypeError(`[FintechMath Invariant Violation] ${context} must be an integer, got: ${val}`);
  }
}

export function toCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

export function toDollars(cents: Cents): number {
  assertInteger(cents, 'toDollars');
  return cents / 100;
}

export function addCents(a: Cents, b: Cents): Cents {
  assertInteger(a, 'addCents:a');
  assertInteger(b, 'addCents:b');
  return a + b;
}

export function subCents(a: Cents, b: Cents): Cents {
  assertInteger(a, 'subCents:a');
  assertInteger(b, 'subCents:b');
  return a - b;
}

export function applyBasisPoints(cents: Cents, bps: number): Cents {
  assertInteger(cents, 'applyBasisPoints:cents');
  assertInteger(bps, 'applyBasisPoints:bps');
  return Math.round((cents * bps) / 10000);
}

export function formatCurrency(
  cents: Cents,
  currency: 'USD' | 'EUR' | 'GBP' = 'USD',
  locale = 'en-US'
): string {
  assertInteger(cents, 'formatCurrency');
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const absDollars = absCents / 100;
  const hasFraction = absCents % 100 !== 0;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absDollars);

  return isNegative ? `-${formatted}` : formatted;
}

export function calculateDateOffsetMonths(baseDateIso: string, months: number): string | null {
  if (!isFinite(months) || months <= 0) return null;
  const date = new Date(baseDateIso);
  if (isNaN(date.getTime())) return null;

  // Deterministic fractional day conversion (average calendar month = 30.4375 days)
  const totalDays = Math.round(months * 30.4375);
  date.setUTCDate(date.getUTCDate() + totalDays);
  return date.toISOString().split('T')[0];
}
