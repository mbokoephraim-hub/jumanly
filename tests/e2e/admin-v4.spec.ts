import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Talent space (docs/refonte-mobile, brief § 2.1 and § 5): the search of the destinations, the
// grouped results and the account behind the avatar. The organization and admin spaces keep the
// Admin v4 column (below).
test("espace talent : recherche de l'en-tête et compte derrière l'avatar", async ({ page }) => {
  await logIn(page, demo.talentPro);
  // Modèle B (lot B9): the search is Explorer's on a phone; the avatar of Formation opens
  // « Mon profil » (its own space since 29/10), the account is Paramètres.
  await page.goto("/app/recherche?q=CV");
  await expect(page).toHaveURL(/\/app\/jobs$/);
  await page.goto("/app/learn");
  await page.locator(".nb-fo-accueil").getByRole("link", { name: "Mon profil" }).click();
  await expect(page).toHaveURL(/\/app\/profil$/);
  await page.goto("/app/compte");
  await expect(page).toHaveURL(/\/app\/parametres$/);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page
    .getByRole("dialog", { name: "Se déconnecter ?" })
    .getByRole("button", { name: "Se déconnecter" })
    .click();
  await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);
});

test("admin : rubriques du groupe en haut et recherche de la barre", async ({ page, isMobile }) => {
  test.skip(isMobile, "La barre du haut est celle de l'ordinateur.");
  await logIn(page, demo.admin, undefined, "/admin/forfaits");
  const group = page.getByRole("navigation", { name: "Rubriques de « Forfaits et abonnements »" });
  await expect(group.getByRole("link")).toHaveCount(2);
  await group.getByRole("link", { name: "Abonnements" }).click();
  await expect(page).toHaveURL(/\/admin\/abonnements/);
  await page.locator("#admin-search").fill("talent");
  await page.locator("#admin-search").press("Enter");
  await expect(page).toHaveURL(/\/admin\/recherche\?q=talent/);
  await expect(page.locator("aside").getByRole("link", { name: /Administrateur/ })).toBeVisible();
});
