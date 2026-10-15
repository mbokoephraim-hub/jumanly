import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { demo, logIn, signUpFromPricing, testEmail } from "./session";

/**
 * « Mes CV » and the CV editor v2 (docs/refonte-career/BRIEF-CV-V2.md § 5). Also run with
 * `pnpm test:e2e:reduced`. The PDF check needs poppler-utils (pdftotext).
 */

async function newCv(page: Page) {
  await page.goto("/app/career/cv");
  await page.getByRole("button", { name: "Nouveau CV", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("Mes CV : CV principal, autres CV, menu « … » et limite", async ({ page }) => {
  test.setTimeout(150_000);
  const email = testEmail("mes-cv");
  await signUpFromPricing(page, "Créer mon compte gratuit", email);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // Without any CV: the empty state, no CV principal.
  await page.goto("/app/career/cv");
  await expect(page.locator("#cv-principal")).toHaveCount(0);
  for (let index = 0; index < 3; index++) await newCv(page);

  await page.goto("/app/career/cv");
  const primary = page.locator("#cv-principal").filter({ visible: true });
  for (const criterion of ["Lisibilité ATS", "Impact", "Mots-clés"]) {
    await expect(primary).toContainText(criterion);
  }
  const others = page.locator("#cv-autres").filter({ visible: true });
  // Two other CVs, then the « Nouveau CV » card with the real number left.
  await expect(others.locator("ul > li")).toHaveCount(3);
  await expect(others).toContainText("Il vous reste 7 CV.");

  // The « … » menu makes another CV the CV principal; the person stays on the list.
  const second = others.locator("ul > li").first();
  const title = (await second.locator("h3").innerText()).trim();
  await second.locator("summary").first().click();
  await second.getByRole("button", { name: "Utiliser par défaut pour mes candidatures" }).click();
  await expect(page).toHaveURL(/ok=principal/);
  await expect(primary.locator("h3")).toHaveText(title);

  // At the limit: no more « Nouveau CV » card, the existing alert instead.
  execFileSync("pnpm", ["exec", "tsx", "tests/e2e/fill-cvs.ts", email]);
  await page.goto("/app/career/cv");
  await expect(others).toContainText("Vous pouvez avoir jusqu'à 10 CV.");
  await expect(others).not.toContainText("Il vous reste");
  await expect(others.locator("ul > li")).toHaveCount(9);
});

test("éditeur : vue dans l'adresse, section surlignée sur l'aperçu seulement, barres", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120_000);
  await logIn(page, demo.talentPro);
  const id = await newCv(page);

  // The pill switch keeps the view in the address.
  const switcher = page.locator(".jm-cv-switch").filter({ visible: true });
  await switcher.getByRole("link", { name: "Mise en forme" }).click();
  await expect(page).toHaveURL(/vue=style/);
  await expect(switcher).toHaveAttribute("data-view", "style");
  await switcher.getByRole("link", { name: "Contenu" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/career/cv/${id}$`));
  await expect(switcher).toHaveAttribute("data-view", "content");

  // Opening « Expériences » highlights its block on the sheet, and only that one.
  const preview = page.locator(".jm-cv-editor").filter({ visible: true }).locator(".cv-apercu");
  const block = (section: string) => preview.locator(`.cv-pages [data-id="${section}"]`).first();
  await expect(block("summary")).toHaveCSS("outline-style", "solid");
  await page
    .locator('details[data-section="experience"] > summary')
    .filter({ visible: true })
    .click();
  await expect(block("experience")).toHaveCSS("outline-style", "solid");
  await expect(block("summary")).toHaveCSS("outline-style", "none");
  await expect(
    page.getByText("La section que vous modifiez est surlignée sur la page"),
  ).toBeVisible();

  // The exported PDF carries no trace of it (no section label).
  const response = await page.request.post(`/api/cv/${id}/export?format=pdf`);
  expect(response.status()).toBe(200);
  const file = join(mkdtempSync(join(tmpdir(), "cv-v2-")), "cv.pdf");
  writeFileSync(file, await response.body());
  const text = execFileSync("pdftotext", ["-layout", file, "-"]).toString();
  expect(text).not.toMatch(/Expériences/);

  // The workshop bar stays on screen at the bottom of the page.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const bar = page.locator("#cv-atelier").filter({ visible: true });
  await expect(bar).toBeInViewport();

  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);

  if (isMobile) {
    // On a phone: the preview first, the download in a fixed bar above the bottom menu.
    const previewBox = await page
      .locator('section[aria-labelledby="cv-preview"]')
      .filter({ visible: true })
      .boundingBox();
    const switchBox = await switcher.boundingBox();
    expect(previewBox!.y).toBeLessThan(switchBox!.y);
    const mobileBar = page.locator("#cv-barre-mobile").filter({ visible: true });
    await expect(mobileBar).toHaveCSS("position", "fixed");
    await expect(mobileBar).toBeInViewport();
    await expect(mobileBar.getByRole("link", { name: "Télécharger le PDF" })).toBeVisible();
  }

  // Clean up: the demo account keeps room for the other journeys.
  await page.evaluate(() => window.scrollTo(0, 0));
  await bar.locator('summary[aria-label="Plus d\'actions"]').click();
  await bar.locator("summary").filter({ hasText: "Supprimer ce CV" }).click();
  await bar.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page).toHaveURL(/ok=supprime/);
});
