import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { logIn } from "./session";

// Recruiter space, lot 1 (docs/refonte-mobile, brief recruteur § 1): the bottom bar À traiter ·
// Offres · Orbi · Candidats · Messages, the chip of the active organization, Compte RH and
// « Mon profil RH ».
test("espace recruteur : barre du bas, organisation active, Compte RH et profil RH", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(90_000);
  await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
  await page.goto("/app/hire");

  const bar = page.getByRole("navigation", { name: "Navigation de l'espace recruteur" });
  for (const tab of ["À traiter", "Offres", "Orbi", "Candidats", "Messages"])
    await expect(bar.getByRole("link", { name: new RegExp(`^${tab}`) })).toBeVisible();
  await expect(bar.getByRole("link", { name: /^À traiter/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // The chip opens « Organisation active », with the way back to the talent space.
  await page.getByRole("button", { name: /Organisation active : .* Changer/ }).click();
  const sheet = page.getByRole("dialog", { name: "Organisation active" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Passer à mon espace talent" })).toBeVisible();
  await sheet.getByRole("button", { name: "Fermer" }).click();

  // The tab of Offres lights up on its page, and its head says « Mes offres ».
  await bar.getByRole("link", { name: /^Offres/ }).click();
  await expect(page).toHaveURL(/\/app\/hire\/offres$/);
  await expect(bar.getByRole("link", { name: /^Offres/ })).toHaveAttribute("aria-current", "page");

  // Compte RH, from the avatar.
  await page.getByRole("link", { name: /^Compte de / }).click();
  await expect(page).toHaveURL(/\/app\/hire\/compte$/);
  await expect(page.getByRole("heading", { level: 1, name: "Compte" })).toBeVisible();
  await expect(bar).toHaveCount(0);
  const org = page.getByRole("list", { name: "Organisation et équipe" });
  for (const row of ["Organisation", "Équipe", "Rapports"])
    await expect(org.getByRole("link", { name: new RegExp(row) })).toBeVisible();
  const settings = page.getByRole("list", { name: "Abonnement et réglages" });
  await expect(settings.getByRole("link", { name: /Aide/ })).toHaveAttribute(
    "href",
    "mailto:assistant@jumanly.io",
  );
  await expectAccessible(page);

  // « Mon profil RH »: the job title is kept for this organization.
  await page.locator('a[href="/app/hire/compte/profil"]').click();
  await expect(page).toHaveURL(/\/app\/hire\/compte\/profil$/);
  await page.getByLabel("Fonction").fill(isMobile ? "Chargée de recrutement" : "Responsable RH");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
  await expect(page.getByLabel("Fonction")).toHaveValue(
    isMobile ? "Chargée de recrutement" : "Responsable RH",
  );
  await expect(page.getByLabel("E-mail professionnel")).toHaveAttribute("readonly", "");
});
