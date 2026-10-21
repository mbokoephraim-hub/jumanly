import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";

/**
 * The application beside the conversation on a computer (planche web recruteur-3 § 2, third
 * column): the offer with its stage track, the CV sent with the application, the next interview
 * and « Ouvrir le dossier ». Read through the organization (golden rule n° 6); nothing here opens
 * the profile: the file, when opened, logs its consultation as always.
 */
export async function ThreadAside({
  ctx,
  applicationId,
  jobTitle,
  firstName,
  dossier,
  isApplication,
  stage,
  score,
}: {
  ctx: HireContext;
  applicationId: string | null;
  jobTitle: string;
  firstName: string;
  /** The complete file, or the talent's profile for an accepted proposal. */
  dossier: string | null;
  isApplication: boolean;
  /** The current stage and the stages of the offer (decisions left out). */
  stage: { name: string; order: number; orders: number[] } | null;
  score: number | null;
}) {
  const t = await getTranslations("hireWeb3.thread");
  const tr = await getTranslations("rhThread");
  const format = await getFormatter();
  const [application, interview] = applicationId
    ? await Promise.all([
        db.application.findFirst({
          where: { id: applicationId, job: { organizationId: ctx.organizationId } },
          select: { cvSnapshot: true, createdAt: true },
        }),
        db.interview.findFirst({
          where: {
            applicationId,
            organizationId: ctx.organizationId,
            status: { in: ["pending", "confirmed", "reschedule"] },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            startsAt: true,
            slots: true,
            proposedSlots: true,
            timezone: true,
          },
        }),
      ])
    : [null, null];
  const index = stage ? stage.orders.filter((order) => order <= stage.order).length : 0;
  const when =
    interview &&
    (interview.startsAt ??
      (interview.status === "reschedule" ? interview.proposedSlots[0] : null) ??
      interview.slots[0] ??
      null);
  const zone = interview?.timezone;

  return (
    <aside className="t-msg-cx t-rw3-cx" aria-label={t("aria")}>
      <h2 className="t-msg-h">{isApplication ? t("application") : t("proposal")}</h2>
      <div className="t-rw3-cxo">
        <div className="t-rw3-cxt">
          <span className="t-cases t-c1" aria-hidden>
            <TalentIcon name="offre" size="s" />
          </span>
          <span className="t-t">
            <b>{jobTitle}</b>
            <span>
              {score !== null
                ? t("score", { score })
                : isApplication
                  ? (stage?.name ?? "")
                  : tr("context.proposal")}
            </span>
          </span>
        </div>
        {stage && stage.orders.length > 1 && (
          <>
            <span className="t-rw3-trk" aria-hidden>
              {stage.orders.map((order) => (
                <i key={order} className={cx(order <= stage.order && "t-on")} />
              ))}
            </span>
            <span className="t-rw3-et">
              {t.rich("stage", {
                index,
                total: stage.orders.length,
                stage: stage.name,
                b: (chunks) => <b>{chunks}</b>,
              })}
            </span>
          </>
        )}
      </div>

      {application && (
        <>
          <h2 className="t-msg-h">{t("documents")}</h2>
          {application.cvSnapshot !== null ? (
            <a href={`/app/hire/candidats/${applicationId}/cv`} className="t-rw3-doc t-press">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="cv" size="s" />
              </span>
              <span className="t-t">
                <b>{t("cv")}</b>
                <span>{t("cvLine", { date: formatDayMonth(application.createdAt) })}</span>
              </span>
            </a>
          ) : (
            <p className="t-rw3-none">{t("noCv")}</p>
          )}
        </>
      )}

      {interview && when && (
        <>
          <h2 className="t-msg-h">{t("interview")}</h2>
          <Link href={`/app/hire/entretiens/${interview.id}`} className="t-rw3-itv t-press">
            <span className="t-rw3-day" aria-hidden>
              <small>{format.dateTime(when, { weekday: "short", timeZone: zone })}</small>
              <b>{format.dateTime(when, { day: "numeric", timeZone: zone })}</b>
            </span>
            <span className="t-t">
              <b>
                {t(`itv.${interview.status as "pending" | "confirmed" | "reschedule"}`, {
                  time: format.dateTime(when, {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: zone,
                  }),
                })}
              </b>
              <span>
                {interview.status === "confirmed"
                  ? format.dateTime(when, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: zone,
                    })
                  : interview.status === "reschedule"
                    ? t("itvAsked", { name: firstName })
                    : t("itvWaiting", { name: firstName })}
              </span>
            </span>
          </Link>
        </>
      )}

      {dossier && (
        <Link href={dossier} className="t-bt t-sec t-m t-press t-rw3-dos">
          <TalentIcon name="candidats" size="s" />
          {isApplication ? t("open") : t("profile")}
        </Link>
      )}
    </aside>
  );
}
