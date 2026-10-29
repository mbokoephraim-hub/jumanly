import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn, testEmail } from "./session";

/**
 * Jumanly Admin v2 · recette (docs/admin-v2/PLAN-ADMIN.md, étape 1): every screen opens for the
 * roles allowed to see it and stays hidden from the others; the actions that no other journey
 * covers are run once, and each one leaves its line in the journal d'audit.
 */

const adminPages: [path: string, title: string][] = [
  ["/admin", "Indicateurs"],
  ["/admin/utilisateurs", "Utilisateurs"],
  ["/admin/organisations", "Organisations"],
  ["/admin/forfaits", "Forfaits et droits"],
  ["/admin/forfaits/talent_free", "Forfaits et droits"],
  ["/admin/abonnements", "Abonnements"],
  ["/admin/formations", "Studio formations"],
  ["/admin/offres", "Modération des offres"],
  ["/admin/partenaires", "Partenaires"],
  ["/admin/ia", "IA et matching"],
  ["/admin/contenus", "Contenus"],
  ["/admin/signalements", "Signalements"],
  ["/admin/journal", "Journal d'audit"],
  ["/admin/recherche", "Recherche"],
];

/** A fresh fictional account created in the database, so the shared demo accounts stay intact. */
function makeAccount(prefix: string, name: string, state?: "unverified") {
  const email = testEmail(prefix);
  const id = execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-account.ts",
    email,
    name,
    ...(state ? [state] : []),
  ]).toString();
  return { email, id: id.trim().split("\n").at(-1)! };
}

/** A fresh fictional company waiting for verification, with a document and a live job. */
function makeOrganization(name: string) {
  const id = execFileSync("pnpm", ["exec", "tsx", "tests/e2e/make-org.ts", name]).toString();
  return id.trim().split("\n").at(-1)!;
}

async function expectTitle(page: Page, title: string) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
}

test("chaque écran de l'admin s'ouvre pour l'administrateur", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await logIn(page, demo.admin);
  for (const [path, title] of adminPages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  expect(errors).toEqual([]);
});

const notFoundTitle = "Cette page est introuvable";
/** Course and content editing tools: content editors and administrators only. */
const contentPaths = ["/admin/formations", "/admin/contenus"];

test("le support voit tout sans pouvoir agir", async ({ page }) => {
  test.setTimeout(120_000);
  await logIn(page, demo.support);
  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  await page.goto("/admin");
  await expect(nav.getByRole("link", { name: "Formations" })).toHaveCount(0);
  for (const [path, title] of adminPages.filter(([path]) => !contentPaths.includes(path))) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  await expect(page.getByText("Votre rôle Support permet de consulter").first()).toBeVisible();
  await page.goto("/admin/utilisateurs?q=talent.free%40jumanly.test");
  await page.getByRole("link", { name: "Amani Fictif" }).filter({ visible: true }).first().click();
  const card = page.locator("#utilisateurs-fiche");
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "Suspendre le compte" })).toHaveCount(0);
  await expect(page.locator("#utilisateurs-roles")).toHaveCount(0);
});

test("l'éditeur de contenus ne voit que les formations et les contenus", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.editor);
  for (const [path, title] of [
    ["/admin/formations", "Studio formations"],
    ["/admin/contenus", "Contenus"],
    ["/admin/recherche", "Recherche"],
  ] as const) {
    expect((await page.goto(path))?.status(), path).toBe(200);
    await expectTitle(page, title);
  }
  // Pages outside their role answer « introuvable » (the admin is not revealed).
  for (const path of ["/admin/utilisateurs", "/admin/journal", "/admin/forfaits"]) {
    await page.goto(path);
    await expectTitle(page, notFoundTitle);
  }
  // The search only looks into the courses.
  await page.goto("/admin/recherche?q=cv");
  await expect(page.getByRole("heading", { name: "Comptes" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Formations", level: 2 })).toBeVisible();
});

test("suspendre, réactiver et changer le rôle d'un compte, puis le lire dans le journal", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const account = makeAccount("suspension", "Compte Suspendu Fictif");
  await logIn(page, demo.admin);
  await page.goto(`/admin/utilisateurs?fiche=${account.id}`);
  const card = page.locator("#utilisateurs-fiche");
  await expect(card.getByText(account.email)).toBeVisible();

  // Suspension, with its required reason.
  await card.getByRole("link", { name: "Suspendre le compte" }).click();
  await page.locator("#utilisateurs-suspend-reason").fill("Recette de l'admin : compte fictif");
  await page.getByRole("button", { name: "Suspendre le compte" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Utilisateur mis à jour" }),
  ).toBeVisible();
  await expect(card.getByText("Suspendu").first()).toBeVisible();

  // Reactivation.
  await card.getByRole("button", { name: "Réactiver le compte" }).click();
  await expect(card.getByText("Actif").first()).toBeVisible();

  // Platform role: Support, then back to no role.
  const roles = page.locator("#utilisateurs-roles");
  await roles.getByRole("radio", { name: /^Support / }).check();
  await roles.getByRole("button", { name: "Enregistrer le rôle" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Utilisateur mis à jour" }),
  ).toBeVisible();
  await page.locator("#utilisateurs-roles").getByLabel("Aucun rôle plateforme").check();
  await page
    .locator("#utilisateurs-roles")
    .getByRole("button", { name: "Enregistrer le rôle" })
    .click();

  // The card's history and the journal tell the story, with the reason.
  const history = page.getByRole("region", { name: "Historique" });
  await expect(history.getByText("a suspendu le compte")).toBeVisible();
  await expect(history.getByText("a réactivé le compte")).toBeVisible();
  await expect(history.getByText("a changé le rôle plateforme").first()).toBeVisible();
  await page.getByRole("link", { name: "Voir dans le journal" }).click();
  await expectTitle(page, "Journal d'audit");
  await expect(
    page.getByText("Motif : Recette de l'admin : compte fictif").filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText("4 actions").filter({ visible: true })).toBeVisible();
  await expectAccessible(page);

  // Export of the filtered journal.
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exporter en CSV" }).click();
  const file = await (await download).path();
  const { readFileSync } = await import("node:fs");
  const csv = readFileSync(file, "utf8");
  expect(csv).toContain("user.suspend");
  expect(csv).toContain("Recette de l'admin : compte fictif");
});

test("la recherche globale trouve comptes, organisations et forfaits", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin");
  const search = page.getByRole("searchbox", {
    name: "Rechercher un compte, une organisation, une offre, une formation ou un forfait",
  });
  await search.filter({ visible: true }).fill("horizon");
  await search.filter({ visible: true }).press("Enter");
  await expectTitle(page, "Recherche");
  await expect(page.getByRole("heading", { name: "Organisations", level: 2 })).toBeVisible();
  await page.goto("/admin/recherche?q=starter");
  await expect(page.getByRole("heading", { name: "Forfaits", level: 2 })).toBeVisible();
  await page.goto("/admin/recherche?q=talent.free%40jumanly.test");
  await page.getByRole("link", { name: /Amani Fictif/ }).click();
  await expect(page.locator("#utilisateurs-fiche")).toBeVisible();
  await page.goto("/admin/recherche?q=zzzz-introuvable");
  await expect(page.getByText("Rien trouvé")).toBeVisible();
  await expectAccessible(page);
});

test("les poids du matching s'enregistrent et laissent leur trace", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin/ia?onglet=poids");
  await page.locator("#ia-weights-note").fill("Recette de l'admin : mêmes poids");
  await page.getByRole("button", { name: "Enregistrer les poids" }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: /enregistr/i })
      .first(),
  ).toBeVisible();
  await page.goto("/admin/journal?action=matching");
  await expect(
    page.getByText("Motif : Recette de l'admin : mêmes poids").filter({ visible: true }).first(),
  ).toBeVisible();
});

test("la consommation d'IA montre le budget, les crédits et les modèles en lecture seule", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await logIn(page, demo.admin);
  await page.goto("/admin/ia");
  await expect(page.getByRole("heading", { name: "Budget du mois" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Modèles utilisés" })).toBeVisible();
  await expect(page.getByText(/crédits d'IA de la période/)).toBeVisible();
  // No field changes a model: they come from the environment variables only.
  await expect(page.getByText(/AI_MODEL_DEFAULT et AI_MODEL_FAST/)).toBeVisible();
});

test("les indicateurs montrent les forfaits utilisés et se complètent avec les coûts", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await logIn(page, demo.admin);
  await page.goto("/admin");
  await expectTitle(page, "Indicateurs");
  const plans = page.getByRole("region", { name: "Forfaits utilisés" });
  await expect(plans.getByRole("heading", { name: "Talents" })).toBeVisible();
  // Free plans count too, and a plan opens the list of its accounts.
  await plans.getByRole("link", { name: /^Free/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/utilisateurs\?forfait=/);
  await expectTitle(page, "Utilisateurs");

  // Costs: entered for the current month, they feed the dashboard.
  await page.goto("/admin/indicateurs/couts");
  await expectTitle(page, "Coûts mensuels");
  await page.getByLabel("Hébergement et services techniques").fill("120,50");
  await page.getByLabel("Acquisition (publicité, campagnes)").fill("300");
  await page.getByRole("button", { name: "Enregistrer les coûts" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Coûts du mois enregistrés" }),
  ).toBeVisible();
  await expect(page.getByLabel("Hébergement et services techniques")).toHaveValue("120,50");
  await expectAccessible(page);

  await page.goto("/admin");
  const costs = page.getByRole("region", { name: "Coûts et rentabilité" });
  await expect(costs.getByText(/Coûts de la période, IA comprise/)).toBeVisible();
  await expect(costs.getByRole("link", { name: "Modifier les coûts" })).toBeVisible();
  await expectAccessible(page);
});

test("vérifier un compte, lui offrir un forfait et des crédits, le supprimer définitivement", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const account = makeAccount("fiche", "Compte Fiche Fictif", "unverified");
  await logIn(page, demo.admin);
  await page.goto(`/admin/utilisateurs?fiche=${account.id}`);
  const card = page.locator("#utilisateurs-fiche");
  await expect(card.getByText("Non vérifié", { exact: true })).toBeVisible();
  // One screen about the person: alerts, subscription and payments, activity, complaints, sign-in.
  await expectTitle(page, "Compte Fiche Fictif");
  for (const heading of [
    "Alertes",
    "Abonnement et paiements",
    "Activités",
    "Plaintes et signalements",
    "Mot de passe et connexion",
  ])
    await expect(page.getByRole("heading", { name: heading, level: 2 })).toBeVisible();
  await expect(page.getByText("L'adresse e-mail n'est pas encore vérifiée.")).toBeVisible();
  const done = (text: string) =>
    expect(page.getByRole("status").filter({ hasText: text })).toBeVisible();

  // E-mail confirmed by hand, with how it was confirmed.
  await card.getByRole("link", { name: "Marquer l'e-mail comme vérifié" }).click();
  await page.locator("#utilisateurs-verify-reason").fill("Adresse confirmée par écrit (fictif)");
  await page.getByRole("button", { name: "Marquer comme vérifié" }).click();
  await done("Adresse e-mail marquée comme vérifiée.");
  await expect(card.getByText("Vérifié", { exact: true })).toBeVisible();

  // A plan given until a date: it shows in the rights, with its origin.
  await card.getByRole("link", { name: "Attribuer un forfait manuellement" }).click();
  await page.locator("#utilisateurs-grant-plan").selectOption({ label: "Pro" });
  await page.locator("#utilisateurs-grant-reason").fill("Geste commercial fictif");
  await page.getByRole("button", { name: "Offrir le forfait" }).click();
  await done("Forfait offert.");
  const rights = page.locator("#utilisateurs-droits");
  await expect(rights.getByText("Forfait Pro")).toBeVisible();
  await expect(rights.getByText("Forfait offert", { exact: true })).toBeVisible();

  // Extra AI credits for the period.
  await card.getByRole("link", { name: "Ajouter des crédits" }).click();
  await page.locator("#utilisateurs-credits-key").selectOption("ai.credits.monthly");
  await page.locator("#utilisateurs-credits-amount").fill("20");
  await page.locator("#utilisateurs-credits-reason").fill("Crédits offerts (fictif)");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await done("Crédits ajoutés.");
  await expect(rights.getByText("0 sur 170")).toBeVisible();
  await expect(rights.getByText("Ajout manuel")).toBeVisible();
  await expectAccessible(page);

  // « Supprimer définitivement » opens its own screen: a justification, then EFFACER.
  await card.getByRole("link", { name: "Supprimer définitivement" }).click();
  await expectTitle(page, "Supprimer définitivement le compte de Compte Fiche Fictif");
  await expect(page.getByRole("heading", { name: "Ce qui va se passer" })).toBeVisible();
  await page.locator("#utilisateurs-erase-reason").fill("Demande écrite de la personne (fictif)");
  await page.locator("#utilisateurs-erase-word").fill("EFFACER");
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await done("Compte et documents effacés définitivement.");
  await expectTitle(page, "Utilisateurs");
});

test("la liste des utilisateurs s'exporte en CSV", async ({ page }) => {
  test.setTimeout(90_000);
  const account = makeAccount("export", "Compte Export Fictif");
  await logIn(page, demo.admin);
  await page.goto(`/admin/utilisateurs?q=${encodeURIComponent(account.email)}`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exporter en CSV" }).click();
  const { readFileSync } = await import("node:fs");
  const csv = readFileSync(await (await download).path(), "utf8");
  expect(csv).toContain("E-mail vérifié");
  expect(csv).toContain(account.email);
  expect(csv.trim().split("\n")).toHaveLength(2);
});

test("une organisation : justificatif, complément, suspension puis réactivation", async ({
  page,
}) => {
  test.setTimeout(150_000);
  const name = `Entreprise Recette ${Date.now()} (fictive)`;
  const id = makeOrganization(name);
  await logIn(page, demo.admin);
  await page.goto(`/admin/organisations?fiche=${id}`);
  const card = page.locator("#organisations-fiche");
  const done = (text: string) =>
    expect(page.getByRole("status").filter({ hasText: text })).toBeVisible();

  // The supporting document opens (and its opening is recorded).
  const file = card.getByRole("link", { name: "Ouvrir registre-fictif.pdf" });
  const response = await page.request.get((await file.getAttribute("href"))!);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  await expect(card.getByText("Poste fictif (recette admin)")).toBeVisible();
  await expectAccessible(page);

  // Ask for more: the request leaves « en attente ».
  await card.getByText("Demander un complément").click();
  await page.locator("#organisations-more-reason").fill("Registre du commerce plus lisible");
  await page.getByRole("button", { name: "Demander ce complément" }).click();
  await done("Demande de complément envoyée.");
  await expect(
    card.getByText("Complément demandé : Registre du commerce plus lisible"),
  ).toBeVisible();

  // Suspension: the live job closes.
  await card.getByRole("link", { name: "Suspendre l'organisation" }).click();
  await page.locator("#organisations-suspend-reason").fill("Recette de l'admin (fictif)");
  await page.getByRole("button", { name: "Suspendre l'organisation" }).click();
  await done("Organisation suspendue.");
  await expect(card.getByText("Suspendue", { exact: true })).toBeVisible();
  await expect(card.getByText("Aucune offre en ligne.")).toBeVisible();

  // Reactivation: the job is back online.
  await card.getByRole("link", { name: "Réactiver l'organisation" }).click();
  await page.getByRole("button", { name: "Réactiver l'organisation" }).click();
  await done("Organisation réactivée.");
  await expect(card.getByText("Poste fictif (recette admin)")).toBeVisible();

  const history = page.getByRole("region", { name: "Historique" });
  await expect(history.getByText("a consulté un justificatif")).toBeVisible();
  await expect(history.getByText("a demandé un complément")).toBeVisible();
  await expect(history.getByText("a suspendu l'organisation")).toBeVisible();
  await expect(history.getByText("a réactivé l'organisation")).toBeVisible();
});

test("un forfait : nouveau, modifié avec un motif, versions, puis supprimé", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Crée un forfait partagé : une seule exécution.");
  test.setTimeout(120_000);
  const code = `test_e2e_${Date.now().toString(36)}`;
  await logIn(page, demo.admin);
  await page.goto("/admin/forfaits?famille=talent");
  await page.getByRole("link", { name: "Nouveau forfait" }).click();
  await page.locator("#forfaits-new-code").fill(code);
  await page.locator("#forfaits-new-name").fill("Forfait test fictif");
  await page.locator("#forfaits-new-reason").fill("Essai d'un nouveau forfait (fictif)");
  await page.getByRole("button", { name: "Créer le forfait" }).click();
  await expect(page.getByText("Forfait créé, masqué et non vendu.")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/admin/forfaits/${code}`));
  await expectAccessible(page);

  // A change needs its reason; the version says what changed and why.
  await page.locator("#forfaits-price").fill("3.50");
  await page.getByRole("button", { name: "Appliquer les modifications" }).click();
  await expect(page.locator("#forfaits-reason:invalid")).toHaveCount(1);
  await page.locator("#forfaits-reason").fill("Prix d'essai (fictif)");
  await page.getByRole("button", { name: "Appliquer les modifications" }).click();
  await expect(page.getByText("Forfait mis à jour.")).toBeVisible();
  const versions = page.getByRole("region", { name: "Versions du forfait" });
  await expect(versions.getByText("Sur devis → 3.50 USD")).toBeVisible();
  await expect(versions.getByText("Motif : Prix d'essai (fictif)")).toBeVisible();

  // Never used: it can be deleted.
  await page.getByRole("link", { name: "Supprimer le forfait" }).click();
  await page.locator("#forfaits-delete-reason").fill("Forfait d'essai (fictif)");
  await page.getByRole("button", { name: "Supprimer le forfait" }).click();
  await expect(page.getByText("Forfait supprimé.")).toBeVisible();

  // A plan with subscribers is only withdrawn from sale.
  await page.goto("/admin/forfaits/talent_pro");
  await expect(page.getByText("Ce forfait a déjà servi")).toBeVisible();
  await expect(page.getByRole("link", { name: "Supprimer le forfait" })).toHaveCount(0);
});

test("un abonnement : prolongé, changé, payé à la main puis résilié", async ({ page }) => {
  test.setTimeout(150_000);
  const account = makeAccount("abonnement", "Compte Abonnement Fictif");
  await logIn(page, demo.admin);
  const done = (text: string) =>
    expect(page.getByRole("status").filter({ hasText: text })).toBeVisible();
  // A plan given from the user card gives the subscription to work on.
  await page.goto(`/admin/utilisateurs?fiche=${account.id}&action=forfait`);
  await page.locator("#utilisateurs-grant-plan").selectOption({ label: "Starter" });
  await page.locator("#utilisateurs-grant-reason").fill("Base du test (fictif)");
  await page.getByRole("button", { name: "Offrir le forfait" }).click();
  await done("Forfait offert.");

  await page.goto(`/admin/abonnements?q=${encodeURIComponent(account.email)}`);
  await expect(page.getByText("À renouveler sous 7 jours")).toBeVisible();
  await page
    .getByRole("link", { name: /^Ouvrir l'abonnement de Compte Abonnement Fictif/ })
    .filter({ visible: true })
    .first()
    .click();
  const card = page.locator("#abonnements-fiche");
  await expect(card.getByText("Offert par Jumanly")).toBeVisible();

  await card.getByRole("link", { name: "Prolonger la période" }).click();
  await page.locator("#abonnements-extend-reason").fill("Geste commercial (fictif)");
  await page.getByRole("button", { name: "Prolonger la période" }).click();
  await done("Abonnement prolongé.");

  await card.getByRole("link", { name: "Changer de forfait" }).click();
  await page.locator("#abonnements-change-plan").selectOption("talent_pro");
  await page.getByLabel("Tout de suite, sans changer la date de fin").check();
  await page.locator("#abonnements-change-reason").fill("Passage à Pro (fictif)");
  await page.getByRole("button", { name: "Changer de forfait" }).click();
  await done("Forfait changé.");
  await expect(card.getByText("Pro", { exact: true })).toBeVisible();

  await card.getByRole("link", { name: "Enregistrer un paiement manuel" }).click();
  await page.locator("#abonnements-manual-method").selectOption("bank_transfer");
  await page.locator("#abonnements-manual-reference").fill(`VIR-${Date.now().toString(36)}`);
  await page.locator("#abonnements-manual-reason").fill("Virement reçu (fictif)");
  await expectAccessible(page);
  await page.getByRole("button", { name: "Enregistrer le paiement" }).click();
  await done("Paiement enregistré.");
  await expect(card.getByText(/^Payé ·/).first()).toBeVisible();
  await expect(
    page
      .getByRole("link", { name: /^Actions pour Compte Abonnement Fictif/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  await card.getByRole("link", { name: "Résilier" }).click();
  await page.getByLabel("Tout de suite : retour au forfait gratuit dès maintenant").check();
  await page.locator("#abonnements-cancel-reason").fill("Demande du client (fictif)");
  await page.getByRole("button", { name: "Résilier" }).click();
  await done("Abonnement résilié : retour au forfait gratuit.");
  await expect(card.getByText("Terminé")).toBeVisible();
});

test("le support voit les abonnements sans pouvoir agir", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.support);
  await page.goto("/admin/forfaits?famille=talent");
  await expect(page.getByRole("link", { name: "Nouveau forfait" })).toHaveCount(0);
  await page.goto("/admin/abonnements");
  await page
    .getByRole("link", { name: /^Ouvrir l'abonnement de/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.locator("#abonnements-fiche")).toBeVisible();
  await expect(page.getByRole("link", { name: "Prolonger la période" })).toHaveCount(0);
});
