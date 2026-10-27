import { expect, test, type Page } from "@playwright/test";
import { DEMO_PASSWORD, PASSWORD, demo, signUpFromPricing, testEmail } from "./session";

// docs/refonte-mobile (lot 2): /connexion and /inscription, then the générique d'entrée.

test("connexion et inscription mènent l'une à l'autre, le recruteur vers son forfait", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Au téléphone : l'accueil du Modèle B (modele-b-accueil.spec.ts).");
  await page.goto("/connexion");
  await expect(page.getByRole("heading", { name: "Bon retour" })).toBeVisible();
  // Talent or recruiter, then « Se connecter » or « S'inscrire » (27/10/2026).
  const who = page.getByRole("navigation", { name: "Vous êtes" });
  await expect(who.getByRole("link", { name: "Talent" })).toHaveAttribute("aria-current", "page");
  await who.getByRole("link", { name: "Recruteur" }).click();
  await expect(page).toHaveURL(/\/connexion\?profil=rh$/);
  await expect(page.getByRole("link", { name: "S'inscrire" })).toHaveAttribute(
    "href",
    "/inscription?profil=rh",
  );
  await who.getByRole("link", { name: "Talent" }).click();
  await page.getByRole("link", { name: "S'inscrire" }).click();
  await expect(page).toHaveURL(/\/inscription/);
  await expect(page.getByRole("heading", { name: "Créez votre compte" })).toBeVisible();
  await page.getByRole("link", { name: "Continuer avec mon e-mail" }).click();
  await expect(page).toHaveURL(/\/inscription\/compte\?profil=talent/);
  await expect(page.getByLabel("Prénom et nom")).toBeVisible();
  await page.goto("/inscription");
  await page.getByRole("link", { name: "Créer un compte recruteur" }).click();
  await expect(page).toHaveURL(/\/inscription\/forfait\?profil=rh/);
});

// refonte-web talent-4 § 1: from 1200 px, the brand panel on the left of the form; alone below.
test("connexion en deux parties sur ordinateur, formulaire seul sur téléphone", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Au téléphone : l'accueil du Modèle B (modele-b-accueil.spec.ts).",
  );
  await page.goto("/connexion");
  const promise = page.getByRole("heading", { name: "Se former, être vu, être recruté." });
  if (testInfo.project.name === "desktop") {
    await expect(promise).toBeVisible();
    const panel = await promise.boundingBox();
    const title = await page.getByRole("heading", { name: "Bon retour" }).boundingBox();
    expect(panel!.x).toBeLessThan(title!.x);
  } else {
    await expect(promise).toBeHidden();
  }
  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(
    page.getByRole("heading", { name: "Réinitialiser votre mot de passe" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Retour à la connexion/ }).click();
  await expect(page).toHaveURL(/\/connexion$/);
});

/** Signs in through the e-mail form, without skipping the intro. */
async function signInByEmail(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  const form = page.locator("form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
}

test.describe("générique d'entrée", () => {
  test.skip(!!process.env.E2E_REDUCED_MOTION, "le générique ne se joue pas en animations réduites");
  test.skip(
    ({ isMobile }) => isMobile,
    "Modèle B au téléphone : le logo seul à l'ouverture (brief § 3)",
  );

  test("complet une seule fois par compte, puis court ; « Passer » rend la main à l'espace", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const email = testEmail("generique");
    await signUpFromPricing(page, "Créer mon compte gratuit", email);

    // New account: the full version plays over the welcome page, then « Passer » ends it.
    const intro = page.getByRole("dialog", { name: "Présentation de Jumanly" });
    await expect(intro).toBeVisible({ timeout: 20_000 });
    await expect(intro.getByText("Bienvenue,", { exact: true })).toBeVisible();
    await expect(page).not.toHaveURL(/arrivee=/);
    const skip = intro.getByRole("button", { name: "Passer l'intro" });
    await expect(skip).toBeFocused();
    await skip.click();
    await expect(intro).toBeHidden();
    await expect(page.getByRole("main")).toBeFocused();
    // A reload is not an arrival: nothing plays.
    await page.reload();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(intro).toBeHidden();

    // Next sign-in: the short version, which ends on its own.
    await page.context().clearCookies();
    await signInByEmail(page, email, PASSWORD);
    await expect(intro).toBeVisible({ timeout: 20_000 });
    await expect(intro.locator(".jm-in-short")).toContainText("Bon retour, Awa");
    await expect(intro.getByText("Bienvenue,", { exact: true })).toHaveCount(0);
    await expect(intro).toBeHidden({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/app/);
  });

  test("Échap saute le générique", async ({ page }) => {
    await signInByEmail(page, demo.talentStarter, DEMO_PASSWORD);
    const intro = page.getByRole("dialog", { name: "Présentation de Jumanly" });
    await expect(intro).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    await expect(intro).toBeHidden();
  });
});

test.describe("générique en animations réduites", () => {
  test.use({ reducedMotion: "reduce" });
  test.skip(
    ({ isMobile }) => isMobile,
    "Modèle B au téléphone : le logo seul à l'ouverture (brief § 3)",
  );

  test("aucun générique, le message d'accueil à la place", async ({ page }) => {
    await signInByEmail(page, demo.talentFree, DEMO_PASSWORD);
    await expect(page).toHaveURL(/\/app/);
    await expect(
      page.getByRole("status").getByText(/Bon retour|Bienvenue sur Jumanly/),
    ).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Présentation de Jumanly" })).toHaveCount(0);
  });
});
