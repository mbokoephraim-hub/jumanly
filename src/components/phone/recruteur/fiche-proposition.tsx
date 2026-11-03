"use client";

import { useState, type CSSProperties } from "react";
import { PhoneIcon } from "../icon";
import { askCandidateAction } from "@/server/actions/hire-candidate-ask";
import { PhoneSheet } from "../sheet";

const STEP_COLORS = ["#F4C463", "#FF8A7A", "#2FD3A6"] as const;

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
  detail,
  index,
  message,
  texts,
}: {
  id: string;
  application: string;
  job: string;
  back: string;
  /** The text of the button (« Demander une vérification »). */
  action: string;
  /** What to add, in one short line under the title. */
  detail: string;
  /** Its place in the list: the colour of « Prochaines étapes » of Carrière (1 jaune, 2 corail, 3 vert). */
  index: number;
  message: string;
  texts: RhProposalTexts;
}) {
  const [open, setOpen] = useState(false);
  const color = STEP_COLORS[index % STEP_COLORS.length]!;
  return (
    <>
      <button
        type="button"
        className="nb-cr-etape-anim nb-rh-fp-etape"
        onClick={() => setOpen(true)}
        style={
          {
            background: `linear-gradient(135deg, ${color}2e, ${color}0d)`,
            boxShadow: `inset 0 0 0 1px ${color}55`,
            "--etape-c": color,
            "--etape-d": `${index * 0.6}s`,
          } as CSSProperties
        }
      >
        <span className="nb-cr-num" style={{ background: color, color: "#0f3f37" }} aria-hidden>
          {index + 1}
        </span>
        <span className="nb-cr-etape-t">
          <b>{action}</b>
          <small>{detail}</small>
        </span>
        <PhoneIcon name="chevron" size={16} />
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
              rows={11}
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
