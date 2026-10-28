import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { logIn, testEmail } from "./session";

// Web recruteur 3 (docs/refonte-web/recruteur-3) : le menu du compte sous l'avatar, le résumé du
// jour sous la cloche, Orbi avec son historique, la messagerie en trois colonnes, le compte en
// tuiles, l'organisation, la vérification, l'équipe en tableau, l'abonnement, les formules, les
// rapports, les paramètres avec leurs rubriques et le journal des consultations, les premiers pas.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);

const main = (page: Page) => page.locator("main").filter({ visible: true });

/** The seeded company of the planches: Baobab Fintech (prisma/seed/ux.ts, all fictional). */
const baobab = "recruteur6.ux@jumanly.test";

test("web recruteur 3 : menu du compte, compte, organisation, équipe, abonnement, rapports, paramètres", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  // A fictional company of its own: nothing here touches the data of the other tests.
  const email = testEmail("rx-web3");
  const org = `Entreprise fictive web3 ${suffix()}`;
  execFileSync("pnpm", ["exec", "tsx", "tests/e2e/make-recruiter.ts", email, org, "verified"]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");

  // 1. The avatar opens the menu of the account (the phone keeps its link to Compte RH).
  await page.getByRole("button", { name: /^Compte de / }).click();
  const menu = page.getByRole("dialog", { name: /^Menu du compte de / });
  await expect(menu).toBeVisible();
  for (const name of ["Organisation", "Équipe", "Rapports", "Abonnement", "Paramètres"])
    await expect(menu.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Passer à mon espace talent" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
  await expectAccessible(page);
  await menu.getByRole("link", { name: /^Organisation/ }).click();
  await expect(page).toHaveURL(/\/app\/organisation$/);
  await expect(menu).toBeHidden();

  // 2. Page entreprise (étape 3, A3): the page with its fields and its public view.
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Page entreprise", exact: true }),
  ).toBeVisible();
  await expect(main(page).getByRole("link", { name: "Voir la page publique" })).toBeVisible();
  await expect(main(page).getByLabel("Nom", { exact: true })).toHaveValue(org);
  await noOverflow(page);
  await expectAccessible(page);

  // 3. Compte: the person with « Espace talent » and « Mon profil RH », the account in tiles.
  await page.goto("/app/hire/compte");
  await expect(main(page).getByRole("link", { name: "Mon profil RH" })).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Espace talent" })).toBeVisible();
  const tiles = main(page).getByRole("list", { name: "Organisation et équipe" }).first();
  await expect(tiles.getByRole("link", { name: /^Abonnement/ })).toBeVisible();
  await expect(tiles.getByRole("link", { name: /^Paramètres/ })).toBeVisible();
  await expect(main(page).getByRole("link", { name: /assistant@jumanly\.io/ })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // Mon profil RH: the form in a card, what candidates see beside it, no bar at the bottom.
  await main(page).getByRole("link", { name: "Mon profil RH" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/compte\/profil$/);
  await expect(main(page).getByText("Ce que voient les candidats")).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Enregistrer" })).toHaveCount(1);
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await noOverflow(page);
  await expectAccessible(page);

  // 4. Équipe (étape 3, A2): the three tabs, « Inviter un membre » opens the dialog.
  await page.goto("/app/organisation/equipe");
  await expect(main(page).getByRole("heading", { level: 1 })).toHaveText("Équipe");
  await expect(main(page).getByRole("tab", { name: "Membres et rôles" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await main(page).getByRole("button", { name: "Inviter un membre" }).first().click();
  const invite = page.getByRole("dialog", { name: "Inviter un membre" });
  await expect(invite).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(invite).toBeHidden();
  await noOverflow(page);
  await expectAccessible(page);

  // 5. Abonnement: the plan with « Changer de formule », the quotas in cards, payment and invoices.
  await page.goto("/app/abonnement");
  await expect(main(page).getByRole("link", { name: "Changer de formule" })).toBeVisible();
  await expect(main(page).getByRole("heading", { name: "Paiement et factures" })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);
  await page.goto("/app/abonnement/formules");
  await expect(main(page).locator(".t-w4-f4")).toBeVisible();
  await noOverflow(page);

  // 6. Rapports: the figures, then the cards two by two.
  await page.goto("/app/hire/rapports");
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Rapports", exact: true }),
  ).toBeVisible();
  await expect(main(page).getByText(`${org} · 30 derniers jours`)).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // 7. Paramètres: the rubrics on the left, the journal of the profiles opened as a table.
  await page.goto("/app/parametres");
  const rubrics = main(page).getByRole("navigation", { name: "Paramètres" });
  await expect(rubrics.getByRole("link", { name: "Apparence et Orbi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // The owner reads the team's journal in the company's space (étape 3, A5 and A6).
  await rubrics.getByRole("link", { name: "Journal des consultations" }).click();
  await expect(page).toHaveURL(/\/app\/organisation\/journal$/);
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Journal des consultations" }),
  ).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);
  await page.goto("/app/parametres");
  await rubrics.getByRole("link", { name: "Messagerie et rappels" }).click();
  await expect(page).toHaveURL(/\/app\/parametres\/messagerie$/);
  await expect(main(page).getByRole("switch", { name: /J-3/ })).toBeChecked();
  await noOverflow(page);
});

test("web recruteur 3 : messagerie en trois colonnes, résumé du jour sous la cloche, Orbi", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  // Read only: the seeded company of the planches (Baobab Fintech, fictional).
  await logIn(page, baobab, undefined, "/app/hire");

  // Messages: the first conversation opens by itself, the list beside it, the application on the
  // right, the rule of the messaging in the head.
  await page.goto("/app/messages");
  await expect(page).toHaveURL(/\/app\/messages\/[^/?]+/);
  await expect(
    main(page)
      .getByText("Seulement avec les candidats et les talents qui ont accepté le contact")
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(
    main(page).locator(".t-rw3-ls").filter({ visible: true }).getByRole("link").first(),
  ).toBeVisible();
  await expect(
    main(page).locator(".t-rw3-ls .t-r5-cv[aria-current]").filter({ visible: true }),
  ).toHaveCount(1);
  const aside = main(page).getByRole("complementary", {
    name: "Candidature liée à la conversation",
  });
  await expect(aside).toBeVisible();
  await expect(aside.getByRole("link", { name: /Ouvrir le dossier|Voir le profil/ })).toBeVisible();
  await expect(main(page).getByPlaceholder("Écrire un message").first()).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // At 1024 px: the list and the conversation, the application stays in its card above the thread.
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(aside).toBeHidden();
  await expect(main(page).locator(".t-rw3-ls").filter({ visible: true })).toBeVisible();
  await noOverflow(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // The bell: « Votre journée en bref » above the notifications.
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const bell = page.locator(".t-pop").filter({ visible: true });
  await expect(bell.getByText("Votre journée en bref")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(bell).toHaveCount(0);

  // Orbi: the page with the history on the left; the panel opens from any page.
  await page.goto("/app/orbi");
  await expect(main(page).locator(".t-orw-c")).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);
  await page.goto("/app/hire/rapports?orbi=1");
  await expect(page.locator(".t-op").filter({ visible: true })).toBeVisible();
});
