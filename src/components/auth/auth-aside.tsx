"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Icon } from "@/components/brand/icon";

type Scene = { character: string; title?: "partners"; text?: "plan" | "partners" };

/** Character of each screen (mockups 02-01 to 02-10); the sign-in one by default. */
const scenes: [string, Scene][] = [
  ["/mot-de-passe-oublie", { character: "kofi-telephone" }],
  ["/reinitialiser", { character: "nadia-montre" }],
  ["/inscription/forfait", { character: "kofi-joie", text: "plan" }],
  ["/inscription/compte", { character: "fatou-telephone" }],
  ["/inscription/verification", { character: "diallo-telephone" }],
  ["/inscription/paiement", { character: "amani-telephone" }],
  ["/activer", { character: "fatou-joie", title: "partners", text: "partners" }],
];

export type AuthAsideTexts = {
  eyebrow: string;
  tagline: string;
  intro: string;
  partnersTitle: string;
  partnersText: string;
  planText: Record<string, string>;
  checks: string[];
};

/** Sapin panel on the left of every sign-in and sign-up screen (wide screens only). */
export function AuthAside({ texts }: { texts: AuthAsideTexts }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const scene = scenes.find(([path]) => pathname.startsWith(path))?.[1] ?? {
    character: "amani-salut",
  };
  const profile = params.get("profil") ?? "talent";
  const text =
    scene.text === "partners"
      ? texts.partnersText
      : scene.text === "plan"
        ? (texts.planText[profile] ?? texts.intro)
        : texts.intro;
  return (
    <div className="relative flex h-full flex-col justify-center gap-5 px-[52px] pt-24 pb-[260px]">
      <p className="text-xs font-bold tracking-[0.14em] text-lime uppercase">{texts.eyebrow}</p>
      <p className="jm-rise text-[46px] leading-[1.08] font-bold tracking-tight text-blanc">
        {scene.title === "partners" ? texts.partnersTitle : texts.tagline}
      </p>
      <p className="max-w-[420px] text-lg leading-[25px] text-blanc/80">{text}</p>
      <ul className="mt-1 flex flex-col gap-2.5">
        {texts.checks.map((check) => (
          <li key={check} className="flex items-center gap-3 text-[13px] text-blanc/90">
            <Icon name="check" className="size-4 text-lime" />
            {check}
          </li>
        ))}
      </ul>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG illustration */}
      <img
        key={scene.character}
        src={`/illustrations/jumanly-${scene.character}.svg`}
        alt=""
        height={300}
        className="jm-pop absolute right-[44px] bottom-0 h-[300px] w-auto"
      />
    </div>
  );
}
