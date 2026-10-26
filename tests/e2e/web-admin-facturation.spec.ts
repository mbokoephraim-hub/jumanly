import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { holdBaobab } from "./baobab-lock";
import { expectAccessible } from "./a11y";
import { logIn } from "./session";

// Étape 3 · A4 (docs/modele-b-recruteur/web, capture 083) : Formule et facturation de Baobab
// Fintech (entreprise fictive, seed `prisma/seed/entreprise.ts`), chaque bouton répond. Le
// prestataire de paiement est le faux (numéros en …0000 refusés, …2222 sans réponse, carte payée).
// Avec CAPTURE_DIR, l'écran est photographié à la largeur CAPTURE_WIDTH (1440 par défaut). Le test
// paie et change la formule : relancer `pnpm db:seed` avant de le rejouer.

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;
const OWNER = "recruteur6.ux@jumanly.test";
const PAGE = "/app/organisation/facturation";

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

test.describe("Étape 3 · Formule et facturation", () => {
  test.skip(({ isMobile }) => isMobile, "La facturation de l'entreprise se gère sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });
  test.describe.configure({ mode: "serial" });
  // Baobab Fintech is shared by the other files of the company space: one at a time.
  let release = () => {};
  test.beforeAll(async () => {
    test.setTimeout(600_000);
    release = await holdBaobab();
  });
  // Back on Company for the next file, before letting go of Baobab Fintech.
  test.afterAll(() => {
    execFileSync("pnpm", ["exec", "tsx", "tests/e2e/reset-baobab.ts"]);
    release();
  });

  test("l'administrateur lit sa formule, paie, monte en gamme et programme une baisse", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await logIn(page, OWNER);
    await page.goto("/app/hire");
    const company = page.getByRole("navigation", { name: "Entreprise" }).first();
    await company.getByRole("link", { name: "Formule et facturation" }).click();
    await expect(page).toHaveURL(new RegExp(`${PAGE}$`));
    await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(
      "Formule et facturation",
    );
    await expect(company.getByRole("link", { name: "Formule et facturation" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(company.getByRole("link", { name: "Page entreprise" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    const current = main(page).getByRole("region", { name: /USD par mois/ });
    await expect(current.getByRole("heading")).toHaveText("Company · 79,9 USD par mois");
    await expect(current).toContainText("payée avec M-Pesa");
    await expect(current).toContainText("3 jours de grâce, puis retour à RH Free");
    const usage = main(page).getByRole("region", { name: "Usage ce mois" });
    await expect(usage.getByRole("listitem")).toHaveCount(5);
    await expect(usage).toContainText(/Utilisateurs\s*\d+ sur 5/);
    await expect(usage).toContainText("112 sur 300");
    await expect(usage).toContainText("23 sur 100");
    await expect(usage).toContainText("190 sur 300");
    const invoices = main(page).getByRole("region", { name: "Factures" });
    await expect(invoices.getByRole("row")).toHaveCount(4);
    await expect(invoices.getByRole("row").nth(1)).toContainText("Payée · M-Pesa");
    await expect(invoices.getByRole("row").nth(3)).toContainText("Payée · carte");
    await expectAccessible(page);
    await shot(page, "083-formule-facturation");

    // La facture se télécharge en PDF.
    const number = (await invoices.getByRole("rowheader").first().textContent()) ?? "";
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      invoices.getByRole("link", { name: `Télécharger la facture ${number}` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(`facture-${number}.pdf`);

    // Company Premium : un devis.
    await expect(main(page).getByRole("link", { name: "Demander un devis" })).toHaveAttribute(
      "href",
      "/contact?sujet=devis",
    );

    // Monter en gamme : un refus de l'opérateur, puis la carte, et la formule change tout de suite.
    await main(page).getByRole("button", { name: "Passer à Company Plus" }).click();
    const upgrade = page.getByRole("dialog", { name: "Passer à Company Plus" });
    await expect(upgrade).toContainText("Prend effet tout de suite");
    await expect(upgrade).toContainText("Les jours non utilisés de Company sont déduits");
    await upgrade.getByRole("button", { name: /^Payer/ }).click();
    await expect(upgrade.getByRole("alert")).toContainText("Écrivez le numéro Mobile Money");
    await upgrade.getByLabel("Numéro du compte M-Pesa qui paie").fill("+243 810 000 000");
    await upgrade.getByRole("button", { name: /^Payer/ }).click();
    await expect(upgrade.getByRole("alert")).toContainText("Le paiement n'a pas abouti");
    await upgrade.getByRole("radio", { name: "Carte bancaire" }).click();
    await upgrade.getByRole("button", { name: /^Payer/ }).click();
    await expect(upgrade.getByText("Paiement reçu", { exact: true })).toBeVisible();
    await toast(page, "Paiement reçu : facture envoyée par e-mail");
    await upgrade.getByRole("button", { name: "Fermer" }).click();
    await expect(upgrade).toBeHidden();
    await closeToast(page);
    await expect(current.getByRole("heading")).toHaveText("Company Plus · 179,9 USD par mois");
    await expect(current).toContainText("payée avec carte");
    await expect(invoices.getByRole("row")).toHaveCount(5);
    await expect(
      main(page).getByRole("listitem").filter({ hasText: "Company Plus" }),
    ).toContainText("Votre formule");

    // Renouveler : l'opérateur ne répond pas, la page attend ; on revient au formulaire, puis on ferme.
    await current.getByRole("button", { name: "Renouveler maintenant" }).click();
    const renew = page.getByRole("dialog", { name: "Renouveler Company Plus" });
    await expect(renew).toContainText("Un mois de plus, jusqu'au");
    await renew.getByRole("radio", { name: "Orange Money" }).click();
    await renew.getByLabel("Numéro du compte Orange Money qui paie").fill("+243810002222");
    await renew.getByRole("button", { name: /^Payer/ }).click();
    await expect(renew.getByText("Confirmez sur votre téléphone")).toBeVisible();
    await renew.getByRole("button", { name: "J'ai confirmé" }).click();
    await expect(renew.getByRole("alert")).toContainText("Paiement pas encore reçu");
    await renew.getByRole("button", { name: "Réessayer" }).click();
    await expect(renew.getByRole("radiogroup", { name: "Moyen de paiement" })).toBeVisible();
    await renew.getByRole("button", { name: "Annuler" }).click();
    await expect(renew).toBeHidden();

    // Réduire : la fenêtre s'annule, puis Company est prévue à l'échéance ; on garde Company Plus.
    await main(page).getByRole("button", { name: "Passer à Company", exact: true }).click();
    const lower = page.getByRole("dialog", { name: "Passer à Company", exact: true });
    await expect(lower).toContainText("Company Plus reste active jusqu'au");
    await lower.getByRole("button", { name: "Annuler" }).click();
    await expect(lower).toBeHidden();
    await main(page).getByRole("button", { name: "Passer à Company", exact: true }).click();
    await lower.getByRole("button", { name: "Passer à Company à l'échéance" }).click();
    await toast(page, /Company prendra le relais le/);
    await closeToast(page);
    await expect(current).toContainText(/Company prendra le relais le/);
    await expect(main(page).getByText(/^Prévue le/)).toBeVisible();
    await main(page).getByRole("button", { name: "Garder Company Plus" }).click();
    await toast(page, "Votre formule reste la même");
    await closeToast(page);
    await expect(
      main(page).getByRole("button", { name: "Passer à Company", exact: true }),
    ).toBeVisible();

    // Le lien du devis mène au formulaire de contact.
    await main(page).getByRole("link", { name: "Demander un devis" }).click();
    await expect(page).toHaveURL(/\/contact\?sujet=devis$/);
  });

  test("un manager n'a ni la page, ni les factures, ni la section Entreprise", async ({ page }) => {
    await logIn(page, OWNER);
    await page.goto(PAGE);
    const href = await main(page)
      .getByRole("link", { name: /Télécharger la facture/ })
      .first()
      .getAttribute("href");
    await page.context().clearCookies();

    await logIn(page, "patrice.equipe@jumanly.test");
    await page.goto(PAGE);
    await expect(page.getByRole("heading", { name: "Cette page est introuvable" })).toBeVisible();
    expect((await page.request.get(href ?? "")).status()).toBe(404);
    await page.goto("/app/hire");
    await expect(page.getByRole("navigation", { name: "Entreprise" })).toHaveCount(0);
  });
});

test.describe("Étape 3 · Formule et facturation sur un téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le téléphone affiche « À ouvrir sur un ordinateur ».");

  test("« À ouvrir sur un ordinateur » remplace Formule et facturation", async ({ page }) => {
    await logIn(page, OWNER);
    await page.goto(PAGE);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
  });
});
