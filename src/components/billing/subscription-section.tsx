import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { PlanFamily } from "@/generated/prisma/client";
import { Alert, Badge, Button, ButtonLink, QuotaGauge, TextArea, TextField } from "@/components/ui";
import { quotaRows } from "@/config/quotas";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import {
  cancelSubscription,
  downgradeSubscription,
  resumeSubscription,
  saveBillingDetailsAction,
} from "@/server/actions/billing";
import { db } from "@/server/db";
import { parseLimit, resolvePlan, usage, type Subject } from "@/server/entitlements";
import { effectiveStatus, GRACE_DAYS } from "@/server/entitlements/periods";
import { liveSubscription, paymentHistory } from "@/server/services/subscriptions";

const DAY = 86_400_000;

async function capacityUsed(subject: Subject, key: string): Promise<number> {
  if (subject.type !== "organization") return 0;
  if (key === "org.seats") {
    return db.membership.count({ where: { organizationId: subject.id, status: "active" } });
  }
  if (key === "jobs.active.max") {
    return db.job.count({ where: { organizationId: subject.id, status: "published" } });
  }
  return 0;
}

/**
 * One subscription (the person's, or their organization's): plan, status, quotas, plan change
 * and payment history. Everything shown is read from the database and the entitlements.
 */
export async function SubscriptionSection({
  subject,
  family,
  families,
  heading,
}: {
  subject: Subject;
  /** Family used to find who pays (talent, or an organization family). */
  family: PlanFamily;
  families: PlanFamily[];
  heading?: string;
}) {
  const t = await getTranslations("billing");
  const tCheckout = await getTranslations("checkout.summary");
  const tRenewal = await getTranslations("renewal.banner");
  const now = new Date();
  const plan = await resolvePlan(db, subject, now);
  if (!plan) return null;
  const current = await liveSubscription(db, subject, now);
  const status = current ? effectiveStatus(current, now) : null;
  const daysLeft = current
    ? Math.max(0, Math.ceil((current.currentPeriodEnd.getTime() - now.getTime()) / DAY))
    : 0;

  const gauges = await Promise.all(
    quotaRows
      .filter((row) => row.key in plan.values)
      .map(async (row) => {
        const max = parseLimit(plan.values[row.key]);
        const used =
          row.kind === "quota"
            ? (await usage(db, subject, row.key, now)).used
            : await capacityUsed(subject, row.key);
        return { ...row, max, used };
      }),
  );

  const plans = await db.plan.findMany({
    where: { family: { in: families }, active: true, isPublic: true },
    orderBy: [{ sortOrder: "asc" }],
  });
  const history = await paymentHistory(db, subject);
  const details = await db.billingDetails.findUnique({
    where: { subjectType_subjectId: { subjectType: subject.type, subjectId: subject.id } },
  });
  const prefix = `billing-${subject.type}`;
  const renewHref = current
    ? `/app/abonnement/payer?forfait=${current.pendingPlan?.code ?? current.plan.code}`
    : "";
  const currentPrice = plan.priceCents ?? 0;
  const statusKey =
    status === "past_due"
      ? "pastDue"
      : status === "trialing" || status === "canceled" || status === "sponsored"
        ? status
        : "active";

  return (
    <section className="flex flex-col gap-6" aria-label={heading ?? t("current.title")}>
      {heading && <h2 className="text-h1">{heading}</h2>}
      {current && status === "past_due" && (
        <Alert
          tone="warning"
          title={tRenewal("grace.text", {
            plan: current.plan.name,
            graceEndDate: formatDate(
              new Date(current.currentPeriodEnd.getTime() + GRACE_DAYS * DAY),
            ),
          })}
          action={<ButtonLink href={renewHref}>{t("current.renew")}</ButtonLink>}
        />
      )}
      {current && status === "active" && daysLeft <= 7 && !current.pendingPlan && (
        <Alert
          title={
            daysLeft === 0
              ? tRenewal("today", { plan: current.plan.name })
              : tRenewal("upcoming", {
                  plan: current.plan.name,
                  days: daysLeft,
                  date: formatDate(current.currentPeriodEnd),
                })
          }
          action={<ButtonLink href={renewHref}>{t("current.renew")}</ButtonLink>}
        />
      )}
      <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <p className="text-eyebrow text-ardoise">{t("current.title")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-h2">{t("current.plan", { plan: plan.planName })}</p>
          {current && (
            <Badge tone={status === "past_due" ? "warning" : "success"}>
              {t(`current.status.${statusKey}`, {
                endDate: formatDate(current.currentPeriodEnd),
              })}
            </Badge>
          )}
        </div>
        {current ? (
          <>
            <p className="font-semibold">
              {t("current.price", { price: formatUsd(current.plan.priceCents ?? 0) })}
            </p>
            <p className="text-sm text-ardoise">
              {t("current.period", {
                startDate: formatDate(current.currentPeriodStart),
                endDate: formatDate(current.currentPeriodEnd),
              })}
            </p>
            <p className="text-sm">{t("current.daysLeft", { days: daysLeft })}</p>
            {current.pendingPlan && (
              <form
                action={downgradeSubscription}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <input type="hidden" name="family" value={family} />
                <input type="hidden" name="plan" value="" />
                <span>
                  {t("current.scheduled.text", {
                    plan: current.pendingPlan.name,
                    date: formatDate(current.currentPeriodEnd),
                  })}
                </span>
                <Button type="submit" variant="tertiary" size="sm">
                  {t("current.scheduled.cancel")}
                </Button>
              </form>
            )}
            <div className="flex flex-wrap gap-3">
              {status !== "trialing" && (
                <ButtonLink href={renewHref} size="sm">
                  {t("current.renew")}
                </ButtonLink>
              )}
              {status === "canceled" ? (
                <form action={resumeSubscription}>
                  <input type="hidden" name="family" value={family} />
                  <Button type="submit" variant="secondary" size="sm">
                    {t("current.resume")}
                  </Button>
                </form>
              ) : (
                status !== "trialing" && (
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-medium underline">
                      {t("current.cancel")}
                    </summary>
                    <form
                      action={cancelSubscription}
                      className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                    >
                      <input type="hidden" name="family" value={family} />
                      <p className="font-semibold">
                        {t("cancel.title", { plan: current.plan.name })}
                      </p>
                      <p className="text-sm">
                        {t("cancel.text", {
                          endDate: formatDate(current.currentPeriodEnd),
                          freePlan: plans.find((item) => item.priceCents === 0)?.name ?? "",
                        })}
                      </p>
                      <Button type="submit" variant="danger" size="sm">
                        {t("cancel.confirm")}
                      </Button>
                    </form>
                  </details>
                )
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <p className="font-semibold">{t("current.freeTitle")}</p>
            <p className="text-sm text-ardoise">{t("current.freeText")}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <h3 className="text-h2">{t("quotas.title")}</h3>
        <p className="text-sm text-ardoise">
          {t("quotas.subtitle", { resetDate: formatDate(plan.periodEnd) })}
        </p>
        <div className="flex flex-col gap-1">
          <span className="text-[15px] font-medium">{t("quotas.applications")}</span>
          <span className="text-sm text-feuille-fonce">{t("quotas.applicationsValue")}</span>
        </div>
        {gauges.map((gauge) =>
          gauge.max === 0 ? (
            <div key={gauge.key} className="flex justify-between gap-3 text-[15px]">
              <span className="font-medium">{t(`quotas.${gauge.label}`)}</span>
              <span className="text-ardoise text-label">{t("quotas.none")}</span>
            </div>
          ) : (
            <QuotaGauge
              key={gauge.key}
              label={t(`quotas.${gauge.label}`)}
              used={gauge.used}
              limit={gauge.max < 0 ? null : gauge.max}
            />
          ),
        )}
        <p className="text-ardoise text-caption">{t("quotas.help")}</p>
      </div>

      <div id="changer" className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6">
        <h3 className="text-h2">{t("change.title")}</h3>
        <p className="text-sm text-ardoise">{t("change.subtitle")}</p>
        <ul className="flex flex-col divide-y divide-brume">
          {plans.map((item) => {
            const price = item.priceCents;
            const action =
              item.id === plan.planId ? (
                <Badge tone="sapin">{t("change.current")}</Badge>
              ) : price === null ? (
                <ButtonLink href="/contact?sujet=devis" variant="tertiary" size="sm">
                  {t("change.quote")}
                </ButtonLink>
              ) : price > currentPrice && item.isPurchasable ? (
                <ButtonLink href={`/app/abonnement/payer?forfait=${item.code}`} size="sm">
                  {t("change.upgrade", { plan: item.name })}
                </ButtonLink>
              ) : price > 0 && current && item.isPurchasable ? (
                <form action={downgradeSubscription}>
                  <input type="hidden" name="family" value={family} />
                  <input type="hidden" name="plan" value={item.code} />
                  <Button type="submit" variant="secondary" size="sm">
                    {t("change.downgrade", { plan: item.name })}
                  </Button>
                </form>
              ) : (
                <span className="text-ardoise text-caption">{t("change.unavailable")}</span>
              );
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="flex flex-col">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-sm text-ardoise">
                    {price === null
                      ? t("upgrade.summary.price")
                      : price === 0
                        ? t("current.free")
                        : t("current.price", { price: formatUsd(price) })}
                  </span>
                </span>
                {action}
              </li>
            );
          })}
        </ul>
        <Link href="/tarifs" className="text-sm underline">
          {t("current.freeCta")}
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-card bg-blanc p-6">
        <h3 className="text-h2">{t("history.title")}</h3>
        {history.length === 0 ? (
          <p className="text-sm text-ardoise">{t("history.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-ardoise">
                  <th className="py-2 pr-4 font-medium">{t("history.col.date")}</th>
                  <th className="py-2 pr-4 font-medium">{t("history.col.description")}</th>
                  <th className="py-2 pr-4 font-medium">{t("history.col.amount")}</th>
                  <th className="py-2 pr-4 font-medium">{t("history.col.status")}</th>
                  <th className="py-2 font-medium">{t("history.col.invoice")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((payment) => (
                  <tr key={payment.id} className="border-t border-brume">
                    <td className="py-2 pr-4">{formatDate(payment.createdAt)}</td>
                    <td className="py-2 pr-4">
                      {t("history.description", {
                        plan: payment.plan.name,
                        startDate: formatDate(payment.periodStart),
                        endDate: formatDate(payment.periodEnd),
                      })}
                    </td>
                    <td className="py-2 pr-4">
                      {tCheckout("amount", { amount: formatUsd(payment.amountCents) })}
                    </td>
                    <td className="py-2 pr-4">
                      {t(
                        `history.status.${payment.status === "succeeded" ? "paid" : payment.status}`,
                      )}
                    </td>
                    <td className="py-2">
                      {payment.invoice && (
                        <a
                          href={`/app/abonnement/factures/${payment.invoice.id}/pdf`}
                          className="underline"
                          aria-label={t("history.downloadAlt", { number: payment.invoice.number })}
                        >
                          {t("history.download")}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <form
        action={saveBillingDetailsAction}
        className="flex flex-col gap-4 rounded-card bg-blanc p-6"
        aria-labelledby={`${prefix}-details`}
      >
        <h3 id={`${prefix}-details`} className="text-h2">
          {t("invoiceDetails.title")}
        </h3>
        <p className="text-sm text-ardoise">{t("invoiceDetails.text")}</p>
        <input type="hidden" name="family" value={family} />
        <TextField
          id={`${prefix}-name`}
          name="name"
          required
          maxLength={160}
          defaultValue={details?.name ?? ""}
          label={t("invoiceDetails.name.label")}
        />
        <TextArea
          id={`${prefix}-address`}
          name="address"
          rows={2}
          maxLength={400}
          defaultValue={details?.address ?? ""}
          label={t("invoiceDetails.address.label")}
        />
        {subject.type === "organization" && (
          <TextField
            id={`${prefix}-tax`}
            name="taxId"
            maxLength={60}
            defaultValue={details?.taxId ?? ""}
            label={t("invoiceDetails.taxId.label")}
            hint={t("invoiceDetails.taxId.help")}
          />
        )}
        <TextField
          id={`${prefix}-email`}
          name="email"
          type="email"
          maxLength={200}
          defaultValue={details?.email ?? ""}
          label={t("invoiceDetails.email.label")}
        />
        <Button type="submit" variant="secondary" className="self-start">
          {t("invoiceDetails.save")}
        </Button>
      </form>
    </section>
  );
}
