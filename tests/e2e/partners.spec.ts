import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

/** Demo accounts and codes of the fictional foundation (prisma/seed/partners.ts). */
const partner = "partenaire@jumanly.test";
const beneficiary = "talent.licence@jumanly.test";

// Parcours 6.8: the partner manager distributes licences and only ever sees aggregated figures.
test("le partenaire distribue des codes et ne voit que des agrégats", async ({ page }) => {
  test.setTimeout(120_000);
  await logIn(page, partner);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app\/partenaire$/);
  await expect(page.getByRole("heading", { name: "Tableau de bord", level: 1 })).toBeVisible();
  await expect(page.getByText(/Aucune donnée nominative n'est partagée/)).toBeVisible();
  await expect(page.getByText("Licences achetées")).toBeVisible();
  await expect(page.getByText("Formations terminées")).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Bénéficiaire 1");
  await expect(page.locator("main")).not.toContainText("beneficiaire01");
  await expectAccessible(page);

  await page.goto("/app/partenaire/licences");
  await page.getByLabel("Nombre de codes").fill("2");
  await page.getByLabel("Libellé interne (facultatif)").fill("Campus test");
  await page.getByRole("button", { name: "Générer des codes" }).click();
  await expect(page.getByText("2 codes générés.")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Campus test" }).first()).toBeVisible();
  await expect(page.getByText("Un code utilisé n'indique pas qui l'a activé.")).toBeVisible();
  await expectAccessible(page);

  await page.goto("/app/partenaire/rapports");
  await expect(page.getByRole("heading", { name: "Rapports d'impact", level: 1 })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Formation", exact: true })
      .getByText("Formations terminées", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("main")).not.toContainText("beneficiaire");
  await expectAccessible(page);
});

test("un bénéficiaire active sa licence avec un code", async ({ page, isMobile }) => {
  // One activation per account and per batch: the desktop run uses the demo code.
  test.skip(isMobile, "La licence de démonstration ne s'active qu'une fois.");
  await page.goto("/activer?code=jmly-demo-aaaa");
  await expect(page.getByText("Offerte par : Fondation Démo (partenaire fictif)")).toBeVisible();
  await expect(page.getByText("Vous n'avez rien à payer.")).toBeVisible();
  await expect(page.locator("#content").getByRole("link", { name: "Se connecter" })).toBeVisible();
  await expectAccessible(page);

  await logIn(page, beneficiary, undefined, "/activer?code=jmly-demo-aaaa");
  await expect(page).toHaveURL(/\/activer/);
  await page.getByRole("button", { name: "Activer ma licence" }).click();
  await expect(page).toHaveURL(/\/app\/abonnement\?licence=/);
  await expect(page.getByText("Votre licence Pro est active")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Licence offerte par Fondation Démo (partenaire fictif)" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "J'accepte" }).click();
  await expect(page.getByText("Votre réponse est enregistrée.")).toBeVisible();

  // The same code cannot be used twice.
  await page.goto("/activer?code=JMLY-DEMO-AAAA");
  await expect(page.getByText(/Ce code a déjà été utilisé/)).toBeVisible();
});

test("un code inconnu est refusé", async ({ page }) => {
  await page.goto("/activer");
  await page.getByLabel("Code de licence").fill("JMLY-ZZZZ-ZZZZ");
  await page.getByRole("button", { name: "Vérifier le code" }).click();
  await expect(page.getByText(/Ce code n'est pas reconnu/)).toBeVisible();
});

test("l'administrateur crée un partenaire et un lot de licences", async ({ page, isMobile }) => {
  test.skip(isMobile, "Console d'administration testée sur ordinateur.");
  test.setTimeout(120_000);
  const name = `Université test ${Date.now()} (fictive)`;
  await logIn(page, demo.admin, undefined, "/admin/partenaires");
  await page.goto("/admin/partenaires");
  await page.getByText("Nouveau partenaire").click();
  await page.getByLabel("Organisation partenaire").fill(name);
  await page.getByLabel("Type").selectOption("university");
  await page.getByLabel("Responsable partenaire (e-mail)").fill("responsable.test@jumanly.test");
  await page.getByRole("button", { name: "Créer le partenaire" }).click();
  await expect(page.getByText(/Partenaire créé/)).toBeVisible();

  const card = page.locator("li").filter({ has: page.getByRole("heading", { name }) });
  await card.getByText("Nouveau lot de licences").click();
  await card.getByLabel("Nom du lot").fill("Lot test");
  await card.getByLabel("Nombre de licences").fill("25");
  const end = new Date(Date.now() + 180 * 86_400_000).toISOString().slice(0, 10);
  await card.getByLabel("Fin").fill(end);
  await card.getByRole("button", { name: "Créer le lot" }).click();
  await expect(page.getByText(/Lot créé/)).toBeVisible();
  await expect(card.getByText(/0 activées sur 25/)).toBeVisible();
});
