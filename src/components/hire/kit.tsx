import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { CountUp } from "@/components/motion/count-up";
import { cx } from "@/lib/cx";

/**
 * Shared pieces of the Hire pages (mockups 04-01 to 04-10): cards, figures, rows, the bar of the
 * pipeline steps and the initials of organizations and candidates.
 */

export const hireCard = "rounded-[24px] bg-blanc p-5 lg:p-[22px]";
export const hireTitle =
  "text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]";
export const divider = "border-t border-gris-clair";

/** Colours of the pipeline steps, the same in the bars, the legends and the columns. */
export const stageTone = {
  new: "bg-brume",
  screening: "bg-neon",
  test: "bg-menthe-claire",
  interview: "bg-lime",
  offer: "bg-menthe",
  hired: "bg-feuille",
  rejected: "bg-corail",
} as const;
export type StageTone = keyof typeof stageTone;

/** Steps drawn in the bar of a job (mockup 04-01): the open ones, in order. */
export const barKinds = ["new", "screening", "test", "interview", "offer"] as const;

export function initialsOf(name: string) {
  return (
    name
      .split(/[\s-]+/)
      .filter((word) => /\p{L}/u.test(word[0] ?? ""))
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Initials of an organization on a Sapin tile (Lime letters). */
export function OrgMark({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center bg-sapin font-bold tracking-[-0.03em] text-lime"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        fontSize: Math.round(size * 0.35),
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

const avatarTones = [
  "bg-lime-clair text-sapin",
  "bg-sapin text-lime",
  "bg-menthe-claire text-menthe-texte",
  "bg-neon text-sapin",
  "bg-brume text-sapin",
];

/** Round initials of a person; the tint follows the name so it stays the same everywhere. */
export function Initials({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const tone = avatarTones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5];
  return (
    <span
      aria-hidden
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.02em]",
        tone,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsOf(name)}
    </span>
  );
}

/**
 * Key figure (mockup 04-01): label, icon on a pale disc, big value that counts up once, then a
 * tag or a hint. `ai` puts the icon on the AI gradient (a score).
 */
export function Kpi({
  label,
  value,
  number,
  icon,
  disc = "bg-gris-clair",
  ai = false,
  children,
  className,
}: {
  label: string;
  /** Text shown (« 1,8 j », « 12 sur 50 »); the number alone counts up when `number` is given. */
  value: string;
  number?: number;
  icon: IconName;
  disc?: string;
  ai?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const plain = number !== undefined && value === String(number);
  return (
    <div className={cx("flex min-w-0 flex-col rounded-[24px] bg-blanc px-5 py-[18px]", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] leading-[17px] font-medium text-ardoise lg:text-[13px]">
          {label}
        </p>
        <span
          aria-hidden
          className={cx(
            "grid size-[38px] shrink-0 place-items-center rounded-full lg:size-[42px]",
            ai ? "bg-gradient-ai text-neon" : cx(disc, "text-sapin"),
          )}
        >
          <Icon name={icon} className="size-[18px]" />
        </span>
      </div>
      <p className="mt-1 text-[24px] leading-[30px] font-semibold tracking-[-0.03em] lg:text-[30px] lg:leading-[34px]">
        {plain ? <CountUp value={number} /> : value}
      </p>
      {children && <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Row of a « À traiter » list: tile, two lines, round chevron. The whole row is the link. */
export function ActionRow({
  href,
  icon,
  tile,
  title,
  hint,
}: {
  href: string;
  icon: IconName;
  tile: string;
  title: string;
  hint?: string;
}) {
  return (
    <li className="border-gris-clair not-first:border-t">
      <Link
        href={href}
        className="group flex items-center gap-3 py-3 transition-colors hover:bg-creme/50"
      >
        <span
          aria-hidden
          className={cx("grid size-10 shrink-0 place-items-center rounded-[14px] text-sapin", tile)}
        >
          <Icon name={icon} className="size-[18px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13.5px] leading-[19px] font-semibold">{title}</span>
          {hint && <span className="truncate text-[11px] leading-[15px] text-ardoise">{hint}</span>}
        </span>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-creme transition-transform group-hover:translate-x-0.5"
        >
          <Icon name="chev-r" className="size-4" />
        </span>
      </Link>
    </li>
  );
}

/** Bar of a job's candidates spread over the steps (mockup 04-01). */
export function StageBar({
  stages,
  label,
  className,
}: {
  stages: { kind: StageTone; count: number }[];
  label: string;
  className?: string;
}) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);
  return (
    <span
      role="img"
      aria-label={label}
      className={cx(
        "flex h-2 w-full gap-0.5 overflow-hidden rounded-[9px] bg-gris-clair",
        className,
      )}
    >
      {total > 0 &&
        stages
          .filter((stage) => stage.count > 0)
          .map((stage) => (
            <i
              key={stage.kind}
              className={cx("jm-gauge block h-full origin-left", stageTone[stage.kind])}
              style={{ flex: stage.count }}
            />
          ))}
    </span>
  );
}

/** Legend of the step colours. */
export function StageLegend({ items }: { items: { kind: StageTone; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => (
        <li key={item.kind} className="flex items-center gap-1.5 text-[11px] text-ardoise">
          <span aria-hidden className={cx("size-2 rounded-full", stageTone[item.kind])} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Day tile of an agenda line (« mer. 14 »). */
export function DayTile({
  weekday,
  day,
  tone = "bg-brume",
}: {
  weekday: string;
  day: string;
  tone?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex h-[52px] w-12 shrink-0 flex-col items-center justify-center rounded-[14px] text-sapin",
        tone,
      )}
    >
      <span className="text-[11px] leading-[15px] font-medium">{weekday}</span>
      <span className="text-[18px] leading-5 font-semibold">{day}</span>
    </span>
  );
}

/**
 * Consumption of a quota (mockup 04-01): label with its icon, « 412 sur 1000 » and a thin bar,
 * Sapin, then Ambre from 80 % and Corail at 100 %. `text` replaces the figures (« Selon contrat »).
 */
export function QuotaLine({
  icon,
  label,
  used,
  max,
  value,
  text,
}: {
  icon: IconName;
  label: string;
  used: number;
  max: number;
  value: string;
  text?: string;
}) {
  const ratio = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center justify-between gap-3 text-[12px] leading-[17px] lg:text-[13px]">
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon name={icon} className="size-3.5 shrink-0" />
          {label}
        </span>
        <span className={cx("shrink-0 font-semibold", text && "font-medium text-ardoise")}>
          {text ?? value}
        </span>
      </p>
      {!text && (
        <span aria-hidden className="block h-[7px] overflow-hidden rounded-pill bg-gris-clair">
          <span
            className={cx(
              "jm-gauge block h-full origin-left rounded-pill",
              ratio >= 100 ? "bg-corail" : ratio >= 80 ? "bg-ambre" : "bg-sapin",
            )}
            style={{ transform: `scaleX(${ratio / 100})` }}
          />
        </span>
      )}
    </div>
  );
}

/** Status of a job (mockup 04-02), from `hire.jobs.status.*`. */
export const jobStatusTone = {
  published: "bg-lime text-sapin",
  pending_review: "bg-neon text-sapin",
  draft: "bg-brume text-sapin",
  rejected: "bg-down-fond text-down-texte",
  closed: "bg-transparent text-sapin ring-[1.2px] ring-sapin ring-inset",
  archived: "bg-transparent text-sapin ring-[1.2px] ring-sapin ring-inset",
} as const;

/**
 * Chip that opens a small menu under it (filters, « … » actions). A `<details>`: it works
 * without JavaScript and closes when another one of the same `group` opens.
 */
export function MenuChip({
  summary,
  summaryClassName,
  label,
  group,
  align = "left",
  children,
  className,
}: {
  summary: ReactNode;
  summaryClassName: string;
  /** Accessible name when the summary is only an icon. */
  label?: string;
  group: string;
  align?: "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  return (
    <details name={group} className={cx("group/menu relative shrink-0", className)}>
      <summary
        aria-label={label}
        className={cx(
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          summaryClassName,
        )}
      >
        {summary}
      </summary>
      <div
        className={cx(
          "absolute top-[calc(100%+6px)] z-30 flex min-w-56 flex-col gap-0.5 rounded-[18px] bg-blanc p-1.5 text-[13px] shadow-menu ring-1 ring-sapin/8",
          align === "right" ? "right-0" : "left-0",
        )}
      >
        {children}
      </div>
    </details>
  );
}

/** One line of a `MenuChip` menu: a link, or a button inside a form. */
export const menuItem =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sapin hover:bg-creme [&_svg]:size-4";

/** Round « … » button of a row. */
export const moreButton =
  "grid size-8 place-items-center rounded-full bg-blanc text-sapin ring-[1.5px] ring-brume ring-inset hover:bg-creme group-open/menu:bg-creme";
