"use client";

import { useState } from "react";
import { decideAction } from "@/server/actions/hire-candidates";
import { sortGestureAction } from "@/server/actions/hire-tri";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";

export type RhDecisionChoice = "retain" | "hold" | "reject";

export type RhDecisionOption = {
  choice: RhDecisionChoice;
  label: string;
  /** One line under the label (« Il entre dans la liste des retenus »). */
  line: string;
  /** Already done (« Déjà retenu »): the option shows its state, the bottom bar undoes it. */
  done: string | null;
  reasons: { value: string; label: string }[];
};

export type RhDecisionTexts = {
  suggested: string;
  reason: string;
  message: string;
  confirm: Record<RhDecisionChoice, string>;
  cancel: string;
  close: string;
};

/**
 * Bloc 4 of « Évaluation » (Ephraïm, 03/11/2026): the recruiter decides, with a reason. Orbi's
 * suggestion is marked; nothing is done before a member confirms in the sheet.
 */
export function RhDecision({
  application,
  job,
  back,
  suggested,
  options,
  rejectMessage,
  texts,
}: {
  application: string;
  job: string;
  /** Where to land after the decision (the next candidate, else the list). */
  back: string;
  suggested: RhDecisionChoice | null;
  options: RhDecisionOption[];
  rejectMessage: string;
  texts: RhDecisionTexts;
}) {
  const [open, setOpen] = useState<RhDecisionChoice | null>(null);
  const [reason, setReason] = useState("");
  const current = options.find((item) => item.choice === open) ?? null;
  const close = () => {
    setOpen(null);
    setReason("");
  };
  return (
    <>
      <ul className="nb-rh-ev-choix">
        {options.map((item) => (
          <li key={item.choice}>
            <button
              type="button"
              className="nb-rh-ev-option"
              data-choix={item.choice}
              data-suggere={suggested === item.choice ? "" : undefined}
              disabled={item.done !== null}
              onClick={() => setOpen(item.choice)}
            >
              <span className="nb-rh-ev-option-t">
                <b>{item.label}</b>
                <small>{item.done ?? item.line}</small>
              </span>
              {suggested === item.choice ? (
                <span className="nb-rh-ev-badge">{texts.suggested}</span>
              ) : null}
              {item.done === null ? <PhoneIcon name="chevron" size={16} /> : null}
            </button>
          </li>
        ))}
      </ul>
      <PhoneSheet
        open={current !== null}
        onClose={close}
        label={current?.label ?? ""}
        closeLabel={texts.close}
      >
        {current ? (
          <form
            action={current.choice === "reject" ? decideAction : sortGestureAction}
            className="nb-rh-decision"
          >
            <h2 className="nb-rh-feuille-t">{current.label}</h2>
            <input type="hidden" name="application" value={application} />
            <input type="hidden" name="job" value={job} />
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="reason" value={reason} />
            {current.choice === "reject" ? (
              <input type="hidden" name="outcome" value="rejected" />
            ) : (
              <input
                type="hidden"
                name="gesture"
                value={current.choice === "retain" ? "retenir" : "attente"}
              />
            )}
            <p className="nb-meta">{texts.reason}</p>
            <div className="nb-rh-puces-c" role="radiogroup" aria-label={texts.reason}>
              {current.reasons.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={reason === item.value}
                  className="nb-pilule"
                  onClick={() => setReason(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {current.choice === "reject" ? (
              <>
                <label className="nb-meta" htmlFor={`rh-ev-refus-${application}`}>
                  {texts.message}
                </label>
                <textarea
                  id={`rh-ev-refus-${application}`}
                  name="message"
                  required
                  minLength={2}
                  maxLength={4000}
                  rows={5}
                  defaultValue={rejectMessage}
                  className="nb-rh-zone"
                />
              </>
            ) : null}
            <button type="submit" className="nb-bp" disabled={!reason}>
              {texts.confirm[current.choice]}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {texts.cancel}
            </button>
          </form>
        ) : null}
      </PhoneSheet>
    </>
  );
}
