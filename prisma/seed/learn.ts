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
