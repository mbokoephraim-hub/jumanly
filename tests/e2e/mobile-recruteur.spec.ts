import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Recruiter space on a computer (Modèle B, lot N1): the sidebar, the profile card that opens
// « Organisation active », Compte RH and « Mon profil RH ».
test("espace recruteur : barre latérale, organisation active, Compte RH et profil RH", async ({
  page,
  isMobile,
}) => {
  // On a phone the recruiter space is Modèle B (docs/modele-b-recruteur): its bar, Orbi and the
  // account are checked by modele-b-recruteur-coque.spec.ts.
  test.skip(isMobile, "Remplacé au téléphone par le Modèle B (modele-b-recruteur-coque.spec.ts).");
  test.setTimeout(90_000);
  await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
  await page.goto("/app/hire");

  // On a computer, the sidebar of Modèle B (docs/modele-b-recruteur/web, lot N1).
  const bar = page.locator(".rb-side").getByRole("navigation", { name: "Navigation du recrutement" });
  for (const tab of ["Accueil", "Offres", "Candidatures", "Messages"])
    await expect(bar.getByRole("link", { name: new RegExp(`^${tab}`) })).toBeVisible();
  await expect(bar.getByRole("link", { name: /^Accueil/ })).toHaveAttribute("aria-current", "page");

  // The profile card opens « Organisation active », with the way back to the talent space.
  await page.getByRole("button", { name: /: changer de profil$/ }).click();
  const sheet = page.getByRole("dialog", { name: "Organisation active" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Passer à mon espace talent" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  // The entry of Offres lights up on its page.
  await bar.getByRole("link", { name: /^Offres/ }).click();
  await expect(page).toHaveURL(/\/app\/hire\/offres$/);
  await expect(bar.getByRole("link", { name: /^Offres/ })).toHaveAttribute("aria-current", "page");

  // Compte RH, from the foot of the sidebar, which stays lit.
  const account = page.locator(".rb-side").getByRole("link", { name: "Compte", exact: true });
  await account.click();
  await expect(page).toHaveURL(/\/app\/hire\/compte$/);
  await expect(page.getByRole("heading", { level: 1, name: "Compte" })).toBeVisible();
  await expect(account).toHaveAttribute("aria-current", "page");
  const org = page.getByRole("list", { name: "Organisation et équipe" });
  for (const row of ["Organisation", "Équipe", "Rapports"])
    await expect(org.getByRole("link", { name: new RegExp(row) })).toBeVisible();
  // Aide: in « Abonnement et réglages » on a phone, beside the tiles on a computer (web lot 3).
  const settings = page.locator("main").filter({ visible: true });
  await expect(settings.getByRole("link", { name: /^Aide/ })).toHaveAttribute(
    "href",
    "mailto:assistant@jumanly.io",
  );
  await expectAccessible(page);

  // « Mon profil RH »: the job title is kept for this organization.
  await page.locator('a[href="/app/hire/compte/profil"]').filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/app\/hire\/compte\/profil$/);
  await page.getByLabel("Fonction").fill("Responsable RH");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
  await expect(page.getByLabel("Fonction")).toHaveValue("Responsable RH");
  await expect(page.getByLabel("E-mail professionnel")).toHaveAttribute("readonly", "");
});
