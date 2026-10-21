"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/talent/sheet";
import { TalentIcon } from "@/components/talent/icon";
import { cx } from "@/lib/cx";

export type SortRow = { score: number | null; complete: boolean; letter: boolean; unseen: boolean };

/**
 * « Trier et filtrer » (planche `TRI`): the sort, the floor of the score and the file filters, in a
 * sheet; the button says how many applications the choice shows before it is applied. A filter
 * only hides: the list tells how many are hidden and shows them again in one tap.
 */
export function SortSheet({
  id,
  offre,
  etape,
  rows,
  sort,
  floor,
  filters,
  withScores,
  clearHref,
  className,
}: {
  id: string;
  offre: string;
  etape: string | null;
  rows: SortRow[];
  sort: string;
  floor: number;
  filters: string[];
  withScores: boolean;
  clearHref: string;
  /** On a computer: the window opens under « Trier et filtrer » (web recruteur lot 2). */
  className?: string;
}) {
  const t = useTranslations("hireCandidates.sort");
  const [chosenFloor, setFloor] = useState(floor);
  const [chosen, setChosen] = useState<string[]>(filters);
  const count = useMemo(
    () =>
      rows.filter(
        (row) =>
          (chosenFloor === 0 || (row.score ?? -1) >= chosenFloor) &&
          (!chosen.includes("complet") || row.complete) &&
          (!chosen.includes("lettre") || row.letter) &&
          (!chosen.includes("nonlues") || row.unseen),
      ).length,
    [rows, chosenFloor, chosen],
  );
  const sorts = withScores ? ["correspondance", "date", "etape"] : ["date", "etape"];
  return (
    <Sheet id={id} title={t("title")} closeLabel={t("close")} className={className}>
      <form action="/app/hire/candidats" className="t-rc-tri">
        <input type="hidden" name="offre" value={offre} />
        {etape && <input type="hidden" name="etape" value={etape} />}
        {/* Several file filters travel as one value (dossier=complet,lettre). */}
        <input type="hidden" name="dossier" value={chosen.join(",")} />
        <fieldset>
          <legend>{t("by")}</legend>
          <div className="t-puces">
            {sorts.map((value) => (
              <label key={value} className="t-puce t-rc-ch">
                <input type="radio" name="tri" value={value} defaultChecked={sort === value} />
                {t(`option.${value as "date"}`)}
              </label>
            ))}
          </div>
        </fieldset>
        {withScores && (
          <fieldset>
            <legend>{t("score")}</legend>
            <div className="t-puces">
              {[85, 70, 0].map((value) => (
                <label key={value} className="t-puce t-rc-ch">
                  <input
                    type="radio"
                    name="min"
                    value={value}
                    checked={chosenFloor === value}
                    onChange={() => setFloor(value)}
                  />
                  {t(`floor.${value as 85}`)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend>{t("file")}</legend>
          <div className="t-puces">
            {["complet", "lettre", "nonlues"].map((value) => (
              <label key={value} className="t-puce t-rc-ch">
                <input
                  type="checkbox"
                  checked={chosen.includes(value)}
                  onChange={(event) =>
                    setChosen((list) =>
                      event.target.checked
                        ? [...list, value]
                        : list.filter((item) => item !== value),
                    )
                  }
                />
                {t(`filter.${value as "complet"}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="t-rx-feuille-bts">
          <Link href={clearHref} className="t-bt t-sec t-m t-press">
            {t("clear")}
          </Link>
          <button type="submit" className="t-bt t-p t-press" aria-live="polite">
            {t("see", { count })}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

const pad = (value: number) => String(value).padStart(2, "0");

/** « Annulable encore 9 min 52 s » (planche `DEC_OK`), until the 10 minutes are over. */
export function UndoCountdown({ deadline }: { deadline: string }) {
  const t = useTranslations("hireCandidates.done");
  const end = new Date(deadline).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = Math.max(0, end - (now ?? end - 1));
  const over = now !== null && left <= 0;
  const minutes = Math.floor(left / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);
  return (
    <span>
      {over
        ? t("over")
        : now === null
          ? t("left", { time: "" }).trim()
          : t("left", { time: t("time", { minutes, seconds: pad(seconds) }) })}
    </span>
  );
}

/**
 * The message of a decision (planche r2plus `.msg-o`): the text prepared from the template with
 * the values Jumanly filled in highlighted, then « Modifier le message » to change it before
 * sending. The text sent is always the one shown.
 */
export function DecisionMessage({
  body,
  segments,
  firstName,
  title,
  edited,
  fieldId = "decision-message",
  editLabel,
  editText,
}: {
  body: string;
  segments: { text: string; filled: boolean }[][];
  firstName: string;
  title: string;
  edited: string;
  /** Another screen's message (an interview, a proposal): its own field and words. */
  fieldId?: string;
  editLabel?: string;
  editText?: string;
}) {
  const t = useTranslations("hireCandidates.decision");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(body);
  const changed = text !== body;
  return (
    <div className="t-rc-msg">
      <span className="t-k">
        <TalentIcon name="orbi" size="s" />
        {changed ? edited : title}
      </span>
      {editing ? (
        <>
          <label htmlFor={fieldId} className="sr-only">
            {editLabel ?? t("editLabel", { firstName })}
          </label>
          <textarea
            id={fieldId}
            name="message"
            rows={9}
            maxLength={4000}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="t-rc-msg-ta"
          />
        </>
      ) : (
        <>
          <input type="hidden" name="message" value={text} />
          {changed
            ? text
                .split(/\n\s*\n/)
                .filter((part) => part.trim())
                .map((part, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {part.trim()}
                  </p>
                ))
            : segments.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph.map((segment, at) =>
                    segment.filled ? <mark key={at}>{segment.text}</mark> : segment.text,
                  )}
                </p>
              ))}
        </>
      )}
      {!editing && (
        <button
          type="button"
          className={cx("t-pq t-press t-rc-edit")}
          onClick={() => setEditing(true)}
        >
          <TalentIcon name="modifier" size="xs" />
          {editText ?? t("edit")}
        </button>
      )}
    </div>
  );
}
