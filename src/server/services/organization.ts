/**
 * Organizations: memberships, the active space, invitations and roles (partie 03 § 3.4,
 * partie 05 § 5). Seats come from `org.seats`, available roles from `org.permissions.level`.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { MembershipRole, PrismaClient } from "@/generated/prisma/client";
import { level, limit } from "@/server/entitlements";
import { emailField } from "./accounts";
import { hirePermissions, HireError, type HireContext } from "./hire";

export const INVITATION_DAYS = 7;

/** Active memberships in recruiting organizations (partners have their own space, E9). */
export async function hireMemberships(db: PrismaClient, userId: string) {
  return db.membership.findMany({
    where: { userId, status: "active", organization: { type: { in: ["recruiter", "company"] } } },
    orderBy: { createdAt: "asc" },
    include: {
      organization: {
        select: { id: true, name: true, type: true, verifiedAt: true, suspendedAt: true },
      },
    },
  });
}

/** Active memberships of partner managers in partner organizations (Jumanly Partners, E9). */
export async function partnerMemberships(db: PrismaClient, userId: string) {
  return db.membership.findMany({
    where: {
      userId,
      status: "active",
      role: "partner_manager",
      organization: { type: "partner" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      organization: {
        select: { id: true, name: true, type: true, verifiedAt: true, suspendedAt: true },
      },
    },
  });
}

/**
 * The space chosen in the switcher. `wanted` is the cookie value: "personal", an organization id,
 * or nothing (then a recruiter lands in their organization).
 */
export async function resolveSpace(db: PrismaClient, userId: string, wanted: string | undefined) {
  if (wanted === "personal") return null;
  const memberships = await hireMemberships(db, userId);
  return (
    memberships.find((item) => item.organizationId === wanted) ??
    (wanted ? null : (memberships[0] ?? null))
  );
}

/** Roles that can be given, by `org.permissions.level`. The owner role is only transferred. */
export function grantableRoles(permissionsLevel: string): MembershipRole[] {
  return permissionsLevel === "basic"
    ? ["recruiter"]
    : ["org_admin", "recruiter", "hiring_manager", "viewer"];
}

export async function seatUsage(db: PrismaClient, organizationId: string, now = new Date()) {
  const subject = { type: "organization" as const, id: organizationId };
  const [members, pending, max] = await Promise.all([
    db.membership.count({ where: { organizationId, status: "active" } }),
    db.invitation.count({
      where: { organizationId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
    }),
    limit(db, subject, "org.seats"),
  ]);
  return { members, pending, max, used: members + pending };
}

const inviteSchema = z.object({
  emails: z
    .string()
    .transform((value) => [
      ...new Set(
        value
          .split(/[\s,;]+/)
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
      ),
    ])
    .pipe(z.array(emailField).min(1).max(20)),
  role: z.enum(["org_admin", "recruiter", "hiring_manager", "viewer"]),
  team: z.string().default(""),
  message: z.string().trim().max(500).default(""),
});

export type InviteResult =
  | { ok: true; invitations: { email: string; token: string; expiresAt: Date }[] }
  | {
      ok: false;
      error: "invalid" | "role" | "seats" | "alreadyMember";
      email?: string;
      count?: number;
    };

export async function inviteMembers(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
  now = new Date(),
): Promise<InviteResult> {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { emails, role, message } = parsed.data;
  const teamId = parsed.data.team
    ? ((
        await db.team.findFirst({
          where: { id: parsed.data.team, organizationId: ctx.organizationId, kind: "team" },
          select: { id: true },
        })
      )?.id ?? null)
    : null;
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  if (!grantableRoles(permissions).includes(role)) return { ok: false, error: "role" };
  const members = await db.membership.findMany({
    where: {
      organizationId: ctx.organizationId,
      status: "active",
      user: { email: { in: emails } },
    },
    select: { user: { select: { email: true } } },
  });
  if (members[0]) return { ok: false, error: "alreadyMember", email: members[0].user.email };
  const seats = await seatUsage(db, ctx.organizationId, now);
  // Re-inviting a pending address does not take a new seat.
  const pending = await db.invitation.findMany({
    where: {
      organizationId: ctx.organizationId,
      email: { in: emails },
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    select: { email: true },
  });
  const fresh = emails.filter((email) => !pending.some((item) => item.email === email));
  if (seats.max >= 0 && seats.used + fresh.length > seats.max)
    return { ok: false, error: "seats", count: fresh.length };
  const expiresAt = new Date(now.getTime() + INVITATION_DAYS * 86_400_000);
  const invitations = [];
  for (const email of emails) {
    await db.invitation.updateMany({
      where: { organizationId: ctx.organizationId, email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    const token = randomBytes(24).toString("base64url");
    await db.invitation.create({
      data: {
        organizationId: ctx.organizationId,
        email,
        role,
        teamId,
        token,
        invitedById: ctx.userId,
        message: message || null,
        expiresAt,
      },
    });
    invitations.push({ email, token, expiresAt });
  }
  await db.auditLog.create({
    data: {
      actorId: ctx.userId,
      action: "org.invite",
      targetType: "organization",
      targetId: ctx.organizationId,
      organizationId: ctx.organizationId,
      metadata: { count: emails.length, role },
    },
  });
  return { ok: true, invitations };
}

export async function revokeInvitation(db: PrismaClient, ctx: HireContext, invitationId: string) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const result = await db.invitation.updateMany({
    where: { id: invitationId, organizationId: ctx.organizationId, acceptedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw new HireError("notFound");
}

export async function findInvitation(db: PrismaClient, token: string) {
  return db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true, type: true } } },
  });
}

export type AcceptResult =
  | { ok: true; organizationId: string; partner: boolean }
  | { ok: false; error: "expired" | "otherEmail" | "seats" };

/** The invited person joins with the role chosen by the administrator. */
export async function acceptInvitation(
  db: PrismaClient,
  user: { id: string; email: string },
  token: string,
  now = new Date(),
): Promise<AcceptResult> {
  const invitation = await findInvitation(db, token);
  if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt <= now) {
    return { ok: false, error: "expired" };
  }
  if (invitation.email !== user.email.toLowerCase()) return { ok: false, error: "otherEmail" };
  // Partner organizations have no seats; elsewhere the invitation already holds one and only the
  // members count again here.
  const partner = invitation.organization.type === "partner";
  if (!partner) {
    const seats = await seatUsage(db, invitation.organizationId, now);
    if (seats.max >= 0 && seats.members + 1 > seats.max) return { ok: false, error: "seats" };
  }
  await db.$transaction([
    db.membership.upsert({
      where: {
        userId_organizationId: { userId: user.id, organizationId: invitation.organizationId },
      },
      update: {
        role: invitation.role,
        status: "active",
        invitedBy: invitation.invitedById,
        teamId: invitation.teamId,
      },
      create: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
        teamId: invitation.teamId,
        invitedBy: invitation.invitedById,
      },
    }),
    db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: now } }),
  ]);
  return { ok: true, organizationId: invitation.organizationId, partner };
}

export async function listMembers(db: PrismaClient, ctx: HireContext, now = new Date()) {
  const [members, invitations] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: ctx.organizationId, status: "active" },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
    }),
    db.invitation.findMany({
      where: {
        organizationId: ctx.organizationId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invitations };
}

async function targetMembership(db: PrismaClient, ctx: HireContext, membershipId: string) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: ctx.organizationId, status: "active" },
  });
  if (!membership) throw new HireError("notFound");
  if (membership.userId === ctx.userId) throw new HireError("invalid");
  // Only an owner changes or removes another owner.
  if (membership.role === "org_owner" && ctx.role !== "org_owner") throw new HireError("forbidden");
  return membership;
}

export async function changeRole(
  db: PrismaClient,
  ctx: HireContext,
  membershipId: string,
  role: MembershipRole,
) {
  const membership = await targetMembership(db, ctx, membershipId);
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  if (!grantableRoles(permissions).includes(role)) throw new HireError("forbidden");
  await db.membership.update({ where: { id: membership.id }, data: { role } });
}

export async function removeMember(db: PrismaClient, ctx: HireContext, membershipId: string) {
  const membership = await targetMembership(db, ctx, membershipId);
  await db.membership.update({ where: { id: membership.id }, data: { status: "removed" } });
}

export const organizationCategories = [
  "company",
  "consultant",
  "ngo",
  "public",
  "education",
] as const;

export const organizationProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  legalName: z.string().trim().max(160).default(""),
  category: z.union([z.literal(""), z.enum(organizationCategories)]).default(""),
  contactEmail: z.union([z.literal(""), emailField]).default(""),
  description: z.string().trim().max(3000).default(""),
  website: z.union([z.literal(""), z.url().max(200)]).default(""),
  country: z.string().trim().max(2).default(""),
  city: z.string().trim().max(120).default(""),
  sector: z.string().trim().max(120).default(""),
  size: z.string().trim().max(40).default(""),
});

export async function updateOrganizationProfile(
  db: PrismaClient,
  ctx: HireContext,
  raw: Record<string, unknown>,
) {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const parsed = organizationProfileSchema.safeParse(raw);
  if (!parsed.success) return false;
  const input = parsed.data;
  await db.organization.update({
    where: { id: ctx.organizationId },
    data: {
      name: input.name,
      legalName: input.legalName || null,
      category: input.category || null,
      contactEmail: input.contactEmail || null,
      description: input.description || null,
      website: input.website || null,
      country: input.country || null,
      city: input.city || null,
      sector: input.sector || null,
      size: input.size || null,
    },
  });
  return true;
}
