import {
  EXPORT_DOCS,
  EXPORT_FORMATS,
  type ExportDoc,
  type ExportFormat,
} from "@/server/services/hire-v3-exports";

type Raw = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** The choices of a download, read from an address (the window's form is a plain GET). */
export function exportParams(raw: Raw) {
  const doc = (EXPORT_DOCS as readonly string[]).includes(one(raw.doc))
    ? (one(raw.doc) as ExportDoc)
    : "candidats";
  const format = (EXPORT_FORMATS as readonly string[]).includes(one(raw.format))
    ? (one(raw.format) as ExportFormat)
    : "pdf";
  const cols = raw.cols === undefined ? undefined : ([] as string[]).concat(raw.cols);
  return { doc, format, masked: one(raw.masquer) === "1", jobId: one(raw.offre) || null, cols };
}

export function exportQuery(p: ReturnType<typeof exportParams>, over: Record<string, string> = {}) {
  const q = new URLSearchParams({ doc: p.doc, format: p.format });
  if (p.masked) q.set("masquer", "1");
  if (p.jobId) q.set("offre", p.jobId);
  for (const c of p.cols ?? []) q.append("cols", c);
  for (const [k, v] of Object.entries(over)) q.set(k, v);
  return q.toString();
}
