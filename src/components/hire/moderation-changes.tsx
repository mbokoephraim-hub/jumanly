import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { correctionPoints } from "@/server/services/moderation";

/**
 * « Correction demandée » (Admin v2, étape 7): the moderator's message and the points to correct,
 * shown to the recruiter on the job; corrected and published again, the job goes back to review.
 */
export async function ModerationChanges({
  job,
  fixHref,
  className,
}: {
  job: { moderationReason: string | null; moderationChecks: string[] };
  fixHref?: string;
  className?: string;
}) {
  const t = await getTranslations("hire.jobs.changes");
  const points = correctionPoints.filter((point) => job.moderationChecks.includes(point));
  return (
    <div role="status" className={cx("t-rx-conf", className)}>
      <b className="flex items-center gap-2">
        <TalentIcon name="modifier" size="s" />
        {t("title")}
      </b>
      {job.moderationReason && <p>{t("reason", { reason: job.moderationReason })}</p>}
      {points.length > 0 && (
        <>
          <p className="font-semibold">{t("points")}</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5">
            {points.map((point) => (
              <li key={point}>{t(`point.${point}`)}</li>
            ))}
          </ul>
        </>
      )}
      <p>{t("resend")}</p>
      {fixHref && (
        <Link href={fixHref} className="t-bt t-p t-s t-press self-start">
          {t("fix")}
        </Link>
      )}
    </div>
  );
}
