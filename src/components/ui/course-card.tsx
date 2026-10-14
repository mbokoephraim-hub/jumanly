/* eslint-disable @next/next/no-img-element -- course covers come from S3 storage at a known size */
import { Icon } from "@/components/brand/icon";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "./badge";

/**
 * Catalog course card (mockup 00-03): a Menthe claire cover with the brand pattern, the Learn
 * icon on a white tile, then category, plan, title and facts. `plan` is the plan name read from
 * the database, if the course is not free.
 */
export function CourseCard({
  title,
  href,
  level,
  lessons,
  duration,
  certificate = false,
  plan,
  category,
  image,
  status,
}: {
  title: string;
  href: string;
  level: string;
  lessons: number;
  duration: string;
  certificate?: boolean;
  plan?: string;
  /** Course domain as stored in the catalog (« Marketing digital »). */
  category?: string;
  image?: string;
  /** Extra line under the facts: progress, lock (signed-in catalog). */
  status?: ReactNode;
}) {
  const t = useTranslations("trainings.card");
  return (
    <article className="group relative flex flex-col gap-3 rounded-box bg-blanc p-3 pb-4">
      <div className="relative h-[150px] overflow-hidden rounded-md bg-menthe-claire">
        {image ? (
          <img src={image} alt={t("imageAlt", { title })} className="size-full object-cover" />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[url(/marque/motifs/motif-reseau-clair.svg)] bg-[length:360px] opacity-80 mix-blend-multiply"
          />
        )}
        <span
          aria-hidden
          className="absolute bottom-3.5 left-3.5 flex size-[46px] items-center justify-center rounded-sm bg-blanc text-sapin"
        >
          <Icon name="learn" className="size-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] leading-[15px] font-semibold text-feuille-fonce">
            {category ?? t("level", { level })}
          </span>
          <Badge tone={plan ? "new" : "learn"}>
            {plan ? t("badge.plan", { plan }) : t("badge.free")}
          </Badge>
        </div>
        <h3 className="min-h-[42px] text-[15px] leading-[21px] font-semibold">
          {/* The whole card is clickable; the link stays the only focusable element. */}
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <ul className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-[15px] text-ardoise">
          {category && <li>{t("level", { level })}</li>}
          <li className="flex items-center gap-1">
            <Icon name="cours-video" className="size-3.5" />
            {t("lessons", { count: lessons })}
          </li>
          <li className="flex items-center gap-1">
            <Icon name="horloge" className="size-3.5" />
            {t("duration", { duration })}
          </li>
          {certificate && (
            <li className="flex items-center gap-1">
              <Icon name="certificat" className="size-3.5" />
              {t("certificate")}
            </li>
          )}
        </ul>
        {status && <div className="relative z-10 mt-1">{status}</div>}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-box ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}

/**
 * Course in progress on its module tint (mockup 00-03): category tag, title, lesson progress
 * and the action to resume. Texts come from the caller.
 */
export function CourseProgressCard({
  title,
  category,
  progressLabel,
  progressValue,
  percent,
  action,
  tone = "learn",
  people,
}: {
  title: string;
  category: string;
  /** « Progression » */
  progressLabel: string;
  /** « 14/20 leçons » */
  progressValue: string;
  percent: number;
  /** Usually a small Sapin ButtonLink « Reprendre ». */
  action: ReactNode;
  tone?: "learn" | "career" | "jobs";
  /** Optional avatar stack of learners. */
  people?: ReactNode;
}) {
  const tint = { learn: "bg-lime", career: "bg-neon", jobs: "bg-menthe-claire" }[tone];
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <article className={`flex flex-col gap-3 rounded-box px-5 py-[18px] text-sapin ${tint}`}>
      <div>
        <Badge tone="sapin">{category}</Badge>
      </div>
      <h3 className="min-h-[46px] text-[17px] leading-[23px] font-semibold">{title}</h3>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs leading-[17px]">
          <span>{progressLabel}</span>
          <span className="font-semibold">{progressValue}</span>
        </div>
        <div
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
          className="h-2 overflow-hidden rounded-pill bg-sapin/14"
        >
          <div className="h-full rounded-pill bg-sapin" style={{ width: `${clamped}%` }} />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        {people ?? <span />}
        {action}
      </div>
    </article>
  );
}
