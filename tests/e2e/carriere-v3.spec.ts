import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { fictiveDocx, fictivePdf, signUpFromPricing, testEmail } from "./session";

/** « Importer mon CV »: the file is sent once the page is interactive, then Orbi's findings. */
async function importFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.goto("/app/career/cv/nouveau?etape=import");
  await page.waitForLoadState("networkidle");
  await page.locator("#cv-nouveau-fichier").setInputFiles(file);
  await expect(page.getByText("Voici ce qu’Orbi a trouvé")).toBeVisible({ timeout: 15_000 });
}

// Carrière v3 (docs/carriere-v3, captures 06 to 15): « Nouveau CV » on the phone, its three ways
// in, then the four steps of a CV (modèle, contenu, mise en forme, aperçu) down to the PDF.
const SUMMARY = "Assistante comptable (fictive), 3 ans de clôtures mensuelles et de paie.";

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

    // Aperçu: the score with its « Pourquoi ? ».
    await page.waitForURL(/etape=apercu/);
    await expect(page.getByRole("img", { name: /^Score du CV : \d+ sur 100$/ })).toBeVisible();
    await page.getByRole("button", { name: "Pourquoi ?" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    // A new account's CV is empty: the preview says it is an example, no PDF until it is filled.
    await expect(page.getByText(/Votre CV est encore vide/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Remplissez votre CV pour le télécharger" }),
    ).toBeDisabled();
    await page.getByRole("link", { name: "Écrire le contenu" }).click();
    await page.waitForURL(/etape=contenu/);
    await page.getByRole("button", { name: "Modifier le résumé" }).click();
    const sheet = page.getByRole("dialog", { name: "Résumé" });
    await sheet.getByRole("textbox").fill(SUMMARY);
    await sheet.getByRole("button", { name: "Enregistrer" }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByText(SUMMARY).filter({ visible: true }).first()).toBeVisible();
    await page.goto(`/app/career/cv/${id}?etape=apercu`);

    // The PDF downloaded is the person's CV, not an example nor an empty page.
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Télécharger en PDF" }).click();
    const file = join(mkdtempSync(join(tmpdir(), "cv-v3-")), "cv.pdf");
    await (await download).saveAs(file);
    expect(execFileSync("pdftotext", [file, "-"]).toString()).toContain("Assistante comptable");

    // « Ajouter à mon profil » asks first, then adds the summary.
    await page.getByRole("button", { name: "Ajouter à mon profil" }).first().click();
    const add = page.getByRole("dialog", { name: "Ajouter ce CV à mon profil" });
    await expect(add.getByText("Le résumé")).toBeVisible();
    await add.getByRole("button", { name: "Ajouter à mon profil" }).click();
    await expect(page.getByText("Un élément ajouté à votre profil.")).toBeVisible();

    // « Terminer » ends on Carrière, the CV kept in « Mes CV ».
    await page.getByRole("button", { name: "Terminer" }).click();
    await page.waitForURL("**/app/career/cv?onglet=cv");
  });

  test("importer un PDF, le garder, le lire dans l’appli puis le supprimer", async ({ page }) => {
    test.setTimeout(150_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3-garde"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
    await importFile(
      page,
      await fictivePdf([
        "Aline Fictive",
        "Comptable (fictive)",
        "Excel, comptabilité, archivage.",
        "Français, anglais.",
      ]),
    );
    // Three ways out of what Orbi found.
    for (const name of [
      /^Garder mon CV/,
      /^Remplir mon profil avec ce CV/,
      /^Créer un nouveau CV avec ces informations/,
    ])
      await expect(page.getByRole("button", { name })).toBeVisible();
    await expectAccessible(page);
    await page.getByRole("button", { name: /^Garder mon CV/ }).click();

    // The file itself, drawn page by page in the app.
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\/lire\?importe=garde/);
    await expect(page.getByText("Votre CV est rangé dans « Mes CV ».")).toBeVisible();
    await expect(page.locator(".nb-cv-lire-pages[data-pret] canvas")).toHaveCount(1, {
      timeout: 20_000,
    });
    await expectAccessible(page);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Télécharger le fichier" }).click();
    const file = join(mkdtempSync(join(tmpdir(), "cv-garde-")), "cv.pdf");
    await (await download).saveAs(file);
    expect(execFileSync("pdftotext", [file, "-"]).toString()).toContain("Comptable (fictive)");

    // Fermer: back on the library, the CV there; it opens again in the reader.
    await page.getByRole("button", { name: "Fermer et revenir à mes CV" }).click();
    await page.waitForURL(/\/app\/career\/cv$/);
    const card = page.locator("#car-panneau").getByRole("link", { name: /cv-fictif/ });
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForURL(/\/lire$/);

    // Supprimer, after a question.
    await page.getByRole("button", { name: "Supprimer ce CV" }).click();
    await page
      .getByRole("dialog", { name: "Supprimer « cv-fictif » ?" })
      .getByRole("button", { name: "Supprimer", exact: true })
      .click();
    await page.waitForURL(/\/app\/career\/cv$/);
    await expect(page.getByText("CV supprimé.")).toBeVisible();
    await expect(page.locator("#car-panneau")).not.toContainText("cv-fictif");
  });

  test("importer un CV pour remplir le profil : le CV reste dans « Mes CV »", async ({ page }) => {
    test.setTimeout(120_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3-profil"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
    await importFile(page, fictiveDocx(["Comptable (fictif).", "Excel, comptabilité, archivage."]));
    await page.getByRole("button", { name: /^Remplir mon profil avec ce CV/ }).click();
    await page.waitForURL(/\/lire\?importe=profil/);
    await expect(page.getByText(/dans votre profil\. Votre CV est aussi rangé/)).toBeVisible();
    // A Word file is read through what it holds.
    await expect(page.getByText("Excel").filter({ visible: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Fermer et revenir à mes CV" }).click();
    await page.waitForURL(/\/app\/career\/cv$/);
    await expect(page.locator("#car-panneau")).toContainText("cv-fictif");
  });

  test("importer un CV pour en créer un autre, puis le PDF de ce CV", async ({ page }) => {
    test.setTimeout(150_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3-autre"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
    await importFile(page, fictiveDocx(["Comptable (fictif).", "Excel, comptabilité, archivage."]));
    await page.getByRole("button", { name: /^Créer un nouveau CV avec ces informations/ }).click();
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=modele/);
    const id = new URL(page.url()).pathname.split("/").pop()!;
    await page.getByRole("button", { name: /^Gratuits/ }).click();
    // The CV's template is already chosen: touching it again opens it large, with « Utiliser ».
    await page.locator(".nb-cv-modele:not([data-verrou])").first().click();
    await page
      .getByRole("button", { name: /^(Appliquer|Utiliser) ce modèle$/ })
      .filter({ visible: true })
      .click();
    await page.waitForURL(/etape=contenu/);
    await expect(page.getByText("Excel").filter({ visible: true }).first()).toBeVisible();

    // The PDF is this CV, with what was read.
    await page.goto(`/app/career/cv/${id}?etape=apercu`);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Télécharger en PDF" }).click();
    const file = join(mkdtempSync(join(tmpdir(), "cv-autre-")), "cv.pdf");
    await (await download).saveAs(file);
    expect(execFileSync("pdftotext", [file, "-"]).toString()).toContain("Excel");
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
