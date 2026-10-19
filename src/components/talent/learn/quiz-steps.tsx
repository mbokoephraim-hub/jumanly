"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { cx } from "@/lib/cx";
import { checkQuizAnswerAction, submitQuizAction } from "@/server/actions/learn";
import { TalentIcon } from "../icon";

export type QuizStep = {
  id: string;
  type: "single" | "multiple" | "text";
  prompt: string;
  options: string[];
};

export type QuizStepsLabels = {
  step: string;
  stepAria: string;
  right: string;
  wrong: string;
  kept: string;
  validate: string;
  next: string;
  finish: string;
  offline: string;
  textLabel: string;
  multiple: string;
  expected: string;
};

type Check =
  | { state: "corrected"; correct: boolean; answer: string[]; explanation: string | null }
  | { state: "kept" };

const letters = "ABCDEFGHIJ";
const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

/**
 * A quiz, one question at a time (planche talent-3 § 7): the steps above, the question, the
 * options; an answer is corrected at once with its explanation (except in a quiz with limited
 * attempts, corrected in the result). The answers stay on this device until the result is sent,
 * so a cut connection loses nothing: the result goes when the connection is back.
 */
export function QuizSteps({
  slug,
  lessonId,
  questions,
  labels,
}: {
  slug: string;
  lessonId: string;
  questions: QuizStep[];
  labels: QuizStepsLabels;
}) {
  const key = `jm-quiz-${lessonId}`;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checks, setChecks] = useState<Record<string, Check>>({});
  const [draft, setDraft] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  // Answers given before a reload or a cut connection come back.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null") as {
        index: number;
        answers: Record<string, string[]>;
        checks: Record<string, Check>;
      } | null;
      if (!saved) return;
      /* eslint-disable react-hooks/set-state-in-effect -- restored from this device */
      setAnswers(saved.answers ?? {});
      setChecks(saved.checks ?? {});
      setIndex(Math.min(questions.length - 1, Math.max(0, saved.index ?? 0)));
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // Nothing kept, or storage closed: the quiz starts at the first question.
    }
  }, [key, questions.length]);

  const keep = (next: { index: number; answers: typeof answers; checks: typeof checks }) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private browsing: the answers last for this page only.
    }
  };

  const question = questions[index]!;
  const given = answers[question.id];
  const check = checks[question.id];
  const last = index === questions.length - 1;

  const answer = (value: string[]) => {
    if (given || pending || value.length === 0) return;
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    start(async () => {
      const result = await checkQuizAnswerAction({
        lessonId,
        questionId: question.id,
        given: value,
      }).catch(() => null);
      const nextCheck: Check =
        result?.ok && result.reveal
          ? {
              state: "corrected",
              correct: result.correct,
              answer: result.answer,
              explanation: result.explanation,
            }
          : { state: "kept" };
      const nextChecks = { ...checks, [question.id]: nextCheck };
      setChecks(nextChecks);
      keep({ index, answers: nextAnswers, checks: nextChecks });
    });
  };

  const goNext = () => {
    setDraft([]);
    setIndex(index + 1);
    keep({ index: index + 1, answers, checks });
    window.scrollTo({ top: 0 });
  };

  const optionState = (position: number) => {
    const value = String(position);
    if (!given || check?.state !== "corrected") return given?.includes(value) ? "t-sel" : "";
    if (check.answer.includes(value)) return "t-ok";
    return given.includes(value) ? "t-ko" : "";
  };

  return (
    <>
      <div
        className="t-pas"
        role="img"
        aria-label={labels.stepAria.replace("{current}", String(index + 1))}
      >
        {questions.map((item, position) => (
          <i key={item.id} className={position <= index ? "t-ok" : undefined} />
        ))}
      </div>
      <div className="t-verre t-q" aria-live="polite">
        <small>{labels.step.replace("{current}", String(index + 1))}</small>
        <b id={`qz-${question.id}`}>{question.prompt}</b>
        {question.type === "multiple" && !given && <small>{labels.multiple}</small>}
      </div>

      {question.type === "text" ? (
        <form
          className="t-flux t-serre"
          onSubmit={(event) => {
            event.preventDefault();
            const value = String(new FormData(event.currentTarget).get("reponse") ?? "").trim();
            if (value) answer([value]);
          }}
        >
          <div className="t-champ">
            <label htmlFor={`qz-r-${question.id}`}>{labels.textLabel}</label>
            <input
              key={question.id}
              id={`qz-r-${question.id}`}
              className="t-verre t-saisie"
              name="reponse"
              defaultValue={given?.[0] ?? ""}
              readOnly={Boolean(given)}
              autoComplete="off"
              maxLength={300}
            />
          </div>
          {!given && (
            <button type="submit" className="t-bt t-sec t-pl t-press" disabled={pending}>
              {labels.validate}
            </button>
          )}
        </form>
      ) : (
        <div className="t-quiz-o" role="group" aria-labelledby={`qz-${question.id}`}>
          {question.options.map((option, position) => {
            const value = String(position);
            const state = optionState(position);
            const chosen = (given ?? draft).includes(value);
            return (
              <button
                key={`${question.id}-${position}`}
                type="button"
                className={cx("t-o t-press", state)}
                aria-pressed={chosen}
                disabled={Boolean(given) || pending}
                onClick={() =>
                  question.type === "single"
                    ? answer([value])
                    : setDraft((list) =>
                        list.includes(value)
                          ? list.filter((item) => item !== value)
                          : [...list, value],
                      )
                }
              >
                <i aria-hidden>
                  {state === "t-ok" ? (
                    <TalentIcon name="valider" size="xs" />
                  ) : state === "t-ko" ? (
                    <TalentIcon name="fermer" size="xs" />
                  ) : (
                    letters[position]
                  )}
                </i>
                {option}
              </button>
            );
          })}
          {question.type === "multiple" && !given && (
            <button
              type="button"
              className="t-bt t-sec t-pl t-press"
              disabled={draft.length === 0 || pending}
              onClick={() => answer(draft)}
            >
              {labels.validate}
            </button>
          )}
        </div>
      )}

      {check?.state === "corrected" && (
        <div className={cx("t-expl", !check.correct && "t-ko")} role="status">
          <b>{check.correct ? labels.right : labels.wrong}</b>
          {question.type === "text" && !check.correct && check.answer[0] && (
            <span>{labels.expected.replace("{answer}", check.answer[0])}</span>
          )}
          {check.explanation && <span>{check.explanation}</span>}
        </div>
      )}
      {check?.state === "kept" && (
        <p className="t-gar" role="status">
          <TalentIcon name="horloge" size="s" />
          {labels.kept}
        </p>
      )}

      {given && !online && last && (
        <p className="t-gar t-err" role="status">
          <TalentIcon name="hors-ligne" size="s" />
          {labels.offline}
        </p>
      )}

      <div className="t-verre t-fort t-bas-f">
        {!last ? (
          <button
            type="button"
            className="t-bt t-p t-pl t-press"
            disabled={!given || pending}
            onClick={goNext}
          >
            {labels.next}
          </button>
        ) : (
          <form
            action={submitQuizAction}
            className="contents"
            onSubmit={() => {
              try {
                localStorage.removeItem(key);
              } catch {
                // Nothing kept.
              }
            }}
          >
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="lesson" value={lessonId} />
            {Object.entries(answers).flatMap(([id, values]) =>
              values.map((entry, position) => (
                <input key={`${id}-${position}`} type="hidden" name={`q_${id}`} value={entry} />
              )),
            )}
            <button
              type="submit"
              className="t-bt t-p t-pl t-press"
              disabled={!given || pending || !online}
            >
              {labels.finish}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
