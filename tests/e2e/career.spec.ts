import { expect, test } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// E10. Quotas are monthly and shared by the runs of one seed: each test uses them on desktop only.

test("simulation d'entretien écrite, de la préparation au retour", async ({ page, isMobile }) => {
  test.skip(isMobile, "Une simulation du mois par exécution suffit.");
  test.setTimeout(120_000);
  await logIn(page, demo.talentStarter);
  await page.goto("/app/career");
  await page.getByRole("link", { name: "Simulations d'entretien" }).last().click();
  await expect(
    page.getByRole("heading", { name: "Simulations d'entretien", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(/simulations écrites ce mois/)).toBeVisible();
  await expectAccessible(page);

  await page.getByLabel("Poste visé").fill("Chargé de clientèle");
  await page.getByRole("button", { name: "Démarrer la simulation" }).click();
  await expect(page).toHaveURL(/\/app\/career\/entretiens\/[^/?#]+/);
  await expect(page.getByText("Question 1 sur 4")).toBeVisible();
  await page
    .getByLabel("Votre réponse")
    .fill(
      "Lors de mon stage, j'ai repris le suivi des réclamations clients et j'ai mis en place un tableau partagé, ce qui a permis de répondre plus vite.",
    );
  await page.getByRole("button", { name: "Envoyer ma réponse" }).click();
  await expect(page.getByText("Question 2 sur 4")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Terminer la séance" }).click();
  await expect(page.getByRole("heading", { name: "Votre retour" })).toBeVisible();
  await expect(page.getByText("Structure des réponses")).toBeVisible();
  await expect(page.getByText(/il ne prédit pas le résultat d'un vrai entretien/)).toBeVisible();
  await expect(page.locator("#retour")).not.toContainText("%");
  await expectAccessible(page);
});

test("lettre, correction et LinkedIn à partir du profil", async ({ page, isMobile }) => {
  test.skip(isMobile, "Les crédits IA du mois sont partagés.");
  test.setTimeout(120_000);
  await logIn(page, demo.talentStarter);
  await page.goto("/app/career/documents");
  await expect(page.getByRole("heading", { name: "Lettres et documents", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Générer une proposition" }).click();
  await expect(page.getByText("Votre proposition est prête.", { exact: false })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Texte/ })).toContainText("Madame, Monsieur,");
  await expect(page.getByRole("link", { name: "Télécharger en PDF" })).toBeVisible();
  await expectAccessible(page);

  await page.goto("/app/career/documents");
  await page.getByLabel("Collez votre texte").fill("bonjour,  je vous écris . merci");
  await page.getByRole("button", { name: "Corriger" }).click();
  await expect(page.getByText(/corrections? proposées?/)).toBeVisible();
  await page.getByRole("button", { name: "Appliquer les corrections cochées" }).click();
  await expect(page.getByRole("textbox", { name: /^Texte/ })).toHaveValue(
    "Bonjour, je vous écris. Merci",
  );

  await page.goto("/app/career/linkedin");
  await page
    .getByRole("button", { name: /Générer des propositions|Proposer une autre version/ })
    .click();
  await expect(page.getByRole("heading", { name: "Titre", level: 3 })).toBeVisible();
  await expect(
    page.getByText("Jumanly n'est pas affilié à LinkedIn", { exact: false }),
  ).toBeVisible();
  await expectAccessible(page);
});

test("simulation orale : la réponse se tape si la dictée n'est pas disponible", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Une simulation du mois par exécution suffit.");
  test.setTimeout(120_000);
  await logIn(page, demo.talentPro);
  await page.goto("/app/career/entretiens");
  await page.getByLabel("À l'oral").check();
  await page.getByLabel("Poste visé").fill("Analyste de données");
  await page.getByRole("button", { name: "Démarrer la simulation" }).click();
  await expect(page.getByText("Question 1 sur 4")).toBeVisible();
  await expect(
    page.getByText("Aucun enregistrement n'est conservé", { exact: false }),
  ).toBeVisible();
  await page
    .getByLabel("Votre réponse")
    .fill("J'ai analysé les ventes et présenté un tableau clair à l'équipe.");
  await page.getByRole("button", { name: "Envoyer ma réponse" }).click();
  await expect(page.getByText("Question 2 sur 4")).toBeVisible();
});

test("portfolio : verrou en Free, page publique sans compte", async ({ page, browser }) => {
  await logIn(page, demo.talentFree);
  await page.goto("/app/career/portfolio");
  await expect(page.getByText(/Forfait requis/).first()).toBeVisible();

  const context = await browser.newContext();
  const visitor = await context.newPage();
  await visitor.goto("/portfolio/demo-portfolio-fictif");
  await expect(visitor.getByRole("heading", { level: 1 })).toContainText("Portfolio de");
  await expect(visitor.getByText("Tableau de suivi des ventes (projet fictif)")).toBeVisible();
  await expect(visitor.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expectAccessible(visitor);
  await visitor.goto("/portfolio/adresse-inconnue");
  await expect(
    visitor.getByText("Ce portfolio n'est pas disponible.", { exact: false }),
  ).toBeVisible();
  await context.close();
});

test("un talent Pro publie un projet dans son portfolio", async ({ page, isMobile }) => {
  test.skip(isMobile, "Le portfolio de démonstration est partagé.");
  await logIn(page, demo.talentPro);
  await page.goto("/app/career/portfolio");
  const form = page.locator("#nouveau");
  await form.getByLabel("Titre du projet").fill("Projet e2e (fictif)");
  await form.getByLabel("Résultat").fill("Un résultat imaginaire.");
  await form.getByRole("button", { name: "Enregistrer le projet" }).click();
  await expect(page.getByText("Portfolio enregistré.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projet e2e (fictif)" })).toBeVisible();
  await expect(page.getByText(/Présentation enrichie · Disponible avec/)).toBeVisible();
  await expectAccessible(page);
});
