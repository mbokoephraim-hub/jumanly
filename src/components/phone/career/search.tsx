"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { PhoneIcon } from "../icon";
import type { CareerSearchItem } from "./data";

const SCOPES = ["tout", "profil", "cv", "portfolio", "candidatures", "parametres"] as const;
type Scope = (typeof SCOPES)[number];

/** Recent searches stay on this phone only (a convenience, never needed by the page). */
const RECENT_KEY = "jm-carriere-recherches";
const RECENT_MAX = 3;

function readRecent(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {}
}

const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * The search of Carrière in two steps (brief § 3, rule 2; planches Carrière-recherche): touching
 * shows where to search, shortcuts and recent searches; from the first letter, everything of the
 * person's own career that matches. Read on the phone: nothing leaves it.
 */
export function CareerSearch({
  items,
  plan,
  onClose,
  onNewCv,
}: {
  items: CareerSearchItem[];
  plan: string;
  onClose: () => void;
  onNewCv: () => void;
}) {
  const t = useTranslations("phoneCareer");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("tout");
  // Opened by a touch, never on the server: the phone's own list is there at once.
  const [recent, setRecent] = useState<string[]>(readRecent);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const typed = query.trim();
  const found = typed
    ? items.filter(
        (item) =>
          (scope === "tout" || item.scope === scope) &&
          fold(`${item.title} ${item.kind}`).includes(fold(typed)),
      )
    : [];
  const remember = () => {
    if (!typed) return;
    const next = [typed, ...recent.filter((item) => item !== typed)].slice(0, RECENT_MAX);
    setRecent(next);
    writeRecent(next);
  };

  const shortcuts: { text: string; where: string; href?: string; action?: () => void }[] = [
    { text: t("shortcut.edit"), where: t("shortcutWhere.profil"), href: "/app/career/profil" },
    { text: t("shortcut.cv"), where: t("shortcutWhere.cv"), action: onNewCv },
    {
      text: t("shortcut.interview"),
      where: t("shortcutWhere.candidatures"),
      href: "/app/career/entretiens/nouveau",
    },
    { text: t("shortcut.plan"), where: t("shortcutWhere.plan", { plan }), href: "/app/abonnement" },
    {
      text: t("shortcut.privacy"),
      where: t("shortcutWhere.parametres"),
      href: "/app/parametres/confidentialite",
    },
  ];

  return (
    <div className="nb-ca-recherche">
      <div className="nb-ex-champ">
        <label className="nb-ex-recherche">
          <PhoneIcon name="recherche" size={20} />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              if (event.key === "Enter") remember();
            }}
            aria-label={t("searchLabel")}
            placeholder={t("searchField")}
            enterKeyHint="search"
          />
          {typed ? (
            <button
              type="button"
              aria-label={t("clear")}
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
            >
              <PhoneIcon name="fermer" size={16} />
            </button>
          ) : null}
        </label>
        <button type="button" className="nb-ex-annuler" data-retour="" onClick={onClose}>
          {t("cancel")}
        </button>
      </div>

      <div className="nb-ex-options" data-recherche="">
        <p className="nb-ex-groupe">{t("searchIn")}</p>
        <div className="nb-ex-portee" role="group" aria-label={t("searchIn")}>
          {SCOPES.map((key) => (
            <button
              key={key}
              type="button"
              className="nb-ex-chip"
              data-fort=""
              aria-pressed={scope === key}
              onClick={() => setScope(key)}
            >
              {t(`searchScope.${key}`)}
            </button>
          ))}
        </div>

        {typed ? (
          found.length === 0 ? (
            <p className="nb-ex-vide">{t("noResult", { query: typed })}</p>
          ) : (
            <section aria-label={t("search")}>
              {found.map((item) => (
                <Link key={item.id} href={item.href} className="nb-ca-trouve" onClick={remember}>
                  <span className="nb-ca-trouve-i" aria-hidden>
                    {item.initials}
                  </span>
                  <span>
                    <b>{item.title}</b>
                    <small>{item.kind}</small>
                  </span>
                  <PhoneIcon name="chevron" size={18} />
                </Link>
              ))}
            </section>
          )
        ) : (
          <>
            <section aria-label={t("shortcuts")}>
              <h2 className="nb-ex-groupe">{t("shortcuts")}</h2>
              {shortcuts.map((item) =>
                item.href ? (
                  <Link key={item.text} href={item.href} className="nb-ca-raccourci">
                    <span>{item.text}</span>
                    <small>{item.where}</small>
                  </Link>
                ) : (
                  <button
                    key={item.text}
                    type="button"
                    className="nb-ca-raccourci"
                    onClick={item.action}
                  >
                    <span>{item.text}</span>
                    <small>{item.where}</small>
                  </button>
                ),
              )}
            </section>
            {recent.length > 0 ? (
              <section aria-label={t("recent")}>
                <h2 className="nb-ex-groupe">{t("recent")}</h2>
                {recent.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="nb-ca-raccourci"
                    data-recent=""
                    onClick={() => setQuery(item)}
                  >
                    <PhoneIcon name="horloge" size={18} />
                    <span>{item}</span>
                  </button>
                ))}
              </section>
            ) : null}
            <p className="nb-ex-indice">{t("searchHint")}</p>
          </>
        )}
      </div>
    </div>
  );
}
