import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// Admin v4 (docs/admin-v4/PLAN.md), étapes 2 et 3: the column of icons, the horizontal menu, the
// search of the top bar and the account at the foot of the column.
test("espace connecté : menu horizontal, recherche et compte en bas de la colonne", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "La colonne et la barre du haut sont celles de l'ordinateur.");
  await logIn(page, demo.talentPro);
  await page.goto("/app/career");
  const career = page.getByRole("navigation", { name: "Sous-rubriques de Career" });
  await expect(career.getByRole("link", { name: "Accueil Career" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await career.getByRole("link", { name: "Mon CV" }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv$/);

  // « / » puts the cursor in the search; the results are grouped by type.
  await page.locator("body").press("/");
  await expect(page.locator("#app-search")).toBeFocused();
  await page.locator("#app-search").fill("CV");
  await page.locator("#app-search").press("Enter");
  await expect(page).toHaveURL(/\/app\/recherche\?q=CV/);
  const courses = page.getByRole("region", { name: /^Formations/ });
  await expect(courses.getByRole("link", { name: /Réussir son CV/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Offres/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /^Messages/ })).toBeVisible();
  await expectAccessible(page);

  // The account sits at the foot of the column and opens its menu beside it.
  // The profile: the parts as horizontal tabs.
  await page.goto("/app/profil");
  const parts = page.getByRole("navigation", { name: "Parties du profil" });
  await expect(parts.getByRole("link")).toHaveCount(8);
  await parts.getByRole("link", { name: "Langues" }).click();
  await expect(page).toHaveURL(/#langues$/);

  // The account sits at the foot of the column; its menu opens above the page.
  await page.locator("aside summary[aria-label]").click();
  await page.locator("aside details[open]").getByRole("button", { name: "Se déconnecter" }).click();
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
