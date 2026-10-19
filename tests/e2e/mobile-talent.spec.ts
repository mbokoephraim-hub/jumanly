import { expectAccessible } from "./a11y";
import { expect, test, type Page } from "./fixtures";
import { demo, finishOnboarding, logIn, signUpFromPricing, testEmail } from "./session";

// Mobile Talent v5, prompt 1 (docs/ux-mobile-talent): the button range, the visual cards and the
// interaction states are shown with all their states on the internal components page.
test("la gamme mobile (boutons, cartes, états) est présentée dans la bibliothèque", async ({
  page,
}) => {
  await page.goto("/dev/composants");
  for (const section of [
    "Gamme mobile : boutons",
    "Gamme mobile : cartes",
    "Gamme mobile : états d'interaction",
  ]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }

  const buttons = page.locator("#gamme-boutons");
  // Sending and done are blocked until the server answers: no second click.
  await expect(buttons.getByRole("button", { name: "Envoi…" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Envoyée" })).toBeDisabled();
  await expect(buttons.getByRole("button", { name: "Postuler" }).first()).toBeEnabled();
  await expect(buttons.getByRole("button", { name: "Demander à Jumanly AI" })).toBeVisible();

  const cards = page.locator("#gamme-cartes");
  await expect(cards.getByRole("heading", { name: "Trouver un emploi" })).toBeVisible();
  await expect(cards.getByRole("link", { name: "Changer d'objectif" })).toBeVisible();
  await expect(cards.getByRole("link", { name: /Télécharger · CV/ })).toHaveAttribute("download");
  await expect(cards.getByText("Candidature non retenue")).toBeVisible();
  await expect(cards.getByText("Candidature retenue", { exact: true })).toBeVisible();
  await expect(
    cards.getByRole("img", { name: "Outil non inclus dans votre formule" }),
  ).toBeVisible();

  // No horizontal scroll on a phone.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});

// Refonte mobile (docs/refonte-mobile, brief § 2.1): five destinations with Orbi in the middle,
// the same bar on a phone and on a computer; Mon espace (screen 17) opens from Compte; Suivi.
test("navigation Talent : cinq destinations, Orbi au milieu, Mon espace et Suivi", async ({
  page,
}) => {
  await logIn(page, demo.talentPro);
  await page.goto("/app");
  const navigation = page.getByRole("navigation", { name: "Navigation principale" });
  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(5);
  for (const [index, name] of ["Pour moi", "Offres", "Orbi", "Apprendre", "Suivi"].entries())
    await expect(links.nth(index)).toHaveAccessibleName(new RegExp(`^${name}`));
  await expect(navigation.getByRole("link", { name: "Pour moi" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Notifications, messages and the account sit at the top of a destination.
  await expect(page.getByRole("link", { name: /^Messages/ })).toHaveAttribute(
    "href",
    "/app/messages",
  );
  await page.getByRole("link", { name: /^Compte de / }).click();
  await expect(page).toHaveURL(/\/app\/compte$/);
  await page.getByRole("link", { name: /^Mon espace/ }).click();

  await expect(page).toHaveURL(/\/app\/espace$/);
  await expect(page.getByRole("heading", { level: 1, name: "Mon espace" })).toBeVisible();
  for (const group of ["Profil professionnel", "Outils carrière", "Acquis", "Mon compte"])
    await expect(page.getByRole("region", { name: group })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Tableau de bord/ }).first()).toHaveAttribute(
    "href",
    "/app/tableau-de-bord",
  );
  // Mon espace has no bottom bar.
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
  await expectAccessible(page);

  // The dashboard keeps its content at its own address.
  await page.goto("/app/tableau-de-bord");
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();

  // Suivi: what waits for an action, then the applications, messages and saved offers.
  await page.goto("/app/suivi");
  await expect(page.getByRole("heading", { level: 1, name: "Suivi" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "À traiter" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Mes candidatures" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Filtrer le suivi" })
      .getByRole("link", { name: "Entretiens" }),
  ).toHaveAttribute("href", "/app/suivi?filtre=entretiens");
  await expect(
    page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", {
      name: /^Suivi/,
    }),
  ).toHaveAttribute("aria-current", "page");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectAccessible(page);
});

// Refonte mobile, lot 2 (planche talent-4): « Compte validé », then the four questions of the first
// connection (goal, studies, places, ready), each checked for accessibility, then « Pour moi ».
test("premiers pas : objectif, études, lieux puis formule gratuite", async ({ page }) => {
  test.setTimeout(120_000);
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("objectif"));
  await expect(page.getByRole("heading", { level: 1, name: "Compte validé" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
  await expectAccessible(page);
  await page.getByRole("link", { name: "C'est parti" }).click();

  // 1 of 4: the goal.
  await expect(page).toHaveURL(/etape=objectif/);
  await expect(page.getByText("1 sur 4")).toBeVisible();
  await expectAccessible(page);
  await page.locator("label").filter({ hasText: "Trouver mon premier emploi" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // 2 of 4: the level and the field, found by a search.
  await expect(page).toHaveURL(/etape=etudes/);
  await expectAccessible(page);
  await page.locator("label").filter({ hasText: "Licence" }).click();
  await page.getByRole("searchbox", { name: "Rechercher un domaine" }).fill("droit");
  await page.locator("label").filter({ hasText: "Droit" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // 3 of 4: the country in its sheet (RD Congo first, a search), the city, contracts, mode.
  await expect(page).toHaveURL(/etape=lieux/);
  await expectAccessible(page);
  await page.getByRole("button", { name: /^Pays/ }).click();
  const sheet = page.getByRole("dialog", { name: "Votre pays" });
  await expect(sheet.getByRole("radio").first()).toHaveAccessibleName("RD Congo");
  await expect(sheet.getByText("Afrique centrale")).toBeVisible();
  await sheet.getByRole("searchbox").fill("cote");
  await expect(sheet.getByRole("radio", { name: "Angola" })).toHaveCount(0);
  await sheet.getByRole("radio", { name: /^Côte d.Ivoire$/ }).check();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("button", { name: /Côte d.Ivoire/ })).toBeVisible();
  await page.getByLabel("Ville").fill("Abidjan");
  await page.locator("label").filter({ hasText: "CDI" }).click();
  await page.locator("label").filter({ hasText: "Hybride" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // 4 of 4: the free plan, and what a paid one adds.
  await expect(page).toHaveURL(/etape=pret/);
  await expect(page.getByRole("heading", { name: "Votre espace est prêt" })).toBeVisible();
  await expect(page.getByText("Postuler à toutes les offres")).toBeVisible();
  await expectAccessible(page);

  // The answers are kept when coming back to a step.
  await page.goto("/app/bienvenue?etape=etudes");
  await expect(page.getByRole("radio", { name: "Licence" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Droit" })).toBeChecked();
  await page.goto("/app/bienvenue?etape=pret");
  await page.getByRole("button", { name: "Commencer gratuitement" }).click();
  await expect(page).toHaveURL(/\/app(\?bienvenue=1)?$/, { timeout: 20_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

// Prompt 4: find an offer, save it (with « Annuler »), apply in steps with a kept draft, survive a
// cut connection, then see the confirmation that only the server's answer shows (screens 06-12).
test("trouver une offre et postuler : étapes, brouillon et coupure réseau", async ({
  page,
  context,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("postuler"));
  await finishOnboarding(page);

  await page.goto("/app/jobs");
  const tabs = page.getByRole("navigation", { name: "Vues des offres" });
  await expect(tabs.getByRole("link", { name: "Pour vous" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(tabs.getByRole("link", { name: "Enregistrées" })).toBeVisible();
  // No skill yet: the list says it is a general selection.
  await expect(page.getByText(/Sélection générale/)).toBeVisible();
  // The search of the header (brief § 5) searches the offers on this tab.
  const search = page.getByRole("search").getByRole("searchbox", { name: "Rechercher" });
  await search.fill("assistant administratif");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=assistant/);
  await page.getByRole("link", { name: "Assistant administratif (démo)" }).first().click();
  await expect(page).toHaveURL(/\/app\/jobs\/demo-assistant-administratif-kinshasa/);
  await expect(page.getByRole("heading", { name: "Le poste" })).toBeVisible();

  // Save, then « Annuler » in the toast.
  const save = page
    .locator('form:has(input[name="job"]) button[aria-pressed]')
    .filter({ visible: true })
    .first();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await save.click();
  await expect(page.getByText("Offre enregistrée.")).toBeVisible();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(save).toHaveAttribute("aria-pressed", "false");

  // Step 1, then « Quitter »: the draft is kept and the offer offers to resume it.
  await page.getByRole("link", { name: "Postuler", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Candidature" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Quel CV envoyer ?" })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Quitter" }).click();
  await expect(page).toHaveURL(/brouillon=1/);
  await expect(page.getByText(/Brouillon gardé/)).toBeVisible();
  await page
    .getByRole("link", { name: "Reprendre ma candidature" })
    .filter({ visible: true })
    .last()
    .click();

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=lettre/);
  await page
    .locator("#apply-letter")
    .fill("Rigoureuse et organisée, je souhaite rejoindre votre équipe.");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=verification/);
  await expect(page.getByText("Votre candidature est prête")).toBeVisible();
  await expect(page.getByText(/Brouillon enregistré à/)).toBeVisible();
  await expectAccessible(page);
  await page.getByLabel(/consulte ma candidature/).check();

  // A cut connection: nothing is said to be sent, the draft is kept.
  await context.setOffline(true);
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByText("Votre candidature n'est pas encore envoyée")).toBeVisible();
  await expect(page.getByText("Brouillon non envoyé")).toBeVisible();
  await expect(page.getByText("Candidature envoyée !")).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Réessayer" }).click();

  await expect(page.getByRole("heading", { name: "Candidature envoyée !" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: /^Suivre/ })).toBeVisible();
  await expectAccessible(page);
});

// Prompt 4: Apprendre (screen 13): the course in progress first, then resume the lesson.
test("reprendre une formation depuis Apprendre", async ({ page }) => {
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn");
  await expect(page.getByText("Votre prochaine leçon")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exercices et certificats" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Mes attestations/ })).toBeVisible();
  await expectAccessible(page);
  await page
    .getByRole("link", { name: "Reprendre la leçon" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/learn\/[^/?]+\?lecon=/);
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();
});

// Prompt 4 bis: the lesson v7 (screens 14, 67 to 69): tabs as cards, titled blocks, modules,
// transcript and resources. Switching tab keeps the page (and the video) where it is.
/** Opens a lesson from the Modules tab, unfolding its module when it is not the current one. */
async function openLesson(page: Page, name: RegExp) {
  const main = page.locator("main").filter({ visible: true });
  await main.getByRole("tab", { name: "Modules" }).click();
  const unit = main
    .locator("details")
    .filter({ has: page.getByRole("link", { name, includeHidden: true }) });
  if (!(await unit.evaluate((element) => (element as HTMLDetailsElement).open)))
    await unit.locator("summary").click();
  await unit.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

test("une leçon : résumé en blocs, modules, transcription et ressources", async ({ page }) => {
  test.setTimeout(120_000);
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn/ux-service-client-excellence");
  const main = () => page.locator("main").filter({ visible: true });

  // The video lesson's transcript, searchable.
  await openLesson(page, /Écouter et reformuler/);
  // Another lesson opens on its summary.
  await expect(main().getByRole("tab", { name: "Résumé" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await main().getByRole("tab", { name: "Transcription" }).click();
  await expect(main().getByText("Ensuite, on reformule avec ses propres mots.")).toBeVisible();
  await main().getByRole("searchbox", { name: "Chercher dans la leçon" }).fill("malentendu");
  await expect(main().getByText("Ensuite, on reformule avec ses propres mots.")).toHaveCount(0);
  await expect(main().getByText(/le malentendu est évité/)).toBeVisible();
  await expectAccessible(page);

  // The text lesson: titled blocks, then modules and resources.
  await openLesson(page, /La méthode CALME/);
  await expect(main().getByRole("heading", { name: "En bref" })).toBeVisible();
  await expect(main().getByRole("heading", { name: "Ce que vous allez faire" })).toBeVisible();
  await expect(main().getByText("Poser les bonnes questions")).toBeVisible();
  await expect(main().getByRole("heading", { name: "À retenir" })).toBeVisible();
  await expect(main().getByText("Exercice de la leçon")).toBeVisible();
  await expectAccessible(page);

  await main().getByRole("tab", { name: "Modules" }).click();
  await expect(main().getByRole("link", { name: /La méthode CALME/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(main().getByText("Après le quiz final")).toBeVisible();
  await main().getByRole("tab", { name: "Ressources" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(main().getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true");
  await main().getByRole("tab", { name: "Ressources" }).click();
  await expect(main().getByRole("heading", { name: "Pour aller plus loin" })).toBeVisible();
  await expect(main().getByRole("link", { name: "Télécharger le support de cours" })).toBeVisible();
  await expectAccessible(page);
});
