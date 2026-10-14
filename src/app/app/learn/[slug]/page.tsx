import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { CourseOverview } from "@/components/learn/course-overview";
import { LessonNotes } from "@/components/learn/lesson-notes";
import { QuizPanel } from "@/components/learn/quiz-panel";
import { VideoPlayer, speeds } from "@/components/learn/video-player";
import { Alert, Badge, Button, ButtonLink, PlanLock, ProgressBar } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
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
    title: { absolute: t("seo", { title: course?.title ?? slug }) },
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
  const requiredPlan = planForCatalogLevel(plans, course.requiredLevel);
  const param = (key: string) =>
    typeof query[key] === "string" ? (query[key] as string) : undefined;
  const error = param("erreur");
  const errorAlert = error && errors.includes(error) && (
    <Alert tone="error" title={td(`learn.error.${error}`)} />
  );

  if (!enrollment || !open) {
    return (
      <div className="flex flex-col gap-6">
        {errorAlert}
        {param("enregistre") === "1" && <Alert tone="success" title={t("learn.save.success")} />}
        {param("enregistre") === "0" && <Alert tone="info" title={t("learn.save.removed")} />}
        <CourseOverview course={course} open={open} saved={saved} planName={requiredPlan?.name} />
      </div>
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
  const remaining = required.filter((lesson) => !done.has(lesson.id)).length;
  const jobExercises = await can(db, { type: "user", id: user.id }, JOB_EXERCISES_KEY);
  const locked = current.jobSpecific && !jobExercises;
  const jobPlan = talentPlanFor(plans, JOB_EXERCISES_KEY);
  const paragraphs = lessonParagraphs(current.content);
  const resources = parseResources(current.resources);
  const playback = current.kind === "video" ? videoProvider().playback(current.videoId) : null;
  const certificate = enrollment.certificate;
  const congrats = param("bravo") && certificate?.id === param("bravo");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/learn"
        className="flex items-center gap-1 self-start font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("learn.course.back")}
      </Link>
      {errorAlert}
      {param("inscrit") === "1" && <Alert tone="success" title={t("learn.course.enrolled")} />}
      {param("note") === "1" && <Alert tone="success" title={t("learn.player.notes.saved")} />}
      {congrats && certificate && (
        <Alert
          tone="success"
          title={t("learn.certificates.congrats.title", { firstName: user.firstName ?? user.name })}
          action={
            <ButtonLink href="/app/learn/attestations">
              {t("learn.course.viewCertificate")}
            </ButtonLink>
          }
        >
          {t("learn.certificates.congrats.body", { courseTitle: course.title })}
        </Alert>
      )}
      {param("termine") === "1" && enrollment.completedAt && !congrats && (
        <Alert tone="success" title={t("learn.course.finished")} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-1">
            <p className="text-eyebrow text-ardoise">
              {[
                course.title,
                t("learn.player.position", { module: current.module.order, lesson: lessonNumber }),
              ].join(" · ")}
            </p>
            <h1 className="text-h1">{current.title}</h1>
          </header>

          {current.jobSpecific && (
            <div className="flex flex-col gap-1">
              <Badge tone="career" className="self-start">
                {t("learn.player.exercise.jobSpecific.text")}
              </Badge>
              <p className="text-sm text-ardoise">
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
            </div>
          )}

          {current.kind === "video" &&
            !locked &&
            (playback ? (
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
              <p className="rounded-card bg-blanc p-5 text-[15px] leading-6 text-ardoise">
                {t("learn.player.noVideo")}
              </p>
            ))}

          {locked ? (
            <PlanLock
              plan={jobPlan}
              description={t("learn.player.exercise.jobSpecific.locked", { plan: jobPlan })}
            />
          ) : current.kind === "quiz" ? (
            <QuizPanel
              userId={user.id}
              slug={course.slug}
              lesson={current}
              attemptId={param("tentative")}
              passed={done.has(current.id)}
              nextHref={next ? lessonHref(next.id) : undefined}
            />
          ) : (
            <section className="flex flex-col gap-4 rounded-card bg-blanc p-5 md:p-6">
              {current.kind === "exercise" && (
                <Badge tone="learn">{t("learn.player.exercise.text")}</Badge>
              )}
              {paragraphs.length === 0 && resources.length === 0 && current.kind !== "video" && (
                <p className="text-ardoise">{t("learn.player.overview.empty")}</p>
              )}
              {paragraphs.map((paragraph, key) => (
                <p key={key} className="text-[17px] leading-8">
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {!locked && resources.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="lesson-resources">
              <h2 id="lesson-resources" className="text-h2">
                {t("learn.player.tab.resources")}
              </h2>
              <ul className="flex flex-col gap-2">
                {resources.map((resource) => (
                  <li
                    key={resource.url}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-blanc p-4"
                  >
                    <span className="flex flex-col">
                      <span className="font-semibold">{resource.title}</span>
                      <span className="text-sm text-ardoise">
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
                      className="font-semibold underline underline-offset-4"
                      download
                    >
                      {t("learn.player.resources.download")}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!locked && current.transcript && (
            <details className="rounded-card bg-blanc p-5">
              <summary className="cursor-pointer font-semibold">
                {t("learn.player.transcript")}
              </summary>
              <p className="mt-3 text-[15px] leading-7 whitespace-pre-line">{current.transcript}</p>
            </details>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {current.kind !== "quiz" &&
              !locked &&
              (done.has(current.id) ? (
                <Badge tone="success" icon={<Icon name="valider" className="size-4" />}>
                  {t("learn.player.completed")}
                </Badge>
              ) : (
                <form action={completeLessonAction}>
                  <input type="hidden" name="slug" value={course.slug} />
                  <input type="hidden" name="lesson" value={current.id} />
                  <Button type="submit">{t("learn.player.markComplete")}</Button>
                </form>
              ))}
            {previous && (
              <ButtonLink href={lessonHref(previous.id)} variant="tertiary">
                {t("learn.player.previous")}
              </ButtonLink>
            )}
            {next && (
              <ButtonLink href={lessonHref(next.id)} variant="secondary">
                {t("learn.player.next")}
              </ButtonLink>
            )}
          </div>

          <LessonNotes userId={user.id} slug={course.slug} lessonId={current.id} />
        </article>

        <aside
          className="flex flex-col gap-4 self-start rounded-card bg-blanc p-5"
          aria-labelledby="course-toc"
        >
          <h2 id="course-toc" className="text-h3 font-semibold">
            {t("learn.player.toc.title")}
          </h2>
          <ProgressBar value={enrollment.progress} label={t("learn.player.toc.title")} />
          <p className="text-sm">
            {t("learn.player.toc.progress", {
              done: required.filter((lesson) => done.has(lesson.id)).length,
              total: required.length,
              percent: enrollment.progress,
            })}
          </p>
          {course.certificateEnabled &&
            (certificate ? (
              <ButtonLink href="/app/learn/attestations" variant="secondary" size="sm">
                {t("learn.course.viewCertificate")}
              </ButtonLink>
            ) : (
              <p className="text-sm text-ardoise">
                {[
                  t("learn.player.toc.certificateIn", { count: remaining }),
                  t("learn.player.toc.certificateHint"),
                ].join(" ")}
              </p>
            ))}
          <ol className="flex flex-col gap-4">
            {course.modules.map((module) => (
              <li key={module.id} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t("learn.player.toc.module", { number: module.order, title: module.title })}
                </h3>
                <ol className="flex flex-col gap-1">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={lessonHref(lesson.id)}
                        aria-current={lesson.id === current.id ? "page" : undefined}
                        className={cx(
                          "flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px]",
                          lesson.id === current.id
                            ? "bg-lime font-semibold text-sapin"
                            : "hover:bg-creme",
                        )}
                      >
                        <Icon
                          name={
                            done.has(lesson.id)
                              ? "valider"
                              : lesson.kind === "quiz"
                                ? "quiz"
                                : "cours-video"
                          }
                          className="size-4 shrink-0"
                        />
                        <span className="flex-1">
                          {lesson.title}
                          {lesson.jobSpecific && (
                            <span className="block text-ardoise text-caption">
                              {t("learn.player.exercise.jobSpecific.text")}
                            </span>
                          )}
                        </span>
                        {done.has(lesson.id) && (
                          <span className="sr-only">{t("learn.player.lessonDone")}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
