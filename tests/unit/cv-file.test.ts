// @vitest-environment node
import { strToU8, zipSync } from "fflate";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import {
  CV_FILE_MAX_BYTES,
  CvFileError,
  cvFileKind,
  docxText,
  readCvFile,
} from "@/server/services/cv-file";

function docx(paragraphs: string[]) {
  const body = paragraphs
    .map((text) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`)
    .join("");
  return zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "word/document.xml": strToU8(
      `<?xml version="1.0"?><w:document><w:body>${body}</w:body></w:document>`,
    ),
  });
}

async function pdf(lines: string[]) {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  lines.forEach((line, index) =>
    page.drawText(line, { x: 50, y: 700 - index * 20, font, size: 12 }),
  );
  return doc.save();
}

describe("lire un CV en PDF ou Word (planche talent-4 § 6)", () => {
  it("lit un document Word paragraphe par paragraphe, entités comprises", async () => {
    const bytes = docx([
      "Amani Fictif",
      "Analyste de données &amp; reporting",
      "Fleuve Banque fictive · 2023 – aujourd&apos;hui",
    ]);
    expect(cvFileKind(bytes)).toBe("docx");
    expect(docxText(bytes)).toBe(
      "Amani Fictif\nAnalyste de données & reporting\nFleuve Banque fictive · 2023 – aujourd'hui",
    );
    const read = await readCvFile(bytes);
    expect(read).toMatchObject({ kind: "docx", pages: null });
  });

  it("lit un PDF ligne par ligne et compte ses pages", async () => {
    const bytes = await pdf([
      "Analyste de donnees chez Fleuve Banque fictive",
      "Competences : SQL, Excel, Power BI",
    ]);
    const read = await readCvFile(bytes);
    expect(read.kind).toBe("pdf");
    expect(read.pages).toBe(1);
    expect(read.text).toContain("Competences : SQL, Excel, Power BI");
    expect(read.text.split("\n").length).toBeGreaterThanOrEqual(2);
  });

  it("refuse un autre format, un fichier trop lourd ou sans texte", async () => {
    const code = (promise: Promise<unknown>) =>
      promise.then(
        () => null,
        (error: unknown) => (error instanceof CvFileError ? error.code : "other"),
      );
    expect(await code(readCvFile(strToU8("Bonjour, ceci est un simple fichier texte.")))).toBe(
      "format",
    );
    const heavy = new Uint8Array(CV_FILE_MAX_BYTES + 1);
    heavy.set([0x25, 0x50, 0x44, 0x46]);
    expect(await code(readCvFile(heavy))).toBe("size");
    expect(await code(readCvFile(await pdf([])))).toBe("empty");
    expect(await code(readCvFile(new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2, 3])))).toBe(
      "unreadable",
    );
  });
});
