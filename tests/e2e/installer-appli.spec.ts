import type { Page } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// « Installer l'appli » (Ephraïm, 20/10): Jumanly installs on the phone without the Play Store.
// Chrome and Edge open their own installation; Safari on iPhone shows its three steps.
// Since the home page was simplified (31/10, one button only), the row lives in the account:
// Compte on a computer, Paramètres on a phone (/app/compte leads there).

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

/** The button is drawn hidden by the server: wait until React has taken it over. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const button = document.querySelector("[data-install] > button");
    return !!button && Object.keys(button).some((key) => key.startsWith("__reactFiber"));
  });
}

/** What Chrome fires when the app can be installed, with a prompt() that leaves a trace. */
const offerInstall = () => {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(event, {
    prompt: () => {
      (window as unknown as { __prompted: boolean }).__prompted = true;
      return Promise.resolve();
    },
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  window.dispatchEvent(event);
};

/** The account page that holds the row: Compte on a computer, Paramètres on a phone. */
async function openAccount(page: Page) {
  await logIn(page, demo.talentFree);
  await page.goto("/app/compte");
  await hydrated(page);
  // Previous routes stay hidden in the page (cacheComponents): only the visible row counts.
  return page.getByRole("button", { name: /Installer l'appli/ }).filter({ visible: true });
}

test.describe("sur iPhone", () => {
  test.use({ userAgent: IPHONE });

  test("Paramètres : la ligne « Installer l'appli » montre les trois gestes de Safari", async ({
    page,
  }) => {
    const row = await openAccount(page);
    // On an iPhone the talent space is the Modèle B: the former Compte leads to Paramètres.
    await expect(page).toHaveURL(/\/app\/parametres$/);
    await expect(page.getByRole("heading", { level: 1, name: "Paramètres" })).toBeVisible();
    await expect(row).toBeVisible();
    await expect(row).toContainText("Sans passer par le Play Store");
    await row.click();
    const dialog = page.getByRole("dialog", { name: "Installer Jumanly sur votre iPhone" });
    await expect(dialog).toBeVisible();
    const steps = dialog.getByRole("listitem");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText("Touchez « Partager »");
    await expect(steps.nth(1)).toContainText("Choisissez « Sur l'écran d'accueil »");
    await expect(steps.nth(2)).toContainText("Touchez « Ajouter »");
    await expectAccessible(page);
    // Escape closes it and the focus goes back to the row (native <dialog>).
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(row).toBeFocused();
    await row.click();
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
  });

  test("appli déjà installée : plus de ligne", async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, "standalone", { get: () => true }),
    );
    const row = await openAccount(page);
    await expect(row).toHaveCount(0);
  });
});

test("Chrome et Edge : la ligne ouvre l'installation du navigateur", async ({ page }) => {
  // The browser's offer comes before React has mounted: the inline script keeps it.
  await page.addInitScript(
    `document.addEventListener("DOMContentLoaded", ${offerInstall.toString()});`,
  );
  const button = await openAccount(page);
  await expect(button).toBeVisible();
  await expect(button).not.toHaveAttribute("aria-haspopup");
  await button.click();
  expect(
    await page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted),
  ).toBe(true);
  // The offer is used: the row goes until the browser makes a new one.
  await expect(button).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await page.evaluate(offerInstall);
  await expect(button).toHaveCount(0);
});

test("navigateur qui ne sait pas installer : pas de ligne", async ({ page }) => {
  const row = await openAccount(page);
  await expect(row).toHaveCount(0);
});
