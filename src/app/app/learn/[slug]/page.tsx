import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand/ai-orb";
import { CoachChat } from "@/components/learn/coach-chat";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { clock, initialsOf, moduleMinutes, speeds } from "@/components/learn/course-bits";
import { CourseOverview } from "@/components/learn/course-overview";
import { LessonNotes } from "@/components/learn/lesson-notes";
import { LessonTabs } from "@/components/learn/lesson-tabs";
import { LessonTranscript } from "@/components/learn/lesson-transcript";
import { QuizPanel } from "@/components/learn/quiz-panel";
import { VideoPlayer } from "@/components/learn/video-player";
import { lessonResume } from "@/server/services/lesson-progress";
import { Alert, ButtonLink } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { durationParts } from "@/lib/format";
import { videoProvider } from "@/server/adapters/video";
import { completeLessonAction } from "@/server/actions/learn";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { getPublicPlans } from "@/server/queries/public";
import {
  getLearnerCourse,
  JOB_EXERCISES_KEY,
  lessonOutline,
  lessonParagraphs,
  lessonsOf,
  parseResources,
  requiredLessons,
  transcriptCues,
} from "@/server/services/learn";
import { planForCatalogLevel, talentPlanFor } from "@/server/services/plans";
import { SuccessBurst } from "@/components/motion/success-burst";
import {
  CourseDocumentList,
  CoursePdfLinks,
  documentKind,
} from "@/components/learn/course-documents";
import { documentHref, documentViewer, visibleDocuments } from "@/server/services/course-documents";

export async function generateMetadata({
  params,
}: PageProps<"/app/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("learn.course");
  const course = await db.course.findFirst({
    where: { slug, status: "published" },
    select: { title: true },
  });
  return {
    title: t("seo", { title: course?.title ?? slug }),
    robots: { index: false },
  };
}

const errors = ["locked", "notEnrolled", "attempts", "invalid", "notFound"];

/**
 * A course for a signed-in talent (partie 07 § 3): the overview until they start, then the player
 * (`?lecon=`): video, text, exercise, resources, quiz, notes, progress and the attestation.
 */
export default async function LearnCoursePage({
  params,
  searchParams,
}: PageProps<"/app/learn/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/learn/${slug}`);
  const [found, plans] = await Promise.all([getLearnerCourse(db, user.id, slug), getPublicPlans()]);
  if (!found) notFound();
  const t = await getTranslations();
  const td = dynamic(t);
  const { course, enrollment, open, saved } = found;
  // Admin v3, étape 5: the PDF documents this talent may download.
  const documents = await visibleDocuments(db, course, await documentViewer(db, user, course));
  const requiredPlan = planForCatalogLevel(plans, course.requiredLevel);
  const param = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : undefined;
  const error = param("erreur");
  const errorAlert = error && errors.includes(error) && (
    <Alert tone="error" title={td(`learn.error.${error}`)} />
  );

  if (!enrollment || !open) {
    return (
      <>
        <AppPageHeader eyebrow={t("learn.course.eyebrow")} title={course.title} titleAs="p" />
        {errorAlert}
        {param("enregistre") === "1" && <Alert tone="success" title={t("learn.save.success")} />}
        {param("enregistre") === "0" && <Alert tone="info" title={t("learn.save.removed")} />}
        <CourseOverview course={course} open={open} saved={saved} planName={requiredPlan?.name} />
        <CourseDocumentList
          id="course-documents"
          title={t("learn.documents.title")}
          documents={documents}
        />
        <CoursePdfLinks id="course-pdf" slug={course.slug} />
      </>
    );
  }

  const messages = await getMessages();
  const coachMessages = {
    learn: { coach: messages.learn.coach },
    ai: { orb: messages.ai.orb },
  } as unknown as typeof messages;
  const lessons = lessonsOf(course);
  const current =
    lessons.find((lesson) => lesson.id === param("lecon")) ??
    lessons.find((lesson) => lesson.id === enrollment.lastLessonId) ??
    lessons.find((lesson) => !enrollment.completedLessons.includes(lesson.id)) ??
    lessons[0];
  if (!current) notFound();
  const index = lessons.indexOf(current);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const done = new Set(enrollment.completedLessons);
  const lessonHref = (id: string) => `/app/learn/${course.slug}?lecon=${id}`;
  const required = requiredLessons(course);
  const doneCount = required.filter((lesson) => done.has(lesson.id)).length;
  const remaining = required.length - doneCount;
  const jobExercises = await can(db, { type: "user", id: user.id }, JOB_EXERCISES_KEY);
  const locked = current.jobSpecific && !jobExercises;
  const jobPlan = talentPlanFor(plans, JOB_EXERCISES_KEY);
  const paragraphs = lessonParagraphs(current.content);
  const resources = parseResources(current.resources);
  const playback = current.kind === "video" ? videoProvider().playback(current.videoId) : null;
  // Learn v2, étape 3: the second where the learner stopped in this video.
  const resumeSeconds = playback ? await lessonResume(db, user.id, current.id) : 0;
  const certificate = enrollment.certificate;
  const congrats = param("bravo") && certificate?.id === param("bravo");
  const minutes = (value: number) => {
    const { key, values } = durationParts(value);
    return t(`ui.duration.${key}`, values);
  };
  const moduleDone = (module: (typeof course.modules)[number]) =>
    module.lessons.every((lesson) => lesson.jobSpecific || done.has(lesson.id));
  const nextModule = course.modules.find((module) => module.order > current.module.order);
  const finished = course.modules.find(
    (module) => String(module.order) === param("module") && moduleDone(module),
  );

  const alerts = (
    <>
      {errorAlert}
      {param("inscrit") === "1" && <Alert tone="success" title={t("learn.course.enrolled")} />}
      {param("note") === "1" && <Alert tone="success" title={t("learn.player.notes.saved")} />}
      {congrats && certificate && (
        <SuccessBurst
          title={t("learn.certificates.congrats.title", { firstName: user.firstName ?? user.name })}
          action={
            <ButtonLink href="/app/learn/attestations">
              {t("learn.course.viewCertificate")}
            </ButtonLink>
          }
        >
          <p>{t("learn.certificates.congrats.body", { courseTitle: course.title })}</p>
        </SuccessBurst>
      )}
      {finished && !congrats && (
        <SuccessBurst
          className="py-5!"
          title={t("learn.player.moduleDone.title", {
            number: finished.order,
            firstName: user.firstName ?? user.name,
          })}
        >
          <p className="text-[14px] text-ardoise">
            {t("learn.player.moduleDone.body", {
              title: finished.title,
              number: current.module.order,
              next: current.module.title,
            })}
          </p>
        </SuccessBurst>
      )}
      {param("termine") === "1" && enrollment.completedAt && !congrats && (
        <Alert tone="success" title={t("learn.course.finished")} />
      )}
    </>
  );

  const toc = (
    <section
      aria-labelledby="course-toc"
      className="flex flex-col gap-3 rounded-[24px] bg-blanc p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="course-toc" className="text-[20px] font-semibold lg:text-[22px]">
          {t("learn.player.toc.title")}
        </h2>
        <span className="shrink-0 rounded-pill bg-sapin px-2.5 py-1 text-[11px] font-semibold text-lime">
          {t("learn.player.toc.progress", {
            done: doneCount,
            total: required.length,
            percent: enrollment.progress,
          })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t("learn.player.toc.title")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={enrollment.progress}
        className="h-2 overflow-hidden rounded-pill bg-gris-clair"
      >
        <div
          className="h-full rounded-pill bg-feuille"
          style={{ width: `${enrollment.progress}%` }}
        />
      </div>
      <ol className="flex flex-col">
        {course.modules.map((module) => {
          const isCurrent = module.id === current.module.id;
          const complete = moduleDone(module);
          return (
            <li key={module.id} className="border-brume not-last:border-b">
              <details open={isCurrent} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
                  {!isCurrent && (
                    <span
                      aria-hidden
                      className={cx(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        complete ? "bg-lime text-sapin" : "bg-creme text-ardoise",
                      )}
                    >
                      <Icon name={complete ? "check" : "chev-r"} className="size-3.5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    {t("learn.player.toc.module", { number: module.order, title: module.title })}
                  </span>
                  {isCurrent ? (
                    <Icon
                      name="chev-d"
                      className="size-4 shrink-0 transition-transform group-open:rotate-180"
                    />
                  ) : (
                    <span className="shrink-0 text-xs text-ardoise">
                      {t("learn.player.toc.lessons", { count: module.lessons.length })}
                    </span>
                  )}
                </summary>
                <ol className="mb-2 flex flex-col gap-0.5">
                  {module.lessons.map((lesson) => {
                    const here = lesson.id === current.id;
                    const isDone = done.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={lessonHref(lesson.id)}
                          aria-current={here ? "page" : undefined}
                          className={cx(
                            "flex min-h-11 items-center gap-3 rounded-[14px] px-2.5 py-1.5 text-sm",
                            here ? "bg-lime-clair font-semibold" : "hover:bg-creme",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cx(
                              "flex size-6 shrink-0 items-center justify-center rounded-full",
                              here
                                ? "bg-sapin text-lime"
                                : isDone
                                  ? "bg-lime-clair text-feuille-fonce"
                                  : lesson.kind === "quiz"
                                    ? "bg-ambre-fond text-ambre-texte"
                                    : "border-2 border-brume",
                            )}
                          >
                            {here ? (
                              <Icon name="play" className="size-3" />
                            ) : isDone ? (
                              <Icon name="check" className="size-3" />
                            ) : (
                              lesson.kind === "quiz" && <Icon name="quiz" className="size-3.5" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            {lesson.title}
                            {lesson.jobSpecific && (
                              <span className="block text-xs font-normal text-ardoise">
                                {t("learn.player.exercise.jobSpecific.text")}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-xs font-normal text-ardoise">
                            {lesson.kind === "quiz"
                              ? t("learn.player.toc.quiz.questions", {
                                  count: lesson.quiz?._count.questions ?? 0,
                                })
                              : lesson.durationSec > 0 && clock(lesson.durationSec)}
                          </span>
                          {isDone && (
                            <span className="sr-only">{t("learn.player.lessonDone")}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );

  const certificateCard = course.certificateEnabled && (
    <section className="flex items-center gap-4 rounded-[24px] bg-lime p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-sapin text-lime">
        <Icon name="certificat" className="size-5" />
      </span>
      {certificate ? (
        <Link
          href="/app/learn/attestations"
          className="text-base font-semibold underline-offset-4 hover:underline"
        >
          {t("learn.course.viewCertificate")}
        </Link>
      ) : (
        <p className="flex flex-col">
          <span className="text-base font-semibold">
            {t("learn.player.toc.certificateIn", { count: remaining })}
          </span>
          <span className="text-[13px]">{t("learn.player.toc.certificateHint")}</span>
        </p>
      )}
    </section>
  );

  const instructorCard = course.instructor && (
    <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-6">
      <h2 className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {t("learn.player.instructor.title")}
      </h2>
      <p className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sapin text-base font-bold text-lime"
        >
          {initialsOf(course.instructor)}
        </span>
        <span className="text-base font-semibold">{course.instructor}</span>
      </p>
    </section>
  );

  if (current.kind === "quiz" && !locked) {
    return (
      <>
        <AppPageHeader
          eyebrow={t("learn.quiz.eyebrow", { courseTitle: course.title })}
          title={current.title}
        />
        {alerts}
        <QuizPanel
          userId={user.id}
          slug={course.slug}
          lesson={current}
          attemptId={param("tentative")}
          passed={done.has(current.id)}
          nextHref={next ? lessonHref(next.id) : undefined}
          nextModule={
            nextModule && {
              title: t("learn.player.toc.module", {
                number: nextModule.order,
                title: nextModule.title,
              }),
              meta: [
                t("learn.player.toc.lessons", { count: nextModule.lessons.length }),
                minutes(moduleMinutes(nextModule)),
                course.certificateEnabled && !certificate
                  ? t("learn.player.toc.certificateIn", { count: remaining })
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
            }
          }
          aside={
            <>
              {toc}
              {certificateCard}
            </>
          }
        />
      </>
    );
  }

  const outline = lessonOutline(current.content);
  const cues = transcriptCues(current.transcript);
  const lessonMinutes = Math.round(current.durationSec / 60);
  const lessonDocuments = documents.filter((document) => document.lessonId === current.id);
  const courseDocuments = documents.filter((document) => !document.lessonId);
  // The quiz that closes this module, when one follows the lesson (« Exercice de la leçon »).
  const exercise = current.module.lessons.find(
    (lesson) => lesson.kind === "quiz" && lesson.order > current.order,
  );
  const fileTone = (type: string) =>
    /xls|csv/i.test(type) ? "bg-lime" : /pdf/i.test(type) ? "bg-[#BFEFDF]" : "bg-brume";
  const documentSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? t("learn.documents.size.kb", { size: Math.max(1, Math.round(bytes / 1024)) })
      : t("learn.documents.size.mb", {
          size: (bytes / (1024 * 1024)).toFixed(1).replace(".", ","),
        });

  /** `.lr-bloc` of screens 14 and 69: a white card under a coloured title band with an icon. */
  const block = (
    title: string,
    icon: IconName,
    tone: string,
    children: ReactNode,
    extra?: ReactNode,
  ) => (
    <section className="overflow-hidden rounded-[22px] bg-blanc shadow-douce">
      <h2
        className={cx("flex items-center gap-2.5 px-3.5 py-[11px] text-[14.5px] font-bold", tone)}
      >
        <span
          aria-hidden
          className="grid size-[30px] shrink-0 place-items-center rounded-[10px] bg-blanc/65"
        >
          <Icon name={icon} className="size-4" />
        </span>
        {title}
        {extra}
      </h2>
      <div className="flex flex-col gap-2.5 px-3.5 pt-3 pb-3.5 text-[13.5px] leading-[1.5]">
        {children}
      </div>
    </section>
  );
  /** A file of the Ressources tab (`.res-c`): its type on a coloured tile, then the action. */
  const fileRow = (item: {
    key: string;
    title: string;
    meta: string;
    type: string;
    href: string;
    action: string;
    icon: IconName;
    download?: boolean;
  }) => (
    <li key={item.key} className="flex items-center gap-3 py-1.5">
      <span
        aria-hidden
        className={cx(
          "grid h-[52px] w-11 shrink-0 place-items-end justify-center rounded-[10px] pb-2 text-[10px] font-bold",
          fileTone(item.type),
        )}
      >
        {item.type.toUpperCase().slice(0, 4)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px] leading-snug font-semibold">{item.title}</span>
        <span className="text-[12.5px] text-ardoise">{item.meta}</span>
      </span>
      <a
        href={item.href}
        download={item.download || undefined}
        aria-label={item.action}
        className="jm-press grid size-10 shrink-0 place-items-center rounded-full bg-blanc shadow-[0_0_0_1px_rgb(15_63_55/0.1)] hover:bg-creme"
      >
        <Icon name={item.icon} className="size-[18px]" />
      </a>
    </li>
  );

  const lockedCard = (
    <div className="flex flex-wrap items-center gap-4 rounded-[22px] bg-blanc p-4 shadow-douce">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-creme">
        <Icon name="lock" className="size-5" />
      </span>
      <p className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold">
          {t("learn.course.requiredPlan", { plan: jobPlan })}
        </span>
        <span className="text-[13px] text-ardoise">
          {t("learn.player.exercise.jobSpecific.locked", { plan: jobPlan })}
        </span>
      </p>
      <Link
        href="/tarifs"
        className="flex h-10 items-center rounded-pill bg-sapin px-4 text-sm font-semibold text-blanc"
      >
        {t("learn.lock.cta")}
      </Link>
    </div>
  );

  const summaryPanel = locked ? (
    lockedCard
  ) : (
    <>
      {outline.brief &&
        block(
          t("learn.player.summary.brief"),
          "doc",
          "bg-[linear-gradient(90deg,var(--color-lime),#C9F79C)]",
          <p className="text-[14px]">{outline.brief}</p>,
        )}
      {outline.steps.length > 0 &&
        block(
          t("learn.player.summary.plan"),
          "objectif",
          "bg-[linear-gradient(90deg,#BFEFDF,#DDF6EE)]",
          <ol className="flex flex-col gap-2">
            {outline.steps.map((step, key) => (
              <li
                key={key}
                className="flex items-center gap-2.5 rounded-[14px] bg-[#F6F3EE] px-2.5 py-2"
              >
                <span
                  aria-hidden
                  className="grid size-[26px] shrink-0 place-items-center rounded-full bg-sapin text-[12px] font-bold text-lime"
                >
                  {key + 1}
                </span>
                <span className="flex-1 text-[13px] font-semibold">{step.title}</span>
                {step.minutes > 0 && (
                  <span className="shrink-0 text-[11.5px] text-ardoise">
                    {t("learn.player.summary.minutes", { count: step.minutes })}
                  </span>
                )}
              </li>
            ))}
          </ol>,
        )}
      {(paragraphs.length > 0 || (!outline.brief && current.kind !== "video")) &&
        block(
          t("learn.player.summary.content"),
          "learn",
          "bg-gradient-principal text-blanc [&>span]:bg-blanc/15 [&>span]:text-lime",
          paragraphs.length > 0 ? (
            paragraphs.map((paragraph, key) => (
              <p key={key} className="text-[14.5px] leading-[1.6]">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-ardoise">{t("learn.player.overview.empty")}</p>
          ),
        )}
      {outline.takeaways.length > 0 && (
        <section aria-labelledby="lesson-takeaways" className="flex flex-col gap-2.5">
          <h2
            id="lesson-takeaways"
            className="mt-1 flex items-center gap-2 text-[14.5px] font-bold before:h-[18px] before:w-1 before:rounded-[2px] before:bg-feuille"
          >
            {t("learn.player.summary.takeaways")}
          </h2>
          <ol className="grid grid-cols-3 gap-2">
            {outline.takeaways.map((item, key) => (
              <li
                key={key}
                className={cx(
                  "flex min-h-[104px] flex-col gap-1.5 rounded-[18px] px-2.5 py-3 text-[12px] leading-[1.3] font-semibold sm:text-[13px]",
                  ["bg-lime", "bg-neon", "bg-[#BFEFDF]"][key % 3],
                )}
              >
                <b
                  aria-hidden
                  className="grid size-[26px] place-items-center rounded-[9px] bg-blanc/60 text-[13px]"
                >
                  {key + 1}
                </b>
                {item}
              </li>
            ))}
          </ol>
        </section>
      )}
      {exercise && (
        <div className="flex items-center gap-3 rounded-[22px] bg-gradient-principal p-3.5 text-blanc">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-blanc/12 text-lime"
          >
            <Icon name="quiz" className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{t("learn.player.summary.exercise")}</span>
            <span className="text-[12.5px] text-blanc/70">
              {exercise.durationSec > 0
                ? t("learn.player.summary.exerciseMeta", {
                    count: exercise.quiz?._count.questions ?? 0,
                    duration: minutes(Math.round(exercise.durationSec / 60)),
                  })
                : t("learn.player.toc.quiz.questions", {
                    count: exercise.quiz?._count.questions ?? 0,
                  })}
            </span>
          </span>
          <Link
            href={lessonHref(exercise.id)}
            className="jm-press flex h-11 shrink-0 items-center rounded-pill bg-[linear-gradient(90deg,var(--color-neon),var(--color-lime))] px-5 text-[14px] font-semibold text-sapin"
          >
            {t("learn.player.summary.exerciseStart")}
          </Link>
        </div>
      )}
    </>
  );

  const modulesPanel = (
    <>
      <ol className="flex flex-col gap-3">
        {course.modules.map((module) => {
          const isCurrent = module.id === current.module.id;
          const complete = moduleDone(module);
          const moduleDoneCount = module.lessons.filter((lesson) => done.has(lesson.id)).length;
          const count = module.lessons.length;
          const head = (
            <>
              <span
                aria-hidden
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-[12px] text-[14px] font-bold",
                  isCurrent ? "bg-sapin text-lime" : complete ? "bg-lime" : "bg-[#F6F3EE]",
                )}
              >
                {module.order}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-bold">{module.title}</span>
                <span className="text-[12.5px] text-ardoise">
                  {complete
                    ? t("learn.player.modules.done", { count })
                    : isCurrent
                      ? t("learn.player.modules.progress", { count, done: moduleDoneCount })
                      : t("learn.player.toc.lessons", { count })}
                </span>
              </span>
              {complete ? (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lime-clair text-feuille-fonce">
                  <Icon name="check" className="size-3.5" />
                  <span className="sr-only">{t("learn.player.lessonDone")}</span>
                </span>
              ) : isCurrent ? (
                <span
                  role="img"
                  aria-label={t("learn.player.modules.progressAria", {
                    count,
                    done: moduleDoneCount,
                  })}
                  className="size-[30px] shrink-0 rounded-full [mask:radial-gradient(circle,transparent_9px,#000_10px)]"
                  style={{
                    background: `conic-gradient(var(--color-feuille) ${Math.round((moduleDoneCount / Math.max(1, count)) * 100)}%, rgb(15 63 55 / 0.1) 0)`,
                  }}
                />
              ) : (
                <Icon
                  name="chev-d"
                  className="size-4 shrink-0 text-ardoise transition-transform group-open:rotate-180"
                />
              )}
            </>
          );
          return (
            <li
              key={module.id}
              className={cx(
                "overflow-hidden rounded-[22px] bg-blanc shadow-douce",
                isCurrent && "shadow-[0_0_0_2px_var(--color-lime),var(--jm-ombre-douce)]",
              )}
            >
              <details open={isCurrent} className="group">
                <summary
                  className={cx(
                    "flex min-h-16 cursor-pointer list-none items-center gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden",
                    isCurrent && "bg-[linear-gradient(90deg,#EEFBDD,#fff)]",
                  )}
                >
                  {head}
                </summary>
                <ol className="flex flex-col gap-1 px-3.5 pt-1 pb-3">
                  {module.lessons.map((lesson) => {
                    const here = lesson.id === current.id;
                    const isDone = done.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={lessonHref(lesson.id)}
                          aria-current={here ? "page" : undefined}
                          className={cx(
                            "flex min-h-11 items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-[13px]",
                            here ? "bg-sapin font-semibold text-blanc" : "hover:bg-creme",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cx(
                              "grid size-6 shrink-0 place-items-center rounded-full",
                              here
                                ? "bg-lime text-sapin"
                                : isDone
                                  ? "bg-lime-clair text-feuille-fonce"
                                  : "shadow-[inset_0_0_0_1.5px_rgb(15_63_55/0.2)]",
                            )}
                          >
                            {here ? (
                              <Icon name="play" className="size-3" />
                            ) : isDone ? (
                              <Icon name="check" className="size-3" />
                            ) : (
                              lesson.kind === "quiz" && <Icon name="quiz" className="size-3" />
                            )}
                          </span>
                          <span className={cx("min-w-0 flex-1", isDone && !here && "text-ardoise")}>
                            {lesson.title}
                            {here && (
                              <span className="sr-only">
                                {" "}
                                · {t("learn.player.modules.current")}
                              </span>
                            )}
                          </span>
                          <span
                            className={cx(
                              "shrink-0 text-[11.5px]",
                              here ? "text-blanc/70" : "text-ardoise",
                            )}
                          >
                            {lesson.kind === "quiz"
                              ? t("learn.player.toc.quiz.questions", {
                                  count: lesson.quiz?._count.questions ?? 0,
                                })
                              : lesson.durationSec > 0 &&
                                t("learn.player.summary.minutes", {
                                  count: Math.round(lesson.durationSec / 60),
                                })}
                          </span>
                          {isDone && (
                            <span className="sr-only">{t("learn.player.lessonDone")}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </details>
            </li>
          );
        })}
      </ol>
      {course.certificateEnabled && (
        <div className="flex min-h-16 items-center gap-3 rounded-[22px] bg-[linear-gradient(90deg,#F7F4EE,#fff)] px-3.5 py-3 shadow-douce">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[12px]">
            <Icon name="certificat" className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-bold">{t("learn.player.modules.certificate")}</span>
            {certificate ? (
              <Link
                href="/app/learn/attestations"
                className="text-[12.5px] text-feuille-fonce underline underline-offset-2"
              >
                {t("learn.player.modules.certificateReady")}
              </Link>
            ) : (
              <span className="text-[12.5px] text-ardoise">
                {t("learn.player.modules.certificateLocked")}
              </span>
            )}
          </span>
          {!certificate && <Icon name="lock" className="size-4 shrink-0 text-ardoise" />}
        </div>
      )}
    </>
  );

  const transcriptPanel =
    !locked && cues.length > 0 ? (
      <LessonTranscript
        cues={cues}
        video={current.kind === "video" && Boolean(playback)}
        labels={{
          title: t("learn.player.tabs.transcript"),
          search: t("learn.player.transcriptPanel.search"),
          follows: t("learn.player.transcriptPanel.follows"),
          none: t("learn.player.transcriptPanel.none"),
          seekHint: t("learn.player.transcriptPanel.seekHint"),
          seek: t("learn.player.transcriptPanel.seek"),
        }}
      />
    ) : (
      <p className="rounded-[22px] bg-blanc p-4 text-[13.5px] text-ardoise shadow-douce">
        {t("learn.player.transcriptPanel.empty")}
      </p>
    );

  const downloads = locked
    ? []
    : [
        ...resources.map((resource) => ({
          key: resource.url,
          title: resource.title,
          meta: resource.sizeKb
            ? t("learn.player.resources.meta", {
                type: resource.type,
                size: `${Math.max(1, Math.round(resource.sizeKb / 1024))} Mo`,
              })
            : resource.type,
          type: resource.type,
          href: resource.url,
          action: t("learn.player.resourcesPanel.downloadNamed", { title: resource.title }),
          icon: "telecharger" as const,
          download: true,
        })),
        ...lessonDocuments.map((document) => ({
          key: document.id,
          title: document.title,
          meta: t("learn.documents.meta", {
            kind: t(`learn.documents.kind.${documentKind(document.kind)}`),
            pages: document.pages,
            size: documentSize(document.size),
          }),
          type: "PDF",
          href: documentHref(document.id),
          action: t("learn.documents.downloadNamed", { title: document.title }),
          icon: "telecharger" as const,
        })),
      ];
  const further = [
    ...courseDocuments.map((document) => ({
      key: document.id,
      title: document.title,
      meta: t("learn.documents.meta", {
        kind: t(`learn.documents.kind.${documentKind(document.kind)}`),
        pages: document.pages,
        size: documentSize(document.size),
      }),
      type: "PDF",
      href: documentHref(document.id),
      action: t("learn.documents.downloadNamed", { title: document.title }),
      icon: "telecharger" as const,
    })),
    {
      key: "support",
      title: t("learn.pdf.support"),
      meta: t("learn.pdf.supportHint"),
      type: "PDF",
      href: `/app/learn/${course.slug}/support`,
      action: t("learn.pdf.support"),
      icon: "telecharger" as const,
    },
    {
      key: "programme",
      title: t("learn.pdf.programme"),
      meta: t("learn.pdf.programmeHint"),
      type: "PDF",
      href: `/formations/${course.slug}/programme`,
      action: t("learn.pdf.programme"),
      icon: "telecharger" as const,
    },
    ...(next
      ? [
          {
            key: "next",
            title: next.title,
            meta:
              next.durationSec > 0
                ? t("learn.player.resourcesPanel.nextLesson", {
                    duration: minutes(Math.round(next.durationSec / 60)),
                  })
                : t("learn.player.next"),
            type: t("learn.player.resourcesPanel.video"),
            href: lessonHref(next.id),
            action: t("learn.player.next"),
            icon: "play" as const,
          },
        ]
      : []),
  ];
  const resourcesPanel = (
    <>
      {downloads.length > 0 &&
        block(
          t("learn.player.resourcesPanel.download"),
          "telecharger",
          "bg-[linear-gradient(90deg,var(--color-lime),#C9F79C)]",
          <ul className="flex flex-col">{downloads.map(fileRow)}</ul>,
        )}
      {!locked && downloads.length === 0 && (
        <p className="rounded-[22px] bg-blanc p-4 text-[13.5px] text-ardoise shadow-douce">
          {t("learn.player.resources.empty")}
        </p>
      )}
      {block(
        t("learn.player.resourcesPanel.further"),
        "lien",
        "bg-[linear-gradient(90deg,var(--color-neon),#F1FAB9)]",
        <ul className="flex flex-col">{further.map(fileRow)}</ul>,
      )}
      <p className="flex items-center gap-2 px-1 text-[12px] text-ardoise">
        <Icon name="lock" className="size-3.5 shrink-0" />
        {t("learn.player.resourcesPanel.offline")}
      </p>
    </>
  );

  return (
    <>
      {/* Phone (screen 14): the video first; the course is named above the lesson title. */}
      <AppPageHeader
        eyebrow={t("learn.player.eyebrow")}
        title={course.title}
        titleAs="p"
        className="max-md:hidden"
      />
      {alerts}
      <div className="grid grid-cols-1 gap-5 pb-28 md:pb-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          {current.kind === "video" && !locked && (
            <div
              data-lesson-video
              className="relative flex flex-col gap-3 overflow-hidden bg-[linear-gradient(135deg,#123f37,#0b1a1f)] p-3 text-blanc max-sm:-mx-4 max-sm:rounded-b-[28px] sm:rounded-[28px] sm:p-5"
            >
              {playback ? (
                <VideoPlayer
                  src={playback.src}
                  poster={playback.poster}
                  lowMp4={playback.lowMp4}
                  title={current.title}
                  labels={{
                    quality: t("learn.player.quality.text"),
                    auto: t("learn.player.quality.auto"),
                    low: t("learn.player.quality.low"),
                    speed: t("learn.player.speed.text"),
                    speedValues: Object.fromEntries(
                      speeds.map((speed) => [
                        speed,
                        t("learn.player.speed.value", { speed: speed.replace(".", ",") }),
                      ]),
                    ),
                    error: t("learn.player.error.text"),
                    retry: t("learn.player.error.retry"),
                    lowBandwidth: t("learn.player.lowBandwidth"),
                  }}
                  resume={{
                    lessonId: current.id,
                    at: resumeSeconds,
                    endpoint: "/api/learn/position",
                    resumed: t("learn.player.resume.text", { time: clock(resumeSeconds) }),
                    restart: t("learn.player.resume.restart"),
                  }}
                />
              ) : (
                <p className="flex aspect-video items-center justify-center gap-3 p-4 text-center text-sm leading-6 text-blanc/90">
                  <Icon name="video" className="size-5 shrink-0 text-lime" />
                  {t("learn.player.noVideo")}
                </p>
              )}
            </div>
          )}

          <header className="flex flex-col gap-2">
            <p className="text-[12px] text-ardoise">
              {t("learn.player.context", { course: course.title, number: current.module.order })}
            </p>
            <h1
              id="lesson-title"
              className="text-[22px] leading-[1.2] font-bold tracking-[-0.01em] lg:text-[30px]"
            >
              {current.title}
            </h1>
            {(current.kind === "exercise" || current.jobSpecific) && (
              <p className="flex flex-wrap gap-2 text-[11px] font-semibold">
                {current.kind === "exercise" && (
                  <span className="rounded-pill bg-lime-clair px-2.5 py-1">
                    {t("learn.player.exercise.text")}
                  </span>
                )}
                {current.jobSpecific && (
                  <span className="rounded-pill bg-lime-clair px-2.5 py-1">
                    {t("learn.player.exercise.jobSpecific.text")}
                  </span>
                )}
              </p>
            )}
            {current.jobSpecific && (
              <p className="text-[13px] text-ardoise">
                {[
                  t("learn.player.exercise.jobSpecific.optional"),
                  course.jobFamilies.length > 0
                    ? t("learn.player.exercise.jobSpecific.families", {
                        families: course.jobFamilies.join(", "),
                      })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
            <div
              role="progressbar"
              aria-label={t("learn.player.courseProgress")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={enrollment.progress}
              className="mt-1 h-1.5 overflow-hidden rounded-pill bg-blanc"
            >
              <div
                className="h-full rounded-pill bg-feuille"
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
            <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-[13px] text-ardoise">
                {lessonMinutes > 0
                  ? t("learn.player.meta", {
                      index: index + 1,
                      total: lessons.length,
                      duration: minutes(lessonMinutes),
                    })
                  : t("learn.player.metaShort", { index: index + 1, total: lessons.length })}
              </p>
              {!locked &&
                (done.has(current.id) ? (
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-up-texte">
                    <Icon name="check" className="size-4" />
                    {t("learn.player.completed")}
                  </span>
                ) : (
                  <form action={completeLessonAction}>
                    <input type="hidden" name="slug" value={course.slug} />
                    <input type="hidden" name="lesson" value={current.id} />
                    <button
                      type="submit"
                      className="jm-press flex h-10 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[13px] font-semibold shadow-douce hover:bg-lime-clair"
                    >
                      <Icon name="check" className="size-4" />
                      {t("learn.player.markComplete")}
                    </button>
                  </form>
                ))}
            </div>
          </header>

          <LessonTabs
            lesson={current.id}
            label={t("learn.player.tabs.label")}
            tabs={[
              {
                id: "resume",
                label: t("learn.player.tabs.summary"),
                icon: "doc",
                panel: summaryPanel,
              },
              {
                id: "modules",
                label: t("learn.player.tabs.modules"),
                icon: "learn",
                panel: modulesPanel,
              },
              {
                id: "transcription",
                label: t("learn.player.tabs.transcript"),
                icon: "message",
                panel: transcriptPanel,
              },
              {
                id: "ressources",
                label: t("learn.player.tabs.resources"),
                icon: "telecharger",
                panel: resourcesPanel,
              },
              {
                id: "notes",
                label: t("learn.player.tabs.notes"),
                icon: "edit",
                panel: (
                  <div className="rounded-[22px] bg-blanc p-4 shadow-douce [&>section]:border-t-0 [&>section]:pt-0">
                    <LessonNotes userId={user.id} slug={course.slug} lessonId={current.id} />
                  </div>
                ),
              },
            ]}
          />

          {(previous || next) && (
            <div className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex items-center gap-3 rounded-[22px] bg-blanc p-3 shadow-float md:static md:bg-transparent md:p-0 md:shadow-none">
              {previous && (
                <ButtonLink
                  href={lessonHref(previous.id)}
                  variant="soft"
                  size="L"
                  icon={<Icon name="chev-l" className="size-4" />}
                  className={cx("md:flex-none", next ? "flex-1" : "w-full")}
                >
                  {t("learn.player.previousShort")}
                </ButtonLink>
              )}
              {next && (
                <ButtonLink
                  href={lessonHref(next.id)}
                  variant="principal"
                  size="L"
                  arrow
                  className="flex-[1.3] md:ml-auto md:flex-none"
                >
                  {t("learn.player.next")}
                </ButtonLink>
              )}
            </div>
          )}

          {!locked && (
            <section
              id="coach"
              aria-labelledby="coach-title"
              className="flex scroll-mt-24 flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-6"
            >
              <div className="flex items-start gap-3">
                <AiOrb size={30} className="mt-0.5" />
                <div className="flex flex-col gap-1">
                  <h2 id="coach-title" className="text-[18px] leading-tight font-bold">
                    {t("learn.coach.player.title")}
                  </h2>
                  <p className="text-[14px] text-ardoise">{t("learn.coach.player.body")}</p>
                </div>
              </div>
              <NextIntlClientProvider messages={coachMessages}>
                <CoachChat
                  fixed
                  courses={[{ slug: course.slug, title: course.title, lessons: [] }]}
                  firstName={user.firstName ?? user.name}
                  initial={{ slug: course.slug, lessonId: current.id }}
                />
              </NextIntlClientProvider>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5 self-start">
          {certificateCard}
          {instructorCard}
        </aside>
      </div>
    </>
  );
}
