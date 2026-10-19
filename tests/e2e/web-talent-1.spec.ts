import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Web talent 1 (docs/refonte-web/talent-1) : Pour moi en deux colonnes, Offres avec les filtres
// ouverts à gauche, l'offre avec Postuler dans la colonne de droite, Préparer ma candidature en
// panneau et « Pourquoi ? » en fenêtre centrée.
test("web talent 1 : Pour moi, filtres permanents, offre en colonnes et panneau Orbi", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  await page.setViewportSize({ width: 1440, height: 900 });
  // Compte de démonstration avec des compétences : les offres ont un score.
  await logIn(page, "grace.ux@jumanly.test");

  // Pour moi : la colonne de droite (profil, Orbi, accès rapide).
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Votre profil", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Orbi vous suggère" })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Suggestions d'Orbi" }).getByRole("link", {
      name: "Améliorer mon CV",
    }),
  ).toHaveAttribute("href", "/app/career/cv");
  await expect(page.getByRole("navigation", { name: "Accès rapide" })).toBeVisible();
  await expectAccessible(page);

  // Offres : les filtres restent ouverts à gauche et s'appliquent tout de suite.
  await page.goto("/app/jobs");
  const panel = page.getByRole("form", { name: "Filtres des offres" });
  await expect(panel).toBeVisible();
  await panel.getByText("CDI", { exact: true }).click();
  await expect(page).toHaveURL(/contrat=cdi/);
  await expect(page.getByRole("form", { name: "Filtres des offres" })).toBeVisible();
  await expect(page.getByText(/^\d+ offres?$|^Aucune offre$/)).toBeVisible();
  await page
    .getByRole("form", { name: "Filtres des offres" })
    .getByRole("link", {
      name: "Effacer",
    })
    .click();
  await expect(page).not.toHaveURL(/contrat=/);
  await expectAccessible(page);

  // Le « Pourquoi ? » d'une carte ouvre l'offre et sa fenêtre ; « Compris » la ferme.
  const why = page
    .locator("main")
    .getByRole("link", { name: /^Pourquoi \d+ % \?$/ })
    .first();
  await why.click();
  await expect(page).toHaveURL(/\/app\/jobs\/[^/?]+\?pourquoi=1/);
  const dialog = page.getByRole("dialog", { name: /^Pourquoi \d+ % \?$/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Compris" }).click();
  await expect(dialog).toBeHidden();

  // Postuler dans la colonne de droite, toujours gratuit ; la barre du bas n'est pas là.
  const column = page.locator(".t-odw-a");
  await expect(column.getByText("Postuler est toujours gratuit.")).toBeVisible();
  await expect(page.locator(".t-barre-p")).toBeHidden();

  // Préparer ma candidature : un panneau à droite ; rien n'est envoyé sans accord ; Échap ferme.
  await column.getByRole("button", { name: /Préparer ma candidature/ }).click();
  const prep = page.getByRole("dialog", { name: "Préparer ma candidature" });
  await expect(prep).toBeVisible();
  await expect(prep.getByText("Rien n'est modifié ni envoyé sans votre accord.")).toBeVisible();
  const box = await prep.boundingBox();
  expect(box!.x).toBeGreaterThan(900);
  await expectAccessible(page);
  await page.keyboard.press("Escape");
  await expect(prep).toBeHidden();

  // « Demander à Orbi » depuis le panneau : la question part dans le panneau Orbi.
  await column.getByRole("button", { name: /Préparer ma candidature/ }).click();
  await prep
    .getByRole("textbox", { name: "Votre question à Orbi sur cette offre" })
    .fill("Quelles questions préparer ?");
  await prep.getByRole("button", { name: "Envoyer à Orbi" }).click();
  await expect(prep).toBeHidden();
  await expect(page).toHaveURL(/orbi=/);
});

test("web talent 1 sur tablette : filtres actifs en puces", async ({ page, isMobile }) => {
  test.skip(isMobile, "Mise en page de la tablette.");
  await page.setViewportSize({ width: 1024, height: 1366 });
  await logIn(page, demo.talentPro);
  await page.goto("/app/jobs?contrat=cdi");
  await expect(page.getByRole("form", { name: "Filtres des offres" })).toBeHidden();
  const chip = page.getByRole("link", { name: "Retirer le filtre CDI" });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(page).not.toHaveURL(/contrat=/);
  await expect(page.getByRole("link", { name: "Retirer le filtre CDI" })).toHaveCount(0);
});
