/**
 * The interview practice on the phone (Modèle B, lot B6, planches Entretien-*): what the settings
 * need (the offer, the CV read, what the plan includes, the trial), the marks of a session and the
 * list « Mes simulations ». Plans are read from the database, never named (CLAUDE.md § 2).
 */
import type { InterviewSimMode, PrismaClient } from "@/generated/prisma/client";
import { resolvePlan } from "@/server/entitlements";
import {
  interviewAllowance,
  listInterviews,
  parseTurns,
  quotaKey,
  TRIAL_KEY,
  type InterviewTurn,
} from "./interview-sim";
import { offerKeywords, scoreSession } from "./interview-score";
import { cheapestPlanWithLimit, listPublicPlans } from "./plans";

/** Initials of a company for its square (« BF »). */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("fr"))
    .join("");

const jobSelect = {
  id: true,
  slug: true,
  title: true,
  skills: { select: { skill: { select: { name: true } } } },
  organization: { select: { name: true } },
} as const;

/** What the settings of a session show (planche Entretien). */
export async function phonePracticeSetup(
  db: PrismaClient,
  userId: string,
  input: { applicationId?: string | null; offer?: string | null },
  now = new Date(),
) {
  const application = input.applicationId
    ? await db.application.findFirst({
        where: { id: input.applicationId, profile: { userId } },
        select: {
          id: true,
          cvSnapshot: true,
          job: { select: jobSelect },
          interviews: {
            where: { status: "confirmed", startsAt: { gt: now } },
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true, timezone: true },
          },
        },
      })
    : null;
  const job =
    application?.job ??
    (input.offer
      ? await db.job.findFirst({
          where: { slug: input.offer, status: { in: ["published", "closed"] } },
          select: jobSelect,
        })
      : null);
  const profile = await db.talentProfile.findUnique({
    where: { userId },
    select: {
      headline: true,
      targetJob: true,
      experiences: {
        orderBy: { startDate: "desc" },
        take: 3,
        select: { title: true, company: true },
      },
      documents: {
        where: { kind: "cv" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { title: true },
      },
    },
  });
  const snapshot = (application?.cvSnapshot ?? null) as { title?: string } | null;
  const [text, voice, plan, plans] = await Promise.all([
    interviewAllowance(db, userId, "text", now),
    interviewAllowance(db, userId, "voice", now),
    resolvePlan(db, { type: "user", id: userId }, now),
    listPublicPlans(db),
  ]);
  const mode = (allowance: typeof text, value: InterviewSimMode) => ({
    included: allowance.included,
    /** The trial is still there this month (5 minutes). */
    trialLeft: allowance.trialLeft,
    /** The trial exists in the plan (it was used when `trialLeft` is false). */
    trial: !allowance.included && allowance.trial.limit !== 0,
    /** The cheapest plan that includes the mode, for « Dès … ». */
    plan:
      cheapestPlanWithLimit(
        plans.filter((item) => (item.priceCents ?? 0) > 0),
        "talent",
        quotaKey(value),
        1,
      )?.name ?? null,
  });
  return {
    job: job
      ? {
          id: job.id,
          title: job.title,
          company: job.organization.name,
          initials: initialsOf(job.organization.name),
          interview: application?.interviews[0] ?? null,
        }
      : null,
    applicationId: application?.id ?? null,
    jobTitle: job?.title ?? profile?.targetJob ?? profile?.headline ?? "",
    cv: snapshot?.title ?? profile?.documents[0]?.title ?? null,
    /** For the model: the last positions, titles and places only (no personal data). */
    profile: (profile?.experiences ?? [])
      .map((item) => `${item.title}, ${item.company}`)
      .join(" ; "),
    plan: plan?.planName ?? null,
    modes: { text: mode(text, "text"), voice: mode(voice, "voice") },
  };
}

/** The words of the offer a session's answers are compared with. */
export async function sessionKeywords(
  db: PrismaClient,
  session: { jobId: string | null; jobTitle: string },
) {
  const job = session.jobId
    ? await db.job.findUnique({ where: { id: session.jobId }, select: jobSelect })
    : null;
  return offerKeywords({
    title: job?.title ?? session.jobTitle,
    skills: job?.skills.map((item) => item.skill.name) ?? [],
    company: job?.organization.name ?? null,
  });
}

/** The marks of a session (null before any answer). */
export async function sessionScore(
  db: PrismaClient,
  session: {
    jobId: string | null;
    jobTitle: string;
    mode: InterviewSimMode;
    turns: InterviewTurn[];
  },
) {
  return scoreSession(session.turns, session.mode, await sessionKeywords(db, session));
}

/** « Mes simulations »: the sessions, newest first, with their mark when finished. */
export async function phoneHistory(db: PrismaClient, userId: string) {
  const sessions = await listInterviews(db, userId, 30);
  const full = await db.interviewSession.findMany({
    where: { id: { in: sessions.map((session) => session.id) } },
    select: {
      id: true,
      jobId: true,
      jobTitle: true,
      mode: true,
      questions: true,
      durationMinutes: true,
    },
  });
  const byId = new Map(full.map((session) => [session.id, session]));
  return Promise.all(
    sessions.map(async (session) => {
      const row = byId.get(session.id)!;
      const score =
        session.status === "completed"
          ? await sessionScore(db, { ...row, turns: parseTurns(row.questions) })
          : null;
      return {
        id: session.id,
        type: session.type,
        mode: session.mode,
        status: session.status,
        createdAt: session.createdAt,
        durationMinutes: row.durationMinutes,
        score: score?.overall ?? null,
      };
    }),
  );
}

export { TRIAL_KEY };
