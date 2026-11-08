import { execFileSync } from "node:child_process";
import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";
import { oneTestAtATimeOn } from "./baobab-lock";

// Shared demo data, changed on the computer and on the phone at the same time: one test at a time.
oneTestAtATimeOn("baobab");

/** Demo accounts of the fictional group (prisma/seed/group.ts). */
const group = { owner: "groupe@jumanly.test", talent: "talent.visible@jumanly.test" };

async function newPage(browser: Browser, baseURL: string | undefined, isMobile: boolean) {
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  return context.newPage();
}

/** A new talent living in a city no one else has, so that a search finds only them. */
async function signUpTalent(page: Page, email: string, city: string) {
  await page.goto("/inscription?profil=talent");
  await signUpWithEmail(page, email, "Neema Fictive");
  // The country and the city are asked at the first connection (refonte mobile, lot 2).
  await finishOnboarding(page, { country: "Congo", city });
}

// Parcours 6.5: a talent chooses to be visible, a recruiter finds them, asks to talk; the talent
// accepts and the conversation opens. Nothing is exchanged before the talent's answer.
test("recherche de talents et mise en relation acceptée", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const city = `Ville${Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 8)}`;
  await signUpTalent(page, testEmail("visible"), city);
  // Lot 7: « Qui voit mon profil » in Paramètres › Confidentialité, a sheet of three choices.
  await page.goto("/app/parametres/confidentialite");
  // Modèle B (lot B5): three choices saved at once.
  await page.getByRole("radio", { name: /^Les recruteurs/ }).click();
  await expect(page.getByText("C’est enregistré.")).toBeVisible();

  const recruiter = await newPage(browser, baseURL, isMobile);
  await logIn(recruiter, group.owner);
  // Modèle B recruteur (M6): the search of the tab Talents, by city, then « Proposer une offre ».
  await recruiter.goto("/app/hire/talents");
  const search = recruiter.getByRole("search").filter({ visible: true });
  await search.getByRole("searchbox").click();
  await search.getByRole("radio", { name: "Ville" }).click();
  await search.getByRole("searchbox").fill(city);
  await search
    .getByRole("link", { name: /Neema Fictive/ })
    .first()
    .click();
  const profile = recruiter.locator(".nb-rh-talent").filter({ visible: true });
  await expect(profile.getByRole("heading", { level: 1 })).toContainText("Neema");
  await expectAccessible(recruiter);
  await profile.getByRole("button", { name: "Proposer une offre" }).click();
  await recruiter
    .getByRole("dialog", { name: /^Proposer une offre à Neema/ })
    .getByRole("button", { name: "Envoyer la proposition" })
    .click();
  await expect(recruiter.getByText(/Proposition envoyée/).first()).toBeVisible();

  // Messages (planche talent-2 § 5): the request sits above the conversations, opened in a sheet.
  await page.goto("/app/messages");
  // On a phone (Modèle B, lot B8): the request waits in « Demandes de connexion ».
  await page.getByRole("link", { name: /^Demandes de connexion/ }).click();
  await page.waitForURL("**/app/messages/connexions");
  const card = page.locator(".nb-cx-carte").filter({ hasText: "Groupe Démo" }).first();
  await expect(card).toBeVisible();
  await expectAccessible(page);
  await card.getByRole("button", { name: "Accepter" }).click();
  await card.getByRole("link", { name: /^Écrire à / }).click();
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+\?de=connexions$/);
  await expect(page.locator(".nb-ch-conv")).toBeVisible();
  await recruiter.context().close();
});

// An interview: the recruiter proposes slots, the talent picks one from the card of the conversation.
test("un entretien est planifié puis confirmé par le talent", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Partage la candidature de démonstration : une seule exécution.");
  test.setTimeout(180_000);
  await logIn(page, group.owner);
  await inviteTalent(page, true);

  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, group.talent);
  await openInvitation(talent);
  const invite = talent.locator("#entretien");
  await invite.getByRole("button", { name: "Confirmer" }).click();
  await expect(talent).toHaveURL(/ok=confirme/);
  await expect(talent.getByText("Entretien confirmé. Le recruteur est prévenu.")).toBeVisible();
  await talent.context().close();
});

/**
 * The talent opens the last invitation (Modèle B, also on a computer since 07/11/2026): the
 * conversation of the group, its interview card, « Choisir un créneau », then the page of the
 * application that answers it.
 */
async function openInvitation(talent: Page) {
  await talent.goto("/app/messages");
  // The list refreshes while the page settles (the row can be replaced under the pointer): the
  // conversation is opened from its address.
  const conversation = await talent
    .getByRole("link", { name: /Groupe Démo/ })
    .first()
    .getAttribute("href");
  await talent.goto(conversation!);
  await talent
    .locator(".nb-ch-rdv")
    .filter({ visible: true })
    .last()
    .getByRole("link", { name: "Choisir un créneau" })
    .click();
  await expect(talent).toHaveURL(/\/app\/suivi\/[^/?#]+/);
  await expect(talent.locator("#entretien")).toContainText("Invitation à un entretien");
}

/**
 * The recruiter of the fictional group invites the visible talent (Vicky Fictive) to an interview,
 * from the planner of her file (Modèle B recruteur, M5; on a computer too since 08/11/2026): the
 * day after tomorrow, a video link, then « Envoyer l'invitation ».
 */
async function inviteTalent(page: Page, check = false) {
  const id = execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/application-of.ts",
    group.owner,
    group.talent,
  ])
    .toString()
    .trim()
    .split("\n")
    .pop()!;
  await page.goto(`/app/hire/candidats/${id}/entretien`);
  const plan = page.locator(".nb-rh-plan").filter({ visible: true });
  await plan.locator(".nb-rh-jours button").nth(1).click();
  const link = plan.getByLabel("Lien de la visio");
  if (await link.isVisible()) await link.fill("https://meet.jumanly.test/entretien");
  if (check) await expectAccessible(page);
  await plan.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByRole("heading", { name: "Invitation envoyée" })).toBeVisible();
}

// Prompt 5 (screens 15, 20-22): the talent answers from Suivi. A slot is confirmed only after the
// server's answer; the confirmed interview can be added to a calendar. Other times can be proposed.
test("Suivi : confirmer un entretien, l'ajouter à l'agenda, puis proposer d'autres moments", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Partage la candidature de démonstration : une seule exécution.");
  test.setTimeout(240_000);
  await logIn(page, group.owner);
  await inviteTalent(page);

  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, group.talent);
  await openInvitation(talent);
  const detail = talent.url().split(/[?#]/)[0]!;
  const invite = talent.locator("#entretien");
  await expectAccessible(talent);
  await invite.getByRole("button", { name: "Confirmer" }).click();
  await expect(talent).toHaveURL(/ok=confirme/);
  await expect(talent.getByText("Entretien confirmé. Le recruteur est prévenu.")).toBeVisible();
  const agenda = await talent
    .locator("#entretien")
    .getByRole("link", { name: "Ajouter à mon agenda" })
    .getAttribute("href");
  const ics = await talent.request.get(agenda!);
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toContain("BEGIN:VEVENT");

  // A second invitation: none of the slots suits, the talent proposes two other times.
  await inviteTalent(page);
  await talent.goto(detail);
  await talent.locator("#entretien").getByRole("button", { name: "Autre date" }).click();
  const sheet = talent.getByRole("dialog", { name: "Proposer un autre moment" });
  await expect(sheet).toBeVisible();
  const days = sheet.locator("fieldset").first().getByRole("button");
  await days.nth(2).click();
  await sheet.getByRole("button", { name: "10 h 00", exact: true }).click();
  await sheet.getByRole("button", { name: "14 h 00", exact: true }).click();
  await expect(sheet.getByText("Vos propositions · 2 sur 3")).toBeVisible();
  await sheet.locator("#ca-propose-message").fill("Je suis en examen jeudi, fictif.");
  await expectAccessible(talent);
  await sheet.getByRole("button", { name: "Envoyer mes propositions" }).click();
  await expect(talent).toHaveURL(/ok=propose/);
  await expect(talent.getByText("Vos créneaux sont envoyés au recruteur.")).toBeVisible();
  await expect(talent.locator("#entretien")).toContainText(
    "Vos créneaux sont envoyés. Le recruteur vous répond ici.",
  );
  await talent.context().close();
});

// Company verification by an administrator, then the public company page with its badge.
test("vérification de l'entreprise et page publique", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Modifie l'organisation de démonstration : une seule exécution.");
  test.setTimeout(180_000);
  await logIn(page, group.owner);
  await page.goto("/app/organisation/verification");
  await expectAccessible(page);
  const submit = page.getByRole("button", { name: /Envoyer la demande|Compléter la demande/ });
  const sent = await submit.isVisible();
  // A name of its own: a database replayed without a reset keeps the documents of earlier runs.
  const documentName = `registre-fictif-${Date.now().toString(36)}`;
  if (sent) {
    await page.locator("#vf-registration").fill("RCCM-FICTIF-E2E");
    await page.locator("#vf-mandate").fill("Directrice des ressources humaines (fictive)");
    // A supporting document (Admin v2, étape 4): a tiny fictional PDF.
    await page.locator("#vf-documents").setInputFiles({
      name: `${documentName}.pdf`,
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% Justificatif fictif\n%%EOF\n"),
    });
    await submit.click();
    await expect(page.getByText(/Demande envoyée\. Nous revenons vers vous/)).toBeVisible();
  }
  if (await page.getByText("Vérification en cours").first().isVisible()) {
    const admin = await newPage(browser, baseURL, isMobile);
    await logIn(admin, demo.admin);
    await admin.goto("/admin/organisations?onglet=en-attente");
    await expectAccessible(admin);
    await admin.getByRole("link", { name: "Groupe Démo (groupe fictif)" }).click();
    if (sent)
      await expect(
        admin
          .locator("#organisations-fiche")
          .getByRole("link", { name: new RegExp(`Ouvrir ${documentName}`) }),
      ).toBeVisible();
    await admin.getByRole("button", { name: "Approuver la vérification" }).click();
    await expect(admin.getByText("Groupe Démo (groupe fictif) est vérifiée.")).toBeVisible();
    await admin.context().close();
  }

  // The public page is cached: the approval refreshes it, a reload shows the new badge.
  await expect(async () => {
    await page.goto("/entreprises/demo-groupe-fictif");
    await expect(page.getByText("Entreprise vérifiée").first()).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Groupe Démo");
  await expect(
    page.getByRole("link", { name: "Analyste de données (poste fictif)" }),
  ).toBeVisible();
  await expectAccessible(page);
});

// The other E8 screens, accessible and reachable for the group owner.
test("les écrans Hire avancés sont accessibles", async ({ page }) => {
  test.setTimeout(180_000);
  await logIn(page, group.owner);
  for (const path of [
    "/app/hire",
    "/app/hire/viviers",
    "/app/hire/entretiens",
    "/app/hire/entretiens?vue=mois",
    "/app/hire/entretiens?vue=evaluer",
    "/app/hire/rapports",
    "/app/organisation/structure?onglet=equipes",
    "/app/organisation/structure?onglet=entites",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectAccessible(page);
  }
  await page.goto("/app/hire/offres");
  await page
    .getByRole("link", { name: "Analyste de données (poste fictif)" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+$/);
  await expectAccessible(page);
  // Lot 3: the assignment and the grid live on the offer, the candidates have their own screen.
  // On a phone (Modèle B recruteur, M4), the offer shows its figures and « Voir les N candidats ».
  // The offer opens on its candidates (03/11/2026); « Vue » holds the figures and the link.
  await page.goto(`${page.url().split("?")[0]}?vue=apercu`);
  await expectAccessible(page);

  await page
    .getByRole("link", { name: /^Voir (les|la|le) .*candidat/ })
    .filter({ visible: true })
    .first()
    .click();
  // On a phone the candidates of the offer open on the offer itself (planche 040).
  await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?vue=(candidats|candidatures|trier)/);
  await expectAccessible(page);
});

// Lot 4 (planche r2plus VIVIERS): a pool is created from « Mes viviers », then renamed and
// deleted from its menu.
test("créer, renommer et supprimer un vivier", async ({ page }) => {
  test.setTimeout(120_000);
  const name = `Vivier e2e ${Math.random().toString(36).slice(2, 7)}`;
  await logIn(page, group.owner);
  await page.goto("/app/hire/viviers");
  // Modèle B recruteur (M6): the vivier is a tab of Talents, its lists have their options.
  await expect(page).toHaveURL(/\/app\/hire\/talents\?onglet=vivier/);
  const tab = page.locator("main").filter({ visible: true });
  await tab.getByRole("button", { name: "Nouvelle liste" }).click();
  const create = page.getByRole("dialog", { name: "Nouvelle liste" });
  await create.getByLabel("Nom de la liste").fill(name);
  await create.getByRole("button", { name: "Créer la liste" }).click();
  await expect(page.getByText("Liste créée.").first()).toBeVisible();
  await tab.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await page.getByRole("button", { name: "Options de la liste" }).click();
  const options = page.getByRole("dialog", { name: "Options de la liste" });
  await options.getByLabel("Nom de la liste").fill(`${name} bis`);
  await options.getByRole("button", { name: "Enregistrer le nom" }).click();
  await expect(page.getByText("Liste renommée.").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${name} bis`);
  await page.getByRole("button", { name: "Options de la liste" }).click();
  await page
    .getByRole("dialog", { name: "Options de la liste" })
    .getByRole("button", { name: "Supprimer la liste" })
    .click();
  await expect(page.getByText("Liste supprimée.").first()).toBeVisible();
  await expect(tab.getByRole("link", { name: new RegExp(`${name} bis`) })).toHaveCount(0);
});
