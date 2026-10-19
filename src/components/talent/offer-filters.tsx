"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { OFFER_FILTERS_ID } from "@/lib/offer-filters";
import { countOffersAction } from "@/server/actions/jobs";
import { TalentIcon } from "./icon";

type Plural = { zero: string; one: string; other: string };

export type OfferFiltersLabels = {
  title: string;
  close: string;
  domain: string;
  place: string;
  remote: string;
  contract: string;
  experience: string;
  verified: string;
  clear: string;
  show: Plural;
  contracts: Record<"cdi" | "cdd" | "internship" | "mission", string>;
  levels: Record<"none" | "junior" | "mid", string>;
};

type Values = Record<string, string>;

function plural(forms: Plural, count: number) {
  if (count === 0) return forms.zero;
  if (count === 1) return forms.one;
  return forms.other.replace("#", String(count));
}

/**
 * « Filtrer les offres » (planche talent-1 § 2): Domaine, Lieu, Contrat, Expérience, verified
 * companies, then « Effacer » and « Voir 24 offres », counted as the choices change. A touch on a
 * chosen chip removes it. The sheet sends a plain GET form, so it works without JavaScript too
 * (it then opens from `?filtres=1`).
 */
export function OfferFilters({
  initial,
  keep,
  choices,
  total,
  open,
  labels,
}: {
  initial: Values;
  /** Search and tab, sent again unchanged. */
  keep: Values;
  choices: { sectors: string[]; cities: string[] };
  total: number;
  open: boolean;
  labels: OfferFiltersLabels;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Values>(initial);
  const [count, setCount] = useState(total);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const next = await countOffersAction({ ...keep, ...values }).catch(() => null);
        if (next !== null) setCount(next);
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [values, keep]);

  const toggle = (key: string, value: string) =>
    setValues((all) => {
      const next = { ...all };
      if (next[key] === value) delete next[key];
      else next[key] = value;
      return next;
    });

  const group = (key: string, legend: string, options: [string, string][]) =>
    options.length === 0 ? null : (
      <fieldset className="t-fs t-champ">
        <legend className="t-lab-c">{legend}</legend>
        <div className="t-puces">
          {options.map(([value, label]) => (
            <label key={value} className="t-puce t-press">
              <input
                type="checkbox"
                name={key}
                value={value}
                checked={values[key] === value}
                onChange={() => toggle(key, value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    );

  const onClose = () => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("filtres")) return;
    url.searchParams.delete("filtres");
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <dialog
      ref={dialog}
      id={OFFER_FILTERS_ID}
      className="t-sheet t-auto"
      aria-labelledby={`${OFFER_FILTERS_ID}-t`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <form action="/app/jobs" method="get" className="flex flex-col gap-3">
        <div className="t-poignee" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${OFFER_FILTERS_ID}-t`}>{labels.title}</h2>
          <button
            type="button"
            className="t-bi t-press"
            aria-label={labels.close}
            onClick={() => dialog.current?.close()}
          >
            <TalentIcon name="fermer" size="s" />
          </button>
        </div>
        {Object.entries(keep).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        {group(
          "secteur",
          labels.domain,
          choices.sectors.map((sector) => [sector, sector]),
        )}
        <fieldset className="t-fs t-champ">
          <legend className="t-lab-c">{labels.place}</legend>
          <div className="t-puces">
            {choices.cities.map((city) => (
              <label key={city} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="ville"
                  value={city}
                  checked={values.ville === city}
                  onChange={() => toggle("ville", city)}
                />
                {city}
              </label>
            ))}
            <label className="t-puce t-press">
              <input
                type="checkbox"
                name="teletravail"
                value="full"
                checked={values.teletravail === "full"}
                onChange={() => toggle("teletravail", "full")}
              />
              {labels.remote}
            </label>
          </div>
        </fieldset>
        {group(
          "contrat",
          labels.contract,
          (["cdi", "cdd", "internship", "mission"] as const).map((key) => [
            key,
            labels.contracts[key],
          ]),
        )}
        {group(
          "experience",
          labels.experience,
          (["none", "junior", "mid"] as const).map((key) => [key, labels.levels[key]]),
        )}
        <label className="t-li min-h-11 cursor-pointer border-0 p-0">
          <span className="t-t">
            <b>{labels.verified}</b>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="verifiees"
            value="1"
            checked={values.verifiees === "1"}
            onChange={() => toggle("verifiees", "1")}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
        <div className="t-f-act">
          <button type="button" className="t-bt t-sec t-m t-press" onClick={() => setValues({})}>
            {labels.clear}
          </button>
          <button
            type="submit"
            aria-busy={pending || undefined}
            className="t-bt t-p t-m t-pl t-press"
          >
            {plural(labels.show, count)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
