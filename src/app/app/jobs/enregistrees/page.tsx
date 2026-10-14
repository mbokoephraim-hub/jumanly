import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JobListing } from "@/components/site/listings";
import { Badge, Button, ButtonLink, EmptyState } from "@/components/ui";
import { clearClosedSavedJobs, toggleSaveAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { isJobOpen } from "@/server/services/jobs";
import { AppPageHeader } from "@/components/app/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs.saved");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const SOON_DAYS = 3;

/** « Offres enregistrées »: open offers first, closed ones marked and easy to clear. */
export default async function SavedJobsPage() {
  const user = await requireUser("/app/jobs/enregistrees");
  const t = await getTranslations("talent.jobs.saved");
  const now = new Date();
  const saved = await db.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      job: {
        select: {
          id: true,
          slug: true,
          title: true,
          contractType: true,
          city: true,
          country: true,
          remote: true,
          publishedAt: true,
          closesAt: true,
          status: true,
          organization: { select: { name: true, verifiedAt: true } },
        },
      },
    },
  });
  const jobs = saved
    .map(({ job }) => ({ ...job, open: isJobOpen(job, now) }))
    .sort((a, b) => Number(b.open) - Number(a.open));
  const hasClosed = jobs.some((job) => !job.open);

  return (
    <div className="flex flex-col gap-6">
      <AppPageHeader
        title={t("title")}
        subtitle={t("count", { count: jobs.length })}
        actions={
          hasClosed && (
            <form action={clearClosedSavedJobs}>
              <Button type="submit" variant="secondary" size="sm">
                {t("clearClosed")}
              </Button>
            </form>
          )
        }
      />
      {jobs.length === 0 ? (
        <EmptyState
          title={t("empty.text")}
          action={<ButtonLink href="/app/jobs">{t("empty.cta")}</ButtonLink>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.slug} className="flex flex-col gap-2 [&>article]:flex-1">
              <JobListing job={job} now={now} href={`/app/jobs/${job.slug}`} />
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                {!job.open ? (
                  <Badge tone="neutral">{t("closed")}</Badge>
                ) : job.closesAt &&
                  job.closesAt.getTime() - now.getTime() < SOON_DAYS * 86_400_000 ? (
                  <Badge tone="warning">{t("closingSoon")}</Badge>
                ) : (
                  <ButtonLink href={`/app/jobs/${job.slug}#postuler`} size="sm">
                    {t("apply")}
                  </ButtonLink>
                )}
                <form action={toggleSaveAction}>
                  <input type="hidden" name="job" value={job.slug} />
                  <input type="hidden" name="back" value="/app/jobs/enregistrees" />
                  <Button
                    type="submit"
                    variant="tertiary"
                    size="sm"
                    aria-label={`${t("remove")} · ${job.title}`}
                  >
                    {t("remove")}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
