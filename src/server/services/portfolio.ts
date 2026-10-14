/**
 * Portfolio (E10, `career.portfolio.level`: none, standard, enriched). Projects are documents
 * `portfolio_item`; the public page `/portfolio/[slug]` exists only while the talent publishes it
 * and keeps the entitlement. The enriched level adds the grid layout and an accent colour.
 * Media are links (no file storage yet): images, videos or documents hosted elsewhere.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { level, type Subject } from "@/server/entitlements";
import { ensureProfile } from "./profile";

export const PORTFOLIO_KEY = "career.portfolio.level";
export const MAX_PROJECTS = 30;
export const portfolioLayouts = ["classic", "grid"] as const;
/** Accent colours of the enriched level (brand palette, readable with white text). */
export const portfolioAccents = { sapin: "#0E3B33", feuille: "#1F7A4D", ardoise: "#37474F" };
export type PortfolioAccent = keyof typeof portfolioAccents;

export type PortfolioLevel = "none" | "standard" | "enriched";

export async function portfolioLevel(db: PrismaClient, userId: string): Promise<PortfolioLevel> {
  const subject: Subject = { type: "user", id: userId };
  const value = await level(db, subject, PORTFOLIO_KEY);
  return value === "standard" || value === "enriched" ? value : "none";
}

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  });

const projectContent = z.object({
  context: z.string(),
  role: z.string(),
  result: z.string(),
  skills: z.array(z.string()),
  link: z.string().nullable(),
  media: z.array(z.string()),
  /** "2025-06" */
  date: z.string().nullable(),
});
export type PortfolioProject = z.infer<typeof projectContent> & { id: string; title: string };

const optionalUrl = z.union([httpsUrl, z.literal("")]).transform((value) => value || null);

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  context: z.string().trim().max(1500).default(""),
  role: z.string().trim().max(800).default(""),
  result: z.string().trim().max(1500).default(""),
  skills: z
    .string()
    .max(500)
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 12),
    ),
  link: optionalUrl.default(""),
  media: z
    .string()
    .max(2000)
    .default("")
    .transform((value) =>
      value
        .split(/\s+/)
        .map((url) => url.trim())
        .filter(Boolean),
    )
    .pipe(z.array(httpsUrl).max(3)),
  date: z
    .union([z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), z.literal("")])
    .default("")
    .transform((value) => value || null),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export function parseProject(document: {
  id: string;
  title: string;
  content: Prisma.JsonValue;
}): PortfolioProject | null {
  const parsed = projectContent.safeParse(document.content);
  return parsed.success ? { ...parsed.data, id: document.id, title: document.title } : null;
}

const toContent = (input: ProjectInput) =>
  ({
    context: input.context,
    role: input.role,
    result: input.result,
    skills: input.skills,
    link: input.link,
    media: input.media,
    date: input.date,
  }) satisfies z.infer<typeof projectContent> as unknown as Prisma.InputJsonValue;

export async function listProjects(db: PrismaClient, profileId: string) {
  const documents = await db.document.findMany({
    where: { profileId, kind: "portfolio_item" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true },
  });
  return documents.flatMap((document) => parseProject(document) ?? []);
}

export class PortfolioError extends Error {
  constructor(readonly code: "entitlement" | "limit" | "notFound") {
    super(`Portfolio ${code}`);
  }
}

async function editable(db: PrismaClient, userId: string) {
  if ((await portfolioLevel(db, userId)) === "none") throw new PortfolioError("entitlement");
  return ensureProfile(db, userId);
}

export async function saveProject(
  db: PrismaClient,
  userId: string,
  input: ProjectInput,
  projectId?: string,
) {
  const profile = await editable(db, userId);
  if (projectId) {
    const updated = await db.document.updateMany({
      where: { id: projectId, profileId: profile.id, kind: "portfolio_item" },
      data: { title: input.title, content: toContent(input) },
    });
    if (updated.count === 0) throw new PortfolioError("notFound");
    return projectId;
  }
  const count = await db.document.count({
    where: { profileId: profile.id, kind: "portfolio_item" },
  });
  if (count >= MAX_PROJECTS) throw new PortfolioError("limit");
  const document = await db.document.create({
    data: {
      profileId: profile.id,
      kind: "portfolio_item",
      title: input.title,
      content: toContent(input),
    },
  });
  return document.id;
}

export async function deleteProject(db: PrismaClient, userId: string, projectId: string) {
  const profile = await ensureProfile(db, userId);
  await db.document.deleteMany({
    where: { id: projectId, profileId: profile.id, kind: "portfolio_item" },
  });
}

export const settingsSchema = z.object({
  intro: z.string().trim().max(1500).default(""),
  layout: z.enum(portfolioLayouts).default("classic"),
  accent: z
    .enum(Object.keys(portfolioAccents) as [PortfolioAccent, ...PortfolioAccent[]])
    .optional(),
  public: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** The address of the public page: the first name, then a random part (not guessable). */
export function newSlug(firstName: string | null) {
  return [slugify(firstName ?? ""), randomBytes(4).toString("hex")].filter(Boolean).join("-");
}

export async function savePortfolioSettings(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof settingsSchema>,
) {
  const level = await portfolioLevel(db, userId);
  if (level === "none") throw new PortfolioError("entitlement");
  const profile = await ensureProfile(db, userId);
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true },
  });
  return db.talentProfile.update({
    where: { id: profile.id },
    data: {
      portfolioIntro: input.intro || null,
      // The standard level keeps the classic layout and the default colour.
      portfolioLayout: level === "enriched" ? input.layout : "classic",
      portfolioAccent: level === "enriched" ? (input.accent ?? null) : null,
      portfolioPublic: input.public,
      portfolioSlug: profile.portfolioSlug ?? newSlug(user.firstName),
    },
  });
}

/**
 * The public portfolio: only when published and while the entitlement lasts. Shows the first
 * name, last name, headline and the projects, nothing else of the profile.
 */
export async function publicPortfolio(db: PrismaClient, slug: string) {
  const profile = await db.talentProfile.findUnique({
    where: { portfolioSlug: slug },
    select: {
      id: true,
      userId: true,
      headline: true,
      portfolioPublic: true,
      portfolioIntro: true,
      portfolioLayout: true,
      portfolioAccent: true,
      user: { select: { firstName: true, lastName: true, status: true } },
    },
  });
  if (!profile?.portfolioPublic || profile.user.status !== "active") return null;
  const tier = await portfolioLevel(db, profile.userId);
  if (tier === "none") return null;
  const enriched = tier === "enriched";
  return {
    name: [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" "),
    headline: profile.headline,
    intro: profile.portfolioIntro,
    layout: enriched ? profile.portfolioLayout : "classic",
    accent:
      (enriched && portfolioAccents[profile.portfolioAccent as PortfolioAccent]) ||
      portfolioAccents.sapin,
    projects: await listProjects(db, profile.id),
  };
}
