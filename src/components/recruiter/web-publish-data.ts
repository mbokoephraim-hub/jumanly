import "server-only";
import { featuredStudyFields } from "@/lib/studies";
import { db } from "@/server/db";
import { activeWeights } from "@/server/matching/service";
import { can, limit } from "@/server/entitlements";
import { activeJobCount, getOrgJob, isOrgVerified, type HireContext } from "@/server/services/hire";
import { requestedDocumentKinds } from "@/server/services/hire-offers";
import { screeningQuestionsOf } from "@/server/services/screening";
import { initialsOf } from "@/components/phone/recruteur/compte-initials";

const DAY = 86_400_000;
const CONTRACTS = ["cdi", "cdd", "stage", "mission", "freelance", "alternance", "volontariat"];
type Domain = (typeof featuredStudyFields)[number];

/**
 * What « Publier une offre » on a computer needs (Modèle B, lot N2): the draft (new or reopened),
 * the cities offered, the company for the preview, the members who may be in charge or evaluate
 * (each part only when the plan includes it), the skills Orbi suggests by field (the referential,
 * the most used in published offers) and the place left under `jobs.active.max`.
 */
export async function webPublishData(
  ctx: HireContext,
  userId: string,
  jobId: string | null,
  step: number,
  now = new Date(),
) {
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [job, org, profile, user, verified, teams, collaboration, members, active, max] =
    await Promise.all([
      jobId ? getOrgJob(db, ctx, jobId) : null,
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { name: true, logo: true, city: true, country: true },
      }),
      db.recruiterProfile.findUnique({ where: { userId }, select: { otherCities: true } }),
      db.user.findUnique({ where: { id: userId }, select: { city: true, country: true } }),
      isOrgVerified(db, ctx.organizationId),
      can(db, subject, "org.teams"),
      can(db, subject, "hire.collaboration"),
      db.membership.findMany({
        where: { organizationId: ctx.organizationId, status: "active" },
        orderBy: { createdAt: "asc" },
        select: { role: true, user: { select: { id: true, name: true } } },
      }),
      activeJobCount(db, ctx.organizationId),
      limit(db, subject, "jobs.active.max"),
    ]);
  const weights = await activeWeights(db, now);
  const popular = await db.jobSkill.groupBy({
    by: ["skillId"],
    where: { job: { status: "published", domain: { in: [...featuredStudyFields] } } },
    _count: { _all: true },
    orderBy: { _count: { skillId: "desc" } },
    take: 60,
  });
  const skills = await db.skill.findMany({
    where: { id: { in: popular.map((row) => row.skillId) } },
    select: {
      id: true,
      name: true,
      jobs: {
        where: { job: { status: "published" } },
        select: { job: { select: { domain: true } } },
      },
    },
  });
  const suggestions = Object.fromEntries(
    featuredStudyFields.map((domain) => [
      domain,
      skills
        .map((item) => ({
          name: item.name,
          count: item.jobs.filter((row) => row.job.domain === domain).length,
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((item) => item.name),
    ]),
  ) as Record<Domain, string[]>;
  const all = popular
    .map((row) => skills.find((item) => item.id === row.skillId)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 6);

  const cities = [
    ...new Set(
      [job?.city, user?.city, ...(profile?.otherCities ?? []), org.city]
        .map((city) => city?.trim())
        .filter((city): city is string => Boolean(city)),
    ),
  ].slice(0, 6);
  const dollars = (cents: number | null | undefined) =>
    cents === null || cents === undefined ? "" : String(Math.round(cents / 100));
  const deadlines = [28, 42, 56].map((days) =>
    new Date(now.getTime() + days * DAY).toISOString().slice(0, 10),
  );
  const closesAt = job?.closesAt ? job.closesAt.toISOString().slice(0, 10) : "";
  const domain = featuredStudyFields.includes(job?.domain as Domain) ? (job!.domain as Domain) : "";
  return {
    draft: {
      id: job?.id ?? null,
      title: job?.title ?? "",
      domain: domain as Domain | "",
      openings: job?.openings ?? 1,
      description: job?.description ?? "",
      required: (job?.skills ?? [])
        .filter((item) => item.importance === "required")
        .map((item) => item.skill.name),
      preferred: (job?.skills ?? [])
        .filter((item) => item.importance === "preferred")
        .map((item) => item.skill.name),
      city: job?.city || cities[0] || "",
      country: job?.country || org.country || user?.country || "",
      remote: (job?.remote ?? "onsite") as "onsite" | "hybrid" | "remote",
      contract: (CONTRACTS.includes(job?.contractType ?? "") ? job!.contractType : "cdi") as
        "cdi" | "cdd" | "stage" | "mission" | "freelance" | "alternance" | "volontariat",
      salaryShown: job ? job.salaryMin !== null || job.salaryMax !== null : true,
      salaryMin: dollars(job?.salaryMin),
      salaryMax: dollars(job?.salaryMax),
      closesAt,
      questions: screeningQuestionsOf(job?.screeningQuestions).map((question) => question.text),
      documents: (job?.requestedDocuments ?? ["cv"]).filter(
        (kind): kind is (typeof requestedDocumentKinds)[number] =>
          (requestedDocumentKinds as readonly string[]).includes(kind),
      ),
      ownerId: job?.assignedToId ?? (teams ? ctx.userId : ""),
      evaluatorIds: job?.assignments.map((row) => row.userId) ?? [],
    },
    deadlines: closesAt && !deadlines.includes(closesAt) ? [closesAt, ...deadlines] : deadlines,
    cities,
    org: {
      name: org.name,
      initials: initialsOf(org.name),
      logo: org.logo,
      city: org.city ?? "",
      verified,
    },
    owners: teams
      ? members
          .filter((row) => ["org_owner", "org_admin", "recruiter"].includes(row.role))
          .map((row) => ({ id: row.user.id, name: row.user.name }))
      : null,
    evaluators: collaboration
      ? members
          .filter((row) => row.role === "hiring_manager")
          .map((row) => ({ id: row.user.id, name: row.user.name }))
      : null,
    suggestions: { ...suggestions, all },
    places: {
      after: job?.status === "published" ? active : active + 1,
      max,
    },
    /** The points of the score that the skills weigh (doc 08, set in the admin). */
    points: {
      required: Math.round(weights.values.skills_required ?? 0),
      preferred: Math.round(weights.values.skills_preferred ?? 0),
    },
    step: Math.min(5, Math.max(1, Math.trunc(step) || 1)),
    editing: Boolean(job),
  };
}

export type WebPublishData = Awaited<ReturnType<typeof webPublishData>>;
