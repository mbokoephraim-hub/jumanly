import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { loose } from "@/lib/loose-t";
import { toggleAutomationAction } from "@/server/actions/hire-v3-automation";
import type { AutomationHistory, AutomationOverview } from "@/server/services/hire-v3-automation";
import { avatarColor, initialsOf } from "./avatar";
import { barsWaveSvg } from "./charts";
import { HireEmpty } from "./empty";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";

export type SuiviTab = "rules" | "history";
export const SUIVI_TABS = { rules: "regles", history: "historique" };
const PAGE = "/app/hire/suivi";

const RESULT_TONE = {
  sent: "ok",
  submitted: "ok",
  booked: "ok",
  notSubmitted: "warn",
  notBooked: "warn",
  waiting: "wait",
} as const;

async function tabsOf(tab: SuiviTab) {
  const t = await getTranslations("hireV3Suivi");
  return (Object.keys(SUIVI_TABS) as SuiviTab[]).map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "rules" ? PAGE : `${PAGE}?onglet=${SUIVI_TABS[key]}`,
    active: key === tab,
  }));
}

function Toggle({
  id,
  on,
  label,
  disabled,
}: {
  id: string;
  on: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <form action={toggleAutomationAction}>
      <input type="hidden" name="key" value={id} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button
        type="submit"
        className={on ? "toggle on" : "toggle"}
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
      />
    </form>
  );
}

async function Flash({ query }: { query: Record<string, string | string[] | undefined> }) {
  const t = await getTranslations("hireV3Suivi.flash");
  if (query.ok !== "on" && query.ok !== "off" && !query.erreur) return null;
  return (
    <p className="meta" role="status" style={{ margin: "0 0 12px", fontWeight: 600 }}>
      {query.ok === "on"
        ? t("on")
        : query.ok === "off"
          ? t("off")
          : query.erreur === "forbidden"
            ? t("forbidden")
            : t("invalid")}
    </p>
  );
}

/** One line of the history (`hrow` of the prototype). */
async function HistoryRow({ row }: { row: AutomationHistory["rows"][number] }) {
  const t = await getTranslations("hireV3Suivi");
  const lt = loose(t);
  const format = await getFormatter();
  return (
    <Link
      className="tsrr3 tsrow"
      href={`/app/hire/candidats/${row.applicationId}?onglet=parcours`}
      style={{ color: "inherit", textDecoration: "none" }}
    >
      <span className="row" style={{ gap: 10, minWidth: 0 }}>
        <span className={`av ${avatarColor(row.name)} xs`} aria-hidden="true">
          {initialsOf(row.name)}
        </span>
        <b className="tr">{row.name}</b>
      </span>
      <span className="tr">{lt(`rules.${row.rule}.title`)}</span>
      <span className="meta">{format.relativeTime(row.at)}</span>
      <span>
        <span className={`sust ${RESULT_TONE[row.result]}`}>{lt(`results.${row.result}`)}</span>
      </span>
    </Link>
  );
}

/** « Suivi automatique » of the recruiter's web app v3 (`V.suivi` of the prototype, 32-33). */
export async function HireV3Suivi({
  tab,
  overview,
  history,
  query,
}: {
  tab: SuiviTab;
  overview: AutomationOverview;
  history: AutomationHistory;
  query: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("hireV3Suivi");
  const lt = loose(t);
  const format = await getFormatter();
  const tabs = await tabsOf(tab);
  // The organization's rules, plus « Réponse aux non retenus » (always on) and « Résumé du matin ».
  const on = overview.rules.filter((r) => r.enabled).length + 1 + (overview.digest ? 1 : 0);
  const total = overview.rules.length + 2;

  if (tab === "history")
    return (
      <HirePage view="suivi">
        <HirePageHead title={t("heads.history")} sub={t("historySub")} tabs={tabs} />
        <div className="tsk">
          <div className="tskt">
            <span>{t("hk.sent")}</span>
            <b className="num">{history.kpi.week}</b>
            <em>{t("hk.sentSub")}</em>
          </div>
          <div className="tskt">
            <span>{t("hk.answers")}</span>
            <b className="num">{history.kpi.answers}</b>
            <em>{t("hk.answersSub")}</em>
          </div>
          <div className="tskt">
            <span>{t("hk.waiting")}</span>
            <b className="num">{history.kpi.waiting}</b>
            <em>{t("hk.waitingSub")}</em>
          </div>
          <div className="tskt">
            <span>{t("hk.rules")}</span>
            <b className="num">{t("ratio", { a: on, b: total })}</b>
            <em>{t("hk.rulesSub")}</em>
          </div>
        </div>
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("last")}</h3>
            <span className="meta">{t("lastSub")}</span>
          </div>
          {history.rows.length === 0 ? (
            <HireEmpty icon="mail" title={t("historyEmpty")} text={t("historyEmptyText")} />
          ) : (
            <>
              <div className="tsth tsrr3">
                <span>{t("cols.candidate")}</span>
                <span>{t("cols.rule")}</span>
                <span>{t("cols.when")}</span>
                <span>{t("cols.result")}</span>
              </div>
              {history.rows.map((row) => (
                <HistoryRow key={row.id} row={row} />
              ))}
            </>
          )}
        </div>
      </HirePage>
    );

  const ruleRow = (
    key: string,
    icon: HireIconName,
    enabled: boolean,
    sent: string,
    toggle: React.ReactNode,
  ) => (
    <div key={key} className={enabled ? "surr tsrow" : "surr tsrow off"}>
      <span className="chip-ic">
        <HireIcon name={icon} size="s" />
      </span>
      <span style={{ minWidth: 0 }}>
        <b className="tr" style={{ display: "block" }}>
          {lt(`rules.${key}.title`)}
        </b>
        <em className="tr">{lt(`rules.${key}.when`)}</em>
      </span>
      <span className="meta">{sent}</span>
      {toggle}
    </div>
  );
  const flow: [HireIconName, string, number][] = [
    ["mail", "received", 1],
    ["tests", "test", 0],
    ["cal", "slot", 0],
    ["clock", "interview", 0],
    ["shield", "decision", 2],
  ];
  const lastFive = history.rows.slice(0, 5);
  const digestDate = new Date();
  digestDate.setUTCHours(overview.digestHourUtc, 0, 0, 0);
  const digestTime = format.dateTime(digestDate, { hour: "2-digit", minute: "2-digit" });
  return (
    <HirePage view="suivi">
      <HirePageHead
        title={t("heads.rules")}
        sub={t("sub")}
        tabs={tabs}
        actions={
          <Link className="btn ghost" href="/app/hire/modeles">
            <HireIcon name="mail" />
            {t("templates")}
          </Link>
        }
      />
      <Flash query={query} />
      <div className="tstodo">
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="shield" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{t("todo.pending", { count: overview.todo.pending })}</b>
            <em>
              {overview.todo.pendingFirst
                ? t("todo.pendingFirst", overview.todo.pendingFirst)
                : t("todo.pendingNone")}
            </em>
          </span>
          <Link className="btn sm" href="/app/hire/candidats">
            {t("todo.pendingGo")}
          </Link>
        </div>
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="tests" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{t("todo.tests", { count: overview.todo.waitingTests })}</b>
            <em>{t("todo.testsSub")}</em>
          </span>
          <Link className="btn sm ghost" href="/app/hire/tests">
            {t("todo.testsGo")}
          </Link>
        </div>
        <div className="tstd">
          <span className="chip-ic">
            <HireIcon name="bell" size="s" />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b>{t("rules.morningDigest.title")}</b>
            <em>
              {overview.digest ? t("todo.digestOn", { time: digestTime }) : t("todo.digestOff")}
            </em>
          </span>
          <form action={toggleAutomationAction}>
            <input type="hidden" name="key" value="morningDigest" />
            <input type="hidden" name="on" value={overview.digest ? "0" : "1"} />
            <button type="submit" className="btn sm ghost">
              {overview.digest ? t("todo.digestStop") : t("todo.digestStart")}
            </button>
          </form>
        </div>
      </div>
      <div className="tsk">
        <div className="tskt">
          <span>{t("kpi.sent")}</span>
          <b className="num">{overview.kpi.week}</b>
          <em>
            {overview.kpi.weekChange > 0
              ? t("kpi.sentUp", { count: overview.kpi.weekChange })
              : t("kpi.sentSub")}
          </em>
        </div>
        <div className="tskt">
          <span>{t("kpi.slots")}</span>
          <b className="num">{overview.kpi.slotsAfterReminder}</b>
          <em>{t("kpi.slotsSub", { count: overview.kpi.slotReminders })}</em>
        </div>
        <div className="tskt">
          <span>{t("kpi.tests")}</span>
          <b className="num">{overview.kpi.testsAfterReminder}</b>
          <em>{t("kpi.testsSub", { count: overview.kpi.testReminders })}</em>
        </div>
        <div className="tskt">
          <span>{t("kpi.saved")}</span>
          <b className="num">
            {t("kpi.savedValue", {
              hours: Math.floor(overview.kpi.minutesSaved / 60),
              minutes: String(overview.kpi.minutesSaved % 60).padStart(2, "0"),
            })}
          </b>
          <em>{t("kpi.savedSub", { minutes: 2 })}</em>
        </div>
      </div>
      <div className="tsbox" style={{ marginBottom: 16 }}>
        <div className="tsh">
          <h3>{t("flow.title")}</h3>
          <span className="meta">{t("flow.sub")}</span>
        </div>
        <div className="flow suflow">
          {flow.map(([icon, key, kind], i) => (
            <div key={key} style={{ display: "contents" }}>
              <div className={kind === 2 ? "fnode dkn" : "fnode"}>
                <span
                  className="chip-ic"
                  style={
                    kind === 1
                      ? { background: "var(--lime)" }
                      : kind === 2
                        ? { background: "rgba(255,255,255,.1)", color: "var(--lime)" }
                        : undefined
                  }
                >
                  <HireIcon name={icon} size="s" />
                </span>
                <b>{lt(`flow.${key}.title`)}</b>
                <span className="meta" style={kind === 2 ? { color: "#A8BDB5" } : undefined}>
                  {lt(`flow.${key}.text`)}
                </span>
              </div>
              {i < flow.length - 1 ? (
                <div className="flink" aria-hidden="true">
                  <svg
                    viewBox="0 0 34 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M2 6h28M25 1l5 5-5 5" />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="tsgrid">
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("rulesTitle")}</h3>
            <span className="tsst live">
              <i />
              {t("active", { on, total })}
            </span>
          </div>
          <div className="tsgrp">{t("groups.candidates")}</div>
          {overview.rules.map((rule) =>
            ruleRow(
              rule.key,
              rule.icon,
              rule.enabled,
              rule.sent ? t("sends", { count: rule.sent }) : t("noSend"),
              <Toggle
                id={rule.key}
                on={rule.enabled}
                label={lt(`rules.${rule.key}.title`)}
                disabled={!overview.canManage}
              />,
            ),
          )}
          <div className="tsgrp">{t("groups.approval")}</div>
          {ruleRow(
            "decisionReply",
            "chat",
            true,
            overview.decisionsSent ? t("sends", { count: overview.decisionsSent }) : t("noSend"),
            <span
              className="toggle on"
              role="img"
              aria-label={t("rules.decisionReply.locked")}
              title={t("rules.decisionReply.locked")}
              style={{ opacity: 0.55 }}
            />,
          )}
          <div className="tsgrp">{t("groups.you")}</div>
          {ruleRow(
            "morningDigest",
            "bell",
            overview.digest,
            overview.digest ? t("digestAt", { time: digestTime }) : t("digestOff"),
            <Toggle
              id="morningDigest"
              on={overview.digest}
              label={t("rules.morningDigest.title")}
            />,
          )}
        </div>
        <div className="tsside">
          <div className="tsbox">
            <div className="ch">
              <span className="chip-ic">
                <HireIcon name="chart" size="s" />
              </span>
              <h3>{t("perDay")}</h3>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: barsWaveSvg({
                  data: overview.days.map(
                    (d) =>
                      [format.dateTime(d.from, { weekday: "short" }), d.count] as [string, number],
                  ),
                  hi: overview.days.reduce(
                    (best, d, i, all) => (d.count > all[best]!.count ? i : best),
                    0,
                  ),
                  h: 150,
                  w: 360,
                }),
              }}
            />
          </div>
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("last")}</h3>
              <Link className="btn sm ghost" href={`${PAGE}?onglet=historique`}>
                {t("seeAll")}
              </Link>
            </div>
            {lastFive.length === 0 ? (
              <HireEmpty compact icon="mail" title={t("historyEmpty")} />
            ) : (
              lastFive.map((row) => (
                <div key={row.id} className="sulast">
                  <span className={`sudot ${RESULT_TONE[row.result]}`} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <b className="tr">{lt(`rules.${row.rule}.title`)}</b>
                    <em className="tr">
                      {t("lastLine", { name: row.name, when: format.relativeTime(row.at) })}
                    </em>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </HirePage>
  );
}
