import { expect, type Page } from "./fixtures";

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
 * Brief recruteur § 2 (planche recruteur-1 r2 and r3): the four steps of « Publier une offre »,
 * up to « Vérifier et publier ». Each step is saved on « Continuer ».
 */
export async function fillOffer(page: Page, offer: OfferInput) {
  return fillPhoneOffer(page, offer);
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

/** « Continuer » on the phone's steps, then the heading of the next step. */
export async function nextStep(page: Page, heading: string, button = "Continuer") {
  const wizard = page.locator(".nb-rh-offre-pub").filter({ visible: true });
  await wizard.getByRole("button", { name: button, exact: true }).click();
  await expect(wizard.getByRole("heading", { name: heading })).toBeVisible();
}

/**
 * The same offer on a phone, step by step (publication d'offre, 29/10/2026): the post, the
 * skills, the requirements, the responsibilities, the profile, the salary, the company, the
 * questions and Orbi's reading, up to « Publier l'offre ».
 */
async function fillPhoneOffer(page: Page, offer: OfferInput) {
  await page.goto("/app/hire/offres/nouvelle");
  await wizardReady(page);
  const wizard = page.locator(".nb-rh-offre-pub").filter({ visible: true });
  await wizard.getByLabel("Intitulé du poste").fill(offer.title);
  await wizard.getByLabel("Description du poste").fill(offer.description);
  await nextStep(page, "Les compétences recherchées");
  await wizard.getByLabel("Ajouter une compétence technique").fill(offer.skill);
  await wizard.getByLabel("Ajouter une compétence technique").press("Enter");
  await expect(wizard.locator(".nb-rh-puces").first()).toContainText(offer.skill);
  await nextStep(page, "Les exigences du poste");
  await wizard.getByLabel("Autre ville").fill(offer.city ?? "Abidjan");
  await wizard.getByLabel("Pays du poste").fill(offer.country ?? "Côte d'Ivoire");
  await nextStep(page, "Les principales responsabilités");
  await expect(page).toHaveURL(/\/modifier\?etape=4/);
  for (const item of offer.responsibilities.length ? offer.responsibilities : [offer.title]) {
    const field = wizard.getByPlaceholder(/^Responsabilité n°/);
    await field.fill(item);
    await field.press("Enter");
    await expect(wizard.locator(".nb-oe-points")).toContainText(item);
  }
  await nextStep(page, "Le profil recherché");
  await nextStep(page, "La fourchette salariale");
  const salary = wizard.getByRole("switch", { name: "Afficher le salaire" });
  if (offer.salary) {
    if ((await salary.getAttribute("aria-checked")) !== "true") await salary.click();
    await wizard.getByLabel("Minimum (USD par mois)").fill(offer.salary[0]);
    await wizard.getByLabel("Maximum (USD par mois)").fill(offer.salary[1]);
  } else if ((await salary.getAttribute("aria-checked")) === "true") await salary.click();
  await nextStep(page, "Présentez votre entreprise");
  await nextStep(page, "Les questions aux candidats");
  if (offer.question) {
    await wizard.getByLabel("Votre question").fill(offer.question);
    await wizard.getByLabel("Votre question").press("Enter");
    await expect(wizard.getByRole("checkbox", { name: offer.question })).toBeChecked();
  }
  await nextStep(page, "Orbi a relu votre offre", "Lancer l'analyse d'Orbi");
  await nextStep(page, "Publier l'offre");
  return page.url().split("/modifier")[0]!;
}

/** Publishes the offer from « Vérifier et publier »; returns its detail page and its slug. */
/**
 * The label of the former computer screen is kept by the callers; the phone's steps, on every
 * device since 08/11/2026, always end on « Publier l'offre ».
 */
export async function publishFilledOffer(page: Page, _label?: "Publier" | "Envoyer en validation") {
  // The phone asks for the ONEM authorization before publishing (29/10/2026); offers publish at once.
  await page
    .getByRole("radio", { name: "Oui, je détiens l'autorisation de l'ONEM" })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Publier l'offre", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/app\/hire\/offres\/[^/?]+\?publiee=(1|verification)/);
  const detailUrl = page.url().split("?")[0]!;
  return { detailUrl, jobId: detailUrl.split("/").pop()! };
}

/** The slug of a live offer, read from its « Copier le lien » button on the published screen. */
export async function slugOf(page: Page) {
  const value = await page
    .getByRole("button", { name: "Copier le lien" })
    .filter({ visible: true })
    .first()
    .getAttribute("data-value");
  return value!.split("/").pop()!;
}
