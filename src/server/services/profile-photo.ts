import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

/** A cropped square from the browser stays far below this; anything bigger is refused. */
export const PHOTO_MAX_BYTES = 1_000_000;
const PREFIX = "/api/photo/";

export class PhotoError extends Error {
  constructor(public code: "type" | "size") {
    super(code);
  }
}

/** JPEG, PNG or WebP, read from the first bytes rather than from what the browser says. */
export function photoType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  const text = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Saves the photo (screen 26) under a new unguessable address, which becomes the account's image:
 * the old address stops working at once.
 */
export async function savePhoto(db: PrismaClient, userId: string, bytes: Uint8Array) {
  if (bytes.length === 0 || bytes.length > PHOTO_MAX_BYTES) throw new PhotoError("size");
  const contentType = photoType(bytes);
  if (!contentType) throw new PhotoError("type");
  const token = randomBytes(18).toString("base64url");
  const data = { token, contentType, bytes: Buffer.from(bytes) };
  await db.$transaction([
    db.profilePhoto.upsert({ where: { userId }, create: { userId, ...data }, update: data }),
    db.user.update({ where: { id: userId }, data: { image: `${PREFIX}${token}` } }),
  ]);
  return `${PREFIX}${token}`;
}

/** Removes the photo: the account goes back to its initials. */
export async function removePhoto(db: PrismaClient, userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { image: true } });
  await db.$transaction([
    db.profilePhoto.deleteMany({ where: { userId } }),
    db.user.update({ where: { id: userId }, data: { image: null } }),
  ]);
  return user.image;
}

export async function photoByToken(db: PrismaClient, token: string) {
  return db.profilePhoto.findUnique({
    where: { token },
    select: { bytes: true, contentType: true, updatedAt: true },
  });
}
