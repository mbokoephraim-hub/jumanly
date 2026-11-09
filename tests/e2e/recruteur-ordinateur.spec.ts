import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Recruteur sur ordinateur (08/11/2026) : les écrans du téléphone dans le cadre large, le menu
// Outils et Entreprise sous les onglets, et « À traiter » à droite du Fil.

test.describe("recruteur sur ordinateur", () => {
  test.skip(({ isMobile }) => isMobile, "Le grand écran seulement.");

  test("le cadre, ses outils et « À traiter » à côté du Fil", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
    await page.goto("/app/hire");

    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    for (const tab of ["Fil", "Offres", "Agenda", "Talents", "Chat"])
      await expect(nav.getByRole("link", { name: new RegExp(`^${tab}`) })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Outils" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Entreprise" })).toBeVisible();

    const rail = page.getByRole("complementary", { name: "À traiter" });
    await expect(rail).toBeVisible();
    await expect(rail.getByRole("list", { name: "Ce qui vous attend" })).toBeVisible();
    await expectAccessible(page);

    // A tool lights its own entry, no tab.
    await page
      .getByRole("navigation", { name: "Outils" })
      .getByRole("link", { name: "Rapports" })
      .click();
    await expect(page).toHaveURL(/\/app\/hire\/rapports$/);
    await expect(
      page.getByRole("navigation", { name: "Outils" }).getByRole("link", { name: "Rapports" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('a[data-onglet][aria-current="page"]')).toHaveCount(0);

    // A new application of the rail opens its file.
    await page.goto("/app/hire");
    const first = rail.getByRole("link", { name: /^Examiner la candidature de / }).first();
    if (await first.count()) {
      await first.click();
      await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/?]+/);
    }
  });

  test("les offres en deux colonnes et les outils de l'offre", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire/offres");
    await page.goto("/app/hire/offres");
    const cards = page.locator(".nb-rh-cartes").first();
    await expect(cards).toBeVisible();
    const columns = await cards.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(2);

    await cards.locator("a[href^='/app/hire/offres/']").first().click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+/);
    const tools = page.getByRole("navigation", { name: "Outils de l'offre" });
    await expect(tools).toBeVisible();
    await tools.getByRole("link", { name: "Tableau Orbi" }).click();
    await expect(page).toHaveURL(/\/tableau$/);
    await expectAccessible(page);
  });

  test("l'Agenda : le mois à gauche, le jour choisi à droite", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire/entretiens");
    await page.goto("/app/hire/entretiens");
    const month = page.locator(".nb-rh-ag-mois");
    const day = page.locator("#rh-ag-jour");
    await expect(month).toBeVisible();
    await expect(day).toBeVisible();
    const [m, d] = await Promise.all([month.boundingBox(), day.boundingBox()]);
    expect(d!.x).toBeGreaterThan(m!.x + m!.width - 1);
    expect(d!.y).toBeLessThan(m!.y + m!.height);
    await expectAccessible(page);
  });
});
