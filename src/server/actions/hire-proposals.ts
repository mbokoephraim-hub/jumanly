"use server";

import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { remindProposal } from "@/server/services/talent-search";

/** « Relancer » a proposal still waiting, once (recruteur lot 6, Mes propositions). */
export async function remindProposalAction(formData: FormData) {
  const { ctx } = await requireHire("/app/hire/candidats?vue=propositions", "manage");
  const done = await remindProposal(db, ctx, String(formData.get("request") ?? "").slice(0, 60));
  redirect(`/app/hire/candidats?vue=propositions&relance=${done ? "ok" : "non"}`);
}
