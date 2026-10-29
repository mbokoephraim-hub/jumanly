/**
 * « Faire vérifier » (demande d'Ephraïm du 29/10/2026): the person names a referent (a former
 * manager, the training organization) for an experience or a certificate. The referent gets an
 * e-mail with a link and confirms in one click, without an account; the item then shows a
 * « Vérifié » badge. Asking is always proposed and never required. Diplomas are not confirmed by a
 * referent: a photo of the diploma can be joined instead, shown as « Justificatif joint ».
 *
 * Only the SHA-256 of the link's token is kept. A confirmed check stops counting as soon as the
 * person changes what was confirmed (post, company, dates; title, organization).
 */
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { PrismaClient, ReferenceCheckStatus } from "@/generated/prisma/client";

export const REFERENCE_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export const referentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email().max(200)),
  role: z.string().trim().max(120).optional().default(""),
});
export type ReferentInput = z.input<typeof referentSchema>;

export type ReferenceTarget = { experienceId: string } | { educationId: string };

export class ReferenceCheckError extends Error {
  constructor(readonly code: "missing" | "already" | "self" | "diploma") {
    super(code);
    this.name = "ReferenceCheckError";
  }
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** What the person sees on the item: the last request that still counts. */
export type ReferenceState = {
  id: string;
  status: Exclude<ReferenceCheckStatus, "cancelled">;
  referentName: string;
  at: Date;
} | null;

type CheckRow = {
  id: string;
  status: ReferenceCheckStatus;
  referentName: string;
  createdAt: Date;
  respondedAt: Date | null;
  expiresAt: Date;
};

/** Selection used wherever the state of the checks is shown. */
export const referenceCheckSelect = {
  where: { status: { not: "cancelled" } },
  orderBy: { createdAt: "desc" },
  take: 3,
  select: {
    id: true,
    status: true,
    referentName: true,
    createdAt: true,
    respondedAt: true,
    expiresAt: true,
  },
} as const;

/**
 * The state of an item from its checks: confirmed wins, then a pending one not expired, then the
 * last refusal. An expired request counts as none, so the person can ask someone else.
 */
export function referenceState(checks: CheckRow[] | undefined, now = new Date()): ReferenceState {
  if (!checks?.length) return null;
  const confirmed = checks.find((check) => check.status === "confirmed");
  if (confirmed)
    return {
      id: confirmed.id,
      status: "confirmed",
      referentName: confirmed.referentName,
      at: confirmed.respondedAt ?? confirmed.createdAt,
    };
  const pending = checks.find((check) => check.status === "pending" && check.expiresAt > now);
  if (pending)
    return {
      id: pending.id,
      status: "pending",
      referentName: pending.referentName,
      at: pending.createdAt,
    };
  const declined = checks.find((check) => check.status === "declined");
  if (declined)
    return {
      id: declined.id,
      status: "declined",
      referentName: declined.referentName,
      at: declined.respondedAt ?? declined.createdAt,
    };
  return null;
}

/** The item a check is about, when it belongs to the profile (a certificate, not a diploma). */
async function ownedItem(db: PrismaClient, profileId: string, target: ReferenceTarget) {
  if ("experienceId" in target) {
    const item = await db.experience.findFirst({
      where: { id: target.experienceId, profileId },
      select: { id: true },
    });
    return item ? { experienceId: item.id } : null;
  }
  const item = await db.education.findFirst({
    where: { id: target.educationId, profileId },
    select: { id: true, kind: true },
  });
  if (item && item.kind !== "certificate") throw new ReferenceCheckError("diploma");
  return item ? { educationId: item.id } : null;
}

/**
 * Records a request to a referent and returns the token of the link to send. One request at a
 * time per item: a pending (not expired) or confirmed one must be withdrawn first.
 */
export async function createReferenceCheck(
  db: PrismaClient,
  input: {
    profileId: string;
    ownerEmail: string;
    target: ReferenceTarget;
    referent: ReferentInput;
  },
  now = new Date(),
) {
  const referent = referentSchema.parse(input.referent);
  if (referent.email === input.ownerEmail.trim().toLowerCase())
    throw new ReferenceCheckError("self");
  const target = await ownedItem(db, input.profileId, input.target);
  if (!target) throw new ReferenceCheckError("missing");
  const open = await db.referenceCheck.findFirst({
    where: {
      ...target,
      OR: [{ status: "confirmed" }, { status: "pending", expiresAt: { gt: now } }],
    },
    select: { id: true },
  });
  if (open) throw new ReferenceCheckError("already");
  const token = randomBytes(32).toString("base64url");
  const check = await db.referenceCheck.create({
    data: {
      profileId: input.profileId,
      ...target,
      referentName: referent.name,
      referentEmail: referent.email,
      referentRole: referent.role || null,
      tokenHash: hashToken(token),
      expiresAt: new Date(now.getTime() + REFERENCE_DAYS * DAY),
    },
    select: { id: true },
  });
  return { id: check.id, token };
}

/** « Retirer la demande »: the person withdraws a request, or a confirmation they no longer want. */
export async function cancelReferenceCheck(db: PrismaClient, profileId: string, id: string) {
  const done = await db.referenceCheck.updateMany({
    where: { id, profileId, status: { in: ["pending", "confirmed", "declined"] } },
    data: { status: "cancelled" },
  });
  return done.count > 0;
}

/** After an edit that changes what the referent confirmed: the confirmation no longer holds. */
export async function outdateReferenceChecks(db: PrismaClient, target: ReferenceTarget) {
  await db.referenceCheck.updateMany({
    where: { ...target, status: { in: ["pending", "confirmed"] } },
    data: { status: "cancelled" },
  });
}

/** What the referent's page shows: the person and the item, while the link is valid. */
export async function findReferenceCheck(db: PrismaClient, token: string, now = new Date()) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const check = await db.referenceCheck.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      referentName: true,
      profile: { select: { user: { select: { firstName: true, lastName: true, name: true } } } },
      experience: {
        select: { title: true, company: true, startDate: true, endDate: true, type: true },
      },
      education: {
        select: {
          degree: true,
          school: true,
          endYear: true,
          format: true,
          length: true,
        },
      },
    },
  });
  if (!check || check.status === "cancelled") return null;
  return { ...check, expired: check.status === "pending" && check.expiresAt <= now };
}

/**
 * The referent's answer. Only a pending, unexpired request can be answered, once. Returns the
 * status now held (or null when the link is no longer valid).
 */
export async function answerReferenceCheck(
  db: PrismaClient,
  token: string,
  answer: "confirm" | "decline",
  now = new Date(),
): Promise<ReferenceCheckStatus | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const tokenHash = hashToken(token);
  const done = await db.referenceCheck.updateMany({
    where: { tokenHash, status: "pending", expiresAt: { gt: now } },
    data: { status: answer === "confirm" ? "confirmed" : "declined", respondedAt: now },
  });
  if (done.count === 0) {
    const check = await db.referenceCheck.findUnique({
      where: { tokenHash },
      select: { status: true },
    });
    return check && check.status !== "pending" && check.status !== "cancelled"
      ? check.status
      : null;
  }
  return answer === "confirm" ? "confirmed" : "declined";
}
