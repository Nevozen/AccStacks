import { moneyToDecimal, type Currency } from "./money";

type CsvMoney = { amount: bigint; currency: Currency };
export type CsvCell = string | number | bigint | Date | CsvMoney | null | undefined;

export function csvMoney(amount: bigint, currency: Currency): CsvMoney {
  return { amount, currency };
}

export function escapeCsvCell(value: CsvCell) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return moneyToDecimal(value.amount, value.currency);

  let text = value.replace(/\0/g, "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = `'${text}`;
  if (/[",\r\n]/u.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
