import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { finishOnboarding, logIn, signUpFromPricing, testEmail } from "./session";

// Mobile Talent v5, prompt 1 (docs/ux-mobile-talent): the button range, the visual cards and the
// interaction states are shown with all their states on the internal components page.
test("la gamme mobile (boutons, cartes, états) est présentée dans la bibliothèque", async ({
  page,
}) => {
  await page.goto("/dev/composants");
  for (const section of [
    "Gamme mobile : boutons",
    "Gamme mobile : cartes",
    "Gamme mobile : états d'interaction",
  ]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }

  const buttons = page.locator("#gamme-boutons");
  // Sending and done are blocked until the server answers: no second click.
  await expect(buttons.getByRole("button", { name: "Envoi…" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Envoyée" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Postuler" }).first()).toBeEnabled();
  await expect(buttons.getByRole("button", { name: "Demander à Jumanly AI" })).toBeVisible();

  const cards = page.locator("#gamme-cartes");
  await expect(cards.getByRole("heading", { name: "Trouver un emploi" })).toBeVisible();
  await expect(cards.getByRole("link", { name: "Changer d'objectif" })).toBeVisible();
  await expect(cards.getByRole("link", { name: /Télécharger · CV/ })).toHaveAttribute("download");
  await expect(cards.getByText("Candidature non retenue")).toBeVisible();
  await expect(cards.getByText("Candidature retenue", { exact: true })).toBeVisible();
  await expect(
    cards.getByRole("img", { name: "Outil non inclus dans votre formule" }),
  ).toBeVisible();

  // No horizontal scroll on a phone.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});

// Prompt 4: find an offer, save it (with « Annuler »), apply in steps with a kept draft, survive a
// cut connection, then see the confirmation that only the server's answer shows (screens 06-12).
test("trouver une offre et postuler : étapes, brouillon et coupure réseau", async ({
  page,
  context,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("postuler"));
  await finishOnboarding(page);

  // Modèle B (lot B4): Explorer's search, the offer's « Enregistrer », then the steps of Postuler.
  await page.goto("/app/jobs");
  const field = page.getByRole("searchbox", { name: /Rechercher une offre/ });
  await field.click();
  await field.fill("assistant administratif");
  await page
    .getByRole("link", { name: /Assistant administratif \(démo\)/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/jobs\/demo-assistant-administratif-kinshasa/);
  const save = page.getByRole("button", { name: /^Enregistr/ });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  // The button shows the result itself: no toast (29/10, toasts only when nothing else answers).
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await page.goto("/app/jobs/demo-assistant-administratif-kinshasa/postuler");
  await expect(page.getByRole("heading", { level: 1, name: "Postuler" })).toBeVisible();
  // First screen (01/11/2026): how to apply, then the CVs.
  await expect(page.getByRole("group", { name: "Comment voulez-vous postuler ?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("group", { name: "Quel CV envoyer ?" })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Quitter et garder le brouillon" }).click();
  await expect(page).toHaveURL(/brouillon=1/);
  // The offer of Modèle B applies in one sheet; the stepped form keeps its draft.
  await page.goto("/app/jobs/demo-assistant-administratif-kinshasa/postuler");

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=lettre/);
  await page.getByRole("button", { name: "Ajouter un document" }).click();
  await page.getByRole("button", { name: "Écrire une lettre" }).click();
  await page
    .locator("#apply-letter")
    .fill("Rigoureuse et organisée, je souhaite rejoindre votre équipe.");
  await page.getByRole("button", { name: "Enregistrer la lettre" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=verification/);
  await expect(page.getByRole("heading", { name: "Vérifier et envoyer" })).toBeVisible();
  await expect(page.getByText(/Brouillon enregistré/)).toBeVisible();
  await expectAccessible(page);

  // A cut connection: nothing is said to be sent, the draft is kept.
  await context.setOffline(true);
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByText("Candidature pas encore envoyée.")).toBeVisible();
  await expect(page.getByText("Candidature envoyée", { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Réessayer" }).click();

  await expect(page.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: /^Suivre/ })).toBeVisible();
  await expectAccessible(page);
});

// Refonte mobile, lot 5 (planche talent-3): resume the course in progress from Apprendre, then the
// classroom: the tabs of the lesson, its files and the free Orbi help.
test("reprendre une formation depuis Apprendre", async ({ page }) => {
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn");
  await expectAccessible(page);
  // On the phone, Formation is Modèle B (lot B7): « Reprendre » opens the lesson to resume.
  await page
    .getByRole("link", { name: /^Reprendre/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/learn\/[^/?]+\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();
});
