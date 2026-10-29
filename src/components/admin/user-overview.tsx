import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { adminLabel, Tag, type TagTone } from "@/components/admin/kit";
import { Button, ButtonLink } from "@/components/ui";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { paymentMethodKey } from "@/lib/payment-method";
import { sendResetLinkAction } from "@/server/actions/admin-users";
import type { ActivityKind, UserAlert, UserOverview } from "@/server/services/admin-user-overview";

/**
 * Fiche utilisateur, colonne principale (Ephraïm, 29/10/2026): what the person does, their payments
 * and the end of their subscription, their complaints and the alerts about them, and the help to
 * sign in again. Never private messages, CVs or documents.
 */

function Section({
  id,
  icon,
  title,
  aside,
  children,
}: {
  id: string;
  icon: IconName;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="jm-admin-card flex scroll-mt-6 flex-col gap-3.5 rounded-[24px] bg-blanc px-5 py-5 lg:px-[22px]"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="jm-admin-tile grid size-9 shrink-0 place-items-center rounded-[12px] text-sapin"
        >
          <Icon name={icon} className="size-[17px]" />
        </span>
        <h2
          id={`${id}-title`}
          className="flex-1 text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
        >
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-[18px] text-ardoise">{children}</p>;
}

const activityIcon: Record<ActivityKind, IconName> = {
  signIn: "lock",
  application: "jobs",
  course: "learn",
  courseDone: "valider",
  certificate: "certificat",
  post: "edit",
};

const paymentTone: Record<string, TagTone> = {
  succeeded: "success",
  pending: "warning",
  failed: "error",
  expired: "neutral",
  refunded: "neutral",
};

const reportTone: Record<string, TagTone> = {
  open: "warning",
  in_progress: "neutral",
  closed: "success",
};

const disputeTone: Record<string, TagTone> = {
  open: "warning",
  in_review: "neutral",
  corrected: "success",
  confirmed: "success",
};

const alertIcon: Record<UserAlert["kind"], IconName> = {
  suspended: "securite",
  emailUnverified: "alerte",
  deletionScheduled: "fermer",
  paymentFailed: "mobile-money",
  pastDue: "mobile-money",
  endingSoon: "calendrier",
  canceling: "calendrier",
  reported: "securite",
};

export async function UserOverviewPanels({
  user,
  overview,
  check,
  back,
  canAct,
  twoFactorHref,
}: {
  user: { id: string; status: string };
  overview: UserOverview;
  check: { twoFactor: boolean; methods: string[]; lastSignIn: Date | null } | null;
  back: string;
  canAct: boolean;
  /** Opens the panel « Désactiver la double authentification ». */
  twoFactorHref: string;
}) {
  const [t, tr, td] = await Promise.all([
    getTranslations("admin"),
    getTranslations("report.reason"),
    getTranslations("ai.dispute"),
  ]);
  const o = (key: string, values?: Record<string, string | number | Date>) =>
    t(`users.overview.${key}` as "users.overview.back", values as never);
  const { plan, subscription, payments, activity, counts, complaints, reportsAbout, alerts } =
    overview;
  const deleted = user.status === "deleted";

  const alertText = (alert: UserAlert) => {
    switch (alert.kind) {
      case "suspended":
        return alert.reason
          ? o("alert.suspendedReason", { reason: alert.reason })
          : o("alert.suspended");
      case "deletionScheduled":
      case "paymentFailed":
      case "canceling":
        return o(`alert.${alert.kind}`, { date: formatShortDate(alert.date) });
      case "endingSoon":
        return o("alert.endingSoon", { date: formatShortDate(alert.date), days: alert.days });
      case "reported":
        return o("alert.reported", { count: alert.count });
      default:
        return o(`alert.${alert.kind}`);
    }
  };

  const source = subscription
    ? subscription.source === "license"
      ? o("source.license")
      : subscription.source === "admin"
        ? o("source.admin")
        : o("source.self")
    : null;
  const methods = check?.methods ?? [];
  const hasPassword = methods.includes("credential");

  return (
    <div className="flex flex-col gap-4">
      {!deleted && (
        <Section
          id="utilisateurs-alertes"
          icon="alerte"
          title={o("alerts")}
          aside={
            alerts.length > 0 ? (
              <Tag tone="warning">{o("alertCount", { count: alerts.length })}</Tag>
            ) : (
              <Tag tone="success">{o("noAlertTag")}</Tag>
            )
          }
        >
          {alerts.length === 0 ? (
            <Empty>{o("noAlert")}</Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <li
                  key={alert.kind}
                  className={cx(
                    "flex items-start gap-2.5 rounded-[14px] px-3 py-2.5 text-[12.5px] leading-[18px]",
                    alert.kind === "suspended" || alert.kind === "reported"
                      ? "bg-down-fond text-down-texte"
                      : "bg-ambre-fond text-ambre-texte",
                  )}
                >
                  <Icon name={alertIcon[alert.kind]} className="mt-px size-4 shrink-0" />
                  <span className="min-w-0 flex-1 break-words">{alertText(alert)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section
        id="utilisateurs-abonnement"
        icon="portefeuille"
        title={o("subscription")}
        aside={plan && <Tag tone={plan.priceCents ? "lime" : "neutral"}>{plan.planName}</Tag>}
      >
        {subscription ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="flex flex-1 flex-col gap-1 rounded-[18px] bg-creme px-4 py-3.5">
              <span className={adminLabel}>{o("endsOn")}</span>
              <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">
                {formatShortDate(subscription.currentPeriodEnd)}
              </span>
              <span className="text-[12.5px] leading-[18px] text-ardoise">
                {subscription.daysLeft === 0
                  ? o("endsToday")
                  : o("daysLeft", { count: subscription.daysLeft })}
              </span>
            </div>
            <dl className="flex flex-1 flex-col gap-2 text-[12.5px] leading-[17px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ardoise">{t("users.col.status")}</dt>
                <dd className="text-right font-medium">
                  {t(`subscriptions.status.${subscription.status}`)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ardoise">{o("since")}</dt>
                <dd className="text-right font-medium">
                  {formatShortDate(subscription.currentPeriodStart)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ardoise">{o("origin")}</dt>
                <dd className="text-right font-medium">{source}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ardoise">{o("after")}</dt>
                <dd className="text-right font-medium">
                  {subscription.cancelAtPeriodEnd
                    ? o("afterFree")
                    : subscription.pendingPlan
                      ? o("afterPlan", { plan: subscription.pendingPlan.name })
                      : subscription.source === "self"
                        ? o("afterRenew")
                        : o("afterFree")}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <Empty>{deleted ? o("noSubscriptionDeleted") : o("noSubscription")}</Empty>
        )}

        <div className="flex items-baseline justify-between gap-3 border-t border-brume pt-3.5">
          <h3 className={adminLabel}>{o("payments")}</h3>
          {overview.paidTotalCents > 0 && (
            <span className="text-[12px] text-ardoise">
              {o("paidTotal", { amount: formatUsd(overview.paidTotalCents) })}
            </span>
          )}
        </div>
        {payments.length === 0 ? (
          <Empty>{t("subscriptions.payments.empty")}</Empty>
        ) : (
          <ul aria-label={o("payments")} className="flex flex-col">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-brume py-2.5 text-[12.5px] leading-[17px] not-first:border-t"
              >
                <span className="w-[86px] shrink-0 text-ardoise">
                  {formatShortDate(payment.paidAt ?? payment.createdAt)}
                </span>
                <span className="min-w-0 flex-1 font-medium">
                  {payment.plan.name}
                  <span className="font-normal text-ardoise">
                    {" · "}
                    {t(`subscriptions.payments.method.${paymentMethodKey[payment.method]}`)}
                  </span>
                </span>
                <span className="font-semibold">
                  {o("amount", { amount: formatUsd(payment.amountCents) })}
                </span>
                <Tag tone={paymentTone[payment.status] ?? "neutral"}>
                  {t(`subscriptions.payments.status.${payment.status}`)}
                </Tag>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="utilisateurs-activite" icon="statistiques" title={o("activity")}>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["applications", counts.applicationCount],
              ["courses", counts.coursesInProgress],
              ["certificates", counts.certificateCount],
              ["posts", counts.postCount],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-0.5 rounded-[16px] bg-creme px-3.5 py-2.5">
              <dd className="text-[20px] leading-6 font-semibold">{value}</dd>
              <dt className="text-[11.5px] leading-4 text-ardoise">{o(`count.${key}`)}</dt>
            </div>
          ))}
        </dl>
        {activity.length === 0 ? (
          <Empty>{o("noActivity")}</Empty>
        ) : (
          <ol aria-label={o("recent")} className="flex flex-col">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 border-brume py-2.5 not-first:border-t"
              >
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-[9px] bg-creme text-sapin"
                >
                  <Icon name={activityIcon[item.kind]} className="size-3.5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12.5px] leading-[18px] font-medium break-words">
                    {item.label
                      ? o(`event.${item.kind}`, { label: item.label })
                      : o(`event.${item.kind}Plain`)}
                  </span>
                  <span className="text-[11px] leading-4 text-ardoise">
                    {formatDateTime(item.date)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section
        id="utilisateurs-plaintes"
        icon="securite"
        title={o("complaints")}
        aside={
          <Link
            href="/admin/signalements"
            className="text-[12px] font-semibold underline underline-offset-2"
          >
            {o("allReports")}
          </Link>
        }
      >
        <h3 className={adminLabel}>{o("filed")}</h3>
        {complaints.reports.length + complaints.disputes.length === 0 ? (
          <Empty>{o("noFiled")}</Empty>
        ) : (
          <ul className="flex flex-col">
            {complaints.reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-brume py-2.5 text-[12.5px] leading-[17px] not-first:border-t"
              >
                <span className="w-[86px] shrink-0 text-ardoise">
                  {formatShortDate(report.createdAt)}
                </span>
                <span className="min-w-0 flex-1">
                  {o("reportLine", {
                    type: t.has(`reports.type.${report.targetType}` as never)
                      ? t(`reports.type.${report.targetType}` as never)
                      : report.targetType,
                    reason: tr.has(report.reason as never)
                      ? tr(report.reason as never)
                      : report.reason,
                  })}
                </span>
                <Tag tone={reportTone[report.status] ?? "neutral"}>
                  {o(`reportStatus.${report.status}`)}
                </Tag>
              </li>
            ))}
            {complaints.disputes.map((dispute) => (
              <li
                key={dispute.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 border-brume py-2.5 text-[12.5px] leading-[17px] not-first:border-t"
              >
                <span className="w-[86px] shrink-0 text-ardoise">
                  {formatShortDate(dispute.createdAt)}
                </span>
                <span className="min-w-0 flex-1">
                  {o("disputeLine", {
                    reason: td.has(`what.${dispute.reason}` as never)
                      ? td(`what.${dispute.reason}` as never)
                      : dispute.reason,
                  })}
                </span>
                <Tag tone={disputeTone[dispute.status] ?? "neutral"}>
                  {td(
                    `status.${dispute.status === "in_review" ? "inReview" : dispute.status}` as never,
                  )}
                </Tag>
              </li>
            ))}
          </ul>
        )}
        <h3 className={cx(adminLabel, "border-t border-brume pt-3.5")}>{o("about")}</h3>
        {reportsAbout.length === 0 ? (
          <Empty>{o("noAbout")}</Empty>
        ) : (
          <ul className="flex flex-col">
            {reportsAbout.map((report) => (
              <li key={report.id} className="border-brume not-first:border-t">
                <Link
                  href={`/admin/signalements?${new URLSearchParams({
                    onglet:
                      report.status === "closed"
                        ? "clotures"
                        : report.status === "in_progress"
                          ? "en-cours"
                          : "ouverts",
                    id: report.id,
                  })}#signalement`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-[12.5px] leading-[17px] hover:underline"
                >
                  <span className="w-[86px] shrink-0 text-ardoise">
                    {formatShortDate(report.createdAt)}
                  </span>
                  <span className="min-w-0 flex-1">
                    {o("reportLine", {
                      type: t.has(`reports.type.${report.targetType}` as never)
                        ? t(`reports.type.${report.targetType}` as never)
                        : report.targetType,
                      reason: tr.has(report.reason as never)
                        ? tr(report.reason as never)
                        : report.reason,
                    })}
                  </span>
                  <Tag tone={reportTone[report.status] ?? "neutral"}>
                    {o(`reportStatus.${report.status}`)}
                  </Tag>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {!deleted && (
        <Section id="utilisateurs-connexion" icon="lock" title={o("signIn")}>
          <dl className="flex flex-col gap-2 text-[12.5px] leading-[17px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ardoise">{t("users.detail.methods")}</dt>
              <dd className="text-right font-medium">
                {methods.length
                  ? methods
                      .map((method) => {
                        const key = `users.method.${method === "magic-link" ? "magicLink" : method}`;
                        return t.has(key as never) ? t(key as never) : method;
                      })
                      .join(", ")
                  : t("users.detail.noMethod")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ardoise">{t("users.detail.twoFactor")}</dt>
              <dd className="text-right font-medium">
                {t(check?.twoFactor ? "users.detail.twoFactorOn" : "users.detail.twoFactorOff")}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ardoise">{t("users.detail.lastSignIn")}</dt>
              <dd className="text-right font-medium">
                {check?.lastSignIn ? formatDateTime(check.lastSignIn) : t("users.neverActive")}
              </dd>
            </div>
          </dl>
          <p className="flex items-start gap-2.5 rounded-[14px] bg-creme px-3 py-2.5 text-[12px] leading-[17px]">
            <Icon name="info" className="mt-px size-3.5 shrink-0" />
            {hasPassword ? o("passwordHelp") : o("passwordSocial")}
          </p>
          {canAct && (
            <div className="flex flex-wrap gap-2">
              {hasPassword && (
                <form action={sendResetLinkAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="back" value={back} />
                  <Button type="submit" size="sm">
                    <Icon name="send" className="size-4" />
                    {t("users.action.resetPassword")}
                  </Button>
                </form>
              )}
              {check?.twoFactor && (
                <ButtonLink href={twoFactorHref} scroll={false} variant="secondary" size="sm">
                  <Icon name="securite" className="size-4" />
                  {o("twoFactorReset")}
                </ButtonLink>
              )}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
