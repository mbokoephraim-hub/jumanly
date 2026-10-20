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
  await page.goto("/app/hire/offres/nouvelle");
  const poste = stepForm(page, "poste");
  await poste.getByLabel("Intitulé du poste").fill(offer.title);
  await poste.getByLabel("Ville").fill(offer.city ?? "Abidjan");
  await poste.getByLabel("Pays").fill(offer.country ?? "Côte d'Ivoire");
  if (offer.salary) {
    await poste.locator('input[name="salaryMin"]').fill(offer.salary[0]);
    await poste.locator('input[name="salaryMax"]').fill(offer.salary[1]);
  }
  await poste.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/modifier\?etape=2/);

  const description = stepForm(page, "description");
  await description.getByLabel("Présentation du poste").fill(offer.description);
  for (const item of offer.responsibilities) {
    await description.getByLabel("Nouvelle responsabilité").fill(item);
    await description.getByLabel("Nouvelle responsabilité").press("Enter");
  }
  await description.getByLabel("Ajouter une compétence").fill(offer.skill);
  await description.getByLabel("Ajouter une compétence").press("Enter");
  await description.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/\/modifier\?etape=3/);

  const candidature = stepForm(page, "candidature");
  if (offer.question) {
    await candidature.getByRole("button", { name: "Ajouter une question" }).click();
    await candidature.getByLabel("Question", { exact: true }).fill(offer.question);
    await candidature.getByRole("button", { name: "Enregistrer la question" }).click();
    await expect(candidature).toContainText(offer.question);
  }
  await candidature.getByRole("button", { name: "Vérifier", exact: true }).click();
  await expect(page).toHaveURL(/\/modifier\?etape=4/);
  return page.url().split("/modifier")[0]!;
}

/** Publishes the offer from « Vérifier et publier »; returns its detail page and its slug. */
export async function publishFilledOffer(page: Page, label: "Publier" | "Envoyer en validation") {
  await page.getByRole("button", { name: label, exact: true }).click();
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
