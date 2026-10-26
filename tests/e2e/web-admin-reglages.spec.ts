import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { logIn } from "./session";

// Étape 3 · A5 (docs/modele-b-recruteur/web, captures 084 à 087) : Journal des consultations et
// Réglages du recrutement de Baobab Fintech (entreprise fictive, seed `prisma/seed/entreprise.ts`),
// chaque bouton répond. Avec CAPTURE_DIR, les écrans sont photographiés à la largeur CAPTURE_WIDTH
// (1440 par défaut). Le test change les réglages puis les remet ; relancer `pnpm db:seed` avant de
// le rejouer si un passage s'est arrêté en route.

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;
const OWNER = "recruteur6.ux@jumanly.test";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${WIDTH}.png`) });
}

const main = (page: Page) => page.locator("main .ae-page").filter({ visible: true });
const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator(".ae-toast").filter({ hasText: text })).toBeVisible();
const closeToast = async (page: Page) => {
  await page.locator(".ae-toast").getByRole("button", { name: "Fermer" }).click();
  await expect(page.locator(".ae-toast")).toBeHidden();
};

test.describe("Étape 3 · Journal et réglages", () => {
  test.skip(({ isMobile }) => isMobile, "Le journal et les réglages se gèrent sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });
  test.describe.configure({ mode: "serial" });

  test("l'administrateur lit le journal de l'équipe et le filtre par membre", async ({ page }) => {
    await logIn(page, OWNER);
    await page.goto("/app/hire");
    const company = page.getByRole("navigation", { name: "Entreprise" }).first();
    await company.getByRole("link", { name: "Journal" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/journal$/);
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(
      "Journal des consultations",
    );
    await expect(company.getByRole("link", { name: "Journal" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const table = main(page).getByRole("table");
    // The eight lines of the seed (other runs may add consultations of the team).
    const lines = table.locator("tbody tr");
    await expect(lines.nth(7)).toBeVisible();
    await expect(table).toContainText("CV ouvert");
    await expect(table).toContainText("Profil consulté (talent visible)");
    await expect(table).toContainText("Rapport exporté en PDF");
    await expect(table).toContainText("Évaluation enregistrée");
    await expect(table.getByRole("row").filter({ hasText: "Rapport exporté" })).toContainText(
      "Aucune personne",
    );
    await expectAccessible(page);
    await shot(page, "084-journal");

    const filters = main(page).getByRole("navigation", { name: "Filtrer par membre" });
    await filters.getByRole("link", { name: "Patrice" }).click();
    await expect(page).toHaveURL(/membre=/);
    await expect(filters.getByRole("link", { name: "Patrice" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(lines.first()).toContainText("Patrice");
    for (const line of await lines.all()) await expect(line).toContainText("Patrice");
    await filters.getByRole("link", { name: "Toute l'équipe" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/journal$/);
    await expect(lines.nth(7)).toBeVisible();

    // Le rapport mène aux rapports, une ligne de candidature à la candidature.
    await table.getByRole("link", { name: /Rapport exporté en PDF/ }).click();
    await expect(page).toHaveURL(/\/app\/hire\/rapports$/);
    await page.goto("/app/organisation/journal");
    await table.getByRole("link", { name: /^Ouvrir : CV ouvert/ }).click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/]+$/);
  });

  test("l'administrateur règle les étapes, un modèle de message et la grille", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, OWNER);
    await page.goto("/app/hire");
    const company = page.getByRole("navigation", { name: "Entreprise" }).first();
    await company.getByRole("link", { name: "Réglages" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/reglages$/);
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(
      "Réglages du recrutement",
    );

    // Étapes : « Test pratique » s'ajoute puis se retire ; les étapes fixes n'ont pas de bouton.
    const stages = main(page).getByRole("region", { name: "Étapes des nouvelles offres" });
    await expect(stages.getByRole("listitem")).toHaveCount(5);
    await expect(stages.getByText("Toujours présente")).toHaveCount(2);
    await expectAccessible(page);
    await shot(page, "085-reglages-etapes");
    await stages.getByRole("button", { name: "Ajouter « Test pratique »" }).click();
    await toast(page, "« Test pratique » est ajoutée aux nouvelles offres");
    await closeToast(page);
    await expect(stages.getByRole("listitem")).toHaveCount(6);
    await stages.getByRole("button", { name: "Retirer l'étape Test pratique" }).click();
    await toast(page, "« Test pratique » est retirée des nouvelles offres");
    await closeToast(page);
    await stages.getByRole("button", { name: "Retirer l'étape En examen" }).click();
    await toast(page, "« En examen » est retirée des nouvelles offres");
    await closeToast(page);
    await stages.getByRole("button", { name: "Ajouter « En examen »" }).click();
    await toast(page, "« En examen » est ajoutée aux nouvelles offres");
    await closeToast(page);
    await stages.getByRole("button", { name: "Ajouter « Proposition »" }).click();
    await toast(page, "« Proposition » est ajoutée aux nouvelles offres");
    await closeToast(page);
    await stages.getByRole("button", { name: "Retirer l'étape Proposition" }).click();
    await toast(page, /Proposition/);
    await closeToast(page);
    await stages.getByRole("button", { name: "Retirer l'étape Présélectionnée" }).click();
    await toast(page, /Présélectionnée/);
    await closeToast(page);
    await stages.getByRole("button", { name: "Ajouter « Présélectionnée »" }).click();
    await toast(page, /Présélectionnée/);
    await closeToast(page);
    await stages.getByRole("button", { name: "Retirer l'étape Entretien" }).click();
    await toast(page, /Entretien/);
    await closeToast(page);
    await stages.getByRole("button", { name: "Ajouter « Entretien »" }).click();
    await toast(page, /Entretien/);
    await closeToast(page);
    await expect(stages.getByRole("listitem")).toHaveCount(5);

    // Modèles : chaque type s'ouvre ; « Non retenu, avec conseil » s'enregistre.
    await main(page).getByRole("tab", { name: "Modèles de messages" }).click();
    const kinds = main(page).getByRole("list", { name: "Modèles de messages" });
    for (const name of [
      "Inviter à un entretien",
      "Demander un document",
      "Relancer",
      "Proposition d'embauche",
      "Non retenu, avec conseil",
    ]) {
      await kinds.getByRole("button", { name }).click();
      await expect(kinds.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
      await expect(main(page).getByRole("heading", { level: 2, name })).toBeVisible();
    }
    const text = main(page).getByLabel("Texte du modèle Non retenu, avec conseil");
    await expect(text).toHaveValue(/\{prenom\}/);
    await expectAccessible(page);
    await shot(page, "086-reglages-modeles");
    await text.fill("");
    await main(page).getByRole("button", { name: "Enregistrer" }).click();
    await toast(page, "Écrivez le texte du modèle, deux caractères au moins");
    await closeToast(page);
    await text.fill(
      "Bonjour {prenom}, merci pour votre candidature au poste {poste}. Votre profil reste dans notre vivier. {signataire}",
    );
    await main(page).getByRole("button", { name: "Enregistrer" }).click();
    await toast(page, "Modèle « Non retenu, avec conseil » enregistré");
    await closeToast(page);

    // Grille : un critère refusé, un ajouté puis retiré.
    await main(page).getByRole("tab", { name: "Grille d'entretien" }).click();
    const grid = main(page).getByRole("region", { name: "Critères de la grille" });
    await expect(grid.getByRole("listitem")).toHaveCount(5);
    await expectAccessible(page);
    await shot(page, "087-reglages-grille");
    const input = grid.getByLabel("Ajouter un critère");
    await input.fill("Communication");
    await grid.getByRole("button", { name: "Ajouter", exact: true }).click();
    await toast(page, "Ce critère est déjà dans la grille");
    await closeToast(page);
    await input.fill("Rigueur");
    await grid.getByRole("button", { name: "Ajouter", exact: true }).click();
    await toast(page, "« Rigueur » est ajouté à la grille");
    await closeToast(page);
    await expect(input).toHaveValue("");
    await expect(grid.getByRole("listitem")).toHaveCount(6);
    await grid.getByRole("button", { name: "Retirer le critère Rigueur" }).click();
    await toast(page, "« Rigueur » est retiré de la grille");
    await closeToast(page);
    await expect(grid.getByRole("listitem")).toHaveCount(5);
  });

  test("un manager n'a ni le journal ni les réglages", async ({ page }) => {
    await logIn(page, "patrice.equipe@jumanly.test");
    for (const path of ["/app/organisation/journal", "/app/organisation/reglages"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Cette page est introuvable" })).toBeVisible();
    }
  });
});

test.describe("Étape 3 · Journal et réglages sur un téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le téléphone affiche « À ouvrir sur un ordinateur ».");

  test("« À ouvrir sur un ordinateur » remplace le journal et les réglages", async ({ page }) => {
    await logIn(page, OWNER);
    for (const path of ["/app/organisation/journal", "/app/organisation/reglages"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "À ouvrir sur un ordinateur",
      );
    }
  });
});
