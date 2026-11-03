import "server-only";
import { db } from "@/server/db";
import { fileStorage, type StoredObject } from "@/server/storage";

export type CvFileType = "pdf" | "docx" | "image";

type Snapshot = {
  documentId?: unknown;
  title?: unknown;
  file?: { key?: unknown; name?: unknown; type?: unknown };
} | null;

/**
 * Where the imported file of the CV sent with an application lives (Ephraïm, 03/11/2026: the
 * recruiter reads the CV in the app, as the talent sent it): the copy kept with the application,
 * else the file of the CV document it was sent from.
 */
export async function originalCvRef(
  snapshot: unknown,
): Promise<{ key: string; name: string; type: CvFileType | null } | null> {
  const value = snapshot as Snapshot;
  if (!value || typeof value !== "object") return null;
  const title = typeof value.title === "string" ? value.title : "cv";
  if (value.file && typeof value.file.key === "string")
    return {
      key: value.file.key,
      name: typeof value.file.name === "string" ? value.file.name : title,
      type: fileTypeOf(value.file.type),
    };
  if (typeof value.documentId !== "string") return null;
  const document = await db.document.findFirst({
    where: { id: value.documentId, kind: "cv", fileKey: { not: null } },
    select: { fileKey: true, fileName: true, fileType: true },
  });
  return document?.fileKey
    ? {
        key: document.fileKey,
        name: document.fileName ?? title,
        type: fileTypeOf(document.fileType),
      }
    : null;
}

export async function originalCvFile(
  snapshot: unknown,
): Promise<{ file: StoredObject; name: string; type: CvFileType | null } | null> {
  const ref = await originalCvRef(snapshot);
  const file = ref ? await fileStorage(db).get(ref.key) : null;
  return ref && file ? { file, name: ref.name, type: ref.type } : null;
}

function fileTypeOf(value: unknown): CvFileType | null {
  return value === "pdf" || value === "docx" || value === "image" ? value : null;
}
