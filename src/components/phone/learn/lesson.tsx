"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import {
  VideoPlayer,
  type VideoPlayerLabels,
  type VideoResume,
} from "@/components/learn/video-player";
import { YouTubeEmbed } from "@/components/learn/youtube-embed";
import { showToast } from "@/components/motion/toaster";
import { submitExerciseAction, submitQuizAction } from "@/server/actions/learn";
import { finishLessonAction, lessonCheckAction } from "@/server/actions/learn-phone";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { askOrbi } from "../orbi-bus";
import { PhoneSheet } from "../sheet";
import type { LessonNotion } from "@/server/services/lesson-notes";
import { CourseCover, ReadMore } from "./parts";

export type LessonView = {
  id: string;
  slug: string;
  courseHref: string;
  courseShort: string;
  num: number;
  /** « Leçon 3 sur 8 ». */
  position: string;
  percent: number;
  title: string;
  /** « 14 min ». */
  duration: string;
  /** The lesson has French subtitles (a transcript). */
  captions: boolean;
  /** Who teaches the course (Course.instructor). */
  instructor: { name: string; initials: string } | null;
  tone: number;
  video: {
    src: string;
    /** A YouTube lesson, played in the embedded player. */
    youtube: string | null;
    poster: string | null;
    lowMp4: string | null;
    length: string;
    captions: boolean;
    labels: VideoPlayerLabels;
    resume: VideoResume | null;
  } | null;
  lead: string | null;
  /** The course's cover, shown over the video until it plays. */
  cover: string | null;
  /** A video lesson: « Résumé » and « Notions clés » under the video (lesson-notes.ts). */
  summary: string | null;
  notions: LessonNotion[];
  takeaways: string[];
  check: { question: string; options: string[] } | null;
  kind: "video" | "text" | "exercise" | "quiz" | "resource";
  quiz: {
    passing: number;
    questions: {
      id: string;
      prompt: string;
      type: "single" | "multiple" | "text";
      options: string[];
    }[];
    result: string | null;
    passed: boolean;
  } | null;
  exerciseProblem: string | null;
  done: boolean;
  follows: boolean;
  previous: string | null;
  nextLabel: string;
  /** « Débloquer avec Pro », for the free lesson of a course above the plan. */
  unlock: string | null;
  /** The supports of the lesson (PDF…), in its menu. */
  files: { title: string; href: string }[];
  /** What Orbi is told about the lesson. */
  context: string;
};

const SPEEDS = [1, 1.25, 1.5] as const;

/** The band of a lesson (planche Formation, « Leçon »): a little chart on the course's colour. */
function LessonArt() {
  return (
    <svg viewBox="0 0 390 206" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="#FFFFFF" fillOpacity=".85">
        <rect x="70" y="110" width="36" height="56" rx="5" />
        <rect x="122" y="80" width="36" height="86" rx="5" />
        <rect x="174" y="96" width="36" height="70" rx="5" />
      </g>
      <rect x="226" y="52" width="36" height="114" rx="5" fill="#A6F26B" />
      <path d="M60 166h250" stroke="#FFFFFF" strokeOpacity=".6" strokeWidth="3" />
    </svg>
  );
}

/**
 * A lesson (planche Formation, « Leçon », feuille -menu de la leçon). The quick question must be
 * answered before « Leçon suivante »; the answer is corrected at once and nothing is recorded.
 */
export function PhoneLesson({ view }: { view: LessonView }) {
  const t = useTranslations("phoneLearn");
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [menu, setMenu] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [captions, setCaptions] = useState(true);
  const [choice, setChoice] = useState<number | null>(null);
  const [answer, setAnswer] = useState<{
    correct: boolean;
    answer: number;
    explanation: string | null;
  } | null>(null);
  const [pending, start] = useTransition();
  const videoBox = useRef<HTMLDivElement>(null);

  const video = () => videoBox.current?.querySelector("video") ?? null;
  const applySpeed = (value: number) => {
    const element = video();
    if (element) element.playbackRate = value;
  };
  const applyCaptions = (on: boolean) => {
    const element = video();
    if (!element) return;
    for (const track of Array.from(element.textTracks)) track.mode = on ? "showing" : "hidden";
  };

  const pick = (index: number) => {
    if (answer || pending) return;
    setChoice(index);
    start(async () => {
      const result = await lessonCheckAction(view.id, index).catch(() => null);
      if (!result?.ok) {
        setChoice(null);
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      setAnswer(result.value);
    });
  };

  const needsCheck = Boolean(view.check) && !answer && !view.done;
  const quizOpen = view.kind === "quiz" && !view.done && !view.quiz?.passed;
  const exerciseOpen = view.kind === "exercise" && !view.done;

  const next = () => {
    if (needsCheck) {
      showToast({ message: t("lesson.answerFirst") });
      return;
    }
    if (quizOpen) {
      showToast({ message: t("lesson.quizFirst") });
      return;
    }
    if (exerciseOpen) {
      showToast({ message: t("lesson.exerciseFirst") });
      return;
    }
    start(async () => {
      const result = await finishLessonAction(view.id).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      if (!result.value.certificate && !view.done)
        showToast({ message: t("lesson.doneToast", { n: view.num }) });
      router.push(result.value.href);
    });
  };

  return (
    <div className="nb-page nb-fo nb-fo-lecon-p">
      <header className="nb-barre nb-ex-barre">
        <PhoneBack fallback={view.courseHref} label={view.courseShort} history={false} />
        {/* Two lines that never wrap: the course small, the position under it (01/11/2026). */}
        <span className="nb-fo-pos">
          <small>{view.courseShort}</small>
          <b>{view.position}</b>
        </span>
        <button
          type="button"
          className="nb-fo-plus"
          aria-label={t("lesson.settings")}
          onClick={() => setMenu(true)}
        >
          <PhoneIcon name="plusOptions" size={20} />
        </button>
      </header>
      <span className="nb-fo-barre" data-plat="" aria-hidden>
        <i style={{ width: `${view.percent}%` }} />
      </span>

      {view.video?.youtube ? (
        view.cover && !playing ? (
          <button
            type="button"
            className="nb-fo-ecran"
            data-ton={view.tone}
            data-couv=""
            aria-label={t("lesson.play")}
            onClick={() => setPlaying(true)}
          >
            <CourseCover src={view.cover} />
            <span className="nb-fo-play" aria-hidden>
              <PhoneIcon name="lecture" size={18} fill="currentColor" />
              {t("lesson.play")}
            </span>
          </button>
        ) : (
          <div className="nb-fo-video">
            <YouTubeEmbed id={view.video.youtube} title={view.title} autoplay={playing} />
          </div>
        )
      ) : view.video ? (
        playing ? (
          <div className="nb-fo-video" ref={videoBox}>
            <VideoPlayer
              variant="talent"
              src={view.video.src}
              poster={view.video.poster ?? undefined}
              lowMp4={view.video.lowMp4 ?? undefined}
              title={view.title}
              labels={view.video.labels}
              resume={view.video.resume ?? undefined}
            />
          </div>
        ) : (
          <button
            type="button"
            className="nb-fo-ecran"
            data-ton={view.tone}
            aria-label={t("lesson.play")}
            onClick={() => {
              setPlaying(true);
              requestAnimationFrame(() => {
                applySpeed(speed);
                applyCaptions(captions);
                void video()
                  ?.play()
                  .catch(() => {});
              });
            }}
          >
            {view.cover ? <CourseCover src={view.cover} /> : <LessonArt />}
            <span className="nb-fo-play" aria-hidden>
              <PhoneIcon name="lecture" size={18} fill="currentColor" />
              {t("lesson.play")}
            </span>
          </button>
        )
      ) : (
        <div className="nb-fo-ecran" data-ton={view.tone} aria-hidden>
          <LessonArt />
        </div>
      )}

      <div className="nb-fo-bloc" data-sans-filet="" data-tete="">
        <h1 className="nb-fo-titre" data-petit="">
          {view.title}
        </h1>
        {view.instructor ? (
          <p className="nb-fo-prof">
            <span className="nb-fo-prof-av" aria-hidden>
              {view.instructor.initials}
            </span>
            <span>
              {t("lesson.with")} <b>{view.instructor.name}</b>
              <small className="nb-meta">{t("lesson.teacher")}</small>
            </span>
          </p>
        ) : null}
        {/* The duration, the subtitles and Orbi on one line, with the menu's icons (01/11/2026). */}
        <div className="nb-fo-puces">
          <span
            className="nb-fo-puce"
            aria-label={t("lesson.duration", { duration: view.duration })}
          >
            <PhoneIcon name="horloge" size={15} stroke={2} />
            {view.duration}
          </span>
          {view.captions ? (
            <span className="nb-fo-puce">
              <PhoneIcon name="sousTitres" size={15} stroke={2} />
              {t("lesson.captionsChip")}
            </span>
          ) : null}
          {view.kind !== "quiz" ? (
            <button
              type="button"
              className="nb-fo-puce"
              data-orbi=""
              aria-label={t("lesson.askOrbi")}
              onClick={() =>
                askOrbi(`${t("lesson.explain", { lesson: view.title })} (${view.context})`)
              }
            >
              <OrbiDisc size={18} />
              {t("lesson.orbiChip")}
            </button>
          ) : null}
        </div>
        {view.lead ? <p className="nb-fo-texte">{view.lead}</p> : null}
      </div>

      {view.summary || view.notions.length > 0 ? (
        <ReadMore long={(view.summary?.length ?? 0) > 260 || view.notions.length > 3}>
          {(open) => (
            <>
              {view.summary ? (
                <section className="nb-fo-bloc" aria-labelledby="fo-resume">
                  <h2 id="fo-resume">{t("lesson.summary")}</h2>
                  <p
                    className="nb-fo-texte"
                    data-paragraphes=""
                    data-replie={open ? undefined : ""}
                  >
                    {view.summary}
                  </p>
                </section>
              ) : null}
              {view.notions.length > 0 ? (
                <section className="nb-fo-bloc" data-sans-filet="" aria-labelledby="fo-notions">
                  <h2 id="fo-notions">{t("lesson.notions")}</h2>
                  <ol className="nb-fo-notions">
                    {(open ? view.notions : view.notions.slice(0, 3)).map((notion, index) => (
                      <li key={`${index}-${notion.text.slice(0, 20)}`}>
                        {notion.title ? (
                          <h3>
                            {t("lesson.notionNumber", { n: index + 1 })} {notion.title}
                          </h3>
                        ) : (
                          <span className="nb-fo-notion-n" aria-hidden>
                            {index + 1}
                          </span>
                        )}
                        <p>{notion.text}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
            </>
          )}
        </ReadMore>
      ) : null}

      {view.takeaways.length > 0 ? (
        <section className="nb-fo-bloc" aria-labelledby="fo-retenir">
          <h2 id="fo-retenir">{t("lesson.takeaways")}</h2>
          <ul className="nb-fo-points">
            {view.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {view.check ? (
        <section className="nb-fo-bloc" data-sans-filet="" aria-labelledby="fo-question">
          <h2 id="fo-question">{t("lesson.quick")}</h2>
          <p className="nb-fo-q">{view.check.question}</p>
          <div className="nb-fo-reps" role="group" aria-labelledby="fo-question">
            {view.check.options.map((option, index) => {
              const right = answer && index === answer.answer;
              const wrong = answer && index === choice && !answer.correct;
              return (
                <button
                  key={option}
                  type="button"
                  className="nb-fo-rep"
                  data-etat={right ? "bonne" : wrong ? "fausse" : undefined}
                  aria-pressed={choice === index}
                  disabled={Boolean(answer) || pending}
                  onClick={() => pick(index)}
                >
                  <span>{option}</span>
                  <b aria-hidden>{right ? "✓" : wrong ? "×" : ""}</b>
                </button>
              );
            })}
          </div>
          {answer ? (
            <p className="nb-fo-retour" data-juste={answer.correct ? "" : undefined} role="status">
              {answer.correct ? t("lesson.right") : t("lesson.wrong")}
              {answer.explanation ? ` ${answer.explanation}` : ""}
            </p>
          ) : null}
          <button
            type="button"
            className="nb-fo-orbi"
            onClick={() =>
              askOrbi(`${t("lesson.explain", { lesson: view.title })} (${view.context})`)
            }
          >
            <OrbiDisc size={24} />
            {t("lesson.explainAction")}
          </button>
        </section>
      ) : null}

      {view.quiz ? (
        <form action={submitQuizAction} className="nb-fo-bloc nb-fo-quiz" data-sans-filet="">
          <input type="hidden" name="slug" value={view.slug} />
          <input type="hidden" name="lesson" value={view.id} />
          <p className="nb-meta">{t("quiz.rule", { passing: view.quiz.passing })}</p>
          {view.quiz.result ? (
            <p
              className="nb-fo-retour"
              data-juste={view.quiz.passed ? "" : undefined}
              role="status"
            >
              {view.quiz.result}
            </p>
          ) : null}
          {view.quiz.passed || view.done
            ? null
            : view.quiz.questions.map((question, index) => (
                <fieldset key={question.id} className="nb-fo-qz">
                  <legend className="nb-fo-q">
                    {t("quiz.number", { n: index + 1 })} {question.prompt}
                  </legend>
                  {question.type === "text" ? (
                    <input
                      className="nb-fo-in"
                      name={`q_${question.id}`}
                      aria-label={question.prompt}
                      maxLength={300}
                    />
                  ) : (
                    question.options.map((option, position) => (
                      <label key={`${question.id}-${position}`} className="nb-fo-rep">
                        <input
                          type={question.type === "single" ? "radio" : "checkbox"}
                          name={`q_${question.id}`}
                          value={String(position)}
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  )}
                </fieldset>
              ))}
          {view.quiz.passed || view.done ? null : (
            <button type="submit" className="nb-bouton" data-plein="" data-large="">
              {t("quiz.submit")}
            </button>
          )}
        </form>
      ) : null}

      {view.kind === "exercise" && view.follows && !view.done ? (
        <form
          action={submitExerciseAction}
          className="nb-fo-bloc nb-fo-quiz"
          data-sans-filet=""
          encType="multipart/form-data"
        >
          <input type="hidden" name="slug" value={view.slug} />
          <input type="hidden" name="lesson" value={view.id} />
          <h2>{t("exercise.title")}</h2>
          <p className="nb-meta">{t("exercise.text")}</p>
          {view.exerciseProblem ? (
            <p className="nb-fo-retour" role="alert">
              {t("exercise.problem")}
            </p>
          ) : null}
          <label className="nb-opt">
            <PhoneIcon name="trombone" size={20} />
            <span>
              {t("exercise.file")}
              <small>{t("exercise.fileLine")}</small>
            </span>
            <input type="file" name="fichier" accept="application/pdf,image/*" />
          </label>
          <button type="submit" className="nb-bouton" data-plein="" data-large="">
            {t("exercise.submit")}
          </button>
        </form>
      ) : null}

      <div className="nb-ex-bas">
        {view.previous ? (
          <Link href={view.previous} className="nb-ex-enreg nb-fo-prec">
            {t("lesson.previous")}
          </Link>
        ) : null}
        {view.unlock ? (
          <Link href="/app/abonnement" className="nb-bouton nb-fo-cta" data-plein="">
            {view.unlock}
          </Link>
        ) : (
          <button
            type="button"
            className="nb-bouton nb-fo-cta"
            data-plein=""
            data-attente={needsCheck || quizOpen || exerciseOpen ? "" : undefined}
            disabled={pending}
            onClick={next}
          >
            {view.nextLabel}
          </button>
        )}
      </div>

      <PhoneSheet
        open={menu}
        onClose={() => setMenu(false)}
        label={t("lesson.settings")}
        closeLabel={t("close")}
      >
        <p className="nb-fo-feuille-t">
          {view.position} · {view.title}
        </p>
        {view.video ? (
          <>
            <button
              type="button"
              className="nb-opt"
              onClick={() => {
                const value = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!;
                setSpeed(value);
                applySpeed(value);
              }}
            >
              <span>
                {t("lesson.speed", { speed: String(speed).replace(".", ",") })}
                <small>{t("lesson.touchToChange")}</small>
              </span>
            </button>
            {view.video.captions ? (
              <button
                type="button"
                className="nb-opt"
                onClick={() => {
                  setCaptions(!captions);
                  applyCaptions(!captions);
                }}
              >
                <span>
                  {captions ? t("lesson.captionsOn") : t("lesson.captionsOff")}
                  <small>{t("lesson.touchToChange")}</small>
                </span>
              </button>
            ) : null}
          </>
        ) : null}
        {view.files.map((file) => (
          <a key={file.href} href={file.href} className="nb-opt" download>
            <PhoneIcon name="document" size={20} />
            <span>
              {file.title}
              <small>{t("lesson.file")}</small>
            </span>
          </a>
        ))}
        <Link href="/app/compte/aide" className="nb-opt" data-alerte="">
          <span>
            {t("report")}
            <small>{t("reportLine")}</small>
          </span>
        </Link>
        <button type="button" className="nb-annuler" onClick={() => setMenu(false)}>
          {t("cancel")}
        </button>
      </PhoneSheet>
    </div>
  );
}
