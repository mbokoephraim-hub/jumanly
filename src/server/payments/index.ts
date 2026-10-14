import { isInternalEnv } from "@/lib/env";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export * from "./types";

const globalForPayments = globalThis as unknown as { paymentProvider?: PaymentProvider | null };

/**
 * The configured provider. No real provider is chosen yet (docs/decisions): the fake provider is
 * used in local and preview only; elsewhere there is none and paid plans start as a trial.
 * A real adapter is added here, chosen by `PAYMENTS_MOBILE_MONEY_PROVIDER`.
 */
export function paymentProvider(): PaymentProvider | null {
  if (globalForPayments.paymentProvider === undefined) {
    globalForPayments.paymentProvider = isInternalEnv() ? new FakePaymentProvider() : null;
  }
  return globalForPayments.paymentProvider;
}

/** The provider a webhook URL names (`/api/webhooks/payments/[provider]`), if it is configured. */
export function paymentProviderById(id: string): PaymentProvider | null {
  const provider = paymentProvider();
  return provider?.id === id ? provider : null;
}
