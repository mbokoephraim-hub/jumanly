import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Compte (planche talent-4 § 2), opened by the avatar, and the appearance of the talent space
// (brief § 2.10), now in Paramètres.
test("Compte : profil, documents, abonnement, apparence gardée, déconnexion", async ({ page }) => {
  // A sign-up, then about fifteen pages: more than the default 30 s on a busy machine.
  test.setTimeout(90_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("compte"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  // Modèle B (docs/modele-b, lot B9): on a phone the account is Paramètres, dark only.
  await page.goto("/app/compte");
  await expect(page).toHaveURL(/\/app\/parametres$/);
  for (const path of ["/app/parametres", "/app/abonnement", "/app/parametres/securite"]) {
    await page.goto(path);
    await expect(page.locator("html"), path).toHaveClass(/sombre/);
  }
  await expectAccessible(page);
  await page.goto("/app/parametres");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page
    .getByRole("dialog", { name: "Se déconnecter ?" })
    .getByRole("button", { name: "Se déconnecter" })
    .click();
  await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);
});

// Refonte mobile: the former opening screen is gone; its address leads to the space (then to
// the sign-in for a visitor).
test("l'ancienne ouverture mène à l'espace", async ({ page, isMobile }) => {
  await page.goto("/ouverture");
  // On a phone, a visitor lands on « Bienvenue » (Modèle B).
  await expect(page).toHaveURL(isMobile ? /\/decouvrir/ : /\/connexion/, { timeout: 15_000 });
});
