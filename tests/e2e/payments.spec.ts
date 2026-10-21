import { expect, test } from "./fixtures";
import { FAKE_SIGNATURE_HEADER, signFakeWebhook } from "../../src/server/payments/fake";
import { expectAccessible } from "./a11y";
import { demo, logIn, signUpFromPricing, testEmail } from "./session";

// Lot 7 (planche talent-4 § 7): the service first, then the number on its own screen, with the
// dial code (+243 by default) chosen apart.
async function payWith(page: import("@playwright/test").Page, number: string) {
  await page.getByRole("radio", { name: /M-Pesa/ }).check();
  // On a tablet or a computer (planche web talent-4 § 7) the number is on the same screen.
  if (page.viewportSize()!.width < 768) await page.getByRole("button", { name: /^Payer/ }).click();
  await page.getByLabel("Numéro Mobile Money").fill(number);
  await page.getByRole("button", { name: /^Payer/ }).click();
}

// E7 definition of done: failure, retry, success with invoice, upgrade with credit, a webhook
// replayed without effect, a manual refund in the admin.
test("échec, réessai, paiement par webhook rejoué, facture et remboursement", async ({
  page,
  browser,
  baseURL,
  request,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const email = testEmail("paiement");
  await signUpFromPricing(page, "Créer mon compte gratuit", email);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // Refused payment: clear message, retry, keep Free.
  await page.goto("/app/abonnement/payer?forfait=talent_starter");
  await payWith(page, "810 000 000");
  await expect(page.getByRole("heading", { name: "Paiement non abouti" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Réessayer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Garder ma formule actuelle" })).toBeVisible();

  // Waiting on the phone, then the provider's signed webhook confirms; replayed, it does nothing.
  await page.goto("/app/abonnement/payer?forfait=talent_starter");
  await payWith(page, "810 002 222");
  if (isMobile) {
    // Modèle B (lot B5): the waiting screen of the phone; the webhook, the invoice and the refund
    // are the same rules, checked on the computer.
    await expect(page.getByRole("heading", { name: "Paiement", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Comment valider ?" })).toBeVisible();
    return;
  }
  await expect(page.getByRole("heading", { name: "Validez sur votre téléphone" })).toBeVisible();
  // The number is never shown in full.
  await expect(page.getByRole("main")).toContainText("+243 81 ••• 22");
  await expect(page.getByRole("main")).not.toContainText("810002222");
  await page.getByRole("button", { name: "Je n'ai rien reçu" }).click();
  const reference = await page.getByText(/^Référence de la demande : fake_/).textContent();
  const providerRef = reference!.replace("Référence de la demande : ", "").trim();
  await page.keyboard.press("Escape");
  const paymentId = new URL(page.url()).searchParams.get("paiement");
  const body = JSON.stringify({ id: `evt_${paymentId}`, providerRef, status: "succeeded" });
  const send = () =>
    request.post("/api/webhooks/payments/fake", {
      data: body,
      headers: {
        "content-type": "application/json",
        [FAKE_SIGNATURE_HEADER]: signFakeWebhook(body),
      },
    });
  expect((await (await send()).json()).outcome).toBe("processed");
  expect((await (await send()).json()).outcome).toBe("duplicate");
  const forged = await request.post("/api/webhooks/payments/fake", {
    data: body,
    headers: { "content-type": "application/json", [FAKE_SIGNATURE_HEADER]: "00".repeat(32) },
  });
  expect(forged.status()).toBe(401);
  await expect(page.getByRole("heading", { name: "Paiement reçu" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("main")).toContainText(/JMN-\d{4}-\d{6}/);

  // The invoice, as a PDF, in Factures.
  await page.goto("/app/abonnement/factures");
  const invoiceHref = await page
    .getByRole("link", { name: /^Télécharger la facture JMN-/ })
    .getAttribute("href");
  const pdf = await page.request.get(invoiceHref!);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  // Upgrade: the unused time of Starter is deducted.
  await page.goto("/app/abonnement/payer?forfait=talent_pro");
  // On a computer (planche web talent-4 § 7) the deduction is a line of the « Récapitulatif ».
  if (page.viewportSize()!.width < 768)
    await expect(
      page.getByText(/Déjà déduit : .* pour les jours restants de Starter/),
    ).toBeVisible();
  else await expect(page.getByRole("term").filter({ hasText: "Déjà déduit" })).toBeVisible();
  await page.goto("/app/abonnement");
  await expect(page.getByRole("main")).toContainText("Starter");
  // On a computer (planche web talent-4 § 7) the last invoices are on the page itself.
  if (page.viewportSize()!.width < 768)
    await expect(page.getByRole("link", { name: /Factures/ })).toContainText("1 · en PDF");
  else
    await expect(page.getByRole("link", { name: /^Télécharger la facture JMN-/ })).toHaveCount(1);
  await expectAccessible(page);

  // The administrator records a manual refund.
  const context = await browser.newContext({ baseURL });
  const admin = await context.newPage();
  await logIn(admin, demo.admin, undefined, "/admin/abonnements");
  await admin.goto("/admin/abonnements");
  await expectAccessible(admin);
  // Table on desktop, list on phones: the link's name carries the e-mail either way.
  await admin
    .locator("tr:visible, li:visible")
    .filter({ hasText: "Réussi" })
    .getByRole("link", { name: new RegExp(`^Actions pour .*${email.replace(/[.+]/g, "\\$&")}`) })
    .first()
    .click();
  await admin.getByRole("link", { name: "Rembourser manuellement" }).click();
  await admin.getByLabel("Référence du remboursement").fill("REMB-TEST-001");
  await admin.getByRole("button", { name: "Rembourser manuellement" }).click();
  await expect(admin.getByText("Remboursement enregistré.")).toBeVisible();
  await context.close();
});
