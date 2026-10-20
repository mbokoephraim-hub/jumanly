import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { demo, logIn, testEmail } from "./session";

// Recruiter space, lot 2 (docs/refonte-mobile, brief recruteur § 2 and planches recruteur-1):
// À traiter, Mes offres, the four steps of an offer, its detail, pause, resume and closing.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

/** A fresh, obviously fictional company (Free: one active offer) and its owner, signed in. */
async function freshRecruiter(page: Page, prefix: string, unverified = false) {
  const email = testEmail(prefix);
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    `Entreprise fictive ${suffix()}`,
    ...(unverified ? ["unverified"] : []),
  ]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");
  return email;
}

const main = (page: Page) => page.locator("main").filter({ visible: true });

async function openMenu(page: Page, title: string) {
  await main(page)
    .getByRole("button", { name: `Actions sur l'offre ${title}` })
    .first()
    .click();
  const sheet = page.getByRole("dialog", { name: title });
  await expect(sheet).toBeVisible();
  return sheet;
}

test("une offre en 4 étapes : publiée, en pause, reprise puis clôturée", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.setTimeout(300_000);
  await freshRecruiter(page, "rx-offres");
  // Nothing waits yet: « Rien à traiter », and the way to publish.
  await expect(main(page)).toContainText("Rien à traiter pour l'instant");

  const first = `Analyste crédit fictif ${suffix()}`;
  const question = "Êtes-vous disponible avant le 1er décembre ?";
  await fillOffer(page, {
    title: first,
    salary: ["600", "900"],
    description: "Poste fictif de test : analyser les dossiers de crédit des petites entreprises.",
    responsibilities: ["Analyser les dossiers de crédit", "Suivre les remboursements"],
    skill: "Analyse de données",
    question,
  });
  // « Vérifier et publier »: the question is shown, and never blocks an application.
  await expect(main(page)).toContainText(question);
  await expectAccessible(page);
  const { detailUrl } = await publishFilledOffer(page, "Publier");
  await expect(main(page)).toContainText("Offre publiée");
  await expectAccessible(page);
  const slug = await slugOf(page);

  // The detail: figures, stages by default, and a typed history.
  await main(page).getByRole("link", { name: "Voir l'offre" }).click();
  await expect(page).toHaveURL(new RegExp(`${detailUrl}$`));
  await expect(main(page).getByRole("heading", { level: 2, name: first })).toBeVisible();
  const stages = main(page).locator("details").filter({ hasText: "Étapes" });
  for (const stage of ["Reçue", "En examen", "Présélectionnée", "Entretien", "Décision finale"])
    await expect(stages).toContainText(stage);
  await main(page).getByText("Historique", { exact: true }).click();
  await expect(main(page).locator(".t-rx-hist")).toContainText("Publication");
  await expectAccessible(page);

  // « Pause »: a paused offer no longer holds the only place of the Free plan.
  await main(page).getByRole("button", { name: "Pause", exact: true }).click();
  await expect(
    page.getByText("Offre mise en pause. Ses candidatures restent.").first(),
  ).toBeVisible();
  await expect(main(page).locator(".t-rx-odh")).toContainText("En pause");

  const second = `Chargée de clientèle fictive ${suffix()}`;
  await fillOffer(page, {
    title: second,
    description: "Poste fictif de test : accueillir et conseiller la clientèle en agence.",
    responsibilities: ["Accueillir la clientèle"],
    skill: "Bureautique",
  });
  await publishFilledOffer(page, "Publier");
  await expect(main(page)).toContainText("Offre publiée");

  // Resuming the first one now meets the limit: nothing changes, the recruiter is told.
  await page.goto(detailUrl);
  await main(page).getByRole("button", { name: "Reprendre", exact: true }).click();
  await expect(main(page)).toContainText("En pause");
  await expect(page).toHaveURL(/limite=/);

  // A third offer cannot go live either: the limit screen, with what it would take.
  await fillOffer(page, {
    title: `Comptable fictif ${suffix()}`,
    description: "Poste fictif de test : tenir la comptabilité générale d'une agence.",
    responsibilities: ["Tenir les journaux"],
    skill: "Comptabilité générale",
  });
  await page.getByRole("button", { name: "Publier", exact: true }).click();
  const limit = page.getByRole("dialog", { name: "Limite d'offres actives atteinte" });
  await expect(limit).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press("Escape");

  // Mes offres: the menu closes the second offer, after a confirmation.
  await page.goto("/app/hire/offres");
  await expect(main(page)).toContainText(second);
  const menu = await openMenu(page, second);
  await menu.getByRole("button", { name: /^Clôturer/ }).click();
  const confirm = page.getByRole("dialog", { name: "Clôturer cette offre ?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Clôturer", exact: true }).click();
  await expect(page).toHaveURL(/onglet=cloturees/);
  await expect(
    page.getByText("Offre clôturée. Ses dossiers restent consultables.").first(),
  ).toBeVisible();

  // « En pause »: the menu resumes the first offer, now that a place is free.
  await page.goto("/app/hire/offres?onglet=pause");
  const paused = await openMenu(page, first);
  await paused.getByRole("button", { name: /^Reprendre/ }).click();
  await expect(
    page.getByText("Offre reprise : elle est de nouveau visible.").first(),
  ).toBeVisible();

  // A talent applies; the question is optional and the answer reaches the recruiter.
  const context = await browser.newContext({
    baseURL,
    isMobile,
    viewport: isMobile ? { width: 412, height: 915 } : undefined,
  });
  const talent = await context.newPage();
  await logIn(talent, demo.talentFree);
  await talent.goto(`/app/jobs/${slug}/postuler`);
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=lettre/);
  const asked = talent.locator("fieldset").filter({ hasText: "Questions du recruteur" });
  await expect(asked).toContainText("ne bloque pas votre candidature");
  await asked.getByText("Oui", { exact: true }).click();
  await talent.getByRole("button", { name: "Continuer" }).click();
  await expect(talent).toHaveURL(/etape=verification/);
  await talent.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(talent.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await context.close();

  await page.goto("/app/hire");
  await expect(main(page)).toContainText("Amani Fictif");
  await main(page)
    .getByRole("link", { name: /Examiner/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/candidats\//);
  await expect(page.locator("#reponses")).toContainText(question);
  await expect(page.locator("#reponses")).toContainText("Oui");
});

test("une organisation pas encore vérifiée envoie son offre en validation", async ({ page }) => {
  test.setTimeout(180_000);
  await freshRecruiter(page, "rx-validation", true);
  const title = `Assistant logistique fictif ${suffix()}`;
  await fillOffer(page, {
    title,
    description: "Poste fictif de test : préparer les expéditions et suivre les stocks.",
    responsibilities: ["Préparer les expéditions"],
    skill: "Bureautique",
  });
  await publishFilledOffer(page, "Envoyer en validation");
  await expect(main(page)).toContainText("Offre envoyée en validation");
  await page.goto("/app/hire/offres");
  const card = main(page).locator("article").filter({ hasText: title });
  await expect(card).toContainText("En validation");
});

test("les écrans des offres ne débordent jamais à 390 et 412 px, même avec des textes longs", async ({
  page,
}) => {
  test.setTimeout(240_000);
  await freshRecruiter(page, "rx-largeur");
  const title =
    "Responsable régional de la transformation numérique et des partenariats institutionnels (fictif)";
  const detail = await fillOffer(page, {
    title,
    city: "Mbuji-Mayi, Kasaï-Oriental, quartier Dibindi-Bonzola-Lukelenge",
    country: "République démocratique du Congo",
    salary: ["950000", "1000000"],
    description: `Poste fictif de test. ${"Coordinationinterinstitutionnelleetdéveloppementterritorial ".repeat(4)}`,
    responsibilities: [
      "Piloterlesprogrammesdetransformationnumériquedesagencesrégionalesetdespartenaires",
      "Animer le réseau des partenaires institutionnels et préparer les comités de pilotage trimestriels",
    ],
    skill: "Analyse de données",
    question:
      "Avez-vous déjà piloté un programme réunissant plus de dix partenaires institutionnels ?",
  });
  await publishFilledOffer(page, "Publier");
  const id = detail.split("/").pop()!;
  const paths = [
    "/app/hire",
    "/app/hire/offres",
    "/app/hire/offres/nouvelle",
    `/app/hire/offres/${id}?publiee=1`,
    `/app/hire/offres/${id}`,
    `/app/hire/offres/${id}/modifier?etape=1`,
    `/app/hire/offres/${id}/modifier?etape=2`,
    `/app/hire/offres/${id}/modifier?etape=3`,
    `/app/hire/offres/${id}/modifier?etape=4`,
  ];
  for (const width of [390, 412]) {
    await page.setViewportSize({ width, height: 860 });
    for (const path of paths) {
      await page.goto(path);
      await expect(main(page).first()).toBeVisible();
      // Open sections show what they hold: the history and the skills too.
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
});
