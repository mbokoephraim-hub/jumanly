/**
 * The photo of a certificate or of a diploma (demande d'Ephraïm du 29/10/2026): PNG, JPEG or WebP,
 * rotated as shot, at most 1600 px wide, turned into WebP without its metadata (place, device), and
 * served by `/medias/formations/…` under an address nobody can guess.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PUBLIC_PREFIX, sniffDocumentType, type FileStorage } from "@/server/storage";

export const EDUCATION_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_WIDTH = 1600;

export class EducationImageError extends Error {
  constructor(readonly code: "fileType" | "fileSize") {
    super(code);
    this.name = "EducationImageError";
  }
}

const folderOf = (profileId: string) => `${PUBLIC_PREFIX}formations/${profileId}/`;
const mediaUrl = (key: string) => `/medias/${key.slice(PUBLIC_PREFIX.length)}`;
const keyOf = (url: string) => `${PUBLIC_PREFIX}${url.slice("/medias/".length)}`;

/** An image address the person may save on their diploma or certificate: one they sent. */
export function isOwnEducationImage(profileId: string, url: string) {
  return (
    url.startsWith(mediaUrl(folderOf(profileId))) &&
    /^[a-z0-9/_-]+\.webp$/i.test(url.slice("/medias/".length)) &&
    !url.includes("..")
  );
}

/** Saves the image sent from the form and returns its address (saved with « Enregistrer »). */
export async function saveEducationImage(
  storage: FileStorage,
  profileId: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength === 0 || bytes.byteLength > EDUCATION_IMAGE_MAX_BYTES)
    throw new EducationImageError("fileSize");
  const type = sniffDocumentType(bytes);
  if (!type || type === "application/pdf") throw new EducationImageError("fileType");
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: IMAGE_WIDTH, height: IMAGE_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
    .catch(() => {
      throw new EducationImageError("fileType");
    });
  const key = `${folderOf(profileId)}${randomUUID()}.webp`;
  await storage.put(key, { contentType: "image/webp", bytes: new Uint8Array(output) });
  return mediaUrl(key);
}

/** Removes an image the person sent, once the diploma or certificate no longer shows it. */
export async function removeEducationImage(storage: FileStorage, profileId: string, url: string) {
  if (!isOwnEducationImage(profileId, url)) return;
  await storage.removePrefix(keyOf(url));
}
