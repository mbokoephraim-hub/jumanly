import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B4 (docs/modele-b, rangées 07 à 10): Explorer on the phone, its search in two
// steps, « Tout voir », the saved offers, an offer and its sheet « Postuler », the pages of a
// company and of a person. Grâce (grace.ux@) sees the demo offers and people of the seed.
test.describe("Modèle B · Explorer au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton d'Explorer ouvre quelque chose", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/jobs");
    const explorer = page.locator(".nb-ex").first();
    await expect(explorer.getByRole("heading", { name: "Explorer", exact: true })).toBeVisible();

    // « Filtres » (docs/fil-menu-publication § 3): the sheet rises, the scope folds the groups
    // that do not concern it, « Voir N résultats » shows only that kind of result.
    await explorer.getByRole("button", { name: "Filtres", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Filtres" });
    await expect(sheet.getByRole("heading", { name: "Filtres" })).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: /^Voir \d+ résultat|Aucun résultat/ }),
    ).toBeVisible();
    // Never a filter by gender, age or nationality (règle d'or 4).
    await expect(sheet.getByText(/genre|âge|nationalité/i)).toHaveCount(0);
    const scope = sheet.getByRole("group", { name: "Chercher dans" });
    await scope.getByRole("button", { name: "Entreprises", exact: true }).click();
    await expect(sheet.getByRole("group", { name: "Type de contrat · offres" })).toBeHidden();
    await expect(sheet.getByRole("group", { name: "Secteur · entreprises" })).toBeVisible();
    await sheet.getByRole("button", { name: /^Voir \d+ résultat|Aucun résultat/ }).click();
    await expect(sheet).toBeHidden();
    await expect(
      explorer.getByRole("heading", { name: "Entreprises qui recrutent" }),
    ).toBeVisible();
    await expect(explorer.getByRole("heading", { name: "Offres pour vous" })).toHaveCount(0);

    // A contract filter, read on the server; the button shows how many filters are on.
    await explorer.getByRole("button", { name: "Filtres", exact: true }).click();
    await scope.getByRole("button", { name: "Tout", exact: true }).click();
    const contracts = sheet.getByRole("group", { name: "Type de contrat · offres" });
    await contracts.getByRole("button", { name: "CDI", exact: true }).click();
    await expect(contracts.getByRole("button", { name: "CDI", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await sheet.getByRole("button", { name: /^Voir \d+ résultat|Aucun résultat/ }).click();
    await expect(sheet).toBeHidden();
    await expect(explorer.getByRole("button", { name: "Filtres, 1 filtre actif" })).toBeVisible();
    await expect(explorer.getByRole("heading", { name: "Offres pour vous" })).toBeVisible();
    // Each poster card names « Entreprise · Ville · Contrat ».
    const cards = await explorer
      .locator('section[aria-labelledby="ex-pour-vous"] .nb-ex-affiches > a')
      .allTextContents();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) expect(card).toMatch(/· CDI/);

    // « Effacer » then « Voir » comes back to Explorer as it was.
    await explorer.getByRole("button", { name: "Filtres, 1 filtre actif" }).click();
    await sheet.getByRole("button", { name: "Effacer" }).click();
    await sheet.getByRole("button", { name: /^Voir \d+ résultat/ }).click();
    await expect(explorer.getByRole("button", { name: "Filtres", exact: true })).toBeVisible();

    // Search, step 1: where to search; step 2: from the letters, the results.
    const field = explorer.getByRole("searchbox", { name: /Rechercher une offre/ });
    await field.click();
    await expect(explorer.getByText("Rechercher dans")).toBeVisible();
    await expect(explorer.getByRole("heading", { name: "Offres pour vous" })).toHaveCount(0);
    await field.fill("Baobab");
    const companies = explorer.getByRole("region", { name: /^Entreprises · / });
    await expect(companies.getByRole("link", { name: /Baobab Fintech/ })).toBeVisible();
    await explorer.getByRole("button", { name: "Annuler" }).click();
    await expect(explorer.getByRole("heading", { name: "Offres pour vous" })).toBeVisible();

    // « Tout voir » opens the whole list; « Explorer » comes back.
    await explorer.getByRole("link", { name: "Tout voir : Entreprises qui recrutent" }).click();
    await page.waitForURL("**/app/explorer/entreprises");
    await expect(page.getByRole("heading", { name: "Entreprises qui recrutent" })).toBeVisible();
    await page.getByRole("link", { name: "Explorer" }).first().click();
    await page.waitForURL("**/app/jobs");
    await explorer.getByRole("link", { name: "Tout voir : Offres pour vous" }).click();
    await page.waitForURL("**/app/explorer/offres");
    await expect(page.getByRole("heading", { name: "Offres pour vous" })).toBeVisible();
    await page.getByRole("link", { name: "Explorer" }).first().click();
    await page.waitForURL("**/app/jobs");

    // The bookmark opens the saved offers.
    await explorer.getByRole("link", { name: /^Offres enregistrées/ }).click();
    await page.waitForURL("**/app/jobs/enregistrees");
    await expect(page.getByRole("heading", { name: "Offres enregistrées" })).toBeVisible();
  });

  test("une offre : Pourquoi, Enregistrer, Postuler et l'entreprise", async ({ page }) => {
    test.setTimeout(90_000);
    await logIn(page, "grace.ux@jumanly.test");
    // The other tabs stay mounted under the page: look in the page itself (main).
    const pile = page.locator("main");
    await page.goto("/app/jobs/ux-assistant-administratif-cotonou");
    await expect(
      pile.getByRole("heading", { name: /Assistant administratif et accueil/ }),
    ).toBeVisible();
    await expect(pile.getByText(/% pour vous|Pas encore de score/).first()).toBeVisible();

    // « Enregistrer » answers at once, and again to undo.
    const save = pile.getByRole("button", { name: /^Enregistr/ });
    const before = await save.getAttribute("aria-pressed");
    await save.click();
    await expect(save).not.toHaveAttribute("aria-pressed", before ?? "false");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", before ?? "false");

    // « Postuler » opens its page (01/11/2026): first, how to apply. Free, always.
    await pile.getByRole("link", { name: /^(Postuler|Reprendre)$/ }).click();
    await page.waitForURL("**/postuler**");
    await expect(page.getByRole("heading", { level: 1, name: "Postuler" })).toBeVisible();
    await page.goto("/app/jobs/ux-assistant-administratif-cotonou");

    // The company's page, its tabs, « Suivre » and the way back.
    await pile.getByRole("link", { name: /Voir la page/ }).click();
    await page.waitForURL("**/app/entreprises/**");
    // The page opens on its publications (Publications · À propos · Offres · Membres).
    const tabs = pile.getByRole("tablist", { name: "Sections de la page" });
    await expect(tabs.getByRole("tab", { name: "Publications" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await tabs.getByRole("tab", { name: /^Offres · / }).click();
    await expect(pile.getByRole("tabpanel").getByRole("link").first()).toBeVisible();
    await tabs.getByRole("tab", { name: "Membres" }).click();
    // The search of the members shows only past four of them.
    await expect(pile.getByRole("tabpanel", { name: "Membres" })).toBeVisible();
    const follow = pile.getByRole("button", { name: /^(Suivre|Abonné)$/ });
    const followed = await follow.getAttribute("aria-pressed");
    await follow.click();
    await expect(follow).not.toHaveAttribute("aria-pressed", followed ?? "false");
    await follow.click();
    await expect(follow).toHaveAttribute("aria-pressed", followed ?? "false");
    // The bottom bar stays on a company's page (planche Entreprise).
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    await pile.getByRole("button", { name: /^Plus d.options$/ }).click();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "Partager la page" }),
    ).toBeVisible();
  });

  test("la page d'une personne : À propos, Réalisations, Se connecter", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    // The other tabs stay mounted under the page: look in the page itself (main).
    const pile = page.locator("main");
    await page.goto("/app/explorer/personnes");
    const first = page.locator("main .nb-ex-pers-l").first();
    await expect(first).toBeVisible();
    await first.click();
    await page.waitForURL("**/app/personnes/**");
    const tabs = pile.getByRole("tablist", { name: "Sections du profil" });
    await expect(tabs.getByRole("tab", { name: "À propos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // docs/profil-personne: compact head, then Publications · À propos · Réalisations · Portfolio.
    await expect(pile.getByRole("heading", { name: "Compétences" })).toBeVisible();
    for (const name of ["Réalisations", "Portfolio", "Publications"]) {
      await tabs.getByRole("tab", { name, exact: true }).click();
      await expect(tabs.getByRole("tab", { name, exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expect(pile.getByRole("tabpanel")).toBeVisible();
    }
    // « Se connecter » → « Demande envoyée »; « Chat » only once connected.
    const connect = pile.getByRole("button", { name: "Se connecter", exact: true });
    if (await connect.count()) {
      await expect(pile.getByRole("link", { name: "Chat", exact: true })).toHaveCount(0);
      await connect.click();
      await expect(pile.getByText("Demande envoyée", { exact: true })).toBeVisible();
    }
    await pile.getByRole("button", { name: /^Plus d.options$/ }).click();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "Partager le profil" }),
    ).toBeVisible();
  });

  test("Explorer reste monté : aller-retour sans écran vide", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/jobs");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const card = page.locator(".nb-ex .nb-fil-affiche").first();
    await expect(card).toBeVisible();
    await card.evaluate((node) => {
      (node as HTMLElement).dataset.test = "same";
    });
    await nav.getByRole("link", { name: "Fil", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await nav.getByRole("link", { name: "Explorer", exact: true }).click();
    await page.waitForURL("**/app/jobs");
    await expect(page.locator('.nb-ex .nb-fil-affiche[data-test="same"]')).toBeVisible();

    // An offer opened from Explorer covers it, and « Explorer » brings it back as it was.
    await card.click();
    await page.waitForURL("**/app/jobs/**");
    await expect(page.locator(".nb-ex-offre")).toBeVisible();
    await page.getByRole("link", { name: "Explorer" }).first().click();
    await page.waitForURL("**/app/jobs");
    await expect(page.locator('.nb-ex .nb-fil-affiche[data-test="same"]')).toBeVisible();
  });
});
