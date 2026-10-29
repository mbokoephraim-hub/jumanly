import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
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
  test.skip(!isMobile, "Parcours du téléphone (Modèle B, lot B5).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("profil-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // Modèle B (lots B5, B9): the former profile leads to Carrière, « Modifier le profil » to its
  // form, which draws its own head (« Annuler », « Enregistrer »), without the bottom bar.
  await page.goto("/app/profil/modifier", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/app\/career\/profil$/);
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
  const form = page.locator(".nb-ca-form");
  await form.getByLabel("Titre professionnel").fill("Analyste de données");
  await form.getByLabel("Ville").fill("Kinshasa");
  // The form keeps what was typed once it answers (hydrated).
  await expect(form.getByLabel("Titre professionnel")).toHaveValue("Analyste de données");
  await form.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil mis à jour.")).toBeVisible();

  // The photo: chosen, squared in the browser, then served from an unguessable address.
  await page.goto("/app/career/profil");
  await page.getByRole("button", { name: "Changer la photo" }).click();
  const sheet = page.getByRole("dialog", { name: "Photo de profil" });
  await expect(sheet.getByRole("button", { name: "Choisir dans la galerie" })).toBeVisible();
  await page
    .locator('.nb-ca-form input[type="file"]:not([data-banniere])')
    .nth(1)
    .setInputFiles(photo);
  await expect(page.getByText("Photo mise à jour.")).toBeVisible();
  await page.goto("/app/career/cv");
  const src = await page.locator('.nb-ca img[src^="/api/photo/"]').first().getAttribute("src");
  const served = await page.request.get(src!);
  expect(served.headers()["content-type"]).toBe("image/jpeg");
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");

  // The banner (22/10/2026): a wide picture, cut to 5 by 2 in the browser, shown on Carrière.
  await page.goto("/app/career/profil");
  await page.getByRole("button", { name: "Changer la bannière" }).click();
  const bannerSheet = page.getByRole("dialog", { name: "Bannière du profil" });
  await expect(bannerSheet.getByRole("button", { name: "Choisir dans la galerie" })).toBeVisible();
  await page.locator('.nb-ca-form input[data-banniere][type="file"]').nth(1).setInputFiles(photo);
  await expect(page.getByText("Bannière mise à jour.")).toBeVisible();
  await page.goto("/app/career/cv");
  const banner = page.locator('.nb-pf-banniere img[src^="/api/banniere/"]').first();
  const bannerServed = await page.request.get((await banner.getAttribute("src"))!);
  expect(bannerServed.headers()["content-type"]).toBe("image/jpeg");
  await page.goto("/app/career/profil");
  await page.getByRole("button", { name: "Changer la bannière" }).click();
  await bannerSheet.getByRole("button", { name: "Revenir à la bannière Jumanly" }).click();
  await expect(page.getByText("Bannière Jumanly remise.")).toBeVisible();

  // An experience: the former address opens the form of Carrière.
  await page.goto("/app/profil/experience", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/app\/career\/profil\/experience\/nouvelle$/);
  const experience = page.locator(".nb-ca-form");
  await experience.getByLabel("Poste").fill("Analyste junior");
  await experience.getByLabel("Entreprise", { exact: true }).fill("Entreprise fictive");
  await experience.getByLabel("Début").fill("2024-01");
  await experience.getByRole("switch", { name: "J’y travaille encore" }).click();
  await experience.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Expérience ajoutée.")).toBeVisible();
  await page.goto("/app/career/cv");
  await expect(page.locator(".nb-ca").first()).toContainText("Analyste junior");

  // Removing the photo goes back to the initials.
  await page.goto("/app/career/profil");
  await page.getByRole("button", { name: "Changer la photo" }).click();
  await page
    .getByRole("dialog", { name: "Photo de profil" })
    .getByRole("button", { name: "Retirer" })
    .click();
  await expect(page.getByText("Photo retirée.")).toBeVisible();
  expect((await page.request.get(src!)).status()).toBe(404);
});

test("télécharger mon CV sur téléphone : créer, aperçu, PDF", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Parcours du téléphone (docs/carriere-v3).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("cv-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // « Nouveau CV » in Carrière: « Comment voulez-vous commencer ? », then a template.
  await page.goto("/app/career/cv?onglet=cv");
  await page.locator(".nb-cr-nouveau").filter({ visible: true }).click();
  await page.waitForURL("**/app/career/cv/nouveau");
  await page.getByRole("link", { name: /^Partir d’un modèle/ }).click();
  await page.waitForURL(/etape=modele/);
  await page.getByRole("button", { name: "Continuer" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/);
  const id = new URL(page.url()).pathname.split("/").pop()!;

  // Contenu → Mise en forme → Aperçu: « Télécharger en PDF ».
  await page
    .getByRole("link", { name: "Continuer", exact: true })
    .filter({ visible: true })
    .click();
  await page.waitForURL(/etape=style/);
  await page.getByRole("link", { name: "Voir l’aperçu" }).filter({ visible: true }).click();
  await page.waitForURL(/etape=apercu/);
  // A new account has an empty CV: a summary is written first (the PDF is never an empty page).
  await page.getByRole("link", { name: "Écrire le contenu" }).click();
  await page.getByRole("button", { name: "Modifier le résumé" }).click();
  const sheet = page.getByRole("dialog", { name: "Résumé" });
  await sheet.getByRole("textbox").fill("Analyste junior (fictive) qui aime les chiffres.");
  await sheet.getByRole("button", { name: "Enregistrer" }).click();
  await expect(sheet).toBeHidden();
  await expect(
    page.getByText("Analyste junior (fictive)").filter({ visible: true }).first(),
  ).toBeVisible();
  await page.goto(`/app/career/cv/${id}?etape=apercu`);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Télécharger en PDF" }).click();
  const path = join(mkdtempSync(join(tmpdir(), "cv-mobile-")), "cv.pdf");
  await (await download).saveAs(path);
  // The contact e-mail of the fictional account is the only place the word may appear.
  const text = execFileSync("pdftotext", ["-layout", path, "-"]).toString();
  expect(text.replace(/\S+@\S+/g, "")).not.toMatch(/Jumanly/i);
});
