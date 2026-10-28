"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { SCORECARD_CRITERIA_MAX, storedCriteria } from "@/server/services/evaluation";
import { HireError } from "@/server/services/hire";
import { saveSettingsTemplate, setCriterion, setStage } from "@/server/services/org-settings";

/**
 * The gestures of Réglages du recrutement (étape 3, A5). Order of CLAUDE.md: validate → session →
 * role → service. Each returns what the toast says; the page is refreshed so the lists stay true.
 */
const PAGE = "/app/organisation/reglages";

export type SettingsActionResult = { ok: true; text: string } | { ok: false; text: string };

async function run(
  work: (t: Awaited<ReturnType<typeof getTranslations<"orgSettings">>>) => Promise<string>,
  errorText?: string,
): Promise<SettingsActionResult> {
  const t = await getTranslations("orgSettings");
  try {
    const text = await work(t);
    refresh();
    return { ok: true, text };
  } catch (error) {
    if (error instanceof HireError) return { ok: false, text: errorText ?? t("error") };
    throw error;
  }
}

export async function setStageAction(input: { key: string; on: boolean }) {
  const parsed = z.object({ key: z.string().min(1).max(40), on: z.boolean() }).safeParse(input);
  const { ctx } = await requireHire(PAGE, "administer");
  return run(async (t) => {
    if (!parsed.success) throw new HireError("invalid");
    const name = await setStage(db, ctx, parsed.data.key, parsed.data.on);
    return parsed.data.on ? t("stages.added", { name }) : t("stages.removed", { name });
  });
}

export async function saveTemplateAction(input: { kind: string; body: string }) {
  const parsed = z
    .object({ kind: z.string().min(1).max(40), body: z.string().max(4000) })
    .safeParse(input);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgSettings");
  return run(async () => {
    if (!parsed.success) throw new HireError("invalid");
    const kind = parsed.data.kind as "convocation";
    const name = t(`templates.kind.${kind}`);
    await saveSettingsTemplate(db, ctx, kind, name, parsed.data.body);
    return t("templates.saved", { name });
  }, t("templates.error"));
}

export async function addCriterionAction(name: string) {
  const parsed = z.string().max(200).safeParse(name);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgSettings");
  const clean = parsed.success ? parsed.data.trim().replace(/\s+/g, " ") : "";
  if (clean.length < 2 || clean.length > 80)
    return { ok: false, text: t("grid.error.length") } satisfies SettingsActionResult;
  const org = await db.organization.findUniqueOrThrow({
    where: { id: ctx.organizationId },
    select: { scorecardCriteria: true },
  });
  const criteria = storedCriteria(org.scorecardCriteria);
  if (criteria.length >= SCORECARD_CRITERIA_MAX)
    return { ok: false, text: t("grid.error.full") } satisfies SettingsActionResult;
  if (criteria.some((item) => item.name.toLowerCase() === clean.toLowerCase()))
    return { ok: false, text: t("grid.error.duplicate") } satisfies SettingsActionResult;
  return run(async () => {
    await setCriterion(db, ctx, { add: clean });
    return t("grid.added", { name: clean });
  });
}

export async function removeCriterionAction(name: string) {
  const parsed = z.string().min(1).max(200).safeParse(name);
  const { ctx } = await requireHire(PAGE, "administer");
  return run(async (t) => {
    if (!parsed.success) throw new HireError("invalid");
    await setCriterion(db, ctx, { remove: parsed.data });
    return t("grid.removed", { name: parsed.data });
  });
}
