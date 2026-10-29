/**
 * Asserts that financial amounts are represented and calculated as exact integer cents.
 */
export function assertIntegerCents(cents: number, fieldName = 'amount'): void {
  if (!Number.isInteger(cents)) {
    throw new Error(
      `Financial invariant violation: ${fieldName} must be an exact integer representing cents, received ${cents}`,
    );
  }
}
