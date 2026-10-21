/**
 * Portfolio (E10, `career.portfolio.level`: none, standard, enriched). Projects are documents
 * `portfolio_item`; the public page `/portfolio/[slug]` exists only while the talent publishes it
 * and keeps the entitlement. The enriched level adds the grid layout and an accent colour.
 * Since the redesign (lot 6, « Projets » of Mon profil) a project carries up to 6 photos or PDF
 * kept in the private storage, one text « ce que vous avez fait », and a switch « Visible par les
 * recruteurs »; older projects keep their links and their three texts.
 */
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { level, type Subject } from "@/server/entitlements";
import { sniffDocumentType, type FileStorage } from "@/server/storage";
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

/** A photo or a PDF of a project, in the private storage (`projects/…`). */
const projectFile = z.object({
  key: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
});
export type ProjectFile = z.infer<typeof projectFile>;

export const PROJECT_FILES_MAX = 6;
/** All the files of one save: under the 4.2 MB of a request (next.config.ts). */
export const PROJECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

const projectContent = z.object({
  context: z.string(),
  role: z.string().default(""),
  result: z.string().default(""),
  skills: z.array(z.string()),
  link: z.string().nullable().default(null),
  media: z.array(z.string()).default([]),
  /** "2025-06" */
  date: z.string().nullable().default(null),
  /** Shown to recruiters and on the public page; older projects were all visible. */
  visible: z.boolean().default(true),
  files: z.array(projectFile).default([]),
});
export type PortfolioProject = z.infer<typeof projectContent> & { id: string; title: string };

/** « Nouveau projet » (planche talent-4): title, what was done, skills, visibility. */
export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  context: z.string().trim().max(3000).default(""),
  skills: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  visible: z.boolean().default(false),
  /** « Lien (facultatif) » (Modèle B): left out, an older project keeps its link. */
  link: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
  /** Keys of the files kept; the others are removed. */
  keep: z.array(z.string().max(200)).max(PROJECT_FILES_MAX).default([]),
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

const toContent = (content: z.infer<typeof projectContent>) =>
  content as unknown as Prisma.InputJsonValue;

export async function listProjects(db: PrismaClient, profileId: string) {
  const documents = await db.document.findMany({
    where: { profileId, kind: "portfolio_item" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true },
  });
  return documents.flatMap((document) => parseProject(document) ?? []);
}

export class PortfolioError extends Error {
  constructor(readonly code: "entitlement" | "limit" | "notFound" | "file") {
    super(`Portfolio ${code}`);
  }
}

async function editable(db: PrismaClient, userId: string) {
  if ((await portfolioLevel(db, userId)) === "none") throw new PortfolioError("entitlement");
  return ensureProfile(db, userId);
}

export type NewProjectFile = { name: string; bytes: Uint8Array };

/**
 * Creates or updates a project. An older project keeps its links and date; its three texts are
 * merged into the one text of the form (the form shows them together), so nothing is lost.
 */
export async function saveProject(
  db: PrismaClient,
  storage: FileStorage,
  userId: string,
  input: ProjectInput,
  added: NewProjectFile[],
  projectId?: string,
) {
  const profile = await editable(db, userId);
  const before = projectId
    ? await db.document.findFirst({
        where: { id: projectId, profileId: profile.id, kind: "portfolio_item" },
        select: { id: true, title: true, content: true },
      })
    : null;
  if (projectId && !before) throw new PortfolioError("notFound");
  if (!projectId) {
    const count = await db.document.count({
      where: { profileId: profile.id, kind: "portfolio_item" },
    });
    if (count >= MAX_PROJECTS) throw new PortfolioError("limit");
  }
  const previous = before ? parseProject(before) : null;
  const kept = (previous?.files ?? []).filter((file) => input.keep.includes(file.key));
  if (kept.length + added.length > PROJECT_FILES_MAX) throw new PortfolioError("file");
  const total = added.reduce((sum, file) => sum + file.bytes.byteLength, 0);
  if (total > PROJECT_UPLOAD_MAX_BYTES) throw new PortfolioError("file");
  const typed = added.map((file) => {
    const type = sniffDocumentType(file.bytes);
    if (!type || file.bytes.byteLength === 0) throw new PortfolioError("file");
    return { ...file, type };
  });
  const files = [...kept];
  for (const file of typed) {
    const key = `projects/${userId}/${randomUUID()}`;
    await storage.put(key, { contentType: file.type, bytes: file.bytes });
    files.push({
      key,
      name: file.name.slice(0, 160),
      type: file.type,
      size: file.bytes.byteLength,
    });
  }
  for (const file of previous?.files ?? []) {
    if (!kept.some((keep) => keep.key === file.key)) await storage.remove(file.key);
  }
  const content = toContent({
    context: input.context,
    role: "",
    result: "",
    skills: input.skills,
    link: input.link === undefined ? (previous?.link ?? null) : input.link || null,
    media: previous?.media ?? [],
    date: previous?.date ?? null,
    visible: input.visible,
    files,
  });
  if (before) {
    await db.document.update({
      where: { id: before.id },
      data: { title: input.title, content },
    });
    return before.id;
  }
  const document = await db.document.create({
    data: { profileId: profile.id, kind: "portfolio_item", title: input.title, content },
  });
  return document.id;
}

/** The text of the form: an older project shows its context, role and result together. */
export function projectText(project: PortfolioProject) {
  return [project.context, project.role, project.result].filter(Boolean).join("\n\n");
}

/**
 * A file of a project, for its owner, or for anyone once the project is visible and the
 * portfolio is public (the same rule as the public page).
 */
export async function projectFileFor(
  db: PrismaClient,
  storage: FileStorage,
  viewerId: string | null,
  projectId: string,
  index: number,
) {
  const document = await db.document.findFirst({
    where: { id: projectId, kind: "portfolio_item" },
    select: {
      id: true,
      title: true,
      content: true,
      profile: { select: { userId: true, portfolioPublic: true } },
    },
  });
  const project = document ? parseProject(document) : null;
  const file = project?.files[index];
  if (!document || !project || !file) return null;
  const owner = document.profile.userId === viewerId;
  if (!owner) {
    if (!project.visible || !document.profile.portfolioPublic) return null;
    if ((await portfolioLevel(db, document.profile.userId)) === "none") return null;
  }
  const object = await storage.get(file.key);
  return object ? { ...object, name: file.name } : null;
}

export async function deleteProject(
  db: PrismaClient,
  storage: FileStorage,
  userId: string,
  projectId: string,
) {
  const profile = await ensureProfile(db, userId);
  const document = await db.document.findFirst({
    where: { id: projectId, profileId: profile.id, kind: "portfolio_item" },
    select: { id: true, title: true, content: true },
  });
  if (!document) return;
  for (const file of parseProject(document)?.files ?? []) await storage.remove(file.key);
  await db.document.delete({ where: { id: document.id } });
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
    projects: (await listProjects(db, profile.id)).filter((project) => project.visible),
  };
}
