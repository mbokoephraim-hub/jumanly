/**
 * Career diagnostic, what touches the database: answers prefilled from the profile, the skills
 * most asked for in real offers, the draft saved at each answer, the diagnostic itself and the
 * « Refaire dans 30 jours » reminders.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { parseCv } from "./cv";
import { cvScore, targetSkillsFor } from "./cv-coach";
import { answersSchema, SKILLS_ASSESSED, type Draft } from "./diagnostic-scoring";
import { notify } from "./notifications";

const DAY = 86_400_000;
export const REMIND_AFTER_DAYS = 30;

/** Words of a job title worth searching for in offer titles. */
const titleWords = (role: string) =>
  role
    .split(/[\s,/·'-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4);

/**
 * The skills most asked for in the published offers whose title is close to the target job
 * (`scope: "role"`), or in all published offers when none is (`scope: "all"`). `offers` is the
 * real number of offers compared.
 */
export async function demandedSkills(db: PrismaClient, role: string) {
  const { counts, offers, scope } = await skillDemand(db, role);
  return { skills: counts.slice(0, SKILLS_ASSESSED).map(([name]) => name), offers, scope };
}

/**
 * Every skill asked for in those offers with the number of offers asking for it, most asked
 * first (« Faire le point » : « SQL : demandé par 7 offres sur 10 »).
 */
export async function skillDemand(db: PrismaClient, role: string) {
  const words = titleWords(role);
  const select = { skills: { select: { skill: { select: { name: true } } } } };
  let scope: "role" | "all" = "role";
  let jobs =
    words.length === 0
      ? []
      : await db.job.findMany({
          where: {
            status: "published",
            OR: words.map((word) => ({ title: { contains: word, mode: "insensitive" as const } })),
          },
          select,
          take: 200,
        });
  if (jobs.length === 0) {
    scope = "all";
    jobs = await db.job.findMany({
      where: { status: "published" },
      select,
      orderBy: { publishedAt: "desc" },
      take: 200,
    });
  }
  const counts = new Map<string, number>();
  for (const job of jobs)
    for (const { skill } of job.skills) counts.set(skill.name, (counts.get(skill.name) ?? 0) + 1);
  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"),
  );
  return { counts: sorted, offers: jobs.length, scope };
}

/** What the badge of the welcome screen shows: only what the talent declared. */
export async function diagnosticBadge(db: PrismaClient, userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      firstName: true,
      lastName: true,
      city: true,
      talentProfile: {
        select: { targetJob: true, headline: true, _count: { select: { skills: true } } },
      },
    },
  });
  const name = user?.name ?? "";
  const first = user?.firstName || name.split(/\s+/)[0] || "";
  const initials =
    [user?.firstName || name.split(/\s+/)[0], user?.lastName || name.split(/\s+/)[1]]
      .filter(Boolean)
      .map((part) => part!.charAt(0).toUpperCase())
      .join("") || "·";
  return {
    initials,
    firstName: first,
    targetJob: user?.talentProfile?.targetJob || user?.talentProfile?.headline || null,
    city: user?.city || null,
    skills: user?.talentProfile?._count.skills ?? 0,
  };
}

const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });

/**
 * Answers the profile already gives (« Utiliser mon profil et mon CV ») and the score of the
 * talent's CV on Jumanly. Nothing is guessed: what the profile does not say stays empty.
 */
export async function diagnosticPrefill(db: PrismaClient, userId: string) {
  const [profile, cv, targets] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId },
      select: {
        targetJob: true,
        sectors: true,
        languages: true,
        skills: {
          select: { level: true, skill: { select: { name: true } } },
          orderBy: { level: "desc" },
          take: 3,
        },
        educations: { select: { level: true } },
      },
    }),
    db.document.findFirst({
      where: { kind: "cv", profile: { userId } },
      orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      select: { content: true },
    }),
    targetSkillsFor(db, userId),
  ]);
  const languages = z
    .array(z.object({ code: z.string() }))
    .catch([])
    .parse(profile?.languages ?? []);
  const order = ["none", "secondary", "vocational", "bachelor", "master", "doctorate"] as const;
  const highest = (profile?.educations ?? [])
    .map((item) => order.indexOf(item.level as (typeof order)[number]))
    .filter((index) => index >= 0)
    .sort((a, b) => b - a)[0];
  const score = cv ? cvScore(parseCv(cv.content), targets.skills).total : null;
  const draft: Draft = {
    ...(profile?.targetJob ? { targetRole: profile.targetJob } : {}),
    ...(profile?.sectors.length ? { sectors: profile.sectors.join(", ") } : {}),
    ...(profile?.skills.length
      ? { topSkills: profile.skills.map((item) => item.skill.name).join(", ") }
      : {}),
    ...(languages.length
      ? {
          languages: languages
            .map((item) => {
              const name = languageNames.of(item.code) ?? item.code;
              return name.charAt(0).toUpperCase() + name.slice(1);
            })
            .join(", "),
        }
      : {}),
    ...(highest !== undefined ? { education: order[highest] } : {}),
    ...(score === null ? {} : { cvStatus: score >= 70 ? "a3" : "a2" }),
  };
  return { draft, cvScore: score };
}

const draftSchema = answersSchema.partial();

/** The draft in progress, if any (answers that no longer validate are dropped). */
export async function getDraft(db: PrismaClient, userId: string) {
  const draft = await db.careerDiagnosticDraft.findUnique({ where: { userId } });
  if (!draft) return null;
  const parsed = draftSchema.safeParse(draft.answers);
  return {
    answers: (parsed.success ? parsed.data : {}) as Draft,
    step: draft.step,
    updatedAt: draft.updatedAt,
  };
}

export async function saveDraft(db: PrismaClient, userId: string, answers: unknown, step: number) {
  const parsed = draftSchema.safeParse(answers);
  if (!parsed.success) return false;
  const data = {
    answers: parsed.data as Prisma.InputJsonValue,
    step: Math.max(0, Math.min(99, Math.trunc(step))),
  };
  await db.careerDiagnosticDraft.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  return true;
}

export async function discardDraft(db: PrismaClient, userId: string) {
  await db.careerDiagnosticDraft.deleteMany({ where: { userId } });
}

/** Saves a finished diagnostic, clears the draft and leaves a notification. */
export async function saveDiagnostic(
  db: PrismaClient,
  input: {
    userId: string;
    level: "simple" | "personalized";
    answers: unknown;
    result: unknown;
    stage: string;
  },
) {
  const diagnostic = await db.careerDiagnostic.create({
    data: {
      userId: input.userId,
      level: input.level,
      answers: input.answers as Prisma.InputJsonValue,
      result: input.result as Prisma.InputJsonValue,
    },
  });
  await discardDraft(db, input.userId);
  await notify(db, {
    userIds: [input.userId],
    type: "diagnosticReady",
    payload: { stage: input.stage },
    href: `/app/career/diagnostic?bilan=${diagnostic.id}`,
  });
  return diagnostic;
}

/** « Refaire dans 30 jours »: one reminder, 30 days after the diagnostic. */
export async function scheduleReminder(db: PrismaClient, userId: string, diagnosticId: string) {
  const diagnostic = await db.careerDiagnostic.findFirst({
    where: { id: diagnosticId, userId },
    select: { createdAt: true },
  });
  if (!diagnostic) return null;
  const remindAt = new Date(diagnostic.createdAt.getTime() + REMIND_AFTER_DAYS * DAY);
  await db.careerDiagnostic.update({
    where: { id: diagnosticId },
    data: { remindAt, remindedAt: null },
  });
  return remindAt;
}

/** Hourly job: the reminders that are due become notifications. */
export async function runDiagnosticReminders(
  db: PrismaClient,
  now = new Date(),
  /** Limits the run to these users (tests run with a moved clock on a shared database). */
  only?: string[],
) {
  const due = await db.careerDiagnostic.findMany({
    where: {
      remindAt: { lte: now },
      remindedAt: null,
      ...(only ? { userId: { in: only } } : {}),
    },
    select: { id: true, userId: true },
    take: 500,
  });
  for (const item of due) {
    await notify(db, {
      userIds: [item.userId],
      type: "diagnosticReminder",
      payload: {},
      href: "/app/career/diagnostic",
    });
    await db.careerDiagnostic.update({ where: { id: item.id }, data: { remindedAt: now } });
  }
  return due.length;
}
