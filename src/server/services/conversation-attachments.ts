/**
 * What the talent sends with « + » in a conversation (docs/ux-mobile-talent, prompt 5, screen 50):
 * a CV, a letter or another document of their own (a copy, like for an application), a time
 * slot, a link. Files and slots have their own message kinds and cards, never a plain bubble.
 */
import { z } from "zod";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { defaultTimeZone } from "@/lib/dates";
import { ConnectError, getConversation, sendMessage, type Viewer } from "./connect";
import { slotToDate, validTimeZone } from "./interviews";

export const attachmentKinds = ["cv", "lettre", "document"] as const;
export type AttachmentKind = (typeof attachmentKinds)[number];

const kindsOf: Record<AttachmentKind, ("cv" | "cover_letter" | "bio" | "other")[]> = {
  cv: ["cv"],
  lettre: ["cover_letter"],
  document: ["cv", "cover_letter", "bio", "other"],
};

/** The talent's own documents that can be sent for this choice. */
export function attachableDocuments(db: PrismaClient, userId: string, kind: AttachmentKind) {
  return db.document.findMany({
    where: { profile: { userId }, kind: { in: kindsOf[kind] } },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: { id: true, title: true, kind: true, updatedAt: true },
  });
}

/** Payload of a file message: a frozen copy, printed later as it was sent. */
export type FilePayload = {
  document: {
    /** `cv`: printed with its CV template; `text`: a letter or a text, printed as text. */
    type: "cv" | "text";
    title: string;
    templateId?: string | null;
    content?: unknown;
    style?: unknown;
    text?: string;
  };
};

export async function sendDocument(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  documentId: string,
  now = new Date(),
) {
  if (viewer.hire) throw new ConnectError("notFound");
  await getConversation(db, viewer, conversationId);
  const document = await db.document.findFirst({
    where: { id: documentId, profile: { userId: viewer.userId } },
  });
  if (!document) throw new ConnectError("notFound");
  const isCv = document.kind === "cv";
  const text = isCv ? "" : String((document.content as { text?: unknown } | null)?.text ?? "");
  const copy: Prisma.InputJsonObject = isCv
    ? {
        type: "cv",
        title: document.title,
        templateId: document.templateId,
        content: document.content as Prisma.InputJsonValue,
        ...(document.style ? { style: document.style as Prisma.InputJsonValue } : {}),
      }
    : { type: "text", title: document.title, text };
  return sendMessage(
    db,
    viewer,
    conversationId,
    { body: document.title, kind: "file", payload: { document: copy } },
    now,
  );
}

export const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().trim().max(300).default(""),
});

/** The zone a slot is written in: the latest interview of the conversation's application, or the platform's. */
export async function conversationTimeZone(db: PrismaClient, conversationId: string) {
  const interview = await db.interview.findFirst({
    where: { application: { conversation: { id: conversationId } } },
    orderBy: { createdAt: "desc" },
    select: { timezone: true },
  });
  const zone = interview?.timezone ?? defaultTimeZone();
  return validTimeZone(zone) ? zone : "UTC";
}

/** « Un créneau »: a time the talent suggests, shown as a SlotCard. */
export async function sendSlot(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  input: z.infer<typeof slotSchema>,
  now = new Date(),
) {
  if (viewer.hire) throw new ConnectError("notFound");
  await getConversation(db, viewer, conversationId);
  const timezone = await conversationTimeZone(db, conversationId);
  const startsAt = slotToDate(`${input.date}T${input.time}`, timezone);
  if (!startsAt || startsAt <= now) throw new ConnectError("invalid");
  return sendMessage(
    db,
    viewer,
    conversationId,
    {
      body: input.note || startsAt.toISOString(),
      kind: "slot",
      payload: { startsAt: startsAt.toISOString(), timezone, note: input.note },
    },
    now,
  );
}

export const linkSchema = z.object({
  url: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((value) => /^https?:\/\//i.test(value)),
  label: z.string().trim().max(120).default(""),
});

/** « Un lien »: an http(s) address, shown as a link the other side can open. */
export async function sendLink(
  db: PrismaClient,
  viewer: Viewer,
  conversationId: string,
  input: z.infer<typeof linkSchema>,
  now = new Date(),
) {
  return sendMessage(
    db,
    viewer,
    conversationId,
    { body: input.label || input.url, payload: { link: input.url } },
    now,
  );
}
