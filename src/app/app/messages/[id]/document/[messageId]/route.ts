import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { getActiveSpace } from "@/server/hire-context";
import { exportCvCopy } from "@/features/cv/export/export";
import { pdfFileName, renderTextPdf } from "@/server/pdf/text-document";
import { ConnectError, getConversation } from "@/server/services/connect";

export const maxDuration = 30;

/** A CV, a letter or a text sent in a conversation, for its two sides only. */
export async function GET(
  request: NextRequest,
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
    const payload = message?.payload as
      { document?: { type?: string; title?: string; text?: string } } | null | undefined;
    if (!message || !payload?.document) return new NextResponse(null, { status: 404 });
    // A letter or a text (prompt 5): printed as text, like « Télécharger en PDF » in Career.
    if (payload.document.type === "text") {
      const title = payload.document.title ?? "";
      const pdf = await renderTextPdf({ title, text: payload.document.text ?? "", footer: "" });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${pdfFileName(title, "document")}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    return exportCvCopy(
      "message",
      message.id,
      payload?.document,
      "document.pdf",
      request.nextUrl.origin,
    );
  } catch (error) {
    if (error instanceof ConnectError) return new NextResponse(null, { status: 404 });
    throw error;
  }
}
