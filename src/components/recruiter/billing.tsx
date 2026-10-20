import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { OrbiLine } from "@/components/recruiter/offers";
import { OperatorTile } from "@/components/talent/billing/operator";
import { PlanPicker, type PlanChoice } from "@/components/talent/billing/plan-picker";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { dynamic, numbered } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { AI_CREDITS_KEY } from "@/server/ai";
import {
  cancelSubscription,
  downgradeSubscription,
  resumeSubscription,
} from "@/server/actions/billing";
import { db } from "@/server/db";
import { can, parseLimit, resolvePlan, usage, type Subject } from "@/server/entitlements";
import { effectiveStatus, GRACE_DAYS } from "@/server/entitlements/periods";
import { ownedOrganization } from "@/server/services/accounts";
import { activeJobCount, type HireContext } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";
import { liveSubscription, localMask } from "@/server/services/subscriptions";

const DAY = 86_400_000;
/** The e-mail reminder before the end of a paid period (`pnpm jobs:billing`). */
const REMINDER_DAYS = 7;
const FAMILIES = ["rh", "company"] as const;

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Who may pay for the organization: its owner, when it is the organization they own
 * (`billingSubject` pays for the owned organization). The others read the page.
 */
async function payer(ctx: HireContext, userId: string) {
  if (ctx.role !== "org_owner") return false;
  const owned = await ownedOrganization(db, userId);
  return owned?.id === ctx.organizationId;
}

/** Figures of the organization against its plan: seats, active offers, Orbi credits. */
async function orgQuotas(subject: Subject, organizationId: string, now: Date) {
  const [seats, jobs, jobsMax, credits, cv, scorecards] = await Promise.all([
    seatUsage(db, organizationId, now),
    activeJobCount(db, organizationId),
    resolvePlan(db, subject, now).then((plan) => parseLimit(plan?.values["jobs.active.max"])),
    usage(db, subject, AI_CREDITS_KEY, now),
    can(db, subject, "hire.cv_analysis"),
    can(db, subject, "hire.scorecards"),
  ]);
  return { seats, jobs, jobsMax, credits, cv, scorecards };
}

/**
 * Abonnement of the recruiter space (planche r3plus `ABO_R`): the organization's plan with its
 * price and the days left, the seats, offers and Orbi credits of the plan, an Orbi line when a
 * limit is reached, the dates to come (paid, reminder, end of the prepaid period and back to the
 * free plan), then changing plan, the way of paying and the invoices. Prepaid: nothing is taken
 * automatically. Rights and limits come from the entitlements, never from a plan's name.
 */
export async function RecruiterBilling({
  ctx,
  userId,
  params,
}: {
  ctx: HireContext;
  userId: string;
  params: Params;
}) {
  const t = await getTranslations();
  const tr = await getTranslations("rhBilling");
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const subject: Subject = { type: "organization", id: ctx.organizationId };
  const where = { subjectType: subject.type, subjectId: subject.id };
  const [plan, current, quotas, invoices, payments, organization, canPay, plans] =
    await Promise.all([
      resolvePlan(db, subject, now),
      liveSubscription(db, subject, now),
      orgQuotas(subject, ctx.organizationId, now),
      db.invoice.count({ where }),
      db.payment.findMany({
        where: { ...where, status: "succeeded" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          method: true,
          operator: true,
          msisdnMasked: true,
          amountCents: true,
          createdAt: true,
        },
      }),
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { name: true },
      }),
      payer(ctx, userId),
      db.plan.findMany({
        where: { family: { in: [...FAMILIES] }, active: true, isPublic: true },
        orderBy: { sortOrder: "asc" },
        include: { entitlements: true },
      }),
    ]);
  if (!plan) return null;
  const lastPaid = payments[0] ?? null;
  const status = current ? effectiveStatus(current, now) : null;
  const canceled = !!current && (status === "canceled" || current.cancelAtPeriodEnd);
  const end = current?.currentPeriodEnd ?? null;
  const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY)) : 0;
  const periodDays = current
    ? Math.max(
        1,
        Math.round(
          (current.currentPeriodEnd.getTime() - current.currentPeriodStart.getTime()) / DAY,
        ),
      )
    : 30;
  const family = plans.find((item) => item.id === plan.planId)?.family ?? "rh";
  const freePlan = plans.find((item) => item.family === family && (item.priceCents ?? 0) === 0);
  const opName = (code: string | null) =>
    code && d.has(`checkout.mm.operators.${code}`) ? d(`checkout.mm.operators.${code}`) : "";
  const date = (value: Date) => format.dateTime(value, { day: "numeric", month: "long" });
  const short = (value: Date) => format.dateTime(value, { day: "numeric", month: "short" });
  const price = plan.priceCents ?? 0;
  const renewHref = current
    ? `/app/abonnement/payer?forfait=${current.pendingPlan?.code ?? current.plan.code}`
    : null;
  const others = plans
    .filter((item) => item.family === family && item.id !== plan.planId && item.isPurchasable)
    .map((item) => item.name);
  // The limit reached first, and the cheapest plan of the same family that goes beyond it.
  const { seats, jobs, jobsMax, credits } = quotas;
  const full =
    seats.max >= 0 && seats.used >= seats.max
      ? ("seats" as const)
      : jobsMax >= 0 && jobs >= jobsMax
        ? ("jobs" as const)
        : null;
  const bigger = full
    ? plans
        .filter((item) => FAMILIES.includes(item.family as "rh") && item.isPurchasable)
        .filter((item) => {
          const values = Object.fromEntries(item.entitlements.map((row) => [row.key, row.value]));
          const value = parseLimit(values[full === "seats" ? "org.seats" : "jobs.active.max"]);
          const now_ = full === "seats" ? seats.max : jobsMax;
          return value < 0 || value > now_;
        })
        .sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0))[0]
    : undefined;
  const method = lastPaid
    ? lastPaid.method === "mobile_money"
      ? t("abonnement.method.mobileMoney", {
          operator: opName(lastPaid.operator),
          number: localMask(lastPaid.msisdnMasked ?? ""),
        })
      : lastPaid.method === "card"
        ? t("abonnement.method.card")
        : t("abonnement.method.other")
    : null;
  const quota = (name: string, used: number, max: number, key: string) => (
    <li key={key} className="t-quota">
      <div className="t-l">
        <b>{name}</b>
        <span>
          {max < 0
            ? tr("quota.unlimited", { used })
            : max === 0
              ? t("abonnement.quota.none")
              : tr("quota.of", { used, max })}
        </span>
      </div>
      {max > 0 && (
        <span
          role="progressbar"
          aria-label={tr("quota.aria", { name, used, max })}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={Math.min(used, max)}
          className="t-barre"
        >
          <i style={{ width: `${Math.min(100, Math.round((used / max) * 100))}%` }} />
        </span>
      )}
    </li>
  );
  const reminder = end ? new Date(end.getTime() - REMINDER_DAYS * DAY) : null;

  return (
    <div className="t-flux">
      <FlowHead back="/app/hire/compte" backLabel={tr("back")} title={t("abonnement.title")} />
      {one(params.resiliation) && <Notice tone="ok">{t("abonnement.notice.resiliation")}</Notice>}
      {one(params.reactivation) && <Notice tone="ok">{t("abonnement.notice.reactivation")}</Notice>}
      {one(params.changement) && <Notice tone="ok">{t("abonnement.notice.changement")}</Notice>}
      {status === "past_due" && end && (
        <Notice tone="err">
          {t("abonnement.current.pastDue", {
            date: date(new Date(end.getTime() + GRACE_DAYS * DAY)),
          })}
        </Notice>
      )}

      <section className="t-r5-hero" aria-labelledby="r5-abo-plan">
        <div className="t-t">
          <small>{t("abonnement.current.label")}</small>
          <b id="r5-abo-plan">{plan.planName}</b>
          <span>
            {price > 0
              ? tr("hero.price", { price: formatUsd(price), org: organization.name })
              : tr("hero.free", { org: organization.name })}
          </span>
          <span>
            {!current || !end
              ? t("abonnement.current.freeText")
              : status === "trialing"
                ? t("abonnement.current.trialUntil", { date: date(end) })
                : canceled
                  ? t("abonnement.current.canceledUntil", { date: date(end) })
                  : t("abonnement.current.paidUntil", { date: date(end) })}
          </span>
          {current?.pendingPlan && end && (
            <span>
              {t("abonnement.current.scheduled", {
                plan: current.pendingPlan.name,
                date: date(end),
              })}
            </span>
          )}
        </div>
        {current && end && (
          <span
            className="t-r5-jr"
            style={{ "--p": Math.round((daysLeft / periodDays) * 100) } as React.CSSProperties}
          >
            <i>
              <b>{daysLeft}</b>
              {tr("hero.days", { count: daysLeft })}
            </i>
          </span>
        )}
      </section>
      {current?.pendingPlan && canPay && (
        <form action={downgradeSubscription}>
          <input type="hidden" name="family" value={family} />
          <input type="hidden" name="plan" value="" />
          <button type="submit" className="t-bt t-txt t-s t-press">
            {t("abonnement.current.scheduledCancel")}
          </button>
        </form>
      )}

      <ul aria-label={t("abonnement.quotas.label")} className="t-verre t-quotas">
        {quota(tr("quota.seats"), seats.used, seats.max, "seats")}
        {quota(tr("quota.jobs"), jobs, jobsMax, "jobs")}
        {quota(tr("quota.credits"), credits.used, credits.limit, "credits")}
        <li className="t-quota">
          <div className="t-l">
            <b>{tr("quota.cv")}</b>
            <span>{quotas.cv ? tr("included") : tr("notIncluded")}</span>
          </div>
        </li>
        <li className="t-quota">
          <div className="t-l">
            <b>{tr("quota.scorecards")}</b>
            <span>{quotas.scorecards ? tr("included") : tr("notIncluded")}</span>
          </div>
        </li>
      </ul>

      {full && (
        <OrbiLine
          action={
            <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
              {tr("see")}
            </Link>
          }
        >
          {bigger
            ? tr.rich(`full.${full}`, { plan: bigger.name, b: (chunks) => <b>{chunks}</b> })
            : tr(`fullNoPlan.${full}`)}
        </OrbiLine>
      )}

      {current && end && (
        <section aria-labelledby="r5-abo-ech" className="t-flux t-serre">
          <h2 id="r5-abo-ech" className="t-ck-t">
            {tr("dates.title")}
          </h2>
          <ol className="t-verre t-r5-tl">
            {lastPaid && (
              <li className="t-ok">
                <i aria-hidden />
                <div>
                  <b>{tr("dates.paid", { amount: formatUsd(lastPaid.amountCents) })}</b>
                  <span>
                    {[
                      short(lastPaid.createdAt),
                      lastPaid.method === "mobile_money" ? opName(lastPaid.operator) : method,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </li>
            )}
            {reminder && reminder > now && !canceled && price > 0 && (
              <li className="t-at">
                <i aria-hidden />
                <div>
                  <b>{tr("dates.reminder")}</b>
                  <span>
                    {tr("dates.reminderLine", { date: short(reminder), days: REMINDER_DAYS })}
                  </span>
                </div>
              </li>
            )}
            <li>
              <i aria-hidden />
              <div>
                <b>{tr("dates.end")}</b>
                <span>
                  {current.pendingPlan
                    ? tr("dates.endNext", { date: short(end), plan: current.pendingPlan.name })
                    : freePlan
                      ? tr("dates.endFree", { date: short(end), plan: freePlan.name })
                      : short(end)}
                </span>
              </div>
            </li>
          </ol>
        </section>
      )}

      <ul className="t-verre t-liste t-lignes" aria-label={t("abonnement.title")}>
        <li>
          <Link href="/app/abonnement/formules" className="t-li t-press">
            <span className="t-cases t-c2" aria-hidden>
              <TalentIcon name="progression" size="s" />
            </span>
            <span className="t-t">
              <b>{t("abonnement.change.title")}</b>
              <span>{others.join(", ")}</span>
            </span>
            <TalentIcon name="suivant" />
          </Link>
        </li>
        {renewHref && canPay && (
          <li>
            <Link href={renewHref} className="t-li t-press">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="horloge" size="s" />
              </span>
              <span className="t-t">
                <b>{tr("extend")}</b>
                <span>{tr("extendLine")}</span>
              </span>
              <TalentIcon name="suivant" />
            </Link>
          </li>
        )}
        <li className="t-li">
          {lastPaid?.method === "mobile_money" && lastPaid.operator ? (
            <span className="t-cases" aria-hidden>
              <OperatorTile code={lastPaid.operator} name={opName(lastPaid.operator)} />
            </span>
          ) : (
            <span className="t-cases t-c1" aria-hidden>
              <TalentIcon name="portefeuille" size="s" />
            </span>
          )}
          <span className="t-t">
            <b>{t("abonnement.method.title")}</b>
            <span>{method ?? t("abonnement.method.none")}</span>
          </span>
        </li>
        <li>
          <Link href="/app/abonnement/factures" className="t-li t-press">
            <span className="t-cases" aria-hidden>
              <TalentIcon name="document" size="s" />
            </span>
            <span className="t-t">
              <b>{t("abonnement.invoices.title")}</b>
              <span>{tr("invoices", { org: organization.name, count: invoices })}</span>
            </span>
            <TalentIcon name="suivant" />
          </Link>
        </li>
      </ul>

      {!canPay && (
        <p className="t-gar">
          <TalentIcon name="cadenas" size="s" />
          <span>{tr("ownerOnly")}</span>
        </p>
      )}
      <p className="t-gar">
        <TalentIcon name="horloge" size="s" />
        <span>{tr("prepaid", { plan: freePlan?.name ?? "" })}</span>
      </p>

      {canPay &&
        current &&
        price > 0 &&
        freePlan &&
        (canceled ? (
          <form action={resumeSubscription} className="t-fin-formule">
            <input type="hidden" name="family" value={family} />
            <input type="hidden" name="back" value="/app/abonnement" />
            <button type="submit" className="t-bt t-txt t-s t-press">
              {t("formules.resume.cta")}
            </button>
          </form>
        ) : (
          <form action={cancelSubscription} className="t-fin-formule">
            <input type="hidden" name="family" value={family} />
            <input type="hidden" name="back" value="/app/abonnement" />
            <button type="submit" className="t-bt t-txt t-s t-press">
              {t("formules.free.cta", { plan: freePlan.name })}
            </button>
          </form>
        ))}
    </div>
  );
}

const compareRows = [
  { key: "org.seats", kind: "limit" },
  { key: "jobs.active.max", kind: "limit" },
  { key: AI_CREDITS_KEY, kind: "limit" },
  { key: "hire.cv_analysis", kind: "flag" },
  { key: "hire.scorecards", kind: "flag" },
] as const;

/**
 * Formules RH (planche r3plus `FORMS_R`): an Orbi line on the plan that fits the team and the
 * offers of today, the plans of the organization's family with their button, the comparison of
 * seats, offers, credits and tools, and the Companies plans for more. Plans, prices and rights
 * come from the database; the plan that fits is chosen by its limits, never by its name.
 */
export async function RecruiterPlans({
  ctx,
  userId,
  params,
}: {
  ctx: HireContext;
  userId: string;
  params: Params;
}) {
  const t = await getTranslations();
  const tr = await getTranslations("rhBilling");
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const subject: Subject = { type: "organization", id: ctx.organizationId };
  const [plan, current, quotas, plans, canPay] = await Promise.all([
    resolvePlan(db, subject, now),
    liveSubscription(db, subject, now),
    orgQuotas(subject, ctx.organizationId, now),
    db.plan.findMany({
      where: { family: { in: [...FAMILIES] }, active: true, isPublic: true, interval: "month" },
      orderBy: { sortOrder: "asc" },
      include: { entitlements: true },
    }),
    payer(ctx, userId),
  ]);
  const currentPlan = plans.find((item) => item.id === plan?.planId);
  const family = currentPlan?.family ?? "rh";
  const shown = plans.filter((item) => item.family === family);
  const valuesOf = (item: (typeof plans)[number]) =>
    Object.fromEntries(item.entitlements.map((row) => [row.key, row.value]));
  const status = current ? effectiveStatus(current, now) : null;
  const paid = !!current && status !== "trialing" && status !== "sponsored";
  const currentPrice = plan?.priceCents ?? 0;
  const end = current
    ? format.dateTime(current.currentPeriodEnd, { day: "numeric", month: "long" })
    : "";
  const limitText = (value: number, key: string) =>
    value < 0
      ? tr("unlimited")
      : tr(
          `compare.value.${key === "org.seats" ? "seats" : key === "jobs.active.max" ? "jobs" : "credits"}`,
          { count: value },
        );

  // The cheapest plan whose seats and offers hold today's team and offers.
  const fits = shown
    .filter((item) => {
      const values = valuesOf(item);
      const seats = parseLimit(values["org.seats"]);
      const jobs = parseLimit(values["jobs.active.max"]);
      return (seats < 0 || seats >= quotas.seats.members) && (jobs < 0 || jobs >= quotas.jobs);
    })
    .sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0))[0];

  const choices: PlanChoice[] = shown.map((item) => {
    const values = valuesOf(item);
    const price = item.priceCents ?? 0;
    const seats = parseLimit(values["org.seats"]);
    const jobs = parseLimit(values["jobs.active.max"]);
    const credits = parseLimit(values[AI_CREDITS_KEY]);
    const isCurrent = item.id === plan?.planId;
    const action: PlanChoice["action"] = !canPay
      ? { kind: "none", label: isCurrent ? t("formules.cta.current") : tr("ownerOnlyShort") }
      : isCurrent && paid && !current?.pendingPlan
        ? {
            kind: "pay",
            label: t("formules.cta.renew", { plan: item.name }),
            href: `/app/abonnement/payer?forfait=${item.code}`,
          }
        : isCurrent
          ? { kind: "none", label: t("formules.cta.current") }
          : !item.isPurchasable
            ? { kind: "none", label: price === 0 ? tr("freeAtEnd") : t("paiement.unavailable") }
            : price < currentPrice && paid
              ? {
                  kind: "downgrade",
                  label: t("formules.cta.downgrade", { plan: item.name, date: end }),
                  note: t("formules.downgrade.note", { plan: item.name, date: end }),
                }
              : {
                  kind: "pay",
                  label: t("formules.cta.upgrade", { plan: item.name }),
                  href: `/app/abonnement/payer?forfait=${item.code}`,
                };
    return {
      code: item.code,
      name: item.name,
      price: t("abonnement.amount", { amount: formatUsd(price) }),
      per: t("formules.perMonth"),
      badge: isCurrent ? t("formules.yours") : item.recommended ? t("formules.recommended") : null,
      lines: [
        [limitText(seats, "org.seats"), limitText(jobs, "jobs.active.max")].join(", "),
        credits !== 0 ? limitText(credits, AI_CREDITS_KEY) : null,
        ...numbered(d, `${item.contentKey}.f`, {}).slice(0, 1),
      ].filter((line): line is string => Boolean(line)),
      current: isCurrent,
      action,
    };
  });
  const asked = choices.find((choice) => choice.code === params.formule);
  const next = choices.find(
    (choice) => (shown.find((item) => item.code === choice.code)?.priceCents ?? 0) > currentPrice,
  );
  const selected = (asked ?? next ?? choices[0])?.code ?? "";
  const companies = family === "rh" ? plans.filter((item) => item.family === "company") : [];
  const companiesFrom = companies.length
    ? Math.min(...companies.map((item) => item.priceCents ?? 0))
    : null;

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/abonnement"
        backLabel={tr("plansBack")}
        title={family === "rh" ? tr("plansTitle") : t("formules.title")}
      />
      {fits && (
        <OrbiLine>
          {tr.rich("fits", {
            members: quotas.seats.members,
            jobs: quotas.jobs,
            plan: fits.name,
            b: (chunks) => <b>{chunks}</b>,
          })}
        </OrbiLine>
      )}
      {choices.length === 0 ? (
        <p className="t-gar">{t("formules.empty")}</p>
      ) : (
        <PlanPicker
          plans={choices}
          initial={selected}
          label={t("formules.list.aria")}
          applyFree={tr("applyFree")}
          family={family}
        />
      )}

      <div className="t-verre t-r5-cmp">
        <table>
          <caption className="sr-only">{tr("compare.caption")}</caption>
          <thead>
            <tr>
              <td />
              {shown.map((item) => (
                <th key={item.id} scope="col" className={cx(item.code === selected && "t-on")}>
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.key}>
                <th scope="row">
                  {tr(`compare.${row.key.replaceAll(".", "_")}` as "compare.org_seats")}
                </th>
                {shown.map((item) => {
                  const raw = valuesOf(item)[row.key];
                  const on = item.code === selected;
                  if (row.kind === "flag") {
                    const yes = raw === "true";
                    return (
                      <td key={item.id} className={cx(on && "t-on")}>
                        <span aria-hidden>{yes ? "✓" : "—"}</span>
                        <span className="sr-only">{yes ? tr("included") : tr("notIncluded")}</span>
                      </td>
                    );
                  }
                  const value = parseLimit(raw);
                  return (
                    <td key={item.id} className={cx(on && "t-on")}>
                      {value < 0 ? "∞" : value === 0 ? "—" : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {companiesFrom !== null && (
        <p className="t-gar">
          <TalentIcon name="entreprise" size="s" />
          <span>{tr("companies", { price: formatUsd(companiesFrom) })}</span>
        </p>
      )}
    </div>
  );
}
