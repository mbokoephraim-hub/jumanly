/* eslint-disable @next/next/no-img-element -- profile photos come from the account (any https host) */
import { getTranslations } from "next-intl/server";
import { Character, type CharacterName, type Pose } from "@/components/brand/character";
import type { IconName } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import type { IntroProfile } from "@/lib/app-intro";
import type { IntroData, IntroModule } from "./app-intro";

/**
 * Texts and pictures of the welcome intro (docs/refonte-connexion § 7), prepared on the server for
 * the active space. The intro itself only loads when it plays.
 */

type CardLook = { icon: IconName; bg?: string; kind?: "gauge" | "bar" };
type ModuleLook = { icon: IconName; band: string; cards: [CardLook, CardLook] };

const bands = ["#A6F26B", "#2FD3A6", "#E3F67C", "#7DE36B"];
const mint = "#DDF6EE";
const lemon = "#F1F7C9";

const looks: Record<IntroProfile, [IconName, CardLook, CardLook][]> = {
  talent: [
    ["learn", { icon: "cours-video", kind: "bar" }, { icon: "certificat", bg: lemon }],
    ["career", { icon: "cv", kind: "gauge" }, { icon: "intelligence", bg: mint }],
    ["jobs", { icon: "jobs" }, { icon: "valider", bg: mint }],
    ["connect", { icon: "message" }, { icon: "calendrier", bg: lemon }],
  ],
  rh: [
    ["jobs", { icon: "jobs" }, { icon: "equipe", bg: mint }],
    ["hire", { icon: "hire", kind: "bar" }, { icon: "valider", bg: lemon }],
    ["intelligence", { icon: "intelligence", bg: mint }, { icon: "transparence" }],
    ["connect", { icon: "message" }, { icon: "calendrier", bg: lemon }],
  ],
  company: [
    ["jobs", { icon: "jobs" }, { icon: "entreprise", bg: lemon }],
    ["competence", { icon: "certificat" }, { icon: "intelligence", bg: mint }],
    ["equipe", { icon: "equipe" }, { icon: "message", bg: lemon }],
    ["hire", { icon: "statistiques", kind: "bar" }, { icon: "valider", bg: mint }],
  ],
};

const portraits: Record<IntroProfile, { name: CharacterName; pose: Pose; bg: string }> = {
  talent: { name: "amani", pose: "joie", bg: "#E4FAD0" },
  rh: { name: "nadia", pose: "montre", bg: "#F7E9C6" },
  company: { name: "diallo", pose: "montre", bg: "#E9EEF0" },
};

export async function introData({
  profile,
  name,
  image,
  seenAt,
}: {
  profile: IntroProfile;
  name: string | null;
  image: string | null;
  seenAt: Date | null;
}): Promise<IntroData> {
  const t = await getTranslations("intro");
  const text = dynamic(t);
  const modules = looks[profile].map(([icon, ...cards], index): IntroModule => {
    const key = `${profile}.modules.${index + 1}`;
    const look: ModuleLook = { icon, band: bands[index], cards: cards as [CardLook, CardLook] };
    return {
      tag: text(`${key}.tag`),
      icon: look.icon,
      left: text(`${key}.left`),
      right: text(`${key}.right`),
      band: look.band,
      cards: look.cards.map((card, position) => {
        const prefix = `${key}.cards.${position + 1}`;
        return {
          ...card,
          title: text(`${prefix}.title`),
          text: text(`${prefix}.text`),
          pill: text.has(`${prefix}.pill`) ? text(`${prefix}.pill`) : undefined,
          value: text.has(`${prefix}.value`) ? Number(text(`${prefix}.value`)) : undefined,
        };
      }) as IntroModule["cards"],
    };
  });
  const photo = image && /^(https:\/\/|\/)/.test(image) ? image : null;
  const portrait = portraits[profile];
  return {
    name,
    seen: Boolean(seenAt),
    portraitBg: portrait.bg,
    photo: Boolean(photo),
    portrait: photo ? (
      <img src={photo} alt="" referrerPolicy="no-referrer" />
    ) : (
      <Character name={portrait.name} pose={portrait.pose} height={200} />
    ),
    modules,
    labels: {
      label: t("label"),
      skip: t("skip"),
      skipKey: t("skipKey"),
      wordmark: t("wordmark"),
      welcome: name ? t("welcome") : t("welcomeNoName"),
      back: name ? t("back", { name }) : t("backNoName"),
      slogan: t("slogan"),
      live: name ? t("live", { name }) : t("liveNoName"),
      toastFirst: name ? t("toast.first", { name }) : t("welcomeNoName"),
      toastBack: name ? t("toast.back", { name }) : t("backNoName"),
    },
  };
}
