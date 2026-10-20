/**
 * Candidates of the recruiter space (brief recruteur § 4 item 3, planches recruteur-2 § 1 to 3 and
 * r2plus): the applications of one offer by stage, sorted and filtered without rejecting anyone,
 * and the final decision with its message read before sending, undone within 10 minutes.
 *
 * Every query goes through `getOrgJob` / `getOrgApplication` / `jobScope`: nothing of another
 * organization is ever read (golden rule n° 6). A filter or a sort only hides (golden rule n° 3):
 * every application stays reachable, and the page says how many are hidden.
 */
import type { Prisma, PrismaClient, StageKind } from "@/generated/prisma/client";
import { can, level } from "@/server/entitlements";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { defaultStages, ensureStages } from "./applications";
import { sentAttachments } from "./application-attachments";
import { ensureApplicationConversation, sendMessage } from "./connect";
import {
  getOrgApplication,
  getOrgJob,
  HireError,
  hirePermissions,
  jobScope,
  rejectReasons,
  type HireContext,
} from "./hire";
import { notify } from "./notifications";
import { screeningAnswersOf, screeningQuestionsOf } from "./screening";
import { addToPool } from "./talent-search";

// ─── The list ──────────────────────────────────────────────────────────────────────

export const candidateSorts = ["correspondance", "date", "etape"] as const;
export type CandidateSort = (typeof candidateSorts)[number];
/** « 85 % et plus », « 70 % et plus », « Toutes ». */
export const scoreFloors = [85, 70, 0] as const;
export const fileFilters = ["complet", "lettre", "nonlues"] as const;
export type FileFilter = (typeof fileFilters)[number];

export type CandidateQuery = {
  offre?: string;
  etape?: string;
  tri?: string;
  min?: string;
  dossier?: string;
};

const decided = (kind: StageKind) => kind === "hired" || kind === "rejected";

/** Name of the stage « Décision finale » of the default model (brief recruteur § 2.6). */
const DECISION_STAGE = defaultStages.filter((stage) => !decided(stage.kind)).at(-1)!.name;

/** The stage where a candidate waits for the final decision, when the offer has one. */
export function decisionStageOf<T extends { name: string; kind: StageKind }>(stages: T[]) {
  return stages.find((stage) => stage.kind === "interview" && stage.name === DECISION_STAGE);
}

export type CandidateRow = {
  id: string;
  name: string;
  createdAt: Date;
  unseen: boolean;
  status: string;
  stage: { id: string; name: string; kind: StageKind; order: number };
  score: number | null;
  letter: boolean;
  cv: boolean;
  certificate: boolean;
  complete: boolean;
};

/**
 * The offers a member may open with their candidates, and the one shown: the one asked for (or
 * not found), else the most recent live offer that has applications, else the most recent offer.
 */
export async function candidateOffers(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  return db.job.findMany({
    where: {
      AND: [
        await jobScope(db, ctx),
        { status: { notIn: ["draft", "archived", "rejected", "changes_requested"] } },
      ],
    },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      closesAt: true,
      _count: { select: { applications: true } },
      applications: { where: { viewedAt: null, status: "active" }, select: { id: true } },
    },
  });
}

export async function candidateList(
  db: PrismaClient,
  ctx: HireContext,
  query: CandidateQuery,
  now = new Date(),
) {
  const offers = await candidateOffers(db, ctx);
  let jobId = query.offre;
  if (jobId) {
    // Another organization's offer, or one out of the member's scope: not found.
    await getOrgJob(db, ctx, jobId);
  } else {
    jobId =
      offers.find((offer) => offer.status === "published" && offer._count.applications > 0)?.id ??
      offers.find((offer) => offer._count.applications > 0)?.id ??
      offers[0]?.id;
  }
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const matchingLevel = (await level(db, subject, "hire.matching.level")) as
    "none" | "suggestions" | "explainable";
  if (!jobId)
    return { offers, job: null, stages: [], rows: [], visible: [], hidden: 0, matchingLevel };
  const job = await getOrgJob(db, ctx, jobId);
  const stages = await ensureStages(db, job.id);
  const applications = await db.application.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      viewedAt: true,
      status: true,
      stageId: true,
      coverLetter: true,
      cvSnapshot: true,
      attachments: true,
      screeningAnswers: true,
      matchScore: true,
      matchExplanation: true,
      profile: {
        select: {
          matchingEnabled: true,
          user: { select: { name: true } },
          skills: { where: { verified: true }, select: { skillId: true } },
        },
      },
    },
  });
  const matches =
    matchingLevel === "none"
      ? new Map<string, MatchExplanation | "disabled">()
      : await applicationMatches(db, applications, now);
  const questions = screeningQuestionsOf(job.screeningQuestions).length;
  const jobSkills = new Set(job.skills.map((item) => item.skillId));
  const rows: CandidateRow[] = applications.map((application) => {
    const stage = stages.find((item) => item.id === application.stageId) ?? stages[0]!;
    const match = matches.get(application.id);
    const answers = screeningAnswersOf(application.screeningAnswers).length;
    const letter = Boolean(application.coverLetter?.trim());
    const cv = application.cvSnapshot !== null;
    return {
      id: application.id,
      name: application.profile.user.name,
      createdAt: application.createdAt,
      unseen: !application.viewedAt && application.status === "active",
      status: application.status,
      stage: { id: stage.id, name: stage.name, kind: stage.kind, order: stage.order },
      score: match && match !== "disabled" ? match.score : null,
      letter,
      cv,
      certificate:
        sentAttachments(application.attachments).some((item) => item.type === "certificate") ||
        application.profile.skills.some((item) => jobSkills.has(item.skillId)),
      complete: cv && letter && answers >= questions,
    };
  });

  const withScores = matchingLevel !== "none";
  const sort: CandidateSort =
    candidateSorts.find((value) => value === query.tri) ?? (withScores ? "correspondance" : "date");
  const floor = withScores ? (scoreFloors.find((value) => String(value) === query.min) ?? 0) : 0;
  const filters = (query.dossier ?? "")
    .split(",")
    .filter((value): value is FileFilter => fileFilters.includes(value as FileFilter));
  const stage = stages.find((item) => item.id === query.etape) ?? null;
  const kept = (row: CandidateRow) =>
    (floor === 0 || (row.score ?? -1) >= floor) &&
    (!filters.includes("complet") || row.complete) &&
    (!filters.includes("lettre") || row.letter) &&
    (!filters.includes("nonlues") || row.unseen);
  const inStage = stage ? rows.filter((row) => row.stage.id === stage.id) : rows;
  const sorted = [...inStage].sort((a, b) =>
    sort === "correspondance" && withScores
      ? (b.score ?? -1) - (a.score ?? -1) || b.createdAt.getTime() - a.createdAt.getTime()
      : sort === "etape"
        ? a.stage.order - b.stage.order || b.createdAt.getTime() - a.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const visible = sorted.filter(kept);
  return {
    offers,
    job,
    stages: stages.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      count: rows.filter((row) => row.stage.id === item.id).length,
    })),
    stage,
    rows,
    visible,
    hidden: inStage.length - visible.length,
    sort,
    floor,
    filters,
    matchingLevel,
  };
}

// ─── The final decision ──────────────────────────────────────────────────────────────

export const decisionOutcomes = ["hired", "rejected", "withdrawn"] as const;
export type DecisionOutcome = (typeof decisionOutcomes)[number];
/** « Annulable 10 minutes » (brief recruteur § 2.6). */
export const DECISION_UNDO_MS = 10 * 60_000;

type DecisionPayload = {
  outcome: DecisionOutcome;
  from: string;
  fromId: string;
  fromStatus: string;
  to: string;
  toKind: StageKind;
  reason: string | null;
  messageId: string | null;
  poolAddedId: string | null;
  poolName: string | null;
  /** The e-mail to the talent leaves when the 10 minutes are over (`deliverDueDecisionMails`). */
  mail: "pending" | "sent" | "cancelled" | "none";
  undone?: boolean;
};

const payloadOf = (value: Prisma.JsonValue) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as unknown as Partial<DecisionPayload>)
    : {};

/**
 * Records the decision a member made, after reading the message (planche `DECIS`). Retained and
 * not retained move the application to the offer's outcome stage; « Retrait » records that the
 * candidate withdrew. The message, already read by the member, goes to the conversation; the talent
 * is told in the app at once and by e-mail once the 10 minutes to undo are over.
 */
export async function decide(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  input: {
    outcome: DecisionOutcome;
    message: string;
    reason?: (typeof rejectReasons)[number] | null;
    poolId?: string | null;
    company: string;
    signer: string;
  },
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  if (application.status === "withdrawn" || decided(application.stage.kind))
    throw new HireError("invalid");
  const target =
    input.outcome === "withdrawn"
      ? application.stage
      : application.job.stages.find((stage) => stage.kind === input.outcome);
  if (!target) throw new HireError("invalid");

  // The pool entry is only undone with the decision when the decision created it.
  let poolAddedId: string | null = null;
  let poolName: string | null = null;
  if (input.poolId) {
    const before = await db.talentPoolEntry.findUnique({
      where: { poolId_profileId: { poolId: input.poolId, profileId: application.profileId } },
      select: { poolId: true },
    });
    const pool = await addToPool(db, ctx, input.poolId, application.profileId);
    poolName = pool.name;
    if (!before) poolAddedId = pool.id;
  }

  const message = input.message.trim();
  let messageId: string | null = null;
  if (message) {
    const conversation = await ensureApplicationConversation(db, application.id);
    const sent = await sendMessage(db, { userId: ctx.userId, hire: ctx }, conversation.id, {
      body: message,
      ...(input.outcome === "withdrawn"
        ? {}
        : {
            kind: "decision" as const,
            payload: {
              outcome: input.outcome,
              company: input.company,
              jobTitle: application.job.title,
              signer: input.signer,
            },
          }),
    });
    messageId = sent.messageId;
  }

  const payload: DecisionPayload = {
    outcome: input.outcome,
    from: application.stage.name,
    fromId: application.stageId,
    fromStatus: application.status,
    to: target.name,
    toKind: target.kind,
    reason: input.outcome === "rejected" ? (input.reason ?? null) : null,
    messageId,
    poolAddedId,
    poolName,
    mail: input.outcome === "withdrawn" ? "none" : "pending",
  };
  const event = await db.applicationEvent.create({
    data: {
      applicationId: application.id,
      actorId: ctx.userId,
      type: input.outcome === "withdrawn" ? "withdrawn" : "decision",
      payload: { ...payload, by: "team", messageSent: Boolean(messageId) },
      createdAt: now,
    },
    select: { id: true },
  });
  await db.application.update({
    where: { id: application.id },
    data: {
      stageId: target.id,
      status: input.outcome === "withdrawn" ? "withdrawn" : input.outcome,
    },
  });
  if (input.outcome !== "withdrawn") {
    const company = application.job.organization.name;
    await notify(db, {
      userIds: [application.profile.user.id],
      type: input.outcome === "rejected" ? "notSelected" : "statusChange",
      payload:
        input.outcome === "rejected"
          ? { jobTitle: application.job.title, company }
          : { jobTitle: application.job.title, company, stage: target.name },
      href: `/app/suivi/${application.id}`,
    });
  }
  return { eventId: event.id, messageSent: Boolean(messageId), poolName };
}

/** The last decision of an application that can still be undone (10 minutes, not undone yet). */
export async function undoableDecision(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  now = new Date(),
) {
  const application = await getOrgApplication(db, ctx, applicationId);
  const event = [...application.events]
    .reverse()
    .find(
      (item) =>
        (item.type === "decision" || item.type === "withdrawn") &&
        payloadOf(item.payload).fromId !== undefined,
    );
  if (!event) return null;
  const payload = payloadOf(event.payload);
  const left = event.createdAt.getTime() + DECISION_UNDO_MS - now.getTime();
  return {
    event,
    payload,
    application,
    leftMs: payload.undone ? 0 : Math.max(0, left),
  };
}

/**
 * « Annuler » under « Décision enregistrée »: within 10 minutes, the application goes back where it
 * was, the message is withdrawn from the conversation, the talent's notification is removed, the
 * pool entry it created is removed and the e-mail never leaves. The history keeps both events.
 */
export async function undoDecision(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  now = new Date(),
): Promise<"undone" | "expired"> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const found = await undoableDecision(db, ctx, applicationId, now);
  if (!found || found.leftMs <= 0) return "expired";
  const { event, payload, application } = found;
  const stage = application.job.stages.find((item) => item.id === payload.fromId);
  if (!stage) return "expired";
  await db.$transaction(async (tx) => {
    // Claimed once: two « Annuler » at the same time undo only one decision.
    const claimed = await tx.applicationEvent.updateMany({
      where: { id: event.id, NOT: { payload: { path: ["undone"], equals: true } } },
      data: {
        payload: {
          ...(event.payload as Prisma.JsonObject),
          undone: true,
          mail: payload.mail === "pending" ? "cancelled" : (payload.mail ?? "none"),
        },
      },
    });
    if (claimed.count === 0) throw new HireError("invalid");
    await tx.application.update({
      where: { id: application.id },
      data: {
        stageId: stage.id,
        // A decision is only made on an active application (`decide`).
        status: "active",
      },
    });
    if (payload.messageId) {
      const sent = await tx.message.findUnique({
        where: { id: payload.messageId },
        select: { payload: true },
      });
      await tx.message.update({
        where: { id: payload.messageId },
        data: {
          hiddenAt: now,
          payload: { ...((sent?.payload as Prisma.JsonObject | null) ?? {}), retracted: true },
        },
      });
    }
    await tx.notification.deleteMany({
      where: {
        userId: application.profile.user.id,
        type: { in: ["notSelected", "statusChange"] },
        href: `/app/suivi/${application.id}`,
        createdAt: { gte: event.createdAt },
      },
    });
    if (payload.poolAddedId)
      await tx.talentPoolEntry.deleteMany({
        where: { poolId: payload.poolAddedId, profileId: application.profileId },
      });
    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        actorId: ctx.userId,
        type: "decision_undone",
        payload: { outcome: payload.outcome ?? null, to: stage.name },
        createdAt: now,
      },
    });
  });
  return "undone";
}

/**
 * Decision e-mails whose 10 minutes are over: each is claimed once (the payload goes from
 * « pending » to « sent » in one update) before the caller sends it. A decision undone in time
 * is « cancelled » and never mailed.
 */
export async function claimDueDecisionMails(db: PrismaClient, now = new Date()) {
  const due = await db.applicationEvent.findMany({
    where: {
      type: "decision",
      createdAt: { lte: new Date(now.getTime() - DECISION_UNDO_MS) },
      payload: { path: ["mail"], equals: "pending" },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, applicationId: true, payload: true },
  });
  const claimed: {
    applicationId: string;
    toKind: StageKind;
    to: string;
    message: string;
  }[] = [];
  for (const event of due) {
    const payload = payloadOf(event.payload);
    const done = await db.applicationEvent.updateMany({
      where: { id: event.id, payload: { path: ["mail"], equals: "pending" } },
      data: { payload: { ...(event.payload as Prisma.JsonObject), mail: "sent" } },
    });
    if (done.count === 0) continue;
    const message = payload.messageId
      ? ((
          await db.message.findUnique({
            where: { id: payload.messageId },
            select: { body: true, hiddenAt: true },
          })
        )?.body ?? "")
      : "";
    claimed.push({
      applicationId: event.applicationId,
      toKind: payload.toKind ?? "rejected",
      to: payload.to ?? "",
      message,
    });
  }
  return claimed;
}

/**
 * « Plus tard » on the decision screen: the candidate waits in « Décision finale » when the offer
 * has that stage and they are not there yet. Returns the stage reached, or null.
 */
export function laterStage(application: {
  stageId: string;
  stage: { order: number };
  job: { stages: { id: string; name: string; kind: StageKind; order: number }[] };
}) {
  const stage = decisionStageOf(application.job.stages);
  if (!stage || stage.id === application.stageId || stage.order < application.stage.order)
    return null;
  return stage;
}

/**
 * « Encore à décider pour cette offre » (planche r2plus `DEC_OK`): other active applications of the
 * same offer that reached the interview, newest interview first.
 */
export async function stillToDecide(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  exceptId: string,
  now = new Date(),
) {
  const job = await getOrgJob(db, ctx, jobId);
  const applications = await db.application.findMany({
    where: {
      jobId: job.id,
      id: { not: exceptId },
      status: "active",
      stage: { kind: { in: ["interview", "offer"] } },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
    select: {
      id: true,
      matchScore: true,
      matchExplanation: true,
      stage: { select: { name: true } },
      profile: { select: { matchingEnabled: true, user: { select: { name: true } } } },
      interviews: {
        where: { organizationId: ctx.organizationId, startsAt: { lte: now } },
        orderBy: { startsAt: "desc" },
        take: 1,
        select: { startsAt: true },
      },
      _count: { select: { scorecards: true } },
    },
  });
  return applications;
}

/** Can the member add the candidate to a pool from the decision (`hire.shortlist`)? */
export async function canShortlist(db: PrismaClient, ctx: HireContext) {
  return can(db, { type: "organization", id: ctx.organizationId }, "hire.shortlist");
}
