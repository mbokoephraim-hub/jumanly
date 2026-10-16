import { expect, test, type Page } from "./fixtures";
import { expectAccessible } from "./a11y";
import { demo, logIn } from "./session";

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
  const course = await page.locator('a[href^="/admin/formations/"]').first().getAttribute("href");
  for (const path of [course, `${course?.split("?")[0]}/apercu`].filter(Boolean) as string[])
    await check(page, path);
  await page.goto("/admin/utilisateurs?q=talent.free%40jumanly.test");
  const user = await page.locator('a[href*="fiche="]').first().getAttribute("href");
  if (user) await check(page, user);
  await page.goto("/admin/organisations");
  const org = await page.locator('a[href*="fiche="]').first().getAttribute("href");
  if (org) await check(page, org);
});
