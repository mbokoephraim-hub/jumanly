import { expect, test } from "./fixtures";
import { demo, logIn, skipIntro } from "./session";

/**
 * Admin v3 (docs/admin-v3/PLAN.md): the floating column of icons. Every section has an accessible
 * name, the column is shorter than the window (a floating pill, not a full-height bar), and the
 * label shows in a tooltip when the keyboard reaches an icon.
 */
test("menu de l'admin : rubriques par groupe dans la colonne", async ({ page, isMobile }) => {
  test.skip(isMobile, "La colonne s'affiche à partir de 1024 px ; le téléphone garde la pilule.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await logIn(page, demo.admin);
  await page.goto("/admin");

  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  for (const name of [
    "Indicateurs",
    "Utilisateurs",
    "Organisations",
    "Partenaires",
    "Forfaits et droits",
    "Abonnements",
    "Formations",
    "Contenus",
    "Modération des offres",
    "Signalements",
    "IA et matching",
    "Journal d'audit",
  ]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Indicateurs", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Modèle B (27/10): the column names each rubric under its group (Pilotage, Comptes…), so the
  // former icon tooltips are gone.
  await expect(nav.getByText("Pilotage", { exact: true })).toBeVisible();
});

test("le menu d'un éditeur de contenus ne montre que ses rubriques", async ({ page, isMobile }) => {
  test.skip(isMobile, "Colonne de bureau seulement.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await logIn(page, demo.editor);
  await page.goto("/admin/formations");
  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  await expect(nav.getByRole("link")).toHaveCount(2);
  await expect(nav.getByRole("link", { name: "Formations", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Contenus", exact: true })).toBeVisible();
});

// Admin v3, étape 3: the Studio gallery and a new course from the « Parcours certifiant » template.
test("Studio formations : galerie, puis création à partir d'un modèle", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations");
  await expect(page.getByRole("heading", { level: 1, name: "Studio formations" })).toBeVisible();
  const gallery = page.getByRole("list", { name: "Formations" });
  await expect(gallery.getByRole("link", { name: /Réussir son CV \(démo\)/ })).toBeVisible();

  await page.getByRole("link", { name: "Liste", exact: true }).click();
  await expect(page).toHaveURL(/vue=liste/);
  await expect(page.getByRole("link", { name: "Liste", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: "Nouvelle formation" }).first().click();
  const title = `Parcours fictif e2e ${Date.now().toString(36)}`;
  await page.locator("#course-new-title").fill(title);
  await page.locator("#course-new-theme").fill("Thème fictif");
  await page.locator('label[for="course-new-template-certifying"]').click();
  await expect(page.locator("#course-new-template-certifying")).toBeChecked();
  await page.getByRole("button", { name: "Créer la formation" }).click();
  await expect(
    page.getByText("Brouillon créé à partir du modèle.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Étapes de la formation" })
    .getByRole("link", { name: /^Programme/ })
    .click();
  for (const name of ["Module 1", "Module 2", "Module 3", "Évaluation finale"])
    await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible();
});

// Admin v3, étape 4: the editor in steps. A template draft, a lesson moved down, a lesson opened in
// the panel beside the program, the quiz list, the attestation preview, then a status change with
// its reason.
test("éditeur par étapes : programme, quiz, attestation et publication", async ({ page }) => {
  test.setTimeout(120_000);
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations/nouvelle");
  const title = `Étapes fictives e2e ${Date.now().toString(36)}`;
  await page.locator("#course-new-title").fill(title);
  await page.locator('label[for="course-new-template-short"]').click();
  await page.getByRole("button", { name: "Créer la formation" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const steps = page.getByRole("navigation", { name: "Étapes de la formation" });
  // Seven steps, each saying whether it is done, after the way back to the Studio (28/10).
  await expect(steps.getByRole("link", { name: /\((à faire|fait)\)$/ })).toHaveCount(7);
  await expect(steps.getByRole("link", { name: /^Informations/ })).toHaveAttribute(
    "aria-current",
    "step",
  );

  await steps.getByRole("link", { name: /^Programme/ }).click();
  const program = page.locator("#programme");
  await expect(program.locator("li").first()).toContainText("Introduction");
  await page.getByRole("button", { name: /^Descendre la leçon « Introduction/ }).click();
  await expect(program.locator("li").first()).not.toContainText("Introduction");
  await expect(page.getByRole("button", { name: /^Monter la leçon « Introduction/ })).toBeVisible();

  await page.getByRole("link", { name: /^Modifier la leçon « Introduction/ }).click();
  await expect(page.locator("#lecon-title")).toContainText("Introduction");
  await expect(page.locator("#programme")).toBeVisible();
  await page.getByRole("link", { name: "Fermer la leçon" }).click();
  await expect(page.locator("#lecon")).toHaveCount(0);

  await steps.getByRole("link", { name: /^Quiz/ }).click();
  await expect(page.getByText("À compléter : ajoutez au moins une question.")).toBeVisible();
  await page.getByRole("link", { name: /^Modifier les questions de/ }).click();
  await expect(page.locator("#quiz")).toBeVisible();

  await steps.getByRole("link", { name: /^Attestation/ }).click();
  await expect(page.getByText("Aucune attestation n'est délivrée", { exact: false })).toBeVisible();
  await page.getByRole("switch", { name: "Délivrer une attestation" }).check();
  await page.getByRole("button", { name: "Enregistrer l'attestation" }).click();
  await expect(page.getByText("Attestation de réussite")).toBeVisible();
  await expect(page.locator("#preparation")).toContainText("Ajoutez une image de couverture.");

  await steps.getByRole("link", { name: /^Publication/ }).click();
  await page.locator("#course-status").selectOption("review");
  await page.locator("#course-status-reason").fill("Relecture fictive demandée");
  await page.getByRole("button", { name: "Changer le statut" }).click();
  await expect(page.getByText("Statut mis à jour.")).toBeVisible();
  await expect(page.getByText("Statut actuel : En relecture")).toBeVisible();
});

// Admin v3, étape 5: a PDF attached to a course. Sent from the Documents step, listed with its
// pages, downloadable by the team, refused to a visitor while the course is a draft.
test("documents PDF : envoi, téléchargement par l'équipe, refus au visiteur", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations/nouvelle");
  const title = `Documents fictifs e2e ${Date.now().toString(36)}`;
  await page.locator("#course-new-title").fill(title);
  await page.locator('label[for="course-new-template-short"]').click();
  await page.getByRole("button", { name: "Créer la formation" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const steps = page.getByRole("navigation", { name: "Étapes de la formation" });
  await steps.getByRole("link", { name: /^Documents/ }).click();
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.addPage();
  await page.locator("#document-new-file").setInputFiles({
    name: "support-fictif.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  });
  await page.locator("#document-new-title").fill("Support fictif e2e");
  await page.locator("#document-new-visibility-public").check();
  await page.getByRole("button", { name: "Envoyer le document" }).click();
  await expect(page.getByText("Document enregistré.")).toBeVisible();

  const download = page
    .locator("#documents")
    .getByRole("link", { name: "Télécharger « Support fictif e2e »" });
  const href = await download.getAttribute("href");
  expect(href).toMatch(/^\/formations\/documents\//);
  const response = await page.request.get(href!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toContain("support-fictif-e2e.pdf");

  // A visitor: the course is still a draft, so the document stays hidden.
  const visitor = await browser.newContext({ baseURL });
  expect((await visitor.request.get(href!)).status()).toBe(404);
  await visitor.close();
});

// Admin v3, étape 6: the PDFs Jumanly makes for a course. The team downloads all five from the
// Publication step; a visitor gets the programme only; a talent never gets the answer key.
test("PDF générés : l'équipe télécharge les cinq, le visiteur le programme seulement", async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations");
  await page.getByRole("link", { name: "Réussir son CV (démo)" }).click();
  await expect(page.locator("#course-pdf-side")).toBeVisible();
  const steps = page.getByRole("navigation", { name: "Étapes de la formation" });
  await steps.getByRole("link", { name: /^Publication/ }).click();
  const card = page.locator("#course-pdf");
  await expect(card).toBeVisible();
  const pdf = async (href: string) => {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect((await response.body()).subarray(0, 4).toString()).toBe("%PDF");
    return href;
  };
  const hrefs: string[] = [];
  for (const name of [
    "Programme",
    "Support de cours complet",
    "Quiz et corrigé",
    "Aperçu de l'attestation",
  ]) {
    const href = await card
      .getByRole("link", { name: `Télécharger le PDF « ${name} »` })
      .getAttribute("href");
    hrefs.push(await pdf(href!));
  }
  await page.locator("#course-pdf-period").selectOption("30");
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Télécharger le bilan" }).click();
  expect((await download).suggestedFilename()).toBe("bilan-demo-reussir-son-cv.pdf");

  // The team's downloads are in the audit history of the course.
  await page.reload();
  await expect(page.getByText("a téléchargé un PDF de formation").first()).toBeVisible();

  const visitor = await browser.newContext({ baseURL });
  await expect(
    (await visitor.request.get("/formations/demo-reussir-son-cv/programme")).status(),
  ).toBe(200);
  for (const href of hrefs)
    expect((await visitor.request.get(href, { maxRedirects: 0 })).status(), href).not.toBe(200);
  expect(
    (
      await visitor.request.get("/app/learn/demo-reussir-son-cv/support", { maxRedirects: 0 })
    ).status(),
  ).not.toBe(200);
  await visitor.close();

  const talentContext = await browser.newContext({ baseURL });
  const talent = await talentContext.newPage();
  await skipIntro(talent);
  await logIn(talent, demo.talentFree);
  expect((await talent.request.get(hrefs[2]!, { maxRedirects: 0 })).status()).not.toBe(200);
  await talent.goto("/formations/demo-reussir-son-cv");
  await expect(talent.getByRole("link", { name: /Télécharger le programme/ })).toBeVisible();
  await talentContext.close();
});
