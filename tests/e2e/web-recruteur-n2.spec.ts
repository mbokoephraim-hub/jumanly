import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { holdBaobab } from "./baobab-lock";
import { expectAccessible } from "./a11y";
import { logIn } from "./session";
import { publishReady } from "./offer-flow";

// Recruteur sur ordinateur (Modèle B) · N2 (docs/modele-b-recruteur/web, captures 033 à 042 et
// 090) : le Fil avec sa zone de publication, la liste des offres, la page d'une offre (Aperçu,
// Annonce, Équipe et réglages) et « Publier une offre » en cinq étapes, vus par l'administratrice
// de Baobab Fintech (entreprise fictive). Chaque bouton répond. Avec CAPTURE_DIR, les écrans sont
// photographiés à 1440 et à 1024.

const CAPTURE_DIR = process.env.CAPTURE_DIR;
const OWNER = "recruteur6.ux@jumanly.test";

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  const width = page.viewportSize()?.width ?? 1440;
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${width}.png`) });
}

const main = (page: Page) => page.locator("main").filter({ visible: true });
const toast = (page: Page, text: string | RegExp) =>
  expect(page.locator(".jm-toast, .ae-toast").filter({ hasText: text }).last()).toBeVisible();
const orbi = (page: Page) => page.getByRole("dialog", { name: "Orbi" });

async function closeOrbi(page: Page) {
  await orbi(page).getByRole("button", { name: "Fermer Orbi" }).click();
  await expect(orbi(page)).toBeHidden();
}

for (const width of [1440, 1024]) {
  test.describe(`Recruteur sur ordinateur · N2, Fil et offres (${width})`, () => {
    test.skip(({ isMobile }) => isMobile, "Le recruteur sur ordinateur.");
    test.use({ viewport: { width, height: 900 } });
    test.describe.configure({ mode: "default" });
    let release = () => {};
    test.beforeAll(async () => {
      test.setTimeout(600_000);
      release = await holdBaobab();
    });
    test.afterAll(() => release());

    test("le Fil : publier, Orbi, à connaître", async ({ page }) => {
      test.setTimeout(180_000);
      await logIn(page, OWNER);
      await page.goto("/app/hire/fil");
      await expect(page.locator(".rb-top-h")).toHaveText("Fil");
      const compose = main(page).getByRole("form", { name: "Publier dans le Fil" });
      await expect(compose).toBeVisible();
      await expectAccessible(page);
      await shot(page, "n2-fil");

      // 220 characters, in one's own name or the company's.
      const text = compose.getByLabel("Partagez une offre, une recrue, un conseil…");
      await expect(compose.getByRole("button", { name: "Publier" })).toBeDisabled();
      await text.fill("Bienvenue à notre nouvelle analyste, recrutée via Jumanly (fictif).");
      await expect(compose).toContainText("67 / 220");
      const asOrg = compose.getByRole("button", { name: /^Au nom de Baobab Fintech/ });
      await asOrg.click();
      await expect(asOrg).toHaveAttribute("aria-pressed", "true");
      await compose.getByRole("button", { name: "En votre nom" }).click();
      await expect(asOrg).toHaveAttribute("aria-pressed", "false");
      if (width === 1440) {
        await compose.getByRole("button", { name: "Publier" }).click();
        await toast(page, "Publication en ligne.");
        await expect(text).toHaveValue("");
        await expect(main(page)).toContainText("recrutée via Jumanly (fictif)");
      }

      // Orbi on the right: the question opens the panel, the link too.
      const aside = main(page).getByRole("complementary", { name: "Orbi et suggestions" });
      await aside.getByRole("button", { name: "Une idée de publication ?" }).click();
      await expect(orbi(page)).toBeVisible();
      await closeOrbi(page);
      await aside.getByRole("button", { name: "Ouvrir la conversation complète" }).click();
      await expect(orbi(page)).toBeVisible();
      await closeOrbi(page);

      // « À connaître »: the request leaves, the button says so.
      const connect = aside.getByRole("button", { name: /^Se connecter avec / }).first();
      if (await connect.count()) {
        await connect.click();
        await toast(page, "Demande envoyée");
      }
      // A company that recruits opens its public page.
      const company = aside.locator("a.rb-ent-c");
      if (await company.count()) {
        await company.click();
        await expect(page).toHaveURL(/\/entreprises\/[^/]+$/);
      }
    });

    test("les offres et la page d'une offre", async ({ page }) => {
      test.setTimeout(240_000);
      await logIn(page, OWNER);
      await page.goto("/app/hire/offres");
      await expect(page.locator(".rb-top-h")).toHaveText("Offres");
      const tiles = main(page).getByRole("list", { name: "Vos offres en chiffres" });
      await expect(tiles.getByRole("listitem")).toHaveCount(4);
      await expect(main(page).getByRole("heading", { name: "Vos offres" })).toBeVisible();
      const table = main(page).locator("table.rb-table").filter({ visible: true });
      await expect(table.locator("tbody tr").first()).toBeVisible();
      await expectAccessible(page);
      await shot(page, "n2-offres");

      // Orbi asks about the quietest offer; the panel opens.
      const aside = main(page).getByRole("complementary", { name: "Orbi et suggestions" });
      await aside.locator(".rb-orbi-q").click();
      await expect(orbi(page)).toBeVisible();
      await closeOrbi(page);

      // Each row opens its offer, by its title or its chevron.
      const live = table.locator("tbody tr").filter({ hasText: "En ligne" }).first();
      const title = (await live.locator("a.rb-tl b").innerText()).trim();
      await live.getByRole("link", { name: `Ouvrir l'offre ${title}` }).click();
      await expect(main(page).getByRole("heading", { level: 1, name: title })).toBeVisible();
      const offerUrl = page.url().split("?")[0]!;
      await expect(main(page).getByRole("list", { name: "L'offre en chiffres" })).toBeVisible();
      await expect(
        main(page).getByRole("heading", { name: "Où en sont les candidatures" }),
      ).toBeVisible();
      await expect(main(page).getByRole("heading", { name: "D'où viennent-elles" })).toBeVisible();
      await expectAccessible(page);
      await shot(page, "n2-offre-apercu");

      // The tabs.
      const tabs = main(page).getByRole("navigation", { name: "Parties de l'offre" });
      await tabs.getByRole("link", { name: "Annonce" }).click();
      await expect(page).toHaveURL(/onglet=annonce/);
      await expect(main(page).getByRole("heading", { name: "Conditions" })).toBeVisible();
      await expect(
        main(page).getByRole("heading", { name: "Ce que voient les talents" }),
      ).toBeVisible();
      await shot(page, "n2-offre-annonce");
      await tabs.getByRole("link", { name: "Équipe et réglages" }).click();
      await expect(page).toHaveURL(/onglet=equipe/);
      await expect(main(page)).toContainText("Responsable de l'offre");
      await expect(main(page)).toContainText("Gratuite, sans rejet automatique");
      await shot(page, "n2-offre-equipe");
      await main(page).getByRole("link", { name: "Modifier l'offre" }).click();
      await expect(page).toHaveURL(/\/modifier\?etape=5$/);
      await publishReady(page);
      await expect(main(page).locator(".rb-pub-c")).toContainText("Étape 5 sur 5");
      await page.goto(offerUrl);
      await tabs.getByRole("link", { name: "Aperçu" }).click();
      await expect(page).toHaveURL(new RegExp(`${offerUrl}$`));

      // « Partager »: copy the link, then « Annuler ».
      await main(page).getByRole("button", { name: "Partager" }).click();
      const share = page.getByRole("dialog", { name: "Partager l'offre" });
      await expect(share).toBeVisible();
      await expect(share.getByRole("link", { name: "Envoyer sur WhatsApp" })).toHaveAttribute(
        "href",
        /^https:\/\/wa\.me\//,
      );
      await expect(share.getByRole("link", { name: /^Publier dans le Fil/ })).toHaveAttribute(
        "href",
        "/app/hire/fil",
      );
      await share.getByRole("button", { name: "Copier le lien" }).click();
      await toast(page, "Lien copié.");
      await expect(share).toBeHidden();
      await main(page).getByRole("button", { name: "Partager" }).click();
      await share.getByRole("button", { name: "Annuler" }).click();
      await expect(share).toBeHidden();

      // Pause, then resume.
      await main(page).getByRole("button", { name: "Mettre en pause" }).click();
      await toast(page, /^Offre mise en pause/);
      await expect(main(page)).toContainText("En pause");
      await main(page).getByRole("button", { name: "Reprendre" }).click();
      await toast(page, /^Offre reprise/);

      // « Clôturer » asks first; « Annuler » keeps the offer.
      await main(page).getByRole("button", { name: "Clôturer" }).click();
      const close = page.getByRole("dialog", { name: /^Clôturer « / });
      await expect(close).toBeVisible();
      await close.getByRole("button", { name: "Annuler" }).click();
      await expect(close).toBeHidden();

      // The ATS of the offer, its applications, its edition.
      await main(page).getByRole("link", { name: "Ouvrir l'ATS de cette offre" }).click();
      await expect(page).toHaveURL(new RegExp(`${offerUrl}/ats`));
      await page.goto(offerUrl);
      await main(page)
        .getByRole("link", { name: /^Voir (la|les)/ })
        .click();
      await expect(page).toHaveURL(/\/app\/hire\/candidats\?offre=/);
      await page.goto(offerUrl);
      await main(page).getByRole("link", { name: "Modifier", exact: true }).click();
      await expect(page).toHaveURL(/\/modifier$/);
      await page.goto(offerUrl);
      await main(page).getByRole("link", { name: "Offres", exact: true }).click();
      await expect(page).toHaveURL(/\/app\/hire\/offres$/);
    });

    test("publier une offre en cinq étapes", async ({ page }) => {
      test.setTimeout(240_000);
      await logIn(page, OWNER);
      await page.goto("/app/hire/offres");
      await page.getByRole("link", { name: "Publier une offre" }).first().click();
      await expect(page).toHaveURL(/\/app\/hire\/offres\/nouvelle$/);
      await publishReady(page);
      const steps = main(page).getByRole("navigation", { name: "Étapes de la publication" });
      const card = main(page).locator(".rb-pub-c").filter({ visible: true });
      const preview = main(page).getByRole("complementary", { name: "Aperçu pour les talents" });
      const next = () => card.getByRole("button", { name: "Continuer" }).click();
      const title = `Analyste risque N2 ${width} ${Date.now().toString(36)} (fictif)`;

      // 1 · Le poste. Without a title, « Continuer » says so.
      await next();
      await expect(card.getByRole("alert")).toHaveText(/au moins 3 caractères/);
      await card.getByLabel("Intitulé du poste").fill(title);
      await expect(preview).toContainText(title);
      await card.getByRole("button", { name: "Finance et risques" }).click();
      await expect(card.getByRole("button", { name: "Finance et risques" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await card.getByLabel("Nombre de postes").fill("2");
      await card.getByRole("button", { name: "Orbi propose une description" }).click();
      await expect(card.getByRole("status")).toBeVisible();
      await card
        .getByLabel("Description", { exact: true })
        .fill("Suivre le risque de crédit d'un portefeuille fictif avec l'équipe finance.");
      await expect(preview).toContainText("Suivre le risque de crédit");
      await shot(page, "n2-publier-1");
      await next();

      // 2 · Compétences: typed, required or wished, suggested by Orbi, removed.
      await expect(card).toContainText("Étape 2 sur 5 · Compétences");
      await expect(page).toHaveURL(/\/modifier$/);
      await card.getByLabel("Ajouter une compétence").fill("Excel");
      await card.getByRole("button", { name: "Requise", exact: true }).click();
      await card.getByLabel("Ajouter une compétence").fill("Python");
      await card.getByRole("button", { name: "Souhaitée", exact: true }).click();
      await card.getByLabel("Ajouter une compétence").fill("SQL");
      await card.getByLabel("Ajouter une compétence").press("Enter");
      const suggestion = card.locator(".rb-sugg-b").first();
      if (await suggestion.count()) await suggestion.click();
      await card.getByRole("button", { name: "Retirer SQL" }).click();
      await expect(card.getByRole("button", { name: "Retirer SQL" })).toHaveCount(0);
      await expect(preview).toContainText("Excel");
      await expect(card).toContainText("Aucun rejet automatique");
      await shot(page, "n2-publier-2");
      // « Retour » goes back one step, the side list reaches every step already seen.
      await card.getByRole("button", { name: "Retour" }).click();
      await expect(card).toContainText("Étape 1 sur 5");
      await steps.getByRole("button", { name: /Compétences/ }).click();
      await expect(card).toContainText("Étape 2 sur 5");
      await next();

      // 3 · Conditions.
      await expect(card).toContainText("Étape 3 sur 5 · Conditions");
      await card.getByRole("button", { name: "CDD" }).click();
      await card.getByRole("button", { name: "Hybride" }).click();
      await expect(preview).toContainText("Hybride");
      await card.getByLabel("Autre ville").fill("Goma");
      await card.getByLabel("Pays du poste").fill("RD Congo");
      const salary = card.getByRole("switch", { name: "Afficher le salaire" });
      await salary.click();
      await expect(salary).toHaveAttribute("aria-checked", "false");
      await salary.click();
      await card.getByLabel("Minimum (USD par mois)").fill("900");
      await card.getByLabel("Maximum (USD par mois)").fill("1200");
      await expect(preview).toContainText("900 à 1200 USD par mois");
      await card.getByRole("button", { name: "Sans date limite" }).click();
      await card.locator(".rb-pills").last().getByRole("button").first().click();
      await shot(page, "n2-publier-3");
      await next();

      // 4 · Questions and documents.
      await expect(card).toContainText("Étape 4 sur 5 · Questions");
      await card.getByRole("button", { name: "Ajouter", exact: true }).click();
      await expect(card.getByRole("alert")).toHaveText(/au moins 5 caractères/);
      await card.getByLabel("Ajouter une question").fill("Quand pouvez-vous commencer ?");
      await card.getByRole("button", { name: "Ajouter", exact: true }).click();
      await card.getByLabel("Ajouter une question").fill("Avez-vous suivi un portefeuille ?");
      await card.getByRole("button", { name: "Ajouter", exact: true }).click();
      await card
        .getByRole("button", { name: "Retirer la question Avez-vous suivi un portefeuille ?" })
        .click();
      await expect(card.locator(".rb-liste-q li")).toHaveCount(1);
      const letter = card.getByRole("switch", { name: "Lettre de motivation" });
      await letter.click();
      await expect(letter).toHaveAttribute("aria-checked", "true");
      await expect(card).toContainText("elles n'éliminent personne");
      await shot(page, "n2-publier-4");

      // « Enregistrer le brouillon » keeps it in the list.
      await card.getByRole("button", { name: "Enregistrer le brouillon" }).click();
      await expect(page).toHaveURL(/\/app\/hire\/offres\?ok=brouillon$/);
      await toast(page, "Brouillon enregistré.");
      const row = main(page).locator("tbody tr").filter({ hasText: title, visible: true });
      await expect(row).toContainText("Brouillon");
      await row.locator("a.rb-tl").click();
      await main(page).getByRole("link", { name: "Continuer la rédaction" }).click();
      await publishReady(page);
      await expect(card).toContainText("Étape 1 sur 5");
      await expect(card.getByLabel("Intitulé du poste")).toHaveValue(title);
      await steps.getByRole("button", { name: /Aperçu et équipe/ }).click();

      // 5 · Aperçu et équipe, then publication.
      await expect(card).toContainText("Étape 5 sur 5 · Aperçu et équipe");
      const owners = card.getByRole("group", { name: "Responsable de l'offre" });
      if (await owners.count()) await owners.getByRole("button").first().click();
      const evaluator = card.getByRole("switch", { name: /· Manager$/ }).first();
      if (await evaluator.count()) {
        await evaluator.click();
        await expect(evaluator).toHaveAttribute("aria-checked", "true");
      }
      await expect(card.locator(".rb-resume")).toContainText(title);
      await expectAccessible(page);
      await shot(page, "n2-publier-5");
      await card
        .getByRole("button", { name: /^(Publier l'offre|Envoyer en vérification)$/ })
        .click();
      await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?publiee=(1|verification)$/);
      await toast(page, /^Offre (publiée|envoyée en validation)$/);
      await expect(main(page).getByRole("heading", { level: 1, name: title })).toBeVisible();

      // « Clôturer » confirmed: the offer leaves the search, back to the list.
      await main(page).getByRole("button", { name: "Clôturer" }).click();
      await page
        .getByRole("dialog", { name: /^Clôturer « / })
        .getByRole("button", { name: "Clôturer l'offre" })
        .click();
      await expect(page).toHaveURL(/ok=fermee/);
      await toast(page, /^Offre clôturée/);
      // A closed offer can be reopened from its page.
      await main(page)
        .locator("tbody tr")
        .filter({ hasText: title, visible: true })
        .locator("a.rb-tl")
        .click();
      await expect(main(page).getByRole("button", { name: "Rouvrir" })).toBeVisible();
      await main(page).getByRole("button", { name: "Rouvrir" }).click();
      await expect(page).not.toHaveURL(/ok=fermee/);
    });
  });
}
