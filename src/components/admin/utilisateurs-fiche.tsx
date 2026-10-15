import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { adminLabel, Initials, Tag, type TagTone } from "@/components/admin/kit";
import { formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { paymentMethodKey } from "@/lib/payment-method";
import { setUserStatus } from "@/server/actions/admin";
import { resendVerificationAction, sendResetLinkAction } from "@/server/actions/admin-users";
import { db } from "@/server/db";
import { parseLimit, resolvePlan, usage } from "@/server/entitlements";
import { accountCheck, userState, type UserState } from "@/server/services/admin-users";

export { USER_STATES as statuses, userState } from "@/server/services/admin-users";

export const statusTone: Record<UserState, TagTone> = {
  active: "success",
  unverified: "warning",
  suspended: "error",
  deletionScheduled: "warning",
  deleted: "neutral",
};

/** The name shown for an account: « Compte supprimé » once anonymized. */
export function displayName(
  t: (key: "users.deletedName") => string,
  user: { name: string; status: string },
) {
  return user.status === "deleted" ? t("users.deletedName") : user.name;
}

/** Plan tag colour: free in Brume, partners in Menthe, organization plans in Néon, paid talent in Lime. */
export function planTone(plan: { priceCents: number | null; family: string } | null): TagTone {
  if (!plan || plan.priceCents === 0) return "neutral";
  if (plan.family === "partner") return "menthe";
  if (plan.family === "talent") return "lime";
  return "neon";
}

/** « Il y a 2 h », « Hier », « Il y a 3 j » (mockup 07-02). */
export function ago(date: Date, now: Date) {
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const format = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto", style: "short" });
  const text =
    Math.abs(seconds) < 3600
      ? format.format(Math.round(seconds / 60), "minute")
      : Math.abs(seconds) < 86_400
        ? format.format(Math.round(seconds / 3600), "hour")
        : format.format(Math.round(seconds / 86_400), "day");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Quotas measured for a person (same keys as the talent dashboard). */
const quotas = [
  { key: "ai.credits.monthly", label: "ai" },
  { key: "career.interview.text.monthly", label: "interviewText" },
  { key: "career.interview.voice.monthly", label: "interviewVoice" },
] as const;

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[12.5px] leading-[17px]">
      <dt className="text-ardoise">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-brume py-3.5">
      <h3 className={adminLabel}>{title}</h3>
      {children}
    </section>
  );
}

const actionLine =
  "flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] font-medium hover:underline";

function ActionLink({
  href,
  icon,
  danger,
  children,
}: {
  href: string;
  icon: IconName;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <li>
      <Link href={href} scroll={false} className={cx(actionLine, danger && "text-corail-fonce")}>
        <Icon name={icon} className="size-4 shrink-0" />
        {children}
      </Link>
    </li>
  );
}

/**
 * User card of /admin/utilisateurs (mockup 07-02, « Fiche utilisateur »): account, subscription,
 * organizations, quotas and activity counts. Never private messages, CVs or documents.
 */
export async function UserCard({
  user,
  now,
  closeHref,
  suspendHref,
  actionHref,
  back,
  canAct,
  className,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    country: string | null;
    platformRole: string;
    status: string;
    emailVerified: boolean;
    deletionScheduledAt: Date | null;
    createdAt: Date;
  };
  now: Date;
  closeHref: string;
  suspendHref: string;
  /** Link opening a panel of the page (`verifier`, `forfait`, `credits`, `supprimer`). */
  actionHref: (action: string) => string;
  back: string;
  canAct: boolean;
  className?: string;
}) {
  const [t, tc, tq] = await Promise.all([
    getTranslations("admin"),
    getTranslations("common"),
    getTranslations("quota.name"),
  ]);
  const subject = { type: "user" as const, id: user.id };
  const [plan, memberships, lastSession, profile, coursesInProgress, certificates, check] =
    await Promise.all([
      resolvePlan(db, subject, now),
      db.membership.findMany({
        where: { userId: user.id, status: "active" },
        select: { role: true, organization: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.session.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      db.talentProfile.findUnique({
        where: { userId: user.id },
        select: { _count: { select: { applications: true } } },
      }),
      db.enrollment.count({ where: { userId: user.id, completedAt: null } }),
      db.certificate.count({ where: { enrollment: { userId: user.id }, revokedAt: null } }),
      accountCheck(db, user.id),
    ]);
  const deleted = user.status === "deleted";
  const subscription = plan?.subscriptionId
    ? await db.subscription.findUnique({
        where: { id: plan.subscriptionId },
        select: {
          currentPeriodEnd: true,
          source: true,
          payments: {
            where: { status: { in: ["succeeded", "refunded"] } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { method: true },
          },
        },
      })
    : null;
  const gauges = plan
    ? await Promise.all(
        quotas
          .filter((row) => row.key in plan.values && parseLimit(plan.values[row.key]) !== 0)
          .map(async (row) => ({
            ...row,
            max: parseLimit(plan.values[row.key]),
            used: (await usage(db, subject, row.key, now)).used,
          })),
      )
    : [];
  const state = userState(user);
  const place = [
    user.city,
    user.country
      ? (new Intl.DisplayNames(["fr-FR"], { type: "region" }).of(user.country) ?? user.country)
      : null,
  ]
    .filter(Boolean)
    .join(", ");
  const roleList = [
    ...(user.platformRole === "user"
      ? []
      : [t(`platformRole.${user.platformRole}` as "platformRole.user")]),
    ...(profile ? [t("memberRole.talent")] : []),
    ...[...new Set(memberships.map((membership) => membership.role))].map((role) =>
      t(`memberRole.${role}`),
    ),
  ].join(", ");
  const payment = subscription?.payments[0];
  const method =
    subscription?.source === "license"
      ? t("subscriptions.status.sponsored")
      : subscription?.source === "admin"
        ? t("subscriptions.payments.method.manual")
        : payment
          ? t(`subscriptions.payments.method.${paymentMethodKey[payment.method]}`)
          : null;

  return (
    <aside
      id="utilisateurs-fiche"
      aria-labelledby="utilisateurs-fiche-title"
      className={cx(
        "jm-admin-fiche jm-admin-card flex scroll-mt-4 flex-col rounded-[24px] bg-blanc px-5 py-5 lg:w-[400px] lg:shrink-0 lg:px-[22px]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="utilisateurs-fiche-title"
          className="text-[18px] leading-6 font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
        >
          {t("users.detail.title")}
        </h2>
        <Link
          href={closeHref}
          scroll={false}
          aria-label={t("sensitive.close")}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
        >
          <Icon name="fermer" className="size-4" />
        </Link>
      </div>
      <div className="my-3.5 flex items-center gap-3">
        <Initials name={displayName(t, user)} size={52} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] leading-[22px] font-semibold">{displayName(t, user)}</span>
          {!deleted && (
            <span className="text-[11px] leading-[15px] break-words text-ardoise">
              {[user.email, place].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
        <Tag tone={statusTone[state]}>{t(`users.status.${state}`)}</Tag>
      </div>

      <Block title={t("users.detail.account")}>
        <dl className="flex flex-col gap-2">
          <Row label={t("users.detail.id")}>
            <code className="text-[11.5px]">{user.id}</code>
          </Row>
          <Row label={t("users.col.created")}>{formatShortDate(user.createdAt)}</Row>
          {roleList && <Row label={t("users.col.roles")}>{roleList}</Row>}
          <Row label={t("users.col.lastActive")}>
            {lastSession ? ago(lastSession.updatedAt, now) : t("users.neverActive")}
          </Row>
        </dl>
      </Block>

      {deleted && (
        <p className="mb-3.5 flex items-start gap-2.5 rounded-[14px] bg-brume px-3 py-2.5 text-[12px] leading-[17px]">
          <Icon name="info" className="mt-px size-3.5 shrink-0" />
          {t("users.deletedNote")}
        </p>
      )}

      {check && !deleted && (
        <Block title={t("users.detail.check")}>
          <dl className="flex flex-col gap-2">
            <Row label={t("users.detail.email")}>
              <span
                className={cx(
                  "inline-flex items-center gap-1.5",
                  !check.emailVerified && "text-ambre-texte",
                )}
              >
                <Icon
                  name={check.emailVerified ? "valider" : "alerte"}
                  className="size-3.5 shrink-0"
                />
                {t(
                  check.emailVerified
                    ? "users.detail.emailVerified"
                    : "users.detail.emailUnverified",
                )}
              </span>
            </Row>
            <Row label={t("users.detail.twoFactor")}>
              {t(check.twoFactor ? "users.detail.twoFactorOn" : "users.detail.twoFactorOff")}
            </Row>
            <Row label={t("users.detail.methods")}>
              {check.methods.length
                ? check.methods
                    .map((method) => {
                      const key = `users.method.${method === "magic-link" ? "magicLink" : method}`;
                      return t.has(key as never) ? t(key as never) : method;
                    })
                    .join(", ")
                : t("users.detail.noMethod")}
            </Row>
            <Row label={t("users.detail.lastSignIn")}>
              {check.lastSignIn ? ago(check.lastSignIn, now) : t("users.neverActive")}
            </Row>
          </dl>
        </Block>
      )}

      {plan && !deleted && (
        <Block title={t("users.detail.subscription")}>
          <dl className="flex flex-col gap-2">
            <Row label={t("users.col.plan")}>
              {plan.priceCents
                ? t("users.detail.planPrice", {
                    plan: plan.planName,
                    price: formatUsd(plan.priceCents),
                  })
                : plan.planName}
            </Row>
            <Row label={t("users.col.status")}>
              {subscription && plan.status !== "free"
                ? t("users.detail.until", {
                    status: t(`subscriptions.status.${plan.status}`),
                    date: formatShortDate(subscription.currentPeriodEnd),
                  })
                : `${tc("free")} · ${t("users.detail.noEnd")}`}
            </Row>
            {method && <Row label={t("users.detail.method")}>{method}</Row>}
          </dl>
        </Block>
      )}

      <Block title={t("users.detail.memberships")}>
        {memberships.length === 0 ? (
          <p className="text-[11px] leading-[15px] text-ardoise">
            {t("users.detail.noMembership")}
          </p>
        ) : (
          <dl className="flex flex-col gap-2">
            {memberships.map((membership) => (
              <Row key={membership.organization.name} label={membership.organization.name}>
                <code className="text-[11.5px]">{membership.role}</code>
              </Row>
            ))}
          </dl>
        )}
      </Block>

      <Block title={t("users.detail.quotas")}>
        {gauges.length === 0 ? (
          <p className="text-[11px] leading-[15px] text-ardoise">{t("users.detail.noQuota")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {gauges.map((gauge) => {
              const ratio = gauge.max < 0 ? 0 : Math.min(1, gauge.used / gauge.max);
              const name = tq(gauge.label);
              return (
                <div key={gauge.key} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-[12px] leading-[17px]">
                    <span>{name}</span>
                    <span className="font-semibold">
                      {gauge.max < 0
                        ? `${gauge.used} / ${t("plans.entitlements.value.unlimited")}`
                        : `${gauge.used} / ${gauge.max}`}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={name}
                    aria-valuemin={0}
                    aria-valuemax={gauge.max < 0 ? undefined : gauge.max}
                    aria-valuenow={gauge.used}
                    className="h-2 overflow-hidden rounded-pill bg-brume"
                  >
                    <i
                      className={cx(
                        "block h-full rounded-pill",
                        ratio >= 1 ? "bg-corail" : ratio >= 0.8 ? "bg-ambre" : "bg-feuille",
                      )}
                      style={{ width: `${Math.round(ratio * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Block>

      <Block title={t("users.detail.activity")}>
        <dl className="flex flex-col gap-2">
          <Row label={t("users.detail.applications")}>{profile?._count.applications ?? 0}</Row>
          <Row label={t("users.detail.coursesInProgress")}>{coursesInProgress}</Row>
          <Row label={t("users.detail.certificates")}>{certificates}</Row>
        </dl>
        {check && check.certificates.length > 0 && (
          <ul aria-label={t("users.detail.certificateList")} className="flex flex-col gap-1.5 pt-1">
            {check.certificates.map((certificate) => (
              <li
                key={certificate.id}
                className="flex items-center gap-2 text-[12px] leading-[17px]"
              >
                <Icon name="certificat" className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  {t("users.detail.certificateLine", {
                    course: certificate.course,
                    date: formatShortDate(certificate.issuedAt),
                  })}
                </span>
                {certificate.revoked && <Tag tone="error">{t("users.detail.revoked")}</Tag>}
              </li>
            ))}
          </ul>
        )}
      </Block>

      <p className="flex items-start gap-2.5 rounded-[14px] bg-creme px-3 py-2.5 text-[11px] leading-4">
        <Icon name="lock" className="mt-px size-3.5 shrink-0" />
        {t("users.detail.privateNote")}
      </p>

      {canAct && !deleted && (
        <nav aria-label={t("users.detail.actions")} className="mt-3.5">
          <ul className="flex flex-col gap-1.5">
            {check && !check.emailVerified && (
              <>
                <li>
                  <form action={resendVerificationAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="back" value={back} />
                    <button type="submit" className={actionLine}>
                      <Icon name="send" className="size-4 shrink-0" />
                      {t("users.action.resendVerification")}
                    </button>
                  </form>
                </li>
                <ActionLink href={actionHref("verifier")} icon="valider">
                  {t("users.action.verifyEmail.text")}
                </ActionLink>
              </>
            )}
            {check?.methods.includes("credential") && (
              <li>
                <form action={sendResetLinkAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="back" value={back} />
                  <button type="submit" className={actionLine}>
                    <Icon name="lock" className="size-4 shrink-0" />
                    {t("users.action.resetPassword")}
                  </button>
                </form>
              </li>
            )}
            <ActionLink href={actionHref("forfait")} icon="portefeuille">
              {t("users.action.grantPlan.text")}
            </ActionLink>
            <ActionLink href={actionHref("credits")} icon="intelligence">
              {t("users.action.credits.text")}
            </ActionLink>
            <li>
              <a
                href={`/admin/utilisateurs/donnees?id=${encodeURIComponent(user.id)}`}
                download
                className={actionLine}
              >
                <Icon name="telecharger" className="size-4 shrink-0" />
                {t("users.action.exportData")}
              </a>
            </li>
            <ActionLink href={`${back}#utilisateurs-roles`} icon="edit">
              {t("users.action.roles.text")}
            </ActionLink>
            {user.status === "suspended" ? (
              <li>
                <form action={setUserStatus}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="status" value="active" />
                  <button type="submit" className={actionLine}>
                    <Icon name="valider" className="size-4 shrink-0" />
                    {t("users.action.unsuspend")}
                  </button>
                </form>
              </li>
            ) : (
              <ActionLink href={suspendHref} icon="securite" danger>
                {t("users.action.suspend.text")}
              </ActionLink>
            )}
            <ActionLink href={actionHref("supprimer")} icon="fermer" danger>
              {t("users.action.delete.text")}
            </ActionLink>
          </ul>
        </nav>
      )}
    </aside>
  );
}
