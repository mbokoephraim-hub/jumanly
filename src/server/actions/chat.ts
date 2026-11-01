"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { REACTIONS, reactToMessage, setPinned } from "@/server/services/chat";
import { chatSummary, type ChatSummary } from "@/server/services/chat-summary";
import { ConnectError } from "@/server/services/connect";
import { createReport } from "@/server/services/moderation";
import { shortName } from "@/components/phone/fil/data";
import { durationOf } from "@/components/phone/messages/data";

/**
 * The gestures of the talent's Chat (docs/chat-v2): react, pin, report, ask Orbi for the summary.
 * Order of CLAUDE.md: validate → session → service; each answers with a small result the screen
 * turns into a toast. Nothing is sent or decided on the person's behalf.
 */
export type ChatResult<T = null> =
  { ok: true; value: T } | { ok: false; error: "invalid" | "notFound" | "blocked" | "failed" };

const PAGE = "/app/messages";
const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);

function fail(
  error: unknown,
  what: string,
): { ok: false; error: "notFound" | "blocked" | "invalid" | "failed" } {
  if (error instanceof ConnectError) return { ok: false, error: error.code };
  void reportError(error, { message: `Chat · ${what}` });
  return { ok: false, error: "failed" };
}

/** A reaction under a message; the same one again takes it back. */
export async function reactAction(
  conversationId: string,
  messageId: string,
  emoji: string | null,
): Promise<ChatResult<string | null>> {
  const ids = z.tuple([idSchema, idSchema]).safeParse([conversationId, messageId]);
  const choice = z.enum(REACTIONS).nullable().safeParse(emoji);
  if (!ids.success || !choice.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/${ids.data[0]}`);
  try {
    const value = await reactToMessage(db, user.id, ids.data[0], ids.data[1], choice.data);
    refresh();
    return { ok: true, value };
  } catch (error) {
    return fail(error, "réaction");
  }
}

/** « Épingler la discussion » or take it off. */
export async function pinAction(conversationId: string, pinned: boolean): Promise<ChatResult> {
  const id = idSchema.safeParse(conversationId);
  if (!id.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/${id.data}`);
  try {
    await setPinned(db, user.id, id.data, Boolean(pinned));
    refresh();
    return { ok: true, value: null };
  } catch (error) {
    return fail(error, "épingler");
  }
}

const reportReasons = ["harassment", "scam", "spam", "inappropriate", "other"] as const;

/** « Signaler »: the team of Jumanly reads it; the other side is not told. */
export async function reportChatAction(
  conversationId: string,
  reason: string,
): Promise<ChatResult<"created" | "already">> {
  const id = idSchema.safeParse(conversationId);
  const why = z.enum(reportReasons).safeParse(reason);
  if (!id.success || !why.success) return { ok: false, error: "invalid" };
  const user = await requireUser(`${PAGE}/${id.data}`);
  const result = await createReport(db, user.id, {
    targetType: "conversation",
    targetId: id.data,
    reason: why.data,
  });
  if (result === "notFound") return { ok: false, error: "notFound" };
  return { ok: true, value: result };
}

/** « Orbi résume »: one sentence per unread conversation (golden rule n° 12 in the service). */
export async function chatSummaryAction(): Promise<ChatSummary> {
  const user = await requireUser(PAGE);
  const t = await getTranslations("phoneChat.orbi.template");
  try {
    return await chatSummary(db, user.id, {
      name: (item) =>
        item.counterpart.kind === "organization"
          ? shortName(item.counterpart.organization.name)
          : item.counterpart.person.firstName ||
            item.counterpart.person.name.split(/\s+/)[0] ||
            item.counterpart.person.name,
      line: (item, name) => {
        const last = item.last!;
        const payload = (last.payload ?? {}) as { seconds?: number };
        switch (last.kind) {
          case "voice":
            return t("voice", { name, duration: durationOf(payload.seconds ?? 0) });
          case "image":
            return t("photo", { name });
          case "file":
            return t("file", { name });
          case "invitation":
          case "slot":
            return t("interview", { name });
          case "document_request":
            return t("document", { name, document: last.body });
          case "text": {
            const words = last.body.replace(/\s+/g, " ").trim();
            return t("text", { name, text: words.length > 70 ? `${words.slice(0, 69)}…` : words });
          }
          default:
            return t("other", { name });
        }
      },
    });
  } catch (error) {
    void reportError(error, { message: "Chat · résumé" });
    return { lines: [], source: "none" };
  }
}
