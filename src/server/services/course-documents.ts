/**
 * PDF documents of a course (Admin v3, étape 5): supports, exercise sheets, readings, templates,
 * answer keys. Sent from the editor, kept in the private file storage, downloaded through
 * `/formations/documents/[id]`, which asks `documentAccess` first.
 */
import { randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import type {
  CourseDocumentKind,
  CourseDocumentVisibility,
  PrismaClient,
} from "@/generated/prisma/client";
import { ADMIN_SHELL_ROLES } from "@/server/auth/roles";
import { can, type Subject } from "@/server/entitlements";
import { sniffDocumentType, type FileStorage } from "@/server/storage";
import { catalogLevelOf, opensCourse } from "./learn";

/** A request to the site stops at 4.2 MB (`serverActions.bodySizeLimit`): files stay under 4 MB. */
export const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;
export const SPECIALIZED_KEY = "learn.resources.specialized";

export const documentKinds = [
  "support",
  "exercises",
  "reading",
  "template",
  "answer_key",
  "other",
] as const satisfies readonly CourseDocumentKind[];
export const documentVisibilities = [
  "public",
  "enrolled",
  "team",
] as const satisfies readonly CourseDocumentVisibility[];

export class CourseDocumentError extends Error {
  constructor(readonly code: "fileType" | "fileSize" | "unreadable" | "encrypted" | "notFound") {
    super(code);
    this.name = "CourseDocumentError";
  }
}

const text = (max: number) => z.string().trim().max(max);

export const documentFormSchema = z.object({
  title: text(160).min(2),
  kind: z.enum(documentKinds),
  visibility: z.enum(documentVisibilities),
  specialized: z.literal("on").optional(),
  lesson: text(40).default(""),
});
export type DocumentForm = z.infer<typeof documentFormSchema>;

/**
 * The visibility actually saved: an answer key is for the team only, and a specialized document
 * is never public (it needs a signed-in account with the right).
 */
export function effectiveVisibility(
  input: Pick<DocumentForm, "kind" | "visibility" | "specialized">,
) {
  if (input.kind === "answer_key") return "team" as const;
  if (input.specialized === "on" && input.visibility === "public") return "enrolled" as const;
  return input.visibility;
}

/** Reads the PDF: a real, unencrypted PDF of at most 4 MB; returns its number of pages. */
export async function readPdf(bytes: Uint8Array) {
  if (bytes.byteLength > DOCUMENT_MAX_BYTES) throw new CourseDocumentError("fileSize");
  if (sniffDocumentType(bytes) !== "application/pdf") throw new CourseDocumentError("fileType");
  let pages = 0;
  try {
    pages = (await PDFDocument.load(bytes, { updateMetadata: false })).getPageCount();
  } catch (error) {
    // pdf-lib refuses an encrypted file with this message (its error class is not exported).
    if (error instanceof Error && /encrypted/i.test(error.message))
      throw new CourseDocumentError("encrypted");
    throw new CourseDocumentError("unreadable");
  }
  if (pages < 1) throw new CourseDocumentError("unreadable");
  return { pages };
}

/** The lesson must belong to the course; empty = the whole course. */
async function lessonOf(db: PrismaClient, courseId: string, lessonId: string) {
  if (!lessonId) return null;
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  return lesson?.id ?? null;
}

export async function listCourseDocuments(db: PrismaClient, courseId: string) {
  return db.courseDocument.findMany({
    where: { courseId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}
export type CourseDocumentRow = Awaited<ReturnType<typeof listCourseDocuments>>[number];

/** Saves a new document: checked, stored privately, then listed at the end of the course. */
export async function addCourseDocument(
  db: PrismaClient,
  storage: FileStorage,
  input: { courseId: string; authorId: string; form: DocumentForm; bytes: Uint8Array },
) {
  const course = await db.course.findUnique({
    where: { id: input.courseId },
    select: { id: true },
  });
  if (!course) throw new CourseDocumentError("notFound");
  const { pages } = await readPdf(input.bytes);
  const id = randomUUID();
  const storageKey = `courses/${course.id}/documents/${id}.pdf`;
  await storage.put(storageKey, { contentType: "application/pdf", bytes: input.bytes });
  const last = await db.courseDocument.findFirst({
    where: { courseId: course.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return db.courseDocument.create({
    data: {
      courseId: course.id,
      lessonId: await lessonOf(db, course.id, input.form.lesson),
      title: input.form.title,
      kind: input.form.kind,
      visibility: effectiveVisibility(input.form),
      specialized: input.form.specialized === "on",
      storageKey,
      size: input.bytes.byteLength,
      pages,
      order: (last?.order ?? 0) + 1,
      authorId: input.authorId,
    },
  });
}

/** Renames, reclassifies or moves a document; a new file, when sent, replaces the old one. */
export async function updateCourseDocument(
  db: PrismaClient,
  storage: FileStorage,
  input: { courseId: string; id: string; form: DocumentForm; bytes?: Uint8Array },
) {
  const document = await db.courseDocument.findFirst({
    where: { id: input.id, courseId: input.courseId },
  });
  if (!document) throw new CourseDocumentError("notFound");
  const file = input.bytes ? { ...(await readPdf(input.bytes)), bytes: input.bytes } : null;
  if (file)
    await storage.put(document.storageKey, { contentType: "application/pdf", bytes: file.bytes });
  return db.courseDocument.update({
    where: { id: document.id },
    data: {
      title: input.form.title,
      kind: input.form.kind,
      visibility: effectiveVisibility(input.form),
      specialized: input.form.specialized === "on",
      lessonId: await lessonOf(db, input.courseId, input.form.lesson),
      ...(file ? { size: file.bytes.byteLength, pages: file.pages } : {}),
    },
  });
}

export async function deleteCourseDocument(
  db: PrismaClient,
  storage: FileStorage,
  courseId: string,
  id: string,
) {
  const document = await db.courseDocument.findFirst({ where: { id, courseId } });
  if (!document) return false;
  await db.courseDocument.delete({ where: { id: document.id } });
  await storage.remove(document.storageKey);
  return true;
}

/** Moves a document one place up or down in the list of the course. */
export async function moveCourseDocument(
  db: PrismaClient,
  courseId: string,
  id: string,
  direction: "up" | "down",
) {
  const documents = await listCourseDocuments(db, courseId);
  const index = documents.findIndex((item) => item.id === id);
  const target = index + (direction === "up" ? -1 : 1);
  const current = documents[index];
  const other = documents[target];
  if (!current || !other) return false;
  // The two documents swap places; the list is renumbered 1, 2, 3… on the way.
  const ids = documents.map((item) => item.id);
  ids[index] = other.id;
  ids[target] = current.id;
  await db.$transaction(
    ids.map((documentId, position) =>
      db.courseDocument.update({ where: { id: documentId }, data: { order: position + 1 } }),
    ),
  );
  return true;
}

// ─── Who downloads what ────────────────────────────────────────────────────────

export type DocumentViewer = {
  /** A member of the Jumanly team (administration, content, support). */
  team: boolean;
  enrolled: boolean;
  /** The talent's plan opens the course (`learn.catalog.level`). */
  levelOpens: boolean;
  /** `learn.resources.specialized`. */
  specialized: boolean;
};

/**
 * The access rule of a document, in this order: the team sees everything; a `team` document and
 * any document of an unpublished course stay with the team; a specialized document needs the
 * right; a `public` document, or one attached to a preview lesson, is for everyone; an `enrolled`
 * document is for enrolled talents whose plan opens the course.
 */
export function documentAccess(
  document: {
    visibility: CourseDocumentVisibility;
    specialized: boolean;
    previewLesson: boolean;
    published: boolean;
  },
  viewer: DocumentViewer | null,
) {
  if (viewer?.team) return true;
  if (document.visibility === "team" || !document.published) return false;
  if (document.specialized && !viewer?.specialized) return false;
  if (document.visibility === "public" || document.previewLesson) return true;
  return Boolean(viewer?.enrolled && viewer.levelOpens);
}

/** What the signed-in user (or a visitor, `null`) is, for the documents of one course. */
export async function documentViewer(
  db: PrismaClient,
  user: { id: string; platformRole: string } | null,
  course: { id: string; requiredLevel: string },
): Promise<DocumentViewer | null> {
  if (!user) return null;
  if ((ADMIN_SHELL_ROLES as readonly string[]).includes(user.platformRole))
    return { team: true, enrolled: true, levelOpens: true, specialized: true };
  const subject: Subject = { type: "user", id: user.id };
  const [enrollment, planLevel, specialized] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      select: { id: true },
    }),
    catalogLevelOf(db, user.id),
    can(db, subject, SPECIALIZED_KEY),
  ]);
  return {
    team: false,
    enrolled: Boolean(enrollment),
    levelOpens: opensCourse(planLevel, course.requiredLevel),
    specialized,
  };
}

/** The documents of a course this viewer may download, for the talent pages. */
export async function visibleDocuments(
  db: PrismaClient,
  course: { id: string; status: string; requiredLevel: string },
  viewer: DocumentViewer | null,
) {
  const documents = await db.courseDocument.findMany({
    where: { courseId: course.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { lesson: { select: { isPreview: true } } },
  });
  return documents.filter((document) =>
    documentAccess(
      {
        visibility: document.visibility,
        specialized: document.specialized,
        previewLesson: document.lesson?.isPreview ?? false,
        published: course.status === "published",
      },
      viewer,
    ),
  );
}

/** Opens a document for download when the viewer may, and counts the download. */
export async function openCourseDocument(
  db: PrismaClient,
  storage: FileStorage,
  user: { id: string; platformRole: string } | null,
  id: string,
) {
  const document = await db.courseDocument.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, status: true, requiredLevel: true } },
      lesson: { select: { isPreview: true } },
    },
  });
  if (!document) return null;
  const viewer = await documentViewer(db, user, document.course);
  const allowed = documentAccess(
    {
      visibility: document.visibility,
      specialized: document.specialized,
      previewLesson: document.lesson?.isPreview ?? false,
      published: document.course.status === "published",
    },
    viewer,
  );
  if (!allowed) return null;
  const object = await storage.get(document.storageKey);
  if (!object) return null;
  await db.courseDocument.update({
    where: { id: document.id },
    data: { downloads: { increment: 1 } },
  });
  return { document, object };
}

/** A clean file name from the title: letters, digits and dashes, then `.pdf`. */
export function documentFileName(title: string) {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
  return `${base || "document"}.pdf`;
}

export const documentHref = (id: string) => `/formations/documents/${id}`;
