import { expect, type Page } from "./fixtures";

// Web recruteur 2 (docs/refonte-web/recruteur-2) : sur un grand écran, une candidature s'ouvre à
// côté de la liste et le calendrier montre le jour et ses heures côte à côte. Les parcours écrits
// pour le téléphone passent par ces aides pour rester valables dans le projet « desktop ».

const width = (page: Page) => page.viewportSize()?.width ?? 0;

/** From 1200 px the list and the file sit side by side (planche `.ats`). */
export const wideList = (page: Page) => width(page) >= 1200;

/**
 * Opens a candidate's complete file from the list of an offer: directly on a phone or a tablet,
 * through the file opened beside the list on a computer.
 */
export async function openCandidateFile(page: Page, name: RegExp) {
  const main = page.locator("main").filter({ visible: true });
  // On a phone (Modèle B recruteur, M5) the tab opens on « Fort potentiel »: a new application
  // is in « Toutes », stage « Reçue ».
  const views = main.getByRole("navigation", { name: "Vues des candidatures" });
  // Waits for the list (or the phone's views) before deciding which screen this is.
  await expect(views.or(main.getByRole("link", { name })).first()).toBeVisible();
  if (await views.count()) {
    await views.getByRole("link", { name: "Toutes", exact: true }).click();
    await page.waitForURL(/vue=toutes/);
  }
  await main.getByRole("link", { name }).first().click();
  // A click before the list is interactive still follows the link to the file: both are fine.
  await page.waitForURL(
    (url) => url.searchParams.has("id") || /\/app\/hire\/candidats\/[^/?]+$/.test(url.pathname),
  );
  if (wideList(page) && new URL(page.url()).searchParams.has("id")) {
    const pane = main.getByRole("region", { name: /^Dossier de / });
    await expect(pane).toBeVisible();
    await pane.getByRole("link", { name: /^Ouvrir le dossier complet de / }).click();
    // The address changes first; the list leaves the screen once the file is there.
    await expect(pane).toHaveCount(0);
  }
  await expect(page).toHaveURL(/\/app\/hire\/candidats\/[^/?]+$/);
  // On a phone the candidate opens on their profile (docs/profil-personne): go on to the file.
  // Since 08/11/2026 the recruiter's computer has the phone's screens too (Modèle B, `.nb-app`).
  if (await page.locator(".nb-app").count()) {
    await expect(page.locator(".nb-rh-fiche-p").filter({ visible: true })).toBeVisible();
    await page.goto(`${page.url()}?onglet=resume`);
    await expect(page.locator(".nb-rh-fiche").filter({ visible: true })).toBeVisible();
  }
}
