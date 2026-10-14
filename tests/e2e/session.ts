import { expect, type Page } from "@playwright/test";
import { codesSince, lastCode } from "./outbox";

/** Demo accounts from prisma/seed/accounts.ts (local and preview only). */
export const DEMO_PASSWORD = "Demo-Jumanly-2026";
export const demo = {
  talentFree: "talent.free@jumanly.test",
  talentPro: "talent.pro@jumanly.test",
  talentStarter: "talent.starter@jumanly.test",
  editor: "editeur@jumanly.test",
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
  // Tests running in parallel can sign in to the same demo account at once: each sign-in gets
  // its own code, so a refused code is followed by the other codes sent since, newest first.
  // Codes sent by another sign-in after the list was read are picked up on the next round.
  if (page.url().includes("/connexion/deux-etapes")) {
    await lastCode(email, since);
    const tried = new Set<string>();
    const deadline = Date.now() + 45_000;
    let passed = false;
    while (!passed && Date.now() < deadline) {
      const fresh = codesSince(email, since).filter((code) => !tried.has(code));
      if (fresh.length === 0) {
        await page.waitForTimeout(500);
        continue;
      }
      for (const code of fresh) {
        tried.add(code);
        await page.locator('input[name="code"]').fill(code);
        await page.getByRole("button", { name: /Vérifier|Confirmer/ }).click();
        passed = await page
          .waitForURL((url) => !url.pathname.startsWith("/connexion"), { timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
        if (passed) break;
      }
    }
  }
  await expect(page).not.toHaveURL(/\/connexion/);
}

/** A unique, obviously fictional address on the reserved .test domain. */
export function testEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@jumanly.test`;
}

export const PASSWORD = "kinshasa-2026";

/** Steps 1 to 4 of the sign-up (partie 06 § 6.1), from a plan chosen on /tarifs. */
export async function signUpFromPricing(page: Page, planButton: string, email: string) {
  await page.goto("/tarifs");
  // The link is followed by its address: on a phone the cookie banner may cover it.
  const href = await page
    .getByRole("link", { name: planButton, exact: true })
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await expect(page).toHaveURL(/\/inscription/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/inscription\/forfait/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await page.locator('input[name="firstName"]').fill("Awa");
  await page.locator('input[name="lastName"]').fill("Fictive");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('select[name="country"]').selectOption("CD");
  await page.locator('input[name="city"]').fill("Kinshasa");
  for (const name of ["terms", "ai", "age"]) await page.locator(`input[name="${name}"]`).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await page.locator('input[name="code"]').fill(await lastCode(email, since));
  await page.getByRole("button", { name: "Vérifier" }).click();
}
