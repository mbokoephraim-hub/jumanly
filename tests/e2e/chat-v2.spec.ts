import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Chat du talent (docs/chat-v2, captures 01 à 13): the list, a discussion with Clarisse of Baobab
// Fintech (seed `suivi.ts`: an interview to choose and a document asked for), a suggested reply
// sent in one touch, a reaction, the menu ···, « Joindre », Orbi, and a video call hung up.
// Sending and reacting change the demo: reseed before running again.
test.describe("Chat du talent", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Chat de la maquette est l'interface du téléphone.");

  test("ouvrir une discussion, répondre, réagir, appeler et raccrocher", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages");
    const list = page.locator(".nb-ch-liste");
    await expect(list.getByRole("heading", { name: "Chat", exact: true })).toBeVisible();
    await expect(list.getByRole("button", { name: "Nouveau message" })).toBeVisible();
    await expect(list.getByText(/Orbi résume/)).toBeVisible();
    await expect(
      list.getByText("Vous écrivez à vos connexions et aux recruteurs de vos candidatures."),
    ).toBeVisible();

    // The segment: the Lime pill follows the tab, a role tag on each line.
    const recruiters = list.getByRole("tab", { name: /^Recruteurs/ });
    await recruiters.click();
    await expect(recruiters).toHaveAttribute("aria-selected", "true");
    const row = list.getByRole("link", { name: /Clarisse/ });
    await expect(row.getByText("Recruteur", { exact: true })).toBeVisible();
    await row.click();
    await page.waitForURL(/\/app\/messages\/[^/?]+$/);

    // The head, the application pinned under it, the interview card.
    const conv = page.locator(".nb-ch-conv");
    await expect(conv.getByText(/Analyste de données junior/).first()).toBeVisible();
    await expect(conv.getByRole("link", { name: /Voir ›/ })).toHaveAttribute(
      "href",
      /\/app\/suivi\//,
    );
    const card = conv.locator(".nb-ch-rdv");
    await expect(card.getByText("Entretien", { exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Choisir un créneau" })).toBeVisible();
    await expect(card.getByRole("link", { name: "S’entraîner" })).toHaveAttribute(
      "href",
      /\/app\/career\/entretiens\/nouveau\?candidature=/,
    );

    // Orbi's suggested replies: one touch sends.
    const suggestions = conv.getByRole("group", { name: "Réponses suggérées par Orbi" });
    await suggestions.getByRole("button", { name: "Je vous l’envoie tout de suite" }).click();
    await expect(
      conv.locator(".nb-ch-m[data-moi]").getByText("Je vous l’envoie tout de suite"),
    ).toBeVisible();

    // A touch on a message: the six reactions; the one chosen shows under the bubble.
    const received = conv
      .locator(".nb-ch-bulle")
      .filter({ hasText: "votre profil nous intéresse" });
    await received.click();
    const bar = conv.getByRole("toolbar", { name: "Réagir" });
    await expect(bar.getByRole("button")).toHaveCount(6);
    await bar.getByRole("button", { name: "Réagir avec ❤️" }).click();
    await expect(received.getByRole("img", { name: /1 réaction : ❤️/ })).toBeVisible();

    // « Joindre »: the six tiles of the mockup.
    await conv.getByRole("button", { name: "Joindre un fichier" }).click();
    const attach = page.locator(".nb-feuille-dlg[open]");
    for (const tile of ["Photo", "Appareil", "Document", "Mon CV", "Attestation", "Rendez-vous"])
      await expect(attach.getByRole("button", { name: new RegExp(`^${tile}`) })).toBeVisible();
    await attach.getByRole("button", { name: /^Attestation/ }).click();
    await expect(attach.getByRole("heading", { name: "Mes attestations" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(attach).toBeHidden();

    // Orbi rédige: nothing leaves without « Envoyer ».
    await conv.getByRole("button", { name: "Écrire avec Orbi" }).click();
    const orbi = page.getByRole("dialog", { name: "Orbi vous aide à répondre" });
    await expect(orbi.getByRole("button", { name: "Plus professionnel" })).toBeVisible();
    await expect(orbi.getByRole("textbox")).not.toHaveValue(/^$|Orbi écrit/, { timeout: 20_000 });
    await expect(orbi.getByRole("button", { name: "Autre version" })).toBeEnabled();
    await page.keyboard.press("Escape");

    // The menu ···: the person's card, then each line; « Signaler » asks first.
    await conv.getByRole("button", { name: "Options de la discussion" }).click();
    const menu = page.locator(".nb-feuille-dlg[open]");
    await expect(menu.getByRole("link", { name: "Voir la candidature" })).toBeVisible();
    await expect(menu.getByRole("switch", { name: "Notifications" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(menu.getByRole("button", { name: "Épingler la discussion" })).toBeVisible();
    await menu.getByRole("button", { name: "Signaler" }).click();
    await expect(menu.getByRole("heading", { name: /Signaler la discussion avec/ })).toBeVisible();
    await menu.getByRole("button", { name: "Annuler" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    // The video call: asked first, then the ring, the timer, and « Raccrocher ».
    await conv.getByRole("button", { name: /^Appeler .* en vidéo$/ }).click();
    const ask = page.getByRole("dialog", { name: /^Souhaitez-vous appeler .* en vidéo \?$/ });
    await expect(ask.getByText("L’appel n’est pas enregistré.", { exact: false })).toBeVisible();
    await ask.getByRole("button", { name: "Oui, appeler" }).click();
    const call = page.getByRole("dialog", { name: /^Appel vidéo avec / });
    await expect(call.getByText("Chiffré de bout en bout")).toBeVisible();
    await expect(call.getByText("Vous", { exact: true })).toBeVisible();
    await expect(call.getByRole("timer", { name: "Durée de l’appel" })).toBeVisible({
      timeout: 15_000,
    });
    const micro = call.getByRole("button", { name: "Micro" });
    await micro.click();
    await expect(micro).toHaveAttribute("aria-pressed", "false");
    await call.getByRole("button", { name: "Raccrocher" }).click();
    await expect(call).toBeHidden();
    await expect(page.getByText(/^Appel terminé · \d+ s$/)).toBeVisible();
    await expect(
      conv
        .locator(".nb-ch-sys")
        .getByText(/^Appel vidéo · /)
        .last(),
    ).toBeVisible();
  });
});
