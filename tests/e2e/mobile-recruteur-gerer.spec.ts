import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";
import { openCandidateFile } from "./hire-wide";

// Recruiter space, lot 5 (docs/refonte-mobile, brief recruteur § 4 item 5, planches recruteur-3
// and r3plus): the conversation with Orbi's draft and the templates (nothing leaves without the
// recruiter's tap), the templates' page, the organization, its team and the invitation, the
// subscription and the RH plans, the reports with the PDF export, the settings with the journal
// of the profiles opened, and the former addresses that lead to the new screens.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

/** A fresh, fictional company; with an entitlement, on the cheapest plan that opens it. */
async function freshRecruiter(page: Page, prefix: string, entitlement?: string) {
  const email = testEmail(prefix);
  const organization = `Entreprise fictive ${suffix()}`;
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    organization,
    "verified",
    ...(entitlement ? [entitlement] : []),
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");
  return { email, organization };
}

const main = (page: Page) => page.locator("main").filter({ visible: true });

/** No horizontal scroll at 390 and 412 px. */
async function noOverflow(page: Page, label: string) {
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `${label} à ${width} px`).toBe(client);
  }
}

test("conversation : brouillon d'Orbi relu puis envoyé, modèles, liste des messages", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(240_000);
  await freshRecruiter(page, "lot5-messages");
  const title = `Chargé de clientèle fictif ${suffix()}`;
  const detail = await fillOffer(page, {
    title,
    description: "Poste fictif de test : accueillir et conseiller une clientèle imaginaire.",
    responsibilities: ["Accueillir la clientèle"],
    skill: "Bureautique",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);

  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  const talent = await context.newPage();
  await logIn(talent, "jeanpierre.ux@jumanly.test");
  await talent.goto(`/app/jobs/${slug}/postuler`);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await context.close();

  // The file's menu « Modèles de message » opens the conversation with its templates.
  await page.goto(`/app/hire/candidats?offre=${detail.split("/").pop()}`);
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const file = new URL(page.url()).pathname;
  await page.goto(`${file}/message`);
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+\?modeles=1/);
  const templates = page.getByRole("dialog", {
    name: isMobile ? "Modèles de messages" : "Modèles",
  });
  await expect(templates).toBeVisible();
  await expectAccessible(page);
  // The phone sheet closes from its veil or « Échap »; the computer's dialog has « Fermer ».
  if (isMobile) await page.keyboard.press("Escape");
  else await templates.getByRole("button", { name: "Fermer" }).click();
  await expect(templates).toBeHidden();
  const conversation = new URL(page.url()).pathname;

  // The head names the candidate, the context card the offer.
  const screen = main(page);
  await expect(screen.getByRole("heading", { level: 1 })).toContainText("Jean-Pierre");
  // The offer is also in the list beside the conversation on a computer (web lot 3), which a
  // phone leaves out: the one on screen.
  await expect(screen.getByText(title).filter({ visible: true }).first()).toBeVisible();
  await noOverflow(page, "conversation");

  if (isMobile) {
    // Modèle B recruteur (M7): « Orbi propose » fills the field, « Joindre » holds the rest.
    const input = page.getByRole("textbox", { name: "Votre message" });
    await page.getByRole("button", { name: "Orbi propose" }).click();
    await expect(input).not.toHaveValue("", { timeout: 20_000 });
    await input.fill("Bonjour Jean-Pierre, merci pour votre candidature fictive.");
    await page.getByRole("button", { name: "Envoyer", exact: true }).click();
    // « Envoyer » leads back to the conversation without « ?modeles=1 »: a new page that takes
    // the place of this one, so the sheets are opened once it has arrived.
    await expect(page).toHaveURL(/\/app\/messages\/[^/?#]+#dernier$/);
    await expect(page.getByText("merci pour votre candidature fictive")).toBeVisible();
    await page.getByRole("button", { name: "Joindre" }).click();
    const attach = page.getByRole("dialog", { name: "Joindre" });
    await expect(
      attach.getByRole("link", { name: /Une invitation à un entretien/ }),
    ).toHaveAttribute("href", /\/app\/hire\/candidats\/[^/]+\/entretien$/);
    await expect(attach.getByRole("button", { name: /Une demande de document/ })).toBeVisible();
    await attach.getByRole("button", { name: "Annuler" }).click();
  } else {
    // Orbi drafts a reply: it lands in the composer only when the recruiter taps « Utiliser ».
    await screen
      .getByRole("group", { name: "Orbi dans la conversation" })
      .getByRole("button", { name: "Proposer une réponse" })
      .click();
    const draft = screen.locator(".t-r5-brou");
    await expect(draft.getByText("Brouillon d'Orbi, à relire avant d'envoyer")).toBeVisible({
      timeout: 20_000,
    });
    const field = screen.getByRole("textbox", { name: "Écrire un message" });
    await expect(field).toHaveValue("");
    await draft.getByRole("button", { name: "Utiliser" }).click();
    await expect(field).not.toHaveValue("");
    await field.fill("Bonjour Jean-Pierre, merci pour votre candidature fictive.");
    await screen.getByRole("button", { name: "Envoyer" }).click();
    await expect(
      screen.locator(".t-msg.t-moi").getByText("merci pour votre candidature fictive"),
    ).toBeVisible();

    // « + » : slots, a document, the templates.
    await screen.getByRole("button", { name: "Créneaux, documents, modèles" }).click();
    const plus = page.getByRole("dialog", { name: "Ajouter à la conversation" });
    await expect(plus.getByRole("link", { name: /Proposer des créneaux/ })).toHaveAttribute(
      "href",
      /\/app\/hire\/candidats\/[^/]+\/entretien$/,
    );
    await expect(plus.getByRole("button", { name: /Demander un document/ })).toBeVisible();
    await plus.getByRole("button", { name: "Fermer" }).click();
  }

  // The list: the conversation, the offer, the filters.
  await page.goto("/app/messages");
  const list = main(page);
  await expect(list.getByRole("heading", { level: 1 })).toHaveText("Messages");
  await expect(list.locator(`a[href^="${conversation}"]`)).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "messages");

  // The templates' page: a template created there is offered in the conversation.
  await page.goto("/app/hire/modeles");
  // On a phone, the templates of Compte (Modèle B recruteur M8): read there, written on a computer.
  await expect(
    main(page).getByRole("heading", { level: 1 }).filter({ visible: true }).first(),
  ).toHaveText(isMobile ? "Modèles de messages" : "Modèles de message");
  await expectAccessible(page);
  await noOverflow(page, "modèles");
});

test("organisation : page, modification, vérification, équipe et invitation", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const { organization } = await freshRecruiter(page, "lot5-org", "reports.export");
  await page.goto("/app/organisation");
  // On a phone the company's space shows « À ouvrir sur un ordinateur » (étape 3); the phone keeps
  // its own pages under Compte (Modèle B recruteur M8, their own e2e).
  if (isMobile) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await page.goto("/app/organisation/equipe");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await page.goto("/app/hire/rapports");
    await expect(page).toHaveURL(/\/app\/hire\/compte\/statistiques$/);
    expect(
      (await page.request.get("/app/hire/rapports/export?format=csv")).headers()["content-type"],
    ).toContain("application/pdf");
    return;
  }
  // Page entreprise (étape 3, A3): the page, its public view, a change published.
  const screen = main(page);
  await expect(screen.getByLabel("Nom", { exact: true })).toHaveValue(organization);
  await expect(screen.getByRole("link", { name: "Voir la page publique" })).toHaveAttribute(
    "href",
    "/app/organisation/apercu",
  );
  await expectAccessible(page);
  await noOverflow(page, "organisation");

  await page.goto("/app/organisation/modifier");
  await expect(page).toHaveURL(/\/app\/organisation$/);
  await screen.getByLabel("Ville", { exact: true }).fill("Lubumbashi");
  await screen.getByRole("button", { name: "Publier les changements" }).click();
  await expect(page.locator(".ae-toast")).toContainText("Les changements sont en ligne");

  await page.goto("/app/organisation/verification");
  await expectAccessible(page);
  await noOverflow(page, "vérification");

  // Équipe (étape 3, A2): « Inviter un membre », then the seat is counted.
  await page.goto("/app/organisation/equipe");
  await expectAccessible(page);
  await noOverflow(page, "équipe");
  await main(page).getByRole("button", { name: "Inviter un membre" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Inviter un membre" });
  const invited = `invite-${suffix()}@jumanly.test`;
  await sheet.getByLabel("Adresse e-mail").fill(invited);
  await sheet.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page.locator(".ae-toast")).toContainText(
    `Invitation envoyée par e-mail à ${invited}`,
  );
  await expect(main(page).getByRole("tab", { name: /Invitations et demandes/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(main(page).getByText(invited)).toBeVisible();
  await noOverflow(page, "invitation");

  // Reports of this plan: the PDF export (the CSV is gone, its address gives the PDF).
  await page.goto("/app/hire/rapports");
  await expectAccessible(page);
  await noOverflow(page, "rapports");
  const pdf = main(page).getByRole("link", { name: /Exporter en PDF/ });
  const href = await pdf.getAttribute("href");
  const response = await page.request.get(href!);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect(
    (await page.request.get("/app/hire/rapports/export?format=csv")).headers()["content-type"],
  ).toContain("application/pdf");

  // The former tabs lead to the new pages.
  await page.goto("/app/organisation?onglet=membres");
  await expect(page).toHaveURL(/\/app\/organisation\/equipe/);
  await page.goto("/app/organisation?onglet=verification");
  await expect(page).toHaveURL(/\/app\/organisation\/verification/);
});

test("abonnement, formules RH, rapports en PDF, paramètres et journal des consultations", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(180_000);
  await freshRecruiter(page, "lot5-gerer");
  await page.goto("/app/abonnement");
  await expectAccessible(page);
  await noOverflow(page, "abonnement");

  await page.goto("/app/abonnement/formules");
  await expect(main(page).getByRole("heading", { level: 1 })).toHaveText(/^Formules/);
  await expectAccessible(page);
  await noOverflow(page, "formules");

  await page.goto("/app/hire/rapports");
  if (isMobile) await expect(page).toHaveURL(/\/app\/hire\/compte\/statistiques$/);
  await expectAccessible(page);
  await noOverflow(page, "rapports");
  // Without the right to export, the PDF is offered with the plan that opens it.
  await expect(main(page).getByRole("link", { name: /Exporter en PDF/ })).toHaveCount(0);

  await page.goto("/app/notifications");
  // On a phone, the notifications of Modèle B recruteur (M7): the brief of the day is Orbi's.
  if (isMobile)
    await expect(page.getByRole("tablist", { name: "Catégories de notifications" })).toBeVisible();
  else await expect(main(page).getByText("Votre journée en bref")).toBeVisible();
  await noOverflow(page, "notifications");

  // One seat on the free plan, taken by the owner: the invitation sheet points to a bigger plan.
  if (isMobile) {
    // On a phone, the team of Compte (Modèle B recruteur M8): the sheet says no place is left.
    await page.goto("/app/hire/compte/equipe");
    await page
      .getByRole("button", { name: "Inviter un collègue" })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "Inviter un collègue" }).getByText(/Plus de place/),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  } else {
    // Équipe (étape 3, A2): the invitation dialog says the only seat is taken.
    await page.goto("/app/organisation/equipe?inviter=1");
    await expect(
      page
        .getByRole("dialog", { name: "Inviter un membre" })
        .getByText(/La seule place .* est prise/),
    ).toBeVisible();
  }
  await noOverflow(page, "équipe pleine");

  await page.goto("/app/parametres");
  const settings = main(page);
  await expect(settings.getByRole("heading", { level: 1 })).toHaveText("Paramètres");
  await expect(settings.getByRole("link", { name: /Journal des consultations/ })).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "paramètres");
  await settings.getByRole("link", { name: /Journal des consultations/ }).click();
  await expect(page).toHaveURL(/\/app\/parametres\/consultations$/);
  await expect(main(page).getByText("Aucun profil ouvert pour l'instant.")).toBeVisible();
  await expectAccessible(page);

  // Former addresses.
  await page.goto("/app/parametres?onglet=securite");
  await expect(page).toHaveURL(/\/app\/parametres\/securite$/);
  await page.goto("/app/hire/bienvenue");
  await expect(page).toHaveURL(/\/app\/bienvenue/);
});
