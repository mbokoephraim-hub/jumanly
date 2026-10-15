import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Admin v2, étape 8: a content editor writes a tip sheet « Conseils de préparation », talents read
// it in Career, then « Restaurer » puts the former version back (the sheet disappears again).
test("une fiche conseil se publie, se lit dans Career, puis se restaure", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Console d'administration testée sur ordinateur.");
  test.setTimeout(150_000);
  const title = `Fiche de recette fictive ${Date.now()}`;
  await logIn(page, demo.editor, undefined, "/admin");
  await page.goto("/admin/contenus?onglet=conseils");
  await page.getByRole("link", { name: /Parler de salaire sereinement/ }).click();
  await expect(page).toHaveURL(/fiche=salary/);
  const editor = page.getByRole("region", { name: "Parler de salaire sereinement" });
  await editor.getByLabel("Titre").fill(title);
  await editor
    .getByLabel("Texte de la fiche")
    .fill("Préparez une fourchette réaliste.\n\nÉcoutez d'abord la proposition. Texte fictif.");
  await editor.getByLabel("Temps de lecture (minutes)").fill("4");
  await editor.getByLabel("Publier la fiche pour les talents").check();
  await editor.getByLabel("Motif").fill("Recette : première version");
  await editor.getByRole("button", { name: "Enregistrer la fiche" }).click();
  await expect(page.getByText("Modification enregistrée.")).toBeVisible();

  // Talents read it in Career.
  await page.goto("/app/career/conseils");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("4 min de lecture")).toBeVisible();

  // « Restaurer » brings back the version before: no sheet yet for this topic.
  await page.goto("/admin/contenus?onglet=conseils&fiche=salary");
  const versions = page.locator("#versions");
  await versions.getByText("Aucun contenu (pas encore créé)").first().click();
  await versions.getByLabel("Motif").first().fill("Recette : retour à l'état d'avant");
  await versions.getByRole("button", { name: "Restaurer cette version" }).first().click();
  await expect(page.getByText("Version restaurée.").first()).toBeVisible();
  await page.goto("/app/career/conseils");
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
});
