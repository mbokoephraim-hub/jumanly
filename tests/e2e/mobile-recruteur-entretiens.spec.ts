import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Browser, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";
import { openCandidateFile, plannerToHours, widePlanner } from "./hire-wide";

// Recruiter space, lot 4 (docs/refonte-mobile, brief recruteur § 4 item 4, planches r2plus ENT,
// AGENDA, PREP_R, EVAL, TAL, TPROF, CONTACT, VIVIERS): an interview proposed on the calendar,
// previewed, confirmed by the talent, prepared with Orbi's questions and evaluated; the talent
// search, a visible talent's profile, « Proposer l'offre » and the pools; the arrival call of the
// acceptance message. Orbi proposes, the recruiter decides: nothing leaves without a tap.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

/**
 * A fresh, obviously fictional company on the cheapest plan with interview scorecards (chosen by
 * its right, never by its name): that plan also opens interviews, the talent search and the pools.
 */
async function freshRecruiter(page: Page, prefix: string) {
  const email = testEmail(prefix);
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    "verified",
    "hire.scorecards",
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");
  return email;
}

/** A seeded talent with skills (so the score, Orbi's points and questions exist). */
const scoredTalent = "jeanpierre.ux@jumanly.test";
/** A seeded talent visible to recruiters who applied nowhere (prisma/seed/ux.ts). */
const visibleTalent = "Ruth";

const main = (page: Page) => page.locator("main").filter({ visible: true });

async function offerWithApplicant(
  page: Page,
  browser: Browser,
  baseURL: string | undefined,
  isMobile: boolean,
  title = `Analyste de données fictif ${suffix()}`,
) {
  const detail = await fillOffer(page, {
    title,
    description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
    responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
    skill: "Analyse de données",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  const talent = await context.newPage();
  await logIn(talent, scoredTalent);
  await talent.goto(`/app/jobs/${slug}/postuler`);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await page.goto(`/app/hire/candidats?offre=${detail.split("/").pop()}`);
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const file = page.url().split("?")[0]!;
  return { jobId: detail.split("/").pop()!, title, talent, file };
}

/** No horizontal scroll at 390 and 412 px, every sheet and summary open. */
async function noOverflow(page: Page, label: string) {
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    await page.evaluate(() => {
      document.querySelectorAll("main details").forEach((item) => item.setAttribute("open", ""));
    });
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `${label} à ${width} px`).toBe(client);
  }
}

test("entretien : calendrier, aperçu, confirmation du talent, préparation, évaluation", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  await freshRecruiter(page, "rx-entretiens");
  const { talent, file } = await offerWithApplicant(page, browser, baseURL, isMobile);
  const applicationId = file.split("/").pop()!;

  // « Proposer un entretien » from the file: the month calendar first.
  await main(page)
    .locator(`a[href="/app/hire/candidats/${applicationId}/entretien"]`)
    .first()
    .click();
  await expect(page).toHaveURL(/\/entretien$/);
  const planner = main(page);
  await expect(planner.getByRole("heading", { name: "Proposer un entretien" })).toBeVisible();
  // On a phone « Heures » waits for a day; on a computer the first open day is already chosen.
  if (!widePlanner(page))
    await expect(planner.getByRole("button", { name: "Heures", exact: true })).toBeDisabled();
  await expectAccessible(page);
  await noOverflow(page, "calendrier");
  await planner.locator('[role="grid"] button:enabled').first().click();
  await plannerToHours(page);
  // Orbi suggests the next free slot; the recruiter adds it, then a second one.
  await planner.locator(".t-rx-orbi").getByRole("button", { name: "Ajouter" }).click();
  await expect(planner).toContainText("1 créneau sur 3");
  await expect(planner).toContainText("Ajouter un 2e choix ?");
  await planner.locator(".t-rx-orbi").getByRole("button", { name: "Ajouter" }).click();
  await expect(planner).toContainText("2 créneaux sur 3");
  await expectAccessible(page);
  await noOverflow(page, "heures");
  // The preview shows what the talent will receive; the message is prepared, to be read.
  await planner.getByRole("button", { name: "Aperçu", exact: true }).click();
  const preview = planner.getByRole("region", {
    name: "Aperçu de l'invitation reçue par le talent",
  });
  await expect(preview).toContainText("Invitation à un entretien");
  await expect(planner).toContainText("Préparé par Orbi, à relire");
  await planner.getByRole("button", { name: "Formel" }).click();
  await expect(planner.getByRole("button", { name: "Formel" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expectAccessible(page);
  await noOverflow(page, "aperçu");
  await planner.getByRole("button", { name: "Envoyer l'invitation" }).click();
  await expect(page).toHaveURL(/\/app\/hire\/entretiens\/[^/?]+\?ok=envoye/);
  const prep = page.url().split("?")[0]!;
  await expect(page.getByText("Invitation envoyée. Jean-Pierre choisit un créneau.")).toBeVisible();
  await expect(main(page)).toContainText("Jean-Pierre n'a pas encore choisi de créneau.");

  // The talent confirms from Suivi; the recruiter's preparation shows the date.
  await talent.goto(`/app/suivi/${applicationId}`);
  await talent.locator("#entretien").getByRole("button", { name: "Confirmer" }).first().click();
  await expect(talent).toHaveURL(/ok=confirme/);
  await talent.context().close();

  // The agenda: the week shows the confirmed interview, the month view too.
  await page.goto("/app/hire/entretiens");
  await expect(main(page)).toContainText("Préparez l'entretien de");
  await expect(
    main(page)
      .getByRole("link", { name: /Jean-Pierre Démo/ })
      .first(),
  ).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "agenda, semaine");
  await page.goto("/app/hire/entretiens?vue=mois");
  await expect(main(page).getByRole("link", { name: "Mois", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await noOverflow(page, "agenda, mois");
  await page.goto("/app/hire/entretiens?candidature=nouveau");
  const pick = page.getByRole("dialog", { name: "Proposer un entretien à…" });
  await expect(pick).toBeVisible();
  // A link of the sheet closes it: the planner behind is never left inert.
  await pick.getByRole("link", { name: /Jean-Pierre Démo/ }).click();
  await expect(page).toHaveURL(/\/entretien$/);
  await main(page).locator('[role="grid"] button:enabled').first().click();
  if (!widePlanner(page))
    await expect(main(page).getByRole("button", { name: "Heures", exact: true })).toBeEnabled();

  // The preparation: Orbi's points and questions, the team's own questions.
  await page.goto(prep);
  const sheet = main(page);
  await expect(sheet.getByRole("heading", { level: 1 })).toContainText("Préparer l'entretien");
  await expect(sheet).toContainText("Ce qu'il faut vérifier");
  await expect(sheet).toContainText("Questions proposées");
  await expectAccessible(page);
  await noOverflow(page, "préparation");
  // A private question is refused, a question about the job is added, then removed by its author.
  await sheet.getByRole("button", { name: "Ajouter", exact: true }).click();
  const ask = page.getByRole("dialog", { name: "Ajouter une question" });
  await ask.getByLabel("Votre question").fill("Êtes-vous marié et avez-vous des enfants ?");
  await ask.getByRole("button", { name: "Ajouter la question" }).click();
  await expect(page.getByText(/Cette question touche à la vie privée/).first()).toBeVisible();
  await page.goto(prep);
  await main(page).getByRole("button", { name: "Ajouter", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Ajouter une question" })
    .getByLabel("Votre question")
    .fill("Comment priorisez-vous les demandes des agences fictives ?");
  await page
    .getByRole("dialog", { name: "Ajouter une question" })
    .getByRole("button", { name: "Ajouter la question" })
    .click();
  await expect(page).toHaveURL(/ok=question/);
  await expect(main(page)).toContainText(
    "Comment priorisez-vous les demandes des agences fictives ?",
  );
  await main(page)
    .getByRole("button", { name: /^Retirer la question/ })
    .click();
  await expect(page).toHaveURL(/ok=question-retiree/);
  await expect(main(page)).not.toContainText("Comment priorisez-vous les demandes des agences");

  // The evaluation: each criterion from 1 to 4, an opinion, a suggested next step; the draft is kept
  // on the device until it is sent. The file shows it, the candidate is not moved.
  await main(page).getByRole("link", { name: "Ouvrir l'évaluation" }).click();
  await expect(page).toHaveURL(/\/evaluation/);
  const evaluation = main(page);
  await expect(evaluation.getByRole("heading", { level: 1 })).toContainText("Évaluer l'entretien");
  await expect(evaluation).toContainText(
    "Les évaluations de l'équipe s'affichent après l'envoi de la vôtre",
  );
  await expectAccessible(page);
  await noOverflow(page, "évaluation");
  await evaluation.locator("textarea").first().fill("Échange clair et précis, entièrement fictif.");
  await evaluation.getByRole("button", { name: "Brouillon" }).click();
  await expect(page.getByText("Brouillon gardé sur cet appareil.").first()).toBeVisible();
  await page.reload();
  await expect(main(page).locator("textarea").first()).toHaveValue(
    "Échange clair et précis, entièrement fictif.",
  );
  const groups = main(page)
    .locator("fieldset")
    .filter({ has: page.getByRole("radio", { name: "3 sur 4, bon" }) });
  for (let index = 0; index < (await groups.count()); index++)
    await groups
      .nth(index)
      .locator("label")
      .filter({ has: page.getByRole("radio", { name: "3 sur 4, bon" }) })
      .click();
  await main(page).locator("label").filter({ hasText: "Hésitation" }).click();
  await main(page).getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/ok=evaluation/);
  expect(page.url().split("?")[0]).toBe(file);
  await expect(main(page)).toContainText("Votre évaluation : Hésitation.");
  await expect(main(page).locator('[aria-current="step"]').filter({ visible: true })).toContainText(
    "Reçue",
  );
  await page.goto("/app/hire/entretiens?vue=evaluer");
  await noOverflow(page, "à évaluer");
});

test("talents : recherche, profil, vivier, proposition de l'offre, dossier et appel d'arrivée", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  await freshRecruiter(page, "rx-talents");
  const { jobId, talent, file } = await offerWithApplicant(page, browser, baseURL, isMobile);
  await talent.context().close();

  // The search: compared with the newest offer; the filters never offer personal criteria.
  await page.goto("/app/hire/candidats?vue=talents&q=Analyste%20BI");
  const search = main(page);
  await expect(search.getByRole("link", { name: "Découvrir" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(search).toContainText(/profils? visibles?/);
  await expectAccessible(page);
  await noOverflow(page, "recherche");
  await search.getByRole("button", { name: /^Filtres/ }).click();
  const filters = page.getByRole("dialog", { name: "Filtres" });
  await expect(filters).toContainText(
    "Pas de filtre sur l'âge, le genre, la nationalité ou la photo.",
  );
  await expectAccessible(page);
  await noOverflow(page, "filtres");
  await filters.getByRole("button", { name: "Fermer" }).click();

  // A visible talent's profile: the view is logged, Orbi compares with the offer.
  await search
    .getByRole("link", { name: new RegExp(`Consulter le profil de ${visibleTalent}`) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/talents\/[^/?]+/);
  const profile = page.url().split("?")[0]!;
  await expect(main(page).getByRole("heading", { level: 1 })).toContainText(visibleTalent);
  await expect(main(page)).toContainText("Consultation enregistrée");
  await expect(main(page)).toContainText("Ce qu'Orbi relève");
  await expectAccessible(page);
  await noOverflow(page, "profil du talent");

  // « Vivier »: a first pool named on the spot; the talent is not told.
  const pool = `Vivier fictif ${suffix()}`;
  await main(page).getByRole("button", { name: "Vivier", exact: true }).click();
  const poolSheet = page.getByRole("dialog", { name: "Ajouter à un vivier" });
  await expect(poolSheet).toContainText("Le talent n'est pas prévenu.");
  await poolSheet.getByLabel("Nommez votre premier vivier").fill(pool);
  await poolSheet.getByRole("button", { name: "Créer et ajouter" }).click();
  await expect(page).toHaveURL(/ok=vivier/);
  await expect(page.getByText("Ajouté au vivier.").first()).toBeVisible();

  // « Proposer l'offre »: the message is prepared and read, the talent decides alone.
  await main(page).getByRole("link", { name: "Proposer l'offre" }).click();
  await expect(page).toHaveURL(new RegExp(`/proposer\\?offre=${jobId}`));
  const propose = main(page);
  await expect(propose).toContainText("Personnalisé par Orbi, à relire");
  await expect(propose).toContainText("Le talent décide seul de répondre");
  await expectAccessible(page);
  await noOverflow(page, "proposer l'offre");
  await propose.getByRole("button", { name: `Envoyer à ${visibleTalent}` }).click();
  await expect(page).toHaveURL(/ok=proposee/);
  expect(page.url().split("?")[0]).toBe(profile);
  await expect(
    page.getByText(/Proposition envoyée\. Le talent a \d+ jours pour répondre\./),
  ).toBeVisible();
  await expect(main(page).getByRole("link", { name: "Proposer l'offre" })).toHaveCount(0);

  // « Mes propositions »: pending.
  await page.goto("/app/hire/candidats?vue=propositions");
  const proposals = main(page);
  await expect(
    proposals.getByRole("link", { name: new RegExp(visibleTalent) }).first(),
  ).toContainText("En attente");
  await expectAccessible(page);
  await noOverflow(page, "mes propositions");

  // « Mes viviers » and the pool.
  await page.goto("/app/hire/viviers");
  await expect(main(page)).toContainText(pool);
  await expectAccessible(page);
  await noOverflow(page, "viviers");
  await main(page)
    .getByRole("link", { name: new RegExp(pool) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(pool);
  await expect(main(page)).toContainText(visibleTalent);
  await expectAccessible(page);
  await noOverflow(page, "vivier");

  // From the candidate's file: « Ajouter à un vivier » in the menu.
  await page.goto(file);
  await page.getByRole("button", { name: "Plus d'actions sur la candidature" }).click();
  await page
    .getByRole("dialog", { name: "Actions" })
    .getByRole("button", { name: "Ajouter à un vivier" })
    .click();
  await page
    .getByRole("dialog", { name: "Ajouter à un vivier" })
    .getByRole("button", { name: `Ajouter à « ${pool} »` })
    .click();
  await expect(page).toHaveURL(/ok=vivier/);
  expect(page.url().split("?")[0]).toBe(file);
  await expect(page.getByText("Ajouté au vivier.").first()).toBeVisible();

  // The acceptance message can carry an arrival call: the first slot is required.
  await page.goto(`${file}/decision?issue=hired`);
  await main(page)
    .getByRole("switch", { name: /Proposer un appel d'arrivée/ })
    .click();
  await expect(page).toHaveURL(/appel=1/);
  await expect(main(page)).toContainText("Choisissez un créneau ci-dessous");
  await expect(main(page).getByLabel("Créneau 1")).toHaveAttribute("required", "");
  await expectAccessible(page);
  await noOverflow(page, "décision avec appel");
});
