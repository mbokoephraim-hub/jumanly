"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { requireHire, setActiveSpace } from "@/server/hire-context";
import { mailOrgInvite } from "@/server/hire-emails";
import { HireError } from "@/server/services/hire";
import { notify } from "@/server/services/notifications";
import {
  createEntity,
  createTeam,
  deleteEntity,
  deleteTeam,
  setMemberTeam,
  transferOwnership,
} from "@/server/services/org-structure";
import { requestVerification } from "@/server/services/verification";
import {
  acceptInvitation,
  changeRole,
  inviteMembers,
  removeMember,
  revokeInvitation,
  updateOrganizationProfile,
} from "@/server/services/organization";

const id = (value: FormDataEntryValue | null) => String(value ?? "").slice(0, 60);

function back(tab: string, params: Record<string, string> = {}): never {
  redirect(`/app/organisation?${new URLSearchParams({ onglet: tab, ...params })}`);
}

async function guarded(work: () => Promise<unknown>, tab: string) {
  try {
    await work();
  } catch (error) {
    if (error instanceof HireError) back(tab, { erreur: error.code });
    throw error;
  }
}

export async function updateOrganizationAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  const saved = await updateOrganizationProfile(db, ctx, Object.fromEntries(formData));
  // The public company page and the job pages show the profile.
  if (saved) updateTag("jobs");
  back("profil", saved ? { ok: "1" } : { erreur: "invalid" });
}

export async function inviteAction(formData: FormData) {
  const { user, space, ctx } = await requireHire("/app/organisation", "administer");
  const result = await inviteMembers(db, ctx, Object.fromEntries(formData));
  if (!result.ok)
    back("membres", {
      erreur: result.error,
      email: result.email ?? "",
      nombre: String(result.count ?? 0),
    });
  const t = await getTranslations("org.roles");
  const role = String(formData.get("role"));
  const roleName = t(`${role as "recruiter"}.text`);
  const invited = await db.user.findMany({
    where: { email: { in: result.invitations.map((item) => item.email) } },
    select: { id: true, email: true },
  });
  for (const invitation of result.invitations) {
    await mailOrgInvite(invitation.email, {
      inviterName: user.name,
      org: space.organization.name,
      role: roleName,
      message: String(formData.get("message") ?? "").trim(),
      date: invitation.expiresAt,
      token: invitation.token,
    });
    const existing = invited.find((person) => person.email === invitation.email);
    if (existing) {
      await notify(db, {
        userIds: [existing.id],
        type: "orgInvite",
        payload: { inviterName: user.name, org: space.organization.name, role: roleName },
        href: `/app/invitation/${invitation.token}`,
      });
    }
  }
  back("membres", { ok: "invitations", nombre: String(result.invitations.length) });
}

export async function revokeInvitationAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(() => revokeInvitation(db, ctx, id(formData.get("id"))), "membres");
  back("membres", { ok: "annulee" });
}

export async function changeRoleAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  const role = String(formData.get("role"));
  if (!["org_admin", "recruiter", "hiring_manager", "viewer"].includes(role))
    back("membres", { erreur: "invalid" });
  await guarded(() => changeRole(db, ctx, id(formData.get("id")), role as "recruiter"), "membres");
  back("membres", { ok: "role" });
}

export async function removeMemberAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(() => removeMember(db, ctx, id(formData.get("id"))), "membres");
  back("membres", { ok: "retire" });
}

export async function acceptInvitationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").slice(0, 100);
  const user = await requireUser(`/app/invitation/${token}`);
  const result = await acceptInvitation(db, user, token);
  if (!result.ok) redirect(`/app/invitation/${token}?erreur=${result.error}`);
  await setActiveSpace(result.organizationId);
  redirect(result.partner ? "/app/partenaire" : "/app/hire?bienvenue=1");
}

// ─── Structure (E8) ─────────────────────────────────────────────────────────────

const tabOfKind = (kind: string) => (kind === "department" ? "departements" : "equipes");

export async function createTeamAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  const kind = formData.get("kind") === "department" ? "department" : "team";
  await guarded(
    () =>
      createTeam(db, ctx, {
        name: String(formData.get("name") ?? ""),
        kind,
        entityId: id(formData.get("entity")) || undefined,
        leadId: id(formData.get("lead")) || undefined,
      }),
    tabOfKind(kind),
  );
  back(tabOfKind(kind), { ok: "cree" });
}

export async function deleteTeamAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  const tab = tabOfKind(String(formData.get("kind")));
  await guarded(() => deleteTeam(db, ctx, id(formData.get("id"))), tab);
  back(tab, { ok: "supprime" });
}

export async function createEntityAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(
    () =>
      createEntity(db, ctx, {
        name: String(formData.get("name") ?? ""),
        country: String(formData.get("country") ?? ""),
        parentId: id(formData.get("parent")) || undefined,
      }),
    "entites",
  );
  back("entites", { ok: "cree" });
}

export async function deleteEntityAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(async () => {
    try {
      await deleteEntity(db, ctx, id(formData.get("id")));
    } catch (error) {
      // An entity that still holds jobs, teams or sub-entities is refused as « invalid ».
      if (error instanceof HireError && error.code === "invalid")
        back("entites", { erreur: "notEmpty" });
      throw error;
    }
  }, "entites");
  back("entites", { ok: "supprime" });
}

export async function setMemberTeamAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(
    () => setMemberTeam(db, ctx, id(formData.get("id")), id(formData.get("team")) || null),
    "membres",
  );
  back("membres", { ok: "equipe" });
}

export async function transferOwnershipAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  await guarded(() => transferOwnership(db, ctx, id(formData.get("id"))), "membres");
  back("membres", { ok: "transfert" });
}

export async function requestVerificationAction(formData: FormData) {
  const { ctx } = await requireHire("/app/organisation", "administer");
  let saved = false;
  await guarded(async () => {
    saved = await requestVerification(db, ctx, Object.fromEntries(formData));
  }, "verification");
  back("verification", saved ? { ok: "1" } : { erreur: "verification" });
}
