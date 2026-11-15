"use client";

import { useEffect, useRef, useState } from "react";
import { HireIcon } from "./icon";
import { openHireOrbi } from "./orbi";

/** « Orbi résume vos non-lus » (`.mxorbi`): opens Orbi's panel with the question. */
export function MessagesOrbiButton({
  title,
  sub,
  question,
}: {
  title: string;
  sub: string;
  question: string;
}) {
  return (
    <button type="button" className="mxorbi" onClick={() => openHireOrbi(question)}>
      <HireIcon name="orbi" size="s" />
      <span>
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      <HireIcon name="chev" size="s" />
    </button>
  );
}

/** The search of the list (`.mxs`): filters the conversations by name or last message. */
export function MessagesSearch({ placeholder }: { placeholder: string }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const needle = q.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>("[data-mx-row]").forEach((row) => {
      row.hidden = needle !== "" && !(row.dataset.mxRow ?? "").includes(needle);
    });
  }, [q]);
  return (
    <label className="mxs">
      <HireIcon name="search" size="s" />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

/** Scrolls the bubbles to the newest message when the conversation opens. */
export function MessagesScroll() {
  useEffect(() => {
    const box = document.getElementById("hv3-bubbles");
    if (box) box.scrollTop = box.scrollHeight;
  }, []);
  return null;
}

/**
 * The composer (`.mxsug` + `.mxcomp`): the organization's templates fill the field, the member
 * reads and changes them before sending (nothing leaves by itself).
 */
export function MessagesComposer({
  action,
  hidden,
  placeholder,
  sendLabel,
  templatesLabel,
  templates,
  orbiLabel,
  orbiQuestion,
  helpLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  placeholder: string;
  sendLabel: string;
  templatesLabel: string;
  templates: { id: string; title: string; body: string }[];
  orbiLabel: string;
  orbiQuestion: string;
  helpLabel: string;
}) {
  const field = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="mxsug">
        <span>
          <HireIcon name="orbi" size="s" />
          {templates.length ? templatesLabel : helpLabel}
        </span>
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => {
              if (field.current) {
                field.current.value = tpl.body;
                field.current.focus();
              }
            }}
          >
            {tpl.title}
          </button>
        ))}
        <button type="button" onClick={() => openHireOrbi(orbiQuestion)}>
          {orbiLabel}
        </button>
      </div>
      <form className="mxcomp" action={action}>
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <input
          ref={field}
          name="body"
          placeholder={placeholder}
          autoComplete="off"
          maxLength={4000}
          required
          aria-label={placeholder}
        />
        <button className="mxsend" type="submit" aria-label={sendLabel}>
          <HireIcon name="send" size="s" />
        </button>
      </form>
    </>
  );
}
