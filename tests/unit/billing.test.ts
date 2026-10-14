// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  FAKE_SIGNATURE_HEADER,
  FakePaymentProvider,
  signFakeWebhook,
} from "@/server/payments/fake";
import { isWebhookSignatureError } from "@/server/payments";
import { reminderStep } from "@/server/services/billing-jobs";
import { invoiceNumber } from "@/server/services/invoices";

const DAY = 86_400_000;

describe("rappels de renouvellement", () => {
  it("J-7, J-3, J-0, puis rien après l'échéance", () => {
    expect(reminderStep(8 * DAY)).toBeNull();
    expect(reminderStep(7 * DAY)).toBe("j7");
    expect(reminderStep(4 * DAY)).toBe("j7");
    expect(reminderStep(3 * DAY)).toBe("j3");
    expect(reminderStep(2 * DAY)).toBe("j3");
    expect(reminderStep(DAY)).toBe("j0");
    expect(reminderStep(3_600_000)).toBe("j0");
    expect(reminderStep(0)).toBeNull();
  });
});

describe("factures", () => {
  it("numéro séquentiel sur six chiffres, préfixé de l'année", () => {
    expect(invoiceNumber(42, new Date("2026-10-14T00:00:00Z"))).toBe("JMN-2026-000042");
  });
});

describe("webhooks du fournisseur factice", () => {
  const provider = new FakePaymentProvider();
  const body = JSON.stringify({ id: "evt_1", providerRef: "fake_1", status: "succeeded" });

  it("accepte un corps signé", async () => {
    const headers = new Headers({ [FAKE_SIGNATURE_HEADER]: signFakeWebhook(body) });
    await expect(provider.verifyWebhook(headers, body)).resolves.toMatchObject({
      id: "evt_1",
      status: "succeeded",
    });
  });

  it("refuse une signature absente, fausse ou un corps modifié", async () => {
    for (const [signature, raw] of [
      ["", body],
      ["00".repeat(32), body],
      [signFakeWebhook(body), body.replace("succeeded", "failed")],
    ]) {
      const error = await provider
        .verifyWebhook(new Headers({ [FAKE_SIGNATURE_HEADER]: signature! }), raw!)
        .catch((caught: unknown) => caught);
      expect(isWebhookSignatureError(error)).toBe(true);
    }
  });
});
