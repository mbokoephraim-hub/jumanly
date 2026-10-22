import { expect, test } from "./fixtures";
import { logIn } from "./session";

// The dark background of the Modèle B covers the whole phone screen, under the status bar and the
// home indicator too (request of 22 October 2026): the page runs under them (viewport-fit=cover),
// the browser bar and the installed app take the night, the html behind the page is the night.
test.describe("Modèle B · plein écran", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  const night = "#0b1a1f";

  test("le fond sombre couvre tout l'écran, de l'accueil à l'espace", async ({ page }) => {
    for (const path of ["/connexion", "/decouvrir"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
        "content",
        /viewport-fit=cover/,
      );
      await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
        "content",
        night,
      );
    }
    await logIn(page, "grace.ux@jumanly.test");
    for (const path of ["/app", "/app/parametres/securite"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
        "content",
        night,
      );
      const backgrounds = await page.evaluate(() => [
        getComputedStyle(document.documentElement).backgroundColor,
        getComputedStyle(document.body).backgroundColor,
      ]);
      expect(backgrounds, path).toEqual(["rgb(11, 26, 31)", "rgb(11, 26, 31)"]);
    }
    // The installed app opens on /demarrage, then goes to /app without reloading: Next writes the
    // theme-color of the root layout again, the phone keeps the night.
    await page.goto("/demarrage");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
      "content",
      night,
    );
    const manifest = await (await page.request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ background_color: night, theme_color: night });
  });

  test("un champ de texte n'affiche pas de cadre vert quand on écrit", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/messages", { waitUntil: "networkidle" });
    const field = page.getByRole("main").locator(".nb-ms-champ input").first();
    await field.click();
    await expect(field).toBeFocused();
    const style = await field.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, shadow: s.boxShadow };
    });
    expect(style).toEqual({ outline: "none", shadow: "none" });

    // Nor the text of a new post in the Fil.
    await page.goto("/app/fil/publier", { waitUntil: "networkidle" });
    const text = page.getByRole("textbox", { name: /publication/i });
    await text.click();
    await expect(text).toBeFocused();
    expect(await text.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  });
});
