/**
 * Cached reads for the public site. Results are shared between visitors (no personal data) and
 * refreshed every few minutes; the admin will invalidate the tags when content changes.
 */
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import * as contents from "@/server/services/contents";
import * as courses from "@/server/services/courses";
import * as jobs from "@/server/services/jobs";
import * as learn from "@/server/services/learn";
import * as plans from "@/server/services/plans";
import { publicCompany } from "@/server/services/verification";
import { activeWeights } from "@/server/matching/service";

export async function getPublicPlans() {
  "use cache";
  cacheLife("hours");
  cacheTag("plans");
  return plans.listPublicPlans(db);
}

export async function getCourseSearch(filters: courses.CourseFilters) {
  "use cache";
  cacheLife("minutes");
  cacheTag("courses");
  const [result, total, themes] = await Promise.all([
    courses.searchCourses(db, filters),
    courses.countPublishedCourses(db),
    courses.listCourseThemes(db),
  ]);
  return { ...result, catalogTotal: total, themes };
}

export async function getFeaturedCourses() {
  "use cache";
  cacheLife("minutes");
  cacheTag("courses");
  return courses.featuredCourses(db);
}

export async function getCourse(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("courses", `course:${slug}`);
  const course = await courses.getPublicCourse(db, slug);
  if (!course) return null;
  const related = await courses.relatedCourses(db, course);
  return { course, related };
}

export async function getJobSearch(filters: jobs.JobFilters) {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs");
  const now = new Date();
  const [result, total, countries] = await Promise.all([
    jobs.searchJobs(db, filters, now),
    jobs.countOpenJobs(db, now),
    jobs.listJobCountries(db, now),
  ]);
  return { ...result, openTotal: total, countries, now };
}

export async function getLatestJobs() {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs");
  const now = new Date();
  return { jobs: await jobs.latestJobs(db, 4, now), now };
}

export async function getJob(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs", `job:${slug}`);
  const now = new Date();
  const job = await jobs.getPublicJob(db, slug);
  if (!job) return null;
  const similar = await jobs.similarJobs(db, job, 3, now);
  return { job, similar, now, open: jobs.isJobOpen(job, now) };
}

export async function getSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag("courses", "jobs");
  const [courseSlugs, jobSlugs, companySlugs] = await Promise.all([
    courses.listCourseSlugs(db),
    jobs.listJobSlugs(db),
    db.organization.findMany({
      where: { type: { in: ["recruiter", "company"] }, jobs: { some: { status: "published" } } },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  return { courseSlugs, jobSlugs, companySlugs };
}

/**
 * Params for `generateStaticParams`. Cache Components refuses an empty list, which happens on a fresh
 * production database (no course, job or company yet): a placeholder slug then renders a 404.
 */
export function staticSlugParams(rows: { slug: string }[]) {
  const params = rows.map(({ slug }) => ({ slug }));
  return params.length > 0 ? params : [{ slug: "aucun" }];
}

/** Public page of a recruiting organization (E8): its presentation and its open jobs. */
export async function getCompany(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs", `company:${slug}`);
  const company = await publicCompany(db, slug);
  // The page shows relative dates (« il y a 2 jours »): the reference time is cached with the data.
  return company ? { ...company, now: new Date() } : null;
}

/** Public verification of an attestation: only what the verification page shows. */
export async function getCertificate(code: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`certificate:${code}`);
  const certificate = await learn.verifyCertificate(db, code);
  if (!certificate) return null;
  const { holderName, courseTitle, hours, issuedAt, revokedAt } = certificate;
  return { code: certificate.code, holderName, courseTitle, hours, issuedAt, revokedAt };
}

/** Texts and banners edited in /admin/contenus (refreshed at once when the admin publishes). */
export async function getContentOverrides() {
  "use cache";
  cacheLife("hours");
  cacheTag("contents");
  return contents.listOverrides(db);
}

/** Banners shown now to a public (dates are whole days: an hour of cache is precise enough). */
export async function getActiveBanners(audience: contents.BannerAudience) {
  "use cache";
  cacheLife("hours");
  cacheTag("contents");
  return contents.activeBanners(await contents.listOverrides(db), audience);
}

/** Published courses and open jobs listed in `/llms.txt` (titles only, no personal data). */
export async function getLlmsEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag("courses", "jobs");
  const [courseRows, jobRows] = await Promise.all([
    db.course.findMany({
      where: { status: "published" },
      select: { slug: true, title: true, summary: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    db.job.findMany({
      where: jobs.openJobWhere(new Date()),
      select: { slug: true, title: true, city: true, organization: { select: { name: true } } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ]);
  return { courses: courseRows, jobs: jobRows };
}

/** Active matching weights, shown as an example on /comment-fonctionne-le-matching. */
export async function getMatchingWeights() {
  "use cache";
  cacheLife("hours");
  cacheTag("matching-weights");
  return activeWeights(db);
}
