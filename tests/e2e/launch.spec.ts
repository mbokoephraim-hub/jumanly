import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// E11: security headers, installable app, offline reading, structured data, editable contents.

test("les en-têtes de sécurité sont envoyés (partie 10 § 10.5)", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("microphone=()");
});

test("le micro n'est autorisé que sur la simulation d'entretien", async ({ request }) => {
  const response = await request.get("/app/career/entretiens/exemple", { maxRedirects: 0 });
  expect(response.headers()["permissions-policy"]).toContain("microphone=(self)");
});

test("Jumanly s'installe comme une application", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe("Jumanly");
  expect(manifest.display).toBe("standalone");
  // The installed app opens on the animated logo, on a cream background (no black screen).
  expect(manifest.start_url).toBe("/demarrage");
  expect(manifest.background_color).toBe("#EEE8DE");
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toContain("512x512");
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).status(), icon.src).toBe(200);
  }
  expect((await request.get("/sw.js")).status()).toBe(200);
  expect((await request.get("/hors-ligne")).status()).toBe(200);
  expect((await request.get("/demarrage")).status()).toBe(200);
});

test("l'appli s'ouvre sur le logo animé, puis sur l'espace", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, demo.talentPro);
  await page.goto("/demarrage");
  // Drawn before the page itself, and kept while the space loads underneath.
  await expect(page.locator("#jm-lancement")).toBeVisible();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator("#jm-lancement")).toBeVisible();
  await expect(page.locator("#jm-lancement")).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator("main")).toBeVisible();
  await context.close();
});

test("les pages de formation décrivent la formation pour les moteurs (Course)", async ({
  page,
}) => {
  await page.goto("/formations");
  const href = await page.locator('main a[href^="/formations/"]').first().getAttribute("href");
  await page.goto(href!);
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
    (text) => JSON.parse(text),
  );
  const course = data.find((item) => item["@type"] === "Course");
  expect(course?.name).toBeTruthy();
  expect(course?.provider?.name).toBe("Jumanly");
  expect(course?.hasCourseInstance?.courseMode).toBe("Online");
});

// Playwright cannot cut the network of a service worker, so the test reads what the worker kept:
// the pages opened, the main pages of the space asked once per session, the offline page.
test("les pages de l'espace sont gardées pour servir hors connexion", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await logIn(page, demo.talentPro);
  await page.goto("/app/profil");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Once the worker controls the page, the pages opened are kept.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await page.goto("/app/profil");
  await page.goto("/app/learn");
  const lesson = await page.locator('main a[href^="/app/learn/"]').first().getAttribute("href");
  await page.goto(lesson!);
  await page.goto("/app/notifications");

  // A late navigation (the worker taking over, a redirect) can destroy the page while it is read:
  // that read returns null and the poll tries again.
  const kept = () =>
    page
      .evaluate(async () => {
        const pages = await caches.open("jm-v2-pages");
        const files = await caches.open("jm-v2-static");
        return {
          pages: (await pages.keys()).map((request) => new URL(request.url).pathname),
          offline: Boolean(await files.match("/hors-ligne")),
          launch: Boolean(await files.match("/demarrage")),
        };
      })
      .catch(() => null);
  await expect
    .poll(async () => (await kept())?.pages ?? [], { timeout: 20_000 })
    .toEqual(
      expect.arrayContaining([
        "/app/profil",
        "/app/learn",
        lesson!.split("?")[0]!,
        "/app/notifications",
        // Never opened in this test: asked by the space once per session.
        "/app/jobs",
        "/app/messages",
      ]),
    );
  await expect.poll(async () => (await kept())?.offline).toBe(true);
  await expect.poll(async () => (await kept())?.launch).toBe(true);

  // Signing out (session gone, then /connexion?deconnecte=1) empties the kept pages: the next
  // person on the device sees nothing.
  await context.clearCookies();
  await page.goto("/connexion?deconnecte=1");
  await expect.poll(async () => (await kept())?.pages).toEqual([]);
  await context.close();
});

test("un éditeur modifie la FAQ et publie une bannière (/admin/contenus)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const mark = `${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
  const question = `Question fictive de test ${mark} ?`;
  const bannerText = `Bannière fictive de test ${mark}`;
  await logIn(page, demo.editor);

  await page.goto("/admin/contenus?groupe=faq.partners");
  const add = page.locator("#nouvelle-question");
  await add.getByLabel("Question").fill(question);
  await add.getByLabel("Réponse").fill("Réponse fictive de test.");
  await add.getByLabel("Motif").fill("Test de bout en bout.");
  await add.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByText("Modification enregistrée.")).toBeVisible();

  const visitorContext = await browser.newContext();
  const visitor = await visitorContext.newPage();
  // A visitor may get the previous version once, while the page is rebuilt.
  const onPage = (path: string, text: string, count: number) =>
    expect(async () => {
      await visitor.goto(path);
      await expect(visitor.getByText(text)).toHaveCount(count, { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
  await onPage("/faq", question, 1);

  await page.goto("/admin/contenus?onglet=bannieres");
  const form = page.locator("#nouvelle-banniere");
  await form.getByLabel("Texte").fill(bannerText);
  await form.getByRole("button", { name: "Enregistrer la bannière" }).click();
  await expect(page.getByText("Modification enregistrée.")).toBeVisible();
  await onPage("/", bannerText, 1);

  // Clean up: the demo site stays as it was.
  await page
    .locator("li", { hasText: bannerText })
    .getByRole("button", { name: "Supprimer la bannière" })
    .click();
  await expect(page.getByText("Contenu supprimé.")).toBeVisible();
  await page.goto("/admin/contenus?groupe=faq.partners");
  await page.getByRole("link", { name: question }).click();
  await page.getByRole("button", { name: "Supprimer cette question" }).click();
  await expect(page.getByText("Modification enregistrée.")).toBeVisible();
  await onPage("/faq", question, 0);
  await onPage("/", bannerText, 0);
  await context.close();
  await visitorContext.close();
});
