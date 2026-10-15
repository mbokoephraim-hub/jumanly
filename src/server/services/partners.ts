/**
 * Jumanly Partners (partie 05 § 2.4 et § 6, partie 06 § 6.8, partie 10 § 10.2).
 *
 * An institution buys a batch of licences under a contract; the admin creates the batch, the
 * partner manager distributes it (codes, an invitation link, e-mail invitations) and beneficiaries
 * activate a licence on `/activer`, which gives them a `sponsored` subscription.
 *
 * Privacy rule: nothing returned to the partner space names a beneficiary. Partner functions only
 * return licence counts and aggregated cells, each hidden below `minGroup` people (10 at least).
 */
import { randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { invalidate, resolvePlan } from "@/server/entitlements";
import { addMonths } from "@/server/entitlements/periods";
import { emailField } from "./accounts";

export const MIN_GROUP = 10;
export const MAX_CODES = 500;
export const CODE_PREFIX = "JMLY";
const DAY_MS = 86_400_000;

export const partnerKinds = [
  "bank",
  "university",
  "foundation",
  "company",
  "cooperation",
  "public",
] as const;

export type PartnerErrorCode =
  "forbidden" | "notFound" | "invalid" | "batchClosed" | "noneAvailable" | "tooMany" | "consent";

export class PartnerError extends Error {
  constructor(
    readonly code: PartnerErrorCode,
    readonly values: Record<string, number> = {},
  ) {
    super(code);
    this.name = "PartnerError";
  }
}

/** The partner organization of the active partner space. */
export type PartnerContext = { userId: string; organizationId: string };

// ─── Codes ─────────────────────────────────────────────────────────────────────

// No 0/O, 1/I/L: a code is read aloud and typed on a phone.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCode(): string {
  let body = "";
  for (let i = 0; i < 8; i++) body += ALPHABET[randomInt(ALPHABET.length)];
  return `${CODE_PREFIX}${body}`;
}

/** What the beneficiary typed, as stored: capitals, no dashes or spaces, prefix optional. */
export function normalizeCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.length === 8 ? `${CODE_PREFIX}${compact}` : compact;
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

/** a***@domaine.org: enough to recognize one's own address, not to read someone else's. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

// ─── Aggregates ────────────────────────────────────────────────────────────────

/** One report cell: its value, shown only when it is about at least `minGroup` people. */
export type Cell = { value: number | null; hidden: boolean };

export function cell(value: number, people: number, minGroup: number): Cell {
  const hidden = people < Math.max(minGroup, MIN_GROUP);
  return { value: hidden ? null : value, hidden };
}

// ─── Batches ───────────────────────────────────────────────────────────────────

export type BatchStatus = "upcoming" | "active" | "expired" | "exhausted";

export function batchStatus(
  batch: { startsAt: Date; endsAt: Date },
  available: number,
  now: Date,
): BatchStatus {
  if (batch.endsAt <= now) return "expired";
  if (available <= 0) return "exhausted";
  return batch.startsAt > now ? "upcoming" : "active";
}

/** Licences of a batch: distributed (revoked ones return to the pool), activated, available. */
async function counts(db: Prisma.TransactionClient | PrismaClient, batchId: string, seats: number) {
  const [distributed, activated] = await Promise.all([
    db.license.count({ where: { batchId, status: { not: "revoked" } } }),
    db.license.count({ where: { batchId, activatedAt: { not: null } } }),
  ]);
  return { distributed, activated, available: Math.max(0, seats - distributed) };
}

/** Distribution changes of one batch run one at a time (no more licences than seats). */
async function lockBatch(tx: Prisma.TransactionClient, batchId: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${batchId}))`;
}

async function ownBatch(db: PrismaClient, ctx: PartnerContext, batchId: string) {
  const batch = await db.licenseBatch.findFirst({
    where: { id: batchId, partnerOrgId: ctx.organizationId },
  });
  if (!batch) throw new PartnerError("notFound");
  return batch;
}

export async function listBatches(db: PrismaClient, ctx: PartnerContext, now = new Date()) {
  const batches = await db.licenseBatch.findMany({
    where: { partnerOrgId: ctx.organizationId },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      name: true,
      seats: true,
      months: true,
      startsAt: true,
      endsAt: true,
      minGroup: true,
      plan: { select: { name: true } },
    },
  });
  return Promise.all(
    batches.map(async (batch) => {
      const count = await counts(db, batch.id, batch.seats);
      return { ...batch, ...count, status: batchStatus(batch, count.available, now) };
    }),
  );
}

export type BatchSummary = Awaited<ReturnType<typeof listBatches>>[number];

// ─── Distribution ──────────────────────────────────────────────────────────────

const generateSchema = z.object({
  batchId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(MAX_CODES),
  label: z.string().trim().max(80).default(""),
});

export async function generateCodes(
  db: PrismaClient,
  ctx: PartnerContext,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const input = generateSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const batch = await ownBatch(db, ctx, input.data.batchId);
  if (batch.endsAt <= now) throw new PartnerError("batchClosed");
  const created = await db.$transaction(async (tx) => {
    await lockBatch(tx, batch.id);
    const { available } = await counts(tx, batch.id, batch.seats);
    if (available === 0) throw new PartnerError("noneAvailable");
    if (input.data.quantity > available) throw new PartnerError("tooMany", { max: available });
    const codes = Array.from({ length: input.data.quantity }, newCode);
    await tx.license.createMany({
      data: codes.map((code) => ({ batchId: batch.id, code, label: input.data.label || null })),
    });
    return codes.length;
  });
  await audit(db, ctx, "license.codes", batch.id, { count: created });
  return created;
}

/**
 * Codes the partner handed out themselves. Invitations by e-mail and activations through a link
 * are left out, and no row says who used a code.
 */
export async function listCodes(db: PrismaClient, ctx: PartnerContext, batchId: string) {
  await ownBatch(db, ctx, batchId);
  const rows = await db.license.findMany({
    where: { batchId, invitedEmail: null, linkId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, label: true, status: true, createdAt: true },
  });
  return rows.map((row) => ({
    ...row,
    code: formatCode(row.code),
    status: row.status === "active" ? ("used" as const) : row.status,
  }));
}

export async function revokeCode(db: PrismaClient, ctx: PartnerContext, licenseId: string) {
  const result = await db.license.updateMany({
    where: { id: licenseId, status: "available", batch: { partnerOrgId: ctx.organizationId } },
    data: { status: "revoked" },
  });
  if (result.count === 0) throw new PartnerError("notFound");
  await audit(db, ctx, "license.revoke", licenseId, {});
}

const linkSchema = z.object({
  batchId: z.string().min(1),
  maxUses: z.coerce.number().int().min(1).max(100_000),
  expiresAt: z
    .string()
    .default("")
    .transform((value) => (value ? new Date(`${value}T23:59:59Z`) : null))
    .refine((value) => value === null || !Number.isNaN(value.getTime())),
});

export async function createLink(
  db: PrismaClient,
  ctx: PartnerContext,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const input = linkSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const batch = await ownBatch(db, ctx, input.data.batchId);
  if (batch.endsAt <= now) throw new PartnerError("batchClosed");
  const { available } = await counts(db, batch.id, batch.seats);
  if (available === 0) throw new PartnerError("noneAvailable");
  const link = await db.licenseLink.create({
    data: {
      batchId: batch.id,
      token: randomBytes(18).toString("base64url"),
      maxUses: Math.min(input.data.maxUses, available),
      expiresAt: input.data.expiresAt,
    },
  });
  await audit(db, ctx, "license.link", batch.id, { maxUses: link.maxUses });
  return link;
}

export async function listLinks(db: PrismaClient, ctx: PartnerContext, batchId: string) {
  await ownBatch(db, ctx, batchId);
  const links = await db.licenseLink.findMany({
    where: { batchId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      token: true,
      maxUses: true,
      expiresAt: true,
      disabledAt: true,
      _count: { select: { licenses: true } },
    },
  });
  return links.map(({ _count, ...link }) => ({ ...link, uses: _count.licenses }));
}

export async function disableLink(db: PrismaClient, ctx: PartnerContext, linkId: string) {
  const result = await db.licenseLink.updateMany({
    where: { id: linkId, disabledAt: null, batch: { partnerOrgId: ctx.organizationId } },
    data: { disabledAt: new Date() },
  });
  if (result.count === 0) throw new PartnerError("notFound");
}

/** Addresses from a CSV file (column « email », optional « prenom ») or a typed list. */
export function parseInviteList(text: string) {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const header =
    lines[0]
      ?.toLowerCase()
      .split(/[;,\t]/)
      .map((cell) => cell.trim()) ?? [];
  const emailColumn = header.findIndex((cell) => cell === "email" || cell === "e-mail");
  const nameColumn = header.findIndex((cell) => cell === "prenom" || cell === "prénom");
  const entries: { email: string; firstName: string | null }[] = [];
  if (emailColumn >= 0) {
    for (const line of lines.slice(1)) {
      const cells = line.split(/[;,\t]/).map((cell) => cell.trim().replace(/^"|"$/g, ""));
      entries.push({
        email: cells[emailColumn] ?? "",
        firstName: nameColumn >= 0 ? cells[nameColumn] || null : null,
      });
    }
  } else {
    for (const item of text.split(/[\s,;]+/).filter(Boolean)) {
      entries.push({ email: item, firstName: null });
    }
  }
  const valid: { email: string; firstName: string | null }[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const entry of entries) {
    const parsed = emailField.safeParse(entry.email);
    if (!parsed.success) {
      invalid.push(entry.email);
      continue;
    }
    if (valid.some((item) => item.email === parsed.data)) duplicates++;
    else valid.push({ email: parsed.data, firstName: entry.firstName?.slice(0, 60) ?? null });
  }
  return { valid, invalid, duplicates };
}

export type InviteOutcome = {
  valid: number;
  invalid: number;
  duplicates: number;
  alreadyInvited: number;
  invitations: { email: string; firstName: string | null; code: string }[];
};

export async function inviteByEmail(
  db: PrismaClient,
  ctx: PartnerContext,
  input: { batchId: string; text: string; consent: boolean },
  now = new Date(),
): Promise<InviteOutcome> {
  if (!input.consent) throw new PartnerError("consent");
  const batch = await ownBatch(db, ctx, input.batchId);
  if (batch.endsAt <= now) throw new PartnerError("batchClosed");
  const list = parseInviteList(input.text.slice(0, 500_000));
  if (list.valid.length === 0) throw new PartnerError("invalid");
  const outcome = await db.$transaction(async (tx) => {
    await lockBatch(tx, batch.id);
    const known = await tx.license.findMany({
      where: {
        batchId: batch.id,
        status: { not: "revoked" },
        invitedEmail: { in: list.valid.map((item) => item.email) },
      },
      select: { invitedEmail: true },
    });
    const fresh = list.valid.filter(
      (item) => !known.some((license) => license.invitedEmail === item.email),
    );
    const { available } = await counts(tx, batch.id, batch.seats);
    if (available === 0 && fresh.length > 0) throw new PartnerError("noneAvailable");
    if (fresh.length > available) {
      throw new PartnerError("tooMany", { count: fresh.length, available });
    }
    const invitations = fresh.map((item) => ({ ...item, code: newCode() }));
    await tx.license.createMany({
      data: invitations.map((item) => ({
        batchId: batch.id,
        code: item.code,
        invitedEmail: item.email,
        invitedAt: now,
      })),
    });
    return { alreadyInvited: known.length, invitations };
  });
  await audit(db, ctx, "license.invite", batch.id, { count: outcome.invitations.length });
  return {
    valid: list.valid.length,
    invalid: list.invalid.length,
    duplicates: list.duplicates,
    ...outcome,
  };
}

/** Invitations of a batch, counted by state: the partner never sees who activated. */
export async function invitationCounts(db: PrismaClient, ctx: PartnerContext, batchId: string) {
  await ownBatch(db, ctx, batchId);
  const [sent, activated, closed] = await Promise.all([
    db.license.count({ where: { batchId, invitedEmail: { not: null }, status: "available" } }),
    db.license.count({
      where: { batchId, invitedEmail: { not: null }, activatedAt: { not: null } },
    }),
    db.license.count({
      where: {
        batchId,
        invitedEmail: { not: null },
        activatedAt: null,
        status: { not: "available" },
      },
    }),
  ]);
  return { sent, activated, expired: closed };
}

/** Invitations still waiting, to send again (the code does not change). */
export async function pendingInvitations(
  db: PrismaClient,
  ctx: PartnerContext,
  batchId: string,
  now = new Date(),
) {
  const batch = await ownBatch(db, ctx, batchId);
  if (batch.endsAt <= now) throw new PartnerError("batchClosed");
  const rows = await db.license.findMany({
    where: { batchId, invitedEmail: { not: null }, status: "available" },
    select: { id: true, invitedEmail: true, code: true },
  });
  await db.license.updateMany({
    where: { id: { in: rows.map((row) => row.id) } },
    data: { invitedAt: now },
  });
  await audit(db, ctx, "license.reinvite", batch.id, { count: rows.length });
  return rows.map((row) => ({ email: row.invitedEmail ?? "", firstName: null, code: row.code }));
}

// ─── Activation (/activer) ─────────────────────────────────────────────────────

export type ActivationError =
  "invalid" | "used" | "expired" | "exhausted" | "notYet" | "emailMismatch" | "alreadyActive";

export type ActivationOffer = {
  ok: true;
  sponsorName: string;
  planName: string;
  planPriceCents: number;
  batchId: string;
  licenseId: string | null;
  linkId: string | null;
  invitedEmail: string | null;
  months: number;
  batchEnd: Date;
};

export type ActivationLookup =
  ActivationOffer | { ok: false; error: ActivationError; startDate?: Date; maskedEmail?: string };

const batchInclude = {
  partnerOrg: { select: { name: true } },
  plan: { select: { id: true, name: true, priceCents: true } },
} as const;

export async function findOffer(
  db: PrismaClient,
  input: { code?: string; token?: string },
  now = new Date(),
): Promise<ActivationLookup> {
  if (input.token) {
    const link = await db.licenseLink.findUnique({
      where: { token: input.token.slice(0, 64) },
      include: { batch: { include: batchInclude }, _count: { select: { licenses: true } } },
    });
    if (!link || link.disabledAt) return { ok: false, error: "invalid" };
    const { batch } = link;
    if (batch.endsAt <= now || (link.expiresAt && link.expiresAt <= now)) {
      return { ok: false, error: "expired" };
    }
    if (batch.startsAt > now) return { ok: false, error: "notYet", startDate: batch.startsAt };
    const { available } = await counts(db, batch.id, batch.seats);
    if (link._count.licenses >= link.maxUses || available === 0) {
      return { ok: false, error: "exhausted" };
    }
    return offer(batch, null, link.id, null);
  }
  const code = normalizeCode(input.code ?? "");
  if (code.length !== 12) return { ok: false, error: "invalid" };
  const license = await db.license.findUnique({
    where: { code },
    include: { batch: { include: batchInclude } },
  });
  if (!license || license.status === "revoked") return { ok: false, error: "invalid" };
  if (license.activatedAt) return { ok: false, error: "used" };
  const { batch } = license;
  if (license.status === "expired" || batch.endsAt <= now) return { ok: false, error: "expired" };
  if (batch.startsAt > now) return { ok: false, error: "notYet", startDate: batch.startsAt };
  return offer(batch, license.id, null, license.invitedEmail);
}

function offer(
  batch: Prisma.LicenseBatchGetPayload<{ include: typeof batchInclude }>,
  licenseId: string | null,
  linkId: string | null,
  invitedEmail: string | null,
): ActivationOffer {
  return {
    ok: true,
    sponsorName: batch.partnerOrg.name,
    planName: batch.plan.name,
    planPriceCents: batch.plan.priceCents ?? 0,
    batchId: batch.id,
    licenseId,
    linkId,
    invitedEmail,
    months: batch.months,
    batchEnd: batch.endsAt,
  };
}

/** End of a licence that starts at `start`: its length, within the contract. */
export function licenseEnd(start: Date, months: number, batchEnd: Date): Date {
  const end = addMonths(start, months);
  return end < batchEnd ? end : batchEnd;
}

export type ActivationResult =
  | {
      ok: true;
      status: "active" | "pending";
      sponsorName: string;
      planName: string;
      currentPlan: string | null;
      startDate: Date;
      endDate: Date;
      licenseId: string;
    }
  | { ok: false; error: ActivationError; startDate?: Date; maskedEmail?: string };

/**
 * Activates a licence for a signed-in person. A sponsored licence wins over a lower paid plan;
 * when the person already pays for a higher plan, it waits for the end of that period
 * (partie 05 § 6).
 */
export async function activateLicense(
  db: PrismaClient,
  user: { id: string; email: string },
  input: { code?: string; token?: string },
  now = new Date(),
): Promise<ActivationResult> {
  const found = await findOffer(db, input, now);
  if (!found.ok) return found;
  if (found.invitedEmail && found.invitedEmail !== user.email.toLowerCase()) {
    return { ok: false, error: "emailMismatch", maskedEmail: maskEmail(found.invitedEmail) };
  }
  const already = await db.license.findFirst({
    where: { batchId: found.batchId, userId: user.id, status: "active" },
    select: { id: true },
  });
  if (already) return { ok: false, error: "alreadyActive" };

  const subject = { type: "user" as const, id: user.id };
  const current = await resolvePlan(db, subject, now);
  const higherPaid =
    current &&
    current.status !== "free" &&
    current.status !== "sponsored" &&
    (current.priceCents ?? 0) > found.planPriceCents
      ? current
      : null;
  let startDate = now;
  if (higherPaid?.subscriptionId) {
    const paid = await db.subscription.findUnique({ where: { id: higherPaid.subscriptionId } });
    if (paid && paid.currentPeriodEnd > now) startDate = paid.currentPeriodEnd;
  }
  const endDate = licenseEnd(startDate, found.months, found.batchEnd);
  if (endDate <= startDate) return { ok: false, error: "expired" };

  const batch = await db.licenseBatch.findUniqueOrThrow({ where: { id: found.batchId } });
  const licenseId = await db.$transaction(async (tx) => {
    await lockBatch(tx, batch.id);
    let id = found.licenseId;
    if (id) {
      const taken = await tx.license.updateMany({
        where: { id, status: "available", activatedAt: null },
        data: { status: "active", userId: user.id, activatedAt: now },
      });
      if (taken.count === 0) return null;
    } else {
      const link = await tx.licenseLink.findUniqueOrThrow({
        where: { id: found.linkId ?? "" },
        include: { _count: { select: { licenses: true } } },
      });
      const { available } = await counts(tx, batch.id, batch.seats);
      if (link._count.licenses >= link.maxUses || available === 0) return null;
      const created = await tx.license.create({
        data: {
          batchId: batch.id,
          code: newCode(),
          linkId: link.id,
          userId: user.id,
          status: "active",
          activatedAt: now,
        },
      });
      id = created.id;
    }
    const subscription = await tx.subscription.create({
      data: {
        subjectType: "user",
        subjectId: user.id,
        planId: batch.planId,
        status: "sponsored",
        source: "license",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
    });
    await tx.license.update({ where: { id }, data: { subscriptionId: subscription.id } });
    return id;
  });
  if (!licenseId) return { ok: false, error: found.licenseId ? "used" : "exhausted" };
  invalidate(subject);
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "license.activate",
      targetType: "license",
      targetId: licenseId,
      metadata: { batchId: batch.id, pending: startDate > now },
    },
  });
  return {
    ok: true,
    status: startDate > now ? "pending" : "active",
    sponsorName: found.sponsorName,
    planName: found.planName,
    currentPlan: higherPaid?.planName ?? null,
    startDate,
    endDate,
    licenseId,
  };
}

/** Partner managers to warn when a batch runs low (10 % of its seats left, once). */
export async function lowBatchAlert(db: PrismaClient, batchId: string) {
  const batch = await db.licenseBatch.findUniqueOrThrow({ where: { id: batchId } });
  const { available } = await counts(db, batch.id, batch.seats);
  const threshold = Math.max(1, Math.floor(batch.seats / 10));
  if (available > threshold) return null;
  const managers = await db.membership.findMany({
    where: { organizationId: batch.partnerOrgId, status: "active", role: "partner_manager" },
    select: { userId: true },
  });
  return { batch, available, managerIds: managers.map((item) => item.userId) };
}

// ─── Beneficiary side ──────────────────────────────────────────────────────────

/** The person's sponsored licences that are running or waiting, newest first. */
export async function myLicenses(db: PrismaClient, userId: string, now = new Date()) {
  const licenses = await db.license.findMany({
    where: { userId, status: "active" },
    orderBy: { activatedAt: "desc" },
    include: { batch: { include: batchInclude } },
  });
  const subscriptions = await db.subscription.findMany({
    where: { id: { in: licenses.flatMap((item) => item.subscriptionId ?? []) } },
  });
  return licenses.flatMap((license) => {
    const subscription = subscriptions.find((item) => item.id === license.subscriptionId);
    if (!subscription || subscription.currentPeriodEnd <= now) return [];
    return [
      {
        id: license.id,
        sponsorName: license.batch.partnerOrg.name,
        planName: license.batch.plan.name,
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        pending: subscription.currentPeriodStart > now,
        consentAsked: license.outcomeConsentAnsweredAt !== null,
        consented: license.outcomeConsentAt !== null,
      },
    ];
  });
}

/** The beneficiary agrees (or not) that a declared hiring counts in the sponsor's reports. */
export async function answerOutcomeConsent(
  db: PrismaClient,
  userId: string,
  licenseId: string,
  accept: boolean,
  now = new Date(),
) {
  const result = await db.license.updateMany({
    where: { id: licenseId, userId },
    data: { outcomeConsentAt: accept ? now : null, outcomeConsentAnsweredAt: now },
  });
  if (result.count === 0) throw new PartnerError("notFound");
}

// ─── Reports ───────────────────────────────────────────────────────────────────

type Beneficiary = { userId: string; activatedAt: Date; consent: boolean };

async function beneficiaries(
  db: PrismaClient,
  organizationId: string,
  batchId?: string,
): Promise<{ list: Beneficiary[]; minGroup: number }> {
  const batches = await db.licenseBatch.findMany({
    where: { partnerOrgId: organizationId, ...(batchId ? { id: batchId } : {}) },
    select: { id: true, minGroup: true },
  });
  const licenses = await db.license.findMany({
    where: {
      batchId: { in: batches.map((batch) => batch.id) },
      activatedAt: { not: null },
      userId: { not: null },
    },
    select: { userId: true, activatedAt: true, outcomeConsentAt: true },
  });
  const byUser = new Map<string, Beneficiary>();
  for (const license of licenses) {
    const userId = license.userId ?? "";
    const known = byUser.get(userId);
    const activatedAt = license.activatedAt ?? new Date(0);
    byUser.set(userId, {
      userId,
      activatedAt: known && known.activatedAt < activatedAt ? known.activatedAt : activatedAt,
      consent: (known?.consent ?? false) || license.outcomeConsentAt !== null,
    });
  }
  const minGroup = Math.max(MIN_GROUP, ...batches.map((batch) => batch.minGroup));
  return { list: [...byUser.values()], minGroup };
}

/** Rows that happened after the person's activation and inside the period. */
function since<T extends { userId: string; at: Date | null }>(
  rows: T[],
  people: Map<string, Beneficiary>,
  from: Date,
  to: Date,
) {
  return rows.filter((row) => {
    const person = people.get(row.userId);
    return !!person && !!row.at && row.at >= person.activatedAt && row.at >= from && row.at < to;
  });
}

const distinct = (rows: { userId: string }[]) => new Set(rows.map((row) => row.userId)).size;

async function activeUsers(db: PrismaClient, userIds: string[], from: Date, to: Date) {
  const [sessions, enrollments, applications] = await Promise.all([
    db.session.findMany({
      where: { userId: { in: userIds }, updatedAt: { gte: from, lt: to } },
      select: { userId: true },
    }),
    db.enrollment.findMany({
      where: { userId: { in: userIds }, startedAt: { gte: from, lt: to } },
      select: { userId: true },
    }),
    db.application.findMany({
      where: { profile: { userId: { in: userIds } }, createdAt: { gte: from, lt: to } },
      select: { profile: { select: { userId: true } } },
    }),
  ]);
  return new Set([
    ...sessions.map((row) => row.userId),
    ...enrollments.map((row) => row.userId),
    ...applications.map((row) => row.profile.userId),
  ]);
}

export type ImpactReport = Awaited<ReturnType<typeof impactReport>>;

/**
 * Aggregated impact of a partner's licences over a period. Every figure is a total, an average or
 * a list of themes, each hidden when it concerns fewer than `minGroup` people.
 */
export async function impactReport(
  db: PrismaClient,
  ctx: PartnerContext,
  input: { batchId?: string; from: Date; to: Date },
) {
  if (input.batchId) await ownBatch(db, ctx, input.batchId);
  const { list, minGroup } = await beneficiaries(db, ctx.organizationId, input.batchId);
  const people = new Map(list.map((item) => [item.userId, item]));
  const userIds = [...people.keys()];
  const { from, to } = input;
  const enough = list.length >= minGroup;

  const [enrollments, documents, aiRuns, applications, profiles] = enough
    ? await Promise.all([
        db.enrollment.findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            startedAt: true,
            completedAt: true,
            progress: true,
            course: { select: { category: true, durationMinutes: true } },
            certificate: { select: { issuedAt: true, revokedAt: true } },
          },
        }),
        db.document.findMany({
          where: { kind: "cv", profile: { userId: { in: userIds } } },
          select: { createdAt: true, profile: { select: { userId: true } } },
        }),
        db.aiUsage.findMany({
          where: { userId: { in: userIds }, feature: { startsWith: "interview" } },
          select: { userId: true, createdAt: true },
        }),
        db.application.findMany({
          where: { profile: { userId: { in: userIds } } },
          select: {
            createdAt: true,
            status: true,
            updatedAt: true,
            profile: { select: { userId: true } },
            interviews: { select: { createdAt: true, status: true } },
          },
        }),
        db.talentProfile.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, completeness: true },
        }),
      ])
    : [[], [], [], [], []];

  const started = since(
    enrollments.map((row) => ({ userId: row.userId, at: row.startedAt })),
    people,
    from,
    to,
  );
  const completed = since(
    enrollments.map((row) => ({ userId: row.userId, at: row.completedAt })),
    people,
    from,
    to,
  );
  const certificates = since(
    enrollments.flatMap((row) =>
      row.certificate && !row.certificate.revokedAt
        ? [{ userId: row.userId, at: row.certificate.issuedAt }]
        : [],
    ),
    people,
    from,
    to,
  );
  const learning = since(
    enrollments.map((row) => ({
      userId: row.userId,
      at: row.startedAt,
      minutes: (row.course.durationMinutes * row.progress) / 100,
      category: row.course.category,
    })),
    people,
    new Date(0),
    to,
  );
  const cvs = since(
    documents.map((row) => ({ userId: row.profile.userId, at: row.createdAt })),
    people,
    from,
    to,
  );
  const sims = since(
    aiRuns.map((row) => ({ userId: row.userId ?? "", at: row.createdAt })),
    people,
    from,
    to,
  );
  const sent = since(
    applications.map((row) => ({ userId: row.profile.userId, at: row.createdAt })),
    people,
    from,
    to,
  );
  const interviews = since(
    applications.flatMap((row) =>
      row.interviews
        .filter((interview) => interview.status !== "canceled")
        .map((interview) => ({ userId: row.profile.userId, at: interview.createdAt })),
    ),
    people,
    from,
    to,
  );
  const hires = since(
    applications
      .filter((row) => row.status === "hired" && people.get(row.profile.userId)?.consent)
      .map((row) => ({ userId: row.profile.userId, at: row.updatedAt })),
    people,
    from,
    to,
  );
  const active = enough ? await activeUsers(db, userIds, from, to) : new Set<string>();
  const activated = list.filter((item) => item.activatedAt >= from && item.activatedAt < to);
  const hours = learning.reduce((sum, row) => sum + row.minutes, 0) / 60;
  const learners = distinct(learning);

  const themes = new Map<string, Set<string>>();
  for (const row of learning) {
    const set = themes.get(row.category) ?? new Set<string>();
    set.add(row.userId);
    themes.set(row.category, set);
  }
  const PROFILE_THRESHOLD = 80;
  const complete = profiles.filter((row) => row.completeness >= PROFILE_THRESHOLD);

  return {
    minGroup,
    enough,
    population: enough ? list.length : null,
    reach: {
      activated: cell(activated.length, activated.length, minGroup),
      active: cell(active.size, active.size, minGroup),
    },
    learning: {
      coursesStarted: cell(started.length, distinct(started), minGroup),
      coursesCompleted: cell(completed.length, distinct(completed), minGroup),
      certificates: cell(certificates.length, distinct(certificates), minGroup),
      learningHours: cell(Math.round(hours), learners, minGroup),
      avgHours: cell(
        active.size ? Math.round((hours / Math.max(1, learners)) * 10) / 10 : 0,
        learners,
        minGroup,
      ),
      topThemes: [...themes.entries()]
        .filter(([, set]) => set.size >= minGroup)
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 5)
        .map(([category, set]) => ({ category, people: set.size })),
    },
    career: {
      profilePercent: PROFILE_THRESHOLD,
      profilesCompleted: cell(complete.length, complete.length, minGroup),
      cvs: cell(cvs.length, distinct(cvs), minGroup),
      interviewSims: cell(sims.length, distinct(sims), minGroup),
    },
    employment: {
      applications: cell(sent.length, distinct(sent), minGroup),
      interviews: cell(interviews.length, distinct(interviews), minGroup),
      hiresDeclared: cell(distinct(hires), distinct(hires), minGroup),
    },
  };
}

/**
 * Beneficiaries active each month, the current month last (`count` months). A month with fewer
 * than `minGroup` active people is hidden.
 */
export async function monthlyActive(
  db: PrismaClient,
  ctx: PartnerContext,
  input: { batchId?: string; count?: number; now?: Date } = {},
) {
  const now = input.now ?? new Date();
  if (input.batchId) await ownBatch(db, ctx, input.batchId);
  const { list, minGroup } = await beneficiaries(db, ctx.organizationId, input.batchId);
  const months = [];
  for (let back = (input.count ?? 6) - 1; back >= 0; back--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back + 1, 1));
    const ids = list.filter((item) => item.activatedAt < end).map((item) => item.userId);
    const active = ids.length >= minGroup ? (await activeUsers(db, ids, start, end)).size : 0;
    months.push({ month: start, active: cell(active, active, minGroup) });
  }
  return months;
}

/**
 * Partner dashboard: licence counts, the last 30 days, then the usage and six months of activity
 * of all batches or of one (`batchId`).
 */
export async function partnerDashboard(
  db: PrismaClient,
  ctx: PartnerContext,
  now = new Date(),
  batchId?: string,
) {
  const batches = await listBatches(db, ctx, now);
  const only = batches.some((batch) => batch.id === batchId) ? batchId : undefined;
  const totals = batches.reduce(
    (sum, batch) => ({
      purchased: sum.purchased + batch.seats,
      distributed: sum.distributed + batch.distributed,
      activated: sum.activated + batch.activated,
      available: sum.available + (batch.status === "expired" ? 0 : batch.available),
    }),
    { purchased: 0, distributed: 0, activated: 0, available: 0 },
  );
  const recent = await impactReport(db, ctx, {
    from: new Date(now.getTime() - 30 * DAY_MS),
    to: now,
  });
  const overall = await impactReport(db, ctx, { batchId: only, from: new Date(0), to: now });
  const months = await monthlyActive(db, ctx, { batchId: only, now });
  return {
    batches,
    batchId: only,
    totals,
    activationRate: totals.purchased ? Math.round((totals.activated / totals.purchased) * 100) : 0,
    active30: recent.reach.active,
    usage: overall,
    months,
    minGroup: overall.minGroup,
  };
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

const partnerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(partnerKinds),
  managerEmail: emailField,
});

export async function createPartner(
  db: PrismaClient,
  actorId: string,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const input = partnerSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const base =
    input.data.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "partenaire";
  let slug = base;
  for (let i = 2; await db.organization.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  const org = await db.organization.create({
    data: { type: "partner", name: input.data.name, slug, partnerKind: input.data.kind },
  });
  const invitation = await inviteManager(db, actorId, org.id, input.data.managerEmail, now);
  await db.auditLog.create({
    data: {
      actorId,
      action: "partner.create",
      targetType: "organization",
      targetId: org.id,
      organizationId: org.id,
      metadata: { kind: input.data.kind },
    },
  });
  return { org, invitation };
}

export async function inviteManager(
  db: PrismaClient,
  actorId: string,
  organizationId: string,
  email: string,
  now = new Date(),
) {
  const parsed = emailField.safeParse(email);
  if (!parsed.success) throw new PartnerError("invalid");
  await db.invitation.updateMany({
    where: { organizationId, email: parsed.data, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  return db.invitation.create({
    data: {
      organizationId,
      email: parsed.data,
      role: "partner_manager",
      token: randomBytes(24).toString("base64url"),
      invitedById: actorId,
      expiresAt: new Date(now.getTime() + 14 * DAY_MS),
    },
  });
}

const batchSchema = z
  .object({
    partnerId: z.string().min(1),
    name: z.string().trim().min(2).max(80),
    planId: z.string().min(1),
    seats: z.coerce.number().int().min(1).max(100_000),
    months: z.coerce.number().int().min(1).max(36),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    contractRef: z.string().trim().max(80).default(""),
    amount: z
      .string()
      .trim()
      .default("")
      .transform((value) => (value ? Math.round(Number(value.replace(",", ".")) * 100) : null))
      .refine((value) => value === null || (Number.isFinite(value) && value >= 0)),
    minGroup: z.coerce.number().int().min(MIN_GROUP).max(1000).default(MIN_GROUP),
  })
  .refine((value) => value.endsAt > value.startsAt);

export async function createBatch(db: PrismaClient, actorId: string, raw: Record<string, unknown>) {
  const input = batchSchema.safeParse(raw);
  if (!input.success) throw new PartnerError("invalid");
  const { partnerId, amount, ...data } = input.data;
  const [partner, plan] = await Promise.all([
    db.organization.findFirst({ where: { id: partnerId, type: "partner" } }),
    db.plan.findFirst({
      where: { id: data.planId, family: "talent", active: true, priceCents: { gt: 0 } },
    }),
  ]);
  if (!partner || !plan) throw new PartnerError("invalid");
  const batch = await db.licenseBatch.create({
    data: {
      ...data,
      contractRef: data.contractRef || null,
      priceCents: amount,
      partnerOrgId: partner.id,
      createdById: actorId,
    },
  });
  await db.auditLog.create({
    data: {
      actorId,
      action: "partner.batch",
      targetType: "licenseBatch",
      targetId: batch.id,
      organizationId: partner.id,
      metadata: { seats: batch.seats, planId: plan.id },
    },
  });
  return batch;
}

/** Admin view: every partner with its batches, counts and pending manager invitations. */
export async function adminPartners(db: PrismaClient, now = new Date()) {
  const partners = await db.organization.findMany({
    where: { type: "partner" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      partnerKind: true,
      memberships: {
        where: { status: "active", role: "partner_manager" },
        select: { user: { select: { email: true } } },
      },
      invitations: {
        where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        select: { email: true },
      },
      licenseBatches: {
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          name: true,
          seats: true,
          months: true,
          startsAt: true,
          endsAt: true,
          contractRef: true,
          priceCents: true,
          minGroup: true,
          plan: { select: { name: true } },
        },
      },
    },
  });
  return Promise.all(
    partners.map(async (partner) => ({
      ...partner,
      licenseBatches: await Promise.all(
        partner.licenseBatches.map(async (batch) => {
          const count = await counts(db, batch.id, batch.seats);
          return { ...batch, ...count, status: batchStatus(batch, count.available, now) };
        }),
      ),
    })),
  );
}

// ─── Lifecycle (task) ──────────────────────────────────────────────────────────

/** Licences whose sponsored subscription has ended become `expired`; unused codes of ended batches too. */
export async function expireLicenses(db: PrismaClient, now = new Date(), only?: string[]) {
  const ended = await db.license.findMany({
    where: {
      status: "active",
      ...(only ? { userId: { in: only } } : {}),
      OR: [{ subscriptionId: null }, { batch: { endsAt: { lte: now } } }],
    },
    select: { id: true },
  });
  const endedSubscriptions = await db.subscription.findMany({
    where: {
      source: "license",
      status: "sponsored",
      currentPeriodEnd: { lte: now },
      ...(only ? { subjectId: { in: only } } : {}),
    },
    select: { id: true, subjectId: true, currentPeriodEnd: true },
  });
  const expired = await db.license.findMany({
    where: {
      OR: [
        { id: { in: ended.map((row) => row.id) } },
        { subscriptionId: { in: endedSubscriptions.map((row) => row.id) }, status: "active" },
      ],
    },
    include: { batch: { include: batchInclude } },
  });
  await db.subscription.updateMany({
    where: { id: { in: endedSubscriptions.map((row) => row.id) } },
    data: { status: "expired" },
  });
  await db.license.updateMany({
    where: { id: { in: expired.map((row) => row.id) } },
    data: { status: "expired" },
  });
  if (!only) {
    await db.license.updateMany({
      where: { status: "available", batch: { endsAt: { lte: now } } },
      data: { status: "expired" },
    });
  }
  for (const row of endedSubscriptions) invalidate({ type: "user", id: row.subjectId });
  return expired.flatMap((license) =>
    license.userId
      ? [
          {
            userId: license.userId,
            licenseId: license.id,
            sponsorName: license.batch.partnerOrg.name,
          },
        ]
      : [],
  );
}

/** Running licences that end within 7 days. */
export async function endingLicenses(db: PrismaClient, now = new Date(), only?: string[]) {
  const subscriptions = await db.subscription.findMany({
    where: {
      source: "license",
      status: "sponsored",
      currentPeriodStart: { lte: now },
      currentPeriodEnd: { gt: now, lte: new Date(now.getTime() + 7 * DAY_MS) },
      ...(only ? { subjectId: { in: only } } : {}),
    },
    include: { plan: { select: { name: true } } },
  });
  const licenses = await db.license.findMany({
    where: { subscriptionId: { in: subscriptions.map((row) => row.id) } },
    include: { batch: { include: batchInclude } },
  });
  return subscriptions.flatMap((subscription) => {
    const license = licenses.find((item) => item.subscriptionId === subscription.id);
    return license
      ? [
          {
            userId: subscription.subjectId,
            subscriptionId: subscription.id,
            planName: subscription.plan.name,
            sponsorName: license.batch.partnerOrg.name,
            endDate: subscription.currentPeriodEnd,
          },
        ]
      : [];
  });
}

async function audit(
  db: PrismaClient,
  ctx: PartnerContext,
  action: string,
  targetId: string,
  metadata: Prisma.InputJsonObject,
) {
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action,
      targetType: "licenseBatch",
      targetId,
      organizationId: ctx.organizationId,
      metadata,
    },
  });
}
