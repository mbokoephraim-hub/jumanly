/**
 * Compte on the recruiter's phone (Modèle B recruteur, M8, planches 08, 09 et 11): the hub, the
 * recruiter's profile as talents see it, the statistics of 30 days, the team, the plan read only,
 * the notifications, the consultation log, « Quitter l'entreprise » and the company mode of an
 * administrator. Every query is filtered by the active organization (golden rule n° 6); the plan
 * is never changed here, only read (the administrator changes it on a computer).
 */
import type { MembershipRole, PrismaClient } from "@/generated/prisma/client";
import { z } from "zod";
import { AI_CREDITS_KEY } from "@/server/ai";
import { parseLimit, resolvePlan, usage } from "@/server/entitlements";
import { candidateOffers } from "./hire-candidates";
import { phaseOf, PROPOSAL_EVENT, RH_PHASES, type RhPhase } from "./hire-phone-candidatures";
import { hirePermissions, HireError, jobScope, type HireContext } from "./hire";
import { emailField } from "./accounts";
import { notify } from "./notifications";
import { seatUsage } from "./organization";

const DAY = 86_400_000;
const ADMIN_ROLES: readonly MembershipRole[] = ["org_owner", "org_admin"];
/** Events written by a member that answer the candidate (the first one sets the delay). */
const ANSWER_EVENTS = [
  "stage_changed",
  "message",
  "decision",
  "document_requested",
  PROPOSAL_EVENT,
];

export const isOrgAdmin = (role: MembershipRole) => ADMIN_ROLES.includes(role);

/** The page's administrator shown to the members (the owner first, then an administrator). */
export async function orgAdmin(db: PrismaClient, organizationId: string) {
  const admins = await db.membership.findMany({
    where: { organizationId, status: "active", role: { in: [...ADMIN_ROLES] } },
    orderBy: { createdAt: "asc" },
    select: { userId: true, role: true, user: { select: { name: true } } },
  });
  const first = admins.find((item) => item.role === "org_owner") ?? admins[0] ?? null;
  return {
    name: first?.user.name ?? null,
    userIds: admins.map((item) => item.userId),
  };
}

/** Start of the calendar month in UTC (« ce mois »). */
export function monthStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** The hub of Compte (planche Recruteur-compte). */
export async function rhAccountHub(db: PrismaClient, ctx: HireContext) {
  const [user, membership, profile, organization, admin, members, plan, saved] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: { name: true, image: true },
    }),
    db.membership.findUnique({
      where: {
        userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId },
      },
      select: { jobTitle: true },
    }),
    db.recruiterProfile.findUnique({
      where: { userId: ctx.userId },
      select: { jobTitle: true, personalOrganizationId: true, independent: true },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, slug: true, logo: true, verifiedAt: true },
    }),
    orgAdmin(db, ctx.organizationId),
    db.membership.count({ where: { organizationId: ctx.organizationId, status: "active" } }),
    resolvePlan(db, { type: "organization", id: ctx.organizationId }),
    db.feedSave.count({ where: { userId: ctx.userId } }),
  ]);
  // The space opened under the person's own name while a request waits is not a company.
  const own = profile?.personalOrganizationId === ctx.organizationId;
  const pending = own
    ? await db.orgJoinRequest.findFirst({
        where: { userId: ctx.userId, status: "pending", expiresAt: { gt: new Date() } },
        select: { organization: { select: { name: true } } },
      })
    : null;
  return {
    user,
    jobTitle: membership?.jobTitle?.trim() || profile?.jobTitle?.trim() || null,
    org: organization,
    attachment: own
      ? pending
        ? { kind: "pending" as const, org: pending.organization.name }
        : { kind: "independent" as const }
      : { kind: "attached" as const },
    admin: admin.name,
    isAdmin: isOrgAdmin(ctx.role),
    members,
    planName: plan?.planName ?? "",
    saved,
  };
}

/** « Mon profil recruteur » (planche Recruteur-compte-profil): what talents see. */
export async function rhRecruiterProfile(db: PrismaClient, ctx: HireContext) {
  const [user, membership, profile, organization, admin, jobs] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: { name: true, image: true, email: true, city: true },
    }),
    db.membership.findUnique({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      select: { jobTitle: true },
    }),
    db.recruiterProfile.findUnique({ where: { userId: ctx.userId } }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, slug: true, logo: true, city: true },
    }),
    orgAdmin(db, ctx.organizationId),
    db.job.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: "published",
        OR: [{ createdById: ctx.userId }, { assignedToId: ctx.userId }],
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        city: true,
        remote: true,
        _count: { select: { applications: true } },
      },
    }),
  ]);
  return {
    user,
    jobTitle: membership?.jobTitle?.trim() || profile?.jobTitle?.trim() || null,
    city: user.city ?? organization.city ?? null,
    otherCities: profile?.otherCities ?? [],
    headline: profile?.headline?.trim() || null,
    hiringNow: profile?.hiringNow ?? true,
    seeking: profile?.seeking ?? "",
    domains: profile?.domains ?? [],
    contactsFor: (profile?.contactsFor ?? "interview") as RhContactsFor,
    workEmail: profile?.workEmail ?? user.email,
    org: organization,
    admin: admin.name,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      city: job.city,
      remote: job.remote,
      applications: job._count.applications,
    })),
  };
}

export const RH_CONTACTS_FOR = ["interview", "nobody"] as const;
export type RhContactsFor = "interview" | "nobody" | "connections";

export const rhProfileEditSchema = z.object({
  headline: z.string().trim().max(280),
  hiringNow: z.boolean(),
  contactsFor: z.enum(["interview", "nobody", "connections"]),
  /** « Le candidat que je recherche » (Ephraïm 27/10/2026). */
  seeking: z.string().trim().max(400).optional(),
});

/** « Modifier mon profil » (planche Recruteur-compte-modifier): the hook, the badge, the phone. */
export async function saveRhProfile(db: PrismaClient, ctx: HireContext, raw: unknown) {
  const parsed = rhProfileEditSchema.safeParse(raw);
  if (!parsed.success) return false;
  const data = {
    ...parsed.data,
    headline: parsed.data.headline || null,
    ...(parsed.data.seeking === undefined ? {} : { seeking: parsed.data.seeking || null }),
  };
  await db.recruiterProfile.upsert({
    where: { userId: ctx.userId },
    create: { userId: ctx.userId, ...data },
    update: data,
  });
  return true;
}

/**
 * « Mes statistiques » (planche Recruteur-compte-stats): the applications of 30 days on the offers
 * the member may read (`jobScope`), the delay of the first answer written by a member, the share
 * answered, the interviews held, the funnel (each phase counts those who reached it or went
 * further; a « Non retenu » counts only among the received).
 */
export async function rhStats(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const since = new Date(now.getTime() - 30 * DAY);
  const offers = hirePermissions(ctx.role).readApplications ? await candidateOffers(db, ctx) : [];
  const scope = await jobScope(db, ctx);
  const applications = await db.application.findMany({
    where: {
      jobId: { in: offers.map((offer) => offer.id) },
      job: scope,
      createdAt: { gte: since },
    },
    select: {
      id: true,
      createdAt: true,
      stage: { select: { kind: true } },
      events: {
        where: { actorId: { not: null }, type: { in: ANSWER_EVENTS } },
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true },
      },
    },
  });
  const interviews = await db.interview.count({
    where: {
      organizationId: ctx.organizationId,
      application: { job: scope },
      startsAt: { gte: since, lte: now },
      status: { in: ["confirmed", "done"] },
    },
  });
  const received = applications.length;
  const answered = applications.filter((item) => item.events.length > 0);
  const delays = answered.map(
    (item) => (item.events[0]!.createdAt.getTime() - item.createdAt.getTime()) / DAY,
  );
  const reached = (phase: RhPhase) => RH_PHASES.indexOf(phase);
  const phases = applications.map((item) =>
    phaseOf(
      item.stage.kind,
      item.events.some((event) => event.type === PROPOSAL_EVENT),
    ),
  );
  const funnel = (["preselection", "entretien", "proposition", "recrute"] as const).map(
    (phase) => ({
      phase,
      count: phases.filter((item) => item !== "nonretenu" && reached(item) >= reached(phase))
        .length,
    }),
  );
  const answeredPercent = received === 0 ? 0 : Math.round((answered.length / received) * 100);
  return {
    received,
    delayDays:
      delays.length === 0
        ? null
        : Math.max(0, Math.round(delays.reduce((sum, value) => sum + value, 0) / delays.length)),
    answeredPercent,
    waitingPercent: received === 0 ? 0 : 100 - answeredPercent,
    interviews,
    funnel: [{ phase: "recue" as const, count: received }, ...funnel],
  };
}

/** « Publications enregistrées » (planche Recruteur-compte-enregistres): the member's own. */
export async function rhSavedPosts(db: PrismaClient, userId: string) {
  const saves = await db.feedSave.findMany({
    where: { userId, post: { hiddenAt: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      post: {
        select: {
          id: true,
          body: true,
          author: { select: { name: true } },
          organization: { select: { name: true } },
        },
      },
    },
  });
  return saves.map(({ post }) => ({
    id: post.id,
    title: post.body.split("\n")[0]!.slice(0, 120),
    by: post.organization?.name ?? post.author?.name ?? "",
  }));
}

/**
 * « Équipe de recrutement » (planche Recruteur-equipe): the active members of the organization,
 * the administrator first, with the files each one follows (offers they created or were given,
 * applications entrusted to them).
 */
export async function rhTeam(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [members, seats, organization, plan] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        role: true,
        jobTitle: true,
        user: { select: { name: true, image: true } },
      },
    }),
    seatUsage(db, ctx.organizationId, now),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
    resolvePlan(db, { type: "organization", id: ctx.organizationId }, now),
  ]);
  const files = await Promise.all(
    members.map((member) =>
      db.application.count({
        where: {
          job: { organizationId: ctx.organizationId },
          status: "active",
          OR: [
            { assignedToId: member.userId },
            { job: { createdById: member.userId } },
            { job: { assignedToId: member.userId } },
          ],
        },
      }),
    ),
  );
  const rank = (role: MembershipRole) =>
    role === "org_owner" ? 0 : role === "org_admin" ? 1 : role === "recruiter" ? 2 : 3;
  const rows = members
    .map((member, index) => ({
      userId: member.userId,
      name: member.user.name,
      image: member.user.image,
      jobTitle: member.jobTitle?.trim() || null,
      role: member.role,
      files: files[index]!,
      me: member.userId === ctx.userId,
    }))
    .sort((a, b) => rank(a.role) - rank(b.role));
  const admin = rows.find((row) => isOrgAdmin(row.role)) ?? null;
  return {
    org: organization.name,
    rows,
    admin: admin?.name ?? null,
    isAdmin: isOrgAdmin(ctx.role),
    seats,
    planName: plan?.planName ?? "",
    seatsLeft: seats.max < 0 ? -1 : Math.max(0, seats.max - seats.used),
  };
}

export const proposeColleagueSchema = z.object({ email: emailField });
/** At most this many requests (colleagues and plans) a member sends in a day. */
export const RH_REQUESTS_PER_DAY = 5;

async function requestsToday(db: PrismaClient, ctx: HireContext, now: Date) {
  return db.notification.count({
    where: {
      type: { in: ["colleagueProposed", "planRequested"] },
      createdAt: { gte: new Date(now.getTime() - DAY) },
      payload: { path: ["fromId"], equals: ctx.userId },
    },
  });
}

/**
 * « Proposer un collègue » (planche Recruteur-equipe-proposer): a member who does not administer
 * the page asks its administrators, who add the person from the administration. Nobody is invited
 * without them.
 */
export async function proposeColleague(
  db: PrismaClient,
  ctx: HireContext,
  raw: unknown,
  now = new Date(),
): Promise<{ ok: true } | { ok: false; error: "email" | "member" | "trop" }> {
  const parsed = proposeColleagueSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "email" };
  const email = parsed.data.email.toLowerCase();
  const already = await db.membership.findFirst({
    where: { organizationId: ctx.organizationId, status: "active", user: { email } },
    select: { id: true },
  });
  if (already) return { ok: false, error: "member" };
  if ((await requestsToday(db, ctx, now)) >= RH_REQUESTS_PER_DAY)
    return { ok: false, error: "trop" };
  const [admin, me, organization] = await Promise.all([
    orgAdmin(db, ctx.organizationId),
    db.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true } }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
  ]);
  await notify(db, {
    userIds: admin.userIds.filter((id) => id !== ctx.userId),
    type: "colleagueProposed",
    payload: { fromId: ctx.userId, name: me.name, email, org: organization.name },
    href: "/app/organisation/equipe",
  });
  return { ok: true };
}

/** The usage bars of « Formule et usage » (planche Recruteur-formule). */
const USAGE_KEYS = {
  searches: "hire.talent_search.monthly",
  credits: AI_CREDITS_KEY,
} as const;

/** « Formule et usage » (planche Recruteur-formule): read only, the administrator changes it. */
export async function rhPlan(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [plan, seats, activeJobs, searches, credits, admin, organization, subscription] =
    await Promise.all([
      resolvePlan(db, subject, now),
      seatUsage(db, ctx.organizationId, now),
      db.job.count({ where: { organizationId: ctx.organizationId, status: "published" } }),
      usage(db, subject, USAGE_KEYS.searches),
      usage(db, subject, USAGE_KEYS.credits),
      orgAdmin(db, ctx.organizationId),
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { name: true },
      }),
      db.subscription.findFirst({
        where: {
          subjectType: "organization",
          subjectId: ctx.organizationId,
          status: { in: ["active", "trialing", "past_due", "sponsored"] },
        },
        orderBy: { currentPeriodEnd: "desc" },
        select: { currentPeriodEnd: true },
      }),
    ]);
  const plans = plan
    ? await db.plan.findMany({
        where: { family: plan.family, active: true, isPublic: true, interval: "month" },
        orderBy: { sortOrder: "asc" },
        select: {
          code: true,
          name: true,
          priceCents: true,
          entitlements: {
            where: { key: { in: ["org.seats", "jobs.active.max"] } },
            select: { key: true, value: true },
          },
        },
      })
    : [];
  const currentIndex = plans.findIndex((item) => item.code === plan?.planCode);
  const next = currentIndex >= 0 ? (plans[currentIndex + 1] ?? null) : null;
  const value = (item: (typeof plans)[number], key: string) =>
    parseLimit(item.entitlements.find((entry) => entry.key === key)?.value);
  return {
    org: organization.name,
    planName: plan?.planName ?? "",
    priceCents: plan?.priceCents ?? null,
    paidUntil: subscription?.currentPeriodEnd ?? null,
    admin: admin.name,
    isAdmin: isOrgAdmin(ctx.role),
    usage: [
      { key: "seats" as const, used: seats.used, limit: seats.max },
      {
        key: "offers" as const,
        used: activeJobs,
        limit: parseLimit(plan?.values["jobs.active.max"]),
      },
      { key: "searches" as const, used: searches.used, limit: searches.limit },
      { key: "credits" as const, used: credits.used, limit: credits.limit },
    ],
    plans: plans.map((item) => ({
      code: item.code,
      name: item.name,
      priceCents: item.priceCents,
      seats: value(item, "org.seats"),
      offers: value(item, "jobs.active.max"),
      current: item.code === plan?.planCode,
    })),
    next: next ? { code: next.code, name: next.name } : null,
  };
}

/** « Demander {plan} à l'administrateur »: a notification, never a change of plan. */
export async function requestPlan(
  db: PrismaClient,
  ctx: HireContext,
  code: string,
  now = new Date(),
): Promise<{ ok: true } | { ok: false; error: "plan" | "trop" }> {
  const plan = await resolvePlan(db, { type: "organization", id: ctx.organizationId }, now);
  const wanted = plan
    ? await db.plan.findFirst({
        where: { code, family: plan.family, active: true, isPublic: true },
        select: { name: true },
      })
    : null;
  if (!wanted || code === plan?.planCode) return { ok: false, error: "plan" };
  if ((await requestsToday(db, ctx, now)) >= RH_REQUESTS_PER_DAY)
    return { ok: false, error: "trop" };
  const [admin, me] = await Promise.all([
    orgAdmin(db, ctx.organizationId),
    db.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true } }),
  ]);
  await notify(db, {
    userIds: admin.userIds.filter((id) => id !== ctx.userId),
    type: "planRequested",
    payload: { fromId: ctx.userId, name: me.name, plan: wanted.name },
    href: "/app/abonnement",
  });
  return { ok: true };
}

/** « Confidentialité et données » (planche Recruteur-compte-confidentialite). */
export async function rhPrivacy(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [views, organization] = await Promise.all([
    db.auditLog.count({
      where: {
        actorId: ctx.userId,
        organizationId: ctx.organizationId,
        action: "profile.view",
        createdAt: { gte: monthStart(now) },
      },
    }),
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true },
    }),
  ]);
  return { views, org: organization.name, owner: ctx.role === "org_owner" };
}

/**
 * « Quitter l'entreprise »: the membership ends (status « removed »), nothing is deleted. The
 * owner of the page hands it over on a computer first.
 */
export async function leaveOrganization(db: PrismaClient, ctx: HireContext) {
  if (ctx.role === "org_owner") throw new HireError("forbidden");
  await db.$transaction([
    db.membership.update({
      where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
      data: { status: "removed" },
    }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.member.leave",
        targetType: "organization",
        targetId: ctx.organizationId,
        organizationId: ctx.organizationId,
      },
    }),
  ]);
}

/** The company mode of an administrator (planche Recruteur-mode-entreprise): its figures. */
export async function rhCompanyMode(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!isOrgAdmin(ctx.role)) throw new HireError("forbidden");
  const since = new Date(now.getTime() - 30 * DAY);
  const [organization, followers, activeJobs, applications, members] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      select: { name: true, slug: true, logo: true },
    }),
    db.feedFollow.count({ where: { organizationId: ctx.organizationId } }),
    db.job.count({ where: { organizationId: ctx.organizationId, status: "published" } }),
    db.application.count({
      where: { job: { organizationId: ctx.organizationId }, createdAt: { gte: since } },
    }),
    db.membership.count({ where: { organizationId: ctx.organizationId, status: "active" } }),
  ]);
  return { org: organization, followers, activeJobs, applications, members };
}
