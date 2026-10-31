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
    console.error("[cv-pdf] Chromium n'a pas démarré", error);
    throw new CvExportError("browser");
  }
  let step = "page";
  try {
    const page = await browser.newPage();
    // The service worker of the site (public/sw.js) would keep fetching pages and pictures in the
    // background: the print waits for the CV only (Ephraïm, 31/10: the download failed in production).
    await page.setBypassServiceWorker(true);
    // A plain browser name: a firewall rule against « HeadlessChrome » must not stop the print.
    const agent = (await browser.userAgent()).replace(/HeadlessChrome/g, "Chrome");
    await page.setUserAgent({ userAgent: agent });
    const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypass) await page.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypass });
    step = "goto";
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    if (!response || !response.ok()) {
      console.error("[cv-pdf] page d'impression refusée", response?.status(), response?.url());
      throw new CvExportError("browser");
    }
    step = "ready";
    // The page says when the CV is paginated (fonts loaded): that is the only signal needed.
    await page
      .waitForFunction(() => document.body.dataset.pret === "1", { timeout: 25_000 })
      .catch(() => {
        throw new CvExportError("timeout");
      });
    step = "print";
    const info = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>("article.cv");
      return { pages: Number(article?.dataset.pages ?? 0), alert: article?.dataset.alerte ?? null };
    });
    const raw = await page.pdf({ preferCSSPageSize: true, printBackground: true, timeout: 20_000 });
    return { bytes: await withMetadata(raw, name), pages: info.pages, alert: info.alert };
  } catch (error) {
    console.error(`[cv-pdf] échec à l'étape « ${step} »`, error);
    if (error instanceof CvExportError) throw error;
    throw new CvExportError(step === "ready" ? "timeout" : "browser");
  } finally {
    await browser.close().catch(() => undefined);
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
