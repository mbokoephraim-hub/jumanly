import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";
import { plannerToHours } from "./hire-wide";

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
  if (isMobile) {
    // Modèle B (lot B5): three choices saved at once.
    await page.getByRole("radio", { name: /^Les recruteurs/ }).click();
    await expect(page.getByText("C’est enregistré.")).toBeVisible();
  } else {
    await page.getByRole("button", { name: /Qui voit mon profil/ }).click();
    await page.getByRole("radio", { name: /Visible des recruteurs/ }).check({ force: true });
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("C'est enregistré.")).toBeVisible();
  }

  const recruiter = await newPage(browser, baseURL, isMobile);
  await logIn(recruiter, group.owner);
  if (isMobile) {
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
  } else {
    // Lot 4 (planches r2plus TAL, TPROF, CONTACT): the search lives in « Candidats › Talents ».
    await recruiter.goto(`/app/hire/candidats?vue=talents&lieu=${city}&offre=aucune`);
    const results = recruiter.locator("main").filter({ visible: true });
    await expect(results).toContainText("1 profil visible");
    await expectAccessible(recruiter);
    await results.getByRole("link", { name: /Consulter le profil de Neema/ }).click();
    await expect(recruiter.getByRole("heading", { level: 1 })).toContainText("Neema");
    await recruiter.getByRole("link", { name: "Proposer l'offre" }).click();
    await expect(recruiter).toHaveURL(/\/proposer/);
    await expectAccessible(recruiter);
    await recruiter.getByRole("button", { name: "Envoyer à Neema" }).click();
    await expect(recruiter.getByText("Proposition envoyée. Le talent a")).toBeVisible();
  }

  // Messages (planche talent-2 § 5): the request sits above the conversations, opened in a sheet.
  await page.goto("/app/messages");
  if (isMobile) {
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
  } else {
    const request = page.getByRole("button", { name: /Groupe Démo.*souhaite échanger avec vous/ });
    await expect(request.first()).toBeVisible();
    await expectAccessible(page);
    await request.first().click();
    await page.getByRole("dialog").getByRole("button", { name: "Accepter et échanger" }).click();
    await expect(page).toHaveURL(/\/app\/messages\/[^/?]+\?ok=relation/);
    await expect(page.getByText("Vous pouvez maintenant échanger avec")).toBeVisible();
  }
  await recruiter.context().close();
});

// An interview: the recruiter proposes slots, the talent picks one in the conversation.
test("un entretien est planifié puis confirmé par le talent", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Partage la candidature de démonstration : une seule exécution.");
  test.setTimeout(180_000);
  await logIn(page, group.owner);
  await inviteTalent(page, 1, true);

  const talent = await newPage(browser, baseURL, isMobile);
  await logIn(talent, group.talent);
  await talent.goto("/app/messages");
  // The list refreshes while the page settles (the row can be replaced under the pointer): the
  // conversation is opened from its address.
  const conversation = await talent
    .getByRole("link", { name: /Groupe Démo/ })
    .first()
    .getAttribute("href");
  await talent.goto(conversation!);
  // Planche talent-2 § 5: the slots are chosen in the conversation itself.
  await talent.waitForURL(/\/app\/messages\/.+/);
  await talent
    .locator('section[id^="entretien-"]')
    .last()
    .getByRole("button", { name: "Confirmer" })
    .click();
  await expect(talent).toHaveURL(/ok=entretien/);
  await expect(talent.locator('section[id^="entretien-"]').last()).toContainText(
    "Entretien confirmé",
  );
  await talent.context().close();
});

/**
 * The recruiter of the fictional group invites the visible talent (Vicky Fictive) to an interview
 * (lot 4, planche r2plus ENT): the month calendar, the day's slots chosen with Orbi's suggestion,
 * the preview, then the invitation.
 */
async function inviteTalent(page: Page, slots = 2, check = false) {
  await page.goto("/app/hire/entretiens?candidature=nouveau");
  const sheet = page.getByRole("dialog", { name: "Proposer un entretien à…" });
  if (check) await expectAccessible(page);
  await sheet
    .getByRole("link", { name: /Vicky Fictive/ })
    .first()
    .click();
  await planInterview(page, slots, check);
}

/** In the planner: a day, `slots` suggested times, the preview, then « Envoyer l'invitation ». */
async function planInterview(page: Page, slots: number, check = false) {
  await expect(page).toHaveURL(/\/entretien(\?|$)/);
  const planner = page.locator("main").filter({ visible: true });
  await planner.locator('[role="grid"] button:enabled').first().click();
  if (check) await expectAccessible(page);
  await plannerToHours(page);
  for (let index = 0; index < slots; index++) {
    await planner.locator(".t-rx-orbi").getByRole("button", { name: "Ajouter" }).click();
    await expect(planner).toContainText(`${index + 1} créneau`);
  }
  if (check) await expectAccessible(page);
  await planner.getByRole("button", { name: "Aperçu", exact: true }).click();
  await expect(
    planner.getByRole("region", { name: "Aperçu de l'invitation reçue par le talent" }),
  ).toBeVisible();
  if (check) await expectAccessible(page);
  await planner.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/entretiens\/[^/?]+\?ok=envoye/);
  await expect(page.getByText(/Invitation envoyée\./).first()).toBeVisible();
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
  // Suivi (planche talent-2 § 2 and 3): the card asks to choose a slot, the application page answers.
  await talent.goto("/app/suivi");
  const todo = talent.getByRole("region", { name: /^À faire/ });
  await expect(todo).toContainText("Choisir un créneau");
  await expectAccessible(talent);
  await todo
    .getByRole("link", { name: /Choisir un créneau/ })
    .first()
    .click();
  await expect(talent).toHaveURL(/\/app\/suivi\/[^/?#]+/);
  const detail = talent.url().split(/[?#]/)[0]!;
  const invite = talent.locator("#entretien");
  await expect(invite).toContainText("Invitation à un entretien");
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
test("les écrans Hire avancés sont accessibles", async ({ page, isMobile }) => {
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
  if (!isMobile) {
    await expect(page.locator("#attribution")).toBeVisible();
    await expect(page.locator("#grille")).toBeVisible();
  }
  await page
    .getByRole("link", { name: /^Voir (les|la|le) .*candidat/ })
    .filter({ visible: true })
    .first()
    .click();
  // On a phone the candidates of the offer open on the offer itself (planche 040).
  await expect(page).toHaveURL(
    isMobile ? /\/app\/hire\/offres\/[^/?]+\?vue=candidats/ : /\/app\/hire\/candidats\?offre=/,
  );
  await expectAccessible(page);
});

// Lot 4 (planche r2plus VIVIERS): a pool is created from « Mes viviers », then renamed and
// deleted from its menu.
test("créer, renommer et supprimer un vivier", async ({ page, isMobile }) => {
  test.setTimeout(120_000);
  const name = `Vivier e2e ${Math.random().toString(36).slice(2, 7)}`;
  await logIn(page, group.owner);
  await page.goto("/app/hire/viviers");
  if (isMobile) {
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
    return;
  }
  await page.getByRole("button", { name: "Créer un vivier" }).first().click();
  const create = page.getByRole("dialog", { name: "Créer un vivier" });
  await create.locator("#ri-v-nom").fill(name);
  await create.getByRole("button", { name: "Créer le vivier" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/viviers\/[^/?]+\?ok=cree/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByText("Vivier créé.").first()).toBeVisible();
  await page.getByRole("button", { name: "Options du vivier" }).click();
  const menu = page.getByRole("dialog", { name: "Vivier" });
  await menu.locator("#ri-v-renommer").fill(`${name} bis`);
  await menu.getByRole("button", { name: "Enregistrer le nom" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${name} bis`);
  await page.getByRole("button", { name: "Options du vivier" }).click();
  await page
    .getByRole("dialog", { name: "Vivier" })
    .getByRole("button", { name: "Supprimer le vivier" })
    .click();
  await expect(page.getByText("Vivier supprimé.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: `${name} bis` })).toHaveCount(0);
});
