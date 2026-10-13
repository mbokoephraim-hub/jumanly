import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Étape E1 (docs/specifications.md, partie 12): public site, rendered on the server and
// readable without an account. Courses and jobs come from the fictional demo seed.
const NOT_FOUND_TITLE = "Page introuvable";

const publicPages = [
  "/",
  "/a-propos",
  "/talents",
  "/recruteurs",
  "/entreprises",
  "/partenaires",
  "/formations",
  "/offres",
  "/tarifs",
  "/faq",
  "/contact",
  "/cookies",
];

async function firstDetailPath(page: Page, list: string, prefix: string) {
  await page.goto(list);
  const href = await page.locator(`main a[href^="${prefix}"]`).first().getAttribute("href");
  expect(href).toBeTruthy();
  return href!;
}

for (const path of publicPages) {
  test(`${path} s'affiche sans compte, sans téléphone`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    // Server-rendered: the main content is in the HTML before any JavaScript runs.
    const html = await response!.text();
    expect(html).toContain("<h1");
  });
}

test("une page inconnue renvoie une 404 non indexée", async ({ page }) => {
  const response = await page.goto("/cette-page-n-existe-pas");
  expect(response?.status()).toBe(404);
  // An unknown job or course is rendered on demand: the very first render of a new address may be
  // streamed with status 200, so we check what the visitor and search engines see.
  for (const path of [`/offres/inconnue-${Date.now()}`, `/formations/inconnue-${Date.now()}`]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: NOT_FOUND_TITLE })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  }
});

test("les boutons « Choisir » des formules mènent à l'inscription avec le forfait", async ({
  page,
}) => {
  await page.goto("/tarifs");
  const choose = page.getByRole("link", { name: "Choisir Pro", exact: true });
  await expect(choose).toHaveAttribute("href", /^\/inscription\?profil=talent&forfait=talent_\w+/);
  for (const link of await page.locator('main a[href^="/inscription"]').all()) {
    expect(await link.getAttribute("href")).toMatch(/^\/inscription(\?|$)/);
  }
});

test("le bouton « Postuler gratuitement » mène à l'inscription puis à l'offre", async ({
  page,
}) => {
  const detail = await firstDetailPath(page, "/offres", "/offres/");
  await page.goto(detail);
  const apply = page.getByRole("link", { name: "Postuler gratuitement" }).first();
  const href = await apply.getAttribute("href");
  expect(href).toMatch(/^\/inscription\?/);
  const params = new URLSearchParams(href!.split("?")[1]);
  expect(params.get("profil")).toBe("talent");
  expect(params.get("suite")).toContain(detail.split("/").pop()!);
});

test("le bouton « Commencer » d'une formation mène à l'inscription", async ({ page }) => {
  const detail = await firstDetailPath(page, "/formations", "/formations/");
  await page.goto(detail);
  const start = page.getByRole("link", { name: /^Commencer/ }).first();
  const href = await start.getAttribute("href");
  expect(href).toMatch(/^\/inscription\?/);
  expect(new URLSearchParams(href!.split("?")[1]).get("suite")).toBeTruthy();
});

test("la recherche d'offres filtre par mot-clé", async ({ page }) => {
  await page.goto("/offres?q=zzzzzz-introuvable");
  await expect(page.locator('main a[href^="/offres/"]')).toHaveCount(0);
});

test("le formulaire de contact envoie le message par e-mail", async ({ page }, testInfo) => {
  await page.goto("/contact");
  await page.locator('select[name="subject"]').selectOption("account");
  await page.locator('input[name="name"]').fill("Visiteur de test");
  await page
    .locator('input[name="email"]')
    .fill(`e2e-${testInfo.project.name}-${Date.now()}@exemple.org`);
  await page
    .locator('textarea[name="message"]')
    .fill("Bonjour, ceci est un message de test automatique.");
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(
    page.getByRole("heading", { name: "Merci, votre message est envoyé" }),
  ).toBeVisible();
});

test("le formulaire de contact signale les champs manquants", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Envoyer mon message" }).click();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
});

test("le bandeau cookies mémorise le choix", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Tout refuser" }).click();
  await expect(page.getByRole("button", { name: "Tout refuser" })).toBeHidden();
  const cookie = (await context.cookies()).find((c) => c.name === "jm_consent");
  expect(cookie?.value).toBe("v1.a0.p0");
  await page.reload();
  await expect(page.getByRole("button", { name: "Tout refuser" })).toBeHidden();
});

test("sitemap et robots sont publiés", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/tarifs");
  expect(xml).toContain("/offres/");
  expect((await request.get("/robots.txt")).status()).toBe(200);
});

// Rule 9 (CLAUDE.md): at most 200 KB of JavaScript (compressed) per public page.
for (const path of ["/", "/formations", "/offres", "/tarifs"]) {
  test(`${path} reste sous 200 Ko de JavaScript`, async ({ page }) => {
    let bytes = 0;
    const sizes: Promise<number>[] = [];
    page.on("requestfinished", (request) => {
      if (request.resourceType() !== "script") return;
      // Bytes on the wire (compressed), as a slow mobile network would download them.
      sizes.push(request.sizes().then((size) => size.responseBodySize));
    });
    await page.goto(path, { waitUntil: "networkidle" });
    for (const size of await Promise.all(sizes)) bytes += size;
    expect(bytes).toBeLessThan(200 * 1024);
  });
}

for (const path of [...publicPages.slice(1), "/mentions-legales", "/confidentialite"]) {
  test(`aucune erreur d'accessibilité WCAG 2.2 AA sur ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const summary = results.violations.map(
      (violation) =>
        `${violation.id} : ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(" ")).join("\n  ")}`,
    );
    expect(summary).toEqual([]);
  });
}
