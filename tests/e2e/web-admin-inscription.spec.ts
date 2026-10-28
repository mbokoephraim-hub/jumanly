import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { expectAccessible } from "./a11y";
import { openConfirmationLink } from "./outbox";
import { logIn } from "./session";

// Étape 3 · A1 (docs/modele-b-recruteur/web, captures 020 à 029) : l'inscription de
// l'administrateur d'entreprise sur ordinateur, chaque bouton ouvre quelque chose. « Kivu Fintech »
// et les adresses sont fictives ; le nom n'est pas « Baobab Fintech » pour ne pas doubler, dans la
// recherche d'entreprise du recruteur au téléphone, l'entreprise du seed. Avec CAPTURE_DIR, les
// écrans sont photographiés à la largeur CAPTURE_WIDTH (1440 par défaut).

const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1440);
const CAPTURE_DIR = process.env.CAPTURE_DIR;

async function shot(page: Page, name: string) {
  if (!CAPTURE_DIR) return;
  mkdirSync(CAPTURE_DIR, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(CAPTURE_DIR, `${name}-${WIDTH}.png`) });
}

const PDF = Buffer.from("%PDF-1.4\n%fictif\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const unique = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
const next = (page: Page) => page.getByRole("button", { name: "Continuer", exact: true });

async function createAccount(page: Page, plan: RegExp) {
  const stamp = unique();
  const email = `joseph.${stamp}@baobab-fictive.cd`;
  await page.goto("/inscription/entreprise");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choisissez une formule");
  await page.getByRole("radio", { name: plan }).click();
  await next(page).click();
  await expect(page).toHaveURL(/etape=compte/);
  await page.getByLabel("Prénom et nom").fill("Joseph Ilunga");
  await page.getByLabel("Nom de l'entreprise").fill(`Kivu Fintech ${stamp}`);
  await page.getByLabel("E-mail professionnel").fill(email);
  await page.getByLabel("Mot de passe").fill("Baobab-Fictive-2026!");
  await page.getByRole("checkbox").click();
  const since = Date.now();
  await next(page).click();
  await expect(page).toHaveURL(/etape=code/, { timeout: 20_000 });
  await openConfirmationLink(page, email, since);
  await expect(page).toHaveURL(/etape=role/, { timeout: 20_000 });
  return { email, org: `Kivu Fintech ${stamp}` };
}

async function roleToPayment(page: Page) {
  await page.getByLabel("Intitulé de votre poste").fill("Responsable RH");
  await next(page).click();
  await expect(page).toHaveURL(/etape=entreprise/);
  await page.getByRole("radio", { name: "Fintech" }).click();
  await page.getByRole("radio", { name: "51 à 200" }).click();
  await page.getByLabel("Ville du siège").fill("Kinshasa");
  await next(page).click();
  await expect(page).toHaveURL(/etape=logo/);
  await next(page).click();
  await expect(page).toHaveURL(/etape=verification/);
  await next(page).click();
  await expect(page).toHaveURL(/etape=paiement/);
}

test.describe("Étape 3 · inscription de l'administrateur d'entreprise", () => {
  test.skip(({ isMobile }) => isMobile, "L'espace de l'entreprise se crée sur ordinateur.");
  test.use({ viewport: { width: WIDTH, height: 900 } });

  test("Company : les neuf étapes, le paiement et les invitations, chaque bouton répond", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.goto("/inscription/entreprise");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choisissez une formule");
    await expect(
      page.getByText("Prêt à bâtir l'équipe qui fera grandir votre entreprise ?"),
    ).toBeVisible();
    await shot(page, "020-forfait");
    await expectAccessible(page);
    // Company Premium se fait sur devis : le lien du formulaire apparaît.
    await page.getByRole("radio", { name: /Company Premium/ }).click();
    await expect(page.getByRole("link", { name: "Demander un devis" })).toHaveAttribute(
      "href",
      "/contact?sujet=devis",
    );
    await page.getByRole("radio", { name: /RH Free/ }).click();
    await expect(page.getByRole("radio", { name: /RH Free/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.getByRole("radio", { name: /Company Plus/ }).click();
    await page.getByRole("radio", { name: /^Company 79/ }).click();
    await next(page).click();

    // 2 · compte : les erreurs, puis le compte.
    await expect(page).toHaveURL(/etape=compte&forfait=company/);
    await next(page).click();
    await expect(page.getByText("Acceptez les conditions pour continuer")).toBeVisible();
    // Retour à l'étape 1, puis de nouveau l'étape 2.
    await page.getByRole("link", { name: "Étape précédente" }).click();
    await expect(page).toHaveURL(/etape=forfait/);
    await page.goBack();
    const stamp = unique();
    const email = `joseph.${stamp}@baobab-fictive.cd`;
    await page.getByLabel("Prénom et nom").fill("Joseph Ilunga");
    await page.getByLabel("Nom de l'entreprise").fill(`Kivu Fintech ${stamp}`);
    await page.getByLabel("E-mail professionnel").fill(email);
    await page.getByLabel("Mot de passe").fill("Baobab-Fictive-2026!");
    await page.getByRole("checkbox").click();
    await expect(page.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
    await shot(page, "021-compte");
    const since = Date.now();
    await next(page).click();

    // 3 · code : renvoyer, un code faux, puis le bon.
    await expect(page).toHaveURL(/etape=code/, { timeout: 20_000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(
      page.getByText("Ouvrez l'e-mail et cliquez sur « Confirmer mon adresse »"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Renvoyer le lien" }).click();
    await expect(page.locator(".ae-toast")).toContainText(/Nouveau lien envoyé|Patientez|Attendez/);
    await shot(page, "022-code");
    await openConfirmationLink(page, email, since);

    // 4 · rôle, avec l'aperçu de la page entreprise.
    await expect(page).toHaveURL(/etape=role/, { timeout: 20_000 });
    const preview = page.getByTestId("apercu-entreprise");
    await expect(preview).toContainText(`Kivu Fintech ${stamp}`);
    await expect(preview).toContainText("Formule Company");
    await page.getByLabel("Intitulé de votre poste").fill("");
    await next(page).click();
    await expect(page.getByText("Écrivez l'intitulé de votre poste")).toBeVisible();
    await page.getByLabel("Intitulé de votre poste").fill("Responsable RH");
    await shot(page, "023-role");
    await next(page).click();

    // 5 · l'entreprise : l'aperçu suit la saisie.
    await expect(page).toHaveURL(/etape=entreprise/);
    await next(page).click();
    await expect(page.getByText("Choisissez le secteur et la taille")).toBeVisible();
    for (const sector of ["Banque", "Télécoms", "Énergie", "ONG", "Fintech"])
      await page.getByRole("radio", { name: sector }).click();
    for (const size of ["1 à 50", "201 à 1 000", "Plus de 1 000", "51 à 200"])
      await page.getByRole("radio", { name: size }).click();
    await page.getByLabel("Ville du siège").fill("Kinshasa");
    await page.getByLabel("Site").fill("baobab-fictive.cd");
    await page
      .getByLabel("À propos")
      .fill("Nous rendons le paiement mobile simple pour les commerçants et les familles.");
    await expect(preview).toContainText("Fintech · Kinshasa · 51 à 200 personnes");
    await expect(preview).toContainText("Nous rendons le paiement mobile simple");
    await shot(page, "024-entreprise");
    await next(page).click();

    // 6 · logo et bannière.
    await expect(page).toHaveURL(/etape=logo/);
    await page.getByTestId("logo-fichier").setInputFiles({
      name: "logo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("pas une image"),
    });
    await expect(page.locator(".ae-toast")).toContainText(/JPEG, PNG ou WebP|n'a pas pu être lue/);
    await page.getByTestId("logo-fichier").setInputFiles("public/marque/jumanly-favicon-512.png");
    await expect(page.locator(".ae-toast")).toContainText("Logo ajouté");
    await expect(page.getByRole("button", { name: "Changer le logo" })).toBeVisible();
    await page.getByRole("button", { name: "Fermer le message" }).click();
    for (const theme of ["Nuit", "Lime", "Crème", "Sapin"]) {
      await page.getByRole("radio", { name: `Bannière ${theme}` }).click();
      await expect(page.getByRole("radio", { name: `Bannière ${theme}` })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    }
    await shot(page, "025-logo");
    await next(page).click();

    // 7 · vérification : le domaine de l'adresse, puis le registre.
    await expect(page).toHaveURL(/etape=verification/);
    await expect(page.getByText("E-mail sur le domaine baobab-fictive.cd")).toBeVisible();
    await page.getByTestId("document-fichier").setInputFiles({
      name: "registre-fictif.pdf",
      mimeType: "application/pdf",
      buffer: PDF,
    });
    await expect(page.locator(".ae-toast")).toContainText("Document ajouté");
    await expect(page.getByText("Ajouté", { exact: true })).toBeVisible();
    await expect(preview).toContainText("Vérification en cours");
    await shot(page, "026-verification");
    await next(page).click();

    // 8 · paiement : chaque moyen, un numéro manquant, puis M-Pesa.
    await expect(page).toHaveURL(/etape=paiement/);
    await page.getByRole("radio", { name: "Carte bancaire" }).click();
    await expect(page.getByText(/page sécurisée du prestataire/)).toBeVisible();
    for (const operator of ["Orange Money", "Airtel Money", "M-Pesa"]) {
      await page.getByRole("radio", { name: operator }).click();
      await expect(page.getByLabel(`Numéro du compte ${operator} qui paie`)).toBeVisible();
    }
    await page.getByRole("button", { name: /^Payer 79,90/ }).click();
    await expect(page.getByText(/Écrivez le numéro Mobile Money/)).toBeVisible();
    await page.getByLabel("Numéro du compte M-Pesa qui paie").fill("+243 81 000 00 47");
    await shot(page, "027-paiement");
    await page.getByRole("button", { name: /^Payer 79,90/ }).click();
    await expect(page.getByText("Paiement reçu", { exact: true })).toBeVisible({ timeout: 20_000 });
    await next(page).click();

    // 9 · l'équipe : une adresse fausse, trois invitations, un rôle changé, une retirée.
    await expect(page).toHaveURL(/etape=equipe/);
    await page.getByLabel("E-mail à inviter").fill("pas-une-adresse");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.locator(".ae-toast")).toContainText("Écrivez une adresse e-mail");
    for (const name of ["nadia.kalala", "aline.mukeba", "patrice.nzuzi", "jean.retire"]) {
      await page.getByLabel("E-mail à inviter").fill(`${name}.${stamp}@baobab-fictive.cd`);
      await page.getByRole("button", { name: "Ajouter" }).click();
    }
    // Company compte 5 utilisateurs : la cinquième adresse ne trouve plus de place.
    await page.getByLabel("E-mail à inviter").fill(`trop.${stamp}@baobab-fictive.cd`);
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.locator(".ae-toast")).toContainText("Plus de place dans la formule Company");
    await page
      .getByRole("button", { name: `Retirer jean.retire.${stamp}@baobab-fictive.cd` })
      .click();
    await page
      .getByRole("radiogroup", { name: `aline.mukeba.${stamp}@baobab-fictive.cd` })
      .getByRole("radio", { name: "Manager" })
      .click();
    await page
      .getByRole("radiogroup", { name: `patrice.nzuzi.${stamp}@baobab-fictive.cd` })
      .getByRole("radio", { name: "Lecteur" })
      .click();
    await expect(
      page.getByText("5 utilisateurs au plus dans la formule Company · 4 avec vous"),
    ).toBeVisible();
    await expect(preview).toContainText("3 invitations");
    await shot(page, "028-equipe");
    await expectAccessible(page);
    await page.getByRole("button", { name: "Envoyer les invitations" }).click();

    // Prêt.
    await expect(page).toHaveURL(/etape=pret/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `L'espace Kivu Fintech ${stamp} est prêt`,
    );
    await expect(page.getByText("Page entreprise créée, vérification en cours")).toBeVisible();
    await expect(page.getByText("Formule Company active")).toBeVisible();
    await expect(page.getByText("3 invitations envoyées")).toBeVisible();
    await shot(page, "029-pret");
    await page.getByRole("button", { name: "Entrer dans l'espace administrateur" }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  });

  test("RH Free : un paiement en attente, puis « payer plus tard », sans invitation", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const { org } = await createAccount(page, /^Company 79/);
    await roleToPayment(page);
    // Le numéro …2222 reste en attente chez le prestataire fictif.
    await page.getByLabel("Numéro du compte M-Pesa qui paie").fill("+243810002222");
    await page.getByRole("button", { name: /^Payer/ }).click();
    await expect(page.getByText("Confirmez sur votre téléphone")).toBeVisible({ timeout: 20_000 });
    await shot(page, "027b-paiement-attente");
    await page.getByRole("button", { name: "J'ai confirmé" }).click();
    await expect(page.getByText(/Paiement pas encore reçu/)).toBeVisible();
    await page.getByRole("button", { name: "Réessayer" }).click();
    await page.getByRole("button", { name: "Commencer en RH Free et payer plus tard" }).click();
    await expect(page).toHaveURL(/etape=equipe/, { timeout: 20_000 });
    await page.getByLabel("E-mail à inviter").fill("nadia.fictive@baobab-fictive.cd");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.locator(".ae-toast")).toContainText(
      "RH Free compte 1 utilisateur : passez à Company pour inviter votre équipe",
    );
    await page.getByRole("button", { name: "Continuer sans inviter" }).click();
    await expect(page).toHaveURL(/etape=pret/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`L'espace ${org} est prêt`);
    await expect(page.getByText("Formule RH Free active")).toBeVisible();
    await expect(page.getByText("Aucune invitation envoyée pour l'instant")).toBeVisible();
  });

  test("un recruteur ou un lecteur n'atteint pas les étapes de l'entreprise", async ({ page }) => {
    await logIn(page, "manager@jumanly.test");
    for (const step of ["equipe", "role"]) {
      await page.goto(`/inscription/entreprise?etape=${step}`);
      // The recruiter's home, loaded to its title before the next address (the browser would
      // otherwise drop that one while this page finishes arriving).
      await expect(page).toHaveURL(/\/app\/hire/);
      await expect(
        page.locator("main").filter({ visible: true }).getByRole("heading", { level: 1 }),
      ).toBeVisible();
    }
  });

  test("/inscription?profil=company mène à l'inscription de l'administrateur", async ({ page }) => {
    await page.goto("/inscription?profil=company&forfait=company_plus");
    await expect(page).toHaveURL(/\/inscription\/entreprise\?forfait=company_plus/);
    await expect(page.getByRole("radio", { name: /Company Plus/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

test.describe("Étape 3 · sur un téléphone", () => {
  test.skip(({ isMobile }) => !isMobile, "Le téléphone affiche « À ouvrir sur un ordinateur ».");

  test("« À ouvrir sur un ordinateur » remplace l'inscription de l'entreprise", async ({
    page,
  }) => {
    await page.goto("/inscription/entreprise");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("À ouvrir sur un ordinateur");
    await expect(page.getByRole("link", { name: "Créer un compte recruteur" })).toHaveAttribute(
      "href",
      "/inscription?profil=rh",
    );
    await page.getByRole("link", { name: "Retour à l'accueil" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
