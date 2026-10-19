import "server-only";
import type { Browser } from "puppeteer-core";

/**
 * Chromium of the platform: @sparticuz/chromium on Vercel, `CHROMIUM_PATH` when set, otherwise the
 * Chromium installed for Playwright (local development and CI).
 */
export async function launch(): Promise<Browser> {
  const puppeteer = await import("puppeteer-core");
  if (process.env.VERCEL && !process.env.CHROMIUM_PATH) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  let executablePath = process.env.CHROMIUM_PATH;
  if (!executablePath) {
    const { chromium } = await import("playwright-core");
    executablePath = chromium.executablePath();
  }
  const root = typeof process.getuid === "function" && process.getuid() === 0;
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--font-render-hinting=none", ...(root ? ["--no-sandbox"] : [])],
  });
}
