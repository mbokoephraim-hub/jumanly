import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, ButtonLink } from "@/components/ui";
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

/** A quiz lesson: the form, or the result of an attempt with the explanation of each question. */
export async function QuizPanel({
  userId,
  slug,
  lesson,
  attemptId,
  passed,
  nextHref,
}: {
  userId: string;
  slug: string;
  lesson: { id: string; title: string; module: { title: string } };
  attemptId?: string;
  passed: boolean;
  nextHref?: string;
}) {
  const t = await getTranslations("learn.quiz");
  const quiz = await db.quiz.findUnique({
    where: { lessonId: lesson.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz || quiz.questions.length === 0) {
    const player = await getTranslations("learn.player");
    return <p className="rounded-card bg-blanc p-5 text-ardoise">{player("overview.empty")}</p>;
  }
  const left = await attemptsLeft(db, userId, quiz);
  const attempt = attemptId
    ? await db.quizAttempt.findFirst({ where: { id: attemptId, userId, quizId: quiz.id } })
    : null;
  const retryHref = `/app/learn/${slug}?lecon=${lesson.id}`;

  if (attempt) {
    const score = scoreQuiz(quiz.questions, answersOf(attempt.answers));
    const results = new Map(score.results.map((result) => [result.questionId, result.correct]));
    return (
      <section
        className="flex flex-col gap-4 rounded-card bg-blanc p-5 md:p-6"
        aria-labelledby="quiz-result"
      >
        <h2 id="quiz-result" className="text-h2">
          {attempt.passed ? t("result.title.pass") : t("result.title.fail")}
        </h2>
        <p className="text-lg font-semibold">
          {t("result.score", {
            correct: score.correct,
            total: score.total,
            percent: score.percent,
          })}
        </p>
        <p className="text-[15px] text-ardoise">
          {[
            t("result.passScore", { passScore: quiz.passingScore }),
            attempt.passed ? t("result.body.pass") : t("result.body.fail"),
          ].join(" ")}
        </p>
        <h3 className="font-semibold">{t("result.review")}</h3>
        <ol className="flex flex-col gap-3">
          {quiz.questions.map((question) => {
            const correct = results.get(question.id);
            return (
              <li
                key={question.id}
                className="flex flex-col gap-2 rounded-md border border-brume p-4"
              >
                <p className="font-semibold">{question.prompt}</p>
                <Badge tone={correct ? "success" : "error"} className="self-start">
                  {correct ? t("result.correct") : t("result.incorrect")}
                </Badge>
                {question.explanation && (
                  <p className="text-[15px] leading-6">
                    {[t("result.explanation"), question.explanation].join(" · ")}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap gap-3">
          {attempt.passed && nextHref && (
            <ButtonLink href={nextHref}>{t("result.continue")}</ButtonLink>
          )}
          {!attempt.passed &&
            (left === 0 ? (
              <Alert tone="warning" title={t("noAttempts")} />
            ) : (
              <ButtonLink href={retryHref}>{t("result.retry")}</ButtonLink>
            ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-4 rounded-card bg-blanc p-5 md:p-6"
      aria-labelledby="quiz-title"
    >
      <h2 id="quiz-title" className="text-h2">
        {t("title", { moduleTitle: lesson.module.title })}
      </h2>
      <p className="text-[15px]">
        {[
          t("intro", { count: quiz.questions.length, passScore: quiz.passingScore }),
          t("attempts", { count: left ?? 0 }),
        ].join(" ")}
      </p>
      {passed && <Badge tone="success">{t("result.title.pass")}</Badge>}
      {left === 0 ? (
        <Alert tone="warning" title={t("noAttempts")} />
      ) : (
        <form action={submitQuizAction} className="flex flex-col gap-5">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="lesson" value={lesson.id} />
          {quiz.questions.map((question, index) => (
            <fieldset
              key={question.id}
              className="flex flex-col gap-2 rounded-md border border-brume p-4"
            >
              <legend className="px-1 font-semibold">
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
                    className="h-11 rounded-md border border-sapin/30 bg-blanc px-3"
                  />
                </label>
              ) : (
                <>
                  <p className="text-sm text-ardoise">
                    {question.type === "multiple" ? t("multiple") : t("single")}
                  </p>
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      htmlFor={`quiz-${question.id}-${optionIndex}`}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-creme"
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
          <Button type="submit" className="self-start">
            {t("submit")}
          </Button>
        </form>
      )}
    </section>
  );
}
