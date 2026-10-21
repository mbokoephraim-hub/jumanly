import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { initials } from "@/components/ui/avatar";
import type { MembershipRole } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { shortName } from "@/lib/short-name";
import {
  changeRoleAction,
  inviteAction,
  removeMemberAction,
  revokeInvitationAction,
  setMemberTeamAction,
  transferOwnershipAction,
} from "@/server/actions/organization";
import { db } from "@/server/db";
import { can, level, limit, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import {
  grantableRoles,
  INVITATION_DAYS,
  listMembers,
  seatUsage,
} from "@/server/services/organization";
import { cheapestPlanWhere, limitOf, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("rhTeam");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const columns = ["org_admin", "recruiter", "hiring_manager", "viewer"] as const;
const rights = ["manage", "evaluate", "readApplications", "administer"] as const;
const activityTypes = ["stage_changed", "note", "decision", "document_requested", "message"];

/**
 * Équipe (planche recruteur-3 `EQUIPE` and `INVITER`, r3plus): the seats used, the members with
 * their role, the invitations waiting, who can do what (read from `hirePermissions`, the rule the
 * code applies), the team's recent activity, and the sheet to invite, which says when no seat is
 * left and which plan has more (chosen by `org.seats`, never by its name).
 */
export default async function TeamPage({ searchParams }: PageProps<"/app/organisation/equipe">) {
  const params = await searchParams;
  const { user, space, ctx } = await requireHire("/app/organisation/equipe");
  const t = await getTranslations("rhTeam");
  const to = await getTranslations("org");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const permissions = hirePermissions(ctx.role);
  const admin = permissions.administer;
  const tw = await getTranslations("hireWeb3.team");
  const [
    { members, invitations },
    seats,
    permissionsLevel,
    plan,
    plans,
    teamsOn,
    activity,
    assigned,
  ] = await Promise.all([
    listMembers(db, ctx),
    seatUsage(db, ctx.organizationId),
    level(db, subject, "org.permissions.level"),
    resolvePlan(db, subject),
    listPublicPlans(db),
    can(db, subject, "org.teams"),
    permissions.readApplications
      ? db.applicationEvent.findMany({
          where: {
            type: { in: activityTypes },
            actorId: { not: null },
            application: { job: { organizationId: ctx.organizationId } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            actorId: true,
            createdAt: true,
            application: {
              select: { profile: { select: { user: { select: { name: true } } } } },
            },
          },
        })
      : Promise.resolve([]),
    // The offers entrusted to each member (« Offres » of the web table, planche web recruteur-3 § 4).
    db.job.groupBy({
      by: ["assignedToId"],
      where: { organizationId: ctx.organizationId, status: "published" },
      _count: { _all: true },
    }),
  ]);
  const teams = teamsOn
    ? await db.team.findMany({
        where: { organizationId: ctx.organizationId, kind: "team" },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];
  const seatLimit = seats.max >= 0 ? seats.max : await limit(db, subject, "org.seats");
  const full = seats.max >= 0 && seats.used >= seats.max;
  const bigger = full
    ? cheapestPlanWhere(plans, ["rh", "company"], (candidate) => {
        const value = limitOf(candidate, "org.seats");
        return value !== null && (value < 0 || value > seats.max);
      })
    : null;
  const roles = grantableRoles(permissionsLevel);
  const roleName = (role: MembershipRole) =>
    role === "partner_manager" ? role : to(`roles.${role}.text`);
  const offersOf = new Map(assigned.map((row) => [row.assignedToId, row._count._all]));
  const names = new Map(members.map((member) => [member.userId, member.user.name]));
  const now = new Date();
  const ago = (date: Date) => {
    const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    return days < 1 ? t("today") : t("days", { count: days });
  };
  const when = (date: Date) =>
    now.getTime() - date.getTime() < 86_400_000
      ? format.dateTime(date, { hour: "2-digit", minute: "2-digit" })
      : format.dateTime(date, { weekday: "short" });

  const ok = one(params.ok);
  const okText: Record<string, string> = {
    invitations: to("invite.sent", { count: Number(one(params.nombre) || 0) }),
    annulee: to("invite.revoked"),
    role: to("members.roleDone"),
    retire: to("members.removedDone"),
    equipe: to("members.teamDone"),
    transfert: to("members.transferDone"),
  };
  const error = one(params.erreur);
  const errorText: Record<string, string> = {
    alreadyMember: to("invite.error.alreadyMember", { email: one(params.email) }),
    seats: to("invite.error.seats", { count: Number(one(params.nombre) || 1) }),
    role: to("invite.error.role"),
    invalid: t("invalid"),
    forbidden: to("roles.error.selfDemote"),
  };

  return (
    <div className="t-flux t-w4 t-large t-rw3-team">
      <div className="t-w4-h">
        <FlowHead
          back="/app/organisation"
          backLabel={t("back")}
          title={t("title")}
          end={
            admin ? (
              <SheetButton target="r5-inviter" className="t-bi t-press" label={t("invite")}>
                <TalentIcon name="plus" size="s" />
              </SheetButton>
            ) : undefined
          }
        />
        {admin && (
          <SheetButton target="r5-inviter" className="t-bt t-p t-m t-press t-w4-web">
            <TalentIcon name="plus" size="s" />
            {tw("invite")}
          </SheetButton>
        )}
      </div>
      {okText[ok] && <Notice tone="ok">{okText[ok]}</Notice>}
      {error && <Notice tone="err">{errorText[error] ?? t("invalid")}</Notice>}

      <div className="t-verre t-r5-seats">
        <div>
          <b>
            {seats.max < 0
              ? t("seatsUnlimited", { used: seats.used })
              : t("seats", { used: seats.used, max: seats.max })}
          </b>
          {plan?.planName && <span>{plan.planName}</span>}
        </div>
        {seatLimit >= 0 && seatLimit <= 30 && (
          <span className="t-r5-sieges" aria-hidden>
            {Array.from({ length: seatLimit }, (_, index) => (
              <i key={index} className={cx(index < seats.used && "t-on")} />
            ))}
          </span>
        )}
      </div>

      {/* Ordinateur et tablette (planche web recruteur-3 § 4) : les membres en tableau, avec
          leurs offres, leur rôle et « Gérer ». Le téléphone garde sa liste. */}
      <div className="t-verre t-rw3-tbl t-w4-web">
        <table>
          <caption className="sr-only">{t("members")}</caption>
          <thead>
            <tr>
              <th scope="col">{tw("member")}</th>
              <th scope="col">{tw("offers")}</th>
              <th scope="col">{tw("role")}</th>
              <th scope="col">
                <span className="sr-only">{tw("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => {
              const self = member.userId === user.id;
              const editable =
                admin && !self && (member.role !== "org_owner" || ctx.role === "org_owner");
              return (
                <tr key={member.id}>
                  <th scope="row">
                    <span className="t-rw3-who">
                      <span className={cx("t-rc-av", ["", "t-b", "t-a"][index % 3])} aria-hidden>
                        {initials(member.user.name)}
                      </span>
                      <span className="t-t">
                        <b>{self ? t("you", { name: member.user.name }) : member.user.name}</b>
                        <span>{member.user.email}</span>
                      </span>
                    </span>
                  </th>
                  <td>{tw("offersCount", { count: offersOf.get(member.userId) ?? 0 })}</td>
                  <td>
                    <span
                      className={cx(
                        "t-r5-role",
                        (member.role === "org_owner" || member.role === "org_admin") && "t-r5-ad",
                      )}
                    >
                      {roleName(member.role)}
                    </span>
                  </td>
                  <td>
                    {editable && (
                      <SheetButton
                        target={`r5-membre-${member.id}`}
                        className="t-bt t-sec t-s t-press"
                        label={tw("manageOf", { name: member.user.name })}
                      >
                        {tw("manage")}
                      </SheetButton>
                    )}
                  </td>
                </tr>
              );
            })}
            {invitations.map((invitation) => (
              <tr key={invitation.id}>
                <th scope="row">
                  <span className="t-rw3-who">
                    <span className="t-rc-av t-a" aria-hidden>
                      {initials(invitation.email)}
                    </span>
                    <span className="t-t">
                      <b className="t-r5-coupe">{invitation.email}</b>
                      <span>{t("invited", { ago: ago(invitation.createdAt) })}</span>
                    </span>
                  </span>
                </th>
                <td></td>
                <td>
                  <span className="t-r5-role">{t("pending")}</span>
                </td>
                <td>
                  {admin && (
                    <SheetButton
                      target={`r5-invit-${invitation.id}`}
                      className="t-bt t-sec t-s t-press"
                      label={tw("manageOf", { name: invitation.email })}
                    >
                      {tw("manage")}
                    </SheetButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="t-verre t-liste t-lignes t-w4-tel" aria-label={t("members")}>
        {members.map((member, index) => {
          const self = member.userId === user.id;
          const editable =
            admin && !self && (member.role !== "org_owner" || ctx.role === "org_owner");
          const inner = (
            <>
              <span className={cx("t-rc-av", ["", "t-b", "t-a"][index % 3])} aria-hidden>
                {initials(member.user.name)}
              </span>
              <span className="t-t">
                <b>{self ? t("you", { name: member.user.name }) : member.user.name}</b>
                <span>{member.team?.name ?? member.jobTitle ?? member.user.email}</span>
              </span>
              <span
                className={cx(
                  "t-r5-role",
                  (member.role === "org_owner" || member.role === "org_admin") && "t-r5-ad",
                )}
              >
                {roleName(member.role)}
              </span>
            </>
          );
          return (
            <li key={member.id}>
              {editable ? (
                <SheetButton target={`r5-membre-${member.id}`} className="t-li t-press">
                  {inner}
                </SheetButton>
              ) : (
                <div className="t-li">{inner}</div>
              )}
            </li>
          );
        })}
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            {admin ? (
              <SheetButton target={`r5-invit-${invitation.id}`} className="t-li t-press">
                <span className="t-rc-av t-a" aria-hidden>
                  {initials(invitation.email)}
                </span>
                <span className="t-t">
                  <b className="t-r5-coupe">{invitation.email}</b>
                  <span>{t("invited", { ago: ago(invitation.createdAt) })}</span>
                </span>
                <span className="t-r5-role">{t("pending")}</span>
              </SheetButton>
            ) : (
              <div className="t-li">
                <span className="t-rc-av t-a" aria-hidden>
                  {initials(invitation.email)}
                </span>
                <span className="t-t">
                  <b className="t-r5-coupe">{invitation.email}</b>
                  <span>{t("invited", { ago: ago(invitation.createdAt) })}</span>
                </span>
                <span className="t-r5-role">{t("pending")}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="t-w4-g2e">
        <section aria-labelledby="r5-droits" className="t-flux t-serre">
          <h2 id="r5-droits" className="t-ck-t">
            {t("rights.title")}
          </h2>
          <table className="t-verre t-r5-droits">
            <thead>
              <tr>
                <td />
                {columns.map((role) => (
                  <th key={role} scope="col">
                    <abbr title={roleName(role)}>{t(`rights.short.${role}`)}</abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rights.map((right) => (
                <tr key={right}>
                  <th scope="row">{t(`rights.${right}`)}</th>
                  {columns.map((role) => {
                    const yes = hirePermissions(role)[right];
                    return (
                      <td key={role} className={yes ? "t-r5-oui" : "t-r5-non"}>
                        <span aria-hidden>{yes ? "✓" : "—"}</span>
                        <span className="sr-only">{yes ? t("rights.yes") : t("rights.no")}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="t-gar">
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("rights.owner")}</span>
          </p>
        </section>

        {activity.length > 0 && (
          <section aria-labelledby="r5-activite" className="t-flux t-serre">
            <h2 id="r5-activite" className="t-ck-t">
              {t("activity.title")}
            </h2>
            <ul className="t-verre t-r5-act">
              {activity.map((event, index) => {
                const actor = names.get(event.actorId ?? "") ?? t("activity.former");
                return (
                  <li key={event.id}>
                    <span className={cx("t-rc-av", ["t-b", "", "t-a"][index % 3])} aria-hidden>
                      {initials(actor)}
                    </span>
                    <span className="t-t">
                      {t(`activity.${event.type as "note"}`, {
                        actor: event.actorId === user.id ? t("activity.you") : shortName(actor),
                        self: event.actorId === user.id ? "oui" : "non",
                        name: shortName(event.application.profile.user.name),
                      })}
                    </span>
                    <small>{when(event.createdAt)}</small>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {admin && (
        <Sheet
          id="r5-inviter"
          title={t("inviteTitle")}
          closeLabel={t("close")}
          openParam="inviter"
          defaultOpen={one(params.inviter) === "1"}
        >
          <form action={inviteAction} className="t-flux">
            <div className="t-champ">
              <label htmlFor="r5-inv-emails">{t("emails")}</label>
              <span className="t-verre t-saisie">
                <input
                  id="r5-inv-emails"
                  name="emails"
                  required
                  maxLength={2000}
                  autoComplete="off"
                  inputMode="email"
                  placeholder={to("invite.emails.placeholder")}
                  aria-describedby="r5-inv-emails-h"
                />
              </span>
              <p id="r5-inv-emails-h" className="t-aide">
                {t("emailsHint", { days: INVITATION_DAYS })}
              </p>
            </div>
            <fieldset className="t-champ">
              <legend>{to("invite.role")}</legend>
              <div className="t-seg t-r5-seg">
                {roles.map((role, index) => (
                  <label key={role} className="t-press">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={
                        role === "recruiter" || (index === 0 && !roles.includes("recruiter"))
                      }
                    />
                    {roleName(role)}
                  </label>
                ))}
              </div>
            </fieldset>
            {teams.length > 0 && (
              <div className="t-champ">
                <label htmlFor="r5-inv-team">{to("invite.team")}</label>
                <span className="t-verre t-saisie">
                  <select id="r5-inv-team" name="team" defaultValue="">
                    <option value="">{to("members.team.none")}</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )}
            <div className="t-champ">
              <label htmlFor="r5-inv-message">{to("invite.message")}</label>
              <textarea
                id="r5-inv-message"
                name="message"
                rows={3}
                maxLength={500}
                className="t-verre t-zone"
              />
            </div>
            {full ? (
              <>
                <p className="t-r5-manq">
                  <TalentIcon name="aide" size="s" />
                  <span>
                    {bigger
                      ? t.rich("full.plan", {
                          plan: bigger.name,
                          seats:
                            (limitOf(bigger, "org.seats") ?? 0) < 0
                              ? t("full.seatsUnlimited")
                              : t("full.seatsCount", { count: limitOf(bigger, "org.seats") ?? 0 }),
                          b: (chunks) => <b>{chunks}</b>,
                        })
                      : t.rich("full.noPlan", { b: (chunks) => <b>{chunks}</b> })}
                  </span>
                </p>
                <Link href="/app/abonnement/formules" className="t-bt t-p t-m t-pl t-press">
                  {bigger ? t("full.see", { plan: bigger.name }) : t("full.plans")}
                </Link>
              </>
            ) : (
              <button type="submit" className="t-bt t-p t-m t-pl t-press">
                <TalentIcon name="envoyer" size="s" />
                {to("invite.send")}
              </button>
            )}
          </form>
        </Sheet>
      )}

      {admin &&
        members.map((member) => {
          const self = member.userId === user.id;
          const editable = !self && (member.role !== "org_owner" || ctx.role === "org_owner");
          if (!editable) return null;
          return (
            <Sheet
              key={member.id}
              id={`r5-membre-${member.id}`}
              title={member.user.name}
              closeLabel={t("close")}
            >
              <div className="t-flux">
                {member.role !== "org_owner" && (
                  <form action={changeRoleAction} className="t-flux">
                    <input type="hidden" name="id" value={member.id} />
                    <fieldset className="t-champ">
                      <legend>{to("invite.role")}</legend>
                      <div className="t-seg t-r5-seg">
                        {roles.map((role) => (
                          <label key={role} className="t-press">
                            <input
                              type="radio"
                              name="role"
                              value={role}
                              defaultChecked={member.role === role}
                            />
                            {roleName(role)}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button type="submit" className="t-bt t-p t-m t-pl t-press">
                      {t("saveRole")}
                    </button>
                  </form>
                )}
                {teams.length > 0 && (
                  <form action={setMemberTeamAction} className="t-flux">
                    <input type="hidden" name="id" value={member.id} />
                    <div className="t-champ">
                      <label htmlFor={`r5-team-${member.id}`}>{to("invite.team")}</label>
                      <span className="t-verre t-saisie">
                        <select
                          id={`r5-team-${member.id}`}
                          name="team"
                          defaultValue={member.team?.id ?? ""}
                        >
                          <option value="">{to("members.team.none")}</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                    <button type="submit" className="t-bt t-sec t-m t-pl t-press">
                      {to("members.team.save")}
                    </button>
                  </form>
                )}
                {ctx.role === "org_owner" && (
                  <details className="t-r5-conf">
                    <summary className="t-press">{to("members.transferOwnership.text")}</summary>
                    <form action={transferOwnershipAction} className="t-flux t-serre">
                      <input type="hidden" name="id" value={member.id} />
                      <p>
                        {to("members.transferOwnership.confirm", {
                          memberName: member.user.name,
                          org: space.organization.name,
                        })}
                      </p>
                      <button type="submit" className="t-bt t-sec t-m t-pl t-press">
                        {to("members.transferOwnership.text")}
                      </button>
                    </form>
                  </details>
                )}
                {member.role !== "org_owner" && (
                  <details className="t-r5-conf">
                    <summary className="t-press t-r5-danger">{to("members.remove.text")}</summary>
                    <form action={removeMemberAction} className="t-flux t-serre">
                      <input type="hidden" name="id" value={member.id} />
                      <p>{to("members.remove.confirm.title", { memberName: member.user.name })}</p>
                      <button type="submit" className="t-bt t-sec t-m t-pl t-press t-r5-danger">
                        {to("members.remove.confirm.cta")}
                      </button>
                    </form>
                  </details>
                )}
              </div>
            </Sheet>
          );
        })}

      {admin &&
        invitations.map((invitation) => (
          <Sheet
            key={invitation.id}
            id={`r5-invit-${invitation.id}`}
            title={invitation.email}
            closeLabel={t("close")}
          >
            <div className="t-flux">
              <p className="t-r5-sous">
                {t("invitationLine", {
                  role: roleName(invitation.role),
                  date: invitation.expiresAt,
                })}
              </p>
              <form action={revokeInvitationAction}>
                <input type="hidden" name="id" value={invitation.id} />
                <button type="submit" className="t-bt t-sec t-m t-pl t-press t-r5-danger">
                  {to("invite.revoke")}
                </button>
              </form>
            </div>
          </Sheet>
        ))}
    </div>
  );
}
