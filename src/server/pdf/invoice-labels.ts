import { getTranslations } from "next-intl/server";
import type { Invoice, Payment } from "@/generated/prisma/client";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { paymentMethodKey } from "@/lib/payment-method";
import type { InvoiceLabels } from "./invoice-document";

/** Every text of an invoice PDF, translated (textes `billing.invoice.pdf.*`). */
export async function invoiceLabels(
  invoice: Invoice & { payment: Payment },
): Promise<InvoiceLabels> {
  const t = await getTranslations("billing.invoice.pdf");
  const common = await getTranslations("common");
  const admin = await getTranslations("admin");
  const amount = (cents: number) => t("amount", { amount: formatUsd(cents) });
  const lines = [{ label: t("price"), amount: amount(invoice.amountCents + invoice.creditCents) }];
  if (invoice.creditCents > 0) {
    lines.push({ label: t("credit"), amount: amount(-invoice.creditCents) });
  }
  return {
    brand: common("brand"),
    title: t("title"),
    number: t("number", { number: invoice.number }),
    issued: t("issued", { date: formatDate(invoice.issuedAt) }),
    seller: t("seller"),
    sellerContact: t("sellerContact"),
    billedTo: t("billedTo"),
    billed: [
      invoice.billedName,
      invoice.billedEmail,
      invoice.billedAddress,
      invoice.billedTaxId ? t("taxId", { taxId: invoice.billedTaxId }) : null,
    ].filter((line): line is string => !!line),
    description: t("description", {
      plan: invoice.planName,
      startDate: formatDate(invoice.periodStart),
      endDate: formatDate(invoice.periodEnd),
    }),
    lines,
    total: { label: t("total"), amount: amount(invoice.amountCents) },
    meta: [
      t("method", {
        method: admin(`subscriptions.payments.method.${paymentMethodKey[invoice.payment.method]}`),
      }),
      t("reference", { reference: invoice.payment.providerRef }),
    ],
    refunded: invoice.payment.refundedAt
      ? t("refunded", { date: formatDate(invoice.payment.refundedAt) })
      : null,
    footer: t("footer"),
  };
}
