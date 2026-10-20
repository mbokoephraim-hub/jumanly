import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";

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
  await page.getByRole("button", { name: /Qui voit mon profil/ }).click();
  await page.getByRole("radio", { name: /Visible des recruteurs/ }).check({ force: true });
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("C'est enregistré.")).toBeVisible();

  const recruiter = await newPage(browser, baseURL, isMobile);
  await logIn(recruiter, group.owner);
  await recruiter.goto(`/app/hire/talents?location=${city}`);
  await expect(recruiter.getByRole("heading", { name: /1 talent/ })).toBeVisible();
  await expectAccessible(recruiter);
  await recruiter.getByRole("link", { name: "Voir le profil" }).first().click();
  await expect(recruiter.getByRole("heading", { level: 1 })).toContainText("Neema");
  await recruiter
    .locator("#contact-message")
    .fill("Bonjour Neema, un poste fictif d'analyste pourrait vous intéresser.");
  await recruiter.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(recruiter.getByText("Demande envoyée. Vous serez prévenu")).toBeVisible();

  // Messages (planche talent-2 § 5): the request sits above the conversations, opened in a sheet.
  await page.goto("/app/messages");
  const request = page.getByRole("button", { name: /Groupe Démo.*souhaite échanger avec vous/ });
  await expect(request.first()).toBeVisible();
  await expectAccessible(page);
  await request.first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Accepter et échanger" }).click();
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+\?ok=relation/);
  await expect(page.getByText("Vous pouvez maintenant échanger avec")).toBeVisible();
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
  await page.goto("/app/hire/entretiens?candidature=nouveau#planifier");
  await expectAccessible(page);
  await page.locator("#interview-application").selectOption({ index: 1 });
  const slot = new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 11) + "10:00";
  await page.locator("#new-slot-0").fill(slot);
  await page.locator("#interview-link").fill("https://visio.example/e2e-fictif");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText("Invitation envoyée.")).toBeVisible();

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

/** The recruiter of the fictional group invites the visible talent to an interview with two slots. */
async function inviteTalent(page: Page) {
  await page.goto("/app/hire/entretiens?candidature=nouveau#planifier");
  await page.locator("#interview-application").selectOption({ index: 1 });
  const day = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 11);
  await page.locator("#new-slot-0").fill(`${day(4)}10:00`);
  await page.locator("#new-slot-1").fill(`${day(5)}15:00`);
  await page.locator("#interview-link").fill("https://visio.example/e2e-suivi");
  await page.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.getByText("Invitation envoyée.")).toBeVisible();
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
  await page.goto("/app/organisation?onglet=verification");
  await expectAccessible(page);
  const submit = page.getByRole("button", { name: /Envoyer la demande|Compléter la demande/ });
  const sent = await submit.isVisible();
  if (sent) {
    await page.locator("#verify-registration").fill("RCCM-FICTIF-E2E");
    await page.locator("#verify-mandate").fill("Directrice des ressources humaines (fictive)");
    // A supporting document (Admin v2, étape 4): a tiny fictional PDF.
    await page.locator("#verify-documents").setInputFiles({
      name: "registre-fictif.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% Justificatif fictif\n%%EOF\n"),
    });
    await submit.click();
    await expect(page.getByText(/Demande envoyée\. Nous revenons vers vous/)).toBeVisible();
  }
  if (await page.getByText("Vérification en cours").isVisible()) {
    const admin = await newPage(browser, baseURL, isMobile);
    await logIn(admin, demo.admin);
    await admin.goto("/admin/organisations?onglet=en-attente");
    await expectAccessible(admin);
    await admin.getByRole("link", { name: "Groupe Démo (groupe fictif)" }).click();
    if (sent)
      await expect(
        admin.locator("#organisations-fiche").getByRole("link", { name: /Ouvrir registre-fictif/ }),
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
    "/app/hire/rapports",
    "/app/organisation?onglet=equipes",
    "/app/organisation?onglet=entites",
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
  await expect(page.locator("#attribution")).toBeVisible();
  await expect(page.locator("#grille")).toBeVisible();
  await page.getByRole("link", { name: /^Voir (les|la) .*candidature/ }).click();
  await expect(page).toHaveURL(/\/app\/hire\/candidats\?offre=/);
  await expectAccessible(page);
});

// Mockup 04-07: a pool is created from the side panel, then renamed and deleted in place.
test("créer, renommer et supprimer un vivier", async ({ page }) => {
  test.setTimeout(120_000);
  const name = `Vivier e2e ${Math.random().toString(36).slice(2, 7)}`;
  await logIn(page, group.owner);
  await page.goto("/app/hire/viviers");
  await page.getByRole("link", { name: "Nouveau vivier" }).click();
  await page.locator("#pool-name").fill(name);
  await page.getByRole("button", { name: "Créer le vivier" }).click();
  await expect(page.locator("#vivier-title")).toHaveText(name);
  await expect(page.getByText("Vivier créé.").first()).toBeVisible();
  await page.locator("summary", { hasText: "Renommer" }).click();
  await page.locator("#pool-rename").fill(`${name} bis`);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.locator("#vivier-title")).toHaveText(`${name} bis`);
  await page.locator("summary", { hasText: "Supprimer le vivier" }).click();
  await page.getByRole("button", { name: "Supprimer le vivier" }).click();
  await expect(page.getByText("Vivier supprimé.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: `${name} bis` })).toHaveCount(0);
});
