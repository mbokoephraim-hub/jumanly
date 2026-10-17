import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";
import { CompanyLogo } from "@/components/ui/avatar";
import { cx } from "@/lib/cx";
import { OrgBanner } from "./org-banner";

/** The save button over the banner (`.fav` of screen 63). */
export const jobCardSaveClass =
  "jm-job-save flex size-[38px] items-center justify-center rounded-full bg-blanc/92 text-sapin hover:bg-blanc";

/** Fact of a job card (`.chip` of the mockups): place, contract, work mode. */
const cardChip =
  "jm-job-chip inline-flex min-h-7 items-center gap-[5px] rounded-pill bg-[#F6F3EE] px-2.5 text-[12px] whitespace-nowrap text-sapin";
const chipTones = { new: "bg-neon", applied: "bg-sapin text-neon" } as const;

export type JobCardChip = { label: string; icon?: IconName; tone?: keyof typeof chipTones };

/**
 * Offer card with the company's banner (V6 § B9, screens 63 and 66): the banner (or the Jumanly
 * pattern), the logo over its edge, the company with its verified mark, the title, the facts, then
 * the date and « Voir l'offre ». Texts come already translated: the card also serves the live
 * preview of the job editor.
 */
export function JobBannerCard({
  href,
  title,
  company,
  verified,
  banner,
  logo,
  chips,
  score,
  when,
  closingSoon = false,
  cta,
  save,
  selected = false,
}: {
  /** Null in a preview: nothing to open yet. */
  href: string | null;
  title: string;
  company: string;
  /** Label of the verified mark, null when the company is not verified. */
  verified: string | null;
  banner?: string | null;
  logo?: string | null;
  chips: JobCardChip[];
  score?: { text: string; aria: string; why: string } | null;
  when: string | null;
  closingSoon?: boolean;
  cta: string;
  save?: ReactNode;
  selected?: boolean;
}) {
  return (
    <article
      className={cx(
        "jm-job-card group relative flex flex-col overflow-hidden rounded-[24px] bg-blanc shadow-carte",
        selected && "ring-2 ring-sapin",
      )}
    >
      <OrgBanner src={banner} className="h-24" />
      {save && <div className="absolute top-2.5 right-2.5 z-10">{save}</div>}
      <div className="relative flex flex-col gap-1.5 px-4 pt-[30px] pb-3">
        <CompanyLogo
          name={company}
          src={logo}
          size="lg"
          className="jm-job-logo absolute! -top-[26px] left-4 size-[52px]! rounded-[16px]! border-[3px] border-blanc text-[15px]!"
        />
        <p className="jm-job-company inline-flex items-center gap-[5px] text-[12.5px] font-medium text-ardoise">
          {company}
          {verified && (
            <span
              role="img"
              aria-label={verified}
              className="grid size-3.5 place-items-center rounded-full bg-[#14745F] text-blanc"
            >
              <Icon name="check" className="size-2.5" />
            </span>
          )}
        </p>
        <h3 className="text-[16px] leading-snug font-bold tracking-[-0.01em]">
          {href ? (
            // The whole card opens the offer; the link stays the only focusable element.
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span key={chip.label} className={cx(cardChip, chip.tone && chipTones[chip.tone])}>
              {chip.icon && <Icon name={chip.icon} className="size-[13px]" />}
              {chip.label}
            </span>
          ))}
          {score && (
            <span
              className={cx(cardChip, "bg-gradient-ai font-semibold text-blanc!")}
              aria-label={score.aria}
            >
              <Icon name="intelligence" className="size-3 text-neon" />
              {score.text}
            </span>
          )}
        </div>
        <div className="jm-job-foot mt-1 flex items-center justify-between gap-2 border-t border-sapin/7 pt-2.5 text-[12px]">
          <span
            className={cx(
              "jm-job-when text-ardoise",
              closingSoon && "jm-job-closing font-semibold text-[#8A5A00]",
            )}
          >
            {when}
          </span>
          <span className="flex items-center gap-3">
            {score && href && (
              <Link
                href={`${href}#compatibilite`}
                className="jm-tap jm-job-why relative z-10 flex min-h-8 items-center gap-1 font-semibold text-[#14745F] hover:underline"
              >
                <Icon name="eye" className="size-3.5" />
                {score.why}
                <span className="sr-only">{title}</span>
              </Link>
            )}
            <span
              aria-hidden
              className="jm-job-cta flex items-center gap-[3px] text-[13px] font-semibold"
            >
              {cta}
              <Icon name="chev-r" className="size-4" />
            </span>
          </span>
        </div>
      </div>
      {href && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px] ring-sapin group-focus-within:ring-2 group-hover:ring-2"
        />
      )}
    </article>
  );
}
