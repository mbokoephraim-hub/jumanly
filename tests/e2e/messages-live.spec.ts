import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { signUpFromPricing, testEmail } from "./session";

/** docs/experience-animee § 4: bell and panel, live arrival with a toast, message of the day. */

test("la cloche ouvre les dernières notifications, sonne à l'arrivée et marque tout comme lu", async ({
  page,
}) => {
  const email = testEmail("cloche");
  await signUpFromPricing(page, "Créer mon compte gratuit", email);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  const bell = page.locator("[data-bell]").filter({ visible: true });
  await expect(bell).toHaveAccessibleName("Notifications · aucune non lue");

  // Something happens while the person is on the platform: the bell rings and a toast says it.
  await page.waitForTimeout(2000); // the bell has read the current state
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/add-notification.ts",
    email,
    "newMessage",
    JSON.stringify({ senderName: "Horizon Démo", jobTitle: "Poste fictif" }),
    "/app/messages",
  ]);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  const toast = page.getByRole("status").filter({ hasText: "Nouveau message de Horizon Démo" });
  await expect(toast).toBeVisible();
  await expect(bell).toHaveAccessibleName("Notifications · 1 non lue");

  await bell.click();
  const panel = page.getByRole("region", { name: "Dernières notifications" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: /Nouveau message de Horizon Démo/ })).toBeVisible();
  await expectAccessible(page);
  await panel.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await expect(bell).toHaveAccessibleName("Notifications · aucune non lue");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("le message du jour s'affiche à la première visite, puis plus de la journée", async ({
  page,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("bonjour"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app");
  const welcome = page.getByRole("link", { name: /Votre profil est complet à|offres? correspond/ });
  await expect(welcome).toBeVisible();
  await page.getByRole("button", { name: "Fermer le message du jour" }).click();
  await expect(welcome).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(welcome).toHaveCount(0);
});
