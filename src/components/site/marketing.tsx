/* eslint-disable @next/next/no-img-element -- brand patterns and product previews are static files already sized */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Character, type CharacterName, type Pose } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

/**
 * Building blocks of the redesigned public pages (mockups 01-01 and 01-02): sections alternating
 * Crème, Blanc and Sapin, a 1200 px container, centered section heads on desktop and left-aligned
 * on mobile, 28 px cards, numbered steps, an FAQ accordion and the Lime closing band.
 */

export type SectionTone = "creme" | "blanc" | "sapin" | "lime" | "profondeur" | "ia";

const sectionTones: Record<SectionTone, string> = {
  creme: "bg-creme text-sapin",
  blanc: "bg-blanc text-sapin",
  sapin: "bg-sapin text-blanc",
  lime: "bg-lime-clair text-sapin",
  profondeur: "bg-gradient-depth text-blanc",
  ia: "bg-gradient-ai text-blanc",
};

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

/** Full-width section: 56 px of padding on mobile, 96 px on desktop (`.sec`). */
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
  /** Overrides of the section itself (padding). */
  className?: string;
  innerClassName?: string;
  /** Pattern or shape behind the content. */
  background?: ReactNode;
  /** Animated section: its animations pause off screen (src/styles/motion.css). */
  scene?: boolean;
  /** A light follows the pointer (`.jm-spotlight` in the background). */
  spotlight?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-scene={scene ? "" : undefined}
      data-spotlight={spotlight ? "" : undefined}
      className={cx("relative overflow-hidden py-14 lg:py-24", sectionTones[tone], className)}
    >
      {background}
      <div className={cx(wrap, "relative", innerClassName)}>{children}</div>
    </section>
  );
}

/** Eyebrow in capitals: Feuille foncé on light backgrounds (AA), Néon on Sapin. */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={cx(
        "text-[13px] leading-[18px] font-medium tracking-[0.12em] uppercase",
        dark ? "text-neon" : "text-feuille-fonce",
      )}
    >
      {children}
    </p>
  );
}

/** Section title (`.h1s`): 28/34 on mobile, 36/42 on desktop. */
export const sectionTitle =
  "text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[36px] lg:leading-[42px]";

/** Lead paragraph (`.lead`): 16/25 on mobile, 18/28 on desktop. */
export const lead = "text-base leading-[25px] lg:text-lg lg:leading-7";

/** Eyebrow, title and lead (`.tete`): centered from desktop up when `center`. */
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
        "flex max-w-[760px] flex-col gap-3.5",
        center && "lg:mx-auto lg:items-center lg:text-center",
        className,
      )}
    >
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <Heading className={sectionTitle}>{title}</Heading>
      {text && <p className={cx(lead, dark ? "text-blanc/75" : "text-ardoise")}>{text}</p>}
    </div>
  );
}

/** Square icon tile (`.tile`), radius 14. */
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
      className={cx("flex shrink-0 items-center justify-center rounded-sm", className)}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} className={iconSize} />
    </span>
  );
}

/** Text link with a chevron (`.lien`); `stretched` makes the whole card clickable. */
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
        "inline-flex items-center gap-1.5 text-[15px] font-semibold hover:underline",
        stretched && "after:absolute after:inset-0",
        className,
      )}
    >
      {children}
      <Icon name="chev-r" className="size-4 shrink-0" />
    </Link>
  );
}

/** Numbered disc (`.num`), 44 px. */
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

/**
 * Questions and answers (`.acc`): white panels, round chevron on Crème, Sapin when open.
 * Native <details>, works without JavaScript. The first one is open.
 */
export function FaqAccordion({
  items,
  onWhite = false,
}: {
  items: { question: string; answer: string }[];
  /** On a white section the panels take Crème. */
  onWhite?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <details
          key={item.question}
          open={index === 0}
          className={cx(
            "group rounded-[20px] px-5 py-[18px] lg:px-6 lg:py-5",
            onWhite ? "bg-creme" : "bg-blanc",
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base leading-6 font-semibold [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-creme text-sapin transition-colors group-open:bg-sapin group-open:text-lime"
            >
              <Icon name="chev-d" className="size-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <p className="mt-2 max-w-[820px] text-[15px] leading-6 text-ardoise">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

/** Lime closing band (`Bandeau d'appel final Lime`): pattern, title, text, actions, character. */
export function LimeCtaBand({
  title,
  text,
  actions,
  character,
  spacedTop = false,
  animated = false,
}: {
  title: string;
  text?: string;
  actions: ReactNode;
  character: { name: CharacterName; pose: Pose; height: number; mobileHeight: number };
  /** Top padding, when the section above is not Crème. */
  spacedTop?: boolean;
  /** Home page: light signature gradient that flows, character in motion. */
  animated?: boolean;
}) {
  return (
    <section className={cx("bg-creme pb-14 lg:pb-24", spacedTop && "pt-14 lg:pt-24")}>
      <div className={wrap}>
        <div
          className={cx(
            "relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-lime px-6 pt-8 text-sapin lg:min-h-[400px] lg:flex-row lg:items-center lg:rounded-[40px] lg:px-[72px] lg:py-16",
            animated && "jm-flow",
          )}
          style={animated ? { backgroundImage: signatureLight } : undefined}
        >
          <Pattern name="motif-trajectoires-lime" opacity={0.5} />
          <div className="relative flex max-w-[640px] flex-col gap-5">
            <h2 className="text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-5xl lg:leading-[54px]">
              {title}
            </h2>
            {text && <p className="text-lg leading-7">{text}</p>}
            <div className="flex flex-col gap-3 lg:flex-row">{actions}</div>
          </div>
          <div
            className={cx(
              "relative -mr-2.5 self-end lg:absolute lg:right-[60px] lg:bottom-0 lg:mr-0",
              animated && "jm-breathe",
            )}
          >
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

/* Immersive layer (src/styles/motion.css, docs/decisions/2026-10-14-accueil-immersive.md). */

/** Cascade delay of the n-th element (`--i` in src/styles/motion.css). */
export function stagger(index: number) {
  return { "--i": index } as CSSProperties;
}

/** AI gradient, wider than its card so it can flow (`.jm-flow`). */
export const iaFlow =
  "linear-gradient(45deg, #0F3F37 0%, #14745F 35%, #1C8A72 55%, #14745F 75%, #0F3F37 100%)";

/** Blurred brand light drifting slowly behind a section. */
export function Glow({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <span
      aria-hidden
      className={cx("jm-drift pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/** Dark hero background: trajectories, drifting lights and the pointer light. */
export function ImmersiveBackdrop() {
  return (
    <>
      <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.3} />
      <Glow className="-top-48 -left-40 size-[560px] bg-feuille/40" />
      <Glow className="top-1/3 -right-48 size-[620px] bg-menthe/25" delay={-7} />
      <Glow className="-bottom-56 left-1/3 size-[520px] bg-lime/20" delay={-14} />
      <div aria-hidden className="jm-spotlight pointer-events-none absolute inset-0" />
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

/** Gradient stroke of the journey line, drawn when the steps come into view (`.jm-draw`). */
export function PathLine({
  id,
  vertical,
  delay,
}: {
  id: string;
  vertical: boolean;
  delay?: number;
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
          <stop offset="0" stopColor="#D9FA72" />
          <stop offset="0.5" stopColor="#7DE36B" />
          <stop offset="1" stopColor="#2FD3A6" />
        </linearGradient>
      </defs>
      <line
        {...ends}
        stroke="rgb(255 255 255 / 0.14)"
        strokeWidth={4}
        vectorEffect="non-scaling-stroke"
      />
      <line
        {...ends}
        pathLength={1}
        className="jm-draw"
        style={delay === undefined ? undefined : { animationDelay: `${delay}s` }}
        stroke={`url(#${id})`}
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
