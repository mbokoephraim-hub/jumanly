"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { scheduleInterviewAction, submitScorecardAction } from "@/server/actions/hire-advanced";
import { PhoneIcon } from "../icon";

type BusyBlock = { start: number; end: number; userIds: string[] };

export type RhPlannerData = {
  applicationId: string;
  back: string;
  firstName: string;
  /** The working days offered (« Ven. 23 »), from today. */
  days: { key: string; weekday: string; day: string }[];
  today: string;
  nowMinutes: number;
  busy: Record<string, BusyBlock[]>;
  me: string;
  members: { id: string; name: string; initials: string; title: string | null }[];
  timezone: string;
  /** The company's address, written in « Sur place ». */
  address: string;
  message: string;
  error: string | null;
};

/** The times of the planche, in minutes. */
const SLOTS = [9 * 60, 10 * 60, 11 * 60 + 30, 14 * 60, 15 * 60 + 30, 16 * 60 + 30];
const DURATIONS = [30, 45, 60];
const MODES = ["video", "onsite", "audio"] as const;

const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * « Entretien avec … » (planche Recruteur-planifier): a day, a time free for the people chosen
 * and oneself (from their interviews in Jumanly), how, how long, with whom. Nothing leaves before
 * « Envoyer l'invitation »; the person answers from Messages.
 */
export function RhPlanner({ data }: { data: RhPlannerData }) {
  const t = useTranslations("phoneRhCandidatures.plan");
  const [day, setDay] = useState(data.days[0]?.key ?? data.today);
  const [mode, setMode] = useState<(typeof MODES)[number]>("video");
  const [duration, setDuration] = useState(45);
  const [people, setPeople] = useState<string[]>([]);
  const team = [data.me, ...people];
  const busy = (start: number) =>
    (data.busy[day] ?? []).some(
      (block) =>
        block.userIds.some((id) => team.includes(id)) &&
        block.start < start + duration &&
        start < block.end,
    ) ||
    (day === data.today && start <= data.nowMinutes);
  const firstFree = SLOTS.find((start) => !busy(start)) ?? null;
  const [time, setTime] = useState<number | null>(null);
  const chosen = time !== null && !busy(time) ? time : firstFree;
  const names = people
    .map((id) => data.members.find((member) => member.id === id)?.name.split(/\s+/)[0])
    .filter(Boolean);

  return (
    <form action={scheduleInterviewAction} className="nb-page nb-rh-detail nb-rh-plan">
      <header className="nb-rh-barre">
        <Link href={data.back} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
        <h1 className="nb-rh-barre-t">{t("title", { name: data.firstName })}</h1>
        <span className="nb-rh-barre-vide" aria-hidden />
      </header>
      <input type="hidden" name="application" value={data.applicationId} />
      <input type="hidden" name="timezone" value={data.timezone} />
      <input type="hidden" name="message" value={data.message} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="duration" value={duration} />
      {chosen !== null ? (
        <input type="hidden" name="slot" value={`${day}T${hhmm(chosen)}`} />
      ) : null}
      {data.error ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {data.error}
        </p>
      ) : null}

      <fieldset className="nb-rh-plan-s">
        <legend className="nb-meta">{t("day")}</legend>
        <div className="nb-rh-jours">
          {data.days.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={item.key === day}
              onClick={() => {
                setDay(item.key);
                setTime(null);
              }}
            >
              <span>{item.weekday}</span>
              <b>{item.day}</b>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="nb-rh-plan-s">
        <legend className="nb-meta">
          {names.length > 0 ? t("slotsWith", { names: names.join(", ") }) : t("slots")}
        </legend>
        <div className="nb-rh-creneaux">
          {SLOTS.map((start) => (
            <button
              key={start}
              type="button"
              aria-pressed={start === chosen}
              disabled={busy(start)}
              onClick={() => setTime(start)}
            >
              {t("time", { hours: Math.floor(start / 60), minutes: hhmm(start).slice(3) })}
            </button>
          ))}
        </div>
        {firstFree === null ? <p className="nb-meta">{t("full")}</p> : null}
      </fieldset>

      <fieldset className="nb-rh-plan-s">
        <legend className="nb-meta">{t("how")}</legend>
        <div className="nb-rh-modes">
          {MODES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === mode}
              onClick={() => setMode(key)}
            >
              <b>{t(`modes.${key}`)}</b>
              <span>{key === "onsite" && data.address ? data.address : t(`modesHint.${key}`)}</span>
            </button>
          ))}
        </div>
        {mode === "video" ? (
          <label className="nb-rh-plan-champ">
            <span className="nb-meta">{t("link")}</span>
            <input name="link" type="url" maxLength={300} placeholder="https://" />
          </label>
        ) : null}
        {mode === "onsite" ? (
          <label className="nb-rh-plan-champ">
            <span className="nb-meta">{t("address")}</span>
            <input name="address" required maxLength={300} defaultValue={data.address} />
          </label>
        ) : null}
      </fieldset>

      <fieldset className="nb-rh-plan-s">
        <legend className="nb-meta">{t("duration")}</legend>
        <div className="nb-rh-puces-c">
          {DURATIONS.map((value) => (
            <button
              key={value}
              type="button"
              className="nb-pilule"
              aria-pressed={value === duration}
              onClick={() => setDuration(value)}
            >
              {t("minutes", { count: value })}
            </button>
          ))}
        </div>
      </fieldset>

      {data.members.length > 0 ? (
        <fieldset className="nb-rh-plan-s">
          <legend className="nb-meta">{t("with")}</legend>
          {data.members.map((member) => (
            <label key={member.id} className="nb-rh-cocher nb-rh-avec">
              <input
                type="checkbox"
                name="participants"
                value={member.id}
                checked={people.includes(member.id)}
                onChange={(event) =>
                  setPeople(
                    event.target.checked
                      ? [...people, member.id]
                      : people.filter((id) => id !== member.id),
                  )
                }
              />
              <span className="nb-rh-ini" data-teinte="n" aria-hidden>
                {member.initials}
              </span>
              <span className="nb-rh-res-t">
                <b>{member.name}</b>
                {member.title ? <span className="nb-meta">{member.title}</span> : null}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="nb-bas">
        <button type="submit" className="nb-bp" disabled={chosen === null}>
          {t("send")}
        </button>
      </div>
    </form>
  );
}

export type RhEvaluationData = {
  applicationId: string;
  back: string;
  title: string;
  line: string;
  criteria: string[];
  max: number;
  initial: { ratings: number[]; comment: string; next: "yes" | "maybe" | "no" };
};

/**
 * « Documenter l'entretien » (planche Recruteur-evaluation): a rating per criterion of the offer's
 * grid, the strong points and the next step the member suggests. Nothing moves the candidate.
 */
export function RhEvaluation({ data }: { data: RhEvaluationData }) {
  const t = useTranslations("phoneRhCandidatures.evaluation");
  const [ratings, setRatings] = useState<number[]>(
    data.criteria.map((_, index) => data.initial.ratings[index] ?? 0),
  );
  const [next, setNext] = useState(data.initial.next);
  const complete = ratings.every((value) => value > 0);
  return (
    <form action={submitScorecardAction} className="nb-page nb-rh-detail nb-rh-eval">
      <header className="nb-rh-barre">
        <Link href={data.back} className="nb-rh-retour">
          <PhoneIcon name="retour" size={20} />
          {t("back")}
        </Link>
      </header>
      <input type="hidden" name="application" value={data.applicationId} />
      <input type="hidden" name="back" value={data.back} />
      <input type="hidden" name="suite" value={next} />
      <section className="nb-rh-detail-h">
        <h1>{data.title}</h1>
        <p className="nb-meta">{data.line}</p>
      </section>
      <div className="nb-rh-eval-c">
        {data.criteria.map((name, index) => (
          <fieldset key={name} className="nb-rh-eval-k">
            <input type="hidden" name="criterion" value={name} />
            <input type="hidden" name={`rating-${index}`} value={ratings[index] || ""} />
            <legend>
              <b>{name}</b>
              <span className="nb-meta">
                {t("score", { value: ratings[index] ?? 0, max: data.max })}
              </span>
            </legend>
            <div className="nb-rh-etoiles" role="radiogroup" aria-label={name}>
              {Array.from({ length: data.max }, (_, star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={ratings[index] === star + 1}
                  aria-label={t("star", { value: star + 1, max: data.max })}
                  data-plein={(ratings[index] ?? 0) > star ? "" : undefined}
                  onClick={() =>
                    setRatings(ratings.map((value, at) => (at === index ? star + 1 : value)))
                  }
                >
                  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
                    <path
                      d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="nb-rh-plan-champ">
          <span className="nb-meta">{t("strengths")}</span>
          <textarea
            name="comment"
            rows={4}
            maxLength={2000}
            defaultValue={data.initial.comment}
            className="nb-rh-zone"
          />
        </label>
        <fieldset className="nb-rh-plan-s">
          <legend className="nb-meta">{t("next")}</legend>
          <div className="nb-rh-puces-c">
            {(["yes", "maybe", "no"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className="nb-pilule"
                aria-pressed={next === key}
                onClick={() => setNext(key)}
              >
                {t(`nextSteps.${key}`)}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="nb-bas">
        <button type="submit" className="nb-bp" disabled={!complete}>
          {t("save")}
        </button>
      </div>
    </form>
  );
}
