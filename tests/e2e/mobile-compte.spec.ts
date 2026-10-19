import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Compte (screens 61, 62) and the appearance of the talent space (refonte mobile, brief § 2.10).
test("Compte : profil, abonnement, apparence gardée, déconnexion", async ({ page, isMobile }) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("compte"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app/compte");
  await expect(page.getByRole("heading", { level: 1, name: "Compte" })).toBeAttached();
  // A password exists (sign-up by e-mail): no « Protégez votre compte ».
  await expect(page.getByRole("heading", { name: "Protégez votre compte" })).toHaveCount(0);
  for (const group of ["Abonnement", "Compte et confidentialité", "Préférences", "Aide"])
    await expect(page.getByRole("region", { name: group })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Abonnement" }).getByRole("link").first(),
  ).toHaveAttribute("href", "/app/abonnement");
  await expectAccessible(page);

  // Apparence (brief § 2.10): the choice is kept; the redrawn pages take the dark mode.
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
  await expect(appearance.getByRole("button", { name: "Sombre" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Apparence" }).getByRole("button", { name: "Sombre" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/app/orbi");
  await expect(page.locator("html")).toHaveClass(/sombre/);
  if (isMobile) await expectAccessible(page);
  await page.goto("/app/compte");
  await Promise.all([
    saved(),
    page.getByRole("group", { name: "Apparence" }).getByRole("button", { name: "Clair" }).click(),
  ]);
  await expect(
    page.getByRole("group", { name: "Apparence" }).getByRole("button", { name: "Clair" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/app/orbi");
  await expect(page.locator("html")).not.toHaveClass(/sombre/);
  await page.goto("/app/compte");

  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);
});

// Refonte mobile: the former opening screen is gone; its address leads to the space (then to
// the sign-in for a visitor).
test("l'ancienne ouverture mène à l'espace", async ({ page }) => {
  await page.goto("/ouverture");
  await expect(page).toHaveURL(/\/connexion/, { timeout: 15_000 });
});
