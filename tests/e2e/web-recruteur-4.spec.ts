import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, slugOf } from "./offer-flow";
import { finishOnboarding, logIn, signUpWithEmail, testEmail } from "./session";

// Web recruteur 4 (docs/refonte-web/recruteur-4) : l'ATS d'une offre sur un ordinateur (tête de
// l'offre et ses quatre rubriques, deux colonnes), le profil pour l'offre avec ses actions, la
// liste des retenus, la réponse groupée avec son aperçu et l'e-mail tel qu'il part, les fenêtres
// de confirmation (proposition envoyée, proposition acceptée), les menus ancrés de la messagerie,
// la demande pour rejoindre, l'export du rapport et les notifications de l'ordinateur.
// Orbi recommande, la personne décide : rien n'est rejeté ni envoyé sans son geste.

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

const main = (page: Page) => page.locator("main").filter({ visible: true });

/** No horizontal scroll at the widths of a computer and a tablet. */
async function noOverflow(page: Page, label: string) {
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `${label} à ${width} px`).toBe(client);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

function freshRecruiter(prefix: string, entitlement: string, organization?: string) {
  const email = testEmail(prefix);
  const org = organization ?? `Entreprise fictive ${suffix()}`;
  execFileSync("pnpm", [
    "exec",
    "tsx",
    "tests/e2e/make-recruiter.ts",
    email,
    org,
    "verified",
    entitlement,
  ]);
  return { email, org };
}

test("web recruteur 4 : ATS en deux colonnes, profil pour l'offre, retenus, réponse et son e-mail", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { email } = freshRecruiter("rx-web4", "hire.cv_analysis");
  await logIn(page, email, undefined, "/app/hire");
  const title = `Analyste de données fictif ${suffix()}`;
  const detail = await fillOffer(page, {
    title,
    description: "Poste fictif de test : suivre les indicateurs d'agences imaginaires.",
    responsibilities: ["Suivre les indicateurs", "Présenter les résultats"],
    skill: "Analyse de données",
  });
  await publishFilledOffer(page, "Publier");
  const slug = await slugOf(page);
  const jobId = detail.split("/").pop()!;
  // One applicant, a seeded and obviously fictional talent: applying stays free.
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

  // 1. Mes offres: « Analyser (ATS) » explained once under the grid, dark next to Candidatures.
  await page.goto("/app/hire/offres");
  await expect(main(page).locator(".t-rw-atsl")).toContainText("Analyser (ATS) :");

  // 2. The ATS: the offer's head (its title as the page title), its four parts, then the launch.
  await page.goto(`/app/hire/offres/${jobId}/ats`);
  await expect(
    main(page).getByRole("heading", { level: 1, name: title, exact: true }),
  ).toBeVisible();
  const tabs = main(page).getByRole("navigation", { name: "Rubriques de l'offre" });
  await expect(tabs.getByRole("link", { name: "Analyse (ATS)" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(tabs.getByRole("link", { name: /^Candidatures/ })).toContainText("1");
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await expectAccessible(page);
  await noOverflow(page, "ATS avant l'analyse");
  // The « … » menu opens under its button, with the list of the retained.
  await main(page).getByRole("button", { name: "Plus d'actions sur l'offre" }).click();
  const menu = page.getByRole("dialog").filter({ visible: true });
  await expect(menu.getByRole("link", { name: /Liste des retenus/ })).toBeVisible();
  await page.keyboard.press("Escape");
  // Nothing starts without the recruiter: « Analyser », then « Quand analyser ? ».
  await main(page).getByRole("button", { name: "Analyser", exact: true }).click();
  const when = page.getByRole("dialog", { name: "Quand analyser ?" });
  await when.getByRole("button", { name: "Lancer l'analyse" }).click();
  await expect(main(page).getByRole("navigation", { name: "Vues des candidatures" })).toBeVisible({
    timeout: 60_000,
  });
  await page.goto(`/app/hire/offres/${jobId}/ats?vue=tous`);
  // Nobody is set aside: the file stays in « À vérifier » and « Tous ».
  await expect(main(page)).toContainText("personne n'est écarté");
  await expect(main(page)).toContainText("Jean-Pierre");
  await expectAccessible(page);
  await noOverflow(page, "ATS classé");

  // 3. The profile for the offer: the actions in a card on the right, no bar at the bottom.
  await main(page)
    .getByRole("link", { name: /Jean-Pierre/ })
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`/ats/[^/?]+$`));
  const profile = main(page);
  await expect(profile.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
  await expect(profile).toContainText("Synthèse d'Orbi");
  await expect(profile.getByRole("table")).toBeVisible();
  await expect(profile.getByRole("link", { name: "Ouvrir le dossier complet" })).toBeVisible();
  await expect(profile.getByRole("link", { name: /^Écrire à Jean-Pierre/ })).toBeVisible();
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await expectAccessible(page);
  await noOverflow(page, "profil pour l'offre");
  await profile.getByRole("button", { name: "Ajouter aux retenus" }).click();
  await expect(
    page.getByText("Ajouté·e aux retenus").filter({ visible: true }).first(),
  ).toBeVisible();

  // 4. The retained: the list on the left, what comes next on the right.
  await page.goto(`/app/hire/offres/${jobId}/retenus`);
  const list = main(page);
  await expect(
    list.getByRole("navigation", { name: "Rubriques de l'offre" }).getByRole("link", {
      name: /^Retenus/,
    }),
  ).toHaveAttribute("aria-current", "page");
  await expect(list.getByRole("heading", { level: 2, name: /^Liste des retenus/ })).toBeVisible();
  await expect(list).toContainText("Jean-Pierre");
  await expect(list.getByText("Ensuite", { exact: true })).toBeVisible();
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await expectAccessible(page);
  await noOverflow(page, "retenus");

  // 5. The grouped reply: the template on the left, the preview of each person on the right.
  await page.goto(`/app/hire/offres/${jobId}/reponses?groupe=retenus`);
  const replies = main(page);
  await expect(
    replies.getByRole("heading", { level: 1, name: "Répondre aux candidats", exact: true }),
  ).toBeVisible();
  await expect(replies.getByText("Aperçu · 1 sur 1", { exact: true })).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "réponse groupée");
  // « Voir le message et l'e-mail »: the message in Jumanly and the e-mail exactly as it leaves.
  await replies.getByRole("button", { name: "Voir le message et l'e-mail" }).click();
  const window = page.getByRole("dialog", { name: "Aperçu du message" }).filter({ visible: true });
  await expect(window).toContainText("Jean-Pierre");
  const mail = window.frameLocator("iframe");
  await expect(mail.locator("body")).toContainText("Jean-Pierre", { timeout: 20_000 });
  // The talent's address is never shown.
  await expect(mail.locator("body")).not.toContainText("jeanpierre.ux@");
  await page.keyboard.press("Escape");
  // Nothing leaves before « J'ai relu »: without it, « Envoyer » only asks to read first.
  await replies.getByRole("button", { name: /^Envoyer à 1 personne/ }).click();
  await expect(page.getByRole("dialog", { name: "Envoyer 1 réponse ?" })).toBeHidden();

  // The preview's route: the organisation's offers only.
  const outside = await page.request.post("/api/hire/reponses/apercu", {
    data: {
      job: "offre-inconnue",
      group: "retenus",
      ids: [],
      application: "inconnue",
      body: "Bonjour",
    },
  });
  expect([403, 404]).toContain(outside.status());
});

test("web recruteur 4 : proposition envoyée puis acceptée, menus ancrés de la messagerie", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Fenêtres de l'ordinateur et de la tablette.");
  test.setTimeout(300_000);
  // A talent visible to recruiters, alone in a city no one else has.
  const city = `Ville${suffix()}${suffix()}`;
  const context = await browser.newContext({ baseURL });
  const talent = await context.newPage();
  await talent.goto("/inscription?profil=talent");
  await signUpWithEmail(talent, testEmail("web4-visible"), "Neema Fictive");
  await finishOnboarding(talent, { country: "Congo", city });
  await talent.goto("/app/parametres/confidentialite");
  await talent.getByRole("button", { name: /Qui voit mon profil/ }).click();
  await talent.getByRole("radio", { name: /Visible des recruteurs/ }).check({ force: true });
  await talent.getByRole("button", { name: "Enregistrer" }).click();
  await expect(talent.getByText("C'est enregistré.")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  const { email } = freshRecruiter("rx-web4-prop", "hire.scorecards");
  await logIn(page, email, undefined, "/app/hire");
  await fillOffer(page, {
    title: `Chargé de clientèle fictif ${suffix()}`,
    description: "Poste fictif de test : accueillir une clientèle imaginaire.",
    responsibilities: ["Accueillir la clientèle"],
    skill: "Bureautique",
  });
  await publishFilledOffer(page, "Publier");

  // « Proposer l'offre », then the window « Proposition envoyée » and its three steps.
  await page.goto(`/app/hire/candidats?vue=talents&lieu=${city}&offre=aucune`);
  await main(page)
    .getByRole("link", { name: /Consulter le profil de Neema/ })
    .first()
    .click();
  await main(page)
    .getByRole("navigation", { name: "Actions sur ce profil" })
    .getByRole("link", { name: "Proposer l'offre" })
    .click();
  await expect(page).toHaveURL(/\/proposer/);
  await main(page).getByRole("button", { name: "Envoyer à Neema" }).click();
  await expect(page).toHaveURL(/ok=proposee/);
  const sent = page.getByRole("dialog", { name: "Proposition envoyée à Neema" });
  await expect(sent).toBeVisible();
  await expect(sent).toContainText("Neema décide");
  await expect(sent).toContainText("Seulement si la proposition est acceptée");
  await expect(sent.getByRole("link", { name: "Voir mes propositions" })).toBeVisible();
  await expectAccessible(page);
  await noOverflow(page, "proposition envoyée");
  await page.keyboard.press("Escape");

  // The talent accepts: the recruiter's news opens the conversation on « … a accepté ».
  await talent.goto("/app/messages");
  await talent
    .getByRole("button", { name: /souhaite échanger avec vous/ })
    .first()
    .click();
  await talent.getByRole("dialog").getByRole("button", { name: "Accepter et échanger" }).click();
  await expect(talent).toHaveURL(/\/app\/messages\/[^/?]+\?ok=relation/);
  const conversation = new URL(talent.url()).pathname;
  await context.close();

  // The news of the bell leads to the conversation with « acceptee=1 ».
  await expect
    .poll(async () => {
      const response = await page.request.get("/api/notifications");
      const data = (await response.json()) as { items: { href: string | null }[] };
      return data.items.some((item) => item.href === `${conversation}?acceptee=1`);
    })
    .toBe(true);
  await page.goto(`${conversation}?acceptee=1`);
  const accepted = page.getByRole("dialog", { name: "Neema a accepté votre proposition" });
  await expect(accepted).toBeVisible();
  await expect(accepted.getByRole("link", { name: "Profil" })).toBeVisible();
  await expectAccessible(page);
  await accepted.getByRole("button", { name: "Écrire à Neema" }).click();
  await expect(accepted).toBeHidden();

  // The conversation's options and « + » open as menus under their buttons.
  await page.getByRole("button", { name: "Options de la conversation" }).click();
  const options = page.getByRole("dialog", { name: "Options" });
  await expect(options).toBeVisible();
  await expect(options).toHaveClass(/t-rx-ancre/);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Créneaux, documents, modèles" }).click();
  const plus = page.getByRole("dialog", { name: "Ajouter à la conversation" });
  await expect(plus).toBeVisible();
  await expect(plus).toHaveClass(/t-rx-ancre/);
  await page.keyboard.press("Escape");
  await noOverflow(page, "conversation");
});

test("web recruteur 4 : exporter le rapport, notifications de l'ordinateur, demande pour rejoindre", async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "Fenêtres de l'ordinateur et de la tablette.");
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  // A first word no other company has: the search by name finds this one only.
  const { email, org } = freshRecruiter(
    "rx-web4-rap",
    "reports.export",
    `Fictivia${suffix()} Services`,
  );
  await logIn(page, email, undefined, "/app/hire");

  // « Exporter en PDF » opens the window: period, offers, content, then the PDF.
  await page.goto("/app/hire/rapports");
  await main(page).getByRole("button", { name: "Exporter en PDF" }).click();
  const exporting = page.getByRole("dialog", { name: "Exporter le rapport en PDF" });
  await expect(exporting).toBeVisible();
  await expect(exporting.getByRole("switch", { name: /Chiffres clés et étapes/ })).toBeDisabled();
  await expectAccessible(page);
  await exporting.getByText("Trimestre", { exact: true }).click();
  await exporting.getByText("Lecture d’Orbi", { exact: true }).click();
  await expect(exporting.getByRole("switch", { name: /Lecture d’Orbi/ })).not.toBeChecked();
  const download = page.waitForEvent("download");
  await exporting.getByRole("button", { name: "Télécharger le PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^rapport-\d{4}-\d{2}-\d{2}\.pdf$/);
  const asked = new URL(file.url());
  expect(asked.searchParams.get("periode")).toBe("90d");
  expect(asked.searchParams.getAll("lecture").at(-1)).toBe("0");
  expect(asked.searchParams.getAll("offres").at(-1)).toBe("1");
  const pdf = await page.request.get(file.url());
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  await noOverflow(page, "rapports");

  // Notifications of the computer: asked only when the member turns them on, in the settings.
  // The CI's headless browser has no usable Notification API (the switch would stay disabled):
  // a stand-in behaves as a browser where the member has allowed them.
  await page.addInitScript(() => {
    class GrantedNotification {
      static permission = "granted";
      static requestPermission = async () => "granted";
    }
    Object.defineProperty(window, "Notification", {
      value: GrantedNotification,
      configurable: true,
      writable: true,
    });
  });
  await page.goto("/app/parametres/notifications");
  const desk = main(page).getByRole("switch", { name: /Notifications de l'ordinateur/ });
  await expect(desk).not.toBeChecked();
  await main(page).getByText("Notifications de l'ordinateur", { exact: true }).click();
  await expect(desk).toBeChecked();
  await page.reload();
  await expect(desk).toBeChecked();
  await expectAccessible(page);

  // Someone of the same company asks to join it rather than making a duplicate.
  const joiner = freshRecruiter("rx-web4-join", "reports.export", org);
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } });
  const other = await context.newPage();
  await logIn(other, joiner.email, undefined, "/app/hire");
  await other.goto("/app/bienvenue?etape=organisation");
  // The first steps live outside the frame (no `main`): the join block is read by its class.
  const join = other.locator(".t-rw-rej").filter({ visible: true });
  await join
    .getByRole("button", { name: /Demander à rejoindre/ })
    .first()
    .click();
  const steps = other.getByRole("list", { name: "Étapes de la demande" });
  await expect(steps).toBeVisible();
  await expect(steps).toContainText("L'admin choisit votre rôle");
  await expectAccessible(other);
  await join.getByRole("button", { name: "Annuler la demande" }).click();
  await expect(steps).toHaveCount(0);
  await context.close();
});
