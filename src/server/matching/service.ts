/**
 * Matching with the database (partie 08): weights, embeddings, cached results, recommendations.
 * The score itself comes from the pure functions of `score.ts`.
 */
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { embeddingsProvider } from "@/server/adapters/embeddings";
import {
  jobSelect,
  jobText,
  normalizeJob,
  normalizeProfile,
  profileSelect,
  profileText,
  type JobRow,
  type ProfileRow,
} from "./normalize";
import { DEFAULT_WEIGHTS, scoreMatch } from "./score";
import { criterionKeys, type CriterionKey, type MatchExplanation, type Weights } from "./types";

// ─── Weights ─────────────────────────────────────────────────────────────────

export const weightsSchema = z.object(
  Object.fromEntries(criterionKeys.map((key) => [key, z.number().int().min(0).max(100)])) as Record<
    CriterionKey,
    z.ZodNumber
  >,
);

/** The newest active version of the weights, or the defaults of § 8.3. */
export async function activeWeights(db: PrismaClient, now = new Date()): Promise<Weights> {
  const row = await db.matchingWeights.findFirst({
    where: { activeFrom: { lte: now } },
    orderBy: { activeFrom: "desc" },
  });
  const parsed = row ? weightsSchema.safeParse(row.weights) : null;
  return parsed?.success ? { version: row!.version, values: parsed.data } : DEFAULT_WEIGHTS;
}

// ─── Embeddings (pgvector) ───────────────────────────────────────────────────

const hashOf = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 32);

/**
 * Embeddings of profiles or jobs, computed when their text changed. A failure of the service
 * leaves the semantic criterion out (never the whole score).
 */
export async function embeddingsFor(
  db: PrismaClient,
  subjectType: "profile" | "job",
  items: { id: string; text: string }[],
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();
  if (items.length === 0) return result;
  const provider = embeddingsProvider();
  try {
    const rows = await db.$queryRaw<
      { subjectId: string; contentHash: string; model: string; vector: string | null }[]
    >`
      SELECT "subjectId", "contentHash", "model", "vector"::text AS "vector"
      FROM "Embedding"
      WHERE "subjectType" = ${subjectType} AND "subjectId" = ANY(${items.map((item) => item.id)})`;
    const known = new Map(rows.map((row) => [row.subjectId, row]));
    const stale = items.filter((item) => {
      const row = known.get(item.id);
      if (
        row &&
        row.model === provider.model &&
        row.contentHash === hashOf(item.text) &&
        row.vector
      ) {
        result.set(item.id, JSON.parse(row.vector) as number[]);
        return false;
      }
      return true;
    });
    for (let start = 0; start < stale.length; start += 64) {
      const batch = stale.slice(start, start + 64);
      const vectors = await provider.embed(batch.map((item) => item.text));
      for (const [index, item] of batch.entries()) {
        const vector = vectors[index];
        if (!vector) continue;
        result.set(item.id, vector);
        const literal = `[${vector.join(",")}]`;
        await db.$executeRaw`
          INSERT INTO "Embedding" ("id", "subjectType", "subjectId", "model", "contentHash", "vector", "updatedAt")
          VALUES (${`emb_${subjectType}_${item.id}`}, ${subjectType}, ${item.id}, ${provider.model}, ${hashOf(item.text)}, ${literal}::vector, now())
          ON CONFLICT ("subjectType", "subjectId") DO UPDATE
          SET "model" = EXCLUDED."model", "contentHash" = EXCLUDED."contentHash", "vector" = EXCLUDED."vector", "updatedAt" = now()`;
      }
    }
  } catch (error) {
    console.error("Embeddings indisponibles, critère sémantique ignoré :", error);
  }
  return result;
}

// ─── Courses that teach a skill ──────────────────────────────────────────────

const levelOrder = { free: 0, fundamentals: 1, standard: 2, advanced: 3, specialized: 4 } as const;

/** Published courses that validate each skill, the most accessible first (slugs, 3 at most). */
export async function coursesBySkill(db: PrismaClient, skillIds: string[]) {
  if (skillIds.length === 0) return {};
  const rows = await db.courseSkill.findMany({
    where: { skillId: { in: skillIds }, course: { status: "published" } },
    select: { skillId: true, course: { select: { slug: true, requiredLevel: true } } },
  });
  const map: Record<string, string[]> = {};
  for (const skillId of skillIds) {
    map[skillId] = rows
      .filter((row) => row.skillId === skillId)
      .sort((a, b) => levelOrder[a.course.requiredLevel] - levelOrder[b.course.requiredLevel])
      .slice(0, 3)
      .map((row) => row.course.slug);
  }
  return map;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export type MatchState =
  { state: "ok"; explanation: MatchExplanation } | { state: "optedOut" } | { state: "incomplete" };

async function loadProfile(db: PrismaClient, userId: string) {
  return db.talentProfile.findUnique({ where: { userId }, select: profileSelect });
}

/**
 * Scores of one talent for several jobs. The talent may switch the calculation off; a profile
 * without any skill has no score (« profil trop incomplet »). Results are kept in MatchResult.
 */
export async function matchesForUser(
  db: PrismaClient,
  userId: string,
  jobIds: string[],
  now = new Date(),
): Promise<Map<string, MatchState>> {
  const result = new Map<string, MatchState>();
  const profile = await loadProfile(db, userId);
  if (!profile || jobIds.length === 0) return result;
  if (!profile.matchingEnabled) {
    for (const id of jobIds) result.set(id, { state: "optedOut" });
    return result;
  }
  if (profile.skills.length === 0) {
    for (const id of jobIds) result.set(id, { state: "incomplete" });
    return result;
  }
  const jobs = await db.job.findMany({ where: { id: { in: jobIds } }, select: jobSelect });
  const explanations = await scoreRows(db, profile, jobs, now);
  for (const [jobId, explanation] of explanations) result.set(jobId, { state: "ok", explanation });
  return result;
}

async function scoreRows(db: PrismaClient, profile: ProfileRow, jobs: JobRow[], now: Date) {
  const [weights, profileVectors, jobVectors, courses] = await Promise.all([
    activeWeights(db, now),
    embeddingsFor(db, "profile", [{ id: profile.id, text: profileText(profile) }]),
    embeddingsFor(
      db,
      "job",
      jobs.map((job) => ({ id: job.id, text: jobText(job) })),
    ),
    coursesBySkill(db, [
      ...new Set(jobs.flatMap((job) => job.skills.map((skill) => skill.skillId))),
    ]),
  ]);
  const normalized = normalizeProfile(profile, now, profileVectors.get(profile.id) ?? null);
  const explanations = new Map<string, MatchExplanation>();
  for (const job of jobs) {
    explanations.set(
      job.id,
      scoreMatch(normalized, normalizeJob(job, jobVectors.get(job.id) ?? null), weights, {
        now,
        coursesBySkill: courses,
      }),
    );
  }
  await saveResults(db, profile.id, explanations);
  return explanations;
}

/** Keeps the last result of each pair; only rows whose score or weights changed are written. */
async function saveResults(
  db: PrismaClient,
  profileId: string,
  explanations: Map<string, MatchExplanation>,
) {
  const existing = await db.matchResult.findMany({
    where: { profileId, jobId: { in: [...explanations.keys()] } },
    select: { jobId: true, score: true, weightsVersion: true },
  });
  const known = new Map(existing.map((row) => [row.jobId, row]));
  for (const [jobId, explanation] of explanations) {
    const row = known.get(jobId);
    if (row && row.score === explanation.score && row.weightsVersion === explanation.weightsVersion)
      continue;
    const data = {
      score: explanation.score,
      band: explanation.band,
      explanation: explanation as unknown as Prisma.InputJsonValue,
      weightsVersion: explanation.weightsVersion,
      computedAt: new Date(explanation.computedAt),
    };
    await db.matchResult.upsert({
      where: { profileId_jobId: { profileId, jobId } },
      create: { profileId, jobId, ...data },
      update: data,
    });
  }
}

export async function matchForUser(
  db: PrismaClient,
  userId: string,
  jobId: string,
  now = new Date(),
) {
  return (
    (await matchesForUser(db, userId, [jobId], now)).get(jobId) ?? { state: "incomplete" as const }
  );
}

/** Freezes the score shown when the talent applied (partie 04: « figé dans Application »). */
export async function freezeApplicationMatch(
  db: PrismaClient,
  applicationId: string,
  now = new Date(),
) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { jobId: true, profile: { select: { userId: true } } },
  });
  if (!application) return;
  const match = await matchForUser(db, application.profile.userId, application.jobId, now);
  if (match.state !== "ok") return;
  await db.application.update({
    where: { id: applicationId },
    data: {
      matchScore: match.explanation.score,
      matchExplanation: match.explanation as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Explanation stored as JSON (frozen on an application), checked before use. */
export function parseExplanation(
  value: Prisma.JsonValue | null | undefined,
): MatchExplanation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as unknown as MatchExplanation;
  return typeof candidate.score === "number" && Array.isArray(candidate.criteria)
    ? candidate
    : null;
}

// ─── Recommendations (§ 8.7) ─────────────────────────────────────────────────

const CANDIDATES = 200;

/**
 * Jobs for a talent: published and open, filtered by work preferences when the talent gave any,
 * then the 200 nearest by meaning (pgvector) when embeddings exist, then the exact score.
 */
export async function recommendedJobs(
  db: PrismaClient,
  userId: string,
  take = 6,
  now = new Date(),
) {
  const profile = await loadProfile(db, userId);
  if (!profile || !profile.matchingEnabled || profile.skills.length === 0) return [];
  const open: Prisma.JobWhereInput = {
    status: "published",
    OR: [{ closesAt: null }, { closesAt: { gte: now } }],
  };
  let ids = (
    await db.job.findMany({
      where: open,
      select: { id: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    })
  ).map((job) => job.id);
  const [vector] = [
    ...(
      await embeddingsFor(db, "profile", [{ id: profile.id, text: profileText(profile) }])
    ).values(),
  ];
  if (vector && ids.length > CANDIDATES) {
    const model = embeddingsProvider().model;
    const nearest = await db.$queryRaw<{ subjectId: string }[]>`
      SELECT "subjectId" FROM "Embedding"
      WHERE "subjectType" = 'job' AND "model" = ${model} AND "subjectId" = ANY(${ids})
      ORDER BY "vector" <=> ${`[${vector.join(",")}]`}::vector
      LIMIT ${CANDIDATES}`;
    if (nearest.length > 0) ids = nearest.map((row) => row.subjectId);
  }
  const jobs = await db.job.findMany({
    where: { id: { in: ids.slice(0, CANDIDATES) } },
    select: jobSelect,
  });
  const explanations = await scoreRows(db, profile, jobs, now);
  return [...explanations.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, take)
    .map(([jobId, explanation]) => ({ jobId, explanation }));
}

/**
 * Courses for a talent: skills missing most often in their 20 most compatible jobs, crossed with
 * the skills each course validates; courses open with their plan come first.
 */
export async function recommendedCourses(
  db: PrismaClient,
  userId: string,
  options: { opens: (requiredLevel: string) => boolean; take?: number },
  now = new Date(),
) {
  const top = await recommendedJobs(db, userId, 20, now);
  const counts = new Map<string, number>();
  for (const { explanation } of top) {
    for (const missing of explanation.missingSkills)
      counts.set(missing.skillId, (counts.get(missing.skillId) ?? 0) + 1);
  }
  if (counts.size === 0) return [];
  const enrolled = new Set(
    (await db.enrollment.findMany({ where: { userId }, select: { courseId: true } })).map(
      (row) => row.courseId,
    ),
  );
  const rows = await db.courseSkill.findMany({
    where: { skillId: { in: [...counts.keys()] }, course: { status: "published" } },
    select: {
      skillId: true,
      skill: { select: { name: true } },
      course: { select: { id: true, slug: true, requiredLevel: true } },
    },
  });
  const byCourse = new Map<
    string,
    { slug: string; open: boolean; demand: number; skills: string[] }
  >();
  for (const row of rows) {
    if (enrolled.has(row.course.id)) continue;
    const entry = byCourse.get(row.course.id) ?? {
      slug: row.course.slug,
      open: options.opens(row.course.requiredLevel),
      demand: 0,
      skills: [],
    };
    entry.demand = Math.max(entry.demand, counts.get(row.skillId) ?? 0);
    entry.skills.push(row.skill.name);
    byCourse.set(row.course.id, entry);
  }
  return [...byCourse.values()]
    .sort((a, b) => Number(b.open) - Number(a.open) || b.demand - a.demand)
    .slice(0, options.take ?? 3)
    .map((entry) => ({ ...entry, percent: Math.round((100 * entry.demand) / top.length) }));
}
