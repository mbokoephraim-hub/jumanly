import { test } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

// WCAG 2.2 AA (CLAUDE.md § 10): automatic checks on the pages built so far.
for (const path of ["/", "/dev/composants", "/connexion", "/inscription", "/mot-de-passe-oublie"]) {
  test(`aucune erreur d'accessibilité WCAG 2.2 AA sur ${path}`, async ({ page }) => {
    await page.goto(path);
    await expectAccessible(page);
  });
}

test("aucune erreur d'accessibilité WCAG 2.2 AA dans l'espace connecté", async ({ page }) => {
  await logIn(page, demo.talentPro);
  for (const path of [
    "/app",
    "/app/abonnement",
    "/app/abonnement/payer?forfait=talent_premium",
    "/app/parametres?onglet=compte",
    "/app/parametres?onglet=securite",
    "/app/parametres?onglet=confidentialite",
    "/app/parametres?onglet=donnees",
    "/app/profil",
    "/app/career",
    "/app/career/diagnostic",
    "/app/career/cv",
    "/app/jobs",
    "/app/jobs/demo-developpeur-web-douala",
    "/app/jobs/candidatures",
    "/app/jobs/enregistrees",
  ]) {
    await page.goto(path);
    await expectAccessible(page);
  }
});
