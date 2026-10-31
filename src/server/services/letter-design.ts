/**
 * The visual template of a cover letter (Ephraïm, 31/10/2026): which of the six templates the
 * person may use (entitlement `career.cv.templates.access`, the first one is open to everyone),
 * the design kept in `Document.style`, and the facts printed in the band (name, title, e-mail,
 * city and country, photo). Never a phone number or an address: the person adds them in the text
 * if they wish.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { includesAccess } from "@/features/cv/templates/registry";
import {
  letterDesignSchema,
  letterTemplateOf,
  letterTemplates,
  parseLetterDesign,
  type LetterDesign,
  type LetterTemplateId,
} from "@/features/letter/design";
import { templatesAccess } from "./cv";
import { getDocument } from "./career-documents";

const LETTER_KINDS = ["cover_letter", "bio", "other"] as const;

/** A cover letter (written by Orbi, or the person's own, read again or not): it has a template. */
export function isCoverLetter(content: { type: string } | null | undefined) {
  return content?.type === "letter" || content?.type === "proofread";
}

/** For each template: open to this person or not. */
export async function letterTemplateAccess(db: PrismaClient, userId: string) {
  const granted = await templatesAccess(db, { type: "user", id: userId });
  return Object.fromEntries(
    letterTemplates.map((template) => [template.id, includesAccess(granted, template.access)]),
  ) as Record<LetterTemplateId, boolean>;
}

export async function getLetterDesign(db: PrismaClient, userId: string, documentId: string) {
  const document = await db.document.findFirst({
    where: { id: documentId, kind: { in: [...LETTER_KINDS] }, profile: { userId } },
    select: { style: true },
  });
  return document ? parseLetterDesign(document.style) : null;
}

export type DesignResult = "saved" | "notFound" | "locked" | "invalid";

/** « Valider le modèle »: the template is checked against the plan on the server. */
export async function saveLetterDesign(
  db: PrismaClient,
  userId: string,
  documentId: string,
  input: unknown,
): Promise<DesignResult> {
  const parsed = letterDesignSchema.omit({ chosen: true }).safeParse(input);
  if (!parsed.success) return "invalid";
  const document = await db.document.findFirst({
    where: { id: documentId, kind: { in: [...LETTER_KINDS] }, profile: { userId } },
    select: { id: true },
  });
  if (!document) return "notFound";
  const access = await letterTemplateAccess(db, userId);
  if (!access[letterTemplateOf(parsed.data.template).id]) return "locked";
  const design: LetterDesign = { ...parsed.data, chosen: true };
  await db.document.update({
    where: { id: document.id },
    data: { style: design as unknown as Prisma.InputJsonValue },
  });
  return "saved";
}

export type LetterFacts = {
  name: string;
  headline: string;
  email: string;
  city: string;
  /** ISO 3166-1 code. */
  country: string;
  photoUrl: string | null;
  job: { title: string; company: string } | null;
};

/** What the band and the head of the letter print, read from the account and the offer. */
export async function letterFacts(
  db: PrismaClient,
  userId: string,
  jobId: string | null,
): Promise<LetterFacts> {
  const [user, job] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        city: true,
        country: true,
        image: true,
        talentProfile: { select: { headline: true } },
      },
    }),
    jobId
      ? db.job.findFirst({
          where: { id: jobId },
          select: { title: true, organization: { select: { name: true } } },
        })
      : null,
  ]);
  return {
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name,
    headline: user.talentProfile?.headline ?? "",
    email: user.email,
    city: user.city ?? "",
    country: user.country ?? "",
    photoUrl: user.image,
    job: job ? { title: job.title, company: job.organization.name } : null,
  };
}

/** The photo's bytes for the PDF (JPEG or PNG only), or null. */
export async function letterPhoto(db: PrismaClient, userId: string) {
  const photo = await db.profilePhoto.findUnique({
    where: { userId },
    select: { bytes: true, contentType: true },
  });
  if (!photo) return null;
  const format =
    photo.contentType === "image/jpeg" ? "jpg" : photo.contentType === "image/png" ? "png" : null;
  return format ? { data: Buffer.from(photo.bytes), format } : null;
}

/** A letter with its design, for the pages of the visual template. */
export async function getLetterWithDesign(db: PrismaClient, userId: string, documentId: string) {
  const document = await getDocument(db, userId, documentId);
  if (!document) return null;
  return { ...document, design: parseLetterDesign(document.style) };
}
