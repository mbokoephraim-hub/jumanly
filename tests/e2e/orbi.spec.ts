import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Orbi en page de conversation et son historique (refonte mobile, talent lot 4 § 9). En Free,
// sans consentement à l'IA, la réponse vient des règles et mène vers l'outil adapté et les formules.
test("Orbi : écrire, comprendre la réponse, retrouver puis effacer l'échange", async ({ page }) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("orbi"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app/orbi");
  // Téléphone (Modèle B, lot B9) : Orbi est le disque flottant de chaque onglet ; l'ancienne
  // page ouvre sa feuille sur le Fil (tests/e2e/modele-b-fondations.spec.ts pour la suite).
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("dialog", { name: "Orbi" }).getByRole("textbox", { name: "Écrire à Orbi" }),
  ).toBeVisible();
});
