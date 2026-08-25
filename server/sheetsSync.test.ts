import { describe, expect, it } from "vitest";
import { SHEET_TAB_NAMES } from "./sheetsSync";

describe("optional Google Sheets sync contract", () => {
  it("uses the exact required tab names", () => {
    expect(SHEET_TAB_NAMES).toEqual(["Receivables", "Payables", "Properties"]);
  });
});
