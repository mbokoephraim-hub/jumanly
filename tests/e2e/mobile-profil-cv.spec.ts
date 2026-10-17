import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Prompt 6 (docs/PROMPTS-LANCEMENT-MOBILE-ET-IA.md): « compléter mon profil » and « télécharger mon
// CV » on a phone (screens 25 to 29 and 56). The PDF check needs poppler-utils (pdftotext).

const photo = join(process.cwd(), "ressources/illustrations/png/jumanly-nadia-salut.png");

test("compléter mon profil sur téléphone : titre, bio, photo, expérience", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Parcours du téléphone (écrans 25 et 26).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("profil-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  await page.goto("/app/profil");
  const build = page.getByRole("region", { name: "Construire mon profil" });
  await expect(build).toContainText("0 étape sur 6");
  // The bottom menu steps aside for the bar « Enregistré · Voir mon profil côté recruteur ».
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);

  // Title and bio are saved when the field is left; « Enregistré » comes from the server.
  await page.locator("#phone-headline").fill("Analyste de données");
  await page.locator("#phone-bio").click();
  await expect(page.getByRole("status").filter({ hasText: "Enregistré" })).toBeVisible();
  await page.locator("#phone-bio").fill("Analyste de données junior, j'aime les chiffres clairs.");
  await expect(page.getByText(/^5\d \/ 1000$/)).toBeVisible();
  await page.locator("#phone-headline").click();
  await expect(page.getByRole("status").filter({ hasText: "Enregistrement…" })).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#phone-headline")).toHaveValue("Analyste de données");
  await expect(build).toContainText("2 étapes sur 6");

  // The photo: chosen, zoomed, cropped in the browser, then served from an unguessable address.
  await page.getByRole("link", { name: "Changer la photo" }).first().click();
  const sheet = page.getByRole("dialog", { name: "Photo de profil" });
  await expect(sheet).toContainText("Jamais utilisée pour le matching.");
  await sheet.locator('input[type="file"]').nth(1).setInputFiles(photo);
  await expect(sheet.getByRole("group", { name: /Faites glisser/ })).toBeVisible();
  await sheet.getByLabel("Agrandir la photo").fill("1.5");
  await sheet.getByRole("button", { name: "Enregistrer la photo" }).click();
  await expect(page).toHaveURL(/ok=photo$/);
  await expect(page.getByText("Photo enregistrée.")).toBeVisible();
  const src = await page.locator('main img[src^="/api/photo/"]').first().getAttribute("src");
  const served = await page.request.get(src!);
  expect(served.headers()["content-type"]).toBe("image/jpeg");
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");

  // One part at a time: Expériences opens alone, with the back arrow to the profile.
  await page
    .getByRole("navigation", { name: "Parties du profil" })
    .getByRole("link", { name: /Expériences/ })
    .click();
  await expect(page).toHaveURL(/partie=experiences/);
  const part = page.locator("#experiences");
  await part.getByText("Ajouter une expérience").click();
  await part.getByLabel("Intitulé du poste").fill("Analyste junior");
  await part.getByLabel("Organisation").fill("Entreprise fictive");
  await part.getByLabel("Date de début").fill("2024-01");
  await part.locator('input[name="current"]').check();
  await part.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/section=experiences/);
  await expect(part.getByText("Analyste junior")).toBeVisible();
  await page.getByRole("link", { name: "Retour à mon profil" }).click();
  await expect(build).toContainText("4 étapes sur 6");
  await expect(build.getByText("Expériences")).toHaveCSS("text-decoration-line", "line-through");

  // Removing the photo goes back to the initials.
  await page.goto("/app/profil?photo=1");
  await page.getByRole("button", { name: "Retirer la photo" }).click();
  await expect(page.getByText("Photo retirée.")).toBeVisible();
  expect((await page.request.get(src!)).status()).toBe(404);
});

test("télécharger mon CV sur téléphone : créer, une section à la fois, PDF", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Parcours du téléphone (écrans 27 à 29 et 56).");
  test.setTimeout(150_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("cv-mobile"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // « Créer un CV »: from the profile, named, then opened.
  await page.goto("/app/career/cv");
  await page.getByRole("link", { name: "Créer un CV" }).click();
  const sheet = page.getByRole("dialog", { name: "Créer un CV" });
  await expect(sheet.getByRole("radio", { name: /À partir de mon profil/ })).toBeChecked();
  await sheet.getByLabel("Nom du CV").fill("CV Analyste");
  await sheet.getByRole("button", { name: "Créer et ouvrir" }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
  const id = new URL(page.url()).pathname.split("/").pop()!;

  // The editor: three views, the parts one at a time, « Section suivante ».
  const tabs = page.getByRole("navigation", { name: "Vues du CV" });
  await expect(tabs.getByRole("link", { name: "Contenu" })).toHaveAttribute("aria-current", "page");
  const parts = page.getByRole("navigation", { name: "Sections du CV" });
  await expect(parts.getByRole("link", { name: "Infos" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#cv-phone-title")).toHaveValue("CV Analyste");
  await page.getByRole("link", { name: "Section suivante" }).click();
  await expect(page).toHaveURL(/partie=summary/);
  await expect(parts.getByRole("link", { name: "Profil" })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: "Mise en forme" }).click();
  await expect(page).toHaveURL(/vue=style/);
  await expect(
    page.getByText("Le CV téléchargé ne porte ni logo ni mention Jumanly."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Télécharger le PDF" })).toBeVisible();

  // Mes CV: the thumbnail grid and the PDF, « PDF… » then the toast; the file says nothing of us.
  await page.getByRole("link", { name: "Retour à Mes CV" }).click();
  const card = page.locator("li").filter({ hasText: "CV Analyste" }).filter({ visible: true });
  const download = page.waitForEvent("download");
  await card.getByRole("link", { name: "PDF" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^CV-Awa-Fictive.*\.pdf$/);
  await expect(page.getByText("CV téléchargé · sans mention Jumanly")).toBeVisible();
  const path = join(mkdtempSync(join(tmpdir(), "cv-mobile-")), "cv.pdf");
  await file.saveAs(path);
  // The contact e-mail of the fictional account is the only place the word may appear.
  const text = execFileSync("pdftotext", ["-layout", path, "-"]).toString();
  expect(text.replace(/\S+@\S+/g, "")).not.toMatch(/Jumanly/i);

  // Clean up through the « … » menu.
  await card.locator('summary[aria-label^="Plus d\'actions"]').click();
  await card.locator("summary").filter({ hasText: "Supprimer ce CV" }).click();
  await card.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page).toHaveURL(/ok=supprime/);
  expect(id).toBeTruthy();
});
