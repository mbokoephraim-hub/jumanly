import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { logIn } from "./session";

// Étape 3 · A3 (docs/modele-b-recruteur/web, captures 081 et 082) : la Page entreprise de Baobab
// Fintech (entreprise fictive, seed `prisma/seed/entreprise.ts`), chaque bouton répond. Avec
// CAPTURE_DIR, les écrans sont photographiés à la largeur CAPTURE_WIDTH (1440 par défaut). Le seed
// remet la page en place : relancer `pnpm db:seed` avant de rejouer ce fichier.

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;
const OWNER = "recruteur6.ux@jumanly.test";
const MANAGER = "aline.equipe@jumanly.test";
const ORG = "Baobab Fintech (entreprise fictive)";
const PAGE = "/app/organisation";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${WIDTH}.png`) });
}

// The screen shown: earlier routes stay hidden in the page (Next cacheComponents).
const main = (page: Page) => page.locator("main .ae-page").filter({ visible: true });
const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator(".ae-toast").filter({ hasText: text })).toBeVisible();
const closeToast = async (page: Page) => {
  await page.locator(".ae-toast").getByRole("button", { name: "Fermer" }).click();
  await expect(page.locator(".ae-toast")).toBeHidden();
};

test.describe("Étape 3 · Page entreprise", () => {
  test.skip(({ isMobile }) => isMobile, "La page entreprise se modifie sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });
  test.describe.configure({ mode: "serial" });

  test("l'administrateur modifie la page, la voit comme un talent et répond aux déclarations", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await logIn(page, OWNER);
    await page.goto("/app/hire");
    const company = page.getByRole("navigation", { name: "Entreprise" }).first();
    await company.getByRole("link", { name: "Page entreprise" }).click();
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Page entreprise");
    await expect(company.getByRole("link", { name: "Page entreprise" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(main(page).getByLabel("Nom", { exact: true })).toHaveValue(ORG);
    await expect(main(page).getByRole("heading", { name: "Entreprise vérifiée" })).toBeVisible();
    await expect(main(page).getByRole("list", { name: /membres confirmés/ })).toBeVisible();
    await expectAccessible(page);
    await shot(page, "081-page-entreprise");

    // La vue publique, avant toute réponse : les personnes déclarées sont « Indiqué par la personne ».
    await main(page).getByRole("link", { name: "Voir la page publique" }).click();
    await expect(page).toHaveURL(/\/app\/organisation\/apercu$/);
    await expect(main(page).getByRole("heading", { level: 1 })).toContainText(ORG);
    await expect(main(page).getByText("Recrute en ce moment", { exact: true })).toBeVisible();
    await expect(main(page).getByText(/paiement mobile simple/)).toBeVisible();
    await main(page)
      .getByRole("tab", { name: /Membres/ })
      .click();
    const fabrice = main(page).getByRole("listitem").filter({ hasText: "Fabrice Démo" });
    await expect(fabrice).toContainText("Indiqué par la personne");
    await expect(
      main(page).getByRole("listitem").filter({ hasText: "Clarisse" }).first(),
    ).toContainText(`Confirmé par ${ORG}`);
    await expectAccessible(page);
    await shot(page, "082-vue-publique");
    await main(page)
      .getByRole("tab", { name: /Offres/ })
      .click();
    const offer = main(page).getByRole("link", { name: /Analyste de données junior/ });
    await expect(offer).toBeVisible();
    await main(page)
      .getByRole("tab", { name: /propos/ })
      .click();
    await expect(main(page).getByText("Site : baobab-fintech.example")).toBeVisible();
    await main(page)
      .getByRole("tab", { name: /Offres/ })
      .click();
    await offer.click();
    await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/]+$/);
    await page.goto(`${PAGE}/apercu`);
    await main(page).getByRole("link", { name: "Modifier la page" }).click();
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));

    // Bannière : une image, puis on la retire ; le logo : la fenêtre se ferme sans rien changer.
    const picture = await sharp({
      create: { width: 1200, height: 600, channels: 3, background: "#1FA98A" },
    })
      .png()
      .toBuffer();
    const banner = main(page).locator(".ae-pe-ban");
    await main(page).getByRole("button", { name: "Changer la bannière" }).click();
    const bannerDialog = page.getByRole("dialog", { name: "Bannière de l'entreprise" });
    await expect(bannerDialog.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
    await bannerDialog
      .locator('input[type="file"]')
      .setInputFiles({ name: "banniere.png", mimeType: "image/png", buffer: picture });
    await bannerDialog.getByRole("button", { name: "Enregistrer" }).click();
    await toast(page, "Les changements sont en ligne");
    await closeToast(page);
    await expect(banner).toHaveAttribute("style", /\/medias\/orgs\/.*banner-/);
    await main(page).getByRole("button", { name: "Changer la bannière" }).click();
    await page.getByRole("button", { name: "Retirer la bannière" }).click();
    await toast(page, "Les changements sont en ligne");
    await closeToast(page);
    await expect(banner).not.toHaveAttribute("style", /\/medias\/orgs\//);
    await main(page).getByRole("button", { name: "Changer le logo" }).click();
    const logoDialog = page.getByRole("dialog", { name: "Logo de l'entreprise" });
    await expect(logoDialog).toBeVisible();
    await logoDialog.getByRole("button", { name: "Annuler" }).click();
    await expect(logoDialog).toBeHidden();

    // Les champs : un site refusé, puis la ville et le site corrigés ; le badge se règle.
    const site = main(page).getByLabel("Site", { exact: true });
    await site.fill("pas un site");
    await main(page).getByRole("button", { name: "Publier les changements" }).click();
    await toast(page, "Cette adresse de site n'est pas valide");
    await expect(site).toHaveAttribute("aria-invalid", "true");
    await closeToast(page);
    await site.fill("baobab-fintech.example");
    await main(page).getByLabel("Ville", { exact: true }).fill("Lubumbashi");
    await main(page).getByLabel("Taille", { exact: true }).selectOption("201-1000");
    const badge = main(page).getByRole("switch", { name: "Badge « Recrute en ce moment »" });
    await expect(badge).toHaveAttribute("aria-checked", "true");
    await badge.click();
    await expect(badge).toHaveAttribute("aria-checked", "false");
    await main(page).getByRole("button", { name: "Publier les changements" }).click();
    await toast(page, "Les changements sont en ligne");
    await closeToast(page);
    await expect(main(page).getByText("Data et finance · Lubumbashi")).toBeVisible();
    await badge.click();
    await main(page).getByRole("button", { name: "Publier les changements" }).click();
    await toast(page, "Les changements sont en ligne");
    await closeToast(page);

    // Membres déclarés : Fabrice ne travaille pas ici, Sandra est confirmée.
    await main(page).getByRole("button", { name: "Fabrice Démo ne travaille pas ici" }).click();
    await toast(page, /Fabrice Démo/);
    await closeToast(page);
    await main(page).getByRole("button", { name: "Confirmer Sandra Démo" }).click();
    await toast(page, /Sandra Démo/);
    await closeToast(page);
    await expect(
      main(page).getByText("Personne n'attend de réponse pour le moment."),
    ).toBeVisible();
    await page.goto(`${PAGE}/apercu?onglet=membres`);
    await expect(main(page).getByRole("listitem").filter({ hasText: "Sandra Démo" })).toContainText(
      `Confirmé par ${ORG}`,
    );
    await expect(main(page).getByRole("listitem").filter({ hasText: "Fabrice Démo" })).toHaveCount(
      0,
    );
    await expect(main(page).getByText("201 à 1 000 personnes", { exact: false })).toBeVisible();

    // La propriété : la fenêtre s'annule, puis la page passe à Aline.
    await page.goto(PAGE);
    await main(page).getByRole("button", { name: "Transférer la propriété" }).click();
    const transfer = page.getByRole("dialog", { name: "Transférer la propriété" });
    await transfer.getByRole("button", { name: "Annuler" }).click();
    await expect(transfer).toBeHidden();
    await main(page).getByRole("button", { name: "Transférer la propriété" }).click();
    await transfer.getByRole("radio", { name: "Aline Démo" }).click();
    await transfer.getByRole("button", { name: "Transférer" }).click();
    await toast(page, "Aline Démo est maintenant propriétaire de la page");
    await expect(main(page).getByRole("button", { name: "Transférer la propriété" })).toHaveCount(
      0,
    );
  });

  test("la nouvelle propriétaire rend la page, et un manager n'y a pas accès", async ({ page }) => {
    // Aline, propriétaire depuis le test précédent, rend la page à Clarisse.
    await logIn(page, MANAGER);
    await page.goto(PAGE);
    await main(page).getByRole("button", { name: "Transférer la propriété" }).click();
    const transfer = page.getByRole("dialog", { name: "Transférer la propriété" });
    await transfer.getByRole("radio", { name: /Clarisse/ }).click();
    await transfer.getByRole("button", { name: "Transférer" }).click();
    await toast(page, /est maintenant propriétaire de la page/);
    await page.context().clearCookies();

    // Patrice, manager : ni la page, ni la vue publique, ni la section Entreprise.
    await logIn(page, "patrice.equipe@jumanly.test");
    for (const path of [PAGE, `${PAGE}/apercu`]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Cette page est introuvable" })).toBeVisible();
    }
    await page.goto("/app/hire");
    await expect(page.getByRole("navigation", { name: "Entreprise" })).toHaveCount(0);
  });
});

test.describe("Étape 3 · Page entreprise sur un téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le téléphone affiche « À ouvrir sur un ordinateur ».");

  test("« À ouvrir sur un ordinateur » remplace la Page entreprise", async ({ page }) => {
    await logIn(page, OWNER);
    for (const path of [PAGE, `${PAGE}/apercu`]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "À ouvrir sur un ordinateur",
      );
    }
  });
});
