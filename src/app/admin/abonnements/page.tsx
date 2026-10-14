import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { SubscriptionStatus } from "@/generated/prisma/client";
import { Alert, Badge, Button, Table, Td, Th, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { refundPaymentAction } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listSubscriptions,
  recentPayments,
  subscriptionFilters,
} from "@/server/services/billing-admin";

const paymentStatus = {
  succeeded: "succeeded",
  pending: "pending",
  failed: "failed",
  refunded: "refunded",
  expired: "expired",
} as const;

/** Subscriptions and payments (partie 09): status, holder, invoices, manual refunds. */
export default async function AdminSubscriptions({
  searchParams,
}: PageProps<"/admin/abonnements">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin.subscriptions");
  const writable = canWriteAdmin(admin);
  const filter = subscriptionFilters.find((item) => item === params.statut) ?? null;
  const [subscriptions, payments] = await Promise.all([
    listSubscriptions(db, filter as SubscriptionStatus | null),
    recentPayments(db),
  ]);
  const amount = (cents: number) => [formatUsd(cents), "USD"].join(" ");

  return (
    <>
      <h1 className="text-h1">{t("title")}</h1>
      {params.ok === "remboursement" && <Alert tone="success" title={t("refunded")} />}
      {params.erreur === "remboursement" && <Alert tone="error" title={t("refundError")} />}
      <nav aria-label={t("filter.status")} className="flex flex-wrap gap-2">
        {[null, ...subscriptionFilters].map((item) => (
          <Link
            key={item ?? "all"}
            href={item ? `/admin/abonnements?statut=${item}` : "/admin/abonnements"}
            aria-current={filter === item ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              filter === item ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {item ? t(`status.${item}`) : t("filter.all")}
          </Link>
        ))}
      </nav>
      {subscriptions.length === 0 ? (
        <p className="rounded-card bg-blanc p-6">{t("empty")}</p>
      ) : (
        <Table caption={t("title")}>
          <thead>
            <tr>
              <Th>{t("col.holder")}</Th>
              <Th>{t("col.plan")}</Th>
              <Th>{t("filter.status")}</Th>
              <Th>{t("col.periodEnd")}</Th>
              <Th>{t("col.method")}</Th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((row) => (
              <tr key={row.id}>
                <Td>{row.holder}</Td>
                <Td>{row.plan.name}</Td>
                <Td>
                  <Badge tone={row.status === "past_due" ? "warning" : "neutral"}>
                    {t(`status.${row.status}`)}
                  </Badge>
                </Td>
                <Td>{formatDate(row.currentPeriodEnd)}</Td>
                <Td>
                  {row.payments[0]
                    ? t(
                        `payments.method.${row.payments[0].method === "card" ? "card" : "mobileMoney"}`,
                      )
                    : t("payments.method.manual")}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <section aria-labelledby="payments" className="flex flex-col gap-4">
        <h2 id="payments" className="text-h2">
          {t("payments.title")}
        </h2>
        {payments.length === 0 ? (
          <p className="rounded-card bg-blanc p-6">{t("payments.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-col gap-2 rounded-card bg-blanc p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {[payment.holder, payment.plan.name].join(" · ")}
                  </span>
                  <Badge
                    tone={
                      payment.status === "succeeded"
                        ? "success"
                        : payment.status === "failed"
                          ? "error"
                          : "neutral"
                    }
                  >
                    {t(`payments.status.${paymentStatus[payment.status]}`)}
                  </Badge>
                </div>
                <p className="text-sm text-ardoise">
                  {[
                    formatDate(payment.createdAt),
                    amount(payment.amountCents),
                    t(`payments.method.${payment.method === "card" ? "card" : "mobileMoney"}`),
                    payment.providerRef,
                  ].join(" · ")}
                </p>
                {payment.creditCents > 0 && (
                  <p className="text-sm">
                    {t("payments.credit", { credit: formatUsd(payment.creditCents) })}
                  </p>
                )}
                {payment.refundReference && (
                  <p className="text-sm">
                    {[t("action.refund.reference"), payment.refundReference].join(" : ")}
                  </p>
                )}
                <div className="flex flex-wrap items-start gap-4">
                  {payment.invoice && (
                    <a
                      href={`/app/abonnement/factures/${payment.invoice.id}/pdf`}
                      className="text-sm font-medium underline"
                    >
                      {[t("invoice"), payment.invoice.number].join(" · ")}
                    </a>
                  )}
                  {writable && payment.status === "succeeded" && (
                    <details>
                      <summary className="cursor-pointer text-sm font-medium underline">
                        {t("action.refund.text")}
                      </summary>
                      <form action={refundPaymentAction} className="mt-3 flex flex-col gap-3">
                        <input type="hidden" name="payment" value={payment.id} />
                        <p className="text-sm">
                          {t("action.refund.confirm", {
                            amount: formatUsd(payment.amountCents),
                            currency: "USD",
                            userName: payment.holder,
                          })}
                        </p>
                        <TextField
                          id={`refund-${payment.id}`}
                          name="reference"
                          required
                          maxLength={120}
                          label={t("action.refund.reference")}
                        />
                        <Button type="submit" size="sm" variant="danger" className="self-start">
                          {t("action.refund.text")}
                        </Button>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
