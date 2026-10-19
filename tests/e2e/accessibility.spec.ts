import { test } from "./fixtures";
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
  // Sixteen pages, each fully analysed: more than the default 30 s when tests run in parallel.
  test.setTimeout(90_000);
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
    "/app/career/diagnostic?etape=1",
    "/app/career/cv",
    "/app/jobs",
    "/app/jobs/demo-developpeur-web-douala",
    "/app/suivi",
    "/app/jobs?vue=enregistrees",
  ]) {
    await page.goto(path);
    await expectAccessible(page);
  }
});

// E11: complete sweep of the signed-in screens, one account per space.
const sweeps: { name: string; email: string; paths: string[] }[] = [
  {
    name: "talent (Learn, Career, Connect)",
    email: demo.talentPro,
    paths: [
      "/app/learn",
      "/app/learn/mes-formations?vue=attestations",
      "/app/career/plan",
      "/app/career/entretiens",
      "/app/career/documents",
      "/app/career/linkedin",
      "/app/career/portfolio",
      "/app/profil/import",
      "/app/messages",
      "/app/notifications",
    ],
  },
  {
    name: "recruteur (Hire)",
    email: "entreprise@jumanly.test",
    paths: [
      "/app/hire",
      "/app/hire/offres",
      "/app/hire/offres/nouvelle",
      "/app/hire/talents",
      "/app/hire/viviers",
      "/app/hire/entretiens",
      "/app/hire/rapports",
      "/app/organisation",
    ],
  },
  {
    name: "partenaire",
    email: "partenaire@jumanly.test",
    paths: ["/app/partenaire", "/app/partenaire/licences", "/app/partenaire/rapports"],
  },
  {
    name: "administration",
    email: demo.admin,
    paths: [
      "/admin",
      "/admin/utilisateurs",
      "/admin/organisations",
      "/admin/forfaits",
      "/admin/abonnements",
      "/admin/partenaires",
      "/admin/contenus",
      "/admin/contenus?onglet=bannieres",
    ],
  },
];

for (const sweep of sweeps) {
  test(`aucune erreur d'accessibilité WCAG 2.2 AA · espace ${sweep.name}`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext();
    const page = await context.newPage();
    await logIn(page, sweep.email);
    for (const path of sweep.paths) {
      await page.goto(path);
      await expectAccessible(page);
    }
    await context.close();
  });
}
