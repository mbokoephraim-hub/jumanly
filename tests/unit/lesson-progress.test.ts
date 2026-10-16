import { describe, expect, it } from "vitest";
import { lessonPositionSchema, resumeAt } from "@/server/services/lesson-progress";

describe("lesson video resume (Learn v2, étape 3)", () => {
  it("resumes where the learner stopped, but not in the first seconds nor at the very end", () => {
    expect(resumeAt(3, 600)).toBe(0);
    expect(resumeAt(192, 600)).toBe(192);
    expect(resumeAt(595, 600)).toBe(0);
    expect(resumeAt(120)).toBe(120);
  });

  it("keeps whole seconds and refuses invalid positions", () => {
    expect(lessonPositionSchema.parse({ lessonId: "abc", position: 32.7, duration: 60.2 })).toEqual(
      { lessonId: "abc", position: 32, duration: 60 },
    );
    expect(lessonPositionSchema.safeParse({ lessonId: "abc", position: -1 }).success).toBe(false);
    expect(lessonPositionSchema.safeParse({ lessonId: "abc", position: 1e9 }).success).toBe(false);
    expect(lessonPositionSchema.safeParse({ lessonId: "", position: 1 }).success).toBe(false);
  });
});
