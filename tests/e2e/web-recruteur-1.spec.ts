import { execFileSync } from "node:child_process";
import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { fillOffer, publishFilledOffer, stepForm } from "./offer-flow";
import { logIn, testEmail } from "./session";

// Web recruteur 1 (docs/refonte-web/recruteur-1) : le cadre web du recruteur (barre latérale,
// organisation sous le nom, Ctrl K), À traiter en deux colonnes, Mes offres en grille avec le menu
// ancré, la création avec ses étapes en tête et l'aperçu à droite, le détail en deux colonnes.

const suffix = () =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;

const noOverflow = async (page: Page) =>
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);

test("web recruteur 1 : cadre, À traiter, offres en grille, création avec aperçu, détail", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Mise en page de l'ordinateur et de la tablette.");
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const email = testEmail("rx-web1");
  const org = `Entreprise fictive web ${suffix()}`;
  execFileSync("pnpm", ["exec", "tsx", "tests/e2e/make-recruiter.ts", email, org, "verified"]);
  await logIn(page, email, undefined, "/app/hire");
  await page.goto("/app/hire");

  // La barre latérale remplace la barre du bas : entrées principales, puis Agenda · Talents ·
  // Rapports.
  const nav = page.getByRole("navigation", { name: "Navigation de l'espace recruteur" });
  for (const tab of ["À traiter", "Offres", "Orbi", "Candidats", "Messages"])
    await expect(nav.getByRole("link", { name: new RegExp(`^${tab}`) })).toBeVisible();
  await expect(nav.getByRole("link", { name: /^À traiter/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const more = page.getByRole("navigation", { name: "Organiser" });
  for (const item of ["Agenda", "Talents", "Rapports"])
    await expect(more.getByRole("link", { name: item })).toBeVisible();
  await expect(page.locator(".t-barre-bas")).toBeHidden();

  // À traiter, rien encore : le bonjour en titre, « Publier une offre » à droite, la semaine.
  const main = page.locator("main").filter({ visible: true });
  await expect(main.getByText("Bonjour Recruteuse", { exact: true })).toBeVisible();
  await expect(main.getByText("Rien à traiter pour l'instant")).toBeVisible();
  await expect(main.getByRole("link", { name: "Publier une offre", exact: true })).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  // L'organisation active s'ouvre sous son nom, avec la règle d'isolation.
  await page
    .getByRole("button", { name: /Organisation active : .* Changer/ })
    .filter({ visible: true })
    .click();
  const orgSheet = page.getByRole("dialog", { name: "Organisation active" });
  await expect(orgSheet).toBeVisible();
  await expect(
    orgSheet.getByText(
      "Chaque organisation ne voit que ses offres, ses candidats et ses messages.",
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(orgSheet).toBeHidden();

  // Créer une offre : les 4 étapes en tête, l'aperçu de l'annonce suit la saisie.
  await page.goto("/app/hire/offres/nouvelle");
  await expect(page.getByRole("heading", { level: 1, name: "Créer une offre" })).toBeVisible();
  const steps = page.getByRole("list", { name: "Étapes de l'offre" }).filter({ visible: true });
  await expect(steps.getByRole("listitem")).toHaveCount(4);
  await expect(steps.locator('[aria-current="step"]')).toContainText("Le poste");
  const preview = page.getByRole("region", { name: "Aperçu de l'annonce" });
  await expect(preview).toBeVisible();
  const title = `Analyste web fictif ${suffix()}`;
  await stepForm(page, "poste").getByLabel("Intitulé du poste").fill(title);
  await expect(preview.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText("Les candidats postulent sur Jumanly, gratuitement.")).toBeVisible();
  await noOverflow(page);
  await expectAccessible(page);

  const detail = await fillOffer(page, {
    title,
    description: "Poste fictif de test : suivre des indicateurs imaginaires.",
    responsibilities: ["Suivre les indicateurs fictifs"],
    skill: "Analyse de données",
  });
  await expect(steps.locator('[aria-current="step"]')).toContainText("Vérifier");
  await expect(preview.getByText("Suivre les indicateurs fictifs")).toBeVisible();
  await publishFilledOffer(page, "Publier");

  // Le détail en deux colonnes : la tête avec « Voir les candidatures », les sections ouvertes.
  await page.goto(detail);
  await expect(main.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible();
  await expect(
    main.getByRole("link", { name: /^Voir les \d+ candidatures?$|^Voir les candidatures$/ }),
  ).toBeVisible();
  await expect(main.getByText("Performance", { exact: true })).toBeVisible();
  await expect(main.getByText("Historique", { exact: true })).toBeVisible();
  await expect(page.locator(".t-bas-f").filter({ visible: true })).toHaveCount(0);
  await noOverflow(page);
  await expectAccessible(page);

  // Mes offres en grille ; le menu « … » s'ouvre sous son bouton.
  await page.goto("/app/hire/offres");
  await expect(main.getByText(/^1 offre active sur \d+/)).toBeVisible();
  const card = main.locator(".t-rx-off").filter({ hasText: title });
  const actions = card.getByRole("button", { name: /Actions sur l.offre/ });
  await actions.click();
  const menu = page.getByRole("dialog").filter({ visible: true }).last();
  await expect(menu).toBeVisible();
  const button = (await actions.boundingBox())!;
  const box = (await menu.boundingBox())!;
  expect(box.width).toBeLessThan(400);
  expect(Math.abs(box.y - (button.y + button.height))).toBeLessThan(40);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await noOverflow(page);

  // Ctrl K : les offres de l'organisation, puis « Demander à Orbi ».
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Rechercher ou demander à Orbi" });
  const field = search.getByRole("combobox", {
    name: "Rechercher un candidat, une offre, ou demander à Orbi",
  });
  await expect(field).toBeFocused();
  await field.fill(title);
  await search.getByRole("option", { name: new RegExp(`^${title}`) }).click();
  await expect(page).toHaveURL(new RegExp(`${detail.split("/").pop()}$`));

  // « Demander à Orbi » ouvre Orbi avec la question, envoyée comme si elle avait été écrite.
  await page.keyboard.press("Control+k");
  await field.fill("Comment rédiger une offre claire ?");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/orbi\?/);
  await expect(
    page.locator("main").filter({ visible: true }).getByText("Comment rédiger une offre claire ?"),
  ).toBeVisible();
});

test("web recruteur 1 : sur téléphone, la barre du bas reste et le cadre web n'apparaît pas", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Téléphone.");
  await logIn(page, "entreprise@jumanly.test", undefined, "/app/hire");
  await page.goto("/app/hire");
  await expect(page.locator(".t-barre-bas")).toBeVisible();
  await expect(page.locator(".t-rh-sb")).toBeHidden();
  await expect(page.locator(".t-rh-rl")).toBeHidden();
  await expect(page.getByText("Candidatures cette semaine")).toBeHidden();
  await noOverflow(page);
});
