/**
 * Test of the platform with the waitlist (30/10/2026). The admin picks people on the list and sends
 * them the hidden sign-up link with a test period; when it ends, the hourly job sends them a
 * questionnaire (experience, ratings, comments, improvements) whose answers are read in the admin.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { PrismaClient, WaitlistProfile } from "@/generated/prisma/client";
import { waitlistProfiles } from "./waitlist-profiles";
import { testAreas, testDevices, testRatings, type TestRating } from "./waitlist-test-options";

export { testAreas, testDevices, testRatings, type TestRating };

export const testDurations = [7, 14, 21, 30] as const;
export const defaultTestDays = 14;
const DAY = 24 * 60 * 60 * 1000;

/** `profil` of the sign-up link (src/lib/signup.ts) for each waitlist profile. */
export const signupProfileOf: Record<WaitlistProfile, "talent" | "rh" | "company" | "partner"> = {
  talent: "talent",
  recruiter: "rh",
  company: "company",
  partner: "partner",
};

export function newSurveyToken() {
  return randomBytes(24).toString("base64url");
}

/** Where a person stands in the test, for the admin list and its filter. */
export type TestStatus = "waiting" | "invited" | "surveyed" | "answered";
export const testStatuses = ["waiting", "invited", "surveyed", "answered"] as const;

export function testStatusOf(entry: {
  invitedAt: Date | null;
  surveySentAt: Date | null;
  feedback?: { id: string } | null;
}): TestStatus {
  if (entry.feedback) return "answered";
  if (entry.surveySentAt) return "surveyed";
  if (entry.invitedAt) return "invited";
  return "waiting";
}

export function testStatusWhere(status: TestStatus) {
  switch (status) {
    case "waiting":
      return { invitedAt: null };
    case "invited":
      return { invitedAt: { not: null }, surveySentAt: null, feedback: null };
    case "surveyed":
      return { surveySentAt: { not: null }, feedback: null };
    case "answered":
      return { feedback: { isNot: null } };
  }
}

/**
 * Marks the chosen people as invited for `days` days and returns them, with their questionnaire
 * token, so the e-mails can leave. Inviting again restarts the period and keeps the token.
 */
export async function inviteTesters(
  db: PrismaClient,
  ids: string[],
  days: number,
  now = new Date(),
) {
  const entries = await db.waitlistEntry.findMany({ where: { id: { in: ids } } });
  const testEndsAt = new Date(now.getTime() + days * DAY);
  const invited = [];
  for (const entry of entries) {
    const surveyToken = entry.surveyToken ?? newSurveyToken();
    invited.push(
      await db.waitlistEntry.update({
        where: { id: entry.id },
        data: { invitedAt: now, inviteCount: { increment: 1 }, testEndsAt, surveyToken },
      }),
    );
  }
  return invited;
}

/** People whose test period is over and who have not received the questionnaire yet. */
export function dueSurveys(db: PrismaClient, now = new Date(), take = 100) {
  return db.waitlistEntry.findMany({
    where: {
      testEndsAt: { lte: now },
      surveySentAt: null,
      surveyToken: { not: null },
      feedback: null,
    },
    orderBy: { testEndsAt: "asc" },
    take,
  });
}

/** Weekly sign-ups over the last `weeks` weeks (Monday first, UTC), oldest first. */
export function weeklyCounts(dates: Date[], now: Date, weeks = 12) {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const starts = Array.from(
    { length: weeks },
    (_, index) => new Date(monday.getTime() - (weeks - 1 - index) * 7 * DAY),
  );
  const counts = starts.map(() => 0);
  for (const date of dates) {
    const index = Math.floor((date.getTime() - starts[0]!.getTime()) / (7 * DAY));
    if (index >= 0 && index < weeks) counts[index]! += 1;
  }
  return starts.map((start, index) => ({ start, count: counts[index]! }));
}

/** Figures of the « Statistiques » tab. */
export async function waitlistStats(db: PrismaClient, now = new Date()) {
  const since = new Date(now.getTime() - 12 * 7 * DAY);
  const [total, profiles, countries, recent, invited, surveyed, answered, accounts] =
    await Promise.all([
      db.waitlistEntry.count(),
      db.waitlistEntry.groupBy({ by: ["profile"], _count: { _all: true } }),
      db.waitlistEntry.groupBy({
        by: ["country"],
        _count: { _all: true },
        orderBy: { _count: { country: "desc" } },
        take: 8,
      }),
      db.waitlistEntry.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      db.waitlistEntry.count({ where: { invitedAt: { not: null } } }),
      db.waitlistEntry.count({ where: { surveySentAt: { not: null } } }),
      db.testFeedback.count(),
      db.$queryRaw<{ count: bigint }[]>`
        SELECT count(*)::bigint AS count FROM "WaitlistEntry" w
        JOIN "User" u ON lower(u.email) = w.email`,
    ]);
  const dates = recent.map((row) => row.createdAt);
  const week = 7 * DAY;
  const last7 = dates.filter((date) => now.getTime() - date.getTime() < week).length;
  const previous7 = dates.filter((date) => {
    const age = now.getTime() - date.getTime();
    return age >= week && age < 2 * week;
  }).length;
  const byProfile = Object.fromEntries(waitlistProfiles.map((profile) => [profile, 0])) as Record<
    WaitlistProfile,
    number
  >;
  for (const group of profiles) byProfile[group.profile] = group._count._all;
  return {
    total,
    last7,
    previous7,
    weekly: weeklyCounts(dates, now),
    byProfile,
    countries: countries.map((group) => ({ country: group.country, count: group._count._all })),
    funnel: { total, invited, accounts: Number(accounts[0]?.count ?? 0), surveyed, answered },
  };
}

// ─── Questionnaire ──────────────────────────────────────────────

const rating = z.coerce.number({ error: "rating" }).int("rating").min(1, "rating").max(5, "rating");
const longText = z.string().trim().max(2000, "tooLong");
const optionalText = longText.optional().transform((value) => value || undefined);

export const testSurveySchema = z.object({
  overall: rating,
  ease: rating,
  design: rating,
  usefulness: rating,
  speed: rating,
  recommend: z.coerce.number({ error: "rating" }).int("rating").min(0, "rating").max(10, "rating"),
  areas: z.array(z.enum(testAreas)).default([]),
  device: z.enum(testDevices, { error: "required" }),
  liked: optionalText,
  problems: optionalText,
  improvements: longText.min(1, "required"),
  comments: optionalText,
});

export type TestSurveyInput = z.infer<typeof testSurveySchema>;
export type TestSurveyError = "rating" | "required" | "tooLong";

/** Reads the form: `areas` may repeat. Empty radio groups stay undefined. */
export function testSurveyValues(formData: FormData) {
  const values: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (key === "areas") values.areas = [...((values.areas as string[]) ?? []), value];
    else values[key] = value;
  }
  return values;
}

export function testSurveyErrors(error: z.ZodError): Record<string, TestSurveyError> {
  const result: Record<string, TestSurveyError> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    const message = issue.message as TestSurveyError;
    if (!result[field])
      result[field] = ["rating", "required", "tooLong"].includes(message) ? message : "required";
  }
  return result;
}

/** The invited person behind a questionnaire link, or null for an unknown link. */
export function surveyEntry(db: PrismaClient, token: string) {
  if (!/^[\w-]{20,64}$/.test(token)) return Promise.resolve(null);
  return db.waitlistEntry.findUnique({
    where: { surveyToken: token },
    select: { id: true, firstName: true, profile: true, feedback: { select: { id: true } } },
  });
}

/** Saves the answers once; `already` when this link has been answered before. */
export async function saveTestFeedback(
  db: PrismaClient,
  token: string,
  input: TestSurveyInput,
  locale: string,
): Promise<"saved" | "already" | "unknown"> {
  const entry = await surveyEntry(db, token);
  if (!entry) return "unknown";
  if (entry.feedback) return "already";
  await db.testFeedback.create({
    data: {
      entryId: entry.id,
      ...input,
      liked: input.liked ?? null,
      problems: input.problems ?? null,
      comments: input.comments ?? null,
      locale,
    },
  });
  // Answering early also counts as having received the questionnaire.
  await db.waitlistEntry.updateMany({
    where: { id: entry.id, surveySentAt: null },
    data: { surveySentAt: new Date() },
  });
  return "saved";
}

/** Averages and counts of the « Questionnaires » tab. */
export async function testFeedbackSummary(db: PrismaClient) {
  const answers = await db.testFeedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      entry: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profile: true,
          country: true,
        },
      },
    },
  });
  const count = answers.length;
  const average = (key: TestRating) =>
    count === 0 ? null : answers.reduce((sum, answer) => sum + answer[key], 0) / count;
  const averages = Object.fromEntries(testRatings.map((key) => [key, average(key)])) as Record<
    TestRating,
    number | null
  >;
  // Net Promoter Score: promoters (9-10) minus detractors (0-6), in points.
  const promoters = answers.filter((answer) => answer.recommend >= 9).length;
  const detractors = answers.filter((answer) => answer.recommend <= 6).length;
  const nps = count === 0 ? null : Math.round(((promoters - detractors) / count) * 100);
  const areas = testAreas
    .map((area) => ({
      area,
      count: answers.filter((answer) => answer.areas.includes(area)).length,
    }))
    .sort((a, b) => b.count - a.count);
  const devices = testDevices.map((device) => ({
    device,
    count: answers.filter((answer) => answer.device === device).length,
  }));
  return { count, averages, nps, areas, devices, answers };
}
