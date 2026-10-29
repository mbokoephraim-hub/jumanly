import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { iceServers, videoCallProvider } from "@/server/adapters/video-call";
import { getCurrentUser } from "@/server/auth/session";
import { initialsOf } from "@/components/phone/fil/data";
import { db } from "@/server/db";
import { ConnectError } from "@/server/services/connect";
import { callState, incomingCall } from "@/server/services/video-call";

const idSchema = z
  .string()
  .trim()
  .regex(/^[\w-]{1,60}$/);

const noStore = { "Cache-Control": "private, no-store" };

/**
 * The calls of the Chat, asked every few seconds in the whole signed-in space:
 * - without `?id=`: the call ringing for this person (who, audio or video, the caller's
 *   description), the servers that help the two phones find each other, and the provider;
 * - with `?id=`: where that call stands for one of its two sides (the caller reads the answer).
 * A route (not a server action) so that it never waits behind a message being sent.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401, headers: noStore });
  const asked = request.nextUrl.searchParams.get("id");
  if (asked !== null) {
    const id = idSchema.safeParse(asked);
    if (!id.success) return new NextResponse(null, { status: 400, headers: noStore });
    try {
      return NextResponse.json(await callState(db, user.id, id.data), { headers: noStore });
    } catch (error) {
      if (error instanceof ConnectError)
        return new NextResponse(null, { status: 404, headers: noStore });
      throw error;
    }
  }
  const call = await incomingCall(db, user.id);
  const incoming = call && {
    id: call.id,
    conversationId: call.conversationId,
    mode: call.mode,
    offer: call.offer,
    who: {
      name: call.caller.name,
      first: call.caller.firstName || call.caller.name.split(/\s+/)[0] || call.caller.name,
      initials: initialsOf(call.caller.name),
      image: call.caller.image,
    },
    me: { initials: initialsOf(user.name) },
  };
  return NextResponse.json(
    { incoming, ice: iceServers(), provider: videoCallProvider().id },
    { headers: noStore },
  );
}
