/**
 * Interviews of the recruiter redesign, lot 4 (brief recruteur § 4 item 4, planches r2plus PROG,
 * PROG2, INV_AP, AGENDA, PREP_R, EVAL): what the planner needs (the team and its busy days from
 * the interviews in Jumanly), the answer to a candidate who asked for another time, the team's own
 * questions, the interviews still to evaluate. Orbi's questions and checks are computed from the
 * offer and the file, never stored, and only shown: the member decides what to ask.
 * Every query is filtered by `organizationId` and by the jobs the member may see.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { addDays, busyByDay, zoned, type BusyBlock } from "@/lib/interview-calendar";
import { skillProofs } from "./cv-analysis";
import {
  getOrgApplication,
  hirePermissions,
  HireError,
  isProtectedCriterion,
  jobScope,
  type HireContext,
} from "./hire";
import { notify } from "./notifications";

const orgSubject = (ctx: HireContext) => ({
  type: "organization" as const,
  id: ctx.organizationId,
});

/** How far ahead the planner shows the team's days. */
export const PLANNER_DAYS = 62;
export const QUESTIONS_MAX = 12;

/** Members of the organization who recruit (the participants one may invite). */
export async function recruitingMembers(db: PrismaClient, ctx: HireContext) {
  const members = await db.membership.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: "active",
      role: { in: ["org_owner", "org_admin", "recruiter", "hiring_manager"] },
    },
    orderBy: { createdAt: "asc" },
    select: { userId: true, user: { select: { name: true, firstName: true } } },
  });
  return members.map((member) => ({
    id: member.userId,
    name: member.user.name,
    firstName: member.user.firstName || member.user.name.split(/\s+/)[0]!,
  }));
}

/**
 * « Proposer un entretien »: the application, the members one may invite (all of them with
 * `hire.collaboration`, else the member alone) and the busy blocks of each day ahead, read from
 * the organization's interviews (confirmed ones, and slots still proposed to a candidate).
 */
export async function plannerData(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  timeZone: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  const subject = orgSubject(ctx);
  const [enabled, collaboration, all] = await Promise.all([
    can(db, subject, "connect.appointments"),
    can(db, subject, "hire.collaboration"),
    recruitingMembers(db, ctx),
  ]);
  const members = collaboration ? all : all.filter((member) => member.id === ctx.userId);
  const ids = members.map((member) => member.id);
  const today = zoned(now, timeZone).key;
  const until = new Date(now.getTime() + (PLANNER_DAYS + 1) * 86_400_000);
  const interviews = await db.interview.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: { in: ["pending", "confirmed"] },
      OR: [{ organizerId: { in: ids } }, { participantIds: { hasSome: ids } }],
      AND: [
        {
          OR: [
            { startsAt: { gte: new Date(now.getTime() - 86_400_000), lt: until } },
            { status: "pending" },
          ],
        },
      ],
    },
    take: 500,
    select: {
      organizerId: true,
      participantIds: true,
      status: true,
      startsAt: true,
      slots: true,
      durationMinutes: true,
    },
  });
  const byDay = busyByDay(interviews, timeZone);
  const busy: Record<string, BusyBlock[]> = {};
  for (let index = 0; index <= PLANNER_DAYS; index += 1) {
    const key = addDays(today, index);
    const blocks = byDay.get(key);
    if (blocks)
      busy[key] = blocks
        .map((block) => ({ ...block, userIds: block.userIds.filter((id) => ids.includes(id)) }))
        .filter((block) => block.userIds.length > 0);
  }
  return {
    application,
    enabled,
    collaboration,
    members,
    busy,
    today,
    nowMinutes: zoned(now, timeZone).minutes,
  };
}

const interviewInclude = {
  organizer: { select: { name: true } },
  organization: { select: { name: true } },
  application: {
    select: {
      id: true,
      jobId: true,
      profileId: true,
      job: { select: { id: true, title: true } },
      profile: { select: { user: { select: { id: true, name: true, firstName: true } } } },
      conversation: { select: { id: true } },
    },
  },
} satisfies Prisma.InterviewInclude;

/** One interview of a job the member may see (participants who only evaluate read it too). */
export async function readInterview(db: PrismaClient, ctx: HireContext, interviewId: string) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const interview = await db.interview.findFirst({
    where: {
      id: interviewId,
      organizationId: ctx.organizationId,
      application: { job: await jobScope(db, ctx) },
    },
    include: interviewInclude,
  });
  if (!interview) throw new HireError("notFound");
  return interview;
}

/**
 * « Accepter » the time a candidate proposed instead (« Autre date »): the interview is confirmed
 * at that time, the talent is told. Only a time the talent wrote can be accepted.
 */
export async function acceptProposedSlot(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  slot: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const interview = await readInterview(db, ctx, interviewId);
  if (interview.status !== "reschedule") throw new HireError("invalid");
  const chosen = interview.proposedSlots.find((item) => item.toISOString() === slot);
  if (!chosen || chosen <= now) throw new HireError("invalid");
  const moved = await db.interview.updateMany({
    where: { id: interview.id, organizationId: ctx.organizationId, status: "reschedule" },
    data: { status: "confirmed", startsAt: chosen, slots: [chosen], proposedSlots: [] },
  });
  if (moved.count === 0) throw new HireError("invalid");
  await notify(db, {
    userIds: [interview.application.profile.user.id],
    type: "interviewAccepted",
    payload: { company: interview.organization.name, jobTitle: interview.application.job.title },
    href: `/app/suivi/${interview.application.id}`,
  });
  return chosen;
}

const questionSchema = z.object({ id: z.string(), text: z.string(), authorId: z.string() });
export type OwnQuestion = z.infer<typeof questionSchema>;

export const questionsOf = (value: Prisma.JsonValue) =>
  z.array(questionSchema).catch([]).parse(value);

/**
 * « Ajouter » a question of the team to prepare the interview. A question about the private life
 * (age, family, health, religion, origin…) is refused: the same protected terms as the offer.
 */
export async function addInterviewQuestion(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  text: string,
): Promise<"added" | "protected" | "invalid" | "full"> {
  if (!hirePermissions(ctx.role).evaluate) throw new HireError("forbidden");
  const interview = await readInterview(db, ctx, interviewId);
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 300);
  if (clean.length < 5) return "invalid";
  if (isProtectedCriterion(clean)) return "protected";
  const questions = questionsOf(interview.questions);
  if (questions.length >= QUESTIONS_MAX) return "full";
  await db.interview.update({
    where: { id: interview.id },
    data: { questions: [...questions, { id: randomUUID(), text: clean, authorId: ctx.userId }] },
  });
  return "added";
}

/** Only its author removes a question. */
export async function removeInterviewQuestion(
  db: PrismaClient,
  ctx: HireContext,
  interviewId: string,
  questionId: string,
) {
  if (!hirePermissions(ctx.role).evaluate) throw new HireError("forbidden");
  const interview = await readInterview(db, ctx, interviewId);
  const questions = questionsOf(interview.questions);
  const own = questions.find((item) => item.id === questionId && item.authorId === ctx.userId);
  if (!own) throw new HireError("notFound");
  await db.interview.update({
    where: { id: interview.id },
    data: { questions: questions.filter((item) => item.id !== own.id) },
  });
}

export type ProposedQuestion = {
  skill: string;
  kind: "project" | "certificate" | "experience" | "declared" | "missing";
  required: boolean;
  /** « à vérifier »: declared without proof, or not in the profile. */
  check: boolean;
};

/**
 * Orbi's questions (planche PREP_R): one per skill of the offer, the required ones first, worded
 * from what the file proves. Only about the skills of the offer, never about the private life.
 */
export function proposedQuestions(
  application: Parameters<typeof skillProofs>[0],
  max = 3,
): ProposedQuestion[] {
  return skillProofs(application)
    .sort(
      (a, b) =>
        Number(b.required) - Number(a.required) ||
        Number(a.proof === "missing") - Number(b.proof === "missing"),
    )
    .slice(0, max)
    .map((item) => ({
      skill: item.name,
      kind: item.proof,
      required: item.required,
      check: item.proof === "declared" || item.proof === "missing",
    }));
}

/**
 * Interviews whose time has passed and that the member took part in, without their evaluation
 * yet (« À évaluer »).
 */
export async function interviewsToEvaluate(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  return db.interview.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: { in: ["confirmed", "done"] },
      startsAt: { lt: now },
      OR: [{ organizerId: ctx.userId }, { participantIds: { has: ctx.userId } }],
      application: {
        job: await jobScope(db, ctx),
        scorecards: { none: { reviewerId: ctx.userId } },
      },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
    include: interviewInclude,
  });
}

/** Active applications one may invite (the « + » of Entretiens). */
export async function invitableApplications(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  return db.application.findMany({
    where: { status: "active", job: await jobScope(db, ctx) },
    orderBy: { updatedAt: "desc" },
    take: 60,
    select: {
      id: true,
      job: { select: { title: true } },
      stage: { select: { name: true } },
      profile: { select: { user: { select: { name: true } } } },
    },
  });
}
