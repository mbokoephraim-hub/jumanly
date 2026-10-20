"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { endingReminderDays } from "@/server/services/job-reminders";

const schema = z.object({
  presence: z.literal("on").optional(),
  receipts: z.literal("on").optional(),
  space: z.enum(["0", "1"]).default("0"),
  reminders: z.array(z.enum(endingReminderDays)).max(4),
});

/** « Messagerie et rappels »: presence, read receipts and, for a recruiter, the reminder days. */
export async function updateMessagingSettings(formData: FormData) {
  const user = await requireUser("/app/parametres/messagerie");
  const parsed = schema.safeParse({
    presence: formData.get("presence") ?? undefined,
    receipts: formData.get("receipts") ?? undefined,
    space: formData.get("space") ?? "0",
    reminders: formData.getAll("reminder").map(String),
  });
  if (!parsed.success) redirect("/app/parametres/messagerie");
  await db.user.update({
    where: { id: user.id },
    data: {
      showPresence: parsed.data.presence === "on",
      readReceipts: parsed.data.receipts === "on",
      // The reminder days are only shown (and so only sent) in a recruiter's space.
      ...(parsed.data.space === "1" ? { endingReminders: parsed.data.reminders } : {}),
    },
  });
  redirect("/app/parametres/messagerie?ok=1");
}
