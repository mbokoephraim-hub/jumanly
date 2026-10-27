import { expect, type Page } from "@playwright/test";
import { strToU8, zipSync } from "fflate";
import { codesSince, lastCode, openConfirmationLink } from "./outbox";

/** Demo accounts from prisma/seed/accounts.ts (local and preview only). */
export const DEMO_PASSWORD = "Demo-Jumanly-2026";
export const demo = {
  talentFree: "talent.free@jumanly.test",
  talentPro: "talent.pro@jumanly.test",
  talentStarter: "talent.starter@jumanly.test",
  editor: "editeur@jumanly.test",
  admin: "admin@jumanly.test",
  support: "support@jumanly.test",
} as const;

const introHandled = new WeakSet<Page>();

/**
 * The welcome intro plays over the space after each sign-in (docs/refonte-connexion § 7): journeys
 * that are not about it skip it as soon as it shows. Tests of the intro itself do not call this.
 */
export async function skipIntro(page: Page) {
  if (introHandled.has(page)) return;
  introHandled.add(page);
  // Modèle B (phone): the logo alone shows 1.2 s at the first page of a session, over the page.
  // Tests about something else start once it has played; modele-b-fondations.spec plays it.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("jm-ouvert", "1");
    } catch {}
  });
  await page.addLocatorHandler(
    page.getByRole("button", { name: "Passer l'intro" }),
    // By keyboard: a click would leave the pointer top right, where toasts show (and pause).
    async (button) => {
      await button.press("Enter");
    },
  );
}

export async function logIn(page: Page, email: string, password = DEMO_PASSWORD, next?: string) {
  const since = Date.now();
  await skipIntro(page);
  await page.goto(next ? `/connexion?suite=${encodeURIComponent(next)}` : "/connexion");
  const form = page.locator("form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(email);
  await form.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/connexion") || url.pathname.includes("deux-etapes"),
  );
  // Tests running in parallel can sign in to the same demo account at once: each sign-in gets
  // its own code, so a refused code is followed by the other codes sent since, newest first.
  // Codes sent by another sign-in after the list was read are picked up on the next round.
  if (page.url().includes("/connexion/deux-etapes")) {
    await lastCode(email, since);
    const tried = new Set<string>();
    const deadline = Date.now() + 45_000;
    let passed = false;
    while (!passed && Date.now() < deadline) {
      const fresh = codesSince(email, since).filter((code) => !tried.has(code));
      if (fresh.length === 0) {
        await page.waitForTimeout(500);
        continue;
      }
      for (const code of fresh) {
        tried.add(code);
        await page.locator('input[name="code"]').fill(code);
        await page.getByRole("button", { name: /Vérifier|Confirmer|Valider/ }).click();
        passed = await page
          .waitForURL((url) => !url.pathname.startsWith("/connexion"), { timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
        if (passed) break;
      }
    }
  }
  await expect(page).not.toHaveURL(/\/connexion/);
}

/** A unique, obviously fictional address on the reserved .test domain. */
export function testEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@jumanly.test`;
}

export const PASSWORD = "kinshasa-2026";

/**
 * A talent's sign-up from a plan chosen on /tarifs (refonte mobile, lot 2): « Continuer avec mon
 * e-mail », the account, then the link of the confirmation e-mail. Ends on « Compte validé » (/app/bienvenue).
 */
export async function signUpFromPricing(page: Page, planButton: string, email: string) {
  await page.goto("/tarifs");
  // The link is followed by its address: on a phone the cookie banner may cover it.
  const href = await page
    .getByRole("link", { name: planButton, exact: true })
    .first()
    .getAttribute("href");
  await page.goto(href!);
  await signUpWithEmail(page, email);
}

/** The phone pages of Modèle B (sign-in, sign-up, first profile) instead of the web ones. */
export async function onPhone(page: Page) {
  return (await page.locator(".nb-app").count()) > 0;
}

const phoneNames = new WeakMap<Page, string>();

/**
 * The six steps of the profile on a phone (Modèle B), up to « Profil prêt »: the name, no photo,
 * the place (the first city offered unless given), the first situation, the first Cap suggested,
 * three skills, notifications later.
 */
export async function phoneProfile(page: Page, place?: { country: string; city: string }) {
  const next = page.getByRole("button", { name: /^(Continuer|Terminer)$/ });
  const [first = "Awa", last = "Fictive"] = (phoneNames.get(page) ?? "Awa Fictive").split(" ");
  await page.getByLabel("Prénom").fill(first);
  await page.getByLabel("Nom", { exact: true }).fill(last);
  await next.click();
  await page.getByRole("button", { name: "Passer" }).click();
  if (place) {
    await page.getByRole("button", { name: /^Pays/ }).click();
    const sheet = page.getByRole("dialog", { name: "Votre pays" });
    await sheet.getByRole("textbox").fill(place.country);
    await sheet.getByRole("button", { name: place.country }).first().click();
    await expect(sheet.locator(".nb-feuille")).toHaveCount(0);
    await page.getByRole("button", { name: "Autre ville" }).click();
    await page.getByLabel("Votre ville").fill(place.city);
  } else {
    await page.locator(".nb-chip-c:not([data-pointille])").first().click();
  }
  await next.click();
  await page.getByRole("radio").first().click();
  await next.click();
  await page
    .getByRole("button", { name: /Choisir$/ })
    .first()
    .click();
  await next.click();
  const chips = page.locator(".nb-chip-c[data-lime]");
  for (let index = 0; index < 3; index++) await chips.nth(index).click();
  await next.click();
  await page.getByRole("button", { name: "Plus tard" }).click();
  await expect(page.getByRole("button", { name: "Entrer dans Jumanly" })).toBeVisible();
}

/** From « Créez votre compte » (/inscription, any `?suite=`) to « Compte validé ». */
export async function signUpWithEmail(page: Page, email: string, name = "Awa Fictive") {
  await expect(page).toHaveURL(/\/inscription/);
  if (await onPhone(page)) {
    // The tests of the intro play it on the computer; on a phone, Modèle B has the logo alone.
    await skipIntro(page);
    // Modèle B (planche Accueil): the e-mail, the password, then the confirmation link. The name comes at the
    // first step of the profile.
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect(page).toHaveURL(/\/inscription\/compte/);
    await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
    const sent = Date.now();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
    await openConfirmationLink(page, email, sent);
    await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
    phoneNames.set(page, name);
    return;
  }
  await page.getByRole("link", { name: "Continuer avec mon e-mail" }).click();
  await expect(page).toHaveURL(/\/inscription\/compte/);
  await page.getByLabel("Prénom et nom").fill(name);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("checkbox", { name: /J'accepte les conditions/ }).check();
  const since = Date.now();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/inscription\/verification/, { timeout: 20_000 });
  await openConfirmationLink(page, email, since);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
}

/**
 * The four questions of the first connection, answered as quickly as possible: « C'est parti »,
 * the goal kept empty, the studies skipped, the places skipped unless given, then « Commencer
 * gratuitement ».
 */
export async function finishOnboarding(page: Page, place?: { country: string; city: string }) {
  if (await onPhone(page)) {
    await phoneProfile(page, place);
    await page.getByRole("button", { name: "Entrer dans Jumanly" }).click();
    await expect(page).not.toHaveURL(/\/app\/bienvenue/);
    return;
  }
  await page.getByRole("link", { name: "C'est parti" }).click();
  await expect(page).toHaveURL(/etape=objectif/);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=etudes/);
  await page.getByRole("link", { name: "Passer" }).click();
  await expect(page).toHaveURL(/etape=lieux/);
  if (place) {
    // « Pays » opens the sheet; the search keeps one country, then the city is typed.
    await page.getByRole("button", { name: /^Pays/ }).click();
    const sheet = page.getByRole("dialog", { name: "Votre pays" });
    await sheet.getByRole("searchbox").fill(place.country);
    await sheet.getByRole("radio").first().click();
    await expect(sheet).toBeHidden();
    await page.getByLabel("Ville").fill(place.city);
    await page.getByRole("button", { name: "Continuer" }).click();
  } else {
    await page.getByRole("link", { name: "Passer" }).click();
  }
  await expect(page).toHaveURL(/etape=pret/);
  await page.getByRole("button", { name: "Commencer gratuitement" }).click();
  await expect(page).not.toHaveURL(/\/app\/bienvenue/);
}

/**
 * A new CV from « CV et documents » (lot 6c): « Nouveau CV » opens its sheet (Depuis mon profil ·
 * Page vierge) on a computer; the phone picks a template (Modèle B). Returns its id once the
 * editor is open.
 */
export async function newCvFromList(page: Page) {
  // On the phone (docs/carriere-v3): « Nouveau CV » → « Choisir un modèle », the first free one,
  // « Continuer » opens the CV on Contenu.
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.goto("/app/career/cv/nouveau?etape=modele");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+\?etape=contenu/);
    return new URL(page.url()).pathname.split("/").pop()!;
  }
  await page.goto("/app/career/cv");
  // « Nouveau CV » on a phone, « Nouveau CV · Depuis mon profil » on a computer (studio CV web).
  await page
    .getByRole("button", { name: /^Nouveau CV/ })
    .filter({ visible: true })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Créer et ouvrir" }).click();
  await expect(page).toHaveURL(/\/app\/career\/cv\/[^/?]+$/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

/**
 * A fictional Word CV for « Importer un CV » (lot 6c): the smallest .docx the reader accepts, one
 * paragraph per line.
 */
export function fictiveDocx(paragraphs: string[]) {
  const body = paragraphs
    .map((text) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`)
    .join("");
  const bytes = zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "word/document.xml": strToU8(
      `<?xml version="1.0"?><w:document><w:body>${body}</w:body></w:document>`,
    ),
  });
  return {
    name: "cv-fictif.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from(bytes),
  };
}
