import { toCsv, type CsvCell } from "@/lib/csv";

export function csvResponse(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
) {
  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
