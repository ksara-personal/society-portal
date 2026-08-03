import { describe, expect, it } from "vitest";
import { summarizeFlatPayment } from "./payment-summary";

describe("summarizeFlatPayment", () => {
  it("prefers the latest PAID payment for a flat", () => {
    const result = summarizeFlatPayment([
      { id: "1", status: "PENDING", amount: "100", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "2", status: "PAID", amount: "100", createdAt: "2026-02-01T00:00:00.000Z" },
      { id: "3", status: "PENDING", amount: "100", createdAt: "2026-03-01T00:00:00.000Z" },
    ]);

    expect(result.hasPaid).toBe(true);
    expect(result.payment?.id).toBe("2");
  });

  it("falls back to the latest payment when no PAID payment exists", () => {
    const result = summarizeFlatPayment([
      { id: "1", status: "PENDING", amount: "100", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "2", status: "OVERDUE", amount: "100", createdAt: "2026-02-01T00:00:00.000Z" },
    ]);

    expect(result.hasPaid).toBe(false);
    expect(result.payment?.id).toBe("2");
  });
});
