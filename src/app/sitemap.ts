import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { getSitemapEntries } from "@/server/queries/public";

/** Public pages (docs/specifications.md, partie 07 § 1), published courses and open jobs. */
const staticRoutes = [
  "/",
  "/a-propos",
  "/talents",
  "/recruteurs",
  "/entreprises",
  "/partenaires",
  "/formations",
  "/offres",
  "/tarifs",
  "/faq",
  "/comment-fonctionne-le-matching",
  "/contact",
  "/liste-attente",
  "/mentions-legales",
  "/confidentialite",
  "/conditions",
  "/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { courseSlugs, jobSlugs, companySlugs } = await getSitemapEntries();
  return [
    ...staticRoutes.map((path) => ({ url: `${base}${path === "/" ? "" : path}` })),
    ...courseSlugs.map((course) => ({
      url: `${base}/formations/${course.slug}`,
      lastModified: course.updatedAt,
    })),
    ...jobSlugs.map((job) => ({ url: `${base}/offres/${job.slug}`, lastModified: job.updatedAt })),
    ...companySlugs.map((company) => ({
      url: `${base}/entreprises/${company.slug}`,
      lastModified: company.updatedAt,
    })),
  ];
}
