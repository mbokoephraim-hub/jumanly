"use client";

import { useId, useRef, useState } from "react";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";
import { countrySections, foldPlace } from "@/lib/places";

type Country = { code: string; name: string; dialCode?: string | null };

export type CountrySheetLabels = {
  label: string;
  choose: string;
  title: string;
  search: string;
  none: string;
  close: string;
  sections: Record<"central" | "westEast" | "outside" | "all", string>;
};

function Flag({ code }: { code: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimisation needed.
    <img
      src={`/drapeaux/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={30}
      height={20}
      className="t-fl"
    />
  );
}

/**
 * « Votre pays » (brief § 2 decision 5, planche talent-4): a row with the flag, which opens the
 * sheet. RD Congo first, Africa by region, outside Africa, then A to Z, with local SVG flags. The
 * choice is sent as the hidden field `name`.
 *
 * `dial`: the same sheet for the dialling code of a Mobile Money number (planche talent-4 § 7,
 * « Indicatif »): the button is the flag and « +243 » at the start of the number field, each row
 * shows its code, and the field sends the code.
 */
export function CountrySheet({
  countries,
  initial,
  name = "country",
  labels,
  onChange,
  dial = false,
}: {
  countries: Country[];
  initial?: string | null;
  name?: string;
  labels: CountrySheetLabels;
  onChange?: (code: string) => void;
  dial?: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(
    countries.some((country) => country.code === initial) ? initial! : "",
  );
  const [query, setQuery] = useState("");
  const search = foldPlace(query);
  const digits = query.replace(/\D/g, "");
  const visible = (country: Country) =>
    !search ||
    foldPlace(country.name).includes(search) ||
    (dial && digits !== "" && (country.dialCode ?? "").replace(/\D/g, "").startsWith(digits));
  const current = countries.find((country) => country.code === selected);
  const sections = countrySections(countries);

  const choose = (code: string) => {
    setSelected(code);
    onChange?.(code);
    dialog.current?.close();
  };

  const open = () => {
    setQuery("");
    dialog.current?.showModal();
  };
  const trigger = dial ? (
    <>
      <input type="hidden" name={name} value={current?.dialCode ?? ""} />
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${labels.label} : ${current ? `${current.name} ${current.dialCode}` : labels.choose}`}
        onClick={open}
        className="t-ind t-press"
      >
        {current && <Flag code={current.code} />}
        <span>{current?.dialCode ?? labels.choose}</span>
        <TalentIcon name="suivant" size="xs" />
      </button>
    </>
  ) : (
    <>
      {/* The value sent with the form: rows hidden by a search are not in the page. */}
      <input type="hidden" name={name} value={selected} />
      <span className="t-lab-c" id={`${id}-l`}>
        {labels.label}
      </span>
      <button
        type="button"
        aria-labelledby={`${id}-l ${id}-v`}
        aria-haspopup="dialog"
        onClick={open}
        className="t-verre t-saisie t-press w-full gap-2.5 text-left"
      >
        {current && <Flag code={current.code} />}
        <span id={`${id}-v`} className={cx("flex-1", !current && "text-[var(--texte2)]")}>
          {current?.name ?? labels.choose}
        </span>
        <TalentIcon name="suivant" size="s" />
      </button>
    </>
  );

  const sheet = (
    <dialog
      ref={dialog}
      className="t-sheet"
      aria-labelledby={`${id}-t`}
      onClick={(event) => {
        // A tap on the veil closes the sheet.
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="t-poignee" aria-hidden />
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-t`}>{labels.title}</h2>
        <button
          type="button"
          className="t-bi t-press"
          aria-label={labels.close}
          onClick={() => dialog.current?.close()}
        >
          <TalentIcon name="fermer" size="s" />
        </button>
      </div>
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
      <div className="t-pays-l" role="radiogroup" aria-labelledby={`${id}-t`}>
        {sections.map((section) => {
          const shown = section.countries.filter(visible);
          if (shown.length === 0) return null;
          return (
            <div key={section.key} className="contents">
              {section.key !== "first" && (
                <span className="t-ck-t">{labels.sections[section.key]}</span>
              )}
              {shown.map((country) => (
                <label key={country.code} className="t-li">
                  <input
                    type="radio"
                    name={`${id}-pays`}
                    value={country.code}
                    checked={selected === country.code}
                    onChange={() => choose(country.code)}
                    onClick={() => choose(country.code)}
                  />
                  <Flag code={country.code} />
                  <span className="t-t">
                    <b>{country.name}</b>
                  </span>
                  {dial && <span className="t-v">{country.dialCode}</span>}
                  <span className="t-radio" aria-hidden />
                </label>
              ))}
            </div>
          );
        })}
        {sections.every((section) => section.countries.every((c) => !visible(c))) && (
          <p role="status" className="t-aide-c py-4 text-center">
            {labels.none}
          </p>
        )}
      </div>
    </dialog>
  );

  return dial ? (
    <>
      {trigger}
      {sheet}
    </>
  ) : (
    <div className="t-champ">
      {trigger}
      {sheet}
    </div>
  );
}
