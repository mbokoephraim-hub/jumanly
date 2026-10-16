import { describe, expect, it } from "vitest";
import { pathFormSchema, pathProgress, pathPublishProblems } from "@/server/services/learn-paths";

describe("learning paths (Learn v2, étape 2)", () => {
  it("counts finished courses and points to the first one not finished", () => {
    const progress = pathProgress([
      { slug: "a", state: "done" as const },
      { slug: "b", state: "active" as const },
      { slug: "c", state: "locked" as const },
    ]);
    expect(progress).toMatchObject({ done: 1, total: 3, percent: 33, finished: false });
    expect(progress.next?.slug).toBe("b");
    expect(pathProgress([{ state: "done" as const }])).toMatchObject({
      percent: 100,
      next: null,
      finished: true,
    });
    expect(pathProgress([])).toMatchObject({ percent: 0, next: null, finished: false });
  });

  it("needs a summary and two published courses before publishing", () => {
    const course = (status: string) => ({ order: 0, course: { status } }) as never;
    expect(pathPublishProblems({ summary: "", courses: [course("published")] })).toEqual([
      "summary",
      "courses",
    ]);
    expect(
      pathPublishProblems({ summary: "Ok", courses: [course("published"), course("draft")] }),
    ).toEqual(["courses"]);
    expect(
      pathPublishProblems({ summary: "Ok", courses: [course("published"), course("published")] }),
    ).toEqual([]);
  });

  it("validates the path form", () => {
    expect(pathFormSchema.safeParse({ title: "ab", summary: "" }).success).toBe(false);
    const parsed = pathFormSchema.parse({ title: " Mon parcours ", summary: "" });
    expect(parsed).toEqual({
      title: "Mon parcours",
      summary: "",
      domainId: "",
      editorialLine: "originals",
    });
  });
});
