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
// in, then the steps of a CV (modèle, mes informations, aperçu) down to the PDF.
const SUMMARY = "Assistante comptable (fictive), 3 ans de clôtures mensuelles et de paie.";

test.describe("Carrière v3 · créer un CV au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Parcours du téléphone.");

  test("trois façons de commencer, mes informations, le studio, l'aperçu puis le PDF", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    // « Nouveau CV » (31/10): three ways to fill it, then « Valider »; importing a file stays.
    await page.goto("/app/career/cv/nouveau");
    await expect(page.getByRole("heading", { name: "Nouveau CV", level: 1 })).toBeVisible();
    for (const name of [
      /^Reprendre les informations/,
      /^Tout écrire moi-même/,
      /^Adapter à une offre/,
    ])
      await expect(page.getByRole("radio", { name })).toBeVisible();
    await expect(page.getByRole("link", { name: /Importer$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Valider" })).toBeDisabled();
    await expectAccessible(page);
    await page.getByRole("radio", { name: /^Tout écrire moi-même/ }).check();
    await page.getByRole("button", { name: "Valider" }).click();
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/, { timeout: 30_000 });
    const id = new URL(page.url()).pathname.split("/").pop()!;

    // Mes informations, in seven parts: « Suivant » goes from one to the next, saved as typed.
    await expect(page.getByText("Partie 1 sur 7")).toBeVisible();
    await expectAccessible(page);
    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText("Partie 2 sur 7")).toBeVisible();
    // The form may hydrate after the first keystrokes: type again until the page counts the
    // change (« Modifié », then « Enregistré » once saved).
    const bio = page.getByLabel("Bio de candidature");
    const status = page.getByRole("status").filter({ hasText: /Ce que vous changez ici/ });
    await expect(async () => {
      await bio.fill("");
      await bio.fill(SUMMARY);
      await expect(status).not.toHaveText(/^Enregistré ·/, { timeout: 1_000 });
    }).toPass();
    await expect(status).toHaveText(/^Enregistré ·/, { timeout: 10_000 });
    // « Suivant » keeps what was typed and opens the next part.
    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText("Partie 3 sur 7")).toBeVisible();

    // Studio, then Aperçu, then « Enregistrer » and « Retour aux documents ».
    await page.goto(`/app/career/cv/${id}?etape=studio&nouveau=1`);
    await expect(page.getByRole("heading", { name: "Studio", level: 1 })).toBeVisible();
    await page
      .getByRole("navigation", { name: "Étapes du CV" })
      .getByRole("link", { name: "Aperçu" })
      .click();
    await page.waitForURL(/etape=voir/);
    await expect(page.getByRole("heading", { name: "Votre CV", level: 1 })).toBeVisible();
    await expect(page.getByText(SUMMARY).filter({ visible: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    const saved = page.getByRole("dialog", { name: "CV enregistré" });
    await expect(saved).toBeVisible();
    await saved.getByRole("button", { name: "Retour aux documents" }).click();
    await page.waitForURL("**/app/career/cv?onglet=documents");

    // The PDF downloaded is the person's CV, not an example nor an empty page.
    await page
      .locator("li")
      .filter({ has: page.locator(`a[href^="/app/career/cv/${id}"]`) })
      .getByRole("button", { name: /^Actions de « / })
      .filter({ visible: true })
      .click();
    const download = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: "Télécharger" }).click();
    const file = join(mkdtempSync(join(tmpdir(), "cv-v3-")), "cv.pdf");
    await (await download).saveAs(file);
    expect(execFileSync("pdftotext", [file, "-"]).toString()).toContain("Assistante comptable");
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
    await page.locator(".nb-cv-modele:not([data-verrou])").first().click();
    // The chosen card opens large when touched again: « Utiliser ce modèle » applies it too.
    await page
      .getByRole("button", { name: /^(Appliquer|Utiliser) ce modèle$/ })
      .filter({ visible: true })
      .click();
    await page.waitForURL(/etape=contenu/);

    // The PDF is this CV, with what was read (from its menu in « Mes documents »).
    await page.goto("/app/career/cv?onglet=documents");
    await page
      .locator("li")
      .filter({ has: page.locator(`a[href^="/app/career/cv/${id}"]`) })
      .getByRole("button", { name: /^Actions de « / })
      .filter({ visible: true })
      .click();
    const download = page.waitForEvent("download");
    await page.getByRole("dialog").getByRole("button", { name: "Télécharger" }).click();
    const file = join(mkdtempSync(join(tmpdir(), "cv-autre-")), "cv.pdf");
    await (await download).saveAs(file);
    expect(execFileSync("pdftotext", [file, "-"]).toString()).toContain("Excel");
  });

  test("le profil remplit le CV : « Reprendre les informations de mon profil »", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("carriere-v3-profil-cv"));
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

    await page.goto("/app/career/cv/nouveau");
    await page.getByRole("radio", { name: /^Reprendre les informations/ }).check();
    await page.getByRole("button", { name: "Valider" }).click();
    await page.waitForURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/, { timeout: 30_000 });
    // The name and the e-mail of the account are already in the boxes.
    await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveValue(
      /carriere-v3-profil-cv-.+@jumanly\.test/,
    );
    await expect(page.getByLabel("Nom complet")).not.toHaveValue("");
  });
});
