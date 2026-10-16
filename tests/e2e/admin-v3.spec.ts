import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

/**
 * Admin v3 (docs/admin-v3/PLAN.md): the floating column of icons. Every section has an accessible
 * name, the column is shorter than the window (a floating pill, not a full-height bar), and the
 * label shows in a tooltip when the keyboard reaches an icon.
 */
test("menu de l'admin en colonne flottante d'icônes", async ({ page, isMobile }) => {
  test.skip(isMobile, "La colonne s'affiche à partir de 1024 px ; le téléphone garde la pilule.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await logIn(page, demo.admin);
  await page.goto("/admin");

  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  for (const name of [
    "Indicateurs",
    "Utilisateurs",
    "Organisations",
    "Partenaires",
    "Forfaits et droits",
    "Abonnements",
    "Formations",
    "Contenus",
    "Modération des offres",
    "Signalements",
    "IA et matching",
    "Journal d'audit",
  ]) {
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Indicateurs", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  const rail = page.locator(".jm-admin-rail");
  const box = await rail.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeLessThan(80);
  expect(box!.height).toBeLessThan(900 * 0.85);
  expect(box!.y).toBeGreaterThan(40);

  const users = nav.getByRole("link", { name: "Utilisateurs", exact: true });
  const tip = users.locator(".jm-admin-tip");
  await expect(tip).toBeHidden();
  await users.focus();
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText("Utilisateurs");
});

test("le menu d'un éditeur de contenus ne montre que ses rubriques", async ({ page, isMobile }) => {
  test.skip(isMobile, "Colonne de bureau seulement.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await logIn(page, demo.editor);
  await page.goto("/admin/formations");
  const nav = page.getByRole("navigation", { name: "Jumanly Admin" });
  await expect(nav.getByRole("link")).toHaveCount(2);
  await expect(nav.getByRole("link", { name: "Formations", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Contenus", exact: true })).toBeVisible();
});

// Admin v3, étape 3: the Studio gallery and a new course from the « Parcours certifiant » template.
test("Studio formations : galerie, puis création à partir d'un modèle", async ({ page }) => {
  test.setTimeout(90_000);
  await logIn(page, demo.editor, undefined, "/admin/formations");
  await page.goto("/admin/formations");
  await expect(page.getByRole("heading", { level: 1, name: "Studio formations" })).toBeVisible();
  const gallery = page.getByRole("list", { name: "Formations" });
  await expect(gallery.getByRole("link", { name: /Réussir son CV \(démo\)/ })).toBeVisible();

  await page.getByRole("link", { name: "Liste", exact: true }).click();
  await expect(page).toHaveURL(/vue=liste/);
  await expect(page.getByRole("link", { name: "Liste", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("link", { name: "Nouvelle formation" }).first().click();
  const title = `Parcours fictif e2e ${Date.now().toString(36)}`;
  await page.locator("#course-new-title").fill(title);
  await page.locator("#course-new-theme").fill("Thème fictif");
  await page.locator('label[for="course-new-template-certifying"]').click();
  await expect(page.locator("#course-new-template-certifying")).toBeChecked();
  await page.getByRole("button", { name: "Créer la formation" }).click();
  await expect(
    page.getByText("Brouillon créé à partir du modèle.", { exact: false }),
  ).toBeVisible();
  for (const name of ["Module 1", "Module 2", "Module 3", "Évaluation finale"])
    await expect(page.getByText(name).filter({ visible: true }).first()).toBeVisible();
});
