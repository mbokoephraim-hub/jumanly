import type { Metadata } from "next";
import Link from "next/link";
import { ModerationChanges } from "@/components/hire/moderation-changes";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand";
import { AppPageHeader } from "@/components/app/page-header";
import { CopyButton } from "@/components/career/copy-button";
import { pillClass } from "@/components/career/kit";
import {
  jobStatusTone,
  MenuChip,
  menuItem,
  moreButton,
  OrgMark,
  statusKey,
} from "@/components/hire/kit";
import { chip, chipOff, chipOn, tag, tagTone } from "@/components/jobs/talent-kit";
import { TabRail } from "@/components/motion/tab-rail";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { EmptyState, segmentedItem, segmentedList } from "@/components/ui";
import type { JobStatus } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import {
  closeJobAction,
  deleteDraftAction,
  duplicateJobAction,
  reopenJobAction,
} from "@/server/actions/hire";
import { db } from "@/server/db";
import { can, limit, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { activeJobCount, hirePermissions, listOrgJobs } from "@/server/services/hire";
import { contractFilterOf, remoteFilterOf } from "@/server/services/jobs";
import { orgStructure } from "@/server/services/org-structure";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobs");
  return { title: t("title"), robots: { index: false } };
}

const groups = {
  publiees: ["published", "pending_review"],
  brouillons: ["draft", "rejected", "changes_requested"],
  fermees: ["closed"],
} as const satisfies Record<string, readonly JobStatus[]>;
type Tab = keyof typeof groups | "toutes";

/** Desktop columns of the table (mockup 04-02); on a phone each job is a card. */
const columns =
  "lg:grid lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.55fr)_auto] lg:items-center lg:gap-4";

/**
 * « Mes offres » (partie 07 § 4, mockup 04-02): the jobs by status within the active-job limit,
 * a search and the structure filters, and the actions of each job in its « … » menu.
 */
export default async function HireJobsPage({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx, space } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hire.jobs");
  const all = await getTranslations();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [allJobs, max, active, plan, teams, entities, plans] = await Promise.all([
    listOrgJobs(db, ctx),
    limit(db, subject, "jobs.active.max"),
    activeJobCount(db, ctx.organizationId),
    resolvePlan(db, subject),
    can(db, subject, "org.teams"),
    can(db, subject, "org.entities"),
    listPublicPlans(db),
  ]);
  const structure = teams ? await orgStructure(db, ctx.organizationId) : null;
  const param = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const query = param("q").trim().slice(0, 80);
  const owners = new Map(
    allJobs.flatMap((job) =>
      job.assignedToId && job.assignedTo ? [[job.assignedToId, job.assignedTo.name]] : [],
    ),
  );
  const jobs = allJobs.filter(
    (job) =>
      (!param("responsable") || job.assignedToId === param("responsable")) &&
      (!param("equipe") || job.teamId === param("equipe")) &&
      (!param("departement") || job.departmentId === param("departement")) &&
      (!param("entite") || job.entityId === param("entite")) &&
      (!query || job.title.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr"))),
  );
  const permissions = hirePermissions(ctx.role);
  const tab: Tab =
    params.onglet === "brouillons" || params.onglet === "fermees" || params.onglet === "toutes"
      ? params.onglet
      : "publiees";
  const inGroup = (group: keyof typeof groups) =>
    jobs.filter((job) => (groups[group] as readonly JobStatus[]).includes(job.status));
  const shown = tab === "toutes" ? jobs : inGroup(tab);
  const tabs = [
    { id: "publiees", label: t("tab.published", { count: inGroup("publiees").length }) },
    { id: "brouillons", label: t("tab.drafts", { count: inGroup("brouillons").length }) },
    { id: "fermees", label: t("tab.closed", { count: inGroup("fermees").length }) },
    { id: "toutes", label: t("tab.all") },
  ];
  const emptyText = query
    ? t("search.empty", { query })
    : {
        publiees: t("empty.published"),
        brouillons: t("empty.drafts"),
        fermees: t("empty.closed"),
        toutes: t("empty.published"),
      }[tab];

  /** Same page with some parameters changed (empty value: removed). */
  const hrefWith = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const key of ["onglet", "q", "responsable", "equipe", "departement", "entite"]) {
      const value = key in changes ? changes[key]! : param(key);
      if (value) next.set(key, value);
    }
    const text = next.toString();
    return text ? `/app/hire/offres?${text}` : "/app/hire/offres";
  };
  /** The same view with the confirmation of a close or a delete open under the job. */
  const confirmHref = (action: "fermer" | "supprimer", jobId: string) => {
    const base = hrefWith({});
    return `${base}${base.includes("?") ? "&" : "?"}${action}=${jobId}#offre-${jobId}`;
  };
  const limited = max > 0;
  const reached = limited && active >= max;
  const closing = param("fermer");
  const deleting = param("supprimer");
  const filters = structure
    ? [
        {
          key: "responsable",
          label: t("filter.owner"),
          options: [...owners].map(([value, label]) => ({ value, label })),
        },
        {
          key: "equipe",
          label: t("filter.team"),
          options: structure.teams.map((item) => ({ value: item.id, label: item.name })),
        },
        {
          key: "departement",
          label: t("filter.department"),
          options: structure.departments.map((item) => ({ value: item.id, label: item.name })),
        },
        ...(entities
          ? [
              {
                key: "entite",
                label: t("filter.entity"),
                options: structure.entities.map((item) => ({ value: item.id, label: item.name })),
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <AppPageHeader
        eyebrow={all("hire.dashboard.eyebrow", { org: space.organization.name })}
        title={t("title")}
        actions={
          permissions.manage &&
          !reached && (
            <Link href="/app/hire/offres/nouvelle" className={pillClass("lime", "md")}>
              <Icon name="ajouter" className="size-4" />
              {t("new")}
            </Link>
          )
        }
      />
      {params.ok === "fermee" && <ToastOnLoad message={t("closed.toast")} tone="success" />}

      {limited && (
        <section
          aria-label={t("limit.text", { count: active, max, plan: plan?.planName ?? "" })}
          className="flex items-center gap-3 rounded-[24px] bg-blanc px-4 py-3.5 lg:gap-4 lg:px-5"
        >
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-lime-clair max-lg:hidden"
          >
            <Icon name="jobs" className="size-[18px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-[12.5px] leading-[17px] font-semibold lg:text-[13.5px]">
              {t("limit.text", { count: active, max, plan: plan?.planName ?? "" })}
            </p>
            <span aria-hidden className="block h-[7px] overflow-hidden rounded-pill bg-gris-clair">
              <span
                className={cx(
                  "jm-gauge block h-full origin-left rounded-pill",
                  reached ? "bg-corail" : active / max >= 0.8 ? "bg-ambre" : "bg-sapin",
                )}
                style={{ transform: `scaleX(${Math.min(1, active / max)})` }}
              />
            </span>
          </div>
          {permissions.administer && (
            <Link href="/app/abonnement" className={pillClass("outline", "sm", "max-lg:hidden")}>
              {t("limit.reached.cta")}
            </Link>
          )}
        </section>
      )}
      {(reached || param("erreur") === "limite") && permissions.manage && (
        <section className="flex flex-wrap items-center gap-3 rounded-[20px] bg-blanc p-4 ring-[1.5px] ring-brume ring-inset lg:flex-nowrap lg:px-5">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-creme"
          >
            <Icon name="lock" className="size-[18px]" />
          </span>
          <p className="min-w-0 flex-1 basis-56 text-[13px] leading-[18px] text-ardoise">
            {param("erreur") === "limite" ? t("reopened.limit") : t("limit.reached.text", { max })}
          </p>
          {permissions.administer && (
            <Link href="/app/abonnement" className={pillClass("dark", "sm")}>
              {t("limit.reached.cta")}
            </Link>
          )}
        </section>
      )}

      <nav aria-label={t("tabs")} className="max-w-full min-w-0">
        <TabRail name="hire-offres" className="bg-transparent! p-0!">
          <div className={segmentedList}>
            {tabs.map((item) => {
              const current = item.id === tab;
              return (
                <Link
                  key={item.id}
                  href={hrefWith({ onglet: item.id })}
                  aria-current={current ? "page" : undefined}
                  className={segmentedItem(current)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </TabRail>
      </nav>

      <div className="flex flex-wrap items-center gap-2.5">
        <form
          method="get"
          role="search"
          className="flex h-11 w-full items-center gap-2.5 rounded-pill bg-blanc px-4 lg:w-[320px]"
        >
          {tab !== "publiees" && <input type="hidden" name="onglet" value={tab} />}
          {["responsable", "equipe", "departement", "entite"].map((key) =>
            param(key) ? <input key={key} type="hidden" name={key} value={param(key)} /> : null,
          )}
          <Icon name="recherche" className="size-4 shrink-0 text-ardoise" />
          <label htmlFor="jobs-search" className="sr-only">
            {t("search.placeholder")}
          </label>
          <input
            id="jobs-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("search.placeholder")}
            className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ardoise"
          />
          <button type="submit" className="sr-only">
            {t("search.submit")}
          </button>
        </form>
        {filters.map((filter) => {
          const current = filter.options.find((option) => option.value === param(filter.key));
          return filter.options.length === 0 ? null : (
            <MenuChip
              key={filter.key}
              group="hire-jobs-filter"
              className="max-lg:hidden"
              summaryClassName={cx(chip, current ? chipOn : chipOff)}
              summary={
                <>
                  {current?.label ?? filter.label}
                  <Icon name="chev-d" className="size-3.5" />
                </>
              }
            >
              <Link href={hrefWith({ [filter.key]: "" })} className={menuItem}>
                {t("filter.all")}
                {!current && <Icon name="check" className="ml-auto text-feuille-fonce" />}
              </Link>
              {filter.options.map((option) => (
                <Link
                  key={option.value}
                  href={hrefWith({ [filter.key]: option.value })}
                  aria-current={current?.value === option.value ? "true" : undefined}
                  className={menuItem}
                >
                  {option.label}
                  {current?.value === option.value && (
                    <Icon name="check" className="ml-auto text-feuille-fonce" />
                  )}
                </Link>
              ))}
            </MenuChip>
          );
        })}
        {structure && !entities && (
          <span
            title={t("filter.locked", { plan: orgPlanFor(plans, "org.entities") })}
            className={cx(chip, chipOff, "cursor-default text-ardoise max-lg:hidden")}
          >
            <Icon name="lock" className="size-3.5" />
            {t("filter.entity")}
            <span className="sr-only">
              {t("filter.locked", { plan: orgPlanFor(plans, "org.entities") })}
            </span>
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={emptyText}
          action={
            permissions.manage && !query ? (
              <Link href="/app/hire/offres/nouvelle" className={pillClass("dark", "md")}>
                <Icon name="ajouter" className="size-4" />
                {t("empty.cta")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <section aria-label={t("title")} className="lg:rounded-[24px] lg:bg-blanc lg:px-5 lg:pb-1">
          <div
            aria-hidden
            className={cx(
              columns,
              "hidden py-4 text-[11px] leading-[14px] font-semibold tracking-[0.09em] text-ardoise uppercase lg:grid",
            )}
          >
            <span>{t("col.job")}</span>
            <span>{t("col.status")}</span>
            <span>{t("col.applications")}</span>
            <span>{t("col.publication")}</span>
            <span className="min-w-[200px] text-right">{t("col.actions")}</span>
          </div>
          <ul className="flex flex-col gap-3 lg:gap-0">
            {shown.map((job) => {
              const live = job.status === "published" || job.status === "pending_review";
              const editable = permissions.manage && job.status !== "closed";
              const draft =
                job.status === "draft" ||
                job.status === "rejected" ||
                job.status === "changes_requested";
              const meta = [
                job.city,
                all(`jobs.search.remote.${remoteFilterOf(job.remote)}`),
                all(`jobs.search.contract.${contractFilterOf(job.contractType)}`),
              ].join(" · ");
              const publication = [
                job.status === "pending_review"
                  ? t("row.sent", { date: job.updatedAt })
                  : job.publishedAt
                    ? t("row.published", { date: job.publishedAt })
                    : null,
                job.closesAt && job.status === "published"
                  ? t("row.expires", { date: job.closesAt })
                  : null,
              ].filter(Boolean);
              const statusTag = (
                <span className={cx(tag, jobStatusTone[job.status])}>
                  {t(`status.${statusKey[job.status]}`)}
                </span>
              );
              const count = job._count.applications;
              const primary = live ? (
                <Link
                  href={`/app/hire/offres/${job.id}`}
                  className={pillClass("dark", "sm", "max-lg:w-full")}
                >
                  {t("action.pipeline")}
                  <Icon name="chev-r" className="size-3.5" />
                </Link>
              ) : job.status === "draft" && editable ? (
                <Link
                  href={`/app/hire/offres/${job.id}/modifier`}
                  className={pillClass("lime", "sm", "max-lg:w-full")}
                >
                  <Icon name="edit" className="size-3.5" />
                  {t("action.edit")}
                </Link>
              ) : job.status === "closed" && permissions.manage ? (
                <form action={reopenJobAction} className="max-lg:w-full">
                  <input type="hidden" name="id" value={job.id} />
                  <button type="submit" className={pillClass("outline", "sm", "max-lg:w-full")}>
                    {t("action.reopen")}
                  </button>
                </form>
              ) : job.status === "closed" ? (
                <Link
                  href={`/app/hire/offres/${job.id}`}
                  className={pillClass("outline", "sm", "max-lg:w-full")}
                >
                  {t("action.pipeline")}
                </Link>
              ) : null;
              const menu = (
                <MenuChip
                  group="hire-jobs-row"
                  align="right"
                  label={t("row.menu", { jobTitle: job.title })}
                  summaryClassName={moreButton}
                  summary={<Icon name="more" className="size-4" />}
                >
                  {!draft && (
                    <Link href={`/app/hire/offres/${job.id}`} className={menuItem}>
                      <Icon name="hire" />
                      {t("action.pipeline")}
                    </Link>
                  )}
                  {editable && (
                    <Link href={`/app/hire/offres/${job.id}/modifier`} className={menuItem}>
                      <Icon name="edit" />
                      {t("action.edit")}
                    </Link>
                  )}
                  {permissions.manage && (
                    <form action={duplicateJobAction}>
                      <input type="hidden" name="id" value={job.id} />
                      <button type="submit" className={menuItem}>
                        <Icon name="doc" />
                        {t("action.duplicate")}
                      </button>
                    </form>
                  )}
                  {job.status === "published" && (
                    <CopyButton
                      value={`${siteUrl()}/offres/${job.slug}`}
                      label={t("action.share")}
                      copiedLabel={all("toast.linkCopied")}
                      icon={<Icon name="lien" />}
                      className={menuItem}
                    />
                  )}
                  {permissions.manage && teams && !draft && (
                    <Link href={`/app/hire/offres/${job.id}#attribution`} className={menuItem}>
                      <Icon name="profil" />
                      {t("action.assign")}
                    </Link>
                  )}
                  {permissions.manage && live && (
                    <Link
                      href={`${confirmHref("fermer", job.id)}`}
                      className={cx(menuItem, "text-corail-fonce")}
                    >
                      <Icon name="fermer" />
                      {t("action.close")}
                    </Link>
                  )}
                  {permissions.manage && draft && (
                    <Link
                      href={`${confirmHref("supprimer", job.id)}`}
                      className={cx(menuItem, "text-corail-fonce")}
                    >
                      <Icon name="fermer" />
                      {t("action.delete")}
                    </Link>
                  )}
                </MenuChip>
              );
              return (
                <li
                  key={job.id}
                  id={`offre-${job.id}`}
                  className={cx(
                    "scroll-mt-24 max-lg:rounded-[22px] max-lg:bg-blanc max-lg:p-4",
                    "lg:border-t lg:border-gris-clair",
                  )}
                >
                  <div className={cx(columns, "flex flex-col gap-3 lg:py-3.5")}>
                    <div className="flex min-w-0 items-start gap-3 lg:items-center">
                      <OrgMark name={space.organization.name} size={36} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={
                            draft
                              ? `/app/hire/offres/${job.id}/modifier`
                              : `/app/hire/offres/${job.id}`
                          }
                          className="text-[15px] leading-5 font-semibold hover:underline lg:text-[14.5px]"
                        >
                          {job.title}
                        </Link>
                        <span className="text-[12px] text-ardoise">{meta}</span>
                      </div>
                      <span className="lg:hidden">{menu}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 lg:block">
                      {statusTag}
                      {job.applications.length > 0 && (
                        <span className={cx(tag, tagTone.neon, "lg:hidden")}>
                          {t("row.new", { count: job.applications.length })}
                        </span>
                      )}
                      <span className={cx(tag, tagTone.brume, "lg:hidden")}>
                        {t("row.applications", { count })}
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-1 max-lg:hidden">
                      <span className="text-[13.5px] font-semibold">
                        {t("row.applications", { count })}
                      </span>
                      {job.applications.length > 0 && (
                        <span className={cx(tag, tagTone.neon)}>
                          {t("row.new", { count: job.applications.length })}
                        </span>
                      )}
                    </div>
                    <p className="flex flex-col text-[12px] leading-[17px] text-ardoise">
                      <span className="max-lg:hidden">
                        {publication.length > 0
                          ? publication.map((line) => (
                              <span key={line} className="block">
                                {line}
                              </span>
                            ))
                          : all("hire.dashboard.kpi.none")}
                      </span>
                      <span className="lg:hidden">
                        {publication.length > 0 ? publication.join(" · ") : t("row.notPublished")}
                      </span>
                      {job.assignedTo && (
                        <span className="truncate text-sapin lg:text-ardoise">
                          {t("row.owner", { memberName: job.assignedTo.name })}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center justify-end gap-2 lg:min-w-[200px]">
                      {primary}
                      <span className="max-lg:hidden">{menu}</span>
                    </div>
                  </div>
                  {job.status === "changes_requested" && (
                    <ModerationChanges
                      job={job}
                      fixHref={editable ? `/app/hire/offres/${job.id}/modifier` : undefined}
                      className="mb-3 max-lg:mt-3"
                    />
                  )}
                  {job.status === "rejected" && job.moderationReason && (
                    <div className="mb-3 flex flex-col gap-3 rounded-[16px] bg-down-fond px-4 py-3 text-down-texte max-lg:mt-3 lg:flex-row lg:items-center">
                      <p className="flex min-w-0 flex-1 items-start gap-2 text-[12.5px] leading-[17px]">
                        <Icon name="securite" className="mt-px size-4 shrink-0" />
                        <span>{t("rejected.reason", { reason: job.moderationReason })}</span>
                      </p>
                      {editable && (
                        <Link
                          href={`/app/hire/offres/${job.id}/modifier`}
                          className={pillClass("dark", "sm", "max-lg:w-full")}
                        >
                          {t("rejected.fix")}
                        </Link>
                      )}
                    </div>
                  )}
                  {permissions.manage && (closing === job.id || deleting === job.id) && (
                    <form
                      action={closing === job.id ? closeJobAction : deleteDraftAction}
                      role="alertdialog"
                      aria-labelledby={`confirm-${job.id}`}
                      className="jm-panel mb-4 flex flex-col gap-3 rounded-[22px] bg-blanc p-5 ring-[1.5px] ring-sapin ring-inset max-lg:mt-3 lg:mx-auto lg:max-w-[620px]"
                    >
                      <input type="hidden" name="id" value={job.id} />
                      <h2
                        id={`confirm-${job.id}`}
                        className="text-[20px] leading-[26px] font-semibold"
                      >
                        {closing === job.id
                          ? t("close.confirm.title", { jobTitle: job.title })
                          : t("delete.confirm.title")}
                      </h2>
                      <p className="text-[13px] leading-[19px] text-ardoise">
                        {closing === job.id ? t("close.confirm.body") : t("delete.confirm.body")}
                      </p>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`${hrefWith({})}#offre-${job.id}`}
                          className={pillClass("outline", "sm")}
                        >
                          {t("cancel")}
                        </Link>
                        <button type="submit" className={pillClass("dark", "sm")}>
                          {closing === job.id ? t("close.confirm.cta") : t("action.delete")}
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
