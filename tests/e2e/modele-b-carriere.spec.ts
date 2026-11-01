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
    // Carrière (29-30/10): Vue · Candidatures · Documents, opened on Candidatures; the profile
    // has its own space (« Mon profil », /app/profil).
    await page.goto("/app/career/cv");
    const career = page.locator(".nb-ca").first();
    const tabs = career.getByRole("tablist", { name: "Rubriques de Carrière" });
    await expect(tabs.getByRole("tab", { name: "Candidatures" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Each rubric shows its panel in place.
    for (const name of ["Vue", "Documents", "Candidatures"]) {
      await tabs.getByRole("tab", { name, exact: true }).click();
      await expect(tabs.getByRole("tab", { name, exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }

    // Documents: the menu of a CV.
    await tabs.getByRole("tab", { name: "Documents", exact: true }).click();
    await career
      .getByRole("button", { name: /^Actions de « / })
      .first()
      .click();
    const menu = page.getByRole("dialog", { name: "Mon CV (fictif)" });
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
    await expect(tabs.getByRole("tab", { name: "Documents", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // « Mon profil »: « Partager » opens its sheet, « Ajouter » of the skills its sheet.
    await career.getByRole("link", { name: /^Ouvrir mon profil/ }).click();
    await page.waitForURL("**/app/profil");
    const profile = page.locator("main").filter({ visible: true });
    await profile.getByRole("button", { name: "Partager", exact: true }).click();
    const share = page.getByRole("dialog", { name: "Partager mon profil" });
    await expect(share).toBeVisible();
    await share
      .getByRole("button", { name: "Fermer" })
      .first()
      .click({ position: { x: 195, y: 24 } });
    await expect(share).toBeHidden();
    await profile.getByRole("button", { name: "Ajouter : Compétences" }).click();
    const skills = page.getByRole("dialog", { name: "Ajouter des compétences" });
    await expect(skills.getByRole("searchbox", { name: "Chercher une compétence" })).toBeVisible();
    await skills
      .getByRole("button", { name: "Fermer" })
      .first()
      .click({ position: { x: 195, y: 24 } });
    await expect(skills).toBeHidden();

    // « Modifier » opens the form; « Annuler » comes back.
    await profile.getByRole("link", { name: "Modifier", exact: true }).first().click();
    await page.waitForURL("**/app/career/profil");
    await expect(page.getByRole("heading", { name: "Modifier le profil" })).toBeVisible();
    await page.getByRole("link", { name: "Annuler" }).first().click();
    await page.waitForURL("**/app/profil");
  });

  test("une réalisation : détail, mise en avant, ajout et suppression", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "talent.pro@jumanly.test");
    // The projects are the « Réalisations » of « Mon profil » (29/10).
    await page.goto("/app/profil?onglet=realisations");
    const profile = page.locator("main").filter({ visible: true });
    await expect(profile.getByRole("tab", { name: "Réalisations", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // A project opens its page: the switch answers at once, and again to undo.
    await profile.locator(".nb-cr-real a").first().click();
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
    // The form may hydrate after the first keystrokes: type again until both fields hold.
    await expect(async () => {
      await form.getByLabel("Titre").fill("Réalisation de test (fictive)");
      await form.getByLabel("Description").fill("Un tableau imaginé pour le test.");
      await page.waitForTimeout(300);
      await expect(form.getByLabel("Titre")).toHaveValue("Réalisation de test (fictive)");
      await expect(form.getByLabel("Description")).toHaveValue("Un tableau imaginé pour le test.");
    }).toPass();
    await form.getByRole("switch", { name: "Publier aussi dans le Fil" }).click();
    await form.getByRole("button", { name: "Enregistrer" }).click();
    await page.waitForURL("**/app/profil?onglet=realisations");
    const tile = profile.getByRole("link", { name: /Réalisation de test \(fictive\)/ });
    await expect(tile).toBeVisible();
    await tile.click();
    await page.waitForURL(/\/app\/career\/portfolio\//);
    await detail.getByRole("button", { name: "Supprimer" }).click();
    const sheet = page.getByRole("dialog", { name: "Supprimer cette réalisation ?" });
    await sheet.getByRole("button", { name: "Supprimer" }).click();
    await page.waitForURL("**/app/profil?onglet=realisations");
    await expect(profile.getByRole("link", { name: /Réalisation de test/ })).toHaveCount(0);
  });

  test("une candidature : où elle en est, Orbi, écrire et retirer", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "amani.ux@jumanly.test");
    await page.goto("/app/career/cv?onglet=candidatures");
    const career = page.locator(".nb-ca").first();
    await career.locator('#car-panneau a[href^="/app/suivi/"]').first().click();
    await page.waitForURL(/\/app\/suivi\/[^/?]+$/);
    const screen = page.locator(".nb-ca-candidature");
    await expect(screen.getByRole("heading", { name: "Candidature", exact: true })).toBeVisible();
    await expect(screen.getByText("Où en est-elle")).toBeVisible();

    // « Préparer avec Orbi »: three suggestions and a field; a suggestion goes to Orbi's sheet.
    await screen.getByRole("button", { name: "Préparer avec Orbi" }).first().click();
    const prepare = page.getByRole("dialog", { name: "Préparer l’entretien" });
    await expect(prepare.getByRole("link", { name: "S’entraîner avec Orbi" })).toBeVisible();
    await expect(prepare.getByRole("textbox", { name: "Écrire à Orbi…" })).toBeVisible();
    await prepare.getByRole("button", { name: /^Que dire sur / }).click();
    await expect(prepare).toBeHidden();

    // « Retirer ma candidature » asks first; « Non » keeps it.
    await page.goto(page.url());
    await screen.getByRole("button", { name: "Retirer ma candidature" }).click();
    const withdraw = page.getByRole("dialog", {
      name: "Voulez-vous vraiment retirer votre candidature ?",
    });
    await expect(withdraw.getByRole("button", { name: "Oui, retirer" })).toBeVisible();
    await withdraw.getByRole("button", { name: "Non", exact: true }).click();
    await expect(withdraw).toBeHidden();

    // « Commencer l'entraînement » (the Orbi card) and « Voir l'offre » open their pages.
    await expect(screen.getByRole("link", { name: "Commencer l’entraînement" })).toHaveAttribute(
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
