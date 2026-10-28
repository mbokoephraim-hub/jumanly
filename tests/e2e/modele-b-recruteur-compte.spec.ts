import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import { logIn, testEmail } from "./session";

// Modèle B recruteur, lot M8 (docs/modele-b-recruteur, mobile/captures sections 08, 09 and 11):
// Compte opened by the avatar, the recruiter's profile, the statistics, the saved posts, the
// team, the plan read only, the settings, help by e-mail, the company's page, « Changer de
// profil » and the company mode of an administrator. The company, its administrator and its
// recruiter « Nadine Fictive » are new and fictional (make-recruiter.ts, make-team.ts).
const main = (page: Page) => page.locator("main");
/** Previous screens stay mounted, hidden (Next cacheComponents): the one on screen. */
const seen = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true }).first();
const visibleLink = (page: Page, name: string | RegExp) =>
  main(page).getByRole("link", { name }).filter({ visible: true }).first();
const visibleButton = (page: Page, name: string | RegExp) =>
  main(page).getByRole("button", { name }).filter({ visible: true }).first();
const sheet = (page: Page, name: string | RegExp) => page.getByRole("dialog", { name });

async function fits(page: Page) {
  const [scroll, client] = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(scroll).toBe(client);
}

async function closeToast(page: Page) {
  const close = page
    .getByRole("region", { name: "Messages de confirmation" })
    .getByRole("button", { name: "Fermer" });
  if (await close.count()) await close.first().click();
}

async function heading(page: Page, name: string) {
  await expect(
    main(page).getByRole("heading", { name, exact: true }).filter({ visible: true }).first(),
  ).toBeVisible();
}

const suffix = () =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]/g, "")
    .slice(0, 6);

test.use(CAPTURE_VIEWPORT);

test.describe("Modèle B recruteur · Compte, entreprise et changer de profil au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("le compte d'une recruteuse, puis celui de l'administrateur", async ({ page }) => {
    test.setTimeout(360_000);
    const owner = testEmail("rx-m8-admin");
    const recruiter = testEmail("rx-m8");
    const org = `Entreprise fictive ${suffix()}`;
    const organizationId = execFileSync("pnpm", [
      "exec",
      "tsx",
      "tests/e2e/make-recruiter.ts",
      owner,
      org,
      "verified",
    ])
      .toString()
      .trim()
      .split("\n")
      .pop()!;
    execFileSync("pnpm", ["exec", "tsx", "tests/e2e/make-team.ts", organizationId, recruiter]);

    // ── The recruiter ────────────────────────────────────────────────────────────────────────
    await logIn(page, recruiter, undefined, "/app/hire");
    // The Fil shows Paramètres in place of the avatar (#184); the account keeps its address.
    await page.goto("/app/hire");
    await expect(
      page.getByRole("link", { name: "Paramètres" }).filter({ visible: true }).first(),
    ).toHaveAttribute("href", "/app/parametres");
    await page.goto("/app/hire/compte");
    await expect(seen(page, "Nadine Fictive")).toBeVisible();
    await expect(seen(page, `Rattaché·e à ${org}`)).toBeVisible();
    await expect(seen(page, "1 publication")).toBeVisible();
    await capture(page, "135-compte");
    await fits(page);
    await expectAccessible(page);

    // Changer de profil (185): recruiter, talent, the company reserved to its administrator.
    await visibleButton(page, /Changer de profil/).click();
    const profiles = sheet(page, "Changer de profil");
    await expect(profiles.getByText("Profil actuel")).toBeAttached();
    await expect(
      profiles.getByText(/Réservé à l'administrateur, Recruteuse Fictive/),
    ).toBeVisible();
    await expect(
      profiles.getByText(`Votre profil de candidat, invisible pour ${org}`),
    ).toBeVisible();
    await capture(page, "185-basculer");
    await profiles.getByText("Annuler", { exact: true }).click();
    await expect(profiles).toBeHidden();

    // Se déconnecter ? (148), then « Annuler ».
    await visibleButton(page, "Se déconnecter").click();
    const leave = sheet(page, "Se déconnecter ?");
    await expect(leave.getByText(/Vos candidatures et messages vous attendent/)).toBeVisible();
    await capture(page, "148-deconnexion");
    await leave.getByText("Annuler", { exact: true }).click();
    await expect(leave).toBeHidden();

    // Mon profil recruteur (136) and Modifier (137): Orbi proposes, the person saves.
    await visibleLink(page, /Mon profil recruteur/).click();
    await expect(page).toHaveURL(/\/app\/hire\/compte\/profil$/);
    // The recruiter's profile in the identity of the talent profile (80254d9): head, tabs, and
    // « Candidat recherché » with the recruiting fields.
    await expect(
      main(page)
        .getByRole("heading", { level: 1, name: /Nadine Fictive/ })
        .filter({ visible: true }),
    ).toBeVisible();
    await expect(
      main(page).getByRole("tablist", { name: "Sections du profil" }).filter({ visible: true }),
    ).toBeVisible();
    await expect(seen(page, "Candidat recherché")).toBeVisible();
    await capture(page, "136-compte-profil");
    await fits(page);
    await expectAccessible(page);
    await visibleLink(page, "Recrutement").click();
    await expect(page).toHaveURL(/\/profil\/modifier$/);
    await heading(page, "Modifier mon profil");
    await visibleButton(page, "Orbi propose une accroche").click();
    const hook = main(page).getByRole("textbox", { name: "Accroche" }).filter({ visible: true });
    await expect(hook).toHaveValue(/Je recrute les talents data et service client de/);
    await main(page)
      .getByRole("radio", { name: "Équipe seulement" })
      .filter({ visible: true })
      .click();
    const badge = main(page)
      .getByRole("switch", { name: "Badge « Recrute en ce moment »" })
      .filter({ visible: true });
    await expect(badge).toHaveAttribute("aria-checked", "true");
    await badge.click();
    await expect(badge).toHaveAttribute("aria-checked", "false");
    await capture(page, "137-compte-modifier");
    await expectAccessible(page);
    await badge.click();
    await visibleButton(page, "Enregistrer").click();
    await expect(page).toHaveURL(/\/app\/hire\/compte\/profil\?ok=1/);
    await expect(seen(page, /Je recrute les talents data et service client/)).toBeVisible();
    await expect(seen(page, "Profil enregistré.")).toBeVisible();
    await closeToast(page);

    // Mes statistiques (138).
    await page.goto("/app/hire/compte/statistiques");
    await heading(page, "Mes statistiques");
    await expect(seen(page, "Du dépôt à l'embauche")).toBeVisible();
    await expect(seen(page, "Les 100 % sans réponse")).toBeVisible();
    await capture(page, "138-compte-stats");
    await fits(page);
    await expectAccessible(page);
    await visibleLink(page, /Les 100 % sans réponse/).click();
    await expect(page).toHaveURL(/\/app\/hire\/candidats\?vue=decisions/);

    // Publications enregistrées (139): the signet takes one away.
    await page.goto("/app/hire/compte/enregistrees");
    await heading(page, "Publications enregistrées");
    await expect(seen(page, "Journée carrière fictive à Kinshasa")).toBeVisible();
    await capture(page, "139-compte-enregistres");
    await expectAccessible(page);
    await visibleButton(page, /Retirer « Journée carrière fictive/).click();
    await expect(seen(page, /Aucune publication enregistrée/)).toBeVisible();
    await closeToast(page);

    // Équipe (140) and Proposer un collègue (141): the request goes to the administrator.
    await page.goto("/app/hire/compte/equipe");
    await heading(page, "Équipe de recrutement");
    await expect(seen(page, "Nadine Fictive (vous)")).toBeVisible();
    await expect(seen(page, "Qui peut faire quoi")).toBeVisible();
    await capture(page, "140-equipe");
    await fits(page);
    await expectAccessible(page);
    await visibleButton(page, "Proposer un collègue").click();
    const propose = sheet(page, "Proposer un collègue");
    await expect(propose.getByText(/Recruteuse Fictive reçoit la demande/)).toBeVisible();
    await propose
      .getByRole("textbox", { name: "E-mail professionnel" })
      .fill(`collegue-${suffix()}@fictif.test`);
    await capture(page, "141-equipe-proposer");
    await propose.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page).toHaveURL(/equipe\?ok=proposed/);
    await expect(seen(page, "Demande envoyée à l'administrateur.")).toBeVisible();
    await closeToast(page);

    // Formule et usage (142): read only, a request to the administrator.
    await page.goto("/app/hire/compte/formule");
    await heading(page, "Formule et usage");
    await expect(seen(page, `Formule de ${org}`)).toBeVisible();
    await expect(seen(page, "Utilisation ce mois")).toBeVisible();
    await capture(page, "142-formule");
    await fits(page);
    await expectAccessible(page);
    const ask = visibleButton(page, /^Demander .* à Recruteuse$/);
    await ask.click();
    await expect(page).toHaveURL(/formule\?ok=asked/);
    await closeToast(page);

    // Modèles de messages (143): read, written on a computer.
    await page.goto("/app/hire/modeles");
    await heading(page, "Modèles de messages");
    await main(page).getByText("Convocation à un entretien").filter({ visible: true }).click();
    await expect(seen(page, /Texte de Jumanly, à adapter/)).toBeVisible();
    await capture(page, "143-parametres");
    await expectAccessible(page);

    // Notifications (144): a switch is saved at once.
    await page.goto("/app/hire/compte/notifications");
    await heading(page, "Notifications");
    const team = main(page)
      .getByRole("switch", { name: "Activité de l'équipe" })
      .filter({ visible: true });
    await expect(team).toHaveAttribute("aria-checked", "true");
    await team.click();
    await expect(seen(page, "Réglage enregistré.")).toBeVisible();
    await expect(team).toHaveAttribute("aria-checked", "false");
    await capture(page, "144-compte-notifications");
    await closeToast(page);
    await expectAccessible(page);
    await team.click();
    await expect(team).toHaveAttribute("aria-checked", "true");
    await closeToast(page);

    // Confidentialité (145), Langue (146), Aide (147).
    await page.goto("/app/hire/compte/confidentialite");
    await heading(page, "Confidentialité et données");
    await expect(seen(page, /Chaque profil que vous ouvrez est enregistré/)).toBeVisible();
    await expect(seen(page, "Aucun profil consulté ce mois")).toBeVisible();
    await capture(page, "145-compte-confidentialite");
    await expectAccessible(page);
    await visibleButton(page, "Quitter l'entreprise").click();
    const quit = sheet(page, `Quitter ${org} ?`);
    await expect(quit.getByText(/Rien n'est effacé/)).toBeVisible();
    await quit.getByText("Annuler", { exact: true }).click();
    await expect(quit).toBeHidden();
    await visibleLink(page, "Régler la visibilité").click();
    await expect(page).toHaveURL(/\/profil\/modifier$/);

    await page.goto("/app/hire/compte/langue");
    await heading(page, "Langue");
    await expect(main(page).getByRole("radio", { name: /Français/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(seen(page, "Bientôt disponible")).toBeVisible();
    await capture(page, "146-compte-langue");
    await expectAccessible(page);

    await page.goto("/app/hire/compte/aide");
    await heading(page, "Aide et contact");
    await main(page).getByText("Pourquoi ce score ?").filter({ visible: true }).click();
    await expect(seen(page, /n'utilise jamais le nom, l'âge, la photo/)).toBeVisible();
    await expect(visibleLink(page, "Écrire à assistant@jumanly.io")).toHaveAttribute(
      "href",
      "mailto:assistant@jumanly.io",
    );
    await capture(page, "147-aide");
    await expectAccessible(page);
    expect(await page.content()).not.toMatch(/\+\d{3}\s?\d{2,}/);

    // The company's page (149): the recruiter's own, with « Publier au nom de ».
    await page.goto("/app/hire/compte");
    await visibleLink(page, /Page de l'entreprise/).click();
    await expect(page).toHaveURL(/\/app\/entreprises\//);
    await expect(seen(page, /Votre entreprise · administrée par Recruteuse Fictive/)).toBeVisible();
    // « Publier » in the head of the page (#188), in the company's name.
    const publish = visibleLink(page, "Publier");
    await expect(publish).toBeVisible();
    await capture(page, "149-entreprise");
    await fits(page);
    await publish.click();
    await expect(page).toHaveURL(/\/app\/fil\/publier\?nom=entreprise/);

    // Changer de profil › talent (187): the talent space, the same account.
    await page.goto("/app/hire/compte");
    await visibleButton(page, /Changer de profil/).click();
    await sheet(page, "Changer de profil")
      .getByRole("button", { name: /Nadine Fictive · talent/ })
      .click();
    await expect(page).toHaveURL(/\/app$/);
    await capture(page, "187-mode-talent");

    // ── The administrator ────────────────────────────────────────────────────────────────────
    await page.context().clearCookies();
    await logIn(page, owner, undefined, "/app/hire");
    await page.goto("/app/hire/compte");
    await visibleButton(page, /Changer de profil/).click();
    const admin = sheet(page, "Changer de profil");
    await expect(admin.getByText("Agir au nom de l'entreprise : publier, répondre")).toBeVisible();
    await capture(page, "186-basculer-admin");
    await admin.getByRole("link", { name: new RegExp(org) }).click();
    await expect(page).toHaveURL(/\/app\/hire\/entreprise$/);
    await expect(seen(page, "Vous agissez au nom de l'entreprise")).toBeVisible();
    await expect(seen(page, /membres? de l'équipe/)).toBeVisible();
    await capture(page, "191-mode-entreprise");
    await fits(page);
    await expectAccessible(page);
    await main(page)
      .getByRole("navigation", { name: "Espace de l'entreprise" })
      .getByRole("link", { name: "Messages" })
      .click();
    await expect(page).toHaveURL(/onglet=messages/);
    await expect(visibleLink(page, "Ouvrir les messages")).toBeVisible();
    await capture(page, "192-mode-entreprise-messages");
    await main(page)
      .getByRole("navigation", { name: "Espace de l'entreprise" })
      .getByRole("link", { name: "Offres" })
      .click();
    await expect(visibleLink(page, "Ouvrir les offres")).toBeVisible();
    await expect(visibleLink(page, `Publier au nom de ${org}`)).toBeVisible();

    // The administrator invites at once, within the plan's places (the free plan has none left);
    // the plan is managed on a computer.
    await page.goto("/app/hire/compte/equipe");
    await expect(seen(page, "Nadine Fictive")).toBeVisible();
    await visibleButton(page, "Inviter un collègue").click();
    const invite = sheet(page, "Inviter un collègue");
    await expect(invite.getByText(/Plus de place dans la formule/)).toBeVisible();
    await invite
      .getByRole("textbox", { name: "E-mail professionnel" })
      .fill(`invite-${suffix()}@fictif.test`);
    await invite.getByRole("button", { name: "Envoyer l'invitation" }).click();
    await expect(page).toHaveURL(/equipe\?erreur=seats/);
    await expect(seen(page, /Plus de place dans la formule : l'administrateur/)).toBeVisible();
    await closeToast(page);
    await page.goto("/app/hire/compte/formule");
    await expect(
      seen(page, "Vous la gérez depuis l'administration, sur ordinateur."),
    ).toBeVisible();
    await expect(main(page).getByRole("button", { name: /^Demander/ })).toHaveCount(0);
    await page.goto("/app/hire/compte/confidentialite");
    await expect(seen(page, /Vous êtes propriétaire de la page/)).toBeVisible();

    // The requests of the recruiter reached the administrator.
    await page.goto("/app/notifications");
    await expect(seen(page, /Nadine Fictive propose d'ajouter/)).toBeVisible();
    await expect(seen(page, /Nadine Fictive demande la formule/)).toBeVisible();
  });
});
