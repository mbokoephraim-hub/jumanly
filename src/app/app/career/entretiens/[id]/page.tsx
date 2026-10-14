import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { VoiceAnswer } from "@/components/career/voice-answer";
import { Alert, Badge, Button, TextArea } from "@/components/ui";
import { answerInterviewAction, finishInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { ANSWER_MAX, getInterview, type FeedbackLine } from "@/server/services/interview-sim";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.interviews");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const levelTone = { solid: "success", developing: "ai", toWork: "warning" } as const;

/** A simulation: one question at a time, then the structured feedback (partie 08 § 8.9). */
export default async function InterviewSessionPage({
  params,
  searchParams,
}: PageProps<"/app/career/entretiens/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/entretiens/${id}`);
  const session = await getInterview(db, user.id, id);
  if (!session) notFound();
  const t = await getTranslations();
  const line = (item: FeedbackLine) =>
    "text" in item ? item.text : t(`career.interviews.feedback.rule.${item.code}`);
  const total = session.turns.length;
  const current = session.turns.findIndex((turn) => turn.answer === null);
  const done = session.turns.filter((turn) => turn.answer !== null).length;
  const feedback = session.feedbackData;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/app/career/entretiens" className="text-sm underline">
        {t("career.interviews.session.back")}
      </Link>
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-ardoise">
          {[
            t(`career.interviews.setup.type.${session.type as "hr"}`),
            t(`career.interviews.mode.${session.mode}.text`),
          ].join(" · ")}
        </p>
        <h1 className="text-h1">{session.jobTitle}</h1>
        <p className="text-sm text-ardoise">
          {t("career.interviews.session.progress", { done, total })}
        </p>
      </header>

      {session.status === "active" && (
        <>
          {current >= 0 ? (
            <form
              id="reponse"
              action={answerInterviewAction}
              className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
            >
              <input type="hidden" name="id" value={session.id} />
              <p className="text-label">
                {t("career.interviews.session.question", { current: current + 1, total })}
              </p>
              <p className="font-semibold text-h3">{session.turns[current].question}</p>
              {query.erreur === "vide" && (
                <Alert tone="error" title={t("career.interviews.session.answer.placeholder")} />
              )}
              {session.mode === "voice" ? (
                <VoiceAnswer
                  key={current}
                  id={`answer-${session.id}-${current}`}
                  question={session.turns[current].question}
                  labels={{
                    answer: t("career.interviews.session.answered"),
                    placeholder: t("career.interviews.session.answer.placeholder"),
                    listen: t("career.interviews.voice.listen"),
                    record: t("career.interviews.voice.record"),
                    stop: t("career.interviews.voice.stop"),
                    retry: t("career.interviews.voice.retry"),
                    recording: t("career.interviews.voice.recording", { time: "{time}" }),
                    speaking: t("career.interviews.voice.speaking"),
                    unsupported: t("career.interviews.voice.unsupported"),
                    micDenied: t("career.interviews.voice.micDenied"),
                    noRecording: t("career.interviews.voice.noRecording"),
                  }}
                />
              ) : (
                <TextArea
                  id={`answer-${session.id}-${current}`}
                  name="answer"
                  label={t("career.interviews.session.answered")}
                  placeholder={t("career.interviews.session.answer.placeholder")}
                  hint={t("career.interviews.session.hint")}
                  maxLength={ANSWER_MAX}
                  rows={7}
                  required
                />
              )}
              <div>
                <Button type="submit">{t("career.interviews.session.send")}</Button>
              </div>
            </form>
          ) : (
            <Alert tone="success" title={t("career.interviews.session.allAnswered")} />
          )}
          <form action={finishInterviewAction} className="flex flex-col items-start gap-2">
            <input type="hidden" name="id" value={session.id} />
            {current >= 0 && (
              <p className="text-sm text-ardoise">{t("career.interviews.session.end.confirm")}</p>
            )}
            <Button type="submit" variant={current >= 0 ? "tertiary" : "primary"}>
              {t("career.interviews.session.end.text")}
            </Button>
          </form>
        </>
      )}

      {feedback && (
        <section
          id="retour"
          aria-labelledby="feedback-title"
          className="flex scroll-mt-24 flex-col gap-5 rounded-card bg-blanc p-6"
        >
          <div className="flex items-center gap-2">
            <AiOrb />
            <h2 id="feedback-title" className="text-h2">
              {t("career.interviews.feedback.title")}
            </h2>
          </div>
          {feedback.summary && (
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-h3">{t("career.interviews.feedback.overall")}</h3>
              <p>{line(feedback.summary)}</p>
            </div>
          )}
          {feedback.criteria.length > 0 && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {feedback.criteria.map((criterion) => (
                <div key={criterion.key} className="flex flex-col gap-1 rounded-card bg-creme p-4">
                  <dt className="flex flex-wrap items-center justify-between gap-2 font-medium">
                    {t(`career.interviews.feedback.criteria.${criterion.key}`)}
                    <Badge tone={levelTone[criterion.level]}>
                      {t(`career.interviews.feedback.level.${criterion.level}`)}
                    </Badge>
                  </dt>
                  {criterion.comment && <dd className="text-sm">{line(criterion.comment)}</dd>}
                </div>
              ))}
            </dl>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {(["strengths", "improvements"] as const).map((key) =>
              feedback[key].length > 0 ? (
                <div key={key} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-h3">
                    {t(
                      key === "strengths"
                        ? "career.interviews.feedback.strengths"
                        : "career.interviews.feedback.improve",
                    )}
                  </h3>
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    {feedback[key].map((item, index) => (
                      <li key={index}>{line(item)}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-h3">{t("career.interviews.feedback.perQuestion")}</h3>
            <ol className="flex flex-col gap-3">
              {session.turns.map((turn, index) => {
                const review = feedback.perQuestion.find((item) => item.index === index);
                return (
                  <li key={index} className="flex flex-col gap-2 rounded-card bg-creme p-4">
                    <p className="font-semibold">{turn.question}</p>
                    <p className="text-sm whitespace-pre-line">
                      {turn.answer ?? t("career.interviews.feedback.notAnswered")}
                    </p>
                    {turn.durationSec !== null && (
                      <p className="text-sm text-ardoise">
                        {t("career.interviews.voice.duration", { seconds: turn.durationSec })}
                      </p>
                    )}
                    {review && (
                      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                        {review.comment.map((item, position) => (
                          <li key={position}>{line(item)}</li>
                        ))}
                      </ul>
                    )}
                    {review?.tip && (
                      <p className="text-sm">
                        <span className="font-medium">
                          {t("career.interviews.feedback.betterAnswer")}
                        </span>{" "}
                        {review.tip}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="text-sm text-ardoise">
            {feedback.source === "ai"
              ? t("career.interviews.feedback.disclaimer")
              : t("career.interviews.feedback.rules")}
          </p>
          <Link href="/app/career/entretiens#preparer" className="self-start underline">
            {t("career.interviews.feedback.again")}
          </Link>
        </section>
      )}
    </div>
  );
}
