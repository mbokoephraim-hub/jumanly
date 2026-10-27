import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { openConfirmationLink } from "./outbox";
import { PASSWORD, testEmail } from "./session";

// Modèle B, lot B2 (docs/modele-b, planche Accueil): Bienvenue, sign-up, sign-in and the first
// profile on a phone.
test.describe("Modèle B · accueil au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("ouverture longue puis courte, Bienvenue sans écran vide, et chaque bouton ouvre quelque chose", async ({
    page,
  }) => {
    // Signed out, the space opens on « Bienvenue ».
    await page.goto("/app");
    await expect(page).toHaveURL(/\/decouvrir$/);

    // The first time: the long opening, with « Bienvenue » already drawn underneath (no empty screen).
    const opening = page.getByRole("img", { name: "Jumanly, Learn. Grow. Connect." });
    await expect(opening).toBeVisible();
    await expect(page.locator(".nb-spl-long")).toBeVisible();
    await expect(page.locator(".nb-bienvenue")).toBeAttached();
    await expect(opening).toHaveCount(0, { timeout: 8000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Apprenez ce que les employeurs cherchent",
    );
    await expectAccessible(page);

    // The three screens: a touch on the picture or on a dot.
    await page.getByRole("button", { name: "Écran suivant" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Un profil qui progresse avec vous",
    );
    await page.getByRole("button", { name: "Écran 3 : Connect" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Postulez et rencontrez les recruteurs",
    );

    // The next time on this phone: the short opening.
    await page.reload();
    await expect(page.locator(".nb-spl-court")).toBeVisible();
    await expect(page.locator(".nb-spl-long")).toBeHidden();
    await expect(opening).toHaveCount(0, { timeout: 5000 });

    // Talent or recruiter, always offered next to the logo (27/10/2026).
    const choice = page.getByRole("group", { name: "Vous êtes" });
    await expect(choice.getByRole("button", { name: "Talent" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await choice.getByRole("button", { name: "Recruteur" }).click();
    await expect(page.getByRole("link", { name: "S'inscrire" })).toHaveAttribute(
      "href",
      "/inscription?profil=rh",
    );
    await choice.getByRole("button", { name: "Talent" }).click();

    // « S'inscrire » and « Se connecter », each with a clear way back.
    await page.getByRole("link", { name: "S'inscrire" }).click();
    await expect(page).toHaveURL(/\/inscription$/);
    await expect(page.getByRole("heading", { name: "Créer votre compte" })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole("link", { name: "Retour" }).click();
    await expect(page).toHaveURL(/\/decouvrir$/);
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/connexion$/);
    await expect(page.getByRole("heading", { name: "Bon retour" })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
    await expect(page).toHaveURL(/\/mot-de-passe-oublie$/);
    await expect(page.getByRole("heading", { name: "Mot de passe oublié" })).toBeVisible();
    await page.getByRole("link", { name: "Retour" }).click();
    await expect(page).toHaveURL(/\/connexion$/);
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/inscription$/);

    // The conditions in three points, then « J'ai compris ».
    await page.getByRole("button", { name: "Conditions" }).click();
    const legal = page.getByRole("dialog");
    await expect(legal.getByRole("listitem")).toHaveCount(3);
    await legal.getByRole("button", { name: "J'ai compris" }).click();
    await expect(page.locator(".nb-feuille")).toHaveCount(0);

    // An invalid address says so, nothing else happens.
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page.getByText(/Entrez une adresse e-mail valide/)).toBeVisible();
    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("inscription par e-mail, profil en six étapes, puis l'espace", async ({ page }) => {
    const email = testEmail("modele-b");
    await page.goto("/inscription");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page).toHaveURL(/\/inscription\/compte/);

    // The rules tick as the password is typed; « Créer mon compte » waits for all three.
    const password = page.getByLabel("Mot de passe", { exact: true });
    await password.fill("abc");
    await expect(page.locator(".nb-regles li[data-ok]")).toHaveCount(1);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page.getByText("Votre mot de passe doit cocher les trois règles.")).toBeVisible();
    await password.fill(PASSWORD);
    await expect(page.locator(".nb-regles li[data-ok]")).toHaveCount(3);
    await expectAccessible(page);
    const sent = Date.now();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Confirmez votre adresse" })).toBeVisible();
    await expectAccessible(page);
    // The link of the e-mail confirms the address and opens the space (27/10/2026).
    await openConfirmationLink(page, email, sent);
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    // Step 1: the name, required.
    const next = page.getByRole("button", { name: /^(Continuer|Terminer)$/ });
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await page.getByLabel("Prénom").fill("");
    await next.click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByLabel("Prénom").fill("Awa");
    await page.getByLabel("Nom", { exact: true }).fill("Fictive");
    await expectAccessible(page);
    await next.click();

    // Step 2: the photo sheet opens and closes, « Passer » goes on.
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    await page.getByRole("button", { name: "Prendre ou choisir une photo" }).click();
    await expect(page.getByRole("dialog", { name: "Votre photo" })).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await page.getByRole("button", { name: "Passer" }).click();

    // Step 3: the country sheet (search, then a choice), the city, « Je peux déménager ».
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    await page.getByRole("button", { name: /^Pays/ }).click();
    const countries = page.getByRole("dialog", { name: "Votre pays" });
    await countries.getByRole("textbox").fill("seneg");
    await countries.getByRole("button", { name: "Sénégal" }).click();
    await expect(page.getByRole("button", { name: /^Pays/ })).toContainText("Sénégal");
    await page.getByRole("button", { name: "Autre ville" }).click();
    await page.getByLabel("Votre ville").fill("Thiès");
    await page.getByRole("switch", { name: "Je peux déménager" }).click();
    await expect(page.getByRole("switch", { name: "Je peux déménager" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expectAccessible(page);
    await next.click();

    // Step 4: the situation.
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "4");
    await next.click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    await page.getByRole("radio", { name: /Jeune diplômé/ }).click();
    await next.click();

    // Step 5: Orbi proposes three trades after one question; the person chooses.
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "5");
    await page.getByRole("button", { name: /Je ne sais pas encore/ }).click();
    const orbi = page.getByRole("dialog", { name: "Trouvons votre Cap" });
    await orbi.locator(".nb-q").first().click();
    await orbi.locator(".nb-q-choix").first().click();
    await expect(page.getByText("Votre Cap", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "CDI" }).click();
    await expect(page.getByRole("button", { name: "CDI" })).toHaveAttribute("aria-pressed", "true");
    await next.click();

    // Step 6: at least three skills from the reference.
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "6");
    await next.click();
    await expect(page.locator(".nb-bas .nb-erreur")).toBeVisible();
    const chips = page.locator(".nb-chip-c[data-lime]");
    for (let index = 0; index < 3; index++) await chips.nth(index).click();
    await expect(page.getByText("3 choisies", { exact: true })).toBeVisible();
    await expectAccessible(page);
    await next.click();

    // Notifications, then « Profil prêt » with the real completeness.
    await expect(
      page.getByRole("heading", { name: "Ne ratez aucune offre pour vous" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Plus tard" }).click();
    await expect(page.getByRole("heading", { name: "Bienvenue, Awa" })).toBeVisible();
    await expect(page.getByText(/Profil complété à \d+ %/)).toBeVisible();
    await expectAccessible(page);
    // « Modifier mes réponses » comes back to step 1.
    await page.getByRole("button", { name: /Modifier mes réponses/ }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByLabel("Prénom")).toHaveValue("Awa");
    for (let step = 1; step < 6; step++) await next.click();
    await next.click();
    await page.getByRole("button", { name: "Plus tard" }).click();
    await page.getByRole("button", { name: "Entrer dans Jumanly" }).click();
    await expect(page).toHaveURL(/\/app(\?bienvenue=1)?$/);
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  });

  test("connexion au téléphone", async ({ page }) => {
    await page.goto("/connexion");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/connexion/);
    await page.getByLabel("Adresse e-mail").fill("talent.free@jumanly.test");
    await page.getByLabel("Mot de passe").fill("Demo-Jumanly-2026");
    await page.getByRole("button", { name: "Se connecter", exact: true }).click();
    await expect(page).toHaveURL(/\/app/);
  });
});
