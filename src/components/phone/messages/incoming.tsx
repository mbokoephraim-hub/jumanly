"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { endCallAction } from "@/server/actions/chat";
import { AudioGlyph, CallScreen, VideoGlyph, peerOf } from "./call";
import { WhoAvatar } from "./parts";
import { readCall, readCalls, type CallMode, type IceServer, type Incoming } from "./rtc";

/** How often the space asks whether a call rings for me (a few bytes, only while it is shown). */
const EVERY_MS = 4_000;

/** A soft two-tone ring, made in the browser (no sound file to download). */
function ringTone() {
  let context: AudioContext | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  const beep = () => {
    if (!context) return;
    const now = context.currentTime;
    for (const [index, frequency] of [440, 480].entries()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.05 + index * 0.01);
      gain.gain.setValueAtTime(0.06, now + 1.1);
      gain.gain.linearRampToValueAtTime(0, now + 1.2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 1.25);
    }
  };
  try {
    context = new AudioContext();
    beep();
    timer = setInterval(beep, 3_000);
  } catch {
    // No sound allowed before a first touch: the screen and the vibration still ring.
  }
  if (typeof navigator.vibrate === "function") navigator.vibrate([600, 400, 600, 1400]);
  return () => {
    clearInterval(timer);
    void context?.close().catch(() => undefined);
    if (typeof navigator.vibrate === "function") navigator.vibrate(0);
  };
}

/**
 * A call ringing for me, anywhere in the signed-in space: « {nom} vous appelle », « Appel vidéo
 * entrant », and three choices: « Refuser », « Accepter en audio », « Accepter en vidéo ». The
 * call then opens on the whole screen, with the other person's voice, and their image when their
 * camera is on. Asked every few seconds while the page is shown; nothing while the phone sleeps.
 */
export function IncomingCalls() {
  const t = useTranslations("phoneChat.call");
  const [ringing, setRinging] = useState<Incoming | null>(null);
  const [ice, setIce] = useState<IceServer[]>([]);
  const [answered, setAnswered] = useState<{ call: Incoming; mode: CallMode } | null>(null);
  const done = useRef(new Set<string>());
  const acceptButton = useRef<HTMLButtonElement>(null);

  // Is a call ringing for me?
  useEffect(() => {
    if (answered) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = async () => {
      if (document.visibilityState === "visible") {
        const calls = await readCalls().catch(() => null);
        if (calls && !stopped) {
          setIce(calls.ice);
          const call = calls.incoming;
          setRinging(call && !done.current.has(call.id) ? call : null);
        }
      }
      if (!stopped) timer = setTimeout(ask, EVERY_MS);
    };
    void ask();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [answered]);

  // While it rings: the tone, and the caller hanging up before I answer.
  const ringId = ringing?.id ?? null;
  useEffect(() => {
    if (!ringId) return;
    acceptButton.current?.focus();
    const stop = ringTone();
    const watch = setInterval(async () => {
      const state = await readCall(ringId);
      if (state && state.status !== "ringing") {
        done.current.add(ringId);
        setRinging(null);
      }
    }, 2_000);
    return () => {
      stop();
      clearInterval(watch);
    };
  }, [ringId]);

  if (answered)
    return (
      <Host>
        <CallScreen
          peer={peerOf(answered.call)}
          side={{ role: "callee", call: answered.call, mode: answered.mode, ice }}
          onEnd={() => {
            done.current.add(answered.call.id);
            setAnswered(null);
            setRinging(null);
          }}
        />
      </Host>
    );
  if (!ringing) return null;

  const call = ringing;
  const accept = (mode: CallMode) => {
    done.current.add(call.id);
    setRinging(null);
    setAnswered({ call, mode });
  };
  const refuse = () => {
    done.current.add(call.id);
    setRinging(null);
    void endCallAction(call.id).catch(() => null);
  };
  const peer = peerOf(call);
  return (
    <Host>
      <div
        className="nb-ch-appel nb-ch-entrant"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="nb-ch-entrant-t"
        aria-describedby="nb-ch-entrant-n"
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
        <div className="nb-ch-appel-qui">
          <span className="nb-ch-appel-av" data-sonne="">
            <WhoAvatar who={peer.who} size={150} />
          </span>
          <b id="nb-ch-entrant-t">{t("incoming.title", { name: call.who.name })}</b>
          <span className="nb-ch-appel-s">
            {t(call.mode === "audio" ? "incoming.audio" : "incoming.video")}
          </span>
          <span id="nb-ch-entrant-n" className="nb-ch-appel-l">
            {t("incoming.note")}
          </span>
        </div>
        <div className="nb-ch-entrant-b">
          <button type="button" className="nb-ch-entrant-non" onClick={refuse}>
            <span aria-hidden>
              <svg
                width={26}
                height={26}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 14.5c5-4.5 13-4.5 18 0l-2.2 2.6-3.3-1.4v-2.4a12 12 0 0 0-7 0v2.4l-3.3 1.4z" />
              </svg>
            </span>
            {t("incoming.refuse")}
          </button>
          <button
            type="button"
            ref={call.mode === "audio" ? acceptButton : undefined}
            aria-label={t("incoming.acceptAudio")}
            onClick={() => accept("audio")}
          >
            <span aria-hidden>
              <AudioGlyph />
            </span>
            {t("incoming.audioShort")}
          </button>
          <button
            type="button"
            ref={call.mode === "video" ? acceptButton : undefined}
            aria-label={t("incoming.acceptVideo")}
            onClick={() => accept("video")}
          >
            <span aria-hidden>
              <VideoGlyph />
            </span>
            {t("incoming.videoShort")}
          </button>
        </div>
      </div>
    </Host>
  );
}

/**
 * Above everything of the space (menu, Orbi), whatever page it rings on: drawn at the end of the
 * page, with the colours of the Modèle B, also in the spaces drawn otherwise (computer, recruiter).
 */
function Host({ children }: { children: ReactNode }) {
  return createPortal(<div className="nb-app nb-ch-hote">{children}</div>, document.body);
}
