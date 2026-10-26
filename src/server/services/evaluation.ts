/**
 * Evaluation of an application by the team (E8): scorecards (`hire.scorecards`), shared notes with
 * mentions (`hire.collaboration`) and the decision history (`hire.decision_history`). A reviewer
 * only sees the others' scorecards after sending their own, so as not to be influenced.
 */
import { z } from "zod";
import type { Prisma, PrismaClient, ScorecardRecommendation } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { getOrgApplication, getOrgJob, hirePermissions, HireError, type HireContext } from "./hire";
import { notify } from "./notifications";

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

export const SCORECARD_CRITERIA_MAX = 10;
export const recommendations = [
  "strong_yes",
  "yes",
  "no",
  "strong_no",
  "maybe",
] as const satisfies readonly ScorecardRecommendation[];

/** « Suite proposée » of the evaluation (planche r2plus EVAL), in the order of the planche. */
export const nextSteps = ["no", "yes", "maybe"] as const;
export type NextStep = (typeof nextSteps)[number];
/** The older, stronger recommendations read as the closest « Suite proposée ». */
export const nextStepOf = (value: string): NextStep =>
  value === "strong_yes" || value === "yes" ? "yes" : value === "maybe" ? "maybe" : "no";

/** Each criterion is rated from 1 to 4 (planche r2plus EVAL). */
export const RATING_MAX = 4;

export type ScorecardCriterion = { name: string; description: string };

const criteriaSchema = z.array(z.object({ name: z.string(), description: z.string().default("") }));

/** A list of criteria as stored (job or organization), or an empty list. */
export function storedCriteria(value: Prisma.JsonValue | undefined): ScorecardCriterion[] {
  const parsed = criteriaSchema.safeParse(value ?? null);
  return parsed.success ? parsed.data : [];
}

/**
 * The criteria of a job's scorecard: its own grid; else the organization's interview grid
 * (Réglages du recrutement, étape 3, A5); else its required skills.
 */
export function scorecardCriteria(
  job: {
    scorecardTemplate: Prisma.JsonValue;
    skills: { importance: string; skill: { name: string } }[];
  },
  organizationCriteria?: Prisma.JsonValue,
): ScorecardCriterion[] {
  const own = storedCriteria(job.scorecardTemplate);
  if (own.length > 0) return own;
  const organization = storedCriteria(organizationCriteria);
  if (organization.length > 0) return organization;
  return job.skills
    .filter((skill) => skill.importance === "required")
    .slice(0, 5)
    .map((skill) => ({ name: skill.skill.name, description: "" }));
}

/** One criterion per line, « Nom : ce que vous observez ». */
export function parseTemplate(text: string): ScorecardCriterion[] | null {
  const criteria = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(":");
      return {
        name: (name ?? "").trim().slice(0, 80),
        description: rest.join(":").trim().slice(0, 200),
      };
    })
    .filter((item) => item.name.length >= 2);
  if (criteria.length === 0 || criteria.length > SCORECARD_CRITERIA_MAX) return null;
  return criteria;
}

export async function saveScorecardTemplate(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  text: string,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!(await can(db, orgSubject(ctx), "hire.scorecards"))) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const criteria = parseTemplate(text);
  if (!criteria) throw new HireError("invalid");
  await db.job.update({ where: { id: job.id }, data: { scorecardTemplate: criteria } });
}

const scorecardSchema = z.object({
  recommendation: z.enum(recommendations),
  comment: z.string().trim().max(2000).default(""),
  ratings: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        rating: z.coerce.number().int().min(1).max(RATING_MAX),
        comment: z.string().trim().max(500).default(""),
      }),
    )
    .min(1)
    .max(SCORECARD_CRITERIA_MAX),
});

/** A reviewer sends (or updates) their evaluation. Recorded in the decision history. */
export async function submitScorecard(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  raw: z.input<typeof scorecardSchema>,
) {
  if (!hirePermissions(ctx.role).evaluate) throw new HireError("forbidden");
  if (!(await can(db, orgSubject(ctx), "hire.scorecards"))) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  const parsed = scorecardSchema.safeParse(raw);
  if (!parsed.success) throw new HireError("invalid");
  const data = {
    ratings: parsed.data.ratings,
    recommendation: parsed.data.recommendation,
    comment: parsed.data.comment || null,
  };
  await db.scorecard.upsert({
    where: { applicationId_reviewerId: { applicationId: application.id, reviewerId: ctx.userId } },
    update: data,
    create: { applicationId: application.id, reviewerId: ctx.userId, ...data },
  });
  await db.applicationEvent.create({
    data: { applicationId: application.id, actorId: ctx.userId, type: "rated" },
  });
  // « Évaluation enregistrée » in the administrator's consultation log (étape 3, A5).
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "scorecard.save",
      targetType: "talentProfile",
      targetId: application.profileId,
      organizationId: ctx.organizationId,
      metadata: { applicationId: application.id },
    },
  });
}

export type ScorecardView = {
  mine: {
    ratings: { name: string; rating: number; comment: string }[];
    recommendation: string;
    comment: string | null;
  } | null;
  /** The others' scorecards, only once the viewer has sent their own (or cannot evaluate). */
  others: {
    reviewerName: string;
    recommendation: string;
    average: number;
    comment: string | null;
    ratings: { name: string; rating: number; comment: string }[];
  }[];
  hidden: boolean;
  average: number | null;
  count: number;
  /** Members of the job's hiring team who have not evaluated yet. */
  pending: string[];
};

const ratingsOf = (value: Prisma.JsonValue) =>
  z
    .array(z.object({ name: z.string(), rating: z.number(), comment: z.string().default("") }))
    .catch([])
    .parse(value);

const averageOf = (ratings: { rating: number }[]) =>
  ratings.length === 0 ? 0 : ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;

export async function scorecardView(
  db: PrismaClient,
  ctx: HireContext,
  application: { id: string; job: { id: string; assignedToId: string | null } },
): Promise<ScorecardView> {
  const [cards, assignments] = await Promise.all([
    db.scorecard.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
      include: { reviewer: { select: { name: true } } },
    }),
    db.jobAssignment.findMany({
      where: { jobId: application.job.id },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);
  const own = cards.find((card) => card.reviewerId === ctx.userId) ?? null;
  const hidden = !own && hirePermissions(ctx.role).evaluate;
  const averages = cards.map((card) => averageOf(ratingsOf(card.ratings)));
  const reviewers = new Set(cards.map((card) => card.reviewerId));
  return {
    mine: own
      ? {
          ratings: ratingsOf(own.ratings),
          recommendation: own.recommendation,
          comment: own.comment,
        }
      : null,
    others: hidden
      ? []
      : cards
          .filter((card) => card.reviewerId !== ctx.userId)
          .map((card) => ({
            reviewerName: card.reviewer.name,
            recommendation: card.recommendation,
            average: Math.round(averageOf(ratingsOf(card.ratings)) * 10) / 10,
            comment: card.comment,
            ratings: ratingsOf(card.ratings),
          })),
    hidden,
    average:
      hidden || cards.length === 0
        ? null
        : Math.round((averages.reduce((sum, value) => sum + value, 0) / cards.length) * 10) / 10,
    count: cards.length,
    pending: assignments
      .filter((item) => !reviewers.has(item.userId))
      .map((item) => item.user.name),
  };
}

/** Scorecards a member still owes: applications in an interview stage of jobs assigned to them. */
export async function scorecardsToComplete(db: PrismaClient, ctx: HireContext) {
  return db.application.count({
    where: {
      status: "active",
      stage: { kind: { in: ["interview", "offer"] } },
      job: {
        organizationId: ctx.organizationId,
        OR: [{ assignedToId: ctx.userId }, { assignments: { some: { userId: ctx.userId } } }],
      },
      scorecards: { none: { reviewerId: ctx.userId } },
    },
  });
}

// ─── Notes and mentions ────────────────────────────────────────────────────────

/**
 * Notes of the team. With `hire.collaboration` every member of the job sees them; without it, each
 * member only sees their own notes (« Notes partagées entre recruteurs » is a plan feature).
 */
export async function visibleNotes<T extends { type: string; actorId: string | null }>(
  db: PrismaClient,
  ctx: HireContext,
  events: T[],
) {
  const shared = await can(db, orgSubject(ctx), "hire.collaboration");
  return events.filter(
    (event) => event.type === "note" && (shared || event.actorId === ctx.userId),
  );
}

/** Members named with « @Prénom » or « @Prénom Nom » in a note. */
export function mentionedIds(
  body: string,
  members: { userId: string; name: string; firstName: string | null }[],
  authorId: string,
) {
  const text = body.toLocaleLowerCase("fr");
  return members
    .filter((member) => member.userId !== authorId)
    .filter((member) =>
      [member.name, member.firstName ?? ""]
        .filter((name) => name.trim().length >= 2)
        .some((name) => text.includes(`@${name.toLocaleLowerCase("fr")}`)),
    )
    .map((member) => member.userId);
}

/** Adds a note; with `hire.collaboration`, mentioned colleagues are told. */
export async function addTeamNote(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  body: string,
) {
  if (!hirePermissions(ctx.role).evaluate) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  const text = body.trim().slice(0, 2000);
  if (!text) throw new HireError("invalid");
  const collaboration = await can(db, orgSubject(ctx), "hire.collaboration");
  let mentions: string[] = [];
  if (collaboration && text.includes("@")) {
    const members = await db.membership.findMany({
      where: {
        organizationId: ctx.organizationId,
        status: "active",
        role: { in: ["org_owner", "org_admin", "recruiter", "hiring_manager"] },
      },
      select: { userId: true, user: { select: { name: true, firstName: true } } },
    });
    mentions = mentionedIds(
      text,
      members.map((member) => ({ userId: member.userId, ...member.user })),
      ctx.userId,
    );
  }
  await db.applicationEvent.create({
    data: {
      applicationId: application.id,
      actorId: ctx.userId,
      type: "note",
      payload: { body: text, mentions },
    },
  });
  const author = await db.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { name: true },
  });
  await notify(db, {
    userIds: mentions,
    type: "mention",
    payload: { memberName: author.name, candidateName: application.profile.user.name },
    href: `/app/hire/candidats/${application.id}#notes`,
  });
  return mentions;
}

async function ownNote(db: PrismaClient, ctx: HireContext, noteId: string) {
  const note = await db.applicationEvent.findFirst({
    where: {
      id: noteId,
      type: "note",
      actorId: ctx.userId,
      application: { job: { organizationId: ctx.organizationId } },
    },
  });
  if (!note) throw new HireError("notFound");
  return note;
}

/** Only the author edits or deletes a note. */
export async function editNote(db: PrismaClient, ctx: HireContext, noteId: string, body: string) {
  const note = await ownNote(db, ctx, noteId);
  const text = body.trim().slice(0, 2000);
  if (!text) throw new HireError("invalid");
  const payload = (note.payload ?? {}) as Prisma.JsonObject;
  await db.applicationEvent.update({
    where: { id: note.id },
    data: { payload: { ...payload, body: text, editedAt: new Date().toISOString() } },
  });
}

export async function deleteNote(db: PrismaClient, ctx: HireContext, noteId: string) {
  const note = await ownNote(db, ctx, noteId);
  await db.applicationEvent.delete({ where: { id: note.id } });
}
