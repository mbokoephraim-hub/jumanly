import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { wizardReady } from "./offer-flow";
import { logIn } from "./session";

// Modèle B recruteur, lot M4 (docs/modele-b-recruteur, mobile/captures section 03): the offers and
// their figures, « Nouvelle offre » in four steps, share, close with the PDF report, the candidates
// of one offer. Baobab Fintech, its recruiter and its offers are fictional (seed).
const RECRUITER = "recruteur6.ux@jumanly.test";
const DEMO_OFFER = /^Analyste de données junior/;

const main = (page: Page) => page.locator("main");
const offers = (page: Page) => page.locator(".nb-rh-offres").filter({ visible: true });
const detail = (page: Page) => page.locator(".nb-rh-detail").filter({ visible: true });
const wizard = (page: Page) => page.locator(".nb-rh-offre-pub").filter({ visible: true });
const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name });

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Offres au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("les offres, leurs chiffres, le détail, le menu et les candidats d'une offre", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await logIn(page, RECRUITER, undefined, "/app/hire/offres");
    await page.goto("/app/hire/offres");
    await expect(main(page).getByRole("heading", { name: "Offres", exact: true })).toBeVisible();
    await expect(main(page).getByText(/offres? en cours · /)).toBeVisible();
    await expect(main(page).getByRole("link", { name: "Publier une offre" })).toHaveAttribute(
      "href",
      "/app/hire/offres/nouvelle",
    );
    const filters = offers(page).getByRole("navigation", { name: "Filtrer les offres" });
    await expect(filters.getByRole("link", { name: "Toutes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const card = offers(page)
      .getByRole("link", { name: /Analyste de données junior/ })
      .first();
    await expect(card).toContainText("vue");
    await expect(card).toContainText("jours en ligne");
    await capture(page, "041-offres");
    await expectAccessible(page);

    await filters.getByRole("link", { name: "En cours" }).click();
    await expect(page).toHaveURL(/vue=encours/);
    await expect(offers(page).locator(".nb-rh-statut").first()).toHaveText("En cours");
    await capture(page, "042-offres-encours");
    await filters.getByRole("link", { name: "Terminées" }).click();
    await expect(page).toHaveURL(/vue=terminees/);
    await filters.getByRole("link", { name: "Toutes" }).click();

    // Search in two steps, the options of Offres.
    const field = main(page)
      .getByRole("searchbox", {
        name: "Rechercher une offre, une entreprise ou une personne",
      })
      .filter({ visible: true });
    await field.click();
    await expect(field).toBeFocused();
    const scopes = main(page).getByRole("radiogroup", { name: "Rechercher dans" });
    await expect(scopes.getByRole("radio", { name: "Mes offres" })).toBeVisible();
    await capture(page, "043-offres-recherche");
    await field.fill("analyste");
    await expect(main(page).getByRole("region", { name: /^Mes offres/ })).toBeVisible();
    await capture(page, "044-offres-recherche-texte");
    await main(page).getByRole("button", { name: "Annuler" }).filter({ visible: true }).click();

    // The offer and its figures.
    await offers(page)
      .getByRole("link", { name: /Analyste de données junior/ })
      .first()
      .click();
    await expect(detail(page).getByRole("heading", { name: DEMO_OFFER })).toBeVisible();
    await expect(detail(page)).toContainText("des vues deviennent candidatures");
    await expect(detail(page).getByRole("heading", { name: "Candidatures reçues" })).toBeVisible();
    await expect(
      detail(page).getByRole("heading", { name: "D'où viennent les candidats" }),
    ).toBeVisible();
    await capture(page, "045-offre-detail");
    await expectAccessible(page);
    await detail(page).getByRole("button", { name: "Pourquoi ?" }).click();
    await expect(sheet(page, "Pourquoi ?")).toContainText("c'est vous qui décidez");
    await sheet(page, "Pourquoi ?").getByRole("button", { name: "Fermer" }).last().click();
    await detail(page).getByRole("link", { name: "30 jours" }).click();
    await expect(page).toHaveURL(/jours=30/);
    await expect(detail(page).getByRole("link", { name: "30 jours" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await detail(page).getByRole("link", { name: "7 jours" }).click();

    // « ··· »: modify, pause, share, duplicate, close.
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    const menu = sheet(page, DEMO_OFFER);
    for (const name of ["Modifier l'offre", "Mettre en pause", "Partager", "Dupliquer"])
      await expect(menu.getByText(name, { exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: /^Clôturer l'offre/ })).toBeVisible();
    await capture(page, "046-offre-menu");
    await menu.getByRole("button", { name: /^Partager/ }).click();
    const share = sheet(page, "Partager l'offre");
    await expect(share.getByRole("button", { name: /^Copier le lien/ })).toHaveAttribute(
      "data-value",
      /\/offres\//,
    );
    await expect(share.getByRole("link", { name: /^WhatsApp/ })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\//,
    );
    await expect(share.getByRole("link", { name: /^Publier dans le Fil/ })).toHaveAttribute(
      "href",
      "/app/fil/publier?nom=entreprise",
    );
    await capture(page, "047-offre-partage");
    await share.getByRole("button", { name: /^Copier le lien/ }).click();
    await expect(page.getByText("Lien copié")).toBeVisible();

    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    await menu.getByRole("button", { name: /^Clôturer l'offre/ }).click();
    const close = sheet(page, /^Clôturer « Analyste de données junior/);
    await expect(close).toContainText("reçoivent un message");
    await capture(page, "048-offre-cloturer");
    // The seeded offer stays online for the other tests.
    await close.getByRole("button", { name: "Garder en ligne" }).click();
    await expect(close).toBeHidden();

    // The candidates of the offer, ranked without name, age or photo.
    await detail(page)
      .getByRole("link", { name: /^Voir (les \d+ candidats|le candidat)$/ })
      .click();
    await expect(page).toHaveURL(/vue=candidats/);
    await expect(main(page)).toContainText("ni du nom, ni de l'âge, ni de la photo");
    await expect(main(page).getByRole("link", { name: "Trier dans Candidatures" })).toHaveAttribute(
      "href",
      /\/app\/hire\/candidats\?offre=/,
    );
    await capture(page, "050-offre-candidats");
    await main(page).getByRole("link", { name: "L'offre" }).click();
    await expect(detail(page).getByRole("heading", { name: DEMO_OFFER })).toBeVisible();
    await detail(page).getByRole("link", { name: "Offres", exact: true }).click();
    await expect(offers(page)).toBeVisible();

    // Orbi, from Offres: its sheet speaks for the tab.
    await page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi · depuis Offres")).toBeVisible();
    await capture(page, "056-offres-orbi");
    await orbi.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(orbi).toBeHidden();
  });

  test("publier une offre en quatre étapes, la partager, la mettre en pause puis la clôturer", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await logIn(page, RECRUITER, undefined, "/app/hire/offres");
    const title = `Analyste crédit junior ${Date.now().toString(36)}`;
    await page.goto("/app/hire/offres/nouvelle");
    await wizardReady(page);

    // 1 · The post, its text and its skills.
    await expect(
      wizard(page).getByRole("heading", { name: "Quel poste recrutez-vous ?" }),
    ).toBeVisible();
    await expect(wizard(page).getByText("Étape 1 sur 4 · Le poste")).toBeVisible();
    await wizard(page).getByRole("button", { name: "Continuer" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Indiquez l'intitulé du poste" }),
    ).toBeVisible();
    await wizard(page).getByLabel("Intitulé du poste").fill(title);
    await wizard(page).getByRole("button", { name: "Proposer un texte" }).click();
    await expect(
      wizard(page)
        .getByText(/Orbi (n'a pas|a besoin)|Activez l'aide|Proposé par Orbi/)
        .first(),
    ).toBeVisible();
    await wizard(page)
      .getByLabel("Description du poste")
      .fill(
        "Baobab Fintech recrute une personne pour analyser les demandes de crédit, préparer les dossiers et proposer des améliorations.",
      );
    await wizard(page).getByLabel("Ajouter une compétence").fill("Excel");
    await wizard(page).getByRole("button", { name: "Ajouter", exact: true }).first().click();
    await expect(wizard(page).locator(".nb-rh-puces")).toContainText("Excel");
    await capture(page, "051-publier-1");
    await wizard(page).getByRole("button", { name: "Continuer" }).click();

    // 2 · Where and how.
    await expect(wizard(page).getByRole("heading", { name: "Les détails" })).toBeVisible();
    const cities = wizard(page).getByRole("radiogroup", { name: "Ville" });
    if ((await cities.getByRole("radio").count()) > 0)
      await cities.getByRole("radio").first().click();
    else await wizard(page).getByLabel("Autre ville").fill("Kinshasa");
    const country = wizard(page).getByLabel("Pays du poste");
    if (await country.isVisible()) await country.fill("RD Congo");
    await wizard(page)
      .getByRole("radiogroup", { name: "Mode de travail" })
      .getByRole("radio", { name: "Hybride" })
      .click();
    await wizard(page)
      .getByRole("radiogroup", { name: "Contrat" })
      .getByRole("radio", { name: "CDI" })
      .click();
    await wizard(page).getByRole("switch", { name: "Afficher le salaire" }).click();
    await wizard(page).getByLabel("Minimum (USD par mois)").fill("600");
    await wizard(page).getByLabel("Maximum (USD par mois)").fill("900");
    await expect(wizard(page)).toContainText("600 à 900 USD par mois");
    await capture(page, "052-publier-2");
    await wizard(page).getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/]+\/modifier\?etape=3/);
    await page.waitForLoadState("networkidle");
    await wizardReady(page);

    // 3 · The pre-selection: questions are never a condition to apply.
    await expect(wizard(page).getByRole("heading", { name: "La présélection" })).toBeVisible();
    await wizard(page).getByRole("checkbox", { name: "Quand pouvez-vous commencer ?" }).click();
    await wizard(page).getByLabel("Votre question").fill("Avez-vous déjà utilisé Excel ?");
    await wizard(page).getByLabel("Votre question").press("Enter");
    await expect(
      wizard(page).getByRole("checkbox", { name: "Avez-vous déjà utilisé Excel ?" }),
    ).toBeChecked();
    await expect(wizard(page).getByText("Questions aux candidats · 2 choisies")).toBeVisible();
    await wizard(page).getByRole("button", { name: "Lettre" }).click();
    await expect(wizard(page)).toContainText("Aucune réponse n'écarte un candidat");
    await capture(page, "053-publier-3");
    await wizard(page).getByRole("button", { name: "Continuer" }).click();

    // 4 · What talents will see.
    await expect(
      wizard(page).getByRole("heading", { name: "Ce que verront les talents" }),
    ).toBeVisible();
    const preview = wizard(page).getByRole("article", { name: "Aperçu de l'offre" });
    await expect(preview.getByRole("heading", { name: title })).toBeVisible();
    await expect(preview).toContainText("Candidater gratuitement");
    await expect(preview).toContainText("600 à 900 USD par mois");
    await capture(page, "054-publier-4");
    await expectAccessible(page);
    await wizard(page)
      .getByRole("button", { name: /^(Publier l'offre|Envoyer en vérification)$/ })
      .click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?publiee=(1|verification)/);
    const offerUrl = page.url().split("?")[0]!;
    const live = page.url().endsWith("publiee=1");
    if (live) {
      await expect(
        main(page).getByRole("heading", { name: "Votre offre est en ligne" }),
      ).toBeVisible();
      await expect(main(page).getByRole("button", { name: "Copier le lien" })).toHaveAttribute(
        "data-value",
        /\/offres\//,
      );
      await expect(main(page).getByRole("link", { name: "Partager dans le Fil" })).toHaveAttribute(
        "href",
        "/app/fil/publier?nom=entreprise",
      );
    } else {
      await expect(
        main(page).getByRole("heading", { name: "Votre offre part en vérification" }),
      ).toBeVisible();
    }
    await capture(page, "055-publier-5");
    await main(page).getByRole("link", { name: "Voir mes offres" }).click();
    await expect(offers(page).getByRole("link", { name: new RegExp(title) })).toBeVisible();

    // « Modifier l'offre » comes back to the steps, already filled.
    await page.goto(offerUrl);
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    const menu = sheet(page, title);
    await menu.getByRole("link", { name: /^Modifier l'offre/ }).click();
    await wizardReady(page);
    await expect(wizard(page).getByLabel("Intitulé du poste")).toHaveValue(title);
    await expect(wizard(page).getByText("Modifier l'offre")).toBeVisible();
    await wizard(page).getByRole("link", { name: "Retour" }).click();
    await expect(detail(page).getByRole("heading", { name: title })).toBeVisible();

    if (live) {
      // Pause, then back online.
      await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
      await menu.getByRole("button", { name: /^Mettre en pause/ }).click();
      await expect(detail(page).locator(".nb-rh-statut")).toHaveText("En pause");
      await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
      await menu.getByRole("button", { name: /^Remettre en ligne/ }).click();
      await expect(detail(page).locator(".nb-rh-statut")).toHaveText("En cours");

      // Close: the report is ready.
      await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
      await menu.getByRole("button", { name: /^Clôturer l'offre/ }).click();
      await sheet(page, new RegExp(`^Clôturer « ${title}`))
        .getByRole("button", { name: "Clôturer l'offre" })
        .click();
      await expect(page).toHaveURL(/rapport=1/);
      const report = sheet(page, "Offre clôturée, rapport prêt");
      await expect(report).toContainText("vue");
      await capture(page, "049-offre-rapport");
      await report.getByRole("button", { name: "Plus tard" }).click();
      await expect(detail(page).locator(".nb-rh-statut")).toHaveText("Terminée");
    }

    // Duplicate: a new draft from this one, then « Brouillon » keeps it for later.
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    await menu.getByRole("button", { name: /^Dupliquer/ }).click();
    await expect(page).toHaveURL(/\/modifier\?ok=copie/);
    await wizardReady(page);
    await wizard(page).getByRole("button", { name: "Brouillon" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\?ok=brouillon/);
    await expect(offers(page).getByText("Brouillon").first()).toBeVisible();
  });
});
