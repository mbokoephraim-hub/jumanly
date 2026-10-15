import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn, testEmail } from "./session";

/**
 * Jumanly Admin v2 · recette (docs/admin-v2/PLAN-ADMIN.md, étape 1): every screen opens for the
 * roles allowed to see it and stays hidden from the others; the actions that no other journey
 * covers are run once, and each one leaves its line in the journal d'audit.
 */

const adminPages: [path: string, title: string][] = [
  ["/admin", "Indicateurs"],
  ["/admin/utilisateurs", "Utilisateurs"],
  ["/admin/organisations", "Organisations"],
  ["/admin/forfaits", "Forfaits et droits"],
  ["/admin/forfaits/talent_free", "Forfaits et droits"],
  ["/admin/abonnements", "Abonnements"],
  ["/admin/formations", "Formations"],
  ["/admin/offres", "Modération des offres"],
  ["/admin/partenaires", "Partenaires"],
  ["/admin/ia", "IA et matching"],
  ["/admin/contenus", "Contenus"],
  ["/admin/signalements", "Signalements"],
  ["/admin/journal", "Journal d'audit"],
  ["/admin/recherche", "Recherche"],
];

/** A fresh fictional account created in the database, so the shared demo accounts stay intact. */
function makeAccount(prefix: string, name: string) {
  const email = testEmail(prefix);
  const id = execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-account.ts",
    email,
    name,
  ]).toString();
  return { email, id: id.trim().split("\n").at(-1)! };
}

async function expectTitle(page: Page, title: string) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
}

test("chaque écran de l'admin s'ouvre pour l'administrateur", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await logIn(page, demo.admin);
  for (const [path, title] of adminPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  expect(errors).toEqual([]);
});

const notFoundTitle = "Cette page est introuvable";
/** Course and content editing tools: content editors and administrators only. */
const contentPaths = ["/admin/formations", "/admin/contenus"];

test("le support voit tout sans pouvoir agir", async ({ page }) => {
  test.setTimeout(120_000);
  await logIn(page, demo.support);
  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  await page.goto("/admin");
  await expect(nav.getByRole("link", { name: "Formations" })).toHaveCount(0);
  for (const [path, title] of adminPages.filter(([path]) => !contentPaths.includes(path))) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  await expect(page.getByText("Votre rôle Support permet de consulter").first()).toBeVisible();
  await page.goto("/admin/utilisateurs?q=talent.free%40jumanly.test");
  await page.getByRole("link", { name: "Amani Fictif" }).filter({ visible: true }).first().click();
  const card = page.locator("#utilisateurs-fiche");
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "Suspendre le compte" })).toHaveCount(0);
  await expect(page.locator("#utilisateurs-roles")).toHaveCount(0);
});

test("l'éditeur de contenus ne voit que les formations et les contenus", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.editor);
  for (const [path, title] of [
    ["/admin/formations", "Formations"],
    ["/admin/contenus", "Contenus"],
    ["/admin/recherche", "Recherche"],
  ] as const) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  // Pages outside their role answer « introuvable » (the admin is not revealed).
  for (const path of ["/admin/utilisateurs", "/admin/journal", "/admin/forfaits"]) {
    await page.goto(path);
    await expectTitle(page, notFoundTitle);
  }
  // The search only looks into the courses.
  await page.goto("/admin/recherche?q=cv");
  await expect(page.getByRole("heading", { name: "Comptes" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Formations", level: 2 })).toBeVisible();
});

test("suspendre, réactiver et changer le rôle d'un compte, puis le lire dans le journal", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const account = makeAccount("suspension", "Compte Suspendu Fictif");
  await logIn(page, demo.admin);
  await page.goto(`/admin/utilisateurs?fiche=${account.id}`);
  const card = page.locator("#utilisateurs-fiche");
  await expect(card.getByText(account.email)).toBeVisible();

  // Suspension, with its required reason.
  await card.getByRole("link", { name: "Suspendre le compte" }).click();
  await page.locator("#utilisateurs-suspend-reason").fill("Recette de l'admin : compte fictif");
  await page.getByRole("button", { name: "Suspendre le compte" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Utilisateur mis à jour" }),
  ).toBeVisible();
  await expect(card.getByText("Suspendu").first()).toBeVisible();

  // Reactivation.
  await card.getByRole("button", { name: "Réactiver le compte" }).click();
  await expect(card.getByText("Actif").first()).toBeVisible();

  // Platform role: Support, then back to no role.
  const roles = page.locator("#utilisateurs-roles");
  await roles.getByLabel("Support", { exact: true }).check();
  await roles.getByRole("button", { name: "Enregistrer le rôle" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Utilisateur mis à jour" }),
  ).toBeVisible();
  await page.locator("#utilisateurs-roles").getByLabel("Aucun rôle plateforme").check();
  await page
    .locator("#utilisateurs-roles")
    .getByRole("button", { name: "Enregistrer le rôle" })
    .click();

  // The card's history and the journal tell the story, with the reason.
  const history = page.getByRole("region", { name: "Historique" });
  await expect(history.getByText("a suspendu le compte")).toBeVisible();
  await expect(history.getByText("a réactivé le compte")).toBeVisible();
  await expect(history.getByText("a changé le rôle plateforme").first()).toBeVisible();
  await page.getByRole("link", { name: "Voir dans le journal" }).click();
  await expectTitle(page, "Journal d'audit");
  await expect(
    page.getByText("Motif : Recette de l'admin : compte fictif").filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText("4 actions").filter({ visible: true })).toBeVisible();
  await expectAccessible(page);

  // Export of the filtered journal.
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exporter en CSV" }).click();
  const file = await (await download).path();
  const { readFileSync } = await import("node:fs");
  const csv = readFileSync(file, "utf8");
  expect(csv).toContain("user.suspend");
  expect(csv).toContain("Recette de l'admin : compte fictif");
});

test("la recherche globale trouve comptes, organisations et forfaits", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin");
  const search = page.getByRole("searchbox", {
    name: "Rechercher un compte, une organisation, une offre, une formation ou un forfait",
  });
  await search.filter({ visible: true }).fill("horizon");
  await search.filter({ visible: true }).press("Enter");
  await expectTitle(page, "Recherche");
  await expect(page.getByRole("heading", { name: "Organisations", level: 2 })).toBeVisible();
  await page.goto("/admin/recherche?q=starter");
  await expect(page.getByRole("heading", { name: "Forfaits", level: 2 })).toBeVisible();
  await page.goto("/admin/recherche?q=talent.free%40jumanly.test");
  await page.getByRole("link", { name: /Amani Fictif/ }).click();
  await expect(page.locator("#utilisateurs-fiche")).toBeVisible();
  await page.goto("/admin/recherche?q=zzzz-introuvable");
  await expect(page.getByText("Rien trouvé")).toBeVisible();
  await expectAccessible(page);
});

test("les poids du matching s'enregistrent et laissent leur trace", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin/ia?onglet=poids");
  await page.locator("#ia-weights-note").fill("Recette de l'admin : mêmes poids");
  await page.getByRole("button", { name: "Enregistrer les poids" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /enregistr/i })
      .first(),
  ).toBeVisible();
  await page.goto("/admin/journal?action=matching");
  await expect(
    page.getByText("Motif : Recette de l'admin : mêmes poids").filter({ visible: true }).first(),
  ).toBeVisible();
});

test("les indicateurs montrent les forfaits utilisés et se complètent avec les coûts", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin");
  await expectTitle(page, "Indicateurs");
  const plans = page.getByRole("region", { name: "Forfaits utilisés" });
  await expect(plans.getByRole("heading", { name: "Talents" })).toBeVisible();
  // Free plans count too, and a plan opens the list of its accounts.
  await plans.getByRole("link", { name: /^Free/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/utilisateurs\?forfait=/);
  await expectTitle(page, "Utilisateurs");

  // Costs: entered for the current month, they feed the dashboard.
  await page.goto("/admin/indicateurs/couts");
  await expectTitle(page, "Coûts mensuels");
  await page.getByLabel("Hébergement et services techniques").fill("120,50");
  await page.getByLabel("Acquisition (publicité, campagnes)").fill("300");
  await page.getByRole("button", { name: "Enregistrer les coûts" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Coûts du mois enregistrés" }),
  ).toBeVisible();
  await expect(page.getByLabel("Hébergement et services techniques")).toHaveValue("120,50");
  await expectAccessible(page);

  await page.goto("/admin");
  const costs = page.getByRole("region", { name: "Coûts et rentabilité" });
  await expect(costs.getByText(/Coûts de la période, IA comprise/)).toBeVisible();
  await expect(costs.getByRole("link", { name: "Modifier les coûts" })).toBeVisible();
  await expectAccessible(page);
});
