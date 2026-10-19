"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { askCoachAction } from "@/server/actions/learn-coach";
import type { CoachAnswer, CoachIntent } from "@/server/services/learn-coach";
import { TalentIcon } from "../icon";
import { OrbiMark } from "../orbi-mark";

export type LessonOrbiLabels = {
  intro: string;
  you: string;
  orbi: string;
  thinking: string;
  source: string;
  sourceCourse: string;
  another: string;
  test: string;
  label: string;
  placeholder: string;
  send: string;
  failed: string;
  explainAsk: string;
  anotherAsk: string;
  testAsk: string;
  limit: Record<NonNullable<CoachAnswer["limit"]>, string>;
  plans: string;
  consent: string;
};

type Turn =
  | { id: number; from: "you"; text: string }
  | { id: number; from: "orbi"; answer: CoachAnswer }
  | { id: number; from: "error"; text: string };

/**
 * Orbi in a lesson (planche talent-3 § 6): it explains the notion of the open lesson with an
 * example, from the lessons of the course, and says where the answer comes from. « Un autre
 * exemple » and « Me tester » ask again; it never gives the answers of a quiz. The exchange is not
 * kept: a new one starts with each lesson.
 */
export function LessonOrbi({
  slug,
  lessonId,
  labels,
}: {
  slug: string;
  lessonId: string;
  labels: LessonOrbiLabels;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const counter = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length > 0) end.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  const ask = (intent: CoachIntent, shown: string, question = "") => {
    if (pending) return;
    const id = (counter.current += 2);
    setTurns((list) => [...list, { id, from: "you", text: shown }]);
    start(async () => {
      const result = await askCoachAction({ slug, lessonId, intent, question }).catch(() => null);
      setTurns((list) => [
        ...list,
        result?.ok
          ? { id: id + 1, from: "orbi", answer: result.answer }
          : { id: id + 1, from: "error", text: labels.failed },
      ]);
    });
  };

  return (
    <div className="t-flux t-serre" aria-live="polite" aria-busy={pending}>
      {turns.length === 0 && (
        <div className="t-bulle-o">
          <OrbiMark size={32} />
          <div className="t-verre t-corps">
            <p>{labels.intro}</p>
            <div className="t-acts">
              <button
                type="button"
                className="t-bt t-sec t-s t-press"
                onClick={() => ask("explain", labels.explainAsk)}
              >
                {labels.explainAsk}
              </button>
            </div>
          </div>
        </div>
      )}
      {turns.map((turn) =>
        turn.from === "you" ? (
          <div key={turn.id} className="t-bulle-u">
            <span className="sr-only">{labels.you}</span>
            {turn.text}
          </div>
        ) : turn.from === "error" ? (
          <p key={turn.id} role="alert" className="t-aide t-err">
            {turn.text}
          </p>
        ) : (
          <div key={turn.id} className="t-bulle-o">
            <OrbiMark size={32} />
            <div className="t-verre t-corps">
              <span className="sr-only">{labels.orbi}</span>
              {turn.answer.answer.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {turn.answer.sources.length > 0 && (
                <span className="t-source">
                  {(turn.answer.source === "ai" ? labels.source : labels.sourceCourse).replace(
                    "{lessons}",
                    turn.answer.sources.join(", "),
                  )}
                </span>
              )}
              {turn.answer.limit && (
                <span className="t-source">
                  {labels.limit[turn.answer.limit]}{" "}
                  {turn.answer.limit === "consent" ? (
                    <Link href="/app/parametres?onglet=confidentialite" className="underline">
                      {labels.consent}
                    </Link>
                  ) : turn.answer.limit !== "unavailable" ? (
                    <Link href="/app/abonnement" className="underline">
                      {labels.plans}
                    </Link>
                  ) : null}
                </span>
              )}
              <div className="t-acts">
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => ask("example", labels.anotherAsk)}
                >
                  {labels.another}
                </button>
                <button
                  type="button"
                  className="t-bt t-sec t-s t-press"
                  onClick={() => ask("exercise", labels.testAsk)}
                >
                  {labels.test}
                </button>
              </div>
            </div>
          </div>
        ),
      )}
      {pending && (
        <div className="t-bulle-o">
          <OrbiMark size={32} state="reflechit" />
          <div className="t-verre t-corps">
            <p className="t-pense">{labels.thinking}</p>
          </div>
        </div>
      )}
      <div ref={end} />
      <form
        className="t-verre t-compo"
        onSubmit={(event) => {
          event.preventDefault();
          const value = text.trim();
          if (value.length < 2) return;
          setText("");
          ask("question", value, value);
        }}
      >
        <input
          type="text"
          name="question"
          value={text}
          maxLength={600}
          autoComplete="off"
          enterKeyHint="send"
          aria-label={labels.label}
          placeholder={labels.placeholder}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="t-bi t-env" disabled={pending} aria-label={labels.send}>
          <TalentIcon name="envoyer" size="s" />
        </button>
      </form>
    </div>
  );
}
