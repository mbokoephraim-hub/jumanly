/**
 * The company of an experience (demande d'Ephraïm du 29/10/2026), as on LinkedIn: while the person
 * types its name, the companies that have a page on Jumanly are proposed with their logo; one
 * chosen gives the experience its logo and a link to its page. A company without a page can get
 * a logo sent by the person, cut square and served by `/medias/experiences/…`.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { PrismaClient } from "@/generated/prisma/client";
import { PUBLIC_PREFIX, sniffDocumentType, type FileStorage } from "@/server/storage";
import { normalizeOrgName } from "./org-join";

export const EXPERIENCE_LOGO_MAX_BYTES = 4 * 1024 * 1024;
const LOGO_WIDTH = 160;
const COMPANY_TYPES = ["recruiter", "company"] as ("recruiter" | "company")[];

export type CompanySuggestion = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  place: string | null;
};

export class ExperienceLogoError extends Error {
  constructor(readonly code: "fileType" | "fileSize") {
    super(code);
    this.name = "ExperienceLogoError";
  }
}

/**
 * The companies whose name holds what was typed (2 letters at least), those that start with it
 * first. Suspended companies and partner institutions are left out.
 */
export async function suggestCompanies(
  db: PrismaClient,
  typed: string,
  take = 6,
): Promise<CompanySuggestion[]> {
  const query = typed.trim().slice(0, 80);
  if (query.length < 2) return [];
  const rows = await db.organization.findMany({
    where: {
      type: { in: COMPANY_TYPES },
      suspendedAt: null,
      name: { contains: query, mode: "insensitive" },
    },
    orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
    take: 20,
    select: { id: true, name: true, slug: true, logo: true, city: true, country: true },
  });
  const start = normalizeOrgName(query);
  return rows
    .map((row) => ({ row, first: normalizeOrgName(row.name).startsWith(start) ? 0 : 1 }))
    .sort((a, b) => a.first - b.first)
    .slice(0, take)
    .map(({ row }) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      logo: row.logo,
      place: row.city ?? null,
    }));
}

/** The company an experience may be linked to: one that suggestions would show. */
export async function linkableCompany(db: PrismaClient, organizationId: string) {
  return db.organization.findFirst({
    where: { id: organizationId, type: { in: COMPANY_TYPES }, suspendedAt: null },
    select: { id: true, name: true },
  });
}

const folderOf = (profileId: string) => `${PUBLIC_PREFIX}experiences/${profileId}/`;
const mediaUrl = (key: string) => `/medias/${key.slice(PUBLIC_PREFIX.length)}`;
const keyOf = (url: string) => `${PUBLIC_PREFIX}${url.slice("/medias/".length)}`;

/** A logo address the person may save on their experience: one they sent themselves. */
export function isOwnExperienceLogo(profileId: string, url: string) {
  return (
    url.startsWith(mediaUrl(folderOf(profileId))) &&
    /^[a-z0-9/_-]+\.webp$/i.test(url.slice("/medias/".length)) &&
    !url.includes("..")
  );
}

/**
 * Saves a logo sent from the form: PNG, JPEG or WebP, rotated as shot, cut square from the center
 * and turned into WebP. Returns its address, saved with the experience by « Enregistrer ».
 */
export async function saveExperienceLogo(
  storage: FileStorage,
  profileId: string,
  bytes: Uint8Array,
) {
  if (bytes.byteLength === 0 || bytes.byteLength > EXPERIENCE_LOGO_MAX_BYTES)
    throw new ExperienceLogoError("fileSize");
  const type = sniffDocumentType(bytes);
  if (!type || type === "application/pdf") throw new ExperienceLogoError("fileType");
  const output = await sharp(bytes)
    .rotate()
    .resize({ width: LOGO_WIDTH, height: LOGO_WIDTH, fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .webp({ quality: 86 })
    .toBuffer()
    .catch(() => {
      throw new ExperienceLogoError("fileType");
    });
  const key = `${folderOf(profileId)}logo-${randomUUID().slice(0, 12)}.webp`;
  await storage.put(key, { contentType: "image/webp", bytes: new Uint8Array(output) });
  return mediaUrl(key);
}

/** Removes a logo the person sent, once no experience shows it any more. */
export async function removeExperienceLogo(storage: FileStorage, profileId: string, url: string) {
  if (!isOwnExperienceLogo(profileId, url)) return;
  await storage.removePrefix(keyOf(url));
}
