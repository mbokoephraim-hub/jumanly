import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { capture, CAPTURE_VIEWPORT } from "./captures";
import {
  expectStep,
  nextStep,
  phoneRecruiterAccount,
  phoneRecruiterFirstSteps,
} from "./recruiter-phone";
import { testEmail } from "./session";

// Modèle B recruteur, lot M2 (docs/modele-b-recruteur, section 01): the recruiter's welcome, the
// sign-up and the profile in seven steps on a phone. Baobab Fintech is fictional (seed).

const signUp = phoneRecruiterAccount;
const next = nextStep;
const step = expectStep;
const firstSteps = phoneRecruiterFirstSteps;

test.describe("Modèle B recruteur · inscription au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");
  test.use(CAPTURE_VIEWPORT);

  test("bienvenue recruteur, inscription et connexion : chaque bouton ouvre quelque chose", async ({
    page,
  }) => {
    await page.goto("/decouvrir?profil=rh");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Votre offre en ligne en 5 minutes",
      { timeout: 10_000 },
    );
    await capture(page, "003-bienvenue");
    await expectAccessible(page);
    // The screens follow one another by themselves; a touch on a dot stops them (27/10/2026).
    await page.getByRole("button", { name: /^Écran 1/ }).click();
    await page.getByRole("button", { name: "Écran suivant" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Toutes vos candidatures au même endroit",
    );
    await capture(page, "004-bienvenue-2");
    await page.getByRole("button", { name: /^Écran 3/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Entretiens, décisions, réponses",
    );
    await capture(page, "005-bienvenue-3");
    await expectAccessible(page);

    await page.getByRole("link", { name: "S'inscrire" }).click();
    await expect(page).toHaveURL(/\/inscription\?profil=rh$/);
    await expect(page.getByRole("heading", { name: "Créer votre compte recruteur" })).toBeVisible();
    await capture(page, "006-inscription");
    await expectAccessible(page);
    await page.getByRole("button", { name: "Conditions" }).click();
    const legal = page.getByRole("dialog");
    await expect(
      legal.getByText("Orbi recommande, vous décidez : aucun refus automatique."),
    ).toBeVisible();
    await capture(page, "009-conditions");
    await legal.getByRole("button", { name: "J'ai compris" }).click();
    await expect(page.locator(".nb-feuille")).toHaveCount(0);
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page).toHaveURL(/\/inscription\?profil=rh$/);
    await expect(page.locator(".nb-erreur")).toBeVisible();

    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/connexion\?profil=rh$/);
    await expect(
      page.getByText("Connectez-vous pour retrouver vos offres et vos candidatures."),
    ).toBeVisible();
    await capture(page, "012-connexion");
    await page.getByRole("link", { name: "Retour" }).click();
    await expect(page).toHaveURL(/\/decouvrir\?profil=rh$/);
  });

  test("profil en sept étapes, demande de rattachement, puis l'espace", async ({ page }) => {
    test.setTimeout(120_000);
    const email = testEmail("rh-modele-b");
    await signUp(page, email);

    // Step 1: the name is required; the photo sheet opens and closes.
    await step(page, 1);
    await expect(page.getByText("Étape 1 sur 7 · Vous")).toBeVisible();
    await page.getByLabel("Prénom").fill("");
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByRole("button", { name: "Ajouter une photo" }).click();
    await expect(page.getByRole("dialog", { name: "Photo" })).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await page.getByLabel("Prénom").fill("Nadia");
    await page.getByLabel("Nom", { exact: true }).fill("Fictive");
    await capture(page, "014-profil-vous");
    await expectAccessible(page);
    await next(page).click();

    // Step 2: the country sheet opens and closes; the city, another city.
    await step(page, 2);
    await page.getByRole("button", { name: /Changer de pays/ }).click();
    const countries = page.getByRole("dialog", { name: "Votre pays" });
    await countries.getByRole("textbox").fill("seneg");
    await expect(countries.getByRole("button", { name: /Sénégal/ })).toBeVisible();
    await countries.getByRole("textbox").fill("");
    await capture(page, "016-profil-pays");
    await countries.locator(".nb-fermer").click();
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page
      .getByRole("group", { name: "Dans quelle ville ?" })
      .getByRole("button", { name: "Kinshasa" })
      .click();
    const also = page.getByRole("group", { name: "Vous recrutez aussi à" });
    await also.getByRole("button", { name: "Lubumbashi" }).click();
    await expect(also.getByRole("button", { name: "Lubumbashi" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await capture(page, "015-profil-ville");
    await expectAccessible(page);
    await next(page).click();

    // Step 3: the work e-mail (taken from the account), the number and its code, who sees them.
    await step(page, 3);
    await expect(page.getByLabel(/E-mail professionnel/)).toHaveValue(email);
    await page.getByLabel(/Téléphone/).fill("812");
    await expect(page.locator("#rh-tel-err")).toBeVisible();
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await step(page, 3);
    await page.getByLabel(/Téléphone/).fill("812 345 678");
    await page.getByRole("button", { name: /^Indicatif/ }).click();
    const dial = page.getByRole("dialog", { name: "Indicatif du numéro" });
    await capture(page, "018-profil-indicatif");
    await dial.getByRole("textbox").fill("seneg");
    await dial.getByRole("button", { name: /Sénégal/ }).click();
    await expect(page.getByRole("button", { name: /^Indicatif/ })).toContainText("+221");
    await page.getByRole("switch", { name: "Ce numéro est aussi sur WhatsApp" }).click();
    await page.getByRole("textbox", { name: /LinkedIn/ }).fill("linkedin.com/in/nadia-fictive");
    await page.getByRole("radio", { name: /Personne/ }).click();
    await expect(page.getByRole("radio", { name: /Personne/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await capture(page, "017-profil-contacts");
    await expectAccessible(page);
    await next(page).click();

    // Step 4: the role fills the job title; a suggestion replaces it.
    await step(page, 4);
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByRole("radio", { name: /Chargé·e de recrutement/ }).click();
    await expect(page.getByLabel(/Votre poste/)).not.toHaveValue("");
    await page.locator(".nb-rh-suggestions .nb-chip-c").nth(1).click();
    await capture(page, "019-profil-role");
    await expectAccessible(page);
    await next(page).click();

    // Step 5: independent and back, the page sheet, then a request sent, cancelled and sent again.
    await step(page, 5);
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByRole("button", { name: "Je recrute en indépendant·e" }).click();
    await expect(page.getByText("Vous recrutez en indépendant·e")).toBeVisible();
    await page.getByRole("button", { name: "Choisir plutôt une entreprise" }).click();
    await page.getByRole("button", { name: /Mon entreprise n'est pas sur Jumanly/ }).click();
    const create = page.getByRole("dialog", { name: "Créer la page de l'entreprise" });
    await capture(page, "024-profil-creer");
    await create.getByRole("button", { name: "Créer la page" }).click();
    await expect(create.getByRole("alert")).toBeVisible();
    await create.getByRole("button", { name: "Annuler" }).click();

    const search = page.getByRole("textbox", { name: "Rechercher votre entreprise" });
    await search.fill("Baobab");
    await expect(page.locator(".nb-rh-org-ligne", { hasText: "Baobab Fintech" })).toBeVisible();
    await capture(page, "020-profil-entreprise");
    await page.locator(".nb-rh-org-ligne", { hasText: "Baobab Fintech" }).click();
    await expect(page.getByText("Sur Jumanly", { exact: true })).toBeVisible();
    await capture(page, "021-profil-entreprise-trouvee");
    await page.getByRole("button", { name: "Choisir une autre entreprise" }).click();
    await search.fill("Baobab");
    await page.locator(".nb-rh-org-ligne", { hasText: "Baobab Fintech" }).click();
    await expectAccessible(page);
    await page.getByRole("button", { name: "Demander à rejoindre la page" }).click();
    const join = page.getByRole("dialog", { name: /Rejoindre Baobab Fintech/ });
    await expect(join.getByLabel(/message/i)).not.toHaveValue("");
    await capture(page, "022-profil-demande");
    await join.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page.getByText("Demande envoyée", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Annuler la demande" }).click();
    await expect(search).toBeVisible();
    await search.fill("Baobab");
    await page.locator(".nb-rh-org-ligne", { hasText: "Baobab Fintech" }).click();
    await page.getByRole("button", { name: "Demander à rejoindre la page" }).click();
    await page.getByRole("button", { name: "Envoyer la demande" }).click();
    await expect(page.getByText("En attente de validation")).toBeVisible();
    await capture(page, "023-profil-attente");
    await expectAccessible(page);
    await next(page).click();

    // Step 6: at least one domain; levels and volume.
    await step(page, 6);
    await next(page).click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByRole("button", { name: "Data" }).click();
    await page.getByRole("button", { name: "Finance" }).click();
    await expect(page.getByText("2 domaines", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Junior" }).click();
    await page.getByRole("radio", { name: "6 à 20" }).click();
    await capture(page, "025-profil-recrute");
    await expectAccessible(page);
    await next(page).click();

    // Step 7: the preview, Orbi's proposals, the badge.
    await step(page, 7);
    await expect(page.locator(".nb-rh-apercu")).toContainText("Nadia Fictive");
    await page.getByRole("button", { name: "Orbi propose une accroche" }).click();
    const orbi = page.getByRole("dialog", { name: "Votre accroche" });
    await capture(page, "027-profil-orbi");
    await orbi.locator(".nb-q").first().click();
    await expect(page.getByLabel("Votre phrase d'accroche")).not.toHaveValue("");
    await capture(page, "026-profil-apercu");
    const badge = page.getByRole("switch", { name: /Recrute en ce moment/ });
    await badge.click();
    await expect(badge).toHaveAttribute("aria-checked", "false");
    await badge.click();
    await expectAccessible(page);
    await next(page).click();

    // Notifications, then « Profil prêt »: the logo waits for Baobab Fintech's answer.
    await expect(
      page.getByRole("heading", { name: "Ne laissez aucun candidat sans réponse" }),
    ).toBeVisible();
    await capture(page, "028-notifications-activer");
    await page.getByRole("button", { name: "Plus tard" }).click();
    await expect(page.getByRole("heading", { name: "Bienvenue, Nadia" })).toBeVisible();
    await expect(page.getByText(/Baobab Fintech/).first()).toBeVisible();
    await capture(page, "029-pret");
    await expectAccessible(page);
    await page.getByRole("button", { name: /Modifier mes réponses/ }).click();
    await step(page, 1);
    await expect(page.getByLabel("Prénom")).toHaveValue("Nadia");
    for (let index = 1; index < 7; index++) {
      await next(page).click();
      await step(page, index + 1);
    }
    await next(page).click();
    await page.getByRole("button", { name: "Plus tard" }).click();
    await page.getByRole("button", { name: "Entrer dans Jumanly" }).click();
    await expect(page).toHaveURL(/\/app\/hire/, { timeout: 20_000 });
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
    // A finished profile opens on « Profil prêt », never on step 1 again.
    await page.goto("/app/bienvenue");
    await expect(page.getByRole("heading", { name: "Bienvenue, Nadia" })).toBeVisible();
  });

  test("créer la page de l'entreprise : la personne l'administre", async ({ page }) => {
    test.setTimeout(90_000);
    await signUp(page, testEmail("rh-page"));
    await firstSteps(page, "Joël");
    await page.getByRole("button", { name: /Mon entreprise n'est pas sur Jumanly/ }).click();
    const create = page.getByRole("dialog", { name: "Créer la page de l'entreprise" });
    const name = `Atelier Fictif ${Date.now()}`;
    await create.getByLabel("Nom de l'entreprise").fill(name);
    await create.getByRole("radio", { name: "51 à 200" }).click();
    await expectAccessible(page);
    await create.getByRole("button", { name: "Créer la page" }).click();
    await expect(page.getByText("Page créée par vous")).toBeVisible();
    await next(page).click();
    await step(page, 6);
    await page.getByRole("button", { name: "Tech" }).click();
    await next(page).click();
    await step(page, 7);
    await next(page).click();
    await page.getByRole("button", { name: "Plus tard" }).click();
    await expect(page.getByRole("heading", { name: "Bienvenue, Joël" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Inviter/ })).toBeVisible();
    await capture(page, "030-pret-page-creee");
    await page.getByRole("button", { name: "Entrer dans Jumanly" }).click();
    await expect(page).toHaveURL(/\/app\/hire/, { timeout: 20_000 });
  });
});
