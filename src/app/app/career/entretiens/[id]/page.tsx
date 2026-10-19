import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { VoiceAnswer } from "@/components/career/voice-answer";
import { CourseArt } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { dynamic } from "@/i18n/dynamic";
import { answerInterviewAction, finishInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { gapCourses } from "@/server/matching/service";
import { ANSWER_MAX, getInterview, type FeedbackLine } from "@/server/services/interview-sim";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("practice");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const durationText: Record<number, "quick" | "standard" | "full"> = {
  10: "quick",
  20: "standard",
  30: "full",
};

/**
 * A practice session (planche talent-2 § 4): one question at a time with a tip from Orbi, then
 * « Votre retour »: strengths, points to work on and a course, by criterion, never a mark and
 * never a prediction (partie 08 § 8.9). Private: the recruiter never sees it.
 */
export default async function PracticeSessionPage({
  params,
  searchParams,
}: PageProps<"/app/career/entretiens/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/entretiens/${id}`);
  const session = await getInterview(db, user.id, id);
  if (!session) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const line = (item: FeedbackLine) =>
    "text" in item ? item.text : d(`career.interviews.feedback.rule.${item.code}`);
  const total = session.turns.length;
  const current = session.turns.findIndex((turn) => turn.answer === null);
  const feedback = session.feedbackData;
  const application = session.jobId
    ? await db.application.findFirst({
        where: { jobId: session.jobId, profile: { userId: user.id } },
        select: { id: true },
      })
    : null;
  const job = session.jobId
    ? await db.job.findUnique({ where: { id: session.jobId }, select: { slug: true } })
    : null;
  const again = `/app/career/entretiens/nouveau${
    application ? `?candidature=${application.id}` : job ? `?offre=${job.slug}` : ""
  }`;
  const end = application ? `/app/suivi/${application.id}` : "/app/career/entretiens";
  const typeLabel = d(`career.interviews.setup.type.${session.type}`);

  // ─── The feedback. ─────────────────────────────────────────────────────────────────────
  if (feedback) {
    const course =
      session.jobId && session.status === "completed"
        ? (await gapCourses(db, user.id, session.jobId)).flatMap((gap) => gap.courses)[0]
        : undefined;
    const solid = feedback.criteria.filter((criterion) => criterion.level === "solid").length;
    const good = feedback.criteria.length > 0 && solid * 2 >= feedback.criteria.length;
    return (
      <div id="retour" className="t-flux">
        <FlowHead
          back={end}
          backLabel={t("practice.back")}
          title={t("career.interviews.feedback.title")}
        />
        <div className="t-verre t-sc-c">
          <OrbiMark size={48} />
          <div className="t-t">
            <b>{good ? t("practice.feedback.good") : t("practice.feedback.work")}</b>
            <span>
              {t("practice.feedback.line", {
                kind: d(`practice.kind.${durationText[session.durationMinutes] ?? "standard"}`),
                count: total,
              })}
            </span>
          </div>
        </div>
        {feedback.strengths.length > 0 && (
          <section className="t-verre t-fb-c" aria-labelledby="pr-forts">
            <h2 id="pr-forts" className="t-h4">
              {t("practice.feedback.strengths")}
            </h2>
            {feedback.strengths.map((item, index) => (
              <div key={index} className="t-pt t-ok">
                <i aria-hidden>
                  <TalentIcon name="valider" size="xs" />
                </i>
                {line(item)}
              </div>
            ))}
          </section>
        )}
        {feedback.improvements.length > 0 && (
          <section className="t-verre t-fb-c" aria-labelledby="pr-travail">
            <h2 id="pr-travail" className="t-h4">
              {t("practice.feedback.improve")}
            </h2>
            {feedback.improvements.map((item, index) => (
              <div key={index} className="t-pt t-ko">
                <i aria-hidden>
                  <TalentIcon name="plus" size="xs" />
                </i>
                {line(item)}
              </div>
            ))}
          </section>
        )}
        {course && (
          <article className="t-verre t-mg">
            <span className="t-vign">
              <CourseArt category="digital" />
            </span>
            <div className="t-t">
              <small>{t("offer.progress.eyebrow")}</small>
              <Link href={`/app/learn/${course.slug}`} className="t-lien">
                <b>{course.title}</b>
              </Link>
              <span>
                {course.durationMinutes >= 60
                  ? t("forMe.learn.hours", { count: Math.round(course.durationMinutes / 6) / 10 })
                  : t("forMe.learn.minutes", { count: course.durationMinutes })}
              </span>
            </div>
            <TalentIcon name="suivant" size="s" />
          </article>
        )}
        <details className="t-verre t-carte t-detail">
          <summary>{t("practice.feedback.details")}</summary>
          <dl className="t-flux t-serre">
            {feedback.criteria.map((criterion) => (
              <div key={criterion.key}>
                <dt>
                  <b>{t(`career.interviews.feedback.criteria.${criterion.key}`)}</b> ·{" "}
                  {t(`career.interviews.feedback.level.${criterion.level}`)}
                </dt>
                {criterion.comment && <dd>{line(criterion.comment)}</dd>}
              </div>
            ))}
          </dl>
          <ol className="t-flux t-serre">
            {session.turns.map((turn, index) => {
              const review = feedback.perQuestion.find((item) => item.index === index);
              return (
                <li key={index}>
                  <b>{turn.question}</b>
                  <p className="t-texte-l">
                    {turn.answer || t("career.interviews.feedback.notAnswered")}
                  </p>
                  {review?.comment.map((item, position) => (
                    <p key={position}>{line(item)}</p>
                  ))}
                  {review?.tip && (
                    <p>
                      <b>{t("career.interviews.feedback.betterAnswer")}</b> {review.tip}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </details>
        <p className="t-gar">
          <TalentIcon name="pourquoi" size="s" />
          <span>
            {feedback.source === "ai"
              ? t("career.interviews.feedback.disclaimer")
              : t("career.interviews.feedback.rules")}
          </span>
        </p>
        <div className="t-verre t-fort t-bas-f">
          <Link href={again} className="t-bt t-sec t-m t-press">
            {t("practice.feedback.again")}
          </Link>
          <Link href={end} className="t-bt t-p t-pl t-press">
            {t("practice.feedback.done")}
          </Link>
        </div>
      </div>
    );
  }

  // ─── One question at a time. ──────────────────────────────────────────────────────────
  const index = current >= 0 ? current : total - 1;
  const turn = session.turns[index];
  return (
    <div className="t-flux">
      <FlowHead
        back={end}
        backLabel={t("practice.back")}
        title={
          current >= 0
            ? t("career.interviews.session.question", { current: current + 1, total })
            : t("career.interviews.session.allAnswered")
        }
        end={
          <Link href={end} className="t-bi t-press" aria-label={t("practice.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      <div className="t-pas" aria-hidden>
        {session.turns.map((item, position) => (
          <i
            key={position}
            className={item.answer !== null || position === current ? "t-ok" : undefined}
          />
        ))}
      </div>
      {query.erreur === "vide" && (
        <Notice tone="err">{t("career.interviews.session.answer.placeholder")}</Notice>
      )}
      {current >= 0 && turn ? (
        <form id="reponse" action={answerInterviewAction} className="t-flux">
          <input type="hidden" name="id" value={session.id} />
          <div className="t-verre t-q">
            <small>{t("practice.questionKind", { kind: typeLabel })}</small>
            <b>{turn.question}</b>
          </div>
          {session.mode === "voice" ? (
            <VoiceAnswer
              key={current}
              id={`answer-${session.id}-${current}`}
              question={turn.question}
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
            <>
              <label htmlFor={`answer-${session.id}-${current}`} className="sr-only">
                {t("career.interviews.session.answered")}
              </label>
              <textarea
                key={current}
                id={`answer-${session.id}-${current}`}
                name="answer"
                className="t-verre t-rep"
                placeholder={t("career.interviews.session.answer.placeholder")}
                maxLength={ANSWER_MAX}
                rows={6}
              />
            </>
          )}
          <div className="t-bulle-o">
            <OrbiMark size={32} />
            <div className="t-verre t-corps">
              <span>{d(`practice.tip.${session.type}`)}</span>
            </div>
          </div>
          <div className="t-verre t-fort t-bas-f">
            <button
              type="submit"
              name="skip"
              value="1"
              formNoValidate
              className="t-bt t-sec t-m t-press"
            >
              {t("practice.skip")}
            </button>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("practice.answer")}
            </button>
          </div>
        </form>
      ) : (
        <Notice tone="ok">{t("career.interviews.session.allAnswered")}</Notice>
      )}
      <form
        action={finishInterviewAction}
        className={current >= 0 ? undefined : "t-verre t-fort t-bas-f"}
      >
        <input type="hidden" name="id" value={session.id} />
        <button type="submit" className={current >= 0 ? "t-sig t-press" : "t-bt t-a t-pl t-press"}>
          {t("career.interviews.session.end.text")}
        </button>
      </form>
    </div>
  );
}
