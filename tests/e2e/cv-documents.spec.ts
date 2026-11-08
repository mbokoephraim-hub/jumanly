import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { fictiveDocx, signUpFromPricing, testEmail } from "./session";

/**
 * Importing a CV (« Créer un CV · Importer », docs/carriere-v3). Since 07/11/2026 the computer has the
 * Modèle B screens of the phone: the former web studio and « CV et documents » tests are gone, the
 * CV screens are tested by `modele-b-carriere.spec.ts`.
 * Also run with `pnpm test:e2e:reduced`.
 */

test("importer un CV : fichier refusé, puis Word lu et vérifié", async ({ page }) => {
  test.setTimeout(120_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("cv-import"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // « Créer un CV · Importer » (docs/carriere-v3, captures 13 to 15), on every device since 07/11/2026.
  await page.goto("/app/career/cv/nouveau?etape=import");
  await expect(page.getByRole("heading", { name: "Importer un CV", level: 1 })).toBeVisible();
  await expect(page.getByText("PDF ou Word, 4 Mo au plus")).toBeVisible();
  const field = page.locator("#cv-nouveau-fichier");

  // Not a PDF nor a Word file: refused, with what to do.
  await field.setInputFiles({
    name: "cv.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Ceci n'est pas un CV."),
  });
  await expect(page).toHaveURL(/erreur=format/);
  await expect(
    page.getByText("Ce fichier n’est ni un PDF ni un document Word", { exact: false }),
  ).toBeVisible();

  await field.setInputFiles(
    fictiveDocx(["Comptable (fictif).", "Excel, comptabilité, archivage."]),
  );
  // The phone: what was found, ticked, then three ways out; « Remplir mon profil » keeps the CV
  // in « Mes CV » too and opens it in the reader.
  await expect(page.getByText("Voici ce qu’Orbi a trouvé")).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: /^Remplir mon profil avec ce CV/ }).click();
  await expect(page).toHaveURL(/\/lire\?importe=profil/, { timeout: 20_000 });
});
