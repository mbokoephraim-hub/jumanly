"use client";

import { useState } from "react";
import { TalentIcon } from "../../icon";
import { openOrbiPanel } from "../../web/orbi-panel";

/**
 * « Demander à Orbi » at the foot of an Orbi panel of the studio (planche web.py `.op-c`): the
 * question opens the Orbi conversation on the right of the page, which keeps the studio as it is.
 */
export function AskOrbi({ labels }: { labels: { placeholder: string; send: string } }) {
  const [text, setText] = useState("");
  return (
    <form
      className="t-sc-ask"
      onSubmit={(event) => {
        event.preventDefault();
        if (!text.trim()) return;
        openOrbiPanel(text);
        setText("");
      }}
    >
      <TalentIcon name="plus" size="s" />
      <label className="sr-only" htmlFor="sc-demander">
        {labels.placeholder}
      </label>
      <input
        id="sc-demander"
        value={text}
        maxLength={1000}
        placeholder={labels.placeholder}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit" className="t-bi t-press t-sc-env" aria-label={labels.send}>
        <TalentIcon name="envoyer" size="s" />
      </button>
    </form>
  );
}
