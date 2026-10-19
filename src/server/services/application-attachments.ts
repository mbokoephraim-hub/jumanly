/**
 * Documents joined to an application (planche talent-2 § 1, « Ajouter une lettre ou des
 * documents »): the talent's attestations and saved texts (biography, other documents). The draft
 * keeps references; the application keeps a copy, so a later change does not alter what the
 * recruiter received. Applying stays free: nothing here reads a plan or a quota.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { parseDocument } from "./career-documents";

/** At most this many documents per application. */
export const ATTACHMENTS_MAX = 5;

const refSchema = z.object({ type: z.enum(["certificate", "document"]), id: z.string().max(60) });
export type AttachmentRef = z.infer<typeof refSchema>;

export function parseRefs(value: Prisma.JsonValue | undefined): AttachmentRef[] {
  const parsed = z.array(refSchema).safeParse(value ?? []);
  return parsed.success ? parsed.data.slice(0, ATTACHMENTS_MAX) : [];
}

const sentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("certificate"),
    code: z.string(),
    title: z.string(),
    issuedAt: z.string(),
  }),
  z.object({ type: z.literal("document"), title: z.string(), text: z.string() }),
]);
export type SentAttachment = z.infer<typeof sentSchema>;

/** What an application carries (talent detail, recruiter view). Unknown entries are skipped. */
export function sentAttachments(value: Prisma.JsonValue | undefined): SentAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = sentSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export type Attachable = {
  type: AttachmentRef["type"];
  id: string;
  title: string;
  date: Date;
};

/** The talent's attestations (not revoked) and saved texts other than letters, newest first. */
export async function attachableItems(db: PrismaClient, userId: string): Promise<Attachable[]> {
  const [certificates, documents] = await Promise.all([
    db.certificate.findMany({
      where: { revokedAt: null, enrollment: { userId } },
      orderBy: { issuedAt: "desc" },
      select: { id: true, courseTitle: true, issuedAt: true },
    }),
    db.document.findMany({
      where: { kind: { in: ["bio", "other"] }, profile: { userId } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    }),
  ]);
  return [
    ...certificates.map((item) => ({
      type: "certificate" as const,
      id: item.id,
      title: item.courseTitle,
      date: item.issuedAt,
    })),
    ...documents.map((item) => ({
      type: "document" as const,
      id: item.id,
      title: item.title,
      date: item.updatedAt,
    })),
  ];
}

/** The talent's saved letters, to start the letter of an application from one of them. */
export async function savedLetters(db: PrismaClient, userId: string) {
  const letters = await db.document.findMany({
    where: { kind: "cover_letter", profile: { userId } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, title: true, content: true, updatedAt: true },
  });
  return letters.flatMap((letter) => {
    const content = parseDocument(letter.content);
    return content?.text.trim()
      ? [{ id: letter.id, title: letter.title, text: content.text, updatedAt: letter.updatedAt }]
      : [];
  });
}

/** Keeps only references to the talent's own items, without duplicates. */
export async function ownRefs(db: PrismaClient, userId: string, refs: AttachmentRef[]) {
  const items = await attachableItems(db, userId);
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.type}:${ref.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return items.some((item) => item.type === ref.type && item.id === ref.id);
  });
}

/** The copy kept with the application, at the moment it is sent. */
export async function snapshotAttachments(
  db: PrismaClient,
  userId: string,
  refs: AttachmentRef[],
): Promise<SentAttachment[]> {
  const own = await ownRefs(db, userId, refs);
  const certificateIds = own.filter((ref) => ref.type === "certificate").map((ref) => ref.id);
  const documentIds = own.filter((ref) => ref.type === "document").map((ref) => ref.id);
  const [certificates, documents] = await Promise.all([
    db.certificate.findMany({
      where: { id: { in: certificateIds } },
      select: { id: true, code: true, courseTitle: true, issuedAt: true },
    }),
    db.document.findMany({
      where: { id: { in: documentIds } },
      select: { id: true, title: true, content: true },
    }),
  ]);
  return own.flatMap((ref): SentAttachment[] => {
    if (ref.type === "certificate") {
      const item = certificates.find((certificate) => certificate.id === ref.id);
      return item
        ? [
            {
              type: "certificate",
              code: item.code,
              title: item.courseTitle,
              issuedAt: item.issuedAt.toISOString(),
            },
          ]
        : [];
    }
    const item = documents.find((document) => document.id === ref.id);
    const text = item ? (parseDocument(item.content)?.text ?? "") : "";
    return item && text.trim() ? [{ type: "document", title: item.title, text }] : [];
  });
}
