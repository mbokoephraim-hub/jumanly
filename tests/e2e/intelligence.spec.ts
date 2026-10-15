import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { lastCode } from "./outbox";
import { demo, logIn, testEmail } from "./session";

const JOB = "demo-assistant-administratif-kinshasa";

async function signUpTalent(page: Page, email: string) {
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
}

// E6 definition of done: a score explained on the talent side, a skill imported from a pasted CV
// changes it, the talent asks for a human review and an administrator answers it.
test("score expliqué, import de CV et révision humaine", async ({ page, browser, baseURL }) => {
  test.setTimeout(180_000);
  const email = testEmail("matching");
  await signUpTalent(page, email);

  // Without skills, no score: the talent is invited to add them.
  await page.goto(`/app/jobs/${JOB}`);
  await expect(page.getByRole("link", { name: "Ajouter mes compétences" }).first()).toBeVisible();

  // Pasted CV → validated items → profile.
  await page.goto("/app/profil/import");
  await page
    .locator("#cv-import-text")
    .fill("Assistante administrative. Maîtrise de Microsoft Excel et de l'archivage.");
  await page.getByRole("button", { name: "Lire mon CV" }).click();
  await expect(
    page.getByRole("heading", { name: "Vérifiez les informations extraites" }),
  ).toBeVisible();
  await expect(page.getByLabel("Excel")).toBeChecked();
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(page).toHaveURL(/\/app\/profil\?import=/);
  await expect(page.locator("#competences")).toContainText("Excel");

  // The score and its « Pourquoi ? », with what is missing.
  await page.goto(`/app/jobs/${JOB}`);
  const why = page.locator("#compatibilite");
  await expect(why.getByRole("heading", { name: /Pourquoi \d+ % \?/ })).toBeVisible();
  await expect(why).toContainText("Word");
  await expect(
    page.getByRole("link", { name: "Comment fonctionne le matching" }).first(),
  ).toBeVisible();

  // Human review.
  await page.locator("#revision summary").click();
  await page.getByLabel("Une compétence que j'ai n'est pas prise en compte").check();
  await page.locator("#dispute-details").fill("J'utilise Word tous les jours depuis trois ans.");
  await page.getByRole("button", { name: "Demander une révision humaine" }).click();
  await expect(page.locator("#revision")).toContainText("Votre demande est enregistrée");

  // An administrator confirms the score with an answer.
  const context = await browser.newContext({ baseURL });
  const admin = await context.newPage();
  await logIn(admin, demo.admin, undefined, "/admin/ia?onglet=revisions");
  await admin.goto("/admin/ia?onglet=revisions");
  const item = admin.locator("li").filter({ hasText: email });
  await item
    .getByLabel("Réponse envoyée au talent")
    .fill("Le calcul a été vérifié : Word manque au profil.");
  await item.getByRole("button", { name: "Confirmer le score et expliquer" }).click();
  await expect(admin.getByText("Révision clôturée.", { exact: false })).toBeVisible();
  await context.close();

  await page.goto(`/app/jobs/${JOB}`);
  await expect(page.locator("#revision")).toContainText("Score confirmé après vérification");
});

test("la page publique du matching et l'admin IA sont accessibles", async ({ page }) => {
  await page.goto("/comment-fonctionne-le-matching");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Comment fonctionne le matching",
  );
  await expect(page.getByRole("main")).toContainText("Ce que nous n'utilisons jamais");
  await expectAccessible(page);

  await logIn(page, demo.admin, undefined, "/admin/ia");
  for (const tab of ["consommation", "poids", "revisions"]) {
    await page.goto(`/admin/ia?onglet=${tab}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("IA et matching");
    await expectAccessible(page);
  }
});
