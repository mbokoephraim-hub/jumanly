"use client";

import { useState } from "react";
import { TalentIcon } from "@/components/talent/icon";
import { foldPlace } from "@/lib/places";
import { CountrySheet, type CountrySheetLabels } from "./country-sheet";

type Option = { value: string; label: string };

/**
 * Step 2 of 4 (planche talent-4 § 1): the level as one choice, the field searched in the reference
 * or picked among the six shown first. Both are real radios of the form.
 */
export function StudiesFields({
  levels,
  fields,
  featured,
  initialLevel,
  initialField,
  labels,
}: {
  levels: Option[];
  fields: Option[];
  featured: string[];
  initialLevel?: string | null;
  initialField?: string | null;
  labels: { level: string; field: string; search: string; none: string };
}) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState(initialField ?? "");
  const search = foldPlace(query);
  const shown = search
    ? fields.filter((option) => foldPlace(option.label).includes(search))
    : fields.filter((option) => featured.includes(option.value) || option.value === field);
  return (
    <>
      <fieldset className="t-fs">
        <legend className="t-lab-c">{labels.level}</legend>
        <div className="t-puces">
          {levels.map((level) => (
            <label key={level.value} className="t-puce t-press">
              <input
                type="radio"
                name="studyLevel"
                value={level.value}
                defaultChecked={initialLevel === level.value}
              />
              {level.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="t-fs">
        <legend className="t-lab-c">{labels.field}</legend>
        <input type="hidden" name="studyField" value={field} />
        <label className="t-verre t-rech t-champ-r">
          <TalentIcon name="recherche" size="s" />
          <span className="sr-only">{labels.search}</span>
          <input
            type="search"
            autoComplete="off"
            value={query}
            placeholder={labels.search}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="t-puces" role="radiogroup" aria-label={labels.field}>
          {shown.map((option) => (
            <label key={option.value} className="t-puce t-press">
              <input
                type="radio"
                name="studyFieldChoice"
                value={option.value}
                checked={field === option.value}
                onChange={() => setField(option.value)}
              />
              <TalentIcon name="valider" size="xs" />
              {option.label}
            </label>
          ))}
        </div>
        {shown.length === 0 && (
          <p role="status" className="t-aide-c">
            {labels.none}
          </p>
        )}
      </fieldset>
    </>
  );
}

/**
 * Step 3 of 4 (planche talent-4 § 1): the country (asked only here), the city among the places of
 * that country or typed, the contracts and the work mode.
 */
export function PlacesFields({
  countries,
  localities,
  initialCountry,
  initialCity,
  contracts,
  modes,
  initialContracts,
  initialMode,
  labels,
}: {
  countries: { code: string; name: string }[];
  /** Cities of each country (reference), by country code. */
  localities: Record<string, string[]>;
  initialCountry?: string | null;
  initialCity?: string | null;
  contracts: Option[];
  modes: Option[];
  initialContracts: string[];
  initialMode?: string | null;
  labels: {
    country: CountrySheetLabels;
    city: string;
    cityPlaceholder: string;
    contract: string;
    mode: string;
  };
}) {
  const [country, setCountry] = useState(initialCountry ?? "");
  const cities = localities[country] ?? [];
  return (
    <>
      <CountrySheet
        countries={countries}
        initial={initialCountry}
        labels={labels.country}
        onChange={setCountry}
      />
      <div className="t-champ">
        <label htmlFor="welcome-city">{labels.city}</label>
        <div className="t-verre t-saisie">
          <TalentIcon name="localisation" size="s" />
          <input
            id="welcome-city"
            name="city"
            autoComplete="address-level2"
            list="welcome-cities"
            maxLength={120}
            placeholder={labels.cityPlaceholder}
            defaultValue={initialCity ?? ""}
          />
          <datalist id="welcome-cities">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>
      </div>
      <fieldset className="t-fs">
        <legend className="t-lab-c">{labels.contract}</legend>
        <div className="t-puces">
          {contracts.map((contract) => (
            <label key={contract.value} className="t-puce t-press">
              <input
                type="checkbox"
                name="contracts"
                value={contract.value}
                defaultChecked={initialContracts.includes(contract.value)}
              />
              {contract.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="t-fs">
        <legend className="t-lab-c">{labels.mode}</legend>
        <div className="t-seg">
          {modes.map((mode) => (
            <label key={mode.value}>
              <input
                type="radio"
                name="mode"
                value={mode.value}
                defaultChecked={initialMode === mode.value}
              />
              {mode.label}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
