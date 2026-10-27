import type { PrismaClient } from "@/generated/prisma/client";
import type { FileStorage } from "@/server/storage";

/**
 * The file of an imported CV (Ephraïm, 27/10): read by Orbi, it waits in the private storage
 * until the talent chooses. « Garder mon CV » and « Remplir mon profil » keep it in « Mes CV »;
 * « Créer un autre CV » and a new import drop it.
 */
export type CvFileType = "pdf" | "docx" | "image";

export const CV_FILE_TYPES: Record<Exclude<CvFileType, "image">, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const waitingPrefix = (userId: string) => `private/cv-import/${userId}/`;
export const waitingCvFileKey = (userId: string, importId: string) =>
  `${waitingPrefix(userId)}${importId}`;
export const keptCvFileKey = (documentId: string) => `private/cv/${documentId}`;
export const sentCvFileKey = (applicationId: string) => `private/candidature-cv/${applicationId}`;

/** A new import replaces the file still waiting from the previous one. */
export async function holdImportedFile(
  storage: FileStorage,
  userId: string,
  importId: string,
  file: { contentType: string; bytes: Uint8Array },
) {
  await storage.removePrefix(waitingPrefix(userId));
  await storage.put(waitingCvFileKey(userId, importId), file);
}

export async function dropImportedFile(storage: FileStorage, userId: string, importId: string) {
  await storage.remove(waitingCvFileKey(userId, importId));
}

/** Moves the waiting file onto the CV kept in « Mes CV »; false when there is none (pasted text). */
export async function keepImportedFile(
  db: PrismaClient,
  storage: FileStorage,
  userId: string,
  importId: string,
  documentId: string,
  file: { name: string; kind: CvFileType },
) {
  const waiting = await storage.get(waitingCvFileKey(userId, importId));
  if (!waiting) return false;
  const key = keptCvFileKey(documentId);
  await storage.put(key, waiting);
  await storage.remove(waitingCvFileKey(userId, importId));
  await db.document.update({
    where: { id: documentId },
    data: { fileKey: key, fileName: file.name.slice(0, 200), fileType: file.kind },
  });
  return true;
}

/** The kept file travels with the application: deleting the CV later leaves the copy sent. */
export async function copyCvFileForApplication(
  storage: FileStorage,
  fileKey: string,
  applicationId: string,
) {
  const file = await storage.get(fileKey);
  if (!file) return null;
  const key = sentCvFileKey(applicationId);
  await storage.put(key, file);
  return key;
}

/** Inline file answer (« Lire »/« Télécharger »), with a name safe for the header. */
export function cvFileResponse(
  file: { contentType: string; bytes: Uint8Array },
  name: string,
  disposition: "inline" | "attachment",
) {
  const safe = name.replace(/[^\w.\- ()À-ÿ]/g, "_").slice(0, 120) || "cv";
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `${disposition}; filename="${safe.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(safe)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
