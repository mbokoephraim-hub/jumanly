/**
 * Talent search, contact requests and pools (E8, partie 05 § 7, partie 10 § 10.2 et § 10.3).
 *
 * - Only talents who chose « visibles des recruteurs » or « anonyme » appear in the search.
 * - Each search uses `hire.talent_search.monthly`; each contact request uses
 *   `hire.contact_requests.monthly`. Pages are capped and there is no export of profiles.
 * - A full profile is only shown when the talent applied to one of the organization's jobs or
 *   accepted its contact request; an anonymous talent's name stays hidden until then.
 * - Every profile consultation is logged (`profile.view`); an abnormal volume blocks the member
 *   for a while and alerts the administrators.
 * - Data excluded from matching (golden rule n° 4) is never selected here.
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import type { EducationLevel, Prisma, PrismaClient, RemoteMode } from "@/generated/prisma/client";
import { can, consume, level, QuotaExceededError, usage } from "@/server/entitlements";
import { matchesForUser } from "@/server/matching/service";
import { educationRanks } from "@/server/matching/normalize";
import type { MatchExplanation } from "@/server/matching/types";
import { hirePermissions, HireError, remoteModes, type HireContext } from "./hire";
import { notify } from "./notifications";

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

export const SEARCH_PAGE_SIZE = 20;
/** Pagination is capped (partie 10 § 10.3): no more than this many pages per search. */
export const SEARCH_MAX_PAGES = 5;
export const CONTACT_EXPIRY_DAYS = 14;
/** After a refusal, a new request from the same organization waits this long. */
export const CONTACT_COOLDOWN_DAYS = 30;
export const CONTACT_MESSAGE_MIN = 20;
/** Profile consultations per member and per hour beyond which access is paused. */
export const ABNORMAL_VIEWS_PER_HOUR = 60;

const DAY = 86_400_000;

const visibleWhere: Prisma.TalentProfileWhereInput = {
  visibility: { in: ["recruiters", "anonymous"] },
  user: { status: "active", deletionScheduledAt: null },
};

/** Applications of this profile to the organization's jobs, or an accepted request. */
async function connection(db: PrismaClient, organizationId: string, profileId: string) {
  const [applied, accepted] = await Promise.all([
    db.application.findFirst({
      where: { profileId, job: { organizationId } },
      select: { id: true },
    }),
    db.contactRequest.findFirst({
      where: { profileId, organizationId, status: "accepted" },
      select: { id: true, conversationId: true },
    }),
  ]);
  return { applied: Boolean(applied), accepted };
}

// ─── Search ─────────────────────────────────────────────────────────────────────

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.union([z.literal(""), z.enum(values)]).default("");

/** Values of `talent.profile.preferences.contract.*`, as stored in desiredContracts. */
export const desiredContracts = [
  "cdi",
  "cdd",
  "internship",
  "freelance",
  "apprenticeship",
  "volunteer",
  "partTime",
] as const;
export const searchLanguages = ["fr", "en", "sw", "ln", "pt", "ar", "es"] as const;

export const educationFilters = Object.keys(educationRanks) as EducationLevel[];

/** « Expérience » of the filters (planche r2plus TAL_F): years of experience, never the age. */
export const experienceLevels = ["sans", "junior", "confirme"] as const;
export type ExperienceLevel = (typeof experienceLevels)[number];
export function experienceLevelOf(years: number): ExperienceLevel {
  return years < 1 ? "sans" : years <= 3 ? "junior" : "confirme";
}

/** Several skills travel as one value (« SQL,Power BI »); each must be in the profile. */
export const skillList = (value: string) =>
  [
    ...new Set(
      value
        .split(",")
        .map((item) => item.replace(/\s+/g, " ").trim().slice(0, 60))
        .filter(Boolean),
    ),
  ].slice(0, 5);

export const searchSchema = z.object({
  q: z.string().trim().max(100).default(""),
  skills: z.string().max(320).default(""),
  level: optionalEnum(experienceLevels),
  location: z.string().trim().max(80).default(""),
  job: z.string().max(40).default(""),
  // Deep filters (`hire.talent_search` « deep »).
  experience: z.union([z.literal(""), z.coerce.number().int().min(0).max(40)]).default(""),
  remote: optionalEnum(remoteModes),
  contract: optionalEnum(desiredContracts),
  language: z.string().trim().max(8).default(""),
  education: z.string().max(40).default(""),
  availability: optionalEnum(["open", "listening"] as const),
  certificates: z.union([z.literal(""), z.literal("1")]).default(""),
  page: z.coerce.number().int().min(1).max(SEARCH_MAX_PAGES).default(1),
});
export type SearchInput = z.infer<typeof searchSchema>;

export const deepFilters = [
  "experience",
  "level",
  "remote",
  "contract",
  "language",
  "education",
  "availability",
  "certificates",
] as const;

export type TalentResult = {
  profileId: string;
  availability: "open" | "listening" | "not_looking";
  anonymous: boolean;
  name: string | null;
  headline: string;
  city: string | null;
  years: number;
  skills: string[];
  certified: boolean;
  contact: "none" | "pending" | "accepted" | "declined";
  score: number | null;
  /** The « Pourquoi ? » of the score, when there is one. */
  explanation: MatchExplanation | null;
};

export type SearchResult =
  | { status: "locked" }
  | { status: "quota"; resetsAt: Date }
  | { status: "empty" }
  | {
      status: "ok";
      results: TalentResult[];
      total: number;
      page: number;
      pages: number;
      jobTitle: string | null;
    };

const searchSelect = {
  id: true,
  headline: true,
  visibility: true,
  availability: true,
  matchingEnabled: true,
  userId: true,
  user: { select: { name: true, city: true } },
  skills: {
    orderBy: { level: "desc" },
    take: 6,
    select: { verified: true, skill: { select: { name: true } } },
  },
  experiences: { select: { startDate: true, endDate: true } },
  educations: { select: { level: true } },
  languages: true,
} satisfies Prisma.TalentProfileSelect;

function yearsOf(experiences: { startDate: Date; endDate: Date | null }[], now: Date) {
  const months = experiences.reduce(
    (sum, item) =>
      sum +
      Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / (30.44 * DAY)),
    0,
  );
  return Math.floor(months / 12);
}

export function searchFilters(input: SearchInput, deep: boolean): Prisma.TalentProfileWhereInput[] {
  const and: Prisma.TalentProfileWhereInput[] = [visibleWhere];
  if (input.q) {
    const contains = { contains: input.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { headline: contains },
        { targetJob: contains },
        { summary: contains },
        { desiredJobTitles: { has: input.q } },
        { skills: { some: { skill: { name: contains } } } },
        { experiences: { some: { title: contains } } },
      ],
    });
  }
  for (const skill of skillList(input.skills))
    and.push({
      skills: { some: { skill: { name: { equals: skill, mode: "insensitive" as const } } } },
    });
  if (input.location) {
    const contains = { contains: input.location, mode: "insensitive" as const };
    and.push({
      OR: [
        { user: { city: contains } },
        { user: { country: contains } },
        { desiredLocations: { has: input.location } },
      ],
    });
  }
  if (!deep) return and;
  if (input.remote) and.push({ remotePreferences: { has: input.remote as RemoteMode } });
  if (input.contract) and.push({ desiredContracts: { has: input.contract } });
  if (input.availability) and.push({ availability: input.availability });
  if (input.certificates) and.push({ skills: { some: { verified: true, proof: "certificate" } } });
  if (input.language)
    and.push({ languages: { array_contains: [{ code: input.language.toLowerCase() }] } });
  return and;
}

/**
 * A search by the recruiting team. Page 1 uses one search of the monthly quota; the next pages of
 * the same search do not.
 */
export async function searchTalents(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
): Promise<SearchResult> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const subject = orgSubject(ctx);
  const searchLevel = await level(db, subject, "hire.talent_search");
  if (searchLevel === "none") return { status: "locked" };
  const input = searchSchema.parse(raw);
  if (!input.q && !input.location && !input.job && !skillList(input.skills).length)
    return { status: "empty" };
  const deep = searchLevel === "deep";
  // One search of the quota per distinct query and quota period: the next pages and a reload of
  // the same query are not charged again, whatever the address says.
  const query = { ...input, page: undefined };
  const period = await usage(db, subject, "hire.talent_search.monthly", now);
  const key = `search:${ctx.organizationId}:${period.resetsAt.toISOString()}:${createHash("sha256")
    .update(JSON.stringify(query))
    .digest("hex")
    .slice(0, 32)}`;
  const known = await db.jobRun.findUnique({ where: { key } });
  if (!known) {
    try {
      await consume(db, subject, "hire.talent_search.monthly", 1, now);
    } catch (error) {
      if ((error as Error).name === "QuotaExceededError")
        return { status: "quota", resetsAt: (error as QuotaExceededError).resetsAt };
      throw error;
    }
    await db.jobRun.create({ data: { key, ranAt: now } }).catch(() => undefined);
  }
  const job = input.job
    ? await db.job.findFirst({
        where: { id: input.job, organizationId: ctx.organizationId },
        select: {
          id: true,
          title: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      })
    : null;
  const filters = searchFilters(input, deep);
  if (job && !input.q && job.skills.length > 0) {
    filters.push({
      skills: { some: { skill: { name: { in: job.skills.map((item) => item.skill.name) } } } },
    });
  }
  const where: Prisma.TalentProfileWhereInput = { AND: filters };
  // Filters on computed values (experience, education) are applied after the database query, on
  // a bounded set, so the cap on pages still holds.
  const rows = await db.talentProfile.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: SEARCH_PAGE_SIZE * SEARCH_MAX_PAGES,
    select: searchSelect,
  });
  const minRank = deep && input.education ? (educationRanks[input.education] ?? 0) : 0;
  const filtered = rows.filter(
    (row) =>
      (!deep || input.experience === "" || yearsOf(row.experiences, now) >= input.experience) &&
      (!deep || !input.level || experienceLevelOf(yearsOf(row.experiences, now)) === input.level) &&
      (minRank === 0 ||
        row.educations.some((item) => (educationRanks[item.level] ?? 0) >= minRank)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / SEARCH_PAGE_SIZE));
  const page = Math.min(input.page, pages);
  const slice = filtered.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);
  const ids = slice.map((row) => row.id);
  const [requests, applications, matchingLevel] = await Promise.all([
    db.contactRequest.findMany({
      where: { organizationId: ctx.organizationId, profileId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: { profileId: true, status: true, expiresAt: true },
    }),
    db.application.findMany({
      where: { profileId: { in: ids }, job: { organizationId: ctx.organizationId } },
      select: { profileId: true },
    }),
    level(db, subject, "hire.matching.level"),
  ]);
  const applied = new Set(applications.map((item) => item.profileId));
  const results: TalentResult[] = [];
  for (const row of slice) {
    const request = requests.find((item) => item.profileId === row.id);
    const status =
      request?.status === "pending" && request.expiresAt <= now ? "expired" : request?.status;
    const known = applied.has(row.id) || status === "accepted";
    let explanation: MatchExplanation | null = null;
    if (job && matchingLevel !== "none" && row.matchingEnabled) {
      const match = (await matchesForUser(db, row.userId, [job.id], now)).get(job.id);
      if (match?.state === "ok") explanation = match.explanation;
    }
    results.push({
      profileId: row.id,
      availability: row.availability,
      anonymous: row.visibility === "anonymous" && !known,
      name: row.visibility === "anonymous" && !known ? null : row.user.name,
      headline: row.headline ?? "",
      city: row.user.city,
      years: yearsOf(row.experiences, now),
      skills: row.skills.map((item) => item.skill.name),
      certified: row.skills.some((item) => item.verified),
      contact:
        status === "pending" || status === "accepted" || status === "declined" ? status : "none",
      score: explanation?.score ?? null,
      explanation,
    });
  }
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "talent.search",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: { results: filtered.length, page, deep },
    },
  });
  return {
    status: "ok",
    results,
    total: filtered.length,
    page,
    pages,
    jobTitle: job?.title ?? null,
  };
}

export async function searchQuotas(db: PrismaClient, organizationId: string, now = new Date()) {
  const subject = { type: "organization" as const, id: organizationId };
  const [searches, contacts] = await Promise.all([
    usage(db, subject, "hire.talent_search.monthly", now),
    usage(db, subject, "hire.contact_requests.monthly", now),
  ]);
  return { searches, contacts };
}

// ─── Profile consultation ───────────────────────────────────────────────────────

/** Too many profiles opened within an hour: paused, and the administrators are told once. */
async function abnormalUsage(db: PrismaClient, ctx: HireContext, now: Date) {
  const since = new Date(now.getTime() - 3_600_000);
  const views = await db.auditLog.count({
    where: { actorId: ctx.userId, action: "profile.view", createdAt: { gte: since } },
  });
  if (views < ABNORMAL_VIEWS_PER_HOUR) return false;
  const alerted = await db.auditLog.findFirst({
    where: { actorId: ctx.userId, action: "security.abnormalUsage", createdAt: { gte: since } },
    select: { id: true },
  });
  if (!alerted) {
    await db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "security.abnormalUsage",
        targetType: "organization",
        targetId: ctx.organizationId,
        organizationId: ctx.organizationId,
        metadata: { views },
      },
    });
    const [admins, organization] = await Promise.all([
      db.user.findMany({ where: { platformRole: "platform_admin" }, select: { id: true } }),
      db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: { name: true },
      }),
    ]);
    await notify(db, {
      userIds: admins.map((admin) => admin.id),
      type: "abnormalUsage",
      payload: { org: organization?.name ?? "", count: views },
      href: "/admin/organisations",
    });
  }
  return true;
}

const fullProfileSelect = {
  id: true,
  headline: true,
  summary: true,
  visibility: true,
  availability: true,
  desiredJobTitles: true,
  desiredContracts: true,
  remotePreferences: true,
  languages: true,
  userId: true,
  matchingEnabled: true,
  user: { select: { id: true, name: true, firstName: true, city: true, country: true } },
  skills: {
    orderBy: { level: "desc" },
    select: {
      skillId: true,
      level: true,
      verified: true,
      proof: true,
      source: true,
      proofUrl: true,
      skill: { select: { name: true } },
    },
  },
  experiences: {
    orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
    select: {
      id: true,
      title: true,
      company: true,
      startDate: true,
      endDate: true,
      description: true,
    },
  },
  educations: {
    orderBy: [{ endYear: { sort: "desc", nulls: "first" } }],
    select: { id: true, degree: true, school: true, endYear: true, level: true },
  },
} satisfies Prisma.TalentProfileSelect;

export type TalentProfileView =
  | { status: "notFound" }
  | { status: "blocked" }
  | {
      status: "ok";
      full: boolean;
      anonymous: boolean;
      profile: Prisma.TalentProfileGetPayload<{ select: typeof fullProfileSelect }>;
      contact: { status: string; conversationId: string | null } | null;
      applied: boolean;
    };

/**
 * A recruiter opens a profile from the search or a pool. Visible profiles show a summary; the
 * full profile needs an application or an accepted request. Every opening is logged.
 */
export async function viewTalentProfile(
  db: PrismaClient,
  ctx: HireContext,
  profileId: string,
  now = new Date(),
): Promise<TalentProfileView> {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const profile = await db.talentProfile.findUnique({
    where: { id: profileId },
    select: fullProfileSelect,
  });
  if (!profile) return { status: "notFound" };
  const { applied, accepted } = await connection(db, ctx.organizationId, profile.id);
  const visible = profile.visibility === "recruiters" || profile.visibility === "anonymous";
  if (!visible && !applied) return { status: "notFound" };
  if (await abnormalUsage(db, ctx, now)) return { status: "blocked" };
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "profile.view",
      targetType: "talentProfile",
      targetId: profile.id,
      organizationId: ctx.organizationId,
      metadata: { source: "talent_search" },
    },
  });
  const last = await db.contactRequest.findFirst({
    where: { organizationId: ctx.organizationId, profileId: profile.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, expiresAt: true, conversationId: true },
  });
  const full = applied || Boolean(accepted);
  return {
    status: "ok",
    full,
    anonymous: profile.visibility === "anonymous" && !full,
    profile: full
      ? profile
      : {
          ...profile,
          // Summary only: no employer names, no free text written about past jobs.
          user: {
            ...profile.user,
            name: profile.visibility === "anonymous" ? "" : profile.user.name,
          },
          experiences: profile.experiences.map((item) => ({
            ...item,
            company: "",
            description: "",
          })),
          summary: null,
        },
    contact: last
      ? {
          status: last.status === "pending" && last.expiresAt <= now ? "expired" : last.status,
          conversationId: last.conversationId,
        }
      : null,
    applied,
  };
}

// ─── Contact requests ───────────────────────────────────────────────────────────

export const contactRequestSchema = z.object({
  profile: z.string().min(1),
  job: z.string().default(""),
  message: z.string().trim().min(CONTACT_MESSAGE_MIN).max(2000),
});

export type ContactResult =
  | { status: "sent"; requestId: string }
  | { status: "locked" | "quota" | "invalid" | "notFound" | "blocked" | "pending" | "connected" }
  | { status: "cooldown"; days: number };

export async function createContactRequest(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
): Promise<ContactResult> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const subject = orgSubject(ctx);
  if ((await level(db, subject, "hire.talent_search")) === "none") return { status: "locked" };
  const parsed = contactRequestSchema.safeParse(raw);
  if (!parsed.success) return { status: "invalid" };
  const profile = await db.talentProfile.findFirst({
    where: { id: parsed.data.profile, ...visibleWhere },
    select: { id: true, userId: true, acceptsContactRequests: true },
  });
  if (!profile) return { status: "notFound" };
  const blocked = await db.contactBlock.findUnique({
    where: {
      profileId_organizationId: { profileId: profile.id, organizationId: ctx.organizationId },
    },
  });
  if (blocked || !profile.acceptsContactRequests) return { status: "blocked" };
  const { applied, accepted } = await connection(db, ctx.organizationId, profile.id);
  if (applied || accepted) return { status: "connected" };
  const previous = await db.contactRequest.findFirst({
    where: { organizationId: ctx.organizationId, profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
  if (previous?.status === "pending" && previous.expiresAt > now) return { status: "pending" };
  if (
    previous?.status === "declined" &&
    previous.respondedAt &&
    now.getTime() - previous.respondedAt.getTime() < CONTACT_COOLDOWN_DAYS * DAY
  )
    return { status: "cooldown", days: CONTACT_COOLDOWN_DAYS };
  const job = parsed.data.job
    ? await db.job.findFirst({
        where: { id: parsed.data.job, organizationId: ctx.organizationId },
        select: { id: true, title: true },
      })
    : null;
  try {
    await consume(db, subject, "hire.contact_requests.monthly", 1, now);
  } catch (error) {
    if ((error as Error).name === "QuotaExceededError") return { status: "quota" };
    throw error;
  }
  if (previous?.status === "pending")
    await db.contactRequest.update({ where: { id: previous.id }, data: { status: "expired" } });
  const request = await db.contactRequest.create({
    data: {
      organizationId: ctx.organizationId,
      requesterId: ctx.userId,
      profileId: profile.id,
      jobId: job?.id ?? null,
      message: parsed.data.message,
      expiresAt: new Date(now.getTime() + CONTACT_EXPIRY_DAYS * DAY),
      createdAt: now,
    },
    include: { organization: { select: { name: true } } },
  });
  await notify(db, {
    userIds: [profile.userId],
    type: "contactRequest",
    payload: { company: request.organization.name },
    href: "/app/messages?filtre=demandes",
  });
  return { status: "sent", requestId: request.id };
}

/** Requests received by a talent, newest first; pending ones past their date read as expired. */
export async function talentContactRequests(db: PrismaClient, userId: string, now = new Date()) {
  const rows = await db.contactRequest.findMany({
    where: { profile: { userId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      organization: { select: { name: true, verifiedAt: true } },
      requester: { select: { name: true } },
      job: { select: { title: true } },
      profile: { select: { visibility: true } },
    },
  });
  return rows.map((row) => ({
    ...row,
    status: row.status === "pending" && row.expiresAt <= now ? ("expired" as const) : row.status,
  }));
}

export type RespondResult =
  | { status: "accepted"; conversationId: string }
  | { status: "declined" | "blocked" | "expired" | "notFound" };

/** The talent decides. Accepting opens a conversation; nothing is exchanged before. */
export async function respondContactRequest(
  db: PrismaClient,
  userId: string,
  requestId: string,
  answer: "accept" | "decline" | "block",
  now = new Date(),
): Promise<RespondResult> {
  const request = await db.contactRequest.findFirst({
    where: { id: requestId, profile: { userId } },
    include: { organization: { select: { name: true } }, profile: { select: { id: true } } },
  });
  if (!request) return { status: "notFound" };
  if (answer === "block") {
    await db.contactBlock.upsert({
      where: {
        profileId_organizationId: {
          profileId: request.profileId,
          organizationId: request.organizationId,
        },
      },
      update: {},
      create: { profileId: request.profileId, organizationId: request.organizationId },
    });
  }
  if (request.status !== "pending") return { status: answer === "block" ? "blocked" : "notFound" };
  if (request.expiresAt <= now) {
    await db.contactRequest.update({ where: { id: request.id }, data: { status: "expired" } });
    return { status: answer === "block" ? "blocked" : "expired" };
  }
  if (answer !== "accept") {
    const moved = await db.contactRequest.updateMany({
      where: { id: request.id, status: "pending" },
      data: { status: "declined", respondedAt: now },
    });
    if (moved.count > 0) {
      // The organization learns the refusal, without detail.
      await notify(db, {
        userIds: [request.requesterId],
        type: "contactDeclined",
        payload: {},
        href: "/app/hire/candidats?vue=propositions",
      });
    }
    return { status: answer === "block" ? "blocked" : "declined" };
  }
  const conversation = await db.conversation.create({
    data: {
      kind: "contact_request",
      organizationId: request.organizationId,
      talentUserId: userId,
      lastMessageAt: now,
      messages: {
        create: {
          senderId: request.requesterId,
          body: request.message,
          createdAt: request.createdAt,
        },
      },
    },
  });
  const moved = await db.contactRequest.updateMany({
    where: { id: request.id, status: "pending" },
    data: { status: "accepted", respondedAt: now, conversationId: conversation.id },
  });
  if (moved.count === 0) {
    await db.conversation.delete({ where: { id: conversation.id } });
    return { status: "notFound" };
  }
  await notify(db, {
    userIds: [request.requesterId],
    type: "contactAccepted",
    payload: {},
    // `acceptee=1`: on a computer, the conversation opens on the news (web recruiter lot 4).
    href: `/app/messages/${conversation.id}?acceptee=1`,
  });
  return { status: "accepted", conversationId: conversation.id };
}

export async function acceptedContacts(db: PrismaClient, organizationId: string, since: Date) {
  return db.contactRequest.count({
    where: { organizationId, status: "accepted", respondedAt: { gte: since } },
  });
}

// ─── Pools ──────────────────────────────────────────────────────────────────────

export const poolVisibilities = ["private", "team", "org"] as const;

async function memberTeam(db: PrismaClient, ctx: HireContext) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
    select: { teamId: true },
  });
  return membership?.teamId ?? null;
}

async function poolsWhere(
  db: PrismaClient,
  ctx: HireContext,
): Promise<Prisma.TalentPoolWhereInput> {
  const teamId = await memberTeam(db, ctx);
  return {
    organizationId: ctx.organizationId,
    OR: [
      { ownerId: ctx.userId },
      { visibility: "org" },
      ...(teamId ? [{ visibility: "team" as const, teamId }] : []),
    ],
  };
}

/** Talents a pool may show: still visible, or who applied to one of the organization's jobs. */
function entryVisible(organizationId: string): Prisma.TalentPoolEntryWhereInput {
  return {
    OR: [
      { profile: visibleWhere },
      { profile: { applications: { some: { job: { organizationId } } } } },
    ],
  };
}

export async function poolsEnabled(db: PrismaClient, organizationId: string) {
  return can(db, { type: "organization", id: organizationId }, "hire.shortlist");
}

export async function listPools(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  return db.talentPool.findMany({
    where: await poolsWhere(db, ctx),
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { name: true } },
      _count: { select: { entries: { where: entryVisible(ctx.organizationId) } } },
      entries: {
        where: entryVisible(ctx.organizationId),
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          profileId: true,
          profile: { select: { visibility: true, user: { select: { name: true } } } },
        },
      },
    },
  });
}

export const poolSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  visibility: z.enum(poolVisibilities).default("private"),
});

export async function createPool(db: PrismaClient, ctx: HireContext, raw: Record<string, unknown>) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!(await poolsEnabled(db, ctx.organizationId))) throw new HireError("forbidden");
  const parsed = poolSchema.safeParse(raw);
  if (!parsed.success) throw new HireError("invalid");
  const { visibility } = parsed.data;
  if (visibility !== "private" && !(await can(db, orgSubject(ctx), "org.talent_pools.shared")))
    throw new HireError("forbidden");
  const teamId = visibility === "team" ? await memberTeam(db, ctx) : null;
  if (visibility === "team" && !teamId) throw new HireError("invalid");
  return db.talentPool.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      visibility,
      ownerId: ctx.userId,
      teamId,
    },
  });
}

async function editablePool(db: PrismaClient, ctx: HireContext, poolId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const pool = await db.talentPool.findFirst({
    where: { AND: [{ id: poolId }, await poolsWhere(db, ctx)] },
  });
  if (!pool) throw new HireError("notFound");
  return pool;
}

export async function getPool(db: PrismaClient, ctx: HireContext, poolId: string) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const pool = await db.talentPool.findFirst({
    where: { AND: [{ id: poolId }, await poolsWhere(db, ctx)] },
    include: {
      owner: { select: { name: true } },
      entries: {
        where: entryVisible(ctx.organizationId),
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              id: true,
              headline: true,
              visibility: true,
              user: { select: { name: true, city: true } },
              applications: {
                where: { job: { organizationId: ctx.organizationId } },
                orderBy: { createdAt: "desc" },
                select: { id: true, job: { select: { title: true } } },
                take: 1,
              },
              contactRequests: {
                where: { organizationId: ctx.organizationId, status: "accepted" },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  if (!pool) throw new HireError("notFound");
  return {
    ...pool,
    entries: pool.entries.map((entry) => {
      const known =
        entry.profile.applications.length > 0 || entry.profile.contactRequests.length > 0;
      const anonymous = entry.profile.visibility === "anonymous" && !known;
      return {
        profileId: entry.profileId,
        note: entry.note,
        anonymous,
        name: anonymous ? null : entry.profile.user.name,
        headline: entry.profile.headline ?? "",
        city: entry.profile.user.city,
        createdAt: entry.createdAt,
        origin: entry.profile.applications[0]
          ? ({ kind: "applied", jobTitle: entry.profile.applications[0].job.title } as const)
          : entry.profile.contactRequests.length > 0
            ? ({ kind: "contact" } as const)
            : ({ kind: "search" } as const),
      };
    }),
  };
}

export async function addToPool(
  db: PrismaClient,
  ctx: HireContext,
  poolId: string,
  profileId: string,
  note = "",
) {
  const pool = await editablePool(db, ctx, poolId);
  const allowed = await db.talentProfile.findFirst({
    where: {
      id: profileId,
      OR: [
        visibleWhere,
        { applications: { some: { job: { organizationId: ctx.organizationId } } } },
      ],
    },
    select: { id: true },
  });
  if (!allowed) throw new HireError("notFound");
  await db.talentPoolEntry.upsert({
    where: { poolId_profileId: { poolId: pool.id, profileId } },
    update: {},
    create: {
      poolId: pool.id,
      profileId,
      addedById: ctx.userId,
      note: note.trim().slice(0, 300) || null,
    },
  });
  await db.talentPool.update({ where: { id: pool.id }, data: { updatedAt: new Date() } });
  return pool;
}

export async function removeFromPool(
  db: PrismaClient,
  ctx: HireContext,
  poolId: string,
  profileId: string,
) {
  const pool = await editablePool(db, ctx, poolId);
  await db.talentPoolEntry.deleteMany({ where: { poolId: pool.id, profileId } });
}

export async function renamePool(db: PrismaClient, ctx: HireContext, poolId: string, name: string) {
  const pool = await editablePool(db, ctx, poolId);
  const parsed = poolSchema.shape.name.safeParse(name);
  if (!parsed.success) throw new HireError("invalid");
  await db.talentPool.update({ where: { id: pool.id }, data: { name: parsed.data } });
}

/** The creator, or an administrator for a shared pool, deletes the list (talents are not told). */
export async function deletePool(db: PrismaClient, ctx: HireContext, poolId: string) {
  const pool = await editablePool(db, ctx, poolId);
  if (pool.ownerId !== ctx.userId && !hirePermissions(ctx.role).administer)
    throw new HireError("forbidden");
  await db.talentPool.delete({ where: { id: pool.id } });
}

// ─── Recruiter redesign, lot 4: proposals and pools at a glance ─────────────────

/**
 * The pools a member may add a talent to (sheet « Ajouter à un vivier »), with whether the talent
 * is already in each; null when pools are not in the organization's plan.
 */
export async function poolChoices(db: PrismaClient, ctx: HireContext, profileId: string) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!(await poolsEnabled(db, ctx.organizationId))) return null;
  const pools = await db.talentPool.findMany({
    where: await poolsWhere(db, ctx),
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      name: true,
      _count: { select: { entries: { where: entryVisible(ctx.organizationId) } } },
      entries: { where: { profileId }, select: { profileId: true } },
    },
  });
  return pools.map((pool) => ({
    id: pool.id,
    name: pool.name,
    count: pool._count.entries,
    has: pool.entries.length > 0,
  }));
}

export const proposalFilters = ["acceptees", "attente", "refusees"] as const;
export type ProposalFilter = (typeof proposalFilters)[number];

/**
 * « Mes propositions » (planche r2plus PROPS): the offers proposed to talents by the organization,
 * newest first, with their answer. A pending proposal past its date reads as expired; an anonymous
 * talent keeps a hidden name until they accept.
 */
export async function orgProposals(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const rows = await db.contactRequest.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      respondedAt: true,
      remindedAt: true,
      conversationId: true,
      job: { select: { title: true } },
      profile: {
        select: { id: true, visibility: true, headline: true, user: { select: { name: true } } },
      },
    },
  });
  return rows.map((row) => {
    const status =
      row.status === "pending" && row.expiresAt <= now ? ("expired" as const) : row.status;
    const anonymous = row.profile.visibility === "anonymous" && status !== "accepted";
    return {
      id: row.id,
      profileId: row.profile.id,
      status,
      name: anonymous ? null : row.profile.user.name,
      headline: row.profile.headline ?? "",
      jobTitle: row.job?.title ?? null,
      createdAt: row.createdAt,
      respondedAt: row.respondedAt,
      conversationId: status === "accepted" ? row.conversationId : null,
      /** Lot 6: « Relancer » once, while the proposal waits. */
      canRemind: status === "pending" && row.remindedAt === null,
      remindedAt: row.remindedAt,
    };
  });
}

/**
 * « Relancer » a proposal still waiting (brief recruteur § 2.20): once only, the talent is told
 * again in the app. The talent still decides; nothing else changes.
 */
export async function remindProposal(
  db: PrismaClient,
  ctx: HireContext,
  requestId: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const request = await db.contactRequest.findFirst({
    where: {
      id: requestId,
      organizationId: ctx.organizationId,
      status: "pending",
      remindedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      organization: { select: { name: true } },
      profile: { select: { userId: true } },
    },
  });
  if (!request) return false;
  const claimed = await db.contactRequest.updateMany({
    where: { id: request.id, remindedAt: null },
    data: { remindedAt: now },
  });
  if (claimed.count === 0) return false;
  await notify(db, {
    userIds: [request.profile.userId],
    type: "contactRequest",
    payload: { company: request.organization.name },
    href: "/app/messages?filtre=demandes",
  });
  return true;
}

/** Which filter of « Mes propositions » a status belongs to (expired counts as refused). */
export function proposalFilterOf(status: string): ProposalFilter {
  return status === "accepted" ? "acceptees" : status === "pending" ? "attente" : "refusees";
}

/**
 * « Viviers » (planche r2plus VIVIERS): each pool with up to four talents, how many are available,
 * and, for the newest published offer, how many talents of a pool have one of its required skills
 * (Orbi's line: a suggestion to look, never an action).
 */
export async function poolsOverview(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const pools = await db.talentPool.findMany({
    where: await poolsWhere(db, ctx),
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      visibility: true,
      entries: {
        where: entryVisible(ctx.organizationId),
        orderBy: { createdAt: "desc" },
        select: {
          profileId: true,
          profile: {
            select: {
              visibility: true,
              availability: true,
              user: { select: { name: true } },
              skills: { select: { skillId: true } },
              applications: {
                where: { job: { organizationId: ctx.organizationId } },
                select: { id: true },
                take: 1,
              },
              contactRequests: {
                where: { organizationId: ctx.organizationId, status: "accepted" },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  const offer = await db.job.findFirst({
    where: { organizationId: ctx.organizationId, status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      skills: { where: { importance: "required" }, select: { skillId: true } },
    },
  });
  const wanted = new Set(offer?.skills.map((item) => item.skillId) ?? []);
  const shaped = pools.map((pool) => {
    const people = pool.entries.map((entry) => {
      const known =
        entry.profile.applications.length > 0 || entry.profile.contactRequests.length > 0;
      const anonymous = entry.profile.visibility === "anonymous" && !known;
      return {
        profileId: entry.profileId,
        name: anonymous ? null : entry.profile.user.name,
        available: entry.profile.availability === "open",
        fits: entry.profile.skills.some((item) => wanted.has(item.skillId)),
      };
    });
    return {
      id: pool.id,
      name: pool.name,
      updatedAt: pool.updatedAt,
      count: people.length,
      available: people.filter((person) => person.available).length,
      people: people.slice(0, 4),
      fits: people.filter((person) => person.fits).length,
    };
  });
  const best = offer && wanted.size > 0 ? [...shaped].sort((a, b) => b.fits - a.fits)[0] : null;
  return {
    pools: shaped,
    suggestion:
      best && best.fits > 0 && offer
        ? {
            poolId: best.id,
            poolName: best.name,
            count: best.fits,
            offerId: offer.id,
            offerTitle: offer.title,
          }
        : null,
  };
}
