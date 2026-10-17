"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { cx } from "@/lib/cx";

const SEEN_KEY = "jumanly.ouverture.vue";

function remember() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private browsing: the welcome comes back next time, nothing breaks.
  }
}

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** The pictogram of the brand (ressources/logos), drawn as in public/marque. */
function Pictogram() {
  return (
    <svg viewBox="23.5 19.5 58 78" width="70" height="94" aria-hidden>
      <path
        d="M70 55 V70 A19 19 0 0 1 33.15 76.50"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="17"
        strokeLinecap="round"
      />
      <circle cx="70" cy="31" r="11.5" fill="#A6F26B" />
    </svg>
  );
}

/** Screen 57: the logo in its glowing tile, the word, a loading line. */
export function Splash({ label }: { label?: string }) {
  return (
    <main className="jm-opening flex min-h-dvh flex-col items-center justify-center gap-4 text-blanc">
      <span className="jm-opening-logo grid size-[150px] place-items-center rounded-[44px]">
        <Pictogram />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- the brand's own logotype file */}
      <img src="/marque/jumanly-logotype-blanc.svg" alt="Jumanly" className="h-[34px] w-auto" />
      <span
        role="progressbar"
        aria-label={label}
        className="jm-opening-load mt-[30px] block h-1 w-[90px] overflow-hidden rounded-sm bg-blanc/12"
      >
        <i className="block h-full w-[45%] rounded-sm bg-lime" />
      </span>
    </main>
  );
}

function Person({ src, className, size }: { src: string; className: string; size: number }) {
  return (
    <span
      aria-hidden
      className={cx("jm-opening-person absolute overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative brand illustration */}
      <img
        src={src}
        alt=""
        className="absolute bottom-0 left-1/2 h-[92%] w-auto max-w-none -translate-x-1/2"
      />
    </span>
  );
}

function Chip({ icon, label, className }: { icon: IconName; label: string; className: string }) {
  return (
    <span
      className={cx(
        "absolute inline-flex items-center gap-[5px] rounded-pill bg-blanc px-[11px] py-1.5 text-[11.5px] font-semibold text-sapin shadow-[0_10px_24px_-10px_rgba(0,0,0,.5)]",
        className,
      )}
    >
      <Icon name={icon} className="size-3.5 text-[#14745F]" />
      {label}
    </span>
  );
}

type Labels = {
  loading: string;
  title: string;
  text: string;
  start: string;
  signIn: string;
  chipJobs: string;
  chipCertificate: string;
};

/** Screen 58: the people of Jumanly in orbit, the slogan, « Commencer » and « J'ai déjà un compte ». */
function Welcome({ labels }: { labels: Labels }) {
  return (
    <main className="jm-opening flex min-h-dvh flex-col text-blanc">
      <div className="flex flex-1 flex-col items-center gap-2.5 px-5 pt-[60px] text-center">
        <div className="jm-opening-scene relative h-[380px] w-[330px] max-w-full" aria-hidden>
          <span
            className="jm-opening-ring border-[rgba(47,211,166,.18)]"
            style={{ width: 340, height: 340 }}
          />
          <span className="jm-opening-ring" style={{ width: 250, height: 250 }} />
          <span
            className="jm-opening-ring border-[rgba(166,242,107,.5)]"
            style={{ width: 150, height: 150 }}
          />
          <Person
            src="/illustrations/jumanly-amani-montre.svg"
            size={86}
            className="top-10 left-2.5 bg-[#BFEFDF]"
          />
          <Person
            src="/illustrations/jumanly-fatou-joie.svg"
            size={130}
            className="top-[125px] left-[100px] bg-[radial-gradient(circle_at_50%_40%,#E3F67C,#A6F26B_60%,#2FD3A6)]"
          />
          <Person
            src="/illustrations/jumanly-kofi-telephone.svg"
            size={86}
            className="top-[250px] right-1.5 bg-[#E3F67C]"
          />
          <Chip icon="jobs" label={labels.chipJobs} className="top-[60px] right-2.5" />
          <Chip icon="diplome" label={labels.chipCertificate} className="bottom-10 left-0" />
        </div>
        <h1 className="mt-1.5 text-[28px] font-bold tracking-[-0.02em]">{labels.title}</h1>
        <p className="text-[14px] text-blanc/72">{labels.text}</p>
      </div>
      <div className="flex flex-col gap-1 border-t border-blanc/6 bg-[#0B1A1F]/40 px-4 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Link
          href="/inscription"
          onClick={remember}
          className="flex min-h-[52px] items-center justify-center gap-3 rounded-pill bg-gradient-accent text-[16px] font-semibold text-sapin shadow-[0_14px_30px_-12px_rgba(166,242,107,.6)]"
        >
          {labels.start}
          <span
            aria-hidden
            className="grid size-[30px] place-items-center rounded-full bg-blanc/30"
          >
            <Icon name="chev-r" className="size-4" />
          </span>
        </Link>
        <Link
          href="/connexion"
          onClick={remember}
          className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-lime"
        >
          {labels.signIn}
        </Link>
      </div>
    </main>
  );
}

/**
 * The opening (V6 § B8). The logo shows for a short moment (still in reduced motion), then a
 * signed-in person goes to Pour moi, a phone that already saw the welcome goes to sign-in, and a
 * first visit gets the welcome.
 */
export function Opening({ signedIn, labels }: { signedIn: boolean; labels: Labels }) {
  const router = useRouter();
  const [step, setStep] = useState<"splash" | "welcome">("splash");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (signedIn) router.replace("/app");
      else if (seen()) router.replace("/connexion");
      else setStep("welcome");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [router, signedIn]);
  return step === "splash" ? <Splash label={labels.loading} /> : <Welcome labels={labels} />;
}
