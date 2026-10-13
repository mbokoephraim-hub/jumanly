import { expect, test } from "@playwright/test";

test("la page d'accueil publique s'affiche en français", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Jumanly/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Créer mon compte gratuit" })).toHaveAttribute(
    "href",
    "/inscription",
  );
});

test("la bibliothèque de composants est complète et non indexée", async ({ page }) => {
  await page.goto("/dev/composants");
  await expect(page.getByRole("heading", { name: "Bibliothèque de composants" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const section of ["Boutons", "Champs de saisie", "Alertes", "Fenêtre modale"]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Ouvrir la fenêtre" }).click();
  await expect(page.getByRole("dialog", { name: "Retirer ma candidature ?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("l'espace connecté propose la navigation adaptée à l'écran", async ({ page, isMobile }) => {
  await page.goto("/app");
  const navigation = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(navigation.filter({ visible: true })).toHaveCount(1);
  const lienAccueil = navigation.filter({ visible: true }).getByRole("link", { name: "Accueil" });
  await expect(lienAccueil).toHaveAttribute("aria-current", "page");
  // Desktop : barre latérale ; mobile : barre de navigation en bas de l'écran.
  const boite = await navigation.filter({ visible: true }).boundingBox();
  const viewport = page.viewportSize();
  if (isMobile) expect(boite!.y).toBeGreaterThan(viewport!.height / 2);
  else expect(boite!.x).toBeLessThan(100);
});

test("aucun numéro de téléphone n'apparaît", async ({ page }) => {
  for (const chemin of ["/", "/app", "/dev/composants"]) {
    await page.goto(chemin);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  }
});

test("la page d'accueil publique reste sous 200 Ko de JavaScript compressé (CLAUDE.md § 9)", async ({
  page,
}) => {
  const sizes: Promise<number>[] = [];
  page.on("requestfinished", (request) => {
    if (request.resourceType() === "script") {
      sizes.push(request.sizes().then((size) => size.responseBodySize));
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const total = (await Promise.all(sizes)).reduce((sum, size) => sum + size, 0);
  expect(total).toBeGreaterThan(0);
  expect(total).toBeLessThan(200 * 1024);
});
