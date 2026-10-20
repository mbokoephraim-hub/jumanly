"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";

/**
 * While Orbi reads the files (planche ATS2), the page asks the server for news every few seconds;
 * the member can leave at any time, the analysis goes on and a notification arrives at the end.
 */
export function AtsFollow({ every = 2500 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), every);
    return () => window.clearInterval(timer);
  }, [router, every]);
  return null;
}

export type SelectableRow = {
  id: string;
  initials: string;
  tone: string;
  rank: number;
  name: string;
  line: string;
  score: number | null;
  scoreLabel: string;
};

/**
 * « Sélectionner » (planche v4.1 `ATS_SEL`): the files are ticked, the bar at the bottom says how
 * many and offers to write to them, plan an interview (one person) or keep them in the list of the
 * retained. Ticking is the member's gesture; Orbi's recommendation only ticks them in advance.
 */
export function AtsSelection({
  rows,
  preselected,
  action,
  jobId,
  writeHref,
  interviewHref,
  labels,
  extra,
}: {
  rows: SelectableRow[];
  preselected: string[];
  action: (formData: FormData) => void | Promise<void>;
  jobId: string;
  writeHref: string;
  interviewHref: string;
  labels: {
    /** « # sélectionnés », by plural form. */
    selected: { zero: string; one: string; other: string };
    of: string;
    clear: string;
    all: string;
    write: string;
    interview: string;
    keep: string;
    close: string;
    closeHref: string;
    source: string;
    outOf: string;
  };
  extra?: ReactNode;
}) {
  const [chosen, setChosen] = useState<string[]>(preselected);
  const toggle = (id: string) =>
    setChosen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const count = (n: number) =>
    (n === 0
      ? labels.selected.zero
      : n === 1
        ? labels.selected.one
        : labels.selected.other
    ).replace("#", String(n));
  const picked = rows.filter((row) => chosen.includes(row.id));
  const query = chosen.length ? `&ids=${chosen.join(",")}` : "";
  return (
    <form action={action} className="t-flux t-r6-sel">
      <input type="hidden" name="job" value={jobId} />
      <div className="t-r6-selh">
        <span className="t-ck" aria-hidden>
          <TalentIcon name="valider" size="xs" />
        </span>
        <div className="t-t" aria-live="polite">
          <b>{count(chosen.length)}</b>
          {labels.source}
        </div>
        <button
          type="button"
          className="t-press"
          onClick={() => setChosen(chosen.length ? [] : rows.map((row) => row.id))}
        >
          {chosen.length ? labels.clear : labels.all}
        </button>
      </div>
      <ul className="t-r6-sl">
        {rows.map((row) => {
          const on = chosen.includes(row.id);
          return (
            <li key={row.id}>
              <label
                className={cx(
                  "t-r6-c t-mini t-press",
                  on && "t-sel",
                  row.rank <= 3 && `t-r${row.rank}`,
                )}
              >
                <input
                  type="checkbox"
                  name="ids"
                  value={row.id}
                  checked={on}
                  onChange={() => toggle(row.id)}
                  className="sr-only"
                />
                <span className="t-h">
                  <span className="t-ck" aria-hidden>
                    {on && <TalentIcon name="valider" size="xs" />}
                  </span>
                  <span className="t-avw">
                    <span className={cx("t-rc-av", row.tone)} aria-hidden>
                      {row.initials}
                    </span>
                    <span className="t-r6-md" aria-hidden>
                      {row.rank}
                    </span>
                  </span>
                  <span className="t-t">
                    <b>{row.name}</b>
                    <span>{row.line}</span>
                  </span>
                  {row.score !== null && (
                    <span className="t-r6-sc" role="img" aria-label={row.scoreLabel}>
                      <span className="t-rg" style={{ "--p": row.score } as CSSProperties}>
                        <b aria-hidden>{row.score}</b>
                      </span>
                      <small aria-hidden>{labels.outOf}</small>
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {extra}
      <div className="t-r6-sb">
        <div className="t-h">
          <span className="t-avs" aria-hidden>
            {picked.slice(0, 5).map((row) => (
              <span key={row.id} className={cx("t-rc-av", row.tone)}>
                {row.initials}
              </span>
            ))}
          </span>
          <div className="t-t">
            <b>{count(chosen.length)}</b>
            {labels.of}
          </div>
          <a href={labels.closeHref} className="t-x t-press" aria-label={labels.close}>
            <TalentIcon name="fermer" size="xs" />
          </a>
        </div>
        <div className="t-acts">
          <a
            href={`${writeHref}${query}`}
            className={cx("t-press", chosen.length === 0 && "t-off")}
            aria-disabled={chosen.length === 0 || undefined}
          >
            <TalentIcon name="message" size="s" />
            {labels.write}
          </a>
          <a
            href={chosen.length === 1 ? interviewHref.replace("{id}", chosen[0]!) : undefined}
            className={cx("t-press", chosen.length !== 1 && "t-off")}
            aria-disabled={chosen.length !== 1 || undefined}
          >
            <TalentIcon name="agenda" size="s" />
            {labels.interview}
          </a>
          <button type="submit" className="t-p t-press" disabled={chosen.length === 0}>
            <TalentIcon name="valider" size="s" />
            {labels.keep}
          </button>
        </div>
      </div>
    </form>
  );
}
