/**
 * ATS with Orbi (brief recruteur § 2.16 and § 2.17, planches recruteur-4 § 0 bis, 1 and 1 bis): in
 * one gesture Orbi reads every application of an offer (the right `hire.cv_analysis`, one credit of
 * `ai.credits.monthly` per file, the number said before launching), the applications are ranked by
 * the deterministic score of partie 08, and Orbi points at the files to see first, with why.
 *
 * Golden rule n° 3: nothing here rejects, moves or answers anyone. « Recommandés » and « À vérifier »
 * are views: every application stays in « Tous ». The « liste des retenus » is made by a member,
 * never by Orbi. Golden rule n° 6: every read goes through `getOrgJob` / `jobScope`.
 */
import type { Prisma, PrismaClient, StageKind } from "@/generated/prisma/client";
import { aiFeatures, AI_CREDITS_KEY, type AiError } from "@/server/ai";
import type { AiProvider } from "@/server/ai/provider";
import { level, usage } from "@/server/entitlements";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { ensureStages } from "./applications";
import {
  ANALYSIS_EVENT,
  analysisReadiness,
  analyzeApplication,
  parseAnalysis,
  skillProofs,
  type Analysis,
  type AnalysisReadiness,
} from "./cv-analysis";
import {
  getOrgApplication,
  getOrgJob,
  HireError,
  hirePermissions,
  jobScope,
  type HireContext,
} from "./hire";
import { proposedQuestions } from "./hire-interviews";
import { notify } from "./notifications";
import { sentAttachments } from "./application-attachments";
import {
  classOf,
  CRITERION_MET_EVENT,
  CRITERION_UNMET_EVENT,
  documentsOf,
  HOLD_EVENT,
  HOLD_LIFTED_EVENT,
  isOnHold,
  missedCriteriaOf,
  type OrbiClass,
} from "./hire-classes";
import { parseCriteria } from "./jobs";

/** At most this many files « à voir en priorité ». */
export const RECOMMENDED_MAX = 5;
/** A recommended file has at least this score, when the organization sees scores. */
export const RECOMMENDED_FLOOR = 70;
/** A run older than this without news is considered interrupted (server restarted). */
export const RUN_STALE_MS = 15 * 60_000;
/** One credit per file analysed (`aiFeatures.cv_analysis`). */
export const CREDITS_PER_FILE: number = aiFeatures.cv_analysis.credits;

export const atsViews = ["recommandes", "verifier", "tous"] as const;
export type AtsView = (typeof atsViews)[number];

export type AtsRun = {
  startedAt: string;
  by: string;
  ids: string[];
  stoppedAt?: string | null;
  finishedAt?: string | null;
  /** Why the run stopped before the end. */
  failed?: AiError["code"] | null;
};

export function runOf(value: Prisma.JsonValue | null | undefined): AtsRun | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const run = value as Partial<AtsRun>;
  if (typeof run.startedAt !== "string" || !Array.isArray(run.ids)) return null;
  return run as AtsRun;
}

/** Is a run going on now (not finished, not stopped, not stale)? */
export function isRunning(run: AtsRun | null, now = new Date()) {
  return Boolean(
    run &&
    !run.finishedAt &&
    !run.stoppedAt &&
    now.getTime() - new Date(run.startedAt).getTime() < RUN_STALE_MS,
  );
}

/** Five segments of a bar (planche `.a2-bars`), amber when something is to check. */
export type Bar = { value: number; check: boolean };

export type AtsFact = { skill: string; proven: boolean };

export type AtsRow = {
  id: string;
  name: string;
  city: string | null;
  years: number;
  createdAt: Date;
  score: number | null;
  stage: { name: string; kind: StageKind };
  status: string;
  shortlisted: boolean;
  shortlistedById: string | null;
  analysis: Analysis | null;
  analysedAt: Date | null;
  bars: { skills: Bar; experience: Bar; proofs: Bar };
  facts: AtsFact[];
  /** Required skills absent from the profile. */
  missingRequired: number;
  /** Skills of the offer declared without proof, or missing. */
  toCheck: string[];
  group: "recommended" | "verify" | "other";
  /** Short professional title of the profile (« Analyste financière »). */
  headline: string | null;
  /** ISO code of the country, for the flag. */
  country: string | null;
  /** Up to two skills of the offer the profile has, required ones first. */
  matched: string[];
  /** Documents asked by the offer and received (« 3 sur 3 »). */
  documents: { received: number; asked: number };
  /** Elimination criteria the recruiter marked as missing. */
  missedCriteria: string[];
  /** « En attente », a member's gesture. */
  onHold: boolean;
  /** Orbi's class (null when the organization sees no score). */
  orbiClass: OrbiClass | null;
};

const DAY = 86_400_000;
const yearsOf = (experiences: { startDate: Date; endDate: Date | null }[], now: Date) =>
  Math.floor(
    experiences.reduce(
      (sum, item) =>
        sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / DAY),
      0,
    ) / 365.25,
  );

const five = (ratio: number) => Math.max(0, Math.min(5, Math.round(ratio * 5)));

/** The three bars of a card, from the frozen explanation and the proofs of the profile. */
export function barsOf(
  proofs: ReturnType<typeof skillProofs>,
  explanation: MatchExplanation | null,
  years: number,
  experienceMin: number,
) {
  const required = proofs.filter((item) => item.required);
  const present = required.filter((item) => item.proof !== "missing");
  const skills: Bar = {
    value: required.length ? five(present.length / required.length) : five(proofs.length ? 1 : 0),
    check: present.length < required.length,
  };
  const criterion = explanation?.criteria.find((item) => item.key === "experience");
  const ratio = criterion
    ? criterion.value
    : experienceMin > 0
      ? Math.min(1, years / experienceMin)
      : years > 0
        ? 1
        : 0.4;
  const experience: Bar = {
    value: five(ratio),
    check: criterion ? criterion.status === "partial" || criterion.status === "unmet" : ratio < 1,
  };
  const proven = proofs.filter((item) =>
    ["certificate", "project", "experience"].includes(item.proof),
  );
  const proofsBar: Bar = {
    value: proofs.length ? five(proven.length / proofs.length) : 0,
    check: proofs.some((item) => item.proof === "declared"),
  };
  return { skills, experience, proofs: proofsBar };
}

/**
 * Orbi's groups (planche ATS3): « Recommandés » are analysed files with every required skill in the
 * profile and, when scores are shown, at least `RECOMMENDED_FLOOR`; the best `RECOMMENDED_MAX` by
 * score. « À vérifier » are the other analysed files with a point to check. A fixed rule, the same
 * for every candidate of the offer: it hides nobody and decides nothing.
 */
export function groupRows<
  T extends {
    id: string;
    status: string;
    score: number | null;
    analysis: Analysis | null;
    missingRequired: number;
    toCheck: string[];
    createdAt: Date;
  },
>(rows: T[], withScores: boolean) {
  const candidates = rows
    .filter(
      (row) =>
        row.status === "active" &&
        row.analysis !== null &&
        row.missingRequired === 0 &&
        (!withScores || (row.score ?? 0) >= RECOMMENDED_FLOOR),
    )
    .sort(
      (a, b) => (b.score ?? -1) - (a.score ?? -1) || a.createdAt.getTime() - b.createdAt.getTime(),
    )
    .slice(0, RECOMMENDED_MAX);
  const recommended = new Set(candidates.map((row) => row.id));
  return (row: T): "recommended" | "verify" | "other" =>
    recommended.has(row.id)
      ? "recommended"
      : row.analysis !== null &&
          row.status === "active" &&
          (row.analysis.toVerify.length > 0 || row.toCheck.length > 0)
        ? "verify"
        : "other";
}

/** Credits the organization has left this month (null: unlimited). */
async function creditsLeft(db: PrismaClient, organizationId: string) {
  const credits = await usage(db, { type: "organization", id: organizationId }, AI_CREDITS_KEY);
  return credits.limit < 0 ? null : Math.max(0, credits.limit - credits.used);
}

/**
 * Everything the ATS screen shows: the applications ranked by score with their bars and facts,
 * Orbi's groups, the files still to analyse, the credits, the run and the schedule.
 */
export async function atsBoard(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const stages = await ensureStages(db, job.id);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const matchingLevel = (await level(db, subject, "hire.matching.level")) as
    "none" | "suggestions" | "explainable";
  const applications = await db.application.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      stageId: true,
      matchScore: true,
      matchExplanation: true,
      shortlistedAt: true,
      shortlistedById: true,
      coverLetter: true,
      cvSnapshot: true,
      attachments: true,
      events: {
        where: { type: ANALYSIS_EVENT },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { payload: true, createdAt: true },
      },
      profile: {
        select: {
          matchingEnabled: true,
          headline: true,
          user: { select: { name: true, city: true, country: true } },
          experiences: { select: { startDate: true, endDate: true } },
          skills: {
            select: { skillId: true, verified: true, proof: true, source: true, level: true },
          },
        },
      },
    },
  });
  const matches =
    matchingLevel === "none"
      ? new Map<string, MatchExplanation | "disabled">()
      : await applicationMatches(db, applications, now);
  const criteria = parseCriteria(job.knockoutCriteria);
  const criterionEvents = await db.applicationEvent.findMany({
    where: {
      applicationId: { in: applications.map((application) => application.id) },
      type: {
        in: [
          HOLD_EVENT,
          HOLD_LIFTED_EVENT,
          ...(criteria.length > 0 ? [CRITERION_UNMET_EVENT, CRITERION_MET_EVENT] : []),
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { applicationId: true, type: true, payload: true },
  });
  const proofJob = {
    skills: job.skills.map((item) => ({
      skillId: item.skillId,
      importance: item.importance,
      skill: { name: item.skill.name },
    })),
  };
  const draft = applications.map((application) => {
    const stage = stages.find((item) => item.id === application.stageId) ?? stages[0]!;
    const match = matches.get(application.id);
    const explanation = match && match !== "disabled" ? match : null;
    const proofs = skillProofs({ job: proofJob, profile: application.profile });
    const years = yearsOf(application.profile.experiences, now);
    const event = application.events[0];
    const required = proofs.filter((item) => item.required);
    const facts: AtsFact[] = [
      ...required
        .filter((item) => ["certificate", "project", "experience"].includes(item.proof))
        .map((item) => ({ skill: item.name, proven: true })),
      ...proofs
        .filter((item) => item.proof === "declared" || (item.required && item.proof === "missing"))
        .map((item) => ({ skill: item.name, proven: false })),
    ].slice(0, 3);
    return {
      id: application.id,
      name: application.profile.user.name,
      city: application.profile.user.city,
      years,
      createdAt: application.createdAt,
      score: explanation ? explanation.score : null,
      stage: { name: stage.name, kind: stage.kind },
      status: application.status,
      shortlisted: application.shortlistedAt !== null,
      shortlistedById: application.shortlistedById,
      analysis: event ? parseAnalysis(event.payload) : null,
      analysedAt: event?.createdAt ?? null,
      bars: barsOf(proofs, explanation, years, job.experienceMin),
      facts,
      missingRequired: required.filter((item) => item.proof === "missing").length,
      toCheck: proofs
        .filter((item) => item.proof === "declared" || item.proof === "missing")
        .map((item) => item.name),
      headline: application.profile.headline,
      country: application.profile.user.country,
      matched: [...proofs]
        .filter((item) => item.proof !== "missing")
        .sort((a, b) => Number(b.required) - Number(a.required))
        .slice(0, 2)
        .map((item) => item.name),
      documents: documentsOf({
        asked: job.requestedDocuments,
        hasCv: application.cvSnapshot !== null,
        hasLetter: Boolean(application.coverLetter?.trim()),
        attachments: sentAttachments(application.attachments),
      }),
      missedCriteria: missedCriteriaOf(
        criterionEvents.filter((event) => event.applicationId === application.id),
        criteria,
      ),
      onHold: isOnHold(criterionEvents.filter((event) => event.applicationId === application.id)),
    };
  });
  const withScores = matchingLevel !== "none";
  const groupOf = groupRows(draft, withScores);
  const rows: AtsRow[] = draft
    .map((row) => ({
      ...row,
      group: groupOf(row),
      orbiClass: !withScores
        ? null
        : row.missedCriteria.length > 0
          ? ("hors" as const)
          : row.score !== null
            ? classOf({ score: row.score })
            : null,
    }))
    .sort(
      (a, b) =>
        (withScores ? (b.score ?? -1) - (a.score ?? -1) : 0) ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
  const active = rows.filter((row) => row.status === "active");
  const toAnalyse = active.filter((row) => row.analysis === null);
  const [readiness, credits] = await Promise.all([
    analysisReadiness(db, ctx),
    creditsLeft(db, ctx.organizationId),
  ]);
  const run = runOf(job.atsRun);
  const recommended = rows.filter((row) => row.group === "recommended");
  // Skills of the offer that every recommended file proves (« Ils ont SQL et Power BI »).
  const shared = job.skills
    .filter((item) => item.importance === "required")
    .map((item) => item.skill.name)
    .filter(
      (name) =>
        recommended.length > 0 &&
        recommended.every((row) => row.facts.some((fact) => fact.proven && fact.skill === name)),
    )
    .slice(0, 3);
  return {
    job,
    withScores,
    matchingLevel,
    rows,
    stageCounts: stages
      .filter((stage) => stage.kind !== "hired" && stage.kind !== "rejected")
      .map((stage) => ({
        id: stage.id,
        name: stage.name,
        kind: stage.kind,
        count: active.filter((row) => row.stage.name === stage.name).length,
      })),
    analysed: rows.filter((row) => row.analysis !== null).length,
    toAnalyse: toAnalyse.map((row) => row.id),
    readiness,
    credits,
    run,
    running: isRunning(run, now),
    recommended,
    verify: rows.filter((row) => row.group === "verify"),
    shared,
    /** Recommended files with a point to check in interview (« Fatou et David »). */
    recommendedToCheck: recommended.filter(
      (row) => (row.analysis?.toVerify.length ?? 0) > 0 || row.toCheck.length > 0,
    ),
    shortlisted: rows.filter((row) => row.shortlisted),
    schedule: {
      atClose: job.atsAtClose,
      autoAdd: job.atsAutoAdd,
      closesAt: job.closesAt,
      ranAt: job.atsRanAt,
    },
  };
}

export type AtsBoard = Awaited<ReturnType<typeof atsBoard>>;

export type StartResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: AnalysisReadiness | "nothing" | "running" | "credits" };

/**
 * « Lancer l'analyse » now: the active applications not analysed yet. Checked before anything is
 * spent: the right, the member's consent, the credits for every file (the number was shown on the
 * button). The run itself goes on after the answer (`runAts`).
 */
export async function startAts(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  options: { autoAdd?: boolean } = {},
  now = new Date(),
): Promise<StartResult> {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (isRunning(runOf(job.atsRun), now)) return { ok: false, error: "running" };
  const readiness = await analysisReadiness(db, ctx);
  if (readiness !== "ready") return { ok: false, error: readiness };
  const pending = await db.application.findMany({
    where: { jobId: job.id, status: "active", events: { none: { type: ANALYSIS_EVENT } } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (pending.length === 0) return { ok: false, error: "nothing" };
  const left = await creditsLeft(db, ctx.organizationId);
  if (left !== null && left < pending.length * CREDITS_PER_FILE)
    return { ok: false, error: "credits" };
  const run: AtsRun = {
    startedAt: now.toISOString(),
    by: ctx.userId,
    ids: pending.map((item) => item.id),
    stoppedAt: null,
    finishedAt: null,
    failed: null,
  };
  await db.job.update({
    where: { id: job.id },
    data: {
      atsRun: run as unknown as Prisma.InputJsonObject,
      ...(options.autoAdd !== undefined && { atsAutoAdd: options.autoAdd }),
      // Launched now: the analysis that was planned for the closing date is no longer needed.
      atsAtClose: false,
    },
  });
  return { ok: true, ids: run.ids };
}

/**
 * Reads the files of a run one by one, as long as nobody stopped it. A file costs one credit;
 * when the credits run out or the model is unavailable the run stops and says why. At the end the
 * member who launched it is told (notification « Analyse terminée »).
 */
export async function runAts(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  options: { provider?: AiProvider } = {},
) {
  const job = await getOrgJob(db, ctx, jobId);
  const run = runOf(job.atsRun);
  if (!run) return { analysed: 0 };
  let analysed = 0;
  let failed: AiError["code"] | null = null;
  for (const id of run.ids) {
    const current = runOf(
      (await db.job.findUnique({ where: { id: job.id }, select: { atsRun: true } }))?.atsRun,
    );
    if (!current || current.startedAt !== run.startedAt || current.stoppedAt) break;
    const already = await db.applicationEvent.count({
      where: { applicationId: id, type: ANALYSIS_EVENT },
    });
    if (already > 0) continue;
    try {
      const result = await analyzeApplication(db, ctx, id, { provider: options.provider });
      if (!result.ok) {
        failed = result.error;
        break;
      }
      analysed++;
    } catch (error) {
      // An application withdrawn from the scope meanwhile is skipped, never a reason to stop.
      if (error instanceof HireError) continue;
      throw error;
    }
  }
  const latest = runOf(
    (await db.job.findUnique({ where: { id: job.id }, select: { atsRun: true } }))?.atsRun,
  );
  if (latest && latest.startedAt === run.startedAt) {
    const now = new Date();
    await db.job.update({
      where: { id: job.id },
      data: {
        atsRun: {
          ...latest,
          finishedAt: now.toISOString(),
          failed,
        } as unknown as Prisma.InputJsonObject,
        atsRanAt: now,
      },
    });
  }
  const recommended = (await atsBoard(db, ctx, job.id)).recommended.length;
  await notify(db, {
    userIds: [ctx.userId],
    type: "atsReady",
    payload: { jobTitle: job.title, count: analysed, recommended },
    href: `/app/hire/offres/${job.id}/ats`,
  });
  return { analysed, failed };
}

/** « Arrêter l'analyse »: the files already read stay analysed; the others are not spent. */
export async function stopAts(db: PrismaClient, ctx: HireContext, jobId: string, now = new Date()) {
  const job = await getOrgJob(db, ctx, jobId);
  const run = runOf(job.atsRun);
  if (!run || run.finishedAt || run.stoppedAt) return false;
  await db.job.update({
    where: { id: job.id },
    data: {
      atsRun: { ...run, stoppedAt: now.toISOString() } as unknown as Prisma.InputJsonObject,
    },
  });
  return true;
}

/**
 * « À la fin de l'offre » (planche 1 bis): once, at the closing date, on every application. Nothing
 * is spent now. The schedule follows the date when the offer is extended; it can be changed,
 * cancelled or launched sooner.
 */
export async function scheduleAts(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  input: { autoAdd: boolean },
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  if (!job.closesAt) throw new HireError("invalid");
  await db.job.update({
    where: { id: job.id },
    data: { atsAtClose: true, atsScheduledById: ctx.userId, atsAutoAdd: input.autoAdd },
  });
}

export async function cancelScheduledAts(db: PrismaClient, ctx: HireContext, jobId: string) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  await db.job.update({ where: { id: job.id }, data: { atsAtClose: false } });
}

/** The member's context in an organization, when they still belong to it. */
async function memberContext(db: PrismaClient, userId: string, organizationId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true, status: true },
  });
  if (!membership || membership.status !== "active") return null;
  return { userId, organizationId, role: membership.role } satisfies HireContext;
}

/**
 * Background task `ats.scheduled` (with the other scheduled tasks): the analyses planned for the
 * closing date that has come, then the new applications of offers « ajouter au classement ». The
 * credits are those of the organization, the consent that of the member who planned it.
 */
export async function runScheduledAts(
  db: PrismaClient,
  now = new Date(),
  options: { provider?: AiProvider } = {},
) {
  let launched = 0;
  let added = 0;
  const due = await db.job.findMany({
    where: { atsAtClose: true, closesAt: { lte: now }, atsScheduledById: { not: null } },
    select: { id: true, title: true, organizationId: true, atsScheduledById: true },
    take: 20,
  });
  for (const job of due) {
    const ctx = await memberContext(db, job.atsScheduledById!, job.organizationId);
    await db.job.update({ where: { id: job.id }, data: { atsAtClose: false } });
    if (!ctx) continue;
    const started = await startAts(db, ctx, job.id, {}, now).catch(() => null);
    if (started?.ok) {
      await runAts(db, ctx, job.id, options);
      launched++;
    } else if (started && started.error !== "nothing") {
      await notify(db, {
        userIds: [ctx.userId],
        type: "atsNotRun",
        payload: { jobTitle: job.title, reason: started.error },
        href: `/app/hire/offres/${job.id}/ats`,
      });
    }
  }
  const following = await db.job.findMany({
    where: { atsAutoAdd: true, atsRanAt: { not: null }, status: { in: ["published", "paused"] } },
    select: {
      id: true,
      organizationId: true,
      atsRanAt: true,
      atsScheduledById: true,
      atsRun: true,
    },
    take: 50,
  });
  for (const job of following) {
    const by = runOf(job.atsRun)?.by ?? job.atsScheduledById;
    if (!by) continue;
    const ctx = await memberContext(db, by, job.organizationId);
    if (!ctx) continue;
    const fresh = await db.application.findMany({
      where: {
        jobId: job.id,
        status: "active",
        createdAt: { gt: job.atsRanAt! },
        events: { none: { type: ANALYSIS_EVENT } },
      },
      select: { id: true },
      take: 20,
    });
    for (const application of fresh) {
      const result = await analyzeApplication(db, ctx, application.id, options).catch(() => null);
      if (!result?.ok) break;
      added++;
    }
  }
  return { launched, added };
}

// ─── « Profil pour cette offre » (planche ATS4) ──────────────────────────────────────────

export type CriterionLine = {
  key: "skill" | "availability" | "documents";
  label: string;
  /** What the file shows, as a key of `hireAts.profile.shows.*` and its values. */
  shows: { key: string; values: Record<string, string> };
  state: "ok" | "check";
};

/**
 * One application read against the offer: Orbi's analysis, each criterion with what the file
 * shows, and the interview questions drawn from the skills (`proposedQuestions`). Opening it is a
 * consultation of the file, logged by the caller (`recordView`).
 */
export async function profileForOffer(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  applicationId: string,
) {
  const application = await getOrgApplication(db, ctx, applicationId);
  if (application.jobId !== jobId) throw new HireError("notFound");
  const proofs = skillProofs(application);
  const event = [...application.events].reverse().find((item) => item.type === ANALYSIS_EVENT);
  const proofKey: Record<string, string> = {
    certificate: "certificate",
    project: "project",
    experience: "experience",
    declared: "declared",
    missing: "missing",
  };
  const lines: CriterionLine[] = proofs
    .sort((a, b) => Number(b.required) - Number(a.required))
    .map((item) => ({
      key: "skill",
      label: item.name,
      shows: { key: proofKey[item.proof]!, values: {} },
      state: item.proof === "declared" || item.proof === "missing" ? "check" : "ok",
    }));
  const availability = application.profile.availability;
  lines.push({
    key: "availability",
    label: "",
    shows: {
      key: `availability.${availability}`,
      values: {},
    },
    state: availability === "not_looking" ? "check" : "ok",
  });
  const documents = [
    application.cvSnapshot !== null ? "cv" : null,
    application.coverLetter?.trim() ? "letter" : null,
  ].filter((item): item is string => item !== null);
  lines.push({
    key: "documents",
    label: "",
    shows: { key: documents.length ? "documents" : "noDocuments", values: {} },
    state: documents.length ? "ok" : "check",
  });
  return {
    application,
    analysis: event ? parseAnalysis(event.payload) : null,
    lines,
    documents,
    questions: proposedQuestions(application, 3),
  };
}

// ─── Liste des retenus (planche RETENUS) ───────────────────────────────────────────────────

/**
 * « Retenir »: the member keeps the files ticked for the next stage. Only active applications of
 * this offer; the others are ignored. Each addition is written in the application's history.
 */
export async function shortlist(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  ids: string[],
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const found = await db.application.findMany({
    where: { id: { in: ids.slice(0, 200) }, jobId: job.id, status: "active", shortlistedAt: null },
    select: { id: true },
  });
  if (found.length === 0) return 0;
  await db.$transaction([
    db.application.updateMany({
      where: { id: { in: found.map((item) => item.id) } },
      data: { shortlistedAt: now, shortlistedById: ctx.userId },
    }),
    db.applicationEvent.createMany({
      data: found.map((item) => ({
        applicationId: item.id,
        actorId: ctx.userId,
        type: "shortlisted",
        payload: {},
        createdAt: now,
      })),
    }),
  ]);
  return found.length;
}

/** « Retirer de la liste »: back among the others, nothing else changes. */
export async function unshortlist(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  applicationId: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const done = await db.application.updateMany({
    where: { id: applicationId, jobId: job.id, shortlistedAt: { not: null } },
    data: { shortlistedAt: null, shortlistedById: null },
  });
  if (done.count > 0)
    await db.applicationEvent.create({
      data: { applicationId, actorId: ctx.userId, type: "unshortlisted", createdAt: now },
    });
  return done.count > 0;
}

/**
 * The live offers with applications not analysed yet (À traiter, planche 0 bis `ENT_AT`), and the
 * analyses finished in the last days (« Analyses terminées »).
 */
export async function atsToday(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).readApplications) return { pending: [], done: [] };
  const scope = await jobScope(db, ctx);
  const jobs = await db.job.findMany({
    where: { AND: [scope, { status: { in: ["published", "paused", "closed"] } }] },
    orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
    take: 20,
    select: {
      id: true,
      title: true,
      atsRanAt: true,
      atsRun: true,
      _count: { select: { applications: { where: { status: "active" } } } },
      applications: {
        where: { status: "active", events: { none: { type: ANALYSIS_EVENT } } },
        select: { id: true },
      },
    },
  });
  const pending = jobs
    .filter((job) => job.applications.length > 0 && !isRunning(runOf(job.atsRun), now))
    .map((job) => ({
      id: job.id,
      title: job.title,
      pending: job.applications.length,
      total: job._count.applications,
    }));
  const done = jobs
    .filter((job) => job.atsRanAt && now.getTime() - job.atsRanAt.getTime() < 7 * DAY)
    .map((job) => ({
      id: job.id,
      title: job.title,
      total: job._count.applications,
      at: job.atsRanAt!,
    }));
  return { pending, done };
}
