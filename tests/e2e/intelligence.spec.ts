import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, fictiveDocx, finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";

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
test("score expliqué, import de CV et révision humaine", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const email = testEmail("matching");
  await signUpTalent(page, email);

  // Without skills, no score: the talent is invited to add them. (On a phone, the first profile
  // of Modèle B already asks for three skills.)
  await page.goto(`/app/jobs/${JOB}`);
  if (!isMobile)
    await expect(page.getByRole("link", { name: "Ajouter mes compétences" }).first()).toBeVisible();

  // A Word CV → « Lu dans votre fichier · à vérifier » → profile (lot 6c: the file is read, never kept).
  // On a phone, « Créer un CV · Importer » (docs/carriere-v3, captures 13 to 15).
  await page.goto(isMobile ? "/app/career/cv/nouveau?etape=import" : "/app/profil/import");
  await expect(page.getByRole("heading", { name: "Importer un CV", level: 1 })).toBeVisible();
  // The field sends its form once hydrated: try again if the file was chosen too early.
  await expect(async () => {
    await page
      .locator(isMobile ? "#cv-nouveau-fichier" : "#import-fichier")
      .setInputFiles(
        fictiveDocx([
          "Assistante administrative.",
          "Maîtrise de Microsoft Excel et de l'archivage.",
        ]),
      );
    await expect(
      page.getByText(
        isMobile ? "Voici ce qu’Orbi a trouvé" : "Lu dans « cv-fictif.docx » · à vérifier",
      ),
    ).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  if (isMobile) {
    await expect(page.getByRole("checkbox", { name: /compétence/ })).toBeChecked();
    await page.getByRole("button", { name: "Ajouter à mon profil et créer le CV" }).click();
    await page.waitForURL(/etape=contenu/);
    await page.goto("/app/career/cv");
    await expect(page.locator(".nb-ca").first()).toContainText("Excel");
  } else {
    await expect(page.getByRole("switch", { name: /compétence/ })).toBeChecked();
    await page.getByRole("button", { name: "Ajouter à mon profil" }).click();
    await expect(page).toHaveURL(/\/app\/profil\?import=/);
    await expect(page.locator("#competences")).toContainText("Excel");
  }

  // The score and its « Pourquoi ? », with what is missing.
  // (planche talent-1 § 4: the reasons open in a sheet over the offer).
  // On a phone (Modèle B), the offer's Orbi card links to the full score (`?pourquoi=1`).
  if (isMobile) {
    await page.goto(`/app/jobs/${JOB}`);
    await page.getByRole("link", { name: "Voir le détail du score" }).click();
    await expect(page).toHaveURL(/pourquoi=1/);
  } else {
    await page.goto(`/app/jobs/${JOB}`);
    await page.getByRole("button", { name: /^Pourquoi \d+ % \?/ }).click();
  }
  const why = page.getByRole("dialog", { name: /Pourquoi \d+ % \?/ });
  await expect(why).toBeVisible();
  await expect(why).toContainText("Compétences requises");
  await expect(why.getByRole("link", { name: "Comment fonctionne le matching" })).toBeVisible();
  await expect(page.locator(".t-cmp")).toContainText("Word");

  // Human review.
  await why.getByRole("button", { name: "Contester ce score" }).click();
  const contest = page.getByRole("dialog", { name: "Signaler une erreur sur ce score" });
  await contest.getByText("Une compétence que j'ai n'est pas prise en compte").click();
  await contest
    .getByLabel("Expliquez en quelques mots")
    .fill("J'utilise Word tous les jours depuis trois ans.");
  await contest.getByRole("button", { name: "Demander une révision humaine" }).click();
  await expect(
    page.getByRole("dialog", { name: "Signaler une erreur sur ce score" }),
  ).toContainText("Votre demande est enregistrée");

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

  await page.goto(`/app/jobs/${JOB}?pourquoi=1`);
  await expect(page.getByRole("dialog", { name: /Pourquoi \d+ % \?/ })).toContainText(
    "Score confirmé après vérification",
  );
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
