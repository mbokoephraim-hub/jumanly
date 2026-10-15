import { expect, test } from "@playwright/test";
import { testEmail } from "./session";

// docs/refonte-connexion/BRIEF-CONNEXION-V2.md: entry screen of /connexion and /inscription.

test("l'écran d'entrée garde le profil des deux côtés et mène à l'étape forfait", async ({
  page,
}) => {
  const email = testEmail("entree");
  await page.goto("/connexion?profil=rh");
  const roles = page.getByRole("group", { name: "Je suis" });
  await expect(roles.getByRole("button", { name: "RH" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("tab", { name: "Créer un compte" }).click();
  await expect(page).toHaveURL(/\/inscription\?profil=rh$/);
  await expect(page.getByRole("heading", { name: "Créez votre compte gratuit" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Professionnel RH" })).toBeChecked();

  // The form and the stage stay in step, both ways.
  await page.locator("label").filter({ hasText: "Entreprise" }).click();
  await expect(roles.getByRole("button", { name: "Entreprise" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await roles.getByRole("button", { name: "Talent" }).click();
  await expect(page.getByRole("radio", { name: "Talent" })).toBeChecked();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("employabilité");

  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/inscription\/forfait\?profil=talent$/);
  // The e-mail waits in the sign-up cookie, never in the address.
  expect(page.url()).not.toContain("jumanly.test");
  await page.getByRole("button", { name: /Continuer/ }).click();
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await expect(page.locator('input[name="email"]')).toHaveValue(email);
});

test("le dernier profil choisi est retrouvé sur cet appareil", async ({ page }) => {
  await page.goto("/connexion");
  const roles = page.getByRole("group", { name: "Je suis" });
  await roles.getByRole("button", { name: "Entreprise" }).click();
  await page.goto("/inscription");
  await expect(roles.getByRole("button", { name: "Entreprise" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Entreprise" })).toBeChecked();
});
