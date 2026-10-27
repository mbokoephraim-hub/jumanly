import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { chatPulse, markTyping } from "@/server/services/chat";
import { ConnectError } from "@/server/services/connect";

const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);

const noStore = { "Cache-Control": "private, no-store" };

/**
 * The pulse of the Chat (docs/chat-v2, « temps réel »): asked every few seconds by the list and
 * by an open conversation. Says who types and who is online, and a version that changes when a
 * message, a reaction, a reading or a call arrives; the screen then reads itself again. A route
 * (not a server action) so that it never waits behind a message being sent.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401, headers: noStore });
  const asked = request.nextUrl.searchParams.get("c");
  const conversation = asked ? idSchema.safeParse(asked) : null;
  if (conversation && !conversation.success)
    return new NextResponse(null, { status: 400, headers: noStore });
  const pulse = await chatPulse(db, user.id, conversation?.data ?? null);
  return NextResponse.json(pulse, { headers: noStore });
}

/** A keystroke in the composer: `{ "c": "<conversation>" }`. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401, headers: noStore });
  const body = (await request.json().catch(() => null)) as { c?: unknown } | null;
  const conversation = idSchema.safeParse(body?.c);
  if (!conversation.success) return new NextResponse(null, { status: 400, headers: noStore });
  try {
    await markTyping(db, user.id, conversation.data);
  } catch (error) {
    if (error instanceof ConnectError)
      return new NextResponse(null, { status: 404, headers: noStore });
    throw error;
  }
  return new NextResponse(null, { status: 204, headers: noStore });
}
