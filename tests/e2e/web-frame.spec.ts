import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// L'espace talent sur ordinateur et tablette depuis le 07/11/2026 (Ephraïm : « la même logique, les
// mêmes idées » qu'au téléphone) : les écrans du Modèle B, le menu debout à gauche avec la marque et
// le nom des cinq onglets, le contenu au milieu, Orbi en bas à droite, ses fenêtres au milieu.
for (const [label, size] of [
  ["ordinateur", { width: 1440, height: 900 }],
  ["tablette", { width: 900, height: 1100 }],
] as const) {
  test(`cadre du talent sur ${label} : menu à gauche, cinq onglets, Orbi`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Le téléphone a la barre du bas (modele-b-fondations.spec.ts).");
    await page.setViewportSize(size);
    await logIn(page, demo.talentFree);
    await page.goto("/app");

    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Jumanly, aller au Fil" })).toBeVisible();
    for (const name of ["Fil", "Explorer", "Carrière", "Hub", /^Chat/])
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    const box = await nav.boundingBox();
    expect(box!.x).toBe(0);
    expect(box!.height).toBeGreaterThan(size.height * 0.9);
    // The Fil's content sits to the right of the menu.
    const head = page.getByRole("heading", { name: "Fil", level: 1 }).filter({ visible: true });
    expect((await head.boundingBox())!.x).toBeGreaterThan(box!.width);
    await expectAccessible(page);

    // Each tab opens its screen, the menu stays on the left (also on a page opened from a tab).
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
    await page.goto("/app/parametres");
    await expect(nav).toBeVisible();

    // Orbi floats at the bottom right; its sheet opens in the middle of the screen.
    await page.goto("/app");
    await page.getByRole("button", { name: /Orbi/ }).filter({ visible: true }).last().click();
    const sheet = page.getByRole("dialog", { name: "Orbi" });
    await expect(sheet.getByRole("textbox", { name: "Écrire à Orbi" })).toBeVisible();
  });
}
