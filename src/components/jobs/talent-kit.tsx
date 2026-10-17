import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import type { DynamicTranslator } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDayMonth, formatRelative } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import type { MatchExplanation } from "@/server/matching/types";
import { JobBannerCard, jobCardSaveClass } from "./job-banner-card";
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
 * Offer card of the signed-in search (V6 § B9, screen 63): the company's banner (or the Jumanly
 * pattern), its logo over it, its name with the verified mark, the title, the place and the
 * contract, then the date and « Voir l'offre ». The score and its « Pourquoi ? » show when there
 * is one; a low score never blocks.
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
  const when =
    closingSoon && job.closesAt
      ? t("talent.jobs.card.closesOn", { date: formatDayMonth(job.closesAt) })
      : posted;
  const contract = t(`jobs.search.contract.${contractFilterOf(job.contractType)}`);
  const workMode = t(`jobs.card.remote.${remoteFilterOf(job.remote)}`);
  const ok = match?.state === "ok" ? match.explanation : null;

  return (
    <JobBannerCard
      href={href}
      title={job.title}
      company={job.organization.name}
      verified={verified ? t("talent.jobs.card.verified") : null}
      banner={job.organization.banner}
      logo={job.organization.logo}
      chips={[
        ...(isNew ? [{ label: t("talent.jobs.card.new"), tone: "new" as const }] : []),
        { label: job.city, icon: "localisation" as const },
        { label: contract },
        { label: workMode },
        ...(applied
          ? [
              {
                label: t("talent.jobs.card.applied"),
                icon: "check" as const,
                tone: "applied" as const,
              },
            ]
          : []),
      ]}
      score={
        ok
          ? {
              text: t("talent.jobs.card.compatibility.text", { score: Math.round(ok.score) }),
              aria: t("talent.jobs.card.compatibility.aria", {
                score: Math.round(ok.score),
                band: t(`match.band.${ok.band}.text`),
              }),
              why: t("common.why"),
            }
          : null
      }
      when={when}
      closingSoon={closingSoon}
      cta={t("jobs.card.cta")}
      selected={selected}
      save={
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
          className={jobCardSaveClass}
        />
      }
    />
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
