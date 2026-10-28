"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { showToast } from "@/components/motion/toaster";
import { RING_MAX_MS, callClock, durationParts } from "@/lib/call-duration";
import { answerCallAction, endCallAction, startCallAction } from "@/server/actions/chat";
import { WhoAvatar } from "./parts";
import type { ThreadView } from "./types";

const VIDEO = "M3.5 7.5h11v9h-11zM14.5 10.5l6-3v9l-6-3";

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

/**
 * « Souhaitez-vous appeler {nom} en vidéo ? » (planche Chat-video): a small window, « Non » and
 * « Oui, appeler ». Nothing starts before « Oui ».
 */
export function CallConfirm({
  view,
  open,
  online,
  onClose,
  onCall,
}: {
  view: ThreadView;
  open: boolean;
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
          {t("ask", { name: view.who.name })}
        </p>
        <p className="nb-ch-appeler-n">
          {online ? t("noteOnline", { name: view.who.first }) : t("note")}
        </p>
        <div className="nb-ch-appeler-b">
          <button type="button" className="nb-ch-non" onClick={onClose}>
            {t("no")}
          </button>
          <button type="button" className="nb-ch-oui" onClick={onCall}>
            <Glyph d={VIDEO} size={18} stroke={2.2} />
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
    () => "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  ],
] as const;

type Phase = "ringing" | "active";

/**
 * The video call on the whole screen (planches Chat-appel, Chat-video-connecte): « Chiffré de
 * bout en bout », the face with the Lime wave while it rings, « Appel en cours… », then the timer
 * in mint; Micro, Caméra, Haut-parleur (cut = cream circle) and « Raccrocher » in coral. Nothing
 * is recorded. Back in the conversation: « Appel terminé · durée ».
 */
export function VideoCall({
  view,
  onEnd,
}: {
  view: ThreadView;
  /** The call is over (hung up, refused or not answered). */
  onEnd: () => void;
}) {
  const t = useTranslations("phoneChat");
  const [callId, setCallId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [seconds, setSeconds] = useState(0);
  const [off, setOff] = useState({ micro: false, camera: false, speaker: false });
  const ended = useRef(false);
  const answeredAt = useRef<number | null>(null);
  const idRef = useRef<string | null>(null);
  const hangUp = useRef<() => void>(() => undefined);
  const hangButton = useRef<HTMLButtonElement>(null);

  const finish = async (reason: "hangup" | "failed") => {
    if (ended.current) return;
    ended.current = true;
    const id = idRef.current;
    const spoken = answeredAt.current ? (Date.now() - answeredAt.current) / 1000 : null;
    onEnd();
    if (reason === "failed") {
      showToast({ message: t("call.failed"), tone: "error" });
      return;
    }
    if (id) await endCallAction(id).catch(() => null);
    if (spoken === null) {
      showToast({ message: t("call.cancelled") });
      return;
    }
    const parts = durationParts(spoken);
    showToast({ message: t("call.ended", { duration: t(`duration.${parts.key}`, parts.values) }) });
  };
  useEffect(() => {
    hangUp.current = () => void finish("hangup");
  });

  // « Oui, appeler »: the room opens; the fake provider picks up after a moment.
  useEffect(() => {
    let answer: ReturnType<typeof setTimeout> | undefined;
    let give: ReturnType<typeof setTimeout> | undefined;
    hangButton.current?.focus();
    void startCallAction(view.id)
      .catch(() => null)
      .then((result) => {
        if (ended.current) {
          if (result?.ok) void endCallAction(result.value.callId);
          return;
        }
        if (!result?.ok) return void finish("failed");
        idRef.current = result.value.callId;
        setCallId(result.value.callId);
        give = setTimeout(() => hangUp.current(), RING_MAX_MS);
        if (result.value.autoAnswerMs !== null)
          answer = setTimeout(() => {
            void answerCallAction(result.value.callId).then((answered) => {
              if (ended.current || !answered.ok) return;
              clearTimeout(give);
              answeredAt.current = Date.now();
              setPhase("active");
            });
          }, result.value.autoAnswerMs);
      });
    return () => {
      clearTimeout(answer);
      clearTimeout(give);
    };
    // One call per opening of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const ringing = phase === "ringing";
  return (
    <div
      className="nb-ch-appel"
      role="dialog"
      aria-modal="true"
      aria-label={t("call.label", { name: view.who.name })}
      data-appel={callId ?? undefined}
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
      <span className="nb-ch-chiffre">
        <Glyph d="M6.5 10.5h11v9h-11zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" size={13} stroke={2.2} />
        {t("call.encrypted")}
      </span>
      <div className="nb-ch-moi" data-off={off.camera ? "" : undefined}>
        <span aria-hidden>{view.me.initials}</span>
        <b>{t("call.you")}</b>
      </div>
      <div className="nb-ch-appel-qui">
        <span className="nb-ch-appel-av" data-sonne={ringing ? "" : undefined}>
          <WhoAvatar who={{ ...view.who, online: false }} size={150} />
        </span>
        <b>{view.who.name}</b>
        <span className="nb-ch-appel-s" data-actif={ringing ? undefined : ""} aria-live="polite">
          {ringing ? (
            <>
              {t("call.ringing")}
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
        <span className="nb-ch-appel-l">{view.callLine}</span>
      </div>
      <div className="nb-ch-appel-b">
        {CONTROLS.map(([key, path]) => (
          <button
            key={key}
            type="button"
            aria-label={t(`call.${key}`)}
            aria-pressed={!off[key]}
            data-off={off[key] ? "" : undefined}
            onClick={() => setOff((current) => ({ ...current, [key]: !current[key] }))}
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
