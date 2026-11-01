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
  // « Mon profil » (its own space since 29/10) shows the photo.
  await page.goto("/app/profil");
  const src = await page
    .locator('img[src^="/api/photo/"]')
    .filter({ visible: true })
    .first()
    .getAttribute("src");
  const served = await page.request.get(src!);
  expect(served.headers()["content-type"]).toBe("image/jpeg");
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");

  // The banner (22/10/2026): a wide picture, cut to 5 by 2 in the browser, shown on Mon profil.
  await page.goto("/app/career/profil");
  await page.getByRole("button", { name: "Changer la bannière" }).click();
  const bannerSheet = page.getByRole("dialog", { name: "Bannière du profil" });
  await expect(bannerSheet.getByRole("button", { name: "Choisir dans la galerie" })).toBeVisible();
  await page.locator('.nb-ca-form input[data-banniere][type="file"]').nth(1).setInputFiles(photo);
  await expect(page.getByText("Bannière mise à jour.")).toBeVisible();
  await page.goto("/app/profil");
  const banner = page.locator('img[src^="/api/banniere/"]').filter({ visible: true }).first();
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
  await page.goto("/app/profil");
  await expect(page.getByText("Analyste junior").filter({ visible: true }).first()).toBeVisible();

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

test("télécharger mon CV sur téléphone : créer, écrire, PDF", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Parcours du téléphone (nouveau CV du 31/10).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("cv-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // « + Nouveau CV » in Mes documents: « Comment voulez-vous remplir votre CV ? ».
  await page.goto("/app/career/cv?onglet=documents");
  await page.getByRole("link", { name: "+ Nouveau CV" }).filter({ visible: true }).click();
  await page.waitForURL("**/app/career/cv/nouveau");
  await page.getByRole("radio", { name: /^Tout écrire moi-même/ }).check();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/, { timeout: 30_000 });
  const id = new URL(page.url()).pathname.split("/").pop()!;

  // A new account has an empty CV: a summary is written first (the PDF is never an empty page).
  await page.getByRole("button", { name: "Suivant" }).click();
  const bio = page.getByLabel("Bio de candidature");
  const status = page.getByRole("status").filter({ hasText: /Ce que vous changez ici/ });
  await expect(async () => {
    await bio.fill("");
    await bio.fill("Analyste junior (fictive) qui aime les chiffres.");
    await expect(status).not.toHaveText(/^Enregistré ·/, { timeout: 1_000 });
  }).toPass();
  await expect(status).toHaveText(/^Enregistré ·/, { timeout: 10_000 });

  // The PDF, from the menu of the CV: never the name of Jumanly.
  await page.goto("/app/career/cv?onglet=documents");
  await page
    .locator("li")
    .filter({ has: page.locator(`a[href^="/app/career/cv/${id}"]`) })
    .getByRole("button", { name: /^Actions de « / })
    .filter({ visible: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("dialog").getByRole("button", { name: "Télécharger" }).click();
  const path = join(mkdtempSync(join(tmpdir(), "cv-mobile-")), "cv.pdf");
  await (await download).saveAs(path);
  // The contact e-mail of the fictional account is the only place the word may appear.
  const text = execFileSync("pdftotext", ["-layout", path, "-"]).toString();
  expect(text).toContain("Analyste junior (fictive)");
  expect(text.replace(/\S+@\S+/g, "")).not.toMatch(/Jumanly/i);
});
