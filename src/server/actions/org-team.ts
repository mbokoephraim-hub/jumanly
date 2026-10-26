"use server";

import { refresh } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { mailOrgInvite } from "@/server/hire-emails";
import { HireError } from "@/server/services/hire";
import { notify } from "@/server/services/notifications";
import { respondJoin } from "@/server/services/org-join";
import {
  advanceTask,
  assignTask,
  MEMBER_RIGHTS,
  remindTask,
  removeTeamMember,
  respondDeclaredMember,
  setMemberRight,
  setMemberRole,
} from "@/server/services/org-team";
import { inviteMembers, revokeInvitation } from "@/server/services/organization";

/**
 * The gestures of Équipe (étape 3, A2). Order of CLAUDE.md: validate → session → role → service.
 * Each returns what the toast says; the page is refreshed so every count stays true.
 */
const PAGE = "/app/organisation/equipe";

export type TeamActionResult = { ok: true; text: string } | { ok: false; text: string };

const id = z.string().min(1).max(60);

async function run(work: () => Promise<TeamActionResult>): Promise<TeamActionResult> {
  try {
    const result = await work();
    if (result.ok) refresh();
    return result;
  } catch (error) {
    if (error instanceof HireError) {
      const t = await getTranslations("orgTeam");
      return { ok: false, text: t("error") };
    }
    throw error;
  }
}

export async function setMemberRightAction(input: {
  membershipId: string;
  right: string;
  on: boolean;
}): Promise<TeamActionResult> {
  const parsed = z
    .object({ membershipId: id, right: z.enum(MEMBER_RIGHTS), on: z.boolean() })
    .safeParse(input);
  const { ctx, space } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const result = await setMemberRight(
      db,
      ctx,
      parsed.data.membershipId,
      parsed.data.right,
      parsed.data.on,
    );
    if (result === "level") return { ok: false, text: t("rights.basic") };
    if (result === "role") return { ok: false, text: t("error") };
    const member = await db.membership.findUniqueOrThrow({
      where: { id: parsed.data.membershipId },
      select: { user: { select: { name: true } } },
    });
    const right = t(`rights.${parsed.data.right}`, { org: space.organization.name });
    return {
      ok: true,
      text: t(parsed.data.on ? "rights.granted" : "rights.removed", {
        name: member.user.name.split(" ")[0] ?? member.user.name,
        right: right.charAt(0).toLowerCase() + right.slice(1),
      }),
    };
  });
}

const grantable = ["org_admin", "recruiter", "hiring_manager", "viewer"] as const;

export async function setMemberRoleAction(input: {
  membershipId: string;
  role: string;
}): Promise<TeamActionResult> {
  const parsed = z.object({ membershipId: id, role: z.enum(grantable) }).safeParse(input);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const result = await setMemberRole(db, ctx, parsed.data.membershipId, parsed.data.role);
    if (result === "role") return { ok: false, text: t("role.error") };
    const member = await db.membership.findUniqueOrThrow({
      where: { id: parsed.data.membershipId },
      select: { user: { select: { name: true } } },
    });
    return {
      ok: true,
      text: t("role.done", {
        name: member.user.name.split(" ")[0] ?? member.user.name,
        role: t(`roles.${parsed.data.role}.name`).toLowerCase(),
      }),
    };
  });
}

export async function removeMemberAction(membershipId: string): Promise<TeamActionResult> {
  const parsed = id.safeParse(membershipId);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const member = await db.membership.findFirst({
      where: { id: parsed.data, organizationId: ctx.organizationId },
      select: { user: { select: { name: true } } },
    });
    await removeTeamMember(db, ctx, parsed.data);
    return { ok: true, text: t("remove.done", { name: member?.user.name ?? "" }) };
  });
}

export async function assignTaskAction(input: {
  member: string;
  kind: string;
  application: string;
  due: string;
}): Promise<TeamActionResult> {
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  return run(async () => {
    const result = await assignTask(db, ctx, input);
    if (!result.ok)
      return {
        ok: false,
        text: result.error === "due" ? t("assignDialog.error.due") : t("error"),
      };
    return {
      ok: true,
      text: t("assignDialog.done", { name: result.name.split(" ")[0] ?? result.name }),
    };
  });
}

export async function remindTaskAction(taskId: string): Promise<TeamActionResult> {
  const parsed = id.safeParse(taskId);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const name = await remindTask(db, ctx, parsed.data);
    return { ok: true, text: t("task.reminded", { name: name.split(" ")[0] ?? name }) };
  });
}

/** « Accepter », « Commencer », « Marquer comme terminée » of « Mes tâches » (any member). */
export async function advanceTaskAction(taskId: string): Promise<TeamActionResult> {
  const parsed = id.safeParse(taskId);
  const { ctx } = await requireHire("/app/hire/taches");
  const t = await getTranslations("myTasks");
  const tt = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: tt("error") };
  return run(async () => {
    const status = await advanceTask(db, ctx, parsed.data);
    return {
      ok: true,
      text: status === "done" ? t("finished") : t("moved", { status: tt(`task.status.${status}`) }),
    };
  });
}

export async function respondJoinAction(input: {
  requestId: string;
  accept: boolean;
}): Promise<TeamActionResult> {
  const parsed = z.object({ requestId: id, accept: z.boolean() }).safeParse(input);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const request = await db.orgJoinRequest.findFirst({
      where: { id: parsed.data.requestId, organizationId: ctx.organizationId },
      select: { user: { select: { name: true } } },
    });
    const name = request?.user.name ?? "";
    const result = await respondJoin(db, ctx, parsed.data.requestId, {
      accept: parsed.data.accept,
      role: "recruiter",
    });
    if (result === "seats") return { ok: false, text: t("requests.seats") };
    if (result === "role") return { ok: false, text: t("role.error") };
    return {
      ok: true,
      text: t(result === "accepted" ? "requests.accepted" : "requests.declined", { name }),
    };
  });
}

export async function respondDeclaredAction(input: {
  experienceId: string;
  confirm: boolean;
}): Promise<TeamActionResult> {
  const parsed = z.object({ experienceId: id, confirm: z.boolean() }).safeParse(input);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    const name = await respondDeclaredMember(
      db,
      ctx,
      parsed.data.experienceId,
      parsed.data.confirm,
    );
    return {
      ok: true,
      text: t(parsed.data.confirm ? "requests.confirmed" : "requests.rejected", { name }),
    };
  });
}

/** « Envoyer l'invitation », and « Relancer » (a new e-mail, the same seat). */
export async function inviteMemberAction(input: {
  email: string;
  role: string;
  resend?: boolean;
}): Promise<TeamActionResult> {
  const { user, space, ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const result = await inviteMembers(db, ctx, { emails: email, role: input.role });
  if (!result.ok) {
    const key =
      result.error === "seats" || result.error === "alreadyMember" || result.error === "role"
        ? result.error
        : "invalid";
    return { ok: false, text: t(`inviteDialog.error.${key}`, { email: result.email ?? email }) };
  }
  const roleName = t(`roles.${input.role as "recruiter"}.name`);
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  for (const invitation of result.invitations) {
    await mailOrgInvite(invitation.email, {
      inviterName: user.name,
      org: space.organization.name,
      role: roleName,
      message: "",
      date: invitation.expiresAt,
      token: invitation.token,
    });
    if (existing)
      await notify(db, {
        userIds: [existing.id],
        type: "orgInvite",
        payload: { inviterName: user.name, org: space.organization.name, role: roleName },
        href: `/app/invitation/${invitation.token}`,
      });
  }
  refresh();
  return {
    ok: true,
    text: input.resend ? t("invitations.resent", { email }) : t("inviteDialog.sent", { email }),
  };
}

export async function cancelInvitationAction(invitationId: string): Promise<TeamActionResult> {
  const parsed = id.safeParse(invitationId);
  const { ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  if (!parsed.success) return { ok: false, text: t("error") };
  return run(async () => {
    await revokeInvitation(db, ctx, parsed.data);
    return { ok: true, text: t("invitations.cancelled") };
  });
}
