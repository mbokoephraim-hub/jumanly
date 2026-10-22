import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CourseArt } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { VoiceAnswer } from "@/components/talent/voice-answer";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { answerInterviewAction, finishInterviewAction } from "@/server/actions/career-interviews";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { gapCourses } from "@/server/matching/service";
import { isPhone } from "@/server/view";
import { PhoneInterviewAnswer, PhoneInterviewReport } from "@/components/phone/interview/report";
import { PhoneInterviewRun } from "@/components/phone/interview/run";
import {
  answerView,
  InterviewTexts,
  originOf,
  reportView,
  runView,
} from "@/components/phone/interview/server";
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
 * A practice session (planches talent-2 § 4 and talent-4 § 5 bis): one question at a time, written
 * with a tip from Orbi or spoken into the microphone (transcribed in the browser, no audio kept),
 * then « Votre retour »: strengths, points to work on, the five criteria in words and a course;
 * never a mark and never a prediction (partie 08 § 8.9). Private: the recruiter never sees it.
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
  // On the phone (Modèle B, lot B6): the session, then the report and each answer.
  if (await isPhone()) {
    const origin = await originOf(query);
    const answer = Number(query.reponse);
    if (session.status === "active")
      return (
        <InterviewTexts>
          <PhoneInterviewRun key={session.id} view={await runView(session, origin)} />
        </InterviewTexts>
      );
    if (Number.isInteger(answer) && answer >= 1 && answer <= session.turns.length)
      return (
        <InterviewTexts>
          <PhoneInterviewAnswer
            key={answer}
            view={await answerView(session, answer - 1, origin)}
            query={origin.query}
          />
        </InterviewTexts>
      );
    return (
      <InterviewTexts>
        <PhoneInterviewReport
          view={await reportView(session, origin, query.depuis === "historique")}
        />
      </InterviewTexts>
    );
  }
  const t = await getTranslations();
  const d = dynamic(t);
  const line = (item: FeedbackLine) =>
    "text" in item ? item.text : d(`career.interviews.feedback.rule.${item.code}`);
  const total = session.turns.length;
  const current = session.turns.findIndex((turn) => turn.answer === null);
  const feedback = session.feedbackData;
  const voice = session.mode === "voice";
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
  const kindLabel = d(`practice.kind.${durationText[session.durationMinutes] ?? "standard"}`);
  const kindLine = t("practice.web.kind", {
    kind: kindLabel,
    mode: d(`practice.kind.${voice ? "voice" : "text"}`),
  }).toLocaleLowerCase("fr");
  const kindTitle = kindLine.charAt(0).toLocaleUpperCase("fr") + kindLine.slice(1);
  const againEnd = (
    <>
      <Link href={again} className="t-bt t-sec t-m t-press">
        {t("practice.feedback.again")}
      </Link>
      <Link href={end} className="t-bt t-p t-pl t-press">
        {t("practice.feedback.done")}
      </Link>
    </>
  );

  // ─── The feedback. ─────────────────────────────────────────────────────────────────────
  if (feedback) {
    const course =
      session.jobId && session.status === "completed"
        ? (await gapCourses(db, user.id, session.jobId)).flatMap((gap) => gap.courses)[0]
        : undefined;
    const solid = feedback.criteria.filter((criterion) => criterion.level === "solid").length;
    const good = feedback.criteria.length > 0 && solid * 2 >= feedback.criteria.length;
    // « Revoir ma réponse »: the first answer Orbi has a better wording for, else the first one.
    const reviewed =
      feedback.perQuestion.find((item) => item.tip && session.turns[item.index]?.answer) ??
      feedback.perQuestion.find((item) => session.turns[item.index]?.answer);
    const reviewTurn = reviewed ? session.turns[reviewed.index] : undefined;
    const point = (item: FeedbackLine, ok: boolean, index: number) => (
      <div key={`${ok}-${index}`} className={cx("t-pt", ok ? "t-ok" : "t-ko")}>
        <i aria-hidden>
          <TalentIcon name={ok ? "valider" : "plus"} size="xs" />
        </i>
        {line(item)}
      </div>
    );
    return (
      <div id="retour" className="t-flux t-large t-pq-w t-fbw">
        <FlowHead
          back={end}
          backLabel={t("practice.back")}
          title={voice ? t("entrain.fb.oralTitle") : t("career.interviews.feedback.title")}
        />
        <p className="t-w-sous">{t("practice.feedback.line", { kind: kindLabel, count: total })}</p>
        <div className="t-verre t-sc-c">
          <OrbiMark size={48} />
          <div className="t-t">
            <b>{good ? t("practice.feedback.good") : t("practice.feedback.work")}</b>
            <span className="t-mob">
              {t("practice.feedback.line", { kind: kindLabel, count: total })}
            </span>
            <span className="t-w-seul">{t("practice.web.feedbackLine")}</span>
          </div>
          <div className="t-w-seul t-fb-act">{againEnd}</div>
        </div>
        <div className="t-fb2">
          {voice ? (
            feedback.strengths.length + feedback.improvements.length > 0 && (
              <section className="t-verre t-fb-c" aria-labelledby="pr-oral">
                <h2 id="pr-oral" className="t-h4">
                  {t("entrain.fb.oral")}
                </h2>
                {feedback.strengths.map((item, index) => point(item, true, index))}
                {feedback.improvements.map((item, index) => point(item, false, index))}
              </section>
            )
          ) : (
            <>
              {feedback.strengths.length > 0 && (
                <section className="t-verre t-fb-c" aria-labelledby="pr-forts">
                  <h2 id="pr-forts" className="t-h4">
                    {t("practice.feedback.strengths")}
                  </h2>
                  {feedback.strengths.map((item, index) => point(item, true, index))}
                </section>
              )}
              {feedback.improvements.length > 0 && (
                <section className="t-verre t-fb-c" aria-labelledby="pr-travail">
                  <h2 id="pr-travail" className="t-h4">
                    {t("practice.feedback.improve")}
                  </h2>
                  {feedback.improvements.map((item, index) => point(item, false, index))}
                </section>
              )}
            </>
          )}
        </div>
        {feedback.criteria.length > 0 && (
          <section className="t-verre t-fb-c t-crit-s" aria-labelledby="pr-criteres">
            <h2 id="pr-criteres" className="t-h4">
              {t("entrain.fb.criteria")}
            </h2>
            <dl className="t-crit5">
              {feedback.criteria.map((criterion) => (
                <div key={criterion.key}>
                  <dt>{t(`career.interviews.feedback.criteria.${criterion.key}`)}</dt>
                  <span className={`t-w-seul t-j t-${criterion.level}`} aria-hidden>
                    <i />
                  </span>
                  <dd className={`t-${criterion.level}`}>
                    {t(`career.interviews.feedback.level.${criterion.level}`)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="t-crit5-n">{t("entrain.fb.criteriaNote")}</p>
          </section>
        )}
        {reviewed && reviewTurn && (
          <>
            <SheetButton target="pr-revoir" className="t-verre t-pj t-press">
              <span className="t-cases">
                <TalentIcon name="lecon" size="s" />
              </span>
              <span className="t-t">
                <b>{t("entrain.fb.review", { n: reviewed.index + 1 })}</b>
                <span>
                  {reviewed.tip ? t("entrain.fb.reviewTip") : t("entrain.fb.reviewPlain")}
                </span>
              </span>
              <TalentIcon name="suivant" size="s" />
            </SheetButton>
            <Sheet
              id="pr-revoir"
              title={t("entrain.fb.review", { n: reviewed.index + 1 })}
              closeLabel={t("entrain.fb.close")}
            >
              <div className="t-pq-d">
                <b>{reviewTurn.question}</b>
                <p className="t-texte-l">{reviewTurn.answer}</p>
                {reviewed.comment.map((item, position) => (
                  <p key={position}>{line(item)}</p>
                ))}
                {reviewed.tip && (
                  <div className="t-bulle-o">
                    <OrbiMark size={32} />
                    <div className="t-verre t-corps">
                      <span>{reviewed.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            </Sheet>
          </>
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
        <SheetButton target="pr-pourquoi" className="t-pq t-press">
          <TalentIcon name="pourquoi" />
          {t("entrain.fb.why")}
        </SheetButton>
        <Sheet id="pr-pourquoi" title={t("entrain.fb.whyTitle")} closeLabel={t("entrain.fb.close")}>
          <div className="t-pq-d">
            <p>
              {feedback.source === "ai"
                ? t("career.interviews.feedback.disclaimer")
                : t("career.interviews.feedback.rules")}
            </p>
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
            <p className="t-gar">
              <TalentIcon name="cadenas" size="s" />
              <span>{t("entrain.private")}</span>
            </p>
          </div>
        </Sheet>
        <div className="t-verre t-fort t-bas-f t-mob">{againEnd}</div>
      </div>
    );
  }

  // ─── One question at a time. ──────────────────────────────────────────────────────────
  const index = current >= 0 ? current : total - 1;
  const turn = session.turns[index];
  const left = Math.max(
    0,
    Math.ceil(
      (session.createdAt.getTime() + session.durationMinutes * 60_000 - new Date().getTime()) /
        60_000,
    ),
  );
  return (
    <div className="t-flux t-large t-pq-w t-sim">
      <FlowHead
        back={end}
        backLabel={t("practice.back")}
        title={
          current >= 0
            ? t("career.interviews.session.question", { current: current + 1, total })
            : t("career.interviews.session.allAnswered")
        }
        end={
          <>
            <span className="t-w-seul t-verre t-chrono-p">
              <TalentIcon name="horloge" size="s" />
              {t("practice.web.left", { count: left })}
            </span>
            <Link href={end} className="t-bi t-press" aria-label={t("practice.close")}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          </>
        }
      />
      <p className="t-w-sous">{kindTitle}</p>
      <div className="t-sim-l">
        <div className="t-flux t-sim-p">
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
                <small>
                  {voice
                    ? t("entrain.voice.kind", { kind: typeLabel })
                    : t("practice.questionKind", { kind: typeLabel })}
                </small>
                <b>{turn.question}</b>
              </div>
              {voice ? (
                <>
                  <VoiceAnswer
                    key={current}
                    id={`answer-${session.id}-${current}`}
                    question={turn.question}
                    labels={{
                      transcript: t("entrain.voice.transcript"),
                      placeholder: t("career.interviews.session.answer.placeholder"),
                      listen: t("career.interviews.voice.listen"),
                      record: t("entrain.voice.record"),
                      stop: t("entrain.voice.stop"),
                      clear: t("entrain.voice.clear"),
                      send: t("entrain.voice.send"),
                      time: t("entrain.voice.time", { time: "{time}" }),
                      unsupported: t("career.interviews.voice.unsupported"),
                      micDenied: t("career.interviews.voice.micDenied"),
                    }}
                  />
                  <p className="t-gar">
                    <TalentIcon name="cadenas" size="s" />
                    <span>{t("entrain.voice.privacy")}</span>
                  </p>
                  <button
                    type="submit"
                    name="skip"
                    value="1"
                    formNoValidate
                    className="t-sig t-press"
                  >
                    {t("practice.skip")}
                  </button>
                </>
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
                  <div className="t-bulle-o">
                    <OrbiMark size={32} />
                    <div className="t-verre t-corps">
                      <span>{d(`practice.tip.${session.type}`)}</span>
                    </div>
                  </div>
                  <div className="t-verre t-fort t-bas-f">
                    <span className="t-post-note">
                      <TalentIcon name="cadenas" size="xs" />
                      {t("practice.web.privateShort")}
                    </span>
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
                </>
              )}
            </form>
          ) : (
            <Notice tone="ok">{t("career.interviews.session.allAnswered")}</Notice>
          )}
          <form
            action={finishInterviewAction}
            className={current >= 0 ? undefined : "t-verre t-fort t-bas-f"}
          >
            <input type="hidden" name="id" value={session.id} />
            <button
              type="submit"
              className={current >= 0 ? "t-sig t-press" : "t-bt t-a t-pl t-press"}
            >
              {t("career.interviews.session.end.text")}
            </button>
          </form>
        </div>
        <aside className="t-ordi t-sim-side" aria-labelledby="pr-questions">
          <div className="t-verre t-sim-qs">
            <h2 id="pr-questions">{t("practice.web.questions")}</h2>
            <ol>
              {session.turns.map((item, position) => (
                <li
                  key={position}
                  className={cx(item.answer !== null && "t-ok", position === current && "t-on")}
                  aria-current={position === current ? "step" : undefined}
                >
                  <i aria-hidden>
                    {item.answer !== null ? <TalentIcon name="valider" size="xs" /> : position + 1}
                  </i>
                  <span>{item.question}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
