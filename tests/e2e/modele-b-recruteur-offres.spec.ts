import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { nextStep, wizardReady } from "./offer-flow";
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

  test("les candidats d'une offre : recherche, ordre de candidature, déplacer et retenus", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await logIn(page, RECRUITER, undefined, "/app/hire/offres");
    await page.goto("/app/hire/offres");
    await offers(page)
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: DEMO_OFFER }) })
      .first()
      .getByRole("link", { name: /^Voir plus sur l'offre/ })
      .click();
    const people = page.locator(".nb-rh-co").filter({ visible: true });
    // The name alone, without Orbi's percentage written beside it.
    const names = () =>
      people
        .locator(".nb-rh-co-liste li .nb-rh-co-t > b")
        .evaluateAll((nodes) => nodes.map((node) => node.firstChild?.textContent?.trim() ?? ""));
    await expect(people.locator(".nb-rh-co-liste li").first()).toBeVisible();
    // Orbi's classes first (03/11/2026): « Mon ordre » gives back the cards that move.
    await people
      .getByRole("navigation", { name: "Ordre de la liste" })
      .getByRole("link", { name: "Mon ordre" })
      .click();
    await expect(page).toHaveURL(/ordre=vous/);
    const before = await names();
    expect(before.length).toBeGreaterThan(1);

    // « Déplacer », then « Descendre » the first card: the new order is kept for the team.
    await people.getByRole("button", { name: "Déplacer" }).click();
    await people.getByRole("button", { name: `Descendre · ${before[0]}` }).click();
    await expect.poll(names).toEqual([before[1], before[0], ...before.slice(2)]);
    await page.reload();
    await expect.poll(names).toEqual([before[1], before[0], ...before.slice(2)]);
    // Back as it was for the other tests.
    await people.getByRole("button", { name: "Déplacer" }).click();
    await people.getByRole("button", { name: `Monter · ${before[0]}` }).click();
    await expect.poll(names).toEqual(before);
    await page.reload();
    await expect.poll(names).toEqual(before);

    // The search keeps the people whose name, title or skill matches.
    const field = people.getByRole("searchbox", { name: "Rechercher un candidat" });
    await field.fill(before[0]!.split(" ")[0]!);
    await field.press("Enter");
    await expect(page).toHaveURL(/[?&]q=/);
    await expect.poll(names).toContain(before[0]);
    await expect(people.getByRole("button", { name: "Déplacer" })).toHaveCount(0);

    // « Entretiens »: only the files kept and complete (rubriques of the offer, 03/11/2026).
    await main(page)
      .getByRole("navigation", { name: "Parties de l'offre" })
      .getByRole("link", { name: /^Entretiens/ })
      .click();
    await expect(page).toHaveURL(/vue=entretiens/);
    await expect(people.getByRole("heading", { name: /^Prêts pour l'entretien/ })).toBeVisible();
    await expect(people.getByRole("heading", { name: "Diagnostic ATS avec Orbi" })).toHaveCount(0);
  });

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
    // The card (03/11/2026): state in the notch, company, title, views · applications · days
    // left, a short description, the faces of the candidates and « Voir plus ».
    const card = offers(page)
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: DEMO_OFFER }) })
      .first();
    await expect(card.locator(".nb-rh-oc-etat")).toHaveText("En cours");
    await expect(card.locator("dl")).toContainText("Vues");
    await expect(card.locator("dl")).toContainText("Candidatures");
    await expect(
      card.getByRole("link", { name: /candidatures?, voir les? candidats?/ }),
    ).toBeVisible();
    await expect(
      card.getByRole("link", { name: /^Voir plus sur l'offre Analyste de données junior/ }),
    ).toBeVisible();
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

    // The offer opens on « À trier » (rubriques of the offer, 03/11/2026): search, filters,
    // Orbi's classes, then the people; « Vue » keeps the figures.
    await offers(page)
      .getByRole("link", { name: /Analyste de données junior/ })
      .first()
      .click();
    const parts = main(page).getByRole("navigation", { name: "Parties de l'offre" });
    for (const name of [/^Vue$/, /^À trier/, /^À compléter/, /^Entretiens/, /^Décision/])
      await expect(parts.getByRole("link", { name })).toBeVisible();
    const people = page.locator(".nb-rh-co").filter({ visible: true });
    await expect(people.getByRole("heading", { name: /^Classement d'Orbi/ })).toBeVisible();
    await expect(people.getByRole("heading", { name: /^À trier/, level: 2 })).toBeVisible();
    await expect(people.getByRole("searchbox", { name: "Rechercher un candidat" })).toBeVisible();
    await expect(people.getByRole("link", { name: /^Pourquoi \? · / }).first()).toBeVisible();
    await capture(page, "045a-offre-candidats");
    await parts.getByRole("link", { name: "Vue", exact: true }).click();
    await expect(page).toHaveURL(/vue=apercu/);
    await expect(detail(page).getByRole("heading", { name: DEMO_OFFER })).toBeVisible();
    for (const name of ["Les chiffres de l'offre", "Diagnostic d'Orbi", "Que faire maintenant ?"])
      await expect(detail(page).getByRole("heading", { name })).toBeVisible();
    await capture(page, "045-offre-detail");
    await expectAccessible(page);
    await detail(page).getByRole("link", { name: "30 jours" }).click();
    await expect(page).toHaveURL(/jours=30/);
    await detail(page).getByRole("link", { name: "7 jours" }).click();
    await expect(page).not.toHaveURL(/jours=30/);

    // « ··· » (03/11/2026): modify, pause, postpone, delete.
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    const menu = sheet(page, DEMO_OFFER);
    await expect(menu.getByRole("link", { name: /^Modifier l'offre/ })).toBeVisible();
    for (const name of [/^Mettre en pause/, /^Repousser l'offre/, /^Supprimer l'offre/])
      await expect(menu.getByRole("button", { name })).toBeVisible();
    await capture(page, "046-offre-menu");
    await menu.getByRole("button", { name: "Annuler", exact: true }).click();
    await expect(menu).toBeHidden();

    // « Voir les N candidats » leads back to the candidates of the offer.
    await detail(page)
      .getByRole("link", { name: /^Voir (les \d+ candidats|le candidat)$/ })
      .click();
    await expect(page).toHaveURL(/vue=(candidatures|trier)/);
    await expect(people.getByRole("searchbox", { name: "Rechercher un candidat" })).toBeVisible();
    await capture(page, "050-offre-candidats");
    await main(page).getByRole("link", { name: "Offres", exact: true }).first().click();
    await expect(offers(page)).toBeVisible();

    // Orbi, from Offres: its sheet speaks for the tab.
    await page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi · depuis Offres")).toBeVisible();
    await capture(page, "056-offres-orbi");
    await orbi.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(orbi).toBeHidden();
  });

  test("publier une offre étape par étape, la partager, la mettre en pause puis la clôturer", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await logIn(page, RECRUITER, undefined, "/app/hire/offres");
    const title = `Analyste crédit junior ${Date.now().toString(36)}`;
    await page.goto("/app/hire/offres/nouvelle");
    await wizardReady(page);

    // 1 · The post and its text.
    await expect(
      wizard(page).getByRole("heading", { name: "Quel poste recrutez-vous ?" }),
    ).toBeVisible();
    await expect(wizard(page).getByText("Étape 1 sur 10 · Le poste")).toBeVisible();
    await wizard(page).getByRole("button", { name: "Continuer" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Indiquez l'intitulé du poste" }),
    ).toBeVisible();
    await wizard(page).getByLabel("Intitulé du poste").fill(title);
    await wizard(page).getByRole("button", { name: "Proposer un texte" }).click();
    await expect(
      wizard(page)
        .getByText(/Orbi (n'a pas|a besoin|a aussi)|Activez l'aide|crédits d'Orbi/)
        .first(),
    ).toBeVisible();
    await wizard(page)
      .getByLabel("Description du poste")
      .fill(
        "Baobab Fintech recrute une personne pour analyser les demandes de crédit, préparer les dossiers et proposer des améliorations.",
      );
    await capture(page, "051-publier-1");
    await nextStep(page, "Les compétences recherchées");

    // 2 · Technical skills (from the list or typed), behavioural ones (suggestions).
    await wizard(page).getByLabel("Ajouter une compétence technique").fill("Excel");
    await wizard(page).getByLabel("Ajouter une compétence technique").press("Enter");
    await expect(wizard(page).locator(".nb-rh-puces").first()).toContainText("Excel");
    await wizard(page).getByRole("button", { name: "Rigueur" }).click();
    await expect(wizard(page).locator('[data-ton="soft"] .nb-rh-puces')).toContainText("Rigueur");
    await capture(page, "052-publier-2");
    await nextStep(page, "Les exigences du poste");

    // 3 · Where, how, how many, studies and languages.
    const cities = wizard(page).getByRole("radiogroup", { name: "Ville" });
    if ((await cities.getByRole("radio").count()) > 0)
      await cities.getByRole("radio").first().click();
    else await wizard(page).getByLabel("Autre ville").fill("Kinshasa");
    const country = wizard(page).getByLabel("Pays du poste");
    if (!(await country.inputValue())) await country.fill("RD Congo");
    await wizard(page)
      .getByRole("radiogroup", { name: "Mode de travail" })
      .getByRole("radio", { name: "Hybride" })
      .click();
    await wizard(page)
      .getByRole("radiogroup", { name: "Type d'emploi" })
      .getByRole("radio", { name: "CDI" })
      .click();
    await wizard(page).getByRole("button", { name: "Nombre de personnes recherchées +" }).click();
    await expect(wizard(page)).toContainText("2 personnes");
    await wizard(page)
      .getByRole("group", { name: "Niveaux d'études acceptés" })
      .getByRole("button", { name: "Licence" })
      .click();
    await wizard(page)
      .getByRole("radiogroup", { name: "Choisir une langue" })
      .getByRole("radio", { name: "Français" })
      .click();
    await wizard(page)
      .getByRole("group", { name: "Choisir le niveau" })
      .getByRole("button", { name: "C1" })
      .click();
    await expect(wizard(page)).toContainText("Français · C1");
    await nextStep(page, "Les principales responsabilités");
    await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/]+\/modifier\?etape=4/);

    // 4 · Responsibilities, point by point.
    for (const item of [
      "Analyser les demandes de crédit des PME",
      "Préparer les dossiers du comité",
    ]) {
      const field = wizard(page).getByPlaceholder(/^Responsabilité n°/);
      await field.fill(item);
      await field.press("Enter");
      await expect(wizard(page).locator(".nb-oe-points")).toContainText(item);
    }
    await nextStep(page, "Le profil recherché");

    // 5 · Experience and the profile's requirements.
    await wizard(page).getByRole("button", { name: "Années d'expérience demandées +" }).click();
    await expect(wizard(page)).toContainText("1 an au moins");
    await wizard(page)
      .getByPlaceholder(/Une première expérience/)
      .fill("Aisance avec les chiffres");
    await wizard(page).getByRole("button", { name: "Ajouter une exigence" }).click();
    await nextStep(page, "La fourchette salariale");

    // 6 · The salary, shown for transparency (it can be hidden).
    await expect(wizard(page).getByRole("switch", { name: "Afficher le salaire" })).toBeChecked();
    await wizard(page).getByLabel("Minimum (USD par mois)").fill("600");
    await wizard(page).getByLabel("Maximum (USD par mois)").fill("900");
    await expect(wizard(page)).toContainText("600 à 900 USD par mois");
    await nextStep(page, "Présentez votre entreprise");

    // 7 · The company's text, then 8 · the questions (never a condition to apply).
    await wizard(page)
      .getByLabel("Présentation de l'entreprise")
      .fill("Baobab Fintech (exemple fictif) finance les petites entreprises de la région.");
    await nextStep(page, "Les questions aux candidats");
    await wizard(page).getByRole("checkbox", { name: "Quand pouvez-vous commencer ?" }).click();
    await wizard(page).getByLabel("Votre question").fill("Avez-vous déjà utilisé Excel ?");
    await wizard(page).getByLabel("Votre question").press("Enter");
    await expect(
      wizard(page).getByRole("checkbox", { name: "Avez-vous déjà utilisé Excel ?" }),
    ).toBeChecked();
    await wizard(page).getByRole("button", { name: "Lettre" }).click();
    await capture(page, "053-publier-3");
    await nextStep(page, "Orbi a relu votre offre", "Lancer l'analyse d'Orbi");

    // 9 · Orbi's reading: advice only.
    await expect(wizard(page)).toContainText(/Votre offre est complète à \d+ %/);
    await expect(wizard(page)).toContainText("Le salaire est affiché");
    await nextStep(page, "Publier l'offre");

    // 10 · The Fil post (title proposed), the card, the job sheet.
    await expect(wizard(page).getByLabel("Titre")).toHaveValue(
      `On recrute : ${title}`.slice(0, 60),
    );
    const card = wizard(page).getByRole("article", {
      name: "Aperçu de la publication dans le Fil",
    });
    await expect(card).toContainText(title);
    await expect(card).toContainText("600 à 900 USD par mois");
    await expect(
      wizard(page).getByRole("link", { name: "Télécharger la fiche Jumanly" }),
    ).toHaveAttribute("href", /\/api\/offres\/[^/]+\/fiche\?jumanly=1$/);
    await capture(page, "054-publier-4");
    await expectAccessible(page);
    // The ONEM authorization is asked before publishing (29/10).
    await wizard(page)
      .getByRole("radio", { name: "Oui, je détiens l'autorisation de l'ONEM" })
      .click();
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
    await expect(offers(page).getByRole("heading", { name: new RegExp(title) })).toBeVisible();

    // « Modifier l'offre » comes back to the steps, already filled.
    await page.goto(`${offerUrl}?vue=apercu`);
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    const menu = sheet(page, title);
    await menu.getByRole("link", { name: /^Modifier l'offre/ }).click();
    await wizardReady(page);
    await expect(wizard(page).getByLabel("Intitulé du poste")).toHaveValue(title);
    await expect(wizard(page).getByText("Modifier l'offre")).toBeVisible();
    await wizard(page).getByRole("link", { name: "Retour" }).click();
    await expect(detail(page).getByRole("heading", { name: title })).toBeVisible();

    if (live) {
      // Pause, then back online (the state pill of the head, 04/11/2026).
      await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
      await menu.getByRole("button", { name: /^Mettre en pause/ }).click();
      await expect(detail(page).locator(".nb-rh-of-etat")).toHaveText("En pause");
      await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
      await menu.getByRole("button", { name: /^Remettre en ligne/ }).click();
      await expect(detail(page).locator(".nb-rh-of-etat")).toHaveText("En cours");
    }

    // « Supprimer l'offre » (03/11/2026): asked once, then the offer leaves the list.
    await detail(page).getByRole("button", { name: "Actions de l'offre" }).click();
    await menu.getByRole("button", { name: /^Supprimer l'offre/ }).click();
    const remove = sheet(page, new RegExp(`^Supprimer « ${title}`));
    await expect(remove.getByRole("button", { name: "Garder l'offre" })).toBeVisible();
    await remove.getByRole("button", { name: "Supprimer l'offre", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\?ok=retiree/);
    await expect(offers(page).getByRole("heading", { name: new RegExp(title) })).toHaveCount(0);
  });
});
