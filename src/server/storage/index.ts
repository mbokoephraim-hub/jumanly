/**
 * File storage (Admin v2, étape 4): supporting documents of organizations. Code talks to the
 * `FileStorage` interface; the driver comes from `STORAGE_DRIVER`:
 * - `database` (default): bytes in the `StoredFile` table, fine for a few small documents;
 * - `fake`: in memory, for tests.
 * An S3 driver can be added behind the same interface (variables S3_* of `.env.example`).
 */
import type { PrismaClient } from "@/generated/prisma/client";

export type StoredObject = { contentType: string; bytes: Uint8Array };

export interface FileStorage {
  put(key: string, object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
}

export function databaseStorage(db: PrismaClient): FileStorage {
  return {
    async put(key, { contentType, bytes }) {
      const data = new Uint8Array(bytes);
      await db.storedFile.upsert({
        where: { key },
        create: { key, contentType, size: data.byteLength, data },
        update: { contentType, size: data.byteLength, data },
      });
    },
    async get(key) {
      const row = await db.storedFile.findUnique({ where: { key } });
      return row ? { contentType: row.contentType, bytes: new Uint8Array(row.data) } : null;
    },
    async remove(key) {
      await db.storedFile.deleteMany({ where: { key } });
    },
  };
}

export function fakeStorage(): FileStorage {
  const files = new Map<string, StoredObject>();
  return {
    async put(key, object) {
      files.set(key, { contentType: object.contentType, bytes: new Uint8Array(object.bytes) });
    },
    async get(key) {
      return files.get(key) ?? null;
    },
    async remove(key) {
      files.delete(key);
    },
  };
}

let memory: FileStorage | null = null;

export function fileStorage(db: PrismaClient): FileStorage {
  if (process.env.STORAGE_DRIVER === "fake") return (memory ??= fakeStorage());
  return databaseStorage(db);
}

/** Accepted documents: PDF and images, recognized by their first bytes (not by their name). */
export const DOCUMENT_TYPES = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
} as const;
export type DocumentType = keyof typeof DOCUMENT_TYPES;

export function sniffDocumentType(bytes: Uint8Array): DocumentType | null {
  for (const [type, magic] of Object.entries(DOCUMENT_TYPES) as [
    DocumentType,
    readonly number[],
  ][]) {
    if (!magic.every((byte, index) => bytes[index] === byte)) continue;
    // RIFF is shared by other formats: WEBP says so at bytes 8 to 11.
    if (type === "image/webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") continue;
    return type;
  }
  return null;
}
