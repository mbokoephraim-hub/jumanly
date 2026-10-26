"use server";

import { refresh, updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { updateCompanyPage, type CompanyPageInput } from "@/server/services/org-page";
import { transferOwnership } from "@/server/services/org-structure";

/**
 * The gestures of Page entreprise (étape 3, A3). Order of CLAUDE.md: validate → session → role →
 * service. Each returns what the toast says; the page is refreshed so the preview stays true.
 */
const PAGE = "/app/organisation";

export type PageActionResult =
  { ok: true; text: string } | { ok: false; text: string; field?: string };

export async function updateCompanyPageAction(input: CompanyPageInput): Promise<PageActionResult> {
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgPage");
  const result = await updateCompanyPage(db, ctx, input);
  if (!result.ok) {
    const key = result.field === "name" || result.field === "website" ? result.field : "other";
    return { ok: false, text: t(`error.${key}`), field: key };
  }
  // The public company page, Explorer and the job pages show the page.
  updateTag("jobs");
  refresh();
  return { ok: true, text: t("saved") };
}

/** « Transférer la propriété »: the owner gives the page to another member and stays in the team. */
export async function transferPageOwnershipAction(membershipId: string): Promise<PageActionResult> {
  const parsed = z.string().min(1).max(60).safeParse(membershipId);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgPage");
  if (!parsed.success) return { ok: false, text: t("error.generic") };
  try {
    await transferOwnership(db, ctx, parsed.data);
  } catch (error) {
    if (error instanceof HireError) return { ok: false, text: t("error.generic") };
    throw error;
  }
  const member = await db.membership.findFirst({
    where: { id: parsed.data, organizationId: ctx.organizationId },
    select: { user: { select: { name: true } } },
  });
  refresh();
  return { ok: true, text: t("owner.done", { name: member?.user.name ?? "" }) };
}
