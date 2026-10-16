import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { pillClass } from "@/components/career/kit";
import { relativeLabel, salaryText, tag, tagTone } from "@/components/jobs/talent-kit";
import { CompanyLogo, EmptyState } from "@/components/ui";
import { Character } from "@/components/brand/character";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { clearClosedSavedJobs, toggleSaveAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { matchesForUser } from "@/server/matching/service";
import { contractFilterOf, isJobOpen, jobCards, remoteFilterOf } from "@/server/services/jobs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.jobs.saved");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const SOON_DAYS = 3;
const sorts = ["recent", "deadline"] as const;

/**
 * « Offres enregistrées » (mockup 03-20): open offers first, the ones closing soon flagged, closed
 * ones marked and easy to clear. Each card keeps its score and « Pourquoi ? ».
 */
export default async function SavedJobsPage({ searchParams }: PageProps<"/app/jobs/enregistrees">) {
  const params = await searchParams;
  const user = await requireUser("/app/jobs/enregistrees");
  const t = await getTranslations("talent.jobs.saved");
  const tr = await getTranslations();
  const now = new Date();
  const sort = params.tri === "limite" ? "deadline" : "recent";
  const saved = await db.savedJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { job: { select: { id: true, status: true } } },
  });
  const cards = await jobCards(
    db,
    saved.map(({ job }) => job.id),
  );
  const statusOf = new Map(saved.map(({ job }) => [job.id, job.status]));
  const jobs = cards
    .map((job) => ({
      ...job,
      open: isJobOpen({ status: statusOf.get(job.id)!, closesAt: job.closesAt }, now),
    }))
    .sort((a, b) => {
      if (a.open !== b.open) return Number(b.open) - Number(a.open);
      if (sort === "deadline") {
        return (a.closesAt?.getTime() ?? Infinity) - (b.closesAt?.getTime() ?? Infinity);
      }
      return 0;
    });
  const soon = (job: (typeof jobs)[number]) =>
    job.open &&
    job.closesAt !== null &&
    job.closesAt.getTime() - now.getTime() < SOON_DAYS * 86_400_000;
  const soonCount = jobs.filter(soon).length;
  const hasClosed = jobs.some((job) => !job.open);
  const matches = await matchesForUser(
    db,
    user.id,
    jobs.filter((job) => job.open).map((job) => job.id),
    now,
  );

  const clear = hasClosed && (
    <form action={clearClosedSavedJobs}>
      <button type="submit" className={pillClass("outline", "sm")}>
        {t("clearClosed")}
      </button>
    </form>
  );

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader title={t("title")} subtitle={t("count", { count: jobs.length })} />
      {jobs.length === 0 ? (
        <EmptyState
          illustration={<Character name="amani" pose="perplexe" height={140} />}
          title={t("empty.text")}
          action={
            <Link href="/app/jobs" className={pillClass("dark")}>
              {t("empty.cta")}
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={cx(tag, tagTone.brume, "h-8 px-3.5 text-xs max-lg:hidden")}>
              {t("count", { count: jobs.length })}
            </span>
            {soonCount > 0 && (
              <span className={cx(tag, tagTone.ambre, "h-8 px-3.5 text-xs")}>
                <Icon name="horloge" className="size-3.5" />
                {t("soonCount", { count: soonCount })}
              </span>
            )}
            <span className="flex-1" />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-ardoise [&::-webkit-details-marker]:hidden">
                <span>{tr("talent.jobs.sort.text")}</span>
                <strong className="font-semibold text-sapin">{t(`sort.${sort}`)}</strong>
                <Icon name="chev-d" className="size-3.5" />
              </summary>
              <ul className="absolute top-7 right-0 z-30 flex min-w-48 flex-col gap-0.5 rounded-[18px] bg-blanc p-1.5 text-sm shadow-menu ring-1 ring-sapin/8">
                {sorts.map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "deadline"
                          ? "/app/jobs/enregistrees?tri=limite"
                          : "/app/jobs/enregistrees"
                      }
                      aria-current={sort === item ? "true" : undefined}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-creme"
                    >
                      {t(`sort.${item}`)}
                      {sort === item && <Icon name="check" className="size-4 text-feuille-fonce" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
            {clear}
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => {
              const match = matches.get(job.id);
              const ok = match?.state === "ok" ? match.explanation : null;
              const href = `/app/jobs/${job.slug}`;
              return (
                <li
                  key={job.id}
                  className={cx(
                    "flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5",
                    !job.open && "opacity-80",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <CompanyLogo
                      name={job.organization.name}
                      size="md"
                      className="size-11! rounded-[14px]! text-base!"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h2 className="text-[15px] leading-5 font-semibold tracking-[-0.01em]">
                        <Link href={href} className="hover:underline">
                          {job.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-ardoise">
                        {job.organization.name}
                        {job.publishedAt && (
                          <>
                            <span aria-hidden className="mx-1">
                              {"·"}
                            </span>
                            {relativeLabel(job.publishedAt, now)}
                          </>
                        )}
                      </p>
                    </div>
                    <form action={toggleSaveAction}>
                      <input type="hidden" name="job" value={job.slug} />
                      <input type="hidden" name="back" value="/app/jobs/enregistrees" />
                      <button
                        type="submit"
                        aria-pressed
                        aria-label={`${tr("talent.jobs.card.unsave")} · ${job.title}`}
                        className="flex size-8 items-center justify-center rounded-full text-sapin hover:bg-creme"
                      >
                        <Icon name="favori" className="size-[18px] fill-sapin" />
                      </button>
                    </form>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!job.open && <span className={cx(tag, tagTone.brume)}>{t("closed")}</span>}
                    {soon(job) && (
                      <span className={cx(tag, tagTone.ambre)}>
                        <Icon name="horloge" className="size-3" />
                        {t("closingSoon")}
                      </span>
                    )}
                    <span className={cx(tag, tagTone.brume)}>
                      <Icon name="localisation" className="size-3" />
                      {tr("talent.jobs.card.location", {
                        city: job.city,
                        workMode: tr(`jobs.card.remote.${remoteFilterOf(job.remote)}`),
                      })}
                    </span>
                    <span className={cx(tag, tagTone.brume)}>
                      {tr(`jobs.search.contract.${contractFilterOf(job.contractType)}`)}
                    </span>
                    <span className={cx(tag, tagTone.brume)}>{salaryText(dynamic(tr), job)}</span>
                  </div>
                  {!job.open ? (
                    <p className="text-[13px] text-ardoise">{t("closedNote")}</p>
                  ) : ok ? (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cx(tag, "h-[26px] bg-gradient-ai text-blanc")}
                        aria-label={tr("talent.jobs.card.compatibility.aria", {
                          score: Math.round(ok.score),
                          band: tr(`match.band.${ok.band}.text`),
                        })}
                      >
                        <Icon name="intelligence" className="size-3 text-neon" />
                        {tr("talent.jobs.card.compatibility.text", { score: Math.round(ok.score) })}
                      </span>
                      <Link
                        href={`${href}#compatibilite`}
                        className="jm-tap flex items-center gap-1 text-[11px] font-semibold text-[#14745F] hover:underline"
                      >
                        <Icon name="eye" className="size-3.5" />
                        {tr("common.why")}
                        <span className="sr-only">{job.title}</span>
                      </Link>
                    </div>
                  ) : null}
                  <div className="mt-auto flex gap-2 pt-1">
                    <form action={toggleSaveAction} className={job.open ? "" : "flex-1"}>
                      <input type="hidden" name="job" value={job.slug} />
                      <input type="hidden" name="back" value="/app/jobs/enregistrees" />
                      <button
                        type="submit"
                        aria-label={`${t("remove")} · ${job.title}`}
                        className={pillClass("outline", "sm", "w-full")}
                      >
                        {t("remove")}
                      </button>
                    </form>
                    {job.open && (
                      <Link
                        href={`${href}?postuler=1`}
                        className={pillClass("dark", "sm", "flex-1")}
                      >
                        {t("apply")}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
