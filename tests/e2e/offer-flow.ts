import { expect, test, type Page } from "./fixtures";

/** On a phone, « Nouvelle offre » is the four steps of Modèle B recruteur (lot M4). */
const onPhone = () => test.info().project.name === "mobile";

/** The visible form of the current step (cacheComponents keeps the previous pages hidden). */
export const stepForm = (page: Page, step: "poste" | "description" | "candidature") =>
  page.locator(`form[id^="rx-job-"][id$="-${step}"]`).filter({ visible: true });

export type OfferInput = {
  title: string;
  city?: string;
  country?: string;
  salary?: [string, string];
  description: string;
  responsibilities: string[];
  skill: string;
  question?: string;
};

/**
 * « Publier une offre » on a computer (Modèle B, lot N2, captures 038 to 042): the post and its
 * text, the skill, where and how, the question, up to « Aperçu et équipe ». Each « Continuer »
 * saves the draft. Returns the offer's page.
 */
export async function fillOffer(page: Page, offer: OfferInput) {
  if (onPhone()) return fillPhoneOffer(page, offer);
  await page.goto("/app/hire/offres/nouvelle");
  await publishReady(page);
  const card = page.locator(".rb-pub-c").filter({ visible: true });
  await card.getByLabel("Intitulé du poste").fill(offer.title);
  await card
    .getByLabel("Description", { exact: true })
    .fill([offer.description, ...offer.responsibilities].join("\n"));
  await card.getByRole("button", { name: "Continuer" }).click();
  await expect(card).toContainText("Étape 2 sur 5");
  await card.getByLabel("Ajouter une compétence").fill(offer.skill);
  await card.getByLabel("Ajouter une compétence").press("Enter");
  await expect(card.locator(".rb-chips")).toContainText(offer.skill);
  await card.getByRole("button", { name: "Continuer" }).click();
  await expect(card).toContainText("Étape 3 sur 5");
  await card.getByLabel("Autre ville").fill(offer.city ?? "Abidjan");
  await card.getByLabel("Pays du poste").fill(offer.country ?? "Côte d'Ivoire");
  const salary = card.getByRole("switch", { name: "Afficher le salaire" });
  if (offer.salary) {
    if ((await salary.getAttribute("aria-checked")) !== "true") await salary.click();
    await card.getByLabel("Minimum (USD par mois)").fill(offer.salary[0]);
    await card.getByLabel("Maximum (USD par mois)").fill(offer.salary[1]);
  }
  await card.getByRole("button", { name: "Continuer" }).click();
  await expect(card).toContainText("Étape 4 sur 5");
  if (offer.question) {
    await card.getByLabel("Ajouter une question").fill(offer.question);
    await card.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(card.locator(".rb-liste-q")).toContainText(offer.question);
  }
  await card.getByRole("button", { name: "Continuer" }).click();
  await expect(card).toContainText("Étape 5 sur 5");
  await expect(page).toHaveURL(/\/modifier/);
  return page.url().split("/modifier")[0]!;
}

/** The five steps are drawn by the server: wait until React has taken them over. */
export async function publishReady(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".rb-pub-c button")].some(
      (input) =>
        (input as HTMLElement).offsetParent !== null &&
        Object.keys(input).some((key) => key.startsWith("__reactFiber")),
    ),
  );
}

/** The four steps are drawn by the server: wait until React has taken them over before typing. */
export async function wizardReady(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".nb-rh-offre-pub input")].some(
      (input) =>
        (input as HTMLElement).offsetParent !== null &&
        Object.keys(input).some((key) => key.startsWith("__reactFiber")),
    ),
  );
}

/**
 * The same offer on a phone (planches Recruteur-publier-1 to -4): the post, its text and its
 * skill, then where and how, then the pre-selection, up to the preview.
 */
async function fillPhoneOffer(page: Page, offer: OfferInput) {
  await page.goto("/app/hire/offres/nouvelle");
  await wizardReady(page);
  const wizard = page.locator(".nb-rh-offre-pub").filter({ visible: true });
  await wizard.getByLabel("Intitulé du poste").fill(offer.title);
  await wizard.getByLabel("Description du poste").fill(offer.description);
  await wizard.getByLabel("Ajouter une compétence").fill(offer.skill);
  await wizard.getByLabel("Ajouter une compétence").press("Enter");
  await expect(wizard.locator(".nb-rh-puces")).toContainText(offer.skill);
  await wizard.getByRole("button", { name: "Continuer" }).click();
  await expect(wizard.getByRole("heading", { name: "Les détails" })).toBeVisible();
  await wizard.getByLabel("Autre ville").fill(offer.city ?? "Abidjan");
  const country = wizard.getByLabel("Pays du poste");
  if (await country.isVisible()) await country.fill(offer.country ?? "Côte d'Ivoire");
  if (offer.salary) {
    await wizard.getByRole("switch", { name: "Afficher le salaire" }).click();
    await wizard.getByLabel("Minimum (USD par mois)").fill(offer.salary[0]);
    await wizard.getByLabel("Maximum (USD par mois)").fill(offer.salary[1]);
  }
  await wizard.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/modifier\?etape=3/);
  // The address now names the saved draft: let the page settle before typing.
  await page.waitForLoadState("networkidle");
  await wizardReady(page);
  if (offer.question) {
    // Typed while the page settles, the question can be lost: type it again.
    await expect(async () => {
      await wizard.getByLabel("Votre question").fill(offer.question!);
      await wizard.getByLabel("Votre question").press("Enter");
      await expect(wizard.getByRole("checkbox", { name: offer.question })).toBeChecked({
        timeout: 2_000,
      });
    }).toPass({ timeout: 20_000 });
  }
  await wizard.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/modifier\?etape=4/);
  return page.url().split("/modifier")[0]!;
}

/** Publishes the offer from « Vérifier et publier »; returns its detail page and its slug. */
export async function publishFilledOffer(page: Page, label: "Publier" | "Envoyer en validation") {
  const name = label === "Publier" ? "Publier l'offre" : "Envoyer en vérification";
  await page.getByRole("button", { name, exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?publiee=(1|verification)/);
  const detailUrl = page.url().split("?")[0]!;
  return { detailUrl, jobId: detailUrl.split("/").pop()! };
}

/**
 * The slug of a live offer, read from its « Copier le lien » button: on the published screen of a
 * phone, in the « Partager » dialog of a computer.
 */
export async function slugOf(page: Page) {
  const buttons = page.locator('[data-value*="/offres/"]');
  const value = await (onPhone() ? buttons.filter({ visible: true }) : buttons)
    .first()
    .getAttribute("data-value");
  return value!.split("/").pop()!;
}
