"use client";

import { useState } from "react";
import { askCandidateAction } from "@/server/actions/hire-candidate-ask";
import { PhoneSheet } from "../sheet";

export type RhProposalTexts = {
  title: string;
  lead: string;
  label: string;
  send: string;
  cancel: string;
  close: string;
};

/**
 * One « proposition » under the documents of a candidate (Ephraïm, 03/11/2026): the button opens
 * the prepared message, the recruiter can change it, then sends it to the candidate in Messages.
 */
export function RhProposal({
  id,
  application,
  job,
  back,
  action,
  message,
  texts,
}: {
  id: string;
  application: string;
  job: string;
  back: string;
  /** The text of the button (« Demander une vérification »). */
  action: string;
  message: string;
  texts: RhProposalTexts;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nb-rh-fp-prop-go" onClick={() => setOpen(true)}>
        {action}
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={texts.title}
        closeLabel={texts.close}
      >
        <form action={askCandidateAction} className="nb-rh-confirme nb-rh-fp-envoi">
          <h2>{texts.title}</h2>
          <p>{texts.lead}</p>
          <input type="hidden" name="application" value={application} />
          <input type="hidden" name="job" value={job} />
          <input type="hidden" name="back" value={back} />
          <label className="nb-rh-date">
            <span className="nb-meta">{texts.label}</span>
            <textarea
              id={`rh-fp-${id}-${application}`}
              name="body"
              rows={6}
              minLength={10}
              maxLength={2000}
              required
              defaultValue={message}
            />
          </label>
          <button type="submit" className="nb-bp">
            {texts.send}
          </button>
          <button type="button" className="nb-annuler" onClick={() => setOpen(false)}>
            {texts.cancel}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}
