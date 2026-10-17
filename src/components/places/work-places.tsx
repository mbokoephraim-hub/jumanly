"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { foldPlace, type CountryOption, type LocalityOption } from "@/lib/places";
import { Flag } from "./flag";

/** Places shown before « Plus de lieux » (screen 82 shows eight for RD Congo). */
const firstPlaces = 8;

const chip =
  "inline-flex min-h-[34px] items-center gap-[5px] rounded-pill px-2.5 text-[12px] transition-colors focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] focus-visible:outline-none";
const chipOff = "bg-[#F6F3EE] text-sapin hover:bg-[#EFEAE1]";
const chipOn = "bg-sapin text-blanc";

/**
 * Screen 82 (V8 § B1): several countries, then for each the whole country or some of its cities
 * and provinces, and remote work. Sends `countries` (ISO codes), `places` (« CD:Kinshasa ») and
 * `remote`; the server checks them against the reference.
 */
export function WorkPlaces({
  countries,
  localities,
  initialCountries,
  initialPlaces,
  initialRemote,
  remoteLabel,
  remoteLine,
}: {
  countries: CountryOption[];
  localities: Record<string, LocalityOption[]>;
  initialCountries: string[];
  initialPlaces: string[];
  initialRemote: boolean;
  remoteLabel: string;
  remoteLine: string;
}) {
  const t = useTranslations("places");
  const id = useId();
  const byCode = new Map(countries.map((country) => [country.code, country]));
  const [chosen, setChosen] = useState(() => initialCountries.filter((code) => byCode.has(code)));
  // An empty list means « Tout le pays ».
  const [places, setPlaces] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      initialCountries.map((code) => [
        code,
        (localities[code] ?? [])
          .map((place) => place.name)
          .filter((name) => initialPlaces.includes(name)),
      ]),
    ),
  );
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [remote, setRemote] = useState(initialRemote);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const add = (code: string) => {
    setChosen((list) => (list.includes(code) ? list : [...list, code]));
    setPlaces((all) => ({ ...all, [code]: all[code] ?? [] }));
    setAdding(false);
    setQuery("");
  };
  const remove = (code: string) => setChosen((list) => list.filter((item) => item !== code));
  const toggle = (code: string, name: string) =>
    setPlaces((all) => {
      const current = all[code] ?? [];
      return {
        ...all,
        [code]: current.includes(name)
          ? current.filter((item) => item !== name)
          : [...current, name],
      };
    });

  const search = foldPlace(query);
  const candidates = countries.filter(
    (country) =>
      !chosen.includes(country.code) && (!search || foldPlace(country.name).includes(search)),
  );

  return (
    <div className="flex flex-col gap-3">
      {chosen.map((code) => (
        <input key={code} type="hidden" name="countries" value={code} />
      ))}
      {chosen.flatMap((code) =>
        (places[code] ?? []).map((name) => (
          <input key={`${code}:${name}`} type="hidden" name="places" value={`${code}:${name}`} />
        )),
      )}
      {remote && <input type="hidden" name="remote" value="on" />}

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-2">
          <ul className="contents">
            {chosen.map((code) => {
              const name = byCode.get(code)?.name ?? code;
              return (
                <li key={code}>
                  <span className="inline-flex min-h-9 items-center gap-[7px] rounded-pill bg-sapin pr-1 pl-2.5 text-[12px] text-blanc">
                    <Flag code={code} small />
                    {name}
                    <button
                      type="button"
                      onClick={() => remove(code)}
                      aria-label={t("remove", { country: name })}
                      className="grid size-7 place-items-center rounded-full hover:bg-blanc/12 focus-visible:shadow-[0_0_0_3px_rgb(166_242_107/0.9)] focus-visible:outline-none"
                    >
                      <Icon name="fermer" className="size-[13px]" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className={cx(chip, chipOff, "min-h-9 gap-[7px]")}
            >
              <Icon name="plus" className="size-[13px]" />
              {t("add")}
            </button>
          )}
        </div>
        {adding && (
          <div className="flex w-full flex-col gap-2 rounded-[22px] bg-blanc p-3 shadow-douce">
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-add`} className="sr-only">
                {t("search")}
              </label>
              <span className="relative flex-1">
                <Icon
                  name="recherche"
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ardoise"
                />
                <input
                  id={`${id}-add`}
                  type="search"
                  autoFocus
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("search")}
                  className="h-11 w-full rounded-pill bg-[#F6F3EE] pr-4 pl-10 text-[14px] text-sapin placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none"
                />
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setQuery("");
                }}
                aria-label={t("close")}
                className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-[#F6F3EE] focus-visible:shadow-[0_0_0_3px_rgb(166_242_107/0.9)] focus-visible:outline-none"
              >
                <Icon name="fermer" className="size-5" />
              </button>
            </div>
            <ul className="flex max-h-64 flex-col overflow-y-auto" aria-label={t("add")}>
              {candidates.length === 0 && (
                <li role="status" className="px-2 py-3 text-[14px] text-ardoise">
                  {t("none")}
                </li>
              )}
              {candidates.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => add(country.code)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-[14px] px-2 text-left text-[14px] hover:bg-[#F1FBE6] focus-visible:bg-[#F1FBE6] focus-visible:shadow-[inset_0_0_0_2px_var(--color-sapin)] focus-visible:outline-none"
                  >
                    <Flag code={country.code} />
                    {country.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {chosen.length === 0 && <p className="text-[14px] text-ardoise">{t("empty")}</p>}

      {chosen.map((code) => {
        const country = byCode.get(code);
        const list = localities[code] ?? [];
        const picked = places[code] ?? [];
        const hasProvinces = list.some((place) => place.kind === "province");
        const shown = open[code] ? list : list.slice(0, firstPlaces);
        // Picked places stay visible even beyond the first eight.
        const visible = [
          ...shown,
          ...list.filter((place) => picked.includes(place.name) && !shown.includes(place)),
        ];
        const headingId = `${id}-${code}`;
        return (
          <section
            key={code}
            aria-labelledby={headingId}
            className="flex flex-col gap-2.5 rounded-[22px] bg-blanc px-3.5 pt-3 pb-3.5 shadow-douce"
          >
            <header className="flex items-center gap-2.5">
              <Flag code={code} />
              <h2 id={headingId} className="flex-1 text-[14.5px] font-bold">
                {country?.name ?? code}
              </h2>
              {list.length > 0 && (
                <span className="text-[12px] text-ardoise">
                  {hasProvinces ? t("citiesAndProvinces") : t("cities")}
                </span>
              )}
            </header>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={picked.length === 0}
                onClick={() => setPlaces((all) => ({ ...all, [code]: [] }))}
                className={cx(chip, picked.length === 0 ? chipOn : chipOff)}
              >
                {picked.length === 0 && <Icon name="check" className="size-[13px]" />}
                {t("wholeCountry")}
              </button>
              {visible.map((place) => {
                const on = picked.includes(place.name);
                return (
                  <button
                    key={place.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(code, place.name)}
                    className={cx(chip, on ? chipOn : chipOff)}
                  >
                    {on && <Icon name="check" className="size-[13px]" />}
                    {place.name}
                  </button>
                );
              })}
              {!open[code] && list.length > firstPlaces && (
                <button
                  type="button"
                  onClick={() => setOpen((all) => ({ ...all, [code]: true }))}
                  className={cx(chip, "text-feuille-fonce underline underline-offset-2")}
                >
                  {t("more")}
                </button>
              )}
            </div>
          </section>
        );
      })}

      <div className="flex items-center gap-3">
        <button
          id={`${id}-remote`}
          type="button"
          role="switch"
          aria-checked={remote}
          aria-labelledby={`${id}-remote-label`}
          aria-describedby={`${id}-remote-line`}
          onClick={() => setRemote(!remote)}
          className={cx(
            "touch-target relative h-[26px] w-11 shrink-0 rounded-pill transition-colors focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] focus-visible:outline-none",
            remote ? "bg-sapin" : "bg-brume",
          )}
        >
          <span
            aria-hidden
            className={cx(
              "absolute top-[3px] left-[3px] size-5 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-transform",
              remote ? "translate-x-[18px] bg-lime" : "bg-blanc",
            )}
          />
        </button>
        <span className="flex flex-col">
          <span id={`${id}-remote-label`} className="text-[13.5px] leading-[1.3] font-semibold">
            {remoteLabel}
          </span>
          <span id={`${id}-remote-line`} className="text-[12px] leading-[1.35] text-ardoise">
            {remoteLine}
          </span>
        </span>
      </div>
    </div>
  );
}
