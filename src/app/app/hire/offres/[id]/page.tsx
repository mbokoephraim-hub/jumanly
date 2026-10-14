import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JobSettings } from "@/components/hire/job-settings";
import { JobStatusBadge } from "@/components/hire/job-status";
import { Alert, Badge, Button, ButtonLink, EmptyState, ScoreBadge } from "@/components/ui";
import { moveApplicationAction, publishJobAction } from "@/server/actions/hire";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
import { getPipeline, HireError, hirePermissions } from "@/server/services/hire";
import { cheapestPlanWhere, levelOf, listPublicPlans } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.pipeline");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/**
 * Pipeline of a job (partie 07 § 4): one column per stage. Each card moves with a small form
 * (works with the keyboard and without JavaScript); rejection opens the decision form. With
 * `hire.matching.level`, each card shows the score frozen at application and the columns can be
 * sorted by compatibility; without it, applications are listed by date (§ 8.6).
 */
export default async function PipelinePage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { space, ctx } = await requireHire(`/app/hire/offres/${id}`, "readApplications");
  const t = await getTranslations("hire");
  const { job, stages, applications } = await getPipeline(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const permissions = hirePermissions(ctx.role);
  const matchingLevel = await level(
    db,
    { type: "organization", id: ctx.organizationId },
    "hire.matching.level",
  );
  const withMatching = matchingLevel !== "none";
  const matches = withMatching
    ? await applicationMatches(db, applications)
    : new Map<string, never>();
  const scoreOf = (id: string) => {
    const match = matches.get(id);
    return match && match !== "disabled" ? match : null;
  };
  const byScore = withMatching && query.tri === "score";
  if (byScore)
    applications.sort((a, b) => (scoreOf(b.id)?.score ?? -1) - (scoreOf(a.id)?.score ?? -1));
  const lockedPlan = withMatching
    ? null
    : (cheapestPlanWhere(await listPublicPlans(db), ["rh", "company"], (plan) =>
        ["suggestions", "explainable"].includes(levelOf(plan, "hire.matching.level")),
      )?.name ?? null);
  const back = `/app/hire/offres/${job.id}${byScore ? "?tri=score" : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/app/hire/offres" className="text-sm underline">
          {t("jobs.title")}
        </Link>
        <p className="text-eyebrow text-ardoise">
          {t("pipeline.eyebrow", { org: space.organization.name })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h1">{job.title}</h1>
          <JobStatusBadge status={job.status} />
        </div>
        <p className="text-ardoise">{t("jobs.row.applications", { count: applications.length })}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {permissions.manage && job.status !== "closed" && (
            <Link href={`/app/hire/offres/${job.id}/modifier`} className="font-medium underline">
              {t("jobs.action.edit")}
            </Link>
          )}
          {job.status === "published" && (
            <Link href={`/offres/${job.slug}`} className="font-medium underline">
              {t("jobForm.preview.title")}
            </Link>
          )}
        </div>
      </header>

      {query.publiee === "1" && (
        <Alert tone="success" title={t("jobForm.publish.success.title")}>
          {t("jobForm.publish.success.body")}
        </Alert>
      )}
      {query.publiee === "verification" && <Alert title={t("jobForm.publish.success.review")} />}
      {query.ok === "deplacee" && <Alert tone="success" title={t("pipeline.moved.notified")} />}
      {job.status === "rejected" && job.moderationReason && (
        <Alert tone="error" title={t("jobs.rejected.reason", { reason: job.moderationReason })} />
      )}
      {(job.status === "draft" || job.status === "rejected") && permissions.manage && (
        <form action={publishJobAction}>
          <input type="hidden" name="id" value={job.id} />
          <Button type="submit">{t("jobForm.publish.text")}</Button>
        </form>
      )}
      {!permissions.manage && <Alert title={t("pipeline.permission.readOnly")} />}
      {withMatching && applications.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ardoise">{t("pipeline.aiNotice")}</p>
          <nav
            className="flex flex-wrap gap-4 text-sm"
            aria-label={t("pipeline.filter.score.text")}
          >
            <Link
              href={`/app/hire/offres/${job.id}?tri=score`}
              aria-current={byScore ? "page" : undefined}
              className="font-medium underline aria-[current=page]:no-underline"
            >
              {t("pipeline.stage.sortByScore")}
            </Link>
            <Link
              href={`/app/hire/offres/${job.id}`}
              aria-current={byScore ? undefined : "page"}
              className="font-medium underline aria-[current=page]:no-underline"
            >
              {t("pipeline.stage.sortByDate")}
            </Link>
          </nav>
        </div>
      )}
      {lockedPlan && applications.length > 0 && (
        <p className="text-sm text-ardoise">
          {t("pipeline.matching.locked", { plan: lockedPlan })}
        </p>
      )}

      {applications.length === 0 ? (
        <EmptyState
          title={t("pipeline.empty.text")}
          action={
            job.status === "published" ? (
              <ButtonLink href={`/offres/${job.slug}`} variant="tertiary">
                {t("jobForm.preview.title")}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <ol className="flex flex-col gap-4 lg:grid lg:auto-cols-[minmax(240px,1fr)] lg:grid-flow-col">
            {stages.map((stage) => {
              const cards = applications.filter((application) => application.stageId === stage.id);
              return (
                <li key={stage.id} className="flex flex-col gap-3 rounded-card bg-brume/50 p-3">
                  <h2 className="flex items-center justify-between gap-2 px-1 font-semibold">
                    <span>{stage.name}</span>
                    <Badge tone="hire">{t("pipeline.stage.count", { count: cards.length })}</Badge>
                  </h2>
                  {cards.length === 0 ? (
                    <p className="px-1 text-sm text-ardoise">{t("pipeline.stage.empty")}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {cards.map((application) => {
                        const person = application.profile.user;
                        const others = stages.filter((item) => item.id !== stage.id);
                        return (
                          <li
                            key={application.id}
                            className="flex flex-col gap-2 rounded-md bg-blanc p-3"
                          >
                            <Link
                              href={`/app/hire/candidats/${application.id}`}
                              className="font-semibold underline"
                            >
                              {person.name}
                            </Link>
                            {application.profile.headline && (
                              <p className="text-sm">{application.profile.headline}</p>
                            )}
                            <p className="text-ardoise text-caption">
                              {[
                                person.city,
                                t("application.appliedOn", { date: application.createdAt }),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            {scoreOf(application.id) && (
                              <span className="self-start">
                                <ScoreBadge
                                  score={scoreOf(application.id)!.score}
                                  band={scoreOf(application.id)!.band}
                                />
                              </span>
                            )}
                            {!application.viewedAt && application.status === "active" && (
                              <Badge tone="new" className="self-start">
                                {t("jobs.row.new", { count: 1 })}
                              </Badge>
                            )}
                            {application.status === "withdrawn" && (
                              <Badge className="self-start">{t("pipeline.card.withdrawn")}</Badge>
                            )}
                            {permissions.manage && application.status !== "withdrawn" && (
                              <form action={moveApplicationAction} className="flex items-end gap-2">
                                <input type="hidden" name="application" value={application.id} />
                                <input type="hidden" name="back" value={back} />
                                <label className="flex min-w-0 flex-1 flex-col gap-1 text-caption">
                                  <span className="sr-only">
                                    {t("pipeline.action.moveAria", { candidateName: person.name })}
                                  </span>
                                  <select
                                    name="stage"
                                    required
                                    defaultValue=""
                                    className="h-9 w-full rounded-sm border border-brume bg-blanc px-2 text-sm"
                                  >
                                    <option value="" disabled>
                                      {t("pipeline.action.moveTo")}
                                    </option>
                                    {others.map((item) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <Button type="submit" size="sm" variant="tertiary">
                                  {t("pipeline.action.moveSubmit")}
                                </Button>
                              </form>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {permissions.manage && (
        <JobSettings
          ctx={ctx}
          job={job}
          ok={typeof query.ok === "string" ? query.ok : undefined}
          error={typeof query.erreur === "string" ? query.erreur : undefined}
        />
      )}
      <p className="text-sm text-ardoise">{t("dashboard.fairness")}</p>
    </div>
  );
}
