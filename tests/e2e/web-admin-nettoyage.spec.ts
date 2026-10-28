import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { holdBaobab } from "./baobab-lock";
import { expectAccessible } from "./a11y";
import { demo, logIn, testEmail } from "./session";

// Étape 3 · A6 : la vérification et la structure (équipes, départements, entités) sur le Modèle B,
// les anciennes adresses qui mènent aux nouvelles, rien de mort pour un membre qui n'administre
// pas, et la page entreprise du talent au téléphone avec les personnes qui disent y travailler.
// Baobab Fintech, le Groupe Démo et les personnes créées ici sont fictifs. Avec CAPTURE_DIR, les
// écrans sont photographiés à la largeur CAPTURE_WIDTH (1440 par défaut).

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;
const GROUP = "groupe@jumanly.test";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${WIDTH}.png`) });
}

const main = (page: Page) => page.locator("main .ae-page").filter({ visible: true });
const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

test.describe("Étape 3 · nettoyage, sur ordinateur", () => {
  test.skip(({ isMobile }) => isMobile, "L'espace de l'entreprise se gère sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });
  // Baobab Fintech is shared by the other files of the company space: one at a time.
  let release = () => {};
  test.beforeAll(async () => {
    test.setTimeout(600_000);
    release = await holdBaobab();
  });
  test.afterAll(() => release());

  test("l'administrateur ouvre la structure et la vérification ; les anciennes adresses suivent", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // A company of its own on Company (the cheapest plan with `reports.export`, which leaves the
    // teams closed): Baobab Fintech moves to Company Plus in the billing test.
    const owner = testEmail("a6-structure");
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      owner,
      `Entreprise fictive A6 ${suffix()}`,
      "verified",
      "reports.export",
    ]);
    await logIn(page, owner, undefined, "/app/hire");
    await page.goto("/app/organisation/equipe");
    await main(page).getByRole("link", { name: "Équipes et départements" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/structure$/);
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(
      "Équipes, départements, entités",
    );
    const tabs = main(page).getByRole("navigation", { name: "Structure de l'entreprise" });
    await expect(tabs.getByRole("link", { name: "Équipes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Company n'ouvre pas les équipes : la carte le dit et mène à « Formule et facturation ».
    await expect(main(page).getByText(/Plusieurs équipes RH · Disponible avec/)).toBeVisible();
    await expectAccessible(page);
    await shot(page, "a6-structure-verrou");
    await tabs.getByRole("link", { name: "Départements" }).click();
    await expect(page).toHaveURL(/onglet=departements/);
    await expect(main(page).getByText(/Départements · Disponible avec/)).toBeVisible();
    await tabs.getByRole("link", { name: "Entités" }).click();
    await expect(page).toHaveURL(/onglet=entites/);
    await expect(main(page).getByRole("link", { name: "Demander un devis" })).toHaveAttribute(
      "href",
      "/contact?sujet=devis",
    );
    await tabs.getByRole("link", { name: "Équipes" }).click();
    await main(page).getByRole("link", { name: "Voir les formules" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/facturation$/);
    await page.goto("/app/organisation/structure");
    await main(page).getByRole("link", { name: "Équipe", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe$/);

    // Vérification : les trois étapes, l'attente, le retour à la page entreprise.
    await page.goto("/app/organisation/verification");
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(
      "Vérifier l'organisation",
    );
    await expect(
      main(page).getByRole("list", { name: "Étapes de la vérification" }).getByRole("listitem"),
    ).toHaveCount(3);
    await expect(main(page).getByText(/assistant@jumanly\.io/)).toBeVisible();
    await expectAccessible(page);
    await shot(page, "a6-verification");
    await main(page).getByRole("link", { name: "Organisation", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/organisation$/);

    // Les anciennes pages de l'abonnement et du journal mènent aux nouvelles.
    for (const path of [
      "/app/abonnement",
      "/app/abonnement/formules",
      "/app/abonnement/factures",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/app\/organisation\/facturation$/);
    }
    await page.goto("/app/parametres/consultations");
    await expect(page).toHaveURL(/\/app\/organisation\/journal$/);
    await page.goto("/app/organisation/modifier");
    await expect(page).toHaveURL(/\/app\/organisation$/);
  });

  test("le groupe crée puis supprime une équipe, un département et une entité", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await logIn(page, GROUP);
    const tag = suffix();
    for (const [tab, label, name] of [
      ["equipes", "Nom de l'équipe", `Équipe fictive ${tag}`],
      ["departements", "Nom du département", `Département fictif ${tag}`],
      ["entites", "Nom de l'entité", `Entité fictive ${tag}`],
    ] as const) {
      await page.goto(`/app/organisation/structure?onglet=${tab}`);
      await main(page).getByLabel(label).fill(name);
      await main(page).getByRole("button", { name: "Créer" }).click();
      await expect(main(page).getByRole("status")).toHaveText("Élément créé.");
      const row = main(page).getByRole("listitem").filter({ hasText: name });
      await expect(row).toBeVisible();
      if (tab === "equipes") {
        await expectAccessible(page);
        await shot(page, "a6-structure-equipes");
      }
      await row.locator("summary").click();
      await row.getByRole("button", { name: "Supprimer" }).click();
      await expect(main(page).getByRole("status")).toHaveText("Élément supprimé.");
      await expect(main(page).getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
    }
  });

  test("un manager n'a ni la structure ni la vérification, et aucun lien mort", async ({
    page,
  }) => {
    await logIn(page, "patrice.equipe@jumanly.test");
    for (const path of ["/app/organisation/structure", "/app/organisation/verification"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Cette page est introuvable" })).toBeVisible();
    }
    await page.goto("/app/hire/compte/equipe");
    await expect(page).toHaveURL(/\/app\/hire\/compte$/);
    await page.goto("/app/hire/compte");
    const visibleMain = page.locator("main").filter({ visible: true });
    await expect(visibleMain.getByRole("link", { name: /^Organisation/ })).toHaveCount(0);
    await page.goto("/app/hire");
    await page.getByRole("button", { name: /^Compte de / }).click();
    const menu = page.getByRole("dialog", { name: /^Menu du compte de / });
    await expect(menu.getByRole("link", { name: /^Paramètres/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Organisation/ })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: /^Équipe/ })).toHaveCount(0);
  });
});

test.describe("Étape 3 · page entreprise côté talent, au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "La page entreprise du talent est celle du téléphone.");

  test("Membres ne montre que les recruteurs, ni une personne déclarée ni un profil anonyme", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const company = `Entreprise fictive A6 ${suffix()}`;
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      testEmail("a6-owner"),
      company,
      "verified",
    ]);
    const slug = execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-declared.ts",
      testEmail("a6-visible"),
      "Léa Visible",
      company,
      "recruiters",
    ])
      .toString()
      .trim()
      .split("\n")
      .pop()!;
    execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-declared.ts",
      testEmail("a6-anonyme"),
      "Noa Anonyme",
      company,
      "anonymous",
    ]);
    await logIn(page, demo.talentFree);
    await page.goto(`/app/entreprises/${slug}`);
    const pile = page.locator("main");
    await pile
      .getByRole("tablist", { name: "Sections de la page" })
      .getByRole("tab", { name: "Membres" })
      .click();
    // Since 27/10/2026 (#188), Membres lists only the company's recruiters: the owner, never a
    // person who says they work there, nor an anonymous profile.
    const members = pile.locator(".nb-co-membres");
    await expect(
      members.locator(".nb-co-membre").filter({ hasText: "Recruteuse Fictive" }),
    ).toBeVisible();
    await expect(members.getByText("Léa Visible")).toHaveCount(0);
    await expect(pile.getByText("Noa Anonyme")).toHaveCount(0);
  });
});
