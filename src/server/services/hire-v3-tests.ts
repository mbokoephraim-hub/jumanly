/**
 * Tests de compétences (Hire v3 « Tests », MVP recruteur M5): the organization's tests, attached to
 * an offer or kept in its library, sent to candidates of the offer, taken once by each candidate
 * from the conversation of their application, corrected automatically for choices and by the team
 * for written answers. Golden rules: rights by key (`hire.assessments`), every query filtered by
 * `organizationId` (n° 6), a test not taken never sets anybody aside (n° 3), real figures only.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { median, scoreAttempt, scoreBuckets } from "@/lib/skill-test-score";
import { can } from "@/server/entitlements";
import { t as translate } from "../../../emails/_components/translator";
import { ensureApplicationConversation } from "./connect";
import { HireError, hirePermissions, jobScope, type HireContext } from "./hire";
import { notify } from "./notifications";

export const ASSESSMENTS_ENTITLEMENT = "hire.assessments";
const DAY = 86_400_000;
export const TEST_LEVELS = ["beginner", "intermediate", "advanced", "all"] as const;
export const TEST_DOMAINS = ["data", "finance", "service", "transversal", "langues"] as const;
export type TestDomain = (typeof TEST_DOMAINS)[number];
export const QUESTIONS_MAX = 30;

/**
 * The library (`TLIB` of the prototype): templates ready to adapt. Their words live in
 * textes/textes-application.md (`hireV3TestsLib.<key>.*`); only the structure is here.
 */
export const TEST_LIBRARY: {
  key: string;
  domain: TestDomain;
  level: (typeof TEST_LEVELS)[number];
  minutes: number;
  questions: { answer: number; choices: number }[];
}[] = [
  {
    key: "excel",
    domain: "finance",
    level: "intermediate",
    minutes: 20,
    questions: [
      { answer: 0, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 0, choices: 4 },
    ],
  },
  {
    key: "relation",
    domain: "service",
    level: "beginner",
    minutes: 15,
    questions: [
      { answer: 1, choices: 4 },
      { answer: 2, choices: 4 },
      { answer: 0, choices: 4 },
      { answer: 1, choices: 4 },
    ],
  },
  {
    key: "sql",
    domain: "data",
    level: "intermediate",
    minutes: 20,
    questions: [
      { answer: 1, choices: 4 },
      { answer: 2, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 1, choices: 4 },
    ],
  },
  {
    key: "projet",
    domain: "transversal",
    level: "intermediate",
    minutes: 20,
    questions: [
      { answer: 1, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 0, choices: 4 },
      { answer: 1, choices: 4 },
    ],
  },
  {
    key: "ohada",
    domain: "finance",
    level: "advanced",
    minutes: 30,
    questions: [
      { answer: 1, choices: 4 },
      { answer: 0, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 2, choices: 4 },
    ],
  },
  {
    key: "anglais",
    domain: "langues",
    level: "all",
    minutes: 20,
    questions: [
      { answer: 1, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 1, choices: 4 },
      { answer: 0, choices: 4 },
    ],
  },
];

type Translate = (key: string) => string;
const lib = translate as unknown as Translate;

async function allowed(db: PrismaClient, ctx: HireContext) {
  return can(db, { type: "organization", id: ctx.organizationId }, ASSESSMENTS_ENTITLEMENT);
}

async function guardManage(db: PrismaClient, ctx: HireContext) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!(await allowed(db, ctx))) throw new HireError("forbidden");
}

async function orgTest(db: PrismaClient, ctx: HireContext, testId: string) {
  const test = await db.skillTest.findFirst({
    where: { id: testId, organizationId: ctx.organizationId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test) throw new HireError("notFound");
  return test;
}

function asRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// ─── Lists ───────────────────────────────────────────────────────────────────────

/** « Mes tests »: the tests, what waits, the figures of the month, from the most advanced. */
export async function testsOverview(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const [tests, enabled] = await Promise.all([
    db.skillTest.findMany({
      where: { organizationId: ctx.organizationId, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      include: {
        job: { select: { id: true, title: true, _count: { select: { applications: true } } } },
        _count: { select: { questions: true } },
        invites: {
          select: {
            sentAt: true,
            startedAt: true,
            submittedAt: true,
            score: true,
            reminders: true,
          },
        },
      },
    }),
    allowed(db, ctx),
  ]);
  const rows = tests.map((test) => {
    const sent = test.invites.length;
    const done = test.invites.filter((i) => i.submittedAt);
    const scored = done.map((i) => i.score).filter((s): s is number => s !== null);
    return {
      id: test.id,
      title: test.title,
      job: test.job ? { id: test.job.id, title: test.job.title } : null,
      candidates: test.job?._count.applications ?? 0,
      questions: test._count.questions,
      minutes: test.minutes,
      status: test.status as "draft" | "live",
      sent,
      submitted: done.length,
      toGrade: done.length - scored.length,
      average: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
    };
  });
  const invites = tests.flatMap((test) => test.invites);
  const recent = invites.filter((i) => i.sentAt >= monthAgo);
  const done = invites.filter((i) => i.submittedAt);
  const scores = done.map((i) => i.score).filter((s): s is number => s !== null);
  const durations = done
    .filter((i) => i.startedAt && i.submittedAt)
    .map((i) => (i.submittedAt!.getTime() - i.startedAt!.getTime()) / 60_000);
  const waiting = invites.filter(
    (i) => !i.submittedAt && now.getTime() - i.sentAt.getTime() > 2 * DAY,
  ).length;
  const today = done.filter((i) => now.getTime() - i.submittedAt!.getTime() < DAY).length;
  return {
    enabled,
    canManage: hirePermissions(ctx.role).manage,
    tests: rows,
    sentThisMonth: recent.length,
    kpi: {
      submitted: done.length,
      sent: invites.length,
      average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      duration: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null,
      reminders: invites.reduce((a, i) => a + i.reminders, 0),
    },
    todo: {
      toGrade: rows.reduce((a, r) => a + r.toGrade, 0),
      today,
      waiting,
      drafts: rows.filter((r) => r.status === "draft"),
    },
  };
}

export type TestsOverview = Awaited<ReturnType<typeof testsOverview>>;

/** « Résultats » of one test: ranking, distribution, hardest questions. */
export async function testResults(db: PrismaClient, ctx: HireContext, testId: string) {
  const test = await orgTest(db, ctx, testId);
  const scope = await jobScope(db, ctx);
  const invites = await db.skillTestInvite.findMany({
    where: { testId: test.id, application: { job: scope } },
    orderBy: [{ score: { sort: "desc", nulls: "last" } }, { submittedAt: "desc" }],
    select: {
      id: true,
      sentAt: true,
      startedAt: true,
      submittedAt: true,
      score: true,
      answers: true,
      applicationId: true,
      application: {
        select: { matchScore: true, profile: { select: { user: { select: { name: true } } } } },
      },
    },
  });
  const done = invites.filter((i) => i.submittedAt);
  const scores = done.map((i) => i.score).filter((s): s is number => s !== null);
  const questions = test.questions.map((q) => {
    const answered = done.filter((i) => asRecord(i.answers)[q.id] !== undefined);
    const right =
      q.kind === "choice"
        ? answered.filter((i) => asRecord(i.answers)[q.id] === q.answer).length
        : null;
    return {
      id: q.id,
      prompt: q.prompt,
      rate:
        right === null || answered.length === 0
          ? null
          : Math.round((right / answered.length) * 100),
    };
  });
  return {
    test: { id: test.id, title: test.title, minutes: test.minutes },
    sent: invites.length,
    submitted: done.length,
    average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    median: median(scores),
    passed: scores.filter((s) => s >= 60).length,
    buckets: scoreBuckets(scores),
    hardest: questions
      .filter((q) => q.rate !== null)
      .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))
      .slice(0, 4),
    ranking: done.map((i) => ({
      inviteId: i.id,
      applicationId: i.applicationId,
      name: i.application.profile.user.name,
      score: i.score,
      matchScore: i.application.matchScore,
      minutes:
        i.startedAt && i.submittedAt
          ? Math.max(1, Math.round((i.submittedAt.getTime() - i.startedAt.getTime()) / 60_000))
          : null,
    })),
  };
}

export type TestResults = Awaited<ReturnType<typeof testResults>>;

/** The tests that have results, for the selector of « Résultats ». */
export async function testsWithResults(db: PrismaClient, ctx: HireContext) {
  const tests = await db.skillTest.findMany({
    where: { organizationId: ctx.organizationId, invites: { some: {} } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      job: { select: { title: true } },
      _count: { select: { invites: { where: { submittedAt: { not: null } } } } },
    },
  });
  return tests.map((test) => ({
    id: test.id,
    title: test.title,
    job: test.job?.title ?? null,
    submitted: test._count.invites,
  }));
}

/** The library, with its words. */
export function testLibrary() {
  return TEST_LIBRARY.map((tpl) => ({
    key: tpl.key,
    title: lib(`hireV3TestsLib.${tpl.key}.title`),
    domain: tpl.domain,
    level: tpl.level,
    minutes: tpl.minutes,
    questions: tpl.questions.length,
  }));
}

// ─── Writing ─────────────────────────────────────────────────────────────────────

/** A new test: blank, from an offer (its title), or copied from a library template. */
export async function createTest(
  db: PrismaClient,
  ctx: HireContext,
  input: { title?: string; jobId?: string | null; templateKey?: string | null },
) {
  await guardManage(db, ctx);
  let jobId: string | null = null;
  let jobTitle: string | null = null;
  if (input.jobId) {
    const scope = await jobScope(db, ctx);
    const job = await db.job.findFirst({
      where: { AND: [scope, { id: input.jobId }] },
      select: { id: true, title: true },
    });
    if (!job) throw new HireError("notFound");
    jobId = job.id;
    jobTitle = job.title;
  }
  const tpl = TEST_LIBRARY.find((x) => x.key === input.templateKey) ?? null;
  const title =
    input.title?.trim() ||
    (tpl ? lib(`hireV3TestsLib.${tpl.key}.title`) : null) ||
    (jobTitle
      ? translate("hireV3Tests.newFor", { job: jobTitle })
      : translate("hireV3Tests.newTitle"));
  return db.skillTest.create({
    data: {
      organizationId: ctx.organizationId,
      jobId,
      title: title.slice(0, 120),
      level: tpl?.level ?? "intermediate",
      minutes: tpl?.minutes ?? 30,
      templateKey: tpl?.key ?? null,
      createdById: ctx.userId,
      questions: tpl
        ? {
            create: tpl.questions.map((q, i) => ({
              order: i,
              kind: "choice",
              prompt: lib(`hireV3TestsLib.${tpl.key}.q${i}.prompt`),
              choices: Array.from({ length: q.choices }, (_, j) =>
                lib(`hireV3TestsLib.${tpl.key}.q${i}.c${j}`),
              ),
              answer: q.answer,
            })),
          }
        : undefined,
    },
    select: { id: true },
  });
}

export async function updateTest(
  db: PrismaClient,
  ctx: HireContext,
  testId: string,
  input: {
    title: string;
    jobId: string | null;
    minutes: number;
    level: string;
    instructions: string;
  },
) {
  await guardManage(db, ctx);
  const test = await orgTest(db, ctx, testId);
  let jobId: string | null = null;
  if (input.jobId) {
    const scope = await jobScope(db, ctx);
    const job = await db.job.findFirst({ where: { AND: [scope, { id: input.jobId }] } });
    if (!job) throw new HireError("notFound");
    jobId = job.id;
  }
  await db.skillTest.update({
    where: { id: test.id },
    data: {
      title: input.title.trim().slice(0, 120) || test.title,
      jobId,
      minutes: Math.min(180, Math.max(5, Math.round(input.minutes))),
      level: (TEST_LEVELS as readonly string[]).includes(input.level) ? input.level : test.level,
      instructions: input.instructions.trim().slice(0, 1000) || null,
    },
  });
}

export async function addQuestion(
  db: PrismaClient,
  ctx: HireContext,
  testId: string,
  input: {
    kind: "choice" | "short";
    prompt: string;
    choices: string[];
    answer: number | null;
    points: number;
  },
) {
  await guardManage(db, ctx);
  const test = await orgTest(db, ctx, testId);
  if (test.questions.length >= QUESTIONS_MAX) throw new HireError("invalid");
  const choices = input.choices
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (input.kind === "choice") {
    if (choices.length < 2 || input.answer === null || input.answer >= choices.length)
      throw new HireError("invalid");
  }
  await db.skillTestQuestion.create({
    data: {
      testId: test.id,
      order: (test.questions.at(-1)?.order ?? -1) + 1,
      kind: input.kind,
      prompt: input.prompt.trim().slice(0, 600),
      choices: input.kind === "choice" ? choices : [],
      answer: input.kind === "choice" ? input.answer : null,
      points: Math.min(10, Math.max(1, Math.round(input.points))),
    },
  });
}

export async function removeQuestion(
  db: PrismaClient,
  ctx: HireContext,
  testId: string,
  questionId: string,
) {
  await guardManage(db, ctx);
  const test = await orgTest(db, ctx, testId);
  await db.skillTestQuestion.deleteMany({ where: { id: questionId, testId: test.id } });
}

export async function archiveTest(db: PrismaClient, ctx: HireContext, testId: string) {
  await guardManage(db, ctx);
  const test = await orgTest(db, ctx, testId);
  await db.skillTest.update({ where: { id: test.id }, data: { status: "archived" } });
}

/**
 * « Envoyer »: the test to the active candidates of its offer who have not received it, or only to
 * `applicationIds`. Written in the conversation of each application, in the company's name, with
 * the link; the candidate is notified. Returns how many received it.
 */
export async function sendTest(
  db: PrismaClient,
  ctx: HireContext,
  testId: string,
  applicationIds?: string[],
  now = new Date(),
) {
  await guardManage(db, ctx);
  const test = await orgTest(db, ctx, testId);
  if (test.questions.length === 0 || !test.jobId) throw new HireError("invalid");
  const scope = await jobScope(db, ctx);
  const applications = await db.application.findMany({
    where: {
      jobId: test.jobId,
      job: scope,
      status: "active",
      testInvites: { none: { testId: test.id } },
      ...(applicationIds ? { id: { in: applicationIds } } : {}),
    },
    select: {
      id: true,
      job: { select: { title: true, organization: { select: { name: true } } } },
      profile: { select: { user: { select: { id: true, firstName: true } } } },
    },
  });
  let sent = 0;
  for (const application of applications) {
    const invite = await db.skillTestInvite.create({
      data: {
        testId: test.id,
        applicationId: application.id,
        sentById: ctx.userId,
        sentAt: now,
        dueAt: new Date(now.getTime() + 7 * DAY),
      },
      select: { id: true },
    });
    const conversation = await ensureApplicationConversation(db, application.id);
    const company = application.job.organization.name;
    const href = `/app/test/${invite.id}`;
    if (!conversation.blockedAt) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: null,
          kind: "text",
          body: translate("hireV3Tests.message", {
            title: test.title,
            job: application.job.title,
            minutes: test.minutes,
            company,
          }),
          payload: { test: invite.id, href },
          createdAt: now,
        },
      });
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: now, orgHiddenAt: null },
      });
    }
    await db.applicationEvent.create({
      data: {
        applicationId: application.id,
        actorId: ctx.userId,
        type: "test_sent",
        payload: { testId: test.id, title: test.title },
        createdAt: now,
      },
    });
    await notify(db, {
      userIds: [application.profile.user.id],
      type: "newMessage",
      payload: { senderName: company, company, jobTitle: application.job.title },
      href,
    });
    sent++;
  }
  if (test.status === "draft")
    await db.skillTest.update({ where: { id: test.id }, data: { status: "live" } });
  return sent;
}

/** The team's points for written answers; the score follows once all are graded. */
export async function gradeInvite(
  db: PrismaClient,
  ctx: HireContext,
  inviteId: string,
  grades: Record<string, number>,
) {
  if (!hirePermissions(ctx.role).evaluate) throw new HireError("forbidden");
  const scope = await jobScope(db, ctx);
  const invite = await db.skillTestInvite.findFirst({
    where: {
      id: inviteId,
      test: { organizationId: ctx.organizationId },
      application: { job: scope },
    },
    include: { test: { include: { questions: true } } },
  });
  if (!invite) throw new HireError("notFound");
  const merged = { ...asRecord(invite.grades), ...grades };
  const { score } = scoreAttempt(invite.test.questions, asRecord(invite.answers), merged);
  await db.skillTestInvite.update({
    where: { id: invite.id },
    data: { grades: merged as Prisma.InputJsonObject, score },
  });
}

// ─── The candidate ───────────────────────────────────────────────────────────────

/** The candidate's test, only for the person who applied (no other account, golden rule n° 5). */
export async function inviteForTalent(db: PrismaClient, userId: string, inviteId: string) {
  const invite = await db.skillTestInvite.findFirst({
    where: { id: inviteId, application: { profile: { userId } } },
    include: {
      test: {
        include: {
          questions: { orderBy: { order: "asc" } },
          organization: { select: { name: true } },
          job: { select: { title: true } },
        },
      },
    },
  });
  return invite;
}

export async function startInvite(
  db: PrismaClient,
  userId: string,
  inviteId: string,
  now = new Date(),
) {
  const invite = await inviteForTalent(db, userId, inviteId);
  if (!invite) throw new HireError("notFound");
  if (!invite.startedAt)
    await db.skillTestInvite.update({ where: { id: invite.id }, data: { startedAt: now } });
}

/** One attempt: the answers are kept, choices corrected, written answers wait for the team. */
export async function submitInvite(
  db: PrismaClient,
  userId: string,
  inviteId: string,
  answers: Record<string, number | string>,
  now = new Date(),
) {
  const invite = await inviteForTalent(db, userId, inviteId);
  if (!invite) throw new HireError("notFound");
  if (invite.submittedAt) throw new HireError("invalid");
  const kept: Record<string, number | string> = {};
  for (const q of invite.test.questions) {
    const value = answers[q.id];
    if (q.kind === "choice" && typeof value === "number" && value >= 0 && value < q.choices.length)
      kept[q.id] = value;
    if (q.kind !== "choice" && typeof value === "string" && value.trim())
      kept[q.id] = value.trim().slice(0, 4000);
  }
  const { score } = scoreAttempt(invite.test.questions, kept, {});
  await db.skillTestInvite.update({
    where: { id: invite.id },
    data: { answers: kept, score, submittedAt: now, startedAt: invite.startedAt ?? now },
  });
  await db.applicationEvent.create({
    data: {
      applicationId: invite.applicationId,
      actorId: userId,
      type: "test_submitted",
      payload: { testId: invite.testId, score },
      createdAt: now,
    },
  });
}

// ─── The candidate's file (onglet « Test ») ─────────────────────────────────────

export async function candidateTest(db: PrismaClient, ctx: HireContext, applicationId: string) {
  const invite = await db.skillTestInvite.findFirst({
    where: { applicationId, test: { organizationId: ctx.organizationId } },
    orderBy: { sentAt: "desc" },
    include: { test: { include: { questions: { orderBy: { order: "asc" } } } } },
  });
  if (!invite) return null;
  const answers = asRecord(invite.answers);
  const grades = asRecord(invite.grades);
  const { perQuestion, toGrade } = scoreAttempt(invite.test.questions, answers, grades);
  let better: number | null = null;
  if (invite.score !== null) {
    const others = await db.skillTestInvite.findMany({
      where: { testId: invite.testId, score: { not: null }, id: { not: invite.id } },
      select: { score: true },
    });
    if (others.length > 0)
      better = Math.round(
        (others.filter((o) => (o.score ?? 0) < invite.score!).length / others.length) * 100,
      );
  }
  return {
    id: invite.id,
    title: invite.test.title,
    minutes: invite.test.minutes,
    sentAt: invite.sentAt,
    submittedAt: invite.submittedAt,
    taken:
      invite.startedAt && invite.submittedAt
        ? Math.max(
            1,
            Math.round((invite.submittedAt.getTime() - invite.startedAt.getTime()) / 60_000),
          )
        : null,
    score: invite.score,
    better,
    toGrade,
    questions: invite.test.questions.map((q) => ({
      id: q.id,
      kind: q.kind,
      prompt: q.prompt,
      answer: answers[q.id] ?? null,
      choice:
        q.kind === "choice" && typeof answers[q.id] === "number"
          ? (q.choices[answers[q.id] as number] ?? null)
          : null,
      rate:
        perQuestion[q.id] === null || perQuestion[q.id] === undefined
          ? null
          : Math.round(perQuestion[q.id]! * 100),
      points: q.points,
      graded: typeof grades[q.id] === "number" ? (grades[q.id] as number) : null,
    })),
  };
}

export type CandidateTest = Awaited<ReturnType<typeof candidateTest>>;

/** Tests rendered over a period, for the home's « Tests rendus » tile. */
export async function testsSubmitted(
  db: PrismaClient,
  ctx: HireContext,
  range: { gte: Date; lt: Date },
) {
  const scope = await jobScope(db, ctx);
  return db.skillTestInvite.count({
    where: {
      test: { organizationId: ctx.organizationId },
      application: { job: scope },
      submittedAt: range,
    },
  });
}

/** The tests a member can edit: the test and the offers it can be attached to. */
export async function testEditor(db: PrismaClient, ctx: HireContext, testId: string) {
  const test = await orgTest(db, ctx, testId);
  const scope = await jobScope(db, ctx);
  const [jobs, pending] = await Promise.all([
    db.job.findMany({
      where: { AND: [scope, { status: { in: ["published", "paused", "draft"] } }] },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true },
    }),
    test.jobId
      ? db.application.count({
          where: {
            jobId: test.jobId,
            status: "active",
            testInvites: { none: { testId: test.id } },
          },
        })
      : 0,
  ]);
  return { test, jobs, pending, enabled: await allowed(db, ctx) };
}
