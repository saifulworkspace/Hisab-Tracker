import { describe, expect, it } from "vitest";
import { emptyFinanceData, getUserCollectionPath } from "./firestoreFinance";

describe("Firebase finance tenancy", () => {
  it("starts a new account with zero collections and no seeded totals", () => {
    expect(emptyFinanceData).toEqual({ receivables: [], payables: [], properties: [], transactions: [] });
  });

  it("uses separate Firestore collection paths for separate Firebase UIDs", () => {
    expect(getUserCollectionPath("uid-a", "receivables")).toBe("users/uid-a/receivables");
    expect(getUserCollectionPath("uid-a", "receivables")).not.toBe(getUserCollectionPath("uid-b", "receivables"));
    expect(getUserCollectionPath("uid-a", "transactions")).toBe("users/uid-a/transactions");
  });
});
