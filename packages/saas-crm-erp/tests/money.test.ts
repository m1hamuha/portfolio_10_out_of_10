import { describe, it, expect } from 'vitest';
import {
  isCents,
  assertCents,
  formatCents,
  parseDollarsToCents,
  addCents,
  subtractCents,
  multiplyCentsByQuantity,
  calculateBasisPoints,
} from '../packages/shared-types/src';

describe('Integer-Cent Financial Math Invariants', () => {
  it('validates integer cents correctly', () => {
    expect(isCents(100)).toBe(true);
    expect(isCents(0)).toBe(true);
    expect(isCents(-500)).toBe(true);
    expect(isCents(10.5)).toBe(false);
    expect(isCents(NaN)).toBe(false);
    expect(isCents('100')).toBe(false);
    expect(isCents(null)).toBe(false);
  });

  it('assertCents throws on fractional values', () => {
    expect(() => assertCents(500)).not.toThrow();
    expect(() => assertCents(49.99)).toThrow(/must be an integer number of cents/);
    expect(() => assertCents(NaN)).toThrow();
  });

  it('formats cents to standard currency string', () => {
    expect(formatCents(125000)).toBe('$1,250.00');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(99)).toBe('$0.99');
    expect(formatCents(8450000)).toBe('$84,500.00');
  });

  it('parses dollars accurately to cents without float rounding artifacts', () => {
    expect(parseDollarsToCents(19.99)).toBe(1999);
    expect(parseDollarsToCents('$19.99')).toBe(1999);
    expect(parseDollarsToCents('$1,250.50')).toBe(125050);
    expect(parseDollarsToCents(0.1 + 0.2)).toBe(30); // 0.30000000000000004 rounded to 30 cents
  });

  it('performs exact addition and subtraction in integer cents', () => {
    expect(addCents(100, 200, 300)).toBe(600);
    expect(subtractCents(1000, 350)).toBe(650);
  });

  it('multiplies cents by quantity and rounds deterministically', () => {
    expect(multiplyCentsByQuantity(1999, 3)).toBe(5997);
    expect(multiplyCentsByQuantity(2500, 2.5)).toBe(6250);
  });

  it('calculates basis points accurately', () => {
    // 19.00% VAT on $100.00 (1900 bps on 10,000 cents)
    expect(calculateBasisPoints(10000, 1900)).toBe(1900);
    // 7.25% Sales Tax on $54.20 (725 bps on 5,420 cents = 392.95 -> 393 cents)
    expect(calculateBasisPoints(5420, 725)).toBe(393);
  });
});
