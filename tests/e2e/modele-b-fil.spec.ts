import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B3 (docs/modele-b, rangées 05 et 06): the Fil of the phone, its posts, answers,
// sheets, publishing and notifications. Grâce (grace.ux@) sees the demo Fil of the seed.
test.describe("Modèle B · Fil au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton du Fil ouvre quelque chose", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app");
    const fil = page.locator(".nb-fil").first();
    await expect(fil.getByRole("heading", { name: "Fil", exact: true })).toBeVisible();

    // Three tabs, switched in place.
    const tabs = fil.getByRole("tablist", { name: "Fils" });
    await expect(tabs.getByRole("tab", { name: "Pour vous" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await tabs.getByRole("tab", { name: "Entreprises" }).click();
    await expect(fil.getByText("Portes ouvertes", { exact: false }).first()).toBeVisible();
    await expect(fil.getByText("Badge « Bâtisseuse de communauté »")).toHaveCount(0);
    await tabs.getByRole("tab", { name: "Abonnements" }).click();
    await expect(
      fil.getByText("Badge « Bâtisseuse de communauté »", { exact: false }),
    ).toBeVisible();
    await tabs.getByRole("tab", { name: "Pour vous" }).click();

    // The offer of Baobab Fintech carries the reader's score and opens the offer.
    const baobab = fil.locator("article").filter({ hasText: "On recrute trois analystes data" });
    await expect(baobab.getByText(/% pour vous/)).toBeVisible();

    // J'aime answers at once.
    const like = baobab.getByRole("button", { name: /^J'aime/ });
    const before = await like.getAttribute("aria-pressed");
    await like.click();
    await expect(like).not.toHaveAttribute("aria-pressed", before ?? "false");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", before ?? "false");

    // « ··· » opens the menu; « Signaler » goes one level down, with a way back.
    await baobab.getByRole("button", { name: "Plus d'options" }).click();
    const menu = page.getByRole("dialog", { name: "Publication de Baobab Fintech" });
    await expect(menu.getByRole("button", { name: /Enregistrer/ })).toBeVisible();
    await menu.getByRole("button", { name: /Signaler/ }).click();
    const report = page.getByRole("dialog", { name: "Signaler la publication" });
    await expect(report.getByText("Baobab Fintech ne saura pas que c'est vous.")).toBeVisible();
    await expect(report.getByRole("button", { name: "Fausse information" })).toBeVisible();
    await report.getByRole("button", { name: "Annuler" }).click();
    await expect(report).toBeHidden();

    // The post (docs/fil-menu-publication § 2): a title, its text, and the actions under it.
    await expect(
      baobab.getByRole("heading", { name: "Nous recrutons 3 analystes data à Kinshasa" }),
    ).toBeVisible();
    // Enregistrer answers at once.
    const save = baobab.getByRole("button", { name: "Enregistrer", exact: true });
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "false");

    // « ··· » › Partager (27/10/2026, #183) opens Republier · Citer · « Envoyer à une connexion »,
    // then the list of connections.
    await baobab.getByRole("button", { name: "Plus d'options" }).click();
    const reshare = page.getByRole("dialog", { name: "Partager" });
    // A touch while the sheet is still rising can be lost: touch again until the sheet answers.
    await expect(async () => {
      if (await menu.isVisible()) {
        await menu.getByRole("button", { name: /^Partager/ }).click({ timeout: 2_000 });
      }
      await expect(reshare.getByRole("button", { name: /^Republier/ })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass();
    await reshare.getByRole("button", { name: /Envoyer à une connexion/ }).click();
    const send = page.getByRole("dialog", { name: "Envoyer à" });
    await expect(send.getByRole("button", { name: "Envoyer" }).first()).toBeVisible();
    await expect(send.getByRole("link", { name: "Ouvrir Messages" })).toBeVisible();
    // With many connections the sheet covers the veil: Échap closes it.
    await page.keyboard.press("Escape");
    await expect(send).toBeHidden();

    // The actions sit under the photo (no notch since #183); Commenter opens the post, with its
    // answers and the reply bar; the way back is the Fil.
    const patrick = fil.locator("article").filter({ hasText: "Premier jour chez Fleuve Banque" });
    await expect(patrick.getByRole("button", { name: /^J'aime/ })).toBeVisible();
    await patrick.getByRole("link", { name: /^Commenter/ }).click();
    await page.waitForURL(/\/app\/fil\/[^/]+$/);
    await expect(page.getByRole("heading", { name: "Publication" })).toBeVisible();
    await expect(
      page.getByText("Bienvenue dans l’équipe, Patrick !", { exact: true }),
    ).toBeVisible();
    const answer = page.getByRole("textbox", { name: "Votre réponse" });
    await expect(answer).toBeVisible();
    await answer.fill("Félicitations Patrick ! (test)");
    await page.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(
      page.getByText("Félicitations Patrick ! (test)", { exact: true }).last(),
    ).toBeVisible();
    await page.getByRole("link", { name: "Fil" }).first().click();
    await page.waitForURL((url) => url.pathname === "/app");

    // Publier: a new post with « Tout le monde peut répondre », back on the Fil.
    await fil.getByRole("link", { name: "Publier" }).first().click();
    await page.waitForURL("**/app/fil/publier");
    await expect(page.getByRole("heading", { name: "Nouvelle publication" })).toBeVisible();
    const audience = page.getByRole("button", { name: /Qui peut répondre/ });
    await audience.click();
    await expect(audience).toContainText("Mes connexions peuvent répondre");
    // A title first: the button asks for it, the counters and the preview follow the typing.
    await expect(page.getByRole("button", { name: "Ajoutez un titre", exact: true })).toBeVisible();
    const title = `Une nouvelle du test ${Date.now()}`;
    await page.getByRole("textbox", { name: /^Titre/ }).fill(title);
    await expect(page.getByText(`${title.length}/60`)).toBeVisible();
    const text = "Un texte fictif, assez court pour le Fil.";
    await page.getByRole("textbox", { name: /^Texte/ }).fill(text);
    await expect(page.getByText(`${text.length}/160`)).toBeVisible();
    await expect(page.getByText("Encore un peu : visez environ 120 caractères.")).toBeVisible();
    await expect(page.locator(".nb-fil-apercu").getByText(title)).toBeVisible();
    await page.getByRole("button", { name: "Publier", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await expect(fil.getByRole("heading", { name: title })).toBeVisible();
    await expect(fil.getByText(text).first()).toBeVisible();

    // The bell opens the notifications, with their filters.
    await fil.getByRole("link", { name: /^Notifications/ }).click();
    await page.waitForURL("**/app/notifications");
    const filters = page.getByRole("group", { name: "Catégories" });
    for (const name of ["Tout", "Candidatures", "Offres", "Réseau"]) {
      await expect(filters.getByRole("button", { name, exact: true })).toBeVisible();
    }
    await filters.getByRole("button", { name: "Réseau", exact: true }).click();
    await expect(filters.getByRole("button", { name: "Réseau", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("le Fil reste monté : aller-retour sans écran vide", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const first = page.locator(".nb-fil article").first();
    await expect(first).toBeVisible();
    // The Fil keeps its place under the other tabs: coming back shows it at once.
    const marker = await first.evaluate((node) => {
      (node as HTMLElement).dataset.test = "same";
      return true;
    });
    expect(marker).toBe(true);
    await nav.getByRole("link", { name: "Explorer", exact: true }).click();
    await page.waitForURL("**/app/jobs");
    await nav.getByRole("link", { name: "Fil", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await expect(page.locator('.nb-fil article[data-test="same"]')).toBeVisible();
  });
});
