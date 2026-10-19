"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { tailorKeywordsAction } from "@/server/actions/career-documents";
import { TalentIcon } from "../icon";

export type TailorOfferRow = {
  id: string;
  card: ReactNode;
  /** The lines under the card: already in the CV, to put forward, absent. */
  lines: { tone: "ok" | "ko"; text: string }[];
  copyNote: string;
};

/**
 * « Adapter à une offre » (planche talent-4 § 6): the offers saved or applied to, the chosen one's
 * gap with the CV, and what Orbi will make (a copy; the CV stays as it is).
 */
export function TailorOffer({
  offers,
  legend,
  children,
}: {
  offers: TailorOfferRow[];
  legend: string;
  /** The submit button, after the note. */
  children: ReactNode;
}) {
  const [chosen, setChosen] = useState(offers[0]?.id ?? "");
  const offer = offers.find((item) => item.id === chosen) ?? offers[0];
  if (!offer) return null;
  return (
    <>
      <fieldset className="t-choix">
        <legend className="sr-only">{legend}</legend>
        {offers.map((item) => (
          <label key={item.id} className="t-verre t-ch t-cd-ch t-press">
            <input
              type="radio"
              name="jobId"
              value={item.id}
              checked={item.id === offer.id}
              onChange={() => setChosen(item.id)}
            />
            {item.card}
            {offers.length > 1 && <span className="t-radio" aria-hidden />}
          </label>
        ))}
      </fieldset>
      {offer.lines.length > 0 && (
        <ul className="t-verre t-ecart" aria-live="polite">
          {offer.lines.map((line) => (
            <li key={line.text} className={cx("t-l", `t-${line.tone}`)}>
              <TalentIcon name={line.tone === "ok" ? "valider" : "plus"} size="s" />
              {line.text}
            </li>
          ))}
        </ul>
      )}
      <p className="t-gar">
        <TalentIcon name="document" size="s" />
        {offer.copyNote}
      </p>
      {children}
    </>
  );
}

/**
 * « Adapter à un texte »: what the text is (chips), the text itself (5 000 characters at most, with
 * its counter), then the skills it asks for, found or not in the CV (rules, no credit).
 */
export function TailorText({
  cvId,
  max,
  kinds,
  labels,
}: {
  cvId: string;
  max: number;
  kinds: { value: string; label: string; placeholder: string }[];
  labels: { kinds: string; text: string; count: string; present: string; missing: string };
}) {
  const [kind, setKind] = useState(kinds[0]?.value ?? "");
  const [text, setText] = useState("");
  const [words, setWords] = useState<{ present: string[]; missing: string[] }>({
    present: [],
    missing: [],
  });
  useEffect(() => {
    if (text.trim().length < 30) return;
    let live = true;
    const timer = window.setTimeout(async () => {
      const found = await tailorKeywordsAction(cvId, text).catch(() => null);
      if (live && found) setWords(found);
    }, 600);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [cvId, text]);
  const shown = text.trim().length < 30 ? { present: [], missing: [] } : words;
  const placeholder = kinds.find((item) => item.value === kind)?.placeholder;

  return (
    <>
      <fieldset>
        <legend className="sr-only">{labels.kinds}</legend>
        <div className="t-puces t-ligne">
          {kinds.map((item) => (
            <label key={item.value} className="t-puce t-press">
              <input
                type="radio"
                name="nature"
                value={item.value}
                checked={kind === item.value}
                onChange={() => setKind(item.value)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="t-ta">
        <label htmlFor={`${cvId}-texte`} className="sr-only">
          {labels.text}
        </label>
        <textarea
          id={`${cvId}-texte`}
          name="text"
          required
          minLength={30}
          maxLength={max}
          rows={5}
          placeholder={placeholder}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <span className="t-cn" aria-live="polite">
          {labels.count.replace("{count}", text.length.toLocaleString("fr-FR"))}
        </span>
      </div>
      {(shown.present.length > 0 || shown.missing.length > 0) && (
        <ul className="t-kw" aria-label={labels.present}>
          {shown.present.map((word) => (
            <li key={`p-${word}`}>
              <TalentIcon name="valider" size="xs" />
              {word}
            </li>
          ))}
          {shown.missing.map((word) => (
            <li key={`m-${word}`} className="t-m">
              <TalentIcon name="plus" size="xs" />
              <span className="sr-only">{labels.missing}</span>
              {word}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
