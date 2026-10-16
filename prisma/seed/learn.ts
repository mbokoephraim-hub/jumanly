/**
 * Learn v2, étape 1 (local and previews only): files the demo courses in the domain of their theme,
 * as the migration `learn_domains` does for the courses that existed before it, and marks one
 * fictional course as « Expert Series » so that the editorial filter has something to show.
 */
import { domainOfTheme } from "../../src/server/services/learn-domains";
import type { SeedClient } from "./client";

export async function seedLearnDomains(db: SeedClient) {
  const domains = await db.learningDomain.findMany({ select: { id: true, slug: true } });
  const idOf = new Map(domains.map((domain) => [domain.slug, domain.id]));
  const courses = await db.course.findMany({
    where: { domainId: null },
    select: { id: true, category: true },
  });
  for (const course of courses) {
    const domainId = idOf.get(domainOfTheme[course.category.toLowerCase()] ?? "");
    if (domainId) await db.course.update({ where: { id: course.id }, data: { domainId } });
  }
  await db.course.updateMany({
    where: { slug: "ux-excel-tableaux-de-bord" },
    data: { editorialLine: "expert_series" },
  });
  console.log("✓ Learn : formations de démonstration rangées dans leurs domaines");
}

/**
 * Learn v2, étape 2 (local and previews only): one fictional published path of four Career courses,
 * from free ones to advanced ones, so that locked steps show for a Free learner.
 */
export async function seedLearnPaths(db: SeedClient) {
  const slugs = [
    "demo-reussir-son-cv",
    "demo-preparer-un-entretien",
    "demo-prise-de-parole",
    "demo-negocier-son-salaire",
  ];
  const courses = await db.course.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  if (courses.length !== slugs.length) return;
  const domain = await db.learningDomain.findUnique({
    where: { slug: "career-employability" },
    select: { id: true },
  });
  const path = await db.learningPath.upsert({
    where: { slug: "demo-premier-emploi" },
    update: {},
    create: {
      slug: "demo-premier-emploi",
      title: "Décrocher son premier emploi (démo)",
      summary:
        "Parcours fictif de démonstration : un CV clair, un entretien préparé, une prise de parole assurée et une négociation sereine.",
      domainId: domain?.id ?? null,
      status: "published",
      publishedAt: new Date(),
    },
  });
  for (const [order, slug] of slugs.entries()) {
    const courseId = courses.find((course) => course.slug === slug)!.id;
    await db.learningPathCourse.upsert({
      where: { pathId_courseId: { pathId: path.id, courseId } },
      update: { order },
      create: { pathId: path.id, courseId, order },
    });
  }
  console.log("✓ Learn : parcours de démonstration");
}
