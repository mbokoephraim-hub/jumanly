import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import type { MembershipRole } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import {
  changeRoleAction,
  inviteAction,
  removeMemberAction,
  revokeInvitationAction,
  updateOrganizationAction,
} from "@/server/actions/organization";
import { db } from "@/server/db";
import { level, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import { grantableRoles, listMembers, seatUsage } from "@/server/services/organization";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/** Organization (partie 07 § 4): its public profile, members, roles and invitations. */
export default async function OrganizationPage({ searchParams }: PageProps<"/app/organisation">) {
  const params = await searchParams;
  const { user, ctx } = await requireHire("/app/organisation");
  const t = await getTranslations("org");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [organization, { members, invitations }, seats, permissionsLevel, plan] = await Promise.all(
    [
      db.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
      listMembers(db, ctx),
      seatUsage(db, ctx.organizationId),
      level(db, subject, "org.permissions.level"),
      resolvePlan(db, subject),
    ],
  );
  const admin = hirePermissions(ctx.role).administer;
  const roles = grantableRoles(permissionsLevel);
  const roleName = (role: MembershipRole) =>
    role === "partner_manager" ? role : t(`roles.${role}.text`);
  const tab = params.onglet === "membres" ? "membres" : "profil";
  const erreur = one(params.erreur);
  const ok = one(params.ok);
  const okText: Record<string, string> = {
    invitations: t("invite.sent", { count: Number(one(params.nombre) || 0) }),
    annulee: t("invite.revoked"),
    role: t("members.roleDone"),
    retire: t("members.removedDone"),
  };
  const errorText: Record<string, string> = {
    alreadyMember: t("invite.error.alreadyMember", { email: one(params.email) }),
    seats: t("invite.error.seats", { count: Number(one(params.nombre) || 1) }),
    role: t("invite.error.role"),
    invalid: t("profile.invalid"),
    forbidden: t("roles.error.selfDemote"),
  };
  const full = seats.max >= 0 && seats.used >= seats.max;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{organization.name}</p>
      </header>
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {[
          { id: "profil", label: t("tab.profile") },
          { id: "membres", label: t("tab.members") },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/app/organisation?onglet=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              tab === item.id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {ok && tab === "profil" && <Alert tone="success" title={t("profile.saved")} />}
      {ok && tab === "membres" && okText[ok] && <Alert tone="success" title={okText[ok]} />}
      {erreur && <Alert tone="error" title={errorText[erreur] ?? t("profile.invalid")} />}

      {tab === "profil" ? (
        <form
          action={updateOrganizationAction}
          className="flex max-w-3xl flex-col gap-4 rounded-card bg-blanc p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-h2">{t("profile.title")}</h2>
            <p className="text-ardoise">{t("profile.subtitle")}</p>
          </div>
          <fieldset disabled={!admin} className="flex flex-col gap-4">
            <TextField
              id="org-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              label={t("profile.name")}
              defaultValue={organization.name}
            />
            <TextArea
              id="org-description"
              name="description"
              rows={5}
              maxLength={3000}
              label={t("profile.description.text")}
              placeholder={t("profile.description.placeholder")}
              defaultValue={organization.description ?? ""}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="org-sector"
                name="sector"
                maxLength={120}
                label={t("profile.sector")}
                defaultValue={organization.sector ?? ""}
              />
              <TextField
                id="org-size"
                name="size"
                maxLength={40}
                label={t("profile.size.text")}
                defaultValue={organization.size ?? ""}
              />
              <TextField
                id="org-city"
                name="city"
                maxLength={120}
                label={t("profile.city")}
                defaultValue={organization.city ?? ""}
              />
              <TextField
                id="org-country"
                name="country"
                maxLength={2}
                label={t("profile.country")}
                hint={t("profile.countryHint")}
                defaultValue={organization.country ?? ""}
              />
              <TextField
                id="org-website"
                name="website"
                type="url"
                maxLength={200}
                label={t("profile.website.text")}
                placeholder={t("profile.website.placeholder")}
                defaultValue={organization.website ?? ""}
              />
            </div>
          </fieldset>
          {admin && (
            <Button type="submit" className="self-start">
              {t("profile.save")}
            </Button>
          )}
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <section
            aria-labelledby="membres"
            className="flex flex-col gap-4 rounded-card bg-blanc p-6"
          >
            <div className="flex flex-col gap-1">
              <h2 id="membres" className="text-h2">
                {t("members.title")}
              </h2>
              {seats.max >= 0 && (
                <p className="text-ardoise">
                  {t("members.seats.text", {
                    used: seats.used,
                    max: seats.max,
                    plan: plan?.planName ?? "",
                  })}
                </p>
              )}
            </div>
            <ul className="flex flex-col divide-y divide-brume">
              {members.map((member) => {
                const self = member.userId === user.id;
                const editable =
                  admin && !self && (member.role !== "org_owner" || ctx.role === "org_owner");
                return (
                  <li key={member.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {self
                            ? [member.user.name, t("members.you")].join(" · ")
                            : member.user.name}
                        </span>
                        <span className="text-sm text-ardoise">{member.user.email}</span>
                      </div>
                      <Badge tone="hire">{roleName(member.role)}</Badge>
                    </div>
                    {editable && member.role !== "org_owner" && (
                      <div className="flex flex-wrap items-end gap-3">
                        <form action={changeRoleAction} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="id" value={member.id} />
                          <Select
                            id={`role-${member.id}`}
                            name="role"
                            label={t("members.changeRole")}
                            defaultValue={member.role}
                            options={[...new Set<MembershipRole>([member.role, ...roles])].map(
                              (role) => ({
                                value: role,
                                label: roleName(role),
                              }),
                            )}
                          />
                          <Button type="submit" variant="tertiary" size="sm">
                            {t("members.changeRole")}
                          </Button>
                        </form>
                        <details>
                          <summary className="cursor-pointer text-sm font-medium underline">
                            {t("members.remove.text")}
                          </summary>
                          <form
                            action={removeMemberAction}
                            className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                          >
                            <input type="hidden" name="id" value={member.id} />
                            <p className="font-semibold">
                              {t("members.remove.confirm.title", { memberName: member.user.name })}
                            </p>
                            <p>
                              {t("members.remove.confirm.body", {
                                memberName: member.user.name,
                                org: organization.name,
                              })}
                            </p>
                            <Button type="submit" variant="danger" size="sm">
                              {t("members.remove.confirm.cta")}
                            </Button>
                          </form>
                        </details>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {admin && invitations.length > 0 && (
            <section
              aria-labelledby="invitations"
              className="flex flex-col gap-3 rounded-card bg-blanc p-6"
            >
              <h2 id="invitations" className="text-h2">
                {t("invite.pending")}
              </h2>
              <ul className="flex flex-col divide-y divide-brume">
                {invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{invitation.email}</span>
                      <span className="text-sm text-ardoise">
                        {[
                          roleName(invitation.role),
                          format.relativeTime(invitation.expiresAt, new Date()),
                        ].join(" · ")}
                      </span>
                    </div>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="id" value={invitation.id} />
                      <Button type="submit" variant="tertiary" size="sm">
                        {t("invite.revoke")}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {admin && (
            <section
              aria-labelledby="inviter"
              className="flex flex-col gap-4 rounded-card bg-blanc p-6"
            >
              <h2 id="inviter" className="text-h2">
                {t("invite.title")}
              </h2>
              {full ? (
                <Alert
                  tone="warning"
                  title={t("members.seats.full")}
                  action={
                    <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
                      {t("tab.subscription")}
                    </ButtonLink>
                  }
                />
              ) : (
                <form action={inviteAction} className="flex flex-col gap-4">
                  <TextArea
                    id="org-emails"
                    name="emails"
                    required
                    rows={2}
                    label={t("invite.emails.text")}
                    placeholder={t("invite.emails.placeholder")}
                  />
                  <Select
                    id="org-role"
                    name="role"
                    required
                    label={t("invite.role")}
                    defaultValue="recruiter"
                    options={roles.map((role) => ({ value: role, label: roleName(role) }))}
                  />
                  <TextArea
                    id="org-message"
                    name="message"
                    rows={3}
                    maxLength={500}
                    label={t("invite.message")}
                  />
                  <Button type="submit" className="self-start">
                    {t("invite.send")}
                  </Button>
                </form>
              )}
            </section>
          )}

          <section
            aria-labelledby="roles"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="roles" className="text-h2">
              {t("roles.title")}
            </h2>
            <dl className="flex flex-col gap-3">
              {(["org_owner", "org_admin", "recruiter", "hiring_manager", "viewer"] as const).map(
                (role) => (
                  <div key={role} className="flex flex-col">
                    <dt className="font-semibold">{roleName(role)}</dt>
                    <dd className="text-sm text-ardoise">{t(`roles.${role}.desc`)}</dd>
                  </div>
                ),
              )}
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
