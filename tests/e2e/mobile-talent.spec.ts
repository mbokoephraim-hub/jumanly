import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { demo, logIn } from "./session";

// Mobile Talent v5, prompt 1 (docs/ux-mobile-talent): the button range, the visual cards and the
// interaction states are shown with all their states on the internal components page.
test("la gamme mobile (boutons, cartes, états) est présentée dans la bibliothèque", async ({
  page,
}) => {
  await page.goto("/dev/composants");
  for (const section of [
    "Gamme mobile : boutons",
    "Gamme mobile : cartes",
    "Gamme mobile : états d'interaction",
  ]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }

  const buttons = page.locator("#gamme-boutons");
  // Sending and done are blocked until the server answers: no second click.
  await expect(buttons.getByRole("button", { name: "Envoi…" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Envoyée" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Postuler" }).first()).toBeEnabled();
  await expect(buttons.getByRole("button", { name: "Demander à Jumanly AI" })).toBeVisible();

  const cards = page.locator("#gamme-cartes");
  await expect(cards.getByRole("heading", { name: "Trouver un emploi" })).toBeVisible();
  await expect(cards.getByRole("link", { name: "Changer d'objectif" })).toBeVisible();
  await expect(cards.getByRole("link", { name: /Télécharger · CV/ })).toHaveAttribute("download");
  await expect(cards.getByText("Candidature non retenue")).toBeVisible();
  await expect(cards.getByText("Candidature retenue", { exact: true })).toBeVisible();
  await expect(
    cards.getByRole("img", { name: "Outil non inclus dans votre formule" }),
  ).toBeVisible();

  // No horizontal scroll on a phone.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});

// Prompt 2: four destinations, the avatar menu (screen 34), Mon espace (screen 17) and Suivi.
test("navigation Talent : quatre destinations, menu de l'avatar, Mon espace et Suivi", async ({
  page,
  isMobile,
}) => {
  await logIn(page, demo.talentPro);
  await page.goto("/app");
  const navigation = page
    .getByRole("navigation", { name: "Navigation principale" })
    .filter({ visible: true });
  for (const name of ["Pour moi", "Offres", "Apprendre", /^Suivi/])
    await expect(navigation.getByRole("link", { name })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Pour moi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Career stays in the column of a computer; the phone reaches it from Mon espace.
  await expect(navigation.getByRole("link", { name: "Career" })).toHaveCount(isMobile ? 0 : 1);

  if (isMobile) {
    // The avatar opens a small menu anchored under it; Escape closes it and gives the focus back.
    const avatar = page.getByRole("button", { name: "Mon espace" });
    await avatar.click();
    const menu = page.getByRole("dialog", { name: "Menu de mon espace" });
    await expect(menu).toBeVisible();
    await expect(avatar).toHaveAttribute("aria-expanded", "true");
    for (const name of ["Mon profil", "Mes CV", "Tableau de bord", "Paramètres", "Tout Mon espace"])
      await expect(menu.getByRole("link", { name })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Messages/ })).toBeVisible();
    await expectAccessible(page);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(avatar).toBeFocused();
    await avatar.click();
    await menu.getByRole("link", { name: "Tout Mon espace" }).click();
  } else {
    await page.goto("/app/espace");
  }

  await expect(page).toHaveURL(/\/app\/espace$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mon espace" })).toBeVisible();
  for (const group of ["Profil professionnel", "Outils carrière", "Acquis", "Mon compte"])
    await expect(page.getByRole("region", { name: group })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Tableau de bord/ }).first()).toHaveAttribute(
    "href",
    "/app/tableau-de-bord",
  );
  // Mon espace has no bottom bar on a phone.
  if (isMobile)
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
  await expectAccessible(page);

  // The dashboard keeps its content at its own address.
  await page.goto("/app/tableau-de-bord");
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();

  // Suivi: what waits for an action, then the applications, messages and saved offers.
  await page.goto("/app/suivi");
  await expect(page.getByRole("heading", { level: 1, name: "Suivi" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "À traiter" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Mes candidatures/ })).toHaveAttribute(
    "href",
    "/app/jobs/candidatures",
  );
  await expect(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .filter({ visible: true })
      .getByRole("link", { name: /^Suivi/ }),
  ).toHaveAttribute("aria-current", "page");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});
