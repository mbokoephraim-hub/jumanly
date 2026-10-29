"use client";

/**
 * The real call between two phones (WebRTC, docs/decisions/2026-10-29-appels-reels.md): the voice
 * and the image go directly from one phone to the other, encrypted; the server only passes the two
 * connection descriptions while it rings (`/app/appels`).
 *
 * Both sides always agree on one sound and one image channel, even for an audio call: turning the
 * camera on or off during the call then only swaps the image sent, without a new agreement. A
 * small data channel tells the other side whether the camera is on, and « au revoir » on hang-up.
 */

export type CallMode = "audio" | "video";
export type IceServer = { urls: string[]; username?: string; credential?: string };
export type CallState = {
  status: "ringing" | "active" | "ended" | "missed";
  answerMode: CallMode | null;
  answer: string | null;
};
export type Incoming = {
  id: string;
  conversationId: string;
  mode: CallMode;
  offer: string;
  who: { name: string; first: string; initials: string; image: string | null };
  me: { initials: string };
};

type Signal = { camera?: boolean; micro?: boolean; bye?: boolean };

export type Calls = { incoming: Incoming | null; ice: IceServer[]; provider: "fake" | "webrtc" };

/** The call ringing for me, the servers that help the phones find each other, the provider. */
export async function readCalls(): Promise<Calls> {
  const response = await fetch("/app/appels", { cache: "no-store" });
  if (!response.ok) throw new Error(`appels ${response.status}`);
  return (await response.json()) as Calls;
}

/** Where one call stands; null on a cut network (the next try asks again). */
export async function readCall(callId: string): Promise<CallState | null> {
  try {
    const response = await fetch(`/app/appels?id=${encodeURIComponent(callId)}`, {
      cache: "no-store",
    });
    if (response.status === 404) return { status: "ended", answerMode: null, answer: null };
    if (!response.ok) return null;
    return (await response.json()) as CallState;
  } catch {
    return null;
  }
}

/** Light enough for a slow network, sharp enough for a face. */
const CAMERA: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 24, max: 30 },
};

/** The microphone, and the camera for a video call. Throws when the person refuses. */
export async function openMedia(mode: CallMode) {
  return navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    video: mode === "video" ? CAMERA : false,
  });
}

/** Whether this browser can call at all. */
export function canCall() {
  return (
    typeof window !== "undefined" &&
    typeof RTCPeerConnection !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/** Waits until the phone knows its ways to be reached (at most a few seconds). */
function gathered(pc: RTCPeerConnection, maxMs = 3_500) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    const timer = setTimeout(done, maxMs);
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export class CallLink {
  readonly pc: RTCPeerConnection;
  readonly remote = new MediaStream();
  private channel: RTCDataChannel | null = null;
  private videoSender: RTCRtpSender | null = null;
  private cameraOn = false;
  /** The other side turned its camera on or off, or hung up. */
  onSignal: (signal: Signal) => void = () => undefined;
  /** The remote sound or image arrived. */
  onTrack: () => void = () => undefined;
  /** The connection between the two phones: « connected », « failed »… */
  onState: (state: RTCPeerConnectionState) => void = () => undefined;

  constructor(
    ice: IceServer[],
    readonly local: MediaStream,
  ) {
    this.pc = new RTCPeerConnection({ iceServers: ice });
    this.cameraOn = local.getVideoTracks().length > 0;
    this.pc.ontrack = (event) => {
      if (!this.remote.getTracks().includes(event.track)) this.remote.addTrack(event.track);
      this.onTrack();
    };
    this.pc.onconnectionstatechange = () => this.onState(this.pc.connectionState);
    this.pc.ondatachannel = (event) => this.listen(event.channel);
  }

  private listen(channel: RTCDataChannel) {
    this.channel = channel;
    channel.onopen = () => this.say({ camera: this.cameraOn });
    channel.onmessage = (event) => {
      try {
        this.onSignal(JSON.parse(String(event.data)) as Signal);
      } catch {
        // Not a signal of Jumanly: ignored.
      }
    };
  }

  private say(signal: Signal) {
    if (this.channel?.readyState === "open") this.channel.send(JSON.stringify(signal));
  }

  /** The caller: one sound and one image channel, and the description to send. */
  async offer() {
    const audio = this.local.getAudioTracks()[0];
    if (audio) this.pc.addTrack(audio, this.local);
    const video = this.local.getVideoTracks()[0] ?? null;
    const transceiver = this.pc.addTransceiver(video ?? "video", {
      direction: "sendrecv",
      streams: [this.local],
    });
    this.videoSender = transceiver.sender;
    this.listen(this.pc.createDataChannel("etat"));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await gathered(this.pc);
    return JSON.stringify(this.pc.localDescription);
  }

  /** The person called: takes the caller's description and gives its own. */
  async answer(offer: string) {
    await this.pc.setRemoteDescription(JSON.parse(offer) as RTCSessionDescriptionInit);
    for (const transceiver of this.pc.getTransceivers()) {
      const kind = transceiver.receiver.track.kind;
      const track =
        (kind === "audio" ? this.local.getAudioTracks()[0] : this.local.getVideoTracks()[0]) ??
        null;
      transceiver.direction = "sendrecv";
      await transceiver.sender.replaceTrack(track);
      if (track) transceiver.sender.setStreams?.(this.local);
      if (kind === "video") this.videoSender = transceiver.sender;
    }
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await gathered(this.pc);
    return JSON.stringify(this.pc.localDescription);
  }

  /** The caller: the answer arrived, the two phones connect. */
  async accept(answer: string) {
    if (this.pc.signalingState !== "have-local-offer") return;
    await this.pc.setRemoteDescription(JSON.parse(answer) as RTCSessionDescriptionInit);
  }

  setMicro(on: boolean) {
    for (const track of this.local.getAudioTracks()) track.enabled = on;
    this.say({ micro: on });
  }

  /** Turns the camera on (asking for it if the call started in audio) or off. */
  async setCamera(on: boolean) {
    if (on) {
      let track = this.local.getVideoTracks()[0];
      if (!track) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: CAMERA });
        track = stream.getVideoTracks()[0]!;
        this.local.addTrack(track);
      }
      track.enabled = true;
      await this.videoSender?.replaceTrack(track);
    } else {
      // The camera light goes off: the track is let go, not only hidden.
      await this.videoSender?.replaceTrack(null);
      for (const track of this.local.getVideoTracks()) {
        track.stop();
        this.local.removeTrack(track);
      }
    }
    this.cameraOn = on;
    this.say({ camera: on });
    return on;
  }

  close(sayBye: boolean) {
    if (sayBye) this.say({ bye: true });
    // The goodbye leaves before the channel closes.
    setTimeout(() => this.pc.close(), sayBye ? 150 : 0);
    for (const track of this.local.getTracks()) track.stop();
  }
}
