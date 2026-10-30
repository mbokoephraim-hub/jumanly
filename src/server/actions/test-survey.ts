"use server";

import { getLocale } from "next-intl/server";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import {
  saveTestFeedback,
  testSurveyErrors,
  testSurveySchema,
  testSurveyValues,
  type TestSurveyError,
} from "@/server/services/waitlist-test";

export type TestSurveyState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Record<string, TestSurveyError>;
      values: Record<string, string | string[]>;
    }
  | { status: "failed" | "rateLimited"; values: Record<string, string | string[]> }
  | { status: "saved" | "already" | "unknown" };

/**
 * /questionnaire-test/[token]. Order (CLAUDE.md): validate → (no session: the secret link stands
 * for the tester) → rate limit by IP → service. One answer per link.
 */
export async function submitTestSurveyAction(
  _: TestSurveyState,
  formData: FormData,
): Promise<TestSurveyState> {
  const values = testSurveyValues(formData);
  const token = typeof values.token === "string" ? values.token : "";
  const parsed = testSurveySchema.safeParse(values);
  if (!parsed.success) return { status: "invalid", errors: testSurveyErrors(parsed.error), values };
  const ip = await clientIp();
  if (ip && !(await allowAttempt("waitlistIp", ip))) return { status: "rateLimited", values };
  const locale = (await getLocale()) === "en" ? "en" : "fr";
  try {
    return { status: await saveTestFeedback(db, token, parsed.data, locale) };
  } catch (error) {
    void reportError(error, { message: "Test de la plateforme : réponses non enregistrées" });
    return { status: "failed", values };
  }
}
