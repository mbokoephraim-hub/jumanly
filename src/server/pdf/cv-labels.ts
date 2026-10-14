import "server-only";
import { getTranslations } from "next-intl/server";
import { countryName } from "@/config/countries";
import { languageName } from "@/lib/dates";
import { dynamic } from "@/i18n/dynamic";
import { skillLevelKeys } from "@/server/services/profile";
import type { CvLabels } from "./cv-document";

/** "2024-03" → "mars 2024". */
export function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Every text a CV prints, translated (CLAUDE.md § 7: no text in the code). */
export async function cvLabels(title: string): Promise<CvLabels> {
  const t = await getTranslations();
  const td = dynamic(t);
  return {
    title,
    sections: {
      summary: t("career.cv.section.summary"),
      experience: t("career.cv.section.experience"),
      education: t("career.cv.section.education"),
      skills: t("career.cv.section.skills"),
      languages: t("career.cv.section.languages"),
    },
    skillLevel: (level) =>
      td(`talent.profile.skills.level.${skillLevelKeys[level as 1 | 2 | 3 | 4] ?? "intermediate"}`),
    language: (code, level, cefr) =>
      t("ui.languageLevel", {
        language: languageName(code),
        level: cefr
          ? `${td(`talent.profile.languages.level.${level}`)}, ${cefr}`
          : td(`talent.profile.languages.level.${level}`),
      }),
    period: (start, end) =>
      end
        ? t("talent.profile.experience.period.text", {
            start: formatMonth(start),
            end: formatMonth(end),
          })
        : t("talent.profile.experience.period.current", { start: formatMonth(start) }),
    years: (start, end) =>
      end === null
        ? start
          ? t("talent.profile.experience.period.text", {
              start: String(start),
              end: t("talent.profile.education.inProgress"),
            })
          : t("talent.profile.education.inProgress")
        : start
          ? t("talent.profile.experience.period.text", { start: String(start), end: String(end) })
          : String(end),
    location: (city, country) =>
      [city, country ? countryName(country) : ""].filter(Boolean).join(", "),
  };
}
