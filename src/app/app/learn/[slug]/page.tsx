import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { clock, initialsOf, moduleMinutes } from "@/components/learn/course-bits";
import { CourseOverview } from "@/components/learn/course-overview";
import { LessonNotes } from "@/components/learn/lesson-notes";
import { QuizPanel } from "@/components/learn/quiz-panel";
import { VideoPlayer, speeds } from "@/components/learn/video-player";
import { Pattern } from "@/components/site/marketing";
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
  lessonParagraphs,
  lessonsOf,
  parseResources,
  requiredLessons,
} from "@/server/services/learn";
import { planForCatalogLevel, talentPlanFor } from "@/server/services/plans";
import { SuccessBurst } from "@/components/motion/success-burst";
import { CourseDocumentList } from "@/components/learn/course-documents";
import { documentViewer, visibleDocuments } from "@/server/services/course-documents";

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
      </>
    );
  }

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
  const lessonNumber = current.module.lessons.findIndex((lesson) => lesson.id === current.id) + 1;
  const required = requiredLessons(course);
  const doneCount = required.filter((lesson) => done.has(lesson.id)).length;
  const remaining = required.length - doneCount;
  const jobExercises = await can(db, { type: "user", id: user.id }, JOB_EXERCISES_KEY);
  const locked = current.jobSpecific && !jobExercises;
  const jobPlan = talentPlanFor(plans, JOB_EXERCISES_KEY);
  const paragraphs = lessonParagraphs(current.content);
  const resources = parseResources(current.resources);
  const playback = current.kind === "video" ? videoProvider().playback(current.videoId) : null;
  const certificate = enrollment.certificate;
  const congrats = param("bravo") && certificate?.id === param("bravo");
  const position = t("learn.player.position", {
    module: current.module.order,
    lesson: lessonNumber,
  });
  const minutes = (value: number) => {
    const { key, values } = durationParts(value);
    return t(`ui.duration.${key}`, values);
  };
  const moduleDone = (module: (typeof course.modules)[number]) =>
    module.lessons.every((lesson) => lesson.jobSpecific || done.has(lesson.id));
  const nextModule = course.modules.find((module) => module.order > current.module.order);

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

  const navButton =
    "inline-flex h-11 items-center gap-2 rounded-pill px-4 text-sm font-semibold whitespace-nowrap sm:px-5 sm:text-[15px]";

  return (
    <>
      <AppPageHeader eyebrow={t("learn.player.eyebrow")} title={course.title} titleAs="p" />
      {alerts}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-labelledby="lesson-title"
          className="relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-[28px] bg-sapin p-5 text-blanc lg:col-start-1 lg:row-start-1 lg:p-[30px]"
        >
          <Pattern name="motif-orbites-sombre" size={260} opacity={0.35} />
          <div className="relative flex flex-col items-start gap-3">
            <p className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-pill bg-lime px-2.5 py-1 text-sapin">{position}</span>
              {current.kind === "exercise" && (
                <span className="rounded-pill px-2.5 py-1 ring-1 ring-blanc/60 ring-inset">
                  {t("learn.player.exercise.text")}
                </span>
              )}
              {current.jobSpecific && (
                <span className="rounded-pill px-2.5 py-1 ring-1 ring-blanc/60 ring-inset">
                  {t("learn.player.exercise.jobSpecific.text")}
                </span>
              )}
            </p>
            <h1
              id="lesson-title"
              className="max-w-[560px] text-[26px] leading-[1.12] font-bold tracking-tight lg:text-[36px]"
            >
              {current.title}
            </h1>
            {current.jobSpecific && (
              <p className="text-[13px] text-blanc/80">
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
          </div>
          {current.kind === "video" && !locked && (
            <div className="relative">
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
                />
              ) : (
                <p className="flex items-center gap-3 rounded-[18px] bg-blanc/10 p-4 text-sm leading-6 text-blanc/90">
                  <Icon name="video" className="size-5 shrink-0 text-lime" />
                  {t("learn.player.noVideo")}
                </p>
              )}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-5 self-start lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {toc}
          {certificateCard}
          {instructorCard}
        </aside>

        <div className="flex min-w-0 flex-col gap-5 self-start lg:col-start-1 lg:row-start-2">
          <div className="flex flex-wrap items-center gap-3">
            {previous && (
              <Link
                href={lessonHref(previous.id)}
                className={cx(navButton, "border border-brume bg-blanc/60 hover:bg-blanc")}
              >
                <Icon name="chev-l" className="size-4" />
                {t("learn.player.previous")}
              </Link>
            )}
            <span className="flex flex-1 flex-wrap items-center justify-end gap-3">
              {!locked &&
                (done.has(current.id) ? (
                  <span className={cx(navButton, "bg-lime-clair")}>
                    <Icon name="check" className="size-4" />
                    {t("learn.player.completed")}
                  </span>
                ) : (
                  <form action={completeLessonAction}>
                    <input type="hidden" name="slug" value={course.slug} />
                    <input type="hidden" name="lesson" value={current.id} />
                    <button
                      type="submit"
                      className={cx(navButton, "border border-brume bg-blanc/60 hover:bg-blanc")}
                    >
                      <Icon name="check" className="size-4" />
                      {t("learn.player.markComplete")}
                    </button>
                  </form>
                ))}
              {next && (
                <Link
                  href={lessonHref(next.id)}
                  className={cx(navButton, "bg-sapin text-blanc hover:bg-sapin/90")}
                >
                  {t("learn.player.next")}
                  <Icon name="chev-r" className="size-4" />
                </Link>
              )}
            </span>
          </div>

          <section className="flex flex-col gap-5 rounded-[24px] bg-blanc p-6">
            <nav
              aria-label={t("learn.player.toc.title")}
              className="flex gap-6 border-b border-brume"
            >
              <a
                href="#apercu"
                aria-current="true"
                className="-mb-px border-b-2 border-sapin pb-3 text-[15px] font-semibold"
              >
                {t("learn.player.tab.overview")}
              </a>
              {!locked && resources.length > 0 && (
                <a href="#ressources" className="pb-3 text-[15px] text-ardoise hover:text-sapin">
                  {t("learn.player.tab.resources")}
                </a>
              )}
              <a href="#notes" className="pb-3 text-[15px] text-ardoise hover:text-sapin">
                {t("learn.player.tab.notes")}
              </a>
            </nav>

            <div id="apercu" className="flex scroll-mt-24 flex-col gap-4">
              {locked ? (
                <div className="flex flex-wrap items-center gap-4 rounded-[18px] border border-brume p-4">
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
              ) : (
                <>
                  {paragraphs.length === 0 &&
                    resources.length === 0 &&
                    current.kind !== "video" && (
                      <p className="text-ardoise">{t("learn.player.overview.empty")}</p>
                    )}
                  {paragraphs.map((paragraph, key) => (
                    <p key={key} className="text-base leading-7">
                      {paragraph}
                    </p>
                  ))}
                </>
              )}
            </div>

            {!locked && resources.length > 0 && (
              <section
                id="ressources"
                aria-labelledby="lesson-resources"
                className="flex scroll-mt-24 flex-col gap-3"
              >
                <h2
                  id="lesson-resources"
                  className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase"
                >
                  {t("learn.player.tab.resources")}
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {resources.map((resource, key) => (
                    <li
                      key={resource.url}
                      className="flex items-center gap-3 rounded-[18px] border border-brume p-3.5"
                    >
                      <span
                        className={cx(
                          "flex size-11 shrink-0 items-center justify-center rounded-xl",
                          key % 2 === 0 ? "bg-lime-clair" : "bg-ambre-fond",
                        )}
                      >
                        <Icon name="doc" className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold">{resource.title}</span>
                        <span className="text-xs text-ardoise">
                          {resource.sizeKb
                            ? t("learn.player.resources.meta", {
                                type: resource.type,
                                size: `${Math.max(1, Math.round(resource.sizeKb / 1024))} Mo`,
                              })
                            : resource.type}
                        </span>
                      </span>
                      <a
                        href={resource.url}
                        className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline"
                        download
                      >
                        <Icon name="telecharger" className="size-4" />
                        {t("learn.player.resources.download")}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!locked && (
              <CourseDocumentList
                id="lesson-documents"
                title={t("learn.documents.lessonTitle")}
                documents={documents.filter((document) => document.lessonId === current.id)}
              />
            )}
            <CourseDocumentList
              id="course-documents"
              title={t("learn.documents.title")}
              documents={documents.filter((document) => !document.lessonId)}
            />

            {!locked && current.transcript && (
              <details className="rounded-[18px] bg-creme p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  {t("learn.player.transcript")}
                </summary>
                <p className="mt-3 text-sm leading-6 whitespace-pre-line">{current.transcript}</p>
              </details>
            )}

            <LessonNotes userId={user.id} slug={course.slug} lessonId={current.id} />
          </section>
        </div>
      </div>
    </>
  );
}
