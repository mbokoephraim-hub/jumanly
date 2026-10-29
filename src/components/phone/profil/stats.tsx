"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { AUDIENCE_PERIODS, type AudienceFigures, type AudiencePeriod } from "@/lib/audience";

type Key = "visits" | "views" | "impressions";
const KEYS: Key[] = ["visits", "views", "impressions"];
const COLORS: Record<Key, string> = {
  visits: "var(--nb-lime)",
  views: "#7CC4FF",
  impressions: "#C3A6FF",
};

/**
 * « Statistiques » of one's own profile (demande d'Ephraïm du 29/10/2026): over 7, 30 or 90 days,
 * the visits of the profile, the views of the posts and their impressions in the Fil, each with
 * its change from the period before, then the visits day by day. Only totals: never who.
 */
export function AudienceStats({ figures }: { figures: Record<AudiencePeriod, AudienceFigures> }) {
  const t = useTranslations("phoneProfile.stats");
  const [period, setPeriod] = useState<AudiencePeriod>(7);
  const now = figures[period];
  const top = Math.max(1, ...now.bars);
  const change = (key: Key) => {
    const before = now.before[key];
    const value = now[key];
    if (before === 0) return value > 0 ? { text: t("new"), up: true } : null;
    const percent = Math.round(((value - before) / before) * 100);
    if (percent === 0) return { text: t("same"), up: null };
    return {
      text: t(percent > 0 ? "up" : "down", { percent: Math.abs(percent) }),
      up: percent > 0,
    };
  };
  return (
    <section className="nb-st" aria-labelledby="nb-st-h">
      <h2 id="nb-st-h" className="nb-pf-h">
        {t("title")}
      </h2>
      <div className="nb-st-periodes" role="group" aria-label={t("period")}>
        {AUDIENCE_PERIODS.map((days) => (
          <button
            key={days}
            type="button"
            aria-pressed={period === days}
            onClick={() => setPeriod(days)}
          >
            {t("days", { days })}
          </button>
        ))}
      </div>
      <ul className="nb-st-tuiles">
        {KEYS.map((key) => {
          const moved = change(key);
          return (
            <li key={key} className="nb-st-tuile">
              <i style={{ background: COLORS[key] }} aria-hidden />
              <b>{now[key]}</b>
              <span>{t(`${key}.label`)}</span>
              <small>{t(`${key}.hint`)}</small>
              {moved ? (
                <em data-sens={moved.up === null ? "egal" : moved.up ? "haut" : "bas"}>
                  {moved.text}
                </em>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="nb-st-courbe">
        <p>
          <b>{t("chart")}</b>
          <small>{t(period === 90 ? "perWeek" : "perDay")}</small>
        </p>
        <ol
          className="nb-st-barres"
          aria-label={t("chartLabel", { count: now.visits, days: period })}
          data-serre={now.bars.length > 10 ? "" : undefined}
        >
          {now.bars.map((value, index) => (
            <li key={index} aria-hidden>
              <span
                style={{ height: `${Math.max(4, (value / top) * 100)}%` }}
                data-vide={value === 0 ? "" : undefined}
              />
            </li>
          ))}
        </ol>
      </div>
      <p className="nb-st-note">{t("note")}</p>
    </section>
  );
}
