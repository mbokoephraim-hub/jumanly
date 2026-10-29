"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * The small pieces shared by Carrière and « Mon profil » on the phone (docs/carriere-v3): the
 * drawn icons, the rings, the segment with its sliding Lime pill and the section headings.
 */

/** A tint of a palette colour (« #A6F26B » → « #A6F26B1F »). */
export const tint = (color: string, alpha: string) => `${color}${alpha}`;

export function Svg({ d, size = 15, width = 2.2 }: { d: string; size?: number; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export const PEN = "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4";
export const CAMERA = "M4 8h3l2-3h6l2 3h3v11H4zM12 9.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z";
export const PLUS = "M12 5v14M5 12h14";
export const SHARE = "M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5";
export const EYE =
  "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
export const STAR =
  "M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z";

/** Orbi's mint disc with its star, without the dot (cards of the CV tab). */
export function OrbiStar({ size = 40 }: { size?: number }) {
  return (
    <span className="nb-cr-etoile" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 48 48">
        <path d={STAR} fill="#0B1A1F" />
      </svg>
    </span>
  );
}

/** A ring in percent with its value in the middle (« 70 % », « 2/5 »). */
export function Ring({
  percent,
  color,
  size,
  children,
}: {
  percent: number;
  color: string;
  size: number;
  children: ReactNode;
}) {
  return (
    <span
      className="nb-cr-anneau"
      style={
        {
          width: size,
          height: size,
          background: `conic-gradient(${color} 0 ${percent}%, var(--nb-haute) ${percent}% 100%)`,
          "--trou": `${size - 10}px`,
        } as CSSProperties
      }
    >
      <span>{children}</span>
    </span>
  );
}

/**
 * A segment of tabs (« Progression · Candidatures · Mes documents »): each tab as wide as its
 * word, the Lime pill sliding under the chosen one.
 */
export function Segment<T extends string>({
  tabs,
  tab,
  onPick,
  label,
  names,
  prefix,
  panel,
}: {
  tabs: readonly T[];
  tab: T;
  onPick: (tab: T) => void;
  label: string;
  names: (tab: T) => string;
  /** The ids of the buttons: `${prefix}-${tab}`. */
  prefix: string;
  /** The id of the panel the tabs control. */
  panel: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const button = box.current?.querySelector<HTMLElement>(`#${prefix}-${tab}`);
      if (button) setPill({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [tab, prefix]);
  return (
    <div
      ref={box}
      className="nb-cr-seg"
      role="tablist"
      aria-label={label}
      data-mesure={pill ? "" : undefined}
    >
      <span
        className="nb-cr-ind"
        style={pill ? { left: pill.left, width: pill.width } : { opacity: 0 }}
        aria-hidden
      />
      {tabs.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`${prefix}-${key}`}
          aria-selected={tab === key}
          aria-controls={panel}
          onClick={() => onPick(key)}
        >
          {names(key)}
        </button>
      ))}
    </div>
  );
}

export function Heading({
  title,
  action,
  far,
}: {
  title: string;
  action?: { label: string; aria: string; href?: string; onClick?: () => void };
  far?: boolean;
}) {
  return (
    <h2 className="nb-pf-h nb-cr-h" data-loin={far ? "" : undefined}>
      {title}
      {action?.href ? (
        <Link href={action.href} aria-label={action.aria}>
          {action.label}
        </Link>
      ) : action ? (
        <button type="button" onClick={action.onClick} aria-label={action.aria}>
          {action.label}
        </button>
      ) : null}
    </h2>
  );
}
