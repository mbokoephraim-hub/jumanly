/**
 * Video calls of the Chat behind an interface (CLAUDE.md, conventions; docs/chat-v2 § Appel
 * vidéo). Only the fake provider exists for now (`VIDEO_CALL_PROVIDER=fake`): it opens a
 * room that exists only in name, and « the other side » picks up after a short ring, enough to
 * try the whole call in local, in preview and in the tests. No provider records anything.
 * The choice is noted in docs/decisions/2026-10-27-chat-v2.md.
 */
import { randomUUID } from "node:crypto";

export type CallRoom = {
  /** The provider's room for this call. */
  roomId: string;
  /** What the browser needs to join (empty for the fake provider). */
  token: string;
};

export interface VideoCallProvider {
  readonly id: "fake";
  /** Opens a room for one call between two people. Nothing is recorded. */
  openRoom(callId: string): Promise<CallRoom>;
  /** Closes the room when one side hangs up. */
  closeRoom(roomId: string): Promise<void>;
  /** The fake provider answers after this delay (ms); a real one answers when the person does. */
  readonly autoAnswerMs: number | null;
}

export class FakeVideoCallProvider implements VideoCallProvider {
  readonly id = "fake";
  readonly autoAnswerMs = 2_600;
  async openRoom(callId: string): Promise<CallRoom> {
    return { roomId: `factice-${callId}-${randomUUID().slice(0, 8)}`, token: "" };
  }
  async closeRoom() {}
}

let current: VideoCallProvider | null = null;

export function videoCallProvider(): VideoCallProvider {
  if (current) return current;
  // Only the fake provider exists for now: a real one (LiveKit, Daily…) plugs in here.
  current = new FakeVideoCallProvider();
  return current;
}
