import { describe, expect, it } from "vitest";
import { median, scoreAttempt, scoreBuckets } from "@/lib/skill-test-score";

const q = [
  { id: "a", kind: "choice", answer: 1, points: 1 },
  { id: "b", kind: "choice", answer: 0, points: 1 },
  { id: "c", kind: "short", answer: null, points: 2 },
];

describe("skills test score", () => {
  it("corrects choices and waits for the team on written answers", () => {
    const r = scoreAttempt(q, { a: 1, b: 2, c: "Une réponse" }, {});
    expect(r.score).toBeNull();
    expect(r.toGrade).toBe(1);
  });
  it("gives a score out of 100 once graded", () => {
    expect(scoreAttempt(q, { a: 1, b: 2, c: "Une réponse" }, { c: 2 }).score).toBe(75);
  });
  it("counts an empty written answer as 0 without waiting", () => {
    expect(scoreAttempt(q, { a: 1, b: 0 }, {}).score).toBe(50);
  });
  it("buckets and median", () => {
    expect(scoreBuckets([0, 19, 20, 99, 100])).toEqual([2, 1, 0, 0, 2]);
    expect(median([10, 30, 20])).toBe(20);
    expect(median([])).toBeNull();
  });
});
