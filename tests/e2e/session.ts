import { expect, type Page } from "@playwright/test";
import { lastCode } from "./outbox";

/** Demo accounts from prisma/seed/accounts.ts (local and preview only). */
export const DEMO_PASSWORD = "Demo-Jumanly-2026";
export const demo = {
  talentFree: "talent.free@jumanly.test",
  talentPro: "talent.pro@jumanly.test",
  admin: "admin@jumanly.test",
} as const;

export async function logIn(page: Page, email: string, password = DEMO_PASSWORD, next?: string) {
  const since = Date.now();
  await page.goto(next ? `/connexion?suite=${encodeURIComponent(next)}` : "/connexion");
  const form = page.locator("form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/connexion") || url.pathname.includes("deux-etapes"),
  );
  if (page.url().includes("/connexion/deux-etapes")) {
    await page.locator('input[name="code"]').fill(await lastCode(email, since));
    await page.getByRole("button", { name: /Vérifier|Confirmer/ }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/connexion"));
  }
  await expect(page).not.toHaveURL(/\/connexion/);
}

/** A unique, obviously fictional address on the reserved .test domain. */
export function testEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@jumanly.test`;
}
