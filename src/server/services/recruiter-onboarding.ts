/**
 * The recruiter's sign-up on a phone (Modèle B recruteur, lot M2, mobile/captures section 01): the
 * profile in seven steps, saved as the person goes on. The organization comes at step 5: ask to
 * join a company already on Jumanly (its administrators decide), create its page, or recruit as an
 * independent. While a request waits, the person works in a space under their own name; that space
 * becomes the company page if they create one, so nothing is duplicated.
 *
 * Nothing here reads or writes another organization's data beyond its public card (golden rule
 * n° 6); the administrators see only the name, the job title, the work e-mail and the message.
 */
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { slugify } from "./accounts";
import { HireError } from "./hire";
import { notify } from "./notifications";
import { cancelJoin, JOIN_REQUEST_DAYS, professionalDomain } from "./org-join";

export const RECRUITER_KINDS = [
  "charge",
  "rh",
  "manager",
  "dirigeant",
  "cabinet",
  "independant",
] as const;
export type RecruiterKind = (typeof RECRUITER_KINDS)[number];
export const CONTACT_AUDIENCES = ["nobody", "interview", "connections"] as const;
export const HIRES_PER_YEAR = ["few", "some", "many"] as const;
/** Same values as the organization's size elsewhere (`organizationSizes`). */
export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;
export const RECRUIT_DOMAINS_MAX = 10;

const DAY = 86_400_000;

export async function ensureRecruiterProfile(db: PrismaClient, userId: string) {
  return db.recruiterProfile.upsert({ where: { userId }, update: {}, create: { userId } });
}

// ─── Steps 2 to 4 ──────────────────────────────────────────────────

const city = z.string().trim().min(1).max(120);

export const placeSchema = z.object({
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  city,
  otherCities: z.array(city).max(10),
});

export async function saveRecruiterPlace(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof placeSchema>,
) {
  const parsed = placeSchema.safeParse(input);
  if (!parsed.success) return false;
  const code = parsed.data.country.toUpperCase();
  if (!(await db.country.findUnique({ where: { code }, select: { code: true } }))) return false;
  await db.user.update({ where: { id: userId }, data: { country: code, city: parsed.data.city } });
  await db.recruiterProfile.update({
    where: { userId },
    data: {
      otherCities: [...new Set(parsed.data.otherCities.filter((c) => c !== parsed.data.city))],
    },
  });
  return true;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const contactsSchema = z.object({
  workEmail: z.string().trim().toLowerCase().max(200).regex(EMAIL),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length === 0 || (digits.length >= 8 && digits.length <= 14);
    }),
  phoneCountry: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/),
  whatsapp: z.boolean(),
  linkedin: z.string().trim().max(200),
  contactsFor: z.enum(CONTACT_AUDIENCES),
});

export async function saveRecruiterContacts(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof contactsSchema>,
) {
  const parsed = contactsSchema.safeParse(input);
  if (!parsed.success) return parsed.error.issues[0]?.path[0] === "phone" ? "phone" : "email";
  const digits = parsed.data.phone.replace(/\D/g, "");
  await db.recruiterProfile.update({
    where: { userId },
    data: {
      workEmail: parsed.data.workEmail,
      phone: digits || null,
      phoneCountry: digits ? parsed.data.phoneCountry.toUpperCase() : null,
      whatsapp: digits ? parsed.data.whatsapp : false,
      linkedin: parsed.data.linkedin || null,
      contactsFor: parsed.data.contactsFor,
    },
  });
  return null;
}

export const roleSchema = z.object({
  kind: z.enum(RECRUITER_KINDS),
  jobTitle: z.string().trim().min(2).max(120),
});

/** The job title also shows on each membership (« Votre fonction »). */
export async function saveRecruiterRole(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof roleSchema>,
) {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return false;
  await db.recruiterProfile.update({ where: { userId }, data: parsed.data });
  await db.membership.updateMany({
    where: { userId, status: "active" },
    data: { jobTitle: parsed.data.jobTitle },
  });
  return true;
}

// ─── Step 5 · the company ──────────────────────────────────────────

export type CompanyCard = {
  id: string;
  name: string;
  logo: string | null;
  sector: string | null;
  city: string | null;
  size: string | null;
  recruiters: number;
  /** The first administrator's name, as on the public page of the company. */
  manager: string | null;
  /** The professional domain of its administrators, to tell whether the work e-mail matches. */
  domain: string | null;
};

const cardSelect = {
  id: true,
  name: true,
  logo: true,
  sector: true,
  city: true,
  size: true,
  memberships: {
    where: { status: "active" as const },
    orderBy: { createdAt: "asc" as const },
    select: { role: true, user: { select: { name: true, email: true } } },
  },
};

type CardRow = {
  id: string;
  name: string;
  logo: string | null;
  sector: string | null;
  city: string | null;
  size: string | null;
  memberships: { role: string; user: { name: string; email: string } }[];
};

function toCard(org: CardRow): CompanyCard {
  const admins = org.memberships.filter((m) => m.role === "org_owner" || m.role === "org_admin");
  const domain = admins.map((m) => professionalDomain(m.user.email)).find(Boolean) ?? null;
  return {
    id: org.id,
    name: org.name,
    logo: org.logo,
    sector: org.sector,
    city: org.city,
    size: org.size,
    recruiters: org.memberships.filter((m) => m.role !== "viewer").length,
    manager: admins[0]?.user.name ?? null,
    domain,
  };
}

/** Organizations a person may ask to join: recruiters and companies, active, not their own. */
async function joinable(db: PrismaClient, userId: string) {
  const [memberOf, personal] = await Promise.all([
    db.membership.findMany({ where: { userId }, select: { organizationId: true } }),
    db.recruiterProfile.findMany({
      where: { personalOrganizationId: { not: null } },
      select: { personalOrganizationId: true },
    }),
  ]);
  return {
    id: {
      notIn: [
        ...memberOf.map((row) => row.organizationId),
        // A space under someone's own name is not a company page.
        ...personal.map((row) => row.personalOrganizationId!),
      ],
    },
    type: { in: ["recruiter", "company"] as ("recruiter" | "company")[] },
    suspendedAt: null,
    name: { not: "" },
  };
}

/**
 * « Rechercher votre entreprise »: from the first letter, by name. Without a query, the companies
 * already on Jumanly in the person's city (« Déjà sur Jumanly, près de vous »).
 */
export async function searchCompanies(
  db: PrismaClient,
  userId: string,
  query: string,
): Promise<CompanyCard[]> {
  const words = query.trim().slice(0, 80);
  const base = await joinable(db, userId);
  if (!words) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { city: true } });
    const near = await db.organization.findMany({
      where: { ...base, ...(user?.city ? { city: { equals: user.city, mode: "insensitive" } } : {}) },
      orderBy: [{ jobs: { _count: "desc" } }, { name: "asc" }],
      take: 3,
      select: cardSelect,
    });
    return near.map(toCard);
  }
  const rows = await db.organization.findMany({
    where: { ...base, name: { contains: words, mode: "insensitive" } },
    orderBy: { name: "asc" },
    take: 8,
    select: cardSelect,
  });
  return rows.map(toCard);
}

async function personName(db: PrismaClient, userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, country: true, city: true },
  });
  return user;
}

async function uniqueSlug(db: PrismaClient, name: string) {
  const base = slugify(name) || "organisation";
  for (let index = 0; ; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    if (!(await db.organization.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
}

/** The space under the person's own name (kept if it exists), with the person as owner. */
async function ensurePersonalSpace(db: PrismaClient, userId: string) {
  const profile = await ensureRecruiterProfile(db, userId);
  if (profile.personalOrganizationId) {
    const existing = await db.organization.findUnique({
      where: { id: profile.personalOrganizationId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }
  const user = await personName(db, userId);
  const org = await db.organization.create({
    data: {
      type: "recruiter",
      name: user.name,
      slug: await uniqueSlug(db, user.name),
      country: user.country,
      city: user.city,
      memberships: {
        create: { userId, role: "org_owner", jobTitle: profile.jobTitle },
      },
    },
    select: { id: true },
  });
  await db.recruiterProfile.update({
    where: { userId },
    data: { personalOrganizationId: org.id },
  });
  return org.id;
}

/**
 * « Envoyer la demande »: one request at a time, to an organization the person may join. Its
 * administrators are told in the app; the caller e-mails them. The person gets a space under their
 * own name meanwhile.
 */
export async function requestCompany(
  db: PrismaClient,
  userId: string,
  organizationId: string,
  message: string,
  now = new Date(),
) {
  const base = await joinable(db, userId);
  const org = await db.organization.findFirst({
    where: { ...base, AND: [{ id: organizationId }] },
    select: cardSelect,
  });
  if (!org) throw new HireError("notFound");
  const card = toCard(org);
  const profile = await ensureRecruiterProfile(db, userId);
  const user = await personName(db, userId);
  await db.orgJoinRequest.updateMany({
    where: { userId, status: "pending" },
    data: { status: "cancelled" },
  });
  const work = profile.workEmail ?? user.email;
  const request = await db.orgJoinRequest.create({
    data: {
      organizationId,
      userId,
      matchedBy: card.domain && professionalDomain(work) === card.domain ? "domain" : "name",
      message: message.trim().slice(0, 500) || null,
      expiresAt: new Date(now.getTime() + JOIN_REQUEST_DAYS * DAY),
      createdAt: now,
    },
  });
  await db.recruiterProfile.update({ where: { userId }, data: { independent: false } });
  await ensurePersonalSpace(db, userId);
  const admins = (
    await db.membership.findMany({
      where: { organizationId, status: "active", role: { in: ["org_owner", "org_admin"] } },
      select: { user: { select: { id: true, email: true, firstName: true, name: true } } },
    })
  ).map((row) => row.user);
  await notify(db, {
    userIds: admins.map((admin) => admin.id),
    type: "orgJoinRequest",
    payload: { name: user.name, org: card.name },
    href: "/app/notifications#demandes",
  });
  return { request, admins, card };
}

export async function cancelCompanyRequest(db: PrismaClient, userId: string) {
  const pending = await db.orgJoinRequest.findFirst({
    where: { userId, status: "pending" },
    select: { id: true },
  });
  if (pending) await cancelJoin(db, userId, pending.id);
}

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  sector: z.string().trim().max(60),
  size: z.enum(COMPANY_SIZES),
});

/**
 * « Créer la page »: the person becomes its owner. A space already opened under their name becomes
 * this page (same offers, same history); a pending request is cancelled.
 */
export async function createCompany(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof createCompanySchema>,
) {
  const parsed = createCompanySchema.parse(input);
  await cancelCompanyRequest(db, userId);
  const profile = await ensureRecruiterProfile(db, userId);
  const user = await personName(db, userId);
  const data = {
    type: "company" as const,
    name: parsed.name,
    sector: parsed.sector || null,
    size: parsed.size,
    country: user.country,
    city: user.city,
  };
  let orgId = profile.personalOrganizationId;
  if (orgId && (await db.organization.findUnique({ where: { id: orgId }, select: { id: true } }))) {
    await db.organization.update({
      where: { id: orgId },
      data: { ...data, slug: await uniqueSlug(db, parsed.name) },
    });
  } else {
    const org = await db.organization.create({
      data: {
        ...data,
        slug: await uniqueSlug(db, parsed.name),
        memberships: { create: { userId, role: "org_owner", jobTitle: profile.jobTitle } },
      },
      select: { id: true },
    });
    orgId = org.id;
  }
  await db.recruiterProfile.update({
    where: { userId },
    data: { personalOrganizationId: null, independent: false },
  });
  return orgId;
}

/** « Je recrute en indépendant·e »: offers under the person's own name. */
export async function becomeIndependent(db: PrismaClient, userId: string) {
  await cancelCompanyRequest(db, userId);
  await ensurePersonalSpace(db, userId);
  await db.recruiterProfile.update({ where: { userId }, data: { independent: true } });
}

/** « Choisir une autre entreprise » / « Choisir plutôt une entreprise ». */
export async function resetCompanyChoice(db: PrismaClient, userId: string) {
  await cancelCompanyRequest(db, userId);
  await db.recruiterProfile.update({ where: { userId }, data: { independent: false } });
}

export type CompanyState =
  | { state: "none" }
  | { state: "pending" | "accepted" | "created"; card: CompanyCard; requestId?: string }
  | { state: "independent" };

/** Where step 5 stands, from the data: the request, the page created, or the independent. */
export async function companyState(
  db: PrismaClient,
  userId: string,
  now = new Date(),
): Promise<CompanyState> {
  const profile = await db.recruiterProfile.findUnique({ where: { userId } });
  const request = await db.orgJoinRequest.findFirst({
    where: {
      userId,
      OR: [
        { status: "pending", expiresAt: { gt: now } },
        { status: "accepted", respondedAt: { gt: new Date(now.getTime() - 30 * DAY) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, organization: { select: cardSelect } },
  });
  if (request && request.status === "accepted") {
    const member = await db.membership.findFirst({
      where: { userId, organizationId: request.organization.id, status: "active" },
      select: { id: true },
    });
    if (member) return { state: "accepted", card: toCard(request.organization) };
  }
  if (request && request.status === "pending")
    return { state: "pending", card: toCard(request.organization), requestId: request.id };
  if (profile?.independent) return { state: "independent" };
  const owned = await db.membership.findFirst({
    where: {
      userId,
      role: "org_owner",
      status: "active",
      ...(profile?.personalOrganizationId
        ? { organizationId: { not: profile.personalOrganizationId } }
        : {}),
      organization: { type: { in: ["recruiter", "company"] } },
    },
    orderBy: { createdAt: "desc" },
    select: { organization: { select: cardSelect } },
  });
  if (owned) return { state: "created", card: toCard(owned.organization) };
  return { state: "none" };
}

// ─── Steps 6 and 7 ─────────────────────────────────────────────────

export const recruitsSchema = z.object({
  domains: z.array(z.string().trim().min(1).max(40)).min(1).max(RECRUIT_DOMAINS_MAX),
  levels: z.array(z.string().trim().min(1).max(40)).max(6),
  hiresPerYear: z.enum(HIRES_PER_YEAR).nullable(),
});

export async function saveRecruits(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof recruitsSchema>,
) {
  const parsed = recruitsSchema.safeParse(input);
  if (!parsed.success) return false;
  await db.recruiterProfile.update({
    where: { userId },
    data: {
      domains: [...new Set(parsed.data.domains)],
      levels: [...new Set(parsed.data.levels)],
      hiresPerYear: parsed.data.hiresPerYear,
    },
  });
  return true;
}

export const finishSchema = z.object({
  headline: z.string().trim().min(1).max(160),
  hiringNow: z.boolean(),
});

export async function finishRecruiterProfile(
  db: PrismaClient,
  userId: string,
  input: z.input<typeof finishSchema>,
  now = new Date(),
) {
  const parsed = finishSchema.safeParse(input);
  if (!parsed.success) return false;
  await db.recruiterProfile.update({
    where: { userId },
    data: { ...parsed.data, completedAt: now },
  });
  return true;
}

/**
 * « Profil recruteur complété à … % » (planche Profil prêt): the essentials count 30, then the photo,
 * the work e-mail, the phone, LinkedIn, the company's logo (attachment accepted or page created;
 * a request still waiting counts a little), the domains and the headline.
 */
export function recruiterPercent(input: {
  photo: boolean;
  workEmail: boolean;
  phone: boolean;
  linkedin: boolean;
  company: CompanyState["state"];
  domains: number;
  headline: boolean;
}) {
  return (
    30 +
    (input.photo ? 10 : 0) +
    (input.workEmail ? 10 : 0) +
    (input.phone ? 5 : 0) +
    (input.linkedin ? 5 : 0) +
    (input.company === "accepted" || input.company === "created"
      ? 15
      : input.company === "pending"
        ? 5
        : 0) +
    (input.domains > 0 ? 10 : 0) +
    (input.headline ? 10 : 0)
  );
}
