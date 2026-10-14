import { expect, test } from "@playwright/test";
import { FAKE_SIGNATURE_HEADER, signFakeWebhook } from "../../src/server/payments/fake";
import { expectAccessible } from "./a11y";
import { demo, logIn, signUpFromPricing, testEmail } from "./session";

async function payWith(page: import("@playwright/test").Page, number: string) {
  await page.locator("#checkout-operator").selectOption("mpesa");
  await page.locator('input[name="number"]').fill(number);
  await page.getByRole("button", { name: /^Payer/ }).click();
}

// E7 definition of done: failure, retry, success with invoice, upgrade with credit, a webhook
// replayed without effect, a manual refund in the admin.
test("échec, réessai, paiement par webhook rejoué, facture et remboursement", async ({
  page,
  browser,
  baseURL,
  request,
}) => {
  test.setTimeout(180_000);
  const email = testEmail("paiement");
  await signUpFromPricing(page, "Créer mon compte gratuit", email);
  await expect(page).toHaveURL(/\/app\/bienvenue/, { timeout: 20_000 });

  // Refused payment: clear message, retry, keep Free.
  await page.goto("/app/abonnement/payer?forfait=talent_starter");
  await payWith(page, "+243 810 000 000");
  await expect(page.getByText("Le paiement n'a pas abouti")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continuer avec la formule gratuite" }).first(),
  ).toBeVisible();

  // Waiting on the phone, then the provider's signed webhook confirms; replayed, it does nothing.
  await page.goto("/app/abonnement/payer?forfait=talent_starter");
  await payWith(page, "+243 810 002 222");
  await expect(page.getByRole("heading", { name: /Confirmez le paiement/ })).toBeVisible();
  const reference = await page.getByText(/^Référence : fake_/).textContent();
  const providerRef = reference!.replace("Référence : ", "").trim();
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
  await expect(page.getByText("Paiement confirmé")).toBeVisible({ timeout: 15_000 });

  // The invoice, as a PDF.
  const invoiceHref = await page
    .getByRole("link", { name: "Télécharger la facture" })
    .getAttribute("href");
  const pdf = await page.request.get(invoiceHref!);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");

  // Upgrade: the unused time of Starter is deducted.
  await page.goto("/app/abonnement/payer?forfait=talent_pro");
  await expect(page.getByText(/Crédit déduit/)).toBeVisible();
  await page.goto("/app/abonnement");
  await expect(page.getByRole("main")).toContainText("Starter");
  await expect(page.getByRole("link", { name: /Télécharger la facture JMN-/ })).toHaveCount(1);
  await expectAccessible(page);

  // The administrator records a manual refund.
  const context = await browser.newContext({ baseURL });
  const admin = await context.newPage();
  await logIn(admin, demo.admin, undefined, "/admin/abonnements");
  await admin.goto("/admin/abonnements");
  await expectAccessible(admin);
  const item = admin.locator("li").filter({ hasText: email }).filter({ hasText: "Réussi" });
  await item.locator("summary").click();
  await item.getByLabel("Référence du remboursement").fill("REMB-TEST-001");
  await item.getByRole("button", { name: "Rembourser manuellement" }).click();
  await expect(admin.getByText("Remboursement enregistré.")).toBeVisible();
  await context.close();
});
