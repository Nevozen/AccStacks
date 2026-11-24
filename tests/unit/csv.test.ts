import { describe, expect, it } from "vitest";
import { escapeCsvCell, toCsv } from "@/lib/csv";

describe("CSV export safety", () => {
  it.each(["=1+1", "+SUM(A1:A2)", "-2+3", "@cmd", "  =HYPERLINK(...)", "\t=1+1"])(
    "neutralizes formula-like user text: %s",
    (value) => {
      expect(escapeCsvCell(value).startsWith("'")).toBe(true);
    },
  );

  it("quotes commas, quotes, and multiline text", () => {
    expect(escapeCsvCell('Seller, "trusted"\nSecond line')).toBe(
      '"Seller, ""trusted""\nSecond line"',
    );
  });

  it("preserves numeric financial values including negative profit", () => {
    expect(escapeCsvCell(-125_000n)).toBe("-125000");
    expect(escapeCsvCell(0)).toBe("0");
    expect(escapeCsvCell(null)).toBe("");
  });

  it("creates UTF-8 CSV with stable rows", () => {
    const csv = toCsv(
      ["Name", "Profit"],
      [
        ["=formula", 100n],
        ["Valid", -50n],
      ],
    );
    expect(csv.startsWith("\uFEFFName,Profit\r\n")).toBe(true);
    expect(csv).toContain("'=formula,100");
    expect(csv).toContain("Valid,-50");
  });
});
