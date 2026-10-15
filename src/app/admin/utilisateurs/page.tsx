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
  planTone,
  statuses,
  statusTone,
  UserCard,
  userState,
} from "@/components/admin/utilisateurs-fiche";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { formatShortDate } from "@/lib/dates";
import { cx } from "@/lib/cx";
import { setUserRole, setUserStatus } from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { GRACE_DAYS, resolvePlan } from "@/server/entitlements";
import type { Prisma } from "@/generated/prisma/client";

const PAGE = "/admin/utilisateurs";
const PAGE_SIZE = 50;
const roles = ["user", "content_editor", "support_agent", "platform_admin"] as const;
const liveStatuses = ["sponsored", "active", "trialing", "past_due", "canceled"] as const;
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

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

  const q = one(params.q).trim().slice(0, 120);
  const planCode = one(params.forfait).slice(0, 60);
  const role = roles.find((value) => value === params.role);
  const state = statuses.find((value) => value === params.statut);
  const country = one(params.pays).slice(0, 2).toUpperCase();
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

  const and: Prisma.UserWhereInput[] = [];
  if (q)
    and.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { id: q },
      ],
    });
  if (role) and.push({ platformRole: role });
  if (country) and.push({ country });
  if (state === "suspended") and.push({ status: "suspended" });
  if (state === "deletionScheduled")
    and.push({ status: { not: "suspended" }, deletionScheduledAt: { not: null } });
  if (state === "active" || state === "unverified")
    and.push({
      status: "active",
      deletionScheduledAt: null,
      emailVerified: state === "active",
    });
  if (chosenPlan) {
    // Same window as the entitlement engine: live subscriptions, grace period included.
    const live = await db.subscription.findMany({
      where: {
        subjectType: "user",
        status: { in: [...liveStatuses] },
        currentPeriodStart: { lte: now },
        currentPeriodEnd: { gt: new Date(now.getTime() - GRACE_DAYS * 86_400_000) },
        ...(chosenPlan.priceCents === 0 ? {} : { plan: { code: chosenPlan.code } }),
      },
      select: { subjectId: true },
    });
    const ids = live.map((row) => row.subjectId);
    and.push(chosenPlan.priceCents === 0 ? { id: { notIn: ids } } : { id: { in: ids } });
  }
  const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};

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
      db.user.count(),
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

  const fiche = ficheId ? await db.user.findUnique({ where: { id: ficheId } }) : null;
  const ficheHref = fiche ? href({ fiche: fiche.id }) : href({});
  const canAct = writable && fiche !== null && fiche.id !== admin.id;
  const suspending = canAct && action === "suspendre" && fiche.status !== "suspended";

  // Roles in words (« Talent », « Recruteur », « Administrateur »), the platform role first.
  const roleList = (user: (typeof users)[number]) => [
    ...(user.platformRole === "user" ? [] : [t(`platformRole.${user.platformRole}`)]),
    ...(user.talentProfile ? [t("memberRole.talent")] : []),
    ...[...new Set(user.memberships.map((membership) => membership.role))].map((value) =>
      t(`memberRole.${value}`),
    ),
  ];

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
        {canAct && (
          <div className="flex flex-col gap-2">
            <SectionRule>{t("users.col.roles")}</SectionRule>
            <section
              id="utilisateurs-roles"
              aria-labelledby="utilisateurs-roles-title"
              className="flex scroll-mt-6 flex-col gap-3 rounded-[24px] bg-blanc px-5 py-5 lg:px-[22px]"
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
                      <span>{value === "user" ? t("users.role.user") : t(`role.${value}`)}</span>
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
          back={ficheHref}
          canAct={canAct}
        />
        <AuditHistory targetType="user" targetId={fiche.id} />
      </div>
    </div>
  ) : null;

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
      {params.ok && (
        <AdminDone
          title={t("users.updated")}
          journal={fiche ? { type: "user", id: fiche.id } : undefined}
        />
      )}
      {params.erreur === "soi" && <Alert tone="error" title={t("users.selfProtected")} />}
      {params.erreur === "motif" && <Alert tone="error" title={t("reason.required")} />}

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

      {fiche && ficheBlock}

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
          {/* Desktop: dense table. */}
          <div
            role="region"
            aria-label={t("users.list")}
            tabIndex={0}
            className="hidden overflow-x-auto rounded-[24px] bg-blanc py-1.5 lg:block"
          >
            <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
              <caption className="sr-only">{t("users.list")}</caption>
              <thead>
                <tr className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                  <th scope="col" className="px-[18px] py-2.5 font-semibold">
                    {t("users.col.name")}
                  </th>
                  <th scope="col" className="px-1.5 py-2.5 font-semibold">
                    {t("users.col.email")}
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
                  const current = user.id === fiche?.id;
                  const seen = lastActive.get(user.id);
                  const stateOf = userState(user);
                  return (
                    <tr
                      key={user.id}
                      className={cx("border-t border-brume", current && "bg-creme/50")}
                    >
                      <td className="py-3.5 pr-1.5 pl-[18px]">
                        <Link
                          href={`${href({ fiche: user.id })}#utilisateurs-fiche`}
                          aria-current={current ? "true" : undefined}
                          className={cx(
                            "flex items-center gap-2.5 font-semibold hover:underline",
                            current && "underline",
                          )}
                        >
                          <Initials name={user.name} size={30} />
                          <span className="min-w-0">{user.name}</span>
                        </Link>
                      </td>
                      <td className="max-w-[230px] px-1.5 py-3.5">
                        <span className="block truncate text-[12px] text-ardoise">
                          {user.email}
                        </span>
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
            className="rounded-[24px] bg-blanc px-3.5 py-1.5 lg:hidden"
          >
            {users.map((user, index) => {
              const plan = userPlans[index];
              const seen = lastActive.get(user.id);
              const stateOf = userState(user);
              return (
                <li key={user.id} className="border-brume not-first:border-t">
                  <Link
                    href={`${href({ fiche: user.id })}#utilisateurs-fiche`}
                    aria-current={user.id === fiche?.id ? "true" : undefined}
                    className="flex items-center gap-3 py-3"
                  >
                    <Initials name={user.name} size={38} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13.5px] leading-[18px] font-semibold">
                        {user.name}
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
