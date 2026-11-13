import { expect, test } from "@playwright/test";
import { logIn } from "./session";

/**
 * Mode MVP (docs/mvp-web-recruteur, lot M0). The server is built and started with one value of
 * PRODUCT_SCOPE: `full` (CI, default) runs the first block, `hire` the second
 * (`PRODUCT_SCOPE=hire pnpm build && PRODUCT_SCOPE=hire pnpm test:e2e mvp-mode`).
 */
const hire = process.env.PRODUCT_SCOPE === "hire";

test.describe("mode full : rien ne change", () => {
  test.skip(hire, "serveur lancé en mode hire");

  test("les pages de la plateforme restent ouvertes et le recruteur garde son cadre", async ({
    page,
  }) => {
    const formations = await page.goto("/formations");
    expect(formations?.status()).toBe(200);
    await expect(page).toHaveURL(/\/formations$/);
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
    await expect(page).toHaveURL(/\/app\/hire/);
    await expect(page.locator(".hv3-cadre")).toHaveCount(0);
  });
});

test.describe("mode hire : seulement le recrutement", () => {
  test.skip(!hire, "serveur lancé en mode full");

  test("les pages en veille renvoient vers le site", async ({ page }) => {
    for (const path of ["/formations", "/talents", "/partenaires", "/attestations"]) {
      const response = await page.request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      expect(response.headers().location, path).toMatch(/^\/$|^http:\/\/localhost:\d+\/$/);
    }
    for (const path of ["/offres", "/tarifs", "/recruteurs"]) {
      const response = await page.request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
    }
  });

  test("le site ne montre plus de lien vers une page en veille", async ({ page }) => {
    await page.goto("/");
    for (const href of ["/formations", "/talents", "/partenaires", "/attestations"])
      await expect(page.locator(`a[href="${href}"]`), href).toHaveCount(0);
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/formations");
    const llms = await (await page.request.get("/llms.txt")).text();
    expect(llms).not.toContain("/formations");
  });

  test("le recruteur a le cadre du prototype et ses modules", async ({ page }) => {
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
    await expect(page).toHaveURL(/\/app\/hire(\?|$)/);
    const nav = page.getByRole("navigation", { name: "Menu principal" });
    await expect(nav).toBeVisible();
    for (const name of [
      "Accueil",
      "Offres",
      "Candidats",
      "Agenda",
      "Vivier",
      "Messages",
      "Rapports",
    ])
      await expect(nav.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Accueil" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // No Fil: « À traiter » alone, on the whole width.
    await expect(page.locator(".nb-rh-cote[data-plein]")).toBeVisible();
    await expect(page.getByRole("link", { name: "Fil" })).toHaveCount(0);
    await page.goto("/app/fil/publier");
    await expect(page).toHaveURL(/\/app\/hire(\?|$)/);
    // Talents → Vivier only.
    await nav.getByRole("link", { name: "Vivier" }).click();
    await expect(page).toHaveURL(/onglet=vivier/);
    await page.goto("/app/hire/talents");
    await expect(page).toHaveURL(/onglet=vivier/);
    await expect(page.getByRole("link", { name: /^Découvrir/ })).toHaveCount(0);
  });

  test("cadre v3 : recherche Ctrl K, menu profil et mode sombre", async ({ page }) => {
    await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
    await expect(page.locator(".hv3-cadre .top")).toBeVisible();
    // Rail: Nouvelle offre, Orbi, then the tools.
    const rail = page.locator("#rail");
    for (const name of ["Nouvelle offre", "Orbi", "Page entreprise", "Équipe", "Formule"])
      await expect(rail.getByRole(name === "Orbi" ? "button" : "link", { name })).toBeVisible();
    // Ctrl K: the filters, the rapid actions, the pages.
    await page.keyboard.press("Control+k");
    const search = page.getByRole("dialog", { name: "Recherche" });
    await expect(search).toBeVisible();
    await expect(search.getByRole("button", { name: /^Tout/ })).toBeVisible();
    await expect(search.getByText("Actions rapides")).toBeVisible();
    await search.getByPlaceholder("Chercher un candidat, une offre, une page…").fill("Agenda");
    await expect(search.locator(".po").first()).toContainText("Agenda");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/app\/hire\/entretiens/);
    // Profile menu: the dark mode, kept on the account.
    await page.locator("#mebtn").click();
    const dark = page.getByRole("switch", { name: "Mode sombre" });
    await expect(dark).toHaveAttribute("aria-checked", "false");
    await dark.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.locator("#mebtn").click();
    await page.getByRole("switch", { name: "Mode sombre" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
    await page.waitForLoadState("networkidle");
  });

  test("un talent garde ses candidatures, ses messages et son profil", async ({ page }) => {
    await logIn(page, "talent.free@jumanly.test", undefined, "/app");
    // « Suivi » opens in Carrière (applications) on the Modèle B.
    await expect(page).toHaveURL(/\/app\/(suivi|career)/);
    // Asleep pages answer a 307 to the account's home (then « Suivi »), offers go to the site.
    for (const [path, to] of [
      ["/app/learn", "/app"],
      ["/app/explorer", "/app"],
      ["/app/fil/publier", "/app"],
      ["/app/jobs", "/offres"],
    ]) {
      const response = await page.request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(307);
      expect(new URL(response.headers().location!, "http://x").pathname, path).toBe(to);
    }
    await page.goto("/app/messages");
    await expect(page).toHaveURL(/\/app\/messages/);
    // The applications live in Carrière on the Modèle B (the old address leads there).
    await page.goto("/app/jobs/candidatures");
    await expect(page).toHaveURL(/\/app\/(jobs\/candidatures|career)/);
  });
});
