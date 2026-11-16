/**
 * « Suivi automatique » (Hire v3, lot 4; brief MVP M7). The rules that write by themselves to the
 * candidates, each one on by default and turned off by the organization, plus the member's own
 * « Résumé du matin ». Every send is an `ApplicationEvent` of the candidate's file, so the history
 * is the file itself. A refusal never leaves without a member's decision (golden rule n° 3).
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { t as translate } from "../../../emails/_components/translator";
import { DIGEST_HOUR_UTC } from "./application-digest";
import { ensureApplicationConversation } from "./connect";
import { DECISION_UNDO_MS } from "./hire-candidates";
import { hirePermissions, HireError, jobScope, type HireContext } from "./hire";
import { NEW_APPLICATION_DIGEST, notify } from "./notifications";

const DAY = 86_400_000;
const MINUTE = 60_000;

/** The rules the organization can turn off, and the event each send leaves in the file. */
export const AUTOMATION_RULES = [
  { key: "acknowledgement", icon: "mail", group: "candidates", event: "acknowledged" },
  { key: "testReminder", icon: "tests", group: "candidates", event: "test_reminded" },
  { key: "slotReminder", icon: "cal", group: "candidates", event: "slot_reminded" },
  { key: "interviewReminder", icon: "clock", group: "candidates", event: "interview_reminded" },
  { key: "piecesReminder", icon: "file", group: "candidates", event: "pieces_reminded" },
] as const;
export type AutomationRuleKey = (typeof AUTOMATION_RULES)[number]["key"];
export const AUTOMATION_KEYS = AUTOMATION_RULES.map((rule) => rule.key);
const SENT_EVENTS = AUTOMATION_RULES.map((rule) => rule.event);

/** Test reminders: two days, then four days after the test was sent; never more. */
export const TEST_REMINDER_DAYS = [2, 4] as const;
/** Slot reminder: two days after the interview slots were proposed, once. */
export const SLOT_REMINDER_DAYS = 2;
/** The time a message would have taken by hand, for « Temps gagné » (shown as an estimate). */
export const MINUTES_PER_MESSAGE = 2;

export async function ruleEnabled(
  db: PrismaClient,
  organizationId: string,
  key: AutomationRuleKey,
) {
  const row = await db.hireAutomationRule.findUnique({
    where: { organizationId_key: { organizationId, key } },
    select: { enabled: true },
  });
  return row?.enabled ?? true;
}

/** A filter of organizations that did not turn `key` off (for the background tasks). */
export function ruleOnFor(key: AutomationRuleKey): Prisma.OrganizationWhereInput {
  return { automationRules: { none: { key, enabled: false } } };
}

/** « Couper » or « Rétablir » a rule, for every offer of the organization. */
export async function setRule(
  db: PrismaClient,
  ctx: HireContext,
  key: AutomationRuleKey,
  enabled: boolean,
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  if (!AUTOMATION_KEYS.includes(key)) throw new HireError("invalid");
  await db.hireAutomationRule.upsert({
    where: { organizationId_key: { organizationId: ctx.organizationId, key } },
    create: { organizationId: ctx.organizationId, key, enabled, updatedById: ctx.userId },
    update: { enabled, updatedById: ctx.userId },
  });
}

/** « Résumé du matin »: the member's own choice (the same as in the account's notifications). */
export async function setMorningDigest(db: PrismaClient, userId: string, on: boolean) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notificationsMuted: true },
  });
  await db.user.update({
    where: { id: userId },
    data: {
      notificationsMuted: [
        ...user.notificationsMuted.filter((key) => key !== NEW_APPLICATION_DIGEST),
        ...(on ? [NEW_APPLICATION_DIGEST] : []),
      ],
    },
  });
}

function payloadOf(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

type HistoryResult = "sent" | "submitted" | "notSubmitted" | "booked" | "notBooked" | "waiting";

/** The page « Suivi automatique »: rules, figures, what waits, the last sends. */
export async function automationOverview(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const scope = await jobScope(db, ctx);
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY);
  const inOrg = { application: { job: scope } };
  const [
    rows,
    events,
    previousWeek,
    user,
    pendingDecisions,
    waitingTests,
    remindedInvites,
    remindedSlots,
  ] = await Promise.all([
    db.hireAutomationRule.findMany({
      where: { organizationId: ctx.organizationId },
      select: { key: true, enabled: true },
    }),
    db.applicationEvent.findMany({
      where: { ...inOrg, type: { in: [...SENT_EVENTS] }, createdAt: { gte: twoWeeksAgo } },
      select: { type: true, createdAt: true },
    }),
    db.applicationEvent.count({
      where: {
        ...inOrg,
        type: { in: [...SENT_EVENTS] },
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    db.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { notificationsMuted: true } }),
    db.applicationEvent.findMany({
      where: { ...inOrg, type: "decision", payload: { path: ["mail"], equals: "pending" } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        application: { select: { profile: { select: { user: { select: { name: true } } } } } },
      },
    }),
    db.skillTestInvite.count({
      where: {
        test: { organizationId: ctx.organizationId },
        application: { job: scope, status: "active" },
        submittedAt: null,
        sentAt: { lt: new Date(now.getTime() - TEST_REMINDER_DAYS[0] * DAY) },
      },
    }),
    db.skillTestInvite.findMany({
      where: {
        test: { organizationId: ctx.organizationId },
        application: { job: scope },
        reminders: { gt: 0 },
      },
      select: { submittedAt: true, remindedAt: true },
    }),
    db.applicationEvent.findMany({
      where: { ...inOrg, type: "slot_reminded" },
      select: { createdAt: true, payload: true },
    }),
  ]);
  const off = new Set(rows.filter((r) => !r.enabled).map((r) => r.key));
  const week = events.filter((e) => e.createdAt >= weekAgo);
  const countBy = new Map<string, number>();
  for (const e of events) countBy.set(e.type, (countBy.get(e.type) ?? 0) + 1);
  const slotIds = remindedSlots
    .map((e) => payloadOf(e.payload).interviewId)
    .filter((id): id is string => typeof id === "string");
  const booked = slotIds.length
    ? await db.interview.count({
        where: { id: { in: slotIds }, status: { in: ["confirmed", "done"] } },
      })
    : 0;
  // Sends per day, the last seven days (oldest first).
  const days = Array.from({ length: 7 }, (_, i) => {
    const from = new Date(now.getTime() - (6 - i) * DAY);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + DAY);
    return { from, count: week.filter((e) => e.createdAt >= from && e.createdAt < to).length };
  });
  const firstPending = pendingDecisions[0];
  return {
    canManage: hirePermissions(ctx.role).manage,
    rules: AUTOMATION_RULES.map((rule) => ({
      ...rule,
      enabled: !off.has(rule.key),
      sent: countBy.get(rule.event) ?? 0,
    })),
    digest: user.notificationsMuted.includes(NEW_APPLICATION_DIGEST),
    digestHourUtc: DIGEST_HOUR_UTC,
    decisionsSent: await db.applicationEvent.count({
      where: {
        ...inOrg,
        type: "decision",
        payload: { path: ["mail"], equals: "sent" },
        createdAt: { gte: twoWeeksAgo },
      },
    }),
    kpi: {
      week: week.length,
      weekChange: week.length - previousWeek,
      testsAfterReminder: remindedInvites.filter(
        (i) => i.submittedAt && i.remindedAt && i.submittedAt > i.remindedAt,
      ).length,
      testReminders: remindedInvites.length,
      slotsAfterReminder: booked,
      slotReminders: slotIds.length,
      minutesSaved: week.length * MINUTES_PER_MESSAGE,
    },
    todo: {
      pending: pendingDecisions.length,
      pendingFirst: firstPending
        ? {
            name: firstPending.application.profile.user.name,
            minutes: Math.max(
              1,
              Math.ceil(
                (firstPending.createdAt.getTime() + DECISION_UNDO_MS - now.getTime()) / MINUTE,
              ),
            ),
          }
        : null,
      waitingTests,
    },
    days,
  };
}

export type AutomationOverview = Awaited<ReturnType<typeof automationOverview>>;

/** « Historique »: every automatic send, newest first, with what followed. */
export async function automationHistory(
  db: PrismaClient,
  ctx: HireContext,
  now = new Date(),
  take = 50,
) {
  const scope = await jobScope(db, ctx);
  const inOrg = { application: { job: scope } };
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const events = await db.applicationEvent.findMany({
    where: {
      ...inOrg,
      OR: [
        { type: { in: [...SENT_EVENTS] } },
        { type: "decision", payload: { path: ["mail"], equals: "pending" } },
        { type: "decision", payload: { path: ["mail"], equals: "sent" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      type: true,
      createdAt: true,
      payload: true,
      applicationId: true,
      application: {
        select: {
          profile: { select: { user: { select: { name: true } } } },
          testInvites: { select: { testId: true, submittedAt: true } },
        },
      },
    },
  });
  const interviewIds = events
    .filter((e) => e.type === "slot_reminded")
    .map((e) => payloadOf(e.payload).interviewId)
    .filter((id): id is string => typeof id === "string");
  const interviews = interviewIds.length
    ? await db.interview.findMany({
        where: { id: { in: interviewIds } },
        select: { id: true, status: true },
      })
    : [];
  const rows = events.map((e) => {
    const payload = payloadOf(e.payload);
    let rule: string = AUTOMATION_RULES.find((r) => r.event === e.type)?.key ?? "decisionReply";
    let result: HistoryResult = "sent";
    let at = e.createdAt;
    if (e.type === "test_reminded") {
      const invite = e.application.testInvites.find((i) => i.testId === payload.testId);
      result = invite?.submittedAt ? "submitted" : "notSubmitted";
    } else if (e.type === "slot_reminded") {
      const status = interviews.find((i) => i.id === payload.interviewId)?.status;
      result = status === "confirmed" || status === "done" ? "booked" : "notBooked";
    } else if (e.type === "decision") {
      rule = "decisionReply";
      if (payload.mail === "pending") {
        result = "waiting";
        at = new Date(e.createdAt.getTime() + DECISION_UNDO_MS);
      }
    }
    return {
      id: e.id,
      rule,
      name: e.application.profile.user.name,
      applicationId: e.applicationId,
      at,
      result,
    };
  });
  return {
    rows,
    kpi: {
      week: rows.filter((r) => r.result !== "waiting" && r.at >= weekAgo).length,
      answers: rows.filter((r) => r.result === "submitted" || r.result === "booked").length,
      waiting: rows.filter((r) => r.result === "waiting").length,
    },
  };
}

export type AutomationHistory = Awaited<ReturnType<typeof automationHistory>>;

// ─── Background task (hourly, with the other Hire tasks) ────────────────────────

/** A company message in the conversation of the application, then a notification. */
async function companyMessage(
  db: PrismaClient,
  input: {
    applicationId: string;
    talentId: string;
    company: string;
    jobTitle: string;
    body: string;
    payload: Prisma.InputJsonObject;
    event: string;
    href?: string;
  },
  now: Date,
) {
  const conversation = await ensureApplicationConversation(db, input.applicationId);
  if (conversation.blockedAt) return false;
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: null,
      kind: "text",
      body: input.body,
      payload: input.payload,
      createdAt: now,
    },
  });
  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: now, orgHiddenAt: null },
  });
  await db.applicationEvent.create({
    data: {
      applicationId: input.applicationId,
      actorId: null,
      type: input.event,
      payload: input.payload,
      createdAt: now,
    },
  });
  await notify(db, {
    userIds: [input.talentId],
    type: "newMessage",
    payload: { senderName: input.company, company: input.company, jobTitle: input.jobTitle },
    href: input.href ?? `/app/messages/${conversation.id}`,
  });
  return true;
}

/** « Relance du test »: J+2 then J+4 after the send, to the candidates who have not handed it in. */
export async function runTestReminders(db: PrismaClient, now = new Date()) {
  const due = await db.skillTestInvite.findMany({
    where: {
      submittedAt: null,
      reminders: { lt: TEST_REMINDER_DAYS.length },
      sentAt: { lte: new Date(now.getTime() - TEST_REMINDER_DAYS[0] * DAY) },
      application: { status: "active" },
      test: { status: "live", organization: { suspendedAt: null, ...ruleOnFor("testReminder") } },
    },
    take: 200,
    select: {
      id: true,
      sentAt: true,
      reminders: true,
      testId: true,
      test: { select: { title: true, organization: { select: { name: true } } } },
      application: {
        select: {
          id: true,
          job: { select: { title: true } },
          profile: { select: { user: { select: { id: true, firstName: true } } } },
        },
      },
    },
  });
  let sent = 0;
  for (const invite of due) {
    const step = invite.reminders;
    if (now.getTime() - invite.sentAt.getTime() < TEST_REMINDER_DAYS[step]! * DAY) continue;
    const claimed = await db.skillTestInvite.updateMany({
      where: { id: invite.id, reminders: step },
      data: { reminders: step + 1, remindedAt: now },
    });
    if (claimed.count === 0) continue;
    const company = invite.test.organization.name;
    const ok = await companyMessage(
      db,
      {
        applicationId: invite.application.id,
        talentId: invite.application.profile.user.id,
        company,
        jobTitle: invite.application.job.title,
        body: translate("hireV3Suivi.mail.test", {
          title: invite.test.title,
          job: invite.application.job.title,
          company,
        }),
        payload: {
          testId: invite.testId,
          test: invite.id,
          href: `/app/test/${invite.id}`,
          step: step + 1,
        },
        event: "test_reminded",
        href: `/app/test/${invite.id}`,
      },
      now,
    );
    if (ok) sent++;
  }
  return sent;
}

/** « Relance du créneau »: two days after the slots were proposed, once, if none was chosen. */
export async function runSlotReminders(db: PrismaClient, now = new Date()) {
  const due = await db.interview.findMany({
    where: {
      status: "pending",
      startsAt: null,
      createdAt: { lte: new Date(now.getTime() - SLOT_REMINDER_DAYS * DAY) },
      organization: { suspendedAt: null, ...ruleOnFor("slotReminder") },
      application: { status: "active", events: { none: { type: "slot_reminded" } } },
    },
    take: 200,
    select: {
      id: true,
      slots: true,
      organization: { select: { name: true } },
      application: {
        select: {
          id: true,
          job: { select: { title: true } },
          profile: { select: { user: { select: { id: true } } } },
        },
      },
    },
  });
  let sent = 0;
  for (const interview of due) {
    if (!interview.slots.some((slot) => slot > now)) continue;
    const company = interview.organization.name;
    const ok = await companyMessage(
      db,
      {
        applicationId: interview.application.id,
        talentId: interview.application.profile.user.id,
        company,
        jobTitle: interview.application.job.title,
        body: translate("hireV3Suivi.mail.slot", { job: interview.application.job.title, company }),
        payload: { interviewId: interview.id },
        event: "slot_reminded",
      },
      now,
    );
    if (ok) sent++;
  }
  return sent;
}
