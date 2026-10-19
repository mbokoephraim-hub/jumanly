"use client";

import { useState } from "react";
import { TalentIcon } from "../icon";
import { openOrbiPanel } from "./orbi-panel";

/**
 * « Demander à Orbi » at the foot of a panel about an offer (planche web talent-1 § 4): the question
 * goes to the Orbi panel with the offer in context (`context` holds `{question}`). Orbi answers and
 * proposes; nothing is changed or sent without the person's agreement.
 */
export function AskOrbiAbout({
  context,
  labels,
}: {
  context: string;
  labels: { placeholder: string; label: string; send: string };
}) {
  const [question, setQuestion] = useState("");
  return (
    <form
      className="t-compo t-odw-ask t-web"
      onSubmit={(event) => {
        event.preventDefault();
        const text = question.trim();
        if (!text) return;
        event.currentTarget.closest("dialog")?.close();
        openOrbiPanel(context.replace("{question}", text));
        setQuestion("");
      }}
    >
      <TalentIcon name="plus" size="s" />
      <input
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        aria-label={labels.label}
        placeholder={labels.placeholder}
        maxLength={900}
        autoComplete="off"
      />
      <button type="submit" className="t-bi t-env t-press" aria-label={labels.send}>
        <TalentIcon name="envoyer" size="s" />
      </button>
    </form>
  );
}
