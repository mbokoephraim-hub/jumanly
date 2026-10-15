/**
 * Media of a course (Admin v2, étape 6): the cover, resized and converted to WebP in three widths,
 * and a lesson video sent from the computer when no video provider takes direct uploads. Files
 * live under `public/` of the file storage and are served by `/medias/…`.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { PrismaClient } from "@/generated/prisma/client";
import { PUBLIC_PREFIX, sniffDocumentType, type FileStorage } from "@/server/storage";

export const COVER_MAX_BYTES = 4 * 1024 * 1024;
export const COVER_WIDTHS = [480, 960, 1440] as const;
/** The width the catalog cards and pages use (`Course.coverUrl`). */
export const COVER_MAIN_WIDTH = 960;
/** A video sent through the site (fake provider): small files only, a request stops at 4.5 MB. */
export const VIDEO_MAX_BYTES = 4 * 1024 * 1024;

export class CourseMediaError extends Error {
  constructor(readonly code: "fileType" | "fileSize" | "notFound") {
    super(code);
    this.name = "CourseMediaError";
  }
}

export const mediaUrl = (key: string) => `/medias/${key.slice(PUBLIC_PREFIX.length)}`;

/** Address of one width of a cover, from the address saved on the course. */
export function coverAt(coverUrl: string, width: number) {
  return coverUrl.replace(/-(480|960|1440)\.webp$/, `-${width}.webp`);
}

/**
 * Replaces the cover: PNG, JPEG or WebP (recognized by its first bytes), rotated as shot, cropped
 * to 16:9 and saved in three widths. Returns the address saved on the course.
 */
export async function saveCover(
  db: PrismaClient,
  storage: FileStorage,
  courseId: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength > COVER_MAX_BYTES) throw new CourseMediaError("fileSize");
  const type = sniffDocumentType(bytes);
  if (!type || type === "application/pdf") throw new CourseMediaError("fileType");
  const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new CourseMediaError("notFound");
  const folder = `${PUBLIC_PREFIX}courses/${courseId}/`;
  const stem = `${folder}cover-${randomUUID().slice(0, 12)}`;
  const outputs = await Promise.all(
    COVER_WIDTHS.map(async (width) => ({
      width,
      bytes: new Uint8Array(
        await sharp(bytes)
          .rotate()
          .resize({ width, height: Math.round((width * 9) / 16), fit: "cover" })
          .webp({ quality: 78 })
          .toBuffer(),
      ),
    })),
  ).catch(() => {
    throw new CourseMediaError("fileType");
  });
  await storage.removePrefix(`${folder}cover-`);
  for (const output of outputs)
    await storage.put(`${stem}-${output.width}.webp`, {
      contentType: "image/webp",
      bytes: output.bytes,
    });
  const coverUrl = mediaUrl(`${stem}-${COVER_MAIN_WIDTH}.webp`);
  await db.course.update({ where: { id: courseId }, data: { coverUrl } });
  return coverUrl;
}

/** MP4 or WebM, recognized by their first bytes. */
export function sniffVideoType(bytes: Uint8Array): "video/mp4" | "video/webm" | null {
  if (String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") return "video/mp4";
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)
    return "video/webm";
  return null;
}

/** A lesson video kept by the site itself (no video provider configured). */
export async function saveLessonVideoFile(
  db: PrismaClient,
  storage: FileStorage,
  courseId: string,
  lessonId: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength > VIDEO_MAX_BYTES) throw new CourseMediaError("fileSize");
  const type = sniffVideoType(bytes);
  if (!type) throw new CourseMediaError("fileType");
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    select: { id: true },
  });
  if (!lesson) throw new CourseMediaError("notFound");
  const folder = `${PUBLIC_PREFIX}lessons/${lessonId}/`;
  const key = `${folder}video-${randomUUID().slice(0, 12)}.${type === "video/mp4" ? "mp4" : "webm"}`;
  await storage.removePrefix(`${folder}video-`);
  await storage.put(key, { contentType: type, bytes });
  const videoId = mediaUrl(key);
  await db.lesson.update({ where: { id: lessonId }, data: { videoId, kind: "video" } });
  return videoId;
}
