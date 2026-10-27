import { expect, type Page } from "@playwright/test";
import { openConfirmationLink } from "./outbox";
import { PASSWORD } from "./session";

// The recruiter's sign-up on a phone (Modèle B recruteur, M2): e-mail, password, code, then the
// profile in seven steps. Shared by the e2e that need a new recruiter on a phone.

/** The bottom button, once the step before is saved. */
export const nextStep = (page: Page) => page.locator(".nb-bas .nb-bp:not([aria-disabled])");

export async function expectStep(page: Page, n: number) {
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(n));
}

export async function phoneRecruiterAccount(page: Page, email: string) {
  await page.goto("/inscription?profil=rh");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page).toHaveURL(/\/inscription\/compte\?profil=rh/);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  const sent = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await openConfirmationLink(page, email, sent);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
}

/** Steps 1 to 4 with the least: name, city, the work e-mail of the account, a role. */
export async function phoneRecruiterFirstSteps(page: Page, firstName: string) {
  await expectStep(page, 1);
  await page.getByLabel("Prénom").fill(firstName);
  await page.getByLabel("Nom", { exact: true }).fill("Fictive");
  await nextStep(page).click();
  await expectStep(page, 2);
  await page
    .getByRole("group", { name: "Dans quelle ville ?" })
    .getByRole("button", { name: "Kinshasa" })
    .click();
  await nextStep(page).click();
  await expectStep(page, 3);
  await nextStep(page).click();
  await expectStep(page, 4);
  await page.getByRole("radio", { name: /Responsable RH/ }).click();
  await nextStep(page).click();
  await expectStep(page, 5);
}

/** A new recruiter on a phone who creates the page of their company, then enters the space. */
export async function phoneRecruiterWithPage(page: Page, email: string, orgName: string) {
  await phoneRecruiterAccount(page, email);
  await phoneRecruiterFirstSteps(page, "Chanelle");
  await page.getByRole("button", { name: /Mon entreprise n'est pas sur Jumanly/ }).click();
  const create = page.getByRole("dialog", { name: "Créer la page de l'entreprise" });
  await create.getByLabel("Nom de l'entreprise").fill(orgName);
  await create.getByRole("button", { name: "Créer la page" }).click();
  await expect(page.getByText("Page créée par vous")).toBeVisible();
  await nextStep(page).click();
  await expectStep(page, 6);
  await page.getByRole("button", { name: "Tech" }).click();
  await nextStep(page).click();
  await expectStep(page, 7);
  await nextStep(page).click();
  await page.getByRole("button", { name: "Plus tard" }).click();
  await page.getByRole("button", { name: "Entrer dans Jumanly" }).click();
  await expect(page).toHaveURL(/\/app\/hire/, { timeout: 20_000 });
}
