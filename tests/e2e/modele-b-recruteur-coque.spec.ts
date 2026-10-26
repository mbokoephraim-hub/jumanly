import { expect, test, type Page } from "./fixtures";
import { logIn } from "./session";

// Modèle B recruteur, lot M1 (docs/modele-b-recruteur, brief § 3 et § 4): the recruiter's phone
// interface. Five tabs in icons only, Orbi floating in mint, the account by the avatar, the search
// in two steps under the head of each tab. Baobab Fintech and its recruiter are fictional (seed).
const RECRUITER = "recruteur6.ux@jumanly.test";

/** Waits for the page change to end (the screen left stays until the new one covers it). */
async function settled(page: Page) {
  await page.waitForFunction(() => !document.documentElement.matches(":active-view-transition"));
}

test.describe("Modèle B recruteur · coque au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("barre à cinq, Orbi, avatar et recherche en deux temps", async ({ page }) => {
    test.setTimeout(60_000);
    await logIn(page, RECRUITER, undefined, "/app/hire");
    await page.goto("/app/hire");

    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("link")).toHaveCount(5);
    // The pill menu: the active tab shows its name in Lime.
    await expect(nav.locator('[aria-current="page"] .nb-nav-nom')).toHaveText("Fil");
    await expect(nav.getByRole("link", { name: "Fil", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    // No empty click: each tab opens its first screen, with its title.
    for (const [name, path, title] of [
      [/^Offres$/, /\/app\/hire\/offres$/, "Offres"],
      [/^Candidatures/, /\/app\/hire\/candidats$/, "Candidatures"],
      [/^Talents$/, /\/app\/hire\/talents$/, "Talents"],
      [/^Chat/, /\/app\/messages$/, "Messages"],
      [/^Fil$/, /\/app\/hire$/, "Fil"],
    ] as const) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(path);
      await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(
        page.locator("main .nb-rh-tete > :first-child").filter({ visible: true }),
      ).toHaveText(title);
    }

    // The bell of the Fil opens the notifications, with a way back.
    await page
      .locator("main")
      .getByRole("link", { name: /^Notifications/ })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL(/\/app\/notifications$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/app\/hire$/);

    // Orbi: a mint disc, never in the bar; its sheet speaks for the tab and can be closed.
    const disc = page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" });
    await expect(disc).toBeVisible();
    await expect(nav.getByRole("button")).toHaveCount(0);
    const fill = await disc.locator("circle").first().getAttribute("fill");
    expect(fill?.toUpperCase()).toBe("#2FD3A6");
    await disc.click();
    const sheet = page.getByRole("dialog", { name: "Orbi" });
    await expect(sheet.getByText("Orbi · depuis le Fil")).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Que publier/ })).toBeVisible();
    await sheet.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(sheet).toBeHidden();

    // Offres: the lime « + » starts a new offer.
    await nav.getByRole("link", { name: /^Offres$/ }).click();
    const main = page.locator("main");
    await expect(
      main.getByRole("link", { name: "Publier une offre" }).filter({ visible: true }),
    ).toHaveAttribute("href", "/app/hire/offres/nouvelle");

    await settled(page);
    // Search in two steps: first the options of the page, then the results from the first letter.
    await main
      .getByRole("button", { name: "Rechercher", exact: true })
      .filter({ visible: true })
      .click();
    const field = main.getByRole("searchbox", {
      name: "Rechercher une offre, une entreprise ou une personne",
    });
    await expect(field).toBeFocused();
    const scopes = main.getByRole("radiogroup", { name: "Rechercher dans" });
    for (const scope of ["Tout", "Mes offres", "Entreprises", "Personnes"])
      await expect(scopes.getByRole("radio", { name: scope })).toBeVisible();
    await expect(main.getByText(/Mes offres : seulement les vôtres/)).toBeVisible();
    await field.fill("a");
    await expect(main.getByRole("region", { name: /^Mes offres · \d+/ })).toBeVisible();
    await expect(
      main.getByRole("link", { name: /^Analyste de données junior.* candidatures?$/ }),
    ).toBeVisible();
    // « Mes offres » keeps only the organization's offers.
    await scopes.getByRole("radio", { name: "Mes offres" }).click();
    await expect(main.getByRole("region", { name: /^Personnes/ })).toHaveCount(0);
    // « Annuler » brings the page back as it was.
    await main.getByRole("button", { name: "Annuler" }).click();
    await expect(field).toHaveCount(0);
    await expect(
      main.getByRole("button", { name: "Rechercher", exact: true }).filter({ visible: true }),
    ).toBeVisible();

    // The avatar opens the account, its corner shows the company's mark.
    await main.getByRole("link", { name: "Mon compte" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/app\/hire\/compte$/);
  });
});
