"use client";

import { useState } from "react";
import { CompanyMark } from "@/components/phone/career/experience-fields";
import { PhoneIcon } from "@/components/phone/icon";

type Offer = { id: string; title: string; company: string; logo: string | null };

/**
 * « Pour quelle offre ? » (Ephraïm, 31/10/2026): instead of the phone's own list, a framed menu in
 * the page's style. Each offer shows its company's logo, the job title and the company below.
 * The choices are radios named `jobId`, so the form sends the one chosen.
 */
export function LetterOffer({
  label,
  none,
  offers,
}: {
  label: string;
  none: string;
  offers: Offer[];
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState("");
  const current = offers.find((offer) => offer.id === chosen) ?? null;
  return (
    <fieldset className="nb-lt-champ">
      <legend>{label}</legend>
      <button
        type="button"
        className="nb-lt-offre"
        aria-expanded={open}
        aria-controls="nb-lt-offres"
        onClick={() => setOpen((value) => !value)}
      >
        <OfferLine offer={current} none={none} />
        <PhoneIcon name={open ? "haut" : "bas"} size={20} />
      </button>
      <div id="nb-lt-offres" className="nb-lt-offres" hidden={!open}>
        {[null, ...offers].map((offer) => {
          const value = offer?.id ?? "";
          return (
            <label key={value || "aucune"} className="nb-lt-option">
              <input
                type="radio"
                name="jobId"
                value={value}
                checked={chosen === value}
                onChange={() => {
                  setChosen(value);
                  setOpen(false);
                }}
              />
              <OfferLine offer={offer} none={none} />
              <span className="nb-lt-coche" aria-hidden>
                <PhoneIcon name="coche" size={16} stroke={2.4} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function OfferLine({ offer, none }: { offer: Offer | null; none: string }) {
  return (
    <span className="nb-lt-ligne">
      {offer ? (
        <CompanyMark name={offer.company} logo={offer.logo} size={40} />
      ) : (
        <span className="nb-lt-sans" aria-hidden>
          <PhoneIcon name="document" size={18} />
        </span>
      )}
      <span className="nb-lt-ligne-t">
        <b>{offer ? offer.title : none}</b>
        {offer ? <small>{offer.company}</small> : null}
      </span>
    </span>
  );
}
