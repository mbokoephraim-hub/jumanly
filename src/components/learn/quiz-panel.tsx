import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { Pattern } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import { submitQuizAction } from "@/server/actions/learn";
import { db } from "@/server/db";
import { attemptsLeft, scoreQuiz, type QuizAnswers } from "@/server/services/learn";

const answersOf = (value: unknown): QuizAnswers =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.fromEntries(
        Object.entries(value).map(([key, list]) => [
          key,
          Array.isArray(list) ? list.map(String) : [],
        ]),
      )
    : {};

const pill =
  "inline-flex h-12 items-center justify-center gap-2 rounded-pill px-6 text-[15px] font-semibold";

/** The score of an attempt, drawn as a ring (the figure is also written next to it). */
function ScoreRing({
  percent,
  passed,
  label,
}: {
  percent: number;
  passed: boolean;
  label: string;
}) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative flex size-[120px] shrink-0 items-center justify-center lg:size-[140px]">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className={passed ? "stroke-lime-clair" : "stroke-down-fond"}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={passed ? "stroke-feuille" : "stroke-corail"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span aria-hidden className="absolute text-[28px] font-bold lg:text-[32px]">
        {label}
      </span>
    </div>
  );
}

/**
 * A quiz lesson (mockup 03-06): the form, or the result of an attempt with each question
 * reviewed, a question-by-question summary and the next module.
 */
export async function QuizPanel({
  userId,
  slug,
  lesson,
  attemptId,
  passed,
  nextHref,
  nextModule,
  aside,
}: {
  userId: string;
  slug: string;
  lesson: { id: string; title: string; module: { order: number; title: string } };
  attemptId?: string;
  passed: boolean;
  nextHref?: string;
  /** The module after this quiz, shown once the result is in. */
  nextModule?: { title: string; meta: string };
  /** The course contents, beside the form. */
  aside: ReactNode;
}) {
  const t = await getTranslations("learn.quiz");
  const ui = await getTranslations("ui");
  const quiz = await db.quiz.findUnique({
    where: { lessonId: lesson.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz || quiz.questions.length === 0) {
    const player = await getTranslations("learn.player");
    return <p className="rounded-[24px] bg-blanc p-6 text-ardoise">{player("overview.empty")}</p>;
  }
  const left = await attemptsLeft(db, userId, quiz);
  const attempt = attemptId
    ? await db.quizAttempt.findFirst({ where: { id: attemptId, userId, quizId: quiz.id } })
    : null;
  const retryHref = `/app/learn/${slug}?lecon=${lesson.id}`;
  const info = (
    <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-6">
      <h2 className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {t("title", { moduleTitle: lesson.module.title })}
      </h2>
      <p className="text-sm leading-5">
        {t("intro", { count: quiz.questions.length, passScore: quiz.passingScore })}
      </p>
      <span className="self-start rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold">
        {t("attempts", { count: left ?? 0 })}
      </span>
    </section>
  );

  if (attempt) {
    const given = answersOf(attempt.answers);
    const score = scoreQuiz(quiz.questions, given);
    const results = new Map(score.results.map((result) => [result.questionId, result.correct]));
    return (
      <>
        <section
          aria-labelledby="quiz-result"
          className="relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-blanc p-6 sm:flex-row sm:items-center lg:p-8"
        >
          <Pattern
            name="motif-pastilles-clair"
            size={200}
            opacity={0.7}
            className="[mask-image:linear-gradient(90deg,transparent_55%,#000)]"
          />
          <div className="relative">
            <ScoreRing
              percent={score.percent}
              passed={attempt.passed}
              label={ui("percent", { value: score.percent })}
            />
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col items-start gap-2">
            {attempt.passed && (
              <span className="flex items-center gap-1 rounded-pill bg-lime-clair px-2.5 py-1 text-[11px] font-semibold">
                <Icon name="check" className="size-3" />
                {t("result.moduleBadge", { number: lesson.module.order })}
              </span>
            )}
            <h2
              id="quiz-result"
              className="text-[26px] leading-[1.15] font-bold tracking-tight lg:text-[32px]"
            >
              {attempt.passed ? t("result.title.pass") : t("result.title.fail")}
            </h2>
            <p className="text-base font-semibold lg:text-lg">
              {t("result.score", {
                correct: score.correct,
                total: score.total,
                percent: score.percent,
              })}
            </p>
            <p className="text-[13px] text-ardoise">
              {[
                t("result.passScore", { passScore: quiz.passingScore }),
                attempt.passed ? t("result.body.pass") : t("result.body.fail"),
              ].join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {attempt.passed && nextHref && (
                <Link href={nextHref} className={cx(pill, "bg-lime text-sapin")}>
                  {t("result.continue")}
                  <Icon name="chev-r" className="size-4" />
                </Link>
              )}
              <a href="#revue" className={cx(pill, "border border-brume bg-blanc")}>
                {t("result.review")}
              </a>
              {left !== 0 && (
                <Link
                  href={retryHref}
                  className={cx(
                    pill,
                    attempt.passed ? "border border-brume bg-blanc" : "bg-sapin text-blanc",
                  )}
                >
                  {t("result.retry")}
                </Link>
              )}
            </div>
            {left === 0 && !attempt.passed && (
              <p
                role="status"
                className="mt-2 rounded-xl bg-ambre-fond p-3 text-sm text-ambre-texte"
              >
                {t("noAttempts")}
              </p>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG illustration */}
          <img
            src={
              attempt.passed
                ? "/illustrations/jumanly-amani-joie.svg"
                : "/illustrations/jumanly-amani-perplexe.svg"
            }
            alt=""
            className="relative -mb-8 h-[220px] w-auto self-end max-lg:hidden"
          />
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section
            id="revue"
            aria-labelledby="quiz-review"
            className="flex scroll-mt-24 flex-col rounded-[24px] bg-blanc p-6"
          >
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="quiz-review" className="text-[20px] font-semibold lg:text-[22px]">
                {t("result.review")}
              </h2>
              <p className="text-[13px] text-ardoise">
                {t("result.reviewCount", { count: quiz.questions.length })}
              </p>
            </div>
            <ol className="flex flex-col">
              {quiz.questions.map((question, index) => {
                const correct = results.get(question.id) ?? false;
                const chosen = new Set(given[question.id] ?? []);
                return (
                  <li key={question.id} className="border-brume not-last:border-b">
                    <details open={!correct} className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                        <span
                          aria-hidden
                          className={cx(
                            "flex size-7 shrink-0 items-center justify-center rounded-full",
                            correct
                              ? "bg-lime-clair text-feuille-fonce"
                              : "bg-down-fond text-down-texte",
                          )}
                        >
                          <Icon name={correct ? "check" : "fermer"} className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-[15px] font-semibold">
                          {[t("question", { number: index + 1 }), question.prompt].join(" · ")}
                        </span>
                        <span
                          className={cx(
                            "shrink-0 text-xs font-semibold",
                            correct ? "text-up-texte" : "text-down-texte",
                          )}
                        >
                          {correct ? t("result.correct") : t("result.incorrect")}
                        </span>
                        <Icon
                          name="chev-d"
                          className="size-4 shrink-0 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <div className="mb-4 flex flex-col gap-2.5 sm:ml-10">
                        {question.type === "text" ? (
                          <>
                            <p
                              className={cx(
                                "rounded-[14px] border p-4 text-[15px]",
                                correct
                                  ? "border-feuille bg-lime-clair"
                                  : "border-corail bg-down-fond",
                              )}
                            >
                              {[t("result.yourAnswer"), [...chosen][0]].filter(Boolean).join(" · ")}
                            </p>
                            {!correct && question.answer[0] && (
                              <p className="rounded-[14px] border border-feuille bg-lime-clair p-4 text-[15px]">
                                {[t("result.correct"), question.answer[0]].join(" · ")}
                              </p>
                            )}
                          </>
                        ) : (
                          <ul className="flex flex-col gap-2.5">
                            {question.options.map((option, optionIndex) => {
                              const value = String(optionIndex);
                              const isAnswer = question.answer.includes(value);
                              const isChosen = chosen.has(value);
                              return (
                                <li
                                  key={optionIndex}
                                  className={cx(
                                    "flex min-h-[52px] items-center gap-3 rounded-[14px] border px-4 py-2 text-[15px]",
                                    isAnswer
                                      ? "border-feuille bg-lime-clair"
                                      : isChosen
                                        ? "border-corail bg-down-fond"
                                        : "border-brume",
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cx(
                                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                                      isAnswer
                                        ? "bg-feuille text-blanc"
                                        : isChosen
                                          ? "bg-corail-fonce text-blanc"
                                          : "border-2 border-brume",
                                    )}
                                  >
                                    {(isAnswer || isChosen) && (
                                      <Icon
                                        name={isAnswer ? "check" : "fermer"}
                                        className="size-3"
                                      />
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1">{option}</span>
                                  {isChosen && !isAnswer && (
                                    <span className="text-xs font-semibold text-down-texte">
                                      {t("result.yourAnswer")}
                                    </span>
                                  )}
                                  {isAnswer && (
                                    <span className="text-xs font-semibold text-up-texte">
                                      {isChosen ? t("result.yourAnswer") : t("result.correct")}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {question.explanation && (
                          <div className="flex flex-col gap-1 rounded-[14px] bg-creme p-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
                              {t("result.explanation")}
                            </p>
                            <p className="text-sm leading-6">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="flex flex-col gap-5 self-start">
            <section
              aria-labelledby="quiz-grid"
              className="flex flex-col gap-4 rounded-[24px] bg-blanc p-6"
            >
              <h2 id="quiz-grid" className="text-[20px] font-semibold lg:text-[22px]">
                {t("result.grid")}
              </h2>
              <ol className="flex flex-wrap gap-2">
                {quiz.questions.map((question, index) => {
                  const correct = results.get(question.id);
                  return (
                    <li
                      key={question.id}
                      className={cx(
                        "flex size-10 items-center justify-center rounded-xl text-sm font-semibold",
                        correct ? "bg-lime-clair text-up-texte" : "bg-down-fond text-down-texte",
                      )}
                    >
                      {index + 1}
                      <span className="sr-only">
                        {correct ? t("result.correct") : t("result.incorrect")}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p aria-hidden className="flex flex-wrap gap-4 text-xs text-ardoise">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-feuille" />
                  {t("result.correct")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-corail" />
                  {t("result.incorrect")}
                </span>
              </p>
            </section>
            {info}
            {nextModule && nextHref && (
              <section className="flex flex-col gap-2 rounded-[24px] bg-lime p-6">
                <h2 className="text-[11px] font-semibold tracking-[0.12em] uppercase">
                  {t("result.nextModule")}
                </h2>
                <p className="text-lg font-semibold">{nextModule.title}</p>
                <p className="text-xs">{nextModule.meta}</p>
                <Link
                  href={nextHref}
                  className="mt-2 flex h-10 items-center gap-2 self-start rounded-pill bg-sapin px-4 text-sm font-semibold text-blanc"
                >
                  {t("result.continue")}
                  <Icon name="chev-r" className="size-4" />
                </Link>
              </section>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section
        aria-labelledby="quiz-title"
        className="flex flex-col gap-5 self-start rounded-[24px] bg-blanc p-6"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="quiz-title" className="text-[20px] font-semibold lg:text-[22px]">
            {t("title", { moduleTitle: lesson.module.title })}
          </h2>
          <p className="text-sm text-ardoise">
            {t("intro", { count: quiz.questions.length, passScore: quiz.passingScore })}
          </p>
          {passed && (
            <span className="flex items-center gap-1 self-start rounded-pill bg-lime-clair px-2.5 py-1 text-[11px] font-semibold">
              <Icon name="check" className="size-3" />
              {t("result.moduleBadge", { number: lesson.module.order })}
            </span>
          )}
        </div>
        {left === 0 ? (
          <p role="status" className="rounded-xl bg-ambre-fond p-3 text-sm text-ambre-texte">
            {t("noAttempts")}
          </p>
        ) : (
          <form action={submitQuizAction} className="flex flex-col gap-6">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="lesson" value={lesson.id} />
            {quiz.questions.map((question, index) => (
              <fieldset key={question.id} className="flex flex-col gap-2.5">
                <legend className="mb-1 text-[15px] font-semibold">
                  {[t("question", { number: index + 1 }), question.prompt].join(" · ")}
                </legend>
                {question.type === "text" ? (
                  <label className="flex flex-col gap-1" htmlFor={`quiz-${question.id}`}>
                    <span className="sr-only">{t("openAnswer.placeholder")}</span>
                    <input
                      id={`quiz-${question.id}`}
                      name={`q_${question.id}`}
                      placeholder={t("openAnswer.placeholder")}
                      maxLength={300}
                      className="h-12 rounded-[14px] border border-brume bg-blanc px-4"
                    />
                  </label>
                ) : (
                  <>
                    <p className="text-xs text-ardoise">
                      {question.type === "multiple" ? t("multiple") : t("single")}
                    </p>
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        htmlFor={`quiz-${question.id}-${optionIndex}`}
                        className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-[14px] border border-brume px-4 text-[15px] hover:bg-creme has-checked:border-feuille has-checked:bg-lime-clair"
                      >
                        <input
                          id={`quiz-${question.id}-${optionIndex}`}
                          type={question.type === "multiple" ? "checkbox" : "radio"}
                          name={`q_${question.id}`}
                          value={String(optionIndex)}
                          className="size-5 accent-sapin"
                        />
                        {option}
                      </label>
                    ))}
                  </>
                )}
              </fieldset>
            ))}
            <button type="submit" className={cx(pill, "self-start bg-lime text-sapin")}>
              {t("submit")}
              <Icon name="chev-r" className="size-4" />
            </button>
          </form>
        )}
      </section>
      <div className="flex flex-col gap-5 self-start">
        {info}
        {aside}
      </div>
    </div>
  );
}
