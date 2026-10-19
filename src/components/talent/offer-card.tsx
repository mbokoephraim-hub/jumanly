import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import type { MatchExplanation } from "@/server/matching/types";
import { contractFilterOf, remoteFilterOf, type PublicJobSummary } from "@/server/services/jobs";
import { Banner, Logo, toneOf } from "./art";
import { TalentIcon } from "./icon";

const NEW_DAYS = 3;

export type OfferMatch =
  | { state: "ok"; explanation: MatchExplanation }
  | { state: "incomplete" | "optedOut" | "pending" }
  | undefined;

/** Labels of « Enregistrer » shared by the cards and the offer. */
export async function saveLabels() {
  const t = await getTranslations();
  return {
    save: t("talent.jobs.card.save"),
    unsave: t("talent.jobs.card.unsave"),
    saved: t("talent.jobs.card.saved.toast"),
    removed: t("talent.jobs.card.unsaved.toast"),
    undo: t("common.cancel"),
  };
}

/**
 * An offer (planche talent-1 § 2, `.of`): the company's banner with « Enregistrer », its logo over
 * the edge, the title, « Entreprise · Ville », the contract and the work mode, then the score
 * with its « Pourquoi ? », which opens the reasons on the offer. A low score hides nothing.
 */
export async function OfferCard({
  job,
  match,
  saved,
  applied,
  back,
  now,
}: {
  job: PublicJobSummary;
  match: OfferMatch;
  saved: boolean;
  applied: boolean;
  back: string;
  now: Date;
}) {
  const t = await getTranslations();
  const tone = toneOf(job.organization.name);
  const href = `/app/jobs/${job.slug}`;
  const score = match?.state === "ok" ? Math.round(match.explanation.score) : null;
  const isNew =
    job.publishedAt !== null && now.getTime() - job.publishedAt.getTime() < NEW_DAYS * 86_400_000;
  return (
    <article className="t-verre t-of">
      <div className="t-ban">
        <Banner src={job.organization.banner} tone={tone} />
        <SaveJobButton
          slug={job.slug}
          saved={saved}
          back={back}
          name={job.title}
          talent
          className="t-fav t-press"
          labels={await saveLabels()}
        />
      </div>
      <div className="t-corps">
        <Logo name={job.organization.name} src={job.organization.logo} tone={tone} />
        <div className="t-t">
          <h3 className="contents">
            <Link href={href} className="t-lien">
              <b>{job.title}</b>
            </Link>
          </h3>
          <span>{t("forMe.offers.line", { company: job.organization.name, city: job.city })}</span>
          <div className="t-bas">
            {applied ? (
              <span className="t-tag">{t("offers.card.applied")}</span>
            ) : (
              isNew && <span className="t-new">{t("offers.card.new")}</span>
            )}
            <span className="t-tag">
              {t(`jobs.search.contract.${contractFilterOf(job.contractType)}`)}
            </span>
            {job.remote !== "onsite" && (
              <span className="t-tag">{t(`jobs.card.remote.${remoteFilterOf(job.remote)}`)}</span>
            )}
            {score !== null && (
              <Link
                href={`${href}?pourquoi=1`}
                aria-label={t("offers.card.why", { score })}
                className="t-score t-press"
              >
                {t("forMe.offers.score", { score })}
                <TalentIcon name="pourquoi" size="xs" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
