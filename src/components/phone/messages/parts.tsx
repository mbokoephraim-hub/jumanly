"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FilAvatar } from "../fil/avatar";
import { ringOf, VerifiedMark } from "../profil/profile";
import type { WhoView } from "./types";

/**
 * A face with the ring of its colours and the mint dot of « En ligne » (docs/chat-v2, `.av`):
 * the ring is 2.5 px, then a dark gap, then the photo or the initials. `online` overrides the
 * state read with the page (the Chat keeps it live).
 */
export function WhoAvatar({
  who,
  size = 52,
  online,
  dot = true,
}: {
  who: WhoView;
  size?: number;
  online?: boolean;
  /** Without the dot (the face of the menu ···). */
  dot?: boolean;
}) {
  const inner = size - 10;
  const shown = online ?? who.online;
  return (
    <span
      className="nb-ch-av"
      style={{ width: size, height: size, background: ringOf(who.ring) }}
      aria-hidden
    >
      <span className="nb-ch-av-in">
        <FilAvatar
          initials={who.initials}
          image={who.image}
          tone={who.tone}
          org={who.org}
          size={inner}
        />
      </span>
      {dot && shown ? (
        <i
          className="nb-ch-on"
          style={{
            width: Math.max(10, Math.round(size / 4.6)),
            height: Math.max(10, Math.round(size / 4.6)),
          }}
        />
      ) : null}
    </span>
  );
}

/** The name and its green check. */
export function WhoName({ who, as = "b" }: { who: WhoView; as?: "b" | "span" }) {
  const t = useTranslations("phoneMsg");
  const Tag = as;
  return (
    <span className="nb-ch-nom">
      <Tag>{who.name}</Tag>
      {who.verified ? <VerifiedMark label={t("verified")} size={14} /> : null}
    </span>
  );
}

const LINK = /(https?:\/\/[^\s<>«»"]+|\/app\/[^\s<>«»"]+)/g;

/** A message's words, with its addresses made into links (an address of the space stays inside). */
export function Linked({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const url = match[0].replace(/[.,;:!?)]+$/, "");
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      url.startsWith("/") ? (
        <Link key={start} href={url} className="nb-ms-lien">
          {url}
        </Link>
      ) : (
        <a
          key={start}
          href={url}
          className="nb-ms-lien"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {url}
        </a>
      ),
    );
    last = start + url.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/** « Joindre » ‹ the way back of a sub-sheet. */
export function SheetBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="nb-ms-sousretour" onClick={onClick}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 5 8 12l7 7" />
      </svg>
      {label}
    </button>
  );
}

/** A switch drawn as in the mockup (`.tgl`). */
export function Toggle({ on }: { on: boolean }) {
  return (
    <span className="nb-ms-tgl" data-on={on ? "" : undefined} aria-hidden>
      <i />
    </span>
  );
}

/** The round choice of a sheet (`.radio`). */
export function Radio({ on }: { on: boolean }) {
  return (
    <span className="nb-ms-radio" data-on={on ? "" : undefined} aria-hidden>
      <i />
    </span>
  );
}

/** The double check of « Lu » (planche Chat-liste). */
export function ReadMark({ label, color }: { label: string; color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <path d="m2.5 12.5 4 4 8-9M10.5 16.5l.5.5 10-10" />
    </svg>
  );
}

/** « écrit » and its three dots. */
export function Typing({ label }: { label: string }) {
  return (
    <span className="nb-ch-ecrit">
      {label}
      <span className="nb-ch-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

/** Orbi's four-pointed star (planche Chat). */
export function Spark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5c.6 4.6 2.9 6.9 7.5 7.5-4.6.6-6.9 2.9-7.5 7.5-.6-4.6-2.9-6.9-7.5-7.5 4.6-.6 6.9-2.9 7.5-7.5z" />
    </svg>
  );
}
