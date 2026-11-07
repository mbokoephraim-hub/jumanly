import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Orbi en page de conversation et son historique (refonte mobile, talent lot 4 § 9). En Free,
// sans consentement à l'IA, la réponse vient des règles et mène vers l'outil adapté et les formules.
test("Orbi : écrire, comprendre la réponse, retrouver puis effacer l'échange", async ({
  page,
  isMobile,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("orbi"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app/orbi");
  if (isMobile) {
    // Téléphone (Modèle B, lot B9) : Orbi est le disque flottant de chaque onglet ; l'ancienne
    // page ouvre sa feuille sur le Fil (tests/e2e/modele-b-fondations.spec.ts pour la suite).
    await expect(page).toHaveURL(/\/app$/);
    await expect(
      page.getByRole("dialog", { name: "Orbi" }).getByRole("textbox", { name: "Écrire à Orbi" }),
    ).toBeVisible();
    return;
  }
  // Ordinateur (cadre web W0) : la barre latérale reste, Orbi y est la page courante.
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", {
      name: "Orbi",
    }),
  ).toHaveAttribute("aria-current", "page");
  // Five trial credits on the free plan (évaluation talent, 07/11/2026).
  await expect(page.getByText("5 crédits", { exact: true })).toBeVisible();

  // The tabs of the phone load underneath: write once the page answers (hydrated).
  await page.waitForLoadState("networkidle");
  const box = page.getByRole("textbox", { name: "Votre message à Orbi" });
  await box.fill("Comment préparer mon entretien ?");
  await expect(box).toHaveValue("Comment préparer mon entretien ?");
  await page.getByRole("button", { name: "Envoyer" }).click();
  const chat = page.getByRole("region", { name: "Conversation avec Orbi" });
  await expect(chat.getByText("Comment préparer mon entretien ?")).toBeVisible();
  await expect(chat.getByText(/entraînez-vous avec une simulation/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(chat.getByRole("link", { name: "M'entraîner à un entretien" })).toHaveAttribute(
    "href",
    "/app/career/entretiens",
  );
  // Trial credits left: no « Voir les formules » (only once the credits are used up).
  await expect(chat.getByRole("link", { name: "Voir les formules" })).toHaveCount(0);
  await chat.getByText("Pourquoi ?").click();
  // The trial credits pay for an answer written by the AI (fake provider in tests).
  await expect(chat.getByText(/Réponse rédigée par l'IA d'Orbi/)).toBeVisible();
  await expect(page).toHaveURL(/\/app\/orbi\?c=/);
  await expectAccessible(page);

  // The exchange is kept: a reload finds it again.
  await page.reload();
  await expect(chat.getByText("Comment préparer mon entretien ?")).toBeVisible();

  await page.getByRole("link", { name: "Historique de mes échanges avec Orbi" }).click();
  await expect(page).toHaveURL(/\/app\/orbi\/historique/);
  const list = page.getByRole("list", { name: "Mes échanges avec Orbi" });
  await expect(list.getByRole("link", { name: /Comment préparer mon entretien/ })).toBeVisible();
  await expectAccessible(page);

  const search = page.getByRole("searchbox", { name: "Rechercher dans mes échanges" });
  await search.fill("introuvable");
  await search.press("Enter");
  await expect(page.getByText("Aucun échange ne correspond à « introuvable ».")).toBeVisible();
  await search.fill("ENTRETIEN");
  await search.press("Enter");
  await expect(list.getByRole("listitem")).toHaveCount(1);

  await page
    .getByRole("button", { name: "Effacer l'échange « Comment préparer mon entretien ? »" })
    .click();
  await expect(
    page.getByText(/Aucun échange ne correspond|Aucun échange pour l'instant/),
  ).toBeVisible();
});
