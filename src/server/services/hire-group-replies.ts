/**
 * Grouped replies (brief recruteur § 2.18, planches recruteur-4 § 2 `ENV`, `ENV_OK`, `MSG_LONG`,
 * `MSG_REFUS`): one long template for the retained (invitation to the interview) or the others (a
 * respectful answer), sent by message Jumanly and, if chosen, by e-mail. The member reads the
 * template and the list, ticks « J'ai relu », confirms the number; nothing leaves before. Each
 * message can be undone for 10 minutes; the e-mails leave when the 10 minutes are over.
 *
 * The personal sentence of each message comes from the file (the skill of the offer it proves), a
 * fixed rule: no model writes to a candidate. Golden rule n° 3: the non retained are answered by the
 * member's decision (`decide`), never by Orbi; golden rule n° 6: every read goes through the offer.
 */
import { randomUUID } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { skillProofs } from "./cv-analysis";
import { ensureApplicationConversation, sendMessage } from "./connect";
import { getOrgJob, HireError, hirePermissions, type HireContext } from "./hire";
import { decide, DECISION_UNDO_MS, undoDecision } from "./hire-candidates";
import { notify } from "./notifications";

export const replyGroups = ["retenus", "non-retenus", "selection"] as const;
export type ReplyGroup = (typeof replyGroups)[number];
export const GROUP_REPLY_EVENT = "group_reply";
export const GROUP_BODY_MAX = 4000;
/** At most this many people in one sending. */
export const GROUP_MAX = 200;

/** The sentence each person reads about their file (`hireReplies.strength.*`). */
export type Strength =
  { key: "certificate" | "project" | "experience"; skill: string } | { key: "generic" };

export function strengthOf(application: Parameters<typeof skillProofs>[0]): Strength {
  const proofs = skillProofs(application).sort((a, b) => Number(b.required) - Number(a.required));
  for (const kind of ["certificate", "project", "experience"] as const) {
    const found = proofs.find((item) => item.proof === kind);
    if (found) return { key: kind, skill: found.name };
  }
  return { key: "generic" };
}

/** The template with the person's values: `{prenom}`, `{point_fort}`, `{poste}`, `{entreprise}`. */
export function personalize(
  body: string,
  values: { firstName: string; strength: string; jobTitle: string; company: string },
) {
  return body.replace(/\{(prenom|point_fort|poste|entreprise)\}/g, (_, key: string) =>
    key === "prenom"
      ? values.firstName
      : key === "point_fort"
        ? values.strength
        : key === "poste"
          ? values.jobTitle
          : values.company,
  );
}

const firstNameOf = (user: { firstName: string | null; name: string }) =>
  (user.firstName || user.name).split(/\s+/)[0] ?? "";

/**
 * The people a grouped reply goes to: the retained (the list), the others still active (not in the
 * list), or a selection made in the ATS. Only active applications of the offer.
 */
export async function replyRecipients(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  group: ReplyGroup,
  ids: string[] = [],
) {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const job = await getOrgJob(db, ctx, jobId);
  const where: Prisma.ApplicationWhereInput = {
    jobId: job.id,
    status: "active",
    stage: { kind: { notIn: ["hired", "rejected"] } },
    ...(group === "retenus"
      ? { shortlistedAt: { not: null } }
      : group === "non-retenus"
        ? { shortlistedAt: null }
        : { id: { in: ids.slice(0, GROUP_MAX) } }),
  };
  const applications = await db.application.findMany({
    where,
    orderBy: [{ matchScore: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }],
    take: GROUP_MAX,
    select: {
      id: true,
      profileId: true,
      profile: {
        select: {
          user: { select: { id: true, name: true, firstName: true } },
          skills: {
            select: { skillId: true, verified: true, proof: true, source: true, level: true },
          },
        },
      },
    },
  });
  const proofJob = {
    skills: job.skills.map((item) => ({
      skillId: item.skillId,
      importance: item.importance,
      skill: { name: item.skill.name },
    })),
  };
  return {
    job,
    people: applications.map((application) => ({
      id: application.id,
      userId: application.profile.user.id,
      name: application.profile.user.name,
      firstName: firstNameOf(application.profile.user),
      strength: strengthOf({ job: proofJob, profile: application.profile }),
    })),
  };
}

export type GroupSendInput = {
  group: ReplyGroup;
  ids?: string[];
  body: string;
  email: boolean;
  reviewed: boolean;
  /** Turns a person's strength into the sentence of their message. */
  strengthText: (strength: Strength) => string;
  /** A selection told « non retenue » (phone, « Réponse non retenue »): the decision with it. */
  reject?: boolean;
  company: string;
  signer: string;
};

export type GroupSendResult =
  | { ok: true; batchId: string; count: number }
  | { ok: false; error: "reviewed" | "empty" | "nobody" };

/**
 * « Envoyer à N » once the member has read: the retained get the invitation in their conversation
 * (and by e-mail after 10 minutes); the others get the member's decision « non retenue » with the
 * message (`decide`, undone the same way). One batch id ties the messages for « Annuler ».
 */
export async function sendGroupReply(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  input: GroupSendInput,
  now = new Date(),
): Promise<GroupSendResult> {
  if (!input.reviewed) return { ok: false, error: "reviewed" };
  const body = input.body.trim().slice(0, GROUP_BODY_MAX);
  if (body.length < 10) return { ok: false, error: "empty" };
  const { job, people } = await replyRecipients(db, ctx, jobId, input.group, input.ids);
  if (people.length === 0) return { ok: false, error: "nobody" };
  const batchId = randomUUID();
  const rejecting = input.group === "non-retenus" || input.reject === true;
  for (const person of people) {
    const message = personalize(body, {
      firstName: person.firstName,
      strength: input.strengthText(person.strength),
      jobTitle: job.title,
      company: input.company,
    });
    if (rejecting) {
      await decide(
        db,
        ctx,
        person.id,
        {
          outcome: "rejected",
          message,
          reason: null,
          company: input.company,
          signer: input.signer,
          mail: input.email,
          batchId,
        },
        now,
      );
      continue;
    }
    const conversation = await ensureApplicationConversation(db, person.id);
    const sent = await sendMessage(
      db,
      { userId: ctx.userId, hire: ctx },
      conversation.id,
      { body: message, payload: { batchId } },
      now,
    );
    await db.applicationEvent.create({
      data: {
        applicationId: person.id,
        actorId: ctx.userId,
        type: GROUP_REPLY_EVENT,
        payload: {
          batchId,
          group: input.group,
          messageId: sent.messageId,
          mail: input.email ? "pending" : "none",
          // Written as false (not left out): a JSON path that is missing never matches a filter.
          undone: false,
        },
        createdAt: now,
      },
    });
    await notify(db, {
      userIds: [person.userId],
      type: "newMessage",
      payload: { senderName: input.signer, company: input.company, jobTitle: job.title },
      href: `/app/messages/${conversation.id}`,
    });
  }
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "hire.group_reply",
      targetType: "job",
      targetId: job.id,
      organizationId: ctx.organizationId,
      metadata: { batchId, group: input.group, count: people.length, email: input.email },
    },
  });
  return { ok: true, batchId, count: people.length };
}

/** The events of a batch, read through the offer (golden rule n° 6). */
async function batchEvents(db: PrismaClient, ctx: HireContext, jobId: string, batchId: string) {
  const job = await getOrgJob(db, ctx, jobId);
  return db.applicationEvent.findMany({
    where: {
      application: { jobId: job.id },
      type: { in: [GROUP_REPLY_EVENT, "decision"] },
      payload: { path: ["batchId"], equals: batchId },
    },
    select: {
      id: true,
      type: true,
      createdAt: true,
      payload: true,
      applicationId: true,
      application: { select: { profile: { select: { userId: true } } } },
    },
  });
}

/** What the confirmation shows: how many, which group, the time left to undo. */
export async function batchState(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  batchId: string,
  now = new Date(),
) {
  const events = await batchEvents(db, ctx, jobId, batchId);
  if (events.length === 0) return null;
  const first = events.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
  const undone = events.every(
    (event) => (event.payload as Record<string, unknown> | null)?.undone === true,
  );
  return {
    count: events.length,
    rejecting: events.some((event) => event.type === "decision"),
    undone,
    leftMs: undone ? 0 : Math.max(0, first.createdAt.getTime() + DECISION_UNDO_MS - now.getTime()),
  };
}

/**
 * « Annuler » within 10 minutes: every message of the batch is withdrawn, the decisions undone,
 * the notifications removed and no e-mail leaves. After 10 minutes nothing changes.
 */
export async function undoGroupReply(
  db: PrismaClient,
  ctx: HireContext,
  jobId: string,
  batchId: string,
  now = new Date(),
): Promise<"undone" | "expired"> {
  if (!hirePermissions(ctx.role).manage) throw new HireError("forbidden");
  const state = await batchState(db, ctx, jobId, batchId, now);
  if (!state || state.leftMs <= 0) return "expired";
  const events = await batchEvents(db, ctx, jobId, batchId);
  for (const event of events) {
    if (event.type === "decision") {
      await undoDecision(db, ctx, event.applicationId, now).catch(() => "expired");
      continue;
    }
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const claimed = await db.applicationEvent.updateMany({
      where: {
        id: event.id,
        AND: [
          { payload: { path: ["undone"], equals: false } },
          { NOT: { payload: { path: ["mail"], equals: "sent" } } },
        ],
      },
      data: {
        payload: {
          ...(payload as Prisma.JsonObject),
          undone: true,
          mail: payload.mail === "pending" ? "cancelled" : (payload.mail as string),
        },
      },
    });
    if (claimed.count === 0) continue;
    if (typeof payload.messageId === "string")
      await db.message.updateMany({
        where: { id: payload.messageId },
        data: { hiddenAt: now, payload: { batchId, retracted: true } },
      });
    await db.notification.deleteMany({
      where: {
        userId: event.application.profile.userId,
        type: "newMessage",
        createdAt: { gte: event.createdAt },
      },
    });
  }
  return "undone";
}

/**
 * E-mails of the retained whose 10 minutes are over: claimed once each (« pending » → « sent »)
 * before the caller sends them; an undone batch is « cancelled » and never mailed.
 */
export async function claimDueGroupMails(db: PrismaClient, now = new Date()) {
  const due = await db.applicationEvent.findMany({
    where: {
      type: GROUP_REPLY_EVENT,
      createdAt: { lte: new Date(now.getTime() - DECISION_UNDO_MS) },
      payload: { path: ["mail"], equals: "pending" },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, applicationId: true, payload: true },
  });
  const claimed: { applicationId: string; message: string }[] = [];
  for (const event of due) {
    const done = await db.applicationEvent.updateMany({
      where: { id: event.id, payload: { path: ["mail"], equals: "pending" } },
      data: { payload: { ...(event.payload as Prisma.JsonObject), mail: "sent" } },
    });
    if (done.count === 0) continue;
    const messageId = (event.payload as Record<string, unknown>).messageId;
    const message =
      typeof messageId === "string"
        ? await db.message.findUnique({ where: { id: messageId }, select: { body: true } })
        : null;
    claimed.push({ applicationId: event.applicationId, message: message?.body ?? "" });
  }
  return claimed;
}
