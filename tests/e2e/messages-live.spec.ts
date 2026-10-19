import { execFileSync } from "node:child_process";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { signUpFromPricing, testEmail } from "./session";

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
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page).toHaveURL(/\/app$/);
  const bell = page.getByRole("link", { name: /^Notifications/ });
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
  // A link on a computer, a button that opens it on a phone.
  await expect(
    page
      .getByRole("main")
      .getByText(/Nouveau message de Horizon Démo/)
      .filter({ visible: true }),
  ).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
  await page.goto("/app");
  await expect(page.getByRole("link", { name: /^Notifications/ })).toHaveAccessibleName(
    "Notifications",
  );
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
