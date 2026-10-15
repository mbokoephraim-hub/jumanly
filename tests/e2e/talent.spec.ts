import { expect, test, type Locator } from "./fixtures";
import { lastCode } from "./outbox";
import { demo, logIn, testEmail } from "./session";

const JOB = "demo-comptable-junior-abidjan";

// E3 definition of done: a Free talent builds a profile, generates a PDF CV, applies to an offer
// and follows the application. Applying is never blocked by a plan or a quota.
test("un talent Free postule depuis une offre publique, suit puis retire sa candidature", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const email = testEmail("talent");

  // Public offer → sign-up → back on the offer.
  await page.goto(`/offres/${JOB}`);
  const href = await page
    .getByRole("link", { name: "Postuler gratuitement" })
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await page.getByRole("button", { name: "Continuer" }).click();
  // The entry screen leads to the plan step (docs/refonte-connexion § 5).
  await expect(page).toHaveURL(/\/inscription\/forfait/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await page.locator('input[name="firstName"]').fill("Awa");
  await page.locator('input[name="lastName"]').fill("Fictive");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("kinshasa-2026");
  await page.locator('select[name="country"]').selectOption("CD");
  await page.locator('input[name="city"]').fill("Kinshasa");
  for (const name of ["terms", "ai", "age"]) await page.locator(`input[name="${name}"]`).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await page.locator('input[name="code"]').fill(await lastCode(email, since));
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Accéder à mon espace" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/jobs/${JOB}`));

  // Profile: summary, an experience, three skills.
  await page.goto("/app/profil");
  await page
    .locator("#summary")
    .fill("Comptable rigoureuse, cinq ans de saisie et de rapprochements bancaires en PME.");
  await page.locator("#resume").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#resume")).toContainText("Profil enregistré");

  const experiences = page.locator("#experiences");
  await experiences.locator("summary").filter({ hasText: "Ajouter" }).click();
  await experiences.locator('input[name="title"]').fill("Assistante comptable");
  await experiences.locator('input[name="company"]').fill("Entreprise fictive");
  await experiences.locator('input[name="start"]').fill("2021-03");
  await experiences.locator('input[name="current"]').check();
  await experiences
    .locator('textarea[name="description"]')
    .fill("Saisie des factures\nRapprochements bancaires");
  await experiences.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#experiences")).toContainText("Assistante comptable");

  for (const skill of ["Analyse de données", "Administration", "Achats"]) {
    const skills = page.locator("#competences");
    const form = skills.locator("form").filter({ has: page.locator('input[name="skill"]') });
    if (!(await form.isVisible())) await skills.locator("summary").last().click();
    await form.locator('input[name="skill"]').fill(skill);
    await form.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.locator("#competences")).toContainText(skill);
  }

  // CV from the profile, then its PDF.
  await page.goto("/app/career/cv");
  await page.getByRole("button", { name: "Nouveau CV", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
  await expect(page.locator("article")).toContainText("Assistante comptable");
  const pdfHref = await page.getByRole("link", { name: "Télécharger" }).getAttribute("href");
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  // Apply with that CV.
  await page.goto(`/app/jobs/${JOB}`);
  await page
    .getByRole("link", { name: "Postuler gratuitement" })
    .filter({ visible: true })
    .last()
    .click();
  await expect(page).toHaveURL(/postuler=1/);
  await page.locator("#apply-letter").fill("Ce poste correspond à mon expérience en comptabilité.");
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByText("Candidature envoyée !")).toBeVisible();

  // Follow it, read the CV that was sent, then withdraw.
  await page.goto("/app/jobs/candidatures");
  const card = page.locator("li").filter({ hasText: "Comptable" }).first();
  await expect(card).toContainText("Envoyée");
  // On a phone the less frequent actions sit behind « … ».
  const more = card.locator('summary[aria-label="Plus d\'actions"]');
  if (page.viewportSize()!.width < 1024) await more.click();
  const sentHref = await card.getByRole("link", { name: "Voir le CV envoyé" }).getAttribute("href");
  expect((await page.request.get(sentHref!)).status()).toBe(200);
  await card
    .locator("summary")
    .filter({ hasText: "Retirer ma candidature", visible: true })
    .click();
  await card
    .getByRole("button", { name: "Retirer", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/onglet=terminees/);
  await expect(page.getByRole("main")).toContainText("Retirée");
});

/** Answers every screen of the diagnostic (second answer of each choice), then starts the scan. Returns the number of follow-up questions met. */
async function answerDiagnostic(flow: Locator) {
  let followUps = 0;
  for (let step = 0; step < 70; step++) {
    // While Jumanly Intelligence writes its follow-up questions, the button waits.
    await expect(flow.locator("button[aria-busy]")).toHaveCount(0, { timeout: 30_000 });
    const screen = flow.locator("[data-screen]:not([hidden])");
    const groups = screen.locator("fieldset");
    for (let index = 0; index < (await groups.count()); index++) {
      await groups.nth(index).locator("label").nth(1).click();
    }
    if (await screen.getByText(/Question de relance \d sur 2/).isVisible()) {
      followUps++;
      await screen.getByRole("textbox").fill("Une réponse de démonstration, fictive.");
    }
    const finish = flow.getByRole("button", { name: "Terminer et lancer l'analyse" });
    if (await finish.isVisible()) {
      await finish.click();
      break;
    }
    await flow.getByRole("button", { name: "Suivant", exact: true }).click();
  }
  return followUps;
}

test("le diagnostic en six dimensions : une question par écran, le scan, puis le bilan", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await logIn(page, demo.talentFree);
  await page.goto("/app/career/diagnostic");
  await expect(
    page.getByRole("heading", { name: "Faites le point, comme un vrai bilan" }),
  ).toBeVisible();
  const restart = page.getByRole("button", { name: "Recommencer à zéro" });
  if (await restart.isVisible()) await restart.click();
  else await page.getByRole("button", { name: "Lancer mon diagnostic" }).click();
  await expect(page).toHaveURL(/etape=1/);

  const flow = page.locator("#diagnostic-flow");
  await expect(flow).toContainText("Étape 1 sur 6 · Clarté du projet");
  // Next without an answer: the question asks for one.
  await flow.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(flow.getByRole("alert")).toHaveText(
    "Choisissez au moins une réponse pour continuer.",
  );

  expect(await answerDiagnostic(flow)).toBe(0);

  // The scan checks real steps, then the card turns over.
  await expect(page.getByRole("heading", { name: "Analyse de votre diagnostic" })).toBeVisible();
  await expect(page.getByText(/Comparaison avec les offres .*\(\d+ offres?\)/)).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("link", { name: "Voir mon diagnostic" }).click({ timeout: 30_000 });
  // The flipped card navigates on the client; a busy CI runner can take a while.
  await expect(page).toHaveURL(/bilan=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre bilan de carrière");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Votre niveau global" })).toBeVisible();
  await expect(main.getByRole("table")).toContainText("Préparation aux entretiens");
  await expect(
    main.getByRole("heading", { name: "Le détail, dimension par dimension" }),
  ).toBeVisible();
  await expect(main).toContainText("Vos priorités");
  // The free mini plan, and what a paid plan would add.
  const miniPlan = main.getByRole("region", { name: "Votre mini plan gratuit" });
  await expect(miniPlan.getByRole("listitem")).toHaveCount(3);
  const upgrades = main.getByRole("region", { name: "Pour aller plus loin" });
  await expect(upgrades).toContainText("Un plan de progression complet");
  await expect(upgrades).toContainText("Forfait requis");

  // « Refaire dans 30 jours » plans a reminder.
  await main.getByRole("button", { name: "Refaire dans 30 jours" }).click();
  await expect(page).toHaveURL(/rappel=1/);
  await expect(main).toContainText("Rappel prévu le");
});

test("diagnostic personnalisé : deux questions de relance de l'IA, puis le mini plan gratuit", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await logIn(page, demo.talentPro);
  await page.goto("/app/career/diagnostic");
  await expect(
    page.getByRole("heading", { name: "Faites le point, comme un vrai bilan" }),
  ).toBeVisible();
  const restart = page.getByRole("button", { name: "Recommencer à zéro" });
  if (await restart.isVisible()) await restart.click();
  else await page.getByRole("button", { name: "Lancer mon diagnostic" }).click();
  await expect(page).toHaveURL(/etape=1/);
  const flow = page.locator("#diagnostic-flow");
  expect(await answerDiagnostic(flow)).toBe(2);

  await page.getByRole("link", { name: "Voir mon diagnostic" }).click({ timeout: 30_000 });
  // The flipped card navigates on the client; a busy CI runner can take a while.
  await expect(page).toHaveURL(/bilan=/, { timeout: 30_000 });
  const main = page.getByRole("main");
  const miniPlan = main.getByRole("region", { name: "Votre mini plan gratuit" });
  await expect(miniPlan.getByRole("listitem")).toHaveCount(3);
  // Every paid option is already in this plan: nothing more to offer.
  await expect(main.getByRole("region", { name: "Pour aller plus loin" })).toHaveCount(0);
});
