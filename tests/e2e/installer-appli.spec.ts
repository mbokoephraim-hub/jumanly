import type { Page } from "@playwright/test";
import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// « Installer l'appli » (Ephraïm, 20/10): Jumanly installs on the phone without the Play Store.
// Chrome and Edge open their own installation; Safari on iPhone shows its three steps.

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

test.describe("sur iPhone", () => {
  test.use({ userAgent: IPHONE });

  test("accueil : le bouton montre les trois gestes de Safari", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: /Installer l'appli/ });
    await expect(button).toBeVisible();
    await expect(button).toContainText("Sans passer par le Play Store");
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Installer Jumanly sur votre iPhone" });
    await expect(dialog).toBeVisible();
    const steps = dialog.getByRole("list", { name: "Étapes d'installation" }).getByRole("listitem");
    await expect(steps).toHaveCount(3);
    await expect(steps.nth(0)).toContainText("Touchez « Partager »");
    await expect(steps.nth(1)).toContainText("Choisissez « Sur l'écran d'accueil »");
    await expect(steps.nth(2)).toContainText("Touchez « Ajouter »");
    await expectAccessible(page);
    // Escape closes it and the focus goes back to the button (native <dialog>).
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await dialog.getByRole("button", { name: "Compris" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Paramètres : la ligne « Installer l'appli » ouvre les gestes", async ({ page }) => {
    await logIn(page, demo.talentFree);
    // On an iPhone the talent space is the Modèle B: the former Compte leads to Paramètres.
    await page.goto("/app/compte");
    await expect(page).toHaveURL(/\/app\/parametres$/);
    await expect(page.getByRole("heading", { level: 1, name: "Paramètres" })).toBeVisible();
    const row = page.locator(".nb-ca-reglages").getByRole("button", { name: /Installer l'appli/ });
    await expect(row).toBeVisible();
    await row.click();
    const dialog = page.getByRole("dialog", { name: "Installer Jumanly sur votre iPhone" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("listitem")).toHaveCount(3);
    await expectAccessible(page);
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
  });

  test("appli déjà installée : plus de bouton", async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, "standalone", { get: () => true }),
    );
    await page.goto("/");
    await hydrated(page);
    await expect(page.getByRole("button", { name: /Installer l'appli/ })).toHaveCount(0);
  });
});

test("Chrome et Edge : le bouton ouvre l'installation du navigateur", async ({ page }) => {
  // The browser's offer comes before React has mounted: the inline script keeps it.
  await page.addInitScript(
    `document.addEventListener("DOMContentLoaded", ${offerInstall.toString()});`,
  );
  await page.goto("/");
  await hydrated(page);
  const button = page.getByRole("button", { name: /Installer l'appli/ });
  await expect(button).toBeVisible();
  await expect(button).not.toHaveAttribute("aria-haspopup");
  await button.click();
  expect(
    await page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted),
  ).toBe(true);
  // The offer is used: the button goes until the browser makes a new one.
  await expect(button).toBeHidden();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await page.evaluate(offerInstall);
  await expect(button).toBeHidden();
});

test("navigateur qui ne sait pas installer : pas de bouton", async ({ page }) => {
  await page.goto("/");
  await hydrated(page);
  await expect(page.getByRole("button", { name: /Installer l'appli/ })).toHaveCount(0);
});
