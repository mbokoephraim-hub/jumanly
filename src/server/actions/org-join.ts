"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { mailJoinRequest } from "@/server/hire-emails";
import { ownedOrganization } from "@/server/services/accounts";
import { HireError } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";
import { cancelJoin, requestJoin, respondJoin } from "@/server/services/org-join";

/**
 * Joining an existing organization (recruteur lot 6). Order of CLAUDE.md: validate → session →
 * role → service. The person only asks; the organization's administrators decide.
 */

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);
const step = "/app/bienvenue?etape=organisation";

/** « Demander à rejoindre » from the first steps (planche REJ1). */
export async function requestJoinAction(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  const own = await ownedOrganization(db, user.id);
  const organizationId = id(formData.get("organization"));
  let result;
  try {
    result = await requestJoin(
      db,
      { userId: user.id, email: user.email, name: user.name, orgName: own?.name ?? null },
      organizationId,
    );
  } catch (error) {
    if (error instanceof HireError) redirect(`${step}&rejoindre=erreur`);
    throw error;
  }
  if (result.created && result.candidate) {
    const t = await getTranslations("orgJoin");
    const seats = await seatUsage(db, organizationId);
    const seatsAfter =
      seats.max === null
        ? t("seatsUnlimited")
        : t("seatsAfter", { used: seats.used + 1, max: seats.max });
    for (const admin of result.admins)
      await mailJoinRequest(admin, {
        name: user.name,
        org: result.candidate.name,
        domain: result.candidate.matchedBy === "domain",
        seatsAfter,
      });
  }
  redirect(`${step}&rejoindre=envoyee`);
}

/** « Annuler la demande » on the waiting screen (planche REJ2). */
export async function cancelJoinAction(formData: FormData) {
  const user = await requireUser("/app/bienvenue");
  await cancelJoin(db, user.id, id(formData.get("request")));
  redirect(`${step}&rejoindre=annulee`);
}

/** « Accepter » with the role chosen, or « Refuser » (planche REJ_ADM, in Notifications). */
export async function respondJoinAction(formData: FormData) {
  const { ctx } = await requireHire("/app/notifications", "administer");
  const accept = formData.get("answer") === "accept";
  let result;
  try {
    result = await respondJoin(db, ctx, id(formData.get("request")), {
      accept,
      role: String(formData.get("role") ?? "recruiter"),
    });
  } catch (error) {
    if (error instanceof HireError) redirect("/app/notifications?demande=erreur#demandes");
    throw error;
  }
  redirect(`/app/notifications?demande=${result}#demandes`);
}
