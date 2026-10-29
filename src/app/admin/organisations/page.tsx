import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuditHistory } from "@/components/admin/audit";
import { Icon } from "@/components/brand/icon";
import {
  AdminDone,
  AdminFilterBar,
  AdminPageHeader,
  AdminTabs,
  AuditNotice,
  FilterMenu,
  OrgMark,
  ReasonField,
  SectionRule,
  SensitivePanel,
  Tag,
} from "@/components/admin/kit";
import { OrgCard, orgStatusTone } from "@/components/admin/organisations-fiche";
import { planTone } from "@/components/admin/utilisateurs-fiche";
import { Alert, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { decideVerificationAction } from "@/server/actions/admin";
import {
  deleteOrganizationAction,
  grantOrgPlanAction,
  reactivateOrganizationAction,
  suspendOrganizationAction,
} from "@/server/actions/admin-orgs";
import {
  DELETE_ORG_WORD,
  grantableOrgPlans,
  organizationDeletionPreview,
  organizationDetail,
} from "@/server/services/admin-orgs";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { GRACE_DAYS, resolvePlan } from "@/server/entitlements";
import type { Prisma } from "@/generated/prisma/client";

const PAGE = "/admin/organisations";
const tabs = {
  toutes: null,
  "en-attente": "pending",
  complement: "info_requested",
  verifiees: "verified",
  refusees: "rejected",
  "non-verifiees": "none",
  partenaires: "partner",
} as const;
type TabParam = keyof typeof tabs;
const types = ["company", "recruiter", "partner"] as const;
const liveStatuses = ["sponsored", "active", "trialing", "past_due", "canceled"] as const;

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

/**
 * Organizations (mockup 07-03): tabs with the pending count, table, verification card on the
 * right (`?fiche=<id>`) and the badge withdrawal as a sensitive panel (`&action=retirer`).
 */
export default async function AdminOrganizations({
  searchParams,
}: PageProps<"/admin/organisations">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const writable = canWriteAdmin(admin);
  const now = new Date();

  const tab: TabParam = one(params.onglet) in tabs ? (one(params.onglet) as TabParam) : "toutes";
  const q = one(params.q).trim().slice(0, 120);
  const type = types.find((value) => value === params.type);
  const planCode = one(params.forfait).slice(0, 60);
  const country = one(params.pays).slice(0, 80);
  const ficheId = one(params.fiche).slice(0, 60);
  const action = one(params.action);

  const filters = {
    onglet: tab === "toutes" ? undefined : tab,
    q,
    type,
    forfait: planCode,
    pays: country,
  };
  const href = (changes: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes }))
      if (value) query.set(key, value);
    const text = query.toString();
    return text ? `${PAGE}?${text}` : PAGE;
  };

  const plans = await db.plan.findMany({
    where: { family: { in: ["rh", "company", "partner"] }, active: true },
    orderBy: [{ family: "asc" }, { sortOrder: "asc" }],
    select: { code: true, name: true, priceCents: true },
  });
  const chosenPlan = plans.find((plan) => plan.code === planCode);

  const and: Prisma.OrganizationWhereInput[] = [];
  const scope = tabs[tab];
  if (scope === "partner") and.push({ type: "partner" });
  else if (scope) and.push({ type: { in: ["recruiter", "company"] }, verificationStatus: scope });
  if (q) and.push({ name: { contains: q, mode: "insensitive" } });
  if (type) and.push({ type });
  if (country) and.push({ country });
  if (chosenPlan) {
    const live = await db.subscription.findMany({
      where: {
        subjectType: "organization",
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
  const where: Prisma.OrganizationWhereInput = and.length ? { AND: and } : {};

  const [organizations, pending, countries] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: [{ verificationRequestedAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
      take: 100,
      include: {
        _count: {
          select: {
            memberships: { where: { status: "active" } },
            jobs: { where: { status: "published" } },
          },
        },
      },
    }),
    db.organization.count({
      where: { verificationStatus: "pending", type: { in: ["recruiter", "company"] } },
    }),
    db.organization.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      orderBy: { country: "asc" },
    }),
  ]);
  const orgPlans = await Promise.all(
    organizations.map((organization) =>
      resolvePlan(db, { type: "organization", id: organization.id }, now),
    ),
  );

  const fiche = ficheId
    ? await db.organization.findUnique({
        where: { id: ficheId },
        include: {
          memberships: {
            where: { role: "org_owner", status: "active" },
            select: { user: { select: { name: true, email: true } } },
          },
        },
      })
    : null;
  const ficheHref = fiche ? href({ fiche: fiche.id }) : href({});
  const canAct = writable && fiche !== null;
  const verifiable = canAct && fiche.type !== "partner";
  const revoking = verifiable && action === "retirer" && fiche.verificationStatus === "verified";
  const suspending = canAct && action === "suspendre" && !fiche.suspendedAt;
  const reactivating = canAct && action === "reactiver" && !!fiche.suspendedAt;
  const granting = verifiable && action === "offrir";
  const grantPlans = granting ? await grantableOrgPlans(db) : [];
  const isoDay = (date: Date) => date.toISOString().slice(0, 10);
  const actionHref = (name: string) => `${ficheHref}&action=${name}#organisations-panneau`;
  const [detail, fichePlan] = fiche
    ? await Promise.all([
        organizationDetail(db, fiche.id, now),
        resolvePlan(db, { type: "organization", id: fiche.id }, now),
      ])
    : [null, null];
  const doneKey = (["infoRequested", "suspended", "reactivated", "planGranted"] as const).find(
    (value) => value === params.ok,
  );
  const errorKey = (["status", "reason", "notFound", "plan", "until"] as const).find(
    (value) => value === params.erreur,
  );
  const okOrg = one(params.org);

  const tabLabel = (id: TabParam) =>
    ({
      toutes: t("orgs.tab.all"),
      "en-attente": t("orgs.tab.pending", { count: pending }),
      complement: t("orgs.tab.info"),
      verifiees: t("orgs.tab.verified"),
      refusees: t("orgs.tab.rejected"),
      "non-verifiees": t("orgs.tab.none"),
      partenaires: t("orgs.tab.partners"),
    })[id];

  // « Supprimer l'entreprise » opens its own screen (Ephraïm, 29/10/2026): the justification,
  // what goes with it, and the accounts of its members that stay.
  if (fiche && canAct && fiche.type !== "partner" && action === "supprimer") {
    const preview = await organizationDeletionPreview(db, fiche.id);
    return (
      <>
        <AdminPageHeader
          eyebrow={
            <Link
              href={ficheHref}
              className="inline-flex items-center gap-1.5 font-semibold text-sapin hover:underline"
            >
              <Icon name="chev-l" className="size-3.5" />
              {t("orgs.delete.back")}
            </Link>
          }
          title={t("orgs.delete.title", { org: fiche.name })}
          subtitle={t("orgs.delete.subtitle")}
        />
        {errorKey && (
          <Alert
            tone="error"
            title={t(errorKey === "reason" ? "orgs.delete.error" : "orgs.error.status")}
          />
        )}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <SensitivePanel
              title={t("orgs.delete.text")}
              text={t("orgs.delete.confirm", { org: fiche.name })}
              closeHref={ficheHref}
            >
              <form action={deleteOrganizationAction} className="flex flex-col gap-3.5">
                <input type="hidden" name="organizationId" value={fiche.id} />
                <input type="hidden" name="back" value={`${ficheHref}&action=supprimer`} />
                <ReasonField
                  id="organisations-delete-reason"
                  label={t("orgs.delete.justification")}
                  rows={4}
                  maxLength={1000}
                />
                <TextField
                  id="organisations-delete-word"
                  name="confirmWord"
                  required
                  autoComplete="off"
                  placeholder={DELETE_ORG_WORD}
                  label={t("orgs.delete.typeWord")}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                    {tc("cancel")}
                  </ButtonLink>
                  <Button type="submit" variant="danger">
                    {t("orgs.delete.submit")}
                  </Button>
                </div>
              </form>
            </SensitivePanel>
          </div>
          <section
            aria-labelledby="organisations-supprimer-bilan"
            className="jm-admin-card flex flex-col gap-3 rounded-[24px] bg-blanc px-5 py-5 lg:w-[400px] lg:shrink-0 lg:px-[22px]"
          >
            <h2
              id="organisations-supprimer-bilan"
              className="text-[16px] leading-[22px] font-semibold"
            >
              {t("orgs.delete.whatHappens")}
            </h2>
            <ul className="flex flex-col gap-2 text-[12.5px] leading-[18px]">
              <li className="flex items-start gap-2.5">
                <Icon name="fermer" className="mt-px size-4 shrink-0 text-corail-fonce" />
                {t("orgs.delete.gone", { jobs: preview.jobs, applications: preview.applications })}
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="profil" className="mt-px size-4 shrink-0" />
                {t("orgs.delete.accountsKept")}
              </li>
              {preview.entities > 0 && (
                <li className="flex items-start gap-2.5">
                  <Icon name="entreprise" className="mt-px size-4 shrink-0" />
                  {t("orgs.delete.entities", { count: preview.entities })}
                </li>
              )}
              {preview.payments > 0 && (
                <li className="flex items-start gap-2.5">
                  <Icon name="mobile-money" className="mt-px size-4 shrink-0" />
                  {t("orgs.delete.payments", { count: preview.payments })}
                </li>
              )}
            </ul>
            {preview.members.length > 0 && (
              <>
                <h3 className="border-t border-brume pt-3 text-[13px] font-semibold">
                  {t("orgs.delete.members")}
                </h3>
                <ul className="flex flex-col gap-1.5 text-[12.5px] leading-[18px]">
                  {preview.members.map((member) => (
                    <li key={member.user.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">{member.user.name}</span>
                      <span className="shrink-0 text-ardoise">
                        {t(`memberRole.${member.role}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
        <AuditNotice />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader title={t("orgs.title")} />
      {params.ok === "deleted" && <AdminDone title={t("orgs.delete.done", { org: okOrg })} />}
      {params.ok === "verifiee" && (
        <AdminDone
          title={t("orgs.verify.approved", { org: okOrg })}
          journal={fiche ? { type: "organization", id: fiche.id } : undefined}
        />
      )}
      {params.ok === "refusee" && (
        <AdminDone
          title={t("orgs.verify.rejected")}
          journal={fiche ? { type: "organization", id: fiche.id } : undefined}
        />
      )}
      {params.erreur === "motif" && <Alert tone="error" title={t("orgs.verify.reasonRequired")} />}
      {doneKey && (
        <AdminDone
          title={t(`orgs.done.${doneKey}`)}
          journal={fiche ? { type: "organization", id: fiche.id } : undefined}
        />
      )}
      {errorKey && (
        <Alert
          tone="error"
          title={t(
            errorKey === "reason"
              ? "orgs.error.reason"
              : errorKey === "plan" || errorKey === "until"
                ? "orgs.error.plan"
                : "orgs.error.status",
          )}
        />
      )}

      <div className="max-lg:hidden">
        <AdminFilterBar
          action={PAGE}
          searchLabel={t("orgs.search")}
          q={q}
          hidden={{ onglet: filters.onglet, type, forfait: planCode, pays: country }}
          aside={
            <span className="text-[11px] leading-[15px] text-ardoise">
              {t("orgs.count", { count: organizations.length })}
            </span>
          }
        >
          <FilterMenu
            label={t("orgs.col.type")}
            group="organisations-type"
            options={[
              { href: href({ type: undefined }), label: t("orgs.filter.all"), current: !type },
              ...types.map((value) => ({
                href: href({ type: value }),
                label: t(`orgs.type.${value}`),
                current: value === type,
              })),
            ]}
          />
          <FilterMenu
            label={t("orgs.col.plan")}
            group="organisations-plan"
            options={[
              {
                href: href({ forfait: undefined }),
                label: t("orgs.filter.all"),
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
            label={t("orgs.filter.country")}
            group="organisations-pays"
            options={[
              { href: href({ pays: undefined }), label: t("orgs.filter.all"), current: !country },
              ...countries.flatMap((row) =>
                row.country
                  ? [
                      {
                        href: href({ pays: row.country }),
                        label: row.country,
                        current: row.country === country,
                      },
                    ]
                  : [],
              ),
            ]}
          />
        </AdminFilterBar>
      </div>

      <AdminTabs
        label={t("orgs.title")}
        items={(Object.keys(tabs) as TabParam[]).map((id) => ({
          href: href({ onglet: id === "toutes" ? undefined : id, fiche: undefined }),
          label: tabLabel(id),
          current: id === tab,
        }))}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4 max-lg:contents">
          {organizations.length === 0 ? (
            <p className="jm-admin-card rounded-[24px] bg-blanc px-5 py-8 text-center text-[13.5px] text-ardoise">
              {t("orgs.empty")}
            </p>
          ) : (
            <>
              <div
                role="region"
                aria-label={t("orgs.list")}
                tabIndex={0}
                className="jm-admin-card hidden overflow-x-auto rounded-[24px] bg-blanc py-1.5 lg:block"
              >
                <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
                  <caption className="sr-only">{t("orgs.list")}</caption>
                  <thead>
                    <tr className="text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                      <th scope="col" className="px-[18px] py-2.5 font-semibold">
                        {t("orgs.col.name")}
                      </th>
                      <th scope="col" className="px-1.5 py-2.5 font-semibold">
                        {t("orgs.col.type")}
                      </th>
                      <th scope="col" className="px-1.5 py-2.5 font-semibold">
                        {t("orgs.col.plan")}
                      </th>
                      <th scope="col" className="px-1.5 py-2.5 font-semibold">
                        {t("orgs.col.seats")}
                      </th>
                      <th scope="col" className="w-[80px] px-1.5 py-2.5 font-semibold">
                        {t("orgs.col.activeJobs")}
                      </th>
                      <th scope="col" className="py-2.5 pr-[18px] pl-1.5 font-semibold">
                        {t("orgs.col.verification")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((organization, index) => {
                      const plan = orgPlans[index];
                      const current = organization.id === fiche?.id;
                      return (
                        <tr
                          key={organization.id}
                          id={`org-${organization.id}`}
                          className={cx("border-t border-brume", current && "bg-creme/50")}
                        >
                          <td className="py-3.5 pr-1.5 pl-[18px]">
                            <Link
                              href={href({ fiche: organization.id })}
                              scroll={false}
                              aria-current={current ? "true" : undefined}
                              className={cx(
                                "flex items-center gap-2.5 leading-[19px] font-semibold hover:underline",
                                current && "underline",
                              )}
                            >
                              <OrgMark name={organization.name} size={30} />
                              <span className="min-w-0">{organization.name}</span>
                            </Link>
                          </td>
                          <td className="px-1.5 py-3.5 whitespace-nowrap">
                            {t(`orgs.type.${organization.type}`)}
                          </td>
                          <td className="px-1.5 py-3.5">
                            {plan && <Tag tone={planTone(plan)}>{plan.planName}</Tag>}
                          </td>
                          <td className="px-1.5 py-3.5">{organization._count.memberships}</td>
                          <td className="px-1.5 py-3.5">{organization._count.jobs}</td>
                          <td className="py-3.5 pr-[18px] pl-1.5">
                            <span className="flex flex-wrap gap-1">
                              {organization.type !== "partner" && (
                                <Tag tone={orgStatusTone[organization.verificationStatus]}>
                                  {t(`orgs.status.${organization.verificationStatus}`)}
                                </Tag>
                              )}
                              {organization.suspendedAt && (
                                <Tag tone="error">{t("orgs.suspendedTag")}</Tag>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul
                aria-label={t("orgs.list")}
                className="jm-admin-card rounded-[24px] bg-blanc px-3.5 py-1.5 lg:hidden"
              >
                {organizations.map((organization, index) => (
                  <li key={organization.id} className="border-brume not-first:border-t">
                    <Link
                      href={`${href({ fiche: organization.id })}#organisations-fiche`}
                      aria-current={organization.id === fiche?.id ? "true" : undefined}
                      className="flex items-center gap-3 py-3"
                    >
                      <OrgMark name={organization.name} size={38} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13.5px] leading-[18px] font-semibold">
                          {organization.name}
                        </span>
                        <span className="truncate text-[11.5px] leading-4 text-ardoise">
                          {[
                            orgPlans[index]?.planName,
                            t("orgs.members", { count: organization._count.memberships }),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {organization.suspendedAt ? (
                        <Tag tone="error">{t("orgs.suspendedTag")}</Tag>
                      ) : (
                        organization.type !== "partner" && (
                          <Tag tone={orgStatusTone[organization.verificationStatus]}>
                            {t(`orgs.status.${organization.verificationStatus}`)}
                          </Tag>
                        )
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {suspending && (
            <div
              id="organisations-panneau"
              className="flex scroll-mt-6 flex-col gap-2 max-lg:order-2"
            >
              <SectionRule>{t("sensitive.label")}</SectionRule>
              <SensitivePanel
                title={t("orgs.suspend.text")}
                text={t("orgs.suspend.confirm", { org: fiche.name })}
                closeHref={ficheHref}
              >
                <form action={suspendOrganizationAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="organizationId" value={fiche.id} />
                  <input type="hidden" name="back" value={`${ficheHref}&action=suspendre`} />
                  <ReasonField id="organisations-suspend-reason" label={t("orgs.suspend.reason")} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                      {tc("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="danger">
                      {t("orgs.suspend.text")}
                    </Button>
                  </div>
                </form>
              </SensitivePanel>
            </div>
          )}
          {reactivating && (
            <div
              id="organisations-panneau"
              className="flex scroll-mt-6 flex-col gap-2 max-lg:order-2"
            >
              <SectionRule>{t("sensitive.label")}</SectionRule>
              <SensitivePanel
                title={t("orgs.reactivate.text")}
                text={t("orgs.reactivate.confirm", { org: fiche.name })}
                closeHref={ficheHref}
                icon="valider"
                tone="neutral"
              >
                <form action={reactivateOrganizationAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="organizationId" value={fiche.id} />
                  <input type="hidden" name="back" value={`${ficheHref}&action=reactiver`} />
                  <TextArea
                    id="organisations-reactivate-note"
                    name="reason"
                    rows={2}
                    maxLength={1000}
                    label={t("orgs.reactivate.note")}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                      {tc("cancel")}
                    </ButtonLink>
                    <Button type="submit">{t("orgs.reactivate.text")}</Button>
                  </div>
                </form>
              </SensitivePanel>
            </div>
          )}
          {granting && (
            <div
              id="organisations-panneau"
              className="flex scroll-mt-6 flex-col gap-2 max-lg:order-2"
            >
              <SectionRule>{t("sensitive.label")}</SectionRule>
              <SensitivePanel
                title={t("orgs.grant.text")}
                text={t("orgs.grant.confirm", { org: fiche.name })}
                closeHref={ficheHref}
                icon="portefeuille"
                tone="neutral"
              >
                <form action={grantOrgPlanAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="organizationId" value={fiche.id} />
                  <input type="hidden" name="back" value={`${ficheHref}&action=offrir`} />
                  <Select
                    id="organisations-grant-plan"
                    name="planCode"
                    required
                    label={t("orgs.grant.plan")}
                    options={grantPlans.map((option) => ({
                      value: option.code,
                      label: option.name,
                    }))}
                  />
                  <TextField
                    id="organisations-grant-until"
                    name="until"
                    type="date"
                    required
                    label={t("orgs.grant.until")}
                    min={isoDay(new Date(now.getTime() + 86_400_000))}
                    max={isoDay(new Date(now.getTime() + 730 * 86_400_000))}
                    defaultValue={isoDay(new Date(now.getTime() + 30 * 86_400_000))}
                  />
                  <ReasonField id="organisations-grant-reason" maxLength={500} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                      {tc("cancel")}
                    </ButtonLink>
                    <Button type="submit">{t("orgs.grant.submit")}</Button>
                  </div>
                </form>
              </SensitivePanel>
            </div>
          )}
          {revoking && (
            <div
              id="organisations-panneau"
              className="flex scroll-mt-6 flex-col gap-2 max-lg:order-2"
            >
              <SectionRule>{t("sensitive.label")}</SectionRule>
              <SensitivePanel
                title={t("orgs.revoke.text")}
                text={t("orgs.revoke.confirm", { org: fiche.name })}
                closeHref={ficheHref}
              >
                <form action={decideVerificationAction} className="flex flex-col gap-3.5">
                  <input type="hidden" name="organization" value={fiche.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <ReasonField
                    id="organisations-revoke-reason"
                    label={t("orgs.verify.reject.reason")}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={ficheHref} scroll={false} variant="tertiary">
                      {tc("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="danger">
                      {t("orgs.revoke.text")}
                    </Button>
                  </div>
                </form>
              </SensitivePanel>
            </div>
          )}
          <AuditNotice className="max-lg:order-2" />
        </div>
        {fiche && (
          <div className="flex flex-col gap-4 max-lg:order-1 lg:w-[400px] lg:shrink-0">
            <OrgCard
              organization={fiche}
              detail={detail!}
              plan={fichePlan}
              closeHref={href({ fiche: undefined })}
              actionHref={actionHref}
              back={ficheHref}
              canAct={canAct}
            />
            <AuditHistory targetType="organization" targetId={fiche.id} />
          </div>
        )}
      </div>
    </>
  );
}
