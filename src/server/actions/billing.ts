"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { billingSubject } from "@/server/services/accounts";
import { scheduleDowngrade, setCancelAtPeriodEnd } from "@/server/services/subscriptions";

const subjectSchema = z.object({ family: z.enum(["talent", "rh", "company"]) });

async function subjectFrom(formData: FormData) {
  const user = await requireUser("/app/abonnement");
  const { family } = subjectSchema.parse({ family: formData.get("family") });
  const subject = await billingSubject(db, user.id, family);
  if (!subject) redirect("/app/abonnement");
  return subject;
}

/** Cancel at the end of the paid period (data kept, partie 05 § 6). */
export async function cancelSubscription(formData: FormData) {
  await setCancelAtPeriodEnd(db, await subjectFrom(formData), true);
  revalidatePath("/app/abonnement");
  redirect("/app/abonnement?resiliation=1");
}

export async function resumeSubscription(formData: FormData) {
  await setCancelAtPeriodEnd(db, await subjectFrom(formData), false);
  revalidatePath("/app/abonnement");
  redirect("/app/abonnement?reactivation=1");
}

/** A cheaper plan for the next period, or `""` to undo the scheduled change. */
export async function downgradeSubscription(formData: FormData) {
  const plan = String(formData.get("plan") ?? "");
  await scheduleDowngrade(db, await subjectFrom(formData), plan || null);
  revalidatePath("/app/abonnement");
  redirect("/app/abonnement");
}
