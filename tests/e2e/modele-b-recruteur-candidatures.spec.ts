import { execFileSync } from "node:child_process";
import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";

// Modèle B recruteur, lot M5 (docs/modele-b-recruteur, mobile/captures sections 04 and 05): the
// tab Candidatures (Fort potentiel, Toutes by stage, Entretiens, Décisions), the search, Orbi's
// diagnostic, the file of each candidate with its tabs and sheets, planning, documenting and
// proposing. Orbi recommends, the recruiter decides. Baobab Fintech and its people are fictional
// (seed); the gestures that write go to a fresh fictional company so the demo stays as it is.
const RECRUITER = "recruteur6.ux@jumanly.test";
const TALENT = "jeanpierre.ux@jumanly.test";

const main = (page: Page) => page.locator("main");
const tab = (page: Page) => page.locator(".nb-rh-vue").filter({ visible: true });
const file = (page: Page) => page.locator(".nb-rh-fiche").filter({ visible: true });
const screen = (page: Page) => page.locator(".nb-rh-detail").filter({ visible: true });
const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name });
const profile = (page: Page) => page.locator(".nb-rh-fiche-p").filter({ visible: true });

/**
 * The candidate opens on their profile (docs/profil-personne, vue recruteur); the file (Résumé, CV,
 * Réponses, Notes, Historique) opens with « ··· » › « Dossier de candidature ».
 */
async function openDossier(page: Page) {
  await profile(page)
    .getByRole("button", { name: /^Plus d'actions pour/ })
    .click();
  await page
    .getByRole("dialog")
    .filter({ visible: true })
    .getByRole("button", { name: /^Dossier de candidature/ })
    .click();
  await expect(file(page).getByRole("tab", { name: "Résumé" })).toBeVisible();
}

const views = (page: Page) =>
  main(page).getByRole("navigation", { name: "Vues des candidatures" }).filter({ visible: true });

/** No horizontal scroll at 390 px (définition de fini). */
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

/**
 * A fresh fictional company (the cheapest plan opening `entitlement`, chosen by its right) signed
 * in on `page`, with one published offer and one application of {@link TALENT}.
 */
async function freshOffer(
  page: Page,
  browser: Browser,
  baseURL: string | undefined,
  prefix: string,
  entitlement?: string,
) {
  const email = testEmail(prefix);
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    "verified",
    ...(entitlement ? [entitlement] : []),
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await fillOffer(page, {
    title: `Analyste fictif ${suffix()}`,
    description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
    responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
    skill: "Analyse de données",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);
  const other = await browser.newContext({
    baseURL,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const talent = await other.newPage();
  await logIn(talent, TALENT);
  await talent.goto(`/app/jobs/${slug}/postuler`);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  return talent;
}

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Candidatures au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("les vues, la recherche, le diagnostic d'Orbi et la fiche d'un candidat", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await logIn(page, RECRUITER, undefined, "/app/hire/candidats");
    await page.goto("/app/hire/candidats");
    await expect(
      main(page).getByRole("heading", { name: "Candidatures", exact: true }),
    ).toBeVisible();
    await expect(
      main(page)
        .getByText(/candidatures? · /)
        .first(),
    ).toBeVisible();
    await expect(views(page).getByRole("link", { name: /^Fort potentiel/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tab(page)).toContainText("jamais");
    await capture(page, "057-candidatures");
    await fits(page);
    await expectAccessible(page);

    // An offer chip, then back to all of them.
    const offers = main(page).getByRole("navigation", { name: "Offres" }).filter({ visible: true });
    await offers.getByRole("link", { name: /^Analyste de données junior/ }).click();
    await expect(page).toHaveURL(/offre=/);
    await capture(page, "084-cand-analyste");
    await offers.getByRole("link", { name: /^Toutes les offres/ }).click();
    await expect(page).not.toHaveURL(/offre=/);

    // Toutes: the stages, the order, the selection and « Message à N candidats ».
    await views(page).getByRole("link", { name: "Toutes" }).click();
    await expect(page).toHaveURL(/vue=toutes/);
    const phases = main(page).getByRole("navigation", { name: "Étapes" }).filter({ visible: true });
    await expect(phases.getByRole("link", { name: /Reçue/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await capture(page, "058-cand-toutes");
    await fits(page);
    await expectAccessible(page);
    await tab(page).getByRole("link", { name: "Par score" }).click();
    await expect(page).toHaveURL(/tri=date/);
    await tab(page).getByRole("link", { name: "Par date" }).click();
    await expect(page).not.toHaveURL(/tri=date/);
    for (const name of ["Présélection", "Entretien", "Proposition", "Recruté·e", "Non retenu·e"]) {
      await phases.getByRole("link", { name: new RegExp(name) }).click();
      await expect(phases.getByRole("link", { name: new RegExp(name) })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }
    await phases.getByRole("link", { name: /Reçue/ }).click();
    await expect(page).not.toHaveURL(/etape=/);
    await tab(page).getByRole("button", { name: "Sélectionner" }).click();
    const write = page.locator(".nb-rh-selection").getByRole("button");
    await expect(write).toBeDisabled();
    await tab(page).locator(".nb-rh-choix input").first().check();
    await expect(write).toHaveText("Écrire à 1 candidat");
    await capture(page, "059-cand-selection");
    await write.click();
    const group = sheet(page, "Message à 1 candidat");
    await expect(group.getByRole("radio", { name: "Invitation à un entretien" })).toBeChecked();
    await group.getByText("Demande de document").click();
    await expect(group.locator(".nb-rh-apercu-m")).toContainText("Baobab");
    await capture(page, "082-cand-groupe");
    await group.getByRole("button", { name: "Annuler" }).click();
    await tab(page).getByRole("button", { name: "Annuler" }).click();
    await expect(page.locator(".nb-rh-selection")).toHaveCount(0);

    // Entretiens: today, ahead, to document.
    await views(page)
      .getByRole("link", { name: /^Entretiens/ })
      .click();
    await expect(page).toHaveURL(/vue=entretiens/);
    const when = main(page)
      .getByRole("navigation", { name: "Entretiens" })
      .filter({ visible: true });
    await capture(page, "060-cand-entretiens");
    await when.getByRole("link", { name: /^À venir/ }).click();
    await expect(tab(page).getByRole("link", { name: "Voir l'entretien" }).first()).toBeVisible();
    await when.getByRole("link", { name: /^À documenter/ }).click();
    await expect(page).toHaveURL(/quand=documenter/);
    await expect(
      tab(page).getByRole("link", { name: "Documenter l'entretien" }).first(),
    ).toBeVisible();
    await capture(page, "061-cand-a-documenter");
    await expectAccessible(page);

    // Décisions: proposals, hired, not retained.
    await views(page).getByRole("link", { name: "Décisions" }).click();
    await expect(page).toHaveURL(/vue=decisions/);
    const decisions = main(page)
      .getByRole("navigation", { name: "Décisions" })
      .filter({ visible: true });
    await capture(page, "062-cand-decisions");
    await decisions.getByRole("link", { name: /^Recrutés/ }).click();
    await expect(page).toHaveURL(/decision=recrutes/);
    await decisions.getByRole("link", { name: /^Non retenus/ }).click();
    await expect(page).toHaveURL(/decision=nonretenus/);
    await capture(page, "063-cand-nonretenus");
    await expectAccessible(page);

    // Search in two steps: by name, skill or city.
    await page.goto("/app/hire/candidats");
    const field = main(page)
      .getByRole("searchbox", { name: "Rechercher un candidat" })
      .filter({ visible: true });
    await field.click();
    await expect(field).toBeFocused();
    const scopes = main(page).getByRole("radiogroup", { name: "Chercher par" });
    for (const name of ["Tout", "Nom", "Compétence", "Ville"])
      await expect(scopes.getByRole("radio", { name })).toBeVisible();
    await capture(page, "064-cand-recherche");
    await scopes.getByRole("radio", { name: "Nom" }).click();
    await field.fill("Amani");
    const found = main(page).getByRole("region", { name: /résultat/ });
    await expect(found.getByRole("link", { name: /Amani/ }).first()).toBeVisible();
    await capture(page, "065-cand-recherche-texte");
    await main(page).getByRole("button", { name: "Annuler" }).filter({ visible: true }).click();

    // Orbi's diagnostic of all the CVs, read from the explained scores.
    await page.goto("/app/hire/candidats/diagnostic");
    await expect(screen(page).getByRole("heading", { name: "Diagnostic des CV" })).toBeVisible();
    await expect(screen(page)).toContainText("couvrent tous les critères");
    await expect(
      screen(page).getByRole("heading", { name: "Les plus proches de l'offre" }),
    ).toBeVisible();
    await capture(page, "066-cand-diagnostic");
    await fits(page);
    await expectAccessible(page);
    await screen(page).getByRole("link", { name: "Candidatures" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats(\?|$)/);

    // The file of a candidate: tabs, « Pourquoi ? », « ··· » and its sheets.
    await views(page).getByRole("link", { name: "Toutes" }).click();
    await tab(page).locator("a.nb-rh-cl").first().click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/?]+$/);
    // The profile first: the card of the application, « Pourquoi ? », the four tabs.
    await expect(profile(page).getByText(/^A candidaté : /)).toBeVisible();
    await expect(profile(page).getByRole("tab", { name: "À propos", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await capture(page, "067-candidat");
    await fits(page);
    await expectAccessible(page);
    const why = profile(page).getByRole("button", { name: /^Pourquoi \d+ % \?$/ });
    if (await why.count()) {
      await why.click();
      const explained = sheet(page, /^Pourquoi \d+ % \?/);
      await expect(explained).toContainText("Calculé sans le nom, la photo");
      await expect(explained).toContainText("aucune candidature n’est écartée automatiquement");
      await capture(page, "068-candidat-pourquoi");
      await explained.getByRole("button", { name: "Compris" }).click();
    }
    await openDossier(page);
    await expect(file(page).getByRole("tab", { name: "Résumé" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    for (const [name, shot] of [
      ["CV", "069-candidat-cv"],
      ["Réponses", "070-candidat-reponses"],
      ["Notes", "071-candidat-notes"],
      ["Historique", "072-candidat-historique"],
    ] as const) {
      await file(page)
        .getByRole("tab", { name: new RegExp(`^${name}`) })
        .click();
      await expect(
        file(page).getByRole("tabpanel", { name: new RegExp(`^${name}`) }),
      ).toBeVisible();
      await capture(page, shot);
    }
    await file(page).getByRole("tab", { name: "Résumé" }).click();

    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    const menu = page.getByRole("dialog").filter({ visible: true });
    for (const name of [
      "Changer d'étape",
      "Répartir à un collègue",
      "Planifier un entretien",
      "Demander un document",
      "Télécharger le PDF",
      "Ne pas retenir",
    ])
      await expect(menu.getByText(name, { exact: true })).toBeVisible();
    await capture(page, "073-candidat-menu");
    await menu.getByRole("button", { name: /^Changer d'étape/ }).click();
    const stages = sheet(page, "Changer d'étape");
    await expect(stages.locator("[aria-current=step]")).toBeVisible();
    await capture(page, "074-candidat-etape");
    await stages.getByRole("button", { name: "Annuler" }).click();

    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Répartir à un collègue/ })
      .click();
    const assign = sheet(page, /^Confier .+ à$/);
    await expect(assign).toContainText("reçoit une notification");
    await capture(page, "075-candidat-repartir");
    await assign.getByRole("button", { name: "Annuler" }).click();

    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Télécharger le PDF/ })
      .click();
    const pdf = sheet(page, "Télécharger en PDF");
    await expect(pdf.getByRole("checkbox", { name: "Historique des décisions" })).not.toBeChecked();
    await capture(page, "076-candidat-pdf");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      pdf.getByRole("link", { name: "Télécharger", exact: true }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Demander un document/ })
      .click();
    const ask = sheet(page, "Demander un document");
    await ask.getByRole("button", { name: "Attestation" }).click();
    await expect(ask.getByLabel("Document demandé")).toHaveValue("Attestation");
    await ask.getByRole("button", { name: "Annuler" }).click();

    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Ne pas retenir/ })
      .click();
    const reject = sheet(page, /^Ne pas retenir /);
    await reject.getByRole("radio", { name: "Autre candidat plus proche" }).click();
    await expect(reject.getByRole("radio", { name: "Autre candidat plus proche" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(reject.getByLabel("Message envoyé")).not.toBeEmpty();
    await capture(page, "077-candidat-nonretenu");
    await reject.getByRole("button", { name: "Annuler" }).click();

    // « Planifier un entretien »: a day, a free time, how; nothing leaves here.
    const fileUrl = page.url();
    await page.goto(`${fileUrl}/entretien`);
    const plan = page.locator(".nb-rh-plan").filter({ visible: true });
    await expect(plan.getByRole("heading", { name: /^Entretien avec / })).toBeVisible();
    await plan.locator(".nb-rh-jours button").nth(1).click();
    await expect(plan.locator(".nb-rh-jours button").nth(1)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await plan.getByRole("button", { name: /^Sur place/ }).click();
    await expect(plan.getByLabel("Adresse")).toBeVisible();
    await plan.getByRole("button", { name: /^Visio/ }).click();
    await expect(plan.getByLabel("Lien de la visio (facultatif)")).toBeVisible();
    await plan.getByRole("button", { name: "1 h", exact: true }).click();
    await expect(plan.getByRole("button", { name: "Envoyer l'invitation" })).toBeEnabled();
    await capture(page, "078-planifier");
    await fits(page);
    await expectAccessible(page);

    // An interview already planned, and documenting a past one (not saved here).
    await page.goto("/app/hire/candidats?vue=entretiens&quand=avenir");
    await tab(page).getByRole("link", { name: "Voir l'entretien" }).first().click();
    await expect(page).toHaveURL(/\/app\/hire\/entretiens\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Préparer l'entretien");
    await page.goto("/app/hire/candidats?vue=entretiens&quand=documenter");
    await tab(page).getByRole("link", { name: "Documenter l'entretien" }).first().click();
    const evaluation = page.locator(".nb-rh-eval").filter({ visible: true });
    const save = evaluation.getByRole("button", { name: "Enregistrer l'évaluation" });
    const groups = evaluation.getByRole("radiogroup");
    await expect(groups.first()).toBeVisible();
    const count = await groups.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index++)
      await groups.nth(index).getByRole("radio").nth(2).click();
    await expect(save).toBeEnabled();
    await evaluation.getByRole("button", { name: "À revoir" }).click();
    await expect(evaluation.getByRole("button", { name: "À revoir" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capture(page, "080-evaluation");
    await expectAccessible(page);
  });

  test("planifier, noter, confier, proposer, écrire au groupe et recruter", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(300_000);
    await (await freshOffer(page, browser, baseURL, "rx-m5", "hire.scorecards")).context().close();
    await page.goto("/app/hire/candidats?vue=toutes");
    await tab(page)
      .getByRole("link", { name: /Jean-Pierre/ })
      .click();
    await expect(profile(page).getByRole("heading", { name: /Jean-Pierre/ })).toBeVisible();
    const base = page.url();
    // The file itself (Résumé, CV…), opened directly.
    const fileUrl = `${base}?onglet=resume`;
    await openDossier(page);

    // A note for the team.
    await file(page)
      .getByRole("tab", { name: /^Notes/ })
      .click();
    await file(page).getByLabel("Note pour l'équipe").fill("Note fictive : à rappeler.");
    await file(page).getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("Note ajoutée.")).toBeVisible();
    await expect(file(page)).toContainText("Note fictive : à rappeler.");

    // Change the stage from the card, then entrust the file (to oneself, the only member).
    await file(page)
      .getByRole("button", { name: /^Changer d'étape, actuellement/ })
      .click();
    await sheet(page, "Changer d'étape").getByRole("button", { name: "Présélection" }).click();
    await expect(page.getByText("Étape changée.")).toBeVisible();
    await expect(file(page).locator(".nb-rh-f-etape")).toContainText("Présélection");
    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Répartir à un collègue/ })
      .click();
    await sheet(page, /^Confier .+ à$/)
      .locator(".nb-rh-membre")
      .first()
      .click();
    await expect(page.getByText("Dossier confié.")).toBeVisible();
    await file(page).getByRole("tab", { name: "Historique" }).click();
    await expect(file(page).getByRole("tabpanel", { name: "Historique" })).toContainText("confié");

    // Ask for a document.
    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Demander un document/ })
      .click();
    await sheet(page, "Demander un document")
      .getByRole("button", { name: "Envoyer la demande" })
      .click();
    await expect(page.getByText("Demande de document envoyée.")).toBeVisible();

    // Plan the interview: « Invitation envoyée », the calendar file, back to the file.
    await file(page).getByRole("link", { name: "Planifier un entretien" }).click();
    const plan = page.locator(".nb-rh-plan").filter({ visible: true });
    await plan.locator(".nb-rh-jours button").nth(1).click();
    await plan.getByLabel("Lien de la visio (facultatif)").fill("https://visio.example.test/m5");
    await plan.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(page.getByRole("heading", { name: "Invitation envoyée" })).toBeVisible();
    await capture(page, "079-planifie");
    await expectAccessible(page);
    const ics = await page.request.get(
      (await page.getByRole("link", { name: "Ajouter à mon agenda" }).getAttribute("href"))!,
    );
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("BEGIN:VEVENT");
    await page.getByRole("link", { name: "Revenir à la fiche" }).click();
    await expect(page).toHaveURL(base);

    // The talent confirms the slot from Suivi; the preparation refuses a private question and
    // keeps a question about the job until its author removes it.
    const confirming = await browser.newContext({
      baseURL,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const confirmer = await confirming.newPage();
    await logIn(confirmer, TALENT);
    await confirmer.goto(`/app/suivi/${base.split("?")[0]!.split("/").pop()}`);
    await confirmer
      .locator("#entretien")
      .getByRole("button", { name: "Confirmer" })
      .first()
      .click();
    await expect(confirmer).toHaveURL(/ok=confirme/);
    await confirming.close();
    await page.goto("/app/hire/candidats?vue=entretiens&quand=avenir");
    await tab(page).getByRole("link", { name: "Voir l'entretien" }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Préparer l'entretien");
    const prep = page.url().split("?")[0]!;
    const prepMain = page.locator("main").filter({ visible: true });
    await expect(prepMain).toContainText("Questions proposées");
    await prepMain.getByRole("button", { name: "Ajouter", exact: true }).click();
    const ask = page.getByRole("dialog", { name: "Ajouter une question" });
    await ask.getByLabel("Votre question").fill("Êtes-vous marié et avez-vous des enfants ?");
    await ask.getByRole("button", { name: "Ajouter la question" }).click();
    await expect(page.getByText(/Cette question touche à la vie privée/).first()).toBeVisible();
    await page.goto(prep);
    await prepMain.getByRole("button", { name: "Ajouter", exact: true }).click();
    await ask.getByLabel("Votre question").fill("Comment priorisez-vous les demandes fictives ?");
    await ask.getByRole("button", { name: "Ajouter la question" }).click();
    await expect(page).toHaveURL(/ok=question/);
    await expect(prepMain).toContainText("Comment priorisez-vous les demandes fictives ?");
    await prepMain.getByRole("button", { name: /^Retirer la question/ }).click();
    await expect(page).toHaveURL(/ok=question-retiree/);
    await expect(prepMain).not.toContainText("Comment priorisez-vous les demandes fictives ?");
    await fits(page);
    await page.goto(fileUrl);

    // « Message à 1 candidat » from the selection (« Candidature bien reçue »).
    await page.goto("/app/hire/candidats?vue=toutes&etape=preselection");
    await tab(page).getByRole("button", { name: "Sélectionner" }).click();
    await tab(page).locator(".nb-rh-choix input").first().check();
    await page.locator(".nb-rh-selection").getByRole("button").click();
    const group = sheet(page, "Message à 1 candidat");
    await group.getByText("Candidature bien reçue").click();
    await expect(group.locator(".nb-rh-apercu-m")).toContainText("Jean-Pierre");
    await group.getByRole("button", { name: "Envoyer à chacun" }).click();
    await expect(page.getByText("Message envoyé à 1 candidat.")).toBeVisible();

    // A proposal: in the conversation, then the decision stays with the recruiter.
    await page.goto(`${base}/decision?issue=proposition`);
    const proposal = page.locator(".nb-rh-prop").filter({ visible: true });
    await expect(proposal.getByRole("heading", { name: /^Proposition à / })).toBeVisible();
    await proposal.getByLabel("Salaire mensuel (USD)").fill("900");
    await proposal.getByLabel("Date de début").fill("2026-12-01");
    await capture(page, "081-proposition");
    await expectAccessible(page);
    await proposal.getByRole("button", { name: "Envoyer la proposition" }).click();
    await expect(page.getByText("Proposition envoyée.")).toBeVisible();
    await page.goto("/app/hire/candidats?vue=decisions");
    await expect(tab(page).getByRole("link", { name: /Jean-Pierre/ })).toContainText(
      "en attente de réponse",
    );

    // Recruit from the file, with its message.
    await page.goto(fileUrl);
    await file(page)
      .getByRole("button", { name: /^Changer d'étape, actuellement/ })
      .click();
    await sheet(page, "Changer d'étape")
      .getByRole("button", { name: "Retenue", exact: true })
      .click();
    const recruit = sheet(page, /^Recruter /);
    await expect(recruit.getByLabel("Message envoyé")).not.toBeEmpty();
    await recruit.getByRole("button", { name: "Envoyer et recruter" }).click();
    await expect(page.getByText("Décision envoyée avec son message.")).toBeVisible();
    await expect(file(page).locator(".nb-rh-f-etape")).toContainText("Retenue");
  });

  test("Orbi résume sur demande, la décision s'annule, sans analyse le dossier reste entier", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(300_000);
    const talent = await freshOffer(page, browser, baseURL, "rx-m5-orbi", "hire.cv_analysis");
    await page.goto("/app/hire/candidats?vue=toutes");
    await tab(page)
      .getByRole("link", { name: /Jean-Pierre/ })
      .click();
    await expect(profile(page).getByRole("heading", { name: /Jean-Pierre/ })).toBeVisible();
    const fileUrl = page.url().split("?")[0]!;
    await openDossier(page);

    // Orbi reads the file on demand: strengths, points to check, never a decision.
    const orbi = file(page).locator("#orbi");
    await expect(orbi).toContainText("Résumé par Orbi");
    await orbi.getByRole("button", { name: "Résumer avec Orbi" }).click();
    await expect(orbi).toContainText("Analyse du dossier");
    await expect(orbi).toContainText("Points forts");
    await expect(orbi).toContainText("À vérifier en entretien");
    await fits(page);
    await orbi.getByRole("button", { name: "Ajouter aux notes" }).click();
    await expect(page).toHaveURL(/ok=note-orbi/);
    await expect(file(page)).toContainText("À vérifier en entretien");
    await expect(file(page).locator(".nb-rh-f-etape")).toContainText("Reçue");
    const thread = await file(page)
      .getByRole("link", { name: "Écrire au candidat" })
      .getAttribute("href");

    // « Ne pas retenir », then « Annuler » within the delay: back to its stage, message withdrawn.
    await file(page)
      .getByRole("button", { name: /^Plus d'actions pour/ })
      .click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Ne pas retenir/ })
      .click();
    const reject = sheet(page, /^Ne pas retenir /);
    await reject.getByRole("button", { name: "Envoyer et ne pas retenir" }).click();
    await expect(page.getByText("Décision envoyée avec son message.")).toBeVisible();
    const undo = file(page).locator(".nb-rh-annuler");
    await expect(undo).toContainText("Annulable encore");
    await talent.goto(thread!);
    await expect(talent.getByRole("main")).toContainText("Candidature non retenue");
    await undo.getByRole("button", { name: "Annuler" }).click();
    await expect(page).toHaveURL(/ok=annulee/);
    expect(page.url().split("?")[0]).toBe(fileUrl);
    await expect(
      page.getByText("Décision annulée : la candidature est revenue à son étape."),
    ).toBeVisible();
    await expect(file(page).locator(".nb-rh-f-etape")).toContainText("Reçue");
    await talent.reload();
    await expect(talent.getByRole("main")).toContainText("Message retiré par l'entreprise.");
    await talent.context().close();

    // A company without the analysis: the file stays whole, Orbi is offered with the plans.
    const free = await browser.newContext({
      baseURL,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    });
    const other = await free.newPage();
    await (await freshOffer(other, browser, baseURL, "rx-m5-free")).context().close();
    await other.goto("/app/hire/candidats?vue=toutes");
    await tab(other)
      .getByRole("link", { name: /Jean-Pierre/ })
      .click();
    await openDossier(other);
    const locked = file(other).locator("#orbi");
    await expect(locked).toContainText("Disponibles avec une formule plus complète.");
    await expect(locked.getByRole("button", { name: "Résumer avec Orbi" })).toHaveCount(0);
    await expect(
      file(other).getByRole("button", { name: /^Changer d'étape, actuellement/ }),
    ).toBeVisible();
    await expectAccessible(other);
    // 412 px too, with the long texts of the file.
    await other.setViewportSize({ width: 412, height: 915 });
    await fits(other);
    await free.close();
  });
});
