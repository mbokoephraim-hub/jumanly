import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Prompt 6 (docs/PROMPTS-LANCEMENT-MOBILE-ET-IA.md): « compléter mon profil » and « télécharger mon
// CV » on a phone (screens 25 and 26; the CV is planche talent-4 § 6, lot 6c). The PDF check
// needs poppler-utils (pdftotext).

const photo = join(process.cwd(), "ressources/illustrations/png/jumanly-nadia-salut.png");

test("compléter mon profil sur téléphone : titre, photo, expérience", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Parcours du téléphone (planche talent-4 § 3).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("profil-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // Mon profil draws its own head: no bottom menu.
  await page.goto("/app/profil");
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);
  await page.getByRole("link", { name: "Modifier le profil" }).click();
  await page.locator("#pf-headline").fill("Analyste de données");
  await page.locator("#pf-city").fill("Kinshasa");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(page).toHaveURL(/ok=identite/);
  await expect(page.locator(".t-pf-id")).toContainText("Analyste de données");

  // The photo: chosen, zoomed, cropped in the browser, then served from an unguessable address.
  await page.goto("/app/profil/modifier");
  await page.getByRole("button", { name: "Photo de profil" }).click();
  const sheet = page.getByRole("dialog", { name: "Photo de profil" });
  await expect(sheet).toContainText("La photo n’entre jamais dans le score.");
  await sheet.locator('input[type="file"]').nth(1).setInputFiles(photo);
  await expect(sheet.getByRole("group", { name: /Glissez la photo/ })).toBeVisible();
  await sheet.getByLabel("Zoom").fill("1.5");
  await sheet.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/ok=photo$/);
  await expect(page.getByText("Photo enregistrée.")).toBeVisible();
  const src = await page.locator('main img[src^="/api/photo/"]').first().getAttribute("src");
  const served = await page.request.get(src!);
  expect(served.headers()["content-type"]).toBe("image/jpeg");
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");

  // Expériences: the section folds; « Ajouter une expérience » opens its screen.
  await page.goto("/app/profil");
  await page.locator("#experiences > summary").click();
  await page.locator("#experiences").getByRole("link", { name: "Ajouter une expérience" }).click();
  await page.getByLabel("Poste", { exact: true }).fill("Analyste junior");
  await page.getByLabel("Organisation").fill("Entreprise fictive");
  await page.locator("#pf-exp-start").fill("2024-01");
  await page.getByText("Poste actuel", { exact: true }).click();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page).toHaveURL(/ok=experiences/);
  await expect(page.locator("#experiences")).toContainText("Analyste junior");

  // Removing the photo goes back to the initials.
  await page.goto("/app/profil/modifier?photo=1");
  await page.getByRole("button", { name: "Retirer la photo" }).click();
  await expect(page.getByText("Photo retirée.")).toBeVisible();
  expect((await page.request.get(src!)).status()).toBe(404);
});

test("télécharger mon CV sur téléphone : créer, aperçu, PDF", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Parcours du téléphone (planche talent-4 § 6).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("cv-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // « Nouveau CV »: from the profile, named, then opened (lot 6c).
  await page.goto("/app/career/cv");
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);
  await page.getByRole("button", { name: "Nouveau CV", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Nouveau CV" });
  await expect(sheet.getByRole("radio", { name: /Depuis mon profil/ })).toBeChecked();
  await sheet.getByLabel("Nom du CV").fill("CV Analyste");
  await sheet.getByRole("button", { name: "Créer et ouvrir" }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;

  // The studio: its title, the sections, the bottom bar « Adapter » and « PDF ».
  await expect(page.getByRole("heading", { name: "CV Analyste", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Sections · glisser pour réordonner" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Adapter", exact: true })).toBeInViewport();
  await page.getByRole("link", { name: "Aperçu" }).click();
  await expect(page).toHaveURL(/vue=apercu/);
  await expect(page.locator(".cv-pages > .cv-page").first()).toBeVisible();

  // The list: « … » then « Télécharger en PDF », the toast; the file says nothing of us.
  await page.goto("/app/career/cv");
  await page.getByRole("button", { name: "Plus d'options pour « CV Analyste »" }).click();
  // A phone saves the file itself: the check reads what the server sent to the button.
  const response = page.waitForResponse((r) => r.url().includes("/export?format=pdf"));
  await page
    .getByRole("dialog", { name: "CV Analyste" })
    .getByRole("link", { name: "Télécharger en PDF" })
    .click();
  const pdf = await response;
  expect(pdf.status()).toBe(200);
  const path = join(mkdtempSync(join(tmpdir(), "cv-mobile-")), "cv.pdf");
  writeFileSync(path, await pdf.body());
  // The contact e-mail of the fictional account is the only place the word may appear.
  const text = execFileSync("pdftotext", ["-layout", path, "-"]).toString();
  expect(text.replace(/\S+@\S+/g, "")).not.toMatch(/Jumanly/i);

  // Clean up through the « … » menu.
  await page.goto("/app/career/cv");
  await page.getByRole("button", { name: "Plus d'options pour « CV Analyste »" }).click();
  await page
    .getByRole("dialog", { name: "CV Analyste" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL(/ok=supprime/);
  expect(id).toBeTruthy();
});
