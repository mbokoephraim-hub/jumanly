"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { ownedOrganization } from "@/server/services/accounts";
import {
  saveFirstStepsOrganization,
  saveRecruiterProfile,
  saveRecruitingFor,
} from "@/server/services/recruiter-account";

const PROFILE = "/app/hire/compte/profil";

/** « Mon profil RH » (planche recruteur-3 PROF_R): the name shown and the job title. */
export async function saveRecruiterProfileAction(formData: FormData) {
  const { ctx } = await requireHire(PROFILE);
  const saved = await saveRecruiterProfile(db, ctx, {
    name: formData.get("name") ?? "",
    jobTitle: formData.get("jobTitle") ?? "",
  });
  redirect(saved ? `${PROFILE}?ok=1` : `${PROFILE}?erreur=nom`);
}

/** The organization the person created at sign-up: the first steps describe it. */
async function ownerContext() {
  const user = await requireUser("/app/bienvenue");
  const org = await ownedOrganization(db, user.id);
  if (!org) redirect("/app/bienvenue");
  return { userId: user.id, organizationId: org.id, role: "org_owner" as const };
}

/** First steps, 1 of 3: « Vous recrutez pour… ». Nothing chosen changes nothing and goes on. */
export async function saveRecruitingForAction(formData: FormData) {
  const ctx = await ownerContext();
  const value = formData.get("for");
  if (value) await saveRecruitingFor(db, ctx, value);
  redirect("/app/bienvenue?etape=organisation");
}

/** First steps, 2 of 3: « Votre organisation ». */
export async function saveFirstStepsOrganizationAction(formData: FormData) {
  const ctx = await ownerContext();
  const saved = await saveFirstStepsOrganization(db, ctx, {
    name: formData.get("name") ?? "",
    country: formData.get("country") ?? "",
    sector: formData.get("sector") ?? "",
    size: formData.get("size") ?? "",
  });
  redirect(saved ? "/app/bienvenue?etape=pret" : "/app/bienvenue?etape=organisation&erreur=nom");
}
