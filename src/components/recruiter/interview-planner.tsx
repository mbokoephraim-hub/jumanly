"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/talent/back-button";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import {
  blocksFor,
  clock,
  DAY_END,
  DAY_START,
  dayLoad,
  freeMornings,
  minutesOfSlot,
  monthGrid,
  mondayOf,
  addDays,
  overlaps,
  slotOf,
  suggestSlot,
  weekdayOf,
  type BusyBlock,
} from "@/lib/interview-calendar";
import { CandidateAvatar, ScoreRing } from "./candidates";
import { DecisionMessage } from "./candidates-client";

export type PlannerMode = "video" | "onsite" | "audio";
export type PlannerTone = "chaleureux" | "court" | "formel" | "moi";
export type PlannerMember = { id: string; name: string; firstName: string; initials: string };

type Step = "jour" | "heures" | "apercu";
const steps: Step[] = ["jour", "heures", "apercu"];
const modeIcon: Record<PlannerMode, TalentIconName> = {
  video: "entretien",
  onsite: "localisation",
  audio: "micro",
};
const modeTone: Record<PlannerMode, string> = {
  video: "t-g-accomp",
  onsite: "t-g-oppo",
  audio: "t-g-former",
};
export const PLANNER_DURATIONS = [30, 45, 60, 90] as const;
const HOUR_PX = 52;
const MAX = 3;
/** On a computer or a tablet the day and its hours are one screen (web recruteur lot 2). */
const WIDE = "(min-width: 768px)";

/**
 * « Proposer un entretien » (planches r2plus PROG, PROG2 and INV_AP): the mode, the duration and a
 * day in the month calendar (the team's free days as dots), then the hours of that day beside the
 * team's interviews, then what the candidate will receive, with the message Orbi prepared to read
 * and change. The three steps live in the address (`etape`), so « Retour » walks back through
 * them; nothing leaves before « Envoyer l'invitation ». Orbi only suggests: a slot is added when the
 * member taps « Ajouter ».
 */
export function InterviewPlanner({
  action,
  reschedule,
  applicationId,
  back,
  candidate,
  jobTitle,
  org,
  timezone,
  zone,
  today,
  nowMinutes,
  days,
  months,
  busy,
  members,
  me,
  collaboration,
  initial,
  tones,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  /** Set when new times are proposed for an existing interview (mode and duration are kept). */
  reschedule: { interviewId: string } | null;
  applicationId: string;
  back: string;
  candidate: {
    id: string;
    name: string;
    firstName: string;
    line: string;
    score: number | null;
    scoreText: string;
    scoreLabel: string;
  };
  jobTitle: string;
  org: { name: string; initials: string; verified: boolean };
  timezone: string;
  zone: string;
  today: string;
  nowMinutes: number;
  /** Labels of each day of the planner, written by the server (« Mardi 22 octobre »…). */
  days: Record<
    string,
    { long: string; short: string; letter: string; day: string; month: string; weekday: string }
  >;
  months: { key: string; label: string }[];
  busy: Record<string, BusyBlock[]>;
  members: PlannerMember[];
  me: string;
  collaboration: boolean;
  initial: { mode: PlannerMode; duration: number };
  /** The invitation message prepared from the templates, per tone. */
  tones: Record<
    Exclude<PlannerTone, "moi">,
    { body: string; segments: { text: string; filled: boolean }[][] }
  >;
  error: string | null;
}) {
  const t = useTranslations("hireInterviews.plan");
  const tw = useTranslations("hireInterviews.planWeb");
  const params = useSearchParams();
  const asked = params.get("etape");
  const step: Step = steps.find((value) => value === asked) ?? "jour";
  const [mode, setMode] = useState<PlannerMode>(initial.mode);
  const [duration, setDuration] = useState(initial.duration);
  const [day, setDay] = useState<string | null>(null);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [team, setTeam] = useState<string[]>([me]);
  const [slots, setSlots] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [address, setAddress] = useState("");
  const [tone, setTone] = useState<PlannerTone>("chaleureux");

  // A step opened directly (a reload on « heures ») starts again at the first step when nothing
  // was chosen yet: the choices live in the page, not in the address.
  useEffect(() => {
    if (step !== "jour" && !day) go("jour", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the first render
  }, []);

  // On a computer or a tablet (planche web recruteur-2 § 4): the hours sit beside the calendar,
  // so a day is open from the start and « heures » is the same screen as « jour ».
  useEffect(() => {
    if (!window.matchMedia(WIDE).matches) return;
    const frame = window.requestAnimationFrame(() => {
      if (!day) {
        const first = Array.from({ length: 21 }, (_, index) => addDays(today, index)).find(
          (key) => Boolean(days[key]) && weekdayOf(key) < 5,
        );
        if (first) {
          setDay(first);
          setMonth(first.slice(0, 7));
        }
      }
      if (step === "heures") go("jour", true);
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- when the step changes only
  }, [step]);

  function go(next: Step, replace = false) {
    const url = new URL(window.location.href);
    if (next === "jour") url.searchParams.delete("etape");
    else url.searchParams.set("etape", next);
    url.searchParams.delete("erreur");
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  }

  const blocksOf = (key: string) => blocksFor(busy[key], team);
  const nameOf = (id: string) => members.find((member) => member.id === id)?.firstName ?? "";
  const list = (names: string[]) =>
    new Intl.ListFormat("fr", { style: "long", type: "conjunction" }).format(names);
  const teamNames = team.map(nameOf).filter(Boolean);
  const chosenDays = new Set(slots.map((slot) => slot.slice(0, 10)));
  const inRange = (key: string) => key >= today && Boolean(days[key]);
  const modeName = t(`mode.${mode}`);
  const durationName = t("duration", { minutes: duration });
  const slotText = (slot: string) =>
    t("slotShort", { day: days[slot.slice(0, 10)]?.short ?? "", time: clock(minutesOfSlot(slot)) });

  const mornings = useMemo(
    () => freeMornings(busy, team, addDays(today, 1), 14, 2),
    [busy, team, today],
  );
  const suggestion = useMemo(
    () =>
      slots.length >= MAX
        ? null
        : suggestSlot(
            busy,
            team,
            slots,
            duration,
            day && day > today ? day : today,
            day && day > today ? 0 : nowMinutes,
          ),
    [busy, team, slots, duration, day, today, nowMinutes],
  );

  function toggleSlot(slot: string) {
    setSlots((current) =>
      current.includes(slot)
        ? current.filter((item) => item !== slot)
        : current.length >= MAX
          ? current
          : [...current, slot].sort(),
    );
  }

  const ready = slots.length > 0 && (mode !== "onsite" || address.trim().length > 0);
  const recap =
    slots.length === 0
      ? t("recapNone")
      : list(
          [...chosenDays].map((key) =>
            t("recapDay", {
              day: days[key]?.short ?? key,
              times: list(
                slots
                  .filter((slot) => slot.startsWith(key))
                  .map((slot) => clock(minutesOfSlot(slot))),
              ),
            }),
          ),
        );

  const head = (title: string, previous: Step | null, end?: React.ReactNode) => (
    <div className="t-tete-f">
      {previous ? (
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label={t("back")}
          className="t-bi t-press"
        >
          <TalentIcon name="retour" />
        </button>
      ) : (
        <BackButton fallback={back} label={t("back")} className="t-press" />
      )}
      <h1>{title}</h1>
      {end}
    </div>
  );

  /** The head of the page on a computer (planche `.w-h`); the phone keeps its round « Retour ». */
  const webHead = (title: string, sub: string) => (
    <div className="t-rw-h t-rw-web">
      <div className="t-t">
        <Link href={back} className="t-rw-crumb">
          <TalentIcon name="suivant" size="xs" />
          {t("back")}
        </Link>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  );

  const morningsLine = (
    <div className="t-rx-orbi">
      <OrbiMark size={26} />
      <p className="t-t">
        {t.rich("orbiMornings", {
          b: (chunks) => <b>{chunks}</b>,
          names: teamNames.length > 1 ? list(teamNames) : t("you"),
          count: teamNames.length,
          days: list(mornings.map((key) => days[key]?.short ?? key)),
        })}
      </p>
    </div>
  );
  const suggestionLine = suggestion && (
    <div className="t-rx-orbi">
      <OrbiMark size={26} />
      <p className="t-t">
        {t.rich("orbiSuggest", {
          b: (chunks) => <b>{chunks}</b>,
          rank: slots.length + 1,
          slot: t("slotLong", {
            day: days[suggestion.slice(0, 10)]?.long ?? "",
            time: clock(minutesOfSlot(suggestion)),
          }),
          alone: team.length === 1 ? "yes" : "no",
        })}
      </p>
      <button
        type="button"
        className="t-bt t-sec t-s t-press"
        onClick={() => {
          setDay(suggestion.slice(0, 10));
          toggleSlot(suggestion);
        }}
      >
        {t("add")}
      </button>
    </div>
  );
  const checks = (
    <div className="t-verre t-ri-chk">
      <p>
        <span className="t-o" aria-hidden>
          <TalentIcon name="valider" size="xs" />
        </span>
        {t("zone", { zone })}
      </p>
      {mode === "onsite" ? (
        <div className="t-champ">
          <label htmlFor="ri-adresse">{t("address")}</label>
          <div className="t-verre t-saisie">
            <input
              id="ri-adresse"
              value={address}
              maxLength={300}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={t("addressPlaceholder")}
            />
          </div>
        </div>
      ) : (
        <div className="t-champ">
          <label htmlFor="ri-lien">{t(mode === "audio" ? "linkAudio" : "link")}</label>
          <div className="t-verre t-saisie">
            <input
              id="ri-lien"
              type="url"
              inputMode="url"
              value={link}
              maxLength={300}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://"
            />
          </div>
          <small>{t("linkHint", { firstName: candidate.firstName })}</small>
        </div>
      )}
    </div>
  );

  const mini = (
    <section className="t-verre t-ri-mini" aria-label={candidate.name}>
      <CandidateAvatar id={candidate.id} name={candidate.name} />
      <span className="t-t">
        <b>{candidate.name}</b>
        <span>{candidate.line}</span>
      </span>
      {candidate.score !== null && (
        <ScoreRing
          score={candidate.score}
          size="s"
          text={candidate.scoreText}
          label={candidate.scoreLabel}
        />
      )}
    </section>
  );

  return (
    <form action={action} className="t-flux t-ri-plan t-rw-plan">
      {/* What leaves with « Envoyer l'invitation », whatever the step shown. */}
      <input type="hidden" name="application" value={applicationId} />
      {reschedule && <input type="hidden" name="interview" value={reschedule.interviewId} />}
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="duration" value={duration} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="link" value={mode === "onsite" ? "" : link.trim()} />
      <input type="hidden" name="address" value={mode === "onsite" ? address.trim() : ""} />
      {slots.map((slot) => (
        <input key={slot} type="hidden" name="slot" value={slot} />
      ))}
      {team
        .filter((id) => id !== me)
        .map((id) => (
          <input key={id} type="hidden" name="participants" value={id} />
        ))}

      {step === "jour" && (
        <>
          {head(reschedule ? t("titleReschedule") : t("title"), null)}
          {webHead(
            reschedule ? t("titleReschedule") : t("title"),
            tw("sub", { max: MAX, firstName: candidate.firstName }),
          )}
          {error && (
            <p role="alert" className="t-gar t-err">
              <TalentIcon name="horloge" size="s" />
              <span>{error}</span>
            </p>
          )}
          <div className="t-rw-g t-rw-plg">
            <div className="t-rw-c">
              {mini}

              {reschedule ? (
                <p className="t-verre t-ri-garde">
                  <span className={cx("t-cases", modeTone[mode])} aria-hidden>
                    <TalentIcon name={modeIcon[mode]} size="s" />
                  </span>
                  <span>{t("rescheduleKeep", { mode: modeName, duration: durationName })}</span>
                </p>
              ) : (
                <>
                  <fieldset className="t-ri-modes">
                    <legend className="sr-only">{t("modeLegend")}</legend>
                    {(["video", "onsite", "audio"] as const).map((value) => (
                      <label key={value} className={cx("t-press", mode === value && "t-on")}>
                        <input
                          type="radio"
                          name="mode-choice"
                          value={value}
                          checked={mode === value}
                          onChange={() => setMode(value)}
                          className="sr-only"
                        />
                        <span className={cx("t-cases", modeTone[value])} aria-hidden>
                          <TalentIcon name={modeIcon[value]} size="s" />
                        </span>
                        {t(`mode.${value}`)}
                      </label>
                    ))}
                  </fieldset>
                  <fieldset className="t-ri-durees">
                    <legend className="sr-only">{t("durationLegend")}</legend>
                    {PLANNER_DURATIONS.map((value) => (
                      <label key={value} className={cx("t-press", duration === value && "t-on")}>
                        <input
                          type="radio"
                          name="duration-choice"
                          value={value}
                          checked={duration === value}
                          onChange={() => {
                            setDuration(value);
                            setSlots([]);
                          }}
                          className="sr-only"
                        />
                        {t(`durationChip.${value}`)}
                      </label>
                    ))}
                  </fieldset>
                </>
              )}

              <MonthCalendar
                month={month}
                months={months}
                onMonth={setMonth}
                selected={day}
                today={today}
                isOpen={inRange}
                loadOf={(key) =>
                  weekdayOf(key) > 4 || !inRange(key) ? null : dayLoad(blocksOf(key))
                }
                chosen={chosenDays}
                label={(key) => days[key]?.long ?? key}
                onPick={(key) => setDay(key)}
              />

              {mornings.length > 0 && <div className="t-rw-m">{morningsLine}</div>}

              <div className="t-verre t-liste t-lignes">
                <div className="t-li t-ri-equipe">
                  <span className="t-ri-pile" aria-hidden>
                    {team.map((id) => (
                      <span key={id} className="t-rc-av">
                        {members.find((member) => member.id === id)?.initials}
                      </span>
                    ))}
                  </span>
                  <span className="t-t">
                    <b>{t("participants")}</b>
                    <span>
                      {list(team.map((id) => members.find((m) => m.id === id)?.name ?? ""))}
                    </span>
                  </span>
                  {collaboration && members.length > 1 && (
                    <SheetButton target="ri-equipe" className="t-bt t-sec t-s t-press">
                      <TalentIcon name="plus" size="xs" />
                      {t("invite")}
                    </SheetButton>
                  )}
                </div>
              </div>

              <div className="t-verre t-fort t-ri-recap t-rw-tel">
                <span className="t-t">
                  <b>{day ? days[day]?.long : t("pickDay")}</b>
                  {day ? t("pickHours") : t("pickDayText")}
                </span>
                <button
                  type="button"
                  className={cx("t-bt t-p t-press", !day && "t-off")}
                  disabled={!day}
                  onClick={() => go("heures")}
                >
                  {t("hours")}
                </button>
              </div>
            </div>

            {/* Web: the hours of the chosen day beside the calendar (planche `.prog-w`). */}
            <div className="t-rw-c t-rw-web">
              {mornings.length > 0 && morningsLine}
              {day && (
                <DayGrid
                  day={day}
                  title={days[day]?.long ?? day}
                  blocks={blocksOf(day)}
                  members={members}
                  team={team}
                  slots={slots.filter((slot) => slot.startsWith(day))}
                  all={slots}
                  duration={duration}
                  nowMinutes={day === today ? nowMinutes : -1}
                  modeName={modeName}
                  onToggle={toggleSlot}
                />
              )}
              {suggestionLine}
              {checks}
              <div className="t-verre t-fort t-ri-recap">
                <span className="t-t" aria-live="polite">
                  <b>{t("count", { count: slots.length, max: MAX })}</b>
                  {recap}
                </span>
                <button
                  type="button"
                  className={cx("t-bt t-p t-press", !ready && "t-off")}
                  disabled={!ready}
                  onClick={() => go("apercu")}
                >
                  {t("preview")}
                </button>
              </div>
            </div>
          </div>

          {collaboration && (
            <Sheet id="ri-equipe" title={t("teamTitle")} closeLabel={t("close")}>
              <div className="t-verre t-liste t-lignes">
                {members.map((member) => (
                  <label key={member.id} className="t-li t-press">
                    <span className="t-rc-av" aria-hidden>
                      {member.initials}
                    </span>
                    <span className="t-t">
                      <b>{member.id === me ? t("meName", { name: member.name }) : member.name}</b>
                    </span>
                    <input
                      type="checkbox"
                      className="t-ri-case"
                      checked={team.includes(member.id)}
                      disabled={member.id === me}
                      onChange={(event) =>
                        setTeam((current) =>
                          event.target.checked
                            ? [...current, member.id]
                            : current.filter((id) => id !== member.id),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <p className="t-rc-note">{t("teamNote")}</p>
            </Sheet>
          )}
        </>
      )}

      {step === "heures" && day && (
        <>
          {head(
            days[day]?.long ?? day,
            "jour",
            <button
              type="button"
              onClick={() => window.history.back()}
              aria-label={t("calendar")}
              className="t-bi t-press"
            >
              <TalentIcon name="agenda" size="s" />
            </button>,
          )}
          <nav className="t-verre t-ri-sem" aria-label={t("week")}>
            {Array.from({ length: 7 }, (_, index) => addDays(mondayOf(day), index)).map((key) => {
              const open = inRange(key);
              const blocks = blocksOf(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!open}
                  aria-pressed={key === day}
                  aria-label={days[key]?.long ?? key}
                  onClick={() => setDay(key)}
                  className="t-press"
                >
                  <small aria-hidden>{days[key]?.letter ?? ""}</small>
                  <b aria-hidden>{Number(key.slice(8))}</b>
                  <em aria-hidden>
                    {open && weekdayOf(key) < 5 && (
                      <i className={dayLoad(blocks) === "few" ? "t-a" : undefined} />
                    )}
                    {chosenDays.has(key) && <i className="t-c" />}
                  </em>
                </button>
              );
            })}
          </nav>

          <DayGrid
            day={day}
            blocks={blocksOf(day)}
            members={members}
            team={team}
            slots={slots.filter((slot) => slot.startsWith(day))}
            all={slots}
            duration={duration}
            nowMinutes={day === today ? nowMinutes : -1}
            modeName={modeName}
            onToggle={toggleSlot}
          />

          {suggestionLine}

          {checks}

          <div className="t-verre t-fort t-ri-recap">
            <span className="t-t" aria-live="polite">
              <b>{t("count", { count: slots.length, max: MAX })}</b>
              {recap}
            </span>
            <button
              type="button"
              className={cx("t-bt t-p t-press", !ready && "t-off")}
              disabled={!ready}
              onClick={() => go("apercu")}
            >
              {t("preview")}
            </button>
          </div>
        </>
      )}

      {step === "apercu" && day && (
        <>
          {head(t("previewTitle"), "heures")}
          {webHead(t("previewTitle"), tw("previewSub", { firstName: candidate.firstName }))}
          <div className="t-rw-g t-rw-apg">
            <div className="t-rw-c">
              <h2 className="t-ck-t">{t("previewFor", { firstName: candidate.firstName })}</h2>
              <section className="t-verre t-ri-inv" aria-label={t("previewAria")}>
                <div className="t-ban" aria-hidden>
                  <svg viewBox="0 0 390 64" preserveAspectRatio="none">
                    <g fill="none" stroke="rgba(166,242,107,.35)">
                      <circle cx="330" cy="6" r="34" />
                      <circle cx="330" cy="6" r="60" />
                    </g>
                    <circle cx="330" cy="6" r="7" fill="#A6F26B" />
                  </svg>
                  <span className="t-lg-e t-sap">{org.initials}</span>
                </div>
                <div className="t-c">
                  <span className="t-k">{t("previewKicker")}</span>
                  <h3>{jobTitle}</h3>
                  <span className="t-ent">
                    {org.name}
                    {org.verified && (
                      <span className="t-verif">
                        <TalentIcon name="valider" size="xs" />
                        {t("verified")}
                      </span>
                    )}
                  </span>
                  <ul className="t-rows">
                    <li>
                      <TalentIcon name={modeIcon[mode]} size="s" />
                      {mode === "onsite"
                        ? t("rowOnsite", { duration: durationName, address: address.trim() })
                        : t("rowRemote", { mode: modeName, duration: durationName })}
                    </li>
                    <li>
                      <TalentIcon name="candidats" size="s" />
                      {t("rowWith", {
                        names: list(team.map((id) => members.find((m) => m.id === id)?.name ?? "")),
                      })}
                    </li>
                  </ul>
                  <ul className="t-dts">
                    {slots.map((slot, index) => {
                      const key = slot.slice(0, 10);
                      return (
                        <li key={slot} className={index === 0 ? "t-on" : undefined}>
                          <span className="t-cal-t" aria-hidden>
                            <i>{days[key]?.weekday}</i>
                            <b>{days[key]?.day}</b>
                          </span>
                          <span className="t-t">
                            <b>{clock(minutesOfSlot(slot))}</b>
                            {days[key]?.month}
                          </span>
                          <span className="sr-only">{slotText(slot)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="t-faux" aria-hidden>
                    <span className="t-bt t-p t-m">{t("previewConfirm")}</span>
                    <span className="t-bt t-sec t-m">{t("previewOther")}</span>
                  </div>
                </div>
              </section>
            </div>
            <div className="t-rw-c">
              {reschedule ? (
                <p className="t-gar">
                  <TalentIcon name="notification" size="s" />
                  <span>{t("rescheduleNote", { firstName: candidate.firstName })}</span>
                </p>
              ) : (
                <>
                  {tone === "moi" ? (
                    <div className="t-rc-msg">
                      <span className="t-k">
                        <TalentIcon name="modifier" size="s" />
                        {t("ownMessage")}
                      </span>
                      <label htmlFor="ri-message" className="sr-only">
                        {t("messageLabel", { firstName: candidate.firstName })}
                      </label>
                      <textarea
                        id="ri-message"
                        name="message"
                        rows={6}
                        maxLength={2000}
                        className="t-rc-msg-ta"
                      />
                    </div>
                  ) : (
                    <DecisionMessage
                      key={tone}
                      body={tones[tone].body}
                      segments={tones[tone].segments}
                      firstName={candidate.firstName}
                      title={t("prepared")}
                      edited={t("edited")}
                      fieldId="ri-message"
                      editLabel={t("messageLabel", { firstName: candidate.firstName })}
                      editText={t("edit")}
                    />
                  )}
                  <ul className="t-rc-tons t-ri-tons" aria-label={t("tones")}>
                    {(["chaleureux", "court", "formel", "moi"] as const).map((chip) => (
                      <li key={chip}>
                        <button
                          type="button"
                          aria-pressed={chip === tone}
                          onClick={() => setTone(chip)}
                          className="t-press"
                        >
                          {chip === "moi" && <TalentIcon name="modifier" size="xs" />}
                          {t(`tone.${chip}`)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="t-verre t-ri-chk">
                <p>
                  <span className="t-o" aria-hidden>
                    <TalentIcon name="valider" size="xs" />
                  </span>
                  {t("checkNotify", { firstName: candidate.firstName })}
                </p>
                <p>
                  <span className="t-o" aria-hidden>
                    <TalentIcon name="valider" size="xs" />
                  </span>
                  {t("checkAgenda")}
                </p>
                {team.length > 1 && (
                  <p>
                    <span className="t-o" aria-hidden>
                      <TalentIcon name="valider" size="xs" />
                    </span>
                    {t("checkTeam", { count: team.length - 1 })}
                  </p>
                )}
              </div>

              <div className="t-verre t-fort t-bas-f t-rw-st">
                <button type="button" className="t-bt t-sec t-m t-press" onClick={() => go("jour")}>
                  {t("modify")}
                </button>
                <button type="submit" className="t-bt t-p t-pl t-press">
                  <TalentIcon name="envoyer" size="s" />
                  {reschedule ? t("sendReschedule") : t("send")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </form>
  );
}

/** The month calendar (planche r2plus `.calm`): free days in green, full ones in amber. */
export function MonthCalendar({
  month,
  months,
  onMonth,
  selected,
  today,
  isOpen,
  loadOf,
  chosen,
  label,
  onPick,
}: {
  month: string;
  months: { key: string; label: string }[];
  onMonth: (month: string) => void;
  selected: string | null;
  today: string;
  isOpen: (key: string) => boolean;
  loadOf: (key: string) => "free" | "few" | null;
  chosen: Set<string>;
  label: (key: string) => string;
  onPick: (key: string) => void;
}) {
  const t = useTranslations("hireInterviews.calendar");
  const index = months.findIndex((item) => item.key === month);
  const weeks = monthGrid(month);
  return (
    <section className="t-verre t-ri-calm" aria-labelledby="ri-mois">
      <div className="t-mh">
        <button
          type="button"
          className="t-press t-g"
          disabled={index <= 0}
          onClick={() => onMonth(months[index - 1]!.key)}
          aria-label={t("previous")}
        >
          <TalentIcon name="suivant" size="xs" />
        </button>
        <b id="ri-mois" aria-live="polite">
          {months[index]?.label ?? month}
        </b>
        <button
          type="button"
          className="t-press"
          disabled={index < 0 || index >= months.length - 1}
          onClick={() => onMonth(months[index + 1]!.key)}
          aria-label={t("next")}
        >
          <TalentIcon name="suivant" size="xs" />
        </button>
      </div>
      <div className="t-g7m" role="grid" aria-labelledby="ri-mois">
        <div role="row" className="contents">
          {(["l", "ma", "me", "j", "v", "s", "d"] as const).map((key) => (
            <span key={key} role="columnheader" className="t-jl">
              <span aria-hidden>{t(`letter.${key}`)}</span>
              <span className="sr-only">{t(`weekday.${key}`)}</span>
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div role="row" key={week[0]} className="contents">
            {week.map((key) => {
              const other = key.slice(0, 7) !== month;
              const open = !other && isOpen(key);
              const load = open ? loadOf(key) : null;
              return (
                <span role="gridcell" key={key}>
                  <button
                    type="button"
                    disabled={!open}
                    aria-pressed={key === selected}
                    aria-label={[
                      label(key),
                      load === "free" ? t("free") : load === "few" ? t("few") : null,
                      chosen.has(key) ? t("chosen") : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    onClick={() => onPick(key)}
                    className={cx(
                      "t-press",
                      key === today && "t-auj",
                      load === "free" && "t-lib",
                      load === "few" && "t-pl",
                      chosen.has(key) && "t-ch",
                    )}
                  >
                    {Number(key.slice(8))}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="t-lg" aria-hidden>
        <em style={{ "--c": "#2FD3A6" } as CSSProperties}>{t("free")}</em>
        <em style={{ "--c": "#F2B33D" } as CSSProperties}>{t("few")}</em>
        <em className="t-chx">{t("chosen")}</em>
      </p>
    </section>
  );
}

/**
 * The day in hours (planche r2plus PROG2): the team's interviews as hatched blocks, the slots
 * chosen in colour; a tap on a free half hour adds a slot, a tap on a chosen one removes it.
 */
function DayGrid({
  day,
  title,
  blocks,
  members,
  team,
  slots,
  all,
  duration,
  nowMinutes,
  modeName,
  onToggle,
}: {
  day: string;
  /** On a computer: the day it shows, the team's free time beside the calendar. */
  title?: string;
  blocks: BusyBlock[];
  members: PlannerMember[];
  team: string[];
  slots: string[];
  all: string[];
  duration: number;
  nowMinutes: number;
  modeName: string;
  onToggle: (slot: string) => void;
}) {
  const t = useTranslations("hireInterviews.plan");
  const tw = useTranslations("hireInterviews.planWeb");
  const top = (minutes: number) => ((minutes - DAY_START) / 60) * HOUR_PX;
  const hours = Array.from(
    { length: (DAY_END - DAY_START) / 60 + 1 },
    (_, i) => DAY_START + i * 60,
  );
  const halves = Array.from(
    { length: (DAY_END - DAY_START) / 30 },
    (_, index) => DAY_START + index * 30,
  ).filter((start) => start + duration <= DAY_END);
  const chosen = slots.map((slot) => {
    const start = minutesOfSlot(slot);
    return { slot, start, end: start + duration, rank: all.indexOf(slot) + 1 };
  });
  const firstName = (id: string) => members.find((member) => member.id === id)?.firstName ?? "";
  return (
    <section className="t-verre t-ri-jour" aria-labelledby={title ? "ri-dispo-w" : "ri-dispo"}>
      <div className="t-h">
        <b id={title ? "ri-dispo-w" : "ri-dispo"}>
          {title ? tw("dayTeam", { day: title }) : t("teamDay")}
        </b>
        <span className="t-ri-pile" aria-hidden>
          {team.map((id) => (
            <span key={id} className="t-rc-av">
              {members.find((member) => member.id === id)?.initials}
            </span>
          ))}
        </span>
      </div>
      <div className="t-jg" style={{ height: `${top(DAY_END)}px` }}>
        <div className="t-hr" aria-hidden>
          {hours.map((minutes) => (
            <span key={minutes} style={{ top: `${top(minutes)}px` }}>
              {clock(minutes)}
            </span>
          ))}
        </div>
        <div className="t-zone">
          <ul className="t-demi" aria-label={t("halves")}>
            {halves.map((start) => {
              const slot = slotOf(day, start);
              const past = nowMinutes >= 0 && start <= nowMinutes;
              const taken =
                overlaps(blocks, start, start + duration) ||
                overlaps(
                  chosen.filter((item) => item.slot !== slot),
                  start,
                  start + duration,
                );
              const on = slots.includes(slot);
              return (
                <li key={start} style={{ top: `${top(start)}px`, height: `${HOUR_PX / 2}px` }}>
                  <button
                    type="button"
                    disabled={!on && (past || taken || all.length >= MAX)}
                    aria-pressed={on}
                    onClick={() => onToggle(slot)}
                    aria-label={t("halfAria", { time: clock(start) })}
                  />
                </li>
              );
            })}
          </ul>
          {blocks.map((block, index) => (
            <div
              key={index}
              aria-hidden
              className={cx("t-blk t-occ", block.tentative && "t-tent")}
              style={{
                top: `${top(Math.max(block.start, DAY_START))}px`,
                height: `${Math.max(18, top(Math.min(block.end, DAY_END)) - top(Math.max(block.start, DAY_START)))}px`,
              }}
            >
              <b>
                {t(block.tentative ? "busyTentative" : "busy", {
                  names: block.userIds.map(firstName).filter(Boolean).join(", "),
                  count: block.userIds.length,
                })}
              </b>
              <span>
                {clock(block.start)} – {clock(block.end)}
              </span>
            </div>
          ))}
          {chosen.map((item) => (
            <div
              key={item.slot}
              className={cx("t-blk", item.rank % 2 === 1 ? "t-cr" : "t-cr2")}
              style={{
                top: `${top(item.start)}px`,
                height: `${Math.max(30, top(item.end) - top(item.start))}px`,
              }}
            >
              <b>{t("slotRank", { rank: item.rank, time: clock(item.start) })}</b>
              <span>
                {t("slotMeta", { duration: t("duration", { minutes: duration }), mode: modeName })}
              </span>
              <button
                type="button"
                onClick={() => onToggle(item.slot)}
                aria-label={t("remove", { time: clock(item.start) })}
                className="t-x t-press"
              >
                <TalentIcon name="fermer" size="xs" />
              </button>
            </div>
          ))}
          {nowMinutes >= DAY_START && nowMinutes <= DAY_END && (
            <div className="t-now" aria-hidden style={{ top: `${top(nowMinutes)}px` }} />
          )}
        </div>
      </div>
    </section>
  );
}
