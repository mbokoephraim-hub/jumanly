import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { logIn, signUpFromPricing, testEmail } from "./session";

// Compte (planche talent-4 § 2), opened by the avatar, and the appearance of the talent space
// (brief § 2.10), now in Paramètres.
test("Compte : profil, documents, abonnement, apparence gardée, déconnexion", async ({
  page,
  isMobile,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("compte"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app/compte");
  await expect(page.getByRole("heading", { level: 1, name: "Compte" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Voir mon profil · \d+ %/ })).toHaveAttribute(
    "href",
    "/app/profil",
  );
  const mine = page.getByRole("list", { name: "Mes documents et mon réseau" });
  for (const row of ["CV et documents", "Attestations", "S’entraîner aux entretiens", "Connexions"])
    await expect(mine.getByRole("link", { name: new RegExp(row) })).toBeVisible();
  const settings = page.getByRole("list", { name: "Abonnement et réglages" });
  await expect(settings.getByRole("link", { name: /Abonnement/ })).toHaveAttribute(
    "href",
    "/app/abonnement",
  );
  await expect(settings.getByRole("link", { name: /Aide/ })).toContainText("assistant@jumanly.io");
  await expectAccessible(page);

  // Apparence (brief § 2.10): the choice is kept; the redrawn pages take the dark mode.
  await page.goto("/app/parametres");
  const appearance = page.getByRole("group", { name: "Apparence" });
  await expect(appearance.getByRole("button", { name: "Auto" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // The button lights up at once; the choice is saved by a server action that must finish
  // before the page changes.
  const saved = () =>
    page.waitForResponse((response) => response.request().method() === "POST" && response.ok());
  await Promise.all([saved(), appearance.getByRole("button", { name: "Sombre" }).click()]);
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Apparence" }).getByRole("button", { name: "Sombre" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/app/compte");
  await expect(page.locator("html")).toHaveClass(/sombre/);
  if (isMobile) await expectAccessible(page);
  await page.goto("/app/parametres");
  await Promise.all([
    saved(),
    page.getByRole("group", { name: "Apparence" }).getByRole("button", { name: "Clair" }).click(),
  ]);
  await page.goto("/app/compte");
  await expect(page.locator("html")).not.toHaveClass(/sombre/);

  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);
});

// Connexions (planche talent-4): a request is accepted, then the two talents write to each other.
test("Connexions : accepter une demande puis écrire", async ({ page, isMobile }) => {
  test.skip(isMobile, "Les connexions de démonstration sont partagées.");
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/compte/connexions");
  await expect(page.getByRole("heading", { level: 1, name: "Connexions" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Demandes reçues" })).toBeVisible();
  await expect(page.getByText("2 en commun")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Accepter la demande de Daniel Ilunga" }).click();
  await expect(page.getByText("Connexion acceptée. Vous pouvez vous écrire.")).toBeVisible();
  await page.goto("/app/compte/connexions");
  await page.getByRole("link", { name: "Écrire à Daniel Ilunga" }).click();
  await expect(page).toHaveURL(/\/app\/messages\/[^/?#]+/);
  await expect(page.getByRole("heading", { level: 1, name: "Daniel Ilunga" })).toBeVisible();
  // Removed again: the conversation stays, with no new messages.
  await page.goto("/app/compte/connexions");
  await page.getByRole("link", { name: /^Daniel Ilunga : écrire/ }).click();
  await page
    .getByRole("dialog", { name: "Daniel Ilunga" })
    .getByRole("button", { name: /Retirer la connexion/ })
    .click();
  await expect(page.getByText(/La conversation reste lisible/).first()).toBeVisible();

  // The search finds a visible talent by name.
  await page.getByRole("button", { name: "Chercher une personne" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Chercher une personne" });
  await sheet.getByLabel("Nom ou métier").fill("Daniel");
  await sheet.getByLabel("Nom ou métier").press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Chercher une personne" }).getByRole("button", {
      name: "Demander à Daniel Ilunga de se connecter",
    }),
  ).toBeVisible();
});

// Refonte mobile: the former opening screen is gone; its address leads to the space (then to
// the sign-in for a visitor).
test("l'ancienne ouverture mène à l'espace", async ({ page }) => {
  await page.goto("/ouverture");
  await expect(page).toHaveURL(/\/connexion/, { timeout: 15_000 });
});
