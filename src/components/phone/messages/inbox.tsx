"use client";

/* eslint-disable @next/next/no-img-element -- photos of the conversations: small, already reduced */
import "@/styles/phone-onglets.css";
import "@/styles/phone-connexions.css";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { showToast } from "@/components/motion/toaster";
import { chatSummaryAction } from "@/server/actions/chat";
import { openConnectionAction, searchMessagesAction } from "@/server/actions/messages-phone";
import type { ChatSummary } from "@/server/services/chat-summary";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon, type PhoneIconName } from "../icon";
import { MeAvatar } from "../me";
import { PhoneSheet } from "../sheet";
import { useChatPulse } from "./live";
import { ReadMark, Spark, Typing, WhoAvatar, WhoName } from "./parts";
import type { ConnectionView, FoundMessage, InboxRow, InboxTab, InboxView, WhoView } from "./types";

const TABS: InboxTab[] = ["connexions", "recruteurs", "entreprises"];
const TYPES = [
  ["photos", "photo", "#1E4E79"],
  ["docs", "document", "#B8432F"],
  ["liens", "lien", "#14745F"],
  ["contacts", "personne", "#3A2A4F"],
  ["vocaux", "micro", "#7A5C00"],
  ["rdv", "agenda", "#0F3F37"],
] as const satisfies readonly (readonly [string, PhoneIconName, string])[];
type SearchType = (typeof TYPES)[number][0];

const RECENTS = "nb-messages-recherches";
type Recent = { q: string; at: number };

function readRecents(): Recent[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENTS) ?? "[]") as Recent[];
    return Array.isArray(value)
      ? value.filter((item) => typeof item?.q === "string").slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

function keepRecent(q: string) {
  const clean = q.trim();
  if (clean.length < 2) return;
  try {
    const next = [
      { q: clean, at: Date.now() },
      ...readRecents().filter((item) => item.q !== clean),
    ];
    localStorage.setItem(RECENTS, JSON.stringify(next.slice(0, 3)));
  } catch {
    // Private browsing: the recent searches are simply not kept.
  }
}

const fmtCount = (count: number) => (count > 99 ? "99+" : String(count));

/** The colour of each rubric's label (planche Chat-liste): lime, lilac, amber. */
const TAG_COLOR: Record<InboxTab, string> = {
  connexions: "#A6F26B",
  recruteurs: "#C3A6FF",
  entreprises: "#F4C463",
};

/**
 * A conversation in the list (planche Chat-liste): the face and its ring, the name, the green
 * check, the coloured label of the rubric, the last words (bold while unread) or « écrit… », the
 * time, the number of unread messages or the double check of « Lu ».
 */
function Row({
  row,
  online,
  typing,
  index,
}: {
  row: InboxRow;
  online: boolean;
  typing: boolean;
  index: number;
}) {
  const t = useTranslations("phoneChat");
  const color = TAG_COLOR[row.tab];
  return (
    <Link
      href={`/app/messages/${row.id}`}
      className="nb-ch-ligne"
      data-nonlu={row.unread ? "" : undefined}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <WhoAvatar who={row.who} size={54} online={online} />
      <span className="nb-ch-ligne-c">
        <span className="nb-ch-ligne-h">
          <WhoName who={row.who} />
          <span className="nb-ch-tag" style={{ color, background: `${color}1F` }}>
            {t(`tag.${row.tab}`)}
          </span>
          {row.pinned ? (
            <span className="nb-ch-epingle" role="img" aria-label={t("pinned")}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 3.5h6l-1 5 3.5 3.5h-11L10 8.5zM12 12v8.5" />
              </svg>
            </span>
          ) : null}
        </span>
        {typing ? (
          <Typing label={t("typing")} />
        ) : (
          <span className="nb-ch-apercu">
            {row.voice ? (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3" />
              </svg>
            ) : null}
            <span>{row.preview}</span>
          </span>
        )}
      </span>
      <span className="nb-ch-ligne-d">
        <span className="nb-ch-heure">{row.time}</span>
        {row.unread ? (
          <span className="nb-ch-badge" aria-label={t("unread", { count: row.unread })}>
            {fmtCount(row.unread)}
          </span>
        ) : row.lastMine && row.lastRead ? (
          <ReadMark label={t("read")} color="#2FD3A6" />
        ) : row.muted ? (
          <span className="nb-ch-muet" role="img" aria-label={t("muted")}>
            <PhoneIcon name="muet" size={15} stroke={1.8} />
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** A connection to write to: its conversation, opened if it does not exist yet. */
function useOpenConnection() {
  const router = useRouter();
  const t = useTranslations("phoneMsg");
  const [pending, start] = useTransition();
  const open = (connection: ConnectionView) => {
    if (connection.conversationId) {
      router.push(`/app/messages/${connection.conversationId}`);
      return;
    }
    start(async () => {
      const result = await openConnectionAction(connection.connectionId).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      router.push(`/app/messages/${result.value}`);
    });
  };
  return { open, pending };
}

function PersonLine({ who, onClick, href }: { who: WhoView; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <WhoAvatar who={who} size={44} />
      <span className="nb-ms-ligne-c">
        <WhoName who={who} />
        <span className="nb-meta">{who.line}</span>
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="nb-ms-ligne nb-ms-ligne-p">
      {inner}
    </Link>
  ) : (
    <button type="button" className="nb-ms-ligne nb-ms-ligne-p" onClick={onClick}>
      {inner}
    </button>
  );
}

const CHAT_TABS = ["tout", ...TABS] as const;
type ChatTab = (typeof CHAT_TABS)[number];

/**
 * « Tout · Connexions · Recruteurs · Entreprises » (planche Chat-liste): the Lime pill slides
 * under the tab chosen, each tab with its unread count. Until the tabs are measured, the chosen
 * one carries the Lime itself (no dark text on dark).
 */
function Segment({
  tab,
  setTab,
  counts,
}: {
  tab: ChatTab;
  setTab: (tab: ChatTab) => void;
  counts: Record<ChatTab, number>;
}) {
  const t = useTranslations("phoneChat");
  const box = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const node = box.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    if (!node) return;
    setPill({ left: node.offsetLeft, width: node.offsetWidth });
  }, [tab]);
  return (
    <div
      ref={box}
      className="nb-ch-seg"
      role="tablist"
      aria-label={t("tabs")}
      data-mesure={pill ? "" : undefined}
    >
      {pill ? (
        <span className="nb-ch-ind" style={{ left: pill.left, width: pill.width }} aria-hidden />
      ) : null}
      {CHAT_TABS.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`ch-${key}`}
          data-tab={key}
          aria-selected={tab === key}
          aria-controls="ch-panneau"
          onClick={() => setTab(key)}
        >
          {t(`tab.${key}`)}
          {counts[key] ? (
            <b aria-label={t("unread", { count: counts[key] })}>{fmtCount(counts[key])}</b>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/**
 * « N messages non lus · Orbi résume » (planche Chat-liste-orbi): a touch asks Orbi for the
 * essential, one sentence per conversation, the most urgent in bold; a touch again folds it.
 */
function OrbiSummary({ count }: { count: number }) {
  const t = useTranslations("phoneChat.orbi");
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [shown, setShown] = useState(false);
  const [pending, start] = useTransition();
  const lines = summary?.lines ?? [];
  const toggle = () => {
    if (shown) {
      setShown(false);
      return;
    }
    if (summary && lines.length) {
      setShown(true);
      return;
    }
    start(async () => {
      const result = await chatSummaryAction().catch(() => null);
      if (!result || result.lines.length === 0) {
        showToast({ message: t("none") });
        return;
      }
      setSummary(result);
      setShown(true);
    });
  };
  const open = shown && lines.length > 0;
  return (
    <button
      type="button"
      className="nb-ch-orbi"
      aria-expanded={open}
      aria-busy={pending}
      onClick={toggle}
    >
      <span className="nb-ch-orbi-i" aria-hidden>
        <Spark size={18} />
      </span>
      <span className="nb-ch-orbi-c" aria-live="polite">
        {open ? (
          <>
            <b>{lines[0]!.text}</b>
            {lines.length > 1 ? (
              <span>
                {lines
                  .slice(1)
                  .map((line) => line.text)
                  .join(" · ")}
              </span>
            ) : null}
            {summary?.source === "template" ? <small>{t("simple")}</small> : null}
          </>
        ) : (
          <>
            <b>{t("title", { count })}</b>
            <span>{pending ? t("thinking") : t("touch")}</span>
          </>
        )}
      </span>
    </button>
  );
}

/**
 * The Chat tab on the phone (docs/chat-v2, planches Chat-liste, Chat-liste-orbi): « Chat »,
 * Rechercher and Nouveau message, the people online now, Orbi's summary of the unread messages,
 * « Tout · Connexions · Recruteurs · Entreprises », the connection requests and the
 * conversations, kept live (« écrit… », « En ligne », new messages). Kept mounted under the pages,
 * like the other tabs. A talent writes only to their connections and to the recruiters of their
 * applications.
 */
export function PhoneMessages({ view, push }: { view: InboxView; push?: ReactNode }) {
  const t = useTranslations("phoneMsg");
  const tc = useTranslations("phoneChat");
  const format = useFormatter();
  const [tab, setTab] = useState<ChatTab>("tout");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [type, setType] = useState<SearchType | null>(null);
  const [found, setFound] = useState<FoundMessage[] | null>(null);
  const [recents, setRecents] = useState<Recent[]>([]);
  const [openedAt, setOpenedAt] = useState(0);
  const [newOpen, setNewOpen] = useState(false);
  const [, startSearch] = useTransition();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { open: openConnection } = useOpenConnection();
  const asked = useRef(0);

  // `?onglet=recruteurs`: the rubric a page goes back to; `?filtre=demandes` (a notification):
  // the requests; `?q=` (the search of the space): the search, already typed.
  const root = pathname === "/app/messages";
  const live = useChatPulse({ conversationId: null, every: 8_000, active: root });
  const askedTab = root ? params.get("onglet") : null;
  const askedFilter = root ? params.get("filtre") : null;
  const askedQuery = root ? params.get("q") : null;
  useEffect(() => {
    if (askedFilter === "demandes") {
      router.replace("/app/messages/connexions");
      return;
    }
    if (askedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
      setSearching(true);
      setQ(askedQuery.slice(0, 80));
      router.replace("/app/messages", { scroll: false });
      return;
    }
    if (!CHAT_TABS.includes(askedTab as ChatTab)) return;
    setTab(askedTab as ChatTab);
    setSearching(false);
    router.replace("/app/messages", { scroll: false });
  }, [askedTab, askedFilter, askedQuery, router]);

  const query = q.trim();
  // Words or a kind: the messages come from the server, from the first letter.
  useEffect(() => {
    if (!query && !type) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the search was emptied
      setFound(null);
      return;
    }
    const ticket = ++asked.current;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await searchMessagesAction(query, type).catch(() => null);
        if (ticket !== asked.current) return;
        setFound(result?.ok ? result.value : []);
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [query, type]);

  const isOnline = (who: WhoView) =>
    who.personId && live.online ? live.online.has(who.personId) : who.online;
  const isTyping = (row: InboxRow) => (live.typing ? live.typing.has(row.id) : row.typing);

  const byId = useMemo(() => new Map(view.rows.map((row) => [row.id, row])), [view.rows]);
  const counts = useMemo(() => {
    const sum = (key: InboxTab) =>
      view.rows.filter((row) => row.tab === key).reduce((total, row) => total + row.unread, 0);
    const value = {
      connexions: sum("connexions"),
      recruteurs: sum("recruteurs"),
      entreprises: sum("entreprises"),
    };
    return { tout: value.connexions + value.recruteurs + value.entreprises, ...value };
  }, [view.rows]);
  const rows = tab === "tout" ? view.rows : view.rows.filter((row) => row.tab === tab);

  // « En ligne maintenant »: the people of the conversations and the connections, online now.
  const onlineNow = useMemo(() => {
    const seen = new Set<string>();
    const people: {
      key: string;
      who: WhoView;
      row: InboxRow | null;
      connection: ConnectionView | null;
    }[] = [];
    for (const row of view.rows) {
      const id = row.who.personId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      people.push({ key: row.id, who: row.who, row, connection: null });
    }
    for (const item of view.connections) {
      const id = item.who.personId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      people.push({ key: item.connectionId, who: item.who, row: null, connection: item });
    }
    return people;
  }, [view.rows, view.connections]);
  const railPeople = onlineNow.filter((person) => isOnline(person.who)).slice(0, 12);

  const people = useMemo(() => {
    if (!query) return [];
    const words = query.toLocaleLowerCase("fr");
    const match = (who: WhoView) =>
      `${who.name} ${who.line}`.toLocaleLowerCase("fr").includes(words);
    const fromRows = view.rows
      .filter((row) => match(row.who))
      .map((row) => ({
        key: row.id,
        who: row.who,
        href: `/app/messages/${row.id}`,
        connection: null as ConnectionView | null,
      }));
    const fromConnections = view.connections
      .filter((item) => !item.conversationId || !byId.has(item.conversationId))
      .filter((item) => match(item.who))
      .map((item) => ({ key: item.connectionId, who: item.who, href: "", connection: item }));
    return [...fromRows, ...fromConnections].slice(0, 8);
  }, [query, view.rows, view.connections, byId]);

  const startSearching = () => {
    if (searching) return;
    setSearching(true);
    setRecents(readRecents());
    setOpenedAt(Date.now());
  };
  const cancel = () => {
    setSearching(false);
    setQ("");
    setType(null);
  };
  const remember = () => keepRecent(query);

  const pending = [
    ...view.requests.map((item) => item.who),
    ...view.orgRequests.map((item) => item.who),
  ];
  const names =
    pending.length === 1
      ? pending[0]!.name
      : pending.length > 1
        ? tc("requests.names", {
            a: pending[0]!.name,
            b: pending[1]!.name,
            rest: pending.length - 2,
          })
        : "";
  const typeName = (key: SearchType) => t(`search.type.${key}`);

  return (
    <div className="nb-page nb-ch nb-ch-liste">
      <header className="nb-tete-onglet">
        <h1>{tc("title")}</h1>
        <div>
          <Link
            href="/app/messages/connexions"
            className="nb-ch-rb nb-ch-cx"
            aria-label={tc("connexions", { count: pending.length })}
            data-attente={pending.length ? "" : undefined}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c.6-3.6 3.3-5.8 6.5-5.8 1.6 0 3 .5 4.1 1.4" />
              <path d="M18 13v7M14.5 16.5h7" />
            </svg>
            {pending.length ? <span className="nb-ch-cx-n">{fmtCount(pending.length)}</span> : null}
          </Link>
          <button
            type="button"
            className="nb-ch-rb"
            aria-label={tc("search")}
            aria-pressed={searching}
            onClick={() => (searching ? cancel() : startSearching())}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m20 20-4.4-4.4" />
            </svg>
          </button>
          <button
            type="button"
            className="nb-ch-rb"
            aria-label={tc("new")}
            onClick={() => setNewOpen(true)}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
            </svg>
          </button>
          <MeAvatar />
        </div>
      </header>
      {/* « Recevoir vos messages sur ce téléphone » (29/10/2026). */}
      {push}

      {searching ? (
        <div className="nb-ms-cherche">
          <label className="nb-ms-champ">
            <PhoneIcon name="recherche" size={18} stroke={1.8} />
            <input
              type="search"
              value={q}
              autoFocus
              placeholder={t("search.placeholder")}
              aria-label={t("search.label")}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") remember();
              }}
            />
            {q ? (
              <button
                type="button"
                className="nb-ms-effacer"
                aria-label={t("search.clear")}
                onClick={() => setQ("")}
              >
                <PhoneIcon name="fermer" size={16} stroke={2} />
              </button>
            ) : null}
          </label>
          <button type="button" className="nb-ms-annuler" onClick={cancel}>
            {t("cancel")}
          </button>
        </div>
      ) : (
        <>
          {railPeople.length ? (
            <section className="nb-ch-enligne" aria-labelledby="ch-enligne">
              <p className="nb-ch-sec" id="ch-enligne">
                {tc("online")}
              </p>
              <div className="nb-ch-rail">
                {railPeople.map((person, index) => (
                  <button
                    key={person.key}
                    type="button"
                    className="nb-ch-rail-p"
                    style={{ animationDelay: `${index * 0.06}s` }}
                    aria-label={tc("onlineOpen", { name: person.who.name })}
                    onClick={() =>
                      person.row
                        ? router.push(`/app/messages/${person.row.id}`)
                        : person.connection
                          ? openConnection(person.connection)
                          : undefined
                    }
                  >
                    <WhoAvatar who={person.who} size={58} online />
                    <span>{person.who.first}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {counts.tout ? <OrbiSummary count={counts.tout} /> : null}
          <div className="nb-ch-segbox">
            <Segment tab={tab} setTab={setTab} counts={counts} />
          </div>
          <div id="ch-panneau" role="tabpanel" aria-labelledby={`ch-${tab}`}>
            {(tab === "tout" || tab === "connexions") && pending.length ? (
              <Link href="/app/messages/connexions" className="nb-ch-ligne nb-ch-demandes">
                <span className="nb-ch-pile" aria-hidden>
                  {pending.slice(0, 2).map((who) => (
                    <FilAvatar
                      key={who.name}
                      initials={who.initials}
                      image={who.image}
                      tone={who.tone}
                      org={who.org}
                      size={36}
                    />
                  ))}
                </span>
                <span className="nb-ch-ligne-c">
                  <b>{tc("requests.title")}</b>
                  <span className="nb-ch-noms">{names}</span>
                </span>
                <span className="nb-ch-badge nb-ch-badge-ambre">{pending.length}</span>
              </Link>
            ) : null}
            {rows.map((row, index) => (
              <Row
                key={row.id}
                row={row}
                index={index}
                online={isOnline(row.who)}
                typing={isTyping(row)}
              />
            ))}
            {rows.length === 0 ? <p className="nb-ch-vide">{tc(`empty.${tab}`)}</p> : null}
            <p className="nb-ch-note">{tc("note")}</p>
          </div>
        </>
      )}

      {searching && !query && !type ? (
        <div className="nb-ms-options">
          <p className="nb-sec">{t("search.byType")}</p>
          <div className="nb-ms-types">
            {TYPES.map(([key, icon, color]) => (
              <button key={key} type="button" className="nb-ms-type" onClick={() => setType(key)}>
                <span style={{ background: color }}>
                  <PhoneIcon name={icon} size={22} stroke={1.8} />
                </span>
                {typeName(key)}
              </button>
            ))}
          </div>
          {recents.length ? (
            <>
              <p className="nb-sec">{t("search.recents")}</p>
              {recents.map((recent) => (
                <button
                  key={recent.q}
                  type="button"
                  className="nb-ms-recent"
                  onClick={() => setQ(recent.q)}
                >
                  <PhoneIcon name="horloge" size={20} stroke={1.8} />
                  <span>{recent.q}</span>
                  <span className="nb-meta">
                    {format.relativeTime(recent.at, openedAt || recent.at)}
                  </span>
                </button>
              ))}
            </>
          ) : null}
          {view.connections.length ? (
            <>
              <p className="nb-sec">{t("search.connections")}</p>
              <div className="nb-ms-rapides">
                {view.connections.slice(0, 12).map((item) => (
                  <button
                    key={item.connectionId}
                    type="button"
                    onClick={() => openConnection(item)}
                  >
                    <WhoAvatar who={item.who} size={56} />
                    <span>{item.who.first}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <p className="nb-meta nb-ms-astuce">{t("search.hint")}</p>
        </div>
      ) : null}

      {searching && type ? (
        <div className="nb-ms-resultats">
          <div className="nb-ms-filtre">
            <span className="nb-ms-puce">
              {typeName(type)}
              <button
                type="button"
                aria-label={t("search.removeFilter")}
                onClick={() => setType(null)}
              >
                <PhoneIcon name="fermer" size={14} stroke={2.4} />
              </button>
            </span>
            <span className="nb-meta">
              {found ? t("search.results", { count: found.length }) : t("search.searching")}
            </span>
          </div>
          {found && found.length === 0 ? (
            <p className="nb-meta nb-ms-vide">{t("search.noneOfType")}</p>
          ) : null}
          {type === "photos" && found?.length ? (
            <div className="nb-ms-grille">
              {found.map((item) => {
                const row = byId.get(item.conversationId);
                const [messageId] = item.messageId.split(":");
                return (
                  <Link
                    key={item.messageId}
                    href={`/app/messages/${item.conversationId}?voir=${item.messageId}`}
                    aria-label={t("search.seePhoto")}
                    onClick={remember}
                    data-message={messageId}
                  >
                    {item.photo ? <img src={item.photo} alt="" loading="lazy" /> : null}
                    {row ? <span className="nb-ms-qui">{row.who.first}</span> : null}
                  </Link>
                );
              })}
            </div>
          ) : null}
          {type !== "photos"
            ? found?.map((item) => {
                const row = byId.get(item.conversationId);
                if (!row) return null;
                return (
                  <Link
                    key={item.messageId}
                    href={`/app/messages/${item.conversationId}?m=${item.messageId}`}
                    className="nb-ms-ligne nb-ms-trouve"
                    onClick={remember}
                  >
                    <WhoAvatar who={row.who} size={44} />
                    <span className="nb-ms-ligne-c">
                      <span className="nb-ms-ligne-h">
                        <b>{row.who.name}</b>
                        <span className="nb-meta">{item.time}</span>
                      </span>
                      <span className="nb-ms-extrait">{item.text}</span>
                    </span>
                  </Link>
                );
              })
            : null}
        </div>
      ) : null}

      {searching && query && !type ? (
        <div className="nb-ms-resultats">
          <p className="nb-sec">{t("search.people")}</p>
          {people.map((person) => (
            <PersonLine
              key={person.key}
              who={person.who}
              href={person.connection ? undefined : person.href}
              onClick={
                person.connection
                  ? () => {
                      remember();
                      openConnection(person.connection!);
                    }
                  : undefined
              }
            />
          ))}
          {people.length === 0 ? (
            <p className="nb-meta nb-ms-rien">{t("search.noPeople")}</p>
          ) : null}
          <p className="nb-sec">{t("search.inMessages")}</p>
          {found?.slice(0, 8).map((item) => {
            const row = byId.get(item.conversationId);
            if (!row) return null;
            return (
              <Link
                key={item.messageId}
                href={`/app/messages/${item.conversationId}?q=${encodeURIComponent(query)}`}
                className="nb-ms-ligne nb-ms-trouve"
                onClick={remember}
              >
                <WhoAvatar who={row.who} size={44} />
                <span className="nb-ms-ligne-c">
                  <span className="nb-ms-ligne-h">
                    <b>{row.who.name}</b>
                    <span className="nb-meta">{item.time}</span>
                  </span>
                  <span className="nb-ms-extrait">{item.text}</span>
                </span>
              </Link>
            );
          })}
          {found && found.length === 0 ? (
            <p className="nb-meta nb-ms-rien">{t("search.noMessages", { q: query })}</p>
          ) : null}
          {!found ? <p className="nb-meta nb-ms-rien">{t("search.searching")}</p> : null}
        </div>
      ) : null}

      <PhoneSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        label={t("newSheet.title")}
        closeLabel={t("close")}
      >
        <h2 className="nb-ms-sht">{t("newSheet.title")}</h2>
        <p className="nb-meta nb-ms-shtnote">{t("newSheet.note")}</p>
        {view.connections.map((item) => (
          <PersonLine
            key={item.connectionId}
            who={item.who}
            onClick={() => {
              setNewOpen(false);
              openConnection(item);
            }}
          />
        ))}
        {view.connections.length === 0 ? (
          <p className="nb-meta nb-ms-rien">{t("newSheet.none")}</p>
        ) : null}
        <Link
          href="/app/explorer/personnes"
          className="nb-ms-plus"
          onClick={() => setNewOpen(false)}
        >
          {t("newSheet.explore")}
        </Link>
      </PhoneSheet>
    </div>
  );
}
