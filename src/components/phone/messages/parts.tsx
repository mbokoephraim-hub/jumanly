"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Verified } from "../explorer/cards";
import { FilAvatar } from "../fil/avatar";
import type { WhoView } from "./types";

/** A face with the mint dot of « En ligne » (planche Messages). */
export function WhoAvatar({ who, size = 52 }: { who: WhoView; size?: number }) {
  return (
    <span className="nb-ms-av" style={{ width: size, height: size }}>
      <FilAvatar
        initials={who.initials}
        image={who.image}
        tone={who.tone}
        org={who.org}
        size={size}
      />
      {who.online ? (
        <span
          className="nb-ms-enligne"
          style={{ width: Math.round(size / 4), height: Math.round(size / 4) }}
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
    <span className="nb-ms-nom">
      <Tag>{who.name}</Tag>
      {who.verified ? <Verified label={t("verified")} size={16} /> : null}
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
