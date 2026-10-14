/* eslint-disable @next/next/no-img-element -- course covers come from storage at a known size */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/brand/icon";
import { Badge, CompanyLogo } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { formatRelativeDays } from "@/lib/dates";
import { durationParts } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import type { CourseSummary } from "@/server/services/courses";
import { contractFilterOf, remoteFilterOf, type PublicJobSummary } from "@/server/services/jobs";
import { planForCatalogLevel, type PublicPlan } from "@/server/services/plans";

/**
 * Cards of the public site (mockup 01-01): the course card with a tinted cover and the public job
 * card with its « Postuler gratuitement » button. Both are fed by the database.
 */

// Cover tints and patterns, cycled along the list (Learn Lime, Career Néon, Jobs Menthe, Hire Brume).
const covers = [
  { tint: "bg-lime", pattern: "motif-points-clair" },
  { tint: "bg-neon", pattern: "motif-pastilles-clair" },
  { tint: "bg-menthe-claire", pattern: "motif-reseau-clair" },
  { tint: "bg-brume", pattern: "motif-trajectoires-clair" },
];

// Category icon on the cover: the catalog stores free text, so we match a few keywords.
const categoryIcons: [RegExp, IconName][] = [
  [/donn|data|ia\b|analy/i, "statistiques"],
  [/financ|money|compta/i, "mobile-money"],
  [/market|vente|commun|réseau/i, "partager"],
  [/entrepr|projet|gestion/i, "objectif"],
  [/langu|anglais/i, "langue"],
];

function categoryIcon(category: string | null): IconName {
  if (!category) return "learn";
  return categoryIcons.find(([pattern]) => pattern.test(category))?.[1] ?? "learn";
}

export function PublicCourseCard({
  course,
  plans,
  index = 0,
}: {
  course: CourseSummary;
  plans: PublicPlan[];
  /** Position in the list: picks the cover tint. */
  index?: number;
}) {
  const t = useTranslations();
  const cover = covers[index % covers.length];
  const plan = planForCatalogLevel(plans, course.requiredLevel);
  const duration = durationParts(course.durationMinutes);
  const byline = [
    course.instructor ? t("learn.card.instructor", { name: course.instructor }) : null,
    t("learn.card.modules", { count: course.moduleCount }),
  ].filter(Boolean);
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-box bg-blanc px-3 pt-3 pb-[18px]">
      <div className={cx("relative h-[150px] overflow-hidden rounded-md", cover.tint)}>
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt={t("trainings.card.imageAlt", { title: course.title })}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-80 mix-blend-multiply"
            style={{
              backgroundImage: `url(/marque/motifs/${cover.pattern}.svg)`,
              backgroundSize: "360px",
            }}
          />
        )}
        <span
          aria-hidden
          className="absolute bottom-3.5 left-3.5 flex size-[46px] items-center justify-center rounded-sm bg-blanc text-sapin"
        >
          <Icon name={categoryIcon(course.category)} className="size-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] leading-[15px] font-semibold text-feuille-fonce">
            {course.category ?? t(`trainings.filters.level.${course.level}`)}
          </span>
          {plan ? (
            <Badge tone="sapin">{t("trainings.card.badge.plan", { plan: plan.name })}</Badge>
          ) : (
            <Badge tone="lime">{t("trainings.card.badge.free")}</Badge>
          )}
        </div>
        <h3 className="min-h-11 text-base leading-[22px] font-semibold">
          {/* The whole card is clickable; the link stays the only focusable element. */}
          <Link
            href={`/formations/${course.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {course.title}
          </Link>
        </h3>
        <p className="text-[11px] leading-[15px] text-ardoise">{byline.join(" · ")}</p>
        <ul className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-[15px] text-ardoise">
          <li className="flex items-center gap-1">
            <Icon name="horloge" className="size-3.5" />
            {t(`ui.duration.${duration.key}`, duration.values)}
          </li>
          <li className="flex items-center gap-1">
            <Icon name="objectif" className="size-3.5" />
            {t(`trainings.filters.level.${course.level}`)}
          </li>
          {course.certificateEnabled && (
            <li className="flex items-center gap-1">
              <Icon name="certificat" className="size-3.5" />
              {t("trainings.card.certificate")}
            </li>
          )}
        </ul>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-box ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}

const NEW_DAYS = 3;

export function PublicJobCard({ job, now }: { job: PublicJobSummary; now: Date }) {
  const t = useTranslations();
  const href = `/offres/${job.slug}`;
  const isNew =
    job.publishedAt !== null && now.getTime() - job.publishedAt.getTime() < NEW_DAYS * 86_400_000;
  const salary =
    job.salaryMin !== null && job.salaryMax !== null
      ? t("ui.salary.range", { min: formatUsd(job.salaryMin), max: formatUsd(job.salaryMax) })
      : job.salaryMin !== null
        ? t("ui.salary.from", { min: formatUsd(job.salaryMin) })
        : null;
  const fact = "h-auto min-h-6 py-1 leading-[14px] whitespace-normal";
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-box bg-blanc p-[18px] lg:p-[22px]">
      <div className="flex items-start gap-3">
        <CompanyLogo
          name={job.organization.name}
          size="md"
          className="size-12! rounded-sm! text-base!"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-[15px] leading-5 font-semibold">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {job.title}
            </Link>
          </h3>
          <p className="text-xs leading-[17px] text-ardoise">{job.organization.name}</p>
        </div>
        {isNew && <Badge tone="new">{t("common.new")}</Badge>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral" icon={<Icon name="localisation" />} className={fact}>
          {t("jobs.card.location", { city: job.city, country: job.country })}
          <span aria-hidden>{"·"}</span>
          {t(`jobs.card.remote.${remoteFilterOf(job.remote)}`)}
        </Badge>
        <Badge tone="neutral">
          {t(`jobs.search.contract.${contractFilterOf(job.contractType)}`)}
        </Badge>
        {salary && (
          <Badge tone="neutral" icon={<Icon name="portefeuille" />} className={fact}>
            {salary}
          </Badge>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="flex min-w-0 flex-wrap items-center gap-x-1 text-[11px] leading-[15px] text-ardoise">
          {job.publishedAt && (
            <span>
              {t("jobs.card.published", { relativeDate: formatRelativeDays(job.publishedAt, now) })}
            </span>
          )}
          {job.publishedAt && job.organization.verifiedAt && <span aria-hidden>{"·"}</span>}
          {job.organization.verifiedAt && (
            <span className="inline-flex items-center gap-1">
              <Icon name="check" className="size-3.5 text-feuille-fonce" />
              {t("common.verifiedCompany")}
            </span>
          )}
        </p>
        {/* Visual cue only: the card link already leads to the offer, where one applies. */}
        <span aria-hidden className={buttonClasses({ variant: "secondary", size: "sm" })}>
          {t("common.applyFree")}
        </span>
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-box ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}
