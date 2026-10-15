import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Prisma, SubscriptionStatus } from "@/generated/prisma/client";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  adminLabel,
  AdminDone,
  AdminFilterBar,
  AdminPageHeader,
  AuditNotice,
  FilterMenu,
  Initials,
  SectionRule,
  SensitivePanel,
  Tag,
  type TagTone,
} from "@/components/admin/kit";
import { moreButton } from "@/components/hire/kit";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { refundPaymentAction } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { GRACE_DAYS } from "@/server/entitlements";
import {
  listSubscriptions,
  recentPayments,
  subscriptionFilters,
} from "@/server/services/billing-admin";

const PAGE = "/admin/abonnements";
const methods = ["mobile_money", "card", "manual"] as const;
type Method = (typeof methods)[number];
const methodKey = { mobile_money: "mobileMoney", card: "card", manual: "manual" } as const;

const statusTone: Record<SubscriptionStatus, TagTone> = {
  trialing: "neon",
  active: "success",
  past_due: "warning",
  canceled: "neutral",
  expired: "error",
  sponsored: "menthe",
};
const paymentTone = {
  succeeded: "success",
  pending: "warning",
  failed: "error",
  refunded: "neutral",
  expired: "neutral",
} as const satisfies Record<string, TagTone>;

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/** « Grâce Mbuyi · grace@… » → the name in bold, the e-mail under it. */
function Holder({ holder }: { holder: string }) {
  const [name, ...rest] = holder.split(" · ");
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-semibold">{name}</span>
      {rest.length > 0 && (
        <span className="truncate text-[11px] leading-[15px] text-ardoise">{rest.join(" · ")}</span>
      )}
    </span>
  );
}

/**
 * Subscriptions and payments (mockup 07-05): counters by status, subscriptions with a « … » that
 * opens the actions of their latest payment, payments, and the manual refund as a sensitive panel
 * (`?paiement=<id>&action=rembourser`).
 */
export default async function AdminSubscriptions({
  searchParams,
}: PageProps<"/admin/abonnements">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const writable = canWriteAdmin(admin);
  const now = new Date();

  const filter = subscriptionFilters.find((item) => item === params.statut) ?? null;
  const q = one(params.q).trim().slice(0, 120).toLowerCase();
  const planName = one(params.forfait).slice(0, 80);
  const method = methods.find((value) => value === params.moyen);
  const paymentId = one(params.paiement).slice(0, 60);
  const action = one(params.action);

  const filters = {
    statut: filter ?? undefined,
    q: one(params.q).trim(),
    forfait: planName,
    moyen: method,
  };
  const href = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes }))
      if (value) query.set(key, value);
    const text = query.toString();
    return text ? `${PAGE}?${text}` : PAGE;
  };

  const grace = new Date(now.getTime() - GRACE_DAYS * 86_400_000);
  // Same rules as `effectiveStatus`, counted in the database.
  const graceWhere: Prisma.SubscriptionWhereInput = {
    OR: [
      { status: "active", currentPeriodEnd: { lte: now, gt: grace } },
      { status: "past_due", currentPeriodEnd: { gt: grace } },
    ],
  };
  const [allSubscriptions, allPayments, plans, activeCount, graceCount, sponsoredCount, toVerify] =
    await Promise.all([
      listSubscriptions(db, filter as SubscriptionStatus | null),
      recentPayments(db),
      db.plan.findMany({
        where: { active: true },
        orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
        select: { name: true },
      }),
      db.subscription.count({ where: { status: "active", currentPeriodEnd: { gt: now } } }),
      db.subscription.count({ where: graceWhere }),
      db.subscription.count({ where: { status: "sponsored", currentPeriodEnd: { gt: now } } }),
      db.payment.count({ where: { status: "pending" } }),
    ]);

  const methodOf = (payment?: { method: "mobile_money" | "card" }): Method =>
    payment ? payment.method : "manual";
  const matches = (holder: string, refs: (string | null | undefined)[]) =>
    !q || [holder, ...refs].some((value) => value?.toLowerCase().includes(q));
  const subscriptions = allSubscriptions.filter(
    (row) =>
      (!planName || row.plan.name === planName) &&
      (!method || methodOf(row.payments[0]) === method) &&
      matches(row.holder, [row.payments[0]?.providerRef]),
  );
  const payments = allPayments.filter(
    (row) =>
      (!planName || row.plan.name === planName) &&
      (!method || row.method === method) &&
      matches(row.holder, [row.providerRef, row.refundReference, row.invoice?.number]),
  );

  const payment = paymentId ? (allPayments.find((row) => row.id === paymentId) ?? null) : null;
  const paymentHref = payment ? href({ paiement: payment.id }) : href({});
  const refunding = writable && payment?.status === "succeeded" && action === "rembourser";
  const canRefund = (row: { status: string }) => writable && row.status === "succeeded";
  const hasActions = (row: { status: string; invoice?: { id: string } | null }) =>
    canRefund(row) || Boolean(row.invoice);
  const invoiceHref = (id: string) => `/app/abonnement/factures/${id}/pdf`;
  const amount = (cents: number) => `${formatUsd(cents)} USD`;
  const dateTime = (date: Date) =>
    `${formatShortDate(date)} · ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: process.env.DEFAULT_TIME_ZONE || "UTC" }).format(date)}`;

  const kpis: { value: number; label: string; icon: IconName; tile: string }[] = [
    {
      value: activeCount,
      label: t("subscriptions.status.active"),
      icon: "check",
      tile: "bg-lime-clair",
    },
    {
      value: graceCount,
      label: t("subscriptions.status.past_due"),
      icon: "horloge",
      tile: "bg-ambre-fond",
    },
    {
      value: sponsoredCount,
      label: t("subscriptions.status.sponsored"),
      icon: "certificat",
      tile: "bg-menthe-claire",
    },
    {
      value: toVerify,
      label: t("subscriptions.kpi.toVerify"),
      icon: "mobile-money",
      tile: "bg-neon/60",
    },
  ];
  const number = new Intl.NumberFormat("fr-FR");
  const holderName = (holder: string) => holder.split(" · ")[0] ?? holder;

  return (
    <>
      <AdminPageHeader title={t("subscriptions.title")} />
      {params.ok === "remboursement" && (
        <AdminDone
          title={t("subscriptions.refunded")}
          journal={paymentId ? { type: "payment", id: paymentId } : undefined}
        />
      )}
      {params.erreur === "remboursement" && (
        <Alert tone="error" title={t("subscriptions.refundError")} />
      )}

      <AdminFilterBar
        action={PAGE}
        searchLabel={t("subscriptions.search")}
        q={filters.q}
        hidden={{ statut: filters.statut, forfait: planName, moyen: method }}
      >
        <FilterMenu
          label={t("subscriptions.filter.status")}
          group="abonnements-statut"
          options={[
            {
              href: href({ statut: undefined }),
              label: t("subscriptions.filter.all"),
              current: !filter,
            },
            ...subscriptionFilters.map((item) => ({
              href: href({ statut: item }),
              label: t(`subscriptions.status.${item}`),
              current: item === filter,
            })),
          ]}
        />
        <FilterMenu
          label={t("subscriptions.filter.plan")}
          group="abonnements-forfait"
          options={[
            {
              href: href({ forfait: undefined }),
              label: t("subscriptions.filter.all"),
              current: !planName,
            },
            ...plans.map((plan) => ({
              href: href({ forfait: plan.name }),
              label: plan.name,
              current: plan.name === planName,
            })),
          ]}
        />
        <FilterMenu
          label={t("subscriptions.filter.method")}
          group="abonnements-moyen"
          options={[
            {
              href: href({ moyen: undefined }),
              label: t("subscriptions.filter.all"),
              current: !method,
            },
            ...methods.map((value) => ({
              href: href({ moyen: value }),
              label: t(`subscriptions.payments.method.${methodKey[value]}`),
              current: value === method,
            })),
          ]}
        />
      </AdminFilterBar>

      <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5">
        {kpis.map((kpi) => (
          <li
            key={kpi.label}
            className="flex items-center gap-3 rounded-[20px] bg-blanc p-3.5 lg:rounded-[24px] lg:px-[18px] lg:py-4"
          >
            <span
              aria-hidden
              className={cx(
                "grid size-10 shrink-0 place-items-center rounded-[12px] text-sapin",
                kpi.tile,
              )}
            >
              <Icon name={kpi.icon} className="size-[18px]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[20px] leading-6 font-semibold tracking-[-0.02em] lg:text-[22px]">
                {number.format(kpi.value)}
              </span>
              <span className="truncate text-[11px] leading-[15px] text-ardoise">{kpi.label}</span>
            </span>
          </li>
        ))}
      </ul>

      {subscriptions.length === 0 ? (
        <p className="rounded-[24px] bg-blanc px-5 py-8 text-center text-[13.5px] text-ardoise">
          {t("subscriptions.empty")}
        </p>
      ) : (
        <>
          <div
            role="region"
            aria-label={t("subscriptions.list")}
            tabIndex={0}
            className="hidden overflow-x-auto rounded-[24px] bg-blanc py-1.5 lg:block"
          >
            <table className="w-full min-w-[760px] border-collapse text-left text-[13.5px]">
              <caption className="sr-only">{t("subscriptions.list")}</caption>
              <thead>
                <tr className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                  <th scope="col" className="px-[18px] py-2.5 font-semibold">
                    {t("subscriptions.col.holder")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("subscriptions.col.plan")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("subscriptions.filter.status")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("subscriptions.col.periodEnd")}
                  </th>
                  <th scope="col" className="w-[120px] px-1.5 py-2.5 font-semibold">
                    {t("subscriptions.col.method")}
                  </th>
                  <th scope="col" className="w-[60px] py-2.5 pr-[18px]">
                    <span className="sr-only">
                      {t("subscriptions.actions.title", { holder: "" })}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((row) => {
                  const last = row.payments[0];
                  return (
                    <tr key={row.id} className="border-t border-brume">
                      <td className="max-w-[280px] py-3 pr-1.5 pl-[18px]">
                        <span className="flex items-center gap-2.5">
                          <Initials name={holderName(row.holder)} size={28} />
                          <Holder holder={row.holder} />
                        </span>
                      </td>
                      <td className="px-1.5 py-3">{row.plan.name}</td>
                      <td className="px-1.5 py-3">
                        <Tag tone={statusTone[row.status]}>
                          {t(`subscriptions.status.${row.status}`)}
                        </Tag>
                      </td>
                      <td className="px-1.5 py-3 whitespace-nowrap">
                        {formatShortDate(row.currentPeriodEnd)}
                      </td>
                      <td className="px-1.5 py-3 whitespace-nowrap">
                        {t(`subscriptions.payments.method.${methodKey[methodOf(last)]}`)}
                      </td>
                      <td className="py-3 pr-[18px] text-right">
                        {last &&
                          hasActions({
                            ...last,
                            invoice: allPayments.find((item) => item.id === last.id)?.invoice,
                          }) && (
                            <Link
                              href={`${href({ paiement: last.id })}#abonnements-actions`}
                              aria-label={t("subscriptions.actions.open", {
                                holder: holderName(row.holder),
                              })}
                              className={cx(moreButton, "inline-grid bg-creme ring-0")}
                            >
                              <Icon name="more" className="size-4" />
                            </Link>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul
            aria-label={t("subscriptions.list")}
            className="rounded-[24px] bg-blanc px-3.5 py-1.5 lg:hidden"
          >
            {subscriptions.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 border-brume py-3 not-first:border-t"
              >
                <Initials name={holderName(row.holder)} size={38} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13.5px] leading-[18px] font-semibold">
                    {holderName(row.holder)}
                  </span>
                  <span className="truncate text-[11.5px] leading-4 text-ardoise">
                    {[row.plan.name, formatShortDate(row.currentPeriodEnd)].join(" · ")}
                  </span>
                </span>
                <Tag tone={statusTone[row.status]} className="max-w-[46%] truncate">
                  {t(`subscriptions.status.${row.status}`)}
                </Tag>
              </li>
            ))}
          </ul>
        </>
      )}

      <section aria-labelledby="abonnements-paiements" className="flex flex-col gap-3">
        <h2
          id="abonnements-paiements"
          className="text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
        >
          {t("subscriptions.payments.title")}
        </h2>
        {payments.length === 0 ? (
          <p className="rounded-[24px] bg-blanc px-5 py-8 text-center text-[13.5px] text-ardoise">
            {t("subscriptions.payments.empty")}
          </p>
        ) : (
          <>
            <div
              role="region"
              aria-label={t("subscriptions.payments.list")}
              tabIndex={0}
              className="hidden overflow-x-auto rounded-[24px] bg-blanc py-1.5 lg:block"
            >
              <table className="w-full min-w-[820px] border-collapse text-left text-[13.5px]">
                <caption className="sr-only">{t("subscriptions.payments.list")}</caption>
                <thead>
                  <tr className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                    <th scope="col" className="px-[18px] py-2.5 font-semibold">
                      {t("subscriptions.payments.col.date")}
                    </th>
                    <th scope="col" className="px-1.5 py-2.5 font-semibold">
                      {t("subscriptions.col.holder")}
                    </th>
                    <th scope="col" className="px-1.5 py-2.5 font-semibold">
                      {t("subscriptions.payments.col.amount")}
                    </th>
                    <th scope="col" className="px-1.5 py-2.5 font-semibold">
                      {t("subscriptions.col.method")}
                    </th>
                    <th scope="col" className="px-1.5 py-2.5 font-semibold">
                      {t("subscriptions.payments.col.status")}
                    </th>
                    <th scope="col" className="px-1.5 py-2.5 font-semibold">
                      {t("subscriptions.payments.col.reference")}
                    </th>
                    <th scope="col" className="w-[60px] py-2.5 pr-[18px]">
                      <span className="sr-only">
                        {t("subscriptions.actions.title", { holder: "" })}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row) => (
                    <tr
                      key={row.id}
                      className={cx(
                        "border-t border-brume",
                        row.id === payment?.id && "bg-creme/50",
                      )}
                    >
                      <td className="py-3 pr-1.5 pl-[18px] text-[12px] whitespace-nowrap">
                        {dateTime(row.createdAt)}
                      </td>
                      <td className="max-w-[240px] px-1.5 py-3">
                        <Holder holder={row.holder} />
                        {row.creditCents > 0 && (
                          <span className="block text-[11px] text-ardoise">
                            {t("subscriptions.payments.credit", {
                              credit: formatUsd(row.creditCents),
                            })}
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-3 font-semibold whitespace-nowrap">
                        {amount(row.amountCents)}
                      </td>
                      <td className="px-1.5 py-3 whitespace-nowrap">
                        {t(`subscriptions.payments.method.${methodKey[row.method]}`)}
                      </td>
                      <td className="px-1.5 py-3">
                        <Tag tone={paymentTone[row.status]}>
                          {t(`subscriptions.payments.status.${row.status}`)}
                        </Tag>
                      </td>
                      <td className="px-1.5 py-3">
                        <code className="text-[11px] break-all">{row.providerRef}</code>
                        {row.refundReference && (
                          <code className="block text-[11px] break-all text-ardoise">
                            {row.refundReference}
                          </code>
                        )}
                      </td>
                      <td className="py-3 pr-[18px] text-right">
                        {hasActions(row) && (
                          <Link
                            href={`${href({ paiement: row.id })}#abonnements-actions`}
                            aria-label={t("subscriptions.actions.open", {
                              holder: row.holder,
                            })}
                            className={cx(moreButton, "inline-grid bg-creme ring-0")}
                          >
                            <Icon name="more" className="size-4" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul
              aria-label={t("subscriptions.payments.list")}
              className="rounded-[24px] bg-blanc px-3.5 py-1.5 lg:hidden"
            >
              {payments.map((row) => {
                const content = (
                  <>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13.5px] leading-[18px] font-semibold">
                        {[holderName(row.holder), amount(row.amountCents)].join(" · ")}
                      </span>
                      <span className="truncate text-[11.5px] leading-4 text-ardoise">
                        {[
                          dateTime(row.createdAt),
                          t(`subscriptions.payments.method.${methodKey[row.method]}`),
                        ].join(" · ")}
                      </span>
                    </span>
                    <Tag tone={paymentTone[row.status]} className="max-w-[42%] truncate">
                      {t(`subscriptions.payments.status.${row.status}`)}
                    </Tag>
                  </>
                );
                return (
                  <li key={row.id} className="border-brume not-first:border-t">
                    {hasActions(row) ? (
                      <Link
                        href={`${href({ paiement: row.id })}#abonnements-actions`}
                        aria-label={t("subscriptions.actions.open", { holder: row.holder })}
                        className="flex items-center gap-3 py-3"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 py-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {payment ? (
        <div className="flex flex-col gap-2">
          <SectionRule>{t("sensitive.label")}</SectionRule>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0">
              <nav
                id="abonnements-actions"
                aria-label={t("subscriptions.actions.title", {
                  holder: holderName(payment.holder),
                })}
                className="flex scroll-mt-4 flex-col gap-1 rounded-[24px] bg-blanc px-5 py-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className={adminLabel}>
                    {t("subscriptions.actions.title", { holder: holderName(payment.holder) })}
                  </h2>
                  <Link
                    href={href({})}
                    scroll={false}
                    aria-label={t("sensitive.close")}
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
                  >
                    <Icon name="fermer" className="size-3.5" />
                  </Link>
                </div>
                <p className="text-[11.5px] leading-4 text-ardoise">
                  {[
                    payment.plan.name,
                    amount(payment.amountCents),
                    dateTime(payment.createdAt),
                  ].join(" · ")}
                </p>
                <ul className="mt-1 flex flex-col">
                  {payment.invoice && (
                    <li>
                      <a
                        href={invoiceHref(payment.invoice.id)}
                        className="flex items-center gap-2.5 py-2 text-[13px] font-medium hover:underline"
                      >
                        <Icon name="doc" className="size-4 shrink-0" />
                        {[t("subscriptions.invoice"), payment.invoice.number].join(" · ")}
                      </a>
                    </li>
                  )}
                  {canRefund(payment) && (
                    <li>
                      <Link
                        href={`${paymentHref}&action=rembourser`}
                        scroll={false}
                        className="flex items-center gap-2.5 py-2 text-[13px] font-medium text-corail-fonce hover:underline"
                      >
                        <Icon name="mobile-money" className="size-4 shrink-0" />
                        {t("subscriptions.action.refund.text")}
                      </Link>
                    </li>
                  )}
                  {!payment.invoice && !canRefund(payment) && (
                    <li className="py-2 text-[12px] text-ardoise">
                      {t("subscriptions.actions.none")}
                    </li>
                  )}
                </ul>
              </nav>
              <AuditNotice className="max-lg:hidden" />
            </div>
            {refunding && (
              <SensitivePanel
                title={t("subscriptions.action.refund.text")}
                text={t("subscriptions.action.refund.confirm", {
                  amount: formatUsd(payment.amountCents),
                  currency: "USD",
                  userName: holderName(payment.holder),
                })}
                closeHref={paymentHref}
                className="min-w-0 flex-1"
              >
                <form action={refundPaymentAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="payment" value={payment.id} />
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="abonnements-refund-reference"
                      className="text-[13px] font-semibold"
                    >
                      {t("subscriptions.action.refund.reference")}
                    </label>
                    <span className="relative">
                      <Icon
                        name="doc"
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ardoise"
                      />
                      <input
                        id="abonnements-refund-reference"
                        name="reference"
                        required
                        maxLength={120}
                        className="h-12 w-full rounded-[16px] bg-blanc pr-4 pl-11 text-[14px] text-sapin ring-[1.5px] ring-brume ring-inset focus:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus:ring-2 focus:ring-sapin focus:outline-none"
                      />
                    </span>
                    <p className="flex items-start gap-1.5 text-[11px] leading-4 text-ardoise">
                      <Icon name="doc" className="mt-px size-3 shrink-0" />
                      {t("reason.required")}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={paymentHref} scroll={false} variant="tertiary">
                      {tc("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="danger">
                      {t("subscriptions.action.refund.text")}
                    </Button>
                  </div>
                </form>
              </SensitivePanel>
            )}
          </div>
          <AuditNotice className="mt-2 lg:hidden" />
        </div>
      ) : (
        <AuditNotice />
      )}
    </>
  );
}
