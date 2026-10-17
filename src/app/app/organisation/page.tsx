import type { Metadata } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { BrandIdentity } from "@/components/hire/brand-identity";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { Initials, MenuChip, menuItem, moreButton, OrgMark } from "@/components/hire/kit";
import { TabRail } from "@/components/motion/tab-rail";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import {
  Alert,
  PlanLock,
  Select,
  TextArea,
  TextField,
  segmentedItem,
  segmentedList,
} from "@/components/ui";
import type { MembershipRole } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { EntitiesTab, TeamsTab, VerificationTab } from "@/components/org/structure-tabs";
import {
  changeRoleAction,
  inviteAction,
  removeMemberAction,
  revokeInvitationAction,
  setMemberTeamAction,
  transferOwnershipAction,
  updateOrganizationAction,
} from "@/server/actions/organization";
import { db } from "@/server/db";
import { can, level, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { hirePermissions } from "@/server/services/hire";
import {
  grantableRoles,
  listMembers,
  organizationCategories,
  seatUsage,
} from "@/server/services/organization";
import { orgStructure } from "@/server/services/org-structure";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { VERIFICATION_DAYS } from "@/server/services/verification";

const tabs = ["profil", "verification", "membres", "equipes", "departements", "entites"] as const;
type Tab = (typeof tabs)[number];
const allRoles = ["org_owner", "org_admin", "recruiter", "hiring_manager", "viewer"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("org");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const panel = "flex min-w-0 flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6";
const th = "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase";

/**
 * Organization (partie 07 § 4), mockup 04-10: the header card, the tabs (profile, verification,
 * members, teams, departments, entities, subscription) and, beside, the verification, the roles
 * and the teams. Members, roles and invitations are managed by the administrators.
 */
export default async function OrganizationPage({ searchParams }: PageProps<"/app/organisation">) {
  const params = await searchParams;
  const { user, ctx } = await requireHire("/app/organisation");
  const t = await getTranslations("org");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [
    organization,
    { members, invitations },
    seats,
    permissionsLevel,
    plan,
    teamsOn,
    entitiesOn,
    verificationOn,
    plans,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      include: {
        documents: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, size: true, createdAt: true },
        },
      },
    }),
    listMembers(db, ctx),
    seatUsage(db, ctx.organizationId),
    level(db, subject, "org.permissions.level"),
    resolvePlan(db, subject),
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    can(db, subject, "org.verified_profile"),
    listPublicPlans(db),
  ]);
  const structure = teamsOn || entitiesOn ? await orgStructure(db, ctx.organizationId) : null;
  const admin = hirePermissions(ctx.role).administer;
  const roles = grantableRoles(permissionsLevel);
  const roleName = (role: MembershipRole) =>
    role === "partner_manager" ? role : t(`roles.${role}.text`);
  const tab: Tab = (tabs as readonly string[]).includes(one(params.onglet))
    ? (one(params.onglet) as Tab)
    : "profil";
  const erreur = one(params.erreur);
  const ok = one(params.ok);
  const okText: Record<string, string> = {
    invitations: t("invite.sent", { count: Number(one(params.nombre) || 0) }),
    annulee: t("invite.revoked"),
    role: t("members.roleDone"),
    retire: t("members.removedDone"),
    equipe: t("members.teamDone"),
    transfert: t("members.transferDone"),
    cree: t("structure.created"),
    supprime: t("structure.deleted"),
    documentRetire: t("verification.documents.removed"),
  };
  const errorText: Record<string, string> = {
    alreadyMember: t("invite.error.alreadyMember", { email: one(params.email) }),
    seats: t("invite.error.seats", { count: Number(one(params.nombre) || 1) }),
    role: t("invite.error.role"),
    invalid: t("profile.invalid"),
    forbidden: t("roles.error.selfDemote"),
    notEmpty: t("structure.notEmpty"),
    verification: t("verification.invalid"),
    fileType: t("verification.fileError.fileType"),
    fileSize: t("verification.fileError.fileSize"),
    fileCount: t("verification.fileError.fileCount"),
    status: t("verification.fileError.status"),
    ...(tab !== "profil" && tab !== "membres" ? { invalid: t("structure.invalid") } : {}),
  };
  const full = seats.max >= 0 && seats.used >= seats.max;
  const verified = organization.verificationStatus === "verified";
  const search = one(params.q).trim().toLowerCase();
  const roleFilter = (allRoles as readonly string[]).includes(one(params.role))
    ? (one(params.role) as MembershipRole)
    : null;
  const shown = members.filter(
    (member) =>
      (!roleFilter || member.role === roleFilter) &&
      (!search ||
        member.user.name.toLowerCase().includes(search) ||
        member.user.email.toLowerCase().includes(search)),
  );
  const okMessage =
    tab === "profil"
      ? ok
        ? t("profile.saved")
        : null
      : tab !== "verification"
        ? okText[ok]
        : null;
  const membersHref = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams({ onglet: "membres" });
    if (search) next.set("q", one(params.q));
    if (roleFilter) next.set("role", roleFilter);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    return `/app/organisation?${next}`;
  };

  const tabItems = [
    { id: "profil", label: t("tab.profile") },
    { id: "verification", label: t("tab.verification") },
    { id: "membres", label: t("tab.members") },
    { id: "equipes", label: t("tab.teams") },
    { id: "departements", label: t("tab.departments") },
    { id: "entites", label: t("tab.entities") },
  ];

  const memberActions = (member: (typeof members)[number]) => {
    const self = member.userId === user.id;
    const editable = admin && !self && (member.role !== "org_owner" || ctx.role === "org_owner");
    const teamForm = admin && teamsOn && structure && structure.teams.length > 0;
    const transfer = ctx.role === "org_owner" && !self && member.status === "active";
    if (!teamForm && !transfer && !(editable && member.role !== "org_owner")) return null;
    return (
      <MenuChip
        group="member-actions"
        align="right"
        summaryClassName={moreButton}
        summary={
          <>
            <Icon name="more" className="size-4" />
            <span className="sr-only">{t("members.actions", { name: member.user.name })}</span>
          </>
        }
      >
        <div className="flex w-[min(300px,calc(100vw-48px))] flex-col gap-3 p-2">
          {teamForm && (
            <form action={setMemberTeamAction} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={member.id} />
              <Select
                id={`team-${member.id}`}
                name="team"
                label={t("tab.teams")}
                placeholder={t("members.team.none")}
                defaultValue={member.team?.id ?? ""}
                options={structure.teams.map((team) => ({ value: team.id, label: team.name }))}
              />
              <button type="submit" className={pillClass("outline", "sm", "self-start")}>
                {t("members.team.save")}
              </button>
            </form>
          )}
          {transfer && (
            <details className="border-t border-gris-clair pt-2">
              <summary className="cursor-pointer text-[13px] font-semibold">
                {t("members.transferOwnership.text")}
              </summary>
              <form
                action={transferOwnershipAction}
                className="mt-2 flex flex-col items-start gap-2 rounded-[14px] bg-creme p-3 text-[12.5px] leading-[18px]"
              >
                <input type="hidden" name="id" value={member.id} />
                <p>
                  {t("members.transferOwnership.confirm", {
                    memberName: member.user.name,
                    org: organization.name,
                  })}
                </p>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-pill bg-down-texte px-3.5 text-[12.5px] font-semibold text-blanc"
                >
                  {t("members.transferOwnership.text")}
                </button>
              </form>
            </details>
          )}
          {editable && member.role !== "org_owner" && (
            <details className="border-t border-gris-clair pt-2">
              <summary className="cursor-pointer text-[13px] font-semibold text-down-texte">
                {t("members.remove.text")}
              </summary>
              <form
                action={removeMemberAction}
                className="mt-2 flex flex-col items-start gap-2 rounded-[14px] bg-creme p-3 text-[12.5px] leading-[18px]"
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
                <button
                  type="submit"
                  className="inline-flex h-8 items-center rounded-pill bg-down-texte px-3.5 text-[12.5px] font-semibold text-blanc"
                >
                  {t("members.remove.confirm.cta")}
                </button>
              </form>
            </details>
          )}
        </div>
      </MenuChip>
    );
  };

  const roleCell = (member: (typeof members)[number]) => {
    const self = member.userId === user.id;
    const editable = admin && !self && member.role !== "org_owner";
    if (!editable)
      return <span className="text-[13.5px] font-semibold">{roleName(member.role)}</span>;
    return (
      <MenuChip
        group="member-role"
        summaryClassName={pillClass("outline", "sm")}
        summary={
          <>
            {roleName(member.role)}
            <Icon name="chev-d" className="size-3.5" />
            <span className="sr-only">{t("members.changeRole")}</span>
          </>
        }
      >
        <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
          {t("members.changeRole")}
        </p>
        {[...new Set<MembershipRole>([member.role, ...roles])]
          .filter((role) => role !== "org_owner")
          .map((role) => (
            <form key={role} action={changeRoleAction}>
              <input type="hidden" name="id" value={member.id} />
              <input type="hidden" name="role" value={role} />
              <button
                type="submit"
                aria-current={role === member.role ? "true" : undefined}
                className={cx(
                  menuItem,
                  "aria-[current=true]:bg-creme aria-[current=true]:font-semibold",
                )}
              >
                <span className="w-4">{role === member.role && <Icon name="check" />}</span>
                {roleName(role)}
              </button>
            </form>
          ))}
      </MenuChip>
    );
  };
  const statusTag = (
    <span className="inline-flex h-6 items-center rounded-pill bg-lime-clair px-2.5 text-[11.5px] font-semibold text-up-texte">
      {t("members.status.active")}
    </span>
  );

  const membersTab = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[24px] bg-blanc p-4 sm:flex-row sm:items-center lg:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-lime-clair max-sm:hidden">
          <Icon name="equipe" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-[14px] font-semibold">
            {seats.max >= 0
              ? t("members.seats.text", {
                  used: seats.used,
                  max: seats.max,
                  plan: plan?.planName ?? "",
                })
              : t("members.title")}
          </p>
          {seats.max > 0 && (
            <span aria-hidden className="block h-1.5 overflow-hidden rounded-pill bg-gris-clair">
              <span
                className="jm-gauge block h-full origin-left rounded-pill bg-sapin"
                style={{ transform: `scaleX(${Math.min(1, seats.used / seats.max)})` }}
              />
            </span>
          )}
        </div>
        {admin && !full && (
          <a
            href="#inviter"
            className={pillClass("dark", "md", "shrink-0 self-start sm:self-auto")}
          >
            <Icon name="ajouter" className="size-4" />
            {t("members.invite")}
          </a>
        )}
      </div>
      {full && admin && (
        <Alert
          tone="warning"
          title={t("members.seats.full")}
          action={<Link href="/app/abonnement">{t("tab.subscription")}</Link>}
        />
      )}

      <form method="get" role="search" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="onglet" value="membres" />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-pill bg-blanc px-4 ring-[1.5px] ring-brume ring-inset focus-within:ring-sapin sm:max-w-80">
          <Icon name="recherche" className="size-4 shrink-0" />
          <span className="sr-only">{t("members.search.placeholder")}</span>
          <input
            id="members-q"
            name="q"
            maxLength={80}
            defaultValue={one(params.q)}
            placeholder={t("members.search.placeholder")}
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-ardoise"
          />
        </label>
        <MenuChip
          group="member-filter"
          summaryClassName={pillClass(roleFilter ? "dark" : "outline", "sm", "h-11")}
          summary={
            <>
              {roleFilter ? roleName(roleFilter) : t("members.col.role")}
              <Icon name="chev-d" className="size-3.5" />
            </>
          }
        >
          <Link href={membersHref({ role: null })} className={menuItem}>
            {t("members.filter.all")}
          </Link>
          {allRoles.map((role) => (
            <Link
              key={role}
              href={membersHref({ role })}
              aria-current={role === roleFilter ? "true" : undefined}
              className={cx(menuItem, "aria-[current=true]:font-semibold")}
            >
              {role === roleFilter && <Icon name="check" />}
              {roleName(role)}
            </Link>
          ))}
        </MenuChip>
      </form>

      <section aria-labelledby="membres" className="flex flex-col gap-3">
        <h2 id="membres" className="sr-only">
          {t("members.title")}
        </h2>
        {shown.length === 0 ? (
          <p className="rounded-[24px] bg-blanc p-5 text-[14px] text-ardoise">
            {t("members.searchEmpty")}
          </p>
        ) : (
          <>
            <div className="rounded-[24px] bg-blanc max-lg:hidden">
              <table className="w-full">
                <caption className="sr-only">{t("members.title")}</caption>
                <thead className="border-b border-gris-clair">
                  <tr>
                    <th scope="col" className={th}>
                      {t("members.col.name")}
                    </th>
                    <th scope="col" className={th}>
                      {t("members.col.role")}
                    </th>
                    <th scope="col" className={th}>
                      {t("members.col.teams")}
                    </th>
                    <th scope="col" className={th}>
                      {t("members.col.status")}
                    </th>
                    <th scope="col" className="w-14">
                      <span className="sr-only">{t("members.changeRole")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gris-clair">
                  {shown.map((member) => (
                    <tr key={member.id}>
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        <span className="flex items-center gap-3">
                          <Initials name={member.user.name} size={38} />
                          <span className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 text-[14px] font-semibold">
                              {member.user.name}
                              {member.userId === user.id && (
                                <span className="rounded-pill bg-sapin px-2 py-0.5 text-[10.5px] font-semibold text-neon">
                                  {t("members.you")}
                                </span>
                              )}
                            </span>
                            <span className="max-w-60 truncate text-[12px] text-ardoise">
                              {member.user.email}
                            </span>
                          </span>
                        </span>
                      </th>
                      <td className="px-4 py-3">{roleCell(member)}</td>
                      <td className="px-4 py-3 text-[12.5px]">
                        {member.team?.name ?? t("members.team.none")}
                      </td>
                      <td className="px-4 py-3">{statusTag}</td>
                      <td className="px-3 py-3 text-right">{memberActions(member)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="flex flex-col gap-2.5 lg:hidden">
              {shown.map((member) => (
                <li key={member.id} className="flex items-center gap-3 rounded-[22px] bg-blanc p-4">
                  <Initials name={member.user.name} size={42} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-semibold">
                      {member.user.name}
                      {member.userId === user.id && (
                        <span className="rounded-pill bg-sapin px-2 py-0.5 text-[10.5px] font-semibold text-neon">
                          {t("members.you")}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {roleCell(member)}
                      {statusTag}
                    </div>
                    {member.team && (
                      <span className="text-[12px] text-ardoise">{member.team.name}</span>
                    )}
                  </div>
                  <div className="shrink-0 self-start">{memberActions(member)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {admin && invitations.length > 0 && (
        <section aria-labelledby="invitations" className={panel}>
          <div className="flex items-center justify-between gap-2">
            <h2 id="invitations" className="text-[18px] font-semibold">
              {t("invite.pending")}
            </h2>
            <span className="grid size-7 place-items-center rounded-full bg-lime text-[12px] font-semibold">
              {invitations.length}
            </span>
          </div>
          <ul className="flex flex-col divide-y divide-gris-clair">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gris-clair">
                  <Icon name="profil" className="size-4 text-ardoise" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-semibold">{invitation.email}</span>
                  <span className="text-[12px] text-ardoise">
                    {[
                      roleName(invitation.role),
                      t("invite.expiresIn", {
                        time: format.relativeTime(invitation.expiresAt, new Date()),
                      }),
                    ].join(" · ")}
                  </span>
                </div>
                <form action={revokeInvitationAction}>
                  <input type="hidden" name="id" value={invitation.id} />
                  <button type="submit" className="text-[12.5px] font-semibold text-down-texte">
                    {t("invite.revoke")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {admin && !full && (
        <section id="inviter" aria-labelledby="inviter-title" className={cx(panel, "scroll-mt-24")}>
          <h2 id="inviter-title" className="text-[18px] font-semibold">
            {t("invite.title")}
          </h2>
          <form action={inviteAction} className="flex flex-col gap-4">
            <TextArea
              id="org-emails"
              name="emails"
              required
              rows={2}
              label={t("invite.emails.text")}
              placeholder={t("invite.emails.placeholder")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="org-role"
                name="role"
                required
                label={t("invite.role")}
                defaultValue="recruiter"
                options={roles.map((role) => ({ value: role, label: roleName(role) }))}
              />
              {teamsOn && structure && structure.teams.length > 0 && (
                <Select
                  id="org-team"
                  name="team"
                  label={t("invite.team")}
                  placeholder={t("members.team.none")}
                  options={structure.teams.map((team) => ({ value: team.id, label: team.name }))}
                />
              )}
            </div>
            <TextArea
              id="org-message"
              name="message"
              rows={3}
              maxLength={500}
              label={t("invite.message")}
            />
            <button type="submit" className={pillClass("lime", "md", "self-start")}>
              {t("invite.send")}
              <Icon name="send" className="size-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );

  const messages = await getMessages();
  const profileTab = (
    <div className="flex flex-col gap-4">
      {/* V6 § B9: the banner and the logo shown on every offer (screen 66). */}
      <div className={panel}>
        <NextIntlClientProvider
          messages={{
            hire: { jobForm: { brand: messages.hire.jobForm.brand } },
            a11y: { avatar: messages.a11y.avatar },
          }}
        >
          <BrandIdentity
            org={organization.name}
            brand={{ banner: organization.banner, logo: organization.logo, canEdit: admin }}
          />
        </NextIntlClientProvider>
      </div>
      <form action={updateOrganizationAction} className={panel}>
        <div className="flex flex-col gap-1">
          <h2 className="text-[20px] font-semibold">{t("profile.title")}</h2>
          <p className="text-[13.5px] text-ardoise">{t("profile.subtitle")}</p>
        </div>
        <fieldset disabled={!admin} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="org-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              label={t("profile.name")}
              defaultValue={organization.name}
            />
            <TextField
              id="org-legal-name"
              name="legalName"
              maxLength={160}
              label={t("profile.legalName")}
              hint={t("profile.legalNameHint")}
              defaultValue={organization.legalName ?? ""}
            />
          </div>
          <Select
            id="org-category"
            name="category"
            label={t("profile.category.text")}
            placeholder={t("profile.category.none")}
            defaultValue={organization.category ?? ""}
            options={organizationCategories.map((value) => ({
              value,
              label: t(`profile.category.${value}`),
            }))}
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
            <TextField
              id="org-contact-email"
              name="contactEmail"
              type="email"
              maxLength={200}
              label={t("profile.contactEmail")}
              defaultValue={organization.contactEmail ?? ""}
            />
          </div>
        </fieldset>
        {admin && (
          <button type="submit" className={pillClass("dark", "md", "self-start")}>
            {t("profile.save")}
          </button>
        )}
      </form>
    </div>
  );

  const aside = (
    <aside className="flex flex-col gap-4">
      {tab !== "verification" && (
        <section aria-labelledby="verif-summary" className={panel}>
          <div className="flex items-start justify-between gap-3">
            <h2 id="verif-summary" className="text-[18px] leading-6 font-semibold">
              {t("verification.title")}
            </h2>
            <span
              className={cx(
                "inline-flex h-7 shrink-0 items-center gap-1 rounded-pill px-2.5 text-[11.5px] font-semibold",
                verified ? "bg-menthe-claire text-menthe-texte" : "bg-gris-clair",
              )}
            >
              {verified && <Icon name="check" className="size-3.5" />}
              {t(`verification.status.${organization.verificationStatus}`)}
            </span>
          </div>
          <p className="text-[13px] leading-[19px] text-ardoise">{t("verification.subtitle")}</p>
          <ul className="flex flex-col gap-2 text-[13px] leading-[18px]">
            {(["registration", "taxId", "domain", "mandate"] as const).map((doc) => (
              <li key={doc} className="flex gap-2.5">
                <Icon
                  name="check"
                  className={cx(
                    "mt-0.5 size-3.5 shrink-0",
                    verified ? "text-feuille" : "text-brume",
                  )}
                />
                {t(`verification.doc.${doc}`)}
              </li>
            ))}
          </ul>
          {verified && organization.verifiedAt ? (
            <p className="text-[12px] text-ardoise">
              {t("verification.verifiedOn", { date: organization.verifiedAt })}
            </p>
          ) : (
            <Link
              href="/app/organisation?onglet=verification"
              className={pillClass("outline", "sm", "self-start")}
            >
              {t("tab.verification")}
            </Link>
          )}
        </section>
      )}
      <section aria-labelledby="roles" className={panel}>
        <h2 id="roles" className="text-[18px] font-semibold">
          {t("roles.title")}
        </h2>
        <dl className="flex flex-col divide-y divide-gris-clair">
          {allRoles.map((role) => (
            <div key={role} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[14px] font-semibold">{roleName(role)}</dt>
              <dd className="text-[12.5px] leading-[17px] text-ardoise">
                {t(`roles.${role}.desc`)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {teamsOn && structure && (
        <section aria-labelledby="teams-summary" className={panel}>
          <div className="flex items-center justify-between gap-2">
            <h2 id="teams-summary" className="text-[18px] font-semibold">
              {t("teams.title")}
            </h2>
            {admin && (
              <Link href="/app/organisation?onglet=equipes" className={pillClass("outline", "sm")}>
                <Icon name="ajouter" className="size-4" />
                {t("teams.new")}
              </Link>
            )}
          </div>
          {structure.teams.length === 0 ? (
            <p className="text-[13px] text-ardoise">{t("teams.empty")}</p>
          ) : (
            <ul className="flex flex-col">
              {structure.teams.slice(0, 5).map((team) => (
                <li key={team.id}>
                  <Link
                    href="/app/organisation?onglet=equipes"
                    className="flex items-center gap-3 py-2"
                  >
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-sapin text-neon"
                    >
                      <Icon name="equipe" className="size-4" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] font-semibold">{team.name}</span>
                      <span className="text-[12px] text-ardoise">
                        {[
                          t("teams.members", { count: team._count.memberships }),
                          t("teams.jobs", { count: team._count.jobs }),
                        ].join(" · ")}
                      </span>
                    </span>
                    <Icon name="chev-r" className="size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {!entitiesOn && (
        <PlanLock
          plan={orgPlanFor(plans, "org.entities")}
          description={t("entities.locked", { plan: orgPlanFor(plans, "org.entities") })}
        />
      )}
    </aside>
  );

  const meta = [
    organization.category
      ? t(`profile.category.${organization.category as (typeof organizationCategories)[number]}`)
      : null,
    organization.sector,
    organization.size,
    organization.city,
  ].filter(Boolean);

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={[organization.name, plan?.planName].filter(Boolean).join(" · ")}
        title={t("title")}
      />
      <section className="overflow-hidden rounded-[24px] bg-blanc">
        <div
          aria-hidden
          className="h-14 bg-sapin bg-[radial-gradient(var(--color-lime)_1.5px,transparent_1.5px)] bg-size-[28px_28px] opacity-95 lg:h-16"
        />
        <div className="flex flex-col gap-3 px-5 pb-5 lg:flex-row lg:items-end lg:gap-5 lg:px-6">
          <span className="relative -mt-10 inline-flex self-start rounded-[24px] ring-4 ring-blanc">
            <OrgMark name={organization.name} size={76} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="flex flex-wrap items-center gap-2 text-[22px] leading-7 font-semibold tracking-[-0.015em]">
              {organization.name}
              {verified && (
                <span className="inline-flex h-7 items-center gap-1 rounded-pill bg-menthe-claire px-2.5 text-[12px] font-semibold text-menthe-texte">
                  <Icon name="check" className="size-3.5" />
                  {t("verification.status.verified")}
                </span>
              )}
            </h2>
            {meta.length > 0 && <p className="text-[13px] text-ardoise">{meta.join(" · ")}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {organization.slug && (
              <Link
                href={`/entreprises/${organization.slug}`}
                className={pillClass("outline", "sm")}
              >
                <Icon name="eye" className="size-4" />
                {t("profile.publicPage.view")}
              </Link>
            )}
            {tab !== "profil" && (
              <Link
                href="/app/organisation"
                className={pillClass("outline", "sm", "max-lg:hidden")}
              >
                <Icon name="edit" className="size-4" />
                {t("profile.title")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <TabRail name="organisation" className="bg-transparent! p-0!">
        <nav aria-label={t("title")} className={segmentedList}>
          {tabItems.map((item) => (
            <Link
              key={item.id}
              href={`/app/organisation?onglet=${item.id}`}
              aria-current={tab === item.id ? "page" : undefined}
              className={segmentedItem(tab === item.id)}
            >
              {item.label}
            </Link>
          ))}
          {admin && (
            <Link href="/app/abonnement" className={segmentedItem(false)}>
              {t("tab.subscription")}
            </Link>
          )}
        </nav>
      </TabRail>

      {okMessage && <ToastOnLoad message={okMessage} tone="success" />}
      {erreur && <Alert tone="error" title={errorText[erreur] ?? t("profile.invalid")} />}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-4">
          {tab === "verification" ? (
            <VerificationTab
              organization={organization}
              admin={admin}
              lockedPlan={verificationOn ? null : orgPlanFor(plans, "org.verified_profile")}
              days={VERIFICATION_DAYS}
            />
          ) : tab === "equipes" || tab === "departements" ? (
            <TeamsTab
              kind={tab === "equipes" ? "team" : "department"}
              structure={teamsOn ? structure : null}
              members={members}
              admin={admin}
              entities={entitiesOn}
              lockedPlan={teamsOn ? null : orgPlanFor(plans, "org.teams")}
            />
          ) : tab === "entites" ? (
            <EntitiesTab
              structure={structure}
              admin={admin}
              lockedPlan={entitiesOn ? null : orgPlanFor(plans, "org.entities")}
            />
          ) : tab === "profil" ? (
            profileTab
          ) : (
            membersTab
          )}
        </div>
        {aside}
      </div>
    </div>
  );
}
