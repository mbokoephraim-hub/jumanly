import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { snapshotPdf } from "@/server/pdf/snapshot";
import { ConnectError, getConversation } from "@/server/services/connect";

/** A CV sent in a conversation, for its two sides only. */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/messages/[id]/document/[messageId]">,
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
    const payload = message?.payload as { document?: unknown } | null | undefined;
    return snapshotPdf(payload?.document, "document.pdf");
  } catch (error) {
    if (error instanceof ConnectError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
