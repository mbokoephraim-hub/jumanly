"use server";

import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  askCoach,
  coachInput,
  type CoachInput,
  type CoachResult,
} from "@/server/services/learn-coach";
import { reportError } from "@/server/observability";

/**
 * Asks the AI Learning Coach (ux-test, étape 2). Order of CLAUDE.md: validate → session → rights
 * (enrollment and plan, in `askCoach`) → quota (`runAi`) → service.
 */
export async function askCoachAction(
  raw: CoachInput,
): Promise<CoachResult | { ok: false; error: "failed" }> {
  const parsed = coachInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const user = await requireUser("/app/orbi");
  const t = await getTranslations("learn.coach.answer");
  const keys = [
    "explain",
    "rephrase",
    "example",
    "noExample",
    "exercise",
    "mistake",
    "mistakeHint",
    "noMistake",
    "revision",
    "noRevision",
    "notCovered",
    "declined",
  ] as const;
  // `{lesson}` stays a placeholder, filled by the service.
  const texts = Object.fromEntries(
    keys.map((key) => [
      key,
      key === "exercise" || key === "mistakeHint" ? t(key, { lesson: "{lesson}" }) : t(key),
    ]),
  ) as Record<(typeof keys)[number], string>;
  try {
    return await askCoach(db, user.id, parsed.data, texts);
  } catch (error) {
    void reportError(error, { message: "Coach IA" });
    return { ok: false, error: "failed" };
  }
}
