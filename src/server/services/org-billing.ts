import type { PrismaClient } from "@/generated/prisma/client";
import { freePlan, parseLimit, resolvePlan, usage, type Subject } from "@/server/entitlements";
import { effectiveStatus, GRACE_DAYS } from "@/server/entitlements/periods";
import { activeJobCount, hirePermissions, HireError, type HireContext } from "./hire";
import { seatUsage } from "./organization";
import { liveSubscription, quoteCheckout, scheduleDowngrade } from "./subscriptions";

/**
 * Formule et facturation (étape 3, A4, capture 083): the organization's plan, what it uses this
 * month, the company plans to move to and the invoices. Owner and administrators only; every read
 * goes through their organization (golden rule n° 6). Plans are read from the database and
 * compared by price and entitlements, never by name (golden rule n° 2).
 */

const DAY = 86_400_000;

function administer(ctx: HireContext) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
}

const subjectOf = (ctx: HireContext): Subject => ({ type: "organization", id: ctx.organizationId });

/** The gauges of « Usage ce mois », in the order of the capture. */
export const USAGE_GAUGES = ["seats", "jobs", "search", "contact", "credits"] as const;
export type UsageGauge = (typeof USAGE_GAUGES)[number];

/** What a plan card offers: the plan in force, to buy at once, to schedule, or on quote. */
export type PlanAction = "current" | "upgrade" | "downgrade" | "scheduled" | "quote";

/** A plan's number for a card: the limit, the contract minimum (« et plus »), or nothing. */
function cardLimit(values: Record<string, string>, key: string, contractKey?: string) {
  const value = values[key];
  if (value === "contract" && contractKey) {
    const min = parseLimit(values[contractKey]);
    return min > 0 ? { count: min, more: true } : null;
  }
  const count = parseLimit(value);
  return value !== undefined && count !== 0 ? { count, more: false } : null;
}

export async function orgBillingScreen(db: PrismaClient, ctx: HireContext, now = new Date()) {
  administer(ctx);
  const subject = subjectOf(ctx);
  const where = { subjectType: subject.type, subjectId: subject.id };
  const [plan, current, free, seats, jobs, search, contact, credits, plans, invoices, lastPaid] =
    await Promise.all([
      resolvePlan(db, subject, now),
      liveSubscription(db, subject, now),
      freePlan(db, subject),
      seatUsage(db, ctx.organizationId, now),
      activeJobCount(db, ctx.organizationId),
      usage(db, subject, "hire.talent_search.monthly", now),
      usage(db, subject, "hire.contact_requests.monthly", now),
      usage(db, subject, "ai.credits.monthly", now),
      db.plan.findMany({
        where: { family: "company", active: true, isPublic: true },
        orderBy: { sortOrder: "asc" },
        include: { entitlements: true },
      }),
      db.invoice.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        take: 24,
        include: { payment: { select: { method: true, operator: true } } },
      }),
      db.payment.findFirst({
        where: { ...where, status: "succeeded" },
        orderBy: { createdAt: "desc" },
        select: { method: true, operator: true },
      }),
    ]);
  if (!plan) throw new HireError("notFound");

  const status = current ? effectiveStatus(current, now) : null;
  const paidPeriod = !!current && status !== "trialing" && status !== "sponsored";
  const end = current?.currentPeriodEnd ?? null;
  const currentPrice = plan.priceCents ?? 0;
  const pendingPlanId = current?.pendingPlanId ?? null;

  const cards = await Promise.all(
    plans.map(async (item) => {
      const values = Object.fromEntries(item.entitlements.map((e) => [e.key, e.value]));
      let action: PlanAction;
      let totalCents: number | null = null;
      let creditCents = 0;
      if (item.id === plan.planId) action = "current";
      else if (!item.isPurchasable || !item.priceCents) action = "quote";
      else if (pendingPlanId === item.id) action = "scheduled";
      else if (paidPeriod && end && end > now && item.priceCents < currentPrice)
        action = "downgrade";
      else {
        action = "upgrade";
        const quote = await quoteCheckout(db, subject, item.code, now);
        if (!quote || quote.kind === "downgrade") action = "quote";
        else {
          totalCents = quote.totalCents;
          creditCents = quote.creditCents;
        }
      }
      return {
        code: item.code,
        name: item.name,
        priceCents: item.priceCents,
        users: cardLimit(values, "org.seats", "org.seats.min"),
        jobs: cardLimit(values, "jobs.active.max"),
        action,
        totalCents,
        creditCents,
      };
    }),
  );

  // « Renouveler maintenant »: the plan in force, paid for the next period (prepaid).
  const renewal =
    plan.priceCents && (await quoteCheckout(db, subject, plan.planCode, now).catch(() => null));
  const gauge = (used: number, max: number) => ({ used, max });
  return {
    plan: {
      code: plan.planCode,
      name: plan.planName,
      priceCents: plan.priceCents,
      status: plan.status,
    },
    freePlanName: free?.name ?? "",
    /** End of the period in force (paid, trial or sponsored), none on the free plan. */
    until: end,
    /** End of the prepaid period, and the end of the grace days when it is over. */
    paidUntil: paidPeriod && end ? end : null,
    graceUntil: paidPeriod && end && end <= now ? new Date(end.getTime() + GRACE_DAYS * DAY) : null,
    canceled: !!current && (status === "canceled" || current.cancelAtPeriodEnd),
    paidWith: lastPaid,
    pendingPlan: current?.pendingPlan ? { name: current.pendingPlan.name } : null,
    renewal:
      renewal && renewal.kind === "renewal"
        ? { totalCents: renewal.totalCents, periodEnd: renewal.periodEnd }
        : null,
    gauges: {
      seats: gauge(seats.used, seats.max),
      jobs: gauge(jobs, parseLimit(plan.values["jobs.active.max"])),
      search: gauge(search.used, search.limit),
      contact: gauge(contact.used, contact.limit),
      credits: gauge(credits.used, credits.limit),
    } satisfies Record<UsageGauge, { used: number; max: number }>,
    plans: cards,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      issuedAt: invoice.issuedAt,
      amountCents: invoice.amountCents,
      method: invoice.payment.method,
      operator: invoice.payment.operator,
    })),
  };
}

export type OrgBillingScreen = Awaited<ReturnType<typeof orgBillingScreen>>;

/**
 * « Passer à … » towards a cheaper plan: it takes over at the end of the paid period (partie 05
 * § 6). `null` keeps the plan in force (the change is cancelled). Written in the audit log.
 */
export async function scheduleOrgDowngrade(
  db: PrismaClient,
  ctx: HireContext,
  planCode: string | null,
  now = new Date(),
) {
  administer(ctx);
  const updated = await scheduleDowngrade(db, subjectOf(ctx), planCode, now);
  if (!updated) return null;
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: planCode ? "org.plan.downgrade_scheduled" : "org.plan.downgrade_canceled",
      targetType: "subscription",
      targetId: updated.id,
      organizationId: ctx.organizationId,
      metadata: planCode ? { plan: planCode } : undefined,
    },
  });
  return { until: updated.currentPeriodEnd, plan: updated.pendingPlan?.name ?? null };
}

/** A payment of the administrator's organization, or nothing (isolation). */
export async function orgPayment(db: PrismaClient, ctx: HireContext, paymentId: string) {
  administer(ctx);
  return db.payment.findFirst({
    where: { id: paymentId, subjectType: "organization", subjectId: ctx.organizationId },
  });
}

/** An invoice of the administrator's organization, or nothing (isolation). */
export async function orgInvoice(db: PrismaClient, ctx: HireContext, invoiceId: string) {
  administer(ctx);
  return db.invoice.findFirst({
    where: { id: invoiceId, subjectType: "organization", subjectId: ctx.organizationId },
    include: { payment: true },
  });
}
