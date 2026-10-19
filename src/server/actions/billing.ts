"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { billingSubject } from "@/server/services/accounts";
import { billingDetailsSchema, saveBillingDetails } from "@/server/services/invoices";
import { scheduleDowngrade, setCancelAtPeriodEnd } from "@/server/services/subscriptions";

const subjectSchema = z.object({ family: z.enum(["talent", "rh", "company"]) });

/** Pages a billing form may come back to (talent: Formules, Factures). */
const backPaths = ["/app/abonnement", "/app/abonnement/formules", "/app/abonnement/factures"];

function backTo(formData: FormData, params: string) {
  const asked = String(formData.get("back") ?? "");
  const path = backPaths.includes(asked) ? asked : "/app/abonnement";
  return params ? `${path}?${params}` : path;
}

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
  redirect(backTo(formData, "resiliation=1"));
}

export async function resumeSubscription(formData: FormData) {
  await setCancelAtPeriodEnd(db, await subjectFrom(formData), false);
  revalidatePath("/app/abonnement");
  redirect(backTo(formData, "reactivation=1"));
}

/** A cheaper plan for the next period, or `""` to undo the scheduled change. */
export async function downgradeSubscription(formData: FormData) {
  const plan = String(formData.get("plan") ?? "");
  await scheduleDowngrade(db, await subjectFrom(formData), plan || null);
  revalidatePath("/app/abonnement");
  redirect(backTo(formData, plan ? "changement=1" : ""));
}

/** « Informations de facturation »: shown on the next invoices (issued ones keep theirs). */
export async function saveBillingDetailsAction(formData: FormData) {
  const input = billingDetailsSchema.safeParse({
    name: formData.get("name") ?? "",
    address: formData.get("address") ?? "",
    taxId: formData.get("taxId") ?? "",
    email: formData.get("email") ?? "",
  });
  const subject = await subjectFrom(formData);
  if (!input.success) redirect(backTo(formData, "facturation=erreur"));
  await saveBillingDetails(db, subject, input.data);
  revalidatePath("/app/abonnement");
  redirect(backTo(formData, "facturation=1"));
}
