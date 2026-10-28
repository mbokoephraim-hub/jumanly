import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { TeamScreen, type TeamData } from "@/components/entreprise/team";
import { pickMessages } from "@/i18n/client-messages";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { pendingJoinRequests } from "@/server/services/org-join";
import { pendingDeclaredMembers, teamScreen } from "@/server/services/org-team";
import { seatUsage } from "@/server/services/organization";

const PAGE = "/app/organisation/equipe";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orgTeam");
  return { title: t("title"), robots: { index: false } };
}

type Role = TeamData["roles"][number];
const isRole = (role: string): role is Role =>
  ["org_admin", "recruiter", "hiring_manager", "viewer"].includes(role);

const tabs = ["membres", "taches", "invitations"] as const;

/**
 * Équipe (étape 3, A2, captures 076 à 078), for the owner and the administrators only: a
 * recruiter, a manager or a viewer gets « page introuvable ». Under 768 px the layout of
 * `/app/organisation` shows « À ouvrir sur un ordinateur ».
 */
export default async function TeamPage({ searchParams }: PageProps<"/app/organisation/equipe">) {
  const query = await searchParams;
  const { space, ctx } = await requireHire(PAGE, "administer");
  const t = await getTranslations("orgTeam");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [screen, seats, plan, requests, declared, admins, messages] = await Promise.all([
    teamScreen(db, ctx),
    seatUsage(db, ctx.organizationId),
    resolvePlan(db, subject),
    pendingJoinRequests(db, ctx),
    pendingDeclaredMembers(db, ctx),
    db.membership.count({
      where: {
        organizationId: ctx.organizationId,
        status: "active",
        role: { in: ["org_owner", "org_admin"] },
      },
    }),
    getMessages(),
  ]);
  const planName = plan?.planName ?? "";
  const unlimited = seats.max < 0;
  const left = Math.max(0, seats.max - seats.used);
  const data: TeamData = {
    org: space.organization.name,
    seatsLine: unlimited
      ? t("seatsUnlimited", { plan: planName, used: seats.members })
      : t("seats", { plan: planName, used: seats.members, max: seats.max }),
    onlyYou: admins <= 1,
    places: unlimited
      ? t("places.unlimited", { plan: planName })
      : left > 0
        ? t("places.left", { count: left, plan: planName, max: seats.max })
        : t("places.full", { plan: planName, max: seats.max }),
    advanced: screen.advanced,
    // Administrateur after the three roles of the mockup (owner only).
    roles: [...screen.roles.filter(isRole)].sort(
      (a, b) => Number(a === "org_admin") - Number(b === "org_admin"),
    ),
    inviteRoles: screen.roles.filter(isRole).filter((role) => role !== "org_admin"),
    canInvite: true,
    members: screen.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.name,
      role: member.role as TeamData["members"][number]["role"],
      jobTitle: member.jobTitle?.trim() || null,
      rights: member.rights,
      ceiling: member.ceiling,
      editable: member.editable,
      assignable: member.assignable,
    })),
    tasks: screen.tasks.map((task) => ({
      id: task.id,
      kind: task.kind,
      status: task.status,
      due: task.dueAt.toISOString(),
      late: task.late,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      applicationId: task.applicationId,
      candidate: task.candidate,
    })),
    requests: (requests?.requests ?? []).map((request) => ({
      id: request.id,
      name: request.name,
      domain: request.domain,
    })),
    declared: declared.map((person) => ({
      experienceId: person.experienceId,
      name: person.name,
      title: person.title,
    })),
    invitations: screen.invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as TeamData["invitations"][number]["role"],
      date: invitation.createdAt.toISOString(),
    })),
    applications: screen.applications,
    dues: screen.dues,
  };
  const wanted = typeof query.onglet === "string" ? query.onglet : "";
  const initialTab = (tabs as readonly string[]).includes(wanted)
    ? (wanted as (typeof tabs)[number])
    : "membres";
  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["orgTeam"])}>
      <TeamScreen data={data} initialTab={initialTab} inviting={query.inviter === "1"} />
    </NextIntlClientProvider>
  );
}
