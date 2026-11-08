import { execFileSync } from "node:child_process";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { finishOnboarding, signUpFromPricing, testEmail } from "./session";

/**
 * docs/experience-animee § 4, in the talent header of the refonte mobile: the bell (a link to the
 * notifications, a Lime dot when one is unread), live arrival with a toast, message of the day.
 */

test("la cloche signale l'arrivée d'une notification, puis tout se marque comme lu", async ({
  page,
}) => {
  const email = testEmail("cloche");
  await signUpFromPricing(page, "Créer mon compte gratuit", email);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await finishOnboarding(page);
  await expect(page).toHaveURL(/\/app(\?bienvenue=1)?$/);
  // The bell is a link to the page (Modèle B, on every device since 07/11/2026).
  const bell = page.getByRole("link", { name: /^Notifications/ }).filter({ visible: true });
  await expect(bell).toHaveAccessibleName("Notifications");

  // Something happens while the person is on the platform: the bell lights up and a toast says it.
  await page.waitForTimeout(2500); // the bell has read the current state
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
  await expect(bell).toHaveAccessibleName("Notifications, 1 non lue");

  await bell.click();
  await expect(page).toHaveURL(/\/app\/notifications$/);
  // The name first, beside the photo (Ephraïm 29/10/2026); the model's title « Nouveau message »
  // comes before the name (03/11/2026).
  const item = page.getByRole("button", { name: /Horizon Démo/ });
  await expect(item).toContainText("« Poste fictif »");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await page.goto("/app");
  await expect(
    page.getByRole("link", { name: /^Notifications/ }).filter({ visible: true }),
  ).toHaveAccessibleName("Notifications");
});
