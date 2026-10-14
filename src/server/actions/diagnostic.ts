"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { simpleAnswersSchema, simpleDiagnostic } from "@/server/services/diagnostic";

/** Simplified diagnostic: fixed rules, no AI, available to everyone. */
export async function submitDiagnostic(formData: FormData) {
  const user = await requireUser("/app/career/diagnostic");
  const parsed = simpleAnswersSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/app/career/diagnostic?erreur=1#questions");
  const diagnostic = await db.careerDiagnostic.create({
    data: {
      userId: user.id,
      level: "simple",
      answers: parsed.data,
      result: simpleDiagnostic(parsed.data),
    },
  });
  redirect(`/app/career/diagnostic?bilan=${diagnostic.id}`);
}
