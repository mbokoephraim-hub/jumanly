"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { rhFixInterviewAction, rhPlanCheckAction } from "@/server/actions/rh-agenda-plan";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

/**
 * « À planifier » (Ephraïm 06/11/2026): a touch on a person opens a window over the blurred page.
 * Interview: the day among the next ones, on site or by video (then the link), the hour, then
 * « Enregistrer et envoyer ». Document check: a delay. The candidate is told at once.
 */

export type PlanDay = { key: string; weekday: string; num: string; month: string };
export type PlanDelay = { days: number; until: string };

type Person = { applicationId: string; name: string; jobTitle: string };

const HOURS = Array.from({ length: 27 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});

const agendaOn = (day: string) => `/app/hire/entretiens?mois=${day.slice(0, 7)}&jour=${day}`;

function Row({
  person,
  art,
  tone,
  tag,
  onOpen,
}: {
  person: Person;
  art: MenuArtName;
  tone: "due" | "attente" | "ok";
  tag?: string;
  onOpen: (() => void) | null;
}) {
  const inner = (
    <>
      <span className="nb-rh-ag-art" aria-hidden>
        <MenuArt name={art} size="xs" />
      </span>
      <span className="nb-rh-ag-t">
        <b>{person.name}</b>
        <span>
          {person.jobTitle}
          {tag ? <em className="nb-rh-ag-retard"> · {tag}</em> : null}
        </span>
      </span>
      {onOpen ? <PhoneIcon name="plus" size={18} /> : null}
    </>
  );
  return onOpen ? (
    <button
      type="button"
      className="nb-rh-ag-tache"
      data-ton={tone}
      onClick={onOpen}
      aria-haspopup="dialog"
    >
      {inner}
    </button>
  ) : (
    <div className="nb-rh-ag-tache" data-ton={tone}>
      {inner}
    </div>
  );
}

export function PlanInterviewRow({
  person,
  days,
  canManage,
  canPlan,
}: {
  person: Person;
  days: PlanDay[];
  /** The member may act (manage): the row opens the window. */
  canManage: boolean;
  /** The organization's plan includes interviews (`connect.appointments`). */
  canPlan: boolean;
}) {
  const t = useTranslations("phoneRhAgenda.sheet");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(days[1]?.key ?? days[0]?.key ?? "");
  const [mode, setMode] = useState<"onsite" | "video">("onsite");
  const [hour, setHour] = useState("10:00");
  const [link, setLink] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = `pl-${person.applicationId}`;
  const send = () => {
    if (mode === "video" && !/^https?:\/\/\S+$/i.test(link.trim())) {
      setError("link");
      return;
    }
    setError(null);
    start(async () => {
      const result = await rhFixInterviewAction({
        application: person.applicationId,
        mode,
        day,
        hour,
        link: mode === "video" ? link.trim() : "",
        address: mode === "onsite" ? address.trim() : "",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(agendaOn(result.day));
    });
  };
  return (
    <li>
      <Row
        person={person}
        art="calendar"
        tone="ok"
        onOpen={canManage ? () => setOpen(true) : null}
      />
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("interviewTitle")}
        closeLabel={t("close")}
        className="nb-rh-fen"
      >
        <h2>{t("interviewTitle")}</h2>
        <p className="nb-rh-fen-qui">
          <b>{person.name}</b> · {person.jobTitle}
        </p>
        {!canPlan ? (
          <>
            <p className="nb-rh-fen-erreur">{t("error.locked")}</p>
            <div className="nb-rh-fen-actions">
              <button
                type="button"
                className="nb-bouton"
                data-contour=""
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </button>
              <Link href="/app/abonnement/formules" className="nb-bouton" data-plein="">
                {t("plans")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="nb-rh-fen-label" id={`${id}-jour`}>
              {t("day")}
            </p>
            <div className="nb-rh-fen-jours" role="radiogroup" aria-labelledby={`${id}-jour`}>
              {days.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={item.key === day}
                  className="nb-rh-fen-jour"
                  onClick={() => setDay(item.key)}
                >
                  <small>{item.weekday}</small>
                  <b>{item.num}</b>
                  <small>{item.month}</small>
                </button>
              ))}
            </div>
            <p className="nb-rh-fen-label" id={`${id}-mode`}>
              {t("mode")}
            </p>
            <div className="nb-rh-fen-modes" role="radiogroup" aria-labelledby={`${id}-mode`}>
              {(["onsite", "video"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={key === mode}
                  className="nb-chip"
                  onClick={() => {
                    setMode(key);
                    setError(null);
                  }}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            {mode === "video" ? (
              <label className="nb-rh-fen-champ" htmlFor={`${id}-lien`}>
                <span className="nb-rh-fen-label">{t("link")}</span>
                <input
                  id={`${id}-lien`}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={link}
                  onChange={(event) => {
                    setLink(event.target.value);
                    setError(null);
                  }}
                  aria-invalid={error === "link" ? true : undefined}
                />
              </label>
            ) : (
              <label className="nb-rh-fen-champ" htmlFor={`${id}-adresse`}>
                <span className="nb-rh-fen-label">{t("address")}</span>
                <input
                  id={`${id}-adresse`}
                  type="text"
                  maxLength={300}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
              </label>
            )}
            <label className="nb-rh-fen-champ" htmlFor={`${id}-heure`}>
              <span className="nb-rh-fen-label">{t("hour")}</span>
              <select
                id={`${id}-heure`}
                value={hour}
                onChange={(event) => {
                  setHour(event.target.value);
                  setError(null);
                }}
              >
                {HOURS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            {error ? (
              <p className="nb-rh-fen-erreur" role="alert">
                {t(
                  `error.${error === "link" || error === "past" || error === "taken" || error === "locked" ? error : "invalid"}`,
                )}
              </p>
            ) : null}
            <div className="nb-rh-fen-actions">
              <button
                type="button"
                className="nb-bouton"
                data-contour=""
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="nb-bouton"
                data-plein=""
                onClick={send}
                disabled={pending || !day}
              >
                {t("send")}
              </button>
            </div>
          </>
        )}
      </PhoneSheet>
    </li>
  );
}

export function PlanCheckRow({
  person,
  delays,
  tone,
  tag,
  canCheck,
}: {
  person: Person;
  delays: PlanDelay[];
  tone: "due" | "attente" | "ok";
  tag?: string;
  canCheck: boolean;
}) {
  const t = useTranslations("phoneRhAgenda.sheet");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const id = `dl-${person.applicationId}`;
  const chosen = delays.find((item) => item.days === days);
  const send = () => {
    setError(false);
    start(async () => {
      const result = await rhPlanCheckAction({ application: person.applicationId, days });
      if (!result.ok) {
        setError(true);
        return;
      }
      setOpen(false);
      router.push(agendaOn(result.day));
    });
  };
  return (
    <li>
      <Row
        person={person}
        art="document"
        tone={tone}
        tag={tag}
        onOpen={canCheck ? () => setOpen(true) : null}
      />
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("checkTitle")}
        closeLabel={t("close")}
        className="nb-rh-fen"
      >
        <h2 id={`${id}-titre`}>{t("checkTitle")}</h2>
        <p className="nb-rh-fen-qui">
          <b>{person.name}</b> · {person.jobTitle}
        </p>
        <div className="nb-rh-fen-modes" role="radiogroup" aria-labelledby={`${id}-titre`}>
          {delays.map((item) => (
            <button
              key={item.days}
              type="button"
              role="radio"
              aria-checked={item.days === days}
              className="nb-chip"
              onClick={() => setDays(item.days)}
            >
              {t(`delay${item.days}` as "delay7")}
            </button>
          ))}
        </div>
        {chosen ? <p className="nb-rh-fen-jusqua">{chosen.until}</p> : null}
        {error ? (
          <p className="nb-rh-fen-erreur" role="alert">
            {t("error.invalid")}
          </p>
        ) : null}
        <div className="nb-rh-fen-actions">
          <button
            type="button"
            className="nb-bouton"
            data-contour=""
            onClick={() => setOpen(false)}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-plein=""
            onClick={send}
            disabled={pending}
          >
            {t("send")}
          </button>
        </div>
      </PhoneSheet>
    </li>
  );
}
