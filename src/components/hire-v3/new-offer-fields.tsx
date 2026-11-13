"use client";

import { useState, useTransition } from "react";
import { jobWriterAction } from "@/server/actions/hire";
import { HireIcon, type HireIconName } from "./icon";

/** `nwSeg` of the prototype: one choice among a few, kept in a hidden field. */
export function NwSeg({
  name,
  options,
  value,
}: {
  name: string;
  options: [string, string][];
  value: string;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <div className="nwseg" role="radiogroup">
      <input type="hidden" name={name} value={current} />
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={key === current}
          className={key === current ? "on" : undefined}
          onClick={() => setCurrent(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** `nwChips` of the prototype: one choice (or several with `multiple`), kept in hidden fields. */
export function NwChips({
  name,
  options,
  value,
  multiple = false,
}: {
  name: string;
  options: [string, string][];
  value: string[];
  multiple?: boolean;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <div className="nwchips" role={multiple ? "group" : "radiogroup"}>
      {current.map((key) => (
        <input key={key} type="hidden" name={name} value={key} />
      ))}
      {options.map(([key, label]) => {
        const on = current.includes(key);
        return (
          <button
            key={key}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            className={on ? "nwchip on" : "nwchip"}
            onClick={() =>
              setCurrent(
                multiple ? (on ? current.filter((k) => k !== key) : [...current, key]) : [key],
              )
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** « Nombre de postes » (`.nwnum`): − 1 +. */
export function NwNum({
  name,
  value,
  min = 1,
  max,
  less,
  more,
  minus,
  plus,
}: {
  minus: string;
  plus: string;
  name: string;
  value: number;
  min?: number;
  max: number;
  less: string;
  more: string;
}) {
  const [n, setN] = useState(value);
  return (
    <div className="nwnum">
      <input type="hidden" name={name} value={n} />
      <button type="button" aria-label={less} onClick={() => setN(Math.max(min, n - 1))}>
        {minus}
      </button>
      <b aria-live="polite">{n}</b>
      <button type="button" aria-label={more} onClick={() => setN(Math.min(max, n + 1))}>
        {plus}
      </button>
    </div>
  );
}

/** A switch (`nwSw`) on a checkbox value. */
export function NwSwitch({
  name,
  value,
  on,
  label,
}: {
  name: string;
  value: string;
  on: boolean;
  label: string;
}) {
  const [checked, setChecked] = useState(on);
  return (
    <>
      {checked ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={checked ? "nwsw on" : "nwsw"}
        style={{ pointerEvents: "auto" }}
        onClick={() => setChecked(!checked)}
      >
        <i />
      </button>
    </>
  );
}

/** The two lists of skills (`.nwsk`), each tag removable, one field to add. */
export function NwSkills({
  required,
  preferred,
  labels,
}: {
  required: string[];
  preferred: string[];
  labels: { required: string; preferred: string; remove: string; add: string; placeholder: string };
}) {
  const [lists, setLists] = useState({ required, preferred });
  const [draft, setDraft] = useState({ required: "", preferred: "" });
  const add = (kind: "required" | "preferred") => {
    const names = draft[kind]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!names.length) return;
    setLists({ ...lists, [kind]: [...new Set([...lists[kind], ...names])] });
    setDraft({ ...draft, [kind]: "" });
  };
  return (
    <div className="nwsk">
      <input type="hidden" name="requiredSkills" value={lists.required.join(", ")} />
      <input type="hidden" name="preferredSkills" value={lists.preferred.join(", ")} />
      {(["required", "preferred"] as const).map((kind) => (
        <div key={kind}>
          <span className="nwlab">
            <i style={{ background: kind === "required" ? "#0F3F37" : "#A6F26B" }} />
            {labels[kind]}
          </span>
          <div className="nwtags">
            {lists[kind].map((skill) => (
              <span key={skill} className={kind === "required" ? "nwtag must" : "nwtag"}>
                {skill}
                <button
                  type="button"
                  aria-label={`${labels.remove} ${skill}`}
                  onClick={() =>
                    setLists({ ...lists, [kind]: lists[kind].filter((s) => s !== skill) })
                  }
                >
                  <HireIcon name="x" size="s" />
                </button>
              </span>
            ))}
            <span
              className="nwin"
              style={{ height: 32, borderRadius: 99, padding: "0 6px 0 12px" }}
            >
              <input
                value={draft[kind]}
                placeholder={labels.placeholder}
                aria-label={`${labels.add} · ${labels[kind]}`}
                onChange={(event) => setDraft({ ...draft, [kind]: event.target.value })}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add(kind);
                  }
                }}
                style={{ width: 140 }}
              />
              <button
                type="button"
                className="nwic"
                aria-label={labels.add}
                onClick={() => add(kind)}
              >
                <HireIcon name="plus" size="s" />
              </button>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

type Question = { id: string; text: string; kind: "yesno" | "text" };

/** « Questions de présélection » (`.nwq`): the questions, one field to add, at most `max`. */
export function NwQuestions({
  questions,
  max,
  labels,
}: {
  questions: Question[];
  max: number;
  labels: { add: string; placeholder: string; remove: string; yesno: string; text: string };
}) {
  const [list, setList] = useState(questions);
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim();
    if (value.length < 3 || list.length >= max) return;
    setList([...list, { id: `q${Date.now().toString(36)}`, text: value, kind: "yesno" }]);
    setText("");
  };
  return (
    <>
      <input type="hidden" name="questions" value={JSON.stringify(list)} />
      {list.map((q) => (
        <div key={q.id} className="nwq">
          <span>{q.text}</span>
          <span className="tsst dr">{q.kind === "yesno" ? labels.yesno : labels.text}</span>
          <button
            type="button"
            className="nwic"
            aria-label={`${labels.remove} ${q.text}`}
            onClick={() => setList(list.filter((x) => x.id !== q.id))}
          >
            <HireIcon name="x" size="s" />
          </button>
        </div>
      ))}
      {list.length < max ? (
        <div className="nwin" style={{ marginTop: 8 }}>
          <input
            value={text}
            placeholder={labels.placeholder}
            aria-label={labels.add}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn sm ghost" onClick={add}>
            <HireIcon name="plus" size="s" />
            {labels.add}
          </button>
        </div>
      ) : null}
    </>
  );
}

/** The cards to choose from (`.nwopt`), one radio value. */
export function NwOpts({
  name,
  options,
  value,
  two = false,
}: {
  name: string;
  options: { key: string; icon: HireIconName; title: string; sub: string }[];
  value: string;
  two?: boolean;
}) {
  const [current, setCurrent] = useState(value);
  return (
    <div className={two ? "nwopts two" : "nwopts"} role="radiogroup">
      <input type="hidden" name={name} value={current} />
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={o.key === current}
          className={o.key === current ? "nwopt on" : "nwopt"}
          onClick={() => setCurrent(o.key)}
        >
          <span className="nwopt-i">
            <HireIcon name={o.icon} size="s" />
          </span>
          <b>{o.title}</b>
          <span className="meta">{o.sub}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * « Réécrire » of « L'annonce »: Orbi proposes a first version from the essentials of the offer
 * (`jobWriterAction`, credits of the organization, consent of the member). The recruiter reads and
 * changes everything; nothing is saved before « Continuer ».
 */
export function NwOrbiDraft({
  facts,
  labels,
}: {
  facts: { title: string; contract: string; workMode: string; city: string; country: string };
  labels: { write: string; working: string; failed: string };
}) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const field = (name: string) =>
    document.querySelector<HTMLTextAreaElement>(`.nwg textarea[name="${name}"]`);
  return (
    <>
      <button
        type="button"
        className="btn sm ghost"
        style={{ marginLeft: "auto" }}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setFailed(false);
            const answer = await jobWriterAction({
              mode: "draft",
              ...facts,
              description: field("description")?.value ?? "",
              responsibilities: (field("responsibilities")?.value ?? "")
                .split("\n")
                .filter(Boolean),
              requirements: (field("requirements")?.value ?? "").split("\n").filter(Boolean),
            }).catch(() => null);
            if (!answer || !answer.ok || answer.mode !== "draft") {
              setFailed(true);
              return;
            }
            const set = (name: string, value: string) => {
              const el = field(name);
              if (el && value) el.value = value;
            };
            set("description", answer.draft.description);
            set("responsibilities", answer.draft.responsibilities.join("\n"));
            set("requirements", answer.draft.requirements.join("\n"));
          })
        }
      >
        <HireIcon name="orbi" size="s" />
        {pending ? labels.working : labels.write}
      </button>
      {failed ? (
        <span className="meta" role="status">
          {labels.failed}
        </span>
      ) : null}
    </>
  );
}
