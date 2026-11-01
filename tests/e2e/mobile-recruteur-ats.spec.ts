import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";

// Recruiter space, lot 6 (docs/refonte-mobile, brief recruteur § 4 item 6, planches recruteur-4 and
// modeles-recruteur): the ATS with Orbi (launch, recommendation with its « Pourquoi ? », profile
// for the offer), the list of the retained, the grouped replies read before sending and undone,
// the living messaging, the end-of-offer card, the join requests, « Relancer » and the PDF report.
// Orbi recommends, the recruiter decides: nobody is rejected automatically.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

const main = (page: Page) => page.locator("main").filter({ visible: true });

/** The seeded company of the planches: Baobab Fintech (prisma/seed/ux.ts, all fictional). */
const baobab = "recruteur6.ux@jumanly.test";
/** A seeded talent with skills (so the score and Orbi's points exist). */
const scoredTalent = "jeanpierre.ux@jumanly.test";

/** No horizontal scroll at 390 and 412 px, every summary open. */
async function noOverflow(page: Page, label: string) {
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    await page.evaluate(() => {
      document.querySelectorAll("main details").forEach((item) => item.setAttribute("open", ""));
    });
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `${label} à ${width} px`).toBe(client);
  }
}

test("ATS : analyse par Orbi, profil pour l'offre, retenus, réponse groupée relue puis annulée", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  const email = testEmail("rx-ats");
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    "verified",
    "hire.cv_analysis",
  ]);
  await logIn(page, email, undefined, "/app/hire");
  const detail = await fillOffer(page, {
    title: `Analyste de données fictif ${suffix()}`,
    description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
    responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
    skill: "Analyse de données",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);
  const jobId = detail.split("/").pop()!;
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  const talent = await context.newPage();
  await logIn(talent, scoredTalent);
  await talent.goto(`/app/jobs/${slug}/postuler`);
  // First screen (01/11/2026): how to apply; « Avec un CV existant » is chosen.
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=cv/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });

  // « Analyser (ATS) » from the offer: Orbi's hero, then « Quand analyser ? ».
  await page.goto(`/app/hire/offres/${jobId}/ats`);
  const ats = main(page);
  await expect(ats.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(ats).toContainText("Analyser le CV avec Orbi");
  await expectAccessible(page);
  await noOverflow(page, "ATS, avant l'analyse");
  await ats.getByRole("button", { name: "Analyser", exact: true }).click();
  const when = page.getByRole("dialog", { name: "Quand analyser ?" });
  await expect(when).toContainText("Maintenant");
  await when.getByRole("button", { name: "Lancer l'analyse" }).click();
  // The board follows the run, then shows the ranking with its rule.
  await expect(main(page).getByRole("navigation", { name: "Vues des candidatures" })).toBeVisible({
    timeout: 60_000,
  });
  await page.goto(`/app/hire/offres/${jobId}/ats?vue=tous`);
  await expect(main(page)).toContainText("Jean-Pierre");
  await expectAccessible(page);
  await noOverflow(page, "ATS, classement");
  // Nobody was rejected: the file is still active, at its first stage.
  await main(page)
    .getByRole("link", { name: /Jean-Pierre/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/ats/[^/?]+$`));
  const profile = main(page);
  await expect(profile.getByRole("heading", { level: 1 })).toContainText("Profil pour cette offre");
  await expect(profile).toContainText("Synthèse d'Orbi");
  await expect(profile.getByRole("table")).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "profil pour l'offre");
  await profile.getByRole("button", { name: "Ajouter aux retenus" }).click();
  await expect(page.getByText("Ajouté·e aux retenus").first()).toBeVisible();

  // The list of the retained, then the grouped reply: nothing leaves before « J'ai relu ».
  await page.goto(`/app/hire/offres/${jobId}/retenus`);
  const list = main(page);
  await expect(list.getByRole("heading", { level: 1 })).toContainText("Liste des retenus");
  await expect(list).toContainText("Jean-Pierre");
  await expectAccessible(page);
  await noOverflow(page, "retenus");
  await page.goto(`/app/hire/offres/${jobId}/reponses?groupe=retenus`);
  const replies = main(page);
  await expect(replies.getByRole("heading", { level: 1 })).toContainText("Répondre aux candidats");
  await expectAccessible(page);
  await noOverflow(page, "réponses groupées");
  await replies.getByRole("button", { name: "Aperçus" }).click();
  const preview = page.getByRole("dialog", { name: "Aperçu du message" });
  await expect(preview).toContainText("Jean-Pierre");
  await preview.getByRole("button", { name: "Fermer" }).first().click();
  // The box exists for the phone and for the computer: the one on screen.
  await replies.getByText("J'ai relu le message").filter({ visible: true }).click();
  await replies.getByRole("button", { name: "Envoyer à 1 personne" }).click();
  const confirm = page.getByRole("dialog", { name: "Envoyer 1 réponse ?" });
  await expect(confirm.getByRole("button", { name: "Envoyer", exact: true })).toBeDisabled();
  await confirm.getByText("J'ai relu le modèle et la personne concernée").click();
  await confirm.getByRole("button", { name: "Envoyer", exact: true }).click();
  await expect(page).toHaveURL(/envoye=/);
  await expect(main(page)).toContainText("1 réponse envoyée");
  await expectAccessible(page);
  await noOverflow(page, "réponses envoyées");

  // The talent sees the invitation in their messages…
  await talent.goto("/app/messages");
  // On a phone (Modèle B, lot B8), the recruiters have their own rubric.
  if (isMobile) await talent.getByRole("tab", { name: /^Recruteurs/ }).click();
  await expect(talent.getByRole("main")).toContainText("Recruteuse");
  // …until « Annuler l'envoi » withdraws it within 10 minutes.
  await main(page).getByRole("button", { name: "Annuler l'envoi" }).click();
  await expect(main(page)).toContainText("Envoi annulé");
  await context.close();
});

test("Baobab Fintech : classement prêt, fin d'offre, demande pour rejoindre, messagerie, rapport PDF", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(240_000);
  await logIn(page, baobab, undefined, "/app/hire");

  // The ranking already read by Orbi (seed), with its rule.
  await page.goto("/app/hire/offres");
  if (test.info().project.name === "mobile") {
    // On a phone, the offer's card opens its page (Modèle B recruteur, M4); the ATS keeps its
    // address until Candidatures is redone (M5).
    const href = await main(page)
      .getByRole("link", { name: /Analyste de données junior \(démo\)/ })
      .first()
      .getAttribute("href");
    await page.goto(`${href}/ats`);
  } else {
    const card = main(page).getByRole("link", {
      name: /Analyser les candidatures de « Analyste de données junior \(démo\) »/,
    });
    await card.first().click();
  }
  await expect(page).toHaveURL(/\/ats$/);
  const ats = main(page);
  await expect(ats).toContainText("Recommandation d'Orbi");
  await ats
    .getByRole("button", { name: /Pourquoi/ })
    .first()
    .click();
  await expect(page.getByRole("dialog", { name: "Comment Orbi recommande" })).toContainText(
    "Personne n'est rejeté",
  );
  await page.keyboard.press("Escape");
  await expectAccessible(page);
  await noOverflow(page, "ATS de Baobab");

  // Notifications: the join request waiting for the administrator and the offer ending in 3 days.
  await page.goto("/app/notifications?fin=1");
  const notes = main(page);
  // Other tests may leave their own requests to Baobab (Modèle B recruteur, M2): Josué's only.
  const request = notes.locator("#demandes form").filter({ hasText: "Josué Démo" });
  await expect(request).toBeVisible();
  await expect(request.getByRole("button", { name: "Accepter" })).toBeVisible();
  await expect(request.getByRole("combobox", { name: "Rôle" })).toBeVisible();
  const ending = notes.locator(".t-r6-fin").filter({ hasText: "Chargé de clientèle (démo)" });
  // The seed closes it three days after it runs: two calendar days when midnight passed since.
  await expect(ending).toContainText(/Fin de l'offre dans [23] jours/);
  await ending.getByRole("button", { name: /Prolonger l'offre/ }).click();
  const prolong = page.getByRole("dialog", { name: "Prolonger l'offre" });
  await expect(prolong).toContainText("+14 jours");
  await page.keyboard.press("Escape");
  await expectAccessible(page);
  await noOverflow(page, "notifications : demande et fin d'offre");

  // Messaging settings: presence, receipts and the reminder days.
  await page.goto("/app/parametres/messagerie");
  const settings = main(page);
  await expect(settings.getByRole("heading", { level: 1 })).toContainText("Messagerie et rappels");
  await expect(settings.getByRole("switch", { name: /J-3/ })).toBeChecked();
  await expectAccessible(page);
  await noOverflow(page, "messagerie et rappels");

  // A conversation: pin it for the team, then unpin it (the demo stays as it was).
  await page.goto("/app/messages");
  await main(page).locator('a[href^="/app/messages/"]').first().click();
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+/);
  const thread = page.url().split("?")[0]!;
  // On a phone, « ··· » of Modèle B recruteur (M7) holds the same choices.
  const phone = test.info().project.name === "mobile";
  const options = phone ? "Plus d'actions sur la conversation" : "Options de la conversation";
  const optionsSheet = phone ? "Conversation" : "Options";
  await page.getByRole("button", { name: options }).click();
  const menu = page.getByRole("dialog", { name: optionsSheet });
  await expect(menu).toContainText("Couper les notifications");
  await menu.getByRole("button", { name: /^Épingler/ }).click();
  await expect(page.getByText("Conversation épinglée en haut de la liste").first()).toBeVisible();
  await page.goto(thread);
  await page.getByRole("button", { name: options }).click();
  await page
    .getByRole("dialog", { name: optionsSheet })
    .getByRole("button", { name: /^Désépingler/ })
    .click();
  await expect(page.getByText("Conversation désépinglée").first()).toBeVisible();
  await noOverflow(page, "conversation");

  if (isMobile) {
    // Phone (Modèle B recruteur M6): « Mes propositions » is a tab of Talents. A pending proposal
    // shows « Relancer » until someone reminds it (the other project of the run may be first).
    await page.goto("/app/hire/talents?onglet=propositions");
    await expect(
      main(page).getByText("Les offres que vous avez proposées à des talents"),
    ).toBeVisible();
    const again = main(page).getByRole("button", { name: "Relancer", exact: true });
    if (await again.count()) {
      await again.first().click();
      await expect(page).toHaveURL(/onglet=propositions&(ok=relance|erreur=other)/);
    }
    await noOverflow(page, "propositions");
    return;
  }
  // « Mes propositions »: a pending proposal can be reminded once (the other project of the run
  // may already have done it: then « Relancé » shows).
  await page.goto("/app/hire/candidats?vue=propositions");
  const proposals = main(page);
  if (phone) {
    // Modèle B recruteur (M6): Talents › Propositions; « Relancer » goes once reminded.
    await expect(page).toHaveURL(/onglet=propositions/);
    const again = proposals.getByRole("button", { name: "Relancer", exact: true });
    await expect(proposals.getByRole("link", { name: /^Propositions/ })).toBeVisible();
    if (await again.count()) {
      await again.first().click();
      await expect(page).toHaveURL(/onglet=propositions&(ok=relance|erreur=other)/);
    }
    await expect(async () => {
      await page.reload();
      await expect(again).toHaveCount(0, { timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
    await noOverflow(page, "propositions");
    return;
  }
  const remind = proposals.getByRole("button", { name: /^Relancer / });
  // The list first (« Relancer » or « Relancé »): counting before it shows would skip the reminder.
  await expect(remind.or(proposals.getByText("Relancé", { exact: true })).first()).toBeVisible();
  if (await remind.count()) {
    await remind.first().click();
    // `relance=ok` when this click reminded, `relance=non` when the other project was first.
    await expect(page).toHaveURL(/relance=(ok|non)/);
    if (page.url().includes("relance=ok"))
      await expect(
        page.getByText("Relance envoyée. Le talent décide toujours.").first(),
      ).toBeVisible();
  }
  // Both projects may remind the same proposal at once: read the saved state afresh, until the
  // other project's reminder (if it won the race) has landed too.
  await expect(async () => {
    await page.reload();
    await expect(proposals.getByText("Relancé", { exact: true }).first()).toBeVisible({
      timeout: 3_000,
    });
  }).toPass({ timeout: 30_000 });
  await noOverflow(page, "propositions");
});

test("rapport de recrutement en PDF A4", async ({ page }) => {
  const email = testEmail("rx-rapport");
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    "verified",
    "reports.export",
  ]);
  await logIn(page, email, undefined, "/app/hire");
  // The PDF report: A4, Jumanly's colours, aggregates only.
  const response = await page.request.get("/app/hire/rapports/export?periode=30j");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  const body = await response.body();
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
  expect(body.toString("latin1")).toMatch(/\/MediaBox \[0 0 595\.2\d* 841\.8\d*\]/);
});
