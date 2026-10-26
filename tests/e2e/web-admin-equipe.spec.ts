import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { holdBaobab } from "./baobab-lock";
import { expectAccessible } from "./a11y";
import { logIn } from "./session";

// Étape 3 · A2 (docs/modele-b-recruteur/web, captures 076 à 078) : Équipe de Baobab Fintech
// (entreprise fictive, seed `prisma/seed/entreprise.ts`), chaque bouton répond. Avec CAPTURE_DIR,
// les écrans sont photographiés à la largeur CAPTURE_WIDTH (1440 par défaut). Le seed remet
// l'équipe en place : relancer `pnpm db:seed` avant de rejouer ce fichier.

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;
const OWNER = "recruteur6.ux@jumanly.test";
const PAGE = "/app/organisation/equipe";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${WIDTH}.png`) });
}

const main = (page: Page) => page.locator("main").filter({ visible: true });
const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator(".ae-toast").filter({ hasText: text })).toBeVisible();
const closeToast = async (page: Page) => {
  await page.locator(".ae-toast").getByRole("button", { name: "Fermer" }).click();
  await expect(page.locator(".ae-toast")).toBeHidden();
};
const card = (page: Page, name: string) =>
  main(page).locator(".ae-membre").filter({ hasText: name });
const tab = (page: Page, name: RegExp) => main(page).getByRole("tab", { name }).click();

test.describe("Étape 3 · Équipe de l'entreprise", () => {
  test.skip(({ isMobile }) => isMobile, "L'espace de l'entreprise se gère sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });
  test.describe.configure({ mode: "serial" });
  // Baobab Fintech is shared by the other files of the company space: one at a time.
  let release = () => {};
  test.beforeAll(async () => {
    test.setTimeout(600_000);
    release = await holdBaobab();
  });
  test.afterAll(() => release());

  test("l'administrateur gère les membres, les tâches, les invitations et les demandes", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await logIn(page, OWNER);
    await page.goto("/app/hire");
    const company = page.getByRole("navigation", { name: "Entreprise" }).first();
    await company.getByRole("link", { name: "Équipe" }).click();
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Équipe");
    await expect(company.getByRole("link", { name: "Équipe" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(main(page).getByText(/2 utilisateurs sur 5|3 utilisateurs sur 5/)).toBeVisible();

    // Membres et rôles : la carte de Patrice, son rôle, ses droits (formule sans droits fins).
    const patrice = card(page, "Patrice Démo");
    await patrice.click();
    await expect(patrice).toHaveAttribute("aria-pressed", "true");
    await expect(main(page).getByRole("heading", { name: "Rôle de Patrice" })).toBeVisible();
    await expect(
      main(page).getByRole("switch", { name: "Trier les candidatures (ATS)" }),
    ).toBeDisabled();
    await expect(
      main(page).getByText(/Votre formule garde les droits de chaque rôle/),
    ).toBeVisible();
    await main(page)
      .getByRole("radio", { name: /Lecteur/ })
      .click();
    await toast(page, "Patrice devient lecteur : ses droits sont mis à jour");
    await closeToast(page);
    await main(page)
      .getByRole("radio", { name: /Manager/ })
      .click();
    await toast(page, "Patrice devient manager : ses droits sont mis à jour");
    await closeToast(page);

    const aline = card(page, "Aline Démo");
    await aline.click();
    await expect(main(page).getByRole("heading", { name: "Tâches de Aline" })).toBeVisible();
    await shot(page, "076-equipe");
    await main(page).getByRole("button", { name: "Relancer Aline Démo" }).first().click();
    await toast(page, "Rappel envoyé à Aline");
    await closeToast(page);
    await expect(
      main(page)
        .getByRole("link", { name: /^Fiche de / })
        .first(),
    ).toHaveAttribute("href", /\/app\/hire\/candidats\//);

    // « Attribuer une tâche » : à qui, quoi, pour quel candidat, quand.
    await main(page).getByRole("button", { name: "Attribuer une tâche" }).click();
    const assign = page.getByRole("dialog", { name: "Attribuer une tâche" });
    await expect(assign).toBeVisible();
    await shot(page, "076b-attribuer");
    await assign.getByRole("radio", { name: "Patrice Démo" }).click();
    await assign.getByRole("radio", { name: "Suivre un candidat" }).click();
    await assign
      .getByRole("radiogroup", { name: "Pour quel candidat" })
      .getByRole("radio")
      .first()
      .click();
    await assign.getByRole("radiogroup", { name: "Échéance" }).getByRole("radio").nth(1).click();
    await assign.getByRole("button", { name: "Attribuer", exact: true }).click();
    await toast(page, /Tâche attribuée à Patrice/);
    await closeToast(page);
    await expect(main(page).getByRole("heading", { name: "Tâches de Patrice" })).toBeVisible();
    await main(page).getByRole("button", { name: "Attribuer une tâche" }).click();
    await page
      .getByRole("dialog", { name: "Attribuer une tâche" })
      .getByRole("button", { name: "Annuler" })
      .click();
    await expect(page.getByRole("dialog", { name: "Attribuer une tâche" })).toBeHidden();

    // Tâches : les filtres et le tableau.
    await tab(page, /^Tâches/);
    const table = main(page).getByRole("table", { name: "Toutes les tâches de l'équipe" });
    await expect(table.getByRole("columnheader", { name: "Avancement" })).toBeVisible();
    await shot(page, "077-equipe-taches");
    const filters = main(page).getByRole("group", { name: "Filtrer les tâches" });
    await filters.getByRole("button", { name: "En retard" }).click();
    await expect(table.getByText("En retard")).toBeVisible();
    await filters.getByRole("button", { name: "Terminées" }).click();
    await expect(table.getByRole("row")).toHaveCount(2);
    await filters.getByRole("button", { name: "En cours" }).click();
    await filters.getByRole("button", { name: "Toutes" }).click();
    await expect(filters.getByRole("button", { name: "Toutes" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await table
      .getByRole("button", { name: /^Relancer Patrice/ })
      .first()
      .click();
    await toast(page, "Rappel envoyé à Patrice");
    await closeToast(page);

    // Invitations et demandes.
    await tab(page, /^Invitations et demandes/);
    await expect(main(page).getByRole("heading", { name: "Demandes à valider" })).toBeVisible();
    await expect(
      main(page)
        .getByText(/Indique travailler chez Baobab Fintech/)
        .first(),
    ).toBeVisible();
    await shot(page, "078-equipe-invitations");
    await main(page)
      .getByRole("button", { name: "Renvoyer l'invitation à david.equipe@jumanly.test" })
      .click();
    await toast(page, "Invitation renvoyée à david.equipe@jumanly.test");
    await closeToast(page);
    await main(page)
      .getByRole("button", { name: "Annuler l'invitation de david.equipe@jumanly.test" })
      .click();
    await toast(page, "Invitation annulée : la place se libère");
    await closeToast(page);
    await main(page).getByRole("button", { name: "Accepter la demande de Merveille Démo" }).click();
    await toast(page, /Merveille Démo rejoint l'équipe/);
    await closeToast(page);
    await main(page)
      .getByRole("button", { name: /Fabrice Démo ne travaille pas chez/ })
      .click();
    await toast(page, "Fabrice Démo est retiré·e des membres de la page");
    await closeToast(page);
    await main(page)
      .getByRole("button", { name: /Confirmer que Sandra Démo travaille/ })
      .click();
    await toast(page, /Sandra Démo apparaît comme membre confirmé·e/);
    await closeToast(page);
    for (const name of ["Merveille Démo", "Fabrice Démo", "Sandra Démo"])
      await expect(main(page).getByText(name, { exact: true })).toHaveCount(0);

    // Retirer Merveille (acceptée plus haut) : la place se libère.
    await tab(page, /^Membres et rôles/);
    await card(page, "Merveille Démo").click();
    await main(page).getByRole("button", { name: "Retirer de l'équipe" }).click();
    const remove = page.getByRole("dialog", { name: "Retirer Merveille Démo de l'équipe ?" });
    await remove.getByRole("button", { name: "Annuler" }).click();
    await expect(remove).toBeHidden();
    await main(page).getByRole("button", { name: "Retirer de l'équipe" }).click();
    await page
      .getByRole("dialog", { name: "Retirer Merveille Démo de l'équipe ?" })
      .getByRole("button", { name: "Retirer", exact: true })
      .click();
    await toast(page, "Merveille Démo ne fait plus partie de l'équipe");
    await closeToast(page);
    await tab(page, /^Invitations et demandes/);
    // « Inviter un membre » : une adresse fausse est refusée, puis l'invitation part.
    await main(page).getByRole("button", { name: "Inviter", exact: true }).click();
    const invite = page.getByRole("dialog", { name: "Inviter un membre" });
    await invite.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(invite.getByText("Écrivez une adresse e-mail valide")).toBeVisible();
    const email = `nouveau.${Date.now().toString(36)}@baobab-fictive.cd`;
    await invite.getByLabel("Adresse e-mail").fill(email);
    await invite.getByRole("radio", { name: "Lecteur" }).click();
    await invite.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await toast(page, `Invitation envoyée par e-mail à ${email}`);
    await closeToast(page);
    await expect(main(page).getByText(email)).toBeVisible();
    await main(page).getByRole("button", { name: "Inviter un membre" }).click();
    await page
      .getByRole("dialog", { name: "Inviter un membre" })
      .getByRole("button", { name: "Annuler" })
      .click();

    await expectAccessible(page);
  });

  test("un membre fait avancer ses tâches dans « Mes tâches »", async ({ page }) => {
    await logIn(page, "patrice.equipe@jumanly.test");
    await page.goto("/app/hire/taches");
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Mes tâches");
    await shot(page, "077b-mes-taches");
    await main(page).getByRole("button", { name: "Accepter" }).first().click();
    await toast(page, "Tâche passée à « Acceptée »");
    await main(page).getByRole("button", { name: "Commencer" }).first().click();
    await toast(page, "Tâche passée à « En cours »");
    await main(page).getByRole("button", { name: "Marquer comme terminée" }).first().click();
    await toast(page, "Tâche terminée : l'administrateur est prévenu");
    await expectAccessible(page);
  });

  test("avec des permissions avancées, un droit retiré ferme le geste", async ({
    page,
    browser,
  }) => {
    await logIn(page, "groupe@jumanly.test");
    await page.goto(PAGE);
    await card(page, "Moïse Fictif").click();
    const stats = main(page).getByRole("switch", { name: "Voir l'évolution et les statistiques" });
    await expect(
      main(page).getByRole("switch", { name: "Publier et modifier les offres" }),
    ).toBeDisabled();
    if ((await stats.getAttribute("aria-checked")) === "false") {
      await stats.click();
      await toast(page, /Droit accordé à Moïse/);
      await closeToast(page);
    }
    await stats.click();
    await toast(page, "Droit retiré à Moïse : voir l'évolution et les statistiques");
    await expect(stats).toHaveAttribute("aria-checked", "false");

    const other = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
    const manager = await other.newPage();
    await logIn(manager, "manager@jumanly.test");
    const lost = manager.getByRole("heading", { level: 1, name: "Cette page est introuvable" });
    await manager.goto("/app/hire/rapports");
    await expect(lost).toBeVisible();
    // L'Équipe reste fermée à un manager, et la partie ENTREPRISE n'apparaît pas.
    await manager.goto(PAGE);
    await expect(lost).toBeVisible();
    await expect(manager.getByRole("navigation", { name: "Entreprise" })).toHaveCount(0);
    await other.close();

    await stats.click();
    await toast(page, "Droit accordé à Moïse : voir l'évolution et les statistiques");
  });
});

test.describe("Étape 3 · Équipe sur un téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le téléphone affiche « À ouvrir sur un ordinateur ».");

  test("« À ouvrir sur un ordinateur » remplace l'Équipe", async ({ page }) => {
    await logIn(page, OWNER);
    await page.goto(PAGE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await page.getByRole("button", { name: "Copier le lien" }).click();
    await page.getByRole("link", { name: "Retour à mon espace" }).click();
    await expect(page).toHaveURL(/\/app/);
  });
});
