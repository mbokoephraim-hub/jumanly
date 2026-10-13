import { isInternalEnv } from "@/lib/env";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export * from "./types";

const globalForPayments = globalThis as unknown as { paymentProvider?: PaymentProvider | null };

/**
 * The configured provider. Until a real one is chosen (step E7), the fake provider is used in
 * local and preview only; elsewhere there is none and paid plans start as a trial.
 */
export function paymentProvider(): PaymentProvider | null {
  if (globalForPayments.paymentProvider === undefined) {
    globalForPayments.paymentProvider = isInternalEnv() ? new FakePaymentProvider() : null;
  }
  return globalForPayments.paymentProvider;
}
