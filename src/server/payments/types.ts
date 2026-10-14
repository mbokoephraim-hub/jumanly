/** Payment providers behind one interface (docs/specifications.md, partie 09 § 9.1). */
export type PaymentMethodCode = "mobile_money" | "card";
export type ProviderPaymentStatus = "pending" | "succeeded" | "failed" | "expired";

/** A verified webhook: the provider's own event id makes a replay a no-op (partie 09 § 9.4). */
export type WebhookEvent = {
  id: string;
  providerRef: string;
  status: ProviderPaymentStatus;
  /** When the provider sends it, checked against the payment before activating anything. */
  amountCents?: number;
};

export class WebhookSignatureError extends Error {
  override name = "WebhookSignatureError";
}

/**
 * By name, not `instanceof`: the provider is a process-wide singleton, and Next.js may bundle
 * this module more than once (route handlers, server actions), each with its own class.
 */
export function isWebhookSignatureError(error: unknown) {
  return error instanceof Error && error.name === "WebhookSignatureError";
}

export interface PaymentProvider {
  id: string;
  methods: PaymentMethodCode[];
  countries: string[];
  operators?: string[];
  createPayment(input: {
    amountCents: number;
    currency: "USD";
    reference: string;
    method: PaymentMethodCode;
    customer: { email: string; msisdn?: string; operator?: string; country: string };
    returnUrl: string;
    idempotencyKey: string;
  }): Promise<{ status: "pending" | "redirect"; providerRef: string; redirectUrl?: string }>;
  getStatus(providerRef: string): Promise<ProviderPaymentStatus>;
  verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookEvent>;
  refund?(providerRef: string, amountCents?: number): Promise<void>;
}
