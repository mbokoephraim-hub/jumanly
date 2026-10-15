import type { CSSProperties, ReactNode } from "react";
import { Character, Orbi } from "@/components/brand/character";
import { Icon } from "@/components/brand/icon";
import { Radar, type RadarAxis } from "@/components/motion/radar";
import { cx } from "@/lib/cx";

/**
 * Illustrations of the Career tool cards (docs/refonte-career/BRIEF-CAREER-V2.md § 4): soft
 * gradients of the brand, a dot grid fading downwards, and objects that float. Sheets, letters
 * and lines are schematic blocks, never fake text. Always decorative (`aria-hidden`).
 */

const backgrounds = {
  ia: "bg-[image:var(--jm-degrade-ia)]",
  lime: "bg-[linear-gradient(135deg,#F4FDE6,#D7F6B4_60%,#B9EE8C)]",
  menthe: "bg-[linear-gradient(135deg,#ECFBF6,#C6F1E3_60%,#9EE6CF)]",
  creme: "bg-[linear-gradient(135deg,#FBF8F3,#EFE8DC)]",
  neon: "bg-[linear-gradient(135deg,#FBFDE9,#EEF7B8_70%,#DCEF86)]",
  sapin: "bg-[linear-gradient(150deg,#14524A,#0F3F37_60%,#0B2A27)]",
  none: "bg-transparent",
} as const;

const delays = ["0s", "-1.5s", "-3s", "-4.5s"] as const;

/** One floating object; `delay` shifts its float (0 to 3). */
function Float({
  className,
  style,
  delay = 0,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  delay?: 0 | 1 | 2 | 3;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx("jm-float absolute", className)}
      style={{ animationDelay: delays[delay], ...style }}
    >
      {children}
    </div>
  );
}

/** A schematic line of a document. */
function Line({
  tone = "brume",
  className,
}: {
  tone?: "brume" | "sapin" | "lime";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "mt-[7px] block rounded-[4px]",
        tone === "sapin" ? "h-2 bg-sapin" : "h-1.5",
        tone === "brume" && "bg-brume",
        tone === "lime" && "bg-lime",
        className,
      )}
    />
  );
}

/** Round score gauge (conic Feuille on Brume) with the real score in its middle. */
export function ScoreDial({ score, size = 46 }: { score: number; size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full font-bold before:absolute before:inset-[5px] before:rounded-full before:bg-blanc"
      style={{
        width: size,
        height: size,
        fontSize: size >= 54 ? 15 : 13,
        background: `conic-gradient(var(--color-feuille) ${score}%, var(--color-brume) 0)`,
      }}
    >
      <span className="relative">{score}</span>
    </span>
  );
}

export type ArtProps =
  | { tool: "diagnostic"; axes: RadarAxis[] | null; radarTitle: string; radarText: string }
  | { tool: "plan"; checked: number }
  | {
      tool: "cv";
      score: { value: number; title: string; sub: string } | null;
      tip: string | null;
      initials: string;
    }
  | { tool: "documents" }
  | { tool: "linkedin"; initials: string }
  | { tool: "portfolio" }
  | { tool: "interviews"; question: string }
  | { tool: "tips" };

const backgroundOf: Record<ArtProps["tool"], keyof typeof backgrounds> = {
  diagnostic: "ia",
  plan: "neon",
  cv: "lime",
  documents: "menthe",
  linkedin: "creme",
  portfolio: "sapin",
  interviews: "lime",
  tips: "none",
};

const heights: Record<ArtProps["tool"], string> = {
  diagnostic: "h-full min-h-[250px]",
  plan: "h-[170px]",
  cv: "min-h-[270px] flex-1 lg:min-h-[300px]",
  documents: "h-[170px]",
  linkedin: "h-[170px]",
  portfolio: "h-[150px]",
  interviews: "h-[200px]",
  tips: "h-[200px]",
};

const darkTools = new Set<ArtProps["tool"]>(["diagnostic", "portfolio"]);

export function CareerArt(props: ArtProps) {
  const dark = darkTools.has(props.tool);
  return (
    <div
      aria-hidden
      className={cx(
        "jm-ch-art relative shrink-0 overflow-hidden",
        backgrounds[backgroundOf[props.tool]],
        heights[props.tool],
      )}
    >
      {props.tool !== "tips" && (
        <span className={cx("jm-ch-dots absolute inset-0", dark && "jm-ch-dots-light")} />
      )}
      <div className="jm-ch-obj absolute inset-0">
        <Objects {...props} />
      </div>
    </div>
  );
}

function Objects(props: ArtProps) {
  switch (props.tool) {
    case "diagnostic":
      return (
        <>
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-[200px] lg:max-w-[240px]">
              <Radar
                id="career-home-radar"
                axes={
                  props.axes ??
                  ["clarity", "skills", "experience", "tools", "interviews", "search"].map(
                    (key) => ({ key, label: "", value: 0 }),
                  )
                }
                title={props.radarTitle}
                description={props.radarText}
                size={260}
                tone="dark"
                showValues={false}
              />
            </div>
          </div>
          <Float className="top-[22px] right-[26px]" delay={2}>
            <Orbi size={26} />
          </Float>
        </>
      );
    case "plan":
      return (
        <>
          <Float className="top-[22px] left-[26px] flex flex-col gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="flex w-[200px] items-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-sapin/20 bg-blanc/80 px-3 py-2"
                style={{ marginLeft: index * 22 }}
              >
                <span
                  className={cx(
                    "grid size-[22px] shrink-0 place-items-center rounded-full",
                    index < props.checked
                      ? "bg-lime text-sapin"
                      : "border-[1.5px] border-dashed border-sapin/35",
                  )}
                >
                  {index < props.checked && <Icon name="check" className="size-3" />}
                </span>
                <span className="h-1.5 flex-1 rounded-[4px] bg-brume" />
              </span>
            ))}
          </Float>
          <Float className="right-[22px] bottom-5" delay={2}>
            <span className="grid size-11 place-items-center rounded-[14px] bg-sapin text-neon">
              <Icon name="calendrier" className="size-5" />
            </span>
          </Float>
        </>
      );
    case "cv":
      return (
        <>
          <Float className="top-9 left-1/2 -translate-x-[80%] -rotate-7" delay={1}>
            <Sheet />
          </Float>
          <Float className="top-[22px] left-1/2 -translate-x-[20%] rotate-5" delay={2}>
            <Sheet initials={props.initials} />
          </Float>
          {props.score && (
            <Float className="right-[22px] bottom-[22px] flex items-center gap-3 rounded-[18px] bg-blanc px-3.5 py-3 shadow-[0_20px_40px_-20px_rgb(15_63_55/0.5)]">
              <ScoreDial score={props.score.value} size={54} />
              <span className="text-xs leading-[1.35]">
                <b className="block text-sm">{props.score.title}</b>
                <span className="text-ardoise">{props.score.sub}</span>
              </span>
            </Float>
          )}
          {props.tip && (
            <Float
              className="bottom-6 left-5 hidden max-w-[230px] items-center gap-2 rounded-2xl bg-sapin px-3 py-2.5 text-xs text-blanc sm:flex"
              delay={2}
            >
              <Icon name="intelligence" className="size-4 shrink-0 text-lime" />
              {props.tip}
            </Float>
          )}
        </>
      );
    case "documents":
      return (
        <>
          <Float className="bottom-[22px] left-6 h-24 w-[150px] overflow-hidden rounded-xl bg-sapin">
            <span className="absolute inset-0 bg-[linear-gradient(155deg,transparent_49%,#155246_50%),linear-gradient(205deg,transparent_49%,#155246_50%)]" />
          </Float>
          <Float
            className="top-[22px] left-[84px] h-[140px] w-[120px] rotate-6 rounded-[10px] bg-blanc p-3 shadow-[0_22px_40px_-18px_rgb(15_63_55/0.45)]"
            delay={2}
          >
            <Line tone="sapin" className="mt-0 w-1/2" />
            <Line />
            <Line />
            <Line className="w-[70%]" />
            <Line />
            <Line tone="lime" className="mt-3 w-2/5" />
          </Float>
        </>
      );
    case "linkedin":
      return (
        <Float
          className="top-6 left-1/2 w-[210px] -translate-x-1/2 -rotate-3 overflow-hidden rounded-2xl bg-blanc shadow-[0_22px_40px_-18px_rgb(15_63_55/0.4)]"
          delay={1}
        >
          <span className="block h-11 bg-[image:var(--jm-degrade-ia)]" />
          <Initials initials={props.initials} className="-mt-[22px] ml-3.5 size-11 border-[3px]" />
          <span className="block px-3.5 pt-1.5 pb-3.5">
            <Line tone="sapin" className="mt-0 w-[70%]" />
            <Line className="w-[90%]" />
            <span className="mt-2 flex gap-1">
              {[40, 52, 34].map((width) => (
                <span key={width} className="h-2.5 rounded-[4px] bg-lime" style={{ width }} />
              ))}
            </span>
          </span>
        </Float>
      );
    case "portfolio":
      return (
        <>
          <Frame
            className="top-[34px] left-[8%] -rotate-8"
            fill="bg-[image:var(--jm-degrade-signature)]"
          />
          <Frame
            className="top-5 left-1/2 z-[1] -translate-x-1/2"
            fill="bg-[image:var(--jm-degrade-ia)]"
            delay={2}
          />
          <Frame
            className="top-[38px] right-[8%] rotate-8"
            fill="bg-[linear-gradient(135deg,#E3F67C,#A6F26B)]"
            delay={3}
          />
        </>
      );
    case "interviews":
      return (
        <>
          <div className="absolute bottom-[-6px] left-[6%]">
            <Character name="kofi" pose="telephone" height={170} />
          </div>
          <Float
            className="top-[26px] left-[calc(6%+120px)] max-w-[200px] rounded-[16px_16px_16px_4px] bg-blanc px-3 py-2.5 text-xs leading-[1.35] shadow-[0_18px_30px_-16px_rgb(15_63_55/0.4)] max-sm:top-[52px]"
            delay={1}
          >
            {props.question}
          </Float>
          <Float
            className="top-[96px] left-[calc(6%+120px)] flex items-center gap-3 rounded-2xl bg-sapin px-3.5 py-2.5 max-sm:top-[122px]"
            delay={3}
          >
            <span className="grid size-[30px] place-items-center rounded-full bg-lime text-sapin">
              <Icon name="mic" className="size-4" />
            </span>
            <span className="jm-ch-wave">
              {[14, 30, 22, 36, 18, 28, 12].map((height, index) => (
                <i
                  key={index}
                  style={{ "--h": `${height}px`, "--d": `${-0.2 * index}s` } as CSSProperties}
                />
              ))}
            </span>
          </Float>
        </>
      );
    case "tips":
      return (
        <>
          <Card className="top-10 left-[12%] -rotate-6" />
          <Card className="top-6 left-1/2 z-[1] -translate-x-1/2" delay={2} lime />
          <Card className="top-[46px] right-[12%] rotate-6" delay={3} />
        </>
      );
  }
}

function Initials({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cx(
        "grid shrink-0 place-items-center rounded-full border-blanc bg-[image:var(--jm-degrade-signature)] text-[11px] font-semibold text-sapin",
        className,
      )}
    >
      {initials}
    </span>
  );
}

function Sheet({ initials }: { initials?: string }) {
  return (
    <span className="block h-[220px] w-[160px] rounded-[10px] bg-blanc p-3.5 shadow-[0_22px_40px_-18px_rgb(15_63_55/0.45)] sm:h-[250px] sm:w-[190px]">
      {initials ? (
        <span className="flex items-center gap-2">
          <Initials initials={initials} className="size-[30px] text-[10px]" />
          <span className="flex-1">
            <Line tone="sapin" className="mt-0 w-4/5" />
            <Line className="w-1/2" />
          </span>
        </span>
      ) : (
        <>
          <Line tone="sapin" className="mt-0 w-3/5" />
          <Line className="w-2/5" />
        </>
      )}
      <Line tone="lime" className="mt-4 w-[30%]" />
      <Line />
      <Line className="w-[85%]" />
      <Line />
      <Line tone="lime" className="mt-4 w-[30%]" />
      <Line />
      <Line className="w-3/4" />
    </span>
  );
}

function Frame({
  className,
  fill,
  delay = 0,
}: {
  className: string;
  fill: string;
  delay?: 0 | 1 | 2 | 3;
}) {
  return (
    <Float
      className={cx(
        "h-[86px] w-[120px] rounded-xl bg-blanc p-2 shadow-[0_18px_30px_-16px_rgb(15_63_55/0.45)]",
        className,
      )}
      delay={delay}
    >
      <span className={cx("block h-[46px] rounded-[7px]", fill)} />
      <Line className="w-[70%]" />
    </Float>
  );
}

function Card({
  className,
  delay = 0,
  lime = false,
}: {
  className: string;
  delay?: 0 | 1 | 2 | 3;
  lime?: boolean;
}) {
  return (
    <Float
      className={cx(
        "h-[90px] w-[130px] rounded-[14px] border border-dashed border-sapin/18 bg-blanc p-3 shadow-[0_14px_24px_-14px_rgb(15_63_55/0.35)]",
        className,
      )}
      delay={delay}
    >
      <Line tone="sapin" className="mt-0 w-3/5" />
      <Line />
      <Line tone={lime ? "lime" : "brume"} className="w-[55%]" />
    </Float>
  );
}
