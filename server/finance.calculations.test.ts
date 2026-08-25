import { describe, expect, it } from "vitest";
import { calculateCurrencyTotals, calculatePropertyMetrics } from "./db";

describe("finance calculations", () => {
  it("keeps BDT and SR totals separate", () => {
    expect(
      calculateCurrencyTotals([
        { amount: "150000.00", currency: "BDT" },
        { amount: "1579.00", currency: "SR" },
        { amount: 3910, currency: "SR" },
      ]),
    ).toEqual({ BDT: 150000, SR: 5489 });
  });

  it("calculates paid, due, and progress percentage from itemized payments", () => {
    expect(
      calculatePropertyMetrics("400000.00", [
        { amount: "25000" },
        { amount: "25000" },
        { amount: "10000" },
        { amount: "10000" },
        { amount: "10000" },
      ]),
    ).toEqual({ totalPaid: 80000, dueAmount: 320000, progressPercent: 20 });
  });

  it("caps progress at 100% and never reports a negative due amount", () => {
    expect(calculatePropertyMetrics(100, [{ amount: 125 }])).toEqual({
      totalPaid: 125,
      dueAmount: 0,
      progressPercent: 100,
    });
  });
});
