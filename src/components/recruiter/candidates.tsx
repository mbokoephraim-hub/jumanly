import type { CSSProperties, ReactNode } from "react";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";

/** Initials of a candidate (planche `.av`): the photo is never shown in Hire (golden rule n° 4). */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/** The three soft tones of the avatars (planche `.av`, `.av.a`, `.av.b`), steady per person. */
export function avatarTone(id: string) {
  let sum = 0;
  for (const char of id) sum = (sum + char.charCodeAt(0)) % 997;
  return ["", "t-a", "t-b"][sum % 3]!;
}

export function CandidateAvatar({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={cx("t-rc-av", avatarTone(id), className)}>
      {initialsOf(name)}
    </span>
  );
}

/** The score as a ring (planche r2plus `.ring`): a landmark, never a decision. */
export function ScoreRing({
  score,
  text,
  label,
  size = "m",
}: {
  score: number;
  /** The score as written (« 88 % »). */
  text: string;
  label: string;
  size?: "m" | "s";
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cx("t-rc-ring", size === "s" && "t-s")}
      style={{ "--p": score } as CSSProperties}
    >
      <b aria-hidden>{text}</b>
    </span>
  );
}

/**
 * The stages of the offer as a track (planche `.parc`): the stages passed, the current one, those
 * to come, and « Décision » at the end.
 */
export function StageTrack({
  steps,
  label,
}: {
  steps: { key: string; name: string; state: "done" | "now" | "next"; hint: string }[];
  label: string;
}) {
  return (
    <ol className="t-rc-parc" aria-label={label}>
      {steps.map((step) => (
        <li
          key={step.key}
          className={cx(step.state === "now" && "t-now", step.state === "next" && "t-no")}
          aria-current={step.state === "now" ? "step" : undefined}
        >
          <i aria-hidden />
          <span>{step.name}</span>
          <span className="sr-only">{step.hint}</span>
        </li>
      ))}
    </ol>
  );
}

/** A folded section of the file (planche `sect`): icon, title, count, then its content. */
export function FileSection({
  id,
  icon,
  tone,
  title,
  aside,
  open,
  className,
  children,
}: {
  id?: string;
  className?: string;
  icon: ReactNode;
  tone: "former" | "accomp" | "oppo";
  title: string;
  aside?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} className={cx("t-verre t-sect t-rc-sect", className)} open={open}>
      <summary className="t-sh">
        <span className={cx("t-cases", `t-g-${tone}`)} aria-hidden>
          {icon}
        </span>
        <b>{title}</b>
        {aside && <small>{aside}</small>}
        <TalentIcon name="suivant" size="s" className="t-chev" />
      </summary>
      <div className="t-sc">{children}</div>
    </details>
  );
}
