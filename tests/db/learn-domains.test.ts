import { afterAll, describe, expect, it } from "vitest";
import { createCourse, updateCourse } from "@/server/services/course-admin";
import { searchCourses } from "@/server/services/courses";
import { createDomain, deleteDomain, listDomains } from "@/server/services/learn-domains";
import { db } from "./helpers";

const courses: string[] = [];
const domains: string[] = [];

afterAll(async () => {
  await db.course.deleteMany({ where: { id: { in: courses } } });
  await db.learningDomain.deleteMany({ where: { id: { in: domains } } });
  await db.$disconnect();
});

const fields = {
  slug: "",
  summary: "Résumé test",
  description: "Description test",
  objectives: "Objectif test",
  audience: "Public test",
  category: "Test",
  level: "beginner" as const,
  language: "fr",
  durationMinutes: 90,
  instructor: "",
  prerequisites: "",
  requiredLevel: "free" as const,
  coverUrl: "",
  skills: "",
  jobFamilies: "",
};

describe("learning domains (Learn v2, étape 1)", () => {
  it("has the 7 starting domains, in order", async () => {
    const slugs = (await listDomains(db)).map((domain) => domain.slug);
    expect(slugs.slice(0, 7)).toEqual([
      "career-employability",
      "digital-productivity",
      "design-creative",
      "business-management",
      "professional-communication",
      "ai-digital-tools",
      "skills-monetisation-freelancing",
    ]);
  });

  it("files a course in a domain, filters the catalog, and keeps the course when the domain goes", async () => {
    const domain = await createDomain(db, {
      name: `Domaine test ${Math.random().toString(36).slice(2, 7)}`,
      description: "",
      icon: "grid",
      order: 900,
    });
    domains.push(domain.id);
    const course = (await createCourse(db, "Formation domaine test"))!;
    courses.push(course.id);
    await updateCourse(db, course.id, {
      ...fields,
      title: course.title,
      domainId: domain.id,
      editorialLine: "expert_series",
    });
    await db.course.update({ where: { id: course.id }, data: { status: "published" } });

    const found = await searchCourses(db, { domaine: domain.slug });
    expect(found.courses.map((item) => item.slug)).toEqual([course.slug]);
    expect(found.courses[0]).toMatchObject({
      domain: { slug: domain.slug },
      editorialLine: "expert_series",
    });
    expect((await searchCourses(db, { domaine: domain.slug, ligne: "originals" })).total).toBe(0);
    expect((await listDomains(db)).find((item) => item.id === domain.id)?.courseCount).toBe(1);

    await deleteDomain(db, domain.id);
    const after = await db.course.findUniqueOrThrow({ where: { id: course.id } });
    expect(after.domainId).toBeNull();
    expect(after.status).toBe("published");
  });

  it("ignores an unknown domain sent by the form", async () => {
    const course = (await createCourse(db, "Formation domaine inconnu"))!;
    courses.push(course.id);
    await updateCourse(db, course.id, {
      ...fields,
      title: course.title,
      domainId: "domaine-qui-n-existe-pas",
      editorialLine: "originals",
    });
    expect((await db.course.findUniqueOrThrow({ where: { id: course.id } })).domainId).toBeNull();
  });
});
