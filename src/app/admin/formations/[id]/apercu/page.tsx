import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, Tag, adminCard, adminLabel } from "@/components/admin/kit";
import { courseStatusTone } from "@/components/admin/formations-list";
import { Icon } from "@/components/brand/icon";
import { VideoPlayer } from "@/components/learn/video-player";
import { speeds } from "@/components/learn/course-bits";
import { Alert, ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { videoProvider } from "@/server/adapters/video";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { getCourseForAdmin } from "@/server/services/course-admin";
import { coverAt } from "@/server/services/course-media";
import { lessonParagraphs, parseResources } from "@/server/services/learn";

/**
 * « Aperçu comme un talent » (Admin v2, étape 6): the course as a learner will see it, whatever
 * its status, read only: no enrollment, no progress, no quiz attempt.
 */
export default async function AdminCoursePreview({
  params,
  searchParams,
}: PageProps<"/admin/formations/[id]/apercu">) {
  const { id } = await params;
  const query = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const course = await getCourseForAdmin(db, id);
  if (!course) notFound();
  const [t, tc] = await Promise.all([getTranslations("admin.courses"), getTranslations()]);
  const lessons = course.modules.flatMap((module) => module.lessons);
  const wanted = typeof query.lecon === "string" ? query.lecon : "";
  const current = lessons.find((lesson) => lesson.id === wanted) ?? lessons[0];
  const playback = current?.kind === "video" ? videoProvider().playback(current.videoId) : null;
  const paragraphs = current ? lessonParagraphs(current.content) : [];
  const resources = current ? parseResources(current.resources) : [];
  const base = `/admin/formations/${course.id}`;

  return (
    <>
      <AdminPageHeader title={t("v2.previewPage.title", { title: course.title })} />
      <Alert tone="info" title={t("v2.previewPage.notice")}>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <ButtonLink href={base} size="sm" variant="secondary" icon={<Icon name="precedent" />}>
            {t("v2.previewPage.back")}
          </ButtonLink>
          <span className="flex items-center gap-2 text-[12.5px]">
            {t("v2.previewPage.status")}
            <Tag tone={courseStatusTone[course.status]}>{t(`status.${course.status}`)}</Tag>
          </span>
        </div>
      </Alert>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={cx(adminCard, "flex flex-col gap-3.5 overflow-hidden !p-0")}>
            {course.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- already resized WebP
              <img
                src={
                  course.coverUrl.startsWith("/medias/")
                    ? coverAt(course.coverUrl, 1440)
                    : course.coverUrl
                }
                alt=""
                width={1440}
                height={810}
                className="aspect-[16/7] w-full bg-creme object-cover"
              />
            )}
            <div
              className={cx(
                "flex flex-col gap-2.5 px-5 pb-5 lg:px-[22px] lg:pb-[22px]",
                !course.coverUrl && "pt-5 lg:pt-[22px]",
              )}
            >
              <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.015em]">
                {course.title}
              </h2>
              {course.summary && <p className="text-[14px] leading-6">{course.summary}</p>}
              {course.instructor && (
                <p className="text-[12.5px] text-ardoise">{course.instructor}</p>
              )}
              {course.objectives.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1.5 text-[13px]">
                  {course.objectives.map((objective) => (
                    <li key={objective} className="flex items-start gap-2">
                      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-sapin" />
                      {objective}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {current && (
            <section
              aria-labelledby="apercu-lecon"
              className={cx(adminCard, "flex flex-col gap-3.5")}
            >
              <h2 id="apercu-lecon" className="text-[18px] leading-6 font-semibold">
                {current.title}
              </h2>
              {current.kind === "video" &&
                (playback ? (
                  <div className="overflow-hidden rounded-[18px] bg-nuit">
                    <VideoPlayer
                      src={playback.src}
                      poster={playback.poster}
                      lowMp4={playback.lowMp4}
                      title={current.title}
                      labels={{
                        quality: tc("learn.player.quality.text"),
                        auto: tc("learn.player.quality.auto"),
                        low: tc("learn.player.quality.low"),
                        speed: tc("learn.player.speed.text"),
                        speedValues: Object.fromEntries(
                          speeds.map((speed) => [
                            speed,
                            tc("learn.player.speed.value", { speed: speed.replace(".", ",") }),
                          ]),
                        ),
                        error: tc("learn.player.error.text"),
                        retry: tc("learn.player.error.retry"),
                        lowBandwidth: tc("learn.player.lowBandwidth"),
                      }}
                    />
                  </div>
                ) : (
                  <p className="rounded-[14px] bg-creme p-4 text-[13px]">
                    {t("v2.previewPage.noVideo")}
                  </p>
                ))}
              {current.kind === "quiz" && current.quiz && (
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-semibold">
                    {t("v2.previewPage.quiz", {
                      count: current.quiz.questions.length,
                      score: current.quiz.passingScore,
                    })}
                  </p>
                  <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-5">
                    {current.quiz.questions.map((question) => (
                      <li key={question.id}>{question.prompt}</li>
                    ))}
                  </ol>
                </div>
              )}
              {paragraphs.map((paragraph, key) => (
                <p key={key} className="text-[15px] leading-7">
                  {paragraph}
                </p>
              ))}
              {resources.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {resources.map((resource) => (
                    <li key={resource.url} className="flex items-center gap-2 text-[13px]">
                      <Icon name="doc" className="size-4 shrink-0" />
                      <span className="font-semibold">{resource.title}</span>
                      <span className="text-ardoise">{resource.type}</span>
                    </li>
                  ))}
                </ul>
              )}
              {current.transcript && (
                <details className="rounded-[18px] bg-creme p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    {tc("learn.player.transcript")}
                  </summary>
                  <p className="mt-3 text-sm leading-6 whitespace-pre-line">{current.transcript}</p>
                </details>
              )}
            </section>
          )}
        </div>

        <nav aria-label={t("v2.step.program")} className={cx(adminCard, "flex flex-col gap-3")}>
          {lessons.length === 0 && (
            <p className="text-[13px] text-ardoise">{t("v2.previewPage.empty")}</p>
          )}
          {course.modules.map((module) => (
            <div key={module.id} className="flex flex-col gap-1">
              <h3 className={adminLabel}>{module.title}</h3>
              <ul className="flex flex-col gap-0.5">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`${base}/apercu?lecon=${lesson.id}`}
                      aria-current={lesson.id === current?.id ? "page" : undefined}
                      className={cx(
                        "flex items-center gap-2 rounded-[12px] px-2.5 py-2 text-[13px]",
                        lesson.id === current?.id
                          ? "bg-lime-clair font-semibold"
                          : "hover:bg-creme",
                      )}
                    >
                      <Icon
                        name={
                          lesson.kind === "video"
                            ? "video"
                            : lesson.kind === "quiz"
                              ? "quiz"
                              : "doc"
                        }
                        className="size-4 shrink-0"
                      />
                      {lesson.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
