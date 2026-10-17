import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { DateBlock, InterviewItem, zoneCity } from "@/components/suivi/interview-item";
import { SlotPicker, type PickerDay } from "@/components/suivi/slot-picker";
import { Alert, Button } from "@/components/ui";
import { requireUser } from "@/server/auth/session";
import { answerInterviewAction } from "@/server/actions/connect";
import { db } from "@/server/db";
import { SLOTS_MAX } from "@/server/services/interviews";
import { talentInterview } from "@/server/services/suivi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.suivi.confirm");
  return { title: t("title"), robots: { index: false } };
}

const DAYS_AHEAD = 14;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

/** « 2026-10-27 » and « 10:00 » of a date, in a time zone. */
function localParts(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/**
 * An interview from Suivi (docs/ux-mobile-talent, prompt 5): confirm one of the proposed slots
 * (screen 20) or propose up to three other times (screen 21). The answer is shown as done only
 * after the server's reply (redirect to Suivi with its confirmation).
 */
export default async function InterviewAnswerPage({
  params,
  searchParams,
}: PageProps<"/app/suivi/entretiens/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/suivi/entretiens/${id}`);
  const interview = await talentInterview(db, user.id, id);
  if (!interview) notFound();
  const t = await getTranslations("talent.suivi.confirm");
  const ti = await getTranslations("connect.invite");
  const format = await getFormatter();
  const now = new Date();
  const timeZone = interview.timezone;
  const proposing = query.proposer === "1" || interview.status === "reschedule";
  const back = "/app/suivi?filtre=entretiens";
  if (!["pending", "reschedule", "confirmed"].includes(interview.status)) redirect(back);
  const conversationId = interview.application.conversation?.id ?? "";
  const mode = ti(`mode.${interview.mode === "audio" ? "call" : interview.mode}`);
  const time = (value: Date) =>
    format.dateTime(value, { hour: "2-digit", minute: "2-digit", timeZone });
  const end = (value: Date) => new Date(value.getTime() + interview.durationMinutes * 60_000);
  const slots = interview.slots.filter((slot) => slot > now);
  const hidden = (answer: string) => (
    <>
      <input type="hidden" name="conversation" value={conversationId} />
      <input type="hidden" name="interview" value={interview.id} />
      <input type="hidden" name="answer" value={answer} />
      <input type="hidden" name="from" value="suivi" />
    </>
  );

  const summary = (
    <ul className="flex flex-col overflow-hidden rounded-[22px] bg-blanc shadow-douce">
      <li className="flex items-center gap-3.5 border-b border-brume px-4 py-3.5">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-creme"
        >
          <Icon name="entreprise" className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] leading-snug font-semibold">
            {[interview.organization.name, interview.application.job.title].join(" · ")}
          </span>
          <span className="text-[13px] text-ardoise">
            {t("with", { name: interview.organizer.name })}
          </span>
        </span>
      </li>
      <li className="flex items-center gap-3.5 px-4 py-3.5">
        <span
          aria-hidden
          className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-creme"
        >
          <Icon name={interview.mode === "onsite" ? "localisation" : "video"} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] leading-snug font-semibold">
            {t("format", { mode, minutes: interview.durationMinutes })}
          </span>
          <span className="text-[13px] text-ardoise">
            {interview.mode === "onsite"
              ? (interview.address ?? t("addressLater"))
              : t("linkLater")}
          </span>
        </span>
      </li>
    </ul>
  );

  const header = (title: string, closeHref: string, backArrow = false) => (
    <div className="flex items-center gap-3">
      {backArrow && (
        <Link
          href={closeHref}
          aria-label={t("back")}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc shadow-douce"
        >
          <Icon name="chev-l" className="size-5" />
        </Link>
      )}
      <h1 className="flex-1 text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
      {!backArrow && (
        <Link
          href={closeHref}
          aria-label={t("close")}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-blanc shadow-douce"
        >
          <Icon name="fermer" className="size-5" />
        </Link>
      )}
    </div>
  );

  if (interview.status === "confirmed") {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-6">
        {header(t("confirmedTitle"), back)}
        <InterviewItem interview={interview} now={now} />
        {summary}
      </div>
    );
  }

  if (proposing) {
    const days: PickerDay[] = Array.from({ length: DAYS_AHEAD }, (_, index) => {
      const date = new Date(now.getTime() + (index + 1) * 86_400_000);
      return {
        value: localParts(date, timeZone).day,
        weekday: format.dateTime(date, { weekday: "short", timeZone }),
        day: format.dateTime(date, { day: "numeric", timeZone }),
        long: format.dateTime(date, { weekday: "long", day: "numeric", month: "long", timeZone }),
        short: format.dateTime(date, {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone,
        }),
      };
    });
    const initial = interview.proposedSlots
      .filter((slot) => slot > now)
      .map((slot) => {
        const parts = localParts(slot, timeZone);
        return `${parts.day}T${parts.time}`;
      });
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-28 md:pb-6">
        {header(
          t("propose.title"),
          interview.status === "reschedule" ? back : `/app/suivi/entretiens/${interview.id}`,
          true,
        )}
        <p className="text-[15px] text-ardoise">
          {t("propose.hint", { max: SLOTS_MAX, city: zoneCity(timeZone) })}
        </p>
        {query.erreur === "1" && <Alert tone="error" title={t("propose.error")} />}
        <form action={answerInterviewAction} className="flex flex-col gap-5">
          {hidden("propose")}
          <SlotPicker
            days={days}
            hours={HOURS.map((hour) => ({
              value: `${String(hour).padStart(2, "0")}:00`,
              label: t("propose.hour", { hour }),
            }))}
            initial={initial}
            max={SLOTS_MAX}
            labels={{
              days: t("propose.days"),
              hours: t("propose.hours"),
              chosen: t("propose.chosen", { count: "{count}", max: "{max}" }),
              item: t("propose.item", { day: "{day}", hour: "{hour}" }),
              remove: t("propose.remove", { slot: "{slot}" }),
              full: t("propose.full", { max: SLOTS_MAX }),
            }}
          />
          <label htmlFor="propose-message" className="sr-only">
            {t("propose.messageLabel")}
          </label>
          <textarea
            id="propose-message"
            name="message"
            rows={3}
            maxLength={1000}
            placeholder={t("propose.message")}
            className="rounded-[20px] bg-blanc px-4 py-3.5 text-[15px] shadow-douce placeholder:text-ardoise focus-visible:outline-2 focus-visible:outline-sapin"
          />
          <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 rounded-[22px] bg-blanc p-3 shadow-float md:static md:bg-transparent md:p-0 md:shadow-none">
            <Button
              type="submit"
              variant="principal"
              size="L"
              fullWidth
              icon={<Icon name="send" />}
            >
              {t("propose.send")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-28 md:pb-6">
      {header(t("title"), back)}
      {summary}
      {query.erreur === "1" && <Alert tone="error" title={ti("error")} />}
      <form action={answerInterviewAction} className="flex flex-col gap-4">
        {hidden("accept")}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[15px] font-semibold">{t("choose")}</legend>
          {slots.map((slot, index) => (
            <label
              key={slot.toISOString()}
              className="group flex cursor-pointer items-center gap-3.5 rounded-[22px] bg-blanc p-3.5 shadow-douce has-checked:ring-2 has-checked:ring-sapin has-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)]"
            >
              <input
                type="radio"
                name="slot"
                value={slot.toISOString()}
                defaultChecked={index === 0}
                required
                className="peer sr-only"
              />
              <span className="contents">
                <span className="hidden group-has-checked:contents">
                  <DateBlock date={slot} timeZone={timeZone} strong />
                </span>
                <span className="contents group-has-checked:hidden">
                  <DateBlock date={slot} timeZone={timeZone} strong={false} />
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[17px] font-semibold">
                  {format.dateTime(slot, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone,
                  })}
                </span>
                <span className="text-[14px] text-ardoise">
                  {t("slotLine", {
                    start: time(slot),
                    end: time(end(slot)),
                    city: zoneCity(timeZone),
                  })}
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-full ring-2 ring-brume group-has-checked:ring-sapin"
              >
                <span className="size-3 rounded-full bg-sapin opacity-0 group-has-checked:opacity-100" />
              </span>
            </label>
          ))}
        </fieldset>
        <Link
          href={`/app/suivi/entretiens/${interview.id}?proposer=1`}
          className="flex min-h-11 items-center justify-center text-center text-[15px] font-semibold text-feuille-fonce"
        >
          {t("none")}
        </Link>
        <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 rounded-[22px] bg-blanc p-3 shadow-float md:static md:bg-transparent md:p-0 md:shadow-none">
          <Button type="submit" variant="principal" size="L" fullWidth icon={<Icon name="check" />}>
            {t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
