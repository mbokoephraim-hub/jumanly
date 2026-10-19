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
  await expect(
    page.getByText(/Pro vous est offert par Fondation Démo \(partenaire fictif\)/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Licence offerte par Fondation Démo (partenaire fictif)" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "J'accepte" }).click();
  await expect(page.getByText("Votre choix de partage est enregistré.")).toBeVisible();

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
  await page.getByRole("link", { name: "Nouveau partenaire" }).click();
  const creation = page.getByRole("region", { name: "Nouveau partenaire" });
  await creation.getByLabel("Organisation partenaire").fill(name);
  await creation.getByLabel("Type").selectOption("university");
  await creation
    .getByLabel("Responsable partenaire (e-mail)")
    .fill("responsable.test@jumanly.test");
  await creation.getByRole("button", { name: "Créer le partenaire" }).click();
  await expect(page.getByText(/Partenaire créé/)).toBeVisible();

  // The newest partner opens in the sheet; the batch panel opens from it.
  await page.getByRole("link", { name, exact: true }).click();
  const sheet = page.getByRole("region", { name, exact: true });
  await sheet.getByRole("link", { name: "Nouveau lot de licences" }).click();
  const panel = page.getByRole("region", { name: "Nouveau lot de licences" });
  await panel.getByLabel("Nom du lot").fill("Lot test");
  await panel.getByLabel("Nombre de licences").fill("25");
  const end = new Date(Date.now() + 180 * 86_400_000).toISOString().slice(0, 10);
  await panel.getByLabel("Fin").fill(end);
  // Admin v2, étape 8: a batch commits a contract, its reason is required.
  await panel.getByLabel("Motif").fill("Contrat fictif signé pour la recette");
  await panel.getByRole("button", { name: "Créer le lot" }).click();
  await expect(page.getByText(/Lot créé/)).toBeVisible();
  await expect(page.getByRole("region", { name, exact: true }).getByText("0/25")).toBeVisible();

  // The batch sheet opens at once: seats, codes, and the impact hidden below 10 people.
  const lot = page.locator("#lot");
  await expect(lot.getByRole("heading", { name: "Lot test" })).toBeVisible();
  await expect(lot.getByText("Restantes à distribuer")).toBeVisible();
  await expect(lot.getByText("Masqué").first()).toBeVisible();

  // Extend the batch: a later end, with a reason.
  await lot.getByRole("link", { name: "Prolonger le lot" }).click();
  const extend = page.getByRole("region", { name: "Prolonger le lot" });
  const later = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
  await extend.getByLabel("Nouvelle fin du contrat").fill(later);
  await extend.getByLabel("Motif").fill("Avenant fictif");
  await extend.getByRole("button", { name: "Prolonger" }).click();
  await expect(page.getByText(/Lot prolongé/)).toBeVisible();

  // Rename the partner, with a reason.
  const renamed = `${name} renommée`;
  await page
    .getByRole("region", { name, exact: true })
    .getByRole("link", { name: "Modifier le partenaire" })
    .click();
  const edit = page.getByRole("region", { name: "Modifier le partenaire" });
  await edit.getByLabel("Organisation partenaire").fill(renamed);
  await edit.getByLabel("Motif").fill("Nom officiel fictif");
  await edit.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Partenaire modifié.")).toBeVisible();
  await expect(page.getByRole("heading", { name: renamed, exact: true })).toBeVisible();
});
