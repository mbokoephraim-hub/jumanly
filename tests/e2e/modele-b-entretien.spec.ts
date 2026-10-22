import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B6 (docs/modele-b, rangées 114 à 133): the interview practice on the phone.
// Amani (amani.ux@, Free) has the 5-minute trial and an application with an interview; talent.pro@
// has the oral and the written sessions in their plan. Sessions use the month's quota: reseed
// before running again.

/** No dictation and no voice in the test browser; a silent microphone that always answers. */
async function quietPhone(page: Page) {
  await page.addInitScript(() => {
    const scope = window as unknown as Record<string, unknown>;
    delete scope.webkitSpeechRecognition;
    delete scope.SpeechRecognition;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => {};
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => new MediaStream();
  });
}

const answerWithFigure =
  "Lors de mon stage, j'ai repris le suivi des réclamations clients avec un tableau partagé : les délais sont passés de 5 à 2 jours en trois mois.";

test.describe("Modèle B · Simulation d'entretien au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("les réglages : verrous, formule, essai, préparation et historique", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "amani.ux@jumanly.test");
    await page.goto("/app/career/entretiens/nouveau");
    const settings = page.locator(".nb-iv-reglages");
    await expect(
      settings.getByRole("heading", { name: "S’entraîner pour l’entretien" }),
    ).toBeVisible();

    // A longer duration than the trial opens « la formule » sheet; « Garder l'essai » closes it.
    await settings.getByRole("radio", { name: /^10 min/ }).click();
    const sheet = page.getByRole("dialog", { name: /est inclus dans/ });
    await expect(sheet.getByRole("link", { name: "Voir les formules" })).toBeVisible();
    await sheet.getByRole("button", { name: "Garder l’essai de 5 min" }).click();
    await expect(sheet).toBeHidden();
    await expect(settings.getByRole("radio", { name: /^5 min/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // An advanced focus is locked during the trial: same sheet, « Plus tard ».
    await settings.getByRole("radio", { name: /^Questions pièges/ }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Plus tard" }).click();
    await expect(sheet).toBeHidden();

    // Every other choice answers in place.
    await settings.getByRole("radio", { name: /^Motivation et entreprise/ }).click();
    await expect(
      settings.getByRole("radio", { name: /^Motivation et entreprise/ }),
    ).toHaveAttribute("aria-checked", "true");
    await settings.getByRole("radio", { name: "Exigeant" }).click();
    await expect(settings.getByRole("radio", { name: "Exigeant" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // The trial prepares the questions; « Modifier les réglages » gives the unit back.
    await settings.getByRole("button", { name: "Essayer gratuitement · 5 min" }).click();
    const ready = page.locator(".nb-iv-dl");
    await expect(ready.getByRole("heading", { name: "C’est prêt" })).toBeVisible({
      timeout: 20_000,
    });
    await ready.getByRole("button", { name: "Voir les questions avant" }).click();
    await expect(ready.locator(".nb-iv-apercu li")).toHaveCount(3);
    await ready.getByRole("button", { name: "Masquer les questions" }).click();
    await ready.getByRole("button", { name: "Modifier les réglages" }).click();
    await expect(
      settings.getByRole("button", { name: "Essayer gratuitement · 5 min" }),
    ).toBeVisible();

    // « Mes simulations » opens the list; its back link returns to the settings.
    await settings.getByRole("link", { name: "Mes simulations" }).click();
    await page.waitForURL(/\/app\/career\/entretiens$/);
    const list = page.locator(".nb-iv-hist-page");
    await expect(list.getByRole("heading", { name: "Mes simulations" })).toBeVisible();
    await list.getByRole("link", { name: "Réglages" }).click();
    await page.waitForURL("**/app/career/entretiens/nouveau");
    await expect(settings).toBeVisible();
  });

  test("à l'oral : micro, question, relance, indice, pause, arrêt, bilan et détail", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await quietPhone(page);
    await logIn(page, "talent.pro@jumanly.test");
    await page.goto("/app/career/entretiens/nouveau");
    const settings = page.locator(".nb-iv-reglages");
    await expect(settings.getByRole("radio", { name: /^À l’oral/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await settings.getByRole("radio", { name: /^5 min/ }).click();
    await expect(settings.getByRole("radio", { name: /^5 min/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await settings.getByRole("radio", { name: /^Mes expériences/ }).click();
    await settings.getByRole("textbox", { name: "Pour quel poste ?" }).fill("Chargé de clientèle");
    await settings.getByRole("button", { name: "Préparer la simulation · 5 min" }).click();
    const ready = page.locator(".nb-iv-dl");
    await ready.getByRole("button", { name: "Commencer" }).click({ timeout: 20_000 });
    await page.waitForURL(/\/app\/career\/entretiens\/[^/?]+/);

    // « Avant de commencer »: the microphone, the captions, then « C'est parti ».
    const mic = page.locator(".nb-iv-micro");
    await expect(mic.getByRole("heading", { name: "Avant de commencer" })).toBeVisible();
    const captions = mic.getByRole("switch", { name: "Afficher le texte des questions" });
    const before = await captions.getAttribute("aria-checked");
    await captions.click();
    await expect(captions).not.toHaveAttribute("aria-checked", before ?? "");
    await captions.click();
    await mic.getByRole("button", { name: "Autoriser le micro" }).click();
    await expect(mic.getByText("On vous entend bien")).toBeVisible();
    await mic.getByRole("button", { name: "C’est parti" }).click();

    const run = page.locator(".nb-iv-run");
    await expect(run.getByText("Question 1 sur 3")).toBeVisible();
    await run.getByRole("button", { name: "Répéter" }).click();
    await expect(page.getByText("Orbi répète la question")).toBeVisible();
    await run.getByRole("button", { name: "Son", exact: true }).click();
    await expect(run.getByRole("button", { name: "Son coupé" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // « Indice »: the hint and STAR, « Je réponds » closes it.
    await run.getByRole("button", { name: "Indice", exact: true }).click();
    const hint = page.getByRole("dialog", { name: "Un indice" });
    await expect(hint.getByText("La méthode STAR")).toBeVisible();
    await hint.getByRole("button", { name: "Je réponds" }).click();
    await expect(hint).toBeHidden();

    // Pause: the clock stops, « Reprendre » goes on.
    await run.getByRole("button", { name: "Mettre en pause" }).click();
    const pause = page.getByRole("dialog", { name: "En pause" });
    await expect(pause.getByRole("button", { name: "Recommencer la question" })).toBeVisible();
    await pause.getByRole("button", { name: "Reprendre" }).click();
    await expect(pause).toBeHidden();

    // Without dictation the answer is typed; without a figure Orbi asks for one (once).
    await run.getByRole("button", { name: "Répondre maintenant" }).click();
    await run
      .getByRole("textbox", { name: "Votre réponse" })
      .fill("J'ai repris le suivi des réclamations clients avec un tableau partagé.");
    await run.getByRole("button", { name: "J’ai fini de répondre" }).click();
    await expect(run.getByText("Orbi relance")).toBeVisible();
    await run.getByRole("button", { name: "Répondre maintenant" }).click();
    await run
      .getByRole("textbox", { name: "Votre réponse" })
      .fill("Les délais sont passés de 5 à 2 jours.");
    await run.getByRole("button", { name: "J’ai fini de répondre" }).click();
    await expect(run.getByText("Question 2 sur 3")).toBeVisible();

    // « Terminer » asks first; « Continuer » stays, « Voir le bilan » analyses then shows it.
    await run.getByRole("button", { name: "Terminer", exact: true }).click();
    const stop = page.getByRole("dialog", { name: "Arrêter la simulation ?" });
    await stop.getByRole("button", { name: "Continuer l’entretien" }).click();
    await expect(stop).toBeHidden();
    await run.getByRole("button", { name: "Terminer", exact: true }).click();
    await stop.getByRole("button", { name: "Voir le bilan de ces réponses" }).click();
    await expect(page.getByRole("heading", { name: "Orbi analyse vos réponses" })).toBeVisible();
    await page.waitForURL(/bilan=1/, { timeout: 20_000 });

    const report = page.locator(".nb-iv-bilan");
    await expect(report.getByRole("heading", { name: "Votre bilan" })).toBeVisible();
    // « Aisance » needs 5 seconds of answer at least; a quick typed answer is marked on its length.
    await expect(report.getByText("Clarté", { exact: true })).toBeVisible();
    await expect(report.getByText(/Ce n’est pas une prédiction/)).toBeVisible();

    // A question opens its detail; « Bilan » comes back.
    await report.locator(".nb-iv-liste a").first().click();
    await page.waitForURL(/reponse=/);
    const detail = page.locator(".nb-iv-detail");
    await expect(detail.getByText("Question 1", { exact: true })).toBeVisible();
    await expect(detail.getByText(/^Ce que vous avez (dit|écrit)$/)).toBeVisible();
    await expect(detail.getByRole("button", { name: "Refaire cette question" })).toBeVisible();
    await detail.getByRole("link", { name: "Bilan" }).click();
    await expect(report.getByRole("heading", { name: "Votre bilan" })).toBeVisible();

    // The history lists it with its mark; « Nouvelle simulation » opens the settings.
    await page.goto("/app/career/entretiens");
    const list = page.locator(".nb-iv-hist-page");
    await list.locator("a[data-hist]").first().click();
    await expect(report.getByRole("heading", { name: "Votre bilan" })).toBeVisible();
    await report.getByRole("link", { name: "Nouvelle simulation" }).click();
    await page.waitForURL("**/app/career/entretiens/nouveau**");
    await expect(page.locator(".nb-iv-reglages")).toBeVisible();
  });

  test("par écrit : la question, un indice, la réponse et le bilan", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "talent.pro@jumanly.test");
    await page.goto("/app/career/entretiens/nouveau");
    const settings = page.locator(".nb-iv-reglages");
    await settings.getByRole("radio", { name: /^Par écrit/ }).click();
    await settings.getByRole("textbox", { name: "Pour quel poste ?" }).fill("Chargé de clientèle");
    await settings.getByRole("radio", { name: /^5 min/ }).click();
    await settings.getByRole("button", { name: "Préparer la simulation · 5 min" }).click();
    await page.locator(".nb-iv-dl").getByRole("button", { name: "Commencer" }).click({
      timeout: 20_000,
    });
    await page.waitForURL(/\/app\/career\/entretiens\/[^/?]+/);

    const run = page.locator(".nb-iv-run");
    await expect(run.getByText("Question 1 sur 3")).toBeVisible();
    await run.getByRole("button", { name: "Un indice ?" }).click();
    const hint = page.getByRole("dialog", { name: "Un indice" });
    await hint.getByRole("button", { name: "Je réponds" }).click();
    await expect(hint).toBeHidden();
    await run.getByRole("textbox", { name: "Votre réponse" }).fill(answerWithFigure);
    await expect(run.getByText(/mots · visez 60 à 120/)).toBeVisible();
    await run.getByRole("button", { name: "Envoyer" }).click();
    await expect(run.getByText("Question 2 sur 3")).toBeVisible();

    await run.getByRole("button", { name: "Terminer", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Arrêter la simulation ?" })
      .getByRole("button", { name: "Voir le bilan de ces réponses" })
      .click();
    await page.waitForURL(/bilan=1/, { timeout: 20_000 });
    const report = page.locator(".nb-iv-bilan");
    await expect(report.getByRole("heading", { name: "Votre bilan" })).toBeVisible();
    await expect(report.getByText("Longueur", { exact: true })).toBeVisible();
    await report.getByRole("link", { name: "Fermer et revenir" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/app/career/entretiens/"));
  });

  test("depuis une candidature : aller-retour sans écran vide", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "amani.ux@jumanly.test");
    await page.goto("/app/career/cv?onglet=candidatures");
    await page.locator('.nb-ca #car-panneau a[href^="/app/suivi/"]').first().click();
    await page.waitForURL(/\/app\/suivi\/[^/?]+$/);
    const application = page.url();
    const screen = page.locator(".nb-ca-candidature");
    await screen
      .getByRole("link", { name: /S’entraîner avec Orbi/ })
      .first()
      .click();
    await page.waitForURL(/\/app\/career\/entretiens\/nouveau\?candidature=/);

    // Each screen shows content as soon as the address changes: never a blank page.
    const settings = page.locator(".nb-iv-reglages");
    await expect(settings).toBeVisible();
    await expect(settings.locator(".nb-h1")).not.toBeEmpty();
    await settings.getByRole("link", { name: "Candidature" }).click();
    await page.waitForURL(application);
    await expect(screen.getByRole("heading", { name: "Candidature" })).toBeVisible();
    const background = await page.evaluate(
      () => getComputedStyle(document.querySelector(".nb-ca-candidature")!).visibility,
    );
    expect(background).toBe("visible");
  });
});
