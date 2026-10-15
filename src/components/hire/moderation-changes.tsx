import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
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
    <div
      role="status"
      className={cx(
        "flex flex-col gap-2.5 rounded-[16px] bg-ambre-fond px-4 py-3 text-ambre-texte",
        className,
      )}
    >
      <p className="flex items-start gap-2 text-[13px] leading-[18px] font-semibold">
        <Icon name="edit" aria-hidden className="mt-px size-4 shrink-0" />
        {t("title")}
      </p>
      {job.moderationReason && (
        <p className="text-[12.5px] leading-[17px]">
          {t("reason", { reason: job.moderationReason })}
        </p>
      )}
      {points.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[12px] font-semibold">{t("points")}</p>
          <ul className="flex list-disc flex-col gap-0.5 pl-5 text-[12.5px] leading-[17px]">
            {points.map((point) => (
              <li key={point}>{t(`point.${point}`)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="flex-1 text-[12px] leading-4">{t("resend")}</p>
        {fixHref && (
          <Link
            href={fixHref}
            className="inline-flex h-9 items-center justify-center rounded-pill bg-sapin px-4 text-[12.5px] font-semibold text-blanc"
          >
            {t("fix")}
          </Link>
        )}
      </div>
    </div>
  );
}
