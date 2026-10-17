import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AiBrand, AiPanel, ScoreRing, pillClass } from "@/components/career/kit";
import { CopyButton } from "@/components/career/copy-button";
import { ReportForm } from "@/components/connect/report-form";
import { relativeLabel, salaryText, tag, tagTone } from "@/components/jobs/talent-kit";
import { DisputePanel } from "@/components/matching/dispute-panel";
import { TalentWhy, criterionText } from "@/components/matching/talent-why";
import { AppPageHeader } from "@/components/app/page-header";
import { Alert, CompanyLogo } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { formatDate, formatRelative } from "@/lib/dates";
import { ApplyFlow } from "@/components/jobs/apply-flow";
import { getApplicationDraft, applyStepOf } from "@/server/services/application-draft";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { gapCourses, matchForUser, type MatchState } from "@/server/matching/service";
import { getJob } from "@/server/queries/public";
import {
  contractFilterOf,
  openJobWhere,
  parseCriteria,
  remoteFilterOf,
} from "@/server/services/jobs";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";
import { listPublicPlans, planForCatalogLevel } from "@/server/services/plans";

export async function generateMetadata({
  params,
}: PageProps<"/app/jobs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("talent.jobs.detail");
  const data = await getJob(slug);
  return {
    title: { absolute: t("seo", { jobTitle: data?.job.title ?? "" }) },
    robots: { index: false },
  };
}

const NEW_DAYS = 3;
const card = "rounded-[24px] bg-blanc p-5 lg:p-6";
const h2 = "text-[17px] leading-6 font-semibold tracking-[-0.01em] lg:text-lg";

/** A section of the offer that folds (screen 08); the summary carries the section title. */
function Fold({ title, open, children }: { title: string; open: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group border-b border-brume last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h2 className={h2}>{title}</h2>
        <Icon
          name="chev-d"
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-3 pb-5">{children}</div>
    </details>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[13.5px] leading-5">
          <span
            aria-hidden
            className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille-fonce"
          >
            <Icon name="check" className="size-3" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-creme px-3.5 py-3 lg:bg-creme">
      <dt className="flex items-center gap-1.5 text-[11px] text-ardoise">
        <Icon name={icon} className="size-3.5" />
        {label}
      </dt>
      <dd className="text-[13px] leading-[18px] font-semibold">{value}</dd>
    </div>
  );
}

/**
 * A job seen by a signed-in talent (mockups 03-17 and 03-18). The page shows the offer and its
 * explained compatibility; `?postuler=1` shows the application form. Applying is free: no
 * entitlement, no quota, no plan is checked here or in the action (golden rule n° 1), and the
 * knockout criteria are information, never a block.
 */
export default async function TalentJobPage({
  params,
  searchParams,
}: PageProps<"/app/jobs/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/jobs/${slug}`);
  const data = await getJob(slug);
  if (!data) notFound();
  const { job, open, similar, now } = data;
  const t = await getTranslations();
  const d = dynamic(t);
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      documents: {
        where: { kind: "cv" },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, isPrimary: true, updatedAt: true },
      },
      headline: true,
    },
  });
  const jobRow = await db.job.findUnique({
    where: { slug },
    select: { id: true, organizationId: true, createdBy: { select: { name: true } } },
  });
  const [application, saved, applicants, otherJobs] = jobRow
    ? await Promise.all([
        profile
          ? db.application.findUnique({
              where: { jobId_profileId: { jobId: jobRow.id, profileId: profile.id } },
              select: { id: true, createdAt: true },
            })
          : null,
        db.savedJob.findUnique({
          where: { userId_jobId: { userId: user.id, jobId: jobRow.id } },
        }),
        db.application.count({ where: { jobId: jobRow.id } }),
        db.job.count({
          where: {
            AND: [
              openJobWhere(now),
              { organizationId: jobRow.organizationId },
              { id: { not: jobRow.id } },
            ],
          },
        }),
      ])
    : [null, null, 0, 0];
  const match: MatchState | null = jobRow ? await matchForUser(db, user.id, jobRow.id) : null;
  const [gaps, catalogLevel, plans, dispute] =
    match?.state === "ok" && jobRow
      ? await Promise.all([
          gapCourses(db, user.id, jobRow.id),
          catalogLevelOf(db, user.id),
          listPublicPlans(db),
          db.matchDispute.findFirst({
            where: { userId: user.id, jobId: jobRow.id },
            orderBy: { createdAt: "desc" },
            select: { status: true, scoreBefore: true, scoreAfter: true, resolution: true },
          }),
        ])
      : [[], "free", [], null];
  const courseAccess = (requiredLevel: string) => ({
    open: opensCourse(catalogLevel, requiredLevel),
    plan: planForCatalogLevel(plans, requiredLevel)?.name ?? null,
  });
  const company = job.organization.name;
  const criteria = parseCriteria(job.knockoutCriteria);
  const cvs = profile?.documents ?? [];
  const mySkills = new Set(profile?.skills.map((skill) => skill.skillId));
  const salary = salaryText(d, job);
  const outcome = typeof query.candidature === "string" ? query.candidature : undefined;
  const applying = query.postuler === "1" && open && !application;
  const ok = match?.state === "ok" ? match.explanation : null;
  const isNew =
    job.publishedAt !== null && now.getTime() - job.publishedAt.getTime() < NEW_DAYS * 86_400_000;
  const workMode = t(`jobs.card.remote.${remoteFilterOf(job.remote)}`);
  const contract = t(`jobs.search.contract.${contractFilterOf(job.contractType)}`);
  const firstGap = gaps.find((gap) => gap.courses.length > 0);
  const scoreTag = ok && (
    <span className={cx(tag, "bg-gradient-ai text-blanc")}>
      <Icon name="intelligence" className="size-3 text-neon" />
      {t("talent.jobs.card.compatibility.text", { score: Math.round(ok.score) })}
    </span>
  );
  const saveForm = (className: string, withLabel: boolean) => (
    <SaveJobButton
      slug={job.slug}
      saved={Boolean(saved)}
      back={`/app/jobs/${job.slug}`}
      showLabel={withLabel}
      iconClassName="size-4"
      className={className}
      labels={{
        save: withLabel ? t("talent.jobs.detail.save") : t("talent.jobs.card.save"),
        unsave: t("talent.jobs.card.unsave"),
        saved: t("talent.jobs.card.saved.toast"),
        removed: t("talent.jobs.card.unsaved.toast"),
        undo: t("common.cancel"),
      }}
    />
  );

  // ─── After sending (screen 11): shown only once the server has recorded the application. ───
  if (outcome === "envoyee" && application) {
    const tf = await getTranslations("talent.jobs.apply.flow");
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 pt-6 pb-6 text-center">
        <span
          aria-hidden
          className="grid size-28 place-items-center rounded-full bg-lime-clair ring-[10px] ring-lime-clair/60"
        >
          <span className="grid size-20 place-items-center rounded-full bg-lime text-sapin">
            <Icon name="check" className="size-9" />
          </span>
        </span>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">
          {t("talent.jobs.apply.success.title")}
        </h1>
        <p className="text-[15px] text-ardoise">{tf("sent.received", { company })}</p>
        <ul className="flex w-full flex-col overflow-hidden rounded-[22px] bg-blanc text-left shadow-douce">
          {(
            [
              [
                "/app/jobs/candidatures",
                "suivi",
                "bg-lime",
                tf("sent.track"),
                tf("sent.trackLine"),
              ],
              [
                "/app/career/entretiens",
                "message",
                "bg-lime-clair",
                tf("sent.prepare"),
                tf("sent.prepareLine"),
              ],
            ] as const
          ).map(([href, icon, tone, title, line]) => (
            <li key={href} className="border-b border-brume last:border-b-0">
              <Link
                href={href}
                className="jm-press flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-creme"
              >
                <span
                  aria-hidden
                  className={cx("grid size-11 shrink-0 place-items-center rounded-[13px]", tone)}
                >
                  <Icon name={icon} className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{title}</span>
                  <span className="text-[13px] text-ardoise">{line}</span>
                </span>
                <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/app/jobs"
          className="jm-press flex min-h-12 w-full items-center justify-center rounded-pill bg-blanc text-[15px] font-semibold shadow-douce"
        >
          {tf("sent.explore")}
        </Link>
      </div>
    );
  }

  // ─── The staged application (screens 09-12). ─────────────────────────────────────────────
  if (applying && jobRow) {
    const draft = await getApplicationDraft(db, user.id, jobRow.id);
    const step = applyStepOf(query.etape ?? draft?.step);
    return (
      <ApplyFlow
        job={{ slug: job.slug, title: job.title }}
        company={company}
        step={step}
        draft={draft}
        cvs={cvs}
        person={{
          name: user.name,
          image: user.image ?? undefined,
          email: user.email,
          headline: profile?.headline ?? null,
          city: user.city ?? null,
          skills: profile?.skills.map((entry) => entry.skill.name) ?? [],
        }}
      />
    );
  }

  const draft =
    jobRow && open && !application ? await getApplicationDraft(db, user.id, jobRow.id) : null;

  // ─── The offer. ─────────────────────────────────────────────────────────────────────
  const applyBlock = application ? (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <p className="text-xs font-semibold text-feuille-fonce">
        {t("talent.jobs.detail.applied.text", { date: application.createdAt })}
      </p>
      <Link href="/app/jobs/candidatures" className={pillClass("dark", "md")}>
        {t("talent.jobs.detail.applied.track")}
      </Link>
    </div>
  ) : open ? (
    <Link
      href={`/app/jobs/${job.slug}?postuler=1`}
      className={pillClass("lime", "md", "h-12 px-6")}
    >
      {draft ? t("talent.jobs.apply.flow.resume") : t("talent.jobs.detail.apply")}
      <Icon name="chev-r" className="size-4" />
    </Link>
  ) : null;

  return (
    <div className="flex flex-col gap-5 pb-40 lg:pb-0">
      <AppPageHeader
        eyebrow={
          <Link href="/app/jobs" className="inline-flex items-center gap-1 hover:underline">
            <Icon name="chev-l" className="size-3.5" />
            {t("talent.jobs.detail.backToJobs")}
          </Link>
        }
        title={t("talent.jobs.detail.eyebrow")}
        titleAs="p"
      />
      {outcome === "deja" && <Alert tone="info" title={t("talent.jobs.apply.already")} />}
      {query.brouillon === "1" && draft && (
        <Alert tone="info" title={t("talent.jobs.apply.flow.kept")} />
      )}
      {(outcome === "close" || !open) && (
        <Alert tone="warning" title={t("talent.jobs.detail.closed")} />
      )}

      <header
        className={cx(
          card,
          "relative flex flex-col items-center gap-4 overflow-hidden text-center lg:flex-row lg:items-center lg:text-left",
        )}
      >
        <CompanyLogo
          name={company}
          size="lg"
          className="size-14! rounded-[16px]! text-lg! lg:size-16! lg:rounded-[18px]! lg:text-xl!"
        />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 lg:items-start">
          <div className="flex flex-wrap justify-center gap-2">
            {isNew && <span className={cx(tag, tagTone.neon)}>{t("talent.jobs.card.new")}</span>}
            {job.organization.verifiedAt && (
              <span className={cx(tag, tagTone.menthe)}>
                <Icon name="check" className="size-3" />
                {t("talent.jobs.card.verified")}
              </span>
            )}
            <span className="max-lg:hidden">{scoreTag}</span>
          </div>
          <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[28px] lg:leading-[34px]">
            {job.title}
          </h1>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ardoise lg:justify-start">
            <strong className="font-semibold text-sapin">{company}</strong>
            <span className="flex items-center gap-1">
              <Icon name="localisation" className="size-3.5" />
              {t("talent.jobs.card.location", { city: job.city, workMode })}
            </span>
            {job.publishedAt && (
              <span className="flex items-center gap-1">
                <Icon name="horloge" className="size-3.5" />
                {t("talent.jobs.detail.publishedAgo", {
                  time: formatRelative(job.publishedAt, now),
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Icon name="equipe" className="size-3.5" />
              {t("talent.jobs.detail.applicants", { count: applicants })}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <CopyButton
            value={`${siteUrl()}/offres/${job.slug}`}
            label={t("talent.jobs.detail.share")}
            copiedLabel={t("job.cta.shareCopied")}
            icon={<Icon name="partager" className="size-4" />}
            className={pillClass("outline", "sm", "h-10")}
          />
          {jobRow && saveForm(cx(pillClass("outline", "sm", "h-10"), "max-lg:hidden"), true)}
          <span className="max-lg:hidden">{applyBlock}</span>
        </div>
      </header>

      {open && !application && cvs[0] && (
        <Link
          href={`/app/career/cv/${cvs[0].id}#adapter`}
          className="jm-press flex min-h-16 items-center gap-3 rounded-[22px] bg-lime-clair px-4 py-3"
        >
          <Icon name="doc" className="size-5 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{t("talent.jobs.detail.tailor.text")}</span>
            <span className="text-[13px] text-ardoise">{t("talent.jobs.detail.tailor.line")}</span>
          </span>
          <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
        </Link>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {ok && (
            <AiPanel className="lg:hidden">
              <AiBrand />
              <div className="flex items-center gap-4">
                <ScoreRing
                  value={ok.score}
                  label={t("ui.percent", { value: Math.round(ok.score) })}
                  size={72}
                  dark
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-[15px] font-semibold">
                    {t("match.score.valueWithBand", {
                      score: Math.round(ok.score),
                      band: t(`match.band.${ok.band}.text`),
                    })}
                  </p>
                  {gaps.length > 0 && (
                    <p className="text-xs text-blanc/80">
                      {t("talent.jobs.detail.compatibility.gap", {
                        skills: gaps.map((gap) => gap.skill).join(", "),
                      })}
                    </p>
                  )}
                  <a
                    href="#compatibilite"
                    className="jm-tap flex items-center gap-1 text-xs font-semibold text-neon"
                  >
                    <Icon name="eye" className="size-3.5" />
                    {t("common.why")}
                  </a>
                </div>
              </div>
            </AiPanel>
          )}

          <section className={cx(card, "flex flex-col gap-6")}>
            <dl className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              <Fact icon="doc" label={t("talent.jobs.detail.facts.contract")} value={contract} />
              <Fact
                icon="portefeuille"
                label={t("talent.jobs.detail.facts.salary")}
                value={salary}
              />
              <Fact
                icon="up"
                label={t("talent.jobs.detail.facts.experience.text")}
                value={t("talent.jobs.detail.facts.experience.min", { min: job.experienceMin })}
              />
              <Fact
                icon="localisation"
                label={t("talent.jobs.detail.facts.location")}
                value={t("talent.jobs.card.location", { city: job.city, workMode })}
              />
              {job.closesAt && (
                <Fact
                  icon="calendrier"
                  label={t("talent.jobs.detail.facts.deadline")}
                  value={formatDate(job.closesAt)}
                />
              )}
            </dl>

            <div className="flex flex-col">
              <Fold title={t("job.description.title")} open>
                <p className="text-[13.5px] leading-[21px] whitespace-pre-line">
                  {job.description}
                </p>
              </Fold>
              {job.responsibilities.length > 0 && (
                <Fold title={t("talent.jobs.detail.missions")} open>
                  <CheckList items={job.responsibilities} />
                </Fold>
              )}
              {job.requirements.length > 0 && (
                <Fold title={t("talent.jobs.detail.profile")} open={false}>
                  <CheckList items={job.requirements} />
                </Fold>
              )}
              {job.skills.length > 0 && (
                <Fold title={t("talent.jobs.detail.skills.title")} open>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {(["required", "preferred"] as const).map((importance) => {
                      const skills = job.skills.filter((skill) => skill.importance === importance);
                      return skills.length === 0 ? null : (
                        <div key={importance} className="flex flex-col gap-2.5">
                          <h3 className="text-[14px] font-semibold">
                            {t(`talent.jobs.detail.skills.${importance}`)}
                          </h3>
                          <ul className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <li
                                key={skill.skillId}
                                className={cx(
                                  tag,
                                  "h-7",
                                  importance === "required" ? "bg-lime text-sapin" : tagTone.brume,
                                )}
                              >
                                {mySkills.has(skill.skillId) && (
                                  <Icon name="check" className="size-3" />
                                )}
                                {skill.skill.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  {job.skills.some((skill) => mySkills.has(skill.skillId)) && (
                    <p className="text-xs text-ardoise">{t("talent.jobs.detail.skills.owned")}</p>
                  )}
                </Fold>
              )}
              {criteria.length > 0 && (
                <Fold title={t("talent.jobs.detail.knockout.text")} open>
                  <ul className="flex flex-wrap gap-1.5">
                    {criteria.map((criterion) => (
                      <li
                        key={criterion}
                        className={cx(
                          tag,
                          "h-auto min-h-6 py-1 whitespace-normal",
                          tagTone.lime,
                          "bg-[#F7F4D2]",
                        )}
                      >
                        <Icon name="check" className="size-3" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs leading-[17px] text-ardoise">
                    {t("talent.jobs.detail.knockout.hint")}
                  </p>
                </Fold>
              )}
              {job.benefits.length > 0 && (
                <Fold title={t("talent.jobs.detail.benefits")} open={false}>
                  <ul className="flex flex-wrap gap-2">
                    {job.benefits.map((benefit) => (
                      <li key={benefit} className={cx(tag, tagTone.brume, "h-7")}>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </Fold>
              )}
              {job.process.length > 0 && (
                <Fold title={t("talent.jobs.detail.process.text")} open={false}>
                  <ol className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                    {job.process.map((step, index) => (
                      <li
                        key={step}
                        className="flex items-center gap-2.5 rounded-[14px] text-[12.5px] font-medium lg:flex-1 lg:bg-creme lg:px-3 lg:py-2.5"
                      >
                        <span
                          className={cx(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            index === 0 ? "bg-lime" : "bg-creme lg:bg-blanc",
                          )}
                        >
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Fold>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brume pt-4 text-xs text-ardoise">
              <span className="flex items-center gap-2">
                <Icon name="check" className="size-3.5 text-feuille" />
                {t("talent.jobs.apply.free")}
              </span>
              <a href="#signaler" className="flex items-center gap-1.5 hover:text-sapin">
                <Icon name="securite" className="size-3.5" />
                {t("talent.jobs.detail.report")}
              </a>
            </div>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            {jobRow?.createdBy?.name && (
              <section className={cx(card, "flex items-start gap-3")}>
                <CompanyLogo
                  name={jobRow.createdBy.name}
                  size="md"
                  className="size-11! rounded-full! bg-sapin! text-lime!"
                />
                <div className="flex flex-col">
                  <p className="text-[11px] text-ardoise">
                    {t("talent.jobs.detail.recruiter.text")}
                  </p>
                  <p className="text-[14px] font-semibold">{jobRow.createdBy.name}</p>
                </div>
              </section>
            )}
            <section className={cx(card, "flex flex-col gap-3")}>
              <p className="text-[11px] font-semibold tracking-[0.09em] text-ardoise uppercase">
                {t("talent.jobs.detail.company.title")}
              </p>
              <div className="flex items-center gap-3">
                <CompanyLogo name={company} size="md" className="size-10! rounded-xl! text-sm!" />
                <div className="flex min-w-0 flex-col">
                  <p className="text-[14px] font-semibold">{company}</p>
                  {job.organization.sector && job.organization.size && (
                    <p className="text-[11px] text-ardoise">
                      {t("talent.jobs.detail.company.meta", {
                        sector: job.organization.sector,
                        size: job.organization.size,
                      })}
                    </p>
                  )}
                </div>
              </div>
              {job.organization.description && (
                <p className="line-clamp-3 text-xs leading-[18px] text-ardoise">
                  {job.organization.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/entreprises/${job.organization.slug}`}
                  className={pillClass("outline", "sm")}
                >
                  {t("talent.jobs.detail.company.see")}
                </Link>
                {otherJobs > 0 && (
                  <Link
                    href={`/app/jobs?q=${encodeURIComponent(company)}`}
                    className={pillClass("outline", "sm")}
                  >
                    {t("talent.jobs.detail.company.otherJobs", { count: otherJobs })}
                  </Link>
                )}
              </div>
            </section>
          </div>

          {similar.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={h2}>{t("talent.jobs.detail.similar")}</h2>
              <ul className="grid gap-3 sm:grid-cols-3">
                {similar.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/app/jobs/${item.slug}`}
                      className="flex h-full flex-col gap-2.5 rounded-[20px] bg-blanc p-4 hover:ring-2 hover:ring-sapin"
                    >
                      <span className="flex items-center gap-2.5">
                        <CompanyLogo
                          name={item.organization.name}
                          size="sm"
                          className="size-9! rounded-[10px]! text-xs!"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[13px] font-semibold">{item.title}</span>
                          <span className="truncate text-[11px] text-ardoise">
                            {item.organization.name}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-1.5">
                        <span className={cx(tag, tagTone.brume)}>
                          {t("talent.jobs.card.location", {
                            city: item.city,
                            workMode: t(`jobs.card.remote.${remoteFilterOf(item.remote)}`),
                          })}
                        </span>
                        <span className={cx(tag, tagTone.brume)}>
                          {t(`jobs.search.contract.${contractFilterOf(item.contractType)}`)}
                        </span>
                      </span>
                      {item.publishedAt && (
                        <span className="text-[11px] text-ardoise">
                          {relativeLabel(item.publishedAt, now)}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          {ok ? (
            <AiPanel className="max-lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <AiBrand />
                <a
                  href="#compatibilite"
                  className="jm-tap flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap text-neon hover:underline"
                >
                  <Icon name="eye" className="size-3.5" />
                  {t("common.why")}
                </a>
              </div>
              <div className="flex items-center gap-4">
                <ScoreRing
                  value={ok.score}
                  label={t("ui.percent", { value: Math.round(ok.score) })}
                  size={84}
                  dark
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-[11px] font-semibold tracking-[0.09em] text-neon uppercase">
                    {t("match.score.label")}
                  </p>
                  <p className="text-[15px] font-semibold">
                    {t("match.score.valueWithBand", {
                      score: Math.round(ok.score),
                      band: t(`match.band.${ok.band}.text`),
                    })}
                  </p>
                  <p className="text-[11px] text-blanc/70">
                    {t("talent.jobs.aiPanel.updated", {
                      time: formatRelative(new Date(ok.computedAt), now),
                    })}
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-semibold tracking-[0.09em] text-neon uppercase">
                {t("match.why.talent.breakdown")}
              </p>
              <ul className="flex flex-col gap-2.5">
                {ok.criteria.map((criterion) => {
                  const value = Math.round(criterion.value * 100);
                  return (
                    <li key={criterion.key} className="flex flex-col gap-1.5 text-[11.5px]">
                      <span className="flex justify-between gap-2">
                        <span>{d(`match.criterion.${criterionText[criterion.key]}.text`)}</span>
                        <span className="font-semibold">{t("ui.percent", { value })}</span>
                      </span>
                      <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-blanc/15">
                        <span
                          className="block h-full rounded-full bg-lime"
                          style={{ width: `${value}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
              {firstGap && (
                <div className="flex gap-3 rounded-[16px] bg-sapin/60 p-3.5 text-xs leading-[17px]">
                  <Icon name="objectif" className="mt-px size-4 shrink-0 text-lime" />
                  <p>
                    <strong>
                      {t("talent.jobs.detail.compatibility.gap", { skills: firstGap.skill })}
                    </strong>{" "}
                    {t("talent.jobs.detail.compatibility.course.text", {
                      courseTitle: firstGap.courses[0]!.title,
                      hours: Math.round(firstGap.courses[0]!.durationMinutes / 6) / 10,
                      newScore: firstGap.newScore,
                    })}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {firstGap && (
                  <Link
                    href={`/app/learn/${firstGap.courses[0]!.slug}`}
                    className={pillClass("lime", "sm")}
                  >
                    {t("talent.jobs.detail.compatibility.course.cta")}
                  </Link>
                )}
                <a href="#revision" className={pillClass("ghost", "sm")}>
                  {t("talent.jobs.applications.reportError")}
                </a>
              </div>
              <p className="text-[11px] leading-4 text-blanc/70">{t("match.why.talent.footer")}</p>
            </AiPanel>
          ) : (
            <AiPanel>
              <AiBrand />
              {match?.state === "optedOut" ? (
                <>
                  <p className="text-sm">{t("match.score.optedOut")}</p>
                  <Link
                    href="/app/parametres?onglet=confidentialite"
                    className="text-sm font-semibold text-neon underline"
                  >
                    {t("talent.jobs.detail.compatibility.optedOutCta")}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm">{t("match.score.unavailable")}</p>
                  <Link href="/app/profil" className="text-sm font-semibold text-neon underline">
                    {t("talent.jobs.detail.compatibility.incompleteCta")}
                  </Link>
                </>
              )}
            </AiPanel>
          )}
          {ok && (
            <>
              <section
                id="compatibilite"
                aria-label={t("talent.jobs.detail.compatibility.title")}
                className={cx(card, "scroll-mt-24")}
              >
                <TalentWhy
                  explanation={ok}
                  jobTitle={job.title}
                  gaps={gaps}
                  courseAccess={courseAccess}
                />
              </section>
              <DisputePanel
                jobSlug={job.slug}
                company={company}
                hasApplication={Boolean(application)}
                outcome={typeof query.revision === "string" ? query.revision : undefined}
                dispute={dispute}
              />
            </>
          )}
          {jobRow && (
            <section
              id="signaler"
              aria-labelledby="signaler-titre"
              className={cx(card, "flex scroll-mt-24 flex-col gap-2")}
            >
              <h2 id="signaler-titre" className="text-[15px] font-semibold">
                {t("report.title.job")}
              </h2>
              {query.signalement === "ok" && <Alert tone="success" title={t("report.success")} />}
              {query.signalement === "deja" && <Alert title={t("report.already")} />}
              <p className="text-xs text-ardoise">{t("job.safety.text")}</p>
              <details open={query.signaler === "1"}>
                <summary className="jm-tap cursor-pointer text-sm font-medium underline">
                  {t("job.cta.report")}
                </summary>
                <ReportForm
                  targetType="job"
                  targetId={jobRow.id}
                  back={`/app/jobs/${slug}#signaler`}
                />
              </details>
            </section>
          )}
        </aside>
      </div>

      {/* Phone: fixed action bar (save + apply). */}
      <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[22px] bg-blanc p-3 shadow-float lg:hidden">
        {jobRow &&
          saveForm(
            "flex size-12 items-center justify-center rounded-full ring-[1.5px] ring-brume ring-inset",
            false,
          )}
        <div className="flex-1 [&>a]:w-full">{applyBlock}</div>
      </div>
    </div>
  );
}
