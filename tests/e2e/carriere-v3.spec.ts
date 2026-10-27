import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { signUpFromPricing, testEmail } from "./session";

// Carrière v3 (docs/carriere-v3, captures 06 to 15): « Nouveau CV » on the phone, its three ways
// in, then the four steps of a CV (modèle, contenu, mise en forme, aperçu) down to the PDF.
test.describe("Carrière v3 · créer un CV au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Parcours du téléphone.");

  test("un modèle, le contenu, la mise en forme puis l'aperçu", async ({ page }) => {
    test.setTimeout(150_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    // « Comment voulez-vous commencer ? »: Orbi, a template or an import.
    await page.goto("/app/career/cv/nouveau");
    await expect(page.getByRole("heading", { name: "Nouveau CV", level: 1 })).toBeVisible();
    for (const name of [/^Orbi le prépare/, /^Partir d’un modèle/, /^Importer mon CV/])
      await expect(page.getByRole("link", { name })).toBeVisible();
    await expectAccessible(page);

    // A template of a paid plan shows the plan instead of being applied.
    await page.getByRole("link", { name: /^Partir d’un modèle/ }).click();
    await page.waitForURL(/etape=modele/);
    await expect(page.getByRole("heading", { name: "Choisir un modèle", level: 1 })).toBeVisible();
    await page
      .getByRole("button", { name: /, inclus dans / })
      .first()
      .click();
    await expect(page.getByRole("link", { name: /^Passer à / }).first()).toBeVisible();
    await expectAccessible(page);

    // A free one: « Continuer » creates the CV and opens Contenu.
    await page.getByRole("button", { name: /^Gratuits/ }).click();
    await page.locator(".nb-cv-modele:not([data-verrou])").first().click();
    await page.getByRole("button", { name: "Continuer" }).filter({ visible: true }).click();
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/);
    const id = new URL(page.url()).pathname.split("/").pop()!;

    // Contenu: a section is hidden then shown again, each change saved at once.
    const section = page.getByRole("switch", { name: /^Afficher .+ sur le CV$/ }).first();
    const before = await section.getAttribute("aria-checked");
    await section.click();
    await expect(section).not.toHaveAttribute("aria-checked", before ?? "true");
    await section.click();
    await expect(section).toHaveAttribute("aria-checked", before ?? "true");
    await expectAccessible(page);
    await page
      .getByRole("link", { name: "Continuer", exact: true })
      .filter({ visible: true })
      .click();

    // Mise en forme: the font changes the CV in place.
    await page.waitForURL(/etape=style/);
    const fonts = page.getByRole("radiogroup", { name: "Police" });
    await fonts.getByRole("radio").nth(1).click();
    await expect(fonts.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");
    await expectAccessible(page);
    await page.getByRole("link", { name: "Voir l’aperçu" }).filter({ visible: true }).click();

    // Aperçu: the score with its « Pourquoi ? », and the PDF.
    await page.waitForURL(/etape=apercu/);
    await expect(page.getByRole("img", { name: /^Score du CV : \d+ sur 100$/ })).toBeVisible();
    await page.getByRole("button", { name: "Pourquoi ?" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    const pdf = await page.request.get(`/app/career/cv/${id}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
  });

  test("Orbi prépare le CV à partir du profil", async ({ page }) => {
    test.setTimeout(120_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3-orbi"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    await page.goto("/app/career/cv/nouveau");
    await page.getByRole("link", { name: /^Orbi le prépare/ }).click();
    await page.waitForURL(/etape=orbi&cv=/, { timeout: 30_000 });
    await expect(page.getByText("Votre CV est prêt")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Voir le contenu" }).filter({ visible: true }).click();
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/);
  });
});
