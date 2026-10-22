import { strToU8, zipSync } from "fflate";
import { NextResponse, type NextRequest } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ConnectError } from "@/server/services/connect";
import { mediaKeys } from "@/server/services/message-media";
import { phoneConversation } from "@/server/services/messages-phone";
import { fileStorage } from "@/server/storage";
import { shortName } from "@/components/phone/fil/data";

export const maxDuration = 30;

/** At most this much media in one .zip (the rest stays in the conversation). */
const ZIP_MAX_BYTES = 40 * 1024 * 1024;

const fileSafe = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "discussion";

/**
 * « Exporter la discussion » (Modèle B, lot B8, planche Messages-export): what this person still
 * sees of the conversation, as a text file, or as a .zip with the photos, voice notes and
 * documents (`?medias=1`). For the talent of the conversation only.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/messages/[id]/export">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const withMedia = request.nextUrl.searchParams.get("medias") === "1";
  try {
    const conversation = await phoneConversation(db, user.id, id);
    const t = await getTranslations("phoneMsg.export");
    const format = await getFormatter();
    const counterpart = conversation.item.counterpart;
    const other =
      counterpart.kind === "person"
        ? counterpart.person.name
        : shortName(counterpart.organization.name);
    const senderIds = [
      ...new Set(conversation.messages.map((message) => message.senderId).filter(Boolean)),
    ] as string[];
    const senders = await db.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true },
    });
    const nameOf = (senderId: string | null) =>
      senderId === null
        ? t("system")
        : (senders.find((sender) => sender.id === senderId)?.name ?? other);
    const files: Record<string, Uint8Array> = {};
    let total = 0;
    const lines = [t("fileTitle", { name: other }), ""];
    for (const message of conversation.messages) {
      const when = format.dateTime(message.createdAt, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      let text = message.body;
      if (withMedia) {
        const names: string[] = [];
        for (const [index, key] of mediaKeys(message.kind, message.payload).entries()) {
          const stored = key.startsWith("messages/") ? await fileStorage(db).get(key) : null;
          if (!stored || total + stored.bytes.byteLength > ZIP_MAX_BYTES) continue;
          total += stored.bytes.byteLength;
          const name = `medias/${message.createdAt.toISOString().slice(0, 10)}-${message.id}-${index + 1}.${key.split(".").pop()}`;
          files[name] = stored.bytes;
          names.push(name);
        }
        if (names.length) text = `${text} (${names.join(", ")})`;
      }
      lines.push(`[${when}] ${nameOf(message.senderId)} : ${text}`);
    }
    const base = `Discussion_${fileSafe(other)}`;
    const body = lines.join("\n") + "\n";
    if (!withMedia)
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${base}.txt"`,
          "Cache-Control": "private, no-store",
        },
      });
    const zip = zipSync({ [`${base}.txt`]: strToU8(body), ...files }, { level: 6 });
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${base}.zip"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ConnectError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
