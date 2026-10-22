import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { lastCode } from "./outbox";
import { demo, logIn, onPhone, phoneProfile, signUpFromPricing, testEmail } from "./session";

/** « Compte validé » to « Votre espace est prêt », the questions skipped. */
async function walkToReady(page: Page) {
  if (await onPhone(page)) return phoneProfile(page);
  await page.getByRole("link", { name: "C'est parti" }).click();
  await expect(page).toHaveURL(/etape=objectif/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=etudes/);
  await page.getByRole("link", { name: "Passer" }).click();
  await expect(page).toHaveURL(/etape=lieux/);
  await page.getByRole("link", { name: "Passer" }).click();
  await expect(page).toHaveURL(/etape=pret/);
}

test.describe("inscription avec forfait", () => {
  test("Pro choisi sur /tarifs, payé (factice), arrive dans l'espace avec Pro actif", async ({
    page,
    isMobile,
  }) => {
    const email = testEmail("pro");
    await signUpFromPricing(page, "Choisir Pro", email);
    // The plan is paid after the first questions (refonte mobile, lot 2).
    await walkToReady(page);
    await page
      .getByRole("button", { name: /^(Continuer vers le paiement|Finaliser ma formule)$/ })
      .click();
    await expect(page).toHaveURL(/\/inscription\/paiement/, { timeout: 20_000 });
    await page.getByRole("radio", { name: "M-Pesa" }).check();
    await page.locator('input[name="number"]').fill("+243 810 000 123");
    await page.getByRole("button", { name: /Payer/ }).click();
    await expect(page.getByText("Paiement confirmé")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/app\?bienvenue=1|\/app$/);
    await page.goto("/app/abonnement");
    if (isMobile) {
      // Modèle B (lot B5): « Ma formule » marks the current plan.
      await expect(page.getByText("Vous êtes en Pro.", { exact: false })).toBeVisible();
      await expect(page.getByRole("region", { name: "Pro" })).toContainText("Votre formule");
    } else {
      await expect(page.getByRole("main")).toContainText("Pro · 19,9 $/mois");
      await expect(page.getByRole("main")).toContainText(/Payée jusqu'au/);
    }
  });

  test("payer plus tard laisse le compte en Free", async ({ page, isMobile }) => {
    const email = testEmail("plus-tard");
    await signUpFromPricing(page, "Choisir Pro", email);
    await walkToReady(page);
    await page
      .getByRole("button", { name: /^(Commencer gratuitement|Entrer dans Jumanly)$/ })
      .click();
    await expect(page).toHaveURL(/\/app/);
    await page.goto("/app/abonnement");
    if (isMobile) {
      // Modèle B (lot B5): the plans are on « Ma formule » itself.
      await expect(page.getByText("Vous êtes en Free.", { exact: false })).toBeVisible();
      await expect(page.getByRole("region", { name: "Free" })).toContainText("Votre formule");
      await expect(page.getByRole("link", { name: "Choisir Pro" })).toBeVisible();
      return;
    }
    await expect(page.getByRole("main")).toContainText("Free · gratuit");
    await page.getByRole("link", { name: /Changer de formule/ }).click();
    await expect(page).toHaveURL(/\/app\/abonnement\/formules/);
    await expect(page.getByRole("link", { name: /Passer à/ }).first()).toBeVisible();
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

    // Refonte mobile: the account opens from the avatar of a destination; Se déconnecter sits
    // at the bottom of Compte, on a phone as on a computer.
    // On a phone (Modèle B), the account is Paramètres: « Se déconnecter », then its confirmation.
    if (isMobile) {
      await page.goto("/app/compte");
      await expect(page).toHaveURL(/\/app\/parametres$/);
      await page.getByRole("button", { name: "Se déconnecter" }).click();
      await page
        .getByRole("dialog", { name: "Se déconnecter ?" })
        .getByRole("button", { name: "Se déconnecter" })
        .click();
    } else {
      await page.goto("/app/jobs");
      await page.getByRole("link", { name: /^Compte de / }).click();
      await expect(page).toHaveURL(/\/app\/compte$/);
      await page.getByRole("button", { name: "Se déconnecter" }).filter({ visible: true }).click();
    }
    await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);

    // Signed out, the space opens on « Bienvenue » on a phone (Modèle B), on sign-in elsewhere.
    await page.goto("/app");
    await expect(page).toHaveURL(isMobile ? /\/decouvrir$/ : /\/connexion\?suite=/);

    // Mot de passe oublié: a 6-digit code, the new password, then signed in at once.
    const since = Date.now();
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByRole("button", { name: "Envoyer le code" }).click();
    await expect(page).toHaveURL(/\/reinitialiser/);
    await page.getByLabel("Code à 6 chiffres").fill(await lastCode(email, since));
    await page.getByLabel("Nouveau mot de passe").fill("nouveau-mot-2026");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Mot de passe modifié")).toBeVisible();
    await page.getByRole("link", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/app/);
    // The old password no longer works; the new one does.
    await page.context().clearCookies();
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
      // Lot 7: what is left of the month (4 of 4, none used yet).
      await expect(talent.getByRole("main")).toContainText("4 sur 4");
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
  test("modifier son compte, sa confidentialité et télécharger ses données", async ({
    page,
    isMobile,
  }) => {
    const email = testEmail("parametres");
    await signUpFromPricing(page, "Créer mon compte gratuit", email);
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    if (isMobile) {
      // Modèle B (lot B5): dark only, no animation setting; each choice saves at once.
      await page.goto("/app/parametres/confidentialite");
      await page.getByRole("radio", { name: /^Les recruteurs/ }).click();
      await expect(page.getByText("C’est enregistré.")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("radio", { name: /^Les recruteurs/ })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await page.goto("/app/parametres/notifications");
      await page.getByRole("switch", { name: "Formation" }).click();
      await expect(page.getByText("C’est enregistré.")).toBeVisible();
      await page.reload();
      await expect(page.getByRole("switch", { name: "Formation" })).toHaveAttribute(
        "aria-checked",
        "false",
      );
    } else {
      // Lot 7: Paramètres in sections (planche talent-4 § 8); each switch saves at once.
      await page.goto("/app/parametres");
      // A touch on the row (its label), like a person: the switch itself is visually hidden.
      await page.getByText("Réduire les animations", { exact: true }).click();
      await expect(page.getByText("C'est enregistré.")).toBeVisible();
      await expect(page.locator("[data-reduce-motion]")).toHaveCount(1);
      await expect(page.getByRole("switch", { name: /Réduire les animations/ })).toBeChecked();
      await expect(page.locator("html")).not.toHaveAttribute("data-app-motion");

      await page.goto("/app/parametres/confidentialite");
      await page.getByRole("button", { name: /Qui voit mon profil/ }).click();
      await page.getByRole("radio", { name: /Visible des recruteurs/ }).check({ force: true });
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("C'est enregistré.")).toBeVisible();
      await expect(page.getByRole("button", { name: /Qui voit mon profil/ })).toContainText(
        "Visible des recruteurs",
      );

      // Notifications by category: a category cut is kept.
      await page.goto("/app/parametres/notifications");
      await page.getByRole("switch", { name: /Formations/ }).uncheck({ force: true });
      await expect(page.getByText("C'est enregistré.")).toBeVisible();
      await expect(page.getByRole("switch", { name: /Formations/ })).not.toBeChecked();
    }

    const response = await page.request.get("/app/parametres/export");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.account.email).toBe(email);
    expect(JSON.stringify(data)).not.toMatch(/password|token/i);
  });
});
