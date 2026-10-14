/** CSV for spreadsheets (exports of reports and history). Headers come from the texts. */
export function toCsv(headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value);
    // A cell starting with = + - @ would be read as a formula by a spreadsheet.
    const safe = typeof value === "string" && /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}
