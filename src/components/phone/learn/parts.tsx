"use client";
/* eslint-disable @next/next/no-img-element -- course covers are uploaded files or YouTube thumbnails */

import Link from "next/link";
import type { CourseRow } from "./data";

/** The cover the admin chose, filling its frame (the colour and initials stay underneath). */
export function CourseCover({ src }: { src: string | null | undefined }) {
  if (!src) return null;
  return <img src={src} alt="" className="nb-fo-couv" loading="lazy" decoding="async" />;
}

/** The square of a course: its cover, or its initials in its colour (« BI », « SQL »). */
export function CourseSquare({
  initials,
  tone,
  cover = null,
  size = 48,
}: {
  initials: string;
  tone: number;
  cover?: string | null;
  size?: number;
}) {
  return (
    <span
      className="nb-fo-carre"
      data-ton={tone}
      data-couv={cover ? "" : undefined}
      style={{ width: size, height: size, fontSize: size >= 48 ? 15 : 13 }}
      aria-hidden
    >
      {cover ? <CourseCover src={cover} /> : initials}
    </span>
  );
}

/** A line of « Mes cours » and of the search: the square, the title, its line, the state. */
export function CourseLine({ row }: { row: CourseRow }) {
  return (
    <Link href={row.href} className="nb-fo-ligne">
      <CourseSquare initials={row.initials} tone={row.tone} cover={row.cover} />
      <span className="nb-fo-ligne-t">
        <b>{row.title}</b>
        <small className="nb-meta">{row.sub}</small>
        {row.progress !== null ? (
          <span className="nb-fo-barre" aria-hidden>
            <i style={{ width: `${row.progress}%` }} />
          </span>
        ) : null}
      </span>
      {row.state ? (
        <span className="nb-fo-etat" data-ton={row.stateTone ?? undefined}>
          {row.state}
        </span>
      ) : null}
    </Link>
  );
}

/** The bars of the banners (planche Formation: a little chart on the course's colour). */
export function CourseArt({ play = false }: { play?: boolean }) {
  return (
    <svg viewBox="0 0 330 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g>
        <rect x="40" y="48" width="26" height="52" rx="3" fill="#F2EDE5" />
        <rect x="78" y="30" width="26" height="70" rx="3" fill="#F2EDE5" />
        <rect x="116" y="42" width="26" height="58" rx="3" fill="#F2EDE5" />
        <rect x="154" y="16" width="26" height="84" rx="3" fill="#A6F26B" />
      </g>
      {play ? (
        <path
          d="M262 46a26 26 0 1 0 40 22"
          fill="none"
          stroke="#F2EDE5"
          strokeWidth="9"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

/**
 * The banner of a course: its cover when the admin gave one, otherwise its colour, two rings and
 * its square in white (planche Formation).
 */
export function CourseBanner({
  initials,
  tone,
  cover = null,
}: {
  initials: string;
  tone: number;
  cover?: string | null;
}) {
  if (cover)
    return (
      <div className="nb-fo-banniere" data-ton={tone} data-couv="" aria-hidden>
        <CourseCover src={cover} />
      </div>
    );
  return (
    <div className="nb-fo-banniere" data-ton={tone} aria-hidden>
      <svg viewBox="0 0 272 126" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#FFFFFF" strokeOpacity=".2" strokeWidth="22">
          <circle cx="20" cy="63" r="62" />
          <circle cx="252" cy="63" r="62" />
        </g>
      </svg>
      <span>{initials}</span>
    </div>
  );
}
