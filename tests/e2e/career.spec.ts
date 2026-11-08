import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// E10. The simulations, letters and projects of the former computer pages are tested on the Modèle B
// screens since 07/11/2026 (modele-b-entretien, modele-b-carriere), on every device.

test("projets : verrou en Free, page publique sans compte", async ({ page, browser }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/career/portfolio");
  // Modèle B: the former portfolio page leads to the « Réalisations » of Mon profil (29/10).
  await expect(page).toHaveURL(/\/app\/profil(\?onglet=realisations)?$/);
  await expect(
    page
      .getByRole("tablist", { name: "Sections du profil" })
      .filter({ visible: true })
      .getByRole("tab", { name: "Réalisations" }),
  ).toHaveAttribute("aria-selected", "true");

  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto("/portfolio/demo-portfolio-fictif");
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("Bisimwa Fictif");
  await expect(visitor.getByText("Tableau de suivi des ventes (projet fictif)")).toBeVisible();
  await expect(visitor.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectAccessible(visitor);
  await visitor.goto("/portfolio/adresse-inconnue");
  await expect(
    visitor.getByText("Ce portfolio n'est pas disponible.", { exact: false }),
  ).toBeVisible();
  await context.close();
});

// Lot 7: the former pages of the old design lead, for good, to their place in the redesign.
test("les anciennes adresses mènent à leur place dans la refonte", async ({ page }) => {
  await logIn(page, demo.talentFree);
  for (const [from, to] of [
    ["/app/career", /\/app\/career\/cv$/],
    ["/app/career/conseils", /\/app\/learn$/],
    ["/app/tableau-de-bord", /\/app$/],
    ["/app/espace", /\/app\/compte$/],
  ] as const) {
    await page.goto(from);
    await expect(page, from).toHaveURL(to);
  }
});
