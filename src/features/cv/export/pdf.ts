import "server-only";
import { PDFDocument } from "pdf-lib";
import type { Browser } from "puppeteer-core";
import { launch } from "@/server/pdf/chromium";

/**
 * PDF export of a CV by Chromium (SPECIFICATION-MODELES-CV.md § 6.3): the internal print page is
 * opened with its single-use token, paginated by the same code as the preview, then printed.
 * The file carries the person's name only: no Jumanly title, author, creator or producer.
 */

export class CvExportError extends Error {
  constructor(readonly reason: "timeout" | "browser") {
    super(`Export du CV impossible (${reason}).`);
  }
}

export type CvPdf = { bytes: Uint8Array; pages: number; alert: string | null };

export async function printCvPdf({
  url,
  name,
}: {
  /** Print page with its token. */
  url: string;
  /** « Prénom Nom », for the file's title and author. */
  name: string;
}): Promise<CvPdf> {
  let browser: Browser;
  try {
    browser = await launch();
  } catch (error) {
    console.error(error);
    throw new CvExportError("browser");
  }
  try {
    const page = await browser.newPage();
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) await page.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypass });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20_000 });
    await page
      .waitForFunction(() => document.body.dataset.pret === "1", { timeout: 15_000 })
      .catch(() => {
        throw new CvExportError("timeout");
      });
    const info = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>("article.cv");
      return { pages: Number(article?.dataset.pages ?? 0), alert: article?.dataset.alerte ?? null };
    });
    const raw = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    return { bytes: await withMetadata(raw, name), pages: info.pages, alert: info.alert };
  } finally {
    await browser.close();
  }
}

/** Title « CV Prénom Nom », author « Prénom Nom », nothing else. */
export async function withMetadata(pdf: Uint8Array, name: string) {
  const document = await PDFDocument.load(pdf, { updateMetadata: false });
  document.setTitle(name ? `CV ${name}` : "CV");
  document.setAuthor(name);
  document.setCreator("");
  document.setProducer("");
  document.setKeywords([]);
  document.setSubject("");
  return document.save();
}

/** « CV-Grace-Mbuyi.pdf », or « CV-Grace-Mbuyi-Banque.pdf » when the person has several CVs. */
export function cvFileName(name: string, title?: string, extension = "pdf") {
  const slug = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const parts = ["CV", slug(name), title ? slug(title) : ""].filter(Boolean);
  return `${parts.join("-")}.${extension}`;
}
