import { execFileSync } from "node:child_process";
import { expect, test, type Browser } from "./fixtures";
import { expectAccessible } from "./a11y";
import { fillOffer, publishFilledOffer } from "./offer-flow";
import { demo, logIn } from "./session";

async function newPage(browser: Browser, baseURL: string | undefined, isMobile: boolean) {
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  return context.newPage();
}

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

// Admin v2, étape 7: a job flagged at publication is sent back for correction, the recruiter sees
// the points and publishes again, the job comes back to review; then a moderator refuses it.
test("une offre signalée : correction demandée, renvoyée, puis refusée avec un motif", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Parcours long : vérifié sur ordinateur.");
  test.setTimeout(180_000);
  const title = `Assistant administratif fictif ${suffix()}`;
  await logIn(page, "rh@jumanly.test");
  await fillOffer(page, {
    title,
    city: "Kinshasa",
    country: "Congo-Kinshasa",
    description: "Poste fictif. Frais de dossier de 20 USD à payer avant l'entretien.",
    responsibilities: ["Classer les dossiers", "Accueillir le public"],
    skill: "Bureautique",
  });
  // Orbi's review points at the payment asked of candidates before anything is sent.
  await publishFilledOffer(page, "Envoyer en validation");
  await expect(page).toHaveURL(/\?publiee=verification/);
  await expect(page.getByRole("main")).toContainText("Offre envoyée en validation");
  const jobUrl = page.url().split("?")[0]!;

  // The moderator reads the automatic check and its « Pourquoi ? », then asks for a correction.
  const admin = await newPage(browser, baseURL, isMobile);
  await logIn(admin, demo.admin);
  await admin.goto("/admin/offres");
  await admin
    .getByRole("link", { name: new RegExp(title) })
    .first()
    .click();
  await expect(admin.locator("#offres-detail-title")).toHaveText(title);
  await expect(admin.getByText("Avis du contrôle automatique")).toBeVisible();
  await admin.getByText("Pourquoi ?").click();
  await expect(admin.getByText(/somme à payer par le candidat/)).toBeVisible();
  await expect(admin.getByRole("navigation", { name: "Parcourir la file" })).toBeVisible();
  await admin.getByRole("link", { name: "Demander une correction" }).click();
  await expect(admin.locator("#offres-fix-noPayment")).toBeChecked();
  await admin
    .locator("#offres-reason")
    .fill("Retirez les frais de dossier demandés aux candidats.");
  await admin.getByRole("button", { name: "Demander une correction" }).click();
  await expect(
    admin.getByText("Correction demandée. Le recruteur", { exact: false }),
  ).toBeVisible();

  // The recruiter sees the points to correct, then publishes again: back to review.
  await page.goto(jobUrl);
  await expect(page.getByText("La modération demande une correction")).toBeVisible();
  await expect(page.getByText("Retirer toute demande de paiement aux candidats")).toBeVisible();
  await page
    .getByRole("button", { name: "Publier l'offre" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/publiee=verification/);

  // Back in the queue, with its history; a refusal needs a reason.
  await admin.goto("/admin/offres");
  await admin
    .getByRole("link", { name: new RegExp(title) })
    .first()
    .click();
  await expect(admin.getByText("a demandé une correction de l'offre").first()).toBeVisible();
  await admin.getByRole("link", { name: "Refuser" }).click();
  await admin.locator("#offres-reason").fill("Les frais de dossier sont toujours demandés.");
  await admin.getByRole("button", { name: "Refuser" }).last().click();
  await expect(admin.getByText("Offre refusée.", { exact: false })).toBeVisible();
  await admin.context().close();
});

// A reported message: its immediate context on request, a note, then a decision with a reason;
// the support agent reads without acting.
test("un signalement : contexte, note interne, puis clôture avec décision et motif", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Parcours long : vérifié sur ordinateur.");
  const body = execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-report.ts",
    "talent.visible@jumanly.test",
  ])
    .toString()
    .trim()
    .split("\n")
    .pop()!;

  const support = await newPage(browser, baseURL, isMobile);
  await logIn(support, demo.support);
  await support.goto("/admin/signalements");
  await expect(support.locator("#signalement")).toBeVisible();
  await expect(support.getByRole("button", { name: "Clôturer avec cette décision" })).toHaveCount(
    0,
  );
  await support.context().close();

  await logIn(page, demo.admin);
  await page.goto("/admin/signalements");
  await expect(page.getByText("Les plus graves d'abord", { exact: false })).toBeVisible();
  // Harassment is serious: the report is in the queue, tagged « Grave ».
  const row = page.locator("tr").filter({ hasText: "Harcèlement" }).last();
  await row.getByRole("link").click();
  await expect(page.locator("#signalement")).toContainText(body);
  await page.getByRole("link", { name: "Lire le contexte de la conversation" }).click();
  await expect(page.getByText("Contexte de la conversation")).toBeVisible();

  await page.locator("#report-note").fill("Le recruteur a déjà été averti oralement.");
  await page.getByRole("button", { name: "Ajouter la note" }).click();
  await expect(page.getByText("Note ajoutée.")).toBeVisible();
  await page.goto("/admin/signalements?onglet=en-cours");
  await page.locator("tr").filter({ hasText: "Harcèlement" }).last().getByRole("link").click();
  await expect(page.locator("#signalement")).toContainText("averti oralement");

  await page.locator("#report-decision-hide").check();
  await page.locator("#report-reason").fill("Propos déplacés envers le talent.");
  await page.getByRole("button", { name: "Clôturer avec cette décision" }).click();
  await expect(page.getByText("Signalement traité.")).toBeVisible();
  await page.goto("/admin/signalements?onglet=clotures");
  await expect(page.locator("#signalement")).toContainText("Propos déplacés envers le talent.");
  await expectAccessible(page);
});
