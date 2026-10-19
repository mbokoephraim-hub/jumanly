import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
import { signUpFromPricing, testEmail } from "./session";

// Orbi en page de conversation et son historique (refonte mobile, talent lot 4 § 9). En Free,
// sans crédit Orbi, la réponse vient des règles et mène vers l'outil adapté et les formules.
test("Orbi : écrire, comprendre la réponse, retrouver puis effacer l'échange", async ({
  page,
  isMobile,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("orbi"));
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });
  await page.goto("/app/orbi");
  if (isMobile) {
    // Téléphone : une page de conversation, retour en haut, pas de barre du bas.
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Retour" })).toBeVisible();
  } else {
    // Ordinateur (cadre web W0) : la barre latérale reste, Orbi y est la page courante.
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", {
        name: "Orbi",
      }),
    ).toHaveAttribute("aria-current", "page");
  }
  await expect(page.getByText("0 crédit", { exact: true })).toBeVisible();

  await page
    .getByRole("textbox", { name: "Votre message à Orbi" })
    .fill("Comment préparer mon entretien ?");
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
  await expect(chat.getByRole("link", { name: "Voir les formules" })).toBeVisible();
  await chat.getByText("Pourquoi ?").click();
  await expect(chat.getByText(/Réponse préparée sans l'IA/)).toBeVisible();
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
