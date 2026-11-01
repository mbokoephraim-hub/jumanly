import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Browser, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { logIn, testEmail } from "./session";
import { openCandidateFile } from "./hire-wide";

// Recruiter space, lot 3 (docs/refonte-mobile, brief recruteur § 4 item 3, planches recruteur-2
// § 1-3 and r2plus): the candidates by stage and their sort, the file, the notes, the score and its
// « Pourquoi ? », « Changer d'étape », Orbi's analysis, and the final decision read before it
// leaves, undone within 10 minutes.

// On the phone these screens became Modèle B (lot M5): their gestures are tested in
// modele-b-recruteur-candidatures.spec.ts. The computer keeps this design.
test.skip(({ isMobile }) => isMobile, "Téléphone : voir modele-b-recruteur-candidatures.spec.ts.");

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

/**
 * A fresh, obviously fictional company and its owner, signed in. With `entitlement`, the company
 * is on the cheapest plan that opens it (chosen by its right, never by its name).
 */
async function freshRecruiter(page: Page, prefix: string, entitlement?: string) {
  const email = testEmail(prefix);
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    "verified",
    ...(entitlement ? [entitlement] : []),
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");
  return email;
}

/**
 * A seeded talent with skills, so the frozen score and its « Pourquoi ? » exist (the demo account
 * `talent.free` has none). Used by no other spec: each run applies to its own new offer.
 */
const scoredTalent = "jeanpierre.ux@jumanly.test";

const main = (page: Page) => page.locator("main").filter({ visible: true });

/** An offer published by the signed-in recruiter, with one application of `scoredTalent`. */
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
  return { jobId: detail.split("/").pop()!, title, talent };
}

test("candidats : liste et tri, dossier, analyse Orbi, étape, décision annulée", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  await freshRecruiter(page, "rx-candidats", "hire.cv_analysis");
  const { jobId, talent } = await offerWithApplicant(page, browser, baseURL, isMobile);

  // The list: the offer chosen, « Nouveau », Orbi's line and the stages with their counts.
  await page.goto(`/app/hire/candidats?offre=${jobId}`);
  const list = main(page);
  await expect(list.getByRole("link", { name: "Candidatures" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(list).toContainText("1 candidature pas encore examinée.");
  const row = list.getByRole("link", { name: /Jean-Pierre Démo/ });
  await expect(row).toContainText("Nouveau");
  await expect(
    list.getByRole("navigation", { name: "Filtrer par étape" }).getByRole("link", {
      name: "Reçue : 1 candidature",
    }),
  ).toBeVisible();
  await expectAccessible(page);

  // « Trier »: a filter hides, it never rejects; the list says how many and shows them again.
  await list.getByRole("button", { name: "Trier" }).click();
  const sort = page.getByRole("dialog", { name: "Trier et filtrer" });
  await expect(sort).toBeVisible();
  await expect(sort.getByRole("button", { name: "Voir 1 candidature" })).toBeVisible();
  await sort.locator("label").filter({ hasText: "Avec lettre" }).click();
  await expect(sort.getByRole("button", { name: "Aucune candidature" })).toBeVisible();
  await sort.getByRole("button", { name: "Aucune candidature" }).click();
  await expect(page).toHaveURL(/dossier=lettre/);
  await expect(main(page)).toContainText("1 candidature masquée par vos filtres.");
  await main(page).getByRole("link", { name: "Tout afficher" }).click();
  await expect(main(page).getByRole("link", { name: /Jean-Pierre Démo/ })).toBeVisible();

  // The file: opening it is logged; the track shows « Reçue » now.
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const fileUrl = page.url();
  const file = main(page);
  await expect(file.getByRole("heading", { level: 2, name: "Jean-Pierre Démo" })).toBeVisible();
  await expect(file.locator('[aria-current="step"]').filter({ visible: true })).toContainText(
    "Reçue",
  );
  await expectAccessible(page);

  // « Pourquoi ? »: a fixed calculation, the excluded data said.
  await file.getByRole("button", { name: /^Pourquoi \d+ % \?/ }).click();
  const why = page.getByRole("dialog", { name: /^Pourquoi \d+ % \?/ });
  await expect(why).toContainText("Calcul fixe, le même pour tous les candidats de l'offre.");
  await expect(why).toContainText("Jamais pris en compte : nom, genre, âge, photo");
  await why.getByRole("button", { name: "Fermer" }).click();

  // Orbi reads the file on demand: one credit, an analysis to read, never a decision.
  await file.getByRole("button", { name: "Résumer avec Orbi" }).click();
  const analysis = page.getByRole("dialog", { name: "Analyse du dossier" });
  await expect(analysis).toBeVisible();
  await expect(analysis).toContainText("Points forts");
  await expect(analysis).toContainText("À vérifier en entretien");
  await expect(analysis).toContainText("crédit Orbi utilisé");
  await analysis.getByRole("button", { name: "Ajouter aux notes" }).click();
  await expect(page).toHaveURL(/ok=note-orbi/);
  await expect(page.locator("#notes")).toContainText("À vérifier en entretien");
  await expect(page.locator("#historique")).toContainText("Orbi a résumé le dossier");
  // The analysis moved nothing.
  await expect(main(page).locator('[aria-current="step"]').filter({ visible: true })).toContainText(
    "Reçue",
  );

  // « Changer d'étape »: the talent sees the new stage, no message is sent.
  await page.getByRole("button", { name: "Changer d'étape" }).click();
  const move = page.getByRole("dialog", { name: "Déplacer Jean-Pierre Démo" });
  await expect(move).toContainText("Jean-Pierre verra la nouvelle étape dans son suivi.");
  await move.locator("label").filter({ hasText: "En examen" }).click();
  await move.getByRole("button", { name: "Déplacer", exact: true }).click();
  await expect(page).toHaveURL(/ok=deplacee/);
  await expect(main(page).locator('[aria-current="step"]').filter({ visible: true })).toContainText(
    "En examen",
  );
  const threadHref = await page
    .getByRole("link", { name: "Envoyer un message" })
    .getAttribute("href");

  // « Décision finale » from the same sheet: nothing chosen in advance.
  await page.getByRole("button", { name: "Changer d'étape" }).click();
  await move.locator("label").filter({ hasText: "Décision finale" }).click();
  await move.getByRole("button", { name: "Déplacer", exact: true }).click();
  await expect(page).toHaveURL(/\/decision$/);
  await expect(main(page)).toContainText("Choisissez un résultat");
  await main(page)
    .getByRole("link", { name: /^Non retenue/ })
    .click();
  await expect(
    main(page).locator(".t-rc-msg mark").filter({ hasText: "Jean-Pierre" }),
  ).toBeVisible();
  await expect(main(page)).toContainText(
    "Rien n'est automatique : vous confirmez, et vous pouvez annuler pendant 10 minutes.",
  );
  await expectAccessible(page);
  await main(page).getByRole("button", { name: "Confirmer et envoyer" }).click();
  await expect(page.getByRole("heading", { name: "Décision enregistrée" })).toBeVisible();
  await expect(main(page)).toContainText("Jean-Pierre Démo passe en « Non retenue ».");
  await expect(main(page)).toContainText(
    "E-mail à Jean-Pierre envoyé à la fin du délai d'annulation",
  );
  await expect(main(page)).toContainText("Annulable encore");

  // The talent sees the decision at once in the conversation.
  await talent.goto(threadHref!);
  await expect(talent.getByRole("main")).toContainText("Candidature non retenue");

  // « Annuler »: back to « En examen », the message is withdrawn.
  await main(page).getByRole("button", { name: "Annuler", exact: true }).click();
  await expect(page).toHaveURL(/ok=annulee/);
  expect(page.url().split("?")[0]).toBe(fileUrl);
  await expect(main(page).locator('[aria-current="step"]').filter({ visible: true })).toContainText(
    "En examen",
  );
  await expect(page.locator("#historique")).toContainText("a annulé la décision");
  await talent.reload();
  await expect(talent.getByRole("main")).toContainText("Message retiré par l'entreprise.");
  await talent.context().close();
});

test("RH sans analyse : le dossier reste lisible, Orbi est proposé avec sa formule", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(240_000);
  await freshRecruiter(page, "rx-candidats-free");
  const { jobId, talent } = await offerWithApplicant(page, browser, baseURL, isMobile);
  await talent.context().close();
  await page.goto(`/app/hire/candidats?offre=${jobId}`);
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const orbi = page.locator("#orbi");
  await expect(orbi).toContainText("Résumé et analyse par Orbi");
  await expect(orbi).toContainText("Disponibles dès");
  await expect(orbi.getByRole("button", { name: "Résumer avec Orbi" })).toHaveCount(0);
  // The file stays whole: skills, answers, notes, history; the decision is open to all plans.
  await expect(main(page)).toContainText("Compétences de l'offre");
  await expect(page.getByRole("button", { name: "Changer d'étape" })).toBeVisible();
  await expectAccessible(page);
});

test("les écrans des candidats ne débordent jamais à 390 et 412 px, même avec des textes longs", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  await freshRecruiter(page, "rx-candidats-largeur", "hire.cv_analysis");
  const { jobId, talent } = await offerWithApplicant(
    page,
    browser,
    baseURL,
    isMobile,
    "Responsable régional de l'analyse des données et des partenariats institutionnels (fictif)",
  );
  await talent.context().close();
  await page.goto(`/app/hire/candidats?offre=${jobId}`);
  await openCandidateFile(page, /Jean-Pierre Démo/);
  const file = page.url().split("?")[0]!;
  await page.getByRole("button", { name: "Résumer avec Orbi" }).click();
  await expect(page.getByRole("dialog", { name: "Analyse du dossier" })).toBeVisible();
  const paths = [
    `/app/hire/candidats?offre=${jobId}`,
    `/app/hire/candidats?offre=${jobId}&dossier=lettre,nonlues&min=85`,
    file,
    `${file}/decision`,
    `${file}/decision?issue=rejected`,
    `${file}/decision?issue=hired&ton=formel`,
    `${file}/decision?issue=withdrawn`,
  ];
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    for (const path of paths) {
      await page.goto(path);
      await expect(main(page).first()).toBeVisible();
      await expect(page.getByRole("heading", { name: "Page introuvable" })).toHaveCount(0);
      await page.evaluate(() =>
        document.querySelectorAll("main details").forEach((item) => item.setAttribute("open", "")),
      );
      const [scroll, client] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scroll, `${path} à ${width} px`).toBe(client);
    }
  }
  // « Décision enregistrée » too.
  await page.goto(`${file}/decision?issue=rejected`);
  await main(page).getByRole("button", { name: "Confirmer et envoyer" }).click();
  await expect(page.getByRole("heading", { name: "Décision enregistrée" })).toBeVisible();
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `décision enregistrée à ${width} px`).toBe(client);
  }
});
