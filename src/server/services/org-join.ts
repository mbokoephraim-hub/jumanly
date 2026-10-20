/**
 * Joining an existing organization at sign-up (brief recruteur § 2.21, planches recruteur-4 § 5
 * `REJ1`, `REJ2`, `REJ_ADM`): when the professional e-mail domain or the name typed matches an
 * organization already on Jumanly, its card appears and the person « demande à rejoindre » instead
 * of creating a duplicate. The organization's administrators answer (role, seats, Accepter /
 * Refuser); without an answer in 7 days the request expires.
 *
 * - A free mailbox (gmail.com, yahoo.fr…) never matches by domain.
 * - Nothing about the organization is shown beyond its public card; nothing about the person is
 *   shown to the organization beyond the name and the e-mail domain.
 * - The person's own new organization is kept: they can use it or leave it.
 */
import type { MembershipRole, PrismaClient } from "@/generated/prisma/client";
import { level } from "@/server/entitlements";
import { HireError, hirePermissions, type HireContext } from "./hire";
import { notify } from "./notifications";
import { grantableRoles, seatUsage } from "./organization";

export const JOIN_REQUEST_DAYS = 7;
const DAY = 86_400_000;

/** Free mailboxes: their domain says nothing about an employer. */
export const freeMailDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.fr",
  "ymail.com",
  "outlook.com",
  "outlook.fr",
  "hotmail.com",
  "hotmail.fr",
  "live.com",
  "live.fr",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.fr",
  "mail.com",
  "yandex.com",
  "orange.fr",
  "free.fr",
  "laposte.net",
  // Every fictitious account of the demo and the tests shares this domain: it names no employer.
  "jumanly.test",
]);

export function professionalDomain(email: string) {
  const domain = (email.split("@")[1] ?? "").trim().toLowerCase();
  return domain && !freeMailDomains.has(domain) ? domain : null;
}

/** « Baobab Fintech SARL » and « baobab-fintech » are the same name. */
export function normalizeOrgName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(sarl|sas|sa|sasu|ltd|llc|inc|asbl|ong|gmbh|group|groupe)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type JoinCandidate = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  sector: string | null;
  verified: boolean;
  members: number;
  matchedBy: "domain" | "name";
};

/**
 * The organizations a new recruiter could join: same professional domain as one of their
 * administrators, or the same name. Never one the person already belongs to.
 */
export async function joinCandidates(
  db: PrismaClient,
  person: { userId: string; email: string; orgName?: string | null },
): Promise<JoinCandidate[]> {
  const memberOf = (
    await db.membership.findMany({
      where: { userId: person.userId },
      select: { organizationId: true },
    })
  ).map((row) => row.organizationId);
  const domain = professionalDomain(person.email);
  const name = person.orgName ? normalizeOrgName(person.orgName) : "";
  const base = {
    id: { notIn: memberOf },
    type: { in: ["recruiter", "company"] as ("recruiter" | "company")[] },
    suspendedAt: null,
  };
  const byDomain = domain
    ? await db.organization.findMany({
        where: {
          ...base,
          memberships: {
            some: {
              status: "active",
              role: { in: ["org_owner", "org_admin"] },
              user: { email: { endsWith: `@${domain}`, mode: "insensitive" } },
            },
          },
        },
        take: 3,
        select: candidateSelect,
      })
    : [];
  const byName =
    name.length >= 3
      ? (
          await db.organization.findMany({
            where: {
              ...base,
              name: { contains: person.orgName!.trim().split(/\s+/)[0]!, mode: "insensitive" },
            },
            take: 20,
            select: candidateSelect,
          })
        ).filter((org) => normalizeOrgName(org.name) === name)
      : [];
  const seen = new Set<string>();
  const rows: JoinCandidate[] = [];
  for (const [list, matchedBy] of [
    [byDomain, "domain"],
    [byName, "name"],
  ] as const) {
    for (const org of list) {
      if (seen.has(org.id)) continue;
      seen.add(org.id);
      rows.push({
        id: org.id,
        name: org.name,
        city: org.city,
        country: org.country,
        sector: org.sector,
        verified: org.verifiedAt !== null,
        members: org._count.memberships,
        matchedBy,
      });
    }
  }
  return rows.slice(0, 3);
}

const candidateSelect = {
  id: true,
  name: true,
  city: true,
  country: true,
  sector: true,
  verifiedAt: true,
  _count: { select: { memberships: { where: { status: "active" as const } } } },
};

/** The person's request in progress, or answered in the last 7 days, for the waiting screen. */
export async function myJoinRequest(db: PrismaClient, userId: string, now = new Date()) {
  return db.orgJoinRequest.findFirst({
    where: {
      userId,
      OR: [
        { status: "pending", expiresAt: { gt: now } },
        {
          status: { in: ["accepted", "declined"] },
          respondedAt: { gt: new Date(now.getTime() - JOIN_REQUEST_DAYS * DAY) },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      organization: { select: { id: true, name: true, city: true, verifiedAt: true } },
    },
  });
}

/**
 * « Demander à rejoindre »: only an organization proposed to this person. One pending request at
 * a time; the administrators are told in the app (and by e-mail by the caller).
 */
export async function requestJoin(
  db: PrismaClient,
  person: { userId: string; email: string; name: string; orgName?: string | null },
  organizationId: string,
  now = new Date(),
) {
  const candidates = await joinCandidates(db, person);
  const candidate = candidates.find((org) => org.id === organizationId);
  if (!candidate) throw new HireError("notFound");
  const pending = await db.orgJoinRequest.findFirst({
    where: { userId: person.userId, status: "pending", expiresAt: { gt: now } },
  });
  if (pending) return { request: pending, admins: [], created: false };
  const request = await db.orgJoinRequest.create({
    data: {
      organizationId,
      userId: person.userId,
      matchedBy: candidate.matchedBy,
      expiresAt: new Date(now.getTime() + JOIN_REQUEST_DAYS * DAY),
      createdAt: now,
    },
  });
  const admins = (
    await db.membership.findMany({
      where: { organizationId, status: "active", role: { in: ["org_owner", "org_admin"] } },
      select: { user: { select: { id: true, email: true, firstName: true } } },
    })
  ).map((row) => row.user);
  await notify(db, {
    userIds: admins.map((admin) => admin.id),
    type: "orgJoinRequest",
    payload: { name: person.name, org: candidate.name },
    href: "/app/notifications#demandes",
  });
  return { request, admins, created: true, candidate };
}

export async function cancelJoin(db: PrismaClient, userId: string, requestId: string) {
  const done = await db.orgJoinRequest.updateMany({
    where: { id: requestId, userId, status: "pending" },
    data: { status: "cancelled" },
  });
  return done.count > 0;
}

/** The pending requests an administrator answers (`/app/notifications`), with the seats left. */
export async function pendingJoinRequests(db: PrismaClient, ctx: HireContext, now = new Date()) {
  if (!hirePermissions(ctx.role).administer) return null;
  const requests = await db.orgJoinRequest.findMany({
    where: { organizationId: ctx.organizationId, status: "pending", expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    take: 10,
    select: {
      id: true,
      matchedBy: true,
      createdAt: true,
      expiresAt: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (requests.length === 0) return null;
  const [seats, permissions] = await Promise.all([
    seatUsage(db, ctx.organizationId, now),
    level(db, { type: "organization", id: ctx.organizationId }, "org.permissions.level"),
  ]);
  return {
    requests: requests.map((request) => ({
      id: request.id,
      name: request.user.name,
      // Only the domain is shown: the address stays private until the person joins.
      domain: request.user.email.split("@")[1] ?? "",
      matchedBy: request.matchedBy,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    })),
    seats,
    roles: grantableRoles(permissions),
  };
}

/**
 * « Accepter » (with the role chosen) or « Refuser ». Accepting needs a free seat (`org.seats`);
 * the person becomes a member at once and is told; refusing tells them without a reason.
 */
export async function respondJoin(
  db: PrismaClient,
  ctx: HireContext,
  requestId: string,
  input: { accept: boolean; role?: string },
  now = new Date(),
): Promise<"accepted" | "declined" | "seats" | "role"> {
  if (!hirePermissions(ctx.role).administer) throw new HireError("forbidden");
  const request = await db.orgJoinRequest.findFirst({
    where: {
      id: requestId,
      organizationId: ctx.organizationId,
      status: "pending",
      expiresAt: { gt: now },
    },
    select: { id: true, userId: true, organization: { select: { name: true } } },
  });
  if (!request) throw new HireError("notFound");
  if (!input.accept) {
    await db.orgJoinRequest.update({
      where: { id: request.id },
      data: { status: "declined", respondedAt: now, respondedById: ctx.userId },
    });
    await notify(db, {
      userIds: [request.userId],
      type: "orgJoinDeclined",
      payload: { org: request.organization.name },
      href: "/app/hire",
    });
    return "declined";
  }
  const permissions = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "org.permissions.level",
  );
  const role = (input.role ?? "recruiter") as MembershipRole;
  if (!grantableRoles(permissions).includes(role)) return "role";
  const seats = await seatUsage(db, ctx.organizationId, now);
  if (seats.max !== null && seats.used >= seats.max) return "seats";
  await db.$transaction([
    db.membership.upsert({
      where: {
        userId_organizationId: { userId: request.userId, organizationId: ctx.organizationId },
      },
      update: { status: "active", role },
      create: {
        userId: request.userId,
        organizationId: ctx.organizationId,
        role,
        invitedBy: ctx.userId,
      },
    }),
    db.orgJoinRequest.update({
      where: { id: request.id },
      data: { status: "accepted", role, respondedAt: now, respondedById: ctx.userId },
    }),
    db.auditLog.create({
      data: {
        actorId: ctx.userId,
        action: "org.join.accept",
        targetType: "user",
        targetId: request.userId,
        organizationId: ctx.organizationId,
        metadata: { role },
      },
    }),
  ]);
  await notify(db, {
    userIds: [request.userId],
    type: "orgJoinAccepted",
    payload: { org: request.organization.name },
    href: "/app/bienvenue?etape=organisation",
  });
  return "accepted";
}

/** Requests left 7 days without an answer expire (daily task). */
export async function expireJoinRequests(db: PrismaClient, now = new Date()) {
  const done = await db.orgJoinRequest.updateMany({
    where: { status: "pending", expiresAt: { lte: now } },
    data: { status: "expired" },
  });
  return done.count;
}
