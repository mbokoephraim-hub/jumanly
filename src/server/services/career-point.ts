/**
 * « Faire le point » (`/app/profil/point`, planche talent-4 § 5): Orbi's summary, the strengths,
 * what to reinforce and the next action. Fixed rules on what the talent declared (profile, last
 * diagnostic) and on the published offers of the target job: the same facts give the same
 * advice, no model call, no credit (règle d'or 3). Nothing protected (name, age, photo, origin)
 * is read.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { recommendedCourses } from "@/server/matching/service";
import { miniPlanLinks, parseDiagnosticV2, type Priority } from "./diagnostic";
import type { Dimension, Stage } from "./diagnostic-scoring";
import { skillDemand } from "./diagnostic-store";

export type PointLine =
  | { code: "certificate"; name: string }
  | { code: "result" }
  | { code: "proven"; count: number }
  | { code: "dimension"; key: Dimension; score: number }
  | { code: "skill"; skill: string; count: number; total: number }
  | { code: "noResult" }
  | { code: "noExperience" };

export type PointNext =
  | { kind: "course"; slug: string; title: string; minutes: number }
  | { kind: "diagnostic" }
  | { kind: "profile" }
  | { kind: "priority"; priority: Priority; href: string };

/** What the rules read. */
export type PointFacts = {
  certificates: string[];
  experiences: number;
  experiencesWithResult: number;
  provenSkills: number;
  ownedSkills: string[];
  dimensions: { key: Dimension; score: number }[] | null;
  /** Skills of the offers of the target job, most asked first. */
  demand: { counts: [string, number][]; offers: number };
};

const MAX = 3;
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** A result is a figure in the description: « +15 % », « 3 agences », « 2 000 clients ». */
export const hasResult = (description: string) => /\d/.test(description);

/** The strengths and the points to reinforce, three at most each, always in the same order. */
export function pointLines(facts: PointFacts) {
  const strengths: PointLine[] = [];
  const weaknesses: PointLine[] = [];
  const sorted = facts.dimensions ? [...facts.dimensions].sort((a, b) => b.score - a.score) : [];

  if (facts.certificates[0]) strengths.push({ code: "certificate", name: facts.certificates[0] });
  if (facts.experiencesWithResult > 0) strengths.push({ code: "result" });
  if (facts.provenSkills > 0) strengths.push({ code: "proven", count: facts.provenSkills });
  const best = sorted[0];
  if (best && best.score >= 70) strengths.push({ code: "dimension", ...best });

  const owned = new Set(facts.ownedSkills.map(fold));
  const total = facts.demand.offers;
  for (const [skill, count] of facts.demand.counts) {
    if (weaknesses.length >= 2) break;
    if (total === 0 || owned.has(fold(skill))) continue;
    if (count * 10 < total * 3) break; // asked for by fewer than 3 offers in 10: not a priority
    weaknesses.push({ code: "skill", skill, count, total });
  }
  if (facts.experiences === 0) weaknesses.push({ code: "noExperience" });
  else if (facts.experiencesWithResult === 0) weaknesses.push({ code: "noResult" });
  const worst = sorted.at(-1);
  if (worst && worst.score < 50) weaknesses.push({ code: "dimension", ...worst });

  return { strengths: strengths.slice(0, MAX), weaknesses: weaknesses.slice(0, MAX) };
}

/** Everything the screen shows, from the database. `opens` says whether a course is included. */
export async function careerPoint(
  db: PrismaClient,
  userId: string,
  opens: (requiredLevel: string) => boolean,
) {
  const [user, diagnostic, certificates] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        city: true,
        talentProfile: {
          select: {
            targetJob: true,
            headline: true,
            desiredJobTitles: true,
            experiences: { select: { description: true } },
            skills: {
              select: { proof: true, verified: true, skill: { select: { name: true } } },
            },
          },
        },
      },
    }),
    db.careerDiagnostic.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, result: true },
    }),
    db.certificate.findMany({
      where: { enrollment: { userId }, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      take: 3,
      select: { skills: true, courseTitle: true },
    }),
  ]);
  const profile = user?.talentProfile ?? null;
  const v2 = diagnostic ? parseDiagnosticV2(diagnostic.result) : null;
  const role =
    profile?.targetJob || profile?.desiredJobTitles[0] || v2?.roles[0] || profile?.headline || null;
  const demand = role ? await skillDemand(db, role) : { counts: [], offers: 0, scope: "all" };
  const experiences = profile?.experiences ?? [];
  const facts: PointFacts = {
    certificates: certificates.map((item) => item.skills[0] || item.courseTitle),
    experiences: experiences.length,
    experiencesWithResult: experiences.filter((item) => hasResult(item.description)).length,
    provenSkills: profile?.skills.filter((item) => item.verified || item.proof).length ?? 0,
    ownedSkills: profile?.skills.map((item) => item.skill.name) ?? [],
    dimensions: v2?.dimensions ?? null,
    demand: { counts: demand.counts, offers: demand.offers },
  };
  const lines = pointLines(facts);

  let next: PointNext;
  const [course] = await recommendedCourses(db, userId, { opens, take: 1 });
  const details = course
    ? await db.course.findUnique({
        where: { slug: course.slug },
        select: { durationMinutes: true },
      })
    : null;
  const priority = v2?.priorities.find((item) => miniPlanLinks[item]);
  if (course && details)
    next = {
      kind: "course",
      slug: course.slug,
      title: course.title,
      minutes: details.durationMinutes,
    };
  else if (!v2) next = { kind: "diagnostic" };
  else if (facts.experiencesWithResult === 0) next = { kind: "profile" };
  else if (priority) next = { kind: "priority", priority, href: miniPlanLinks[priority]! };
  else next = { kind: "diagnostic" };

  return {
    ...lines,
    next,
    role,
    city: user?.city ?? null,
    stage: (v2?.stage ?? null) as Stage | null,
    diagnostic:
      v2 && diagnostic ? { id: diagnostic.id, date: diagnostic.createdAt, score: v2.score } : null,
    offers: role ? demand.offers : null,
  };
}
