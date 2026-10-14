import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, ButtonLink, EmptyState, QuotaGauge, StatCard } from "@/components/ui";
import { Icon } from "@/components/brand";
import { hireShortcuts } from "@/config/navigation";
import { db } from "@/server/db";
import { can, limit, usage } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { scorecardsToComplete } from "@/server/services/evaluation";
import { activeJobCount, hireDashboard, hirePermissions } from "@/server/services/hire";
import { upcomingOrgInterviews } from "@/server/services/interviews";
import { seatUsage } from "@/server/services/organization";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";
import { acceptedContacts } from "@/server/services/talent-search";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.dashboard");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Hire dashboard (partie 07 § 4): what needs attention, active jobs and the organization's limits. */
export default async function HireDashboardPage({ searchParams }: PageProps<"/app/hire">) {
  const params = await searchParams;
  const { user, space, ctx } = await requireHire("/app/hire");
  const t = await getTranslations("hire.dashboard");
  const nav = await getTranslations("appNav");
  const format = await getFormatter();
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const [data, maxJobs, activeJobs, seats, appointments, quotas, organization, plans] =
    await Promise.all([
      hireDashboard(db, ctx),
      limit(db, subject, "jobs.active.max"),
      activeJobCount(db, ctx.organizationId),
      seatUsage(db, ctx.organizationId),
      can(db, subject, "connect.appointments"),
      Promise.all([
        usage(db, subject, "hire.talent_search.monthly"),
        usage(db, subject, "hire.contact_requests.monthly"),
        usage(db, subject, "ai.credits.monthly"),
      ]),
      db.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
        select: { verificationStatus: true },
      }),
      listPublicPlans(db),
    ]);
  const permissions = hirePermissions(ctx.role);
  const [interviews, scorecards, contacts] = await Promise.all([
    appointments ? upcomingOrgInterviews(db, ctx) : null,
    permissions.evaluate ? scorecardsToComplete(db, ctx) : 0,
    permissions.manage ? acceptedContacts(db, ctx.organizationId, weekAgo) : 0,
  ]);
  const toDo = [
    data.unseen > 0 && t("toDo.newApplications", { count: data.unseen }),
    data.waiting > 0 && t("toDo.noReply", { count: data.waiting, days: 5 }),
    scorecards > 0 && t("toDo.scorecards", { count: scorecards }),
    contacts > 0 && t("toDo.contactAccepted", { count: contacts }),
  ].filter((item): item is string => Boolean(item));
  const [searches, contactRequests, aiCredits] = quotas;
  const quotaRows = [
    { label: t("quotas.search"), value: searches },
    { label: t("quotas.contacts"), value: contactRequests },
    { label: t("quotas.aiCredits"), value: aiCredits },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        eyebrow={t("eyebrow", { org: space.organization.name })}
        title={t("title")}
        subtitle={t("greeting", { firstName: user.firstName ?? user.name })}
        actions={
          permissions.manage && (
            <ButtonLink href="/app/hire/offres/nouvelle">{t("newCta")}</ButtonLink>
          )
        }
      />
      {params.bienvenue && (
        <Alert tone="success" title={t("eyebrow", { org: space.organization.name })} />
      )}
      {permissions.administer &&
        (organization.verificationStatus === "pending" ? (
          <Alert title={t("verifyBanner.pending")} />
        ) : organization.verificationStatus === "none" ||
          organization.verificationStatus === "rejected" ? (
          <Alert
            title={t("verifyBanner.text")}
            action={
              <Link href="/app/organisation?onglet=verification" className="font-medium underline">
                {t("verifyBanner.cta")}
              </Link>
            }
          />
        ) : null)}

      <nav aria-label={t("title")} className="grid grid-cols-3 gap-2 lg:hidden">
        {hireShortcuts.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-card bg-blanc p-3 text-center text-sm font-medium"
          >
            <Icon name={item.icon} className="size-6" />
            {nav(item.key)}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("kpi.applications.text")} value={String(data.applications)} />
        <StatCard
          label={t("kpi.activeJobs.text")}
          value={
            maxJobs < 0
              ? String(activeJobs)
              : t("kpi.activeJobs.value", { count: activeJobs, max: maxJobs })
          }
        />
        {interviews && (
          <StatCard
            label={t("kpi.interviews.text")}
            value={t("kpi.interviews.week", { count: interviews.thisWeek })}
          />
        )}
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
          <section
            aria-labelledby="interviews"
            className="flex flex-col gap-3 rounded-card bg-blanc p-6"
          >
            <h2 id="interviews" className="text-h2">
              {t("interviews.title")}
            </h2>
            {!interviews ? (
              <p className="text-sm text-ardoise">
                {t("interviews.locked", { plan: orgPlanFor(plans, "connect.appointments") })}
              </p>
            ) : interviews.next.length === 0 ? (
              <p className="text-ardoise">{t("interviews.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-brume">
                {interviews.next.map((interview) => (
                  <li key={interview.id} className="py-3">
                    <Link
                      href={`/app/hire/candidats/${interview.application.id}`}
                      className="font-medium underline"
                    >
                      {t("interviews.row", {
                        time: interview.startsAt
                          ? format.dateTime(interview.startsAt, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "",
                        candidateName: interview.application.profile.user.name,
                        jobTitle: interview.application.job.title,
                      })}
                    </Link>
                  </li>
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
          {quotaRows.map((row) =>
            row.value.limit === 0 ? (
              <p key={row.label} className="flex justify-between gap-2 text-sm">
                <span>{row.label}</span>
                <span className="text-ardoise">{t("quotas.notIncluded")}</span>
              </p>
            ) : (
              <QuotaGauge
                key={row.label}
                label={row.label}
                used={row.value.used}
                limit={row.value.limit < 0 ? null : row.value.limit}
              />
            ),
          )}
          {quotaRows[0]!.value.limit !== 0 && (
            <p className="text-sm text-ardoise">
              {t("quotas.renewal", { date: quotaRows[0]!.value.resetsAt })}
            </p>
          )}
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
