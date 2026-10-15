import type { PaymentMethod } from "@/generated/prisma/client";

/** Text key suffix of a payment method (`…method.mobileMoney`, `…method.bankTransfer`…). */
export const paymentMethodKey = {
  mobile_money: "mobileMoney",
  card: "card",
  bank_transfer: "bankTransfer",
  cash: "cash",
} as const satisfies Record<PaymentMethod, string>;

/** Methods an administrator records by hand (Admin v2, étape 5). */
export const MANUAL_METHODS = ["bank_transfer", "cash"] as const satisfies readonly PaymentMethod[];
