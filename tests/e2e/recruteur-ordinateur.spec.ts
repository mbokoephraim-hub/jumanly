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
});
