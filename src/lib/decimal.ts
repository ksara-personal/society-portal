import type { Prisma } from "@prisma/client";

/**
 * Prisma returns `Decimal` instances for money columns, and those cannot be
 * handed from a Server Component or server action to a Client Component —
 * React logs "Only plain objects can be passed to Client Components" and the
 * value arrives as whatever `toJSON` happened to produce.
 *
 * Every client-side consumer in this app already coerces these with
 * `Number()` / `String()`, and `Decimal(10, 2)` money values are well inside
 * the range a JS number represents exactly, so the conversion is done once at
 * the boundary instead.
 *
 * Server-only callers (the dues tracker, quarterly balances, the finance
 * summary) keep working with `Decimal` and don't need these.
 */
export function toPlainQuarter<T extends { defaultAmount: Prisma.Decimal }>(quarter: T) {
  return { ...quarter, defaultAmount: Number(quarter.defaultAmount) };
}

/** A row with a money `amount` and an included quarter. */
export function toPlainAmountRow<
  T extends { amount: Prisma.Decimal; quarter: { defaultAmount: Prisma.Decimal } }
>(row: T) {
  return {
    ...row,
    amount: Number(row.amount),
    quarter: toPlainQuarter(row.quarter),
  };
}
