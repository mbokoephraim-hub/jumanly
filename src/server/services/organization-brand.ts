/**
 * Banner and logo of an organization (V6 § B9, screens 63 to 66, prompt 4 bis). The images are
 * recognized by their first bytes, cropped (3:1 banner, square logo), turned into WebP in a few
 * widths and served by `/medias/orgs/…`, like the course covers.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { PrismaClient } from "@/generated/prisma/client";
import { PUBLIC_PREFIX, sniffDocumentType, type FileStorage } from "@/server/storage";

export const BRAND_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const brandImageKinds = ["banner", "logo"] as const;
export type BrandImageKind = (typeof brandImageKinds)[number];

/** Widths made for each image, and the one saved on the organization. */
export const BRAND_WIDTHS = {
  banner: { widths: [640, 1000, 1500], main: 1000, ratio: 3 },
  logo: { widths: [128, 256], main: 256, ratio: 1 },
} as const;

export class BrandImageError extends Error {
  constructor(readonly code: "fileType" | "fileSize") {
    super(code);
    this.name = "BrandImageError";
  }
}

const mediaUrl = (key: string) => `/medias/${key.slice(PUBLIC_PREFIX.length)}`;

/** Address of another width of a banner or logo, from the address saved on the organization. */
export function brandImageAt(url: string, width: number) {
  return url.replace(/-(\d+)\.webp$/, `-${width}.webp`);
}

/** `srcset` of a saved banner or logo. */
export function brandSrcSet(url: string, kind: BrandImageKind) {
  return BRAND_WIDTHS[kind].widths
    .map((width) => `${brandImageAt(url, width)} ${width}w`)
    .join(", ");
}

/**
 * Replaces the banner or the logo: PNG, JPEG or WebP, rotated as shot, cropped to its ratio from
 * the center (the browser already sends the part chosen), saved in each width. The old widths are
 * removed. Returns the address saved on the organization.
 */
export async function saveBrandImage(
  db: PrismaClient,
  storage: FileStorage,
  organizationId: string,
  kind: BrandImageKind,
  bytes: Uint8Array,
) {
  if (bytes.byteLength === 0 || bytes.byteLength > BRAND_IMAGE_MAX_BYTES)
    throw new BrandImageError("fileSize");
  const type = sniffDocumentType(bytes);
  if (!type || type === "application/pdf") throw new BrandImageError("fileType");
  const { widths, main, ratio } = BRAND_WIDTHS[kind];
  const folder = `${PUBLIC_PREFIX}orgs/${organizationId}/`;
  const stem = `${folder}${kind}-${randomUUID().slice(0, 12)}`;
  const outputs = await Promise.all(
    widths.map(async (width) => ({
      width,
      bytes: new Uint8Array(
        await sharp(bytes)
          .rotate()
          .resize({ width, height: Math.round(width / ratio), fit: "cover" })
          .webp({ quality: kind === "logo" ? 86 : 78 })
          .toBuffer(),
      ),
    })),
  ).catch(() => {
    throw new BrandImageError("fileType");
  });
  await storage.removePrefix(`${folder}${kind}-`);
  for (const output of outputs)
    await storage.put(`${stem}-${output.width}.webp`, {
      contentType: "image/webp",
      bytes: output.bytes,
    });
  const url = mediaUrl(`${stem}-${main}.webp`);
  await db.organization.update({ where: { id: organizationId }, data: { [kind]: url } });
  return url;
}

/** Removes the banner or the logo: the cards go back to the Jumanly pattern or the initials. */
export async function removeBrandImage(
  db: PrismaClient,
  storage: FileStorage,
  organizationId: string,
  kind: BrandImageKind,
) {
  await storage.removePrefix(`${PUBLIC_PREFIX}orgs/${organizationId}/${kind}-`);
  await db.organization.update({ where: { id: organizationId }, data: { [kind]: null } });
}
