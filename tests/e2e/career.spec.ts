import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// E10. Quotas are monthly and shared by the runs of one seed: each test uses them on desktop only.

test("simulation d'entretien écrite, de la préparation au retour", async ({ page, isMobile }) => {
  test.skip(isMobile, "Une simulation du mois par exécution suffit.");
  test.setTimeout(120_000);
  // The simulation is kept for people who applied with a plan that includes it: Amani (Starter).
  await logIn(page, "amani.ux@jumanly.test");
  // Lot 7: the former Career home is gone; the practice opens from Compte.
  await page.goto("/app/compte");
  await page.getByRole("link", { name: /S.entraîner aux entretiens/ }).click();
  // Lot 6b (planche talent-4 § 5 bis): quotas, free practice, last sessions.
  await expect(
    page.getByRole("heading", { name: "S'entraîner aux entretiens", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Simulations écrites")).toBeVisible();
  await expectAccessible(page);

  await page.getByRole("link", { name: /Sur un métier/ }).click();
  await expect(page.getByRole("heading", { name: "Nouvel entraînement", level: 1 })).toBeVisible();
  await page.getByLabel("Métier").fill("Chargé de clientèle");
  await page.getByText("Rapide", { exact: true }).click();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page).toHaveURL(/\/app\/career\/entretiens\/[^/?#]+/);
  await expect(page.getByRole("heading", { name: "Question 1 sur 4" })).toBeVisible();
  await page
    .getByLabel("Votre réponse")
    .fill(
      "Lors de mon stage, j'ai repris le suivi des réclamations clients et j'ai mis en place un tableau partagé, ce qui a permis de répondre plus vite.",
    );
  await page.getByRole("button", { name: "Répondre", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Question 2 sur 4" })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Terminer la séance" }).click();
  await expect(page.getByRole("heading", { name: "Votre retour" })).toBeVisible();
  // The five criteria, a level in words; « Pourquoi ce retour ? » says how it was written.
  await expect(page.locator("#retour")).toContainText("Structure des réponses");
  await page.getByRole("button", { name: "Pourquoi ce retour ?" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Pourquoi ce retour" })
      .getByText(/il ne prédit pas le résultat d'un vrai entretien/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fermer" }).click();
  await expect(page.locator("#retour")).not.toContainText("%");
  await expectAccessible(page);
});

test("lettre, correction et LinkedIn à partir du profil", async ({ page, isMobile }) => {
  test.skip(isMobile, "Les crédits IA du mois sont partagés.");
  test.setTimeout(120_000);
  await logIn(page, demo.talentStarter);
  // Lot 6c: the letters are a tab of « CV et documents »; the former address leads there.
  await page.goto("/app/career/documents");
  await expect(page).toHaveURL(/\/app\/career\/cv\?vue=lettres$/);
  await expect(page.getByRole("link", { name: /^Lettres/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "Nouvelle lettre" }).click();
  const create = page.getByRole("dialog", { name: "Nouvelle lettre" });
  await create.getByRole("button", { name: "Rédiger avec Orbi" }).click();
  await expect(page.getByText("Orbi a rédigé ce texte", { exact: false })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("textbox", { name: /^Texte/ })).toContainText("Madame, Monsieur,");
  await expectAccessible(page);

  await page.goto("/app/career/cv?vue=lettres");
  await page.getByRole("button", { name: "Nouvelle lettre" }).click();
  await page.getByRole("button", { name: "Faire relire un texte" }).click();
  const proofread = page.getByRole("dialog", { name: "Faire relire un texte" });
  await proofread.getByLabel("Votre texte").fill("bonjour,  je vous écris . merci");
  await proofread.getByRole("button", { name: /^Relire/ }).click();
  await expect(page.getByText(/corrections? proposées?/)).toBeVisible();
  await page.getByRole("button", { name: "Appliquer les corrections cochées" }).click();
  await expect(page.getByRole("textbox", { name: /^Texte/ })).toHaveValue(
    "Bonjour, je vous écris. Merci",
  );

  // « Préparer mon LinkedIn » from the Lettres tab: title, summary, 5 skills, nothing published.
  await page.goto("/app/career/cv?vue=lettres");
  await page.getByRole("link", { name: "Préparer mon LinkedIn" }).click();
  await expect(page).toHaveURL(/\/app\/career\/linkedin$/);
  await page.getByRole("button", { name: /^(Préparer|Proposer à nouveau)/ }).click();
  // On a computer (planche studio-cv § 7): Titre, Infos, Compétences (those Orbi could fill),
  // each one with its « Copier ».
  const linkedin = page.getByRole("region", { name: "Préparer LinkedIn" });
  const fields = linkedin.getByRole("heading", { level: 3 });
  await expect(fields.first()).toBeVisible();
  for (const name of await fields.allTextContents()) {
    expect(["Titre", "Infos", "Compétences"]).toContain(name.trim());
  }
  await expect(linkedin.getByRole("button", { name: "Copier" })).toHaveCount(await fields.count());
  await expect(
    page.getByText("Rien n'est publié sur LinkedIn", { exact: false }).filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText("Jumanly n'est pas affilié à LinkedIn", { exact: false })
      .filter({ visible: true }),
  ).toBeVisible();
  await expectAccessible(page);
});

test("simulation orale : la réponse se tape si la dictée n'est pas disponible", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Une simulation du mois par exécution suffit.");
  test.setTimeout(120_000);
  // The simulation is kept for people who applied with a plan that includes it (29/10); the oral
  // one needs Pro: Aminata.
  await logIn(page, "aminata.ux@jumanly.test");
  // Lot 6b (planche talent-4 § 5 bis): « À l'oral » opens « Nouvel entraînement », format oral.
  await page.goto("/app/career/entretiens");
  await page.getByRole("link", { name: /À l'oral/ }).click();
  await page.getByLabel("Métier").fill("Analyste de données");
  await page.getByText("Rapide", { exact: true }).click();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByRole("heading", { name: "Question 1 sur 4" })).toBeVisible();
  await expect(
    page.locator("#reponse").getByText("Aucun enregistrement n'est gardé", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Votre réponse transcrite, à relire avant d'envoyer")
    .fill("J'ai analysé les ventes et présenté un tableau clair à l'équipe.");
  await page.getByRole("button", { name: "Envoyer ma réponse" }).click();
  await expect(page.getByRole("heading", { name: "Question 2 sur 4" })).toBeVisible();
});

test("projets : verrou en Free, page publique sans compte", async ({ page, browser, isMobile }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/career/portfolio");
  if (isMobile) {
    // Modèle B: the former portfolio page leads to the « Réalisations » of Mon profil (29/10).
    await expect(page).toHaveURL(/\/app\/profil(\?onglet=realisations)?$/);
    await expect(
      page
        .getByRole("tablist", { name: "Sections du profil" })
        .filter({ visible: true })
        .getByRole("tab", { name: "Réalisations" }),
    ).toHaveAttribute("aria-selected", "true");
  } else {
    // The former portfolio page leads to the « Projets » of Mon profil.
    await expect(page).toHaveURL(/\/app\/profil\?section=projets/);
    await expect(page.locator("#projets")).toHaveAttribute("open", "");
    await expect(
      page.locator("#projets").getByRole("link", { name: /Montrez vos projets/ }),
    ).toBeVisible();
  }

  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto("/portfolio/demo-portfolio-fictif");
  await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("Bisimwa Fictif");
  await expect(visitor.getByText("Tableau de suivi des ventes (projet fictif)")).toBeVisible();
  await expect(visitor.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectAccessible(visitor);
  await visitor.goto("/portfolio/adresse-inconnue");
  await expect(
    visitor.getByText("Ce portfolio n'est pas disponible.", { exact: false }),
  ).toBeVisible();
  await context.close();
});

test("un talent Pro ajoute un projet avec une photo", async ({ page, isMobile }) => {
  test.skip(isMobile, "Le portfolio de démonstration est partagé.");
  await logIn(page, demo.talentPro);
  await page.goto("/app/profil/projet");
  await page
    .locator('input[name="files"]')
    .setInputFiles("ressources/illustrations/png/jumanly-nadia-salut.png");
  await page.getByLabel("Titre", { exact: true }).fill("Projet e2e (fictif)");
  await page.getByLabel("Ce que vous avez fait").fill("Un résultat imaginaire.");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page).toHaveURL(/ok=projets/);
  const tile = page
    .locator("#projets")
    .getByRole("link", { name: /Projet e2e \(fictif\)/ })
    .first();
  await expect(tile).toBeVisible();
  const src = await tile.locator("img").getAttribute("src");
  expect((await page.request.get(src!)).headers()["content-type"]).toBe("image/png");
  // Removed again, with its file, so the next run starts clean.
  await tile.click();
  await page.getByRole("button", { name: "Supprimer ce projet" }).click();
  await expect(page).toHaveURL(/ok=projets/);
  expect((await page.request.get(src!)).status()).toBe(404);
});

// Lot 7: the former pages of the old design lead, for good, to their place in the redesign.
test("les anciennes adresses mènent à leur place dans la refonte", async ({ page }) => {
  await logIn(page, demo.talentFree);
  for (const [from, to] of [
    ["/app/career", /\/app\/career\/cv$/],
    ["/app/career/conseils", /\/app\/learn$/],
    ["/app/tableau-de-bord", /\/app$/],
    ["/app/espace", /\/app\/compte$/],
  ] as const) {
    await page.goto(from);
    await expect(page, from).toHaveURL(to);
  }
});
