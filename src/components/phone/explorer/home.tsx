"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  type ExploreFilters,
  NO_FILTERS,
  activeFilters,
  showsSection,
} from "@/server/services/explore-filters";
import { FilAvatar } from "../fil/avatar";
import { CompanyCard, OfferCard, PersonRow, SavedLink } from "./cards";
import type { ExplorerHomeView } from "./data";
import { FiltersButton, FiltersSheet } from "./filters";
import { ExplorerSearch } from "./search";

export type ExplorerMe = {
  name: string;
  initials: string;
  image: string | null;
  city: string | null;
};

/**
 * Explorer (Modèle B, planche Offres, rangée 07): the head (me, the bookmark), the search in two
 * steps, then « Offres pour vous », « Entreprises qui recrutent », « Nouvelles cette semaine » and
 * « Personnes à connaître ». The chips filter in place, everything arrived with the page.
 * « Filtres » (docs/fil-menu-publication § 3) reads the lists that meet them on the server.
 */
export function PhoneExplorer({
  me,
  saved,
  lists,
  cities,
  popular,
}: {
  me: ExplorerMe;
  saved: number;
  lists: ExplorerHomeView;
  cities: { city: string; offers: number }[];
  popular: string[];
}) {
  const t = useTranslations("phoneExplorer");
  const [domain, setDomain] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [filters, setFilters] = useState<ExploreFilters>(NO_FILTERS);
  // The lists that meet the filters; none while no filter is on (the page's own lists).
  const [filtered, setFiltered] = useState<ExplorerHomeView | null>(null);
  const { offers, fresh, domains, companies, sectors, people } = filtered ?? lists;

  const forYou = offers.filter((offer) => !domain || offer.domain === domain).slice(0, 8);
  const hiring = companies.filter((company) => !sector || company.sector === sector).slice(0, 8);
  const newOnes = fresh.filter((offer) => !sector || offer.sector === sector).slice(0, 8);
  const show = (section: "offres" | "entreprises" | "personnes") =>
    showsSection(filters.scope, section);

  return (
    <div className="nb-page nb-ex">
      <header className="nb-ex-haut">
        <Link href="/app/career/cv" className="nb-ex-moi" aria-label={t("account")}>
          <FilAvatar initials={me.initials} image={me.image} tone={0} org={false} me size={40} />
        </Link>
        <h1>{t("title")}</h1>
        <SavedLink count={saved} />
      </header>

      <ExplorerSearch
        open={searching}
        onOpen={() => setSearching(true)}
        onClose={() => setSearching(false)}
        cities={cities}
        popular={popular}
        city={me.city}
        aside={<FiltersButton count={activeFilters(filters)} onOpen={() => setFiltering(true)} />}
      />
      <FiltersSheet
        open={filtering}
        applied={filters}
        onClose={() => setFiltering(false)}
        onApply={(next, found) => {
          setFilters(next);
          setFiltered(found);
          setDomain(null);
          setSector(null);
          setFiltering(false);
        }}
      />

      {searching ? null : (
        <>
          {show("offres") ? (
            <section aria-labelledby="ex-pour-vous">
              <Section id="ex-pour-vous" title={t("forYou")} href="/app/explorer/offres" />
              <Chips
                label={t("chips.domains")}
                all={t("chips.all")}
                values={domains}
                current={domain}
                onPick={setDomain}
              />
              {forYou.length === 0 ? (
                <p className="nb-ex-vide">{t("noOffers")}</p>
              ) : (
                <div className="nb-ex-rangee nb-ex-cartes">
                  {forYou.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {show("entreprises") ? (
            <section aria-labelledby="ex-recrutent">
              <Section id="ex-recrutent" title={t("hiring")} href="/app/explorer/entreprises" />
              <Chips
                label={t("chips.sectors")}
                all={t("chips.all")}
                values={sectors.map((value) => ({ key: value, label: value }))}
                current={sector}
                onPick={setSector}
              />
              {hiring.length === 0 ? (
                <p className="nb-ex-vide">{t("noCompanies")}</p>
              ) : (
                <div className="nb-ex-rangee nb-ex-ents">
                  {hiring.map((company) => (
                    <CompanyCard key={company.slug} company={company} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {show("offres") ? (
            <section aria-labelledby="ex-nouvelles">
              <Section
                id="ex-nouvelles"
                title={sector ?? t("fresh")}
                href="/app/explorer/nouvelles"
              />
              {newOnes.length === 0 ? (
                <p className="nb-ex-vide">{t("noFresh")}</p>
              ) : (
                <div className="nb-ex-rangee nb-ex-cartes">
                  {newOnes.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {show("personnes") ? (
            <section aria-labelledby="ex-personnes">
              <Section id="ex-personnes" title={t("people")} href="/app/explorer/personnes" />
              {people.length === 0 ? <p className="nb-ex-vide">{t("noPeople")}</p> : null}
              {people.slice(0, 5).map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Section({ id, title, href }: { id: string; title: string; href: string }) {
  const t = useTranslations("phoneExplorer");
  return (
    <div className="nb-ex-sec">
      <h2 id={id}>{title}</h2>
      <Link href={href} aria-label={t("seeAllOf", { section: title })}>
        {t("seeAll")}
      </Link>
    </div>
  );
}

function Chips({
  label,
  all,
  values,
  current,
  onPick,
}: {
  label: string;
  all: string;
  values: { key: string; label: string }[];
  current: string | null;
  onPick: (value: string | null) => void;
}) {
  if (values.length === 0) return null;
  return (
    <div className="nb-ex-rangee nb-ex-filtres" role="group" aria-label={label}>
      <button
        type="button"
        className="nb-ex-chip"
        aria-pressed={current === null}
        onClick={() => onPick(null)}
      >
        {all}
      </button>
      {values.map((value) => (
        <button
          key={value.key}
          type="button"
          className="nb-ex-chip"
          aria-pressed={current === value.key}
          onClick={() => onPick(value.key)}
        >
          {value.label}
        </button>
      ))}
    </div>
  );
}
