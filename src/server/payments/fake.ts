/**
 * Fake provider (partie 09 § 9.1), local, preview and tests only. It simulates every outcome from
 * the last digits of the Mobile Money number:
 * …0000 → failed, …1111 → expired, …2222 → stays pending, anything else (and cards) → succeeded.
 * Its webhooks are signed like a real provider's (HMAC-SHA256 of the raw body), so that the
 * webhook route, its signature check and its idempotence are tested end to end.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  WebhookSignatureError,
  type PaymentProvider,
  type ProviderPaymentStatus,
  type WebhookEvent,
} from "./types";

export const FAKE_OPERATORS = ["mpesa", "orange", "airtel", "mtn"];
export const FAKE_SIGNATURE_HEADER = "x-fake-signature";

function outcome(msisdn?: string): ProviderPaymentStatus {
  if (msisdn?.endsWith("0000")) return "failed";
  if (msisdn?.endsWith("1111")) return "expired";
  if (msisdn?.endsWith("2222")) return "pending";
  return "succeeded";
}

function secret() {
  return process.env.PAYMENTS_FAKE_WEBHOOK_SECRET || "fake-webhook-secret-local-only";
}

/** Signature of a fake webhook body, as a test or the developer would send it. */
export function signFakeWebhook(rawBody: string) {
  return createHmac("sha256", secret()).update(rawBody).digest("hex");
}

const eventSchema = z.object({
  id: z.string().min(1).max(200),
  providerRef: z.string().min(1).max(200),
  status: z.enum(["pending", "succeeded", "failed", "expired"]),
  amountCents: z.number().int().nonnegative().optional(),
});

export class FakePaymentProvider implements PaymentProvider {
  readonly id = "fake";
  readonly methods = ["mobile_money", "card"] as ("mobile_money" | "card")[];
  readonly countries = ["*"];
  readonly operators = FAKE_OPERATORS;
  private readonly payments = new Map<string, ProviderPaymentStatus>();

  async createPayment(input: Parameters<PaymentProvider["createPayment"]>[0]) {
    const providerRef = `fake_${input.idempotencyKey}`;
    if (!this.payments.has(providerRef)) {
      this.payments.set(
        providerRef,
        input.method === "card" ? "succeeded" : outcome(input.customer.msisdn),
      );
    }
    return { status: "pending" as const, providerRef };
  }

  async getStatus(providerRef: string): Promise<ProviderPaymentStatus> {
    // After a restart the memory is empty: the reference itself carries no secret, so we
    // consider an unknown fake payment as expired rather than paid.
    return this.payments.get(providerRef) ?? "expired";
  }

  async verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookEvent> {
    const given = Buffer.from(headers.get(FAKE_SIGNATURE_HEADER) ?? "", "hex");
    const expected = Buffer.from(signFakeWebhook(rawBody), "hex");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new WebhookSignatureError("signature");
    }
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new WebhookSignatureError("body");
    }
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) throw new WebhookSignatureError("body");
    return parsed.data;
  }

  async refund() {
    // Nothing to do: no money moved.
  }
}
