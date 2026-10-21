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
  await replies.getByText("J'ai relu le message").click();
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
  await expect(talent.locator("main").filter({ visible: true })).toContainText("Recruteuse");
  // …until « Annuler l'envoi » withdraws it within 10 minutes.
  await main(page).getByRole("button", { name: "Annuler l'envoi" }).click();
  await expect(main(page)).toContainText("Envoi annulé");
  await context.close();
});

test("Baobab Fintech : classement prêt, fin d'offre, demande pour rejoindre, messagerie, rapport PDF", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await logIn(page, baobab, undefined, "/app/hire");

  // The ranking already read by Orbi (seed), with its rule.
  await page.goto("/app/hire/offres");
  const card = main(page).getByRole("link", {
    name: /Analyser les candidatures de « Analyste de données junior \(démo\) »/,
  });
  await card.first().click();
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
  const request = notes.locator("#demandes");
  await expect(request).toContainText("Josué Démo");
  await expect(request.getByRole("button", { name: "Accepter" })).toBeVisible();
  await expect(request.getByRole("combobox", { name: "Rôle" })).toBeVisible();
  const ending = notes.locator(".t-r6-fin").filter({ hasText: "Chargé de clientèle (démo)" });
  await expect(ending).toContainText("Fin de l'offre dans 3 jours");
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
  await page.getByRole("button", { name: "Options de la conversation" }).click();
  const menu = page.getByRole("dialog", { name: "Options" });
  await expect(menu).toContainText("Couper les notifications");
  await menu.getByRole("button", { name: /^Épingler/ }).click();
  await expect(page.getByText("Conversation épinglée en haut de la liste").first()).toBeVisible();
  await page.goto(thread);
  await page.getByRole("button", { name: "Options de la conversation" }).click();
  await page
    .getByRole("dialog", { name: "Options" })
    .getByRole("button", { name: /^Désépingler/ })
    .click();
  await expect(page.getByText("Conversation désépinglée").first()).toBeVisible();
  await noOverflow(page, "conversation");

  // « Mes propositions »: a pending proposal can be reminded once (the other project of the run
  // may already have done it: then « Relancé » shows).
  await page.goto("/app/hire/candidats?vue=propositions");
  const proposals = main(page);
  const remind = proposals.getByRole("button", { name: /^Relancer / });
  if (await remind.count()) {
    await remind.first().click();
    await expect(
      page.getByText("Relance envoyée. Le talent décide toujours.").first(),
    ).toBeVisible();
  }
  // Both projects may remind the same proposal at once: read the saved state afresh.
  await page.reload();
  await expect(proposals.getByText("Relancé", { exact: true }).first()).toBeVisible();
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
