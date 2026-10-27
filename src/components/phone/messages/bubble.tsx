"use client";

/* eslint-disable @next/next/no-img-element -- photos of a conversation, served privately */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { showToast } from "@/components/motion/toaster";
import { REACTIONS } from "@/lib/reactions";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";
import { WAVE } from "./media";
import { Linked } from "./parts";
import type { Bubble, MessageView } from "./types";

export type Open =
  { kind: "photo"; messageId: string; index: number } | { kind: "doc"; messageId: string };

/** A voice note: play, pause, and the bars that fill while it plays. */
function Voice({ src, duration, mine }: { src: string; duration: string; mine: boolean }) {
  const t = useTranslations("phoneMsg.bubble");
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const node = audio.current;
    if (!node) return;
    const tick = () => setProgress(node.duration ? node.currentTime / node.duration : 0);
    const stop = () => {
      setPlaying(false);
      setProgress(0);
    };
    node.addEventListener("timeupdate", tick);
    node.addEventListener("ended", stop);
    return () => {
      node.removeEventListener("timeupdate", tick);
      node.removeEventListener("ended", stop);
    };
  }, []);
  const toggle = () => {
    const node = audio.current;
    if (!node) return;
    if (playing) {
      node.pause();
      setPlaying(false);
    } else {
      void node.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    }
  };
  const lit = Math.round(progress * WAVE.length);
  return (
    <span className="nb-ms-vocal">
      <button type="button" onClick={toggle} aria-label={playing ? t("pause") : t("play")}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path
            d={playing ? "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" : "M8 5.5v13l10-6.5z"}
            fill="currentColor"
          />
        </svg>
      </button>
      <span className="nb-ms-onde" aria-hidden>
        {WAVE.map((height, index) => (
          <i
            key={index}
            style={{ height }}
            data-lu={playing && index < lit ? "" : undefined}
            data-moi={mine ? "" : undefined}
          />
        ))}
      </span>
      <span className="nb-meta">{duration}</span>
      <audio ref={audio} src={src} preload="none" />
    </span>
  );
}

function Content({
  bubble,
  message,
  onOpen,
}: {
  bubble: Bubble;
  message: MessageView;
  onOpen: (open: Open) => void;
}) {
  const t = useTranslations("phoneMsg.bubble");
  const tm = useTranslations("phoneMsg");
  switch (bubble.kind) {
    case "system":
    case "decision":
      return null;
    case "text":
      return (
        <p className="nb-ms-texte">
          <Linked text={bubble.text} />
        </p>
      );
    case "photos": {
      const shown = bubble.photos.slice(0, 4);
      return (
        <span className="nb-ms-photos" data-n={Math.min(shown.length, 2)}>
          {shown.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              aria-label={t("seePhotos")}
              onClick={() => onOpen({ kind: "photo", messageId: message.id, index })}
            >
              <img
                src={photo.src}
                alt=""
                loading="lazy"
                width={photo.width}
                height={photo.height}
              />
            </button>
          ))}
        </span>
      );
    }
    case "doc":
      return (
        <button
          type="button"
          className="nb-ms-doc"
          onClick={() => onOpen({ kind: "doc", messageId: message.id })}
        >
          <span className="nb-ms-ext" aria-hidden>
            {bubble.ext || tm("pdf")}
          </span>
          <span>
            <b>{bubble.name}</b>
            <span className="nb-meta">{bubble.meta}</span>
          </span>
        </button>
      );
    case "contact":
      return (
        <span className="nb-ms-carte">
          <span className="nb-ms-carte-h">
            <FilAvatar
              initials={bubble.initials}
              image={bubble.image}
              tone={bubble.tone}
              org={false}
              size={40}
            />
            <span>
              <b>{bubble.name}</b>
              <span className="nb-meta">{bubble.line}</span>
            </span>
          </span>
          {bubble.href ? (
            <Link href={bubble.href} className="nb-ms-carte-b">
              {t("seeProfile")}
            </Link>
          ) : null}
        </span>
      );
    case "org":
      return (
        <span className="nb-ms-carte">
          <span className="nb-ms-carte-h">
            <FilAvatar
              initials={bubble.initials}
              image={bubble.image}
              tone={bubble.tone}
              org
              size={40}
            />
            <span>
              <b>{bubble.name}</b>
              <span className="nb-meta">{bubble.line}</span>
            </span>
          </span>
          <Link href={bubble.href} className="nb-ms-carte-b">
            {t("seePage")}
          </Link>
        </span>
      );
    case "event":
      return (
        <span className="nb-ms-evt">
          <span className="nb-ms-evt-k">{bubble.label}</span>
          <b>{bubble.title}</b>
          {bubble.meta ? <span className="nb-meta">{bubble.meta}</span> : null}
          {bubble.action ? (
            bubble.action.download ? (
              <a href={bubble.action.href} download className="nb-ms-evt-b">
                {bubble.action.label}
              </a>
            ) : (
              <Link href={bubble.action.href} className="nb-ms-evt-b">
                {bubble.action.label}
              </Link>
            )
          ) : null}
        </span>
      );
    case "interview":
      return null;
    case "voice":
      return <Voice src={bubble.src} duration={bubble.duration} mine={message.mine} />;
    case "link": {
      const inner = (
        <>
          <span className="nb-ms-lien-art" aria-hidden>
            <PhoneIcon name="lien" size={20} stroke={1.8} />
          </span>
          <b>{bubble.title}</b>
          <span className="nb-ms-lien-url">{bubble.display}</span>
        </>
      );
      return bubble.internal ? (
        <Link href={bubble.url} className="nb-ms-lien-c">
          {inner}
        </Link>
      ) : (
        <a
          href={bubble.url}
          className="nb-ms-lien-c"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {inner}
        </a>
      );
    }
  }
}

const AGENDA_KEY = "jm-chat-agenda";

function agendaSaved(id: string) {
  try {
    return (JSON.parse(localStorage.getItem(AGENDA_KEY) ?? "[]") as string[]).includes(id);
  } catch {
    return false;
  }
}

function keepAgenda(id: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(AGENDA_KEY) ?? "[]") as string[];
    localStorage.setItem(
      AGENDA_KEY,
      JSON.stringify([id, ...saved.filter((item) => item !== id)].slice(0, 30)),
    );
  } catch {
    // Private browsing: the button simply forgets it next time.
  }
}

/**
 * The interview card (planche Chat-conv, « ENTRETIEN »): the day and hour, where and how long;
 * « Ajouter à l’agenda » downloads the event with its two reminders and becomes « ✓ Dans
 * l’agenda »; « S’entraîner » opens a simulation of this interview with Orbi. While the time is
 * not chosen: « Choisir un créneau ».
 */
function InterviewCard({ bubble }: { bubble: Extract<Bubble, { kind: "interview" }> }) {
  const t = useTranslations("phoneChat.interview");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this phone
    setSaved(agendaSaved(bubble.id));
  }, [bubble.id]);
  const add = () => {
    if (!bubble.agendaHref) return;
    const link = document.createElement("a");
    link.href = bubble.agendaHref;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
    keepAgenda(bubble.id);
    setSaved(true);
    showToast({ message: t("reminders") });
  };
  return (
    <article className="nb-ch-rdv">
      <div className="nb-ch-rdv-h">
        <span className="nb-ch-rdv-k">{t("label")}</span>
        <b>{bubble.title}</b>
        <span>{bubble.meta}</span>
      </div>
      <div className="nb-ch-rdv-b">
        {bubble.agendaHref ? (
          <button
            type="button"
            className="nb-ch-rdv-ag"
            data-ok={saved ? "" : undefined}
            onClick={add}
          >
            {saved ? t("inAgenda") : t("agenda")}
          </button>
        ) : bubble.chooseHref ? (
          <Link href={bubble.chooseHref} className="nb-ch-rdv-ag">
            {t("choose")}
          </Link>
        ) : null}
        <Link href={bubble.practiceHref} className="nb-ch-rdv-tr">
          {t("practice")}
        </Link>
      </div>
      {saved ? <span className="nb-ch-rdv-rap">{t("reminders")}</span> : null}
    </article>
  );
}

/** The single check of « Envoyé », the double one of « Lu ». */
function Ticks({ read, label }: { read: boolean; label: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <path d={read ? "m2.5 12.5 4 4 8-9M10.5 16.5l.5.5 10-10" : "m5 12.5 4.5 4.5 10-11"} />
    </svg>
  );
}

/**
 * One message of the Chat (planches Chat-conv, Chat-reaction): a line of the system, a decision,
 * the interview card, or a bubble (received on `#13282C`, sent in Lime with Sapin text) with its
 * time, its checks, and its reactions under it. A touch on a bubble shows the bar of the six
 * reactions; the same reaction again takes it back.
 */
export function MessageBubble({
  message,
  hit,
  current,
  onOpen,
  picking,
  onPick,
  onReact,
  fresh,
}: {
  message: MessageView;
  /** Found by the search in the conversation; `current`: the one shown. */
  hit: boolean;
  current: boolean;
  onOpen: (open: Open) => void;
  /** The bar of reactions is shown above this message. */
  picking: boolean;
  onPick: (id: string | null) => void;
  onReact: (message: MessageView, emoji: string) => void;
  /** Arrived while the conversation is open: it rises gently. */
  fresh: boolean;
}) {
  const t = useTranslations("phoneChat");
  const tm = useTranslations("phoneMsg");
  if (message.bubble.kind === "system")
    return (
      <li className="nb-ch-m" data-sys="" id={`m-${message.id}`}>
        <span className="nb-ch-sys">{message.bubble.text}</span>
      </li>
    );
  if (message.bubble.kind === "decision") {
    const decision = message.bubble;
    return (
      <li className="nb-ch-m nb-ms-dec" id={`m-${message.id}`}>
        <article className="nb-ms-decision" data-retenue={decision.hired ? "" : undefined}>
          <b className="nb-ms-decision-t">{decision.title}</b>
          {decision.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <span className="nb-ms-decision-s">
            <span>{decision.signer}</span>
            <span>{message.time}</span>
          </span>
        </article>
        {decision.bounce ? (
          <div className="nb-ms-rebond">
            <b>{decision.bounce.title}</b>
            <span>{decision.bounce.text}</span>
            <Link href={decision.bounce.href} className="nb-ms-ecrire">
              {decision.bounce.cta}
            </Link>
          </div>
        ) : null}
      </li>
    );
  }
  const kind = message.bubble.kind;
  const reactions = message.reactions;
  const bar = picking ? (
    <span className="nb-ch-barre" role="toolbar" aria-label={t("react")}>
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={t("reactWith", { emoji })}
          aria-pressed={reactions?.mine === emoji}
          onClick={(event) => {
            event.stopPropagation();
            onReact(message, emoji);
          }}
        >
          {emoji}
        </button>
      ))}
    </span>
  ) : null;
  const chip = reactions ? (
    <span
      className="nb-ch-rx"
      role="img"
      aria-label={t("reactions", { count: reactions.count, emojis: reactions.emojis.join(" ") })}
    >
      {reactions.emojis.join("")}
      {reactions.count > 0 ? <b>{reactions.count}</b> : null}
    </span>
  ) : null;
  const toggle = (event: MouseEvent) => {
    if (!message.reactable) return;
    if ((event.target as HTMLElement).closest("a, button, audio, input")) return;
    event.stopPropagation();
    onPick(picking ? null : message.id);
  };
  if (kind === "interview" && message.bubble.kind === "interview")
    return (
      <li className="nb-ch-m" id={`m-${message.id}`} data-reagit={reactions ? "" : undefined}>
        <div className="nb-ch-carte" onClick={toggle}>
          {bar}
          <InterviewCard bubble={message.bubble} />
          {chip}
        </div>
      </li>
    );
  return (
    <li
      className="nb-ch-m"
      data-moi={message.mine ? "" : undefined}
      data-reagit={reactions ? "" : undefined}
      id={`m-${message.id}`}
    >
      <div
        className="nb-ch-bulle"
        data-type={kind}
        data-nouveau={fresh ? "" : undefined}
        data-trouve={current ? "courant" : hit ? "" : undefined}
        onClick={toggle}
      >
        {bar}
        <Content bubble={message.bubble} message={message} onOpen={onOpen} />
        <span className="nb-ch-heure-b">
          {kind === "photos" && message.bubble.kind === "photos" && message.bubble.hd ? (
            <b className="nb-ms-hd">{tm("hd")}</b>
          ) : null}
          {message.ephemeral ? <PhoneIcon name="minuteur" size={12} stroke={2} /> : null}
          {message.time}
          {message.mine ? (
            <Ticks read={message.read} label={message.read ? t("read") : t("sent")} />
          ) : null}
        </span>
        {chip}
      </div>
      {message.reactable ? (
        <button
          type="button"
          className="nb-ch-reagir"
          aria-expanded={picking}
          onClick={(event) => {
            event.stopPropagation();
            onPick(picking ? null : message.id);
          }}
        >
          {t("react")}
        </button>
      ) : null}
    </li>
  );
}
