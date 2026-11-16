"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { respondDeclaredMember } from "@/server/services/org-team";

/**
 * « Confirmer » and « Ne travaille pas ici » of Page entreprise › Membres (Hire v3, lot 6). Order
 * of CLAUDE.md: validate → session → role (administrators) → service.
 */
const PAGE = "/app/hire/entreprise?onglet=membres";

export async function hv3RespondDeclaredAction(formData: FormData) {
  const experienceId = String(formData.get("experience") ?? "");
  const confirm = formData.get("confirm") === "1";
  if (!/^[\w-]{1,60}$/.test(experienceId)) redirect(`${PAGE}&erreur=1`);
  const { ctx } = await requireHire(PAGE, "administer");
  let name: string;
  try {
    name = await respondDeclaredMember(db, ctx, experienceId, confirm);
  } catch (error) {
    if (!(error instanceof HireError)) throw error;
    redirect(`${PAGE}&erreur=1`);
  }
  refresh();
  redirect(`${PAGE}&ok=${confirm ? "confirmed" : "rejected"}&nom=${encodeURIComponent(name)}`);
}
