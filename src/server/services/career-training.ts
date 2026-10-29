/**
 * « Mes entraînements » of Carrière › Progression (demande d'Ephraïm du 29/10/2026): what the
 * person should prepare, from their own applications and simulations, and the follow-up of their
 * interview practice. The simulation itself is kept for people who applied to an offer AND whose
 * plan includes simulations (`career.interview.text.monthly` or `.voice.monthly` above zero; the
 * plans are read from the database, never named, CLAUDE.md § 2). Applying stays free (§ 1).
 * Nothing here is shown to a recruiter.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { interviewAccess, listInterviews, parseTurns, quotaKey } from "./interview-sim";
import { sessionScore } from "./interview-phone";
import { GOOD_SCORE, type ScoreCriterion } from "./interview-score";
import { cheapestPlanWithLimit, listPublicPlans } from "./plans";

export type TrainingApplication = {
  id: string;
  title: string;
  company: string;
  jobSlug: string;
  interviewAt: Date | null;
  status: string;
};

export type Preparation =
  | { kind: "interview"; applicationId: string; title: string; company: string; at: Date | null }
  | { kind: "criterion"; criterion: ScoreCriterion; score: number; applicationId: string | null }
  | { kind: "skill"; skill: string; job: string };

/** The marks of the finished simulations, oldest first, for the follow-up. */
async function finishedScores(db: PrismaClient, userId: string) {
  const sessions = (await listInterviews(db, userId, 30)).filter(
    (session) => session.status === "completed",
  );
  const full = await db.interviewSession.findMany({
    where: { id: { in: sessions.map((session) => session.id) } },
    select: { id: true, jobId: true, jobTitle: true, mode: true, questions: true },
  });
  const scores = await Promise.all(
    full.map(async (row) => ({
      id: row.id,
      score: await sessionScore(db, { ...row, turns: parseTurns(row.questions) }),
    })),
  );
  const byId = new Map(scores.map((row) => [row.id, row.score]));
  return sessions
    .map((session) => ({ ...session, score: byId.get(session.id) ?? null }))
    .filter((session) => session.score)
    .reverse();
}

/**
 * « Mes entraînements »: the access to the simulation, up to four preparations (the applications
 * to prepare, the weakest mark of the last simulation, a skill an offer asks for that the profile
 * lacks) and the follow-up (number of simulations, first and last mark, marks by criterion).
 */
export async function careerTraining(
  db: PrismaClient,
  userId: string,
  input: { applications: TrainingApplication[]; ownedSkillIds: string[] },
  now = new Date(),
) {
  const active = input.applications.filter(
    (row) => !["withdrawn", "notSelected", "hired", "jobClosed"].includes(row.status),
  );
  const [access, plans, finished, missing] = await Promise.all([
    interviewAccess(db, userId, now),
    listPublicPlans(db),
    finishedScores(db, userId),
    active.length
      ? db.jobSkill.findMany({
          where: {
            importance: "required",
            job: { slug: { in: active.map((row) => row.jobSlug) } },
            skillId: { notIn: input.ownedSkillIds },
          },
          orderBy: { weight: "desc" },
          take: 4,
          select: { skill: { select: { name: true } }, job: { select: { title: true } } },
        })
      : Promise.resolve([]),
  ]);

  // Upcoming interviews first, then the most recent applications.
  const toPrepare = [...active]
    .sort(
      (a, b) =>
        (a.interviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.interviewAt?.getTime() ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, 2);
  const last = finished.at(-1)?.score ?? null;
  const weakest = last
    ? [...last.criteria].sort((a, b) => a.score - b.score).find((item) => item.score < GOOD_SCORE)
    : undefined;

  const preparations: Preparation[] = [
    ...toPrepare.map((row) => ({
      kind: "interview" as const,
      applicationId: row.id,
      title: row.title,
      company: row.company,
      at: row.interviewAt,
    })),
    ...(weakest
      ? [
          {
            kind: "criterion" as const,
            criterion: weakest.key,
            score: weakest.score,
            applicationId: toPrepare[0]?.id ?? null,
          },
        ]
      : []),
    ...missing
      .filter((row, index, all) => all.findIndex((x) => x.skill.name === row.skill.name) === index)
      .slice(0, 1)
      .map((row) => ({ kind: "skill" as const, skill: row.skill.name, job: row.job.title })),
  ].slice(0, 4);

  const first = finished[0]?.score ?? null;
  // « dès Starter »: the cheapest paid plan with written simulations, read from the plans.
  const planName =
    cheapestPlanWithLimit(
      plans.filter((item) => (item.priceCents ?? 0) > 0),
      "talent",
      quotaKey("text"),
      1,
    )?.name ?? null;
  return {
    access: { ...access, planName },
    /** The application a new simulation is opened for (its offer guides the questions). */
    applicationId: toPrepare[0]?.id ?? null,
    preparations,
    followUp: last
      ? {
          count: finished.length,
          last: last.overall,
          /** The change since the first simulation, null with a single one. */
          change: finished.length > 1 && first ? last.overall - first.overall : null,
          lastId: finished.at(-1)!.id,
          criteria: last.criteria.map((item) => ({ key: item.key, score: item.score })),
        }
      : null,
  };
}

export type CareerTraining = Awaited<ReturnType<typeof careerTraining>>;
