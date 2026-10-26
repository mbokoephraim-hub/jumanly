import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Modèle B, lot B1 (docs/modele-b, brief § 3): the phone interface of the talent space.
test.describe("Modèle B · fondations au téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("ouverture, barre du bas en icônes, Orbi et transitions", async ({ page }) => {
    // Every page change is recorded: a View Transition keeps the old screen until the new one covers it.
    await page.addInitScript(() => {
      const record: { gesture: string | null; finished: boolean }[] = [];
      (window as unknown as { __nb: typeof record }).__nb = record;
      const start = document.startViewTransition?.bind(document);
      if (!start) return;
      document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
        const entry = {
          gesture: document.documentElement.dataset.nbGeste ?? null,
          finished: false,
        };
        record.push(entry);
        const transition = start(arg);
        void transition.finished.finally(() => {
          entry.finished = true;
        });
        return transition;
      }) as typeof document.startViewTransition;
    });

    await logIn(page, demo.talentPro);
    // A new session of the app: the logo alone shows at the opening, then leaves on its own.
    await page.addInitScript(() => sessionStorage.removeItem("jm-ouvert"));
    await page.goto("/app");
    await expect(page.locator("#nb-ouverture")).toBeVisible();
    await expect(page.locator("#nb-ouverture")).toHaveCount(0, { timeout: 5000 });

    // The pill menu (docs/fil-menu-publication § 1): five tabs, the active one a Lime pill with
    // its name, the others round icons.
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const tabs = nav.getByRole("link");
    await expect(tabs).toHaveCount(5);
    for (const name of ["Fil", "Explorer", "Carrière", "Hub", /^Chat/]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Fil", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator('[aria-current="page"] .nb-nav-nom')).toHaveText("Fil");
    await expect(nav.locator('[aria-current="page"]')).toHaveCSS(
      "background-color",
      "rgb(166, 242, 107)",
    );
    await expect(nav.getByRole("link", { name: "Explorer", exact: true })).toHaveCSS(
      "background-color",
      "rgb(32, 63, 66)",
    );

    // No empty click: each tab opens its screen.
    for (const [name, path] of [
      ["Explorer", "/app/jobs"],
      ["Carrière", "/app/career/cv"],
      ["Hub", "/app/learn"],
      [/^Chat/, "/app/messages"],
      ["Fil", "/app"],
    ] as const) {
      await nav.getByRole("link", { name, exact: true }).click();
      await page.waitForURL((url) => url.pathname === path);
      await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
    }

    // The page changes went through View Transitions marked with the tab gesture, all finished.
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as { __nb: { gesture: string | null; finished: boolean }[] }).__nb
            .filter((entry) => entry.gesture?.startsWith("onglet"))
            .every((entry) => entry.finished),
        ),
      )
      .toBe(true);
    const gestures = await page.evaluate(() =>
      (window as unknown as { __nb: { gesture: string | null }[] }).__nb.map(
        (entry) => entry.gesture,
      ),
    );
    expect(gestures).toContain("onglet-d");
    expect(gestures).toContain("onglet-g");

    // Orbi floats on each tab, with a question suited to it; a touch opens its sheet.
    await expect(
      page.getByRole("button", { name: "Résumer les nouveautés du jour ?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Ouvrir Orbi, l'assistant" }).click();
    const sheet = page.getByRole("dialog", { name: "Orbi" });
    await expect(sheet.getByText("Orbi · depuis le Fil")).toBeVisible();
    await expect(sheet.locator(".nb-q")).toHaveCount(4);
    await sheet.getByRole("button", { name: "Qui suivre dans mon domaine ?" }).click();
    // Orbi answers (without the model in tests), then « Retour » comes back to the questions.
    await expect(sheet.getByText("Orbi propose, vous décidez.")).toBeVisible();
    await sheet.getByRole("button", { name: "Retour" }).click();
    await expect(sheet.locator(".nb-q")).toHaveCount(4);
    await sheet.getByRole("button", { name: "Fermer" }).last().click();
    await expect(sheet).toBeHidden();

    // Only dark: the phone interface has no light mode.
    await expect(page.locator(".nb-app")).toHaveCSS("background-color", "rgb(11, 26, 31)");

    // No horizontal scroll.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
