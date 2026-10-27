/**
 * Jumanly Admin v2 · organisations (docs/admin-v2/PLAN-ADMIN.md, étape 4): supporting documents of
 * a verification request, « complément demandé », suspension and reactivation, and the card's
 * details. Every administrator write is recorded in `AuditLog`. Testable without Next.js.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { invalidate, usage } from "@/server/entitlements";
import { sniffDocumentType, type FileStorage } from "@/server/storage";
import { hirePermissions, type HireContext } from "./hire";
import { notify } from "./notifications";

/** 4 MB per sending (a request on Vercel stops at 4.5 MB), 6 documents at most. */
export const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;
export const DOCUMENTS_MAX = 6;

export class OrgAdminError extends Error {
  constructor(
    readonly code:
      | "forbidden"
      | "notFound"
      | "fileType"
      | "fileSize"
      | "fileCount"
      | "status"
      | "reason"
      | "plan"
      | "until",
  ) {
    super(code);
    this.name = "OrgAdminError";
  }
}

type AuditContext = { actorId: string | null; ip?: string | null };

async function audit(
  db: PrismaClient,
  context: AuditContext,
  action: string,
  organizationId: string,
  metadata: Prisma.InputJsonValue = {},
) {
  await db.auditLog.create({
    data: {
      actorId: context.actorId,
      action,
      targetType: "organization",
      targetId: organizationId,
      organizationId,
      metadata,
      ip: context.ip ?? null,
    },
  });
}

/** Statuses in which the organization may still add documents to its request. */
const OPEN_STATUSES = ["none", "rejected", "info_requested", "pending"] as const;

/** A file name safe to show and to send back in a download header. */
export function cleanFileName(name: string) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "document";
}

/**
 * Supporting documents sent from the organization's space (registration, mandate…): PDF or image,
 * recognized by their first bytes. Only owners and administrators of the organization send them.
 */
export async function addVerificationDocuments(
  db: PrismaClient,
  storage: FileStorage,
  ctx: HireContext,
  files: { name: string; bytes: Uint8Array }[],
) {
  if (!hirePermissions(ctx.role).administer) throw new OrgAdminError("forbidden");
  const real = files.filter((file) => file.bytes.byteLength > 0);
  if (real.length === 0) return [];
  const organization = await db.organization.findUnique({
    where: { id: ctx.organizationId },
    select: { verificationStatus: true, _count: { select: { documents: true } } },
  });
  if (!organization) throw new OrgAdminError("notFound");
  if (!(OPEN_STATUSES as readonly string[]).includes(organization.verificationStatus))
    throw new OrgAdminError("status");
  if (organization._count.documents + real.length > DOCUMENTS_MAX)
    throw new OrgAdminError("fileCount");
  const total = real.reduce((sum, file) => sum + file.bytes.byteLength, 0);
  if (total > DOCUMENT_MAX_BYTES) throw new OrgAdminError("fileSize");
  const typed = real.map((file) => {
    const contentType = sniffDocumentType(file.bytes);
    if (!contentType) throw new OrgAdminError("fileType");
    return { ...file, contentType };
  });

  const created = [];
  for (const file of typed) {
    const storageKey = `organizations/${ctx.organizationId}/${randomUUID()}`;
    await storage.put(storageKey, { contentType: file.contentType, bytes: file.bytes });
    created.push(
      await db.organizationDocument.create({
        data: {
          organizationId: ctx.organizationId,
          storageKey,
          name: cleanFileName(file.name),
          contentType: file.contentType,
          size: file.bytes.byteLength,
          uploadedById: ctx.userId,
        },
      }),
    );
  }
  await audit(db, { actorId: ctx.userId }, "org.document.add", ctx.organizationId, {
    count: created.length,
  });
  return created;
}

/** Removal by the organization, while its request is still open. */
export async function removeVerificationDocument(
  db: PrismaClient,
  storage: FileStorage,
  ctx: HireContext,
  documentId: string,
) {
  if (!hirePermissions(ctx.role).administer) throw new OrgAdminError("forbidden");
  const document = await db.organizationDocument.findFirst({
    where: { id: documentId, organizationId: ctx.organizationId },
    include: { organization: { select: { verificationStatus: true } } },
  });
  if (!document) throw new OrgAdminError("notFound");
  if (document.organization.verificationStatus === "verified") throw new OrgAdminError("status");
  await db.organizationDocument.delete({ where: { id: document.id } });
  await storage.remove(document.storageKey);
}

/** Opening a document from the admin card: always recorded in the journal. */
export async function openDocument(
  db: PrismaClient,
  storage: FileStorage,
  context: AuditContext,
  documentId: string,
) {
  const document = await db.organizationDocument.findUnique({ where: { id: documentId } });
  if (!document) return null;
  const object = await storage.get(document.storageKey);
  if (!object) return null;
  await audit(db, context, "org.document.view", document.organizationId, {
    document: document.name,
  });
  return { document, object };
}

const reasonField = z.string().trim().min(3).max(1000);

export const infoRequestSchema = z.object({
  organizationId: z.string().min(1),
  reason: reasonField,
});

/** « Demander un complément »: the organization reads the message and answers in its space. */
export async function requestMoreInformation(
  db: PrismaClient,
  context: AuditContext & { actorId: string },
  input: z.infer<typeof infoRequestSchema>,
) {
  const organization = await db.organization.findFirst({
    where: { id: input.organizationId, type: { in: ["recruiter", "company"] } },
    include: { memberships: { where: { role: "org_owner", status: "active" } } },
  });
  if (!organization) throw new OrgAdminError("notFound");
  if (organization.verificationStatus !== "pending") throw new OrgAdminError("status");
  await db.organization.update({
    where: { id: organization.id },
    data: { verificationStatus: "info_requested", verificationReason: input.reason },
  });
  await audit(db, context, "org.verification.info", organization.id, { reason: input.reason });
  await notify(db, {
    userIds: organization.memberships.map((membership) => membership.userId),
    type: "orgVerificationInfo",
    payload: { org: organization.name },
    href: "/app/organisation/verification",
  });
  return organization;
}

export const suspendSchema = z.object({
  organizationId: z.string().min(1),
  reason: reasonField,
});

/**
 * Suspension: the live jobs are closed (and remembered), the members lose Hire, the candidates
 * keep their applications. The members and the candidates are told.
 */
export async function suspendOrganization(
  db: PrismaClient,
  context: AuditContext & { actorId: string },
  input: z.infer<typeof suspendSchema>,
  now = new Date(),
) {
  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    include: { memberships: { where: { status: "active" }, select: { userId: true } } },
  });
  if (!organization) throw new OrgAdminError("notFound");
  if (organization.suspendedAt) throw new OrgAdminError("status");
  const jobs = await db.job.findMany({
    where: { organizationId: organization.id, status: { in: ["published", "pending_review"] } },
    select: { id: true, title: true },
  });
  const jobIds = jobs.map((job) => job.id);
  await db.$transaction([
    db.job.updateMany({ where: { id: { in: jobIds } }, data: { status: "closed" } }),
    db.organization.update({
      where: { id: organization.id },
      data: { suspendedAt: now, suspensionReason: input.reason, suspendedJobIds: jobIds },
    }),
  ]);
  invalidate({ type: "organization", id: organization.id });
  await audit(db, context, "org.suspend", organization.id, {
    reason: input.reason,
    jobs: jobIds.length,
  });
  await notify(db, {
    userIds: organization.memberships.map((membership) => membership.userId),
    type: "orgSuspended",
    payload: { org: organization.name },
    href: "/app",
  });
  if (jobIds.length) {
    const applications = await db.application.findMany({
      where: { jobId: { in: jobIds }, status: "active" },
      select: { jobId: true, profile: { select: { userId: true } } },
    });
    for (const job of jobs) {
      await notify(db, {
        userIds: applications
          .filter((application) => application.jobId === job.id)
          .map((application) => application.profile.userId),
        type: "jobUnavailable",
        payload: { job: job.title, org: organization.name },
        href: "/app/suivi",
      });
    }
  }
  return { jobs: jobIds.length };
}

export const reactivateSchema = z.object({
  organizationId: z.string().min(1),
  reason: z.string().trim().max(1000).default(""),
});

/** Reactivation: Hire opens again; the jobs closed by the suspension are published again if still open. */
export async function reactivateOrganization(
  db: PrismaClient,
  context: AuditContext & { actorId: string },
  input: z.infer<typeof reactivateSchema>,
  now = new Date(),
) {
  const organization = await db.organization.findUnique({
    where: { id: input.organizationId },
    include: { memberships: { where: { status: "active" }, select: { userId: true } } },
  });
  if (!organization) throw new OrgAdminError("notFound");
  if (!organization.suspendedAt) throw new OrgAdminError("status");
  const restored = await db.job.updateMany({
    where: {
      id: { in: organization.suspendedJobIds },
      status: "closed",
      OR: [{ closesAt: null }, { closesAt: { gt: now } }],
    },
    data: { status: "published" },
  });
  await db.organization.update({
    where: { id: organization.id },
    data: { suspendedAt: null, suspensionReason: null, suspendedJobIds: [] },
  });
  invalidate({ type: "organization", id: organization.id });
  await audit(db, context, "org.unsuspend", organization.id, {
    reason: input.reason,
    jobs: restored.count,
  });
  await notify(db, {
    userIds: organization.memberships.map((membership) => membership.userId),
    type: "orgReactivated",
    payload: { org: organization.name },
    href: "/app/hire",
  });
  return { jobs: restored.count };
}

/** What the admin card shows beside the verification: members, quotas, jobs, documents. */
export async function organizationDetail(
  db: PrismaClient,
  organizationId: string,
  now = new Date(),
) {
  const subject = { type: "organization" as const, id: organizationId };
  const [members, jobs, jobCounts, documents] = await Promise.all([
    db.membership.findMany({
      where: { organizationId, status: { in: ["active", "suspended"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        role: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.job.findMany({
      where: { organizationId, status: { in: ["published", "pending_review"] } },
      orderBy: { publishedAt: { sort: "desc", nulls: "last" } },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        _count: { select: { applications: true } },
      },
    }),
    db.job.groupBy({ by: ["status"], where: { organizationId }, _count: true }),
    db.organizationDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, contentType: true, size: true, createdAt: true },
    }),
  ]);
  const quotas = await Promise.all(
    ["hire.talent_search.monthly", "hire.contact_requests.monthly", "ai.credits.monthly"].map(
      async (key) => ({ key, ...(await usage(db, subject, key, now)) }),
    ),
  );
  return {
    members,
    jobs,
    jobCounts: Object.fromEntries(jobCounts.map((row) => [row.status, row._count])) as Record<
      string,
      number
    >,
    documents,
    quotas,
  };
}

// ─── Offrir une formule (27/10/2026) ─────────────────────────────

const GRANT_MAX_MS = 730 * 86_400_000;

/** Paid recruiter and company plans an administrator may give to an organization. */
export async function grantableOrgPlans(db: PrismaClient) {
  return db.plan.findMany({
    where: { family: { in: ["rh", "company"] }, active: true, priceCents: { gt: 0 } },
    orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
    select: { code: true, name: true },
  });
}

export const grantOrgPlanSchema = z.object({
  organizationId: z.string().min(1),
  planCode: z.string().min(1).max(60),
  until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(3).max(500),
});

/**
 * « Offrir une formule » to an organization until a date: a sponsored subscription (`source =
 * admin`), like a plan given to a person; nothing is charged and the journal keeps the reason.
 */
export async function grantOrgPlan(
  db: PrismaClient,
  context: AuditContext,
  input: z.infer<typeof grantOrgPlanSchema>,
  now = new Date(),
) {
  const until = new Date(`${input.until}T23:59:59.999Z`);
  if (
    Number.isNaN(until.getTime()) ||
    until.getTime() <= now.getTime() ||
    until.getTime() > now.getTime() + GRANT_MAX_MS
  )
    throw new OrgAdminError("until");
  const [organization, plan] = await Promise.all([
    db.organization.findUnique({ where: { id: input.organizationId }, select: { type: true } }),
    db.plan.findUnique({ where: { code: input.planCode } }),
  ]);
  if (!organization || organization.type === "partner") throw new OrgAdminError("notFound");
  if (!plan || !["rh", "company"].includes(plan.family) || !plan.active || !plan.priceCents)
    throw new OrgAdminError("plan");
  const subscription = await db.subscription.create({
    data: {
      subjectType: "organization",
      subjectId: input.organizationId,
      planId: plan.id,
      status: "sponsored",
      source: "admin",
      currentPeriodStart: now,
      currentPeriodEnd: until,
    },
  });
  invalidate({ type: "organization", id: input.organizationId });
  await audit(db, context, "organization.plan.grant", input.organizationId, {
    plan: plan.code,
    until: until.toISOString(),
    subscriptionId: subscription.id,
    reason: input.reason,
  });
  return subscription;
}
