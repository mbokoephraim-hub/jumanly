import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { JobStatusBadge } from "@/components/hire/job-status";
import { Alert, Button, ButtonLink, EmptyState, Select } from "@/components/ui";
import type { JobStatus } from "@/generated/prisma/client";
import { cx } from "@/lib/cx";
import { closeJobAction, deleteDraftAction } from "@/server/actions/hire";
import { db } from "@/server/db";
import { can, limit, resolvePlan } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { activeJobCount, hirePermissions, listOrgJobs } from "@/server/services/hire";
import { orgStructure } from "@/server/services/org-structure";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.jobs");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const groups = {
  publiees: ["published", "pending_review"],
  brouillons: ["draft", "rejected"],
  fermees: ["closed"],
} as const satisfies Record<string, readonly JobStatus[]>;
type Tab = keyof typeof groups | "toutes";

/** « Mes offres » (partie 07 § 4): jobs by status, the active-job limit, row actions. */
export default async function HireJobsPage({ searchParams }: PageProps<"/app/hire/offres">) {
  const params = await searchParams;
  const { ctx } = await requireHire("/app/hire/offres");
  const t = await getTranslations("hire.jobs");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [allJobs, max, active, plan, teams] = await Promise.all([
    listOrgJobs(db, ctx),
    limit(db, subject, "jobs.active.max"),
    activeJobCount(db, ctx.organizationId),
    resolvePlan(db, subject),
    can(db, subject, "org.teams"),
  ]);
  // Filters by owner, team, department and entity (`org.teams`), on the jobs already in scope.
  const structure = teams ? await orgStructure(db, ctx.organizationId) : null;
  const filter = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const owners = new Map(
    allJobs.flatMap((job) =>
      job.assignedToId && job.assignedTo ? [[job.assignedToId, job.assignedTo.name]] : [],
    ),
  );
  const jobs = allJobs.filter(
    (job) =>
      (!filter("responsable") || job.assignedToId === filter("responsable")) &&
      (!filter("equipe") || job.teamId === filter("equipe")) &&
      (!filter("departement") || job.departmentId === filter("departement")) &&
      (!filter("entite") || job.entityId === filter("entite")),
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
  const emptyText = {
    publiees: t("empty.published"),
    brouillons: t("empty.drafts"),
    fermees: t("empty.closed"),
    toutes: t("empty.published"),
  }[tab];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">{t("title")}</h1>
          {max >= 0 && (
            <p className="text-ardoise">
              {t("limit.text", { count: active, max, plan: plan?.planName ?? "" })}
            </p>
          )}
        </div>
        {permissions.manage && <ButtonLink href="/app/hire/offres/nouvelle">{t("new")}</ButtonLink>}
      </header>
      {params.ok === "fermee" && <Alert tone="success" title={t("closed.toast")} />}
      {max >= 0 && active >= max && permissions.manage && (
        <Alert
          tone="warning"
          title={t("limit.reached.text", { max })}
          action={
            <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
              {t("limit.reached.cta")}
            </ButtonLink>
          }
        />
      )}
      {structure && (
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="onglet" value={tab} />
          <Select
            id="jobs-owner"
            name="responsable"
            label={t("filter.owner")}
            placeholder={t("filter.all")}
            defaultValue={filter("responsable")}
            options={[...owners].map(([value, label]) => ({ value, label }))}
          />
          {structure.teams.length > 0 && (
            <Select
              id="jobs-team"
              name="equipe"
              label={t("filter.team")}
              placeholder={t("filter.all")}
              defaultValue={filter("equipe")}
              options={structure.teams.map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          {structure.departments.length > 0 && (
            <Select
              id="jobs-department"
              name="departement"
              label={t("filter.department")}
              placeholder={t("filter.all")}
              defaultValue={filter("departement")}
              options={structure.departments.map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          {structure.entities.length > 0 && (
            <Select
              id="jobs-entity"
              name="entite"
              label={t("filter.entity")}
              placeholder={t("filter.all")}
              defaultValue={filter("entite")}
              options={structure.entities.map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <Button type="submit" size="sm" variant="tertiary">
            {t("filter.submit")}
          </Button>
        </form>
      )}
      <nav aria-label={t("title")} className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={`/app/hire/offres?onglet=${item.id}`}
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
      {shown.length === 0 ? (
        <EmptyState
          title={emptyText}
          action={
            permissions.manage ? (
              <ButtonLink href="/app/hire/offres/nouvelle">{t("empty.cta")}</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((job) => {
            const editable = permissions.manage && job.status !== "closed";
            return (
              <li key={job.id} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-h3 font-semibold">
                      <Link href={`/app/hire/offres/${job.id}`} className="underline">
                        {job.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-ardoise">
                      {[
                        t("row.applications", { count: job._count.applications }),
                        job.applications.length > 0
                          ? t("row.new", { count: job.applications.length })
                          : null,
                        job.publishedAt ? t("row.published", { date: job.publishedAt }) : null,
                        job.closesAt && job.status === "published"
                          ? t("row.expires", { date: job.closesAt })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-sm text-ardoise">
                      {[
                        job.assignedTo ? t("row.owner", { memberName: job.assignedTo.name }) : null,
                        job.team?.name,
                        job.department?.name,
                        job.entity?.name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
                {job.status === "rejected" && job.moderationReason && (
                  <Alert
                    tone="error"
                    title={t("rejected.reason", { reason: job.moderationReason })}
                  />
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {job.status !== "draft" && job.status !== "rejected" && (
                    <Link href={`/app/hire/offres/${job.id}`} className="font-medium underline">
                      {t("action.pipeline")}
                    </Link>
                  )}
                  {editable && (
                    <Link
                      href={`/app/hire/offres/${job.id}/modifier`}
                      className="font-medium underline"
                    >
                      {job.status === "rejected" ? t("rejected.fix") : t("action.edit")}
                    </Link>
                  )}
                  {permissions.manage &&
                    (job.status === "published" || job.status === "pending_review") && (
                      <details className="w-full">
                        <summary className="cursor-pointer font-medium underline">
                          {t("action.close")}
                        </summary>
                        <form
                          action={closeJobAction}
                          className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                        >
                          <input type="hidden" name="id" value={job.id} />
                          <p className="font-semibold">
                            {t("close.confirm.title", { jobTitle: job.title })}
                          </p>
                          <p>{t("close.confirm.body")}</p>
                          <Button type="submit" variant="danger" size="sm">
                            {t("close.confirm.cta")}
                          </Button>
                        </form>
                      </details>
                    )}
                  {permissions.manage && (job.status === "draft" || job.status === "rejected") && (
                    <details className="w-full">
                      <summary className="cursor-pointer font-medium underline">
                        {t("action.delete")}
                      </summary>
                      <form
                        action={deleteDraftAction}
                        className="mt-3 flex flex-col items-start gap-3 rounded-md bg-creme p-4"
                      >
                        <input type="hidden" name="id" value={job.id} />
                        <p className="font-semibold">{t("delete.confirm.title")}</p>
                        <p>{t("delete.confirm.body")}</p>
                        <Button type="submit" variant="danger" size="sm">
                          {t("action.delete")}
                        </Button>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
