import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TEAM_LOAD, type consultationLog, type teamV3 } from "@/server/services/hire-v3-team";
import { avatarColor, initialsOf } from "./avatar";
import { HireIcon } from "./icon";
import { HirePage, HirePageHead } from "./page-head";

type Team = Awaited<ReturnType<typeof teamV3>>;
type Log = Awaited<ReturnType<typeof consultationLog>>;
const LOAD_COLOURS: Record<(typeof TEAM_LOAD)[number], string> = {
  interviews: "#F2994A",
  follow: "#4C8DF6",
  diagnostic: "#8B6CF0",
  interview: "#D9A514",
};
const OFFER_COLOURS: [string, string][] = [
  ["#3FAE3A", "#E6F6E0"],
  ["#4C8DF6", "#E6EFFE"],
  ["#8B6CF0", "#EFEAFE"],
  ["#F2994A", "#FEEFE2"],
];

/**
 * « Équipe » (`V.equipe` of the prototype v3): the members on the places of the plan, the load of
 * the week, who follows which offer, and the « Journal des consultations » tab. Inviting a member
 * and entrusting a task go through the company's team screen (the existing forms).
 */
export async function HireV3Team({
  data,
  log,
  tab,
  orgName,
  canAdminister,
}: {
  data: Team;
  log: Log | null;
  tab: "membres" | "journal";
  orgName: string;
  canAdminister: boolean;
}) {
  const t = await getTranslations("hireV3Team");
  const format = await getFormatter();
  const tabs = [
    { label: t("tabs.membres"), href: "/app/hire/compte/equipe", active: tab === "membres" },
    ...(log
      ? [
          {
            label: t("tabs.journal"),
            href: "/app/hire/compte/equipe?onglet=journal",
            active: tab === "journal",
          },
        ]
      : []),
  ];
  const free = Math.max(0, data.seats.max - data.seats.used);
  const invite = canAdminister ? (
    <Link className="btn pri" href="/app/organisation/equipe?inviter=1">
      <HireIcon name="plus" />
      {t("invite")}
    </Link>
  ) : null;
  if (tab === "journal" && log)
    return (
      <HirePage view="equipe">
        <HirePageHead
          title={t("log.title")}
          sub={t("log.sub")}
          tabs={tabs}
          download={{
            href: "/app/hire/telecharger?doc=journal&retour=%2Fapp%2Fhire%2Fcompte%2Fequipe%3Fonglet%3Djournal",
          }}
        />
        <div className="tsk">
          {(
            [
              ["today", log.today],
              ["week", log.week],
              ["members", log.members],
              ["profiles", log.profiles],
            ] as const
          ).map(([key, value]) => (
            <div className="tskt" key={key}>
              <span>{t(`log.kpi.${key}`)}</span>
              <b className="num">{value}</b>
              <em>{t(`log.kpi.${key}Foot`)}</em>
            </div>
          ))}
        </div>
        <div className="tsbox">
          <div className="tsh">
            <h3>{t("log.last")}</h3>
            <span className="meta">{t("log.admin")}</span>
          </div>
          <div className="tsth eqj">
            <span>{t("log.member")}</span>
            <span>{t("log.profile")}</span>
            <span>{t("log.reason")}</span>
            <span>{t("log.when")}</span>
          </div>
          {log.rows.length === 0 ? (
            <p className="meta" style={{ padding: 14 }}>
              {t("log.empty")}
            </p>
          ) : null}
          {log.rows.map((row) => (
            <div className="eqj tsrow" key={row.id}>
              <span className="row" style={{ gap: 10, minWidth: 0 }}>
                <span className={`av xs ${avatarColor(row.actor ?? "?")}`} aria-hidden="true">
                  {initialsOf(row.actor ?? "?")}
                </span>
                <span className="tr">{row.actor ?? t("log.former")}</span>
              </span>
              {row.applicationId ? (
                <Link className="tr" href={`/app/hire/candidats/${row.applicationId}`}>
                  <b>{row.profile ?? t("log.unknown")}</b>
                </Link>
              ) : (
                <b className="tr">{row.profile ?? t("log.unknown")}</b>
              )}
              <span className="meta tr">
                {row.applicationId ? t("log.application") : t("log.search")}
              </span>
              <span className="meta">{format.relativeTime(row.at, new Date())}</span>
            </div>
          ))}
        </div>
      </HirePage>
    );
  const max = Math.max(1, ...data.members.map((m) => m.total));
  const nameOf = (userId: string | null) =>
    data.members.find((m) => m.userId === userId)?.name ?? null;
  return (
    <HirePage view="equipe">
      <HirePageHead
        title={t("title")}
        sub={t("sub", {
          org: orgName,
          count: data.members.length,
          max: data.seats.max,
          week: format.dateTime(data.monday, { day: "numeric", month: "long" }),
        })}
        tabs={tabs}
        actions={invite}
      />
      <div className="tsk">
        {(
          [
            [
              "members",
              t("kpi.membersValue", { used: data.seats.used, max: data.seats.max }),
              t("kpi.membersFoot", { count: free }),
            ],
            ["tasks", data.openTasks, t("kpi.tasksFoot", { count: data.dueToday })],
            ["interviews", data.interviews, t("kpi.interviewsFoot")],
            ["invitations", data.invitations.length, t("kpi.invitationsFoot")],
          ] as const
        ).map(([key, value, foot]) => (
          <div className="tskt" key={key}>
            <span>{t(`kpi.${key}`)}</span>
            <b className="num">{value}</b>
            <em>{foot}</em>
          </div>
        ))}
      </div>
      <div className="tsbox">
        <div className="tsh">
          <h3>{t("load.title")}</h3>
          <span className="eqlg">
            {TEAM_LOAD.map((k) => (
              <span key={k}>
                <i style={{ background: LOAD_COLOURS[k] }} />
                {t(`load.${k}`)}
              </span>
            ))}
          </span>
        </div>
        {data.members.map((m) => (
          <div className="eqr tsrow" key={m.id}>
            <span className="row" style={{ gap: 10, minWidth: 0 }}>
              <span className={`av ${avatarColor(m.name)}`} aria-hidden="true">
                {initialsOf(m.name)}
              </span>
              <span style={{ minWidth: 0 }}>
                <b className="tr" style={{ display: "block" }}>
                  {m.name}
                  {m.me ? (
                    <>
                      {" "}
                      <span className="eqme">{t("me")}</span>
                    </>
                  ) : null}
                </b>
                <em className="tr">{t(`role.${m.role}`)}</em>
              </span>
            </span>
            <span className="eqtrack" title={t("load.total", { count: m.total })}>
              {TEAM_LOAD.map((k) =>
                m.load[k] ? (
                  <i
                    key={k}
                    style={{ width: `${(m.load[k] / max) * 100}%`, background: LOAD_COLOURS[k] }}
                    title={`${t(`load.${k}`)} : ${m.load[k]}`}
                  />
                ) : null,
              )}
            </span>
            <span className="eqpc">
              <b className="num">{m.total}</b>
              <em>{t("load.items")}</em>
            </span>
            {canAdminister ? (
              <Link className="btn sm ghost" href="/app/organisation/equipe">
                {t("assign")}
              </Link>
            ) : (
              <span />
            )}
          </div>
        ))}
        {data.invitations.map((inv) => (
          <div className="eqpend" key={inv.id}>
            <span className="row" style={{ gap: 10, minWidth: 0 }}>
              <span className={`av ${avatarColor(inv.email)}`} aria-hidden="true">
                {initialsOf(inv.email)}
              </span>
              <span>
                <b style={{ display: "block" }}>{inv.email}</b>
                <em className="meta" style={{ fontStyle: "normal" }}>
                  {t("pending", {
                    when: format.relativeTime(inv.createdAt, new Date()),
                    role: t(`role.${inv.role}`),
                  })}
                </em>
              </span>
            </span>
            <span className="tsst">{t("waiting")}</span>
          </div>
        ))}
        {canAdminister && free > 0 ? (
          <Link className="tsnew" href="/app/organisation/equipe?inviter=1">
            <HireIcon name="plus" size="s" />
            {t("addMember", { count: free })}
          </Link>
        ) : null}
      </div>
      {data.jobs.length ? (
        <div className="tsbox" style={{ marginTop: 16 }}>
          <div className="tsh">
            <h3>{t("follow.title")}</h3>
            <span className="eqlg">
              <span>
                <i className="eqk r" />
                {t("follow.owner")}
              </span>
            </span>
          </div>
          <div className="eqm">
            <span />
            {data.jobs.map((j, i) => (
              <span
                className="eqoh"
                key={j.id}
                style={{ "--c": OFFER_COLOURS[i]![0] } as React.CSSProperties}
              >
                <i />
                {j.title}
              </span>
            ))}
            {data.members.map((m) => (
              <FollowRow
                key={m.id}
                name={m.name}
                cells={data.jobs.map((j, i) => (j.owner === m.userId ? i : -1))}
                label={t("follow.owner")}
              />
            ))}
          </div>
          {data.jobs.some((j) => !nameOf(j.owner)) ? (
            <p className="meta" style={{ padding: "8px 10px" }}>
              {t("follow.none")}
            </p>
          ) : null}
        </div>
      ) : null}
    </HirePage>
  );
}

function FollowRow({ name, cells, label }: { name: string; cells: number[]; label: string }) {
  return (
    <>
      <span className="row eqmn" style={{ gap: 10, minWidth: 0 }}>
        <span className={`av xs ${avatarColor(name)}`} aria-hidden="true">
          {initialsOf(name)}
        </span>
        <b className="tr">{name}</b>
      </span>
      {cells.map((index, j) => (
        <span className="eqc" key={j}>
          {index >= 0 ? (
            <span
              className="eqpill r"
              style={
                {
                  "--c": OFFER_COLOURS[index]![0],
                  "--b": OFFER_COLOURS[index]![1],
                } as React.CSSProperties
              }
            >
              {label}
            </span>
          ) : null}
        </span>
      ))}
    </>
  );
}
