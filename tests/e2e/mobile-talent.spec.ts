import { expectAccessible } from "./a11y";
import { expect, test } from "./fixtures";
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
// the bottom bar on a phone, the sidebar on a computer (docs/refonte-web, W0); Compte and its Aide;
// Suivi.
test("navigation Talent : cinq destinations, Orbi au milieu, Compte, Aide et Suivi", async ({
  page,
  isMobile,
}) => {
  // On a phone, the bar of Modèle B (Fil, Explorer, Carrière, Formation, Messages): modele-b-*.spec.
  test.skip(isMobile, "Modèle B au téléphone : barre testée par modele-b-fondations.spec.ts");
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
  // Notifications, messages and the account sit at the top of a destination (and in the
  // sidebar on a computer).
  await expect(page.getByRole("link", { name: /^Messages/ }).first()).toHaveAttribute(
    "href",
    "/app/messages",
  );
  await page.getByRole("link", { name: /^Compte de / }).click();
  await expect(page).toHaveURL(/\/app\/compte$/);
  // Lot 7: « Mon espace » and the dashboard of the old design are gone; Compte holds the account,
  // its Aide is in the space, by e-mail only.
  await expect(page.getByRole("main").getByRole("link", { name: /^Aide/ })).toHaveAttribute(
    "href",
    "/app/compte/aide",
  );
  await page.goto("/app/espace");
  await expect(page).toHaveURL(/\/app\/compte$/);
  await page.goto("/app/compte/aide");
  await expect(page.getByRole("heading", { level: 1, name: "Aide" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Écrire un e-mail" })).toHaveAttribute(
    "href",
    "mailto:assistant@jumanly.io",
  );
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  // Aide has no bottom bar on a phone; the sidebar stays on a computer.
  if (isMobile)
    await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
  await expectAccessible(page);

  // Suivi (planche talent-2 § 2): in progress or finished, grouped by situation.
  await page.goto("/app/suivi");
  await expect(page.getByRole("heading", { level: 1, name: "Suivi" })).toBeAttached();
  const views = page.getByRole("navigation", { name: "Candidatures en cours ou terminées" });
  await expect(views.getByRole("link", { name: /^En cours/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(views.getByRole("link", { name: "Terminées" })).toHaveAttribute(
    "href",
    "/app/suivi?vue=terminees",
  );
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
test("premiers pas : objectif, études, lieux puis formule gratuite", async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    "Au téléphone : le profil en six étapes du Modèle B (modele-b-accueil.spec.ts).",
  );
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
  isMobile,
}) => {
  await signUpFromPricing(page, "Créer mon compte gratuit", testEmail("postuler"));
  await finishOnboarding(page);

  if (isMobile) {
    // Modèle B (lot B4): Explorer's search, the offer's « Enregistrer », then the steps of Postuler.
    await page.goto("/app/jobs");
    const field = page.getByRole("searchbox", { name: /Rechercher une offre/ });
    await field.click();
    await field.fill("assistant administratif");
    await page
      .getByRole("link", { name: /Assistant administratif \(démo\)/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/app\/jobs\/demo-assistant-administratif-kinshasa/);
    const save = page.getByRole("button", { name: /^Enregistr/ });
    await expect(save).toHaveAttribute("aria-pressed", "false");
    // The button shows the result itself: no toast (29/10, toasts only when nothing else answers).
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await page.goto("/app/jobs/demo-assistant-administratif-kinshasa/postuler");
  } else {
    await page.goto("/app/jobs");
    const tabs = page.getByRole("navigation", { name: "Vues des offres" });
    await expect(tabs.getByRole("link", { name: "Pour vous" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tabs.getByRole("link", { name: "Enregistrées" })).toBeVisible();
    // No skill yet: the list says it is a general selection. (On a phone, the first profile of
    // Modèle B already asks for three skills.)
    if (!isMobile) await expect(page.getByText(/Sélection générale/)).toBeVisible();
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
    // The button shows the result itself: no toast (29/10, toasts only when nothing else answers).
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(save).toHaveAttribute("aria-pressed", "false");

    // Step 1, then « Quitter »: the draft is kept and the offer offers to resume it.
    await page.getByRole("link", { name: "Postuler", exact: true }).click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Postuler" })).toBeVisible();
  // First screen (01/11/2026): how to apply, then the CVs.
  await expect(page.getByRole("group", { name: "Comment voulez-vous postuler ?" })).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("group", { name: "Quel CV envoyer ?" })).toBeVisible();
  await expectAccessible(page);
  await page.getByRole("button", { name: "Quitter et garder le brouillon" }).click();
  await expect(page).toHaveURL(/brouillon=1/);
  if (isMobile) {
    // The offer of Modèle B applies in one sheet; the stepped form keeps its draft.
    await page.goto("/app/jobs/demo-assistant-administratif-kinshasa/postuler");
  } else {
    await expect(page.getByText(/Brouillon gardé/)).toBeVisible();
    await page
      .getByRole("link", { name: "Reprendre ma candidature" })
      .filter({ visible: true })
      .last()
      .click();
  }

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=lettre/);
  await page.getByRole("button", { name: "Ajouter un document" }).click();
  await page.getByRole("button", { name: "Écrire une lettre" }).click();
  await page
    .locator("#apply-letter")
    .fill("Rigoureuse et organisée, je souhaite rejoindre votre équipe.");
  await page.getByRole("button", { name: "Enregistrer la lettre" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page).toHaveURL(/etape=verification/);
  await expect(page.getByRole("heading", { name: "Vérifier et envoyer" })).toBeVisible();
  await expect(page.getByText(/Brouillon enregistré/)).toBeVisible();
  await expectAccessible(page);

  // A cut connection: nothing is said to be sent, the draft is kept.
  await context.setOffline(true);
  await page.getByRole("button", { name: "Envoyer ma candidature" }).click();
  await expect(page.getByText("Candidature pas encore envoyée.")).toBeVisible();
  await expect(page.getByText("Candidature envoyée", { exact: true })).toHaveCount(0);
  await context.setOffline(false);
  await page.getByRole("button", { name: "Réessayer" }).click();

  await expect(page.getByRole("heading", { name: "Candidature envoyée" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: /^Suivre/ })).toBeVisible();
  await expectAccessible(page);
});

// Refonte mobile, lot 5 (planche talent-3): resume the course in progress from Apprendre, then the
// classroom: the tabs of the lesson, its files and the free Orbi help.
test("reprendre une formation depuis Apprendre", async ({ page, isMobile }) => {
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn");
  await expectAccessible(page);
  // On the phone, Formation is Modèle B (lot B7): « Reprendre » opens the lesson to resume.
  await page
    .getByRole("link", { name: isMobile ? /^Reprendre/ : "Reprendre" })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/learn\/[^/?]+\/[^/?]+/);
  await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true })).toBeVisible();
});

test("une leçon : onglets, notes et fichiers", async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    "Au téléphone, la leçon est celle du Modèle B (modele-b-formation.spec.ts, fichiers dans son menu).",
  );
  await logIn(page, "grace.ux@jumanly.test");
  await page.goto("/app/learn/ux-service-client-excellence");
  const start = page.getByRole("button", { name: "Commencer la formation" });
  if (await start.count()) await start.click();
  else await page.locator("ol.t-modl a").first().click();
  await expect(page).toHaveURL(/\/app\/learn\/ux-service-client-excellence\/[^/?]+/);
  await expect(page.getByRole("tab", { name: "Leçon" })).toHaveAttribute("aria-selected", "true");
  await expectAccessible(page);
  await page.getByRole("tab", { name: "Texte" }).click();
  await expect(page.getByRole("tab", { name: "Texte" })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Fichiers" }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Fichiers" }).getByText("Support en PDF"),
  ).toBeVisible();
  await expectAccessible(page);
});
