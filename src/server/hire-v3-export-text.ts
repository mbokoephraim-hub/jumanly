/**
 * Words of a download (`hireV3Export`): the header and the cells of an `ExportData` table, the
 * same for the A4 document, the CSV and the Excel file.
 */
import { getFormatter, getTranslations } from "next-intl/server";
import type { ExportCell, ExportData } from "@/server/services/hire-v3-exports";

export async function exportTable(data: ExportData, columns?: string[]) {
  const t = await getTranslations("hireV3Export");
  const format = await getFormatter();
  const keep = data.columns
    .map((key, i) => (data.transposed || !columns || columns.includes(key) ? i : -1))
    .filter((i) => i >= 0);
  const cell = (value: ExportCell, index: number): string | number | null => {
    if (typeof value !== "string") return value;
    if (data.transposed && index === 0)
      return value.startsWith("criterion:") ? t(`criteria.${value.slice(10)}`) : t(`cols.${value}`);
    if (value.startsWith("source:")) return t(`source.${value.slice(7)}`);
    if (value.startsWith("role:")) return t(`role.${value.slice(5)}`);
    if (value === "open" || value === "listening") return t(`availability.${value}`);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value))
      return format.dateTime(new Date(value), {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    return value;
  };
  const header = keep.map((i) =>
    data.transposed
      ? i === 0
        ? t("cols.criterion")
        : data.columns[i]!
      : t(`cols.${data.columns[i]}`),
  );
  const rows = data.rows.map((row) => keep.map((i) => cell(row[i] ?? null, i)));
  return { header, rows };
}
