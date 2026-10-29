export type Cents = number; // Integer invariant: Number.isInteger(cents) === true

export function isCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isInteger(value) && !Number.isNaN(value);
}

export function assertCents(value: unknown, context = 'Value'): asserts value is Cents {
  if (!isCents(value)) {
    throw new TypeError(`${context} must be an integer number of cents. Received: ${String(value)}`);
  }
}

export function formatCents(cents: Cents, currency = 'USD', locale = 'en-US'): string {
  assertCents(cents, 'formatCents argument');
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseDollarsToCents(amount: number | string): Cents {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }
  const cleaned = amount.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Cannot parse dollar amount from "${amount}"`);
  }
  return Math.round(parsed * 100);
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((acc, curr) => {
    assertCents(curr, 'addCents value');
    return acc + curr;
  }, 0);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  assertCents(a, 'Minuend');
  assertCents(b, 'Subtrahend');
  return a - b;
}

export function multiplyCentsByQuantity(cents: Cents, quantity: number): Cents {
  assertCents(cents, 'cents');
  return Math.round(cents * quantity);
}

export function calculateBasisPoints(cents: Cents, bps: number): Cents {
  assertCents(cents, 'cents');
  return Math.round((cents * bps) / 10000);
}
