import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B8 (docs/modele-b, planches Messages*): the Messages tab on the phone, its three
// rubrics and its search, a conversation with everything it opens (photos, attachments, Orbi,
// settings, infos, media), the connection requests. Grâce (grace.ux@) talks with Patrick, Joël and
// Sarah (seed `messages.ts`). Sending a message and answering the requests change the demo:
// reseed before running again.
test.describe("Modèle B · Messages au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("chaque bouton de la liste ouvre quelque chose", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    const tab = page.locator(".nb-ms-accueil");
    await expect(tab.getByRole("heading", { name: "Messages", exact: true })).toBeVisible();
    await expect(tab.getByRole("link", { name: /Demandes de connexion/ })).toBeVisible();
    await expect(tab.getByRole("link", { name: /Patrick Ilunga/ })).toBeVisible();

    // The three rubrics, in place.
    await tab.getByRole("tab", { name: /^Recruteurs/ }).click();
    await expect(tab.locator("#ms-panneau .nb-ms-ligne").first()).toBeVisible();
    await expect(tab.getByRole("link", { name: /Patrick Ilunga/ })).toBeHidden();
    await tab.getByRole("tab", { name: /^Entreprises/ }).click();
    await expect(tab.getByRole("link", { name: /Fleuve Banque/ })).toBeVisible();
    await tab.getByRole("tab", { name: /^Connexions/ }).click();

    // The search: by type, then from a word, names and messages.
    const field = tab.getByRole("searchbox", { name: "Rechercher dans les messages" });
    await field.click();
    await expect(tab.getByText("Rechercher par type")).toBeVisible();
    await tab.getByRole("button", { name: "Photos", exact: true }).click();
    await expect(tab.getByRole("link", { name: "Voir la photo" }).first()).toBeVisible();
    await tab.getByRole("button", { name: "Retirer le filtre" }).click();
    await field.fill("Baobab");
    await expect(tab.getByText("Dans les messages")).toBeVisible();
    await tab.locator(".nb-ms-trouve").filter({ hasText: "Patrick Ilunga" }).first().click();
    await page.waitForURL(/\/app\/messages\/[^/]+\?q=Baobab/);
    const conv = page.locator(".nb-ms-conv");
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

  test("une discussion : photo, pièces jointes, Orbi, réglages, infos et médias", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    await page
      .locator(".nb-ms-accueil")
      .getByRole("link", { name: /Patrick Ilunga/ })
      .click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    const url = page.url();
    const conv = page.locator(".nb-ms-conv");
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

    // The paperclip: six choices, each a sheet with its way back.
    await conv.getByRole("button", { name: "Joindre un fichier" }).click();
    const attach = page
      .getByRole("dialog")
      .filter({ has: page.locator(".nb-ms-choix6, .nb-ms-sousretour") });
    await expect(attach.getByText("Photos récentes")).toBeVisible();
    await expect(attach.getByRole("button", { name: "Autoriser l’accès" })).toBeVisible();
    for (const [choice, title] of [
      ["Documents", "Documents"],
      ["CV", "Envoyer un CV"],
      ["Lettre de motivation", "Lettre de motivation"],
      ["Contact", "Partager un contact"],
      ["Agenda", "Proposer un rendez-vous"],
      ["Organisation", "Partager une organisation"],
    ] as const) {
      await attach.getByRole("button", { name: choice, exact: true }).click();
      await expect(attach.getByRole("heading", { name: title })).toBeVisible();
      if (choice === "Agenda")
        await expect(attach.getByRole("button", { name: /^Envoyer : / })).toBeVisible();
      await attach.getByRole("button", { name: "Joindre" }).click();
    }
    await page.keyboard.press("Escape");
    await expect(attach).toBeHidden();

    // Orbi helps to write; the person uses the text, then sends it.
    await conv.getByRole("button", { name: "Écrire avec Orbi" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi" });
    await expect(orbi.getByText("Orbi propose, vous décidez")).toBeVisible();
    await orbi.getByRole("button", { name: "Proposer une réponse" }).click();
    await orbi.getByRole("button", { name: "Utiliser" }).click();
    const composer = conv.getByRole("textbox", { name: "Écrire un message" });
    await expect(composer).not.toHaveValue("");
    await composer.fill("Merci Patrick, j’ai postulé ! (test e2e)");
    await conv.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(conv.getByText("Merci Patrick, j’ai postulé ! (test e2e)")).toBeVisible();
    await expect(composer).toHaveValue("");

    // The camera: without one, a way to take a photo with the phone.
    await conv.getByRole("button", { name: "Prendre une photo" }).click();
    const camera = page.getByRole("dialog", { name: "Appareil photo" });
    await expect(camera).toBeVisible();
    await camera.getByRole("button", { name: "Fermer la caméra" }).click();
    await expect(camera).toBeHidden();

    // « ··· »: every line opens something.
    const options = conv.getByRole("button", { name: "Options de la discussion" });
    const menu = page.getByRole("dialog").filter({ has: page.locator(".nb-ms-menu") });
    await options.click();
    await expect(menu.getByRole("link", { name: "Voir le profil" })).toBeVisible();
    await menu.getByRole("button", { name: "Messages éphémères" }).click();
    const settings = page.locator(".nb-feuille-dlg[open]");
    await expect(settings.getByRole("radio", { name: "24 heures" })).toBeVisible();
    await page.keyboard.press("Escape");

    await options.click();
    await menu.getByRole("button", { name: "Plus" }).click();
    const plus = page.locator(".nb-feuille-dlg[open]");
    await plus.getByRole("button", { name: "Exporter la discussion" }).click();
    await plus.getByRole("radio", { name: /Avec les médias/ }).click();
    const download = page.waitForEvent("download");
    await plus.getByRole("button", { name: "Exporter", exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/\.zip$/);

    await options.click();
    await menu.getByRole("button", { name: "Plus" }).click();
    await plus.getByRole("button", { name: "Ajouter un raccourci sur l’écran d’accueil" }).click();
    await expect(
      plus.getByRole("button", { name: "Copier le lien de la discussion" }),
    ).toBeVisible();
    await plus.getByRole("button", { name: "Compris" }).click();

    await options.click();
    await menu.getByRole("button", { name: "Plus" }).click();
    await plus.getByRole("button", { name: "Bloquer Patrick" }).click();
    await expect(plus.getByRole("heading", { name: "Bloquer Patrick ?" })).toBeVisible();
    await plus.getByRole("button", { name: "Annuler" }).click();
    await expect(plus).toBeHidden();

    // Search in the conversation, then its chips open the shared media.
    await options.click();
    await menu.getByRole("button", { name: "Rechercher dans la discussion" }).click();
    await conv.getByRole("searchbox", { name: "Rechercher dans la discussion" }).fill("Baobab");
    await expect(conv.getByText(/\d sur \d/)).toBeVisible();
    await conv.getByRole("link", { name: "Documents" }).click();
    await page.waitForURL(/\/medias\?onglet=docs$/);
    const medias = page.locator(".nb-ms-medias");
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

    // The infos: profile, search, silence, and the way back to the conversation.
    await page.goto(url);
    await conv.getByRole("link", { name: "Voir les informations de la discussion" }).click();
    await page.waitForURL(/\/infos$/);
    const infos = page.locator(".nb-ms-infos");
    await expect(infos.getByRole("link", { name: "Profil" })).toBeVisible();
    await expect(infos.getByRole("link", { name: /Médias, liens et documents/ })).toBeVisible();
    const silence = infos.getByRole("switch", { name: "Mode silencieux" });
    await silence.click();
    await expect(silence).toHaveAttribute("aria-checked", "true");
    await silence.click();
    await expect(silence).toHaveAttribute("aria-checked", "false");
    await infos.getByRole("link", { name: "Rechercher" }).click();
    await page.waitForURL(/\?chercher=1$/);
    await expect(
      conv.getByRole("searchbox", { name: "Rechercher dans la discussion" }),
    ).toBeVisible();
  });

  test("les demandes : accepter puis écrire, ignorer sans prévenir", async ({ page }) => {
    // Sarah's requests (seed `messages.ts`): Grâce's are used by other journeys at the same time.
    await logIn(page, "sarah.fil@jumanly.test");
    await page.goto("/app/messages/demandes");
    const requests = page.locator(".nb-ms-dem");
    await expect(requests.getByText("« On a suivi le même cours SQL ! »")).toBeVisible();
    const daniel = requests.locator(".nb-ms-demande").filter({ hasText: "Daniel Ilunga" });
    const fatou = requests.locator(".nb-ms-demande").filter({ hasText: "Fatou Ndiaye" });
    await fatou.getByRole("button", { name: "Ignorer" }).click();
    await expect(fatou.getByText("Demande ignorée. Fatou n’est pas prévenu·e.")).toBeVisible();
    await daniel.getByRole("button", { name: "Accepter" }).click();
    await daniel.getByRole("link", { name: "Écrire à Daniel" }).click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    await expect(page.locator(".nb-ms-conv").getByText("Daniel Ilunga").first()).toBeVisible();
  });

  test("Messages reste monté : aller-retour sans écran vide", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const list = page.locator(".nb-ms-accueil");
    await expect(list).toBeVisible();
    await list.evaluate((node) => {
      (node as HTMLElement).dataset.test = "same";
    });
    await nav.getByRole("link", { name: "Fil", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/app");
    await nav.getByRole("link", { name: /^Chat/ }).click();
    await page.waitForURL((url) => url.pathname === "/app/messages");
    await expect(page.locator('.nb-ms-accueil[data-test="same"]')).toBeVisible();

    // A conversation covers the list; « Retour » brings the list back as it was.
    await list.getByRole("link", { name: /Joël Kabeya/ }).click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);
    await expect(page.locator(".nb-ms-conv").getByText("Je réserve la salle")).toBeVisible();
    await page.locator(".nb-ms-conv").getByRole("link", { name: "Retour" }).click();
    await page.waitForURL((url) => url.pathname === "/app/messages");
    await expect(page.locator('.nb-ms-accueil[data-test="same"]')).toBeVisible();
  });
});
