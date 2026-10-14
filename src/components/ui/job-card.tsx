import { Icon } from "@/components/brand/icon";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CompanyLogo } from "./avatar";
import { Badge, ScoreBadge, VerifiedBadge, type MatchBand } from "./badge";

export type RemoteMode = "onsite" | "hybrid" | "full";

/**
 * Job card (mockup 00-03): company logo tile, title with « Nouveau », company, Brume facts, and
 * on the right the score, the publication date and the save action. The score is optional: it
 * only shows for a signed-in talent, on the AI gradient, and its « Pourquoi ? » lives on the job page.
 */
export function JobCard({
  title,
  href,
  company,
  city,
  country,
  remote,
  contract,
  deadline,
  published,
  verified = false,
  isNew = false,
  match,
  selected = false,
  aside,
}: {
  title: string;
  href: string;
  company: string;
  city: string;
  country: string;
  remote: RemoteMode;
  contract: string;
  /** Already formatted in the user's time zone. */
  deadline?: string;
  /** Relative publication date, already formatted ("il y a 2 jours"). */
  published?: string;
  verified?: boolean;
  isNew?: boolean;
  match?: { score: number; band: MatchBand };
  /** Selected card: 2 px Sapin border. */
  selected?: boolean;
  /** Extra control on the right (save button), drawn above the card link. */
  aside?: ReactNode;
}) {
  const t = useTranslations();
  return (
    // Container queries: the card adapts to its column (full-width list or narrow grid cell).
    <article
      className={`group @container relative rounded-box bg-blanc px-5 py-[18px] ${selected ? "ring-2 ring-sapin" : ""}`}
    >
      <div className="flex gap-4">
        <CompanyLogo name={company} size="lg" className="hidden @md:inline-flex" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h3">
              {/* The whole card is clickable; the link stays the only focusable element. */}
              <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
                {title}
              </Link>
            </h3>
            {isNew && <Badge tone="new">{t("common.new")}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm leading-5 text-ardoise">
            <span>{t("jobs.card.company", { company })}</span>
            {verified && <VerifiedBadge />}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Badge
              tone="neutral"
              icon={<Icon name="localisation" />}
              className="h-auto min-h-6 py-1 leading-[14px] whitespace-normal"
            >
              {t("jobs.card.location", { city, country })}
              <span aria-hidden>{"·"}</span>
              {t(`jobs.card.remote.${remote}`)}
            </Badge>
            <Badge tone="neutral">{contract}</Badge>
            {deadline && (
              <Badge tone="neutral" icon={<Icon name="calendrier" />}>
                {t("jobs.card.deadline", { date: deadline })}
              </Badge>
            )}
          </div>
          {(match || published) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 @2xl:hidden">
              {match && <ScoreBadge score={match.score} band={match.band} />}
              {published && (
                <span className="text-[11px] leading-[15px] text-ardoise">
                  {t("jobs.card.published", { relativeDate: published })}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-2 @2xl:flex">
          {match && <ScoreBadge score={match.score} band={match.band} />}
          {published && (
            <span className="text-[11px] leading-[15px] text-ardoise">
              {t("jobs.card.published", { relativeDate: published })}
            </span>
          )}
          {aside && <div className="relative z-10 mt-auto">{aside}</div>}
        </div>
        {aside && <div className="relative z-10 shrink-0 @2xl:hidden">{aside}</div>}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-box ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}
