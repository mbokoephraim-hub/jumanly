"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { exploreSearchAction, type ExploreFound } from "@/server/actions/explore";
import { PhoneIcon } from "../icon";
import { CompanyRow, OfferRow, PersonRow } from "./cards";

const SCOPES = ["tout", "offres", "entreprises", "personnes", "villes"] as const;
type Scope = (typeof SCOPES)[number];

/** Recent searches stay on this phone only (a convenience, never needed by the page). */
const RECENT_KEY = "jm-explorer-recherches";
const RECENT_MAX = 3;
type Recent = { query: string; at: number };

function readRecent(): Recent[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(value)
      ? value.filter(
          (item): item is Recent => typeof item?.query === "string" && typeof item?.at === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function writeRecent(list: Recent[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {}
}

/**
 * The search of Explorer in two steps (brief § 3, rule 2; planches Offres-recherche): touching the
 * field shows where to search, the recent searches and the popular ones; from the first letter,
 * the offers, companies, people and cities found. « Annuler » comes back to Explorer as it was.
 */
export function ExplorerSearch({
  open,
  onOpen,
  onClose,
  cities,
  popular,
  city,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  cities: { city: string; offers: number }[];
  popular: string[];
  city: string | null;
}) {
  const t = useTranslations("phoneExplorer");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("tout");
  const [found, setFound] = useState<ExploreFound | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const typed = query.trim();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once the browser is there
    if (open) setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    if (!typed) return;
    let live = true;
    const timer = setTimeout(() => {
      void exploreSearchAction(typed, scope).then((result) => {
        if (live && result.ok) setFound(result.value);
      });
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [typed, scope]);

  const close = () => {
    setQuery("");
    setFound(null);
    setScope("tout");
    input.current?.blur();
    onClose();
  };
  const remember = () => {
    if (!typed) return;
    const next = [
      { query: typed, at: Date.now() },
      ...readRecent().filter((item) => item.query.toLowerCase() !== typed.toLowerCase()),
    ];
    writeRecent(next);
  };
  const pick = (value: string, next: Scope = scope) => {
    setScope(next);
    setQuery(value);
    input.current?.focus();
  };
  const when = (at: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (at >= today.getTime()) return t("search.today");
    if (at >= today.getTime() - 86_400_000) return t("search.yesterday");
    return new Intl.DateTimeFormat("fr", { day: "numeric", month: "short" }).format(at);
  };

  const groups = found
    ? [
        found.offers.length > 0 ? (
          <section key="o" aria-label={t("search.offers", { count: found.offers.length })}>
            <h2 className="nb-ex-groupe">{t("search.offers", { count: found.offers.length })}</h2>
            {found.offers.map((offer) => (
              <div key={offer.id} onClickCapture={remember}>
                <OfferRow
                  offer={offer}
                  line={t("search.offerLine", { company: offer.company, city: offer.city })}
                />
              </div>
            ))}
          </section>
        ) : null,
        found.companies.length > 0 ? (
          <section key="e" aria-label={t("search.companies", { count: found.companies.length })}>
            <h2 className="nb-ex-groupe">
              {t("search.companies", { count: found.companies.length })}
            </h2>
            {found.companies.map((company) => (
              <div key={company.slug} onClickCapture={remember}>
                <CompanyRow
                  company={company}
                  line={t("companyLineNoSector", { count: company.offers })}
                />
              </div>
            ))}
          </section>
        ) : null,
        found.people.length > 0 ? (
          <section key="p" aria-label={t("search.people", { count: found.people.length })}>
            <h2 className="nb-ex-groupe">{t("search.people", { count: found.people.length })}</h2>
            {found.people.map((person) => (
              <div key={person.id} onClickCapture={remember}>
                <PersonRow person={person} reason={false} />
              </div>
            ))}
          </section>
        ) : null,
        found.cities.length > 0 ? (
          <section key="v" aria-label={t("search.citiesFound", { count: found.cities.length })}>
            <h2 className="nb-ex-groupe">
              {t("search.citiesFound", { count: found.cities.length })}
            </h2>
            {found.cities.map((row) => (
              <button
                key={row.city}
                type="button"
                className="nb-ex-ville-l"
                onClick={() => pick(row.city, "offres")}
              >
                <span>{row.city}</span>
                <span className="nb-meta">{t("search.cityOffers", { count: row.offers })}</span>
              </button>
            ))}
          </section>
        ) : null,
      ].filter(Boolean)
    : null;

  return (
    <>
      <div className="nb-ex-champ">
        <label className="nb-ex-recherche">
          <PhoneIcon name="recherche" size={20} />
          <input
            ref={input}
            type="search"
            value={query}
            onFocus={onOpen}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!event.target.value.trim()) setFound(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
              if (event.key === "Enter") remember();
            }}
            aria-label={t("search.label")}
            placeholder={t("search.placeholder")}
            enterKeyHint="search"
          />
          {typed ? (
            <button
              type="button"
              aria-label={t("search.clear")}
              onClick={() => {
                setQuery("");
                setFound(null);
                input.current?.focus();
              }}
            >
              <PhoneIcon name="fermer" size={16} />
            </button>
          ) : null}
        </label>
        {open ? (
          <button type="button" className="nb-ex-annuler" data-retour="" onClick={close}>
            {t("search.cancel")}
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="nb-ex-options" data-recherche="">
          <p className="nb-ex-groupe">{t("search.in")}</p>
          <div className="nb-ex-portee" role="group" aria-label={t("search.in")}>
            {SCOPES.map((key) => (
              <button
                key={key}
                type="button"
                className="nb-ex-chip"
                data-fort=""
                aria-pressed={scope === key}
                onClick={() => setScope(key)}
              >
                {t(`search.scope.${key}`)}
              </button>
            ))}
          </div>

          {typed ? (
            groups === null ? null : groups.length === 0 ? (
              <p className="nb-ex-vide">{t("search.empty", { query: typed })}</p>
            ) : (
              groups
            )
          ) : scope === "villes" ? (
            <section aria-label={t("search.cities")}>
              <h2 className="nb-ex-groupe">{t("search.cities")}</h2>
              {cities.map((row) => (
                <button
                  key={row.city}
                  type="button"
                  className="nb-ex-ville-l"
                  onClick={() => pick(row.city, "offres")}
                >
                  <span>{row.city}</span>
                  <span className="nb-meta">{t("search.cityOffers", { count: row.offers })}</span>
                </button>
              ))}
            </section>
          ) : (
            <>
              {recent.length > 0 ? (
                <section aria-label={t("search.recent")}>
                  <h2 className="nb-ex-groupe">{t("search.recent")}</h2>
                  {recent.map((item) => (
                    <button
                      key={item.query}
                      type="button"
                      className="nb-ex-recent"
                      onClick={() => pick(item.query)}
                    >
                      <PhoneIcon name="horloge" size={20} />
                      <span>{item.query}</span>
                      <span className="nb-meta">{when(item.at)}</span>
                    </button>
                  ))}
                </section>
              ) : null}
              {popular.length > 0 ? (
                <section aria-label={city ? t("search.popular", { city }) : t("search.popularAll")}>
                  <h2 className="nb-ex-groupe">
                    {city ? t("search.popular", { city }) : t("search.popularAll")}
                  </h2>
                  <div className="nb-ex-populaires">
                    {popular.map((value) => (
                      <button key={value} type="button" onClick={() => pick(value)}>
                        {value}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <p className="nb-ex-astuce">{t("search.hint")}</p>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
