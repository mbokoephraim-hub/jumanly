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
  await context.close();

  // The file's menu « Modèles de message » opens the conversation with its templates.
  await page.goto(`/app/hire/candidats?offre=${detail.split("/").pop()}`);
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const file = new URL(page.url()).pathname;
  await page.goto(`${file}/message`);
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+\?modeles=1/);
  const templates = page.getByRole("dialog", {
    name: "Modèles de messages",
  });
  await expect(templates).toBeVisible();
  await expectAccessible(page);
  // The phone sheet closes from its veil or « Échap »; the computer's dialog has « Fermer ».
  await page.keyboard.press("Escape");
  await expect(templates).toBeHidden();
  const conversation = new URL(page.url()).pathname;

  // The head names the candidate, the context card the offer.
  const screen = main(page);
  await expect(screen.getByRole("heading", { level: 1 })).toContainText("Jean-Pierre");
  // The offer is also in the list beside the conversation on a computer (web lot 3), which a
  // phone leaves out: the one on screen.
  await expect(screen.getByText(title).filter({ visible: true }).first()).toBeVisible();
  await noOverflow(page, "conversation");

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
  await expect(attach.getByRole("link", { name: /Une invitation à un entretien/ })).toHaveAttribute(
    "href",
    /\/app\/hire\/candidats\/[^/]+\/entretien$/,
  );
  await expect(attach.getByRole("button", { name: /Une demande de document/ })).toBeVisible();
  await attach.getByRole("button", { name: "Annuler" }).click();

  // The list: the conversation, the offer, the filters.
  await page.goto("/app/messages");
  const list = main(page);
  // The phone's tab is named « Chat » like the talent's; the computer keeps « Messages ».
  await expect(list.getByRole("heading", { level: 1 })).toHaveText("Chat");
  await expect(list.locator(`a[href^="${conversation}"]`)).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "messages");

  // The templates' page: a template created there is offered in the conversation.
  await page.goto("/app/hire/modeles");
  // On a phone, the templates of Compte (Modèle B recruteur M8): read there, written on a computer.
  await expect(
    main(page).getByRole("heading", { level: 1 }).filter({ visible: true }).first(),
  ).toHaveText("Modèles de messages");
  await expectAccessible(page);
  await noOverflow(page, "modèles");
});

test("organisation : page, modification, vérification, équipe et invitation", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(180_000);
  await freshRecruiter(page, "lot5-org", "reports.export");
  await page.goto("/app/organisation");
  if (isMobile) {
    // On a phone the company's space shows « À ouvrir sur un ordinateur » (étape 3); the phone
    // keeps its own pages under Compte (Modèle B recruteur M8, their own e2e).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await page.goto("/app/organisation/equipe");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await page.goto("/app/hire/rapports");
    await expect(page).toHaveURL(/\/app\/hire\/compte\/statistiques$/);
  } else {
    // On a computer (08/11/2026) the company's part and the reports sit in the menu, under the tabs.
    await page
      .getByRole("navigation", { name: "Entreprise" })
      .getByRole("link", { name: "Équipe" })
      .click();
    await expect(page).toHaveURL(/\/app\/organisation\/equipe$/);
    await page
      .getByRole("navigation", { name: "Outils" })
      .getByRole("link", { name: "Rapports" })
      .click();
    await expect(page).toHaveURL(/\/app\/hire\/rapports$/);
  }
  expect(
    (await page.request.get("/app/hire/rapports/export?format=csv")).headers()["content-type"],
  ).toContain("application/pdf");
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

  // The reports are a tool of the computer; a phone shows its statistics.
  await page.goto(isMobile ? "/app/hire/compte/statistiques" : "/app/hire/rapports");
  await expectAccessible(page);
  await noOverflow(page, "rapports");
  // Without the right to export, the PDF is offered with the plan that opens it.
  await expect(main(page).getByRole("link", { name: /Exporter en PDF/ })).toHaveCount(0);

  await page.goto("/app/notifications");
  // On a phone, the notifications of Modèle B recruteur (M7): the brief of the day is Orbi's.
  await expect(page.getByRole("group", { name: "Catégories", exact: true })).toBeVisible();
  await noOverflow(page, "notifications");

  // One seat on the free plan, taken by the owner: the invitation sheet points to a bigger plan.
  // On a phone, the team of Compte (Modèle B recruteur M8): the sheet says no place is left.
  await page.goto("/app/hire/compte/equipe");
  await page.getByRole("button", { name: "Inviter un collègue" }).filter({ visible: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Inviter un collègue" }).getByText(/Plus de place/),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await noOverflow(page, "équipe pleine");

  await page.goto("/app/parametres");
  const settings = main(page);
  await expect(settings.getByRole("heading", { level: 1 })).toHaveText("Paramètres");
  await expect(
    settings.getByRole("link", { name: /Journal des consultations|Profils consultés/ }),
  ).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "paramètres");
  await settings.getByRole("link", { name: /Journal des consultations|Profils consultés/ }).click();
  await expect(page).toHaveURL(/\/app\/parametres\/consultations$/);
  await expect(main(page).getByText("Aucun profil ouvert pour l'instant.")).toBeVisible();

  await expectAccessible(page);

  // Former addresses.
  await page.goto("/app/parametres?onglet=securite");
  await expect(page).toHaveURL(/\/app\/parametres\/securite$/);
  await page.goto("/app/hire/bienvenue");
  await expect(page).toHaveURL(/\/app\/bienvenue/);
});
