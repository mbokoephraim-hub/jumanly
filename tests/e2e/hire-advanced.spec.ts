import { expect, test, type Browser, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { lastCode } from "./outbox";
import { demo, logIn, testEmail } from "./session";

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
  await page.getByRole("button", { name: "Continuer" }).click();
  // The entry screen leads to the plan step (docs/refonte-connexion § 5).
  await expect(page).toHaveURL(/\/inscription\/forfait/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.locator('input[name="firstName"]').fill("Neema");
  await page.locator('input[name="lastName"]').fill("Fictive");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("kinshasa-2026");
  await page.locator('select[name="country"]').selectOption("CD");
  await page.locator('input[name="city"]').fill(city);
  for (const name of ["terms", "ai", "age"]) await page.locator(`input[name="${name}"]`).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await page.locator('input[name="code"]').fill(await lastCode(email, since));
  await page.getByRole("button", { name: "Vérifier" }).click();
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
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
  await page.goto("/app/parametres?onglet=confidentialite");
  await page.getByLabel("Visible des recruteurs").check();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Modifications enregistrées.")).toBeVisible();

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

  await page.goto("/app/messages?filtre=demandes");
  await expect(page.getByText(/Groupe Démo.*souhaite échanger avec vous/)).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Accepter et échanger" }).click();
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
  await talent
    .getByRole("link", { name: /Groupe Démo/ })
    .first()
    .click();
  // Screen 24: the invitation is a pill in the conversation, answered on its own screen.
  await talent.waitForURL(/\/app\/messages\/.+/);
  const thread = talent.url();
  await talent
    .getByRole("link", { name: /Entretien proposé · 1 créneau · Voir/ })
    .last()
    .click();
  await talent.getByRole("button", { name: "Confirmer ce créneau" }).click();
  await expect(talent).toHaveURL(/ok=confirme/);
  await talent.goto(thread);
  await expect(
    talent.getByRole("link", { name: /Entretien confirmé · .* · Voir/ }).last(),
  ).toBeVisible();
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
  await talent.goto("/app/suivi");
  const todo = talent.getByRole("region", { name: "À traiter" });
  await expect(todo).toContainText("Entretien à confirmer");
  await expectAccessible(talent);
  await todo.getByRole("link", { name: "Confirmer", exact: true }).first().click();
  await expect(talent.getByRole("heading", { name: "Confirmer l'entretien" })).toBeVisible();
  await expect(talent.getByText("Choisissez un des créneaux proposés")).toBeVisible();
  await expectAccessible(talent);
  await talent.getByRole("button", { name: "Confirmer ce créneau" }).click();
  await expect(talent).toHaveURL(/ok=confirme/);
  await expect(talent.getByText(/Présence confirmée\. Groupe Démo.* est prévenue\./)).toBeVisible();
  const id = new URL(talent.url()).searchParams.get("entretien")!;
  const confirmed = talent.locator(`#entretien-${id}`);
  await expect(confirmed).toContainText("Confirmé");
  const agenda = await confirmed
    .getByRole("link", { name: "Ajouter à mon agenda" })
    .getAttribute("href");
  const ics = await talent.request.get(agenda!);
  expect(ics.status()).toBe(200);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toContain("BEGIN:VEVENT");

  // A second invitation: none of the slots suits, the talent proposes two other times.
  await inviteTalent(page);
  await talent.goto("/app/suivi?filtre=entretiens");
  await talent.getByRole("link", { name: "Proposer un autre moment" }).first().click();
  await expect(talent.getByRole("heading", { name: "Proposer un autre moment" })).toBeVisible();
  const days = talent.locator("fieldset").first().getByRole("button");
  await days.nth(2).click();
  await talent.getByRole("button", { name: "10 h 00", exact: true }).click();
  await talent.getByRole("button", { name: "14 h 00", exact: true }).click();
  await expect(talent.getByText("Vos propositions · 2 sur 3")).toBeVisible();
  await talent.locator("#propose-message").fill("Je suis en examen jeudi, fictif.");
  await expectAccessible(talent);
  await talent.getByRole("button", { name: "Envoyer mes propositions" }).click();
  await expect(talent).toHaveURL(/ok=propose/);
  await expect(talent.getByText("Vos propositions sont envoyées.")).toBeVisible();
  await expect(talent.getByRole("main")).toContainText("En attente du recruteur");
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
  await page.getByRole("link", { name: "Analyste de données (poste fictif)" }).first().click();
  await expect(page.locator("#attribution")).toBeVisible();
  await expect(page.locator("#grille")).toBeVisible();
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
