"use server";

import { getTranslations } from "next-intl/server";
import { talentCards } from "@/components/recruiter/talent-search";
import type { TalentCard } from "@/components/recruiter/talent-list";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { allowAttempt } from "@/server/rate-limit";
import { searchTalents, SEARCH_MAX_PAGES } from "@/server/services/talent-search";

/**
 * The next profiles of « Découvrir », loaded as the list reaches its end. The same search as the
 * page (not charged again: one search per query and month), within the cap on pages.
 */
export async function moreTalentsAction(
  query: Record<string, string>,
  page: number,
): Promise<{ cards: TalentCard[]; more: boolean } | null> {
  const { ctx } = await requireHire("/app/hire/candidats?vue=talents", "manage");
  if (!Number.isInteger(page) || page < 2 || page > SEARCH_MAX_PAGES) return null;
  if (!(await allowAttempt("talentSearch", ctx.userId))) return null;
  const clean = Object.fromEntries(
    Object.entries(query)
      .filter(([key]) =>
        ["q", "skills", "location", "job", "level", "availability", "remote"].includes(key),
      )
      .map(([key, value]) => [key, String(value).slice(0, 320)]),
  );
  const result = await searchTalents(db, ctx, { ...clean, page });
  if (result.status !== "ok" || result.page !== page) return { cards: [], more: false };
  const t = await getTranslations("hireTalents");
  return {
    cards: talentCards(result.results, t, clean.job ?? ""),
    more: result.page < result.pages,
  };
}
