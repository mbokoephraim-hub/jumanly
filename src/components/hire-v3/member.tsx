import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { loose } from "@/lib/loose-t";
import { MEMBER_RIGHTS } from "@/server/services/org-team";
import { TEAM_LOAD, type MemberFile } from "@/server/services/hire-v3-team";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { LOAD_COLOURS } from "./team";

export type MemberTab = "activity" | "tasks" | "rights";
export const MEMBER_TABS: Record<MemberTab, string> = {
  activity: "activite",
  tasks: "taches",
  rights: "droits",
};
const TEAM = "/app/hire/compte/equipe";
const TASK_COLUMNS = [
  ["assigned", "#7484AE"],
  ["accepted", "#4C8DF6"],
  ["in_progress", "#E8981C"],
  ["done", "#2FA25A"],
] as const;
const TASK_ICON: Record<string, HireIconName> = {
  follow: "users",
  diagnostic: "star",
  interview: "cal",
};
const ACTION_ICON: Record<string, HireIconName> = {
  profile_view: "eye",
  scorecard_save: "star",
  hire_group_reply: "chat",
  talent_search: "search",
  org_invite: "users",
};

async function Activity({ data }: { data: MemberFile }) {
  const t = await getTranslations("hireV3Member");
  const tt = await getTranslations("hireV3Team");
  const lt = loose(t);
  const format = await getFormatter();
  const max = Math.max(1, ...TEAM_LOAD.map((k) => data.load[k]));
  const groups: [string, MemberFile["activity"]][] = [];
  for (const a of data.activity) {
    const day = format.dateTime(a.at, { weekday: "long", day: "numeric", month: "long" });
    const last = groups.at(-1);
    if (last && last[0] === day) last[1].push(a);
    else groups.push([day, [a]]);
  }
  return (
    <div className="tsgrid">
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("activity")}</h3>
          <span className="meta">{t("activityHint")}</span>
        </div>
        {data.activity.length ? (
          groups.map(([day, rows]) => (
            <div key={day}>
              <div className="tsgrp">{day}</div>
              {rows.map((a) => (
                <div className="nwrow" key={a.id}>
                  <span className="nwch-i">
                    <HireIcon
                      name={ACTION_ICON[a.action] ?? (a.job ? "offres" : "check")}
                      size="s"
                    />
                  </span>
                  <div>
                    <b>{lt(`actions.${a.action}`)}</b>
                    {a.job ? <span className="meta">{a.job}</span> : null}
                  </div>
                  <span className="meta" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                    {format.dateTime(a.at, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="meta">{t("activityEmpty")}</p>
        )}
      </div>
      <div className="tsside">
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("loadTitle")}</h3>
          </div>
          {TEAM_LOAD.map((k) => (
            <div
              className="rdr"
              key={k}
              style={{ "--c": LOAD_COLOURS[k], padding: "8px 0" } as React.CSSProperties}
            >
              <span className="rdn">
                <i />
                {tt(`load.${k}`)}
              </span>
              <span className="rdb">
                <i style={{ width: `${(data.load[k] / max) * 100}%` }} />
              </span>
              <b className="num">{data.load[k]}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function Tasks({ data }: { data: MemberFile }) {
  const t = await getTranslations("hireV3Member");
  const to = await getTranslations("orgTeam.task");
  const format = await getFormatter();
  return (
    <div className="xpk">
      {TASK_COLUMNS.map(([status, colour]) => {
        const items = data.tasks.filter((task) => task.status === status);
        return (
          <div className="xpkc" key={status} style={{ "--c": colour } as React.CSSProperties}>
            <div className="xpkh">
              <i />
              <b>{to(`status.${status}`)}</b>
              <em>{items.length}</em>
            </div>
            {items.length ? (
              items.map((task) => (
                <Link
                  className="xpkt"
                  key={task.id}
                  href={`/app/hire/candidats/${task.applicationId}`}
                >
                  <span className="nwopt-i">
                    <HireIcon name={TASK_ICON[task.kind] ?? "check"} size="s" />
                  </span>
                  <div>
                    <b>
                      {to("line", { kind: to(`kind.${task.kind}`), candidate: task.candidate })}
                    </b>
                    <span className="meta">
                      {t("taskLine", {
                        job: task.job,
                        date: format.dateTime(task.dueAt, { day: "numeric", month: "short" }),
                      })}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="meta" style={{ padding: "6px 4px" }}>
                {t("tasksEmpty")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

async function Rights({ data, org }: { data: MemberFile; org: string }) {
  const t = await getTranslations("hireV3Member");
  const tt = await getTranslations("hireV3Team");
  const tr = await getTranslations("orgTeam.rights");
  return (
    <div className="tsgrid">
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("role", { role: tt(`role.${data.role}`) })}</h3>
          {data.canAdminister && !data.me ? (
            <Link className="btn sm ghost" href="/app/organisation/equipe">
              {t("change")}
            </Link>
          ) : null}
        </div>
        {MEMBER_RIGHTS.map((right) => (
          <div className="nwrow" key={right}>
            <div>
              <b>{right === "page" ? tr("page", { org }) : tr(right)}</b>
            </div>
            <span
              className={data.rights[right] ? "nwsw on lock" : "nwsw lock"}
              role="switch"
              aria-checked={data.rights[right]}
              aria-disabled="true"
              aria-label={right === "page" ? tr("page", { org }) : tr(right)}
            >
              <i />
            </span>
          </div>
        ))}
        <p className="meta" style={{ marginTop: 10 }}>
          {t("rightsNote")}
        </p>
      </div>
      <div className="tsside">
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("followed")}</h3>
          </div>
          {data.jobs.length ? (
            data.jobs.map((job) => (
              <Link className="nwrow" key={job.id} href={`/app/hire/offres/${job.id}`}>
                <span className="pf-od" />
                <div>
                  <b>{job.title}</b>
                </div>
              </Link>
            ))
          ) : (
            <p className="meta">{t("followedEmpty")}</p>
          )}
        </div>
        {data.canAdminister && !data.me && data.role !== "org_owner" ? (
          <div className="tsbox">
            <div className="tsh">
              <h3>{t("sensitive")}</h3>
            </div>
            <p className="meta" style={{ margin: "0 0 10px" }}>
              {t("sensitiveText")}
            </p>
            <Link className="btn sm ghost xpdanger" href="/app/organisation/equipe">
              {t("remove")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** « Fiche membre » of the recruiter's web app v3 (`V.membre` of the prototype). */
export async function HireV3Member({
  data,
  tab,
  org,
}: {
  data: MemberFile;
  tab: MemberTab;
  org: string;
}) {
  const t = await getTranslations("hireV3Member");
  const tt = await getTranslations("hireV3Team");
  const format = await getFormatter();
  const page = `${TEAM}/${data.id}`;
  const tabs = (Object.keys(MEMBER_TABS) as MemberTab[]).map((key) => ({
    label: t(`tabs.${key}`),
    href: key === "activity" ? page : `${page}?onglet=${MEMBER_TABS[key]}`,
    active: key === tab,
  }));
  const role = tt(`role.${data.role}`);
  const max = Math.max(8, data.total);
  const kpis: [string, number, string][] = [
    [t("kpi.open"), data.openTasks, t("kpi.openSub")],
    [t("kpi.interviews"), data.load.interviews, t("kpi.interviewsSub")],
    [t("kpi.done"), data.doneTasks, t("kpi.doneSub")],
    [t("kpi.jobs"), data.jobs.length, t("kpi.jobsSub")],
  ];
  return (
    <HirePage view="membre">
      <HirePageHead
        title={data.name}
        sub={t("sub", { role: data.title ?? role, org })}
        back={{ href: TEAM, label: t("back") }}
        tabs={tabs}
      />
      <div className="tsbox xpmh">
        <span className={`av l ${avatarColor(data.name)}`} aria-hidden="true">
          {initialsOf(data.name)}
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <b className="xpmh-n">
            {data.name}
            {data.me ? (
              <>
                {" "}
                <span className="eqme">{tt("me")}</span>
              </>
            ) : null}
          </b>
          <span className="meta">
            {role} ·{" "}
            {t("since", { date: format.dateTime(data.since, { month: "long", year: "numeric" }) })}
          </span>
          <span className="eqtrack" style={{ marginTop: 10 }}>
            {TEAM_LOAD.map((k) =>
              data.load[k] ? (
                <i
                  key={k}
                  style={{ width: `${(data.load[k] / max) * 100}%`, background: LOAD_COLOURS[k] }}
                />
              ) : null,
            )}
          </span>
          <span className="meta" style={{ fontSize: 12 }}>
            {t("week", { count: data.total })}
          </span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {data.me ? null : (
            <Link className="btn sm ghost" href="/app/messages?onglet=equipe">
              <HireIcon name="chat" size="s" />
              {t("write")}
            </Link>
          )}
          {data.canAdminister ? (
            <Link className="btn sm pri" href="/app/organisation/equipe">
              <HireIcon name="plus" size="s" />
              {t("assign")}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="tsk">
        {kpis.map(([label, value, sub]) => (
          <div className="tskt" key={label}>
            <span>{label}</span>
            <b className="num">{value}</b>
            <em>{sub}</em>
          </div>
        ))}
      </div>
      {tab === "tasks" ? (
        <Tasks data={data} />
      ) : tab === "rights" ? (
        <Rights data={data} org={org} />
      ) : (
        <Activity data={data} />
      )}
    </HirePage>
  );
}
