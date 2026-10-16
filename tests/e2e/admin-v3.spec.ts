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
