"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { askCoachAction } from "@/server/actions/learn-coach";
import type { CoachAnswer, CoachIntent } from "@/server/services/learn-coach";

export type CoachCourse = { slug: string; title: string; lessons: { id: string; title: string }[] };

type Turn =
  | { id: number; from: "you"; intent: CoachIntent; text: string }
  | { id: number; from: "coach"; answer: CoachAnswer }
  | { id: number; from: "error"; text: string };

const intents: CoachIntent[] = [
  "explain",
  "rephrase",
  "example",
  "question",
  "exercise",
  "mistake",
  "revision",
];
/** Intents that need words from the learner; the others work from the lesson alone. */
const needsQuestion = new Set<CoachIntent>(["question"]);

/**
 * The AI Learning Coach conversation (ux-test, étape 2): on its own page with a choice of course and
 * lesson, or in the lesson player for the open lesson (`fixed`). Answers are not kept: a new
 * conversation starts with each visit. Texts come from `learn.coach` (NextIntlClientProvider).
 */
export function CoachChat({
  courses,
  firstName,
  initial,
  fixed = false,
}: {
  courses: CoachCourse[];
  firstName: string;
  initial?: { slug?: string; lessonId?: string; intent?: CoachIntent };
  /** In the player: course and lesson are those of the page, no selectors. */
  fixed?: boolean;
}) {
  const t = useTranslations("learn.coach");
  const [slug, setSlug] = useState(initial?.slug ?? courses[0]?.slug ?? "");
  const [lessonId, setLessonId] = useState(initial?.lessonId ?? "");
  const [intent, setIntent] = useState<CoachIntent>(initial?.intent ?? "explain");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, start] = useTransition();
  const [counter, setCounter] = useState(0);
  const thread = useRef<HTMLElement>(null);
  const course = courses.find((item) => item.slug === slug);

  // The conversation scrolls inside its own box: the page itself never jumps.
  useEffect(() => {
    const box = thread.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [turns, pending]);

  const ask = (chosen: CoachIntent) => {
    if (pending || !slug) return;
    const text = question.trim();
    if (needsQuestion.has(chosen) && text.length < 3) {
      setTurns((list) => [...list, { id: counter, from: "error", text: t("error.invalid") }]);
      setCounter((value) => value + 1);
      return;
    }
    const id = counter;
    setCounter((value) => value + 2);
    setIntent(chosen);
    setTurns((list) => [
      ...list,
      { id, from: "you", intent: chosen, text: text || t(`intent.${chosen}`) },
    ]);
    setQuestion("");
    start(async () => {
      const result = await askCoachAction({
        slug,
        lessonId: lessonId || undefined,
        intent: chosen,
        question: text,
      }).catch(() => ({ ok: false as const, error: "failed" as const }));
      setTurns((list) => [
        ...list,
        result.ok
          ? { id: id + 1, from: "coach", answer: result.answer }
          : { id: id + 1, from: "error", text: t(`error.${result.error}`) },
      ]);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!fixed && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
            {t("form.course")}
            <select
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setLessonId("");
              }}
              className="h-11 w-full min-w-0 rounded-[12px] bg-blanc px-3 text-[14px] font-normal ring-[1.5px] ring-sapin/20 ring-inset focus:ring-2 focus:ring-sapin focus:outline-none"
            >
              {courses.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold">
            {t("form.lesson")}
            <select
              value={lessonId}
              onChange={(event) => setLessonId(event.target.value)}
              className="h-11 w-full min-w-0 rounded-[12px] bg-blanc px-3 text-[14px] font-normal ring-[1.5px] ring-sapin/20 ring-inset focus:ring-2 focus:ring-sapin focus:outline-none"
            >
              <option value="">{t("form.lessonAll")}</option>
              {course?.lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <section
        ref={thread}
        aria-label={t("chat.aria")}
        aria-live="polite"
        aria-busy={pending}
        className="flex max-h-[min(60dvh,560px)] min-h-[160px] flex-col gap-3 overflow-y-auto rounded-[18px] bg-creme p-3 sm:p-4"
      >
        <CoachBubble>
          <p>{t("welcome", { firstName })}</p>
        </CoachBubble>
        {turns.map((turn) =>
          turn.from === "you" ? (
            <div
              key={turn.id}
              className="ml-auto max-w-[85%] rounded-[18px] rounded-br-[6px] bg-sapin px-4 py-2.5 text-[14px] text-blanc"
            >
              <span className="sr-only">{t("chat.you")}</span>
              {turn.text}
            </div>
          ) : turn.from === "error" ? (
            <p
              key={turn.id}
              role="alert"
              className="max-w-[85%] rounded-[14px] bg-ambre-fond px-4 py-2.5 text-[14px]"
            >
              {turn.text}
            </p>
          ) : (
            <CoachBubble key={turn.id}>
              {turn.answer.answer.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              <details className="mt-1 text-[12.5px] text-ardoise">
                <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-feuille-fonce">
                  <Icon name="eye" className="size-3.5" />
                  {t("why")}
                </summary>
                <p className="mt-1">
                  {t(turn.answer.source === "ai" ? "source.ai" : "source.course")}
                </p>
                <p className="mt-1">
                  {turn.answer.sources.length > 0
                    ? t("sources", { list: turn.answer.sources.join(", ") })
                    : t("noSources")}
                </p>
                {turn.answer.limit && <p className="mt-1">{t(`limit.${turn.answer.limit}`)}</p>}
              </details>
            </CoachBubble>
          ),
        )}
        {pending && (
          <CoachBubble>
            <p className="flex items-center gap-2 text-ardoise">
              <span
                aria-hidden
                className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
              />
              {t("form.sending")}
            </p>
          </CoachBubble>
        )}
      </section>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold">{t("form.intents")}</legend>
        <ul className="flex flex-wrap gap-2">
          {intents
            .filter((item) => item !== "question")
            .map((item) => (
              <li key={item}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => ask(item)}
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-pill px-4 text-[13px] font-semibold ring-[1.5px] transition-colors ring-inset disabled:opacity-50",
                    intent === item && turns.length > 0
                      ? "bg-lime text-sapin ring-lime"
                      : "bg-blanc text-sapin ring-sapin/15 hover:ring-sapin/40",
                  )}
                >
                  {t(`intent.${item}`)}
                </button>
              </li>
            ))}
        </ul>
      </fieldset>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask("question");
        }}
        className="flex flex-col gap-2"
      >
        <label
          htmlFor={fixed ? "coach-question-lesson" : "coach-question"}
          className="text-[13px] font-semibold"
        >
          {t("form.question")}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id={fixed ? "coach-question-lesson" : "coach-question"}
            value={question}
            maxLength={600}
            rows={2}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                ask("question");
              }
            }}
            placeholder={t("form.placeholder")}
            className="min-h-12 w-full min-w-0 flex-1 resize-y rounded-[14px] bg-blanc px-4 py-3 text-[14px] ring-[1.5px] ring-sapin/20 ring-inset placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className="jm-press inline-flex h-12 shrink-0 items-center gap-2 rounded-pill bg-lime px-5 text-[14px] font-semibold text-sapin transition-[transform,background-color] hover:bg-[#8fd957] disabled:opacity-60"
          >
            <Icon name="send" className="size-4" />
            <span className="max-sm:sr-only">{t("form.submit")}</span>
          </button>
        </div>
        <p className="text-[12px] text-ardoise">{t("form.credit")}</p>
      </form>
    </div>
  );
}

function CoachBubble({ children }: { children: React.ReactNode }) {
  const t = useTranslations("learn.coach");
  return (
    <div className="flex max-w-[92%] items-start gap-2.5">
      <AiOrb size={26} className="mt-1" />
      <div className="flex flex-col gap-2 rounded-[18px] rounded-tl-[6px] bg-blanc px-4 py-3 text-[14px] leading-6 shadow-[0_1px_2px_rgb(11_26_31/0.05)]">
        <span className="sr-only">{t("chat.coach")}</span>
        {children}
      </div>
    </div>
  );
}
