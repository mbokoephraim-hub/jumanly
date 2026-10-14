import { expect, test, type Browser } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

async function newPage(browser: Browser, baseURL: string | undefined, isMobile: boolean) {
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  return context.newPage();
}

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

// E5 definition of done: an editor builds a complete course in the admin; a Free talent follows
// it to the attestation, which is verifiable on its public page.
test("un éditeur crée une formation, un talent Free la suit jusqu'à l'attestation", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(240_000);
  const title = `Formation fictive e2e ${suffix()}`;

  // The content editor lands on the courses, the only part of the admin they see.
  await logIn(page, demo.editor, undefined, "/admin");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/formations$/);
  await expect(page.getByRole("link", { name: "Forfaits et droits" })).toHaveCount(0);
  await page.locator("#course-new-title").fill(title);
  await page.getByRole("button", { name: "Créer le brouillon" }).click();
  await expect(page.getByText("Brouillon créé.", { exact: false })).toBeVisible();

  await page.locator("#course-summary").fill("Résumé fictif pour le test de bout en bout.");
  await page.locator("#course-description").fill("Description fictive : contenu de test.");
  await page.locator("#course-objectives").fill("Premier objectif\nSecond objectif");
  await page.locator("#course-instructor").fill("Formatrice fictive");
  await page.locator("#course-skills").fill("Communication orale");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();

  // Publishing without lessons is refused, with the reason.
  await page.locator("#course-status").selectOption("published");
  await page.getByRole("button", { name: "Changer le statut" }).click();
  await expect(page.getByText("Ajoutez au moins une leçon.")).toBeVisible();

  await page.locator("#module-new-title").fill("Module fictif");
  await page.getByRole("button", { name: "Ajouter un module" }).click();
  const moduleCard = page.locator("#programme > div").first();
  await moduleCard.getByLabel("Titre de la leçon").fill("Leçon texte fictive");
  await moduleCard.getByLabel("Type de leçon").selectOption("text");
  await moduleCard.getByRole("button", { name: "Ajouter une leçon" }).click();
  await expect(page.locator("#lecon-title")).toContainText("Leçon texte fictive");
  await page
    .locator("#lesson-content")
    .fill("Premier paragraphe fictif.\n\nSecond paragraphe fictif.");
  await page.locator("#lesson-resources").fill("Fiche fictive | /favicon.ico | ICO");
  await page.locator("#lesson-preview").check();
  await page.getByRole("button", { name: "Enregistrer la leçon" }).click();
  await expect(page.getByText("Leçon enregistrée.")).toBeVisible();

  await moduleCard.getByLabel("Titre de la leçon").fill("Quiz fictif");
  await moduleCard.getByLabel("Type de leçon").selectOption("quiz");
  await moduleCard.getByRole("button", { name: "Ajouter une leçon" }).click();
  await expect(page.locator("#quiz")).toBeVisible();
  await page.locator("#question-new-prompt").fill("Combien font deux plus deux ?");
  await page.locator("#question-new-options").fill("Trois\nQuatre\nCinq");
  await page.locator("#question-new-answer").fill("2");
  await page.locator("#question-new-explanation").fill("Deux plus deux font quatre.");
  await page.getByRole("button", { name: "Enregistrer la question" }).last().click();
  await expect(page.getByText("Quiz enregistré.")).toBeVisible();

  await page.locator("#course-status").selectOption("published");
  await page.getByRole("button", { name: "Changer le statut" }).click();
  await expect(page.getByText("Formation publiée.")).toBeVisible();
  const slug = (await page.locator("#course-slug").inputValue()).trim();

  // The preview lesson is visible on the public page.
  const visitor = await newPage(browser, baseURL, isMobile);
  await visitor.goto(`/formations/${slug}`);
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(visitor.getByText("Premier paragraphe fictif.")).toBeVisible();
  await visitor.context().close();

  // A Free talent follows it.
  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, demo.talentFree);
  await talent.goto(`/app/learn/${slug}`);
  await talent.getByRole("button", { name: "Commencer" }).click();
  await expect(
    talent.getByText("Formation ajoutée à « Mes formations »", { exact: false }),
  ).toBeVisible();
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText("Leçon texte fictive");
  await expect(talent.getByText("Second paragraphe fictif.")).toBeVisible();
  await talent.locator("#note-body").fill("Note privée fictive.");
  await talent.getByRole("button", { name: "Enregistrer la note" }).click();
  await expect(talent.getByText("Note privée fictive.")).toBeVisible();
  await talent.getByRole("button", { name: "Marquer comme terminée" }).click();

  // A wrong answer first, then the right one.
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText("Quiz fictif");
  await talent.getByLabel("Trois").check();
  await talent.getByRole("button", { name: "Valider mes réponses" }).click();
  await expect(talent.getByText("Presque ! Encore un effort.")).toBeVisible();
  await expect(talent.getByText("Deux plus deux font quatre.", { exact: false })).toBeVisible();
  await talent.getByRole("link", { name: "Réessayer" }).click();
  await talent.getByLabel("Quatre").check();
  await talent.getByRole("button", { name: "Valider mes réponses" }).click();
  await expect(talent.getByText("Félicitations", { exact: false })).toBeVisible();

  await talent.goto("/app/learn/attestations");
  const card = talent.locator("li").filter({ hasText: title });
  await expect(card).toBeVisible();
  const pdfHref = await card.getByRole("link", { name: "Télécharger le PDF" }).getAttribute("href");
  const pdf = await talent.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  await card.getByRole("link", { name: "Page de vérification" }).click();
  await expect(talent.getByText("Attestation authentique")).toBeVisible();
  await expect(talent.locator("dd").getByText(title)).toBeVisible();

  // The course is now among the completed ones.
  await talent.goto("/app/learn?liste=terminees");
  await expect(talent.getByRole("link", { name: title })).toBeVisible();
  await talent.context().close();
});

test("une formation « fondamentaux » est verrouillée en Free et ouverte en Starter", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/learn/demo-excel-pour-debuter");
  await expect(page.getByText("Cette formation est disponible avec Starter")).toBeVisible();
  await expect(page.getByRole("button", { name: "Commencer" })).toHaveCount(0);
  await page.goto("/app/learn?q=Excel");
  await expect(page.getByText("Disponible avec Starter")).toBeVisible();

  const starter = await newPage(browser, baseURL, isMobile);
  await logIn(starter, demo.talentStarter);
  await starter.goto("/app/learn/demo-excel-pour-debuter");
  await expect(
    starter.getByText("Cette formation est disponible avec", { exact: false }),
  ).toHaveCount(0);
  await expect(
    starter
      .getByRole("button", { name: "Commencer" })
      .or(starter.getByRole("heading", { level: 1 }))
      .first(),
  ).toBeVisible();
  await starter.context().close();
});

test("la page publique de vérification signale un numéro inconnu", async ({ page }) => {
  await page.goto("/attestations");
  await page.locator("#certificate-code").fill("JMN-ZZZZ-ZZZZ");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page).toHaveURL(/\/attestations\/JMN-ZZZZ-ZZZZ/);
  await expect(page.getByText("Attestation introuvable")).toBeVisible();
  await expectAccessible(page);
});

test("aucune erreur d'accessibilité WCAG 2.2 AA dans Learn", async ({ page }) => {
  await logIn(page, demo.talentPro);
  for (const path of [
    "/app/learn",
    "/app/learn?liste=mes",
    "/app/learn/demo-reussir-son-cv",
    "/app/learn/attestations",
  ]) {
    await page.goto(path);
    await expectAccessible(page);
  }
});

test("aucune erreur d'accessibilité WCAG 2.2 AA dans l'éditeur de formations", async ({ page }) => {
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations");
  await expectAccessible(page);
  await page.getByRole("link", { name: "Réussir son CV (démo)" }).click();
  await expect(page.locator("#fiche")).toBeVisible();
  await expectAccessible(page);
});
