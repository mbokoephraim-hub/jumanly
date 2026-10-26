import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { logIn, testEmail } from "./session";

// Modèle B recruteur, lot M7 (docs/modele-b-recruteur, mobile/captures sections 07 and 10): the
// tab Messages (Candidats, Réseau, Équipe), the search, a conversation with its aids, a
// conversation of the team, the notifications and Orbi. The company, its candidate « Grâce
// Fictive » and its colleague « Aline Fictive » are new and fictional (make-conversations.ts).
const CANDIDATE = "Grâce Fictive";
const COLLEAGUE = "Aline Fictive";

const main = (page: Page) => page.locator("main");
const tabs = (page: Page) =>
  main(page).getByRole("tablist", { name: "Conversations" }).filter({ visible: true });
/** Previous screens stay mounted, hidden (Next cacheComponents): the one on screen. */
const seen = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();
const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name });

async function fits(page: Page) {
  const [scroll, client] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(scroll).toBe(client);
}

async function closeToast(page: Page) {
  const close = page
    .getByRole("region", { name: "Messages de confirmation" })
    .getByRole("button", { name: "Fermer" });
  if (await close.count()) await close.first().click();
}

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Messages, notifications et Orbi au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("les listes, la recherche, une conversation, l'équipe, les notifications et Orbi", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const email = testEmail("rx-m7");
    const organizationId = execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      email,
      `Entreprise fictive ${suffix()}`,
      "verified",
    ]).toString();
    const conversationId = execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-conversations.ts",
      organizationId.trim().split("\n").pop()!,
      email,
    ])
      .toString()
      .trim()
      .split("\n")
      .pop()!;
    await logIn(page, email, undefined, "/app/hire");

    // Messages: Candidats first, the unread count beside each list.
    await page.goto("/app/messages");
    await expect(main(page).getByRole("heading", { name: "Messages", exact: true })).toBeVisible();
    await expect(tabs(page).getByRole("tab", { name: /^Candidats/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const row = main(page)
      .getByRole("link", { name: new RegExp(CANDIDATE) })
      .first();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Analyste de données fictif");
    await capture(page, "120-messages");
    await fits(page);
    await expectAccessible(page);

    await tabs(page)
      .getByRole("tab", { name: /^Réseau/ })
      .click();
    await expect(
      main(page)
        .getByText(/réseau/i)
        .first(),
    ).toBeVisible();
    await capture(page, "121-messages-reseau");
    await tabs(page)
      .getByRole("tab", { name: /^Équipe/ })
      .click();
    const team = main(page)
      .getByRole("link", { name: new RegExp(COLLEAGUE) })
      .first();
    await expect(team).toBeVisible();
    await capture(page, "122-messages-equipe");
    await fits(page);
    await expectAccessible(page);

    // The search: « Annuler », the scope, accents ignored.
    const field = main(page).getByRole("searchbox", { name: "Chercher dans les messages" });
    await field.click();
    await expect(main(page).getByRole("button", { name: "Annuler" })).toBeVisible();
    await field.fill("grace");
    await expect(main(page).getByRole("link", { name: new RegExp(CANDIDATE) })).toBeVisible();
    await capture(page, "123-messages-recherche");
    await main(page).getByRole("radio", { name: "Équipe" }).click();
    await expect(main(page).getByText(/Aucune conversation ne correspond/)).toBeVisible();
    await main(page).getByRole("radio", { name: "Tout" }).click();
    await main(page).getByRole("button", { name: "Effacer la recherche" }).click();
    await expect(field).toHaveValue("");
    await main(page).getByRole("button", { name: "Annuler" }).click();
    await expect(tabs(page)).toBeVisible();

    // « Nouveau message »: a candidate, or a colleague.
    await page.getByRole("button", { name: "Nouveau message" }).filter({ visible: true }).click();
    const compose = sheet(page, "Nouveau message");
    await expect(compose.getByRole("link", { name: new RegExp(CANDIDATE) })).toBeVisible();
    await expect(compose.getByRole("button", { name: new RegExp(COLLEAGUE) })).toBeVisible();
    await capture(page, "124-messages-nouveau");
    await compose.getByRole("button", { name: "Annuler" }).click();
    await expect(compose).toBeHidden();

    // Orbi from Messages: who awaits an answer (from the facts, no credit).
    await page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" }).click();
    const orbi = sheet(page, "Orbi");
    await orbi.getByRole("button", { name: "Qui attend une réponse de ma part ?" }).click();
    await expect(orbi.getByText(/attend une réponse de votre part/)).toBeVisible();
    await expect(orbi.getByRole("link", { name: new RegExp(CANDIDATE) })).toBeVisible();
    await expect(orbi.getByText("Orbi propose, vous décidez.")).toBeVisible();
    await capture(page, "134-messages-orbi");
    await orbi.getByRole("button", { name: "Retour" }).click();
    await orbi.getByRole("button", { name: "Résumer mes non-lus" }).click();
    await expect(orbi.getByText(/non lue/)).toBeVisible();
    await orbi.getByRole("link", { name: new RegExp(CANDIDATE) }).click();

    // A conversation: the person, the offer and its stage, « Ouvrir », the bubbles.
    await expect(page).toHaveURL(new RegExp(`/app/messages/${conversationId}`));
    await expect(page.getByRole("heading", { name: CANDIDATE })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Ouvrir/ }).first()).toHaveAttribute(
      "href",
      /\/app\/hire\/candidats\//,
    );
    await expect(seen(page, /je reste disponible/)).toBeVisible();
    await capture(page, "125-conversation");
    await fits(page);
    await expectAccessible(page);

    // Modèles: a template fills the field, nothing is sent.
    const input = page.getByRole("textbox", { name: "Votre message" });
    await page.getByRole("button", { name: "Modèles" }).click();
    const templates = sheet(page, "Modèles de messages");
    await expect(templates.getByRole("link", { name: /Gérer mes modèles/ })).toBeVisible();
    await capture(page, "127-conversation-modeles");
    await templates
      .getByRole("button")
      .filter({ hasText: /Convocation/i })
      .first()
      .click();
    await expect(input).not.toHaveValue("");

    // Orbi propose: a draft in the field, the recruiter decides.
    await input.fill("");
    await page.getByRole("button", { name: "Orbi propose" }).click();
    await expect(input).not.toHaveValue("", { timeout: 20_000 });
    await capture(page, "126-conversation-orbi");
    await input.fill("Merci Grâce, je vous propose un échange jeudi. (message fictif)");
    await page.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(seen(page, /je vous propose un échange jeudi/)).toBeVisible();

    // Joindre: an interview, a document, a file.
    await page.getByRole("button", { name: "Joindre" }).click();
    const attach = sheet(page, "Joindre");
    await expect(
      attach.getByRole("link", { name: /Une invitation à un entretien/ }),
    ).toHaveAttribute("href", /\/entretien/);
    await capture(page, "128-conversation-joindre");
    const documentSheet = sheet(page, "Demander un document");
    // The sheet slides in and the conversation refreshes under it: on a slow machine the button
    // can move or be redrawn while Playwright clicks, so the click is tried again until the next
    // sheet opens.
    await expect(async () => {
      if (!(await documentSheet.isVisible())) {
        await attach
          .getByRole("button", { name: /Une demande de document/ })
          .click({ timeout: 5_000 });
      }
      await expect(documentSheet).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await documentSheet.getByLabel("Document demandé").fill("Attestation fictive");
    const due = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    await documentSheet.getByLabel("À envoyer avant le").fill(due);
    await capture(page, "128b-conversation-document");
    await documentSheet.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(seen(page, "Demande de document envoyée.")).toBeVisible();
    await expect(seen(page, /Document demandé : Attestation fictive/)).toBeVisible();
    await closeToast(page);

    await page.getByRole("button", { name: "Joindre" }).click();
    await sheet(page, "Joindre")
      .locator('input[type="file"]')
      .setInputFiles({
        name: "note-fictive.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"),
      });
    await expect(seen(page, "Fichier envoyé.")).toBeVisible();
    await expect(page.getByRole("link", { name: /note-fictive\.pdf/ })).toBeVisible();
    await closeToast(page);

    // ··· : the file, the profile, mute.
    await page.getByRole("button", { name: "Plus d'actions sur la conversation" }).click();
    const menu = sheet(page, "Conversation");
    await expect(
      menu.getByRole("link", { name: "Ouvrir la fiche de la candidature" }),
    ).toBeVisible();
    await capture(page, "129b-conversation-menu");
    await menu.getByRole("button", { name: "Couper les notifications" }).click();
    await expect(seen(page, "Notifications coupées pour cette conversation.")).toBeVisible();
    await closeToast(page);
    await page.getByRole("button", { name: "Plus d'actions sur la conversation" }).click();
    await sheet(page, "Conversation")
      .getByRole("button", { name: "Réactiver les notifications" })
      .click();
    await expect(seen(page, "Notifications réactivées.")).toBeVisible();
    await closeToast(page);
    await page.getByRole("button", { name: "Plus d'actions sur la conversation" }).click();
    await sheet(page, "Conversation")
      .getByRole("button", { name: /^Épingler pour l'équipe/ })
      .click();
    await expect(seen(page, "Conversation épinglée en haut de la liste.")).toBeVisible();
    await closeToast(page);
    await page.getByRole("button", { name: "Plus d'actions sur la conversation" }).click();
    await sheet(page, "Conversation")
      .getByRole("button", { name: /^Désépingler/ })
      .click();
    await expect(seen(page, "Conversation désépinglée.")).toBeVisible();
    await closeToast(page);

    // Équipe: only the two colleagues read it.
    await page.goto("/app/messages");
    await tabs(page)
      .getByRole("tab", { name: /^Équipe/ })
      .click();
    await main(page)
      .getByRole("link", { name: new RegExp(COLLEAGUE) })
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/messages\/equipe\//);
    await expect(page.getByRole("heading", { name: COLLEAGUE })).toBeVisible();
    await expect(seen(page, /relire l'offre d'analyste/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Joindre" })).toHaveCount(0);
    await capture(page, "132-equipe");
    await page.getByRole("textbox", { name: "Votre message" }).fill("Oui, je la relis ce soir.");
    await page.getByRole("button", { name: "Envoyer", exact: true }).click();
    await expect(seen(page, "Oui, je la relis ce soir.")).toBeVisible();
    await capture(page, "133-equipe-envoye");
    await fits(page);
    await expectAccessible(page);

    // Notifications: Tout, Candidatures, Entretiens, Réseau; « Tout marquer comme lu ».
    await page.goto("/app/notifications");
    await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
    const notifTabs = page.getByRole("tablist", { name: "Catégories de notifications" });
    await expect(notifTabs.getByRole("tab", { name: /^Tout/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(seen(page, /Nouvelle candidature de Grâce Fictive/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Aujourd'hui" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hier" })).toBeVisible();
    await capture(page, "180-notifications");
    await fits(page);
    await expectAccessible(page);
    await notifTabs.getByRole("tab", { name: /^Candidatures/ }).click();
    await expect(seen(page, /Nouvelle candidature de Grâce Fictive/)).toBeVisible();
    await expect(page.getByText(/a confirmé son entretien/)).toBeHidden();
    await capture(page, "181-notifications-candidatures");
    await notifTabs.getByRole("tab", { name: /^Entretiens/ }).click();
    await expect(seen(page, /a confirmé son entretien/)).toBeVisible();
    await notifTabs.getByRole("tab", { name: /^Réseau/ }).click();
    await expect(
      page.getByText(/vous a écrit dans Équipe|a accepté votre demande/).first(),
    ).toBeVisible();
    await capture(page, "182-notifications-reseau");
    await notifTabs.getByRole("tab", { name: /^Tout/ }).click();
    await page.getByRole("button", { name: "Tout marquer comme lu" }).click();
    await expect(seen(page, "Toutes les notifications sont lues.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tout marquer comme lu" })).toBeDisabled();
    await closeToast(page);
    await expect(page.getByRole("link", { name: "Réglage des notifications" })).toHaveAttribute(
      "href",
      "/app/parametres/notifications",
    );
    await page.getByRole("button", { name: /Nouvelle candidature de Grâce Fictive/ }).click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats\//);

    // « Retirer de la messagerie de l'équipe »: out of the list, nothing deleted.
    await page.goto(`/app/messages/${conversationId}`);
    await page.getByRole("button", { name: "Plus d'actions sur la conversation" }).click();
    await sheet(page, "Conversation")
      .getByRole("button", { name: /^Retirer de la messagerie de l'équipe/ })
      .click();
    await expect(page).toHaveURL(/\/app\/messages\?ok=hide/);
    await expect(seen(page, "Conversation retirée de la messagerie de l'équipe.")).toBeVisible();
    await expect(
      main(page)
        .getByRole("link", { name: new RegExp(CANDIDATE) })
        .filter({ visible: true }),
    ).toHaveCount(0);
    await closeToast(page);

    // Orbi's page: the four questions, the answers from the facts, « Effacer ».
    await page.goto("/app/orbi");
    await expect(page.getByRole("heading", { name: "Orbi", exact: true })).toBeVisible();
    await expect(seen(page, /Assistant de recrutement/)).toBeVisible();
    await page.getByRole("button", { name: "Que dois-je faire aujourd'hui ?" }).click();
    await expect(seen(page, /^Aujourd'hui :|Rien d'urgent/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Ouvrir les candidatures" })).toBeVisible();
    await capture(page, "184-orbi");
    await fits(page);
    await expectAccessible(page);
    await page.getByRole("button", { name: "Qui recevoir en premier ?" }).click();
    await expect(page.getByText(/Personne n'est écarté|ordre d'arrivée/).first()).toBeVisible();
    await page.getByRole("button", { name: "Des talents à proposer pour mes offres ?" }).click();
    await expect(page.getByText(/talents?|recherche de talents/).last()).toBeVisible();
    // The last answer settles first (the field and « Envoyer » wait for it on a slow machine).
    const send = page.getByRole("button", { name: "Envoyer", exact: true });
    await expect(send).toBeEnabled({ timeout: 20_000 });
    const orbiField = page.getByRole("textbox", { name: "Écrire à Orbi" });
    await orbiField.fill("Comment rédiger une offre ?");
    await expect(orbiField).toHaveValue("Comment rédiger une offre ?");
    await send.click();
    await expect(seen(page, "Comment rédiger une offre ?")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Orbi recommande, vous décidez.").last()).toBeVisible({
      timeout: 20_000,
    });
    await page
      .getByRole("button", { name: "Commencer une nouvelle conversation avec Orbi" })
      .click();
    await expect(page.getByText("Comment rédiger une offre ?")).toBeHidden();
    await expect(seen(page, /Bonjour, je suis Orbi/)).toBeVisible();
  });
});
