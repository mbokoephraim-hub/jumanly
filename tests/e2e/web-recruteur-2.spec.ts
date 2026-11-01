import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";

// Web recruteur 2 (docs/refonte-web/recruteur-2) : les candidatures et le dossier côte à côte, le
// dossier en deux colonnes, la décision, l'agenda en semaine, le calendrier avec ses heures, la
// recherche de talents avec les filtres à gauche, les propositions en tableau, les viviers.

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

test("web recruteur 2 : candidats côte à côte, dossier, décision, agenda, talents, propositions", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  // A fictional company on the cheapest plan with interview scorecards (its right, not its name):
  // interviews, the talent search and the pools come with it.
  const email = testEmail("rx-web2");
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive web ${suffix()}`,
    "verified",
    "hire.scorecards",
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");

  // An offer and one applicant (a seeded, obviously fictional talent).
  const detail = await fillOffer(page, {
    title: `Analyste de données fictif ${suffix()}`,
    description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
    responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
    skill: "Analyse de données",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);
  const jobId = detail.split("/").pop()!;
  const context = await browser.newContext({ baseURL });
  const talent = await context.newPage();
  await logIn(talent, "jeanpierre.ux@jumanly.test");
  await talent.goto(`/app/jobs/${slug}/postuler`);
  // First screen (01/11/2026): how to apply; « Avec un CV existant » is chosen.
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=cv/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await context.close();

  // 1. Candidats : nothing opens by itself; a click opens the file beside the list (logged).
  await page.goto(`/app/hire/candidats?offre=${jobId}`);
  await expect(main(page).getByText("Choisissez une candidature")).toBeVisible();
  await expect(main(page).getByRole("region", { name: /^Dossier de / })).toHaveCount(0);
  const row = main(page)
    .getByRole("link", { name: /Jean-Pierre Démo/ })
    .first();
  // Once the list is interactive, a click keeps it on screen and opens the file beside it.
  await page.waitForLoadState("networkidle");
  await expect(async () => {
    if (!page.url().includes("?offre=")) await page.goto(`/app/hire/candidats?offre=${jobId}`);
    await row.click();
    await expect(page).toHaveURL(/[?&]id=/, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  const pane = main(page).getByRole("region", { name: "Dossier de Jean-Pierre Démo" });
  await expect(pane).toBeVisible();
  await expect(row).toHaveAttribute("aria-current", "true");
  await expect(pane.getByText("Résumé par Orbi")).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // « Changer d'étape » from the pane: back to the list, the file still open beside it.
  await pane.getByRole("button", { name: "Changer d'étape" }).click();
  const move = page.getByRole("dialog", { name: "Déplacer Jean-Pierre Démo" });
  await move.locator("label").filter({ hasText: "En examen" }).click();
  await move.getByRole("button", { name: "Déplacer", exact: true }).click();
  await expect(page).toHaveURL(/ok=deplacee/);
  await expect(page).toHaveURL(/[?&]id=/);
  await expect(pane.locator('[aria-current="step"]')).toContainText("En examen");

  // 2. The complete file in two columns: the actions in a card, no bar at the bottom.
  await pane.getByRole("link", { name: "Ouvrir le dossier complet de Jean-Pierre Démo" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/?]+$/);
  const file = page.url();
  await expect(pane).toHaveCount(0);
  const actions = main(page).getByRole("navigation", { name: "Actions sur la candidature" });
  await expect(actions.getByText("Actions", { exact: true })).toBeVisible();
  // One application only: no « Candidature n sur N » to page through.
  await expect(
    main(page).getByRole("navigation", { name: "Parcourir les candidatures de l'offre" }),
  ).toHaveCount(0);
  await expect(main(page).getByRole("link", { name: /^Candidatures · / })).toBeVisible();
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await noOverflow(page);
  await expectAccessible(page);

  // 3. The decision: the choice on the left, the message on the right.
  await page.goto(`${file}/decision`);
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Décision finale", exact: true }),
  ).toBeVisible();
  await expect(
    main(page).getByRole("heading", { name: "Message au candidat", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // 4. The planner: the day and its hours on one screen, no « Heures » step.
  await page.goto(`${file}/entretien`);
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Proposer un entretien", exact: true }),
  ).toBeVisible();
  await expect(main(page).getByRole("button", { name: "Heures", exact: true })).toHaveCount(0);
  await expect(main(page).getByRole("button", { name: "Aperçu", exact: true })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // 5. The agenda: the week as a grid, « Proposer un entretien » at the top.
  await page.goto("/app/hire/entretiens");
  await expect(main(page).locator(".t-rw-agw")).toBeVisible();
  await expect(
    main(page).getByRole("button", { name: "Proposer un entretien", exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // 6. Rechercher des talents: the filters stay open on the left, the profiles in a grid.
  await page.goto("/app/hire/candidats?vue=talents&q=Analyste%20BI");
  const filters = main(page).getByRole("complementary", { name: "Filtrer les talents" });
  await expect(filters).toBeVisible();
  await expect(filters).toContainText(
    "Pas de filtre sur l'âge, le genre, la nationalité ou la photo.",
  );
  await expect(main(page).getByRole("button", { name: /^Filtres/ })).toHaveCount(0);
  await expect(main(page).getByRole("link", { name: "Viviers", exact: true })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // A visible talent's profile: who and the actions in one card, two columns; the view is logged.
  await main(page)
    .getByRole("link", { name: /Consulter le profil de Ruth/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/talents\/[^/?]+/);
  await expect(main(page).getByRole("heading", { level: 1 })).toContainText("Ruth");
  await expect(main(page)).toContainText("Consultation enregistrée");
  const profileActions = main(page).getByRole("navigation", { name: "Actions sur ce profil" });
  await expect(profileActions.getByRole("link", { name: "Proposer l'offre" })).toBeVisible();
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await noOverflow(page);
  await expectAccessible(page);

  // « Proposer l'offre » in a centred card; the talent decides alone.
  await profileActions.getByRole("link", { name: "Proposer l'offre" }).click();
  await expect(page).toHaveURL(/\/proposer/);
  await expect(
    main(page).getByRole("heading", { level: 1, name: "Proposer l'offre", exact: true }),
  ).toBeVisible();
  await expect(main(page)).toContainText("Le talent décide seul de répondre");
  await noOverflow(page);
  await expectAccessible(page);
  await main(page).getByRole("button", { name: "Envoyer à Ruth" }).click();
  await expect(page).toHaveURL(/ok=proposee/);

  // 7. Mes propositions as a table.
  await page.goto("/app/hire/candidats?vue=propositions");
  await expect(main(page).getByText("Offre proposée", { exact: true })).toBeVisible();
  await expect(main(page).locator(".t-rw-ppd").filter({ hasText: "En attente" })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // 8. Viviers: « Créer un vivier » in the head of the page.
  await page.goto("/app/hire/viviers");
  await expect(main(page).getByRole("heading", { level: 1, name: "Mes viviers" })).toBeVisible();
  await expect(
    main(page).getByRole("button", { name: "Créer un vivier", exact: true }),
  ).toHaveCount(1);
  await noOverflow(page);

  // Tablet: the filters come back in a sheet; a candidate opens on its own page.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/app/hire/candidats?vue=talents");
  await expect(main(page).getByRole("complementary", { name: "Filtrer les talents" })).toBeHidden();
  await expect(main(page).getByRole("button", { name: /^Filtres/ })).toBeVisible();
  await noOverflow(page);
  await page.goto(`/app/hire/candidats?offre=${jobId}`);
  await main(page)
    .getByRole("link", { name: /Jean-Pierre Démo/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/?]+$/);
  await noOverflow(page);
});
