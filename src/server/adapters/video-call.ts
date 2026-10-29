/**
 * Calls of the Chat behind an interface (CLAUDE.md, conventions; docs/chat-v2 § Appel vidéo).
 *
 * - « webrtc » (the default): the two phones talk directly, in audio or in video. The server only
 *   passes their connection descriptions while it rings; it never sees the voice or the image.
 *   The phones find each other through STUN servers, and through a TURN relay when one is set
 *   (`CALL_TURN_URLS`, `CALL_TURN_USERNAME`, `CALL_TURN_CREDENTIAL`): needed when both sides sit
 *   behind a mobile operator that hides them.
 * - « fake » (`VIDEO_CALL_PROVIDER=fake`, local and tests only, never in production): no media,
 *   « the other side » picks up after a short ring, enough to try the whole screen alone.
 *
 * Nothing is recorded by either. Decisions: docs/decisions/2026-10-27-chat-v2.md and
 * docs/decisions/2026-10-29-appels-reels.md.
 */
import { randomUUID } from "node:crypto";

export type CallRoom = {
  /** The provider's room for this call. */
  roomId: string;
  /** What the browser needs to join (empty for both providers). */
  token: string;
};

/** A STUN or TURN server, as `RTCPeerConnection` takes it. */
export type IceServer = { urls: string[]; username?: string; credential?: string };

export interface VideoCallProvider {
  readonly id: "fake" | "webrtc";
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

export class WebRtcVideoCallProvider implements VideoCallProvider {
  readonly id = "webrtc";
  readonly autoAnswerMs = null;
  async openRoom(callId: string): Promise<CallRoom> {
    return { roomId: `webrtc-${callId}`, token: "" };
  }
  async closeRoom() {}
}

let current: VideoCallProvider | null = null;

export function videoCallProvider(): VideoCallProvider {
  if (current) return current;
  const fake =
    process.env.VIDEO_CALL_PROVIDER === "fake" && process.env.VERCEL_ENV !== "production";
  current = fake ? new FakeVideoCallProvider() : new WebRtcVideoCallProvider();
  return current;
}

/** Public STUN servers: they only tell a phone its public address, nothing passes through them. */
const STUN = ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"];

/** The servers that help the two phones find each other (STUN, and TURN when it is set). */
export function iceServers(env: NodeJS.ProcessEnv = process.env): IceServer[] {
  const servers: IceServer[] = [{ urls: STUN }];
  const turn = (env.CALL_TURN_URLS ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => /^turns?:/.test(url));
  if (turn.length && env.CALL_TURN_USERNAME && env.CALL_TURN_CREDENTIAL)
    servers.push({
      urls: turn,
      username: env.CALL_TURN_USERNAME,
      credential: env.CALL_TURN_CREDENTIAL,
    });
  return servers;
}
