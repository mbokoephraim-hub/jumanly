/* eslint-disable @next/next/no-img-element -- small static SVG: next/image would add nothing */
import { useTranslations } from "next-intl";

export const characters = ["amani", "kofi", "nadia", "diallo", "fatou"] as const;
export const poses = ["salut", "montre", "joie", "perplexe", "repos", "telephone"] as const;
export type CharacterName = (typeof characters)[number];
export type Pose = (typeof poses)[number];

/**
 * Illustrated characters (ressources/illustrations): Amani the talent, Kofi the graduate,
 * Nadia the recruiter, M. Diallo the director, Fatou the trainer. Decorative by default.
 * Give the height; the width follows each drawing's proportions.
 */
export function Character({
  name,
  pose,
  height = 160,
  labelled = false,
}: {
  name: CharacterName;
  pose: Pose;
  height?: number;
  labelled?: boolean;
}) {
  const t = useTranslations("brand.characters");
  return (
    <img
      src={`/illustrations/jumanly-${name}-${pose}.svg`}
      alt={labelled ? t(name) : ""}
      height={height}
      style={{ height, width: "auto" }}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Orbi, the AI assistant, for Intelligence screens. */
export function Orbi({ size = 96, labelled = false }: { size?: number; labelled?: boolean }) {
  const t = useTranslations("brand.characters");
  return (
    <img
      src="/illustrations/jumanly-orbi.svg"
      alt={labelled ? t("orbi") : ""}
      height={size}
      style={{ height: size, width: "auto" }}
      loading="lazy"
      decoding="async"
    />
  );
}
