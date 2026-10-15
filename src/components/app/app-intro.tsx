"use client";
/* eslint-disable @next/next/no-img-element -- small decorative SVG, played once */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { wordSize } from "@/lib/app-intro";
import { markIntroSeen } from "@/server/actions/intro";

export type IntroCard = {
  icon: IconName;
  bg?: string;
  kind?: "gauge" | "bar";
  title: string;
  text: string;
  pill?: string;
  value?: number;
};

export type IntroModule = {
  tag: string;
  icon: IconName;
  left: string;
  right: string;
  band: string;
  cards: [IntroCard, IntroCard];
};

export type IntroData = {
  name: string | null;
  seen: boolean;
  portrait: ReactNode;
  portraitBg: string;
  photo: boolean;
  modules: IntroModule[];
  labels: {
    label: string;
    skip: string;
    skipKey: string;
    wordmark: string;
    welcome: string;
    back: string;
    slogan: string;
    live: string;
    toastFirst: string;
    toastBack: string;
  };
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Scene = "idle" | "logo" | "welcome" | "module" | "final" | "short" | "reveal";

/** Timeline of each version, in milliseconds from the start (docs/refonte-connexion § 7). */
const FULL = {
  welcome: 1900,
  modules: [3300, 4600, 5900, 7200],
  final: 8500,
  reveal: 9100,
  end: 9600,
};
const SHORT = { reveal: 1300, end: 2000 };

/**
 * Welcome intro of the signed-in space, over the page that loads underneath. One timeline (a
 * table of steps and `setTimeout`), no animation library, `transform` and `opacity` only (the
 * band's color glides with a `background-color` transition). « Passer l'intro », `Échap` or a
 * click anywhere jump straight to the space; focus then goes to the main content.
 */
export function AppIntro({
  version,
  data,
  onDone,
}: {
  version: "full" | "short";
  data: IntroData;
  onDone: () => void;
}) {
  const [scene, setScene] = useState<Scene>("idle");
  const [module, setModule] = useState(-1);
  const skipRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  // The gate re-renders while the intro plays (the address loses `?arrivee=1`): the timeline must
  // not restart, so the latest `onDone` is read through a ref.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (version === "full") void markIntroSeen();
    const root = document.documentElement;
    root.style.removeProperty("overflow");
    root.setAttribute("data-intro-landing", "");
    window.setTimeout(() => root.removeAttribute("data-intro-landing"), 1000);
    // Pages left in the background (hidden by Next) keep their own `#content`: take the visible one.
    const main = [...document.querySelectorAll<HTMLElement>("main#content")].find((element) =>
      element.checkVisibility(),
    );
    if (main) {
      if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
    done.current();
  }, [version]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    skipRef.current?.focus();
    const timers: number[] = [];
    const at = (ms: number, step: () => void) => timers.push(window.setTimeout(step, ms));
    at(30, () => setScene(version === "full" ? "logo" : "short"));
    if (version === "full") {
      at(FULL.welcome, () => setScene("welcome"));
      FULL.modules.forEach((ms, index) =>
        at(ms, () => {
          setScene("module");
          setModule(index);
        }),
      );
      at(FULL.final, () => setScene("final"));
      at(FULL.reveal, () => setScene("reveal"));
      at(FULL.end, finish);
    } else {
      at(SHORT.reveal, () => setScene("reveal"));
      at(SHORT.end, finish);
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.removeProperty("overflow");
    };
  }, [version, finish]);

  const current = data.modules[module];
  const banded = scene === "welcome" || scene === "module" || scene === "final";
  const [left, right] =
    scene === "module" && current
      ? [current.left, current.right]
      : [data.labels.welcome, data.name ?? ""];
  const total = version === "full" ? FULL.end : SHORT.end;
  const backWords = data.labels.back.split(" ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={data.labels.label}
      className={cx("jm-in", banded && "jm-in-banded", scene === "module" && "jm-in-mod")}
      data-step={scene}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button")) finish();
      }}
      style={
        {
          "--band": scene === "final" ? "#E3F67C" : (current?.band ?? "#A6F26B"),
          "--pbg": data.portraitBg,
          "--total": `${total}ms`,
        } as Vars
      }
    >
      <div aria-hidden className="jm-in-veil" />
      <div aria-hidden className="jm-in-rings">
        <i />
        <i />
        <i />
      </div>

      {version === "full" && (
        <div aria-hidden className="jm-in-logo">
          <span className="jm-in-drop" />
          <span className="jm-in-mark">
            <img src="/marque/jumanly-symbole-lime.svg" alt="" className="jm-in-sym" />
            <span className="jm-in-wm-mask">
              <span className="jm-in-wm">{data.labels.wordmark}</span>
            </span>
          </span>
        </div>
      )}

      {version === "full" && (
        <>
          <div aria-hidden className="jm-in-band" />
          <div aria-hidden className={cx("jm-in-portrait", data.photo && "jm-in-photo")}>
            {data.portrait}
          </div>
          <div aria-hidden className="jm-in-words">
            <span
              key={`l-${left}`}
              className="jm-in-word jm-in-l"
              style={{ "--fs": wordSize(left) } as Vars}
            >
              <span>{left}</span>
            </span>
            <span />
            <span
              key={`r-${right}`}
              className="jm-in-word jm-in-r"
              style={{ "--fs": wordSize(right) } as Vars}
            >
              <span>{right}</span>
            </span>
          </div>
          {current && (
            <p key={`tag-${module}`} aria-hidden className="jm-in-tag">
              <Icon name={current.icon} className="jm-in-tag-icon" />
              {current.tag}
            </p>
          )}
          <div aria-hidden>
            {data.modules.flatMap((item, index) =>
              item.cards.map((card, position) => (
                <IntroCardView
                  key={`${index}-${position}`}
                  card={card}
                  place={index % 2 ? position + 2 : position}
                  state={
                    scene !== "module"
                      ? index <= module
                        ? "out"
                        : ""
                      : index === module
                        ? "on"
                        : index < module
                          ? "out"
                          : ""
                  }
                />
              )),
            )}
          </div>
          <div aria-hidden className="jm-in-dots">
            {data.modules.map((item, index) => (
              <i
                key={item.tag}
                className={cx(index === module && scene === "module" && "jm-in-dot-on")}
                style={{ "--c": item.band } as Vars}
              />
            ))}
          </div>
          <div aria-hidden className="jm-in-slogan">
            <p>{data.labels.slogan}</p>
          </div>
        </>
      )}

      {version === "short" && (
        <div aria-hidden className="jm-in-short">
          <span className="jm-in-pulse" />
          <p>
            {backWords.map((word, index) => (
              <span key={index}>
                {index > 0 && " "}
                <span className="jm-in-sw" style={{ "--i": index } as Vars}>
                  {data.name && index === backWords.length - 1 ? (
                    <span className="jm-in-hl">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              </span>
            ))}
          </p>
        </div>
      )}

      <span aria-hidden className="jm-in-burst" />
      <p className="sr-only" aria-live="polite">
        {version === "full" ? data.labels.live : data.labels.back}
      </p>
      <button ref={skipRef} type="button" className="jm-in-skip" onClick={finish}>
        {data.labels.skip}
        <kbd>{data.labels.skipKey}</kbd>
      </button>
      <div aria-hidden className="jm-in-progress">
        <i />
      </div>
    </div>
  );
}

function IntroCardView({
  card,
  place,
  state,
}: {
  card: IntroCard;
  place: number;
  state: "on" | "out" | "";
}) {
  return (
    <div className={cx("jm-in-card", `jm-in-p${place}`, state && `jm-in-${state}`)}>
      {card.kind === "gauge" ? (
        <span className="jm-in-gauge" style={{ "--v": card.value ?? 0 } as Vars}>
          <span>{card.value}</span>
        </span>
      ) : (
        <span className="jm-in-ic" style={card.bg ? ({ "--bg": card.bg } as Vars) : undefined}>
          <Icon name={card.icon} className="jm-in-ic-icon" />
        </span>
      )}
      <span className="min-w-0">
        <b>{card.title}</b>
        <small>{card.text}</small>
        {card.kind === "bar" && (
          <span className="jm-in-bar" style={{ "--v": `${card.value ?? 0}%` } as Vars}>
            <i />
          </span>
        )}
        {card.pill && <span className="jm-in-pill">{card.pill}</span>}
      </span>
    </div>
  );
}
