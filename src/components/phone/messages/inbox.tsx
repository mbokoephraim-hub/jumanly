"use client";

/* eslint-disable @next/next/no-img-element -- photos of the conversations: small, already reduced */
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { openConnectionAction, searchMessagesAction } from "@/server/actions/messages-phone";
import { PhoneIcon, type PhoneIconName } from "../icon";
import { PhoneSheet } from "../sheet";
import { WhoAvatar, WhoName } from "./parts";
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

/** A conversation in a list: face, name, time, last words, unread count. */
function Row({ row }: { row: InboxRow }) {
  const t = useTranslations("phoneMsg");
  return (
    <Link
      href={`/app/messages/${row.id}`}
      className="nb-ms-ligne"
      data-nonlu={row.unread ? "" : undefined}
    >
      <WhoAvatar who={row.who} />
      <span className="nb-ms-ligne-c">
        <span className="nb-ms-ligne-h">
          <WhoName who={row.who} />
          <span className="nb-ms-heure">{row.time}</span>
        </span>
        <span className="nb-ms-ligne-b">
          <span className="nb-ms-apercu">{row.preview}</span>
          {row.muted ? (
            <span className="nb-ms-muet" role="img" aria-label={t("muted")}>
              <PhoneIcon name="muet" size={15} stroke={1.8} />
            </span>
          ) : null}
          {row.unread ? (
            <span className="nb-ms-badge" aria-label={t("unread", { count: row.unread })}>
              {fmtCount(row.unread)}
            </span>
          ) : null}
        </span>
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

/**
 * The Messages tab on the phone (Modèle B, lot B8, planches Messages, -recruteurs, -entreprises,
 * -nouveau, -recherche*): the search, the three rubrics, the connection requests, the
 * conversations. Kept mounted under the pages, like the other tabs. A talent writes only to their
 * connections, and answers the organizations that wrote to them.
 */
export function PhoneMessages({ view }: { view: InboxView }) {
  const t = useTranslations("phoneMsg");
  const format = useFormatter();
  const [tab, setTab] = useState<InboxTab>("connexions");
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
  const askedTab = root ? params.get("onglet") : null;
  const askedFilter = root ? params.get("filtre") : null;
  const askedQuery = root ? params.get("q") : null;
  useEffect(() => {
    if (askedFilter === "demandes") {
      router.replace("/app/messages/demandes");
      return;
    }
    if (askedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
      setSearching(true);
      setQ(askedQuery.slice(0, 80));
      router.replace("/app/messages", { scroll: false });
      return;
    }
    if (!TABS.includes(askedTab as InboxTab)) return;
    setTab(askedTab as InboxTab);
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

  const byId = useMemo(() => new Map(view.rows.map((row) => [row.id, row])), [view.rows]);
  const unreadOf = (key: InboxTab) =>
    view.rows.filter((row) => row.tab === key).reduce((sum, row) => sum + row.unread, 0);
  const rows = view.rows.filter((row) => row.tab === tab);
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

  const firstRequest = view.requests[0]?.who.name ?? view.orgRequests[0]?.who.name ?? null;
  const pendingCount = view.requests.length + view.orgRequests.length;
  const typeName = (key: SearchType) => t(`search.type.${key}`);

  return (
    <div className="nb-page nb-ms nb-ms-accueil">
      <header className="nb-tete nb-ms-tete">
        <h1>{t("title")}</h1>
        <button
          type="button"
          className="nb-rond"
          aria-label={t("new")}
          onClick={() => setNewOpen(true)}
        >
          <PhoneIcon name="modifier" size={22} stroke={1.8} />
        </button>
      </header>

      <div className="nb-ms-cherche">
        <label className="nb-ms-champ">
          <PhoneIcon name="recherche" size={18} stroke={1.8} />
          <input
            type="search"
            value={q}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            onFocus={startSearching}
            onChange={(event) => {
              setQ(event.target.value);
              startSearching();
            }}
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
        {searching ? (
          <button type="button" className="nb-ms-annuler" onClick={cancel}>
            {t("cancel")}
          </button>
        ) : null}
      </div>

      {!searching ? (
        <>
          <div className="nb-ms-onglets" role="tablist" aria-label={t("tabsLabel")}>
            {TABS.map((key) => {
              const count = unreadOf(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`ms-${key}`}
                  aria-selected={tab === key}
                  aria-controls="ms-panneau"
                  onClick={() => setTab(key)}
                >
                  {t(`tab.${key}`)}
                  {count ? (
                    <span className="nb-ms-badge nb-ms-badge-p" aria-label={t("unread", { count })}>
                      {fmtCount(count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div id="ms-panneau" role="tabpanel" aria-labelledby={`ms-${tab}`}>
            {tab === "connexions" ? (
              <Link href="/app/messages/demandes" className="nb-ms-ligne nb-ms-demandes">
                <span className="nb-ms-demandes-i" aria-hidden>
                  <PhoneIcon name="personne" size={22} stroke={1.8} />
                </span>
                <span className="nb-ms-ligne-c">
                  <b>{t("requests.title")}</b>
                  <span className="nb-meta">
                    {firstRequest
                      ? t("requests.summary", { name: firstRequest, others: pendingCount - 1 })
                      : t("requests.none")}
                  </span>
                </span>
                {pendingCount ? <span className="nb-ms-badge">{pendingCount}</span> : null}
              </Link>
            ) : null}
            {rows.map((row) => (
              <Row key={row.id} row={row} />
            ))}
            {rows.length === 0 ? <p className="nb-meta nb-ms-vide">{t(`empty.${tab}`)}</p> : null}
            <p className="nb-meta nb-ms-pied">{t("onlyConnections")}</p>
          </div>
        </>
      ) : null}

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
