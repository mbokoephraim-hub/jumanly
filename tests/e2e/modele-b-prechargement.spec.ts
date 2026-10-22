import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Preloading (request of 22 October 2026): once the phone shows a screen, the pages its links lead
// to are loaded in the background with their data (a full request, without the prefetch header),
// so that a tap opens them at once. Never a conversation (opening it marks it as read), a file,
// nor a page that changes while one looks at it (notifications, messages).
test("Modèle B · les pages se chargent en arrière-plan", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Le Modèle B est l'interface du téléphone.");
  await logIn(page, "grace.ux@jumanly.test");
  const loaded = new Set<string>();
  page.on("request", (request) => {
    const headers = request.headers();
    if (headers["rsc"] && !headers["next-router-prefetch"])
      loaded.add(new URL(request.url()).pathname);
  });
  await page.goto("/app");
  await expect
    .poll(() => [...loaded].filter((path) => path.startsWith("/app/")).length, { timeout: 20_000 })
    .toBeGreaterThan(5);
  await page.waitForTimeout(3_000);
  const paths = [...loaded].join(" ");
  // The tab roots are loaded by the bottom bar itself; a conversation never is.
  expect(paths).not.toMatch(/\/app\/messages\/[^ ]+/);
  expect(paths).not.toMatch(/\/app\/notifications( |$)/);
  expect(paths).not.toMatch(/\/(pdf|word|agenda|export)( |$)/);

  // A page loaded ahead opens without asking the server again.
  const target = page.locator('a[href="/app/fil/publier"]:visible').first();
  await expect.poll(() => loaded.has("/app/fil/publier"), { timeout: 15_000 }).toBe(true);
  loaded.clear();
  await target.click();
  await expect(page).toHaveURL(/\/app\/fil\/publier$/);
  expect([...loaded]).not.toContain("/app/fil/publier");
});
