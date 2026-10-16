import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { Avatar, CompanyLogo } from "./avatar";
import { PressArrow } from "./pressable";

/*
 * Visual cards of the mobile Talent space (planche « Cartes », docs/ux-mobile-talent § 5):
 * a title and one line at most, with a scene made of simple shapes. Every text comes from the
 * caller (textes/), every figure from real data: a figure that is missing is not shown.
 */

export type GoalStat = { value: ReactNode; label: string };

/** The goal card (screens 03-05): goal, three real figures, the Lime round to change it. */
export function GoalCard({
  eyebrow,
  title,
  stats,
  editHref,
  editLabel,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Up to three figures; pass only those that exist. */
  stats: GoalStat[];
  editHref?: string;
  editLabel?: string;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "relative isolate overflow-hidden rounded-[24px] bg-gradient-principal p-4 text-blanc shadow-[var(--jm-ombre-principal)]",
        className,
      )}
    >
      <span aria-hidden className="jm-orbits -top-16 -right-10 size-48" />
      <span aria-hidden className="jm-orbits -top-8 -right-2 size-32" />
      <span aria-hidden className="absolute top-14 right-24 size-2 rounded-full bg-lime" />
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-neon">
        <Icon name="objectif" className="size-4" />
        {eyebrow}
      </p>
      <h2 className="mt-1 pr-12 text-[22px] leading-tight font-bold tracking-tight">{title}</h2>
      {editHref && editLabel && (
        <Link
          href={editHref}
          aria-label={editLabel}
          title={editLabel}
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-lime text-sapin shadow-orb"
        >
          <Icon name="edit" className="size-5" />
        </Link>
      )}
      {stats.length > 0 && (
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.label} className="rounded-[14px] bg-blanc/10 px-3 py-2">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-[18px] leading-tight font-bold">{stat.value}</dd>
              <dd aria-hidden className="text-[11.5px] leading-tight text-blanc/80">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

/** The profile card: banner, avatar, title, three skills, visibility. */
export function ProfileCard({
  name,
  image,
  subtitle,
  skills,
  footer,
  className,
}: {
  name: string;
  image?: string;
  subtitle?: string;
  skills: string[];
  /** Usually the visibility switch. */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx("overflow-hidden rounded-[24px] bg-blanc text-center shadow-douce", className)}
    >
      <div aria-hidden className="relative h-20 overflow-hidden bg-gradient-principal">
        <span className="jm-orbits -top-10 -right-6 size-32" />
        <span className="absolute top-8 right-16 size-2 rounded-full bg-lime" />
      </div>
      <div className="relative -mt-9 flex flex-col items-center gap-1 px-4 pb-4">
        <Avatar name={name} image={image} size="lg" className="ring-4 ring-blanc" />
        <h3 className="mt-1 text-[17px] font-bold">{name}</h3>
        {subtitle && <p className="text-[13px] text-ardoise">{subtitle}</p>}
        {skills.length > 0 && (
          <ul className="mt-2 flex flex-wrap justify-center gap-1.5">
            {skills.slice(0, 3).map((skill) => (
              <li key={skill} className="rounded-pill bg-creme px-3 py-1 text-[12.5px]">
                {skill}
              </li>
            ))}
          </ul>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </section>
  );
}

export type SceneName = "cv" | "interview" | "profile" | "documents" | "learn" | "jobs";

const sceneTones = {
  lime: "bg-lime",
  menthe: "bg-menthe-claire",
  neon: "bg-neon",
  brume: "bg-brume",
} as const;

const sceneIcons: Record<SceneName, IconName> = {
  cv: "doc",
  interview: "message",
  profile: "profil",
  documents: "doc",
  learn: "learn",
  jobs: "jobs",
};

/** The illustration area of a visual tile: sheets, a white icon square and a badge. */
function Scene({
  scene,
  tone,
  badge,
}: {
  scene: SceneName;
  tone: keyof typeof sceneTones;
  badge?: string;
}) {
  const papers = scene === "cv" || scene === "documents";
  return (
    <div
      aria-hidden
      className={cx("relative h-24 overflow-hidden rounded-[16px]", sceneTones[tone])}
    >
      {papers ? (
        <>
          <span className="jm-scene-sheet top-3 left-3 h-14 w-11 -rotate-6" />
          <span className="jm-scene-sheet top-5 left-9 h-14 w-11 rotate-3 opacity-80" />
        </>
      ) : (
        <>
          <span className="absolute top-4 left-3 h-3 w-14 rounded-pill bg-blanc/80" />
          <span className="absolute top-10 right-4 h-3 w-10 rounded-pill bg-sapin/80" />
        </>
      )}
      <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[13px] bg-blanc text-sapin shadow-douce">
        <Icon name={sceneIcons[scene]} className="size-5" />
      </span>
      {badge && (
        <span className="absolute right-2 bottom-2 rounded-pill bg-sapin px-2 py-0.5 text-[11px] font-bold text-lime">
          {badge}
        </span>
      )}
    </div>
  );
}

/** A visual tool tile (Mon CV, Entretien…): a scene, a title, one line, the arrow. */
export function VisualTile({
  href,
  title,
  line,
  scene,
  tone = "lime",
  badge,
  locked,
  className,
}: {
  href: string;
  title: string;
  line?: string;
  scene: SceneName;
  tone?: keyof typeof sceneTones;
  badge?: string;
  /** Accessible label of the padlock when the plan does not include the tool. */
  locked?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx("jm-pressable flex flex-col gap-2 rounded-[22px] p-2 pb-3", className)}
    >
      <Scene scene={scene} tone={tone} badge={badge} />
      <span className="flex items-end gap-2 px-1.5">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1 text-[15px] leading-snug font-semibold">
            {title}
            {locked && <Icon name="lock" label={locked} className="size-3.5 shrink-0" />}
          </span>
          {line && <span className="truncate text-[12.5px] text-ardoise">{line}</span>}
        </span>
        <PressArrow className="size-7!" />
      </span>
    </Link>
  );
}

/** The Jumanly AI bento card: aurora, iridescent ring, orb in the middle, context chips. */
export function AiBento({
  title,
  line,
  chips,
  href,
  className,
}: {
  title: string;
  line?: string;
  chips: { icon: IconName; label: string }[];
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div aria-hidden className="relative h-28 rounded-[18px] bg-blanc/5">
        <span className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ai-orb text-sapin shadow-orb">
          <Icon name="intelligence" className="size-6" />
        </span>
        {chips.slice(0, 3).map((chip, index) => (
          <span
            key={chip.label}
            className={cx(
              "absolute inline-flex items-center gap-1 rounded-pill bg-blanc/10 px-2.5 py-1 text-[12px] font-semibold text-blanc ring-1 ring-blanc/25",
              index === 0 && "top-3 left-3",
              index === 1 && "top-5 right-3",
              index === 2 && "bottom-3 left-8",
            )}
          >
            <Icon name={chip.icon} className="size-3.5" />
            {chip.label}
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-col px-1">
        <span className="text-[16px] font-bold text-blanc">{title}</span>
        {line && <span className="text-[13px] text-blanc/75">{line}</span>}
      </div>
    </>
  );
  const classes = cx(
    "jm-ai-surface flex flex-col gap-3 rounded-[24px] p-3 pb-4 text-blanc",
    href && "jm-press",
    className,
  );
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** A file sent in a conversation (CV, letter): kind tile, name, size, download. */
export function FileCard({
  name,
  meta,
  kind,
  href,
  downloadLabel,
  className,
}: {
  name: string;
  meta?: string;
  /** Short file kind shown on the tile (« PDF »). */
  kind: string;
  href: string;
  downloadLabel: string;
  className?: string;
}) {
  return (
    <div
      className={cx("flex items-center gap-3 rounded-[18px] bg-blanc p-3 shadow-douce", className)}
    >
      <span
        aria-hidden
        className="relative flex h-12 w-10 shrink-0 items-end justify-center overflow-hidden rounded-[8px] bg-sapin pb-1.5 text-[11px] font-bold text-lime"
      >
        <span className="absolute top-0 right-0 size-3 rounded-bl-[4px] bg-menthe-claire" />
        {kind}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-semibold">{name}</span>
        {meta && <span className="truncate text-[12.5px] text-ardoise">{meta}</span>}
      </div>
      <a
        href={href}
        download
        aria-label={`${downloadLabel} · ${name}`}
        title={downloadLabel}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blanc text-sapin ring-1 ring-brume hover:ring-sapin/40"
      >
        <Icon name="telecharger" className="size-5" />
      </a>
    </div>
  );
}

/** A time slot sent in a conversation: date block, title, meta, actions (Accepter, Autre moment). */
export function SlotCard({
  weekday,
  day,
  month,
  title,
  meta,
  actions,
  className,
}: {
  weekday: string;
  day: string;
  month: string;
  title: string;
  meta?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex items-center gap-3 rounded-[18px] bg-blanc p-3 shadow-douce", className)}
    >
      <span className="flex w-14 shrink-0 flex-col items-center rounded-[14px] bg-gradient-principal py-2 text-blanc">
        <span className="text-[11px] font-semibold text-neon uppercase">{weekday}</span>
        <span className="text-[24px] leading-none font-bold">{day}</span>
        <span className="text-[11px] font-semibold text-neon uppercase">{month}</span>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <span className="text-[14.5px] font-semibold">{title}</span>
          {meta && <span className="text-[12.5px] text-ardoise">{meta}</span>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * A recruitment decision (screens 52-53): the company's header, never a chat bubble. Refusal in
 * sober Sapin, hiring in Lime. Sent only after a recruiter's click (golden rule 3).
 */
export function DecisionCard({
  outcome,
  company,
  job,
  banner,
  paragraphs,
  signer,
  date,
  className,
}: {
  outcome: "rejected" | "hired";
  company: string;
  job: string;
  banner: string;
  paragraphs: string[];
  signer: string;
  date: string;
  className?: string;
}) {
  const hired = outcome === "hired";
  return (
    <article
      className={cx(
        "overflow-hidden rounded-[22px] border-t-4 bg-blanc shadow-douce",
        hired ? "border-lime" : "border-sapin",
        className,
      )}
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        <CompanyLogo name={company} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15.5px] font-bold">{company}</span>
          <span className="truncate text-[13px] text-ardoise">{job}</span>
        </div>
      </header>
      <p
        className={cx(
          "mx-4 mt-3 flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[14px] font-semibold",
          hired ? "bg-lime-clair" : "bg-creme",
        )}
      >
        <Icon name={hired ? "check" : "info"} className="size-4" />
        {banner}
      </p>
      <div className="flex flex-col gap-2 px-4 py-3 text-[14px] leading-relaxed">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <footer className="flex items-center justify-between border-t border-brume px-4 py-2.5 text-[12.5px] text-ardoise">
        <span>{signer}</span>
        <span>{date}</span>
      </footer>
    </article>
  );
}
