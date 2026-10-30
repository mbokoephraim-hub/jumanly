import { getTranslations } from "next-intl/server";
import { AdminEmpty, AdminStats, Tag, adminCard, adminLabel } from "@/components/admin/kit";
import { cx } from "@/lib/cx";
import { formatDateTime, formatDayMonth } from "@/lib/dates";
import { db } from "@/server/db";
import { waitlistProfiles } from "@/server/services/waitlist";
import {
  testAreas,
  testDevices,
  testFeedbackSummary,
  testRatings,
  waitlistStats,
} from "@/server/services/waitlist-test";

/**
 * Tabs « Statistiques » and « Questionnaires » of /admin/liste-attente (30/10/2026). Plain bars in
 * HTML: readable without JavaScript, figures written next to each bar.
 */

function Bars({ rows, label }: { rows: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul aria-label={label} className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li
          key={row.label}
          className="grid grid-cols-[minmax(90px,140px)_1fr_auto] items-center gap-3"
        >
          <span className="truncate text-[13px] leading-5">{row.label}</span>
          <span aria-hidden className="h-2.5 overflow-hidden rounded-pill bg-brume">
            <span
              className="block h-full rounded-pill bg-lime"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </span>
          <span className="min-w-8 text-right text-[13px] font-semibold tabular-nums">
            {row.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cx(adminCard, "flex flex-col gap-4")}>
      <h2 className={adminLabel}>{title}</h2>
      {children}
    </section>
  );
}

/** « Statistiques »: volume, evolution week by week, profiles, countries and the test funnel. */
export async function WaitlistStatistics() {
  const [t, stats] = await Promise.all([getTranslations(), waitlistStats(db)]);
  const s = (key: string, values?: Record<string, string | number>) =>
    t(`admin.waitlist.statsTab.${key}` as Parameters<typeof t>[0], values);
  const trend = stats.last7 - stats.previous7;
  const maxWeek = Math.max(1, ...stats.weekly.map((week) => week.count));
  const funnel = (["total", "invited", "accounts", "surveyed", "answered"] as const).map((key) => ({
    label: s(`funnel.${key}`),
    value: stats.funnel[key],
  }));
  return (
    <>
      <AdminStats
        items={[
          { label: s("total"), value: stats.total, icon: "equipe" },
          {
            label: s("last7"),
            value: (
              <span className="flex items-baseline gap-2">
                {stats.last7}
                <span
                  className={cx(
                    "text-[13px] font-semibold",
                    trend > 0 ? "text-up-texte" : trend < 0 ? "text-down-texte" : "text-ardoise",
                  )}
                >
                  {s("trend", { value: trend > 0 ? `+${trend}` : String(trend) })}
                </span>
              </span>
            ),
            icon: "statistiques",
          },
          { label: s("invited"), value: stats.funnel.invited, icon: "message" },
          {
            label: s("answered"),
            value: stats.funnel.answered,
            icon: "check",
            tone: stats.funnel.answered > 0 ? "success" : "neutral",
          },
        ]}
      />
      <Card title={s("weekly")}>
        <div
          className="flex h-44 items-end gap-1.5 sm:gap-2.5"
          role="list"
          aria-label={s("weekly")}
        >
          {stats.weekly.map((week) => (
            <div
              key={week.start.toISOString()}
              role="listitem"
              aria-label={s("weekItem", {
                date: formatDayMonth(week.start),
                count: week.count,
              })}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="text-[11.5px] font-semibold tabular-nums">{week.count || ""}</span>
              <span
                aria-hidden
                className={cx(
                  "w-full max-w-10 rounded-t-[8px]",
                  week.count ? "bg-lime" : "bg-brume",
                )}
                style={{ height: `${Math.max(4, (week.count / maxWeek) * 100)}%` }}
              />
              <span className="text-[10.5px] leading-3 whitespace-nowrap text-ardoise max-sm:hidden">
                {formatDayMonth(week.start)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-ardoise">{s("weeklyHelp")}</p>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={s("profiles")}>
          <Bars
            label={s("profiles")}
            rows={waitlistProfiles.map((profile) => ({
              label: t(`waitlist.form.profile.${profile}.label`),
              value: stats.byProfile[profile],
            }))}
          />
        </Card>
        <Card title={s("countries")}>
          {stats.countries.length === 0 ? (
            <p className="text-[13px] text-ardoise">{t("admin.waitlist.empty")}</p>
          ) : (
            <Bars
              label={s("countries")}
              rows={stats.countries.map((row) => ({ label: row.country, value: row.count }))}
            />
          )}
        </Card>
      </div>
      <Card title={s("funnelTitle")}>
        <Bars label={s("funnelTitle")} rows={funnel} />
        <p className="text-[12.5px] text-ardoise">{s("funnelHelp")}</p>
      </Card>
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-hidden className="text-[13px] tracking-[2px]">
      <span className="text-up-texte">{"★".repeat(value)}</span>
      <span className="text-ardoise/40">{"★".repeat(5 - value)}</span>
    </span>
  );
}

/** « Questionnaires »: averages, NPS, parts tried, devices, then every answer in full. */
export async function WaitlistFeedback() {
  const [t, summary] = await Promise.all([getTranslations(), testFeedbackSummary(db)]);
  const f = (key: string, values?: Record<string, string | number>) =>
    t(`admin.waitlist.feedback.${key}` as Parameters<typeof t>[0], values);
  if (summary.count === 0) {
    return (
      <AdminEmpty
        title={f("emptyTitle")}
        text={f("emptyText")}
        icon="message"
        character={{ name: "amani", pose: "repos" }}
      />
    );
  }
  const one = (value: number | null) =>
    value === null ? "–" : value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return (
    <>
      <AdminStats
        items={[
          { label: f("count"), value: summary.count, icon: "message" },
          {
            label: f("average"),
            value: f("outOf", { value: one(summary.averages.overall), max: 5 }),
            icon: "etoile",
          },
          {
            label: f("nps"),
            value: summary.nps === null ? "–" : summary.nps > 0 ? `+${summary.nps}` : summary.nps,
            icon: "statistiques",
            tone: (summary.nps ?? 0) >= 0 ? "success" : "attention",
          },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title={f("ratingsTitle")}>
          <ul className="flex flex-col gap-2.5">
            {testRatings.map((key) => (
              <li key={key} className="flex items-center justify-between gap-3 text-[13px]">
                <span>{t(`testSurvey.short.${key}`)}</span>
                <span className="font-semibold tabular-nums">
                  {f("outOf", { value: one(summary.averages[key]), max: 5 })}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-ardoise">{f("npsHelp")}</p>
        </Card>
        <Card title={f("areasTitle")}>
          <Bars
            label={f("areasTitle")}
            rows={summary.areas.map((row) => ({
              label: t(`testSurvey.areas.${row.area}`),
              value: row.count,
            }))}
          />
        </Card>
        <Card title={f("devicesTitle")}>
          <Bars
            label={f("devicesTitle")}
            rows={summary.devices.map((row) => ({
              label: t(`testSurvey.devices.${row.device}`),
              value: row.count,
            }))}
          />
        </Card>
      </div>
      <h2 className="pt-2 text-[18px] leading-6 font-semibold">{f("answersTitle")}</h2>
      <ul className="flex flex-col gap-3.5">
        {summary.answers.map((answer) => (
          <li key={answer.id} className={cx(adminCard, "flex flex-col gap-4")}>
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-[15px] font-semibold">
                {[answer.entry.firstName, answer.entry.lastName].filter(Boolean).join(" ")}
              </p>
              <Tag tone={answer.entry.profile === "talent" ? "success" : "neon"}>
                {t(`waitlist.form.profile.${answer.entry.profile}.label`)}
              </Tag>
              <Tag tone="outline">
                {t(`testSurvey.devices.${answer.device as (typeof testDevices)[number]}`)}
              </Tag>
              <span className="text-[12.5px] text-ardoise">
                {answer.entry.country} · {formatDateTime(answer.createdAt)}
              </span>
              <a
                href={`mailto:${answer.entry.email}`}
                className="ml-auto text-[12.5px] font-semibold hover:underline"
              >
                {answer.entry.email}
              </a>
            </div>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
              {testRatings.map((key) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-[11.5px] text-ardoise">{t(`testSurvey.short.${key}`)}</dt>
                  <dd className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <Stars value={answer[key]} />
                    {f("outOf", { value: answer[key], max: 5 })}
                  </dd>
                </div>
              ))}
              <div className="flex flex-col gap-0.5">
                <dt className="text-[11.5px] text-ardoise">{t("testSurvey.short.recommend")}</dt>
                <dd className="text-[13px] font-semibold">
                  {f("outOf", { value: answer.recommend, max: 10 })}
                </dd>
              </div>
            </dl>
            {answer.areas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {answer.areas.map((area) => (
                  <Tag key={area} tone="neutral">
                    {t(`testSurvey.areas.${area as (typeof testAreas)[number]}`)}
                  </Tag>
                ))}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {(["improvements", "problems", "liked", "comments"] as const).map((key) =>
                answer[key] ? (
                  <div key={key} className="flex flex-col gap-1 rounded-[16px] bg-brume/50 p-3.5">
                    <p className={adminLabel}>{t(`testSurvey.short.${key}`)}</p>
                    <p className="text-[13.5px] leading-5 whitespace-pre-line">{answer[key]}</p>
                  </div>
                ) : null,
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
