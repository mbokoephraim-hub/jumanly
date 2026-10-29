"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type RefObject } from "react";
import { showToast } from "@/components/motion/toaster";
import { RING_MAX_MS, callClock, durationParts } from "@/lib/call-duration";
import {
  acceptCallAction,
  answerCallAction,
  endCallAction,
  startCallAction,
} from "@/server/actions/chat";
import { WhoAvatar } from "./parts";
import {
  CallLink,
  canCall,
  openMedia,
  readCall,
  readCalls,
  type CallMode,
  type IceServer,
  type Incoming,
} from "./rtc";
import type { ThreadView, WhoView } from "./types";

const VIDEO = "M3.5 7.5h11v9h-11zM14.5 10.5l6-3v9l-6-3";
const PHONE =
  "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2";

function Glyph({ d, size = 22, stroke = 2.1 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

/** The video icon of the head (planche Chat-conv). */
export function VideoGlyph() {
  return <Glyph d={VIDEO} size={20} stroke={2} />;
}

/** The telephone of the head: an audio call. */
export function AudioGlyph() {
  return <Glyph d={PHONE} size={19} stroke={2} />;
}

/**
 * « Souhaitez-vous appeler {nom} en vidéo ? » (planche Chat-video), or « en audio ? »: a small
 * window, « Non » and « Oui, appeler ». Nothing starts before « Oui ».
 */
export function CallConfirm({
  view,
  open,
  mode,
  online,
  onClose,
  onCall,
}: {
  view: ThreadView;
  open: boolean;
  mode: CallMode;
  online: boolean;
  onClose: () => void;
  onCall: () => void;
}) {
  const t = useTranslations("phoneChat.call");
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="nb-ch-appeler"
      aria-labelledby="nb-ch-appeler-t"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="nb-ch-appeler-c">
        <WhoAvatar who={{ ...view.who, online }} size={84} />
        <p id="nb-ch-appeler-t" className="nb-ch-appeler-q">
          {t(mode === "audio" ? "askAudio" : "ask", { name: view.who.name })}
        </p>
        <p className="nb-ch-appeler-n">
          {online ? t("noteOnline", { name: view.who.first }) : t("note")}
        </p>
        <div className="nb-ch-appeler-b">
          <button type="button" className="nb-ch-non" onClick={onClose}>
            {t("no")}
          </button>
          <button type="button" className="nb-ch-oui" onClick={onCall}>
            <Glyph d={mode === "audio" ? PHONE : VIDEO} size={18} stroke={2.2} />
            {t("yes")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

const CONTROLS = [
  [
    "micro",
    (off: boolean) =>
      `M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3${off ? "M4 4l16 16" : ""}`,
  ],
  ["camera", (off: boolean) => `${VIDEO}${off ? "M3 4l17 16" : ""}`],
  [
    "speaker",
    (off: boolean) =>
      `M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11${off ? "M3 4l17 16" : ""}`,
  ],
] as const;

type Phase = "ringing" | "connecting" | "active";
type End = "hangup" | "remote" | "declined" | "failed" | "denied" | "unsupported" | "lost";

/** How the call starts: I call from a conversation, or I answer a call ringing for me. */
export type CallSide =
  | { role: "caller"; conversationId: string; mode: CallMode }
  | { role: "callee"; call: Incoming; mode: CallMode; ice: IceServer[] };

/** The person on the other side, drawn like a face of the Chat. */
export type CallPeer = { who: WhoView; me: { initials: string }; line: string };

/** A face of the Chat from the few words of a call ringing for me. */
export function peerOf(call: Incoming): CallPeer {
  return {
    who: {
      ...call.who,
      tone: 0,
      org: false,
      verified: false,
      online: false,
      line: "",
      status: "",
      href: null,
      personId: null,
      ring: [],
    },
    me: call.me,
    line: "",
  };
}

/** Attaches a stream to a <video> or <audio> element, once it is there. */
function useStream(
  ref: RefObject<HTMLMediaElement | null>,
  stream: MediaStream | null,
  shown = true,
) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !stream || !shown) return;
    if (node.srcObject !== stream) node.srcObject = stream;
    void node.play().catch(() => undefined);
  }, [ref, stream, shown]);
}

/**
 * The call on the whole screen (planches Chat-appel, Chat-video-connecte), in audio or in video:
 * « Chiffré de bout en bout », the face with the Lime wave while it rings, « Appel en cours… »,
 * then the timer in mint, or the other person's image when their camera is on, with mine in the
 * small tile; Micro, Caméra, Haut-parleur (cut = cream circle) and « Raccrocher » in coral.
 * The voice and the image go directly from phone to phone (`rtc.ts`); nothing is recorded.
 * Back in the conversation: « Appel terminé · durée ».
 */
export function CallScreen({
  peer,
  side,
  onEnd,
}: {
  peer: CallPeer;
  side: CallSide;
  /** The call is over (hung up, refused or not answered). */
  onEnd: () => void;
}) {
  const t = useTranslations("phoneChat");
  const [callId, setCallId] = useState<string | null>(side.role === "callee" ? side.call.id : null);
  const [phase, setPhase] = useState<Phase>(side.role === "caller" ? "ringing" : "connecting");
  const [seconds, setSeconds] = useState(0);
  const [off, setOff] = useState({
    micro: false,
    camera: side.mode === "audio",
    speaker: false,
  });
  const [real, setReal] = useState(false);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [remoteCamera, setRemoteCamera] = useState(
    side.role === "callee" ? side.call.mode === "video" : false,
  );
  const [video, setVideo] = useState(0);
  const ended = useRef(false);
  const answeredAt = useRef<number | null>(null);
  const idRef = useRef<string | null>(side.role === "callee" ? side.call.id : null);
  const link = useRef<CallLink | null>(null);
  const hangUp = useRef<(reason?: End) => void>(() => undefined);
  const started = useRef(false);
  const leaving = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timers = useRef<{
    give?: ReturnType<typeof setTimeout>;
    answer?: ReturnType<typeof setTimeout>;
    poll?: ReturnType<typeof setInterval>;
  }>({});
  const hangButton = useRef<HTMLButtonElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const name = peer.who.name;

  const finish = async (reason: End) => {
    if (ended.current) return;
    ended.current = true;
    clearTimeout(timers.current.give);
    clearTimeout(timers.current.answer);
    clearInterval(timers.current.poll);
    const id = idRef.current;
    const spoken = answeredAt.current ? (Date.now() - answeredAt.current) / 1000 : null;
    link.current?.close(reason === "hangup");
    onEnd();
    if (id) await endCallAction(id).catch(() => null);
    if (
      reason === "failed" ||
      reason === "denied" ||
      reason === "unsupported" ||
      reason === "lost"
    ) {
      showToast({ message: t(`call.${reason}`), tone: "error" });
      return;
    }
    if (reason === "declined") {
      showToast({ message: t("call.declined", { name: peer.who.first }) });
      return;
    }
    if (spoken === null) {
      showToast({ message: t("call.cancelled") });
      return;
    }
    const parts = durationParts(spoken);
    showToast({ message: t("call.ended", { duration: t(`duration.${parts.key}`, parts.values) }) });
  };
  useEffect(() => {
    hangUp.current = (reason = "hangup") => void finish(reason);
  });

  const answered = () => {
    if (answeredAt.current === null) answeredAt.current = Date.now();
    setPhase("active");
  };

  /** The two phones, joined: the other side's sound and image, their camera, the goodbye. */
  const join = (current: CallLink) => {
    link.current = current;
    setReal(true);
    setLocal(current.local);
    current.onTrack = () => {
      setRemote(current.remote);
      setVideo((count) => count + 1);
    };
    current.onSignal = (signal) => {
      if (signal.bye) hangUp.current("remote");
      if (signal.camera !== undefined) setRemoteCamera(signal.camera);
    };
    current.onState = (state) => {
      if (state === "connected") answered();
      if (state === "failed") hangUp.current("lost");
    };
  };

  // « Oui, appeler » or « Accepter »: the call starts, once per opening of this screen (the
  // timers end with the call, in `finish`).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const run = timers.current;
    hangButton.current?.focus();

    const fake = async (conversationId: string) => {
      const result = await startCallAction(conversationId, side.mode, null).catch(() => null);
      if (ended.current) {
        if (result?.ok) void endCallAction(result.value.callId);
        return;
      }
      if (!result?.ok) return hangUp.current("failed");
      idRef.current = result.value.callId;
      setCallId(result.value.callId);
      run.give = setTimeout(() => hangUp.current(), RING_MAX_MS);
      if (result.value.autoAnswerMs !== null)
        run.answer = setTimeout(() => {
          void answerCallAction(result.value.callId).then((done) => {
            if (ended.current || !done.ok) return;
            clearTimeout(run.give);
            answered();
          });
        }, result.value.autoAnswerMs);
    };

    const call = async (conversationId: string) => {
      const calls = await readCalls().catch(() => null);
      if (ended.current) return;
      if (!calls) return hangUp.current("failed");
      if (calls.provider === "fake") return fake(conversationId);
      if (!canCall()) return hangUp.current("unsupported");
      const media = await openMedia(side.mode).catch(() => null);
      if (!media) return hangUp.current("denied");
      if (ended.current) {
        for (const track of media.getTracks()) track.stop();
        return;
      }
      const current = new CallLink(calls.ice, media);
      join(current);
      const offer = await current.offer();
      const result = await startCallAction(conversationId, side.mode, offer).catch(() => null);
      if (ended.current) {
        if (result?.ok) void endCallAction(result.value.callId);
        return;
      }
      if (!result?.ok) return hangUp.current("failed");
      idRef.current = result.value.callId;
      setCallId(result.value.callId);
      run.give = setTimeout(() => {
        if (answeredAt.current === null) hangUp.current("declined");
      }, RING_MAX_MS);
      // The other side's answer, then where the call stands: hung up there, the screen closes.
      run.poll = setInterval(async () => {
        const state = await readCall(result.value.callId);
        if (!state || ended.current) return;
        if (state.status === "ended" || state.status === "missed")
          return hangUp.current(answeredAt.current === null ? "declined" : "remote");
        if (state.status === "active" && state.answer && current.pc.remoteDescription === null) {
          clearTimeout(run.give);
          setPhase("connecting");
          // Answered in audio: my camera goes off too, it is an audio call.
          if (state.answerMode === "audio" && side.mode === "video") {
            void current.setCamera(false);
            setOff((now) => ({ ...now, camera: true }));
          }
          setRemoteCamera(state.answerMode === "video");
          await current.accept(state.answer).catch(() => hangUp.current("lost"));
        }
      }, 1_500);
    };

    const pickUp = async (incoming: Incoming, ice: IceServer[]) => {
      if (!canCall()) return hangUp.current("unsupported");
      const media = await openMedia(side.mode).catch(() => null);
      if (!media) return hangUp.current("denied");
      if (ended.current) {
        for (const track of media.getTracks()) track.stop();
        return;
      }
      const current = new CallLink(ice, media);
      join(current);
      const description = await current.answer(incoming.offer).catch(() => null);
      if (!description) return hangUp.current("lost");
      const result = await acceptCallAction(incoming.id, side.mode, description).catch(() => null);
      if (ended.current) return;
      if (!result?.ok) return hangUp.current("failed");
      run.poll = setInterval(async () => {
        const state = await readCall(incoming.id);
        if (state && (state.status === "ended" || state.status === "missed"))
          hangUp.current("remote");
      }, 3_000);
      // Without a connection after a while, the call is given up.
      run.give = setTimeout(() => {
        if (answeredAt.current === null) hangUp.current("lost");
      }, 25_000);
    };

    if (side.role === "caller") void call(side.conversationId);
    else void pickUp(side.call, side.ice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving the conversation or closing the tab hangs up (not the quick remount of development).
  useEffect(() => {
    clearTimeout(leaving.current);
    const leave = () => hangUp.current();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      leaving.current = setTimeout(() => hangUp.current(), 0);
    };
  }, []);

  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(
      () => setSeconds(answeredAt.current ? (Date.now() - answeredAt.current) / 1000 : 0),
      500,
    );
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hangUp.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showRemote = real && remoteCamera && phase === "active" && remote !== null;
  const showLocal = real && !off.camera && local !== null;
  useStream(remoteVideo, remote, showRemote);
  useStream(remoteAudio, remote);
  useStream(localVideo, local, showLocal);
  useEffect(() => {
    // A new image track arrived: the element reads the stream again.
    void remoteVideo.current?.play().catch(() => undefined);
  }, [video]);
  useEffect(() => {
    if (remoteAudio.current) remoteAudio.current.muted = off.speaker;
  }, [off.speaker]);

  const toggle = async (key: "micro" | "camera" | "speaker") => {
    const next = !off[key];
    if (key === "micro") link.current?.setMicro(!next);
    if (key === "camera" && link.current) {
      const ok = await link.current.setCamera(!next).catch(() => false);
      if (!next && !ok) {
        showToast({ message: t("call.denied"), tone: "error" });
        return;
      }
    }
    setOff((current) => ({ ...current, [key]: next }));
  };

  const ringing = phase !== "active";
  const audio = side.mode === "audio";
  return (
    <div
      className="nb-ch-appel"
      role="dialog"
      aria-modal="true"
      aria-label={t(audio ? "call.labelAudio" : "call.label", { name })}
      data-appel={callId ?? undefined}
      data-video={showRemote ? "" : undefined}
    >
      <svg
        className="nb-ch-appel-o"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMin slice"
        aria-hidden
      >
        <g fill="none" stroke="#C3A6FF" strokeOpacity=".12" strokeWidth="18">
          <circle cx="195" cy="330" r="120" />
          <circle cx="195" cy="330" r="190" />
          <circle cx="195" cy="330" r="260" />
        </g>
      </svg>
      {real ? (
        <>
          <video
            ref={remoteVideo}
            className="nb-ch-appel-v"
            hidden={!showRemote}
            muted
            playsInline
            autoPlay
            aria-label={t("call.theirImage", { name })}
          />
          {/* Their voice: never shown, always heard (unless « Haut-parleur » is cut). */}
          <audio ref={remoteAudio} autoPlay />
        </>
      ) : null}
      <span className="nb-ch-chiffre">
        <Glyph d="M6.5 10.5h11v9h-11zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" size={13} stroke={2.2} />
        {t("call.encrypted")}
      </span>
      <div className="nb-ch-moi" data-off={off.camera ? "" : undefined}>
        {showLocal ? (
          <video ref={localVideo} className="nb-ch-moi-v" muted playsInline autoPlay />
        ) : (
          <span aria-hidden>{peer.me.initials}</span>
        )}
        <b>{t("call.you")}</b>
      </div>
      <div className="nb-ch-appel-qui">
        <span className="nb-ch-appel-av" data-sonne={ringing ? "" : undefined}>
          <WhoAvatar who={{ ...peer.who, online: false }} size={150} />
        </span>
        <b>{name}</b>
        <span className="nb-ch-appel-s" data-actif={ringing ? undefined : ""} aria-live="polite">
          {ringing ? (
            <>
              {t(phase === "connecting" ? "call.connecting" : "call.ringing")}
              <span className="nb-ch-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </>
          ) : (
            <span role="timer" aria-label={t("call.timer")}>
              {callClock(seconds)}
            </span>
          )}
        </span>
        {peer.line ? <span className="nb-ch-appel-l">{peer.line}</span> : null}
      </div>
      <div className="nb-ch-appel-b">
        {CONTROLS.map(([key, path]) => (
          <button
            key={key}
            type="button"
            aria-label={t(`call.${key}`)}
            aria-pressed={!off[key]}
            data-off={off[key] ? "" : undefined}
            onClick={() => void toggle(key)}
          >
            <Glyph d={path(off[key])} />
          </button>
        ))}
        <button
          ref={hangButton}
          type="button"
          className="nb-ch-raccrocher"
          aria-label={t("call.hangUp")}
          onClick={() => hangUp.current()}
        >
          <Glyph
            d="M3 14.5c5-4.5 13-4.5 18 0l-2.2 2.6-3.3-1.4v-2.4a12 12 0 0 0-7 0v2.4l-3.3 1.4z"
            size={26}
            stroke={2.3}
          />
        </button>
      </div>
    </div>
  );
}

/** The call started from a conversation (« Oui, appeler »). */
export function VideoCall({
  view,
  mode,
  onEnd,
}: {
  view: ThreadView;
  mode: CallMode;
  onEnd: () => void;
}) {
  return (
    <CallScreen
      peer={{ who: view.who, me: view.me, line: view.callLine }}
      side={{ role: "caller", conversationId: view.id, mode }}
      onEnd={onEnd}
    />
  );
}
