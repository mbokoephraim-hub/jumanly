"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import type { MessageKind, Prisma } from "@/generated/prisma/client";
import { onMessageSent } from "@/server/application-events";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { allowAttempt } from "@/server/rate-limit";
import {
  ConnectError,
  blockConversation,
  sendMessage,
  type SentMessage,
} from "@/server/services/connect";
import {
  acceptConnection,
  ConnectionError,
  ignoreConnection,
  removeConnection,
} from "@/server/services/connections";
import {
  meetingSchema,
  sendDocument,
  sendMeeting,
} from "@/server/services/conversation-attachments";
import { helpModes, messageHelp, type HelpResult } from "@/server/services/message-help";
import {
  MediaError,
  PHOTO_MAX_BYTES,
  storePhoto,
  storeUpload,
  storeVoice,
} from "@/server/services/message-media";
import {
  clearConversation,
  ensurePeerConversation,
  ephemeralChoices,
  searchMessages,
  searchTypes,
  setEphemeral,
  setMuted,
  visibleMessage,
} from "@/server/services/messages-phone";
import { respondContactRequest } from "@/server/services/talent-search";
import { mailContactAccepted } from "@/server/hire-emails";
import { mediaSrc, messageWords } from "@/components/phone/messages/data";
import type { FoundMessage } from "@/components/phone/messages/types";

/**
 * The gestures of Messages on the phone (Modèle B, lot B8). Order of CLAUDE.md: validate →
 * session → limit → service. Each one answers with a small result the screen turns into a toast;
 * nothing throws to the page. A talent writes only to their connections and to the organizations
 * that wrote to them (`connect.ts`); Orbi only proposes a text, the person sends it or not.
 */
export type MsgError =
  "invalid" | "notFound" | "blocked" | "tooMany" | "type" | "size" | "empty" | "needsAi" | "failed";
export type MsgResult<T = null> = { ok: true; value: T } | { ok: false; error: MsgError };

const PAGE = "/app/messages";
const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);

const fail = (error: unknown, what: string): { ok: false; error: MsgError } => {
  if (error instanceof ConnectError)
    return { ok: false, error: error.code === "blocked" ? "blocked" : error.code };
  if (error instanceof MediaError) return { ok: false, error: error.code };
  if (error instanceof ConnectionError) return { ok: false, error: "notFound" };
  void reportError(error, { message: `Messages · ${what}` });
  return { ok: false, error: "failed" };
};

/** Sends one message as the talent, then tells the other side (notifications, e-mails). */
async function send(
  conversationId: string,
  what: string,
  build: (userId: string) => Promise<SentMessage>,
): Promise<MsgResult> {
  const parsed = idSchema.safeParse(conversationId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/${parsed.data}`);
  if (!(await allowAttempt("message", user.id))) return { ok: false, error: "tooMany" };
  try {
    const sent = await build(user.id);
    // The notifications and e-mails leave after the answer: the message shows at once.
    after(() =>
      onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error)),
    );
  } catch (error) {
    return fail(error, what);
  }
  refresh();
  return { ok: true, value: null };
}

const sendAs = (
  userId: string,
  conversationId: string,
  input: { body: string; kind?: MessageKind; payload?: Prisma.InputJsonObject },
) => sendMessage(db, { userId }, conversationId, input);

/** A written message. */
export async function sendTextAction(conversationId: string, body: string) {
  const text = z.string().trim().min(1).max(4000).safeParse(body);
  if (!text.success) return { ok: false, error: "empty" } as const;
  return send(conversationId, "texte", (userId) =>
    sendAs(userId, conversationId, { body: text.data }),
  );
}

const fileOf = (value: FormDataEntryValue | null) => (value instanceof File ? value : null);
const bytesOf = async (file: File) => new Uint8Array(await file.arrayBuffer());

/** One to four photos, already reduced on the phone; re-encoded here without their metadata. */
export async function sendPhotosAction(formData: FormData) {
  const conversationId = String(formData.get("conversation") ?? "");
  const hd = formData.get("hd") === "1";
  const files = formData
    .getAll("photo")
    .filter((value): value is File => value instanceof File)
    .slice(0, 4);
  if (files.length === 0) return { ok: false, error: "empty" } as const;
  if (files.some((file) => file.size > PHOTO_MAX_BYTES))
    return { ok: false, error: "size" } as const;
  const caption = z
    .string()
    .trim()
    .max(1000)
    .catch("")
    .parse(formData.get("caption") ?? "");
  const t = await getTranslations("phoneMsg");
  return send(conversationId, "photos", async (userId) => {
    const stored = [];
    for (const file of files)
      stored.push(await storePhoto(db, conversationId, await bytesOf(file), hd));
    const sent = await sendAs(userId, conversationId, {
      body: t("preview.photos", { count: stored.length }),
      kind: "image",
      payload: { files: stored, hd },
    });
    if (caption) await sendAs(userId, conversationId, { body: caption });
    return sent;
  });
}

/** A voice note recorded in the conversation. */
export async function sendVoiceAction(formData: FormData) {
  const conversationId = String(formData.get("conversation") ?? "");
  const file = fileOf(formData.get("voice"));
  const seconds = Number(formData.get("seconds") ?? 0);
  if (!file || !Number.isFinite(seconds)) return { ok: false, error: "empty" } as const;
  const t = await getTranslations("phoneMsg");
  return send(conversationId, "note vocale", async (userId) => {
    const stored = await storeVoice(db, conversationId, await bytesOf(file), seconds);
    return sendAs(userId, conversationId, {
      body: t("preview.voice", {
        duration: `${Math.floor(stored.seconds / 60)}:${String(stored.seconds % 60).padStart(2, "0")}`,
      }),
      kind: "voice",
      payload: stored,
    });
  });
}

/** A PDF or an image taken from the phone (« Documents · Sur ce téléphone »). */
export async function sendUploadAction(formData: FormData) {
  const conversationId = String(formData.get("conversation") ?? "");
  const file = fileOf(formData.get("file"));
  if (!file) return { ok: false, error: "empty" } as const;
  return send(conversationId, "document", async (userId) => {
    const upload = await storeUpload(db, conversationId, await bytesOf(file), file.name);
    return sendAs(userId, conversationId, {
      body: upload.name,
      kind: "file",
      payload: { upload },
    });
  });
}

/** One of the talent's CVs, letters or documents: a frozen copy (`sendDocument`). */
export async function sendOwnDocumentAction(conversationId: string, documentId: string) {
  const document = idSchema.safeParse(documentId);
  if (!document.success) return { ok: false, error: "invalid" } as const;
  return send(conversationId, "document Jumanly", (userId) =>
    sendDocument(db, { userId }, conversationId, document.data),
  );
}

/** « Attestation » (Chat v2): the attestation of a course the talent finished, with its number. */
export async function sendCertificateAction(conversationId: string, certificateId: string) {
  const certificate = idSchema.safeParse(certificateId);
  if (!certificate.success) return { ok: false, error: "invalid" } as const;
  return send(conversationId, "attestation", async (userId) => {
    const row = await db.certificate.findFirst({
      where: { id: certificate.data, revokedAt: null, enrollment: { userId } },
      select: { code: true, courseTitle: true, hours: true },
    });
    if (!row) throw new ConnectError("notFound");
    return sendAs(userId, conversationId, {
      body: row.courseTitle,
      kind: "file",
      payload: { certificate: { code: row.code, title: row.courseTitle, hours: row.hours } },
    });
  });
}

/** « Proposer un rendez-vous »: a day of the calendar, several hours and how (a slot card). */
export async function sendRdvAction(conversationId: string, raw: z.input<typeof meetingSchema>) {
  const parsed = meetingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" } as const;
  const t = await getTranslations("phoneMsg");
  return send(conversationId, "rendez-vous", (userId) =>
    sendMeeting(db, { userId }, conversationId, parsed.data, t(`agenda.mode.${parsed.data.mode}`)),
  );
}

/** « Transférer » a photo, a document or a card into another conversation of the talent. */
export async function forwardAction(from: string, messageId: string, to: string) {
  const source = idSchema.safeParse(from);
  const message = idSchema.safeParse(messageId);
  if (!source.success || !message.success) return { ok: false, error: "invalid" } as const;
  return send(to, "transfert", async (userId) => {
    const original = await visibleMessage(db, userId, source.data, message.data);
    if (
      original.kind === "system" ||
      original.kind === "invitation" ||
      original.kind === "decision"
    )
      throw new ConnectError("invalid");
    return sendAs(userId, to, {
      body: original.body,
      kind: original.kind,
      payload: (original.payload ?? {}) as Prisma.InputJsonObject,
    });
  });
}

async function settle<T>(
  conversationId: string,
  what: string,
  task: (userId: string, id: string) => Promise<T>,
): Promise<MsgResult<T>> {
  const parsed = idSchema.safeParse(conversationId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/${parsed.data}`);
  try {
    const value = await task(user.id, parsed.data);
    refresh();
    return { ok: true, value };
  } catch (error) {
    return fail(error, what);
  }
}

/** « Mode silencieux »: the messages arrive, the person is not told. */
export async function muteAction(conversationId: string, muted: boolean) {
  return settle(conversationId, "silencieux", (userId, id) =>
    setMuted(db, userId, id, Boolean(muted)),
  );
}

/** « Messages éphémères » between two connections. */
export async function ephemeralAction(conversationId: string, seconds: number | null) {
  if (seconds !== null && !(ephemeralChoices as readonly number[]).includes(seconds))
    return { ok: false, error: "invalid" } as const;
  const user = await requireUser(PAGE);
  const t = await getTranslations("phoneMsg.ephemeral");
  const words = await messageWords({ showPresence: false });
  const line = seconds
    ? t("lineOn", { name: user.firstName || user.name, duration: words.ephemeralLabel(seconds) })
    : t("lineOff", { name: user.firstName || user.name });
  return settle(conversationId, "éphémères", (userId, id) =>
    setEphemeral(db, userId, id, seconds, line),
  );
}

/** « Effacer la discussion »: for this person only. */
export async function clearAction(conversationId: string) {
  return settle(conversationId, "effacer", (userId, id) => clearConversation(db, userId, id));
}

/** « Bloquer » and « Débloquer » (a connection, or an organization's messages). */
export async function blockPhoneAction(conversationId: string, blocked: boolean) {
  return settle(conversationId, "bloquer", (userId, id) =>
    blockConversation(db, { userId }, id, Boolean(blocked)),
  );
}

/** « Accepter » a connection request: the conversation between the two opens. */
export async function acceptRequestAction(connectionId: string): Promise<MsgResult<string>> {
  const parsed = idSchema.safeParse(connectionId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/connexions`);
  try {
    const conversationId = await acceptConnection(db, user.id, parsed.data);
    refresh();
    return { ok: true, value: conversationId };
  } catch (error) {
    return fail(error, "accepter");
  }
}

/** « Ignorer »: the person is not told. */
export async function ignoreRequestAction(connectionId: string): Promise<MsgResult> {
  const parsed = idSchema.safeParse(connectionId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/connexions`);
  try {
    await ignoreConnection(db, user.id, parsed.data);
    refresh();
    return { ok: true, value: null };
  } catch (error) {
    return fail(error, "ignorer");
  }
}

/** « Annuler » a request I sent (Connexions of the Chat): the person is not told. */
export async function withdrawRequestAction(connectionId: string): Promise<MsgResult> {
  const parsed = idSchema.safeParse(connectionId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/connexions`);
  try {
    await removeConnection(db, user.id, parsed.data);
    refresh();
    return { ok: true, value: null };
  } catch (error) {
    return fail(error, "annuler");
  }
}

/** An organization asking to talk (E8 contact request): accepted or declined. */
export async function respondOrgRequestAction(
  requestId: string,
  accept: boolean,
): Promise<MsgResult<string | null>> {
  const parsed = idSchema.safeParse(requestId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/connexions`);
  try {
    const result = await respondContactRequest(
      db,
      user.id,
      parsed.data,
      accept ? "accept" : "decline",
    );
    if (result.status === "accepted") {
      const request = await db.contactRequest.findFirstOrThrow({
        where: { conversationId: result.conversationId },
        select: { requester: { select: { email: true, firstName: true } } },
      });
      await mailContactAccepted(request.requester, {
        candidateName: user.name,
        href: `/app/messages/${result.conversationId}`,
      }).catch((error) => reportError(error));
      refresh();
      return { ok: true, value: result.conversationId };
    }
    refresh();
    return result.status === "declined"
      ? { ok: true, value: null }
      : { ok: false, error: "notFound" };
  } catch (error) {
    return fail(error, "demande d'entreprise");
  }
}

/** « Nouveau message » to a connection: its conversation, opened if needed. */
export async function openConnectionAction(connectionId: string): Promise<MsgResult<string>> {
  const parsed = idSchema.safeParse(connectionId);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    return { ok: true, value: await ensurePeerConversation(db, user.id, parsed.data) };
  } catch (error) {
    return fail(error, "nouveau message");
  }
}

/** Orbi helps to write (planche Messages-orbi): a text the person reads, changes and sends. */
export async function messageHelpAction(raw: {
  conversationId: string;
  mode: (typeof helpModes)[number];
  draft: string;
  again: boolean;
}): Promise<HelpResult> {
  const user = await requireUser(PAGE);
  const t = await getTranslations("phoneMsg.help.template");
  const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
  try {
    return await messageHelp(db, user.id, raw, {
      reply: ({ firstName, peer }) => t("reply", { firstName, peer: peer ? "yes" : "no" }),
      replyAgain: ({ firstName, peer }) =>
        t("replyAgain", { firstName, peer: peer ? "yes" : "no" }),
      pro: ({ firstName, text, me }) => t("pro", { firstName, text: lower(text), me }),
      proEmpty: ({ firstName, me }) => t("proEmpty", { firstName, me }),
      shortEmpty: t("shortEmpty"),
    });
  } catch (error) {
    void reportError(error, { message: "Messages · Orbi" });
    return { ok: false, error: "invalid" };
  }
}

const searchSchema = z.object({
  query: z.string().max(80),
  type: z.enum(searchTypes).nullable(),
});

/** The search of the tab: the messages that contain a word, or of one kind. */
export async function searchMessagesAction(
  query: string,
  type: string | null,
): Promise<MsgResult<FoundMessage[]>> {
  const parsed = searchSchema.safeParse({ query, type });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser(PAGE);
  try {
    const [rows, words] = await Promise.all([
      searchMessages(db, user.id, parsed.data),
      messageWords({ showPresence: false }),
    ]);
    return {
      ok: true,
      value: rows.flatMap((row): FoundMessage[] => {
        const base = {
          conversationId: row.conversationId,
          messageId: row.id,
          time: words.when(row.createdAt),
          text: words.preview(row, user.id, ""),
        };
        // Each photo of a message is one tile of « Photos ».
        if (row.kind === "image" && parsed.data.type === "photos") {
          const files = ((row.payload ?? {}) as { files?: unknown[] }).files ?? [];
          return files.map((_, index) => ({
            ...base,
            messageId: `${row.id}:${index}`,
            photo: mediaSrc(row.conversationId, row.id, index),
          }));
        }
        return [{ ...base, photo: null }];
      }),
    };
  } catch (error) {
    return fail(error, "recherche");
  }
}
