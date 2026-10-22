import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { ConnectError, getConversation } from "@/server/services/connect";
import { mediaKeys } from "@/server/services/message-media";
import { fileStorage } from "@/server/storage";

/**
 * A photo, a voice note or a document sent from the phone (Modèle B, lot B8), for the two sides
 * of the conversation only. `?i=` picks a photo of the message; `?dl=1` downloads it.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/app/messages/[id]/media/[messageId]">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id, messageId } = await params;
  const space = await getActiveSpace(user.id);
  const hire = space
    ? { userId: user.id, organizationId: space.organizationId, role: space.role }
    : null;
  try {
    const conversation = await getConversation(db, { userId: user.id, hire }, id);
    const message = conversation.messages.find((item) => item.id === messageId && !item.hiddenAt);
    if (!message) return new NextResponse(null, { status: 404 });
    const index = Math.max(0, Number(request.nextUrl.searchParams.get("i") ?? 0) || 0);
    const key = mediaKeys(message.kind, message.payload)[index];
    if (!key || !key.startsWith(`messages/`)) return new NextResponse(null, { status: 404 });
    const stored = await fileStorage(db).get(key);
    if (!stored) return new NextResponse(null, { status: 404 });
    const name = (message.payload as { upload?: { name?: string } } | null)?.upload?.name;
    const extension = key.split(".").pop() ?? "bin";
    const fileName = name ?? `jumanly-${message.id}-${index + 1}.${extension}`;
    const plain = fileName.replace(/[^\w.-]+/g, "_");
    const download = request.nextUrl.searchParams.get("dl") === "1";
    return new NextResponse(new Uint8Array(stored.bytes), {
      headers: {
        "Content-Type": stored.contentType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${plain}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ConnectError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
