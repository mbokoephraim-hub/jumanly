import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// Talent space (docs/refonte-mobile, brief § 2.1 and § 5): the search of the destinations, the
// grouped results and the account behind the avatar. The organization and admin spaces keep the
// Admin v4 column (below).
test("espace talent : recherche de l'en-tête et compte derrière l'avatar", async ({
  page,
  isMobile,
}) => {
  await logIn(page, demo.talentPro);
  // Pour moi has no search since lot 3 (planche talent-1): the grouped results stay reachable.
  await page.goto("/app/recherche?q=CV");
  const courses = page.getByRole("region", { name: /^Formations/ });
  await expect(courses.getByRole("link", { name: /Réussir son CV/ })).toBeVisible();
  // Screen 18: Tout / Offres / Formations; a group without result is left out.
  await page
    .getByRole("navigation", { name: "Que chercher" })
    .getByRole("link", { name: "Formations" })
    .click();
  await expect(page).toHaveURL(/vue=formations/);
  await expect(page.getByRole("region", { name: /^Formations/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Offres/ })).toHaveCount(0);
  await expectAccessible(page);

  // The profile (planche talent-4 § 3): sections that fold on the phone, Compétences open first;
  // on a wide screen (web talent 4b) every section is open in two columns.
  await page.goto("/app/profil");
  await expect(page.locator("details.t-sect")).toHaveCount(7);
  await expect(page.locator("#competences")).toHaveAttribute("open", "");
  if (isMobile) await page.locator("#langues > summary").click();
  await expect(page.locator("#langues")).toHaveAttribute("open", "");

  // The account opens from the avatar of a destination; Se déconnecter sits in Compte.
  await page.goto("/app/learn");
  if (isMobile) {
    // Modèle B (lot B7): the avatar of Formation opens Carrière; the account stays at /app/compte.
    await page.locator(".nb-fo-accueil").getByRole("link", { name: "Mon profil" }).click();
    await expect(page).toHaveURL(/\/app\/career\/cv$/);
    await page.goto("/app/compte");
  } else {
    await page.getByRole("link", { name: /^Compte de / }).click();
    await expect(page).toHaveURL(/\/app\/compte$/);
  }
  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
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
