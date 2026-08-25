import { describe, expect, it } from "vitest";
import { getAllPayables, getAllPropertiesWithPayments, getAllReceivables, getMoneyTransactions } from "./db";

describe("finance user isolation", () => {
  it("does not expose owner records to a different user ID", async () => {
    const otherUserId = 987654321;
    const otherReceivables = await getAllReceivables(otherUserId);
    const otherPayables = await getAllPayables(otherUserId);
    const otherProperties = await getAllPropertiesWithPayments(otherUserId);
    const otherTransactions = await getMoneyTransactions(otherUserId);

    expect(otherReceivables).toHaveLength(0);
    expect(otherPayables).toHaveLength(0);
    expect(otherProperties).toHaveLength(0);
    expect(otherTransactions).toHaveLength(0);
  });
});
