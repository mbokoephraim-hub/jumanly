import type { PrismaClient } from "@/generated/prisma/client";
import { parseSocialLinks } from "@/lib/social-links";
import { links } from "./explore";
import { lastActive } from "./hire-phone-talents";
import { parseProject, portfolioLevel } from "./portfolio";
import { ensureProfile, parseProfileLanguages } from "./profile";

/**
 * Everything the profile of a person shows (docs/profil-personne): who, the networks they chose,
 * their numbers, their skills, experiences, studies, languages, achievements and files.
 *
 * - `connection`: a member opens someone's profile. A blocked person, a suspended or deleted
 *   account, or an anonymous profile not connected, is not found. A private profile not connected
 *   opens with its name, photo, title and city only (Ephraïm 27/10/2026: every member can be found
 *   in Explorer from sign-up); its sections stay hidden (golden rule 5).
 * - `candidate`: a recruiter opens the profile of someone who applied to the organization; the
 *   application was checked (and the view logged) by the caller.
 */
export async function personProfile(
  db: PrismaClient,
  viewerId: string,
  userId: string,
  mode: "connection" | "candidate",
) {
  const mine = await links(db, viewerId);
  const link = mine.get(userId);
  if (mode === "connection" && link === "blocked") return null;
  // A recruiter's profile is a professional page, open to every member (Ephraïm 27/10/2026);
  // its sections (À propos, expérience…) live in a talent profile that stays private, so the
  // recruiter never shows up in talent searches.
  const recruiter = await recruiterBlock(db, userId);
  const exists = await db.user.findFirst({
    where: { id: userId, ...(mode === "connection" ? { status: "active" as const } : {}) },
    select: { id: true, talentProfile: { select: { id: true } } },
  });
  if (!exists) return null;
  // A member who has not opened their profile yet still has a page (private by default).
  if (!exists.talentProfile) await ensureProfile(db, userId);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      email: true,
      image: true,
      emailVerified: true,
      country: true,
      city: true,
      talentProfile: {
        select: {
          id: true,
          visibility: true,
          banner: true,
          handle: true,
          socialLinks: true,
          showEmail: true,
          headline: true,
          aboutTitle: true,
          summary: true,
          sectors: true,
          desiredContracts: true,
          desiredJobTitles: true,
          desiredLocations: true,
          languages: true,
          portfolioSlug: true,
          portfolioPublic: true,
          skills: {
            orderBy: [{ verified: "desc" }, { level: "desc" }, { createdAt: "asc" }],
            take: 16,
            select: { verified: true, skill: { select: { name: true, category: true } } },
          },
          experiences: {
            orderBy: [{ startDate: "desc" }],
            take: 8,
            select: {
              id: true,
              title: true,
              company: true,
              logo: true,
              organization: { select: { slug: true, logo: true, suspendedAt: true } },
              type: true,
              location: true,
              startDate: true,
              endDate: true,
              description: true,
            },
          },
          educations: {
            orderBy: [{ endYear: "desc" }],
            take: 4,
            select: { id: true, degree: true, school: true, startYear: true, endYear: true },
          },
          documents: {
            where: { kind: "portfolio_item" },
            orderBy: { createdAt: "desc" },
            take: 12,
            select: { id: true, title: true, content: true },
          },
        },
      },
    },
  });
  const profile = user?.talentProfile;
  if (!user || !profile) return null;
  const connected = link === "connected";
  if (mode === "connection" && !recruiter && profile.visibility === "anonymous" && !connected)
    return null;
  /** Only the name, photo, title and city: a private profile seen by someone not connected. */
  const limited =
    mode === "connection" &&
    !recruiter &&
    profile.visibility !== "recruiters" &&
    !connected &&
    viewerId !== userId;

  const [circle, conversation, seen, certificates, level] = await Promise.all([
    db.connection.findMany({
      where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    }),
    connected
      ? db.conversation.findFirst({
          where: {
            kind: "peer",
            connection: {
              status: "accepted",
              OR: [
                { requesterId: viewerId, addresseeId: userId },
                { requesterId: userId, addresseeId: viewerId },
              ],
            },
          },
          select: { id: true },
        })
      : null,
    lastActive(db, viewerId, userId),
    db.certificate.findMany({
      where: { onProfile: true, revokedAt: null, enrollment: { userId } },
      orderBy: { issuedAt: "desc" },
      take: 6,
      select: { id: true, code: true, courseTitle: true, skills: true },
    }),
    portfolioLevel(db, userId),
  ]);
  const myConnections = new Set(
    [...mine.entries()].filter(([, kind]) => kind === "connected").map(([other]) => other),
  );
  const commonIds = circle
    .map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId))
    .filter((other) => other !== viewerId && myConnections.has(other));
  const commonPeople =
    commonIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: commonIds.slice(0, 3) } },
          select: { id: true, name: true, firstName: true, image: true },
        })
      : [];

  // The achievements the person shows; their pictures and files only once the portfolio is
  // published (the rule of /api/projets).
  const published = profile.portfolioPublic && level !== "none";
  const projects = profile.documents.flatMap((document) => {
    const project = parseProject(document);
    return project && project.visible ? [project] : [];
  });

  return {
    id: user.id,
    profileId: profile.id,
    name: user.name,
    firstName: user.firstName || user.name.split(/\s+/)[0] || user.name,
    image: user.image,
    banner: profile.banner,
    verified: user.emailVerified,
    handle: profile.handle,
    socials: limited ? {} : parseSocialLinks(profile.socialLinks),
    email: profile.showEmail && !limited ? user.email : null,
    country: user.country,
    city: user.city || profile.desiredLocations[0] || null,
    headline: profile.headline,
    about: limited ? null : profile.summary?.trim() || null,
    aboutTitle: limited ? null : profile.aboutTitle?.trim() || null,
    sector: profile.sectors[0] ?? null,
    contract: profile.desiredContracts[0] ?? null,
    lastSeen: seen,
    connections: circle.length,
    common: {
      count: commonIds.length,
      people: commonPeople.map((person) => ({
        id: person.id,
        name: person.firstName || person.name.split(/\s+/)[0] || person.name,
        fullName: person.name,
        image: person.image,
      })),
    },
    link: link === "blocked" ? ("none" as const) : (link ?? ("none" as const)),
    conversationId: conversation?.id ?? null,
    skills: (limited ? [] : profile.skills).map((row) => ({
      name: row.skill.name,
      category: row.skill.category,
      verified: row.verified,
    })),
    experiences: limited ? [] : profile.experiences,
    educations: limited ? [] : profile.educations,
    languages: limited ? [] : parseProfileLanguages(profile.languages),
    projects: (limited ? [] : projects).map((project) => ({
      id: project.id,
      title: project.title,
      skills: project.skills,
      link: project.link,
      files: published
        ? project.files.map((file, index) => ({
            index,
            name: file.name,
            type: file.type,
            size: file.size,
          }))
        : [],
    })),
    certificates: limited ? [] : certificates,
    portfolio: published && !limited && profile.portfolioSlug ? profile.portfolioSlug : null,
    limited,
    recruiter,
  };
}

/**
 * What a recruiter's profile adds (Ephraïm 27/10/2026): the post, the organization, « Recrute en
 * ce moment », the candidate looked for and the domains. Null for anyone without a recruiter
 * profile.
 */
async function recruiterBlock(db: PrismaClient, userId: string) {
  const [profile, membership] = await Promise.all([
    db.recruiterProfile.findUnique({
      where: { userId },
      select: {
        jobTitle: true,
        headline: true,
        hiringNow: true,
        seeking: true,
        domains: true,
        personalOrganizationId: true,
      },
    }),
    db.membership.findFirst({
      where: { userId, status: "active", organization: { type: { not: "partner" } } },
      orderBy: { createdAt: "asc" },
      select: {
        jobTitle: true,
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);
  // A recruiter of a company without a recruiter profile yet is listed in its « Membres »: their
  // page opens too (Ephraïm 27/10/2026).
  const recruiting =
    membership && ["org_owner", "org_admin", "recruiter"].includes(membership.role);
  if (!profile && !recruiting) return null;
  const organization = membership?.organization ?? null;
  const offers = organization
    ? await db.job.count({
        where: {
          organizationId: organization.id,
          status: "published",
          OR: [{ createdById: userId }, { assignedToId: userId }],
        },
      })
    : 0;
  return {
    jobTitle: membership?.jobTitle?.trim() || profile?.jobTitle?.trim() || null,
    headline: profile?.headline?.trim() || null,
    hiringNow: profile?.hiringNow ?? false,
    seeking: profile?.seeking?.trim() || null,
    domains: profile?.domains ?? [],
    organization: organization ? { name: organization.name, slug: organization.slug } : null,
    offers,
  };
}

export type PersonProfile = NonNullable<Awaited<ReturnType<typeof personProfile>>>;
