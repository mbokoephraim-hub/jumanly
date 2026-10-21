import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B5 (docs/modele-b, rangées 11 à 15): Carrière on the phone, its five rubrics, the
// forms of the profile, the settings, the portfolio and the page of an application. Grâce
// (grace.ux@, Free) has a CV; talent.pro@ has a project; Amani (amani.ux@) has an interview.
test.describe("Modèle B · Carrière au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton de Carrière ouvre quelque chose, et l'onglet reste monté", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/career/cv");
    const career = page.locator(".nb-ca").first();
    const tabs = career.getByRole("tablist", { name: "Rubriques de Carrière" });
    await expect(tabs.getByRole("tab", { name: "Profil" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // « Partager » opens its sheet; « Modifier » the form of the profile.
    await career.getByRole("button", { name: "Partager", exact: true }).click();
    const share = page.getByRole("dialog", { name: "Partager mon profil" });
    await expect(share).toBeVisible();
    await share
      .getByRole("button", { name: "Fermer" })
      .first()
      .click({ position: { x: 195, y: 24 } });
    await expect(share).toBeHidden();

    // « Ajouter » of the skills and of the languages open their sheets.
    await career.getByRole("button", { name: "Ajouter : Compétences" }).click();
    const skills = page.getByRole("dialog", { name: "Ajouter des compétences" });
    await expect(skills.getByRole("searchbox", { name: "Chercher une compétence" })).toBeVisible();
    await skills
      .getByRole("button", { name: "Fermer" })
      .first()
      .click({ position: { x: 195, y: 24 } });
    await expect(skills).toBeHidden();

    // Each rubric shows its panel in place.
    for (const name of ["CV", "Portfolio", "Progression", "Candidatures"]) {
      await tabs.getByRole("tab", { name, exact: true }).click();
      await expect(tabs.getByRole("tab", { name, exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }

    // CV: the menu of a CV, then « Nouveau CV ».
    await tabs.getByRole("tab", { name: "CV", exact: true }).click();
    await career
      .getByRole("button", { name: /^Actions de « / })
      .first()
      .click();
    const menu = page.getByRole("dialog").filter({ hasText: "Exporter en PDF ou Word" });
    await expect(menu.getByRole("button", { name: "Dupliquer" })).toBeVisible();
    await menu
      .getByRole("button", { name: "Fermer" })
      .first()
      .click({ position: { x: 195, y: 24 } });
    await expect(menu).toBeHidden();

    // The settings open as a page; « Retour » comes back to the same rubric (the tab stayed).
    await career.getByRole("link", { name: "Paramètres" }).click();
    await page.waitForURL("**/app/parametres");
    await expect(page.getByRole("heading", { name: "Paramètres", exact: true })).toBeVisible();
    await page.locator("main").getByRole("link", { name: "Retour" }).first().click();
    await page.waitForURL("**/app/career/cv");
    await expect(tabs.getByRole("tab", { name: "CV", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // « Modifier » opens the form; « Annuler » comes back.
    await tabs.getByRole("tab", { name: "Profil", exact: true }).click();
    await career.getByRole("link", { name: "Modifier", exact: true }).first().click();
    await page.waitForURL("**/app/career/profil");
    await expect(page.getByRole("heading", { name: "Modifier le profil" })).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).first().click();
    await page.waitForURL("**/app/career/cv");

    // Without the portfolio in the plan, « Ajouter » shows the plans.
    await tabs.getByRole("tab", { name: "Portfolio", exact: true }).click();
    await career.getByRole("link", { name: /^Ajouter/ }).click();
    await page.waitForURL("**/app/abonnement");
  });

  test("une réalisation : détail, mise en avant, ajout et suppression", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "talent.pro@jumanly.test");
    await page.goto("/app/career/cv?onglet=portfolio");
    const career = page.locator(".nb-ca").first();
    await expect(career.getByRole("tab", { name: "Portfolio", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // A project opens its page: the switch answers at once, and again to undo.
    await career.locator(".nb-ca-real:not(.nb-ca-real-ajout)").first().click();
    await page.waitForURL(/\/app\/career\/portfolio\/(?!nouvelle)/);
    const detail = page.locator(".nb-ca-projet");
    const feature = detail.getByRole("switch", { name: "Mettre en avant sur mon profil" });
    const before = await feature.getAttribute("aria-checked");
    await feature.click();
    await expect(feature).not.toHaveAttribute("aria-checked", before ?? "true");
    await feature.click();
    await expect(feature).toHaveAttribute("aria-checked", before ?? "true");

    // « Partager dans le Fil » opens the publication with the project attached.
    await detail.getByRole("link", { name: "Partager dans le Fil" }).click();
    await page.waitForURL("**/app/fil/publier?realisation=*");
    await page.goBack();
    // « Modifier » opens the form of the project.
    await detail.getByRole("link", { name: "Modifier" }).click();
    await page.waitForURL("**?modifier=1");
    await expect(page.getByRole("heading", { name: "Modifier la réalisation" })).toBeVisible();

    // A new project, without the Fil, then deleted after the confirmation.
    await page.goto("/app/career/portfolio/nouvelle");
    const form = page.locator(".nb-ca-form");
    await expect(form.getByRole("heading", { name: "Nouvelle réalisation" })).toBeVisible();
    await form.getByLabel("Titre").fill("Réalisation de test (fictive)");
    await form.getByLabel("Description").fill("Un tableau imaginé pour le test.");
    await form.getByRole("switch", { name: "Publier aussi dans le Fil" }).click();
    await form.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL("**/app/career/cv**");
    const tile = career.getByRole("link", { name: /Réalisation de test \(fictive\)/ });
    await expect(tile).toBeVisible();
    await tile.click();
    await page.waitForURL(/\/app\/career\/portfolio\//);
    await detail.getByRole("button", { name: "Supprimer" }).click();
    const sheet = page.getByRole("dialog", { name: "Supprimer cette réalisation ?" });
    await sheet.getByRole("button", { name: "Supprimer" }).click();
    await page.waitForURL("**/app/career/cv**");
    await expect(career.getByRole("link", { name: /Réalisation de test/ })).toHaveCount(0);
  });

  test("une candidature : où elle en est, Orbi, écrire et retirer", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "amani.ux@jumanly.test");
    await page.goto("/app/career/cv?onglet=candidatures");
    const career = page.locator(".nb-ca").first();
    await career.locator('#car-panneau a[href^="/app/suivi/"]').first().click();
    await page.waitForURL(/\/app\/suivi\/[^/?]+$/);
    const screen = page.locator(".nb-ca-candidature");
    await expect(screen.getByRole("heading", { name: "Candidature" })).toBeVisible();
    await expect(screen.getByText("Où en est-elle")).toBeVisible();

    // « Préparer avec Orbi »: three suggestions and a field; a suggestion goes to Orbi's sheet.
    await screen.getByRole("button", { name: "Préparer avec Orbi" }).first().click();
    const prepare = page.getByRole("dialog", { name: "Préparer l’entretien" });
    await expect(prepare.getByRole("link", { name: "S’entraîner avec Orbi" })).toBeVisible();
    await expect(prepare.getByRole("textbox", { name: "Écrire à Orbi…" })).toBeVisible();
    await prepare.getByRole("button", { name: /^Que dire sur / }).click();
    await expect(prepare).toBeHidden();

    // « Retirer ma candidature » asks first; « Annuler » keeps it.
    await page.goto(page.url());
    await screen.getByRole("button", { name: "Retirer ma candidature" }).click();
    const withdraw = page.getByRole("dialog", { name: "Retirer votre candidature ?" });
    await expect(withdraw.getByRole("button", { name: "Retirer", exact: true })).toBeVisible();
    await withdraw.getByRole("button", { name: "Annuler" }).click();
    await expect(withdraw).toBeHidden();

    // « S'entraîner avec Orbi » and « Voir l'offre » open their pages.
    await expect(screen.getByRole("link", { name: /S’entraîner avec Orbi/ })).toHaveAttribute(
      "href",
      /\/app\/career\/entretiens\/nouveau\?candidature=/,
    );
    await screen.getByRole("link", { name: "Voir l’offre" }).click();
    await page.waitForURL("**/app/jobs/**");
  });

  test("écrire au recruteur : le brouillon d'Orbi, modifiable", async ({ page }) => {
    await logIn(page, "jeanpierre.ux@jumanly.test");
    await page.goto("/app/career/cv?onglet=candidatures");
    const career = page.locator(".nb-ca").first();
    const links = career.locator('#car-panneau a[href^="/app/suivi/"]');
    await expect(links.first()).toBeVisible();
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      await page.goto("/app/career/cv?onglet=candidatures");
      await links.nth(index).click();
      await page.waitForURL(/\/app\/suivi\//);
      const write = page.locator(".nb-ca-candidature").getByRole("button", { name: /^Écrire à/ });
      if ((await write.count()) === 0) continue;
      await write.click();
      const sheet = page.getByRole("dialog", { name: /^Écrire à/ });
      await expect(sheet.getByRole("textbox")).toHaveValue(/^Bonjour/);
      await expect(sheet.getByText("Brouillon proposé par Orbi, modifiable.")).toBeVisible();
      await expect(sheet.getByRole("button", { name: "Envoyer" })).toBeEnabled();
      return;
    }
    throw new Error("Aucune candidature avec une conversation dans la démo.");
  });
});
