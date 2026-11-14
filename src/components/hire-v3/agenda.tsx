import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  AGENDA_H0,
  AGENDA_H1,
  agendaAddDays,
  agendaWeekday,
  zonedInstant,
  type AgendaV3,
  type AgendaView,
} from "@/server/services/hire-v3-agenda";
import { avatarColor, initialsOf } from "./avatar";
import { HireCountdown } from "./countdown";
import { HireIcon, type HireIconName } from "./icon";
import { HirePage } from "./page-head";
import { HireTabs } from "./tabs";

/** Kinds of events (`ETY` of the prototype), from the candidate's stage. */
const ETY: Record<string, [string, string]> = {
  interview: ["#F2994A", "#FFF1E4"],
  screening: ["#8B6CF0", "#F1ECFF"],
  test: ["#D9A514", "#FFF7D6"],
  offer: ["#3FAE3A", "#E9F8DF"],
  hired: ["#3FAE3A", "#E9F8DF"],
  new: ["#4C8DF6", "#EAF2FF"],
  rejected: ["#8C9AB8", "#EEF1F6"],
};
const PX = 58;
const MODE_ICON: Record<string, HireIconName> = { video: "video", onsite: "pin", audio: "chat" };

/** Agenda (`V.agenda` of the prototype v3): Jour, Semaine, Mois, with the next interview. */
export async function HireV3Agenda({
  data,
  timeZone,
  query,
  now,
}: {
  now: Date;
  data: AgendaV3;
  timeZone: string;
  query: { rdv?: string; creneau?: string };
}) {
  const t = await getTranslations("hireV3Agenda");
  const format = await getFormatter();
  const href = (extra: Record<string, string>) => {
    const params = new URLSearchParams({
      ...(data.view === "semaine" ? {} : { vue: data.view }),
      ...(data.focus === data.today ? {} : { date: data.focus }),
      ...extra,
    });
    const text = params.toString();
    return `/app/hire/entretiens${text ? `?${text}` : ""}`;
  };
  const tabs = (["jour", "semaine", "mois"] as AgendaView[]).map((view) => ({
    label: t(`tabs.${view}`),
    href: `/app/hire/entretiens?${new URLSearchParams({ ...(view === "semaine" ? {} : { vue: view }), date: data.focus })}`,
    active: view === data.view,
  }));
  const dayLabel = (
    key: string,
    opts: Pick<Intl.DateTimeFormatOptions, "weekday" | "day" | "month" | "year">,
  ) => format.dateTime(new Date(`${key}T12:00:00Z`), { ...opts, timeZone: "UTC" });
  const hourText = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return m
      ? t("time", { hour: h, minute: String(m).padStart(2, "0") })
      : t("timeShort", { hour: h });
  };
  const type = (kind: string) => t(`type.${kind}` as "type.interview");
  const colour = (kind: string) => ETY[kind] ?? ETY.interview!;
  const period =
    data.view === "mois"
      ? dayLabel(data.monthStart, { month: "long", year: "numeric" })
      : data.view === "jour"
        ? dayLabel(data.focus, { weekday: "long", day: "numeric", month: "long" })
        : `${dayLabel(data.days[0]!, { day: "numeric" })} – ${dayLabel(data.days[data.days.length - 1]!, { day: "numeric", month: "long", year: "numeric" })}`;
  const up = data.upcoming;
  const firstFree = (() => {
    for (const key of data.view === "mois" ? [data.today] : data.days)
      for (let h = AGENDA_H0; h < AGENDA_H1; h++) {
        if (h === 12) continue;
        if (zonedInstant(key, h, timeZone) <= now) continue;
        if (!data.events.some((e) => e.day === key && h + 1 > e.hour && h < e.hour + e.length))
          return `${key}T${h}`;
      }
    return null;
  })();

  const hero = (
    <>
      <div className="ahero">
        <div>
          <span className="meta" style={{ color: "#33443E" }}>
            {t("today")}
          </span>
          <h1>{dayLabel(data.today, { weekday: "long", day: "numeric", month: "long" })}</h1>
          <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span className="achip">
              <HireIcon name="cal" size="s" />
              <b>{data.weekCount}</b> {t("weekCount", { count: data.weekCount })}
            </span>
            <span className="achip">
              <HireIcon name="plus" size="s" />
              <b>{data.free}</b> {t("free", { count: data.free })}
            </span>
          </div>
        </div>
        <div className="anext">
          {up ? (
            <>
              <div className="row" style={{ gap: 10 }}>
                <span className={`av ${avatarColor(up.name)}`} aria-hidden="true">
                  {initialsOf(up.name)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <span className="meta">{t("nextAt", { time: hourText(up.hour) })}</span>
                  <b style={{ display: "block" }}>{up.name}</b>
                </div>
              </div>
              <HireCountdown at={up.startsAt.toISOString()} />
              {up.link ? (
                <a className="btn sm pri" href={up.link} target="_blank" rel="noopener noreferrer">
                  <HireIcon name="video" size="s" />
                  {t("join")}
                </a>
              ) : (
                <Link className="btn sm pri" href={`/app/hire/entretiens/${up.id}`}>
                  <HireIcon name="video" size="s" />
                  {t("join")}
                </Link>
              )}
            </>
          ) : (
            <span className="meta">{t("noNext")}</span>
          )}
        </div>
      </div>
      <div className="ph aph">
        <div className="row" style={{ gap: 8 }}>
          <Link
            className="round"
            href={href({ date: data.prev })}
            aria-label={t("prev")}
            scroll={false}
          >
            <HireIcon name="chev" size="s" style={{ transform: "rotate(180deg)" }} />
          </Link>
          <b className="aper">{period}</b>
          <Link
            className="round"
            href={href({ date: data.next })}
            aria-label={t("next")}
            scroll={false}
          >
            <HireIcon name="chev" size="s" />
          </Link>
          <Link
            className="chip"
            style={{ height: 30 }}
            href={`/app/hire/entretiens${data.view === "semaine" ? "" : `?vue=${data.view}`}`}
            scroll={false}
          >
            {t("todayBtn")}
          </Link>
        </div>
        <div className="row" style={{ gap: 8, marginLeft: "auto" }}>
          {firstFree && data.invitable.length ? (
            <Link className="btn pri sm" href={href({ creneau: firstFree })} scroll={false}>
              <HireIcon name="plus" size="s" />
              {t("propose")}
            </Link>
          ) : null}
        </div>
        <div className="act">
          <HireTabs tabs={tabs} />
        </div>
      </div>
    </>
  );
  const kinds = ["interview", "screening", "test", "offer"];
  const legend = (
    <div className="alg">
      {kinds.map((kind) => (
        <span key={kind}>
          <i style={{ background: colour(kind)[0] }} />
          {type(kind)}
        </span>
      ))}
      <span>
        <i className="lf" />
        {t("freeLegend")}
      </span>
    </div>
  );
  const todayEvents = data.events.filter((e) => e.day === data.today);
  const weekdays = t("weekdays").split(",");
  const monthDays = (() => {
    const first = data.monthStart;
    const list: string[] = [];
    for (let d = first; d.slice(0, 7) === first.slice(0, 7); d = agendaAddDays(d, 1)) list.push(d);
    return list;
  })();
  const busyDays = new Set(data.events.map((e) => e.day));
  const side = (
    <div className="aside">
      <div className="card">
        <div className="ch">
          <span className="chip-ic">
            <HireIcon name="clock" size="s" />
          </span>
          <h3>{t("todayCard")}</h3>
          <div className="r">
            <span className="pill p-n">{t("todayCount", { count: todayEvents.length })}</span>
          </div>
        </div>
        <div className="atl">
          {todayEvents.length === 0 ? <p className="meta">{t("todayEmpty")}</p> : null}
          {todayEvents.map((e) => {
            const st = e.done ? "past" : up && up.id === e.id ? "next" : "";
            const minutes = Math.max(
              0,
              Math.round((e.startsAt.getTime() - now.getTime()) / 60_000),
            );
            return (
              <Link
                key={e.id}
                className={`ati ${st}`}
                href={href({ rdv: e.id })}
                scroll={false}
                style={{ "--c": colour(e.kind)[0] } as React.CSSProperties}
              >
                <span className="atm">{hourText(e.hour)}</span>
                <span className="atd" />
                <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <b className="tr" style={{ display: "block" }}>
                    {e.name}
                  </b>
                  <span className="meta">
                    {type(e.kind)} · {t(`mode.${e.mode}`)}
                  </span>
                </span>
                {st === "next" ? (
                  <em>{t("inMinutes", { count: minutes })}</em>
                ) : st === "past" ? (
                  <span className="meta">{t("doneLabel")}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div className="ch">
          <span className="chip-ic">
            <HireIcon name="cal" size="s" />
          </span>
          <h3>{dayLabel(data.monthStart, { month: "long" })}</h3>
        </div>
        <div className="mm">
          {weekdays.map((w, i) => (
            <span key={i} className="w">
              {w}
            </span>
          ))}
          {Array.from({ length: agendaWeekday(data.monthStart) }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {monthDays.map((d) => {
            const wd = agendaWeekday(d);
            const inWeek = data.view === "semaine" && data.days.includes(d);
            const cls = [
              d === data.today ? "t" : "",
              busyDays.has(d) ? "b" : "",
              wd >= 5 ? "we" : "",
              inWeek ? "wk" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <Link
                key={d}
                className={cls || undefined}
                href={`/app/hire/entretiens?vue=jour&date=${d}`}
                scroll={false}
              >
                {Number(d.slice(8))}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  let main: React.ReactNode;
  if (data.view === "mois") {
    main = (
      <div className="card">
        {legend}
        <div className="mg">
          {t("weekdaysLong")
            .split(",")
            .map((w) => (
              <div key={w} className="mgw">
                {w}
              </div>
            ))}
          {data.days.map((d) => {
            const list = data.events.filter((e) => e.day === d);
            const wd = agendaWeekday(d);
            const outside = d.slice(0, 7) !== data.monthStart.slice(0, 7);
            if (outside) return <div key={d} />;
            return (
              <div
                key={d}
                className={["mgd", d === data.today ? "t" : "", wd >= 5 ? "we" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <b>{Number(d.slice(8))}</b>
                <div className="stack" style={{ gap: 3 }}>
                  {list.slice(0, 3).map((e) => (
                    <Link
                      key={e.id}
                      className="mge"
                      href={href({ rdv: e.id })}
                      scroll={false}
                      style={
                        {
                          "--c": colour(e.kind)[0],
                          "--b": colour(e.kind)[1],
                        } as React.CSSProperties
                      }
                    >
                      {e.name.split(" ")[0]}
                    </Link>
                  ))}
                </div>
                {!list.length && wd < 5 && d >= data.today && data.invitable.length ? (
                  <Link
                    className="mgf"
                    href={href({ creneau: `${d}T9` })}
                    scroll={false}
                    aria-label={t("freeSlot")}
                  >
                    <HireIcon name="plus" size="s" />
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (data.view === "jour") {
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    main = (
      <div className="card">
        {legend}
        <div className="dayv">
          {hours.map((h) => {
            const e = data.events.find((x) => x.day === data.focus && Math.floor(x.hour) === h);
            if (e) {
              const [c, b] = colour(e.kind);
              return (
                <div key={h} className="dvr">
                  <span className="atm">{t("slot", { hour: h })}</span>
                  <Link
                    className="dve"
                    href={href({ rdv: e.id })}
                    scroll={false}
                    style={{ "--c": c, "--b": b } as React.CSSProperties}
                  >
                    <span className={`av ${avatarColor(e.name)} xs`} aria-hidden="true">
                      {initialsOf(e.name)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <b>{e.name}</b>
                      <span className="meta" style={{ display: "block" }}>
                        {hourText(e.hour)} – {hourText(e.hour + e.length)} · {t(`mode.${e.mode}`)}
                      </span>
                    </span>
                    <span
                      className="evtag"
                      style={{ "--c": c, "--b": "#fff" } as React.CSSProperties}
                    >
                      {type(e.kind)}
                    </span>
                  </Link>
                </div>
              );
            }
            const future = zonedInstant(data.focus, h, timeZone) > now;
            return (
              <div key={h} className="dvr">
                <span className="atm" style={{ color: "var(--faint)" }}>
                  {t("slot", { hour: h })}
                </span>
                {future && data.invitable.length ? (
                  <Link
                    className="dvf"
                    href={href({ creneau: `${data.focus}T${h}` })}
                    scroll={false}
                  >
                    <HireIcon name="plus" size="s" />
                    {t("freeSlot")}
                  </Link>
                ) : (
                  <span className="dvf" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    main = (
      <div className="card awk">
        {legend}
        <div className="wkw">
          <div className="atimes">
            <div className="adh" />
            {Array.from({ length: AGENDA_H1 - AGENDA_H0 }, (_, i) => (
              <span key={i} style={{ height: PX }}>
                {t("slot", { hour: AGENDA_H0 + i })}
              </span>
            ))}
          </div>
          {data.days.map((d) => {
            const list = data.events.filter((e) => e.day === d);
            const slots: number[] = [];
            for (let h = AGENDA_H0; h < AGENDA_H1; h++) {
              if (h === 12) continue;
              if (list.some((e) => h + 1 > e.hour && h < e.hour + e.length)) continue;
              if (zonedInstant(d, h, timeZone) <= now) continue;
              slots.push(h);
            }
            return (
              <div key={d} className={d === data.today ? "aday tdy" : "aday"}>
                <div className="adh">
                  <span>{dayLabel(d, { weekday: "short" })}</span>
                  <b>{Number(d.slice(8))}</b>
                  {list.length ? <em>{list.length}</em> : null}
                </div>
                <div className="adb" style={{ height: (AGENDA_H1 - AGENDA_H0) * PX }}>
                  {data.invitable.length
                    ? slots.map((h) => (
                        <Link
                          key={h}
                          className="aslot"
                          href={href({ creneau: `${d}T${h}` })}
                          scroll={false}
                          style={{ top: (h - AGENDA_H0) * PX + 3, height: PX - 6 }}
                        >
                          <HireIcon name="plus" size="s" />
                          <span>{t("slot", { hour: h })}</span>
                        </Link>
                      ))
                    : null}
                  {list.map((e) => {
                    const [c, b] = colour(e.kind);
                    const top = Math.max(0, (e.hour - AGENDA_H0) * PX + 2);
                    return (
                      <Link
                        key={e.id}
                        className="aev"
                        href={href({ rdv: e.id })}
                        scroll={false}
                        style={
                          {
                            top,
                            height: Math.max(24, e.length * PX - 4),
                            "--c": c,
                            "--b": b,
                          } as React.CSSProperties
                        }
                      >
                        <span className="row" style={{ gap: 6, minWidth: 0 }}>
                          {e.length >= 1 ? (
                            <span className={`av ${avatarColor(e.name)} xs`} aria-hidden="true">
                              {initialsOf(e.name)}
                            </span>
                          ) : null}
                          <b className="tr">{e.name}</b>
                        </span>
                        <span className="aem tr">
                          {hourText(e.hour)} · {type(e.kind)}
                        </span>
                      </Link>
                    );
                  })}
                  {d === data.today && data.nowHour >= AGENDA_H0 && data.nowHour < AGENDA_H1 ? (
                    <div className="anow" style={{ top: (data.nowHour - AGENDA_H0) * PX }}>
                      <span>{hourText(Math.floor(data.nowHour * 60) / 60)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // The event window (`agEv`) and the free hour window (`agSlot`), opened by the address.
  const event = query.rdv ? data.events.find((e) => e.id === query.rdv) : undefined;
  const slot =
    query.creneau && /^\d{4}-\d{2}-\d{2}T\d{1,2}$/.test(query.creneau) ? query.creneau : null;
  const close = href({});
  let layer: React.ReactNode = null;
  if (event) {
    const [c, b] = colour(event.kind);
    layer = (
      <div className="overlay sov" id="ov">
        <div
          className="smod"
          role="dialog"
          aria-modal="true"
          aria-label={event.name}
          style={{ width: "min(440px,100%)" }}
        >
          <div className="row" style={{ gap: 10 }}>
            <span className="evtag" style={{ "--c": c, "--b": b } as React.CSSProperties}>
              {type(event.kind)}
            </span>
            <Link
              className="round"
              style={{ marginLeft: "auto" }}
              href={close}
              scroll={false}
              aria-label={t("ev.close")}
            >
              <HireIcon name="x" size="s" />
            </Link>
          </div>
          <div className="row" style={{ gap: 12, margin: "14px 0" }}>
            <span className={`av ${avatarColor(event.name)}`} aria-hidden="true">
              {initialsOf(event.name)}
            </span>
            <div>
              <h3 style={{ margin: 0, font: "600 19px var(--f-display)" }}>{event.name}</h3>
              <span className="meta">
                {dayLabel(event.day, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                {hourText(event.hour)} – {hourText(event.hour + event.length)}
              </span>
            </div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {(
              [
                [
                  MODE_ICON[event.mode] ?? "video",
                  event.address
                    ? `${t(`mode.${event.mode}`)} · ${event.address}`
                    : t(`mode.${event.mode}`),
                ],
                ["offres", t("ev.offer", { title: event.job })],
              ] as [HireIconName, string][]
            ).map(([icon, text]) => (
              <div key={text} className="row" style={{ gap: 10, fontSize: 13 }}>
                <span className="chip-ic">
                  <HireIcon name={icon} size="s" />
                </span>
                {text}
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            {event.link && !event.done ? (
              <a className="btn sm pri" href={event.link} target="_blank" rel="noopener noreferrer">
                <HireIcon name="video" size="s" />
                {t("join")}
              </a>
            ) : null}
            <Link className="btn sm ghost" href={`/app/hire/entretiens/${event.id}`}>
              <HireIcon name="refresh" size="s" />
              {t("ev.manage")}
            </Link>
            <Link className="btn sm ghost" href={`/app/hire/candidats/${event.applicationId}`}>
              {t("ev.file")} <HireIcon name="right" size="s" />
            </Link>
          </div>
        </div>
      </div>
    );
  } else if (slot) {
    const [key, hour] = slot.split("T") as [string, string];
    const h = Number(hour);
    layer = (
      <div className="overlay sov" id="ov">
        <div
          className="smod"
          role="dialog"
          aria-modal="true"
          aria-label={t("slotTitle")}
          style={{ width: "min(460px,100%)" }}
        >
          <div className="row">
            <div>
              <h3 style={{ margin: 0, font: "600 18px var(--f-display)" }}>{t("slotTitle")}</h3>
              <span className="meta">
                {dayLabel(key, { weekday: "long", day: "numeric", month: "long" })} · {hourText(h)}{" "}
                – {hourText(h + 1)}
              </span>
            </div>
            <Link
              className="round"
              style={{ marginLeft: "auto" }}
              href={close}
              scroll={false}
              aria-label={t("ev.close")}
            >
              <HireIcon name="x" size="s" />
            </Link>
          </div>
          <div className="meta" style={{ margin: "14px 0 8px" }}>
            {t("slotWho")}
          </div>
          <div className="stack" style={{ gap: 6 }}>
            {data.invitable.length === 0 ? <p className="meta">{t("slotEmpty")}</p> : null}
            {data.invitable.map((c) => (
              <Link key={c.id} className="pick" href={`/app/hire/candidats/${c.id}/entretien`}>
                <span className={`av ${avatarColor(c.name)} xs`} aria-hidden="true">
                  {initialsOf(c.name)}
                </span>
                <b style={{ flex: 1 }}>{c.name}</b>
                {c.score !== null ? (
                  <span className={`cm ${c.score >= 75 ? "fort" : c.score >= 50 ? "cons" : "lim"}`}>
                    {t("ev.offer", { title: c.job })}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <p className="meta" style={{ marginTop: 12 }}>
            {t("slotNote")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <HirePage view="agenda">
      {hero}
      <div className="agrid">
        {main}
        {side}
      </div>
      {layer}
    </HirePage>
  );
}

export { agendaAddDays };
