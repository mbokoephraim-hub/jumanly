/** Payment providers behind one interface (docs/specifications.md, partie 09 § 9.1). */
export type PaymentMethodCode = "mobile_money" | "card";
export type ProviderPaymentStatus = "pending" | "succeeded" | "failed" | "expired";

export type WebhookEvent = {
  id: string;
  providerRef: string;
  status: ProviderPaymentStatus;
};

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
