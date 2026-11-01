import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B7 (docs/modele-b, rangée 17, planche Formation): the Formation tab on the phone,
// its search in two steps, a course, a lesson and its quick question, a course above the plan and
// an attestation. Grâce (grace.ux@, Free) follows the demo courses of the seed (SQL at lesson 2,
// Excel and « Réussir son CV » finished). « Leçon suivante » records a lesson: reseed before
// running again.
test.describe("Modèle B · Formation au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton de Formation ouvre quelque chose", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/learn");
    const tab = page.locator(".nb-fo-accueil");
    await expect(tab.getByRole("heading", { name: "Formation", exact: true })).toBeVisible();
    await expect(tab.getByRole("link", { name: /^Reprendre/ })).toBeVisible();

    // « Pourquoi ? » asks Orbi why the course counts; Orbi answers in its sheet.
    await tab.getByRole("button", { name: "Pourquoi ?" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi propose, vous décidez.")).toBeVisible();
    await orbi.getByRole("button", { name: "Fermer" }).last().click();
    await expect(orbi).toBeHidden();

    // « Tout voir » opens the search on the courses; « Annuler » comes back.
    await tab.getByRole("button", { name: "Tout voir : Pour vos offres" }).click();
    await expect(tab.getByText("Rechercher dans")).toBeVisible();
    await expect(tab.getByRole("button", { name: "Cours", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await tab.getByRole("button", { name: "Annuler" }).click();
    await expect(tab.getByRole("heading", { name: "Pour vos offres" })).toBeVisible();

    // Search, step 1: where to search; step 2: from the letters, courses and lessons.
    const field = tab.getByRole("searchbox", { name: /Rechercher un cours/ });
    await field.click();
    await expect(tab.getByText("Compétences demandées dans vos offres")).toBeVisible();
    await field.fill("join");
    const lessons = tab.getByRole("region", { name: /^Leçons · / });
    await expect(lessons.getByRole("link", { name: /LEFT JOIN/ })).toBeVisible();
    await expect(
      tab.getByRole("region", { name: /^Cours · / }).getByRole("link", { name: /SQL/ }),
    ).toBeVisible();
    await field.fill("zzzz introuvable");
    await expect(tab.getByText("Aucun cours pour « zzzz introuvable ».")).toBeVisible();
    await tab.getByRole("button", { name: "Demander à Orbi de trouver un cours" }).click();
    await expect(orbi.getByText("Orbi propose, vous décidez.")).toBeVisible();
    await orbi.getByRole("button", { name: "Fermer" }).last().click();
    await tab.getByRole("button", { name: "Annuler" }).click();

    // « Mes cours » and « Attestations » are rubrics in place.
    await tab.getByRole("tab", { name: "Mes cours" }).click();
    await expect(tab.getByText("En cours", { exact: true })).toBeVisible();
    await expect(tab.getByRole("link", { name: /SQL : jointures/ })).toBeVisible();
    await tab.getByRole("tab", { name: "Attestations" }).click();
    await expect(tab.getByText(/attestations? obtenues?/)).toBeVisible();
    await tab.getByRole("link", { name: /Excel pour le travail/ }).click();
    await page.waitForURL("**/app/learn/attestations/**");
    await expect(
      page.locator(".nb-fo-att-p").getByText("Attestation Jumanly", { exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Formation" }).first().click();
    await page.waitForURL((url) => url.pathname === "/app/learn");

    // « Répéter avec Orbi » opens the interview practice, coming from Formation.
    await tab.getByRole("tab", { name: "Pour vous" }).click();
    await tab.getByRole("link", { name: /^Répéter avec Orbi/ }).click();
    await page.waitForURL("**/app/career/entretiens/nouveau?**depuis=formation**");
    // The settings, or the reserved screen without an application and a plan (29/10/2026).
    await expect(
      page.getByRole("heading", { name: /S’entraîner pour l’entretien|Simulation d’entretien/ }),
    ).toBeVisible();
  });

  test("un cours et une leçon : programme, question rapide, leçon suivante", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/learn/demo-t3-sql-jointures");
    const course = page.locator(".nb-fo-cours");
    await expect(
      course.getByRole("heading", { name: "SQL : jointures et sous-requêtes" }),
    ).toBeVisible();
    await expect(course.getByRole("heading", { name: "Programme" })).toBeVisible();

    // « ··· »: share, save, report; « Annuler » closes.
    await course.getByRole("button", { name: "Plus d’options" }).click();
    const menu = page.getByRole("dialog", { name: "SQL : jointures et sous-requêtes" });
    await expect(menu.getByRole("button", { name: /^Partager le cours/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Signaler un problème/ })).toHaveAttribute(
      "href",
      "/app/compte/aide",
    );
    await menu.getByRole("button", { name: "Annuler" }).click();
    await expect(menu).toBeHidden();

    // « Enregistrer » answers in place, and back.
    await course.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await expect(course.getByRole("button", { name: "Enregistré" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await course.getByRole("button", { name: "Enregistré" }).click();
    await expect(course.getByRole("button", { name: "Enregistrer", exact: true })).toBeVisible();

    // « Reprendre la leçon 2 » opens the lesson.
    await course.getByRole("button", { name: /^Reprendre la leçon/ }).click();
    await page.waitForURL("**/app/learn/demo-t3-sql-jointures/**");
    const lesson = page.locator(".nb-fo-lecon-p");
    await expect(lesson.getByRole("heading", { name: "LEFT JOIN" })).toBeVisible();
    await expect(lesson.getByRole("heading", { name: "À retenir" })).toBeVisible();

    // The quick question must be answered before « Leçon suivante ».
    await lesson.getByRole("button", { name: "Leçon suivante" }).click();
    await expect(page.getByText("Répondez à la question rapide pour continuer.")).toBeVisible();
    await lesson.getByRole("button", { name: /Elle disparaît/ }).click();
    await expect(lesson.getByText(/^Pas tout à fait\./)).toBeVisible();
    await expect(lesson.getByRole("button", { name: /Elle reste/ })).toHaveAttribute(
      "data-etat",
      "bonne",
    );

    // « Orbi explique autrement » asks Orbi about this lesson.
    await lesson.getByRole("button", { name: "Orbi explique autrement" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi propose, vous décidez.")).toBeVisible();
    await orbi.getByRole("button", { name: "Fermer" }).last().click();

    // The lesson's settings: report a problem by e-mail.
    await lesson.getByRole("button", { name: "Réglages de la leçon" }).click();
    const settings = page.getByRole("dialog", { name: "Réglages de la leçon" });
    await expect(settings.getByRole("link", { name: /^Signaler un problème/ })).toBeVisible();
    await settings.getByRole("button", { name: "Annuler" }).click();

    // « Leçon suivante » records the lesson and opens the next one; « Précédente » comes back.
    await lesson.getByRole("button", { name: "Leçon suivante" }).click();
    await expect(
      lesson.getByRole("heading", { name: "Une requête dans la requête" }),
    ).toBeVisible();
    await lesson.getByRole("link", { name: "Précédente" }).click();
    await expect(lesson.getByRole("heading", { name: "LEFT JOIN" })).toBeVisible();

    // « SQL » goes back to the course, where lesson 2 is now done.
    await lesson.getByRole("link", { name: "SQL" }).first().click();
    await page.waitForURL("**/app/learn/demo-t3-sql-jointures");
    await expect(course.getByText("2 leçons sur 4 terminées")).toBeVisible();
  });

  test("un cours au-dessus de la formule : formules et première leçon", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/learn/demo-gestion-de-projet-essentiels");
    const course = page.locator(".nb-fo-cours");
    await course.getByRole("button", { name: /^Débloquer avec/ }).click();
    const sheet = page.getByRole("dialog", { name: /est inclus dans/ });
    await expect(sheet.getByRole("link", { name: "Voir les formules" })).toHaveAttribute(
      "href",
      "/app/abonnement",
    );
    await sheet.getByRole("link", { name: "Essayer la première leçon" }).click();
    await page.waitForURL("**/app/learn/demo-gestion-de-projet-essentiels/**");
    const lesson = page.locator(".nb-fo-lecon-p");
    await expect(lesson.getByRole("link", { name: /^Débloquer avec/ })).toHaveAttribute(
      "href",
      "/app/abonnement",
    );
  });

  test("une attestation : bravo, profil, Fil et PDF", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/learn?onglet=attestations");
    const tab = page.locator(".nb-fo-accueil");
    const link = tab.getByRole("link", { name: /Excel pour le travail/ });
    const href = await link.getAttribute("href");
    await page.goto(`${href}?nouvelle=1`);
    const certificate = page.locator(".nb-fo-att-p");
    await expect(certificate.getByText(/^Bravo/)).toBeVisible();
    await expect(certificate.getByText(/^Vérification/)).toBeVisible();
    await expect(certificate.getByRole("link", { name: "Télécharger en PDF" })).toHaveAttribute(
      "href",
      /\/pdf$/,
    );
    await certificate.getByRole("button", { name: /profil/ }).click();
    await expect(
      page.getByText(/Déjà visible sur votre profil|Ajoutée à votre profil dans Carrière/),
    ).toBeVisible();

    // « Partager dans le Fil » opens a post with Orbi's draft about this attestation.
    await certificate.getByRole("link", { name: "Partager dans le Fil" }).click();
    await page.waitForURL("**/app/fil/publier?attestation=**");
    await expect(
      page
        .getByText(/Excel pour le travail/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await page.goBack();
    await page.waitForURL("**/app/learn/attestations/**");

    // « Voir d’autres cours » goes back to the tab.
    await certificate.getByRole("link", { name: "Voir d’autres cours" }).click();
    await page.waitForURL((url) => url.pathname === "/app/learn");
    await expect(tab.getByRole("heading", { name: "Formation", exact: true })).toBeVisible();
  });

  test("Formation reste montée : aller-retour sans écran vide", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/learn");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const continueCard = page.locator(".nb-fo-accueil .nb-fo-continuer");
    await expect(continueCard).toBeVisible();
    await continueCard.evaluate((node) => {
      (node as HTMLElement).dataset.test = "same";
    });
    await nav.getByRole("link", { name: "Fil", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await nav.getByRole("link", { name: "Hub", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app/learn");
    await expect(page.locator('.nb-fo-continuer[data-test="same"]')).toBeVisible();

    // A course opened from the tab covers it, and « Formation » brings it back as it was.
    await page.locator(".nb-fo-accueil .nb-fo-tuile").first().click();
    await page.waitForURL("**/app/learn/**");
    await expect(page.locator(".nb-fo-cours")).toBeVisible();
    await page.getByRole("link", { name: "Formation" }).first().click();
    await page.waitForURL((url) => url.pathname === "/app/learn");
    await expect(page.locator('.nb-fo-continuer[data-test="same"]')).toBeVisible();
  });
});
