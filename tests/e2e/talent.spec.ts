import { expect, test } from "@playwright/test";
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
  if (page.url().includes("/inscription/forfait")) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
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
  await page.getByRole("button", { name: "Nouveau CV" }).click();
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
    .first()
    .click();
  await expect(page).toHaveURL(/postuler=1/);
  await page.locator("#apply-letter").fill("Ce poste correspond à mon expérience en comptabilité.");
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByText("Candidature envoyée !")).toBeVisible();

  // Follow it, read the CV that was sent, then withdraw.
  await page.goto("/app/jobs/candidatures");
  const card = page.locator("li").filter({ hasText: "Comptable" }).first();
  await expect(card).toContainText("Envoyée");
  const sentHref = await card.getByRole("link", { name: "Voir le CV envoyé" }).getAttribute("href");
  expect((await page.request.get(sentHref!)).status()).toBe(200);
  // On a phone the less frequent actions sit behind « … ».
  const more = card.getByLabel("Plus d'actions");
  if (await more.isVisible()) await more.click();
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

test("le diagnostic simplifié donne un bilan", async ({ page }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/career/diagnostic");
  const groups = page.locator("form#questions fieldset");
  for (let index = 0; index < (await groups.count()); index++) {
    await groups.nth(index).locator('input[type="radio"]').first().check();
  }
  await page.getByRole("button", { name: "Voir mon bilan" }).click();
  await expect(page).toHaveURL(/bilan=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre bilan de carrière");
  await expect(page.getByRole("main")).toContainText("Vos trois prochaines étapes");
});
