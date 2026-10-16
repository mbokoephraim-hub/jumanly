import { describe, expect, it } from "vitest";
import { finishedModule } from "@/server/services/learn";

type Course = Parameters<typeof finishedModule>[0];
const course = {
  modules: [
    { id: "m1", order: 1, lessons: [{ id: "a" }, { id: "b" }, { id: "x", jobSpecific: true }] },
    { id: "m2", order: 2, lessons: [{ id: "c" }] },
  ],
} as unknown as Course;

describe("finishedModule", () => {
  it("returns the module once its required lessons are done (job exercises are optional)", () => {
    expect(finishedModule(course, ["a", "b"], "b")?.id).toBe("m1");
  });
  it("returns null while a lesson of the module remains", () => {
    expect(finishedModule(course, ["b"], "b")).toBeNull();
    expect(finishedModule(course, ["a", "b"], "unknown")).toBeNull();
  });
});
