"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { createDispute, disputeSchema } from "@/server/matching/service";

const jobPath = (slug: string) => `/app/jobs/${encodeURIComponent(slug)}`;

/** « Signaler une erreur » on a score: valider → session → service (no plan, no quota). */
export async function disputeAction(formData: FormData) {
  const slug = String(formData.get("job") ?? "").slice(0, 200);
  const parsed = disputeSchema.safeParse({
    job: slug,
    reason: formData.get("reason"),
    details: String(formData.get("details") ?? ""),
    notifyRecruiter: formData.get("notifyRecruiter") === "on",
  });
  const user = await requireUser(jobPath(slug));
  if (!parsed.success) redirect(`${jobPath(slug)}?revision=invalide#revision`);
  const result = await createDispute(db, user.id, parsed.data);
  if (result === "notFound") redirect("/app/jobs");
  refresh();
  redirect(`${jobPath(slug)}?revision=${result}#revision`);
}
