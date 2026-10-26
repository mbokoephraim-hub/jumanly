import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { holdBaobab } from "./baobab-lock";
import { expectAccessible } from "./a11y";
import { logIn, testEmail } from "./session";

// Recruteur sur ordinateur (Modèle B) · N1 (docs/modele-b-recruteur/web, captures 030 à 032,
// 074 et 075) : la barre latérale, la barre du haut (titre, recherche en deux temps, cloche,
// « Publier une offre »), le bouton Orbi et l'accueil, vu par un manager (Patrice, de
// Baobab Fintech, entreprise fictive ; son rôle reste celui du seed) et par l'administratrice (Clarisse). Chaque bouton répond.
// Avec CAPTURE_DIR, les écrans sont photographiés à 1440 et à 1024. Le seed remet l'équipe en
// place : relancer `pnpm db:seed` avant de rejouer ce fichier.

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const RECRUITER = "patrice.equipe@jumanly.test";
const OWNER = "recruteur6.ux@jumanly.test";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  const width = page.viewportSize()?.width ?? 1440;
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${width}.png`) });
}

const main = (page: Page) => page.locator("main").filter({ visible: true });
const side = (page: Page) => page.locator(".rb-side");
const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator(".jm-toast, .ae-toast").filter({ hasText: text }).last()).toBeVisible();
const card = (page: Page, title: string | RegExp) =>
  main(page)
    .locator("section.rb-carte")
    .filter({ has: page.getByRole("heading", { name: title }) });

test.describe("Recruteur sur ordinateur · N1, cadre et accueil", () => {
  test.skip(({ isMobile }) => isMobile, "Le cadre du recruteur sur ordinateur.");
  test.use({ viewport: { width: 1440, height: 900 } });
  test.describe.configure({ mode: "serial" });
  // Baobab Fintech is shared by the other files of the company space: one at a time.
  let release = () => {};
  test.beforeAll(async () => {
    test.setTimeout(600_000);
    release = await holdBaobab();
  });
  test.afterAll(() => release());

  test("la recruteuse : barre latérale, barre du haut, Orbi et accueil", async ({ page }) => {
    test.setTimeout(240_000);
    await logIn(page, RECRUITER);

    // « Bienvenue » after the first steps (capture 031): « Commencer » closes it.
    await page.goto("/app/hire?bienvenue=1");
    const welcome = page.getByRole("dialog", { name: "Bienvenue, Patrice" });
    await expect(welcome).toBeVisible();
    await expect(welcome.getByText("Vos candidatures")).toBeVisible();
    await shot(page, "n1-recruteuse-bienvenue");
    await welcome.getByRole("button", { name: "Commencer" }).click();
    await expect(welcome).toBeHidden();
    await expect(page).toHaveURL(/\/app\/hire$/);

    // The home (capture 032).
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Bonjour Patrice");
    await expect(page.locator(".rb-top-h")).toHaveText("Accueil");
    await expect(page.getByRole("link", { name: "Publier une offre" })).toHaveCount(0);
    await expectAccessible(page);
    await shot(page, "n1-recruteuse-accueil");

    // Every entry of the sidebar leads to its page and lights up.
    const nav = side(page).getByRole("navigation", { name: "Navigation du recrutement" });
    for (const [name, url, title] of [
      ["Fil", /\/app\/hire\/fil$/, "Fil"],
      ["Offres", /\/app\/hire\/offres$/, "Offres"],
      ["Candidatures", /\/app\/hire\/candidats$/, "Candidatures"],
      ["Agenda", /\/app\/hire\/entretiens$/, "Agenda"],
      ["Talents", /\/app\/hire\/talents$/, "Talents"],
      [/^Messages/, /\/app\/messages$/, "Messages"],
      ["Accueil", /\/app\/hire$/, "Accueil"],
    ] as const) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
      await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".rb-top-h")).toHaveText(title);
    }
    const pilotage = side(page).getByRole("navigation", { name: "Pilotage" });
    await pilotage.getByRole("link", { name: "Tableau de bord" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/rapports$/);
    await pilotage.getByRole("link", { name: "Mon espace" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/taches$/);
    await side(page).getByRole("link", { name: "Compte" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/compte$/);
    // ENTREPRISE belongs to the owner and the administrators.
    await expect(page.getByRole("navigation", { name: "Entreprise" })).toHaveCount(0);
    // « Changer de profil » opens the sheet of the spaces.
    await side(page).getByRole("button", { name: "Patrice Démo : changer de profil" }).click();
    await expect(
      page.getByRole("dialog").filter({ hasText: "Baobab Fintech" }).first(),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // The logo goes home.
    await side(page).getByRole("link", { name: "Jumanly, aller à l'accueil" }).click();
    await expect(page).toHaveURL(/\/app\/hire$/);

    // The search: the scopes first, then the results; « Fermer » and the cross clear it. A
    // manager only finds the applications of the offers she follows: none here.
    const search = page.getByRole("searchbox", { name: "Rechercher des candidats" });
    await search.click();
    const results = page.getByRole("region", { name: "Résultats de la recherche" });
    await expect(results.getByRole("group", { name: "Rechercher dans" })).toBeVisible();
    await results.getByRole("button", { name: "Nom" }).click();
    await expect(results.getByRole("button", { name: "Nom" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await search.fill("Amani");
    await expect(results.getByRole("status")).toContainText("Aucun résultat");
    await page.getByRole("button", { name: "Effacer la recherche" }).click();
    await expect(search).toHaveValue("");
    await results.getByRole("button", { name: "Fermer" }).click();
    await expect(results).toBeHidden();

    // The bell opens the notifications.
    await page.getByRole("button", { name: /^Notifications/ }).click();
    await expect(page.locator("#t-notifs")).toBeVisible();
    await page.keyboard.press("Escape");

    // Orbi, from the floating button and from « Orbi résume ».
    await page.getByRole("button", { name: "Ouvrir Orbi" }).click();
    const panel = page.getByRole("dialog", { name: "Orbi" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Fermer Orbi" }).click();
    await expect(panel).toBeHidden();
    await card(page, "Orbi résume")
      .getByRole("button", { name: "Ouvrir la conversation complète" })
      .click();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Fermer Orbi" }).click();

    // The tiles, the cards and their links.
    const tiles = main(page).getByRole("list", { name: "Les chiffres du jour" });
    await tiles
      .getByRole("listitem")
      .filter({ hasText: /tâches? à faire/ })
      .click();
    await expect(page).toHaveURL(/\/app\/hire\/taches$/);
    await page.goto("/app/hire");
    await main(page).getByRole("link", { name: "Ouvrir l'agenda" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/entretiens$/);
    await page.goto("/app/hire");
    await card(page, "Mes tâches").getByRole("link", { name: "Mon espace" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/taches$/);
    await page.goto("/app/hire");
    await card(page, "Offres").getByRole("link", { name: "Toutes les offres" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres$/);
    await page.goto("/app/hire");
    // « À traiter »: each row leads to its page, or the card says there is nothing.
    const todo = card(page, "À traiter").getByRole("link");
    if ((await todo.count()) > 0) {
      await todo.first().click();
      await expect(page).not.toHaveURL(/\/app\/hire$/);
      await page.goto("/app/hire");
    } else {
      await expect(card(page, "À traiter")).toContainText("Rien à traiter pour l'instant.");
    }

    // The first step of a task (« Accepter », « Commencer » or « Marquer comme terminée »).
    await card(page, "Mes tâches").getByRole("button").first().click();
    await toast(page, /^Tâche (terminée|passée à)/);
  });

  test("l'administratrice : ENTREPRISE, à valider, tâches de l'équipe et le mois", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await logIn(page, OWNER);
    await page.goto("/app/hire?bienvenue=1");
    const welcome = page.getByRole("dialog", { name: "Bienvenue, Clarisse" });
    await expect(welcome.getByText("Invitez votre équipe")).toBeVisible();
    await shot(page, "n1-admin-bienvenue");
    await welcome.getByRole("button", { name: "Commencer" }).click();
    await expect(welcome).toBeHidden();
    await expectAccessible(page);
    await shot(page, "n1-admin-accueil");

    // The search finds the applications of the company and opens one.
    const search = page.getByRole("searchbox", { name: "Rechercher des candidats" });
    await search.fill("Amani");
    const results = page.getByRole("region", { name: "Résultats de la recherche" });
    await expect(results.getByRole("link", { name: /Amani Démo/ }).first()).toBeVisible();
    await shot(page, "n1-admin-recherche");
    await results
      .getByRole("link", { name: /Amani Démo/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats\/.+/);
    await page.goto("/app/hire");

    // ENTREPRISE in the sidebar.
    const company = side(page).getByRole("navigation", { name: "Entreprise" });
    for (const [name, url] of [
      ["Équipe", /\/app\/organisation\/equipe$/],
      ["Page entreprise", /\/app\/organisation$/],
      ["Formule et facturation", /\/app\/organisation\/facturation$/],
      ["Journal", /\/app\/organisation\/journal$/],
      ["Réglages", /\/app\/organisation\/reglages$/],
    ] as const) {
      await company.getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
      await expect(company.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
    }

    // « Publier une offre ».
    await page.getByRole("link", { name: "Publier une offre" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\/nouvelle$/);

    // « Inviter un membre » and « Attribuer une tâche » open the dialogs of Équipe.
    await page.goto("/app/hire");
    await main(page).getByRole("link", { name: "Inviter un membre" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe\?inviter=1$/);
    await expect(page.getByRole("dialog").filter({ visible: true }).first()).toBeVisible();
    await page.goto("/app/hire");
    await main(page).getByRole("link", { name: "Attribuer une tâche" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe\?attribuer=1$/);
    await expect(page.getByRole("dialog").filter({ visible: true }).first()).toBeVisible();

    // The tiles.
    await page.goto("/app/hire");
    const tiles = main(page).getByRole("list", { name: "Les chiffres du jour" });
    await expect(tiles.getByRole("listitem")).toHaveCount(4);
    await tiles.getByRole("listitem").filter({ hasText: "utilisateurs dans l'équipe" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe/);
    await page.goto("/app/hire");

    // À valider: a request to join refused, a person who works here confirmed. Two fictional
    // people of this test only: the seeded requests belong to the files of Équipe.
    const tag = Date.now().toString(36);
    const joiner = `Ninon N1${tag}`;
    const worker = `Odon N1${tag}`;
    const baobab = "Baobab Fintech (entreprise fictive)";
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-join.ts",
      testEmail("n1-join"),
      joiner,
      baobab,
    ]);
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-declared.ts",
      testEmail("n1-decl"),
      worker,
      baobab,
      "recruiters",
    ]);
    await page.reload();
    const validate = card(page, "À valider");
    await validate.getByRole("button", { name: `Refuser la demande de ${joiner}` }).click();
    await toast(page, /^Demande refusée/);
    await validate
      .getByRole("button", { name: `Confirmer que ${worker} travaille chez ${baobab}` })
      .click();
    await toast(page, /apparaît comme/);

    // Tâches de l'équipe: « Relancer », « Toutes les tâches ».
    const team = card(page, "Tâches de l'équipe en cours");
    await team
      .getByRole("button", { name: /^Relancer/ })
      .first()
      .click();
    await toast(page, /^Rappel envoyé à/);
    await team.getByRole("link", { name: "Toutes les tâches" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe\?onglet=taches$/);
    await page.goto("/app/hire");

    // The month in figures and its PDF.
    const month = card(page, /en chiffres$/);
    const pdf = month.getByRole("link", { name: "Rapport de recrutement du mois, en PDF" });
    const href = await pdf.getAttribute("href");
    expect(href).toBe("/app/hire/rapports/export?periode=30d");
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);

    // A tablet: the rail of icons instead of the sidebar.
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/app/hire");
    await expect(side(page)).toBeHidden();
    const rail = page.locator(".rb-rail");
    await expect(rail).toBeVisible();
    await rail.getByRole("link", { name: "Offres" }).click();
    await expect(page).toHaveURL(/\/app\/hire\/offres$/);
    await page.goto("/app/hire");
    await shot(page, "n1-admin-accueil");
  });
});
