import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, RadioGroup, TextArea, TextField } from "@/components/ui";
import type { Interview } from "@/generated/prisma/client";
import { answerInterviewAction } from "@/server/actions/connect";
import { LINK_VISIBLE_HOURS, SLOTS_MAX } from "@/server/services/interviews";

const statusKey = {
  pending: "pending",
  confirmed: "accepted",
  reschedule: "rescheduleRequested",
  declined: "declined",
  canceled: "canceled",
  done: "past",
  no_show: "past",
} as const;

/**
 * An interview invitation inside a conversation. The talent picks a slot, proposes others or
 * declines; the team sees the same card, read-only. Times are shown in the organizer's zone.
 */
export async function InterviewCard({
  interview,
  conversationId,
  talent,
  now,
}: {
  interview: Interview;
  conversationId: string;
  talent: boolean;
  now: Date;
}) {
  const t = await getTranslations("connect.invite");
  const zone = await getTranslations("hire.interviews.form");
  const format = await getFormatter();
  const timeZone = interview.timezone;
  const when = (date: Date) =>
    t("chosen", {
      date,
      time: format.dateTime(date, { hour: "2-digit", minute: "2-digit", timeZone }),
      timezone: timeZone,
    });
  const short = (date: Date) =>
    format.dateTime(date, { dateStyle: "medium", timeStyle: "short", timeZone });
  const open = talent && interview.status === "pending";
  const linkVisible =
    interview.status === "confirmed" &&
    interview.startsAt !== null &&
    interview.startsAt.getTime() - now.getTime() <= LINK_VISIBLE_HOURS * 3_600_000 &&
    interview.startsAt.getTime() + interview.durationMinutes * 60_000 >= now.getTime();

  return (
    <div id={`entretien-${interview.id}`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{t("title")}</p>
        <Badge tone={interview.status === "confirmed" ? "success" : "neutral"}>
          {t(`status.${statusKey[interview.status]}`)}
        </Badge>
      </div>
      <p className="text-sm">
        {t("format", {
          mode: t(`mode.${interview.mode === "audio" ? "call" : interview.mode}`),
          minutes: interview.durationMinutes,
        })}
      </p>
      {interview.message && <p className="whitespace-pre-line">{interview.message}</p>}
      {interview.address && (
        <p className="text-sm">{t("location", { address: interview.address })}</p>
      )}
      {interview.status === "confirmed" && interview.startsAt && (
        <p className="font-medium">{when(interview.startsAt)}</p>
      )}
      {interview.status === "confirmed" &&
        interview.link &&
        (linkVisible ? (
          <a
            href={interview.link}
            className="self-start font-medium underline"
            rel="noopener noreferrer"
          >
            {t("join")}
          </a>
        ) : (
          <p className="text-sm text-ardoise">{t("link", { hours: LINK_VISIBLE_HOURS })}</p>
        ))}
      {interview.status === "canceled" && <p className="text-sm">{t("canceled")}</p>}
      {interview.status === "declined" && talent && <p className="text-sm">{t("declined")}</p>}
      {interview.status === "reschedule" && interview.proposedSlots.length > 0 && (
        <p className="text-sm">
          {t("proposed", { slots: interview.proposedSlots.map(short).join(" · ") })}
        </p>
      )}
      {!open && interview.status === "pending" && (
        <p className="text-sm">{interview.slots.map(short).join(" · ")}</p>
      )}

      {open && (
        <>
          <form action={answerInterviewAction} className="flex flex-col gap-3">
            <input type="hidden" name="conversation" value={conversationId} />
            <input type="hidden" name="interview" value={interview.id} />
            <input type="hidden" name="answer" value="accept" />
            <RadioGroup
              legend={t("slots")}
              name="slot"
              required
              options={interview.slots
                .filter((slot) => slot > now)
                .map((slot) => ({ value: slot.toISOString(), label: when(slot) }))}
            />
            <Button type="submit" size="sm" className="self-start">
              {t("accept")}
            </Button>
          </form>
          <details>
            <summary className="cursor-pointer text-sm font-medium underline">
              {t("propose.text")}
            </summary>
            <form action={answerInterviewAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="conversation" value={conversationId} />
              <input type="hidden" name="interview" value={interview.id} />
              <input type="hidden" name="answer" value="propose" />
              <p className="text-sm">
                {[t("propose.hint"), zone("timezone", { timezone: timeZone })].join(" ")}
              </p>
              {Array.from({ length: SLOTS_MAX }, (_, index) => (
                <TextField
                  key={index}
                  id={`propose-${interview.id}-${index}`}
                  name="slot"
                  type="datetime-local"
                  required={index === 0}
                  label={t("slot", { number: index + 1 })}
                />
              ))}
              <TextArea
                id={`propose-message-${interview.id}`}
                name="message"
                rows={2}
                maxLength={1000}
                label={t("propose.message")}
              />
              <Button type="submit" size="sm" variant="secondary" className="self-start">
                {t("propose.send")}
              </Button>
            </form>
          </details>
          <details>
            <summary className="cursor-pointer text-sm font-medium underline">
              {t("decline.text")}
            </summary>
            <form action={answerInterviewAction} className="mt-3 flex flex-col items-start gap-3">
              <input type="hidden" name="conversation" value={conversationId} />
              <input type="hidden" name="interview" value={interview.id} />
              <input type="hidden" name="answer" value="decline" />
              <p className="font-semibold">{t("decline.confirm.title")}</p>
              <p className="text-sm">{t("decline.confirm.body")}</p>
              <TextArea
                id={`decline-message-${interview.id}`}
                name="message"
                rows={2}
                maxLength={1000}
                label={t("propose.message")}
              />
              <Button type="submit" size="sm" variant="danger">
                {t("decline.text")}
              </Button>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
