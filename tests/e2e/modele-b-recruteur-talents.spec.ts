import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { fillOffer, publishFilledOffer } from "./offer-flow";
import { logIn, testEmail } from "./session";

// Modèle B recruteur, lot M6 (docs/modele-b-recruteur, mobile/captures section 06): the tab Talents
// (Découvrir, Vivier, Propositions, Réseau), the search in two steps, and a talent's profile seen
// by the recruiter with its sheets. Orbi recommends, the recruiter decides; only talents who made
// their profile visible appear. The company is new and fictional; Vicky Fictive is a seeded,
// fictional talent visible to recruiters (prisma/seed).
const TALENT = "Vicky Fictive";
const TALENT_EMAIL = "talent.visible@jumanly.test";

const main = (page: Page) => page.locator("main");
const tabs = (page: Page) =>
  main(page).getByRole("navigation", { name: "Rubriques des talents" }).filter({ visible: true });
const profile = (page: Page) => page.locator(".nb-rh-talent").filter({ visible: true });
const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name });
const toast = (page: Page, text: string | RegExp) => page.getByText(text).first();

async function fits(page: Page) {
  const [scroll, client] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(scroll).toBe(client);
}

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Talents au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("découvrir, chercher, le profil d'un talent, le vivier, proposer, le réseau", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(300_000);
    const email = testEmail("rx-m6");
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      email,
      `Entreprise fictive ${suffix()}`,
      "verified",
      "hire.scorecards",
    ]);
    await logIn(page, email, undefined, "/app/hire");
    const title = `Analyste fictif ${suffix()}`;
    await fillOffer(page, {
      title,
      description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
      responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
      skill: "Analyse de données",
    });
    await publishFilledOffer(page, "Publier");

    // Découvrir: the visible talents for the offers, best score first.
    await page.goto("/app/hire/talents");
    await expect(main(page).getByRole("heading", { name: "Talents", exact: true })).toBeVisible();
    await expect(tabs(page).getByRole("link", { name: /^Découvrir/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(main(page).getByText(/talents? visibles? · mis à jour aujourd'hui/)).toBeVisible();
    const card = main(page)
      .getByRole("link", { name: new RegExp(TALENT) })
      .first();
    await expect(card).toBeVisible();
    await capture(page, "101-talents");
    await fits(page);
    await expectAccessible(page);
    await main(page)
      .getByRole("navigation", { name: "Offres comparées" })
      .getByRole("link", { name: title })
      .click();
    await expect(page).toHaveURL(/offre=/);
    await expect(
      main(page)
        .getByRole("link", { name: new RegExp(TALENT) })
        .first(),
    ).toBeVisible();

    // The search in two steps: the scopes, then the results from the first letters.
    await page.getByRole("button", { name: "Rechercher" }).first().click();
    const search = page.getByRole("search");
    await expect(search.getByRole("radio", { name: "Compétence" })).toBeVisible();
    await expect(search.getByRole("radio", { name: "Métier" })).toBeVisible();
    await expect(search.getByRole("radio", { name: "Ville" })).toBeVisible();
    await capture(page, "102-talents-recherche");
    await search.getByRole("radio", { name: "Compétence" }).click();
    await search.getByRole("searchbox").fill("Analyse");
    await expect(search.getByRole("link", { name: new RegExp(TALENT) })).toBeVisible();
    await capture(page, "103-talents-recherche-texte");
    await search.getByRole("button", { name: "Annuler" }).click();

    // The profile: logged, the score with its « Pourquoi ? », three tabs.
    await page.goto("/app/hire/talents");
    await main(page)
      .getByRole("link", { name: new RegExp(TALENT) })
      .first()
      .click();
    await expect(profile(page).getByRole("heading", { level: 1, name: TALENT })).toBeVisible();
    const profileUrl = page.url().split("?")[0]!;
    await expect(profile(page)).toContainText("Consultation enregistrée.");
    await capture(page, "108-talent");
    await fits(page);
    await expectAccessible(page);
    const why = profile(page).getByRole("button", { name: /Pourquoi \?/ });
    if (await why.count()) {
      await why.click();
      const explained = sheet(page, /^Pourquoi \d+ % \?/);
      await expect(explained).toContainText(/jamais/i);
      await capture(page, "109-talent-pourquoi");
      await explained.getByRole("button", { name: "Fermer" }).last().click();
    }
    await profile(page).getByRole("tab", { name: "Parcours" }).click();
    await expect(profile(page).getByRole("heading", { name: "Expérience" })).toBeVisible();
    await capture(page, "110-talent-parcours");
    await profile(page).getByRole("tab", { name: "Réalisations" }).click();
    await capture(page, "111-talent-realisations");
    await profile(page).getByRole("tab", { name: "Profil" }).click();

    // « ··· »: share (no colleague yet), the PDF (logged), report.
    await profile(page)
      .getByRole("button", { name: `Plus d'actions pour ${TALENT}` })
      .click();
    const menu = sheet(page, TALENT);
    for (const name of [
      "Partager le profil à un collègue",
      "Télécharger le profil en PDF",
      "Masquer ce profil de mes suggestions",
      "Signaler ce profil",
    ])
      await expect(menu.getByText(name, { exact: true })).toBeVisible();
    await capture(page, "114-talent-menu");
    const pdf = await page.request.get(
      (await menu
        .getByRole("link", { name: /Télécharger le profil en PDF/ })
        .getAttribute("href"))!,
    );
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    await menu.getByRole("button", { name: /^Partager le profil/ }).click();
    const share = sheet(page, "Partager le profil");
    await expect(share).toContainText("Aucun collègue dans l'équipe pour l'instant.");
    await share.getByRole("button", { name: "Annuler" }).click();
    await profile(page)
      .getByRole("button", { name: `Plus d'actions pour ${TALENT}` })
      .click();
    await sheet(page, TALENT)
      .getByRole("button", { name: /^Signaler ce profil/ })
      .click();
    const report = sheet(page, "Signaler ce profil");
    await report.getByRole("radio", { name: "Indésirable ou publicité" }).click();
    await report.getByRole("button", { name: "Envoyer le signalement" }).click();
    await expect(toast(page, "Merci, l'équipe Jumanly vérifie sous 24 h.")).toBeVisible();

    // Ajouter au vivier: a new list with the talent in it.
    await profile(page)
      .getByRole("button", { name: `Ajouter ${TALENT} au vivier` })
      .click();
    const pool = sheet(page, `Ajouter ${TALENT} au vivier`);
    await pool.getByLabel("Ou une nouvelle liste").fill("Data fictive");
    await capture(page, "113-talent-vivier");
    await pool.getByRole("button", { name: "Enregistrer" }).click();
    await expect(toast(page, "Vivier enregistré.")).toBeVisible();

    // Proposer une offre: the offer, its score, the message; the talent decides.
    await profile(page).getByRole("button", { name: "Proposer une offre" }).click();
    const propose = sheet(page, `Proposer une offre à ${TALENT}`);
    await expect(propose.getByRole("radio", { name: new RegExp(title) })).toBeChecked();
    await expect(propose.getByLabel("Message")).toHaveValue(/Bonjour Vicky/);
    await capture(page, "112-talent-proposer");
    await propose.getByRole("button", { name: "Envoyer la proposition" }).click();
    await expect(toast(page, /Proposition envoyée/)).toBeVisible();
    await expect(profile(page)).toContainText("Proposition en attente");
    await expect(profile(page)).toContainText("envoyée, pas encore vue");

    // « Se connecter »: a request between two people.
    await profile(page).getByRole("button", { name: "Se connecter" }).click();
    await expect(profile(page).getByRole("button", { name: "Invitation envoyée" })).toBeDisabled();

    // The talent sees the proposal in Messages: « Vue, sans réponse ».
    const other = await browser.newContext({
      baseURL,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const talent = await other.newPage();
    await logIn(talent, TALENT_EMAIL);
    await talent.goto("/app/messages");
    await expect(talent.getByRole("main")).toBeVisible();
    await other.close();
    await page.goto(profileUrl);
    await expect(profile(page)).toContainText("vue, sans réponse");
    await capture(page, "117-talent-proposition-vue");

    // Vivier: the list, then the list itself; a new list.
    await page.goto("/app/hire/talents?onglet=vivier");
    await expect(tabs(page).getByRole("link", { name: /^Vivier/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(main(page)).toContainText("Votre vivier personnel");
    await capture(page, "104-talents-vivier");
    await main(page).getByRole("button", { name: "Nouvelle liste" }).click();
    const create = sheet(page, "Nouvelle liste");
    await create.getByLabel("Nom de la liste").fill("Finance fictive");
    await create.getByRole("button", { name: "Créer la liste" }).click();
    await expect(toast(page, "Liste créée.")).toBeVisible();
    // The toast sits over the top bar: it is closed before the list's own screen is checked.
    await page
      .getByRole("region", { name: "Messages de confirmation" })
      .getByRole("button", { name: "Fermer" })
      .click();
    await main(page)
      .getByRole("link", { name: /Data fictive/ })
      .click();
    await expect(page.getByRole("heading", { name: "Data fictive" })).toBeVisible();
    await expect(main(page)).toContainText(TALENT);
    await capture(page, "105-talents-liste");
    await fits(page);
    await expectAccessible(page);
    await page.getByRole("button", { name: `Retirer ${TALENT} de la liste` }).click();
    await expect(toast(page, "Retiré de la liste.")).toBeVisible();
    await page.getByRole("link", { name: "Vivier" }).first().click();
    await expect(page).toHaveURL(/onglet=vivier/);

    // Propositions: what was proposed, and its answer.
    await tabs(page)
      .getByRole("link", { name: /^Propositions/ })
      .click();
    await expect(main(page)).toContainText("Les offres que vous avez proposées à des talents");
    await expect(main(page)).toContainText("Vue, sans réponse");
    await capture(page, "107-talents-propositions");
    await main(page).getByRole("button", { name: "Relancer" }).first().click();
    await expect(toast(page, "Relance envoyée.")).toBeVisible();

    // Réseau: invitations, people to know, relations.
    await page.goto("/app/hire/talents?onglet=reseau");
    await expect(main(page).getByRole("heading", { name: "À connaître" })).toBeVisible();
    await expect(main(page).getByRole("heading", { name: "Mes relations" })).toBeVisible();
    await capture(page, "106-talents-reseau");
    await fits(page);
    await expectAccessible(page);
    await main(page)
      .getByRole("navigation", { name: "Filtrer mes relations" })
      .getByRole("link", { name: "Talents" })
      .click();
    await expect(page).toHaveURL(/relations=talents/);
    const connect = main(page).getByRole("button", { name: "Se connecter" }).first();
    if (await connect.count()) {
      await connect.click();
      await expect(toast(page, "Invitation envoyée.")).toBeVisible();
    }

    // « Masquer ce profil de mes suggestions »: gone from Découvrir, still found by search.
    await page.goto(profileUrl);
    await profile(page)
      .getByRole("button", { name: `Plus d'actions pour ${TALENT}` })
      .click();
    await sheet(page, TALENT)
      .getByRole("button", { name: /^Masquer ce profil/ })
      .click();
    await expect(toast(page, "Profil masqué de vos suggestions.")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/hire\/talents\?ok=masque/);
    await expect(main(page).getByRole("link", { name: new RegExp(TALENT) })).toHaveCount(0);
  });

  test("sans recherche de talents dans la formule, Découvrir renvoie vers les formules", async ({
    page,
  }) => {
    const email = testEmail("rx-m6-free");
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      email,
      `Entreprise fictive ${suffix()}`,
      "verified",
    ]);
    await logIn(page, email, undefined, "/app/hire/talents");
    await page.goto("/app/hire/talents");
    await expect(main(page)).toContainText(
      "La recherche de talents n'est pas comprise dans votre formule.",
    );
    await expect(main(page).getByRole("link", { name: "Voir les formules" })).toBeVisible();
    await tabs(page)
      .getByRole("link", { name: /^Vivier/ })
      .click();
    await expect(main(page)).toContainText("Le vivier n'est pas compris dans votre formule.");
    await fits(page);
    await expectAccessible(page);
  });
});
