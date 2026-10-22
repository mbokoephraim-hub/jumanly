import { expect, test } from "./fixtures";
import { finishOnboarding, PASSWORD, signUpWithEmail, testEmail } from "./session";

// Corrections d'Ephraïm du 22/10/2026: a talent can open a recruiter space, a deleted account is
// gone at once (the same e-mail starts from zero), a post holds 220 characters.
test.describe("Compte talent : recruteur, suppression, publications", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("une publication tient en 220 caractères, puis le talent passe en compte recruteur", async ({
    page,
  }) => {
    await page.goto("/inscription");
    await signUpWithEmail(page, testEmail("recruteur-talent"));
    await finishOnboarding(page);

    await page.goto("/app/fil/publier");
    const box = page.getByRole("textbox", { name: /publication/i });
    // Typed once the page answers; the last letters are refused past 220.
    await expect(async () => {
      await box.fill("");
      await box.fill("a".repeat(218));
      await expect(page.getByText("218 / 220 caractères")).toBeVisible({ timeout: 1000 });
    }).toPass();
    await box.pressSequentially("bcdef");
    await expect(page.getByText("220 / 220 caractères")).toBeVisible();
    await expect(box).toHaveValue(`${"a".repeat(218)}bc`);

    await page.goto("/app/parametres");
    await page.getByRole("button", { name: /Passer en compte recruteur/ }).click();
    const sheet = page.getByRole("dialog", { name: "Passer en compte recruteur ?" });
    await expect(
      sheet.getByText("Votre profil talent reste intact.", { exact: false }),
    ).toBeVisible();
    await sheet.getByRole("button", { name: "Continuer" }).click();
    await page.waitForURL("**/app/bienvenue**");
    await expect(page.getByText("Vous recrutez pour…").first()).toBeVisible();
  });

  test("supprimer son compte efface tout, et la même adresse recommence à zéro", async ({
    page,
  }) => {
    const email = testEmail("suppression");
    await page.goto("/inscription");
    await signUpWithEmail(page, email);
    await finishOnboarding(page);

    await page.goto("/app/parametres?supprimer=1");
    const sheet = page.locator("#parametres-supprimer");
    await expect(
      sheet.getByText("immédiatement et définitivement", { exact: false }),
    ).toBeVisible();
    await sheet.getByLabel("Tapez SUPPRIMER pour confirmer").fill("SUPPRIMER");
    await sheet.getByLabel("Votre mot de passe").fill(PASSWORD);
    await sheet.getByRole("button", { name: "Supprimer", exact: true }).click();
    await page.waitForURL("**/connexion?suppression=1");
    await expect(
      page.getByText("toutes vos données ont été supprimés", { exact: false }),
    ).toBeVisible();

    // The account no longer exists: the same e-mail signs up again, from the first step.
    await page.goto("/app");
    await expect(page).not.toHaveURL(/\/app/);
    await page.goto("/inscription");
    await signUpWithEmail(page, email);
    await expect(page).toHaveURL(/\/app\/bienvenue/);
  });
});
