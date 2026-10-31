import "server-only";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { initialsOf, type LetterSheetData } from "@/features/letter/design";
import { countryName } from "@/lib/countries";
import type { LetterFacts } from "@/server/services/letter-design";

/** The words of the band and the head of a letter (texts `letterModel.*`). */
export async function sheetDataOf(
  facts: LetterFacts,
  letter: { text: string; updatedAt: Date },
): Promise<LetterSheetData> {
  const [t, format, locale] = await Promise.all([
    getTranslations("letterModel"),
    getFormatter(),
    getLocale(),
  ]);
  const place = [facts.city, facts.country ? countryName(facts.country, locale) : ""]
    .filter(Boolean)
    .join(", ");
  return {
    name: facts.name,
    headline: facts.headline,
    contacts: [facts.email, place].filter(Boolean),
    photoUrl: facts.photoUrl,
    initials: initialsOf(facts.name),
    heading: t("heading"),
    date: t("date", {
      date: format.dateTime(letter.updatedAt, { day: "numeric", month: "long", year: "numeric" }),
    }),
    recipient: facts.job ? t("recipient", { company: facts.job.company }) : null,
    subject: facts.job ? t("subject", { title: facts.job.title }) : null,
    text: letter.text,
  };
}
