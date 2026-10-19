/**
 * Reading a CV file (planche talent-4 § 6, « Importer un CV »): a PDF or a Word document (.docx)
 * of 4 MB at most becomes plain text for the import. The file itself is never stored; only its text goes to `importCvText`.
 */
import { strFromU8, unzipSync } from "fflate";
import { getDocumentProxy } from "unpdf";

// 4 MB, not the 5 MB of the mockup: a request to the host stops at 4.5 MB (server actions: 4.2 MB).
export const CV_FILE_MAX_BYTES = 4 * 1024 * 1024;

export type CvFileKind = "pdf" | "docx";
export type CvFileText = { kind: CvFileKind; pages: number | null; text: string };

export class CvFileError extends Error {
  constructor(readonly code: "format" | "size" | "empty" | "unreadable") {
    super(code);
  }
}

/** The kind of file from its first bytes, never from its name alone. */
export function cvFileKind(bytes: Uint8Array): CvFileKind | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)
    return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04)
    return "docx";
  return null;
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** The text of a Word document: one line per paragraph, tabs and breaks kept as spaces or lines. */
export function docxText(bytes: Uint8Array) {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (file) => file.name === "word/document.xml" });
  } catch {
    throw new CvFileError("unreadable");
  }
  const xml = files["word/document.xml"];
  if (!xml) throw new CvFileError("unreadable");
  return strFromU8(xml)
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>|<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => entities[name]!)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** The text of a PDF, line by line as the file lays it out. */
export async function pdfText(bytes: Uint8Array) {
  try {
    const pdf = await getDocumentProxy(bytes);
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      let line = "";
      const lines: string[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        line += item.str;
        if (item.hasEOL) {
          lines.push(line);
          line = "";
        } else if (item.str && !line.endsWith(" ")) line += " ";
      }
      lines.push(line);
      pages.push(
        lines
          .map((value) => value.replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join("\n"),
      );
    }
    return { pages: pdf.numPages, text: pages.join("\n") };
  } catch {
    throw new CvFileError("unreadable");
  }
}

export async function readCvFile(bytes: Uint8Array): Promise<CvFileText> {
  if (bytes.byteLength === 0) throw new CvFileError("empty");
  if (bytes.byteLength > CV_FILE_MAX_BYTES) throw new CvFileError("size");
  const kind = cvFileKind(bytes);
  if (!kind) throw new CvFileError("format");
  const read = kind === "pdf" ? await pdfText(bytes) : { pages: null, text: docxText(bytes) };
  // A scanned PDF has no text layer: say so rather than import nothing.
  if (read.text.replace(/\s/g, "").length < 30) throw new CvFileError("empty");
  return { kind, ...read };
}
