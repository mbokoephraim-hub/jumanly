"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { dynamic } from "@/i18n/dynamic";
import {
  personalAnswersSchema,
  simpleAnswersSchema,
  simpleDiagnostic,
} from "@/server/services/diagnostic";
import { asJson, DIAGNOSTIC_GATE, personalizedDiagnostic } from "@/server/services/diagnostic-ai";

/**
 * Simplified diagnostic: fixed rules, no AI, available to everyone. With
 * `career.diagnostic.level` = personalized, the extra answers go to Jumanly Intelligence
 * (consent and credits checked in src/server/ai); without them, the rules' result is kept.
 */
export async function submitDiagnostic(formData: FormData) {
  const entries = Object.fromEntries(formData);
  const parsed = simpleAnswersSchema.safeParse(entries);
  const user = await requireUser("/app/career/diagnostic");
  if (!parsed.success) redirect("/app/career/diagnostic?erreur=1#questions");

  const personal = personalAnswersSchema.safeParse({
    ...entries,
    values: formData.getAll("values").map(String),
    useProfile: formData.get("useProfile") === "on",
  });
  const allowed =
    formData.get("personalized") === "1" &&
    DIAGNOSTIC_GATE.levels.includes(
      await level(db, { type: "user", id: user.id }, DIAGNOSTIC_GATE.key),
    );
  if (allowed && !personal.success) redirect("/app/career/diagnostic?erreur=1#questions");

  let outcome: { level: "simple" | "personalized"; result: unknown; error?: string } = {
    level: "simple",
    result: simpleDiagnostic(parsed.data),
  };
  if (allowed && personal.success) {
    const t = dynamic(await getTranslations("career.diagnostic"));
    outcome = await personalizedDiagnostic(
      db,
      user.id,
      parsed.data,
      personal.data,
      (question, code) => (t.has(`q.${question}.${code}`) ? t(`q.${question}.${code}`) : code),
    );
  }
  const diagnostic = await db.careerDiagnostic.create({
    data: {
      userId: user.id,
      level: outcome.level,
      answers: asJson(
        allowed && personal.success ? { ...parsed.data, ...personal.data } : parsed.data,
      ),
      result: asJson(outcome.result),
    },
  });
  redirect(
    `/app/career/diagnostic?bilan=${diagnostic.id}${outcome.error ? `&ia=${outcome.error}` : ""}`,
  );
}
