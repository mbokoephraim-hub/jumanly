import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { lastCode } from "./outbox";
import { demo, logIn, testEmail } from "./session";

/** A new RH account with its organization (inscription, profil « Professionnel RH », Free). */
async function signUpRecruiter(page: Page, email: string, orgName: string) {
  await page.goto("/inscription?profil=rh");
  await page.getByRole("button", { name: "Continuer" }).click();
  if (page.url().includes("/inscription/forfait")) {
    await page.getByRole("button", { name: "Continuer" }).click();
  }
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await page.locator('input[name="firstName"]').fill("Chanelle");
  await page.locator('input[name="lastName"]').fill("Fictive");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("kinshasa-2026");
  await page.locator('select[name="country"]').selectOption("CI");
  await page.locator('input[name="city"]').fill("Abidjan");
  await page.locator('input[name="orgName"]').fill(orgName);
  for (const name of ["terms", "ai", "age"]) await page.locator(`input[name="${name}"]`).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await page.locator('input[name="code"]').fill(await lastCode(email, since));
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Aller au tableau de bord" }).click();
  await expect(page).toHaveURL(/\/app\/hire/);
}

async function newPage(browser: Browser, baseURL: string | undefined, isMobile: boolean) {
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  return context.newPage();
}

// E4 definition of done: recruiter publishes → talent applies → recruiter moves the candidate →
// message → decision → the talent sees the status.
test("un recruteur publie, un talent postule, échange puis reçoit une décision", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const title = `Analyste de données junior ${Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6)}`;
  await signUpRecruiter(page, testEmail("rh"), "Cabinet fictif e2e");

  // Publish a job.
  await page.goto("/app/hire/offres/nouvelle");
  await page.locator("#job-title").fill(title);
  await page.locator("#job-city").fill("Abidjan");
  await page.locator("#job-country").fill("Côte d'Ivoire");
  await page.locator("#job-salaryMin").fill("400");
  await page.locator("#job-salaryMax").fill("700");
  await page
    .locator("#job-description-text")
    .fill(
      "Poste fictif de test : analyser des données de ventes et préparer des tableaux de bord.",
    );
  await page
    .locator("#job-responsibilities")
    .fill("Préparer les rapports mensuels\nNettoyer les données");
  await page.locator("#job-requiredSkills").fill("Analyse de données");
  await page.getByRole("button", { name: "Publier l'offre" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?publiee=1/);
  await expect(page.getByRole("main")).toContainText("Votre offre est en ligne !");
  const pipelineUrl = page.url().split("?")[0]!;
  const publicHref = await page
    .getByRole("link", { name: "Aperçu de votre offre" })
    .first()
    .getAttribute("href");
  const slug = publicHref!.split("/").pop()!;

  // The talent applies from the signed-in offer page.
  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, demo.talentFree);
  await talent.goto(`/app/jobs/${slug}`);
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText(title);
  await talent.locator('select[name="cv"]').selectOption("");
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByText("Candidature envoyée !")).toBeVisible();

  // The recruiter sees a notification, opens the candidate and moves them to « Entretien ».
  await page.goto("/app/notifications");
  await expect(page.getByRole("main")).toContainText(
    `Nouvelle candidature de Amani Fictif pour « ${title} »`,
  );
  await page.goto(pipelineUrl);
  await page.getByRole("link", { name: "Amani Fictif" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/candidats\//);
  const candidateUrl = page.url();
  await page.locator("#move-stage").selectOption({ label: "Entretien" });
  await page.getByRole("button", { name: "Déplacer", exact: true }).click();
  await expect(page.getByRole("main")).toContainText(
    "Le candidat a été informé du changement d'étape.",
  );
  await expect(page.locator("section").filter({ has: page.locator("#historique") })).toContainText(
    "vers « Entretien »",
  );

  // A note stays inside the team.
  await page
    .locator("textarea[name=body]")
    .fill("Bonne maîtrise des tableaux croisés, à confirmer en entretien.");
  await page.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(page.locator("#notes")).toContainText("Bonne maîtrise des tableaux croisés");

  // Message from the recruiter, answer from the talent.
  await page.getByRole("link", { name: "Envoyer un message" }).click();
  await expect(page).toHaveURL(/\/app\/messages\//);
  const threadUrl = page.url().split("#")[0]!;
  await page
    .locator("#message-body")
    .fill("Bonjour, êtes-vous disponible mardi pour un entretien ?");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("main")).toContainText("êtes-vous disponible mardi");

  await talent.goto("/app/messages");
  await talent.getByRole("link", { name: new RegExp(title) }).click();
  await expect(talent.getByRole("main")).toContainText("êtes-vous disponible mardi");
  await talent.locator("#message-body").fill("Bonjour, oui, mardi me convient.");
  await talent.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(talent.getByRole("main")).toContainText("mardi me convient");

  // The talent never sees the team's notes; the status says « Entretien ».
  await talent.goto("/app/jobs/candidatures");
  const card = talent.locator("li").filter({ hasText: title }).first();
  await expect(card).toContainText("Entretien");
  await expect(talent.getByRole("main")).not.toContainText("tableaux croisés");

  // Decision, with a human message.
  await page.goto(threadUrl);
  await expect(page.getByRole("main")).toContainText("mardi me convient");
  await page.goto(`${candidateUrl}?decision=refus#decision`);
  await page.locator("#reject-reason").selectOption("otherCandidate");
  await page.getByRole("button", { name: "Confirmer" }).click();
  await expect(page.getByRole("main")).toContainText("Décision enregistrée.");

  await talent.goto("/app/jobs/candidatures?onglet=terminees");
  await expect(talent.locator("li").filter({ hasText: title }).first()).toContainText(
    "Non retenue",
  );
  await talent.goto("/app/notifications");
  await expect(talent.getByRole("main")).toContainText(
    `n'a pas retenu votre candidature à « ${title} »`,
  );
  await talent.context().close();
});

test("une organisation ne voit jamais les offres ni les candidats d'une autre", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  await logIn(page, "entreprise@jumanly.test");
  await page.goto("/app/hire/offres?onglet=toutes");
  const href = await page
    .locator('main a[href^="/app/hire/offres/"]')
    .filter({ hasNotText: /Nouvelle|Créer/ })
    .first()
    .getAttribute("href");
  const jobId = href!.split("/")[4]!;

  const other = await newPage(browser, baseURL, isMobile);
  await logIn(other, "rh@jumanly.test");
  for (const path of [`/app/hire/offres/${jobId}`, `/app/hire/offres/${jobId}/modifier`]) {
    // Streamed pages keep a 200 status: what matters is that nothing of the job is shown.
    await other.goto(path);
    await expect(other.getByRole("heading", { level: 1 }), path).toHaveText("Page introuvable");
  }
  expect((await other.request.get(`/app/hire/candidats/inconnu/cv`)).status()).toBe(404);
  await other.context().close();
});

test("un talent sans organisation n'accède pas à Hire", async ({ page }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/hire");
  await expect(page).toHaveURL(/\/app$/);
});

test("les écrans Hire et Connect sont accessibles", async ({ page }) => {
  await logIn(page, "rh@jumanly.test");
  for (const path of [
    "/app/hire",
    "/app/hire/offres",
    "/app/hire/offres/nouvelle",
    "/app/organisation?onglet=membres",
    "/app/messages",
    "/app/notifications",
  ]) {
    await page.goto(path);
    await expectAccessible(page);
  }
});

test("l'admin consulte la modération des offres et les signalements", async ({ page }) => {
  await logIn(page, demo.admin);
  await page.goto("/admin/offres");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modération des offres");
  await expectAccessible(page);
  await page.goto("/admin/signalements");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signalements");
  await expectAccessible(page);
});
