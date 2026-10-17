import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { CompanyLogo } from "@/components/ui";
import { dynamic, type DynamicTranslator } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatRelative } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import type { MatchExplanation } from "@/server/matching/types";
import { SaveJobButton } from "./save-job-button";
import { contractFilterOf, remoteFilterOf, type PublicJobSummary } from "@/server/services/jobs";

/** Shared pieces of the signed-in Jobs pages (mockups 03-16 to 03-20). */

export const tag =
  "inline-flex h-6 shrink-0 items-center gap-[5px] rounded-pill px-2.5 text-[11px] font-semibold whitespace-nowrap";
export const tagTone = {
  brume: "bg-brume text-sapin",
  neon: "bg-neon text-sapin",
  menthe: "bg-menthe-clair text-[#0B5E49]",
  sapin: "bg-sapin text-neon",
  ambre: "bg-[#FCEBC6] text-[#8A5A00]",
  lime: "bg-lime-clair text-sapin",
} as const;

/** Filter button of the filter row (38 px, visible ring and an arrow; Sapin when on). */
export const chip =
  "inline-flex h-[38px] shrink-0 cursor-pointer list-none items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap shadow-[0_1px_2px_rgb(11_26_31/0.05)] transition-colors [&::-webkit-details-marker]:hidden";
export const chipOff =
  "bg-blanc text-sapin ring-[1.5px] ring-sapin/20 ring-inset hover:bg-lime-clair hover:ring-sapin/45";
export const chipOn = "bg-sapin text-blanc";

const NEW_DAYS = 3;
const CLOSING_DAYS = 7;

export function salaryText(
  t: DynamicTranslator,
  job: { salaryMin: number | null; salaryMax: number | null },
) {
  if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMax !== job.salaryMin) {
    return t("talent.jobs.card.salary.text", {
      min: formatUsd(job.salaryMin),
      max: formatUsd(job.salaryMax),
      currency: "USD",
    });
  }
  const single = job.salaryMin ?? job.salaryMax;
  return single !== null
    ? t("talent.jobs.card.salary.single", { amount: formatUsd(single), currency: "USD" })
    : t("talent.jobs.card.salary.undisclosed");
}

/** "Il y a 2 jours": relative date with its first letter in capitals. */
export function relativeLabel(date: Date, now: Date) {
  const text = formatRelative(date, now);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export type CardMatch =
  | { state: "ok"; explanation: MatchExplanation }
  | { state: "incomplete" | "optedOut" | "pending" }
  | undefined;

/**
 * Offer card of the signed-in search (mockup 03-16): company tile, title with « Nouveau » and the
 * verified company, facts in Brume, the application or closing state; on the right, the score on the
 * AI gradient with its « Pourquoi ? », the date and the save button. A low score never blocks.
 */
export async function TalentJobCard({
  job,
  now,
  match,
  applied,
  saved,
  back,
  selected = false,
}: {
  job: PublicJobSummary;
  now: Date;
  match: CardMatch;
  applied: boolean;
  saved: boolean;
  back: string;
  selected?: boolean;
}) {
  const t = await getTranslations();
  const href = `/app/jobs/${job.slug}`;
  const isNew =
    job.publishedAt !== null && now.getTime() - job.publishedAt.getTime() < NEW_DAYS * 86_400_000;
  const closingSoon =
    job.closesAt !== null && job.closesAt.getTime() - now.getTime() < CLOSING_DAYS * 86_400_000;
  const verified = job.organization.verifiedAt !== null;
  const posted = job.publishedAt ? relativeLabel(job.publishedAt, now) : null;
  const location = t("talent.jobs.card.location", {
    city: job.city,
    workMode: t(`jobs.card.remote.${remoteFilterOf(job.remote)}`),
  });
  const contract = t(`jobs.search.contract.${contractFilterOf(job.contractType)}`);
  const salary = salaryText(dynamic(t), job);
  const ok = match?.state === "ok" ? match.explanation : null;
  const score = ok ? (
    <span
      className={cx(tag, "h-[26px] bg-gradient-ai text-blanc")}
      aria-label={t("talent.jobs.card.compatibility.aria", {
        score: Math.round(ok.score),
        band: t(`match.band.${ok.band}.text`),
      })}
    >
      <Icon name="intelligence" className="size-3 text-neon" />
      {t("talent.jobs.card.compatibility.text", { score: Math.round(ok.score) })}
    </span>
  ) : null;
  const why = ok ? (
    <Link
      href={`${href}#compatibilite`}
      className="jm-tap relative z-10 flex items-center gap-1 text-[11px] leading-[15px] font-semibold whitespace-nowrap text-[#14745F] hover:underline"
    >
      <Icon name="eye" className="size-3.5" />
      {t("common.why")}
      <span className="sr-only">{job.title}</span>
    </Link>
  ) : null;
  const save = (
    <SaveJobButton
      slug={job.slug}
      saved={saved}
      back={back}
      name={job.title}
      labels={{
        save: t("talent.jobs.card.save"),
        unsave: t("talent.jobs.card.unsave"),
        saved: t("talent.jobs.card.saved.toast"),
        removed: t("talent.jobs.card.unsaved.toast"),
        undo: t("common.cancel"),
      }}
      className="flex size-11 items-center justify-center rounded-full text-sapin hover:bg-creme lg:size-8"
    />
  );

  return (
    <article
      className={cx(
        "group relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-3 rounded-[24px] bg-blanc px-4 py-4 lg:flex lg:gap-4 lg:px-5 lg:py-[18px]",
        selected && "ring-2 ring-sapin",
      )}
    >
      <CompanyLogo
        name={job.organization.name}
        size="md"
        className="size-11! rounded-[14px]! text-base! lg:size-[52px]! lg:rounded-[16px]! lg:text-lg!"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <h3 className="text-[15px] leading-5 font-semibold tracking-[-0.01em] lg:text-base lg:leading-[22px]">
              <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
                {job.title}
              </Link>
            </h3>
            {isNew && (
              <span className={cx(tag, tagTone.neon, "max-lg:hidden")}>
                {t("talent.jobs.card.new")}
              </span>
            )}
            {verified && (
              <span className={cx(tag, tagTone.menthe, "max-lg:hidden")}>
                <Icon name="check" className="size-3" />
                {t("talent.jobs.card.verified")}
              </span>
            )}
          </div>
          <div className="-mt-1 -mr-1 lg:hidden">{save}</div>
        </div>
        <p className="text-xs leading-[17px] text-ardoise">
          {job.organization.name}
          {posted && (
            <>
              <span aria-hidden className="mx-1 lg:hidden">
                {"·"}
              </span>
              <span className="lg:hidden">{posted}</span>
            </>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {isNew && (
            <span className={cx(tag, tagTone.neon, "lg:hidden")}>{t("talent.jobs.card.new")}</span>
          )}
          <span className={cx(tag, tagTone.brume)}>
            <Icon name="localisation" className="hidden size-3 lg:block" />
            {location}
          </span>
          <span className={cx(tag, tagTone.brume)}>{contract}</span>
          <span className={cx(tag, tagTone.brume, "max-lg:hidden")}>
            <Icon name="portefeuille" className="size-3" />
            {salary}
          </span>
          {applied && (
            <span className={cx(tag, tagTone.sapin)}>
              <Icon name="check" className="size-3" />
              {t("talent.jobs.card.applied")}
            </span>
          )}
          {closingSoon && job.closesAt && (
            <span className={cx(tag, tagTone.ambre)}>
              <Icon name="horloge" className="hidden size-3 lg:block" />
              {t("talent.jobs.card.closingIn", { time: formatRelative(job.closesAt, now) })}
            </span>
          )}
        </div>
      </div>
      {/* Phone: salary and score on one line, the band and « Pourquoi ? » under it. */}
      <div className="col-span-2 mt-3 flex items-center justify-between gap-2 lg:hidden">
        <span className="text-sm font-semibold">{salary}</span>
        {score}
      </div>
      {ok && (
        <div className="col-span-2 mt-2 flex items-center justify-between gap-2 lg:hidden">
          <span className="text-xs text-ardoise">{t(`match.band.${ok.band}.text`)}</span>
          {why}
        </div>
      )}
      <div className="hidden shrink-0 flex-col items-end gap-1.5 lg:flex">
        {score}
        {why}
        {posted && <span className="text-[11px] leading-[15px] text-ardoise">{posted}</span>}
        {save}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[24px] ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}

/**
 * Filter menus of the search. The chips scroll sideways in a rail, which would clip a dropdown:
 * each chip is a `<details>` with only its summary, and its menu is drawn under the rail, shown
 * while that chip is open (`:has`). One menu at a time (`name`). Classes are written out in full so
 * that Tailwind sees them.
 */
export const filterMenus = {
  contrat: "group-has-[#jf-contrat[open]]/filters:flex",
  teletravail: "group-has-[#jf-teletravail[open]]/filters:flex",
  experience: "group-has-[#jf-experience[open]]/filters:flex",
  salaire: "group-has-[#jf-salaire[open]]/filters:flex",
  publie: "group-has-[#jf-publie[open]]/filters:flex",
  compat: "group-has-[#jf-compat[open]]/filters:flex",
} as const;

export type FilterMenuKey = keyof typeof filterMenus;

export function FilterChipToggle({
  menu,
  label,
  active,
  icon,
  open,
  children,
}: {
  menu: FilterMenuKey | "all";
  /** Opened from the « Filtres » button of the search bar (`?filtres=1`). */
  open?: boolean;
  label: ReactNode;
  active?: boolean;
  icon?: ReactNode;
  /** Content drawn by the `<details>` itself (the full filter panel, outside the rail). */
  children?: ReactNode;
}) {
  return (
    <details id={`jf-${menu}`} name="jobs-filter" open={open} className="shrink-0">
      <summary
        className={cx(
          chip,
          active ? chipOn : icon ? "bg-brume text-sapin hover:bg-lime-clair" : chipOff,
        )}
      >
        {icon}
        {active && !icon && <Icon name="check" className="size-3.5 text-lime" />}
        {label}
        {!icon && <Icon name="chev-d" className="size-3.5" />}
      </summary>
      {children}
    </details>
  );
}

/** Menu of one filter chip: links, the current one ticked. */
export function FilterMenu({
  menu,
  items,
}: {
  menu: FilterMenuKey;
  items: { label: string; href: string; current: boolean }[];
}) {
  return (
    <ul
      className={cx(
        "absolute top-12 left-0 z-30 hidden min-w-56 flex-col gap-0.5 rounded-[18px] bg-blanc p-1.5 text-sm shadow-menu ring-1 ring-sapin/8",
        filterMenus[menu],
      )}
    >
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.current ? "true" : undefined}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-creme"
          >
            {item.label}
            {item.current && <Icon name="check" className="size-4 text-feuille-fonce" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Small dot + label + count line (applications follow-up). */
export function CountLine({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <span aria-hidden className={cx("size-2 shrink-0 rounded-full", dot)} />
      <span className="flex-1">{label}</span>
      <span className="text-[15px] font-semibold">{value}</span>
    </div>
  );
}
