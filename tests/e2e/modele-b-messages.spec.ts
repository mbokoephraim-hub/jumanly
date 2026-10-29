import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B8, redrawn by the Chat (docs/chat-v2): the Chat tab on the phone, its rubrics
// and its search, a conversation with everything it opens (photos, attachments, Orbi, the menu
// ···, media), the connection requests. The Chat's own journey is in `chat-v2.spec.ts`. Grâce (grace.ux@) talks with Patrick, Joël and
// Sarah (seed `messages.ts`). Sending a message and answering the requests change the demo:
// reseed before running again.
test.describe("Modèle B · Messages au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton de la liste ouvre quelque chose", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    const tab = page.locator(".nb-ch-liste");
    await expect(tab.getByRole("heading", { name: "Chat", exact: true })).toBeVisible();
    await expect(tab.getByRole("link", { name: /Demandes de connexion/ })).toBeVisible();
    await expect(tab.getByRole("link", { name: /Patrick Ilunga/ })).toBeVisible();

    // The three rubrics, in place.
    await tab.getByRole("tab", { name: /^Recruteurs/ }).click();
    await expect(tab.locator("#ch-panneau .nb-ch-ligne").first()).toBeVisible();
    await expect(tab.getByRole("link", { name: /Patrick Ilunga/ })).toBeHidden();
    await tab.getByRole("tab", { name: /^Entreprises/ }).click();
    await expect(tab.getByRole("link", { name: /Fleuve Banque/ })).toBeVisible();
    await tab.getByRole("tab", { name: /^Connexions/ }).click();

    // The search: by type, then from a word, names and messages.
    await tab.getByRole("button", { name: "Rechercher", exact: true }).click();
    const field = tab.getByRole("searchbox", { name: "Rechercher dans les messages" });
    await expect(tab.getByText("Rechercher par type")).toBeVisible();
    await tab.getByRole("button", { name: "Photos", exact: true }).click();
    await expect(tab.getByRole("link", { name: "Voir la photo" }).first()).toBeVisible();
    await tab.getByRole("button", { name: "Retirer le filtre" }).click();
    await field.fill("Baobab");
    await expect(tab.getByText("Dans les messages")).toBeVisible();
    await tab.locator(".nb-ms-trouve").filter({ hasText: "Patrick Ilunga" }).first().click();
    await page.waitForURL(/\/app\/messages\/[^/]+\?q=Baobab/);
    const conv = page.locator(".nb-ch-conv");
    await expect(
      conv.getByRole("searchbox", { name: "Rechercher dans la discussion" }),
    ).toHaveValue("Baobab");
    await expect(conv.getByText(/\d sur \d/)).toBeVisible();
    await page.goto("/app/messages");

    // « Nouveau message »: the connections only, each one opens its conversation.
    await tab.getByRole("button", { name: "Nouveau message" }).click();
    const sheet = page.getByRole("dialog", { name: "Nouveau message" });
    await expect(sheet.getByText("Vous pouvez écrire seulement à vos connexions.")).toBeVisible();
    await expect(sheet.getByRole("link", { name: /Trouver des personnes/ })).toBeVisible();
    await sheet.getByRole("button", { name: /Sarah Mbala/ }).click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    await expect(conv.getByText("Sarah Mbala").first()).toBeVisible();
    await expect(conv.getByRole("button", { name: "Écouter la note vocale" })).toBeVisible();
  });

  test("une discussion : photo, pièces jointes, Orbi, menu ··· et médias", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    await page
      .locator(".nb-ch-liste")
      .getByRole("link", { name: /Patrick Ilunga/ })
      .click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    const url = page.url();
    const conv = page.locator(".nb-ch-conv");
    await expect(conv.getByText("Baobab Fintech cherche une analyste junior")).toBeVisible();
    // The job shared by link opens inside the space.
    await expect(conv.locator('a.nb-ms-lien-c[href^="/app/jobs/"]')).toBeVisible();

    // A photo opens full screen, with « Transférer » and « Enregistrer ».
    await conv.getByRole("button", { name: "Voir les photos" }).first().click();
    const viewer = page.getByRole("dialog", { name: "Patrick Ilunga" });
    await expect(viewer.getByRole("link", { name: "Enregistrer" })).toBeVisible();
    await viewer.getByRole("button", { name: "Transférer" }).click();
    await expect(page.getByRole("dialog", { name: "Transférer à" })).toBeVisible();
    await page.keyboard.press("Escape");
    await viewer.getByRole("button", { name: "Fermer" }).click();
    await expect(viewer).toBeHidden();

    // « + » (Joindre): six tiles, each a sheet with its way back.
    await conv.getByRole("button", { name: "Joindre un fichier" }).click();
    const attach = page.locator(".nb-feuille-dlg[open]");
    for (const [choice, title] of [
      ["Document", "Documents"],
      ["Mon CV", "Envoyer un CV"],
      ["Attestation", "Mes attestations"],
      ["Rendez-vous", "Proposer un rendez-vous"],
    ] as const) {
      await attach.getByRole("button", { name: new RegExp(`^${choice}`) }).click();
      await expect(attach.getByRole("heading", { name: title })).toBeVisible();
      if (choice === "Rendez-vous")
        await expect(attach.getByRole("button", { name: /^Envoyer : / })).toBeVisible();
      await attach.getByRole("button", { name: "Joindre" }).click();
    }
    // « Appareil »: without a camera, a way to take a photo with the phone.
    await attach.getByRole("button", { name: /^Appareil/ }).click();
    const camera = page.getByRole("dialog", { name: "Appareil photo" });
    await expect(camera).toBeVisible();
    await camera.getByRole("button", { name: "Fermer la caméra" }).click();
    await expect(camera).toBeHidden();

    // Orbi proposes a text; the person can change it, then sends it.
    await conv.getByRole("button", { name: "Écrire avec Orbi" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi vous aide à répondre" });
    const draft = orbi.getByRole("textbox");
    await expect(draft).not.toHaveValue(/^$|Orbi écrit/, { timeout: 20_000 });
    await draft.fill("Merci Patrick, j’ai postulé ! (test e2e)");
    await orbi.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(conv.getByText("Merci Patrick, j’ai postulé ! (test e2e)")).toBeVisible();
    const composer = conv.getByRole("textbox", { name: /^Écrire à Patrick/ });
    await expect(composer).toHaveValue("");

    // « ··· »: profile, search, media, notifications, pin, report and block.
    const options = conv.getByRole("button", { name: "Options de la discussion" });
    const menu = page.locator(".nb-feuille-dlg[open]");
    await options.click();
    await expect(menu.getByRole("link", { name: "Voir le profil" })).toBeVisible();
    const notifications = menu.getByRole("switch", { name: "Notifications" });
    await notifications.click();
    await expect(notifications).toHaveAttribute("aria-checked", "false");
    await notifications.click();
    await expect(notifications).toHaveAttribute("aria-checked", "true");
    await menu.getByRole("button", { name: "Bloquer" }).click();
    await expect(menu.getByRole("heading", { name: "Bloquer Patrick ?" })).toBeVisible();
    await menu.getByRole("button", { name: "Annuler" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    // Search in the conversation.
    await options.click();
    await menu.getByRole("button", { name: "Rechercher dans la discussion" }).click();
    await conv.getByRole("searchbox", { name: "Rechercher dans la discussion" }).fill("Baobab");
    await expect(conv.getByText(/\d sur \d/)).toBeVisible();
    await conv.getByRole("button", { name: "Fermer", exact: true }).click();

    // « Médias, liens et documents ».
    await options.click();
    await menu.getByRole("link", { name: "Médias, liens et documents" }).click();
    await page.waitForURL(/\/medias$/);
    const medias = page.locator(".nb-ms-medias");
    await medias.getByRole("tab", { name: "Documents" }).click();
    await expect(medias.getByRole("tab", { name: "Documents" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await medias.getByRole("tab", { name: "Liens" }).click();
    await expect(medias.locator(".nb-ms-lienl").first()).toBeVisible();
    await medias.getByRole("tab", { name: "Médias" }).click();
    await medias.getByRole("button", { name: "Voir la photo" }).first().click();
    await expect(page.getByRole("dialog", { name: "Patrick Ilunga" })).toBeVisible();
    await page.keyboard.press("Escape");

    // The old « Infos » address leads back to the conversation.
    await page.goto(`${url}/infos`);
    await page.waitForURL(url);
    await expect(conv.getByText("Baobab Fintech cherche une analyste junior")).toBeVisible();
  });

  test("les connexions : l'icône du Chat, accepter puis écrire, refuser sans prévenir", async ({
    page,
  }) => {
    // Sarah's requests (seed `messages.ts`): Grâce's are used by other journeys at the same time.
    await logIn(page, "sarah.fil@jumanly.test");
    await page.goto("/app/messages");
    await page.getByRole("link", { name: /^Connexions, \d+ demandes? en attente/ }).click();
    await page.waitForURL("**/app/messages/connexions");
    const requests = page.locator(".nb-cx");
    await expect(requests.getByText("« On a suivi le même cours SQL ! »")).toBeVisible();
    const daniel = requests.locator(".nb-cx-carte").filter({ hasText: "Daniel Ilunga" });
    const fatou = requests.locator(".nb-cx-carte").filter({ hasText: "Fatou Ndiaye" });
    await fatou.getByRole("button", { name: "Refuser la demande de Fatou Ndiaye" }).click();
    await expect(fatou.getByText("Demande refusée. Fatou n’est pas prévenu·e.")).toBeVisible();
    await daniel.getByRole("button", { name: "Accepter la demande de Daniel Ilunga" }).click();
    await daniel.getByRole("link", { name: "Écrire à Daniel" }).click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    await expect(page.locator(".nb-ch-conv").getByText("Daniel Ilunga").first()).toBeVisible();
  });

  test("Messages reste monté : aller-retour sans écran vide", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const list = page.locator(".nb-ch-liste");
    await expect(list).toBeVisible();
    await list.evaluate((node) => {
      (node as HTMLElement).dataset.test = "same";
    });
    await nav.getByRole("link", { name: "Fil", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await nav.getByRole("link", { name: /^Chat/ }).click();
    await page.waitForURL((url) => url.pathname === "/app/messages");
    await expect(page.locator('.nb-ch-liste[data-test="same"]')).toBeVisible();

    // A conversation covers the list; « Retour » brings the list back as it was.
    await list.getByRole("link", { name: /Joël Kabeya/ }).click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    await expect(page.locator(".nb-ch-conv").getByText("Je réserve la salle")).toBeVisible();
    await page.locator(".nb-ch-conv").getByRole("link", { name: "Retour" }).click();
    await page.waitForURL((url) => url.pathname === "/app/messages");
    await expect(page.locator('.nb-ch-liste[data-test="same"]')).toBeVisible();
  });
});
