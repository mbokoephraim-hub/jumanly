"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { JmCalendar } from "../calendar";

export type MeetingMode = "visio" | "place" | "call";

export type MeetingInput = {
  date: string;
  times: string[];
  mode: MeetingMode;
  link: string;
  address: string;
  geo: { lat: number; lng: number } | null;
};

/** The hours offered, every half hour from 7 h to 19 h 30. */
const HOURS = Array.from({ length: 26 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});
const MODES: MeetingMode[] = ["visio", "place", "call"];
const MAX_TIMES = 8;
const DAYS_AHEAD = 120;

const iso = (date: Date) => date.toISOString().slice(0, 10);
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day));

const MODE_PATHS: Record<MeetingMode, string> = {
  visio: "M3.5 7.5h11v9h-11zM14.5 10.5l6-3.5v10l-6-3.5",
  place:
    "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  call: "M5 4.5h3.5l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 6 1.5 1.5 0 0 1 5 4.5z",
};

/**
 * « Proposer un rendez-vous » (01/11/2026): a calendar in Jumanly's colours to pick the day, the
 * hours to offer (several, the other side chooses one), then how: Visio with the meeting link,
 * Sur place with an address or the phone's position, or Appel. « Envoyer » pulses once ready.
 */
export function MeetingPicker({
  firstDay,
  pending,
  onSend,
}: {
  /** The first working day after today, chosen by default. */
  firstDay: string;
  pending: boolean;
  onSend: (input: MeetingInput) => void;
}) {
  const t = useTranslations("phoneMsg.agenda");
  const format = useFormatter();
  const today = useMemo(() => {
    const now = new Date();
    return utc(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  const last = useMemo(
    () => utc(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + DAYS_AHEAD),
    [today],
  );
  const [day, setDay] = useState(
    firstDay || iso(utc(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)),
  );
  const [times, setTimes] = useState<string[]>([]);
  const [mode, setMode] = useState<MeetingMode>("visio");
  const [link, setLink] = useState("");
  const [address, setAddress] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const hourLabel = (value: string) => {
    const [hour, minutes] = value.split(":");
    return minutes === "00"
      ? t("hour", { hour: Number(hour) })
      : t("hourMin", { hour: Number(hour), min: minutes ?? "" });
  };
  const toggle = (value: string) =>
    setTimes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= MAX_TIMES
          ? current
          : [...current, value].sort(),
    );

  const dayLabel = (() => {
    const text = format.dateTime(new Date(`${day}T12:00:00Z`), {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  })();

  const linkOk = link.trim() === "" || /^https?:\/\/\S+$/i.test(link.trim());
  const ready = times.length > 0 && Boolean(day) && linkOk && !pending;

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoError(true);
      return;
    }
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setGeo({
          lat: Math.round(position.coords.latitude * 1e5) / 1e5,
          lng: Math.round(position.coords.longitude * 1e5) / 1e5,
        });
      },
      () => {
        setLocating(false);
        setGeoError(true);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="nb-ag">
      {/* The app's calendar (Ephraïm, 03/11/2026): from tomorrow, four months ahead. */}
      <JmCalendar
        title={t("dayTitle")}
        value={day}
        onChange={setDay}
        min={iso(utc(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1))}
        max={iso(last)}
      />

      <div className="nb-ag-tete">
        <b>{t("hourTitle")}</b>
        <span className="nb-meta">
          {times.length ? t("picked", { count: times.length }) : t("hoursNote")}
        </span>
      </div>
      <div className="nb-ag-heures">
        {HOURS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={times.includes(value)}
            onClick={() => toggle(value)}
          >
            {hourLabel(value)}
          </button>
        ))}
      </div>

      <div className="nb-ag-tete">
        <b>{t("how")}</b>
      </div>
      <div className="nb-ag-modes">
        {MODES.map((value) => (
          <button
            key={value}
            type="button"
            data-mode={value}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            <span aria-hidden>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={MODE_PATHS[value]} />
              </svg>
            </span>
            {t(`mode.${value}`)}
          </button>
        ))}
      </div>

      {mode === "visio" ? (
        <label className="nb-ag-champ">
          <span>{t("linkLabel")}</span>
          <input
            type="url"
            inputMode="url"
            value={link}
            placeholder={t("linkPlaceholder")}
            aria-invalid={!linkOk || undefined}
            onChange={(event) => setLink(event.target.value)}
          />
          {!linkOk ? <small className="nb-ag-err">{t("linkBad")}</small> : null}
        </label>
      ) : null}

      {mode === "place" ? (
        <div className="nb-ag-lieu">
          <label className="nb-ag-champ">
            <span>{t("addressLabel")}</span>
            <input
              value={address}
              maxLength={200}
              placeholder={t("addressPlaceholder")}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          {geo ? (
            <div className="nb-ag-gps" data-on>
              <span aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={MODE_PATHS.place} />
                </svg>
              </span>
              <b>{t("gpsDone")}</b>
              <button type="button" onClick={() => setGeo(null)}>
                {t("gpsRemove")}
              </button>
            </div>
          ) : (
            <button type="button" className="nb-ag-gps" disabled={locating} onClick={locate}>
              <span aria-hidden>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
                </svg>
              </span>
              <b>{locating ? t("gpsWait") : t("gps")}</b>
            </button>
          )}
          {geoError ? <small className="nb-ag-err">{t("gpsError")}</small> : null}
        </div>
      ) : null}

      {mode === "call" ? <p className="nb-meta nb-ag-note">{t("callNote")}</p> : null}

      <button
        type="button"
        className="nb-ag-envoyer"
        data-pret={ready || undefined}
        disabled={!ready}
        onClick={() =>
          onSend({
            date: day,
            times,
            mode,
            link: mode === "visio" ? link.trim() : "",
            address: mode === "place" ? address.trim() : "",
            geo: mode === "place" ? geo : null,
          })
        }
      >
        {times.length ? t("send", { day: dayLabel, count: times.length }) : t("pickHour")}
      </button>
    </div>
  );
}
