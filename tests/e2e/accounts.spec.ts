import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { lastLink } from "./outbox";
import { demo, logIn, signUpFromPricing, testEmail } from "./session";

test.describe("inscription avec forfait", () => {
  test("Pro choisi sur /tarifs, payé (factice), arrive dans l'espace avec Pro actif", async ({
    page,
  }) => {
    const email = testEmail("pro");
    await signUpFromPricing(page, "Choisir Pro", email);
    await expect(page).toHaveURL(/\/inscription\/paiement/, { timeout: 20_000 });
    await page.getByRole("radio", { name: "M-Pesa" }).check();
    await page.locator('input[name="number"]').fill("+243 810 000 123");
    await page.getByRole("button", { name: /Payer/ }).click();
    await expect(page.getByText("Paiement confirmé")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/app\/bienvenue/);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await page.goto("/app/abonnement");
    await expect(page.getByRole("main")).toContainText("Pro");
    await expect(page.getByRole("main")).toContainText("Formule actuelleActivePro");
  });

  test("payer plus tard laisse le compte en Free", async ({ page }) => {
    const email = testEmail("plus-tard");
    await signUpFromPricing(page, "Choisir Pro", email);
    await expect(page).toHaveURL(/\/inscription\/paiement/, { timeout: 20_000 });
    await page.getByRole("link", { name: "Commencer en Free et payer plus tard" }).click();
    await expect(page).toHaveURL(/\/app\/bienvenue/);
    await page.getByRole("button", { name: "Accéder à mon espace" }).click();
    await expect(page).toHaveURL(/\/app/);
    await page.goto("/app/abonnement");
    await expect(page.getByRole("main")).toContainText("Free");
    await expect(page.getByRole("link", { name: /Passer à Pro/ }).first()).toBeVisible();
  });
});

test.describe("connexion", () => {
  test("se connecter, se déconnecter, réinitialiser le mot de passe", async ({
    page,
    isMobile,
  }) => {
    const email = testEmail("reset");
    await signUpFromPricing(page, "Créer mon compte gratuit", email);
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    await page.goto("/app/parametres");
    if (isMobile) {
      // Phone: the avatar of the top bar opens the menu of Mon espace.
      await page.getByRole("button", { name: "Mon espace" }).click();
      await page
        .getByRole("dialog", { name: "Menu de mon espace" })
        .getByRole("button", { name: "Se déconnecter" })
        .click();
    } else {
      await page.locator("summary[aria-label]").filter({ visible: true }).first().click();
      // The sidebar has its own logout button too: use the one of the open account menu.
      await page
        .locator("details[open]")
        .getByRole("button", { name: "Se déconnecter" })
        .filter({ visible: true })
        .click();
    }
    await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);

    await page.goto("/app");
    await expect(page).toHaveURL(/\/connexion\?suite=/);

    const since = Date.now();
    await page.goto("/mot-de-passe-oublie");
    await page.locator('input[name="email"]').fill(email);
    await page.getByRole("button", { name: /Envoyer/ }).click();
    const link = await lastLink(email, "/reset-password/", since);
    await page.goto(link.replace(/^https?:\/\/[^/]+/, ""));
    await expect(page).toHaveURL(/\/reinitialiser/);
    await page.locator('input[name="password"]').fill("nouveau-mot-2026");
    await page.locator('input[name="confirm"]').fill("nouveau-mot-2026");
    await page.getByRole("button", { name: /Enregistrer|Réinitialiser|Valider/ }).click();
    await logIn(page, email, "nouveau-mot-2026");
    await expect(page).toHaveURL(/\/app/);
  });

  test("l'espace connecté et l'admin exigent une session", async ({ page }) => {
    await page.goto("/app/abonnement");
    await expect(page).toHaveURL(/\/connexion\?suite=%2Fapp%2Fabonnement/);
    await logIn(page, demo.talentFree);
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(404);
  });
});

test.describe("administration des forfaits", () => {
  test("un quota modifié dans l'admin s'applique sans redémarrage", async ({
    browser,
    isMobile,
  }) => {
    test.skip(isMobile, "Modifie un forfait partagé : une seule exécution.");
    const admin = await (await browser.newContext()).newPage();
    const talent = await (await browser.newContext()).newPage();
    await logIn(admin, demo.admin, undefined, "/admin/forfaits/talent_free");
    await expect(admin).toHaveURL(/\/admin\/forfaits\/talent_free/);
    for (const path of [
      "/admin",
      "/admin/utilisateurs",
      "/admin/forfaits",
      "/admin/forfaits/talent_free",
    ]) {
      await admin.goto(path);
      await expectAccessible(admin);
    }
    await admin.goto("/admin/forfaits/talent_free");
    const field = admin.locator('input[name="e:career.interview.text.monthly"]');
    const before = await field.inputValue();
    try {
      await field.fill("4");
      await admin.locator("#forfaits-reason").fill("Test du quota (fictif)");
      await admin.getByRole("button", { name: "Appliquer les modifications" }).click();
      await expect(admin.getByText("Forfait mis à jour.")).toBeVisible();

      await logIn(talent, demo.talentFree, undefined, "/app/abonnement");
      await expect(talent.getByRole("main")).toContainText("0 sur 4");
    } finally {
      await admin.goto("/admin/forfaits/talent_free");
      await admin.locator('input[name="e:career.interview.text.monthly"]').fill(before);
      await admin.locator("#forfaits-reason").fill("Retour à la valeur d'avant (fictif)");
      await admin.getByRole("button", { name: "Appliquer les modifications" }).click();
      await expect(admin.getByText("Forfait mis à jour.")).toBeVisible();
    }
  });
});

test.describe("paramètres", () => {
  test("modifier son compte, sa confidentialité et télécharger ses données", async ({ page }) => {
    const email = testEmail("parametres");
    await signUpFromPricing(page, "Créer mon compte gratuit", email);
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    await page.goto("/app/parametres?onglet=compte");
    await page.locator('input[name="city"]').fill("Goma");
    await page
      .getByRole("region", { name: "Compte" })
      .getByRole("button", { name: "Enregistrer" })
      .click();
    await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
    await expect(page.locator('input[name="city"]')).toHaveValue("Goma");

    // Less motion: the signed-in space is marked, and the choice is kept.
    const display = page.getByRole("region", { name: "Affichage" });
    await display.getByLabel("Réduire les animations").check();
    await display.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.locator("[data-reduce-motion]")).toHaveCount(1);
    await expect(display.getByLabel("Réduire les animations")).toBeChecked();
    await expect(page.locator("html")).not.toHaveAttribute("data-app-motion");

    await page.goto("/app/parametres?onglet=confidentialite");
    await page.getByLabel("Visible des recruteurs", { exact: true }).check();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Modifications enregistrées.")).toBeVisible();
    await expect(page.getByLabel("Visible des recruteurs", { exact: true })).toBeChecked();

    const response = await page.request.get("/app/parametres/export");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.account.email).toBe(email);
    expect(data.account.city).toBe("Goma");
    expect(JSON.stringify(data)).not.toMatch(/password|token/i);
  });
});
