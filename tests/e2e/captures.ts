import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

/**
 * Captures of a lot, compared with the mockups (Modèle B recruteur, définition de fini): only when
 * CAPTURE_DIR is set, at 390 × 844 (`CAPTURE_VIEWPORT`). Nothing happens in a normal run.
 */
export const CAPTURE_DIR = process.env.CAPTURE_DIR;
export const CAPTURE_VIEWPORT = CAPTURE_DIR ? { viewport: { width: 390, height: 844 } } : {};

export async function capture(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  // Lets the entrance of the screen end (0.35 s) before the picture.
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}.png`) });
}
