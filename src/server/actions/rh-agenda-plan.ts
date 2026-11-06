"use server";

import { refresh } from "next/cache";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/server/db";
import { onMessageSent } from "@/server/application-events";
import { requireHire } from "@/server/hire-context";
import { mailInterviewConfirmed } from "@/server/hire-emails";
import { reportError } from "@/server/observability";
import { ConnectError, sendMessage } from "@/server/services/connect";
import { HireError } from "@/server/services/hire";
import { CHECK_DELAYS, planVerificationCheck } from "@/server/services/hire-verification";
import { fixInterview, slotToDate } from "@/server/services/interviews";
import { defaultTimeZone } from "@/lib/dates";

/**
 * « À planifier » of the recruiter's Agenda (Ephraïm 06/11/2026): a touch on a person opens a
 * window over the blurred page. « Enregistrer et envoyer » fixes the interview (or the delay of the
 * document check) and tells the candidate at once, in the conversation and by e-mail. Order of
 * CLAUDE.md: validate → session → role and right → service.
 */

export type PlanResult = { ok: true; day: string } | { ok: false; error: string };

const dayOf = (date: Date, timeZone: string) => date.toLocaleDateString("en-CA", { timeZone });

export async function rhFixInterviewAction(input: {
  application: string;
  mode: string;
  day: string;
  hour: string;
  link: string;
  address: string;
}): Promise<PlanResult> {
  const { ctx } = await requireHire("/app/hire/entretiens", "manage", "interviews");
  const timeZone = defaultTimeZone();
  let result: Awaited<ReturnType<typeof fixInterview>>;
  try {
    result = await fixInterview(db, ctx, input, timeZone);
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
  if (result.status !== "fixed") return { ok: false, error: result.status };
  await mailInterviewConfirmed(result.talent, {
    company: result.company,
    jobTitle: result.jobTitle,
    date: result.startsAt,
    timezone: timeZone,
    href: `/app/messages/${result.conversationId}`,
    place: result.place,
    link: result.link,
  }).catch((error) => reportError(error));
  refresh();
  return { ok: true, day: dayOf(result.startsAt, timeZone) };
}

const checkInput = z.object({
  application: z.string().trim().min(1).max(60),
  days: z.coerce
    .number()
    .int()
    .refine((value) => (CHECK_DELAYS as readonly number[]).includes(value)),
});

/** « Délai de vérification »: the check falls N days later at 10:00, a reminder goes to the chat. */
export async function rhPlanCheckAction(input: {
  application: string;
  days: number;
}): Promise<PlanResult> {
  const parsed = checkInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { user, ctx } = await requireHire("/app/hire/entretiens", "manage", "sort");
  const timeZone = defaultTimeZone();
  const now = new Date();
  const day = dayOf(new Date(now.getTime() + parsed.data.days * 86_400_000), timeZone);
  const checkAt = slotToDate(`${day}T10:00`, timeZone);
  if (!checkAt) return { ok: false, error: "invalid" };
  let planned: Awaited<ReturnType<typeof planVerificationCheck>>;
  try {
    planned = await planVerificationCheck(db, ctx, parsed.data.application, checkAt, now);
  } catch (error) {
    if (error instanceof HireError) return { ok: false, error: "invalid" };
    throw error;
  }
  // The reminder the candidate finds in the conversation with the recruiter.
  try {
    const t = await getTranslations("phoneRhAgenda.sheet");
    const format = await getFormatter();
    const sent = await sendMessage(db, { userId: user.id, hire: ctx }, planned.conversationId, {
      body: t("checkMessage", {
        date: format.dateTime(checkAt, {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone,
        }),
        jobTitle: planned.jobTitle,
      }),
    });
    await onMessageSent({ ...sent, senderName: user.name }).catch((error) => reportError(error));
  } catch (error) {
    // The date stays: only the reminder failed (a blocked conversation).
    if (!(error instanceof ConnectError)) throw error;
  }
  refresh();
  return { ok: true, day };
}
