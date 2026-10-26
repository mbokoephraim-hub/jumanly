import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { lastCode } from "./outbox";
import { demo, logIn, testEmail } from "./session";
import { openCandidateFile } from "./hire-wide";
import { phoneRecruiterWithPage } from "./recruiter-phone";

/** A new RH account with its organization (inscription, profil « Professionnel RH », Free). */
async function signUpRecruiter(page: Page, email: string, orgName: string) {
  await page.goto("/inscription?profil=rh");
  // On a phone, the recruiter's sign-up of Modèle B: the company page is created at step 5.
  if (await page.locator(".nb-ecran").count()) {
    await phoneRecruiterWithPage(page, email, orgName);
    execFileSync("pnpm", ["exec", "tsx", "tests/e2e/verify-org.ts", email]);
    return;
  }
  // Recruiters go straight to the plan step (refonte mobile, lot 2).
  await expect(page).toHaveURL(/\/inscription\/forfait/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await page.locator('input[name="name"]').fill("Chanelle Fictive");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("kinshasa-2026");
  await page.locator('select[name="country"]').selectOption("CI");
  await page.locator('input[name="city"]').fill("Abidjan");
  await page.locator('input[name="orgName"]').fill(orgName);
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await page.getByLabel("Code à 6 chiffres").fill(await lastCode(email, since));
  await page.getByRole("button", { name: "Valider" }).click();
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  // First steps of a recruiter (planche recruteur-3 OBR1 to OBR3).
  await expect(page.getByRole("heading", { name: "Vous recrutez pour…" })).toBeVisible();
  await page.getByText("Mon entreprise").click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Votre organisation", exact: true }),
  ).toBeVisible();
  await page.locator("#rh-ob-size").selectOption("11-50");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(
    page.getByRole("heading", { name: "Votre espace recruteur est prêt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page).toHaveURL(/\/app\/hire/);
  // Verified by Jumanly (as an administrator would do it): its offers publish at once (§ 2.11).
  execFileSync("pnpm", ["exec", "tsx", "tests/e2e/verify-org.ts", email]);
}

async function newPage(browser: Browser, baseURL: string | undefined, isMobile: boolean) {
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  return context.newPage();
}

/** Publishes a job with the defaults the journeys need; returns its candidates board and slug. */
async function publishJob(page: Page, title: string) {
  await fillOffer(page, {
    title,
    salary: ["400", "700"],
    description:
      "Poste fictif de test : analyser des données de ventes et préparer des tableaux de bord.",
    responsibilities: ["Préparer les rapports mensuels", "Nettoyer les données"],
    skill: "Analyse de données",
  });
  const { jobId } = await publishFilledOffer(page, "Publier");
  await expect(page.getByRole("main")).toContainText(/Offre publiée|Votre offre est en ligne/);
  const slug = await slugOf(page);
  return { pipelineUrl: `/app/hire/candidats?offre=${jobId}`, slug };
}

/** The talent applies with their Jumanly profile from the signed-in offer page. */
async function applyTo(talent: Page, slug: string, title: string) {
  await talent.goto(`/app/jobs/${slug}`);
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText(title);
  // Postuler (planche talent-2 § 1): the CV proposed first, nothing to add, then sending.
  await talent.goto(`/app/jobs/${slug}/postuler`);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
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

  const { pipelineUrl, slug } = await publishJob(page, title);

  // The talent applies from the signed-in offer page.
  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, demo.talentFree);
  await applyTo(talent, slug, title);

  // The recruiter sees a notification, opens the candidate and moves them to « Entretien ».
  await page.goto("/app/notifications");
  await expect(page.getByRole("main")).toContainText(
    `Nouvelle candidature de Amani Fictif pour « ${title} »`,
  );
  // Lot 3: the candidates of the offer, then the file; « Changer d'étape » moves to « Entretien ».
  await page.goto(pipelineUrl);
  await openCandidateFile(page, /Amani Fictif/);
  const candidateUrl = page.url().split("?")[0]!;
  if (isMobile) {
    // Modèle B recruteur (M5): the same steps through the phone file's sheets.
    const file = page.locator(".nb-rh-fiche").filter({ visible: true });
    await file.getByRole("button", { name: /^Changer d'étape, actuellement/ }).click();
    await page
      .getByRole("dialog", { name: "Changer d'étape" })
      .getByRole("button", { name: "Entretien", exact: true })
      .click();
    await expect(page).toHaveURL(/ok=deplacee/);
    await file.getByRole("tab", { name: /^Historique/ }).click();
    await expect(file).toContainText("vers « Entretien »");
    await file.getByRole("tab", { name: /^Notes/ }).click();
    await file
      .getByLabel("Note pour l'équipe")
      .fill("Bonne maîtrise des tableaux croisés, à confirmer en entretien.");
    await file.getByRole("button", { name: "Ajouter" }).click();
    await expect(file).toContainText("Bonne maîtrise des tableaux croisés");
    await page.getByRole("link", { name: "Écrire au candidat" }).filter({ visible: true }).click();
  } else {
    await page.getByRole("button", { name: "Changer d'étape" }).click();
    const move = page.locator("#rc-etape");
    await move.locator("label").filter({ hasText: "Entretien" }).click();
    await move.getByRole("button", { name: "Déplacer", exact: true }).click();
    await expect(page).toHaveURL(/ok=deplacee/);
    await expect(page.locator("#historique")).toContainText("vers « Entretien »");

    // A note stays inside the team.
    // On a computer the file's sections are open from the start (web recruteur 2).
    await expect(async () => {
      if (!(await page.locator("#rc-note").isVisible()))
        await page.locator("#notes > summary").click();
      await expect(page.locator("#rc-note")).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await page
      .locator("#rc-note")
      .fill("Bonne maîtrise des tableaux croisés, à confirmer en entretien.");
    await page.getByRole("button", { name: "Ajouter la note" }).click();
    await expect(page.locator("#notes")).toContainText("Bonne maîtrise des tableaux croisés");

    // Message from the recruiter, answer from the talent.
    await page.getByRole("link", { name: "Envoyer un message" }).click();
  }
  await expect(page).toHaveURL(/\/app\/messages\//);
  const threadUrl = page.url().split("#")[0]!;
  // On a phone (Modèle B recruteur, M7) the composer is the field « Votre message ».
  await (
    isMobile ? page.getByRole("textbox", { name: "Votre message" }) : page.locator("#r5-corps")
  ).fill("Bonjour, êtes-vous disponible mardi pour un entretien ?");
  await page.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page.getByRole("main")).toContainText("êtes-vous disponible mardi");

  await talent.goto(threadUrl);
  await expect(talent.getByRole("main")).toContainText("êtes-vous disponible mardi");
  // On a phone (Modèle B, lot B8) the composer is the field « Écrire un message ».
  await (
    isMobile
      ? talent.getByRole("textbox", { name: "Écrire un message" })
      : talent.locator("#cv-corps")
  ).fill("Bonjour, oui, mardi me convient.");
  await talent.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(talent.getByRole("main")).toContainText("mardi me convient");

  // The talent never sees the team's notes; the status says « Entretien ».
  await talent.goto("/app/suivi");
  // On a phone (Modèle B, lot B9) Suivi is the tab Candidatures of Carrière.
  const card = (isMobile ? talent.locator("#car-panneau a") : talent.locator("li"))
    .filter({ hasText: title })
    .first();
  await expect(card).toContainText("Entretien");
  await expect(talent.getByRole("main")).not.toContainText("tableaux croisés");

  // Decision, with a human message.
  await page.goto(threadUrl);
  await expect(page.getByRole("main")).toContainText("mardi me convient");
  // Lot 3: « Décision finale », the message read before it leaves, then 10 minutes to undo.
  if (isMobile) {
    // On the phone the outcome is decided from the file's sheet « Ne pas retenir ».
    await page.goto(candidateUrl);
    const file = page.locator(".nb-rh-fiche").filter({ visible: true });
    await file.getByRole("button", { name: /^Plus d'actions pour/ }).click();
    await page
      .getByRole("dialog")
      .filter({ visible: true })
      .getByRole("button", { name: /^Ne pas retenir/ })
      .click();
    const reject = page.getByRole("dialog", { name: /^Ne pas retenir / });
    await reject.getByRole("radio", { name: "Autre candidat plus proche" }).click();
    await expect(reject.getByLabel("Message envoyé")).toContainText("Amani");
    await reject
      .getByLabel("Message envoyé")
      .fill(
        `Bonjour Amani,\n\nMerci pour votre candidature au poste de ${title}. Nous avons retenu un autre profil.`,
      );
    await reject.getByRole("button", { name: "Envoyer et ne pas retenir" }).click();
    await expect(page.getByText("Décision envoyée avec son message.")).toBeVisible();
  } else {
    await page.goto(`${candidateUrl}?decision=refus`);
    await expect(page).toHaveURL(/\/decision\?issue=rejected/);
    const message = page.locator(".t-rc-msg");
    await expect(message.locator("mark").filter({ hasText: "Amani" })).toBeVisible();
    await expect(message).toContainText(title);
    await page.getByRole("link", { name: "Court", exact: true }).click();
    await expect(message).toContainText("Nous avons retenu un autre profil.");
    await page.locator("#rc-motif").selectOption("otherCandidate");
    await page.getByRole("button", { name: "Confirmer et envoyer" }).click();
    await expect(page.getByRole("heading", { name: "Décision enregistrée" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Annulable encore");
  }

  // The talent receives a decision card, never a bubble, with real ways to bounce back.
  await talent.goto(threadUrl);
  const decision = talent.locator("li").filter({ hasText: "Candidature non retenue" });
  await expect(decision).toContainText("Bonjour Amani,");
  await expect(decision).toContainText("Nous avons retenu un autre profil.");
  await expect(decision).toContainText("Recrutement");
  await expect(decision).toContainText("Ce n'est pas la fin du parcours.");

  await talent.goto("/app/suivi?vue=terminees");
  await expect(
    (isMobile ? talent.locator("#car-panneau a") : talent.locator("li"))
      .filter({ hasText: title })
      .first(),
  ).toContainText("Non retenue");
  await talent.goto("/app/notifications");
  // On a phone (Modèle B, lot B3), the notification is a sentence: « … n'a pas retenu … ».
  await expect(
    talent
      .getByRole("button", { name: /^Candidature non retenue|n'a pas retenu votre candidature/ })
      .first(),
  ).toContainText(title);
  await talent.context().close();
});

// Prompt 5 bis (V7, screen 80): an acceptance written from a well-made model, in three tones, with
// the values filled in by Jumanly highlighted; nothing leaves before the recruiter's click.
test("le recruteur accepte un candidat avec un modèle au ton choisi", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const title = `Comptable fictif ${Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6)}`;
  await signUpRecruiter(page, testEmail("rh-accept"), "Cabinet fictif acceptation");
  const { pipelineUrl, slug } = await publishJob(page, title);
  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, demo.talentFree);
  await applyTo(talent, slug, title);

  await page.goto(pipelineUrl);
  await openCandidateFile(page, /Amani Fictif/);
  const candidateUrl = page.url().split("?")[0]!;
  if (isMobile) {
    // Modèle B recruteur (M5): « Retenue » opens the sheet « Recruter » with its message.
    await page.getByRole("link", { name: "Écrire au candidat" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/app\/messages\//);
    const threadUrl = page.url().split("#")[0]!;
    await page.goto(candidateUrl);
    const file = page.locator(".nb-rh-fiche").filter({ visible: true });
    await file.getByRole("button", { name: /^Changer d'étape, actuellement/ }).click();
    await page
      .getByRole("dialog", { name: "Changer d'étape" })
      .getByRole("button", { name: "Retenue", exact: true })
      .click();
    const recruit = page.getByRole("dialog", { name: /^Recruter / });
    const field = recruit.getByLabel("Message envoyé");
    await expect(field).toContainText("Amani");
    await field.fill(
      `${await field.inputValue()}\n\nNous revenons vers vous pour fixer votre arrivée.\n\nÀ très vite dans l'équipe.`,
    );
    await recruit.getByRole("button", { name: "Envoyer et recruter" }).click();
    await expect(page.getByText("Décision envoyée avec son message.")).toBeVisible();
    await talent.goto(threadUrl);
    const decision = talent.locator("li").filter({ hasText: "Candidature retenue" });
    await expect(decision).toContainText("Nous revenons vers vous pour fixer votre arrivée.");
    await expect(decision).toContainText("À très vite dans l'équipe.");
    await talent.context().close();
    return;
  }
  await page.getByRole("link", { name: "Envoyer un message" }).click();
  await expect(page).toHaveURL(/\/app\/messages\//);
  const threadUrl = page.url().split("#")[0]!;
  // Lot 3: no result is chosen in advance; « Retenue » prepares the message, highlighted.
  await page.goto(`${candidateUrl}/decision`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1, name: "Décision finale" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Confirmer et envoyer" })).toHaveCount(0);
  await main.getByRole("link", { name: /^Retenue/ }).click();
  const model = main.locator(".t-rc-msg");
  await expect(model).toContainText("Bonne nouvelle : votre candidature au poste de");
  await expect(model.locator("mark").filter({ hasText: "Amani" })).toBeVisible();
  await expect(model.locator("mark").filter({ hasText: title })).toBeVisible();
  await expect(main.getByRole("link", { name: "Chaleureux" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await main.getByRole("link", { name: "Formel" }).click();
  await expect(model).toContainText("Nous avons le plaisir de vous informer");
  await main.getByRole("link", { name: "Court" }).click();
  await expect(model).toContainText("Nous revenons vers vous pour fixer votre arrivée.");
  await expect(model).not.toContainText("Nous avons le plaisir");
  // « Modifier le message »: the text sent is the one read.
  await model.getByRole("button", { name: "Modifier le message" }).click();
  const field = model.locator("textarea[name=message]");
  await field.fill(`${await field.inputValue()}\n\nÀ très vite dans l'équipe.`);
  await expectAccessible(page);
  await main.getByRole("button", { name: "Confirmer et envoyer" }).click();
  await expect(page.getByRole("heading", { name: "Décision enregistrée" })).toBeVisible();

  await talent.goto(threadUrl);
  const decision = talent.locator("li").filter({ hasText: "Candidature retenue" });
  await expect(decision).toContainText("Votre candidature au poste de");
  await expect(decision).toContainText("Nous revenons vers vous pour fixer votre arrivée.");
  await expect(decision).toContainText("À très vite dans l'équipe.");
  await talent.context().close();
});

test("une organisation ne voit jamais les offres ni les candidats d'une autre", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  await logIn(page, "entreprise@jumanly.test");
  await page.goto("/app/hire/offres");
  const href = await page
    .locator('main a[href^="/app/hire/offres/"]:not([href$="/nouvelle"])')
    .filter({ visible: true })
    .filter({ hasNotText: /Nouvelle|Créer|Publier/ })
    .first()
    .getAttribute("href");
  const jobId = href!.split("/")[4]!.split("?")[0]!;

  const other = await newPage(browser, baseURL, isMobile);
  await logIn(other, "rh@jumanly.test");
  for (const path of [
    `/app/hire/offres/${jobId}`,
    `/app/hire/offres/${jobId}/modifier`,
    `/app/hire/offres/${jobId}/fiche`,
    `/app/hire/candidats?offre=${jobId}`,
  ]) {
    // Streamed pages keep a 200 status: what matters is that nothing of the job is shown.
    await other.goto(path);
    await expect(other.getByRole("heading", { level: 1 }), path).toHaveText(
      "Cette page est introuvable",
    );
  }
  expect((await other.request.get(`/app/hire/candidats/inconnu/cv`)).status()).toBe(404);
  await other.context().close();
});

test("un talent sans organisation n'accède pas à Hire", async ({ page }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/hire");
  await expect(page).toHaveURL(/\/app\/acces-refuse$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Vous n'avez pas accès à cette page",
  );
});

test("les écrans Hire et Connect sont accessibles", async ({ page }) => {
  await logIn(page, "rh@jumanly.test");
  for (const path of [
    "/app/hire",
    "/app/hire/offres",
    "/app/hire/offres/nouvelle",
    "/app/organisation/equipe",
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

// Prompt 4 bis (screens 63 to 66): an administrator frames the company's banner and logo; every
// offer shows them, and removing the banner brings the Jumanly pattern back.
test("l'administrateur pose la bannière et le logo de l'entreprise", async ({ page, isMobile }) => {
  // The company's pages are on a computer only (étape 3): a phone shows « À ouvrir sur un
  // ordinateur » there (tests/e2e/web-admin-equipe.spec.ts).
  test.skip(isMobile, "La page entreprise se modifie sur ordinateur.");
  test.setTimeout(120_000);
  await signUpRecruiter(page, testEmail("marque"), "Marque fictive e2e");
  await page.goto("/app/organisation/modifier");
  const main = page.locator("main").filter({ visible: true });
  const picture = await sharp({
    create: { width: 1200, height: 600, channels: 3, background: "#1FA98A" },
  })
    .png()
    .toBuffer();

  await main.getByRole("button", { name: "Bannière" }).click();
  const dialog = page.getByRole("dialog", { name: "Bannière de l'entreprise" });
  await expect(dialog).toBeVisible();
  await expectAccessible(page);
  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: "banniere.png", mimeType: "image/png", buffer: picture });
  await dialog.getByRole("group", { name: /Cadrage de l'image/ }).press("ArrowLeft");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();
  await expect(dialog).toHaveCount(0);
  const banner = main.locator('img[src^="/medias/orgs/"][src*="/banner-"]');
  await expect(banner).toBeVisible();
  const src = await banner.getAttribute("src");
  expect((await page.request.get(src!)).headers()["content-type"]).toBe("image/webp");

  await main.getByRole("button", { name: "Logo" }).click();
  const logo = page.getByRole("dialog", { name: "Logo de l'entreprise" });
  await logo
    .locator('input[type="file"]')
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: picture });
  await logo.getByRole("button", { name: "Enregistrer" }).click();
  await expect(main.getByRole("img", { name: "Logo de Marque fictive e2e" })).toBeVisible();

  // The job editor shows the same identity and the card as talents will see it.
  // « Vérifier et publier » previews the offer with the banner (brief recruteur § 2.10).
  await fillOffer(page, {
    title: "Chargé de clientèle fictif",
    description: "Poste fictif de test : accueillir et conseiller la clientèle.",
    responsibilities: ["Accueillir la clientèle"],
    skill: "Bureautique",
  });
  const editor = page.locator("main").filter({ visible: true });
  // On a phone the card of step 4 shows the logo (Modèle B recruteur, M4), on a computer the
  // « Aperçu de l'annonce » beside the form shows the banner.
  const shown =
    test.info().project.name === "mobile"
      ? editor.locator('.nb-rh-apercu-offre img[src^="/medias/orgs/"]')
      : editor.locator(`img[src="${src}"]`);
  await expect(shown.filter({ visible: true }).first()).toBeVisible();

  await page.goto("/app/organisation/modifier");
  await main.getByRole("button", { name: "Bannière" }).click();
  await page.getByRole("button", { name: "Retirer la bannière" }).click();
  await expect(main.locator('img[src^="/medias/orgs/"][src*="/banner-"]')).toHaveCount(0);
});
