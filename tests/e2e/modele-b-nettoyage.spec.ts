import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Modèle B, lot B9 (docs/modele-b § 6): the previous talent design is gone from the phone. An old
// address leads to its Modèle B screen, a screen without a mockup of its own keeps its content in
// the colours of the Modèle B under its own head, and nothing of the former head or bottom bar is
// left. Read only: the demo is not changed.
test.describe("Modèle B · nettoyage", () => {
  test.skip(({ isMobile }) => !isMobile, "Le Modèle B est l'interface du téléphone.");

  test("les anciennes adresses mènent à leur écran du Modèle B", async ({ page }) => {
    test.setTimeout(120_000);
    await logIn(page, "grace.ux@jumanly.test");
    // « Mon profil » has its own space since 29/10 (/app/profil); a tab given in the address may
    // be dropped from it once the page shows that tab.
    const cases: [string, RegExp][] = [
      ["/app/tableau-de-bord", /\/app$/],
      ["/app/espace", /\/app\/parametres$/],
      ["/app/compte", /\/app\/parametres$/],
      ["/app/compte/connexions", /\/app\/messages\/connexions\?onglet=reseau$/],
      ["/app/compte/connexions?onglet=demandes", /\/app\/messages\/connexions\?onglet=demandes$/],
      ["/app/suivi", /\/app\/career\/cv(\?onglet=candidatures)?$/],
      ["/app/jobs/candidatures", /\/app\/career\/cv(\?onglet=candidatures)?$/],
      ["/app/profil?fenetre=modifier", /\/app\/career\/profil$/],
      ["/app/profil/modifier", /\/app\/career\/profil$/],
      ["/app/profil/experience", /\/app\/career\/profil\/experience\/nouvelle$/],
      ["/app/profil/competence", /\/app\/profil(\?ajouter=competences)?$/],
      ["/app/career/portfolio", /\/app\/profil(\?onglet=realisations)?$/],
      ["/app/recherche", /\/app\/jobs$/],
      ["/app/learn/mes-formations", /\/app\/learn/],
    ];
    for (const [from, to] of cases) {
      await page.goto(from);
      await expect(page, from).toHaveURL(to, { timeout: 15_000 });
    }
    // Nothing of the former head and bottom bar of the talent space.
    await expect(page.locator(".nb-ancien, .t-barre-bas")).toHaveCount(0);
  });

  test("l'ancienne page Orbi ouvre la feuille d'Orbi", async ({ page }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/orbi");
    await page.waitForURL(/\/app$/);
    const sheet = page.getByRole("dialog", { name: "Orbi" });
    await expect(sheet.getByRole("textbox", { name: "Écrire à Orbi" })).toBeVisible();
    await sheet.getByRole("button", { name: "Fermer" }).last().click();
    await expect(sheet).toBeHidden();
    // The address is cleaned: coming back does not open it again.
    expect(new URL(page.url()).search).toBe("");
  });

  test("un écran sans maquette garde sa tête, son retour et les couleurs du Modèle B", async ({
    page,
  }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/career/cv");
    for (const [path, title] of [
      ["/app/career/diagnostic", "Diagnostic de carrière"],
      ["/app/parametres/securite", "Sécurité"],
      ["/app/orbi/historique", "Historique Orbi"],
    ]) {
      await page.goto(path);
      const frame = page.locator(".nb-cadre");
      await expect(frame.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      // The Modèle B night, flat: no glow of the former design.
      const look = await frame.evaluate((node) => ({
        background: getComputedStyle(node).backgroundColor,
        glow: getComputedStyle(node, "::before").display,
      }));
      expect(look).toEqual({ background: "rgb(11, 26, 31)", glow: "none" });
    }
    // « Retour » of a page opened directly goes to its parent: Orbi's history, to the Fil.
    await page.locator(".nb-cadre .t-tete-f").getByRole("link", { name: "Retour" }).click();
    await page.waitForURL(/\/app$/);
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
  });

  test("passer d'un écran sans maquette à un onglet ne montre jamais un écran vide", async ({
    page,
  }) => {
    await logIn(page, "grace.ux@jumanly.test");
    await page.goto("/app/orbi/historique", { waitUntil: "networkidle" });
    await expect(page.locator(".nb-cadre .t-tete-f")).toBeVisible();
    // While the tab comes, something opaque stays on screen at every frame.
    const watch = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let empty = 0;
          let frames = 0;
          const tick = () => {
            const shown = [...document.querySelectorAll<HTMLElement>(".nb-couche")].some(
              (node) =>
                getComputedStyle(node).display !== "none" &&
                Number(getComputedStyle(node).opacity) > 0.5 &&
                node.getBoundingClientRect().height > 0,
            );
            if (!shown) empty++;
            if (++frames < 60) requestAnimationFrame(tick);
            else resolve(empty);
          };
          requestAnimationFrame(tick);
        }),
    );
    await page.locator(".nb-cadre .t-tete-f").getByRole("link", { name: "Retour" }).click();
    expect(await watch).toBe(0);
    await page.waitForURL(/\/app$/);
  });
});
