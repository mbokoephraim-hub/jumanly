"use client";

import "@/styles/phone-connexions.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { connectAction } from "@/server/actions/explore";
import {
  acceptRequestAction,
  ignoreRequestAction,
  openConnectionAction,
  respondOrgRequestAction,
  withdrawRequestAction,
} from "@/server/actions/messages-phone";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { WhoAvatar, WhoName } from "./parts";
import type { ConnexionsView, MutualView, OrgRequestView, WhoView } from "./types";

const TABS = ["demandes", "suggestions", "reseau"] as const;
type Tab = (typeof TABS)[number];

/** What became of a request, a suggestion or a sent request on this screen. */
type Done =
  | { kind: "accepted"; conversationId: string }
  | { kind: "refused" }
  | { kind: "sent" }
  | { kind: "withdrawn" };

const HIDDEN = "nb-connexions-masquees";

function readHidden(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(HIDDEN) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((id) => typeof id === "string").slice(-200) : [];
  } catch {
    return [];
  }
}

function keepHidden(ids: string[]) {
  try {
    localStorage.setItem(HIDDEN, JSON.stringify(ids.slice(-200)));
  } catch {
    // Private browsing: the hidden suggestions come back next time.
  }
}

/** « Awa et 2 autres connexions en commun », with up to three small faces. */
function Mutual({ mutual, field }: { mutual: MutualView; field?: boolean }) {
  const t = useTranslations("phoneCx");
  if (!mutual.count && !field) return null;
  return (
    <span className="nb-cx-commun">
      {mutual.count ? (
        <span className="nb-cx-faces" aria-hidden>
          {mutual.faces.map((face) => (
            <WhoAvatar key={face.key} who={face.who} size={22} dot={false} />
          ))}
        </span>
      ) : (
        <PhoneIcon name="idee" size={14} stroke={2} />
      )}
      <span>{mutual.count ? mutual.text : t("field")}</span>
    </span>
  );
}

/**
 * « Connexions » of the Chat (Ephraïm 29/10/2026), opened by the icon beside the pencil:
 * - « Demandes »: the requests received (« Accepter » puts the person in the Chat at once,
 *   « Refuser » tells nobody), the companies asking to talk, then the requests I sent;
 * - « Suggestions »: the people connected to my connections, then those who share my skills;
 * - « Mes connexions »: everyone I can write to, with a search.
 * Without any request waiting, the page opens on the suggestions.
 */
export function PhoneConnexions({ view, asked }: { view: ConnexionsView; asked: string | null }) {
  const t = useTranslations("phoneCx");
  const tm = useTranslations("phoneMsg");
  const router = useRouter();
  const waiting = view.received.length + view.orgRequests.length;
  const [tab, setTab] = useState<Tab>(
    TABS.includes(asked as Tab) ? (asked as Tab) : waiting ? "demandes" : "suggestions",
  );
  const [done, setDone] = useState<Record<string, Done>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the browser
    setHidden(readHidden());
  }, []);

  const act = (key: string, task: () => Promise<Done | null>, toast?: (value: Done) => string) =>
    start(async () => {
      const value = await task().catch(() => null);
      if (!value) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      setDone((current) => ({ ...current, [key]: value }));
      const message = toast?.(value);
      if (message) showToast({ message });
    });

  const accept = (id: string, who: WhoView) =>
    act(
      id,
      async () => {
        const result = await acceptRequestAction(id);
        return result.ok ? { kind: "accepted", conversationId: result.value } : null;
      },
      () => t("acceptedToast", { name: who.first }),
    );
  const refuse = (id: string) =>
    act(id, async () => {
      const result = await ignoreRequestAction(id);
      return result.ok ? { kind: "refused" } : null;
    });
  const respondOrg = (request: OrgRequestView, yes: boolean) =>
    act(
      request.id,
      async () => {
        const result = await respondOrgRequestAction(request.id, yes);
        if (!result.ok) return null;
        return result.value
          ? { kind: "accepted", conversationId: result.value }
          : { kind: "refused" };
      },
      (value) =>
        value.kind === "accepted" ? tm("requests.orgAccepted", { name: request.who.name }) : "",
    );
  const withdraw = (id: string) =>
    act(id, async () => {
      const result = await withdrawRequestAction(id);
      return result.ok ? { kind: "withdrawn" } : null;
    });
  const connect = (who: WhoView) => {
    const id = who.personId;
    if (!id) return;
    act(id, async () => {
      const result = await connectAction(id);
      if (!result.ok) return null;
      if (result.value === "accepted") {
        showToast({ message: t("acceptedToast", { name: who.first }) });
        return { kind: "accepted", conversationId: "" };
      }
      showToast({ message: t("sentToast", { name: who.first }) });
      return { kind: "sent" };
    });
  };
  const write = (connectionId: string, conversationId: string | null) => {
    if (conversationId) {
      router.push(`/app/messages/${conversationId}`);
      return;
    }
    start(async () => {
      const result = await openConnectionAction(connectionId).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      router.push(`/app/messages/${result.value}`);
    });
  };
  const hide = (personId: string) => {
    const next = [...hidden.filter((id) => id !== personId), personId];
    setHidden(next);
    keepHidden(next);
  };

  const suggestions = view.suggestions.filter(
    (item) => item.who.personId && !hidden.includes(item.who.personId),
  );
  const words = q.trim().toLocaleLowerCase("fr");
  const network = useMemo(
    () =>
      words
        ? view.connections.filter((item) =>
            `${item.who.name} ${item.who.line}`.toLocaleLowerCase("fr").includes(words),
          )
        : view.connections,
    [view.connections, words],
  );
  const counts: Record<Tab, number> = {
    demandes: view.received.filter((item) => !done[item.id]).length + view.orgRequests.length,
    suggestions: 0,
    reseau: view.connections.length,
  };

  const suggestionCard = (item: ConnexionsView["suggestions"][number], index: number) => {
    const id = item.who.personId!;
    const state = done[id];
    return (
      <li
        key={id}
        className="nb-cx-sug"
        style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
      >
        <button
          type="button"
          className="nb-cx-masquer"
          aria-label={t("hide", { name: item.who.name })}
          onClick={() => hide(id)}
        >
          <PhoneIcon name="fermer" size={14} stroke={2.2} />
        </button>
        <Link
          href={item.who.href ?? "#"}
          className="nb-cx-sug-p"
          aria-label={t("profile", { name: item.who.name })}
        >
          <WhoAvatar who={item.who} size={68} />
        </Link>
        <WhoName who={item.who} />
        <span className="nb-cx-sug-l">{item.who.line}</span>
        <Mutual mutual={item.mutual} field={item.reason === "field"} />
        {state?.kind === "sent" ? (
          <span className="nb-cx-envoye">
            <PhoneIcon name="coche" size={15} stroke={2.4} />
            {t("sentOk")}
          </span>
        ) : state?.kind === "accepted" ? (
          <span className="nb-cx-envoye">
            <PhoneIcon name="coche" size={15} stroke={2.4} />
            {t("connected")}
          </span>
        ) : (
          <button
            type="button"
            className="nb-cx-oui nb-cx-connecter"
            disabled={pending}
            aria-label={t("connectLabel", { name: item.who.name })}
            onClick={() => connect(item.who)}
          >
            <PhoneIcon name="plus" size={15} stroke={2.4} />
            {t("connect")}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="nb-page nb-ch nb-cx">
      <header className="nb-barre">
        <PhoneBack fallback="/app/messages" label={t("back")} />
        <h1>{t("title")}</h1>
      </header>

      <section className="nb-cx-hero" aria-label={t("hero.title")}>
        <div className="nb-cx-hero-faces" aria-hidden>
          {view.connections.slice(0, 4).map((item) => (
            <WhoAvatar key={item.connectionId} who={item.who} size={40} dot={false} />
          ))}
          {view.connections.length === 0 ? (
            <span className="nb-cx-hero-vide">
              <PhoneIcon name="personne" size={22} stroke={1.8} />
            </span>
          ) : null}
        </div>
        <div className="nb-cx-hero-c">
          <p className="nb-cx-hero-t">{t("hero.title")}</p>
          <p className="nb-cx-hero-n">{t("hero.count", { count: view.connections.length })}</p>
          <p className="nb-cx-hero-m">
            {waiting ? (
              <span className="nb-cx-hero-a">{t("hero.pending", { count: waiting })}</span>
            ) : null}
            {view.sent.length ? <span>{t("hero.sent", { count: view.sent.length })}</span> : null}
          </p>
        </div>
      </section>

      <div className="nb-ch-segbox">
        <div className="nb-ch-seg nb-cx-seg" role="tablist" aria-label={t("tabs")}>
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`cx-${key}`}
              aria-selected={tab === key}
              aria-controls="cx-panneau"
              onClick={() => setTab(key)}
            >
              {t(`tab.${key}`)}
              {counts[key] ? <b>{counts[key] > 99 ? "99+" : counts[key]}</b> : null}
            </button>
          ))}
        </div>
      </div>

      <div id="cx-panneau" role="tabpanel" aria-labelledby={`cx-${tab}`} key={tab}>
        {tab === "demandes" ? (
          <>
            {view.received.length ? (
              <ul className="nb-cx-liste">
                {view.received.map((request, index) => {
                  const state = done[request.id];
                  return (
                    <li
                      key={request.id}
                      className="nb-cx-carte"
                      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                      data-etat={state?.kind}
                    >
                      <div className="nb-cx-tete">
                        <Link
                          href={request.who.href ?? "#"}
                          aria-label={t("profile", { name: request.who.name })}
                        >
                          <WhoAvatar who={request.who} size={56} />
                        </Link>
                        <div className="nb-cx-qui">
                          <Link href={request.who.href ?? "#"} className="nb-cx-nom">
                            <WhoName who={request.who} />
                          </Link>
                          <span className="nb-cx-ligne">{request.who.line}</span>
                          <Mutual mutual={request.mutual} />
                        </div>
                        <span className="nb-cx-quand">{request.ago}</span>
                      </div>
                      {request.note ? (
                        <p className="nb-cx-mot">{t("quoted", { text: request.note })}</p>
                      ) : null}
                      {!state ? (
                        <div className="nb-cx-choix">
                          <button
                            type="button"
                            className="nb-cx-oui"
                            disabled={pending}
                            aria-label={t("acceptLabel", { name: request.who.name })}
                            onClick={() => accept(request.id, request.who)}
                          >
                            {t("accept")}
                          </button>
                          <button
                            type="button"
                            className="nb-cx-non"
                            disabled={pending}
                            aria-label={t("refuseLabel", { name: request.who.name })}
                            onClick={() => refuse(request.id)}
                          >
                            {t("refuse")}
                          </button>
                        </div>
                      ) : state.kind === "accepted" ? (
                        <div className="nb-cx-ok">
                          <p>
                            <PhoneIcon name="coche" size={16} stroke={2.4} />
                            {t("accepted", { name: request.who.first })}
                          </p>
                          <Link
                            href={`/app/messages/${state.conversationId}`}
                            className="nb-cx-oui"
                          >
                            {t("write", { name: request.who.first })}
                          </Link>
                        </div>
                      ) : (
                        <p className="nb-cx-refus">{t("refused", { name: request.who.first })}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {view.orgRequests.length ? (
              <>
                <p className="nb-ch-sec nb-cx-sec">{tm("requests.orgs")}</p>
                <ul className="nb-cx-liste">
                  {view.orgRequests.map((request) => {
                    const state = done[request.id];
                    return (
                      <li key={request.id} className="nb-cx-carte">
                        <div className="nb-cx-tete">
                          <WhoAvatar who={request.who} size={56} />
                          <div className="nb-cx-qui">
                            <WhoName who={request.who} />
                            <span className="nb-cx-ligne">
                              {request.job
                                ? tm("requests.about", { job: request.job })
                                : request.who.line}
                            </span>
                          </div>
                        </div>
                        <p className="nb-cx-mot">{t("quoted", { text: request.note })}</p>
                        {!state ? (
                          <div className="nb-cx-choix">
                            <button
                              type="button"
                              className="nb-cx-oui"
                              disabled={pending}
                              onClick={() => respondOrg(request, true)}
                            >
                              {t("accept")}
                            </button>
                            <button
                              type="button"
                              className="nb-cx-non"
                              disabled={pending}
                              onClick={() => respondOrg(request, false)}
                            >
                              {t("refuse")}
                            </button>
                          </div>
                        ) : state.kind === "accepted" ? (
                          <div className="nb-cx-ok">
                            <Link
                              href={`/app/messages/${state.conversationId}`}
                              className="nb-cx-oui"
                            >
                              {t("write", { name: request.who.name })}
                            </Link>
                          </div>
                        ) : (
                          <p className="nb-cx-refus">
                            {tm("requests.declined", { name: request.who.name })}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}

            {waiting === 0 ? (
              <div className="nb-cx-vide">
                <span className="nb-cx-vide-i" aria-hidden>
                  <PhoneIcon name="personne" size={26} stroke={1.8} />
                </span>
                <p className="nb-cx-vide-t">{t("none.title")}</p>
                <p className="nb-cx-vide-x">{t("none.text")}</p>
              </div>
            ) : null}

            {view.sent.length ? (
              <>
                <p className="nb-ch-sec nb-cx-sec">{t("sentTitle")}</p>
                <ul className="nb-cx-liste nb-cx-lignes">
                  {view.sent.map((request) => {
                    const state = done[request.id];
                    return (
                      <li key={request.id} className="nb-cx-rang">
                        <Link
                          href={request.who.href ?? "#"}
                          className="nb-cx-rang-p"
                          aria-label={t("profile", { name: request.who.name })}
                        >
                          <WhoAvatar who={request.who} size={44} />
                          <span className="nb-cx-qui">
                            <WhoName who={request.who} />
                            <span className="nb-cx-ligne">
                              {state?.kind === "withdrawn"
                                ? t("withdrawn")
                                : t("waiting", { ago: request.ago })}
                            </span>
                          </span>
                        </Link>
                        {!state ? (
                          <button
                            type="button"
                            className="nb-cx-non nb-cx-petit"
                            disabled={pending}
                            aria-label={t("withdrawLabel", { name: request.who.name })}
                            onClick={() => withdraw(request.id)}
                          >
                            {t("withdraw")}
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}

            {suggestions.length ? (
              <>
                <div className="nb-cx-sec-h">
                  <p className="nb-ch-sec nb-cx-sec">{t("maybe")}</p>
                  <button
                    type="button"
                    className="nb-cx-lien"
                    onClick={() => setTab("suggestions")}
                  >
                    {t("seeAll")}
                  </button>
                </div>
                <ul className="nb-cx-rail">{suggestions.slice(0, 6).map(suggestionCard)}</ul>
              </>
            ) : null}
          </>
        ) : null}

        {tab === "suggestions" ? (
          <>
            <p className="nb-cx-intro">{t("suggest.sub")}</p>
            {suggestions.length ? (
              <ul className="nb-cx-grille">{suggestions.map(suggestionCard)}</ul>
            ) : (
              <div className="nb-cx-vide">
                <span className="nb-cx-vide-i" aria-hidden>
                  <PhoneIcon name="explorer" size={26} stroke={1.8} />
                </span>
                <p className="nb-cx-vide-x">{t("suggest.none")}</p>
              </div>
            )}
            <Link href="/app/explorer/personnes" className="nb-cx-explorer">
              <PhoneIcon name="recherche" size={18} stroke={2} />
              {t("explore")}
            </Link>
            <p className="nb-cx-orbi">{t("orbi")}</p>
          </>
        ) : null}

        {tab === "reseau" ? (
          <>
            {view.connections.length > 5 ? (
              <label className="nb-ms-champ nb-cx-champ">
                <PhoneIcon name="recherche" size={18} stroke={1.8} />
                <input
                  type="search"
                  value={q}
                  placeholder={t("network.search")}
                  aria-label={t("network.search")}
                  onChange={(event) => setQ(event.target.value)}
                />
              </label>
            ) : null}
            <ul className="nb-cx-liste nb-cx-lignes">
              {network.map((item) => (
                <li key={item.connectionId} className="nb-cx-rang">
                  <Link
                    href={item.who.href ?? "#"}
                    className="nb-cx-rang-p"
                    aria-label={t("profile", { name: item.who.name })}
                  >
                    <WhoAvatar who={item.who} size={48} />
                    <span className="nb-cx-qui">
                      <WhoName who={item.who} />
                      <span className="nb-cx-ligne">{item.who.line}</span>
                      <span className="nb-cx-depuis">
                        {t("network.since", { ago: item.since })}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="nb-ch-rb nb-cx-ecrire"
                    disabled={pending}
                    aria-label={t("write", { name: item.who.first })}
                    onClick={() => write(item.connectionId, item.conversationId)}
                  >
                    <PhoneIcon name="messages" size={18} stroke={2} />
                  </button>
                </li>
              ))}
            </ul>
            {view.connections.length === 0 ? (
              <div className="nb-cx-vide">
                <span className="nb-cx-vide-i" aria-hidden>
                  <PhoneIcon name="personne" size={26} stroke={1.8} />
                </span>
                <p className="nb-cx-vide-x">{t("network.none")}</p>
              </div>
            ) : network.length === 0 ? (
              <p className="nb-ch-vide">{t("network.noMatch", { q: q.trim() })}</p>
            ) : null}
          </>
        ) : null}

        <p className="nb-ch-note">{t("note")}</p>
      </div>
    </div>
  );
}
