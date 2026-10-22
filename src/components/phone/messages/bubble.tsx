"use client";

/* eslint-disable @next/next/no-img-element -- photos of a conversation, served privately */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
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

/** One message of a conversation: a line of the system, or a bubble with its time and « Lu ». */
export function MessageBubble({
  message,
  hit,
  current,
  onOpen,
}: {
  message: MessageView;
  /** Found by the search in the conversation; `current`: the one shown. */
  hit: boolean;
  current: boolean;
  onOpen: (open: Open) => void;
}) {
  const t = useTranslations("phoneMsg.bubble");
  const tm = useTranslations("phoneMsg");
  if (message.bubble.kind === "system")
    return (
      <li className="nb-ms-m" data-sys="" id={`m-${message.id}`}>
        <span className="nb-ms-sys">{message.bubble.text}</span>
      </li>
    );
  if (message.bubble.kind === "decision") {
    const decision = message.bubble;
    return (
      <li className="nb-ms-m nb-ms-dec" id={`m-${message.id}`}>
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
  return (
    <li className="nb-ms-m" data-moi={message.mine ? "" : undefined} id={`m-${message.id}`}>
      <div
        className="nb-ms-bulle"
        data-type={kind}
        data-trouve={current ? "courant" : hit ? "" : undefined}
      >
        <Content bubble={message.bubble} message={message} onOpen={onOpen} />
        <span className="nb-ms-heure-b">
          {kind === "photos" && message.bubble.kind === "photos" && message.bubble.hd ? (
            <b className="nb-ms-hd">{tm("hd")}</b>
          ) : null}
          {message.ephemeral ? <PhoneIcon name="minuteur" size={12} stroke={2} /> : null}
          {message.time}
          {message.mine ? (
            <span className="nb-ms-lu">{message.read ? t("read") : t("sent")}</span>
          ) : null}
        </span>
      </div>
    </li>
  );
}
