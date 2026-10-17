import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Prompt 2 bis (V6 § B6-B8, screens 57, 58, 61, 62): Compte, the Vert theme and the opening.
test("Compte : profil, abonnement, Orbi, thème Vert gardé, déconnexion", async ({
  page,
  isMobile,
}) => {
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

  // Vert: the page changes at once and keeps the choice after a reload.
  const theme = page.getByRole("group", { name: "Thème" });
  await theme.getByRole("button", { name: "Vert" }).click();
  await expect(theme.getByRole("button", { name: "Vert" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(/jm-vert/);
  await expect(page.getByText("Thème enregistré")).toBeVisible();
  await page.reload();
  await expect(page.locator(".jm-talent")).toHaveClass(/jm-vert/);
  if (isMobile) await expectAccessible(page);
  await page.getByRole("group", { name: "Thème" }).getByRole("button", { name: "Clair" }).click();
  await expect(page.locator("html")).not.toHaveClass(/jm-vert/);

  await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);
});

test("ouverture : logo, accueil la première fois, connexion ensuite", async ({ page }) => {
  await page.goto("/ouverture");
  await expect(page.getByRole("img", { name: "Jumanly" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Learn. Grow. Connect." })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("link", { name: "Commencer" })).toHaveAttribute(
    "href",
    "/inscription",
  );
  await expectAccessible(page);
  await page.getByRole("link", { name: "J'ai déjà un compte" }).click();
  await expect(page).toHaveURL(/\/connexion/);
  // The welcome shows once: next time the phone goes straight to sign-in.
  await page.goto("/ouverture");
  await expect(page).toHaveURL(/\/connexion/, { timeout: 15_000 });
});
