import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { documentKind } from "@/components/learn/course-documents";
import { VideoPlayer } from "@/components/learn/video-player";
import { YouTubeEmbed } from "@/components/learn/youtube-embed";
import { BackButton } from "@/components/talent/back-button";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { FileDrop } from "@/components/talent/learn/file-drop";
import { LessonOrbi } from "@/components/talent/learn/lesson-orbi";
import { LessonSettings, QualityChip } from "@/components/talent/learn/lesson-settings";
import { LessonTabs } from "@/components/talent/learn/lesson-tabs";
import { FullFrame } from "@/components/talent/learn/full-frame";
import { QuizSteps } from "@/components/talent/learn/quiz-steps";
import { WebHead } from "@/components/talent/learn/web-head";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { videoProvider } from "@/server/adapters/video";
import {
  addNoteAction,
  completeLessonAction,
  deleteNoteAction,
  submitExerciseAction,
} from "@/server/actions/learn";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { documentHref, documentViewer, visibleDocuments } from "@/server/services/course-documents";
import { exerciseSubmissions } from "@/server/services/exercises";
import {
  attemptsLeft,
  getLearnerCourse,
  JOB_EXERCISES_KEY,
  lessonOutline,
  lessonParagraphs,
  lessonsOf,
  NOTE_MAX,
  parseResources,
  scoreQuiz,
  transcriptCues,
} from "@/server/services/learn";
import { lessonResume } from "@/server/services/lesson-progress";
import { isPhone } from "@/server/view";
import { PhoneLessonScreen } from "@/components/phone/learn/pages";

export async function generateMetadata({
  params,
}: PageProps<"/app/learn/[slug]/[lecon]">): Promise<Metadata> {
  const { lecon } = await params;
  const t = await getTranslations("apprendre.lesson");
  const lesson = await db.lesson.findUnique({ where: { id: lecon }, select: { title: true } });
  return { title: t("seo", { title: lesson?.title ?? "" }), robots: { index: false } };
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/**
 * The classroom (planche talent-3 § 5 to 7, 9 and the exercise): the video in its dark band with
 * the quality chip, « Module 2 · Leçon 2 sur 4 », the tabs Leçon, Texte, Notes, Fichiers, Orbi to
 * explain a notion, then « Leçon suivante ». A quiz goes one question at a time, an exercise is
 * handed in as a file or one of my CVs. The free module of a course above the plan can be followed
 * without enrolling; nothing is recorded then.
 */
export default async function LessonPage({
  params,
  searchParams,
}: PageProps<"/app/learn/[slug]/[lecon]">) {
  const { slug, lecon } = await params;
  const query = await searchParams;
  const param = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : undefined;
  const user = await requireUser(`/app/learn/${slug}/${lecon}`);
  // The phone (Modèle B, lot B7, planches Formation-lecon et -quiz).
  if (await isPhone())
    return (
      <PhoneLessonScreen
        user={user}
        slug={slug}
        lessonId={lecon}
        attempt={param("tentative") ?? null}
        exercise={param("exercice") ?? null}
      />
    );
  const found = await getLearnerCourse(db, user.id, slug);
  if (!found) notFound();
  const { course, enrollment, open } = found;
  const lessons = lessonsOf(course);
  const current = lessons.find((lesson) => lesson.id === lecon);
  if (!current) notFound();
  const follows = open && Boolean(enrollment);
  if (!follows && !current.isPreview)
    redirect(`/app/learn/${course.slug}${open ? "" : "?erreur=locked"}`);

  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const coursePath = `/app/learn/${course.slug}`;
  const lessonHref = (id: string) => `${coursePath}/${id}`;
  const done = new Set(enrollment?.completedLessons ?? []);
  const reachable = follows ? lessons : lessons.filter((lesson) => lesson.isPreview);
  const at = reachable.indexOf(current);
  const previous = reachable[at - 1];
  const next = reachable[at + 1];
  const inModule = current.module.lessons;
  const position = inModule.findIndex((lesson) => lesson.id === current.id) + 1;
  const where = t("apprendre.lesson.where", {
    module: current.module.order,
    lesson: position,
    total: inModule.length,
  });
  const jobExercises = current.jobSpecific
    ? await can(db, { type: "user", id: user.id }, JOB_EXERCISES_KEY)
    : true;
  const locked = !jobExercises;
  const error = param("erreur");

  // ── Quiz (§ 7 and « Quiz non réussi ») ──────────────────────────────────
  if (current.kind === "quiz" && !locked) {
    const quiz = await db.quiz.findUnique({
      where: { lessonId: current.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    const head = (
      <FlowHead
        back={coursePath}
        backLabel={t("apprendre.course.back")}
        title={t("apprendre.quiz.title", { module: current.module.order })}
        end={
          <Link href={coursePath} className="t-bi t-press" aria-label={t("apprendre.done.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
    );
    const closeLink = (
      <Link href={coursePath} className="t-bi t-press" aria-label={t("apprendre.done.close")}>
        <TalentIcon name="fermer" size="s" />
      </Link>
    );
    const quizTitle = t("apprendre.quiz.title", { module: current.module.order });
    if (!quiz || quiz.questions.length === 0 || !follows)
      return (
        <div className="t-flux t-large t-aw">
          {head}
          <WebHead title={quizTitle} end={closeLink} />
          <p className="t-vide-t">{t("apprendre.quiz.empty")}</p>
        </div>
      );
    const left = await attemptsLeft(db, user.id, quiz);
    const attempt = param("tentative")
      ? await db.quizAttempt.findFirst({
          where: { id: param("tentative"), userId: user.id, quizId: quiz.id },
        })
      : null;

    if (attempt) {
      const total = quiz.questions.length;
      const right = Math.round((attempt.score * total) / 100);
      const need = Math.ceil((quiz.passingScore * total) / 100);
      const review = inModule.filter(
        (lesson) => lesson.kind !== "quiz" && lesson.order < current.order && !lesson.jobSpecific,
      );
      const nextLesson = lessons[lessons.indexOf(current) + 1];
      const given = answersOf(attempt.answers);
      const marks = scoreQuiz(quiz.questions, given).results;
      const wrong = marks.filter((mark) => !mark.correct).length;
      return (
        <div className="t-flux t-od-bas t-large t-aw t-aw-qr">
          <FullFrame />
          <WebHead title={t("apprendre.quiz.result")} end={closeLink} />
          <FlowHead
            back={coursePath}
            backLabel={t("apprendre.course.back")}
            title={t("apprendre.quiz.result")}
            end={
              <Link
                href={coursePath}
                className="t-bi t-press"
                aria-label={t("apprendre.done.close")}
              >
                <TalentIcon name="fermer" size="s" />
              </Link>
            }
          />
          <div className="t-aw-2">
            <section className="t-verre t-res-q" aria-labelledby="qz-res">
              <span
                className="t-anneau"
                style={
                  {
                    "--p": attempt.score,
                    ...(attempt.passed
                      ? {}
                      : {
                          background: `conic-gradient(#F2B33D ${attempt.score}%, var(--piste) 0)`,
                        }),
                  } as React.CSSProperties
                }
                role="img"
                aria-label={t("apprendre.quiz.scoreAria", { right, total })}
              >
                <b aria-hidden>{t("apprendre.quiz.score", { right, total })}</b>
              </span>
              <h2 id="qz-res">
                {attempt.passed ? t("apprendre.quiz.passed") : t("apprendre.quiz.almost")}
              </h2>
              <p>
                {attempt.passed
                  ? t("apprendre.quiz.passedText")
                  : t("apprendre.quiz.need", { need, total })}
              </p>
            </section>
            <div className="t-aw-col">
              {!attempt.passed && review.length > 0 && (
                <>
                  <span className="t-ck-t">{t("apprendre.quiz.review")}</span>
                  <ul className="t-verre t-liste t-lignes">
                    {review.map((lesson) => (
                      <li key={lesson.id} className="t-li">
                        <span className="t-cases t-c1">
                          <TalentIcon name="lecon" size="s" />
                        </span>
                        <span className="t-t">
                          <Link href={lessonHref(lesson.id)} className="t-lien">
                            <b>
                              {t("apprendre.quiz.reviewLesson", {
                                number: lesson.order,
                                title: lesson.title,
                              })}
                            </b>
                          </Link>
                          {lesson.durationSec > 0 && (
                            <span>
                              {t("forMe.learn.minutes", {
                                count: Math.max(1, Math.round(lesson.durationSec / 60)),
                              })}
                            </span>
                          )}
                        </span>
                        <TalentIcon name="suivant" />
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {!attempt.passed && left === 0 && (
                <Notice tone="err">{t("apprendre.quiz.noAttempt")}</Notice>
              )}
              <div className="t-verre t-fort t-bas-f">
                {attempt.passed ? (
                  <Link
                    href={nextLesson ? lessonHref(nextLesson.id) : coursePath}
                    className="t-bt t-p t-pl t-press"
                  >
                    {nextLesson ? t("apprendre.lesson.next") : t("apprendre.course.back")}
                  </Link>
                ) : (
                  <>
                    {review[0] && (
                      <Link href={lessonHref(review[0].id)} className="t-bt t-sec t-m t-press">
                        {t("apprendre.quiz.reread")}
                      </Link>
                    )}
                    {left !== 0 && (
                      <Link href={lessonHref(current.id)} className="t-bt t-p t-pl t-press">
                        {t("apprendre.quiz.retry")}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Computer and tablet: each answer, what Orbi noticed, the attempts. */}
          <div className="t-aw-2 t-aw-qr2 t-ap-web">
            <section className="t-aw-col" aria-labelledby="qz-rep">
              <h2 id="qz-rep" className="t-ck-t">
                {t("apprendre.web.quiz.answers")}
              </h2>
              <ol className="t-verre t-liste t-lignes">
                {quiz.questions.map((question, index) => {
                  const ok = marks[index]?.correct ?? false;
                  return (
                    <li key={question.id} className="t-li">
                      <span className={cx("t-cases", ok ? "t-c1" : "t-aw-ko")} aria-hidden>
                        <TalentIcon name={ok ? "valider" : "fermer"} size="s" />
                      </span>
                      <span className="t-t">
                        <b>{t("apprendre.web.quiz.question", { number: index + 1 })}</b>
                        <span className="t-aw-rep">
                          <span>{question.prompt}</span>
                          <span>
                            {" · "}
                            {ok ? t("apprendre.web.quiz.right") : t("apprendre.web.quiz.toReview")}
                          </span>
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
            <section className="t-aw-col" aria-labelledby="qz-orbi">
              <h2 id="qz-orbi" className="t-ck-t">
                {t("apprendre.web.quiz.orbi")}
              </h2>
              {wrong > 0 && (
                <div className="t-verre t-carte t-sugg">
                  <OrbiMark size={36} />
                  <div className="t-t">
                    <small>{t("apprendre.web.quiz.orbiLabel")}</small>
                    <b>{t("apprendre.web.quiz.orbiText", { wrong })}</b>
                  </div>
                </div>
              )}
              <div className="t-verre t-carte t-sugg">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="lecon" size="s" />
                </span>
                <div className="t-t">
                  <small>
                    {left === null
                      ? t("apprendre.web.quiz.unlimited")
                      : t("apprendre.web.quiz.limited")}
                  </small>
                  <b>
                    {left === null
                      ? t("apprendre.web.quiz.unlimitedText")
                      : left === 0
                        ? t("apprendre.quiz.noAttempt")
                        : t("apprendre.quiz.attempts", { count: left })}
                  </b>
                </div>
              </div>
            </section>
          </div>
        </div>
      );
    }

    const need = Math.ceil((quiz.passingScore * quiz.questions.length) / 100);
    return (
      <div className="t-flux t-od-bas t-large t-aw t-aw-quiz">
        {head}
        <WebHead
          title={quizTitle}
          sub={t("apprendre.web.quiz.sub", {
            module: current.module.title,
            need,
            total: quiz.questions.length,
          })}
        />
        {error && <Notice tone="err">{d(`learn.error.${error}`)}</Notice>}
        {left === 0 ? (
          <Notice tone="err">{t("apprendre.quiz.noAttempt")}</Notice>
        ) : (
          <>
            {left !== null && (
              <p className="t-pas-t">{t("apprendre.quiz.attempts", { count: left })}</p>
            )}
            <QuizSteps
              slug={course.slug}
              lessonId={current.id}
              questions={quiz.questions.map((question) => ({
                id: question.id,
                type: question.type,
                prompt: question.prompt,
                options: question.options,
              }))}
              labels={{
                step: t("apprendre.quiz.step", {
                  current: "{current}",
                  total: quiz.questions.length,
                }),
                stepAria: t("apprendre.quiz.step", {
                  current: "{current}",
                  total: quiz.questions.length,
                }),
                right: t("apprendre.quiz.right"),
                wrong: t("apprendre.quiz.wrong"),
                kept: t("apprendre.quiz.kept"),
                validate: t("apprendre.quiz.validate"),
                next: t("apprendre.quiz.next"),
                finish: t("apprendre.quiz.finish"),
                offline: t("apprendre.quiz.offline"),
                textLabel: t("apprendre.quiz.textLabel"),
                multiple: t("apprendre.quiz.multiple"),
                expected: t("apprendre.quiz.expected", { answer: "{answer}" }),
                outline: t("apprendre.web.quiz.questions"),
                outlinePosition: t("apprendre.web.quiz.position", {
                  current: "{current}",
                  total: quiz.questions.length,
                }),
                question: t("apprendre.web.quiz.question", { number: "{number}" }),
              }}
            />
          </>
        )}
      </div>
    );
  }

  // ── Exercice à rendre ────────────────────────────────────────────────────
  const outline = lessonOutline(current.content);
  const paragraphs = lessonParagraphs(current.content);
  if (current.kind === "exercise" && !locked && follows) {
    const [cvs, submissions] = await Promise.all([
      db.document.findMany({
        where: { kind: "cv", profile: { userId: user.id } },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
        select: { id: true, title: true, updatedAt: true },
        take: 10,
      }),
      exerciseSubmissions(db, user.id, current.id),
    ]);
    const steps = outline.steps.length > 0 ? outline.steps.map((step) => step.title) : paragraphs;
    const problem = param("exercice");
    return (
      <form action={submitExerciseAction} className="t-flux t-od-bas t-large t-aw t-aw-ex">
        <FullFrame />
        <input type="hidden" name="slug" value={course.slug} />
        <input type="hidden" name="lesson" value={current.id} />
        <WebHead
          title={t("apprendre.exercise.title")}
          sub={t("apprendre.web.exercise.sub", {
            course: course.title,
            module: current.module.order,
          })}
        />
        <FlowHead
          back={coursePath}
          backLabel={t("apprendre.course.back")}
          title={t("apprendre.exercise.title")}
          end={
            <Link href={coursePath} className="t-bi t-press" aria-label={t("apprendre.done.close")}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
        {problem && ["taille", "vide", "format"].includes(problem) && (
          <Notice tone="err">{d(`apprendre.exercise.error.${problem}`)}</Notice>
        )}
        <div className="t-aw-2">
          <div className="t-aw-col">
            <section className="t-verre t-consigne" aria-labelledby="ex-titre">
              <h2 id="ex-titre">{current.title}</h2>
              {outline.brief && <p className="t-texte-l">{outline.brief}</p>}
              {steps.length > 0 && (
                <ol>
                  {steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </section>
            <div className="t-verre t-carte t-sugg t-aw-ex-o">
              <OrbiMark size={36} />
              <div className="t-t">
                <small>{t("apprendre.exercise.orbi.label")}</small>
                <b>{t("apprendre.exercise.orbi.text")}</b>
              </div>
            </div>
          </div>
          <div className="t-aw-col">
            <FileDrop
              name="fichier"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              label={t("apprendre.exercise.drop")}
              hint={t("apprendre.exercise.dropHint")}
            />
            {cvs.length > 0 && (
              <SheetButton target="ex-cv" className="t-verre t-pj t-press text-left">
                <span className="t-cases" style={{ background: "var(--g-former)" }} aria-hidden>
                  <TalentIcon name="cv" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("apprendre.exercise.cv")}</b>
                  <span>
                    {[cvs[0]!.title, format.dateTime(cvs[0]!.updatedAt, { month: "long" })].join(
                      " · ",
                    )}
                  </span>
                </span>
                <TalentIcon name="suivant" size="s" />
              </SheetButton>
            )}
            <div className="t-verre t-fort t-bas-f">
              <button type="submit" className="t-bt t-p t-pl t-press">
                {submissions.length > 0
                  ? t("apprendre.exercise.again")
                  : t("apprendre.exercise.send")}
              </button>
            </div>
            {submissions.length > 0 && (
              <>
                <span className="t-ck-t t-aw-ex-s">{t("apprendre.exercise.sent")}</span>
                <ul className="t-flux t-serre t-aw-ex-s">
                  {submissions.map((item) => (
                    <li key={item.id} className="t-ajoute">
                      <TalentIcon name="valider" size="s" />
                      <span>
                        {t("apprendre.exercise.sentLine", {
                          name: item.fileName ?? t("apprendre.exercise.file"),
                          date: format.dateTime(item.createdAt, { day: "numeric", month: "short" }),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        {cvs.length > 0 && (
          <Sheet id="ex-cv" title={t("apprendre.exercise.cv")} closeLabel={t("offer.close")}>
            <fieldset className="t-choix">
              <legend className="sr-only">{t("apprendre.exercise.cv")}</legend>
              {cvs.map((cv) => (
                <label key={cv.id} className="t-ch t-press">
                  <input type="radio" name="cv" value={cv.id} className="sr-only" />
                  <span className="t-t">
                    <b>{cv.title}</b>
                    <span>
                      {t("apprendre.exercise.cvUpdated", {
                        date: format.dateTime(cv.updatedAt, { day: "numeric", month: "short" }),
                      })}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("apprendre.exercise.send")}
            </button>
          </Sheet>
        )}
      </form>
    );
  }

  // ── Salle de cours (§ 5, 6 and 9) ───────────────────────────────────────
  const playback =
    current.kind === "video" && !locked ? videoProvider().playback(current.videoId) : null;
  const resumeSeconds = playback && follows ? await lessonResume(db, user.id, current.id) : 0;
  const cues = transcriptCues(current.transcript);
  const resources = parseResources(current.resources);
  const viewer = await documentViewer(db, user, course);
  const documents = (await visibleDocuments(db, course, viewer)).filter(
    (document) => document.lessonId === current.id || !document.lessonId,
  );
  const notes = follows
    ? await db.lessonNote.findMany({
        where: { userId: user.id, lessonId: current.id },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const size = (bytes: number) =>
    bytes < 1024 * 1024
      ? t("learn.documents.size.kb", { size: Math.max(1, Math.round(bytes / 1024)) })
      : t("learn.documents.size.mb", {
          size: (bytes / (1024 * 1024)).toFixed(1).replace(".", ","),
        });
  const lead = outline.brief ?? paragraphs[0] ?? null;
  const isDone = done.has(current.id);
  const supportRow = (
    <div className="t-verre t-dl">
      <span className="t-cases t-g-former" aria-hidden>
        <TalentIcon name="telecharger" size="s" />
      </span>
      <span className="t-t">
        <b>{t("apprendre.lesson.support")}</b>
        <span>{t("apprendre.lesson.supportHint")}</span>
      </span>
      <a href={`${coursePath}/support`} className="t-bt t-sec t-s t-press" download>
        {t("apprendre.lesson.download")}
      </a>
    </div>
  );

  const lessonPanel = (
    <>
      {locked ? (
        <div className="t-verrou">
          <TalentIcon name="cadenas" size="s" />
          <div className="t-t">
            <b>{t("apprendre.lesson.jobLocked")}</b>
            {t("apprendre.lesson.jobLockedText")}
          </div>
        </div>
      ) : (
        <>
          {lead && <p className="t-texte-l">{lead}</p>}
          {outline.takeaways.length > 0 && (
            <ul className="t-flux t-serre">
              {outline.takeaways.map((item, index) => (
                <li key={index} className="t-ajoute">
                  <TalentIcon name="valider" size="s" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {!lead && outline.takeaways.length === 0 && (
            <p className="t-vide-t">{t("apprendre.lesson.noText")}</p>
          )}
          {follows && (
            <SheetButton target="lc-orbi" className="t-verre t-prep t-press t-ap-mob text-left">
              <OrbiMark size={40} />
              <span className="t-t">
                <b>{t("apprendre.lesson.orbi.title")}</b>
                <span>{t("apprendre.lesson.orbi.text")}</span>
              </span>
              <TalentIcon name="suivant" size="s" />
            </SheetButton>
          )}
        </>
      )}
    </>
  );
  const textPanel =
    paragraphs.length > 0 || cues.length > 0 ? (
      <div className="t-verre t-carte t-texte-l t-lecture">
        {paragraphs.map((paragraph, index) => (
          <p key={`p-${index}`}>{paragraph}</p>
        ))}
        {cues.length > 0 && (
          <>
            <h3>{t("apprendre.lesson.transcript")}</h3>
            {cues.map((cue, index) => (
              <p key={`c-${index}`}>
                {cue.at !== null && <small>{clock(cue.at)} </small>}
                {cue.text}
              </p>
            ))}
          </>
        )}
      </div>
    ) : (
      <p className="t-vide-t">{t("apprendre.lesson.noText")}</p>
    );
  const notesPanel = follows ? (
    <div id="notes" className="t-flux t-serre scroll-mt-24">
      {param("note") === "1" && <Notice tone="ok">{t("apprendre.lesson.notes.saved")}</Notice>}
      {notes.length > 0 && (
        <ul className="t-verre t-liste t-lignes">
          {notes.map((note) => (
            <li key={note.id} className="t-li">
              <span className="t-t">
                <span>
                  {format.dateTime(note.createdAt, { dateStyle: "short", timeStyle: "short" })}
                </span>
                <b className="font-normal whitespace-pre-line">{note.body}</b>
              </span>
              <form action={deleteNoteAction}>
                <input type="hidden" name="slug" value={course.slug} />
                <input type="hidden" name="lesson" value={current.id} />
                <input type="hidden" name="note" value={note.id} />
                <button
                  type="submit"
                  className="t-bi t-press"
                  aria-label={t("apprendre.lesson.notes.delete")}
                >
                  <TalentIcon name="supprimer" size="s" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={addNoteAction} className="t-flux t-serre">
        <input type="hidden" name="slug" value={course.slug} />
        <input type="hidden" name="lesson" value={current.id} />
        <div className="t-champ">
          <label htmlFor="lc-note">{t("apprendre.lesson.notes.label")}</label>
          <textarea
            id="lc-note"
            name="body"
            maxLength={NOTE_MAX}
            required
            rows={4}
            className="t-verre t-zone-t"
            placeholder={t("apprendre.lesson.notes.placeholder")}
          />
        </div>
        <button type="submit" className="t-bt t-sec t-s t-press self-start">
          {t("apprendre.lesson.notes.save")}
        </button>
      </form>
      {notes.length === 0 && <p className="t-aide">{t("apprendre.lesson.notes.empty")}</p>}
    </div>
  ) : (
    <p className="t-vide-t">{t("apprendre.lesson.notes.preview")}</p>
  );
  const filesPanel = (
    <>
      {!locked &&
        resources.map((resource) => (
          <div key={resource.url} className="t-verre t-dl">
            <span className="t-cases t-g-accomp" aria-hidden>
              <TalentIcon name="document" size="s" />
            </span>
            <span className="t-t">
              <b>{resource.title}</b>
              <span>
                {resource.sizeKb
                  ? [resource.type, size(resource.sizeKb * 1024)].join(" · ")
                  : resource.type}
              </span>
            </span>
            <a
              href={resource.url}
              download
              className="t-bt t-sec t-s t-press"
              aria-label={t("apprendre.lesson.downloadNamed", { title: resource.title })}
            >
              {t("apprendre.lesson.download")}
            </a>
          </div>
        ))}
      {documents.map((document) => (
        <div key={document.id} className="t-verre t-dl">
          <span className="t-cases t-g-accomp" aria-hidden>
            <TalentIcon name="document" size="s" />
          </span>
          <span className="t-t">
            <b>{document.title}</b>
            <span>
              {t("learn.documents.meta", {
                kind: t(`learn.documents.kind.${documentKind(document.kind)}`),
                pages: document.pages,
                size: size(document.size),
              })}
            </span>
          </span>
          <a
            href={documentHref(document.id)}
            className="t-bt t-sec t-s t-press"
            aria-label={t("apprendre.lesson.downloadNamed", { title: document.title })}
          >
            {t("apprendre.lesson.download")}
          </a>
        </div>
      ))}
      {follows && supportRow}
    </>
  );

  const reachableIds = new Set(reachable.map((lesson) => lesson.id));
  const modulePosition = course.modules.findIndex((module) => module.id === current.module.id) + 1;
  const plan = (
    <nav aria-labelledby="lc-plan" className="t-verre t-aw-plan">
      <h2 id="lc-plan">
        <Link href={coursePath} className="t-lien-d">
          {course.title}
        </Link>
        <span>
          {t("apprendre.web.lesson.position", {
            current: modulePosition,
            total: course.modules.length,
          })}
        </span>
      </h2>
      {course.modules.map((module) => (
        <div key={module.id}>
          <p className="t-m">
            {t("apprendre.web.lesson.module", { number: module.order, title: module.title })}
          </p>
          <ol>
            {module.lessons.map((lesson, index) => {
              const on = lesson.id === current.id;
              const ok = !on && done.has(lesson.id);
              const label = lesson.quiz
                ? t("apprendre.mine.questions", { count: lesson.quiz._count.questions })
                : lesson.durationSec > 0
                  ? t("forMe.learn.minutes", {
                      count: Math.max(1, Math.round(lesson.durationSec / 60)),
                    })
                  : null;
              return (
                <li key={lesson.id} className={cx("t-l", ok && "t-ok", on && "t-on")}>
                  <i aria-hidden>
                    {ok ? (
                      <TalentIcon name="valider" size="xs" />
                    ) : lesson.kind === "quiz" ? (
                      <TalentIcon name="quiz" size="xs" />
                    ) : (
                      index + 1
                    )}
                  </i>
                  {reachableIds.has(lesson.id) && !on ? (
                    <Link href={lessonHref(lesson.id)}>{lesson.title}</Link>
                  ) : (
                    <span aria-current={on ? "step" : undefined}>{lesson.title}</span>
                  )}
                  {ok && <span className="sr-only">{t("apprendre.web.lesson.done")}</span>}
                  {label && <small>{label}</small>}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="t-flux t-od-bas t-large t-aw t-aw-salle">
      <div className="t-aw-2">
        <div className="t-aw-col">
          {current.kind === "video" && !locked ? (
            <div className="t-video">
              {playback?.youtube ? (
                <YouTubeEmbed id={playback.youtube} title={current.title} />
              ) : playback ? (
                <VideoPlayer
                  variant="talent"
                  src={playback.src}
                  poster={playback.poster}
                  lowMp4={playback.lowMp4}
                  title={current.title}
                  chip={
                    <QualityChip
                      target="lc-reglages"
                      label={t("apprendre.lesson.settings.title")}
                      auto={t("apprendre.lesson.settings.chipAuto")}
                      low={t("apprendre.lesson.settings.chipLow")}
                    />
                  }
                  labels={{
                    quality: t("learn.player.quality.text"),
                    auto: t("learn.player.quality.auto"),
                    low: t("learn.player.quality.low"),
                    speed: t("learn.player.speed.text"),
                    speedValues: {},
                    error: t("learn.player.error.text"),
                    retry: t("learn.player.error.retry"),
                    lowBandwidth: t("learn.player.lowBandwidth"),
                    textOnly: t("apprendre.lesson.textOnly"),
                  }}
                  resume={
                    follows
                      ? {
                          lessonId: current.id,
                          at: resumeSeconds,
                          endpoint: "/api/learn/position",
                          resumed: t("learn.player.resume.text", { time: clock(resumeSeconds) }),
                          restart: t("learn.player.resume.restart"),
                        }
                      : undefined
                  }
                />
              ) : (
                <p className="t-video-off">{t("learn.player.noVideo")}</p>
              )}
              <span className="t-ret">
                <BackButton
                  fallback={coursePath}
                  label={t("apprendre.course.back")}
                  className="t-press"
                />
              </span>
            </div>
          ) : (
            <FlowHead
              back={coursePath}
              backLabel={t("apprendre.course.back")}
              end={
                <SheetButton
                  target="lc-reglages"
                  className="t-bi t-press"
                  label={t("apprendre.lesson.settings.title")}
                >
                  <TalentIcon name="reglages" size="s" />
                </SheetButton>
              }
            >
              {/* The lesson carries the page title: the course name is only its context. */}
              <p className="t-h1">{course.title}</p>
            </FlowHead>
          )}

          <div className="t-lec-t">
            <small>{where}</small>
            <h1>{current.title}</h1>
          </div>
          {param("inscrit") === "1" && <Notice tone="ok">{t("apprendre.lesson.enrolled")}</Notice>}
          {param("module") && (
            <Notice tone="ok">
              {t("apprendre.lesson.moduleDone", { module: param("module")! })}
            </Notice>
          )}
          {!follows && <Notice>{t("apprendre.lesson.preview")}</Notice>}

          <LessonTabs
            label={t("apprendre.lesson.tabs")}
            tabs={[
              { id: "lecon", label: t("apprendre.lesson.tab.lesson"), panel: lessonPanel },
              { id: "texte", label: t("apprendre.lesson.tab.text"), panel: textPanel },
              { id: "notes", label: t("apprendre.lesson.tab.notes"), panel: notesPanel },
              { id: "fichiers", label: t("apprendre.lesson.tab.files"), panel: filesPanel },
            ]}
          />

          <div className="t-verre t-fort t-bas-f t-aw-lnav">
            <Link
              href={previous ? lessonHref(previous.id) : coursePath}
              className="t-bi t-press t-bi-g t-ap-mob"
              aria-label={previous ? t("apprendre.lesson.previous") : t("apprendre.course.back")}
            >
              <TalentIcon name="retour" size="s" />
            </Link>
            <Link
              href={previous ? lessonHref(previous.id) : coursePath}
              className="t-bt t-sec t-m t-press t-ap-web"
            >
              <TalentIcon name="retour" size="xs" />
              {previous ? t("apprendre.lesson.previous") : t("apprendre.course.back")}
            </Link>
            {follows && !isDone && !locked ? (
              <form action={completeLessonAction} className="contents">
                <input type="hidden" name="slug" value={course.slug} />
                <input type="hidden" name="lesson" value={current.id} />
                <button type="submit" className="t-bt t-p t-pl t-press">
                  {next ? t("apprendre.lesson.next") : t("apprendre.lesson.finish")}
                  <TalentIcon name="suivant" size="xs" className="t-ap-web" />
                </button>
              </form>
            ) : next ? (
              <Link href={lessonHref(next.id)} className="t-bt t-p t-pl t-press">
                {t("apprendre.lesson.next")}
                <TalentIcon name="suivant" size="xs" className="t-ap-web" />
              </Link>
            ) : (
              <Link href={coursePath} className={cx("t-bt t-p t-pl t-press")}>
                {follows ? t("apprendre.course.back") : t("apprendre.course.plans")}
              </Link>
            )}
          </div>
        </div>

        {/* Computer and tablet: the plan of the course, Orbi to explain, the PDF support. */}
        <aside aria-label={t("apprendre.web.lesson.plan")} className="t-aw-side t-ap-web">
          {plan}
          {follows && !locked && (
            <SheetButton target="lc-orbi" className="t-verre t-prep t-press text-left">
              <OrbiMark size={40} />
              <span className="t-t">
                <b>{t("apprendre.lesson.orbi.title")}</b>
                <span>{t("apprendre.lesson.orbi.text")}</span>
              </span>
              <TalentIcon name="suivant" size="s" />
            </SheetButton>
          )}
          {follows && supportRow}
        </aside>
      </div>

      {follows && !locked && (
        <Sheet
          id="lc-orbi"
          title={t("apprendre.lesson.orbi.title")}
          closeLabel={t("offer.close")}
          className="t-aw-volet"
          head={
            <div className="t-or-tete">
              <OrbiMark size={40} />
              <div className="t-t">
                <b>{t("apprendre.lesson.orbi.name")}</b>
                <span>{t("apprendre.lesson.orbi.where", { course: course.title })}</span>
              </div>
            </div>
          }
        >
          <LessonOrbi
            slug={course.slug}
            lessonId={current.id}
            labels={{
              intro: t("apprendre.lesson.orbi.intro"),
              you: t("apprendre.lesson.orbi.you"),
              orbi: t("apprendre.lesson.orbi.name"),
              thinking: t("apprendre.lesson.orbi.thinking"),
              source: t("apprendre.lesson.orbi.source", { lessons: "{lessons}" }),
              sourceCourse: t("apprendre.lesson.orbi.sourceCourse", { lessons: "{lessons}" }),
              another: t("apprendre.lesson.orbi.another"),
              test: t("apprendre.lesson.orbi.test"),
              label: t("apprendre.lesson.orbi.label"),
              placeholder: t("apprendre.lesson.orbi.placeholder"),
              send: t("apprendre.lesson.orbi.send"),
              failed: t("apprendre.lesson.orbi.failed"),
              explainAsk: t("apprendre.lesson.orbi.explainAsk"),
              anotherAsk: t("apprendre.lesson.orbi.anotherAsk"),
              testAsk: t("apprendre.lesson.orbi.testAsk"),
              limit: {
                consent: t("apprendre.lesson.orbi.limit.consent"),
                entitlement: t("apprendre.lesson.orbi.limit.entitlement"),
                quota: t("apprendre.lesson.orbi.limit.quota"),
                unavailable: t("apprendre.lesson.orbi.limit.unavailable"),
              },
              plans: t("apprendre.lesson.orbi.plans"),
              consent: t("apprendre.lesson.orbi.consent"),
            }}
          />
        </Sheet>
      )}

      <Sheet
        id="lc-reglages"
        title={t("apprendre.lesson.settings.title")}
        closeLabel={t("offer.close")}
      >
        <LessonSettings
          labels={{
            quality: t("apprendre.lesson.settings.quality"),
            qualityAuto: t("apprendre.lesson.settings.qualityAuto"),
            qualityLow: t("apprendre.lesson.settings.qualityLow"),
            valueAuto: t("apprendre.lesson.settings.valueAuto"),
            valueLow: t("apprendre.lesson.settings.valueLow"),
            saver: t("apprendre.lesson.settings.saver"),
            saverText: t("apprendre.lesson.settings.saverText"),
            textOnly: t("apprendre.lesson.settings.textOnly"),
            textOnlyText: t("apprendre.lesson.settings.textOnlyText"),
          }}
        />
        {follows && supportRow}
        <p className="t-gar">
          <TalentIcon name="horloge" size="s" />
          {t("apprendre.lesson.settings.position")}
        </p>
      </Sheet>
    </div>
  );
}

/** The answers kept with an attempt (`{ [questionId]: string[] }`), read without trusting the JSON. */
function answersOf(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([id, list]) => [
      id,
      Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : [],
    ]),
  );
}
