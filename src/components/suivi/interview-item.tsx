import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { LINK_VISIBLE_HOURS } from "@/server/services/interviews";
import type { TalentInterview } from "@/server/services/suivi";

/** « Kinshasa » for « Africa/Kinshasa »: the city a time zone is named after. */
export function zoneCity(timeZone: string) {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}

/** The date block of an interview card (screens 15 and 22): day and month, or « ? date ». */
export async function DateBlock({
  date,
  timeZone,
  strong,
}: {
  date: Date | null;
  timeZone: string;
  strong: boolean;
}) {
  const t = await getTranslations("talent.suivi.interview");
  const format = await getFormatter();
  return (
    <span
      aria-hidden
      className={cx(
        "flex size-[60px] shrink-0 flex-col items-center justify-center rounded-[16px] leading-none",
        strong ? "bg-sapin text-blanc" : "bg-creme text-sapin",
      )}
    >
      {date ? (
        <>
          <span className={cx("text-[24px] font-bold", strong && "text-lime")}>
            {format.dateTime(date, { day: "numeric", timeZone })}
          </span>
          <span className="mt-1 text-[12px]">
            {format.dateTime(date, { month: "short", timeZone })}
          </span>
        </>
      ) : (
        <>
          <span className="text-[22px] font-bold">{t("unknown")}</span>
          <span className="mt-1 text-[12px]">{t("noDate")}</span>
        </>
      )}
    </span>
  );
}

/**
 * An interview in Suivi: to confirm (Confirmer, Proposer un autre moment), waiting for the recruiter
 * (Modifier mes propositions) or confirmed (Rejoindre, Ajouter à mon agenda). Times are written in
 * the zone the recruiter chose, and say so.
 */
export async function InterviewItem({
  interview,
  now,
  highlight = false,
}: {
  interview: TalentInterview;
  now: Date;
  highlight?: boolean;
}) {
  const t = await getTranslations("talent.suivi.interview");
  const ti = await getTranslations("connect.invite");
  const format = await getFormatter();
  const timeZone = interview.timezone;
  const nextSlot = interview.slots.find((slot) => slot > now) ?? null;
  const date = interview.status === "confirmed" ? interview.startsAt : nextSlot;
  const mode = ti(`mode.${interview.mode === "audio" ? "call" : interview.mode}`);
  const time = (value: Date) =>
    format.dateTime(value, { hour: "2-digit", minute: "2-digit", timeZone });
  const end = (value: Date) => new Date(value.getTime() + interview.durationMinutes * 60_000);
  const company = interview.organization.name;
  const href = `/app/suivi/entretiens/${interview.id}`;
  const linkOpen =
    interview.status === "confirmed" &&
    interview.link !== null &&
    interview.startsAt !== null &&
    interview.startsAt.getTime() - now.getTime() <= LINK_VISIBLE_HOURS * 3_600_000;

  const eyebrow =
    interview.status === "pending"
      ? t("toConfirm")
      : interview.status === "confirmed"
        ? t("confirmed")
        : t("waiting");
  const line =
    interview.status === "reschedule"
      ? t("proposedLine", {
          company,
          count: interview.proposedSlots.length,
          date: interview.updatedAt,
        })
      : date
        ? [
            company,
            t("when", {
              day: format.dateTime(date, { weekday: "long", timeZone }),
              start: time(date),
              end: time(end(date)),
              city: zoneCity(timeZone),
            }),
            mode,
          ].join(" · ")
        : [company, mode].join(" · ");

  return (
    <article
      id={`entretien-${interview.id}`}
      aria-labelledby={`entretien-titre-${interview.id}`}
      className={cx(
        "flex gap-3.5 rounded-[22px] bg-blanc p-4 shadow-douce",
        highlight && "ring-2 ring-lime",
      )}
    >
      <DateBlock date={date} timeZone={timeZone} strong={interview.status !== "reschedule"} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={cx(
            "flex items-center gap-1 text-[12px] font-bold tracking-wide uppercase",
            interview.status === "confirmed" ? "text-feuille-fonce" : "text-[#8A5A00]",
          )}
        >
          {interview.status === "confirmed" && <Icon name="check" className="size-3.5" />}
          {eyebrow}
        </p>
        <h3
          id={`entretien-titre-${interview.id}`}
          className="text-[16px] leading-snug font-semibold"
        >
          {interview.application.job.title}
        </h3>
        <p className="text-[13.5px] text-ardoise">{line}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {interview.status === "pending" && (
            <>
              <ButtonLink href={href} variant="principal" size="S">
                {t("confirm")}
              </ButtonLink>
              <ButtonLink href={`${href}?proposer=1`} variant="outline" size="S">
                {t("propose")}
              </ButtonLink>
            </>
          )}
          {interview.status === "reschedule" && (
            <ButtonLink href={`${href}?proposer=1`} variant="outline" size="S">
              {t("editProposals")}
            </ButtonLink>
          )}
          {interview.status === "confirmed" && (
            <>
              {interview.link &&
                (linkOpen ? (
                  <a
                    href={interview.link}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-gradient-principal px-4 text-[13px] font-semibold text-blanc"
                  >
                    <Icon name="video" className="size-4" />
                    {t("join")}
                  </a>
                ) : (
                  <span className="text-[12.5px] text-ardoise">
                    {t("joinLater", { hours: LINK_VISIBLE_HOURS })}
                  </span>
                ))}
              <a
                href={`${href}/agenda`}
                download
                className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-4 text-[13px] font-semibold ring-[1.5px] ring-brume ring-inset"
              >
                <Icon name="calendrier" className="size-4" />
                {t("calendar")}
              </a>
            </>
          )}
        </div>
        {interview.status === "confirmed" && interview.address && (
          <p className="text-[12.5px] text-ardoise">
            {ti("location", { address: interview.address })}
          </p>
        )}
      </div>
    </article>
  );
}
