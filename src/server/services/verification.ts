/**
 * Verification of organizations (E8, partie 07 § 4 et § 6) and their public page. An organization
 * whose plan includes `org.verified_profile` sends a request; a Jumanly administrator checks it and
 * decides. The badge « Entreprise vérifiée » comes from `verifiedAt`.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { can } from "@/server/entitlements";
import { emailField } from "./accounts";
import { hirePermissions, HireError, type HireContext } from "./hire";
import { notify } from "./notifications";

/** Business days announced to the organization (`org.verification.submitted`). */
export const VERIFICATION_DAYS = 3;

export const verificationRequestSchema = z.object({
  registration: z.string().trim().min(3).max(200),
  taxId: z.string().trim().max(120).default(""),
  domainEmail: z.union([z.literal(""), emailField]).default(""),
  mandate: z.string().trim().min(3).max(500),
});

export async function requestVerification(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  if (!(await can(db, { type: "organization", id: ctx.organizationId }, "org.verified_profile")))
    throw new HireError("forbidden");
  const parsed = verificationRequestSchema.safeParse(raw);
  if (!parsed.success) return false;
  const organization = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { verificationStatus: true },
  });
  if (organization.verificationStatus === "verified") return true;
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: {
      verificationStatus: "pending",
      verificationRequest: parsed.data,
      verificationRequestedAt: now,
      verificationReason: null,
    },
  });
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "org.verification.request",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
    },
  });
  return true;
}

export const verificationFilters = ["pending", "verified", "rejected", "none"] as const;

export async function listOrganizationsForAdmin(
  db: PrismaClient,
  status: (typeof verificationFilters)[number] = "pending",
) {
  return db.organization.findMany({
    where: { type: { in: ["recruiter", "company"] }, verificationStatus: status },
    orderBy: [{ verificationRequestedAt: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      memberships: {
        where: { role: "org_owner", status: "active" },
        select: { user: { select: { name: true, email: true } } },
      },
      _count: { select: { jobs: true } },
    },
  });
}

export const verificationDecisionSchema = z
  .object({
    decision: z.enum(["verify", "reject"]),
    reason: z.string().trim().max(500).default(""),
  })
  .refine((value) => value.decision === "verify" || value.reason.length >= 3, {
    path: ["reason"],
  });

/** An administrator verifies or refuses; the owners are told in the application. */
export async function decideVerification(
  db: PrismaClient,
  adminId: string,
  organizationId: string,
  raw: Record<string, unknown>,
  now = new Date(),
) {
  const parsed = verificationDecisionSchema.safeParse(raw);
  if (!parsed.success) return false;
  const organization = await db.organization.findFirst({
    where: { id: organizationId, type: { in: ["recruiter", "company"] } },
    include: { memberships: { where: { role: "org_owner", status: "active" } } },
  });
  if (!organization) return false;
  const verified = parsed.data.decision === "verify";
  await db.organization.update({
    where: { id: organization.id },
    data: verified
      ? {
          verificationStatus: "verified",
          verifiedAt: now,
          verifiedById: adminId,
          verificationReason: null,
        }
      : {
          verificationStatus: "rejected",
          verifiedAt: null,
          verifiedById: adminId,
          verificationReason: parsed.data.reason,
        },
  });
  await db.auditLog.create({
    data: {
      actorId: adminId,
      action: verified ? "org.verification.verify" : "org.verification.reject",
      targetType: "organization",
      targetId: organization.id,
      organizationId: organization.id,
      metadata: verified ? {} : { reason: parsed.data.reason },
    },
  });
  await notify(db, {
    userIds: organization.memberships.map((membership) => membership.userId),
    type: verified ? "orgVerified" : "orgVerificationRejected",
    payload: { org: organization.name },
    href: "/app/organisation?onglet=verification",
  });
  return true;
}

/** Public page of an employer: recruiting organizations only, with their published jobs. */
export async function publicCompany(db: PrismaClient, slug: string) {
  return db.organization.findFirst({
    where: { slug, type: { in: ["recruiter", "company"] } },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      website: true,
      country: true,
      city: true,
      sector: true,
      size: true,
      verifiedAt: true,
      jobs: {
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        take: 50,
        select: {
          id: true,
          slug: true,
          title: true,
          city: true,
          country: true,
          contractType: true,
          remote: true,
          publishedAt: true,
        },
      },
    },
  });
}
