/**
 * Candidatures on the recruiter's phone (Modèle B recruteur, M5, planches 04-05): the applications
 * of every offer the member may read, by phase, the interviews of the day, the decisions, the
 * diagnostic of the CVs, « Répartir à un collègue » and « Faire une proposition ». Every query goes
 * through `jobScope` or `getOrgApplication` (golden rule n° 6). The score is the deterministic one
 * of partie 08, frozen on the application; it ranks, it never sets anyone aside (golden rule n° 3).
 */
import type { Prisma, PrismaClient, StageKind } from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { applicationMatches } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import { ensureApplicationConversation, sendMessage } from "./connect";
import {
  getOrgApplication,
  getOrgJob,
  hirePermissions,
  HireError,
  jobScope,
  moveApplication,
  type HireContext,
} from "./hire";
import { ensureStages } from "./applications";
import { candidateOffers } from "./hire-candidates";
import { recruitingMembers } from "./hire-interviews";
import { notify } from "./notifications";

const DAY = 86_400_000;
const MONTH = 30.44 * DAY;

/** The phases of the phone (« Reçue · Présélection · Entretien · Proposition · … »). */
export const RH_PHASES = [
  "recue",
  "preselection",
  "entretien",
  "proposition",
  "recrute",
  "nonretenu",
] as const;
export type RhPhase = (typeof RH_PHASES)[number];

/** « Fort potentiel »: 80 % and more (planche Recruteur-candidatures). */
export const HIGH_POTENTIAL = 80;
export const PROPOSAL_EVENT = "job_proposal";
export const ASSIGN_EVENT = "assigned";
/** The templates of « Message à N candidats » (planche Recruteur-cand-groupe). */
export const RH_GROUP_TEMPLATES = ["entretien", "document", "recue", "nonretenu"] as const;
export type RhGroupTemplate = (typeof RH_GROUP_TEMPLATES)[number];
/** The salary of a proposal, in whole USD per month (stored in cents). */
export const PROPOSAL_SALARY_MAX = 1_000_000;

export function phaseOf(kind: StageKind, proposed: boolean): RhPhase {
  if (kind === "hired") return "recrute";
  if (kind === "rejected") return "nonretenu";
  if (kind === "offer" || proposed) return "proposition";
  if (kind === "interview") return "entretien";
  if (kind === "screening" || kind === "test") return "preselection";
  return "recue";
}

/** What Orbi noted, read from the frozen explanation (never a decision). */
export type RhHighlight =
  | { key: "skills"; skills: string }
  | { key: "skillsCount"; met: number; total: number }
  | { key: "experience"; title: string; company: string }
  | { key: "city"; city: string };
export type RhCheck = { key: "declared"; skill: string } | { key: "knockout"; label: string };

export function highlightsOf(
  match: MatchExplanation | null,
  experience: { title: string; company: string } | null,
  city: string,
): { notes: RhHighlight[]; checks: RhCheck[] } {
  const notes: RhHighlight[] = [];
  const checks: RhCheck[] = [];
  const required = match?.criteria.find((item) => item.key === "skills_required");
  const evidence = required?.evidence ?? [];
  if (required && (required.status === "met" || required.status === "partial")) {
    const verified = evidence.filter((item) => item.verified && item.talent !== null);
    if (verified.length > 0)
      notes.push({
        key: "skills",
        skills: verified
          .slice(0, 3)
          .map((item) => item.skill)
          .join(", "),
      });
    else {
      // Covered at least in part (a related skill counts): never « 0 sur 4 ».
      const met = evidence.filter((item) => item.coverage > 0).length;
      if (met > 0) notes.push({ key: "skillsCount", met, total: evidence.length });
    }
  }
  if (experience) notes.push({ key: "experience", ...experience });
  if (match?.criteria.find((item) => item.key === "location")?.status === "met" && city)
    notes.push({ key: "city", city });
  for (const item of evidence)
    if (item.talent !== null && !item.verified) checks.push({ key: "declared", skill: item.skill });
  for (const knockout of match?.knockouts ?? [])
    checks.push({ key: "knockout", label: knockout.label });
  return { notes, checks: checks.slice(0, 3) };
}

const firstNameOf = (user: { firstName: string | null; name: string }) =>
  (user.firstName || user.name).split(/\s+/)[0] ?? "";

const yearsOf = (experiences: { startDate: Date; endDate: Date | null }[], now: Date) => {
  const months = experiences.reduce(
    (sum, item) =>
      sum + Math.max(0, ((item.endDate ?? now).getTime() - item.startDate.getTime()) / MONTH),
    0,
  );
  return Math.floor((months + 0.5) / 12);
};

const applicationSelect = {
  id: true,
  jobId: true,
  createdAt: true,
  viewedAt: true,
  status: true,
  matchScore: true,
  matchExplanation: true,
  assignedTo: { select: { name: true, firstName: true } },
  stage: { select: { id: true, name: true, kind: true } },
  job: { select: { id: true, title: true, city: true, status: true } },
  events: {
    where: { type: { in: [PROPOSAL_EVENT, "decision"] } },
    orderBy: { createdAt: "desc" },
    select: { type: true, createdAt: true, payload: true },
  },
  profile: {
    select: {
      matchingEnabled: true,
      headline: true,
      availability: true,
      availableFrom: true,
      sectors: true,
      desiredJobTitles: true,
      user: { select: { name: true, firstName: true, city: true } },
      experiences: {
        orderBy: [{ endDate: { sort: "desc" } }, { startDate: "desc" }],
        select: { title: true, company: true, startDate: true, endDate: true },
      },
      skills: {
        orderBy: { level: "desc" },
        take: 8,
        select: { verified: true, skill: { select: { name: true } } },
      },
    },
  },
} satisfies Prisma.ApplicationSelect;

type Selected = Prisma.ApplicationGetPayload<{ select: typeof applicationSelect }>;

export type RhRow = {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  firstName: string;
  headline: string | null;
  years: number;
  firstSkill: string | null;
  city: string | null;
  createdAt: Date;
  unseen: boolean;
  score: number | null;
  phase: RhPhase;
  stage: { id: string; name: string; kind: StageKind };
  assignee: string | null;
  proposalAt: Date | null;
  /** Rejected with the member's message. */
  answered: boolean;
  /** Still active on an offer that closed: nobody told them yet (« Sans réponse »). */
  waiting: boolean;
  notes: RhHighlight[];
  interests: string[];
  availability: { kind: "now" | "from" | "listening" | "not"; from: Date | null };
  skills: string[];
};

function rowOf(application: Selected, match: MatchExplanation | null, now: Date): RhRow {
  const profile = application.profile;
  const proposal = application.events.find((event) => event.type === PROPOSAL_EVENT) ?? null;
  const decided = application.stage.kind === "hired" || application.stage.kind === "rejected";
  const latest = profile.experiences[0] ?? null;
  const availability: RhRow["availability"] =
    profile.availability === "not_looking"
      ? { kind: "not", from: null }
      : profile.availableFrom && profile.availableFrom > now
        ? { kind: "from", from: profile.availableFrom }
        : profile.availability === "listening"
          ? { kind: "listening", from: null }
          : { kind: "now", from: null };
  return {
    id: application.id,
    jobId: application.jobId,
    jobTitle: application.job.title,
    name: profile.user.name,
    firstName: firstNameOf(profile.user),
    headline: profile.headline,
    years: yearsOf(profile.experiences, now),
    firstSkill: profile.skills[0]?.skill.name ?? null,
    city: profile.user.city,
    createdAt: application.createdAt,
    unseen: !application.viewedAt && application.status === "active",
    score: match?.score ?? null,
    phase: phaseOf(application.stage.kind, Boolean(proposal) && !decided),
    stage: application.stage,
    assignee: application.assignedTo ? firstNameOf(application.assignedTo) : null,
    proposalAt: proposal && !decided ? proposal.createdAt : null,
    answered: application.events.some((event) => event.type === "decision"),
    waiting:
      application.status === "active" &&
      !decided &&
      (application.job.status === "closed" || application.job.status === "archived"),
    ...highlightsOf(
      match,
      latest ? { title: latest.title, company: latest.company } : null,
      application.job.city,
    ),
    interests: [...profile.sectors, ...profile.desiredJobTitles].slice(0, 3),
    availability,
    skills: profile.skills.map((item) => item.skill.name),
  };
}

async function matchesOf(
  db: PrismaClient,
  ctx: HireContext,
  applications: Selected[],
  now: Date,
): Promise<{ withScores: boolean; map: Map<string, MatchExplanation | "disabled"> }> {
  const matchingLevel = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "hire.matching.level",
  );
  if (matchingLevel === "none") return { withScores: false, map: new Map() };
  return { withScores: true, map: await applicationMatches(db, applications, now) };
}

/**
 * The tab Candidatures: the offers (chips « Toutes les offres · 170 », one per offer) and the
 * applications of the one chosen, or of all, ranked by score then by date.
 */
export async function rhApplications(
  db: PrismaClient,
  ctx: HireContext,
  offerId: string | null,
  now = new Date(),
) {
  const offers = await candidateOffers(db, ctx);
  const offer = offerId ? await getOrgJob(db, ctx, offerId) : null;
  const applications = await db.application.findMany({
    where: offer
      ? { jobId: offer.id }
      : { jobId: { in: offers.map((item) => item.id) }, job: await jobScope(db, ctx) },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: applicationSelect,
  });
  const { withScores, map } = await matchesOf(db, ctx, applications, now);
  const rows = applications
    .map((application) => {
      const match = map.get(application.id);
      return rowOf(application, match && match !== "disabled" ? match : null, now);
    })
    .sort(
      (a, b) => (b.score ?? -1) - (a.score ?? -1) || b.createdAt.getTime() - a.createdAt.getTime(),
    );
  return {
    offers: offers
      .filter((item) => item._count.applications > 0 || item.id === offer?.id)
      .map((item) => ({
        id: item.id,
        title: item.title,
        count: item._count.applications,
        unseen: item.applications.length,
      })),
    offer: offer ? { id: offer.id, title: offer.title } : null,
    total: offers.reduce((sum, item) => sum + item._count.applications, 0),
    rows,
    withScores,
  };
}

/** One candidate found by the search of Candidatures: by name, skill or city (planche 065). */
export const RH_APPLICATION_SEARCH = ["tout", "nom", "competence", "ville"] as const;
export type RhApplicationSearch = (typeof RH_APPLICATION_SEARCH)[number];

export async function rhSearchApplications(
  db: PrismaClient,
  ctx: HireContext,
  query: string,
  by: RhApplicationSearch,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) return [];
  const words = query.trim().slice(0, 100);
  if (!words) return [];
  const contains = { contains: words, mode: "insensitive" as const };
  const or: Prisma.ApplicationWhereInput[] = [];
  if (by === "tout" || by === "nom") or.push({ profile: { user: { name: contains } } });
  if (by === "tout" || by === "competence")
    or.push({ profile: { skills: { some: { skill: { name: contains } } } } });
  if (by === "tout" || by === "ville") or.push({ profile: { user: { city: contains } } });
  const applications = await db.application.findMany({
    where: { job: await jobScope(db, ctx), OR: or },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: applicationSelect,
  });
  const { map } = await matchesOf(db, ctx, applications, now);
  return applications
    .map((application) => {
      const match = map.get(application.id);
      return rowOf(application, match && match !== "disabled" ? match : null, now);
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

/**
 * Entretiens (planches Recruteur-cand-entretiens, -a-documenter): today's, those ahead, and those
 * past that the member has not documented yet.
 */
export async function rhInterviews(
  db: PrismaClient,
  ctx: HireContext,
  offerId: string | null,
  timeZone: string,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).readApplications) throw new HireError("forbidden");
  const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone });
  const today = dayKey(now);
  const interviews = await db.interview.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: { in: ["pending", "confirmed", "done"] },
      application: { job: await jobScope(db, ctx), ...(offerId ? { jobId: offerId } : {}) },
      OR: [{ startsAt: { gte: new Date(now.getTime() - 30 * DAY) } }, { status: "pending" }],
    },
    orderBy: [{ startsAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    take: 200,
    select: {
      id: true,
      mode: true,
      status: true,
      startsAt: true,
      slots: true,
      link: true,
      organizerId: true,
      participantIds: true,
      application: {
        select: {
          id: true,
          matchExplanation: true,
          job: { select: { title: true } },
          profile: { select: { matchingEnabled: true, user: { select: { name: true } } } },
          scorecards: { where: { reviewerId: ctx.userId }, select: { id: true } },
        },
      },
    },
  });
  const ids = [
    ...new Set(interviews.flatMap((item) => [item.organizerId, ...item.participantIds])),
  ];
  const people = new Map(
    (
      await db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    ).map((user) => [user.id, user.name]),
  );
  const cards = interviews.map((item) => {
    const when = item.startsAt ?? item.slots[0] ?? null;
    const others = [item.organizerId, ...item.participantIds].filter((id) => id !== ctx.userId);
    const score =
      item.application.profile.matchingEnabled &&
      item.application.matchExplanation &&
      typeof item.application.matchExplanation === "object" &&
      "score" in item.application.matchExplanation
        ? Number(item.application.matchExplanation.score)
        : null;
    return {
      id: item.id,
      applicationId: item.application.id,
      name: item.application.profile.user.name,
      jobTitle: item.application.job.title,
      mode: item.mode,
      when,
      confirmed: item.status !== "pending",
      link: item.link,
      with: others.map((id) => people.get(id) ?? "").filter(Boolean),
      score: Number.isFinite(score) ? score : null,
      documented: item.application.scorecards.length > 0,
      done: item.status === "done",
    };
  });
  return {
    today: cards.filter((card) => card.when && dayKey(card.when) === today && card.when > now),
    ahead: cards.filter((card) => card.when && dayKey(card.when) > today),
    toDocument: cards.filter(
      (card) => card.confirmed && card.when !== null && card.when <= now && !card.documented,
    ),
  };
}

/**
 * Diagnostic of the CVs of one offer (planche Recruteur-cand-diagnostic): how many cover all the
 * required skills, in part, or little; each required skill and how many CVs show it; the closest.
 * Read from the frozen explanations: no new call to a model.
 */
export async function rhDiagnostic(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  now = new Date(),
) {
  const job = await getOrgJob(db, ctx, jobId);
  const { rows, withScores } = await rhApplications(db, ctx, job.id, now);
  const applications = await db.application.findMany({
    where: { jobId: job.id },
    select: {
      id: true,
      matchScore: true,
      matchExplanation: true,
      profile: { select: { matchingEnabled: true } },
    },
  });
  const map = withScores
    ? await applicationMatches(db, applications, now)
    : new Map<string, MatchExplanation | "disabled">();
  const required = job.skills.filter((item) => item.importance === "required");
  const presence = new Map(required.map((item) => [item.skillId, 0]));
  let all = 0;
  let partial = 0;
  let little = 0;
  for (const application of applications) {
    const match = map.get(application.id);
    const criterion =
      match && match !== "disabled"
        ? match.criteria.find((item) => item.key === "skills_required")
        : undefined;
    if (!criterion) continue;
    if (criterion.status === "met") all += 1;
    else if (criterion.status === "partial") partial += 1;
    else little += 1;
    for (const item of criterion.evidence ?? [])
      if (item.talent !== null && presence.has(item.skillId))
        presence.set(item.skillId, (presence.get(item.skillId) ?? 0) + 1);
  }
  const read = all + partial + little;
  const skills = required.map((item) => ({
    name: item.skill.name,
    count: presence.get(item.skillId) ?? 0,
  }));
  const missing = [...skills].sort((a, b) => a.count - b.count)[0];
  const stages = await ensureStages(db, job.id);
  const firstStep = stages.find((stage) => stage.kind === "screening") ?? null;
  return {
    job: { id: job.id, title: job.title },
    read,
    all,
    partial,
    little,
    skills,
    missing:
      missing && read > missing.count ? { name: missing.name, count: read - missing.count } : null,
    closest: rows.filter((row) => row.score !== null).slice(0, 5),
    /** « Présélectionner la personne encore en Reçue »: the closest one still in « Reçue ». */
    next:
      firstStep && withScores
        ? (rows.find((row) => row.phase === "recue" && row.score !== null) ?? null)
        : null,
    firstStep,
  };
}

/** The members a file can be entrusted to, with how many files each follows. */
export async function rhAssignees(db: PrismaClient, ctx: HireContext) {
  const members = await recruitingMembers(db, ctx);
  const [counts, titles] = await Promise.all([
    db.application.groupBy({
      by: ["assignedToId"],
      where: {
        assignedToId: { in: members.map((member) => member.id) },
        status: "active",
        job: { organizationId: ctx.organizationId },
      },
      _count: { _all: true },
    }),
    db.recruiterProfile.findMany({
      where: { userId: { in: members.map((member) => member.id) } },
      select: { userId: true, jobTitle: true },
    }),
  ]);
  return members.map((member) => ({
    ...member,
    title: titles.find((item) => item.userId === member.id)?.jobTitle ?? null,
    follows: counts.find((item) => item.assignedToId === member.id)?._count._all ?? 0,
  }));
}

/** « Répartir à un collègue »: the member chosen follows the file and is told (unless oneself). */
export async function assignApplication(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  memberId: string,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  const member = await db.membership.findFirst({
    where: {
      organizationId: ctx.organizationId,
      userId: memberId,
      status: "active",
      role: { in: ["org_owner", "org_admin", "recruiter", "hiring_manager"] },
    },
    select: { userId: true, user: { select: { name: true } } },
  });
  if (!member) throw new HireError("invalid");
  await db.application.update({
    where: { id: application.id },
    data: {
      assignedToId: member.userId,
      events: {
        create: {
          actorId: ctx.userId,
          type: ASSIGN_EVENT,
          payload: { to: member.userId, toName: member.user.name },
        },
      },
    },
  });
  if (member.userId !== ctx.userId)
    await notify(db, {
      userIds: [member.userId],
      type: "candidateAssigned",
      payload: { candidate: application.profile.user.name, jobTitle: application.job.title },
      href: `/app/hire/candidats/${application.id}`,
    });
  return member.userId;
}

/**
 * « Envoyer la proposition » (planche Recruteur-proposition): the message leaves in the
 * conversation of the application; the person accepts, refuses or asks from Messages. The
 * candidate moves to the offer's « Proposition » stage when it has one; the decision stays human.
 */
export async function sendProposal(
  db: PrismaClient,
  ctx: HireContext,
  applicationId: string,
  input: { body: string; salary: number | null; start: Date | null },
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const application = await getOrgApplication(db, ctx, applicationId);
  if (
    application.status !== "active" ||
    application.stage.kind === "hired" ||
    application.stage.kind === "rejected"
  )
    throw new HireError("invalid");
  const body = input.body.trim();
  if (body.length < 10) throw new HireError("invalid");
  const conversation = await ensureApplicationConversation(db, application.id);
  const sent = await sendMessage(
    db,
    { userId: ctx.userId, hire: ctx },
    conversation.id,
    { body },
    now,
  );
  await db.applicationEvent.create({
    data: {
      applicationId: application.id,
      actorId: ctx.userId,
      type: PROPOSAL_EVENT,
      payload: {
        salary: input.salary === null ? null : input.salary * 100,
        start: input.start?.toISOString() ?? null,
        messageId: sent.messageId,
      },
      createdAt: now,
    },
  });
  const stage = application.job.stages.find((item) => item.kind === "offer");
  const moved =
    stage && stage.id !== application.stageId
      ? await moveApplication(db, ctx, application.id, stage.id)
      : null;
  return { sent, moved };
}
