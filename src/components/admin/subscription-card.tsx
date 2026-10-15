import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SubscriptionStatus } from "@/generated/prisma/client";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  adminCard,
  adminLabel,
  adminTitle,
  DetailRow,
  ReasonField,
  SensitivePanel,
  Tag,
  type TagTone,
} from "@/components/admin/kit";
import { Alert, Button, ButtonLink, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { MANUAL_METHODS, paymentMethodKey } from "@/lib/payment-method";
import {
  cancelSubscriptionAction,
  changeSubscriptionPlanAction,
  extendSubscriptionAction,
  recordManualPaymentAction,
} from "@/server/actions/admin-billing";
import { db } from "@/server/db";
import {
  MAX_DAYS_AHEAD,
  plansFor,
  subscriptionTimeline,
  type TimelineEvent,
} from "@/server/services/admin-billing";

/**
 * Fiche d'abonnement (Admin v2, étape 5): who holds it, its life as a timeline (created, paid,
 * renewed, late, cancelled), and the four actions (extend, change plan, cancel, manual
 * payment), each a panel with a required reason (`?abonnement=<id>&action=`).
 */

const DAY = 86_400_000;
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

export const subscriptionTone: Record<SubscriptionStatus, TagTone> = {
  trialing: "neon",
  active: "success",
  past_due: "warning",
  canceled: "neutral",
  expired: "error",
  sponsored: "menthe",
};

const eventIcon: Record<TimelineEvent["kind"], IconName> = {
  created: "ajouter",
  paid: "mobile-money",
  renewed: "valider",
  failed: "alerte",
  refunded: "precedent",
  late: "horloge",
  canceled: "fermer",
  ended: "lock",
  admin: "doc",
};

const eventTone: Partial<Record<TimelineEvent["kind"], string>> = {
  paid: "bg-lime-clair",
  renewed: "bg-lime-clair",
  failed: "bg-down-fond text-corail-fonce",
  late: "bg-ambre-fond text-ambre-texte",
  canceled: "bg-brume",
  ended: "bg-brume",
};

export const SUBSCRIPTION_ACTIONS = ["prolonger", "forfait", "resilier", "paiement"] as const;

async function holderOf(subjectType: "user" | "organization", subjectId: string) {
  if (subjectType === "user") {
    const user = await db.user.findUnique({
      where: { id: subjectId },
      select: { name: true, email: true },
    });
    return {
      name: user?.name ?? "",
      detail: user?.email ?? null,
      href: `/admin/utilisateurs?fiche=${subjectId}`,
    };
  }
  const org = await db.organization.findUnique({
    where: { id: subjectId },
    select: { name: true },
  });
  return { name: org?.name ?? "", detail: null, href: `/admin/organisations?fiche=${subjectId}` };
}

export async function SubscriptionCard({
  id,
  action,
  writable,
  pageHref,
}: {
  id: string;
  action: string;
  writable: boolean;
  /** The list address (filters kept), without `abonnement`. */
  pageHref: string;
}) {
  const t = await getTranslations("admin");
  const now = new Date();
  const data = await subscriptionTimeline(db, id, now);
  if (!data) return <Alert tone="error" title={t("subscriptions.v2.notFound")} />;
  const { subscription, events } = data;
  const holder = await holderOf(subscription.subjectType, subscription.subjectId);
  const cardHref = `${pageHref}${pageHref.includes("?") ? "&" : "?"}abonnement=${subscription.id}`;
  const actionHref = (name: string) => `${cardHref}&action=${name}#abonnements-panneau`;
  const licence = subscription.source === "license";
  const over = subscription.status === "expired";
  const can = {
    prolonger: writable && !licence,
    forfait: writable && !licence && !over,
    resilier: writable && !licence && !over,
    paiement: writable && !licence,
  };

  const amount = (cents: number) => `${formatUsd(cents)} USD`;
  const eventText = (event: TimelineEvent) => {
    if (event.kind === "admin") {
      const key = `journal.action.${(event.action ?? "").replaceAll(".", "_")}`;
      return t.has(key as never) ? t(key as never) : (event.action ?? "");
    }
    return t(`subscriptions.v2.timeline.${event.kind}`, {
      amount: event.amountCents !== undefined ? amount(event.amountCents) : "",
    });
  };

  const actions: { name: (typeof SUBSCRIPTION_ACTIONS)[number]; icon: IconName; label: string }[] =
    [
      { name: "prolonger", icon: "calendrier", label: t("subscriptions.action.extend") },
      { name: "forfait", icon: "portefeuille", label: t("subscriptions.action.changePlan") },
      { name: "resilier", icon: "fermer", label: t("subscriptions.action.cancel") },
      { name: "paiement", icon: "mobile-money", label: t("subscriptions.action.markPaid") },
    ];

  const panel = can[action as keyof typeof can] ? (
    <SubscriptionPanel
      action={action}
      subscription={subscription}
      cardHref={cardHref}
      holder={holder.name}
    />
  ) : null;

  return (
    <div id="abonnements-fiche" className="flex scroll-mt-4 flex-col gap-4">
      <section
        aria-labelledby="abonnements-fiche-titre"
        className={cx(adminCard, "flex flex-col gap-4")}
      >
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className={adminLabel}>{t("subscriptions.v2.card")}</p>
            <h2 id="abonnements-fiche-titre" className={adminTitle}>
              <Link href={holder.href} className="hover:underline">
                {holder.name || t("journal.deletedActor")}
              </Link>
            </h2>
            {holder.detail && <p className="text-[12px] text-ardoise">{holder.detail}</p>}
          </div>
          <Tag tone={subscriptionTone[subscription.status]}>
            {t(`subscriptions.status.${subscription.status}`)}
          </Tag>
          <Link
            href={pageHref}
            scroll={false}
            aria-label={t("sensitive.close")}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
          >
            <Icon name="fermer" className="size-4" />
          </Link>
        </div>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <DetailRow label={t("subscriptions.col.plan")}>{subscription.plan.name}</DetailRow>
          <DetailRow label={t("subscriptions.v2.period")}>
            {t("subscriptions.v2.periodValue", {
              start: formatShortDate(subscription.currentPeriodStart),
              end: formatShortDate(subscription.currentPeriodEnd),
            })}
          </DetailRow>
          <DetailRow label={t("subscriptions.v2.source")}>
            {t(`subscriptions.v2.sourceValue.${subscription.source}`)}
          </DetailRow>
          {subscription.pendingPlan && (
            <DetailRow label={t("subscriptions.v2.next")}>
              {subscription.pendingPlan.name}
            </DetailRow>
          )}
        </dl>

        <div className="flex flex-col gap-2">
          <h3 className="text-[14px] font-semibold">{t("subscriptions.v2.timeline.title")}</h3>
          <ol className="flex flex-col gap-0 lg:flex-row lg:flex-wrap lg:gap-y-3">
            {events.map((event, index) => (
              <li
                key={`${event.kind}-${index}`}
                className="relative flex gap-3 pb-3 last:pb-0 lg:w-[168px] lg:flex-col lg:gap-1.5 lg:pr-3 lg:pb-0"
              >
                {index < events.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-8 bottom-0 left-[15px] w-px bg-brume lg:top-[15px] lg:right-0 lg:bottom-auto lg:left-8 lg:h-px lg:w-auto"
                  />
                )}
                <span
                  aria-hidden
                  className={cx(
                    "relative grid size-8 shrink-0 place-items-center rounded-full bg-creme text-sapin",
                    eventTone[event.kind],
                  )}
                >
                  <Icon name={eventIcon[event.kind]} className="size-3.5" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[12.5px] leading-[17px] font-semibold">
                    {eventText(event)}
                  </span>
                  <time
                    dateTime={event.date.toISOString()}
                    className="text-[11.5px] leading-4 text-ardoise"
                  >
                    {formatShortDate(event.date)}
                  </time>
                  {event.actor && (
                    <span className="text-[11.5px] leading-4 text-ardoise">{event.actor}</span>
                  )}
                  {event.reason && (
                    <span className="text-[11.5px] leading-4 break-words">
                      {t("journal.reasonLabel", { reason: event.reason })}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {licence ? (
          <p className="rounded-[12px] bg-creme px-3 py-2.5 text-[12px]">
            {t("subscriptions.v2.licence")}
          </p>
        ) : writable ? (
          <ul className="flex flex-wrap gap-2">
            {actions
              .filter((item) => can[item.name])
              .map((item) => (
                <li key={item.name}>
                  <Link
                    href={actionHref(item.name)}
                    scroll={false}
                    aria-current={action === item.name ? "true" : undefined}
                    className={cx(
                      "inline-flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[12.5px] font-semibold ring-[1.5px] ring-inset",
                      action === item.name
                        ? "bg-sapin text-blanc ring-sapin"
                        : "bg-blanc ring-brume hover:bg-creme",
                    )}
                  >
                    <Icon name={item.icon} aria-hidden className="size-3.5" />
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        ) : null}
      </section>
      {panel && (
        <div id="abonnements-panneau" className="scroll-mt-4">
          {panel}
        </div>
      )}
    </div>
  );
}

async function SubscriptionPanel({
  action,
  subscription,
  cardHref,
  holder,
}: {
  action: string;
  subscription: NonNullable<Awaited<ReturnType<typeof subscriptionTimeline>>>["subscription"];
  cardHref: string;
  holder: string;
}) {
  const [t, tc] = await Promise.all([getTranslations("admin"), getTranslations("common")]);
  const now = new Date();
  const back = `${cardHref}&action=${action}`;
  const hidden = (
    <>
      <input type="hidden" name="subscription" value={subscription.id} />
      <input type="hidden" name="back" value={back} />
    </>
  );
  const cancel = (
    <ButtonLink href={cardHref} scroll={false} variant="tertiary">
      {tc("cancel")}
    </ButtonLink>
  );
  const max = isoDay(new Date(now.getTime() + MAX_DAYS_AHEAD * DAY));
  const whenField = (id: string, labels: { now: string; term: string }) => (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-[13px] font-semibold">{t("subscriptions.v2.when.label")}</legend>
      {(["term", "now"] as const).map((value) => (
        <label key={value} className="flex items-start gap-2.5 text-[13px] leading-5">
          <input
            type="radio"
            name="when"
            value={value}
            defaultChecked={value === "term"}
            required
            id={`${id}-${value}`}
            className="mt-0.5 size-4 accent-sapin"
          />
          {labels[value]}
        </label>
      ))}
    </fieldset>
  );

  if (action === "prolonger") {
    const from = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
    return (
      <SensitivePanel
        title={t("subscriptions.action.extend")}
        text={t("subscriptions.v2.extend.confirm", {
          holder,
          date: formatShortDate(subscription.currentPeriodEnd),
        })}
        closeHref={cardHref}
        icon="calendrier"
        tone="neutral"
      >
        <form action={extendSubscriptionAction} className="flex flex-col gap-3.5">
          {hidden}
          <TextField
            id="abonnements-extend-until"
            name="until"
            type="date"
            required
            label={t("subscriptions.v2.extend.until")}
            min={isoDay(new Date(from.getTime() + DAY))}
            max={max}
            defaultValue={isoDay(new Date(from.getTime() + 30 * DAY))}
          />
          <ReasonField id="abonnements-extend-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit">{t("subscriptions.action.extend")}</Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }

  if (action === "forfait") {
    const plans = await plansFor(db, subscription);
    return (
      <SensitivePanel
        title={t("subscriptions.action.changePlan")}
        text={t("subscriptions.v2.change.confirm", { holder, plan: subscription.plan.name })}
        closeHref={cardHref}
        icon="portefeuille"
        tone="neutral"
      >
        {plans.length === 0 ? (
          <Alert tone="info" title={t("subscriptions.v2.change.none")} />
        ) : (
          <form action={changeSubscriptionPlanAction} className="flex flex-col gap-3.5">
            {hidden}
            <Select
              id="abonnements-change-plan"
              name="plan"
              required
              label={t("subscriptions.v2.change.plan")}
              options={plans.map((plan) => ({
                value: plan.code,
                label:
                  plan.priceCents === null
                    ? `${plan.name} · ${t("plans.status.quote")}`
                    : `${plan.name} · ${formatUsd(plan.priceCents)} USD`,
              }))}
            />
            {whenField("abonnements-change-when", {
              term: t("subscriptions.v2.change.term", {
                date: formatShortDate(subscription.currentPeriodEnd),
              }),
              now: t("subscriptions.v2.change.now"),
            })}
            <ReasonField id="abonnements-change-reason" />
            <div className="flex flex-wrap justify-end gap-2">
              {cancel}
              <Button type="submit">{t("subscriptions.action.changePlan")}</Button>
            </div>
          </form>
        )}
      </SensitivePanel>
    );
  }

  if (action === "resilier") {
    const termPossible = subscription.status !== "canceled" && subscription.status !== "past_due";
    return (
      <SensitivePanel
        title={t("subscriptions.action.cancel")}
        text={t("subscriptions.v2.cancel.confirm", { holder, plan: subscription.plan.name })}
        closeHref={cardHref}
      >
        <form action={cancelSubscriptionAction} className="flex flex-col gap-3.5">
          {hidden}
          {termPossible ? (
            whenField("abonnements-cancel-when", {
              term: t("subscriptions.v2.cancel.term", {
                date: formatShortDate(subscription.currentPeriodEnd),
              }),
              now: t("subscriptions.v2.cancel.now"),
            })
          ) : (
            <>
              <input type="hidden" name="when" value="now" />
              <p className="text-[13px]">{t("subscriptions.v2.cancel.now")}</p>
            </>
          )}
          <ReasonField id="abonnements-cancel-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit" variant="danger">
              {t("subscriptions.action.cancel")}
            </Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }

  if (action === "paiement") {
    const plans = await plansFor(db, { ...subscription, planId: "" });
    const current = plans.find((plan) => plan.id === subscription.planId);
    return (
      <SensitivePanel
        title={t("subscriptions.action.markPaid")}
        text={t("subscriptions.v2.manual.confirm", { holder })}
        closeHref={cardHref}
        icon="mobile-money"
        tone="neutral"
      >
        <form action={recordManualPaymentAction} className="flex flex-col gap-3.5">
          {hidden}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Select
              id="abonnements-manual-plan"
              name="plan"
              required
              label={t("subscriptions.col.plan")}
              defaultValue={current?.code}
              options={plans.map((plan) => ({ value: plan.code, label: plan.name }))}
            />
            <Select
              id="abonnements-manual-method"
              name="method"
              required
              label={t("subscriptions.col.method")}
              options={MANUAL_METHODS.map((method) => ({
                value: method,
                label: t(`subscriptions.payments.method.${paymentMethodKey[method]}`),
              }))}
            />
            <TextField
              id="abonnements-manual-amount"
              name="amount"
              required
              inputMode="decimal"
              pattern="\d+([.,]\d{1,2})?"
              label={t("subscriptions.v2.manual.amount")}
              hint={t("subscriptions.v2.manual.amountHint")}
              defaultValue={current?.priceCents ? (current.priceCents / 100).toFixed(2) : undefined}
            />
            <TextField
              id="abonnements-manual-months"
              name="months"
              type="number"
              required
              min={1}
              max={24}
              defaultValue="1"
              label={t("subscriptions.v2.manual.months")}
            />
          </div>
          <TextField
            id="abonnements-manual-reference"
            name="reference"
            required
            minLength={3}
            maxLength={80}
            label={t("subscriptions.v2.manual.reference")}
            hint={t("subscriptions.v2.manual.referenceHint")}
          />
          <ReasonField id="abonnements-manual-reason" />
          <div className="flex flex-wrap justify-end gap-2">
            {cancel}
            <Button type="submit">{t("subscriptions.v2.manual.submit")}</Button>
          </div>
        </form>
      </SensitivePanel>
    );
  }
  return null;
}
