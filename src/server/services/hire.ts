/**
 * Hire (docs/specifications.md, partie 07 § 4, partie 06 § 6.4). Every function takes the Hire
 * context of the active organization space and filters by `organizationId` (golden rule n° 6):
 * a job, an application or a stage of another organization is reported as not found.
 *
 * The AI recommends, the human decides (golden rule n° 3): nothing here rejects a candidate
 * automatically. A knockout criterion that is not met is only flagged.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type {
  ContractType,
  MembershipRole,
  Prisma,
  PrismaClient,
  RemoteMode,
  StageKind,
} from "@/generated/prisma/client";
import { level, limit } from "@/server/entitlements";
import { ensureStages } from "./applications";
import { slugify } from "./accounts";
import { findSkill } from "./profile";

export type HireContext = { userId: string; organizationId: string; role: MembershipRole };

export class HireError extends Error {
  constructor(readonly code: "forbidden" | "notFound" | "invalid") {
    super(code);
    this.name = "HireError";
  }
}

// ─── Permissions (partie 05 § 5) ─────────────────────────────────────────────────

const managers: MembershipRole[] = ["org_owner", "org_admin", "recruiter"];

export function hirePermissions(role: MembershipRole) {
  return {
    /** Create, edit, publish and close jobs; move candidates; write to them. */
    manage: managers.includes(role),
    /** Add notes on applications. */
    evaluate: [...managers, "hiring_manager"].includes(role),
    /** See applications (a viewer only sees dashboards). */
    readApplications: [...managers, "hiring_manager"].includes(role),
    /** Members, invitations, organization profile. */
    administer: role === "org_owner" || role === "org_admin",
  };
}

/**
 * The jobs a member may open (partie 05 § 5). Owners, administrators and viewers see every job of
 * the organization. A hiring manager only sees the jobs assigned to them. With
 * `org.permissions.level` « advanced », a recruiter who belongs to a team sees that team's jobs and
 * the jobs assigned to them; without a team, or below that level, every job.
 */
export async function jobScope(db: PrismaClient, ctx: HireContext): Promise<Prisma.JobWhereInput> {
  const base = { organizationId: ctx.organizationId };
  const assigned: Prisma.JobWhereInput[] = [
    { assignedToId: ctx.userId },
    { assignments: { some: { userId: ctx.userId } } },
  ];
  if (ctx.role === "hiring_manager") return { ...base, OR: assigned };
  if (ctx.role !== "recruiter") return base;
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: ctx.userId, organizationId: ctx.organizationId } },
    select: { teamId: true },
  });
  if (!membership?.teamId) return base;
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  if (permissions !== "advanced") return base;
  return {
    ...base,
    OR: [{ teamId: membership.teamId }, { createdById: ctx.userId }, ...assigned],
  };
}

function assert(condition: boolean): asserts condition {
  if (!condition) throw new HireError("forbidden");
}

// ─── Jobs ───────────────────────────────────────────────────────────────────────

export const contractTypes = [
  "cdi",
  "cdd",
  "stage",
  "alternance",
  "mission",
  "freelance",
  "volontariat",
] as const satisfies readonly ContractType[];
export const remoteModes = ["onsite", "hybrid", "remote"] as const satisfies readonly RemoteMode[];
export const KNOCKOUT_MAX = 5;
export const REQUIRED_SKILLS_MAX = 10;

/** Data that must never be a selection criterion (golden rule n° 4, partie 10 § 10.7). */
const protectedTerms =
  /\b(âge|age|ans? maximum|ans? minimum|homme|femme|genre|sexe|religion|religieu\w*|musulman\w*|chrétien\w*|catholique\w*|origine|ethni\w*|nationalit\w*|marié\w*|célibataire|enfants?|enceinte|grossesse|santé|handicap\w*|photo)\b/iu;
const paymentTerms =
  /\b(frais de (dossier|candidature|formation|inscription)|payer|paiement|versement|caution|mobile money|m-?pesa|orange money|airtel money)\b/iu;
const outsideContact = /(whats\s?app|telegram|\+?\d[\d .-]{8,}\d)/iu;

export function isProtectedCriterion(text: string) {
  return protectedTerms.test(text);
}

const lines = (max: number, length = 300) =>
  z
    .string()
    .default("")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean)
        .map((line) => line.slice(0, length)),
    )
    .pipe(z.array(z.string()).max(max, "tooMany"));

const money = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)])
  .transform((value) => (value === "" ? null : value * 100));

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(3, "required").max(120),
    contractType: z.enum(contractTypes),
    remote: z.enum(remoteModes),
    city: z.string().trim().min(1, "required").max(120),
    country: z.string().trim().min(1, "required").max(80),
    salaryMin: money,
    salaryMax: money,
    closesAt: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
      .transform((value) => (value ? new Date(`${value}T23:59:59Z`) : null)),
    description: z.string().trim().min(1, "required").max(8000),
    responsibilities: lines(20),
    requirements: lines(20),
    benefits: lines(15),
    experienceMin: z.coerce.number().int().min(0).max(40).default(0),
    requiredSkills: z.string().default(""),
    preferredSkills: z.string().default(""),
    knockout: lines(KNOCKOUT_MAX, 160),
    rejectionTemplate: z.string().trim().max(3000).default(""),
  })
  .superRefine((value, ctx) => {
    if (value.salaryMin !== null && value.salaryMax !== null && value.salaryMax < value.salaryMin) {
      ctx.addIssue({ code: "custom", path: ["salaryMax"], message: "salaryRange" });
    }
    if (value.knockout.some(isProtectedCriterion)) {
      ctx.addIssue({ code: "custom", path: ["knockout"], message: "forbidden" });
    }
  });

export type JobFormInput = z.input<typeof jobFormSchema>;

const skillNames = (value: string) =>
  [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, 20);

export type SaveJobResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string; field?: string; unknownSkills?: string[] };

async function uniqueSlug(db: PrismaClient, title: string, city: string) {
  const base = slugify(`${title} ${city}`).slice(0, 70) || "offre";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
    if (!(await db.job.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${randomBytes(6).toString("hex")}`;
}

/** Creates or updates a job as a draft (or keeps its status when it is already live). */
export async function saveJob(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  jobId?: string,
): Promise<SaveJobResult> {
  assert(hirePermissions(ctx.role).manage);
  const parsed = jobFormSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "invalid", field: String(issue?.path[0] ?? "") };
  }
  const input = parsed.data;
  const required = skillNames(input.requiredSkills);
  const preferred = skillNames(input.preferredSkills).filter((name) => !required.includes(name));
  if (required.length > REQUIRED_SKILLS_MAX)
    return { ok: false, error: "tooMany", field: "requiredSkills" };
  const resolved: { skillId: string; importance: "required" | "preferred" }[] = [];
  const unknown: string[] = [];
  for (const [names, importance] of [
    [required, "required"],
    [preferred, "preferred"],
  ] as const) {
    for (const name of names) {
      const skill = await findSkill(db, name);
      if (!skill) unknown.push(name);
      else if (!resolved.some((item) => item.skillId === skill.id))
        resolved.push({ skillId: skill.id, importance });
    }
  }
  if (unknown.length > 0)
    return { ok: false, error: "unknownSkills", field: "requiredSkills", unknownSkills: unknown };

  const data = {
    title: input.title,
    contractType: input.contractType,
    remote: input.remote,
    city: input.city,
    country: input.country,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    closesAt: input.closesAt,
    description: input.description,
    responsibilities: input.responsibilities,
    requirements: input.requirements,
    benefits: input.benefits,
    experienceMin: input.experienceMin,
    knockoutCriteria: input.knockout,
    rejectionTemplate: input.rejectionTemplate || null,
  } satisfies Prisma.JobUpdateInput;
  const skills = resolved.map((item) => ({
    skillId: item.skillId,
    importance: item.importance,
    weight: item.importance === "required" ? 4 : 2,
    minLevel: 2,
  }));

  if (jobId) {
    const job = await getOrgJob(db, ctx, jobId);
    if (job.status === "closed" || job.status === "archived") throw new HireError("invalid");
    // A live job edited with risky wording goes back to review, like at publication.
    const flags = job.status === "published" ? moderationFlags(data) : [];
    await db.$transaction([
      db.jobSkill.deleteMany({ where: { jobId: job.id } }),
      db.job.update({
        where: { id: job.id },
        data: {
          ...data,
          skills: { create: skills },
          ...(flags.length > 0 ? { status: "pending_review", moderationFlags: flags } : {}),
        },
      }),
    ]);
    return { ok: true, jobId: job.id };
  }
  const job = await db.job.create({
    data: {
      ...data,
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      slug: await uniqueSlug(db, input.title, input.city),
      status: "draft",
      skills: { create: skills },
    },
  });
  return { ok: true, jobId: job.id };
}

/** A job of the active organization, or HireError("notFound"). */
export async function getOrgJob(db: PrismaClient, ctx: HireContext, jobId: string) {
  const job = await db.job.findFirst({
    where: { AND: [{ id: jobId }, await jobScope(db, ctx)] },
    include: {
      skills: { include: { skill: { select: { name: true } } } },
      assignments: { select: { userId: true } },
    },
  });
  if (!job) throw new HireError("notFound");
  return job;
}

/** Statuses that hold a place in `jobs.active.max`. */
const activeStatuses = ["published", "pending_review"] as const;

export async function activeJobCount(db: PrismaClient, organizationId: string) {
  return db.job.count({ where: { organizationId, status: { in: [...activeStatuses] } } });
}

/** Automatic check before publication (partie 10 § 10.7). Each flag sends the job to review. */
export function moderationFlags(job: {
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}): string[] {
  const text = [
    job.title,
    job.description,
    ...job.responsibilities,
    ...job.requirements,
    ...job.benefits,
  ].join("\n");
  const flags: string[] = [];
  if (paymentTerms.test(text)) flags.push("payment");
  if (protectedTerms.test(text)) flags.push("discrimination");
  if (outsideContact.test(text)) flags.push("contactOutside");
  return flags;
}

export type PublishResult =
  | { status: "published" | "pending_review"; jobId: string }
  | { status: "limit"; max: number }
  | { status: "incomplete"; missing: "skills" | "description" };

/** Publication: within `jobs.active.max`, then automatic check, then online or in review. */
export async function publishJob(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  now = new Date(),
): Promise<PublishResult> {
  assert(hirePermissions(ctx.role).manage);
  const job = await getOrgJob(db, ctx, jobId);
  if (activeStatuses.includes(job.status as (typeof activeStatuses)[number])) {
    return { status: job.status as "published" | "pending_review", jobId: job.id };
  }
  if (!job.skills.some((skill) => skill.importance === "required"))
    return { status: "incomplete", missing: "skills" };
  const max = await limit(db, { type: "organization", id: ctx.organizationId }, "jobs.active.max");
  if (max >= 0 && (await activeJobCount(db, ctx.organizationId)) >= max)
    return { status: "limit", max };
  const flags = moderationFlags(job);
  // A job sent back for correction returns to a moderator, flagged or not (Admin v2, étape 7).
  const resubmitted = job.status === "changes_requested";
  const status = flags.length > 0 || resubmitted ? "pending_review" : "published";
  const stages = await ensureStages(db, job.id);
  await db.job.update({
    where: { id: job.id },
    data: {
      status,
      moderationFlags: flags,
      moderationReason: null,
      moderationChecks: [],
      publishedAt: status === "published" ? (job.publishedAt ?? now) : job.publishedAt,
      process:
        job.process.length > 0
          ? job.process
          : stages.filter((s) => s.kind !== "rejected").map((s) => s.name),
    },
  });
  await audit(db, ctx, resubmitted ? "job.resubmit" : "job.publish", job.id, { status, flags });
  return { status, jobId: job.id };
}

export async function closeJob(db: PrismaClient, ctx: HireContext, jobId: string) {
  assert(hirePermissions(ctx.role).manage);
  const job = await getOrgJob(db, ctx, jobId);
  await db.job.update({ where: { id: job.id }, data: { status: "closed" } });
  await audit(db, ctx, "job.close", job.id);
}

/** « Dupliquer » (mockup 04-02): the same job as a new draft, without candidates nor pipeline. */
export async function duplicateJob(db: PrismaClient, ctx: HireContext, jobId: string) {
  assert(hirePermissions(ctx.role).manage);
  const job = await getOrgJob(db, ctx, jobId);
  const copy = await db.job.create({
    data: {
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      slug: await uniqueSlug(db, job.title, job.city),
      status: "draft",
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      benefits: job.benefits,
      contractType: job.contractType,
      city: job.city,
      country: job.country,
      remote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceMin: job.experienceMin,
      educationLevelMin: job.educationLevelMin,
      languagesRequired: job.languagesRequired ?? [],
      knockoutCriteria: job.knockoutCriteria ?? [],
      rejectionTemplate: job.rejectionTemplate,
      scorecardTemplate: job.scorecardTemplate ?? [],
      assignedToId: job.assignedToId,
      teamId: job.teamId,
      departmentId: job.departmentId,
      entityId: job.entityId,
      skills: {
        create: job.skills.map((skill) => ({
          skillId: skill.skillId,
          importance: skill.importance,
          weight: skill.weight,
          minLevel: skill.minLevel,
        })),
      },
    },
  });
  await audit(db, ctx, "job.duplicate", copy.id, { from: job.id });
  return copy.id;
}

export async function deleteDraft(db: PrismaClient, ctx: HireContext, jobId: string) {
  assert(hirePermissions(ctx.role).manage);
  const job = await getOrgJob(db, ctx, jobId);
  if (job.status !== "draft" && job.status !== "rejected") throw new HireError("invalid");
  await db.job.delete({ where: { id: job.id } });
}

export async function listOrgJobs(db: PrismaClient, ctx: HireContext) {
  return db.job.findMany({
    where: { AND: [await jobScope(db, ctx), { status: { not: "archived" } }] },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      _count: { select: { applications: true } },
      applications: { where: { viewedAt: null, status: "active" }, select: { id: true } },
      assignedTo: { select: { name: true } },
      team: { select: { name: true } },
      department: { select: { name: true } },
      entity: { select: { name: true } },
    },
  });
}

// ─── Pipeline and applications ──────────────────────────────────────────────────

const candidateSelect = {
  id: true,
  headline: true,
  matchingEnabled: true,
  user: {
    select: { id: true, name: true, firstName: true, lastName: true, city: true, country: true },
  },
} satisfies Prisma.TalentProfileSelect;

export async function getPipeline(db: PrismaClient, ctx: HireContext, jobId: string) {
  assert(hirePermissions(ctx.role).readApplications);
  const job = await getOrgJob(db, ctx, jobId);
  const stages = await ensureStages(db, job.id);
  const applications = await db.application.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "asc" },
    include: { profile: { select: candidateSelect } },
  });
  return { job, stages, applications };
}

/** An application to a job of the active organization, or HireError("notFound"). */
export async function getOrgApplication(db: PrismaClient, ctx: HireContext, applicationId: string) {
  assert(hirePermissions(ctx.role).readApplications);
  const application = await db.application.findFirst({
    where: { id: applicationId, job: await jobScope(db, ctx) },
    include: {
      job: {
        include: {
          stages: { orderBy: { order: "asc" } },
          organization: { select: { name: true } },
          skills: { include: { skill: { select: { name: true } } } },
        },
      },
      stage: true,
      events: { orderBy: { createdAt: "asc" } },
      conversation: { select: { id: true } },
      profile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              city: true,
              country: true,
            },
          },
          experiences: {
            orderBy: [{ endDate: { sort: "desc", nulls: "first" } }, { startDate: "desc" }],
          },
          educations: { orderBy: [{ endYear: { sort: "desc", nulls: "first" } }] },
          skills: { include: { skill: { select: { name: true } } }, orderBy: { level: "desc" } },
        },
      },
    },
  });
  if (!application) throw new HireError("notFound");
  return application;
}

/**
 * Opening an application: the consultation is logged (golden rule n° 5) and the talent sees
 * « Consultée par le recruteur ».
 */
export async function recordView(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  now = new Date(),
) {
  const application = await getOrgApplication(db, ctx, applicationId);
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "profile.view",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: ctx.organizationId,
      metadata: { applicationId },
    },
  });
  if (!application.viewedAt) {
    await db.application.update({
      where: { id: application.id },
      data: { viewedAt: now, events: { create: { actorId: ctx.userId, type: "viewed" } } },
    });
  }
  return application;
}

const statusOfStage = (kind: StageKind) =>
  kind === "rejected" ? "rejected" : kind === "hired" ? "hired" : "active";

export type MoveResult = {
  applicationId: string;
  talentUserId: string;
  from: { name: string; kind: StageKind };
  to: { name: string; kind: StageKind };
  jobTitle: string;
};

/** A human moves a candidate to another stage; the event keeps who, when, from and to. */
export async function moveApplication(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  stageId: string,
  extra: Prisma.InputJsonObject = {},
): Promise<MoveResult | null> {
  assert(hirePermissions(ctx.role).manage);
  const application = await getOrgApplication(db, ctx, applicationId);
  if (application.status === "withdrawn") throw new HireError("invalid");
  const stage = application.job.stages.find((item) => item.id === stageId);
  if (!stage) throw new HireError("notFound");
  if (stage.id === application.stageId) return null;
  await db.application.update({
    where: { id: application.id },
    data: {
      stageId: stage.id,
      status: statusOfStage(stage.kind),
      events: {
        create: {
          actorId: ctx.userId,
          type: stage.kind === "rejected" || stage.kind === "hired" ? "decision" : "stage_changed",
          payload: { from: application.stage.name, to: stage.name, toKind: stage.kind, ...extra },
        },
      },
    },
  });
  return {
    applicationId: application.id,
    talentUserId: application.profile.user.id,
    from: { name: application.stage.name, kind: application.stage.kind },
    to: { name: stage.name, kind: stage.kind },
    jobTitle: application.job.title,
  };
}

export const rejectReasons = [
  "skills",
  "experience",
  "knockout",
  "otherCandidate",
  "withdrawn",
  "positionClosed",
  "other",
] as const;

/** « Ne pas retenir »: an explicit human decision, with an internal reason and an optional message. */
export async function rejectApplication(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  input: { reason: (typeof rejectReasons)[number]; message: string },
) {
  const application = await getOrgApplication(db, ctx, applicationId);
  const rejected = application.job.stages.find((stage) => stage.kind === "rejected");
  if (!rejected) throw new HireError("invalid");
  return moveApplication(db, ctx, application.id, rejected.id, {
    reason: input.reason,
    messageSent: input.message.trim().length > 0,
  });
}

/** « Retenir » (prompt 5): an explicit human decision, like a refusal, sent after a preview. */
export async function hireApplication(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  input: { messageSent: boolean },
) {
  const application = await getOrgApplication(db, ctx, applicationId);
  const hired = application.job.stages.find((stage) => stage.kind === "hired");
  if (!hired) throw new HireError("invalid");
  return moveApplication(db, ctx, application.id, hired.id, { messageSent: input.messageSent });
}

export async function addNote(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  body: string,
) {
  assert(hirePermissions(ctx.role).evaluate);
  const application = await getOrgApplication(db, ctx, applicationId);
  const text = body.trim().slice(0, 2000);
  if (!text) throw new HireError("invalid");
  await db.applicationEvent.create({
    data: {
      applicationId: application.id,
      actorId: ctx.userId,
      type: "note",
      payload: { body: text },
    },
  });
}

/** Counts for the dashboard, all scoped to the organization. */
/** Response time the dashboard compares to (« Objectif 2 j », mockup 04-01). */
export const RESPONSE_GOAL_DAYS = 2;
/** Days after which a new application counts as waiting for an answer. */
export const WAITING_DAYS = 5;

/**
 * What the Hire dashboard shows (partie 07 § 4, mockup 04-01): active jobs with the spread of their
 * candidates over the steps, what needs an action, and a few key figures. Everything is limited to
 * the jobs the member can see (`jobScope`).
 */
export async function hireDashboard(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const scope = await jobScope(db, ctx);
  const where = { job: scope };
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const waitingSince = new Date(now.getTime() - WAITING_DAYS * 86_400_000);
  const quarterAgo = new Date(now.getTime() - 90 * 86_400_000);
  const [jobs, applications, thisWeek, unseenRows, waitingRows, scores, answered] =
    await Promise.all([
      db.job.findMany({
        where: { AND: [scope, { status: { in: [...activeStatuses] } }] },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { applications: true } },
          applications: {
            where: { status: "active" },
            select: { viewedAt: true, stage: { select: { kind: true } } },
          },
        },
      }),
      db.application.count({ where }),
      db.application.count({ where: { ...where, createdAt: { gte: weekAgo } } }),
      db.application.findMany({
        where: { ...where, viewedAt: null, status: "active" },
        select: { job: { select: { id: true, title: true } } },
      }),
      db.application.findMany({
        where: {
          ...where,
          status: "active",
          stage: { kind: "new" },
          createdAt: { lt: waitingSince },
        },
        select: { job: { select: { id: true, title: true } } },
      }),
      db.application.findMany({
        where: { ...where, status: "active", matchScore: { not: null } },
        select: { matchScore: true },
      }),
      // First answer of the team (a step change or a decision) to the recent applications.
      db.application.findMany({
        where: { ...where, createdAt: { gte: quarterAgo } },
        select: {
          createdAt: true,
          events: {
            where: { type: { in: ["stage_changed", "decision"] } },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
    ]);
  const delays = answered
    .filter((row) => row.events[0])
    .map((row) => (row.events[0]!.createdAt.getTime() - row.createdAt.getTime()) / 86_400_000);
  const values = scores.map((row) => row.matchScore!).sort((a, b) => b - a);
  const mean = (list: number[]) =>
    list.length ? Math.round(list.reduce((sum, value) => sum + value, 0) / list.length) : null;
  const jobsOf = (rows: { job: { id: string; title: string } }[]) => {
    const seen = new Map<string, string>();
    for (const row of rows) seen.set(row.job.id, row.job.title);
    return [...seen].map(([id, title]) => ({ id, title }));
  };
  return {
    jobs: jobs.map(({ applications: active, ...job }) => ({
      ...job,
      unseen: active.filter((item) => !item.viewedAt).length,
      stages: stageKinds.map((kind) => ({
        kind,
        count: active.filter((item) => item.stage.kind === kind).length,
      })),
    })),
    applications,
    thisWeek,
    unseen: unseenRows.length,
    unseenJobs: jobsOf(unseenRows),
    waiting: waitingRows.length,
    waitingJobs: jobsOf(waitingRows),
    /** Average days before the team's first answer, one decimal; null without any answer yet. */
    responseDays: delays.length
      ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10
      : null,
    compatibility: { average: mean(values), top: mean(values.slice(0, 10)) },
  };
}

/** Steps shown in the dashboard bars and the pipeline columns, in order (no « Non retenu »). */
export const stageKinds = ["new", "screening", "test", "interview", "offer", "hired"] as const;

async function audit(
  db: PrismaClient,
  ctx: HireContext,
  action: string,
  targetId: string,
  metadata: Prisma.InputJsonObject = {},
) {
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action,
      targetType: "job",
      targetId,
      organizationId: ctx.organizationId,
      metadata,
    },
  });
}

/**
 * What the pipeline cards and figures show beyond the applications (mockup 04-04): the skills a
 * candidate shares with the job, a Jumanly attestation, the team notes and ratings, the next
 * interview, and the job's figures. Never a filter: every application stays in its column.
 */
export async function pipelineDetails(
  db: PrismaClient,
  ctx: HireContext,
  job: { id: string },
  applications: { id: string; profileId: string; createdAt: Date; matchScore: number | null }[],
  now = new Date(),
) {
  assert(hirePermissions(ctx.role).readApplications);
  const ids = applications.map((application) => application.id);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const [jobSkills, skills, notes, scorecards, interviews, answered] = await Promise.all([
    db.jobSkill.findMany({ where: { jobId: job.id }, select: { skillId: true } }),
    db.profileSkill.findMany({
      where: { profileId: { in: applications.map((application) => application.profileId) } },
      orderBy: { level: "desc" },
      select: { profileId: true, skillId: true, verified: true, skill: { select: { name: true } } },
    }),
    db.applicationEvent.groupBy({
      by: ["applicationId"],
      where: { applicationId: { in: ids }, type: "note" },
      _count: { _all: true },
    }),
    db.scorecard.findMany({
      where: { applicationId: { in: ids } },
      select: { applicationId: true, ratings: true },
    }),
    db.interview.findMany({
      where: {
        applicationId: { in: ids },
        organizationId: ctx.organizationId,
        status: "confirmed",
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      select: { applicationId: true, startsAt: true },
    }),
    db.applicationEvent.findMany({
      where: { applicationId: { in: ids }, type: { in: ["stage_changed", "decision"] } },
      orderBy: { createdAt: "asc" },
      select: { applicationId: true, createdAt: true },
    }),
  ]);
  const wanted = new Set(jobSkills.map((item) => item.skillId));
  const cards = new Map<
    string,
    {
      skills: string[];
      certified: boolean;
      notes: number;
      rating: number | null;
      interviewAt: Date | null;
    }
  >();
  for (const application of applications) {
    const own = skills.filter((item) => item.profileId === application.profileId);
    const shared = own.filter((item) => wanted.has(item.skillId));
    const ratings = scorecards
      .filter((card) => card.applicationId === application.id)
      .flatMap((card) => (Array.isArray(card.ratings) ? card.ratings : []))
      .map((item) =>
        item && typeof item === "object" && !Array.isArray(item) ? Number(item.rating) : NaN,
      )
      .filter((value) => value >= 1 && value <= 5);
    cards.set(application.id, {
      skills: (shared.length ? shared : own).slice(0, 2).map((item) => item.skill.name),
      certified: shared.some((item) => item.verified),
      notes: notes.find((row) => row.applicationId === application.id)?._count._all ?? 0,
      rating: ratings.length
        ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length)
        : null,
      interviewAt: interviews.find((row) => row.applicationId === application.id)?.startsAt ?? null,
    });
  }
  const delays = applications.flatMap((application) => {
    const first = answered.find((row) => row.applicationId === application.id);
    return first
      ? [(first.createdAt.getTime() - application.createdAt.getTime()) / 86_400_000]
      : [];
  });
  return {
    cards,
    thisWeek: applications.filter((application) => application.createdAt >= weekAgo).length,
    responseDays: delays.length
      ? Math.round((delays.reduce((a, b) => a + b, 0) / delays.length) * 10) / 10
      : null,
    interviews: interviews.length,
    interviewsThisWeek: interviews.filter((row) => row.startsAt! < weekAhead).length,
  };
}
