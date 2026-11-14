import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { pickMessages } from "@/i18n/client-messages";
import type { HireHome, HomePeriod } from "@/server/services/hire-v3-home";
import { avatarColor, initialsOf } from "./avatar";
import { funnelSvg } from "./charts";
import { HireEmpty } from "./empty";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage, HirePageHead } from "./page-head";
import { HireReceivedChart } from "./received-chart";
import { HireScrollBox } from "./scroll-box";

/** The colour of an offer's tile, one per offer in turn (`o.bg` of the prototype). */
const OFFER_BG = ["var(--s5)", "var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
/** The colours of the funnel's stages (`funnel()` of the prototype), by kind. */
const FUNNEL = ["#4C8DF6", "#8B6CF0", "#F2994A", "#E9B824", "#5DBB2E"];

export type HomeNotification = {
  id: string;
  href: string;
  icon: HireIconName;
  text: string;
  meta: string;
  unread: boolean;
};

const NOTIF_COLOURS: Record<string, [string, string]> = {
  users: ["var(--s5)", "var(--s5f)"],
  cal: ["var(--s3)", "var(--s3f)"],
  tests: ["var(--s2)", "var(--s2f)"],
  chat: ["var(--s1)", "var(--s1f)"],
  bell: ["var(--s4)", "var(--s4f)"],
};

function Delta({ value, kind }: { value: string; kind: "up" | "down" | "flat" }) {
  return <span className={`delta ${kind}`}>{value}</span>;
}

/**
 * The home of the recruiter's web app v3 (`V.accueil` of docs/mvp-web-recruteur/prototype-v3,
 * screens 01-03), with the figures of the organization (`hireHome`).
 */
export async function HireV3Home({
  home,
  name,
  notifications,
  unreadNotifications,
}: {
  home: HireHome;
  name: string | null;
  notifications: HomeNotification[];
  unreadNotifications: number;
}) {
  const t = await getTranslations("hireV3Home");
  const format = await getFormatter();
  const messages = await getMessages();
  const period = home.period;
  const tabs = (["jour", "semaine", "mois"] as HomePeriod[]).map((p) => ({
    label: t(`periods.${p}`),
    href: p === "semaine" ? "/app/hire" : `/app/hire?periode=${p}`,
    active: p === period,
  }));
  const delta = (change: number | null) =>
    change === null ? null : change > 0 ? (
      <Delta value={t("delta.up", { value: change })} kind="up" />
    ) : change < 0 ? (
      <Delta value={t("delta.down", { value: -change })} kind="down" />
    ) : (
      <Delta value={t("delta.stable")} kind="flat" />
    );
  const bars = home.bars.map((bar) => {
    if ("hour" in bar && bar.hour !== undefined)
      return {
        label: t("chart.hour", { hour: bar.hour }),
        long: t("chart.hourLong", { hour: bar.hour }),
        received: bar.received,
        shortlisted: bar.shortlisted,
      };
    if ("day" in bar && bar.day !== undefined)
      return {
        label: t(`chart.days.${bar.day}` as "chart.days.0"),
        long: t(`chart.daysLong.${bar.day}` as "chart.daysLong.0"),
        received: bar.received,
        shortlisted: bar.shortlisted,
      };
    const n = "week" in bar ? (bar.week ?? 1) : 1;
    return {
      label: t("chart.week", { n }),
      long: t("chart.weekLong", { n }),
      received: bar.received,
      shortlisted: bar.shortlisted,
    };
  });
  const kpi = (
    title: string,
    value: string | number,
    d: React.ReactNode,
    icon: HireIconName,
    extra = "",
  ) => (
    <div className={extra ? `kpi ${extra}` : "kpi"}>
      <div className="t">
        {title}
        <span className="chip-ic">
          <HireIcon name={icon} size="s" />
        </span>
      </div>
      <div className="v num">{value}</div>
      <div className="f">
        {d}
        <span />
      </div>
    </div>
  );
  const { today } = home;
  const todo: { title: string; sub: string; href: string }[] = [
    ...(today.counts.unseen
      ? [
          {
            title: t("todo.unseen", { count: today.counts.unseen }),
            sub: t("todo.unseenSub"),
            href: "/app/hire/candidats",
          },
        ]
      : []),
    ...(today.counts.invitations
      ? [
          {
            title: t("todo.invitations", { count: today.counts.invitations }),
            sub: t("todo.invitationsSub"),
            href: "/app/hire/entretiens",
          },
        ]
      : []),
    ...(today.counts.scorecards
      ? [
          {
            title: t("todo.scorecards", { count: today.counts.scorecards }),
            sub: t("todo.scorecardsSub"),
            href: "/app/hire/candidats",
          },
        ]
      : []),
    ...(today.counts.unread
      ? [
          {
            title: t("todo.unread", { count: today.counts.unread }),
            sub: t("todo.unreadSub"),
            href: "/app/messages",
          },
        ]
      : []),
    ...home.tasks.map((task) => ({
      title: t(`todo.task.${task.kind}`, { candidate: task.candidate }),
      sub: t("todo.due", { date: format.dateTime(task.dueAt, { day: "numeric", month: "short" }) }),
      href: `/app/hire/candidats/${task.applicationId}`,
    })),
  ];
  const funnel = home.funnel.slice(0, 5).map((stage, index) => ({
    label: stage.name,
    count: stage.count,
    colour: FUNNEL[index] ?? FUNNEL[4]!,
    href: home.focus ? `/app/hire/candidats?offre=${home.focus.id}` : "/app/hire/candidats",
  }));
  const first = funnel[0]?.count ?? 0;

  return (
    <NextIntlClientProvider messages={pickMessages(messages, ["hireV3Home"])}>
      <HirePage view="accueil">
        <div className="fit">
          <HirePageHead
            title={name ? t("hello", { name }) : t("helloAnon")}
            sub={t("sub")}
            tabs={tabs}
            actions={
              <>
                <Link className="btn ghost" href="/app/hire/entretiens">
                  <HireIcon name="cal" />
                  {t("plan")}
                </Link>
                <Link className="btn pri" href="/app/hire/offres/nouvelle">
                  <HireIcon name="plus" />
                  {t("publish")}
                </Link>
              </>
            }
          />
          <div className="dash">
            <div className="card vcard d-a">
              <div className="ch" style={{ marginBottom: 6 }}>
                <span className="chip-ic">
                  <HireIcon name="users" size="s" />
                </span>
                <h3>{t("applications.title")}</h3>
                <div className="r">
                  <Link className="lnk" href="/app/hire/offres">
                    {t("applications.all")} <HireIcon name="ur" size="s" />
                  </Link>
                </div>
              </div>
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                <b className="num" style={{ fontSize: 30, lineHeight: 1.1 }}>
                  {home.received}
                </b>
                {delta(home.receivedChange)}
                <span className="meta" style={{ marginLeft: "auto" }}>
                  {t("applications.live", { count: home.liveOffers })}
                </span>
              </div>
              {home.offers.length === 0 ? (
                <HireEmpty
                  icon="briefcase"
                  title={t("applications.empty")}
                  text={t("applications.emptyText")}
                  action={{
                    href: "/app/hire/offres/nouvelle",
                    label: t("publish"),
                    icon: "plus",
                  }}
                />
              ) : (
                <HireScrollBox>
                  <div className="stack" style={{ gap: 6, paddingBottom: 30 }}>
                    {home.offers.map((offer, index) => {
                      const max = Math.max(1, ...home.offers.map((o) => o.applications));
                      return (
                        <Link key={offer.id} className="ofr" href={`/app/hire/offres/${offer.id}`}>
                          <span className="ot" style={{ background: OFFER_BG[index % 5] }}>
                            <HireIcon name="briefcase" size="s" />
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <b className="tr">{offer.title}</b>
                            <span className="meta tr">
                              {[
                                offer.department,
                                offer.live
                                  ? offer.daysLeft === null
                                    ? t("applications.open")
                                    : t("applications.daysLeft", { count: offer.daysLeft })
                                  : t("applications.paused"),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            <span className="bar" style={{ marginTop: 5, height: 5 }}>
                              <i
                                style={{
                                  width: `${Math.min(100, (offer.applications / max) * 100)}%`,
                                  background: "var(--sapin)",
                                }}
                              />
                            </span>
                          </span>
                          <span className="on">
                            <b className="num">{offer.applications}</b>
                            <span className="meta">{t("applications.received")}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </HireScrollBox>
              )}
            </div>

            <div className="d-b">
              <div className="kgrid">
                {kpi(
                  t("kpi.shortlisted"),
                  home.shortlisted,
                  delta(home.shortlistedChange),
                  "users",
                  "gr",
                )}
                {kpi(t("kpi.interviews"), home.interviews, delta(home.interviewsChange), "video")}
                {kpi(t("kpi.tests"), 0, null, "tests")}
                {kpi(
                  t("kpi.delay"),
                  home.delay === null ? t("kpi.none") : t("kpi.delayValue", { count: home.delay }),
                  null,
                  "hourglass",
                )}
              </div>
            </div>

            <div className="card vcard d-c">
              <div className="ch" style={{ marginBottom: 4 }}>
                <h3>{t("chart.title")}</h3>
                <div className="r">
                  <div className="legend">
                    <span>
                      <i className="hatch" style={{ backgroundColor: "#A6F26B" }} />
                      {t("chart.received")}
                    </span>
                    <span>
                      <i style={{ background: "#0E1B17" }} />
                      {t("chart.shortlisted")}
                    </span>
                  </div>
                  <Link className="round" href="/app/hire/rapports" aria-label={t("chart.reports")}>
                    <HireIcon name="ur" size="s" />
                  </Link>
                </div>
              </div>
              <HireReceivedChart bars={bars} href="/app/hire/candidats" />
            </div>

            <div className="card vcard d-d nx">
              <div className="ch" style={{ marginBottom: 4 }}>
                <span className="nx-ic">
                  <HireIcon name="target" size="s" />
                </span>
                <h3 style={{ fontSize: 15 }}>{t("meet.title")}</h3>
                <div className="r">
                  {today.nextConfirmed?.at ? (
                    <span className="pill p-2">
                      <HireIcon name="clock" size="s" />
                      {format.dateTime(today.nextConfirmed.at, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="meta" style={{ marginBottom: 8 }}>
                {home.focus
                  ? t("meet.sub", { offer: home.focus.title, count: home.best.length })
                  : t("meet.noFocus")}
              </div>
              {home.best.length === 0 ? (
                <HireEmpty
                  icon="target"
                  title={home.focus ? t("meet.emptyTitle") : t("meet.noOffer")}
                  text={home.focus ? t("meet.emptyText") : t("meet.noOfferText")}
                />
              ) : (
                <HireScrollBox className="ptl nxl" more={false}>
                  <div className="stack" style={{ gap: 4, paddingBottom: 6 }}>
                    {home.best.map((c, i) => (
                      <Link key={c.id} className="cv" href={`/app/hire/candidats/${c.id}`}>
                        <span className="rk">{i + 1}</span>
                        <span className={`av ${avatarColor(c.name)} xs`} aria-hidden="true">
                          {initialsOf(c.name)}
                        </span>
                        <b className="tr" style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                          {c.name}
                        </b>
                        <span className="scb">
                          <i style={{ width: `${c.score}%` }} />
                        </span>
                        <b className="sc-b">{t("meet.score", { score: c.score })}</b>
                      </Link>
                    ))}
                  </div>
                </HireScrollBox>
              )}
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <Link
                  className="btn sm pri"
                  style={{ flex: 1, justifyContent: "center" }}
                  href={
                    home.focus
                      ? `/app/hire/candidats?offre=${home.focus.id}`
                      : "/app/hire/candidats"
                  }
                >
                  {t("meet.open")} <HireIcon name="right" size="s" />
                </Link>
              </div>
            </div>

            <div className="card vcard d-t">
              <div className="ch">
                <span className="chip-ic">
                  <HireIcon name="check" size="s" />
                </span>
                <h3>{t("todo.title")}</h3>
                <div className="r">
                  <span className="pill p-n">{t("todo.left", { count: todo.length })}</span>
                </div>
              </div>
              {todo.length === 0 ? (
                <HireEmpty
                  icon="check"
                  title={t("todo.empty")}
                  text={home.offers.length === 0 ? t("todo.emptyNoOffer") : t("todo.emptyText")}
                  action={
                    home.offers.length === 0
                      ? { href: "/app/hire/entreprise", label: t("todo.company"), icon: "r_build" }
                      : undefined
                  }
                />
              ) : (
                <HireScrollBox>
                  <div className="stack" style={{ gap: 6, paddingBottom: 30 }}>
                    {todo.map((task) => (
                      <Link
                        key={task.title + task.href}
                        className="task"
                        href={task.href}
                        style={{ padding: "8px 10px", textDecoration: "none", color: "inherit" }}
                      >
                        <span className="box" aria-hidden="true">
                          <HireIcon name="check" size="s" />
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="tt tr" style={{ fontWeight: 600, fontSize: 13 }}>
                            {task.title}
                          </div>
                          <div className="meta tr">{task.sub}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </HireScrollBox>
              )}
            </div>

            <div className="card vcard d-n">
              <div className="ch">
                <span className="chip-ic">
                  <HireIcon name="bell" size="s" />
                </span>
                <h3>{t("notifications.title")}</h3>
                <div className="r">
                  {unreadNotifications > 0 ? (
                    <span className="pill p-ok">
                      {t("notifications.new", { count: unreadNotifications })}
                    </span>
                  ) : null}
                  <Link
                    className="round"
                    href="/app/notifications"
                    aria-label={t("notifications.all")}
                  >
                    <HireIcon name="ur" size="s" />
                  </Link>
                </div>
              </div>
              {notifications.length === 0 ? (
                <HireEmpty
                  icon="bell"
                  title={t("notifications.empty")}
                  text={t("notifications.emptyText")}
                />
              ) : (
                <div className="stack nlist">
                  {notifications.map((n) => {
                    const [bg, fg] = NOTIF_COLOURS[n.icon] ?? NOTIF_COLOURS.bell!;
                    return (
                      <Link key={n.id} className="nt" href={n.href}>
                        <span className="ti" style={{ background: bg, color: fg }}>
                          <HireIcon name={n.icon} size="s" />
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <b className="tr" style={{ display: "block", fontSize: 13 }}>
                            {n.text}
                          </b>
                          <span className="meta">{n.meta}</span>
                        </div>
                        {n.unread ? <i className="ud" /> : null}
                      </Link>
                    );
                  })}
                </div>
              )}
              <Link
                href="/app/notifications"
                className="meta"
                style={{
                  marginTop: "auto",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "var(--sapin)",
                  paddingTop: 6,
                }}
              >
                {t("notifications.all")}
              </Link>
            </div>
          </div>
        </div>
        <div className="below">
          <div className="card bl-p">
            <div className="ch">
              <span className="chip-ic">
                <HireIcon name="layers" size="s" />
              </span>
              <h3>{t("funnel.title")}</h3>
              <div className="r">
                {home.focus ? (
                  <Link
                    className="chip on"
                    style={{ height: 28, fontSize: 12 }}
                    href={`/app/hire/offres/${home.focus.id}`}
                  >
                    {home.focus.title} <HireIcon name="down" size="s" />
                  </Link>
                ) : null}
                <Link className="lnk" href="/app/hire/candidats">
                  {t("funnel.open")} <HireIcon name="ur" size="s" />
                </Link>
              </div>
            </div>
            {funnel.length > 1 ? (
              <div className="fn" style={{ "--n": funnel.length } as React.CSSProperties}>
                <div className="fn-h">
                  {funnel.map((stage) => (
                    <Link key={stage.label} className="fn-s" href={stage.href}>
                      <span className="fn-l">
                        <i style={{ background: stage.colour }} />
                        {stage.label}
                      </span>
                      <b className="num">{stage.count}</b>
                    </Link>
                  ))}
                </div>
                <div className="fn-b">
                  <div
                    style={{ display: "contents" }}
                    dangerouslySetInnerHTML={{ __html: funnelSvg(funnel) }}
                  />
                  {funnel.slice(1).map((stage, i) => (
                    <span
                      key={stage.label}
                      className="fn-c"
                      style={{ left: `${((i + 1) / funnel.length) * 100}%` }}
                    >
                      {t("funnel.rate", {
                        rate: funnel[i]!.count
                          ? Math.round((stage.count / funnel[i]!.count) * 100)
                          : 0,
                      })}
                    </span>
                  ))}
                </div>
                <div className="fn-f">
                  {funnel.map((stage, i) => (
                    <span key={stage.label} className="meta">
                      {i === funnel.length - 1
                        ? t("funnel.decide")
                        : t("funnel.share", {
                            rate: first ? Math.round((stage.count / first) * 100) : 0,
                          })}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <HireEmpty
                compact
                icon="layers"
                title={t("funnel.empty")}
                text={t("funnel.emptyText")}
              />
            )}
          </div>
          <div className="card bl-w">
            <div className="ch">
              <span className="chip-ic">
                <HireIcon name="cal" size="s" />
              </span>
              <h3>{t("week.title")}</h3>
              <div className="r">
                <Link className="lnk" href="/app/hire/entretiens">
                  {t("week.agenda")} <HireIcon name="ur" size="s" />
                </Link>
              </div>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              {home.week.length === 0 ? (
                <HireEmpty
                  compact
                  icon="cal"
                  title={t("week.empty")}
                  text={t("week.emptyText")}
                  action={{ href: "/app/hire/entretiens", label: t("week.agenda") }}
                />
              ) : null}
              {home.week.map((event) => (
                <Link key={event.id} className="wev" href="/app/hire/entretiens">
                  <span className="evd">
                    <b>{format.dateTime(event.startsAt, { weekday: "short" })}</b>
                    {format.dateTime(event.startsAt, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`av ${avatarColor(event.name)} xs`} aria-hidden="true">
                    {initialsOf(event.name)}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b className="tr" style={{ display: "block", fontSize: 13 }}>
                      {event.name}
                    </b>
                    <span className="meta">
                      {t(`week.mode.${event.mode}`, { minutes: event.minutes })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </HirePage>
    </NextIntlClientProvider>
  );
}
