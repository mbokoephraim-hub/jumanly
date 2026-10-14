import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, ButtonLink, EmptyState, QuotaGauge, StatCard } from "@/components/ui";
import { db } from "@/server/db";
import { limit } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { activeJobCount, hireDashboard, hirePermissions } from "@/server/services/hire";
import { seatUsage } from "@/server/services/organization";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.dashboard");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Hire dashboard (partie 07 § 4): what needs attention, active jobs and the organization's limits. */
export default async function HireDashboardPage({ searchParams }: PageProps<"/app/hire">) {
  const params = await searchParams;
  const { user, space, ctx } = await requireHire("/app/hire");
  const t = await getTranslations("hire.dashboard");
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [data, maxJobs, activeJobs, seats] = await Promise.all([
    hireDashboard(db, ctx),
    limit(db, subject, "jobs.active.max"),
    activeJobCount(db, ctx.organizationId),
    seatUsage(db, ctx.organizationId),
  ]);
  const permissions = hirePermissions(ctx.role);
  const toDo = [
    data.unseen > 0 && t("toDo.newApplications", { count: data.unseen }),
    data.waiting > 0 && t("toDo.noReply", { count: data.waiting, days: 5 }),
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-eyebrow text-ardoise">
            {t("eyebrow", { org: space.organization.name })}
          </p>
          <h1 className="text-h1">{t("title")}</h1>
          <p className="text-ardoise">
            {t("greeting", { firstName: user.firstName ?? user.name })}
          </p>
        </div>
        {permissions.manage && (
          <ButtonLink href="/app/hire/offres/nouvelle">{t("newCta")}</ButtonLink>
        )}
      </header>
      {params.bienvenue && (
        <Alert tone="success" title={t("eyebrow", { org: space.organization.name })} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label={t("kpi.applications.text")} value={String(data.applications)} />
        <StatCard
          label={t("kpi.activeJobs.text")}
          value={
            maxJobs < 0
              ? String(activeJobs)
              : t("kpi.activeJobs.value", { count: activeJobs, max: maxJobs })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <section aria-labelledby="todo" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
            <h2 id="todo" className="text-h2">
              {t("toDo.title")}
            </h2>
            {toDo.length === 0 ? (
              <p className="text-ardoise">{t("toDo.empty")}</p>
            ) : (
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {toDo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="jobs" className="flex flex-col gap-3 rounded-card bg-blanc p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="jobs" className="text-h2">
                {t("jobs.title")}
              </h2>
              <Link href="/app/hire/offres" className="text-sm underline">
                {t("jobs.seeAll")}
              </Link>
            </div>
            {data.jobs.length === 0 ? (
              <EmptyState
                title={t("jobs.empty.text")}
                action={
                  permissions.manage ? (
                    <ButtonLink href="/app/hire/offres/nouvelle" size="sm">
                      {t("jobs.empty.cta")}
                    </ButtonLink>
                  ) : undefined
                }
              />
            ) : (
              <ul className="flex flex-col divide-y divide-brume">
                {data.jobs.map((job) => (
                  <li key={job.id} className="py-3">
                    <Link href={`/app/hire/offres/${job.id}`} className="font-medium underline">
                      {t("jobs.row", { jobTitle: job.title, count: job._count.applications })}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <section
          aria-labelledby="quotas"
          className="flex flex-col gap-4 self-start rounded-card bg-blanc p-6"
        >
          <h2 id="quotas" className="text-h2">
            {t("quotas.title")}
          </h2>
          <QuotaGauge
            label={t("quotas.seats")}
            used={seats.members}
            limit={seats.max < 0 ? null : seats.max}
          />
          <QuotaGauge
            label={t("quotas.activeJobs")}
            used={activeJobs}
            limit={maxJobs < 0 ? null : maxJobs}
          />
          {permissions.administer && (
            <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
              {t("quotas.seePlans")}
            </ButtonLink>
          )}
          <p className="text-sm text-ardoise">{t("fairness")}</p>
        </section>
      </div>
    </div>
  );
}
