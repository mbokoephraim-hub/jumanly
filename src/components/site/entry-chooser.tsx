"use client";

import { useState } from "react";
import { Icon } from "@/components/brand/icon";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { loginHref, signupHref } from "@/lib/signup";

const PROFILES = ["talent", "rh"] as const;

export type EntryTexts = {
  question: string;
  signup: string;
  login: string;
} & Record<(typeof PROFILES)[number], { label: string; text: string }>;

/**
 * « Vous êtes… » on the home page (decision of 2026-10-27), on the phone and the computer: the
 * person picks talent or recruiter, then « S'inscrire » or « Se connecter », always in view. The
 * texts come from the page (no text bundle sent to the browser).
 */
export function EntryChooser({ texts }: { texts: EntryTexts }) {
  const [profile, setProfile] = useState<(typeof PROFILES)[number]>("talent");
  return (
    <div
      role="group"
      aria-labelledby="jm-entree-titre"
      className="flex flex-col gap-3 rounded-[24px] bg-blanc/8 p-4 ring-1 ring-blanc/18 ring-inset sm:max-w-[520px]"
    >
      <p id="jm-entree-titre" className="text-sm font-semibold text-blanc/85">
        {texts.question}
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-full bg-blanc/10 p-1">
        {PROFILES.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={profile === item}
            onClick={() => setProfile(item)}
            className={cx(
              "flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-[15px] font-semibold transition-colors",
              profile === item ? "bg-blanc text-sapin" : "text-blanc hover:bg-blanc/10",
            )}
          >
            <Icon name={item === "talent" ? "profil" : "hire"} className="size-4" />
            {texts[item].label}
          </button>
        ))}
      </div>
      <p className="text-[13px] leading-[18px] text-blanc/75" aria-live="polite">
        {texts[profile].text}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ButtonLink
          href={signupHref({ profil: profile })}
          size="lg"
          fullWidth
          className="shadow-[0_0_32px_rgba(166,242,107,0.45)]"
        >
          {texts.signup}
        </ButtonLink>
        <ButtonLink
          href={profile === "rh" ? "/connexion?profil=rh" : loginHref()}
          variant="inverse"
          size="lg"
          fullWidth
        >
          {texts.login}
        </ButtonLink>
      </div>
    </div>
  );
}
