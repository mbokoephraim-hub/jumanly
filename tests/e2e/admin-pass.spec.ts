import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn, skipIntro } from "./session";

/**
 * Admin v2, étape 9 · passe finale: every screen of Jumanly Admin at 1440 px (desktop) and 390 px
 * (mobile): it opens, has one title, no horizontal scroll, no text key left raw, no WCAG 2.2 AA
 * violation found by axe, and the keyboard reaches a visible element first.
 */
const groups: Record<string, string[]> = {
  "indicateurs et comptes": [
    "/admin",
    "/admin/indicateurs/couts",
    "/admin/utilisateurs",
    "/admin/organisations",
    "/admin/recherche?q=fictif",
  ],
  "forfaits et formations": [
    "/admin/forfaits",
    "/admin/forfaits/talent_pro",
    "/admin/abonnements",
    "/admin/formations",
    "/admin/formations?vue=liste",
    "/admin/formations/nouvelle",
  ],
  modération: [
    "/admin/offres",
    "/admin/offres?onglet=corrections",
    "/admin/offres?onglet=toutes",
    "/admin/signalements",
    "/admin/signalements?statut=closed",
    "/admin/journal",
  ],
  "partenaires, IA et contenus": [
    "/admin/partenaires",
    "/admin/ia",
    "/admin/ia?onglet=poids",
    "/admin/ia?onglet=revisions",
    "/admin/ia?onglet=journal",
    "/admin/contenus",
    "/admin/contenus?onglet=bannieres",
    "/admin/contenus?onglet=conseils",
  ],
};

/** A text key of messages/fr.json shown as is (`admin.users.title`), outside <code>. */
const RAW_KEY =
  /\b(?:admin|common|career|hire|learn|jobs|pricing|faq|partner|mail|notifications|nav|match|ai)\.[a-zA-Z]+\.[a-zA-Z.]+\b/;

async function check(page: Page, path: string) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  await expect(page.locator("h1:visible"), path).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${path} · défilement horizontal`).toBeLessThanOrEqual(1);
  const text = await page.evaluate(() => {
    const body = document.body.cloneNode(true) as HTMLElement;
    body.querySelectorAll("code, script, style").forEach((node) => node.remove());
    return body.innerText;
  });
  expect(text.match(RAW_KEY)?.[0] ?? null, `${path} · clé brute`).toBeNull();
  // A link to a fiche (`#utilisateurs-fiche`) sets where the keyboard starts; when the fiche
  // streams in after the browser has looked for it, that point is lost and Tab leaves the page.
  // Start from the main content instead, as the skip link does.
  if (path.includes("#")) await page.locator("#content").focus();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return Boolean(active && active !== document.body && active.getClientRects().length > 0);
    }),
    `${path} · clavier`,
  ).toBe(true);
  await expectAccessible(page);
}

for (const [name, paths] of Object.entries(groups)) {
  test(`passe finale de l'admin · ${name}`, async ({ page, isMobile }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(
      isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    );
    await logIn(page, demo.admin);
    for (const path of paths) await check(page, path);
  });
}

test("passe finale de l'admin · fiches ouvertes", async ({ page, isMobile }) => {
  test.setTimeout(240_000);
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await logIn(page, demo.admin);
  // The first course, user and organization of each list, opened on their own page.
  await page.goto("/admin/formations");
  const course = await page
    .locator(
      'a[href^="/admin/formations/"]:not([href^="/admin/formations/nouvelle"]):not([href^="/admin/formations/domaines"]):not([href^="/admin/formations/parcours"])',
    )
    .first()
    .getAttribute("href");
  const base = course?.split("?")[0];
  // Admin v3, étape 4: every step of the course editor.
  const steps = [
    "informations",
    "public",
    "programme",
    "documents",
    "quiz",
    "attestation",
    "publication",
  ];
  for (const path of [
    course,
    ...steps.map((step) => `${base}?etape=${step}`),
    `${base}/apercu`,
  ].filter(Boolean) as string[])
    await check(page, path);
  await page.goto("/admin/utilisateurs?q=talent.free%40jumanly.test");
  const user = await page.locator('a[href*="fiche="]').first().getAttribute("href");
  if (user) await check(page, user);
  await page.goto("/admin/organisations");
  const org = await page.locator('a[href*="fiche="]').first().getAttribute("href");
  if (org) await check(page, org);
});

// Admin v3, étape 7: the course PDFs with the three roles. The administrator and the content editor
// download all five; support, who never edits courses, gets none.
test("passe finale de l'admin · PDF des formations et rôles", async ({ browser, baseURL }) => {
  test.setTimeout(240_000);
  const kinds = ["programme", "support", "quiz", "attestation", "bilan"];
  const open = async (email: string) => {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await skipIntro(page);
    await logIn(page, email);
    return { context, page };
  };

  const admin = await open(demo.admin);
  await admin.page.goto("/admin/formations");
  const href = await admin.page
    .locator(
      'a[href^="/admin/formations/"]:not([href^="/admin/formations/nouvelle"]):not([href^="/admin/formations/domaines"]):not([href^="/admin/formations/parcours"])',
    )
    .first()
    .getAttribute("href");
  const base = href!.split("?")[0]!;
  for (const kind of kinds) {
    const response = await admin.page.request.get(`${base}/pdf/${kind}`);
    expect(response.status(), kind).toBe(200);
    expect((await response.body()).subarray(0, 4).toString(), kind).toBe("%PDF");
  }
  await admin.context.close();

  const editor = await open(demo.editor);
  expect((await editor.page.request.get(`${base}/pdf/quiz`)).status()).toBe(200);
  await editor.context.close();

  const support = await open(demo.support);
  // A streamed page keeps its 200 status: the not-found page is what support sees.
  await support.page.goto("/admin/formations");
  await expect(
    support.page.getByRole("heading", { level: 1, name: "Cette page est introuvable" }),
  ).toBeVisible();
  for (const kind of kinds)
    expect((await support.page.request.get(`${base}/pdf/${kind}`)).status(), kind).toBe(404);
  await support.context.close();
});

// Admin v3, étape 7: the Studio and the course editor at 1024 px (a small laptop or a tablet held
// sideways), where the menu becomes the floating column and the editor keeps its step column.
test("passe finale de l'admin · Studio et éditeur à 1024 px", async ({ page, isMobile }) => {
  test.skip(isMobile, "La largeur de 1024 px se vérifie une fois, sur le projet bureau.");
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await check(page, "/admin/formations");
  const href = await page
    .locator(
      'a[href^="/admin/formations/"]:not([href^="/admin/formations/nouvelle"]):not([href^="/admin/formations/domaines"]):not([href^="/admin/formations/parcours"])',
    )
    .first()
    .getAttribute("href");
  const base = href!.split("?")[0]!;
  for (const step of ["informations", "programme", "documents", "publication"])
    await check(page, `${base}?etape=${step}`);
});
