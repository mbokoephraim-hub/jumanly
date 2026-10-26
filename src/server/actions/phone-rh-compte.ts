"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire, setActiveSpace } from "@/server/hire-context";
import { mailOrgInvite } from "@/server/hire-emails";
import { HireError } from "@/server/services/hire";
import {
  isOrgAdmin,
  leaveOrganization,
  proposeColleague,
  requestPlan,
  saveRhProfile,
} from "@/server/services/hire-phone-account";
import { mutedAfter, notify, RECRUITER_SWITCHES } from "@/server/services/notifications";
import { inviteMembers } from "@/server/services/organization";

/**
 * The gestures of Compte on the recruiter's phone (Modèle B recruteur M8). Order of CLAUDE.md:
 * validate → session → role → limit → service. Nothing here changes the plan: the administrator
 * does it on a computer.
 */
const COMPTE = "/app/hire/compte";

/** « Enregistrer » of « Modifier mon profil » (planche Recruteur-compte-modifier). */
export async function rhSaveProfileAction(formData: FormData) {
  const { ctx } = await requireHire(`${COMPTE}/profil/modifier`);
  const saved = await saveRhProfile(db, ctx, {
    headline: String(formData.get("headline") ?? ""),
    hiringNow: formData.get("hiringNow") === "on",
    contactsFor: String(formData.get("contactsFor") ?? "interview"),
  });
  redirect(saved ? `${COMPTE}/profil?ok=1` : `${COMPTE}/profil/modifier?erreur=1`);
}

/**
 * « Proposer un collègue » (planche Recruteur-equipe-proposer). An administrator invites at once
 * (the e-mail of the invitation); any other member sends the request to the administrators.
 */
export async function rhProposeColleagueAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const { user, space, ctx } = await requireHire(`${COMPTE}/equipe`);
  const back = `${COMPTE}/equipe`;
  if (!isOrgAdmin(ctx.role)) {
    const result = await proposeColleague(db, ctx, { email });
    redirect(result.ok ? `${back}?ok=proposed` : `${back}?erreur=${result.error}`);
  }
  const result = await inviteMembers(db, ctx, { emails: email, role: "recruiter" });
  if (!result.ok)
    redirect(
      `${back}?erreur=${result.error === "seats" ? "seats" : result.error === "alreadyMember" ? "member" : "email"}`,
    );
  const t = await getTranslations("org.roles");
  const role = t("recruiter.text");
  for (const invitation of result.invitations) {
    await mailOrgInvite(invitation.email, {
      inviterName: user.name,
      org: space.organization.name,
      role,
      message: "",
      date: invitation.expiresAt,
      token: invitation.token,
    });
    const existing = await db.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (existing)
      await notify(db, {
        userIds: [existing.id],
        type: "orgInvite",
        payload: { inviterName: user.name, org: space.organization.name, role },
        href: `/app/invitation/${invitation.token}`,
      });
  }
  redirect(`${back}?ok=invited`);
}

/** « Demander {plan} à l'administrateur » (planche Recruteur-formule). */
export async function rhRequestPlanAction(formData: FormData) {
  const code = String(formData.get("plan") ?? "").slice(0, 60);
  const { ctx } = await requireHire(`${COMPTE}/formule`);
  const result = await requestPlan(db, ctx, code);
  redirect(`${COMPTE}/formule?${result.ok ? "ok=asked" : `erreur=${result.error}`}`);
}

const switchesInput = z.object({
  categories: z.array(z.enum(RECRUITER_SWITCHES)),
  emails: z.boolean(),
});

/** « Notifications » of the recruiter (planche Recruteur-compte-notifications), saved at once. */
export async function rhSaveNotificationsAction(
  raw: z.input<typeof switchesInput>,
): Promise<{ ok: boolean }> {
  const parsed = switchesInput.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const { user } = await requireHire(`${COMPTE}/notifications`);
  const current = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { notificationsMuted: true },
  });
  await db.user.update({
    where: { id: user.id },
    data: {
      notificationsMuted: mutedAfter(
        current.notificationsMuted,
        RECRUITER_SWITCHES,
        new Set(parsed.data.categories),
      ),
      notificationEmails: parsed.data.emails,
    },
  });
  refresh();
  return { ok: true };
}

/**
 * « Quitter l'entreprise » (planche Recruteur-compte-confidentialite): the membership ends, the
 * person goes back to their talent space. Nothing is deleted.
 */
export async function rhLeaveOrganizationAction() {
  const { ctx } = await requireHire(`${COMPTE}/confidentialite`);
  try {
    await leaveOrganization(db, ctx);
  } catch (error) {
    if (error instanceof HireError) redirect(`${COMPTE}/confidentialite?erreur=quitter`);
    throw error;
  }
  await setActiveSpace("personal");
  redirect("/app");
}
