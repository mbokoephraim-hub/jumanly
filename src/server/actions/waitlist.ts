"use server";

import { getLocale } from "next-intl/server";
import { allowAttempt, clientIp } from "@/server/rate-limit";
import { emailDeliveryAvailable } from "@/server/adapters/email";
import { db } from "@/server/db";
import { reportError } from "@/server/observability";
import {
  joinWaitlist,
  waitlistErrors,
  waitlistSchema,
  type WaitlistFieldError,
} from "@/server/services/waitlist";
import { sendWaitlistConfirmation } from "@/server/waitlist-email";

export type WaitlistFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Record<string, WaitlistFieldError>;
      values: Record<string, string>;
    }
  | { status: "rateLimited" | "failed"; values: Record<string, string> }
  | { status: "joined"; firstName: string; email: string; already: boolean; mailed: boolean };

/**
 * /liste-attente. Order (CLAUDE.md): validate → (no session: anyone may join) → rate limit by
 * address and by IP → service, then the confirmation e-mail once per address. The entry is kept
 * even when the e-mail cannot leave.
 */
export async function joinWaitlistAction(
  _: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const values = Object.fromEntries(
    [...formData.entries()]
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value)]),
  );
  // Hidden field only robots fill in: they get the success screen and nothing is saved.
  if (values.website) {
    return { status: "joined", firstName: "", email: "", already: false, mailed: false };
  }
  const parsed = waitlistSchema.safeParse(values);
  if (!parsed.success) return { status: "invalid", errors: waitlistErrors(parsed.error), values };
  const input = parsed.data;
  const ip = await clientIp();
  const allowed =
    (await allowAttempt("waitlist", input.email)) &&
    (!ip || (await allowAttempt("waitlistIp", ip)));
  if (!allowed) return { status: "rateLimited", values };

  const locale = (await getLocale()) === "en" ? "en" : "fr";
  let entry: Awaited<ReturnType<typeof joinWaitlist>>;
  try {
    entry = await joinWaitlist(db, input, locale);
  } catch (error) {
    void reportError(error, { message: "Liste d'attente : enregistrement impossible" });
    return { status: "failed", values };
  }

  let mailed = entry.emailSent;
  if (!entry.emailSent && emailDeliveryAvailable()) {
    try {
      await sendWaitlistConfirmation({ locale, ...input });
      await db.waitlistEntry.update({
        where: { id: entry.id },
        data: { emailSentAt: new Date() },
      });
      mailed = true;
    } catch (error) {
      void reportError(error, { message: "Liste d'attente : e-mail de confirmation non envoyé" });
    }
  }
  return {
    status: "joined",
    firstName: input.firstName,
    email: input.email,
    already: !entry.created,
    mailed,
  };
}
