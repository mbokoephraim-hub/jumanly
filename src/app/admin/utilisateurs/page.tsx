import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AuditHistory } from "@/components/admin/audit";
import {
  AdminDone,
  AdminEmpty,
  AdminFilterBar,
  AdminPageHeader,
  AdminPager,
  AdminStats,
  AuditNotice,
  FilterMenu,
  Initials,
  ReasonField,
  SectionRule,
  SensitivePanel,
  Tag,
  pageParam,
} from "@/components/admin/kit";
import {
  ago,
  displayName,
  planTone,
  statuses,
  statusTone,
  UserCard,
  userState,
} from "@/components/admin/utilisateurs-fiche";
import { UserOverviewPanels } from "@/components/admin/user-overview";
import { UserPanels } from "@/components/admin/user-panels";
import { UserRights } from "@/components/admin/user-rights";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { setUserRole, setUserStatus } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { userOverview } from "@/server/services/admin-user-overview";
import {
  accountCheck,
  grantedPlans,
  PLATFORM_ROLES,
  readUserFilters,
  userListWhere,
  userRights,
} from "@/server/services/admin-users";

const PAGE = "/admin/utilisateurs";
const PAGE_SIZE = 50;
const roles = PLATFORM_ROLES;
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}
const DONE = [
  "codeSent",
  "twoFactorReset",
  "resetSent",
  "verified",
  "planGranted",
  "planRevoked",
  "creditsAdded",
  "overrideRemoved",
  "deleted",
  "erased",
] as const;
const ERRORS = [
  "champs",
  "motif",
  "until",
  "plan",
  "quota",
  "unlimited",
  "grant",
  "confirm",
  "self",
  "lastAdmin",
  "owner",
  "deleted",
] as const;

/**
 * Users (mockup 07-02): dense table, user card on the right (`?fiche=<id>`), suspension panel
 * (`&action=suspendre`) and platform roles. Private messages and documents are never shown here.
 */
export default async function AdminUsers({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  // Content editors see the admin shell, but only the courses.
  if (!admin) notFound();
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const writable = canWriteAdmin(admin);
  const now = new Date();

  const userFilters = readUserFilters(params);
  const { q, planCode, role, state, country } = userFilters;
  const ficheId = one(params.fiche).slice(0, 60);
  const action = one(params.action);
  const page = pageParam(params.page);

  const filters = { q, forfait: planCode, role, statut: state, pays: country };
  const href = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const kept = { ...filters, page: page > 1 ? String(page) : undefined };
    for (const [key, value] of Object.entries({ ...kept, ...changes }))
      if (value) query.set(key, value);
    const text = query.toString();
    return text ? `${PAGE}?${text}` : PAGE;
  };

  const plans = await db.plan.findMany({
    where: { family: "talent", active: true },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true, priceCents: true },
  });
  const chosenPlan = plans.find((plan) => plan.code === planCode);

  const fiche = ficheId ? await db.user.findUnique({ where: { id: ficheId } }) : null;
  const ficheHref = fiche ? href({ fiche: fiche.id }) : href({});
  const canAct = writable && fiche !== null && fiche.id !== admin.id && fiche.status !== "deleted";
  // Veto (« Effacer définitivement »): also on an anonymized account, never on one's own.
  const canErase = writable && fiche !== null && fiche.id !== admin.id;
  const suspending = canAct && action === "suspendre" && fiche.status !== "suspended";
  const actionHref = (name: string, extra = "") =>
    `${ficheHref}&action=${name}${extra}#utilisateurs-panneau`;
  const [rights, granted] =
    fiche && fiche.status !== "deleted"
      ? await Promise.all([userRights(db, fiche.id, now), grantedPlans(db, fiche.id, now)])
      : [null, []];
  const [overview, check] = fiche
    ? await Promise.all([userOverview(db, fiche.id, now), accountCheck(db, fiche.id)])
    : [null, null];
  const done = DONE.find((value) => value === params.ok);
  const error = ERRORS.find((value) => value === params.erreur);

  const ficheBlock = fiche ? (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {suspending && (
          <div className="flex flex-col gap-2">
            <SectionRule>{t("sensitive.label")}</SectionRule>
            <SensitivePanel
              title={t("users.action.suspend.text")}
              text={t("users.action.suspend.confirm", { userName: fiche.name })}
              closeHref={ficheHref}
            >
              <form action={setUserStatus} className="flex flex-col gap-3.5">
                <input type="hidden" name="userId" value={fiche.id} />
                <input type="hidden" name="back" value={ficheHref} />
                <input type="hidden" name="status" value="suspended" />
                <ReasonField
                  id="utilisateurs-suspend-reason"
                  label={t("users.action.suspend.reason")}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                    {tc("cancel")}
                  </ButtonLink>
                  <Button type="submit" variant="danger">
                    {t("users.action.suspend.text")}
                  </Button>
                </div>
              </form>
            </SensitivePanel>
          </div>
        )}
        {(canAct || (canErase && action === "effacer")) && (
          <UserPanels
            user={fiche}
            action={action}
            params={params}
            ficheHref={ficheHref}
            actorId={admin.id}
            rights={rights}
            granted={granted}
          />
        )}
        {overview && (
          <UserOverviewPanels
            user={fiche}
            overview={overview}
            check={check}
            back={ficheHref}
            canAct={canAct}
            twoFactorHref={actionHref("2fa")}
          />
        )}
        {rights && (
          <UserRights
            plan={rights.plan}
            source={rights.source}
            rows={rights.rows}
            granted={granted}
            removeHref={
              canAct
                ? (id) => actionHref("retirer-ajout", `&ajout=${encodeURIComponent(id)}`)
                : undefined
            }
            revokeHref={
              canAct
                ? (id) => actionHref("retirer-forfait", `&abonnement=${encodeURIComponent(id)}`)
                : undefined
            }
          />
        )}
        {canAct && (
          <div className="flex flex-col gap-2">
            <SectionRule>{t("users.col.roles")}</SectionRule>
            <section
              id="utilisateurs-roles"
              aria-labelledby="utilisateurs-roles-title"
              className="jm-admin-card flex scroll-mt-6 flex-col gap-3 rounded-[24px] bg-blanc px-5 py-5 lg:px-[22px]"
            >
              <h2
                id="utilisateurs-roles-title"
                className="text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
              >
                {t("users.action.roles.text")}
              </h2>
              <p className="flex items-start gap-2.5 rounded-[12px] bg-ambre-fond px-3 py-2.5 text-[11px] leading-[15px] text-ambre-texte">
                <Icon name="securite" className="mt-px size-3.5 shrink-0" />
                {t("users.action.roles.warning")}
              </p>
              <form action={setUserRole} className="flex flex-col gap-3">
                <input type="hidden" name="userId" value={fiche.id} />
                <input type="hidden" name="back" value={ficheHref} />
                <fieldset className="flex flex-col gap-2.5">
                  <legend className="sr-only">{t("users.action.roles.text")}</legend>
                  {[...roles].reverse().map((value) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-5"
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        defaultChecked={fiche.platformRole === value}
                        className="mt-px size-5 shrink-0 accent-sapin"
                      />
                      <span className="flex flex-col">
                        <span className="font-semibold">
                          {value === "user" ? t("users.role.user") : t(`role.${value}`)}
                        </span>
                        <span className="text-[12px] leading-4 text-ardoise">
                          {t(`users.roleHint.${value}`)}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <div className="flex justify-end">
                  <Button type="submit" variant="secondary" size="sm">
                    {t("users.action.roles.save")}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}
        <AuditNotice />
      </div>
      <div className="flex flex-col gap-4 max-lg:order-first lg:w-[400px] lg:shrink-0">
        <UserCard
          user={fiche}
          now={now}
          closeHref={href({})}
          suspendHref={`${ficheHref}&action=suspendre`}
          eraseHref={canErase ? actionHref("effacer") : undefined}
          actionHref={(name) => actionHref(name)}
          back={ficheHref}
          canAct={canAct}
        />
        <AuditHistory targetType="user" targetId={fiche.id} />
      </div>
    </div>
  ) : null;

  // « Supprimer définitivement » and « Anonymiser » open their own screen (Ephraïm, 29/10/2026).
  const deleting = fiche && (action === "effacer" ? canErase : action === "supprimer" && canAct);
  const backLink = (target: string, label: string) => (
    <Link
      href={target}
      className="inline-flex items-center gap-1.5 font-semibold text-sapin hover:underline"
    >
      <Icon name="chev-l" className="size-3.5" />
      {label}
    </Link>
  );

  if (fiche && deleting) {
    const owned = await db.membership.findMany({
      where: { userId: fiche.id, role: "org_owner", status: "active" },
      select: {
        organization: {
          select: {
            id: true,
            name: true,
            _count: { select: { jobs: true } },
            memberships: {
              where: { status: "active", userId: { not: fiche.id } },
              orderBy: { createdAt: "asc" },
              select: { role: true, user: { select: { name: true } } },
            },
          },
        },
      },
    });
    const erase = action === "effacer";
    return (
      <>
        <AdminPageHeader
          eyebrow={backLink(ficheHref, t("users.erase.back"))}
          title={t(erase ? "users.erase.title" : "users.erase.anonymizeTitle", {
            userName: displayName(t, fiche),
          })}
          subtitle={t(erase ? "users.erase.subtitle" : "users.action.delete.intro")}
        />
        {error && <Alert tone="error" title={t(`users.error.${error}`)} />}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <UserPanels
              user={fiche}
              action={action}
              params={params}
              ficheHref={ficheHref}
              actorId={admin.id}
              rights={rights}
              granted={granted}
            />
          </div>
          {erase && (
            <section
              aria-labelledby="utilisateurs-effacer-bilan"
              className="jm-admin-card flex flex-col gap-3 rounded-[24px] bg-blanc px-5 py-5 lg:w-[400px] lg:shrink-0 lg:px-[22px]"
            >
              <h2
                id="utilisateurs-effacer-bilan"
                className="text-[16px] leading-[22px] font-semibold"
              >
                {t("users.erase.whatHappens")}
              </h2>
              <ul className="flex flex-col gap-2 text-[12.5px] leading-[18px]">
                <li className="flex items-start gap-2.5">
                  <Icon name="fermer" className="mt-px size-4 shrink-0 text-corail-fonce" />
                  {t("users.erase.gone")}
                </li>
                <li className="flex items-start gap-2.5">
                  <Icon name="doc" className="mt-px size-4 shrink-0" />
                  {t("users.erase.kept")}
                </li>
                {overview && overview.payments.length > 0 && (
                  <li className="flex items-start gap-2.5">
                    <Icon name="mobile-money" className="mt-px size-4 shrink-0" />
                    {t("users.erase.payments", { count: overview.payments.length })}
                  </li>
                )}
              </ul>
              {owned.length > 0 && (
                <>
                  <h3 className="border-t border-brume pt-3 text-[13px] font-semibold">
                    {t("users.erase.companies")}
                  </h3>
                  <ul className="flex flex-col gap-2 text-[12.5px] leading-[18px]">
                    {owned.map(({ organization }) => {
                      const heir =
                        organization.memberships.find((row) => row.role === "org_admin") ??
                        organization.memberships[0];
                      return (
                        <li key={organization.id} className="flex items-start gap-2.5">
                          <Icon name="entreprise" className="mt-px size-4 shrink-0" />
                          <span>
                            <strong className="font-semibold">{organization.name}</strong>
                            {" · "}
                            {heir
                              ? t("users.erase.companyHeir", { name: heir.user.name })
                              : organization._count.jobs > 0
                                ? t("users.erase.companyClosed")
                                : t("users.erase.companyGone")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>
        <AuditNotice />
      </>
    );
  }

  if (fiche) {
    return (
      <>
        <AdminPageHeader
          eyebrow={backLink(href({}), t("users.overview.back"))}
          title={displayName(t, fiche)}
          subtitle={t("users.overview.subtitle")}
        />
        {params.ok && (
          <AdminDone
            title={done ? t(`users.done.${done}`) : t("users.updated")}
            journal={{ type: "user", id: fiche.id }}
          />
        )}
        {params.erreur === "soi" && <Alert tone="error" title={t("users.selfProtected")} />}
        {error && <Alert tone="error" title={t(`users.error.${error}`)} />}
        {ficheBlock}
      </>
    );
  }

  const where = await userListWhere(db, userFilters, now);

  const [count, users, countries, totals] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        talentProfile: { select: { id: true } },
        memberships: { where: { status: "active" }, select: { role: true } },
      },
    }),
    db.user.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      orderBy: { country: "asc" },
    }),
    Promise.all([
      db.user.count({ where: { status: { not: "deleted" } } }),
      db.user.count({
        where: { status: "active", emailVerified: true, deletionScheduledAt: null },
      }),
      db.user.count({
        where: { status: "active", emailVerified: false, deletionScheduledAt: null },
      }),
      db.user.count({ where: { status: "suspended" } }),
    ]),
  ]);
  const [totalUsers, activeUsers, unverifiedUsers, suspendedUsers] = totals;
  const [userPlans, lastSessions] = await Promise.all([
    Promise.all(users.map((user) => resolvePlan(db, { type: "user", id: user.id }))),
    db.session.groupBy({
      by: ["userId"],
      where: { userId: { in: users.map((user) => user.id) } },
      _max: { updatedAt: true },
    }),
  ]);
  const lastActive = new Map(lastSessions.map((row) => [row.userId, row._max.updatedAt]));
  const regions = new Intl.DisplayNames(["fr-FR"], { type: "region" });

  // Roles in words (« Talent », « Recruteur », « Administrateur »), the platform role first.
  const roleList = (user: (typeof users)[number]) =>
    user.status === "deleted"
      ? []
      : [
          ...(user.platformRole === "user" ? [] : [t(`platformRole.${user.platformRole}`)]),
          ...(user.talentProfile ? [t("memberRole.talent")] : []),
          ...[...new Set(user.memberships.map((membership) => membership.role))].map((value) =>
            t(`memberRole.${value}`),
          ),
        ];

  return (
    <>
      <AdminPageHeader
        title={t("users.title")}
        eyebrow={
          <>
            <span className="lg:hidden">{t("users.count", { count })}</span>
            <span className="max-lg:hidden">{t("nav.title")}</span>
          </>
        }
      />
      <AdminStats
        items={[
          {
            label: t("users.stats.total"),
            value: totalUsers,
            icon: "profil",
            href: PAGE,
          },
          {
            label: t("users.status.active"),
            value: activeUsers,
            icon: "valider",
            tone: "success",
            href: `${PAGE}?statut=active`,
          },
          {
            label: t("users.status.unverified"),
            value: unverifiedUsers,
            icon: "alerte",
            tone: unverifiedUsers > 0 ? "attention" : "neutral",
            href: `${PAGE}?statut=unverified`,
          },
          {
            label: t("users.status.suspended"),
            value: suspendedUsers,
            icon: "lock",
            href: `${PAGE}?statut=suspended`,
          },
        ]}
      />
      {params.ok && <AdminDone title={done ? t(`users.done.${done}`) : t("users.updated")} />}
      {params.erreur === "soi" && <Alert tone="error" title={t("users.selfProtected")} />}
      {error && <Alert tone="error" title={t(`users.error.${error}`)} />}

      <AdminFilterBar
        action={PAGE}
        searchLabel={t("users.search.placeholder")}
        q={q}
        hidden={{ forfait: planCode, role, statut: state, pays: country }}
        aside={
          <span className="hidden text-[11px] leading-[15px] text-ardoise lg:inline">
            {t("users.count", { count })}
          </span>
        }
      >
        <FilterMenu
          label={t("users.filter.plan")}
          group="utilisateurs-plan"
          options={[
            {
              href: href({ forfait: undefined }),
              label: t("users.filter.all"),
              current: !chosenPlan,
            },
            ...plans.map((plan) => ({
              href: href({ forfait: plan.code }),
              label: plan.name,
              current: plan.code === chosenPlan?.code,
            })),
          ]}
        />
        <FilterMenu
          label={t("users.filter.role")}
          group="utilisateurs-role"
          options={[
            { href: href({ role: undefined }), label: t("users.filter.all"), current: !role },
            ...roles.map((value) => ({
              href: href({ role: value }),
              label: value === "user" ? t("users.role.user") : t(`role.${value}`),
              current: value === role,
            })),
          ]}
        />
        <FilterMenu
          label={t("users.filter.status")}
          group="utilisateurs-statut"
          options={[
            { href: href({ statut: undefined }), label: t("users.filter.all"), current: !state },
            ...statuses.map((value) => ({
              href: href({ statut: value }),
              label: t(`users.status.${value}`),
              current: value === state,
            })),
          ]}
        />
        <FilterMenu
          label={t("users.filter.country")}
          group="utilisateurs-pays"
          options={[
            { href: href({ pays: undefined }), label: t("users.filter.all"), current: !country },
            ...countries.flatMap((row) =>
              row.country
                ? [
                    {
                      href: href({ pays: row.country }),
                      label: regions.of(row.country) ?? row.country,
                      current: row.country === country,
                    },
                  ]
                : [],
            ),
          ]}
        />
      </AdminFilterBar>

      {users.length === 0 ? (
        <AdminEmpty
          title={t("users.empty")}
          action={
            <ButtonLink href={PAGE} variant="secondary" size="sm">
              {t("journal.filter.clear")}
            </ButtonLink>
          }
        />
      ) : (
        <>
          {writable && (
            <form
              id="utilisateurs-export"
              method="get"
              action="/admin/utilisateurs.csv"
              className="flex flex-col gap-2 rounded-[18px] bg-blanc/70 px-4 py-3 sm:flex-row sm:items-center"
            >
              {Object.entries({
                q,
                forfait: planCode,
                role,
                statut: state,
                pays: country,
              }).map(([key, value]) =>
                value ? <input key={key} type="hidden" name={key} value={value} /> : null,
              )}
              <p className="flex flex-1 items-start gap-2 text-[11.5px] leading-4 text-ardoise">
                <Icon name="info" className="size-3.5 shrink-0" />
                {t("users.export.hint")}
              </p>
              <Button type="submit" variant="secondary" size="sm">
                <Icon name="telecharger" className="size-4" />
                {t("users.export.selection")}
              </Button>
            </form>
          )}
          {/* Desktop: dense table. */}
          <div
            role="region"
            aria-label={t("users.list")}
            tabIndex={0}
            className="jm-admin-card hidden overflow-x-auto rounded-[24px] bg-blanc py-1.5 lg:block"
          >
            <table className="w-full min-w-[1000px] border-collapse text-left text-[13px]">
              <caption className="sr-only">{t("users.list")}</caption>
              <thead>
                <tr className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                  {writable && (
                    <th scope="col" className="w-10 py-2.5 pl-[18px]">
                      <span className="sr-only">{t("users.export.selection")}</span>
                    </th>
                  )}
                  <th
                    scope="col"
                    className={cx("py-2.5 font-semibold", writable ? "px-1.5" : "px-[18px]")}
                  >
                    {t("users.col.name")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.email")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.verification")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.plan")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.roles")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.created")}
                  </th>
                  <th scope="col" className="w-[110px] px-1.5 py-2.5 font-semibold">
                    {t("users.col.lastActive")}
                  </th>
                  <th scope="col" className="px-[18px] py-2.5 pl-1.5 font-semibold">
                    {t("users.col.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const plan = userPlans[index];
                  const seen = lastActive.get(user.id);
                  const stateOf = userState(user);
                  return (
                    <tr key={user.id} className="border-t border-brume">
                      {writable && (
                        <td className="py-3.5 pl-[18px]">
                          {user.status !== "deleted" && (
                            <input
                              type="checkbox"
                              name="id"
                              value={user.id}
                              form="utilisateurs-export"
                              aria-label={t("users.export.select", { name: user.name })}
                              className="size-4 accent-sapin"
                            />
                          )}
                        </td>
                      )}
                      <td className={cx("py-3.5 pr-1.5", writable ? "pl-1.5" : "pl-[18px]")}>
                        <Link
                          href={href({ fiche: user.id })}
                          className="flex items-center gap-2.5 font-semibold hover:underline"
                        >
                          <Initials name={displayName(t, user)} size={30} />
                          <span className="min-w-0 whitespace-nowrap">{displayName(t, user)}</span>
                        </Link>
                      </td>
                      <td className="max-w-[210px] px-1.5 py-3.5">
                        <span className="block truncate text-[12px] text-ardoise">
                          {user.status === "deleted" ? "" : user.email}
                        </span>
                      </td>
                      <td className="px-1.5 py-3.5">
                        {user.status !== "deleted" && (
                          <span className="flex items-center gap-1.5">
                            {user.emailVerified ? (
                              <Icon
                                name="valider"
                                label={t("users.verification.email")}
                                className="size-4 text-up-texte"
                              />
                            ) : (
                              <Icon
                                name="alerte"
                                label={t("users.verification.emailMissing")}
                                className="size-4 text-ambre-texte"
                              />
                            )}
                            {user.twoFactorEnabled && (
                              <span
                                title={t("users.verification.twoFactor")}
                                className="rounded-[6px] bg-brume px-1.5 py-px text-[10.5px] font-semibold"
                              >
                                {t("users.verification.twoFactorShort")}
                                <span className="sr-only">
                                  {" "}
                                  {t("users.verification.twoFactor")}
                                </span>
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-3.5">
                        {plan && <Tag tone={planTone(plan)}>{plan.planName}</Tag>}
                      </td>
                      <td className="max-w-[220px] px-1.5 py-3.5">
                        <span className="flex flex-wrap gap-1">
                          {roleList(user).map((label) => (
                            <span
                              key={label}
                              className="rounded-[8px] bg-creme px-2 py-0.5 text-[11px] leading-4 font-medium"
                            >
                              {label}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="px-1.5 py-3.5 whitespace-nowrap">
                        {formatShortDate(user.createdAt)}
                      </td>
                      <td className="px-1.5 py-3.5 whitespace-nowrap">
                        {seen ? ago(seen, now) : t("users.neverActive")}
                      </td>
                      <td className="py-3.5 pr-[18px] pl-1.5">
                        <Tag tone={statusTone[stateOf]}>{t(`users.status.${stateOf}`)}</Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phones: compact list of cards. */}
          <ul
            aria-label={t("users.list")}
            className="jm-admin-card rounded-[24px] bg-blanc px-3.5 py-1.5 lg:hidden"
          >
            {users.map((user, index) => {
              const plan = userPlans[index];
              const seen = lastActive.get(user.id);
              const stateOf = userState(user);
              return (
                <li key={user.id} className="border-brume not-first:border-t">
                  <Link href={href({ fiche: user.id })} className="flex items-center gap-3 py-3">
                    <Initials name={displayName(t, user)} size={38} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13.5px] leading-[18px] font-semibold">
                        {displayName(t, user)}
                      </span>
                      <span className="truncate text-[11.5px] leading-4 text-ardoise">
                        {[plan?.planName, seen ? ago(seen, now) : t("users.neverActive")]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <Tag tone={statusTone[stateOf]}>{t(`users.status.${stateOf}`)}</Tag>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <AdminPager
        page={page}
        total={count}
        pageSize={PAGE_SIZE}
        href={(number) => href({ page: number > 1 ? String(number) : undefined, fiche: undefined })}
      />
      {!fiche && <AuditNotice />}
    </>
  );
}
