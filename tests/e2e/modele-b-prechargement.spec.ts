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

// Instant tabs (request of 29 October 2026): the five tabs are drawn with the space, so going from
// one to another asks nothing of the server: it works even when the server cannot be reached.
test("Modèle B · les onglets s'ouvrent sans attendre le serveur", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Le Modèle B est l'interface du téléphone.");
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app");
  await page.evaluate(() => ((window as unknown as { __reste: boolean }).__reste = true));
  // Every request of the router fails from now on: a tab must not need one.
  await page.route("**/*", (route) =>
    route.request().headers()["rsc"] ? route.abort() : route.fallback(),
  );
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  for (const [name, path] of [
    ["Explorer", "/app/jobs"],
    ["Carrière", "/app/career/cv"],
    ["Hub", "/app/learn"],
    ["Fil", "/app"],
  ] as const) {
    await nav.getByRole("link", { name, exact: true }).click();
    await page.waitForURL((url) => url.pathname === path);
    await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }
  // Back comes to the tab left; the page was never loaded again.
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/app/learn");
  await expect(nav.getByRole("link", { name: "Hub", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(await page.evaluate(() => (window as unknown as { __reste?: boolean }).__reste)).toBe(
    true,
  );
});
