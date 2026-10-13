import { Icon } from "@/components/brand/icon";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge, ScoreBadge, VerifiedBadge, type MatchBand } from "./badge";

export type RemoteMode = "onsite" | "hybrid" | "full";

/**
 * Job card (§ 11.5). The score is optional: it only shows for a signed-in talent,
 * always with its band, and its "Pourquoi ?" lives on the job page.
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
  verified = false,
  isNew = false,
  match,
}: {
  title: string;
  href: string;
  company: string;
  city: string;
  country: string;
  remote: RemoteMode;
  contract: string;
  /** Already formatted in the user's time zone. */
  deadline: string;
  verified?: boolean;
  isNew?: boolean;
  match?: { score: number; band: MatchBand };
}) {
  const t = useTranslations();
  return (
    <article className="group relative flex flex-col gap-3 rounded-card bg-blanc p-5">
      <div className="flex flex-wrap items-center gap-2">
        {isNew && <Badge tone="new">{t("common.new")}</Badge>}
        <Badge tone="jobs">{contract}</Badge>
        <Badge tone="neutral">{t(`jobs.card.remote.${remote}`)}</Badge>
      </div>
      <h3 className="text-lg leading-7 font-semibold">
        <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
          {title}
        </Link>
      </h3>
      <div className="flex flex-wrap items-center gap-2 text-[15px]">
        <span className="font-medium">{t("jobs.card.company", { company })}</span>
        {verified && <VerifiedBadge />}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ardoise">
        <li className="flex items-center gap-1">
          <Icon name="localisation" className="size-4" />
          {t("jobs.card.location", { city, country })}
        </li>
        <li className="flex items-center gap-1">
          <Icon name="calendrier" className="size-4" />
          {t("jobs.card.deadline", { date: deadline })}
        </li>
      </ul>
      {match && (
        <div className="mt-1">
          <ScoreBadge score={match.score} band={match.band} />
        </div>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-card ring-sapin group-focus-within:ring-2 group-hover:ring-2"
      />
    </article>
  );
}
