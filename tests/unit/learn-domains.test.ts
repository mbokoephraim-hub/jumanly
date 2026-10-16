import { describe, expect, it } from "vitest";
import { courseWhere, parseCourseFilters } from "@/server/services/courses";
import { asDomainIcon, domainFormSchema, slugify } from "@/server/services/learn-domains";

describe("catalog filters (Learn v2, étape 1)", () => {
  it("reads the new filters and ignores invalid values", () => {
    const filters = parseCourseFilters({
      domaine: "career-employability",
      duree: "court",
      langue: "fr",
      competence: "excel",
      ligne: "expert_series",
    });
    expect(filters).toEqual({
      domaine: "career-employability",
      duree: "court",
      langue: "fr",
      competence: "excel",
      ligne: "expert_series",
    });
    expect(parseCourseFilters({ domaine: "<script>", duree: "1h", ligne: "x" })).toEqual({});
  });

  it("builds the query of each filter, on published courses only", () => {
    const where = courseWhere({
      domaine: "design-creative",
      duree: "moyen",
      langue: "en",
      competence: "canva",
      ligne: "partner_programs",
    });
    expect(where).toMatchObject({
      status: "published",
      domain: { slug: "design-creative" },
      durationMinutes: { gte: 120, lte: 600 },
      language: "en",
      skills: { some: { skill: { slug: "canva" } } },
      editorialLine: "partner_programs",
    });
    expect(courseWhere({ duree: "court" }).durationMinutes).toEqual({ lt: 120 });
    expect(courseWhere({ duree: "long" }).durationMinutes).toEqual({ gt: 600 });
  });
});

describe("domains", () => {
  it("makes an address from a name", () => {
    expect(slugify("Skills Monetisation & Freelancing")).toBe("skills-monetisation-freelancing");
    expect(slugify("Écrire, présenter")).toBe("ecrire-presenter");
    expect(slugify("***")).toBe("domaine");
  });

  it("only accepts brand icons and sensible values", () => {
    expect(asDomainIcon("career")).toBe("career");
    expect(asDomainIcon("unknown")).toBe("learn");
    expect(
      domainFormSchema.safeParse({ name: "A", description: "", icon: "career", order: "1" })
        .success,
    ).toBe(false);
    expect(
      domainFormSchema.safeParse({ name: "Data", description: "", icon: "virus", order: "1" })
        .success,
    ).toBe(false);
    expect(
      domainFormSchema.safeParse({ name: "Data", description: "", icon: "grid", order: "2" }).data,
    ).toEqual({ name: "Data", description: "", icon: "grid", order: 2 });
  });
});
