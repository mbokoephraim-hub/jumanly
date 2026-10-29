import "server-only";
import { getTranslations } from "next-intl/server";
import { dynamic } from "@/i18n/dynamic";
import type { CvLanguageLevel, CvTextLabels } from "./render/build";
import { labelsFromData, type CvLabelData } from "./render/labels-data";
import { cvBlockTypes, type CvBlockType } from "./templates/registry";
import type { CvTitleLanguage } from "./style";

const levelCodes: CvLanguageLevel[] = ["native", "fluent", "professional", "intermediate", "basic"];

/**
 * Titles and levels printed on a CV, in the language chosen for the titles (`cv.titles.<lang>.*`,
 * `cv.levels.<lang>.*`), whatever the language of the interface (§ 4.5). Plain data, for the
 * browser's live preview.
 */
export async function cvTextLabelData(language: CvTitleLanguage): Promise<CvLabelData> {
  const t = dynamic(await getTranslations("cv"));
  return {
    language,
    titles: Object.fromEntries(
      cvBlockTypes.map((type) => [type, t(`titles.${language}.${type}`)]),
    ) as Record<CvBlockType, string>,
    references: t(`references.${language}`),
    levels: {
      1: t(`levels.${language}.1`),
      2: t(`levels.${language}.2`),
      3: t(`levels.${language}.3`),
      4: t(`levels.${language}.4`),
    },
    languageLevels: Object.fromEntries(
      levelCodes.map((code) => [code, t(`languageLevels.${language}.${code}`)]),
    ) as Record<CvLanguageLevel, string>,
    present: t(`present.${language}`),
  };
}

/** The same labels with their functions, for the server's layout and the PDF. */
export async function cvTextLabels(language: CvTitleLanguage): Promise<CvTextLabels> {
  return labelsFromData(await cvTextLabelData(language));
}
