import { expect, test, type Locator } from "./fixtures";
import {
  demo,
  finishOnboarding,
  logIn,
  newCvFromList,
  signUpWithEmail,
  testEmail,
} from "./session";

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
  // Sign-up, then the first questions; the offer comes back at the end.
  await signUpWithEmail(page, email);
  await finishOnboarding(page, { country: "Congo", city: "Kinshasa" });
  await expect(page).toHaveURL(new RegExp(`/app/jobs/${JOB}`));

  // Profile (planche talent-4 § 3): summary, an experience, three skills, each on its screen.
  await page.goto("/app/profil/modifier");
  await page
    .locator("#pf-summary")
    .fill("Comptable rigoureuse, cinq ans de saisie et de rapprochements bancaires en PME.");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/profil\?ok=identite/);

  await page.goto("/app/profil/experience");
  await page.locator("#pf-exp-title").fill("Assistante comptable");
  await page.locator("#pf-exp-company").fill("Entreprise fictive");
  await page.locator("#pf-exp-start").fill("2021-03");
  await page.getByText("Poste actuel", { exact: true }).click();
  await page.locator("#pf-exp-result").fill("Saisie des factures\nRapprochements bancaires");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.locator("#experiences")).toContainText("Assistante comptable");

  for (const skill of ["Analyse de données", "Administration", "Achats"]) {
    await page.goto(`/app/profil/competence?q=${encodeURIComponent(skill)}`);
    await page.getByRole("button", { name: /^Ajouter/ }).click();
    await expect(page.locator("#competences")).toContainText(skill);
  }

  // CV from the profile, then its PDF.
  const cvId = await newCvFromList(page);
  await page.goto(`/app/career/cv/${cvId}?vue=apercu`);
  await expect(page.locator("article").first()).toContainText("Assistante comptable");
  const pdf = await page.request.get(`/app/career/cv/${cvId}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  // Apply with that CV (planche talent-2 § 1): CV, letter or documents, review, then sending.
  await page.goto(`/app/jobs/${JOB}`);
  await page.getByRole("link", { name: "Postuler", exact: true }).click();
  await expect(page).toHaveURL(/\/postuler/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=lettre/);
  await page.getByRole("button", { name: "Ajouter un document" }).click();
  await page.getByRole("button", { name: "Écrire une lettre" }).click();
  await page.locator("#apply-letter").fill("Ce poste correspond à mon expérience en comptabilité.");
  await page.getByRole("button", { name: "Enregistrer la lettre" }).click();
  await expect(page.getByText("Lettre de motivation", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=verification/);
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });

  // Follow it in Suivi, read the CV that was sent, then withdraw.
  await page.getByRole("link", { name: "Suivre ma candidature" }).click();
  await expect(page).toHaveURL(/\/app\/suivi\/[^/?]+/);
  await expect(page.getByRole("main")).toContainText("Envoyée");
  const sentHref = await page.getByRole("link", { name: /^CV « / }).getAttribute("href");
  expect((await page.request.get(sentHref!)).status()).toBe(200);
  await page.getByRole("button", { name: "Retirer ma candidature" }).click();
  await page.getByRole("button", { name: "Oui, retirer ma candidature" }).click();
  await expect(page).toHaveURL(/vue=terminees/);
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
  // Lot 6b (planche talent-4 § 5): with a result, the page opens on it; « Refaire » starts again.
  await page.goto("/app/career/diagnostic?refaire=1");
  await expect(
    page.getByRole("heading", { name: /^(Où en êtes-vous vraiment \?|Refaites le point)$/ }),
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

  // The analysis checks real steps, then the result opens by itself.
  await expect(page.getByText(/Comparaison avec les offres .*\(\d+ offres?\)/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page).toHaveURL(/bilan=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diagnostic de carrière");
  const main = page.getByRole("main");
  await expect(main.getByRole("definition").first()).toBeVisible();
  await expect(main).toContainText("Préparation aux entretiens");
  // « Pourquoi ces notes ? »: the points of every answer.
  await main.getByRole("button", { name: "Pourquoi ces notes ?" }).click();
  await expect(page.getByRole("dialog", { name: "Pourquoi ces notes" })).toBeVisible();
  await page.getByRole("button", { name: "Fermer" }).click();

  // « Mon plan » and « Refaire » at the bottom; on a computer (planche web talent-4 § 5), the plan
  // beside the result and « Refaire le diagnostic » under it.
  if (page.viewportSize()!.width < 768) {
    await expect(main.getByRole("link", { name: "Mon plan" })).toBeVisible();
    await main.getByRole("link", { name: "Refaire" }).click();
  } else {
    await expect(main.getByRole("heading", { name: "Mon plan de progression" })).toBeVisible();
    await main.getByRole("link", { name: "Refaire le diagnostic" }).click();
  }
  await expect(page.getByRole("heading", { name: "Refaites le point" })).toBeVisible();
});

test("diagnostic personnalisé : deux questions de relance de l'IA, puis le mini plan gratuit", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await logIn(page, demo.talentPro);
  await page.goto("/app/career/diagnostic?refaire=1");
  await expect(
    page.getByRole("heading", { name: /^(Où en êtes-vous vraiment \?|Refaites le point)$/ }),
  ).toBeVisible();
  const restart = page.getByRole("button", { name: "Recommencer à zéro" });
  if (await restart.isVisible()) await restart.click();
  else await page.getByRole("button", { name: "Lancer mon diagnostic" }).click();
  await expect(page).toHaveURL(/etape=1/);
  const flow = page.locator("#diagnostic-flow");
  expect(await answerDiagnostic(flow)).toBe(2);

  // The result opens by itself (or after Orbi's fallback notice, with « Voir mon diagnostic »).
  const open = page.getByRole("link", { name: "Voir mon diagnostic" });
  await expect(page)
    .toHaveURL(/bilan=/, { timeout: 30_000 })
    .catch(async () => open.click());
  await expect(page).toHaveURL(/bilan=/, { timeout: 30_000 });
  await expect(page.getByRole("main")).toContainText("Calculé sur vos réponses");
});

test("faire le point : atouts, à renforcer, prochaine action et son pourquoi", async ({ page }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/profil/point");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Faire le point");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Vos atouts" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "À renforcer" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Prochaine action" })).toBeVisible();
  await main.getByRole("button", { name: "Pourquoi ces conseils ?" }).click();
  await expect(page.getByRole("dialog", { name: "Pourquoi ces conseils" })).toContainText(
    "règles fixes",
  );
});
