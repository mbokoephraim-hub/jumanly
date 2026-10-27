"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { rhOpenTeamAction } from "@/server/actions/phone-rh-messages";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

type Tab = "candidats" | "reseau" | "equipe";
const TABS: Tab[] = ["candidats", "reseau", "equipe"];
const SCOPES = ["tout", ...TABS] as const;
type Scope = (typeof SCOPES)[number];

export type RhListRow = {
  id: string;
  href: string;
  tab: Tab;
  name: string;
  initials: string;
  tint: string;
  context: string;
  preview: string | null;
  mine: boolean;
  unread: number;
  when: string;
};

/** Lower case, without accents: « Grâce » is found with « grace ». */
const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Row({ row }: { row: RhListRow }) {
  const t = useTranslations("phoneRhMessages");
  const preview = row.preview ?? t("row.noMessage");
  return (
    <li>
      <Link href={row.href} className="nb-rm-ligne" data-non-lu={row.unread > 0 ? "" : undefined}>
        <span className="nb-rh-ini" data-teinte={row.tint} aria-hidden>
          {row.initials}
        </span>
        <span className="nb-rm-texte">
          <span className="nb-rm-haut">
            <b>{row.name}</b>
            <small>{row.when}</small>
          </span>
          {row.context ? <span className="nb-rm-contexte">{row.context}</span> : null}
          <span className="nb-rm-bas">
            <span className="nb-rm-apercu">
              {row.mine ? t("row.you", { text: preview }) : preview}
            </span>
            {row.unread > 0 ? (
              <span className="nb-rm-pastille">
                <span aria-hidden>{row.unread}</span>
                <span className="sr-only">{t("row.unread", { count: row.unread })}</span>
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The lists of the tab (planches 120 to 123): « Candidats · Réseau · Équipe » with the unread
 * count, the line of each list, the conversations; the field searches the names, the offers and
 * the last words, in the scope chosen under it.
 */
export function RhMessagesList({ rows, tab, org }: { rows: RhListRow[]; tab: Tab; org: string }) {
  const t = useTranslations("phoneRhMessages");
  const [current, setCurrent] = useState<Tab>(tab);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("tout");
  const field = useRef<HTMLInputElement>(null);
  const q = plain(query.trim());
  const found = rows.filter(
    (row) =>
      (scope === "tout" || row.tab === scope) &&
      plain(`${row.name} ${row.context} ${row.preview ?? ""}`).includes(q),
  );
  const shown = rows.filter((row) => row.tab === current);
  const unread = (key: Tab) => rows.filter((row) => row.tab === key && row.unread > 0).length;

  const cancel = () => {
    setSearching(false);
    setQuery("");
    setScope("tout");
    field.current?.blur();
  };

  return (
    <div className="nb-rm">
      <div className="nb-ex-champ" role="search">
        <label className="nb-ex-recherche">
          <PhoneIcon name="recherche" size={18} stroke={2} />
          <input
            ref={field}
            type="search"
            value={query}
            aria-label={t("search.label")}
            placeholder={t("search.placeholder")}
            onFocus={() => setSearching(true)}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" aria-label={t("search.clear")} onClick={() => setQuery("")}>
              <PhoneIcon name="fermer" size={16} />
            </button>
          ) : null}
        </label>
        {searching ? (
          <button type="button" className="nb-ex-annuler" onClick={cancel}>
            {t("search.cancel")}
          </button>
        ) : null}
      </div>
      {searching ? (
        <>
          <p className="nb-meta nb-rh-marge">{t("search.in")}</p>
          <div className="nb-chips nb-rh-marge" role="radiogroup" aria-label={t("search.in")}>
            {SCOPES.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={scope === key}
                className="nb-chip"
                onClick={() => setScope(key)}
              >
                {t(`search.scope.${key}`)}
              </button>
            ))}
          </div>
          {q ? (
            found.length > 0 ? (
              <ul className="nb-rm-liste">
                {found.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </ul>
            ) : (
              <p className="nb-vide nb-rh-marge">{t("search.none", { q: query.trim() })}</p>
            )
          ) : null}
        </>
      ) : (
        <>
          <div className="nb-rm-onglets" role="tablist" aria-label={t("tabs.label")}>
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={current === key}
                onClick={() => setCurrent(key)}
              >
                {t(`tabs.${key}`)}
                {unread(key) > 0 ? (
                  <span className="nb-rm-compte">
                    <span aria-hidden>{unread(key)}</span>
                    <span className="sr-only">{t("tabs.unread", { count: unread(key) })}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={t(`tabs.${current}`)}>
            <p className="nb-meta nb-rh-marge nb-rm-intro">
              {current === "equipe" ? t("intro.equipe", { org }) : t(`intro.${current}`)}
            </p>
            {shown.length > 0 ? (
              <ul className="nb-rm-liste">
                {shown.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </ul>
            ) : (
              <p className="nb-vide nb-rh-marge">{t(`empty.${current}`)}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

type Choice = { key: string; name: string; line: string };

/**
 * « Nouveau message » (planche 124): a candidate opens their conversation, a colleague the
 * conversation of the team (created on the first message).
 */
export function RhNewMessage({
  candidates,
  members,
}: {
  candidates: (Choice & { href: string })[];
  members: Choice[];
}) {
  const t = useTranslations("phoneRhMessages");
  const tc = useTranslations("phone");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="nb-rond"
        aria-label={t("new")}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <PhoneIcon name="plus" size={22} stroke={2.2} />
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("compose.title")}
        closeLabel={tc("close")}
      >
        <div className="nb-rm-nouveau">
          <h2 className="nb-rh-feuille-t">{t("compose.title")}</h2>
          <p className="nb-meta">{t("compose.note")}</p>
          {candidates.length + members.length === 0 ? (
            <p className="nb-vide">{t("compose.empty")}</p>
          ) : (
            <ul>
              {candidates.map((choice) => (
                <li key={choice.key}>
                  <Link href={choice.href} className="nb-rm-choix" onClick={() => setOpen(false)}>
                    <b>{choice.name}</b>
                    <small>{choice.line}</small>
                  </Link>
                </li>
              ))}
              {members.map((choice) => (
                <li key={choice.key}>
                  <form action={rhOpenTeamAction}>
                    <input type="hidden" name="member" value={choice.key} />
                    <button type="submit" className="nb-rm-choix">
                      <b>{choice.name}</b>
                      <small>{choice.line}</small>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="nb-annuler" onClick={() => setOpen(false)}>
            {t("compose.cancel")}
          </button>
        </div>
      </PhoneSheet>
    </>
  );
}
