import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Cadre web commun de l'espace talent (docs/refonte-web, lot W0) : barre latérale sur ordinateur,
// rail d'icônes sur tablette, recherche Ctrl K avec Orbi, panneau Orbi à droite (?orbi=1) et menu
// de l'avatar ; tout se ferme avec Échap et se parcourt au clavier.
test("cadre web : barre latérale, Ctrl K, panneau Orbi, menu de l'avatar et Échap", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Cadre de l'ordinateur et de la tablette.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await logIn(page, demo.talentFree);
  await page.goto("/app");

  // Barre latérale : les cinq destinations (Orbi au milieu), puis Messages, Mes CV, Connexions.
  const navigation = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(navigation).toHaveCount(1);
  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(5);
  for (const [index, name] of ["Pour moi", "Offres", "Orbi", "Apprendre", "Suivi"].entries())
    await expect(links.nth(index)).toHaveAccessibleName(new RegExp(`^${name}`));
  await expect(navigation.getByRole("link", { name: "Pour moi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const box = await navigation.boundingBox();
  expect(box!.x).toBeLessThan(232);
  const more = page.getByRole("navigation", { name: "Mes rubriques" });
  await expect(more.getByRole("link", { name: /^Messages/ })).toHaveAttribute(
    "href",
    "/app/messages",
  );
  await expect(more.getByRole("link", { name: "Mes CV" })).toHaveAttribute(
    "href",
    "/app/career/cv",
  );
  await expect(more.getByRole("link", { name: "Connexions" })).toHaveAttribute(
    "href",
    "/app/compte/connexions",
  );
  await expectAccessible(page);

  // Au clavier : Offres, depuis la barre latérale.
  await navigation.getByRole("link", { name: "Offres" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/jobs$/);
  await expect(navigation.getByRole("link", { name: "Offres" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // Ctrl K : la recherche avec Orbi, sans adresse ; Échap la ferme.
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Rechercher ou demander à Orbi" });
  await expect(search).toBeVisible();
  const field = search.getByRole("combobox", {
    name: "Rechercher une offre, une formation, ou demander à Orbi",
  });
  await expect(field).toBeFocused();
  await expect(search.getByRole("option", { name: /^Demander à Orbi/ })).toBeVisible();
  await expect(search.getByRole("option", { name: "Suivi" })).toBeVisible();
  await field.fill("analyste");
  await expect(
    search.getByRole("option", { name: /Voir tous les résultats pour « analyste »/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).toBeHidden();
  await expect(page).toHaveURL(/\/app\/jobs$/);

  // « Demander à Orbi : … » ouvre le panneau à droite sur la même page, avec la question.
  await page.keyboard.press("Control+k");
  await field.fill("Comment préparer mon entretien ?");
  await page.keyboard.press("Enter");
  const panel = page.getByRole("dialog", { name: "Orbi" });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(/\/app\/jobs\?orbi=/);
  const chat = panel.getByRole("region", { name: "Conversation avec Orbi" });
  await expect(chat.getByText("Comment préparer mon entretien ?")).toBeVisible();
  await expect(chat.getByText(/entraînez-vous avec une simulation/)).toBeVisible({
    timeout: 20_000,
  });
  // L'échange est gardé dans l'adresse de la page : un rechargement le retrouve.
  await expect(page).toHaveURL(/\/app\/jobs\?orbi=(?!1$)[^&]+$/);
  await page.reload();
  await expect(panel.getByText("Comment préparer mon entretien ?")).toBeVisible();
  // Le focus reste dans le panneau, Échap le ferme et la page reste là.
  for (let index = 0; index < 8; index += 1) await page.keyboard.press("Tab");
  expect(await panel.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/app\/jobs$/);

  // ?orbi=1 sur n'importe quelle page : un nouvel échange, les aides d'Orbi.
  await page.goto("/app/learn?orbi=1");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link", { name: "Améliorer mon CV" })).toBeVisible();
  await expect(panel.getByText(/crédit/).first()).toBeVisible();
  await panel.getByRole("button", { name: "Fermer Orbi" }).click();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/app\/learn$/);

  // Menu de l'avatar (planche talent-4 § 3).
  await page.getByRole("button", { name: /^Compte de / }).click();
  const menu = page.getByRole("dialog", { name: "Mon compte" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: /^CV et documents/ })).toHaveAttribute(
    "href",
    "/app/career/cv",
  );
  await expect(menu.getByRole("button", { name: "Se déconnecter" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  // Orbi en page : l'historique à gauche, pas de barre du haut.
  await page.goto("/app/orbi");
  await expect(page.getByRole("complementary", { name: "Historique" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Compte de / })).toBeHidden();

  // Tablette : le rail d'icônes remplace la barre latérale, sans barre du bas.
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/app");
  await expect(navigation).toHaveCount(1);
  await expect(navigation.getByRole("link")).toHaveCount(5);
  expect((await navigation.boundingBox())!.width).toBeLessThanOrEqual(84);
  await expect(page.getByRole("navigation", { name: "Mes rubriques" })).toBeHidden();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});
