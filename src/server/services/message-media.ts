/**
 * The files of a conversation on the phone (Modèle B, lot B8): photos, voice notes and documents
 * taken from the phone. They are kept in the private storage (never under `public/`) and served
 * only to the people of the conversation (`/app/messages/[id]/media/[messageId]`).
 * - A photo is re-encoded: rotated as taken, its metadata (place, device) dropped, reduced to
 *   1 280 px, or 2 560 px in « HD ».
 * - A voice note is a short recording of the browser (WebM, Ogg, MP4 or WAV), checked by its bytes.
 * - A document is a PDF or an image, checked by its bytes, not by its name.
 */
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { PrismaClient } from "@/generated/prisma/client";
import { fileStorage, sniffDocumentType } from "@/server/storage";

export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const VOICE_MAX_BYTES = 3 * 1024 * 1024;
export const VOICE_MAX_SECONDS = 300;
export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export class MediaError extends Error {
  constructor(readonly code: "type" | "size" | "empty") {
    super(code);
    this.name = "MediaError";
  }
}

const keyFor = (conversationId: string, extension: string) =>
  `messages/${conversationId}/${randomBytes(12).toString("hex")}.${extension}`;

export type StoredPhoto = { key: string; width: number; height: number };

/** A photo of the phone, cleaned and reduced, stored for this conversation. */
export async function storePhoto(
  db: PrismaClient,
  conversationId: string,
  bytes: Uint8Array,
  hd: boolean,
): Promise<StoredPhoto> {
  if (bytes.byteLength === 0) throw new MediaError("empty");
  if (bytes.byteLength > PHOTO_MAX_BYTES) throw new MediaError("size");
  const type = sniffDocumentType(bytes);
  if (!type || type === "application/pdf") throw new MediaError("type");
  const side = hd ? 2560 : 1280;
  const { data, info } = await sharp(bytes, { failOn: "error" })
    .rotate()
    .resize({ width: side, height: side, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: hd ? 88 : 78, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const key = keyFor(conversationId, "jpg");
  await fileStorage(db).put(key, { contentType: "image/jpeg", bytes: new Uint8Array(data) });
  return { key, width: info.width, height: info.height };
}

const AUDIO_TYPES: { type: string; extension: string; test: (bytes: Uint8Array) => boolean }[] = [
  {
    type: "audio/webm",
    extension: "webm",
    test: (bytes) => [0x1a, 0x45, 0xdf, 0xa3].every((byte, index) => bytes[index] === byte),
  },
  {
    type: "audio/ogg",
    extension: "ogg",
    test: (bytes) => String.fromCharCode(...bytes.slice(0, 4)) === "OggS",
  },
  {
    type: "audio/mp4",
    extension: "m4a",
    test: (bytes) => String.fromCharCode(...bytes.slice(4, 8)) === "ftyp",
  },
  {
    type: "audio/wav",
    extension: "wav",
    test: (bytes) =>
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WAVE",
  },
];

export type StoredVoice = { key: string; type: string; seconds: number };

/** A voice note recorded in the conversation. */
export async function storeVoice(
  db: PrismaClient,
  conversationId: string,
  bytes: Uint8Array,
  seconds: number,
): Promise<StoredVoice> {
  if (bytes.byteLength === 0) throw new MediaError("empty");
  if (bytes.byteLength > VOICE_MAX_BYTES) throw new MediaError("size");
  const audio = AUDIO_TYPES.find((candidate) => candidate.test(bytes));
  if (!audio) throw new MediaError("type");
  const key = keyFor(conversationId, audio.extension);
  await fileStorage(db).put(key, { contentType: audio.type, bytes });
  return {
    key,
    type: audio.type,
    seconds: Math.max(1, Math.min(VOICE_MAX_SECONDS, Math.round(seconds))),
  };
}

export type StoredUpload = { key: string; name: string; size: number; type: string };

/** A document taken from the phone (« Documents · Sur ce téléphone »). */
export async function storeUpload(
  db: PrismaClient,
  conversationId: string,
  bytes: Uint8Array,
  name: string,
): Promise<StoredUpload> {
  if (bytes.byteLength === 0) throw new MediaError("empty");
  if (bytes.byteLength > UPLOAD_MAX_BYTES) throw new MediaError("size");
  const type = sniffDocumentType(bytes);
  if (!type) throw new MediaError("type");
  const extension = type === "application/pdf" ? "pdf" : type.split("/")[1]!;
  const key = keyFor(conversationId, extension);
  await fileStorage(db).put(key, { contentType: type, bytes });
  const clean =
    name
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "")
      .trim()
      .slice(0, 120) || `document.${extension}`;
  return { key, name: clean, size: bytes.byteLength, type };
}

/** The keys a message's payload points to, in the order they are shown. */
export function mediaKeys(kind: string, payload: unknown): string[] {
  const value = (payload ?? {}) as {
    files?: { key?: unknown }[];
    key?: unknown;
    upload?: { key?: unknown };
  };
  if (kind === "image") return (value.files ?? []).map((file) => String(file.key ?? ""));
  if (kind === "voice") return [String(value.key ?? "")];
  if (kind === "file" && value.upload) return [String(value.upload.key ?? "")];
  return [];
}
