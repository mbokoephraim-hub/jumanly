/**
 * Fake provider (partie 09 § 9.1), local and preview only. It simulates every outcome from the
 * last digits of the Mobile Money number:
 * …0000 → failed, …1111 → expired, …2222 → stays pending, anything else (and cards) → succeeded.
 */
import type { PaymentProvider, ProviderPaymentStatus } from "./types";

export const FAKE_OPERATORS = ["mpesa", "orange", "airtel", "mtn"];

function outcome(msisdn?: string): ProviderPaymentStatus {
  if (msisdn?.endsWith("0000")) return "failed";
  if (msisdn?.endsWith("1111")) return "expired";
  if (msisdn?.endsWith("2222")) return "pending";
  return "succeeded";
}

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

  async verifyWebhook(): Promise<never> {
    throw new Error("Le fournisseur factice n'envoie pas de webhooks.");
  }
}
