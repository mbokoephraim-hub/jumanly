"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { foldPlace, placeRegions, type CountryOption } from "@/lib/places";
import { Flag } from "./flag";

/**
 * Screen 81 (V8 § B1): one country, searched or picked in its region, RD Congo first. The radios
 * are real form fields named `name`; the ones a search hides stay in the form, so the choice made
 * before searching is kept.
 */
export function CountryPicker({
  countries,
  initial,
  name = "country",
}: {
  countries: CountryOption[];
  initial?: string | null;
  name?: string;
}) {
  const t = useTranslations("places");
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial ?? "CD");
  const search = foldPlace(query.trim());
  const visible = (country: CountryOption) => !search || foldPlace(country.name).includes(search);
  const shown = countries.filter(visible);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor={`${id}-search`} className="sr-only">
          {t("search")}
        </label>
        <Icon
          name="recherche"
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ardoise"
        />
        <input
          id={`${id}-search`}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          className="h-12 w-full rounded-[16px] bg-blanc pr-3.5 pl-10 text-[14px] text-sapin shadow-douce placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none"
        />
      </div>
      {shown.length === 0 && (
        <p role="status" className="px-1 text-[14px] text-ardoise">
          {t("none")}
        </p>
      )}
      {placeRegions.map((region) => {
        const inRegion = countries.filter((country) => country.region === region);
        const anyShown = inRegion.some(visible);
        return (
          <fieldset key={region} className={cx("flex flex-col gap-2.5", !anyShown && "hidden")}>
            <legend className="mt-1.5 mb-2.5 text-[12px] font-bold tracking-[0.06em] text-ardoise uppercase">
              {t(`region.${region}`)}
            </legend>
            <div className="overflow-hidden rounded-[22px] bg-blanc shadow-douce">
              {inRegion.map((country) => (
                <label
                  key={country.code}
                  className={cx(
                    "group flex min-h-[52px] cursor-pointer items-center gap-3 border-t border-sapin/6 px-3.5 text-[14px] first:border-t-0 has-checked:bg-[#F1FBE6] has-checked:font-semibold has-focus-visible:bg-[#F1FBE6] has-focus-visible:shadow-[inset_0_0_0_2px_var(--color-sapin)]",
                    !visible(country) && "hidden",
                  )}
                >
                  <input
                    type="radio"
                    name={name}
                    value={country.code}
                    checked={selected === country.code}
                    onChange={() => setSelected(country.code)}
                    className="sr-only"
                  />
                  <Flag code={country.code} />
                  <span className="min-w-0 flex-1">{country.name}</span>
                  <span
                    aria-hidden
                    className="size-[22px] shrink-0 rounded-full shadow-[inset_0_0_0_2px_rgb(15_63_55/0.25)] group-has-checked:shadow-[inset_0_0_0_7px_var(--color-sapin)]"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
