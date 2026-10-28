/* eslint-disable @next/next/no-img-element -- brand patterns and product previews are static files already sized */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Character, type CharacterName, type Pose } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { keepTogether } from "@/lib/typography";

/**
 * Building blocks of the public site, identity of 28/10/2026 (docs/decisions/2026-10-28-site-public.md):
 * a light and airy page (Papier, Blanc), large rounded panels in Sapin, Nuit or Lime clair laid on
 * it like the cards of the Modèle B app, big tight headings, dark pills ending with a Lime disc.
 */

export type SectionTone = "creme" | "blanc" | "sapin" | "lime" | "profondeur" | "ia";

/** Light tones fill the whole width; the others are rounded panels laid on the page. */
const sectionTones: Record<SectionTone, string> = {
  creme: "bg-papier text-sapin",
  blanc: "bg-blanc text-sapin",
  sapin: "bg-sapin text-blanc",
  lime: "bg-lime-clair text-sapin",
  profondeur: "bg-nuit text-blanc",
  ia: "bg-sapin text-blanc",
};

const panelTones: SectionTone[] = ["sapin", "lime", "profondeur", "ia"];

/** 1200 px container with the 16 px mobile margin (`.wrap` of the mockups). */
export const wrap = "mx-auto w-full max-w-[1200px] px-4 xl:px-0";

/** A brand pattern laid over a whole block (`.motif`). */
export function Pattern({
  name,
  size = 360,
  opacity,
  blend = false,
  className,
}: {
  /** File in public/marque/motifs, without extension. */
  name: string;
  size?: number;
  opacity: number;
  blend?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-0",
        blend && "mix-blend-multiply",
        className,
      )}
      style={{
        backgroundImage: `url(/marque/motifs/${name}.svg)`,
        backgroundSize: `${size}px`,
        opacity,
      }}
    />
  );
}

/** Decorative brand shape (public/marque/formes). */
export function Shape({ name, className }: { name: string; className: string }) {
  return (
    <img
      src={`/marque/formes/${name}.svg`}
      alt=""
      aria-hidden
      className={cx("pointer-events-none absolute", className)}
    />
  );
}

/**
 * A block of the page. Papier and Blanc fill the width; Sapin, Nuit (`profondeur`), AI and Lime
 * clair become a panel with 32 / 48 px corners, a few pixels from the edges of the screen.
 */
export function MarketingSection({
  tone = "creme",
  id,
  className,
  innerClassName,
  background,
  scene = false,
  spotlight = false,
  children,
}: {
  tone?: SectionTone;
  id?: string;
  /** Overrides of the block itself (padding). */
  className?: string;
  innerClassName?: string;
  /** Pattern or shape behind the content. */
  background?: ReactNode;
  /** Animated block: its animations pause off screen (src/styles/motion.css). */
  scene?: boolean;
  /** A light follows the pointer (`.jm-spotlight` in the background). */
  spotlight?: boolean;
  children: ReactNode;
}) {
  const panel = panelTones.includes(tone);
  const Block = panel ? "div" : "section";
  const block = (
    <Block
      id={panel ? undefined : id}
      data-scene={scene ? "" : undefined}
      data-spotlight={spotlight ? "" : undefined}
      className={cx(
        "relative overflow-hidden py-16 lg:py-28",
        sectionTones[tone],
        panel && "mx-auto max-w-[1400px] rounded-[32px] lg:rounded-[48px]",
        className,
      )}
    >
      {background}
      <div className={cx(wrap, "relative", panel && "px-5 lg:px-10 xl:px-0")}>
        <div className={innerClassName}>{children}</div>
      </div>
    </Block>
  );
  if (!panel) return block;
  return (
    <section id={id} className="bg-papier px-2 py-2 sm:px-3 lg:px-4 lg:py-3">
      {block}
    </section>
  );
}

/** Small label above a title: a pill with a Lime dot (Feuille foncé on light, Néon on dark). */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={cx(
        "inline-flex items-center gap-2 self-start rounded-pill py-1.5 pr-3.5 pl-2 text-[13px] leading-[18px] font-semibold",
        dark
          ? "bg-blanc/10 text-neon ring-1 ring-blanc/15 ring-inset"
          : "bg-blanc text-feuille-fonce shadow-[0_1px_0_rgba(15,63,55,0.06)] ring-1 ring-sapin/10 ring-inset",
      )}
    >
      <span
        aria-hidden
        className={cx("size-2.5 rounded-full", dark ? "bg-lime" : "bg-lime ring-2 ring-lime/35")}
      />
      {children}
    </p>
  );
}

/** Title of a block: 32/38 on mobile, 48/54 on desktop, tight. */
export const sectionTitle =
  "text-[32px] leading-[38px] font-semibold tracking-[-0.035em] lg:text-[48px] lg:leading-[54px]";

/** Very large title of a page (hero). */
export const heroTitle =
  "text-[40px] leading-[44px] font-semibold tracking-[-0.045em] sm:text-[52px] sm:leading-[56px] lg:text-[72px] lg:leading-[74px]";

/** Lead paragraph: 16/25 on mobile, 18/29 on desktop. */
export const lead = "text-base leading-[25px] lg:text-lg lg:leading-[29px]";

/** Eyebrow, title and lead: centered from desktop up when `center`. */
export function SectionHead({
  eyebrow,
  title,
  text,
  center = false,
  dark = false,
  as: Heading = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  center?: boolean;
  dark?: boolean;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex max-w-[780px] flex-col gap-4",
        center && "lg:mx-auto lg:items-center lg:text-center [&>p:first-child]:lg:self-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <Heading className={sectionTitle}>{keepTogether(title)}</Heading>
      {text && <p className={cx(lead, dark ? "text-blanc/75" : "text-ardoise")}>{text}</p>}
    </div>
  );
}

/** Round icon tile, like the module discs of the app. */
export function IconTile({
  icon,
  size = 52,
  className,
}: {
  icon: IconName;
  size?: 34 | 44 | 46 | 48 | 52 | 56;
  /** Background and icon colors. */
  className: string;
}) {
  const iconSize = size >= 52 ? "size-6" : size >= 44 ? "size-5" : "size-[18px]";
  return (
    <span
      aria-hidden
      className={cx("flex shrink-0 items-center justify-center rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} className={iconSize} />
    </span>
  );
}

/** Text link ending with a small arrow disc; `stretched` makes the whole card clickable. */
export function ArrowLink({
  href,
  children,
  className,
  stretched = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  stretched?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "group/lien inline-flex items-center gap-2 text-[15px] font-semibold",
        stretched && "after:absolute after:inset-0",
        className,
      )}
    >
      <span className="underline-offset-4 group-hover/lien:underline">{children}</span>
      <Icon
        name="chev-r"
        className="size-4 shrink-0 transition-transform group-hover/lien:translate-x-0.5"
      />
    </Link>
  );
}

/** Numbered disc, 44 px. */
export function NumberDisc({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-11 shrink-0 items-center justify-center rounded-full text-[17px] font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* Buttons of the public site: pills ending with a disc and its arrow (Modèle B). */

export type SiteButtonTone = "dark" | "lime" | "light" | "onDark";

const siteButtonTones: Record<SiteButtonTone, { pill: string; disc: string }> = {
  // Nuit pill, white text, Lime disc: the main action on a light background.
  dark: { pill: "bg-nuit text-blanc hover:bg-sapin", disc: "bg-lime text-sapin" },
  // Lime pill, Sapin text (never white on Lime), Nuit disc.
  lime: { pill: "bg-lime text-sapin hover:bg-[#97e85a]", disc: "bg-nuit text-lime" },
  // White pill with a hairline: a second action on a light background.
  light: {
    pill: "bg-blanc text-sapin ring-1 ring-sapin/15 ring-inset hover:ring-sapin/40",
    disc: "bg-sapin text-lime",
  },
  // Second action on Sapin or Nuit.
  onDark: {
    pill: "bg-blanc/10 text-blanc ring-1 ring-blanc/25 ring-inset hover:bg-blanc/16",
    disc: "bg-lime text-sapin",
  },
};

/** Classes of a site button (also for a <button> or a <summary>). */
export function siteButtonClasses(tone: SiteButtonTone = "dark", size: "md" | "lg" = "lg") {
  return cx(
    "group/bouton jm-press inline-flex shrink-0 items-center justify-between gap-3 rounded-pill font-semibold whitespace-nowrap transition-colors",
    size === "lg" ? "h-[52px] pr-1.5 pl-6 text-[15px]" : "h-11 pr-1 pl-[18px] text-sm",
    siteButtonTones[tone].pill,
  );
}

/** The disc and its arrow at the end of a site button. */
export function ButtonDisc({
  tone = "dark",
  size = "lg",
  icon = "chev-r",
}: {
  tone?: SiteButtonTone;
  size?: "md" | "lg";
  icon?: IconName;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full transition-transform group-hover/bouton:translate-x-0.5",
        size === "lg" ? "size-10" : "size-9",
        siteButtonTones[tone].disc,
      )}
    >
      <Icon name={icon} className={size === "lg" ? "size-5" : "size-[18px]"} />
    </span>
  );
}

/** A link styled as a site button: label, then the disc with its arrow. */
export function SiteButton({
  href,
  children,
  tone = "dark",
  size = "lg",
  icon,
  className,
  fullWidth = false,
}: {
  href: string;
  children: ReactNode;
  tone?: SiteButtonTone;
  size?: "md" | "lg";
  icon?: IconName;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(siteButtonClasses(tone, size), fullWidth && "w-full sm:w-auto", className)}
    >
      {children}
      <ButtonDisc tone={tone} size={size} icon={icon} />
    </Link>
  );
}

/**
 * Row of key facts (big figure, short line) separated by thin lines. Only facts of the product
 * itself, never invented statistics (CLAUDE.md § 11).
 */
export function StatRow({
  items,
  dark = false,
  className,
}: {
  items: { value: string; label: string }[];
  dark?: boolean;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        "grid grid-cols-2 gap-y-6 sm:flex sm:justify-between sm:gap-0",
        dark ? "text-blanc" : "text-sapin",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cx(
            "flex flex-col gap-1.5 px-3 text-center sm:flex-1",
            index > 0 &&
              (dark ? "sm:border-l sm:border-blanc/20" : "sm:border-l sm:border-sapin/15"),
            index % 2 === 1 &&
              (dark
                ? "max-sm:border-l max-sm:border-blanc/20"
                : "max-sm:border-l max-sm:border-sapin/15"),
          )}
        >
          <dt className="order-2 text-[13px] leading-[18px] lg:text-sm lg:leading-5">
            <span className={dark ? "text-blanc/75" : "text-ardoise"}>{item.label}</span>
          </dt>
          <dd className="order-1 text-[34px] leading-[38px] font-semibold tracking-[-0.04em] lg:text-[48px] lg:leading-[52px]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** White card floating over a picture (a score, a notification), with a soft shadow. */
export function FloatCard({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "absolute rounded-[20px] bg-blanc p-3.5 text-sapin shadow-[0_18px_40px_rgba(11,26,31,0.18)] ring-1 ring-sapin/5",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// Grounds of the pictures: a plain brand color, a large orbit and a soft light, no dotted pattern.
const frameTones = {
  lime: { ground: "bg-lime", orbit: "forme-orbites-sapin", opacity: "opacity-[0.08]" },
  sapin: { ground: "bg-sapin", orbit: "forme-orbites-lime", opacity: "opacity-[0.14]" },
  nuit: { ground: "bg-nuit", orbit: "forme-orbites-lime", opacity: "opacity-[0.12]" },
  menthe: { ground: "bg-menthe-claire", orbit: "forme-orbites-sapin", opacity: "opacity-[0.08]" },
  neon: { ground: "bg-neon", orbit: "forme-orbites-sapin", opacity: "opacity-[0.08]" },
} as const;

/**
 * The « photo » of a block: a rounded picture with a brand ground, a pattern and a character of
 * the Jumanly cast (or a product preview), with cards floating over it.
 */
export function PhotoFrame({
  tone = "lime",
  character,
  preview,
  children,
  className,
}: {
  tone?: keyof typeof frameTones;
  character?: { name: CharacterName; pose: Pose; height: number };
  /** A product preview (public/apercus, without extension) instead of a character. */
  preview?: string;
  /** Floating cards. */
  children?: ReactNode;
  className?: string;
}) {
  const frame = frameTones[tone];
  return (
    <div className={cx("relative", className)}>
      <div
        className={cx(
          "relative flex h-full items-end justify-center overflow-hidden rounded-[32px] lg:rounded-[40px]",
          frame.ground,
        )}
      >
        <Shape name={frame.orbit} className={cx("-top-1/4 -right-1/3 w-[140%]", frame.opacity)} />
        <span
          aria-hidden
          className="absolute -bottom-24 left-1/2 size-[360px] -translate-x-1/2 rounded-full bg-blanc/25 blur-2xl"
        />
        {character && (
          <span className="jm-breathe relative">
            <Character name={character.name} pose={character.pose} height={character.height} />
          </span>
        )}
        {preview && (
          <img
            src={`/apercus/${preview}.webp`}
            alt=""
            width={1350}
            height={800}
            loading="lazy"
            decoding="async"
            className="relative mt-10 ml-10 w-full rounded-tl-[22px] object-cover object-left-top shadow-[0_-10px_40px_rgba(11,26,31,0.25)]"
          />
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Questions and answers: white cards, a round « + » that turns into « − » when open.
 * Native <details>, works without JavaScript. The first one is open.
 */
export function FaqAccordion({
  items,
  onWhite = false,
}: {
  items: { question: string; answer: string }[];
  /** On a white block the cards take Papier. */
  onWhite?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <details
          key={item.question}
          open={index === 0}
          className={cx(
            "group rounded-[24px] px-5 py-[18px] ring-1 ring-sapin/8 transition-colors ring-inset lg:px-7 lg:py-6",
            onWhite ? "bg-papier" : "bg-blanc",
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base leading-6 font-semibold lg:text-lg lg:leading-7 [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-clair text-sapin transition-colors group-open:bg-nuit group-open:text-lime"
            >
              <Icon name="plus" className="size-4 transition-transform group-open:rotate-45" />
            </span>
          </summary>
          <p className="mt-3 max-w-[820px] text-[15px] leading-[25px] text-ardoise">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

/**
 * Closing band: a Lime clair panel with a big title, the actions and a character, on the page
 * background.
 */
export function LimeCtaBand({
  title,
  text,
  actions,
  character,
  spacedTop = false,
}: {
  title: string;
  text?: string;
  actions: ReactNode;
  character: { name: CharacterName; pose: Pose; height: number; mobileHeight: number };
  /** Space above, when the block before is a panel too. */
  spacedTop?: boolean;
  /** Kept for the pages written before 28/10/2026: the band is the same everywhere now. */
  animated?: boolean;
}) {
  return (
    <section className={cx("bg-papier px-2 pb-3 sm:px-3 lg:px-4", spacedTop && "pt-2 lg:pt-3")}>
      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-6 overflow-hidden rounded-[32px] bg-lime-clair px-6 pt-10 text-sapin lg:min-h-[420px] lg:flex-row lg:items-center lg:rounded-[48px] lg:px-[88px] lg:py-20">
        <Shape
          name="forme-orbites-sapin"
          className="-right-32 -bottom-40 w-[620px] opacity-[0.06] max-lg:hidden"
        />
        <div className="relative flex max-w-[660px] flex-col gap-5">
          <h2 className="text-[32px] leading-[38px] font-semibold tracking-[-0.035em] lg:text-[54px] lg:leading-[58px]">
            {keepTogether(title)}
          </h2>
          {text && <p className="text-lg leading-7 text-sapin/85">{text}</p>}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">{actions}</div>
        </div>
        <div className="jm-breathe relative -mr-2.5 self-end lg:absolute lg:right-[72px] lg:bottom-0 lg:mr-0">
          <span className="lg:hidden">
            <Character
              name={character.name}
              pose={character.pose}
              height={character.mobileHeight}
            />
          </span>
          <span className="hidden lg:block">
            <Character name={character.name} pose={character.pose} height={character.height} />
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * Light variant of the signature gradient, for surfaces carrying Sapin text: every stop keeps
 * Sapin above the AA contrast ratio (the dark #1E9A64 end of the full gradient would not).
 */
export const signatureLight =
  "linear-gradient(120deg, #D9FA72 0%, #A6F26B 30%, #7DE36B 55%, #E3F67C 80%, #D9FA72 100%)";

/** Outlined Sapin pill used on Lime (`b-ghost` with a Sapin ring). */
export const outlineOnLime =
  "bg-transparent text-sapin ring-[1.5px] ring-sapin ring-inset hover:bg-sapin/8";

/* Motion layer (src/styles/motion.css, docs/decisions/2026-10-14-accueil-immersive.md). */

/** Cascade delay of the n-th element (`--i` in src/styles/motion.css). */
export function stagger(index: number) {
  return { "--i": index } as CSSProperties;
}

/** AI gradient, wider than its card so it can flow (`.jm-flow`). */
export const iaFlow =
  "linear-gradient(45deg, #0F3F37 0%, #14745F 35%, #1C8A72 55%, #14745F 75%, #0F3F37 100%)";

/** Blurred brand light drifting slowly behind a block. */
export function Glow({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <span
      aria-hidden
      className={cx("jm-drift pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/** Dark panel background: trajectories and two quiet lights. */
export function ImmersiveBackdrop() {
  return (
    <>
      <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.22} />
      <Glow className="-top-48 -left-40 size-[520px] bg-feuille/25" />
      <Glow className="-right-48 -bottom-56 size-[560px] bg-menthe/15" delay={-7} />
    </>
  );
}

/** A character alternating two poses while breathing. */
export function PoseCycle({
  name,
  poses: [first, second],
  height,
}: {
  name: CharacterName;
  poses: readonly [Pose, Pose];
  height: number;
}) {
  return (
    <span className="jm-breathe relative inline-block">
      <span className="jm-pose jm-pose-first block">
        <Character name={name} pose={first} height={height} />
      </span>
      <span className="jm-pose absolute inset-x-0 bottom-0 flex justify-center opacity-0">
        <Character name={name} pose={second} height={height} />
      </span>
    </span>
  );
}

/** Gradient stroke of a journey line, drawn when the steps come into view (`.jm-draw`). */
export function PathLine({
  id,
  vertical,
  delay,
  light = false,
}: {
  id: string;
  vertical: boolean;
  delay?: number;
  /** On a light background: a Sapin hairline under the drawn stroke. */
  light?: boolean;
}) {
  const ends = vertical ? { x1: 1, y1: 0, x2: 1, y2: 100 } : { x1: 0, y1: 1, x2: 100, y2: 1 };
  return (
    <svg
      viewBox={vertical ? "0 0 2 100" : "0 0 100 2"}
      preserveAspectRatio="none"
      className="absolute inset-0 size-full overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : 1} y2={vertical ? 1 : 0}>
          <stop offset="0" stopColor="#A6F26B" />
          <stop offset="0.5" stopColor="#3DA14F" />
          <stop offset="1" stopColor="#2FD3A6" />
        </linearGradient>
      </defs>
      <line
        {...ends}
        stroke={light ? "rgb(15 63 55 / 0.12)" : "rgb(255 255 255 / 0.14)"}
        strokeWidth={3}
        strokeDasharray="2 6"
        vectorEffect="non-scaling-stroke"
      />
      <line
        {...ends}
        pathLength={1}
        className="jm-draw"
        style={delay === undefined ? undefined : { animationDelay: `${delay}s` }}
        stroke={`url(#${id})`}
        strokeWidth={3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const heroTones = {
  lime: "bg-lime-clair text-sapin",
  blanc: "bg-blanc text-sapin",
  sapin: "bg-sapin text-blanc",
  nuit: "bg-nuit text-blanc",
} as const;

/**
 * Top of a public page: a large rounded panel with the eyebrow, a very large title, the lead, the
 * actions and, beside them, a picture (PhotoFrame, phone screens, floating cards).
 */
export function SiteHero({
  eyebrow,
  title,
  text,
  actions,
  extra,
  visual,
  tone = "lime",
  compact = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  actions?: ReactNode;
  /** Under the actions: badges, reassurance, a form. */
  extra?: ReactNode;
  visual?: ReactNode;
  tone?: keyof typeof heroTones;
  /** Smaller title, for list and document pages. */
  compact?: boolean;
  className?: string;
}) {
  const dark = tone === "sapin" || tone === "nuit";
  return (
    <section data-scene className="bg-papier px-2 pt-2 sm:px-3 lg:px-4 lg:pt-3">
      <div
        className={cx(
          "relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] px-5 lg:rounded-[48px] lg:px-14",
          compact ? "pt-10 pb-10 lg:pt-16 lg:pb-16" : "pt-10 pb-8 lg:pt-20 lg:pb-20",
          heroTones[tone],
          className,
        )}
      >
        <Shape
          name={dark ? "forme-orbites-lime" : "forme-orbites-sapin"}
          className={cx(
            "jm-drift -top-56 -left-56 w-[640px]",
            dark ? "opacity-[0.1]" : "opacity-[0.06]",
          )}
        />
        {tone === "lime" && (
          <span
            aria-hidden
            className="absolute -right-40 -bottom-40 size-[560px] rounded-full bg-lime/50 blur-3xl"
          />
        )}
        <div
          className={cx(
            "relative mx-auto flex max-w-[1200px] flex-col gap-10 lg:flex-row lg:items-center",
            visual ? "lg:gap-14" : "",
          )}
        >
          <div className={cx("flex flex-col gap-6", visual && "lg:w-[560px] lg:shrink-0")}>
            {eyebrow && (
              <div className="jm-rise" style={stagger(0)}>
                <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
              </div>
            )}
            <h1
              className={cx(
                "jm-word",
                compact
                  ? "text-[36px] leading-10 font-semibold tracking-[-0.04em] lg:text-[56px] lg:leading-[60px]"
                  : heroTitle,
              )}
              style={stagger(1)}
            >
              {typeof title === "string" ? keepTogether(title) : title}
            </h1>
            {text && (
              <div
                className={cx(
                  lead,
                  "jm-rise max-w-[620px]",
                  dark ? "text-blanc/80" : "text-sapin/85",
                )}
                style={stagger(2)}
              >
                {text}
              </div>
            )}
            {actions && (
              <div
                className="jm-rise flex flex-col gap-3 sm:flex-row sm:flex-wrap"
                style={stagger(3)}
              >
                {actions}
              </div>
            )}
            {extra && (
              <div className="jm-rise" style={stagger(4)}>
                {extra}
              </div>
            )}
          </div>
          {visual && (
            <div className="jm-rise relative min-w-0 flex-1" style={stagger(2)}>
              {visual}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** A phone screen of the app (public/apercus), in a Nuit frame with a deep shadow. */
export function PhoneShot({
  src,
  alt = "",
  width,
  className,
  priority = false,
  scroll,
}: {
  /** File in public/apercus, without extension. */
  src: string;
  alt?: string;
  /** Width in pixels; the height follows the screen. */
  width: number;
  className?: string;
  priority?: boolean;
  /** Slow scroll of the screen inside its frame (`.jm-screen`), in pixels. */
  scroll?: number;
}) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-[30px] shadow-[0_30px_60px_rgba(0,0,0,0.4)] ring-[6px] ring-nuit",
        className,
      )}
      style={{ width, height: Math.round(width * 2.05) }}
    >
      <img
        src={`/apercus/${src}.webp`}
        alt={alt}
        width={width}
        height={Math.round(width * 2.16)}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className={cx("w-full max-w-none", scroll !== undefined && "jm-screen")}
        style={
          scroll !== undefined ? ({ "--jm-scroll": `${scroll}px` } as CSSProperties) : undefined
        }
      />
    </div>
  );
}

/** A check in a Lime disc, then a line of text (lists of guarantees, reassurance). */
export function CheckLine({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-6">
      <span
        aria-hidden
        className={cx(
          "mt-px flex size-6 shrink-0 items-center justify-center rounded-full",
          dark ? "bg-lime text-sapin" : "bg-lime text-sapin",
        )}
      >
        <Icon name="check" className="size-3.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}

/** Reassurance chips (a check, a few words) on a hero. */
export function CheckChips({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className={cx(
            "flex items-center gap-1.5 rounded-pill py-1.5 pr-3 pl-1.5 text-xs leading-[17px] font-semibold",
            dark
              ? "bg-blanc/10 text-blanc ring-1 ring-blanc/15 ring-inset"
              : "bg-blanc/75 text-sapin",
          )}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-lime text-sapin">
            <Icon name="check" className="size-3" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The rounded panel of a hero, for pages that lay out their own top (catalogs, detail pages): the
 * same frame as SiteHero, with free content inside.
 */
export function HeroPanel({
  tone = "lime",
  className,
  children,
}: {
  tone?: keyof typeof heroTones;
  className?: string;
  children: ReactNode;
}) {
  const dark = tone === "sapin" || tone === "nuit";
  return (
    <section data-scene className="bg-papier px-2 pt-2 sm:px-3 lg:px-4 lg:pt-3">
      <div
        className={cx(
          "relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] lg:rounded-[48px]",
          heroTones[tone],
          className,
        )}
      >
        <Shape
          name={dark ? "forme-orbites-lime" : "forme-orbites-sapin"}
          className={cx(
            "jm-drift -top-56 -left-56 w-[640px]",
            dark ? "opacity-[0.1]" : "opacity-[0.06]",
          )}
        />
        {children}
      </div>
    </section>
  );
}
