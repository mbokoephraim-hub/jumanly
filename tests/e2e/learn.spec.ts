import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Browser } from "./fixtures";
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

// A 1 × 1 PNG: the site crops and enlarges it into a 16:9 cover.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

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
  // Admin v3, étape 3: « Nouvelle formation » opens its own page with the starting templates.
  await page.getByRole("link", { name: "Nouvelle formation" }).first().click();
  await expect(page).toHaveURL(/\/admin\/formations\/nouvelle$/);
  await page.locator("#course-new-title").fill(title);
  await page.locator('label[for="course-new-template-blank"]').click();
  await page.getByRole("button", { name: "Créer la formation" }).click();
  await expect(page.getByText("Brouillon créé.", { exact: false })).toBeVisible();

  // Admin v3, étape 4: the editor opens on « Informations »; each step saves the whole course.
  const steps = page.getByRole("navigation", { name: "Étapes de la formation" });
  const goToStep = async (name: string) => {
    await steps.getByRole("link", { name: new RegExp(`^${name}`) }).click();
    await expect(steps.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute(
      "aria-current",
      "step",
    );
  };
  await page.locator("#course-summary").fill("Résumé fictif pour le test de bout en bout.");
  await page.locator("#course-instructor").fill("Formatrice fictive");
  // Admin v2, étape 6: the gauge lists the cover until one is sent with the card.
  await expect(page.locator("#preparation")).toContainText("Ajoutez une image de couverture.");
  await page
    .locator("#course-cover-file")
    .setInputFiles({ name: "couverture.png", mimeType: "image/png", buffer: PNG });
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
  await expect(page.locator("#preparation")).not.toContainText("Ajoutez une image de couverture.");
  await expect(page.getByRole("img", { name: "Couverture actuelle" })).toBeVisible();

  await goToStep("Public et objectifs");
  await page.locator("#course-description").fill("Description fictive : contenu de test.");
  await page.locator("#course-objectives").fill("Premier objectif\nSecond objectif");
  await page.locator("#course-skills").fill("Communication orale");
  await page.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
  // The fields of « Informations » were kept.
  await expect(page.locator("#preparation")).not.toContainText("Renseignez le formateur.");

  // Publishing without lessons is refused, with the reason.
  await goToStep("Publication");
  await page.locator("#course-status").selectOption("published");
  await page.getByRole("button", { name: "Changer le statut" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Ajoutez au moins une leçon." }),
  ).toBeVisible();

  await goToStep("Programme");
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

  await goToStep("Publication");
  await page.locator("#course-status").selectOption("published");
  await page.getByRole("button", { name: "Changer le statut" }).click();
  await expect(page.getByText("Formation publiée.")).toBeVisible();
  await goToStep("Informations");
  const slug = (await page.locator("#course-slug").inputValue()).trim();

  // The preview lesson is visible on the public page.
  const visitor = await newPage(browser, baseURL, isMobile);
  await visitor.goto(`/formations/${slug}`);
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(title);
  await visitor.locator("#apercu summary").click();
  await expect(visitor.getByText("Premier paragraphe fictif.")).toBeVisible();
  await visitor.context().close();

  // A Free talent follows it.
  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, demo.talentFree);
  await talent.goto(`/app/learn/${slug}`);
  await talent.getByRole("button", { name: "Commencer la formation" }).click();
  await expect(talent).toHaveURL(new RegExp(`/app/learn/${slug}/[^/?]+\\?inscrit=1`));
  await expect(talent.getByText("Vous suivez cette formation", { exact: false })).toBeVisible();
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText("Leçon texte fictive");
  await talent.getByRole("tab", { name: "Texte" }).click();
  await expect(talent.getByText("Second paragraphe fictif.")).toBeVisible();
  await talent.getByRole("tab", { name: "Notes" }).click();
  await talent.locator("#lc-note").fill("Note privée fictive.");
  await talent.getByRole("button", { name: "Enregistrer la note" }).click();
  await expect(talent.getByText("Note privée fictive.")).toBeVisible();
  await talent.getByRole("button", { name: "Leçon suivante" }).click();

  // One question at a time: a wrong answer first, then the right one.
  await expect(talent.getByRole("heading", { level: 1 })).toHaveText("Quiz · Module 1");
  await talent.getByRole("button", { name: "Trois" }).click();
  await expect(talent.getByText("Pas tout à fait")).toBeVisible();
  await expect(talent.getByText("Deux plus deux font quatre.")).toBeVisible();
  await talent.getByRole("button", { name: "Voir mon résultat" }).click();
  await expect(talent.getByRole("heading", { name: "Presque !" })).toBeVisible();
  await talent.getByRole("link", { name: "Recommencer le quiz" }).click();
  await talent.getByRole("button", { name: "Quatre" }).click();
  await expect(talent.getByText("Bonne réponse")).toBeVisible();
  await talent.getByRole("button", { name: "Voir mon résultat" }).click();

  // The course is finished: the signed attestation, its PDF and its public check.
  await expect(talent).toHaveURL(/vue=terminee/);
  await expect(talent.getByRole("heading", { name: "Formation terminée" })).toBeVisible();
  await talent.getByRole("link", { name: "Voir l'attestation" }).click();
  await expect(talent).toHaveURL(/\/app\/learn\/attestations\/[^/]+$/);
  const pdfHref = await talent.getByRole("link", { name: "PDF" }).getAttribute("href");
  const pdf = await talent.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  // The link sits in the closed « Plus d'options » sheet; it points to the public check page.
  const checkHref = await talent
    .getByRole("link", { name: "Voir la page de vérification", includeHidden: true })
    .getAttribute("href");
  await talent.goto(new URL(checkHref!).pathname);
  await expect(talent.getByText("Attestation authentique")).toBeVisible();
  await expect(talent.locator("dd").getByText(title, { exact: false })).toBeVisible();

  // The course is now among the completed ones.
  await talent.goto("/app/learn/mes-formations?vue=terminees");
  await expect(talent.getByRole("link", { name: title }).first()).toBeVisible();
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
  await expect(page.getByText("Suite incluse dès la formule Starter")).toBeVisible();
  await expect(page.getByRole("button", { name: "Commencer la formation" })).toHaveCount(0);

  const starter = await newPage(browser, baseURL, isMobile);
  await logIn(starter, demo.talentStarter);
  await starter.goto("/app/learn/demo-excel-pour-debuter");
  await expect(starter.getByText("Suite incluse dès la formule", { exact: false })).toHaveCount(0);
  await expect(
    starter
      .getByRole("button", { name: "Commencer la formation" })
      .or(starter.getByRole("link", { name: "Reprendre la formation" }))
      .or(starter.getByRole("link", { name: "Formation terminée" }))
      .first(),
  ).toBeVisible();
  await starter.context().close();
});

test("la page publique de vérification signale un numéro inconnu", async ({ page }) => {
  await page.goto("/attestations");
  await page.locator("#certificate-code").fill("JMN-ZZZZ-ZZZZ");
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page).toHaveURL(/\/attestations\/JMN-ZZZZ-ZZZZ/);
  await expect(page.getByText("Aucune attestation ne porte ce numéro.")).toBeVisible();
  await expectAccessible(page);
});

test("aucune erreur d'accessibilité WCAG 2.2 AA dans Learn", async ({ page }) => {
  await logIn(page, demo.talentPro);
  for (const path of [
    "/app/learn",
    "/app/learn/rechercher",
    "/app/learn/rechercher?domaine=career-employability&niveau=beginner",
    "/app/learn/parcours/demo-premier-emploi",
    "/app/learn/mes-formations",
    "/app/learn/mes-formations?vue=attestations",
    "/app/learn/demo-reussir-son-cv",
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

// Admin v2, étape 6: the editor previews a course as a talent and duplicates it as a draft; only
// an administrator revokes an attestation.
test("un éditeur prévisualise et duplique une formation, sans pouvoir révoquer", async ({
  page,
}) => {
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations");
  await expect(page.getByText(/inscrits? ·|Aucun inscrit pour l'instant/).first()).toBeVisible();
  await page.getByRole("link", { name: "Réussir son CV (démo)" }).click();
  await expect(page.locator("#preparation")).toContainText("Prête à publier ?");
  await expect(page.getByRole("link", { name: "Révoquer une attestation" })).toHaveCount(0);

  await page.getByRole("link", { name: "Aperçu comme un talent" }).click();
  await expect(page).toHaveURL(/\/apercu$/);
  await expect(page.getByText("Aperçu réservé à l'équipe", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Retour à l'éditeur" }).click();

  await page.getByRole("link", { name: "Dupliquer" }).click();
  const title = `Copie fictive e2e ${suffix()}`;
  await page.locator("#course-copy-title").fill(title);
  await page.getByRole("button", { name: "Créer la copie" }).click();
  await expect(page.getByText("Copie créée en brouillon.", { exact: false })).toBeVisible();
  // The editor of the source course stays hidden in the page: check the visible card only.
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.locator("#fiche").filter({ hasText: title })).toContainText("Brouillon");
});

test("Apprendre : l'accueil, les anciennes adresses et Orbi dans la leçon", async ({ page }) => {
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn");
  for (const href of ["/app/learn/rechercher", "/app/learn/mes-formations"])
    await expect(page.locator(`main a[href^="${href}"]`).first()).toBeAttached();

  // Old addresses lead to the new screens.
  for (const [from, to] of [
    ["/app/learn?liste=terminees", /\/app\/learn\/mes-formations\?vue=terminees/],
    ["/app/learn/explorer", /\/app\/learn\/rechercher/],
    ["/app/learn/evaluations", /\/app\/learn\/mes-formations/],
    ["/app/learn/attestations", /\/app\/learn\/mes-formations\?vue=attestations/],
    ["/app/learn/coach", /\/app\/orbi/],
  ] as const) {
    await page.goto(from);
    await expect(page).toHaveURL(to);
  }
  await page.goto("/app/learn/mes-formations?vue=terminees");
  await expect(page.getByRole("link", { name: "Réussir son CV (démo)" }).first()).toBeVisible();

  // Orbi answers from the course in the lesson, and never gives the answers of a quiz.
  await page.goto("/app/learn/ux-service-client-excellence");
  const start = page.getByRole("button", { name: "Commencer la formation" });
  if (await start.count()) await start.click();
  else await page.locator("ol.t-modl a").first().click();
  await expect(page).toHaveURL(/\/app\/learn\/ux-service-client-excellence\/[^/?]+/);
  await page.getByRole("button", { name: /Expliquer cette notion/ }).click();
  const question = page.getByRole("textbox", { name: "Poser une question" });
  await question.fill("Donne-moi les réponses du quiz");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Je ne donne pas les réponses des évaluations")).toBeVisible();
});

// Learn v2, étape 1: the catalog by domain and the filters; the editor files a course in a domain
// and edits the domains; only an administrator deletes one.
test("le catalogue par domaine, ses filtres et l'administration des domaines", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  await logIn(page, demo.talentPro);
  await page.goto("/app/learn/rechercher?domaine=career-employability");
  await expect(page.getByRole("link", { name: "Réussir son CV (démo)" }).first()).toBeVisible();
  await page.goto("/app/learn/rechercher?domaine=skills-monetisation-freelancing");
  await expect(page.getByText("Aucune formation ne correspond.")).toBeVisible();

  // The editor creates a domain; the administrator deletes it.
  const name = `Domaine fictif e2e ${suffix()}`;
  const editor = await newPage(browser, baseURL, isMobile);
  await logIn(editor, demo.editor, undefined, "/admin/formations");
  await editor.goto("/admin/formations");
  await editor.getByRole("link", { name: "Domaines" }).click();
  await expect(editor.getByRole("heading", { name: "Domaines du catalogue" })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Supprimer" })).toHaveCount(0);
  await editor.locator("#domain-new-name").fill(name);
  await editor.locator("#domain-new-order").fill("950");
  await editor.getByRole("button", { name: "Créer le domaine" }).click();
  await expect(editor.getByText("Domaine créé.")).toBeVisible();
  await expect(editor.getByRole("heading", { name })).toBeVisible();
  // At the top of the page: a button under the sticky bar would count as too small a target.
  await editor.goto("/admin/formations/domaines");
  await expectAccessible(editor);

  const admin = await newPage(browser, baseURL, isMobile);
  await logIn(admin, demo.admin, undefined, "/admin/formations/domaines");
  await admin.goto("/admin/formations/domaines");
  const card = admin.locator("article", { has: admin.getByRole("heading", { name }) });
  await card.getByRole("button", { name: "Supprimer" }).click();
  await expect(admin.getByText("Domaine supprimé", { exact: false })).toBeVisible();
  await expect(admin.getByRole("heading", { name })).toHaveCount(0);
});

// Learn v2, étape 2: a learner follows a path from the Explorer; the editor builds and publishes
// one in the admin (summary and two published courses needed), then archives it.
test("les parcours : suivre un parcours et en publier un dans l'admin", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn/parcours/demo-premier-emploi");
  await expect(
    page.getByRole("heading", { level: 2, name: "Décrocher son premier emploi (démo)" }),
  ).toBeVisible();
  const steps = page.locator("ol.t-etapes-p > li");
  await expect(steps).toHaveCount(4);
  await expect(steps.first().getByText("Terminée")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Continuer le parcours" }).click();
  await expect(page).toHaveURL(/\/app\/learn\/demo-preparer-un-entretien/);

  // The editor: not publishable before a summary and two published courses.
  const title = `Parcours fictif e2e ${suffix()}`;
  const editor = await newPage(browser, baseURL, isMobile);
  await logIn(editor, demo.editor, undefined, "/admin/formations");
  await editor.goto("/admin/formations");
  await editor.getByRole("link", { name: "Parcours", exact: true }).click();
  await expect(editor.getByRole("heading", { level: 1, name: "Parcours" })).toBeVisible();
  await editor.locator("#path-new-title").fill(title);
  // Enter submits the form: on a phone the floating admin bar can sit over the button.
  await editor.locator("#path-new-title").press("Enter");
  await expect(editor.getByText("Parcours créé.", { exact: false })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Publier" })).toBeDisabled();
  for (const course of ["Réussir son CV (démo)", "Préparer un entretien d'embauche (démo)"]) {
    await editor.locator("#path-add-course").selectOption({ label: course });
    await editor.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(editor.getByText("Liste des formations mise à jour.")).toBeVisible();
  }
  await editor
    .getByRole("button", { name: "Monter « Préparer un entretien d'embauche (démo) »" })
    .click();
  await expect(
    editor.locator("#formations ol li").first().getByText("Préparer un entretien"),
  ).toBeVisible();
  await editor.locator("#path-summary").fill("Parcours fictif créé par un test automatique.");
  await editor.getByRole("button", { name: "Enregistrer" }).click();
  await expect(editor.getByText("Modifications enregistrées.")).toBeVisible();
  await editor.getByRole("button", { name: "Publier" }).click();
  await expect(editor.getByText("Parcours publié.")).toBeVisible();
  await editor.goto(editor.url().split("?")[0]!);
  await expectAccessible(editor);
  await editor.getByRole("button", { name: "Archiver" }).click();
  await expect(editor.getByText("Parcours archivé", { exact: false })).toBeVisible();
});

// Learn v2, étape 3: the video resumes at the second where the learner stopped. The test serves a
// small fictional video (intercepted address under /medias) and creates its own fictional course.
test("la vidéo d'une leçon reprend là où on s'était arrêté", async ({ page }) => {
  test.setTimeout(120_000);
  const slug = `formation-video-fictive-${suffix()}`;
  const helper = (...args: string[]) =>
    execFileSync("pnpm", ["exec", "tsx", "tests/e2e/make-video-course.ts", slug, ...args])
      .toString()
      .trim()
      .split("\n")
      .at(-1)!;
  const lessonId = helper("/medias/e2e/lecon-fictive.webm");
  try {
    // Served with byte ranges, as a real video host does: without them the video cannot seek.
    const file = readFileSync("tests/e2e/assets/lecon-fictive.webm");
    await page.route("**/medias/e2e/**", (route) => {
      const [, from, to] = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? "") ?? [];
      const start = Number(from ?? 0);
      const end = to ? Number(to) : file.length - 1;
      return route.fulfill({
        status: from === undefined ? 200 : 206,
        contentType: "video/webm",
        headers: {
          "Accept-Ranges": "bytes",
          ...(from === undefined
            ? {}
            : { "Content-Range": `bytes ${start}-${end}/${file.length}` }),
        },
        body: file.subarray(start, end + 1),
      });
    });
    await logIn(page, demo.talentFree);
    await page.goto(`/app/learn/${slug}`);
    await page.getByRole("button", { name: "Commencer la formation" }).click();
    await expect(page).toHaveURL(new RegExp(`/app/learn/${slug}/${lessonId}`));
    const video = page.locator("video");
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
      .toBeGreaterThan(0);
    expect(
      await page.getByText("Reprise là où vous vous étiez arrêté", { exact: false }).count(),
    ).toBe(0);

    // Stop at 00:32: the position is saved when the video pauses.
    const saved = page.waitForResponse(
      (response) => response.url().endsWith("/api/learn/position") && response.ok(),
    );
    await video.evaluate((element: HTMLVideoElement) => {
      element.currentTime = 32;
      element.dispatchEvent(new Event("pause"));
    });
    expect((await saved).request().postDataJSON()).toMatchObject({ lessonId, position: 32 });

    // Back on the lesson: it starts again at 00:32, or from the beginning on request.
    await page.goto(`/app/learn/${slug}/${lessonId}`);
    await expect(page.getByText(/Reprise là où vous vous étiez arrêté, à 0?0:32\./)).toBeVisible();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => Math.round(element.currentTime)))
      .toBe(32);
    await expectAccessible(page);
    await page.getByRole("button", { name: "Reprendre au début" }).click();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => Math.round(element.currentTime)))
      .toBe(0);

    // Someone else's position cannot be written, nor a lesson of a course one does not follow.
    const refused = await page.request.post("/api/learn/position", {
      data: { lessonId: "inconnue", position: 10 },
    });
    expect(refused.status()).toBe(403);
  } finally {
    helper("--delete");
  }
});
