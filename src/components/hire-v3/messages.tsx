import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { hv3SendCandidateAction, hv3SendTeamAction } from "@/server/actions/hire-v3-messages";
import type {
  CandidateConversation,
  ColleagueConversation,
  MessagesInbox,
  MessageTab,
} from "@/server/services/hire-v3-messages";
import { avatarColor, initialsOf } from "./avatar";
import { HireEmpty } from "./empty";
import { HireIcon } from "./icon";
import {
  MessagesComposer,
  MessagesOrbiButton,
  MessagesScroll,
  MessagesSearch,
} from "./messages-client";
import { HirePage, HirePageHead } from "./page-head";

export const MESSAGE_TAB_SLUGS: Record<MessageTab, string | null> = {
  all: null,
  candidates: "candidats",
  team: "equipe",
};
const PAGE = "/app/messages";
const DAY = 86_400_000;

/** The tag colours of the prototype (`MST`), in turn for the stages, blue for the team. */
const TAGS: [string, string][] = [
  ["#F2994A", "#FFF1E4"],
  ["#D9A514", "#FFF7D6"],
  ["#8B6CF0", "#F1ECFF"],
  ["#3FAE3A", "#E9F8DF"],
];
const TEAM_TAG: [string, string] = ["#4C8DF6", "#EAF2FF"];
function tagOf(label: string) {
  let hash = 0;
  for (const char of label) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TAGS[hash % TAGS.length]!;
}

function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span className={`av ${avatarColor(name)} ${size}`.trim()} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}

function Tag({ label, colour }: { label: string; colour: [string, string] }) {
  return (
    <span className="mxtag" style={{ "--c": colour[0], "--b": colour[1] } as React.CSSProperties}>
      {label}
    </span>
  );
}

/** « 10:12 », « Hier », « lun. » or « 12 nov. » (`c.t` of the prototype). */
async function shortTime(date: Date, now: Date) {
  const format = await getFormatter();
  const t = await getTranslations("hireV3Messages");
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (date >= start) return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
  if (date.getTime() >= start.getTime() - DAY) return t("yesterday");
  if (date.getTime() >= start.getTime() - 6 * DAY)
    return format.dateTime(date, { weekday: "short" });
  return format.dateTime(date, { day: "numeric", month: "short" });
}

/** The bubbles, with a day mark when the day changes (`.mxday`). */
async function Bubbles({
  messages,
  receipt,
  lastOrgId,
}: {
  messages: { id: string; mine: boolean; body: string; at: Date }[];
  receipt?: "read" | "delivered" | null;
  lastOrgId?: string | null;
}) {
  const t = await getTranslations("hireV3Messages");
  const format = await getFormatter();
  const now = new Date();
  const dayOf = (date: Date) => date.toDateString();
  return (
    <div className="mxbs" id="hv3-bubbles">
      {messages.length === 0 ? <span className="mxday">{t("noMessage")}</span> : null}
      {messages.map((m, i) => {
        const newDay = i === 0 || dayOf(messages[i - 1]!.at) !== dayOf(m.at);
        const label =
          dayOf(m.at) === dayOf(now)
            ? t("today")
            : dayOf(m.at) === dayOf(new Date(now.getTime() - DAY))
              ? t("yesterday")
              : format.dateTime(m.at, { weekday: "long", day: "numeric", month: "long" });
        const time = format.dateTime(m.at, { hour: "2-digit", minute: "2-digit" });
        return (
          <div key={m.id} style={{ display: "contents" }}>
            {newDay ? <span className="mxday">{label}</span> : null}
            <div
              className={m.mine ? "mxb mx-me" : "mxb mx-them"}
              id={i === messages.length - 1 ? "dernier" : undefined}
              style={{ whiteSpace: "pre-line" }}
            >
              {m.body}
              <span className="mxt">
                {m.id === lastOrgId && receipt === "read" ? t("timeRead", { time }) : time}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** « Messages » of the recruiter's web app v3 (`V.messages` of the prototype, 26-28). */
export async function HireV3Messages({
  tab,
  inbox,
  candidate,
  colleague,
  templates,
  query,
}: {
  tab: MessageTab;
  inbox: MessagesInbox;
  candidate: CandidateConversation | null;
  colleague: ColleagueConversation | null;
  templates: { id: string; title: string; body: string }[];
  query: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("hireV3Messages");
  const format = await getFormatter();
  const now = new Date();
  const slug = MESSAGE_TAB_SLUGS[tab];
  const tabQuery = slug ? `&onglet=${slug}` : "";
  const tabs = (Object.keys(MESSAGE_TAB_SLUGS) as MessageTab[]).map((key) => ({
    label: t(`tabs.${key}`),
    href: MESSAGE_TAB_SLUGS[key] ? `${PAGE}?onglet=${MESSAGE_TAB_SLUGS[key]}` : PAGE,
    active: key === tab,
  }));
  const rows = inbox.rows.filter(
    (row) => tab === "all" || (tab === "team" ? row.tab === "equipe" : row.tab === "candidats"),
  );
  const selectedId = candidate?.id ?? colleague?.id ?? null;
  const error = typeof query.erreur === "string" ? query.erreur : null;
  const unreadPeople = inbox.rows.filter((row) => row.unread > 0).length;
  const times = await Promise.all(rows.map((row) => shortTime(row.at, now)));

  const list = (
    <aside className="mxl">
      <MessagesSearch placeholder={t("search")} />
      <MessagesOrbiButton
        title={t("orbi.title")}
        sub={
          inbox.unreadMessages
            ? t("orbi.sub", { messages: inbox.unreadMessages, people: unreadPeople })
            : t("orbi.none")
        }
        question={t("orbi.question")}
      />
      <div className="mxlist">
        {rows.length === 0 ? (
          <HireEmpty compact icon="chat" title={t("emptyList")} text={t(`emptyListText.${tab}`)} />
        ) : null}
        {rows.map((row, j) => {
          const team = row.tab === "equipe";
          const label = team
            ? (row.context.headline ?? t("team"))
            : (row.context.stage ?? row.context.job ?? t("candidate"));
          const group =
            j === 0
              ? row.unread
                ? t("groups.unread")
                : t("groups.all")
              : !row.unread && rows[j - 1]!.unread
                ? t("groups.earlier")
                : null;
          const href = team
            ? `${PAGE}?equipe=${row.id}${tabQuery}`
            : `${PAGE}?c=${row.id}${tabQuery}`;
          return (
            <div
              key={row.id}
              style={{ display: "contents" }}
              data-mx-row={`${row.name} ${row.preview ?? ""}`.toLowerCase()}
            >
              {group ? <span className="mxg">{group}</span> : null}
              <Link
                className={row.id === selectedId ? "mxc on" : "mxc"}
                href={href}
                scroll={false}
                aria-current={row.id === selectedId ? "true" : undefined}
              >
                <span className="mxav">
                  <Avatar name={row.name} />
                </span>
                <span className="mxci">
                  <span className="row" style={{ gap: 6 }}>
                    <b className="tr">{row.name}</b>
                    <span className="mxtm">{times[j]}</span>
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="mxlast tr">
                      {row.preview
                        ? row.mine
                          ? t("you", { text: row.preview })
                          : row.preview
                        : t("noMessage")}
                    </span>
                    {row.unread && row.id !== selectedId ? (
                      <span className="mxu">{row.unread}</span>
                    ) : null}
                  </span>
                  <Tag label={label} colour={team ? TEAM_TAG : tagOf(label)} />
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );

  const errorLine = error ? (
    <p className="meta" role="alert" style={{ padding: "6px 16px 0", color: "#B5651E" }}>
      {t(
        error === "blocked"
          ? "errors.blocked"
          : error === "trop"
            ? "errors.tooMany"
            : "errors.invalid",
      )}
    </p>
  ) : null;

  let thread: React.ReactNode;
  let side: React.ReactNode;
  if (candidate) {
    const first = candidate.person.name.split(/\s+/)[0] ?? candidate.person.name;
    const app = candidate.application;
    const stageColour = app ? tagOf(app.stage) : TEAM_TAG;
    thread = (
      <section className="mxth" aria-label={candidate.person.name}>
        <header className="mxh">
          <span className="mxav">
            <Avatar name={candidate.person.name} />
            {candidate.person.online ? <i /> : null}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b className="tr" style={{ display: "block", fontSize: 15 }}>
              {candidate.person.name}
            </b>
            <span className="meta">
              {[
                app ? t("candidateFor", { job: app.job }) : t("candidate"),
                candidate.person.online ? t("online") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <Link className="round" href="/app/hire/entretiens" aria-label={t("agenda")}>
            <HireIcon name="cal" size="s" />
          </Link>
          {app ? (
            <Link className="round" href={`/app/hire/candidats/${app.id}`} aria-label={t("file")}>
              <HireIcon name="users" size="s" />
            </Link>
          ) : null}
        </header>
        {app ? (
          <div className="mxpin">
            <Tag label={app.stage} colour={stageColour} />
            <span>
              <b>{app.job}</b>
              {app.score !== null ? ` · ${t("proximity", { score: app.score })}` : ""}
            </span>
            {app.interview ? (
              <span className="mxpin-n">
                <HireIcon name="clock" size="s" />
                {t("interviewAt", {
                  date: format.dateTime(app.interview, {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </span>
            ) : null}
          </div>
        ) : null}
        <Bubbles
          messages={candidate.messages}
          receipt={candidate.receipt}
          lastOrgId={candidate.lastOrgId}
        />
        {errorLine}
        {candidate.canWrite ? (
          <MessagesComposer
            action={hv3SendCandidateAction}
            hidden={{ conversation: candidate.id, tab: slug ?? "" }}
            placeholder={t("writeTo", { name: first })}
            sendLabel={t("send")}
            templatesLabel={t("templates")}
            templates={templates}
            orbiLabel={t("askOrbi")}
            orbiQuestion={t("orbiReply", { name: first })}
            helpLabel={t("help")}
          />
        ) : (
          <p className="meta" style={{ padding: 16 }}>
            {candidate.blocked ? t("errors.blocked") : t("readOnly")}
          </p>
        )}
      </section>
    );
    side = (
      <aside className="mxx">
        <div className="mxxh">
          <span className="mxring" style={{ "--p": app?.score ?? 0 } as React.CSSProperties}>
            <Avatar name={candidate.person.name} size="l" />
          </span>
          <b>{candidate.person.name}</b>
          {app ? <Tag label={app.stage} colour={stageColour} /> : null}
        </div>
        {app ? (
          <>
            <div className="mxk">
              <div>
                <b>{app.score !== null ? t("percent", { value: app.score }) : "–"}</b>
                <span>{t("k.proximity")}</span>
              </div>
              <div>
                <b>{app.test ?? "–"}</b>
                <span>{t("k.test")}</span>
              </div>
              <div>
                <b>{app.documents}</b>
                <span>{t("k.documents")}</span>
              </div>
            </div>
            <div className="mxf">
              <span>
                <HireIcon name="cal" size="s" />
              </span>
              <div>
                <b>
                  {app.interview
                    ? format.dateTime(app.interview, {
                        weekday: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("noInterview")}
                </b>
                <span className="meta">{app.interview ? t("interview") : t("noInterviewSub")}</span>
              </div>
            </div>
            <div className="mxf">
              <span>
                <HireIcon name="file" size="s" />
              </span>
              <div>
                <b>
                  {t("applied", {
                    date: format.dateTime(app.appliedAt, { day: "numeric", month: "long" }),
                  })}
                </b>
                <span className="meta">{app.job}</span>
              </div>
            </div>
            <Link
              className="btn sm ghost"
              style={{ justifyContent: "center" }}
              href={`/app/hire/candidats/${app.id}`}
            >
              {t("openFile")} <HireIcon name="right" size="s" />
            </Link>
          </>
        ) : null}
        <p className="meta mxlog">
          <HireIcon name="shield" size="s" />
          {t("kept")}
        </p>
      </aside>
    );
  } else if (colleague) {
    const first = colleague.other.name.split(/\s+/)[0] ?? colleague.other.name;
    const role = colleague.other.jobTitle ?? t("team");
    thread = (
      <section className="mxth" aria-label={colleague.other.name}>
        <header className="mxh">
          <span className="mxav">
            <Avatar name={colleague.other.name} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b className="tr" style={{ display: "block", fontSize: 15 }}>
              {colleague.other.name}
            </b>
            <span className="meta">{t("teamLine", { role })}</span>
          </div>
          <Link className="round" href="/app/hire/entretiens" aria-label={t("agenda")}>
            <HireIcon name="cal" size="s" />
          </Link>
        </header>
        <Bubbles messages={colleague.messages} />
        {errorLine}
        {colleague.other.left ? (
          <p className="meta" style={{ padding: 16 }}>
            {t("left")}
          </p>
        ) : (
          <MessagesComposer
            action={hv3SendTeamAction}
            hidden={{ thread: colleague.id, tab: slug ?? "" }}
            placeholder={t("writeTo", { name: first })}
            sendLabel={t("send")}
            templatesLabel={t("templates")}
            templates={[]}
            orbiLabel={t("askOrbi")}
            orbiQuestion={t("orbiReply", { name: first })}
            helpLabel={t("help")}
          />
        )}
      </section>
    );
    side = (
      <aside className="mxx">
        <div className="mxxh">
          <Avatar name={colleague.other.name} size="l" />
          <b>{colleague.other.name}</b>
          <span className="meta">{t("teamLine", { role })}</span>
        </div>
        <div className="mxf">
          <span>
            <HireIcon name="users" size="s" />
          </span>
          <div>
            <b>{t("interviews", { count: colleague.interviews })}</b>
            <span className="meta">{t("interviewsSub")}</span>
          </div>
        </div>
        {colleague.next ? (
          <div className="mxf">
            <span>
              <HireIcon name="cal" size="s" />
            </span>
            <div>
              <b>
                {format.dateTime(colleague.next.at, {
                  weekday: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </b>
              <span className="meta">{t("nextWith", { name: colleague.next.name })}</span>
            </div>
          </div>
        ) : null}
        <p className="meta mxlog">
          <HireIcon name="shield" size="s" />
          {t("keptTeam")}
        </p>
      </aside>
    );
  } else {
    thread = (
      <section className="mxth" style={{ display: "flex" }}>
        <HireEmpty icon="chat" title={t("noneOpen")} text={t("noneOpenText")} />
      </section>
    );
    side = (
      <aside className="mxx">
        <p className="meta mxlog" style={{ marginTop: "auto" }}>
          <HireIcon name="shield" size="s" />
          {t("kept")}
        </p>
      </aside>
    );
  }

  return (
    <HirePage view="messages">
      <HirePageHead
        title={t("title")}
        sub={t("unread", { count: inbox.unreadConversations })}
        tabs={tabs}
      />
      <div className="mx">
        {list}
        {thread}
        {side}
      </div>
      <MessagesScroll key={selectedId ?? "none"} />
    </HirePage>
  );
}
