import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { logIn } from "./session";

// Modèle B recruteur, lot M3 (docs/modele-b-recruteur, mobile/captures section 02): the recruiter's
// Fil. Publish in one's own name or in the name of the company (only a member who manages the
// offers), join one of the company's offers, announce an event; search posts, people and companies.
// Baobab Fintech, its recruiter and the posts are fictional (seed).
const RECRUITER = "recruteur6.ux@jumanly.test";
const MANAGER = "manager@jumanly.test";

const main = (page: Page) => page.locator("main");
const fil = (page: Page) => page.locator(".nb-rh-fil").filter({ visible: true });

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Fil au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("le Fil, sa recherche, ses publications et Orbi : chaque bouton ouvre quelque chose", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await logIn(page, RECRUITER, undefined, "/app/hire");
    await page.goto("/app/hire");
    await expect(main(page).getByRole("heading", { name: "Fil", exact: true })).toBeVisible();
    await expect(
      fil(page).getByRole("link", { name: "Partager une nouvelle, une offre…" }),
    ).toBeVisible();
    await expect(fil(page).getByRole("link", { name: /^Publier au nom de Baobab/ })).toBeVisible();

    // Three tabs, switched in place; the end of the list points to Talents.
    const tabs = fil(page).getByRole("tablist", { name: "Fils" });
    await expect(tabs.getByRole("tab", { name: "Pour vous" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await capture(page, "031-fil");
    await expectAccessible(page);
    await tabs.getByRole("tab", { name: "Abonnements" }).click();
    await expect(tabs.getByRole("tab", { name: "Abonnements" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await capture(page, "032-fil-abonnements");
    await tabs.getByRole("tab", { name: "Entreprises" }).click();
    await expect(fil(page).getByText("Portes ouvertes", { exact: false }).first()).toBeVisible();
    await capture(page, "033-fil-entreprises");
    await tabs.getByRole("tab", { name: "Pour vous" }).click();
    await expect(fil(page).getByRole("link", { name: "cherchez des talents" })).toHaveAttribute(
      "href",
      "/app/hire/talents",
    );

    // Search in two steps: the options of the Fil, then posts, people and companies.
    await main(page)
      .getByRole("button", { name: "Rechercher", exact: true })
      .filter({ visible: true })
      .click();
    const field = main(page).getByRole("searchbox", { name: "Rechercher dans le Fil" });
    await expect(field).toBeFocused();
    const scopes = main(page).getByRole("radiogroup", { name: "Rechercher dans" });
    for (const scope of ["Tout", "Publications", "Personnes", "Entreprises"])
      await expect(scopes.getByRole("radio", { name: scope })).toBeVisible();
    await expect(scopes.getByRole("radio", { name: "Mes offres" })).toHaveCount(0);
    await capture(page, "034-fil-recherche");
    await field.fill("portes");
    await expect(main(page).getByRole("region", { name: "Publications" })).toBeVisible();
    await capture(page, "035-fil-recherche-texte");
    await scopes.getByRole("radio", { name: "Personnes" }).click();
    await expect(main(page).getByRole("region", { name: "Publications" })).toHaveCount(0);
    await scopes.getByRole("radio", { name: "Publications" }).click();
    await main(page)
      .getByRole("region", { name: "Publications" })
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/fil\/[^/]+$/);
    await capture(page, "036-fil-publication");
    await page.goBack();
    await expect(page).toHaveURL(/\/app\/hire$/);
    const cancel = main(page).getByRole("button", { name: "Annuler" });
    if (await cancel.isVisible()) await cancel.click();

    // The menu ··· of a post.
    await fil(page).getByRole("button", { name: "Plus d'options" }).first().click();
    const menu = page.getByRole("dialog").filter({ visible: true });
    await expect(menu).toBeVisible();
    await capture(page, "037-fil-menu");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    // Orbi, from the Fil: its sheet speaks for the tab.
    await page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi · depuis le Fil")).toBeVisible();
    await capture(page, "040-fil-orbi");
    await orbi.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(orbi).toBeHidden();
  });

  test("publier en son nom, au nom de l'entreprise avec une offre, puis un événement", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const stamp = Date.now().toString(36);
    await logIn(page, RECRUITER, undefined, "/app/hire");
    await page.goto("/app/hire");

    // In one's own name.
    await fil(page).getByRole("link", { name: "Publier", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/fil\/publier$/);
    await expect(main(page).getByRole("heading", { name: "Nouvelle publication" })).toBeVisible();
    const who = main(page).getByRole("radiogroup", { name: "Publier en tant que" });
    await expect(who.getByRole("radio", { name: /Votre profil/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(main(page).getByText(/Visible par votre réseau/)).toBeVisible();
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(main(page).locator(".nb-bas .nb-erreur")).toHaveText(
      "Écrivez quelques mots avant de publier.",
    );
    const text = `Nous ouvrons un poste fictif ${stamp}. Parlons-en.`;
    await main(page).getByLabel("Texte", { exact: true }).fill(text);
    await expect(main(page).getByText(`${text.length} / 220`)).toBeVisible();
    await capture(page, "038-fil-publier");
    await expectAccessible(page);
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/hire$/);
    await expect(fil(page).getByText(text)).toBeVisible();

    // In the name of the company, with one of its offers.
    await fil(page)
      .getByRole("link", { name: /^Publier au nom de Baobab/ })
      .click();
    await expect(page).toHaveURL(/\/app\/fil\/publier\?nom=entreprise$/);
    await expect(who.getByRole("radio", { name: /Page de l'entreprise/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(main(page).getByText(/Visible sur la page de Baobab/)).toBeVisible();
    const types = main(page).getByRole("radiogroup", { name: "Type" });
    await types.getByRole("radio", { name: "Une offre" }).click();
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(main(page).locator(".nb-bas .nb-erreur")).toHaveText(
      "Choisissez l'offre à joindre.",
    );
    const offer = `Rejoignez Baobab, offre fictive ${stamp}.`;
    await main(page).getByLabel("Texte", { exact: true }).fill(offer);
    await main(page)
      .getByRole("radiogroup", { name: "Offre jointe" })
      .getByRole("radio", { name: /Analyste de données junior/ })
      .click();
    await capture(page, "039-fil-publier-baobab");
    await expectAccessible(page);
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/hire$/);
    await fil(page).getByRole("tab", { name: "Entreprises" }).click();
    const post = fil(page).locator("article").filter({ hasText: offer });
    await expect(post.getByText(/Baobab Fintech/).first()).toBeVisible();
    await expect(post.getByRole("link", { name: /Analyste de données junior/ })).toBeVisible();

    // An event: a date is asked.
    await page.goto("/app/fil/publier");
    await types.getByRole("radio", { name: "Un événement" }).click();
    await main(page).getByLabel("Texte", { exact: true }).fill(`Portes ouvertes fictives ${stamp}`);
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(main(page).locator(".nb-bas .nb-erreur")).toHaveText(
      "Indiquez la date de l'événement.",
    );
    const soon = new Date(Date.now() + 7 * 86_400_000);
    await main(page)
      .getByLabel("Date et heure de l'événement")
      .fill(soon.toISOString().slice(0, 11) + "10:00");
    await main(page).getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/hire$/);
    await expect(fil(page).getByText(`Portes ouvertes fictives ${stamp}`)).toBeVisible();

    // « Fermer » leaves without publishing.
    await page.goto("/app/fil/publier");
    await main(page).getByRole("link", { name: "Fermer" }).click();
    await expect(page).toHaveURL(/\/app\/hire$/);
  });

  test("un membre qui ne gère pas les offres publie seulement en son nom", async ({ page }) => {
    await logIn(page, MANAGER, undefined, "/app/hire");
    await page.goto("/app/hire");
    await expect(main(page).getByRole("heading", { name: "Fil", exact: true })).toBeVisible();
    await expect(fil(page).getByRole("link", { name: /^Publier au nom de/ })).toHaveCount(0);
    await page.goto("/app/fil/publier?nom=entreprise");
    await expect(main(page).getByRole("radiogroup", { name: "Publier en tant que" })).toHaveCount(
      0,
    );
  });
});
