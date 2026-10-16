/**
 * « Mode testeur » (docs/decisions/2026-10-16-compte-passe-partout.md): the addresses listed in
 * TESTER_EMAILS (comma separated, verified addresses only) may put their own account, and the
 * test organizations they own, on any plan without paying, to try every plan by hand in production.
 * Nothing is given to anyone else, and every change is written to the audit log.
 * Code still asks for entitlement keys only: a tester simply holds a subscription like anyone.
 */
import type { PlanFamily, PrismaClient } from "@/generated/prisma/client";
import { addMonths, invalidate, resolvePlan, type Subject } from "@/server/entitlements";
import { bootstrapAdminEmails } from "./admin-bootstrap";
import { slugify } from "./accounts";
import { subjectFamilies } from "./subscriptions";

/** Families a tester can try from the panel (partners have no plan to choose). */
export const TESTER_FAMILIES = ["talent", "rh", "company"] as const satisfies PlanFamily[];

/** Limits set « by contract » (Company Premium), given while testing so the plan can be used. */
export const TESTER_CONTRACT: Record<string, string> = {
  "org.seats": "30",
  "jobs.active.max": "100",
  "hire.talent_search.monthly": "2000",
  "hire.contact_requests.monthly": "500",
  "ai.credits.monthly": "2000",
};
export const TESTER_OVERRIDE_REASON = "Mode testeur : contrat d'essai";
/** A test plan lasts a year; choosing it again starts a new quota period. */
export const TESTER_MONTHS = 12;

export class TesterError extends Error {
  constructor(readonly code: "forbidden" | "plan" | "org") {
    super(code);
    this.name = "TesterError";
  }
}

type Person = { email: string; emailVerified: boolean };

export function isTester(user: Person, value = process.env.TESTER_EMAILS): boolean {
  return (
    user.emailVerified && bootstrapAdminEmails(value).includes(user.email.trim().toLowerCase())
  );
}

type Actor = { id: string; email: string; emailVerified: boolean; ip?: string | null };

function assertTester(actor: Actor, value?: string) {
  if (!isTester(actor, value)) throw new TesterError("forbidden");
}

/** The test organizations of the tester: the recruiting one they own, the partner they manage. */
export async function testerOrganizations(db: PrismaClient, userId: string) {
  const [owned, partner] = await Promise.all([
    db.membership.findFirst({
      where: {
        userId,
        role: "org_owner",
        status: "active",
        organization: { type: { in: ["company", "recruiter"] } },
      },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    }),
    db.membership.findFirst({
      where: {
        userId,
        role: "partner_manager",
        status: "active",
        organization: { type: "partner" },
      },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { organization: owned?.organization ?? null, partner: partner?.organization ?? null };
}

/** Plans shown in the panel, by family. */
export async function testerPlans(db: PrismaClient) {
  return db.plan.findMany({
    where: { active: true, family: { in: [...TESTER_FAMILIES] } },
    orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
    select: { id: true, code: true, name: true, family: true, priceCents: true },
  });
}

/**
 * Puts the subject on `planCode` now: the subscriptions in force (not a licence) end, test
 * overrides are removed, quotas start again from zero, and a paid plan becomes a subscription
 * granted by the administration (`source: admin`) for a year. A free plan is the fallback itself.
 */
export async function setTesterPlan(
  db: PrismaClient,
  actor: Actor,
  subject: Subject,
  planCode: string,
  now = new Date(),
  value?: string,
) {
  assertTester(actor, value);
  if (subject.type === "user" && subject.id !== actor.id) throw new TesterError("forbidden");
  if (subject.type === "organization") {
    const { organization } = await testerOrganizations(db, actor.id);
    if (organization?.id !== subject.id) throw new TesterError("org");
  }
  const plan = await db.plan.findUnique({
    where: { code: planCode },
    include: { entitlements: true },
  });
  const families = await subjectFamilies(db, subject);
  if (!plan || !plan.active || !families.includes(plan.family)) throw new TesterError("plan");

  const previous = await resolvePlan(db, subject, now);
  const where = { subjectType: subject.type, subjectId: subject.id };
  await db.$transaction([
    db.subscription.updateMany({
      where: {
        ...where,
        source: { not: "license" },
        status: { not: "expired" },
        currentPeriodEnd: { gt: now },
      },
      data: {
        status: "expired",
        currentPeriodEnd: now,
        cancelAtPeriodEnd: false,
        pendingPlanId: null,
      },
    }),
    db.entitlementOverride.deleteMany({ where: { ...where, reason: TESTER_OVERRIDE_REASON } }),
    db.usageCounter.deleteMany({ where: { ...where, periodEnd: { gt: now } } }),
    ...(plan.priceCents === 0
      ? []
      : [
          db.subscription.create({
            data: {
              ...where,
              planId: plan.id,
              status: "active",
              source: "admin",
              currentPeriodStart: now,
              currentPeriodEnd: addMonths(now, TESTER_MONTHS),
            },
          }),
        ]),
    db.entitlementOverride.createMany({
      data: plan.entitlements
        .filter((row) => row.value === "contract" && TESTER_CONTRACT[row.key])
        .map((row) => ({
          ...where,
          key: row.key,
          value: TESTER_CONTRACT[row.key]!,
          reason: TESTER_OVERRIDE_REASON,
        })),
    }),
    db.auditLog.create({
      data: {
        actorId: actor.id,
        action: "subscription.tester",
        targetType: subject.type,
        targetId: subject.id,
        metadata: { from: previous?.planCode ?? null, to: plan.code, via: "TESTER_EMAILS" },
        ip: actor.ip ?? null,
      },
    }),
  ]);
  invalidate(subject);
  return plan;
}

async function uniqueSlug(db: PrismaClient, base: string) {
  const root = slugify(base) || "organisation-de-test";
  for (let index = 0; ; index += 1) {
    const slug = index === 0 ? root : `${root}-${index + 1}`;
    if (!(await db.organization.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

/**
 * Creates the tester's own test organization (company side, owner) or test institution (partner
 * side, partner manager), once. Returns the existing one when there is already one.
 */
export async function createTesterOrganization(
  db: PrismaClient,
  actor: Actor,
  kind: "company" | "partner",
  name: string,
  value?: string,
) {
  assertTester(actor, value);
  const existing = await testerOrganizations(db, actor.id);
  const found = kind === "company" ? existing.organization : existing.partner;
  if (found) return found;
  const organization = await db.organization.create({
    data: {
      type: kind,
      name,
      slug: await uniqueSlug(db, name),
      memberships: {
        create: { userId: actor.id, role: kind === "company" ? "org_owner" : "partner_manager" },
      },
    },
  });
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      action: "org.tester",
      targetType: "organization",
      targetId: organization.id,
      metadata: { kind, via: "TESTER_EMAILS" },
      ip: actor.ip ?? null,
    },
  });
  return organization;
}
