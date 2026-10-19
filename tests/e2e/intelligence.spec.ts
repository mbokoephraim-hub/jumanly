import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";

const JOB = "demo-assistant-administratif-kinshasa";

async function signUpTalent(page: Page, email: string) {
  await page.goto(`/offres/${JOB}`);
  const href = await page
    .getByRole("link", { name: "Postuler gratuitement" })
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await signUpWithEmail(page, email);
  await finishOnboarding(page, { country: "Congo", city: "Kinshasa" });
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
