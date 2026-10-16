import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Pattern } from "@/components/site/marketing";
import { languageName } from "@/lib/dates";
import { durationParts } from "@/lib/format";
import { cx } from "@/lib/cx";
import { enrollAction, toggleSavedCourseAction } from "@/server/actions/learn";
import { lessonsOf, type LearnerCourse } from "@/server/services/learn";
import { clock, initialsOf, moduleMinutes } from "./course-bits";

/**
 * The course before the learner starts it (partie 07 § 3, mockup 03-04): a green header with the
 * first lesson, what it teaches, its program, and the plan card to start, save or unlock it.
 */
export async function CourseOverview({
  course,
  open,
  saved,
  planName,
}: {
  course: LearnerCourse;
  open: boolean;
  saved: boolean;
  /** The cheapest plan that opens the course, read from the database. */
  planName?: string;
}) {
  const t = await getTranslations();
  const lessons = lessonsOf(course);
  const hours = Math.max(1, Math.round(course.durationMinutes / 60));
  const isFree = course.requiredLevel === "free";
  const preview = lessons.find((lesson) => lesson.isPreview);
  const previewHref = `/formations/${course.slug}#apercu`;
  const minutes = (value: number) => {
    const { key, values } = durationParts(value);
    return t(`ui.duration.${key}`, values);
  };
  const level = t(`trainings.filters.level.${course.level}`);
  const facts: { icon: IconName; text: string }[] = [
    { icon: "objectif", text: t("learn.course.level", { level }) },
    { icon: "horloge", text: t("learn.course.duration", { hours }) },
    {
      icon: "langue",
      text: t("learn.course.language", { language: languageName(course.language) }),
    },
  ];
  const planBadge = !open
    ? t("learn.lock.badge", { plan: planName ?? "" })
    : isFree || !planName
      ? t("learn.card.badge.free")
      : t("learn.card.badge.included", { plan: planName });

  return (
    <>
      <section
        aria-labelledby="course-title"
        className="relative grid gap-6 overflow-hidden rounded-[28px] bg-sapin p-5 text-blanc lg:grid-cols-[minmax(0,1fr)_380px] lg:p-[34px]"
      >
        <Pattern
          name="motif-points-sombre"
          size={130}
          opacity={0.55}
          className="[mask-image:linear-gradient(90deg,#000,transparent_70%)]"
        />
        <div className="relative flex min-w-0 flex-col items-start gap-4">
          <Link
            href="/app/learn/explorer"
            className="flex items-center gap-1 text-[13px] font-semibold text-neon underline-offset-4 hover:underline"
          >
            <Icon name="chev-l" className="size-4" />
            {t("learn.course.back")}
          </Link>
          <p className="flex flex-wrap gap-2 text-[11px] font-semibold">
            {course.category && (
              <span className="rounded-pill bg-lime px-2.5 py-1 text-sapin">{course.category}</span>
            )}
            <span className="rounded-pill px-2.5 py-1 text-lime ring-1 ring-lime ring-inset">
              {planBadge}
            </span>
          </p>
          <h1
            id="course-title"
            className="text-[28px] leading-[1.1] font-bold tracking-tight lg:text-[38px]"
          >
            {course.title}
          </h1>
          <p className="max-w-[640px] text-[15px] leading-6 text-blanc/85 lg:text-base">
            {course.summary}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-blanc/85">
            {facts.map((fact) => (
              <li key={fact.icon} className="flex items-center gap-1.5">
                <Icon name={fact.icon} className="size-4 text-lime" />
                {fact.text}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <Icon name="learn" className="size-4 text-lime" />
              {t("learn.card.lessons", { count: lessons.length })}
            </li>
          </ul>
        </div>
        <div className="relative order-first flex min-h-[170px] overflow-hidden rounded-[20px] bg-lime lg:order-none lg:min-h-[230px]">
          <Pattern name="motif-points-clair" size={110} opacity={0.5} blend />
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 flex size-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sapin/15"
          >
            <span className="flex size-[60px] items-center justify-center rounded-full bg-sapin text-lime">
              <Icon name="play" className="size-6" />
            </span>
          </span>
          <span
            aria-hidden
            className="absolute bottom-4 left-4 flex size-11 items-center justify-center rounded-xl bg-blanc text-sapin"
          >
            <Icon name="statistiques" className="size-5" />
          </span>
          {preview && (
            <Link
              href={previewHref}
              className="absolute right-4 bottom-4 rounded-pill bg-blanc px-3 py-1.5 text-xs font-semibold text-sapin hover:bg-creme"
            >
              {t("learn.lock.preview")}
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr]">
        <aside
          aria-label={planBadge}
          className="flex flex-col gap-4 self-start rounded-[24px] bg-blanc p-6 lg:col-start-2 lg:row-start-1"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-semibold">
              {isFree || !planName
                ? t("learn.card.badge.free")
                : t("learn.course.requiredPlan", { plan: planName })}
            </p>
            {open && !isFree && (
              <span className="flex items-center gap-1 rounded-pill bg-lime-clair px-2.5 py-1 text-[11px] font-semibold text-sapin">
                <Icon name="check" className="size-3" />
                {t("learn.course.includedInPlan")}
              </span>
            )}
          </div>
          {open ? (
            <form action={enrollAction}>
              <input type="hidden" name="slug" value={course.slug} />
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-lime text-base font-semibold text-sapin transition-transform hover:-translate-y-0.5"
              >
                {t("learn.course.start")}
                <Icon name="chev-r" className="size-4" />
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 rounded-[18px] bg-creme p-4">
              <p className="flex items-center gap-2 text-[15px] font-semibold">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blanc">
                  <Icon name="lock" className="size-4" />
                </span>
                {t("learn.lock.title", { plan: planName ?? "" })}
              </p>
              <p className="text-[13px] leading-5 text-ardoise">
                {t("learn.lock.body", { plan: planName ?? "" })}
              </p>
              <Link
                href="/tarifs"
                className="flex h-11 items-center justify-center rounded-pill bg-sapin text-sm font-semibold text-blanc hover:bg-sapin/90"
              >
                {t("learn.lock.cta")}
              </Link>
            </div>
          )}
          <form action={toggleSavedCourseAction}>
            <input type="hidden" name="slug" value={course.slug} />
            <button
              type="submit"
              aria-pressed={saved}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-pill border border-brume text-[15px] font-semibold hover:bg-creme"
            >
              <Icon name="favori" className="size-4" />
              {saved ? t("learn.card.saved") : t("learn.card.save")}
            </button>
          </form>
          <ul className="flex flex-col gap-2.5 border-t border-brume pt-4 text-sm">
            {facts.map((fact) => (
              <li key={fact.icon} className="flex items-center gap-2.5">
                <Icon name={fact.icon} className="size-4 shrink-0" />
                {fact.text}
              </li>
            ))}
            {course.certificateEnabled && (
              <li className="flex items-center gap-2.5">
                <Icon name="certificat" className="size-4 shrink-0" />
                {t("learn.course.certificate")}
              </li>
            )}
            {course.jobFamilies.length > 0 && (
              <li className="flex items-center gap-2.5">
                <Icon name="competence" className="size-4 shrink-0" />
                {[t("learn.player.exercise.jobSpecific.text"), course.jobFamilies.join(", ")].join(
                  " · ",
                )}
              </li>
            )}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-6">
            <h2 className="text-[20px] font-semibold lg:text-[22px]">{t("learn.course.about")}</h2>
            <p className="text-[15px] leading-6">{course.description}</p>
          </section>

          {course.objectives.length > 0 && (
            <section className="flex flex-col gap-4 rounded-[24px] bg-blanc p-6">
              <h2 className="text-[20px] font-semibold lg:text-[22px]">
                {t("learn.course.outcomes")}
              </h2>
              <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
                {course.objectives.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-6">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille">
                      <Icon name="check" className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="course-program"
            className="flex flex-col gap-2 rounded-[24px] bg-blanc p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="course-program" className="text-[20px] font-semibold lg:text-[22px]">
                {t("learn.course.program")}
              </h2>
              <p className="text-[13px] text-ardoise">
                {[
                  t("learn.card.modules", { count: course.modules.length }),
                  t("learn.card.lessons", { count: lessons.length }),
                  t("learn.card.duration.text", { hours }),
                ].join(" · ")}
              </p>
            </div>
            <ol className="flex flex-col">
              {course.modules.map((module, index) => (
                <li key={module.id} className="border-brume not-last:border-b">
                  <details open={index === 0} className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                      <span
                        className={cx(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                          index === 0 ? "bg-sapin text-blanc" : "bg-creme",
                        )}
                      >
                        {module.order}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-semibold">
                        {t("learn.player.toc.module", {
                          number: module.order,
                          title: module.title,
                        })}
                      </span>
                      <span className="shrink-0 text-xs text-ardoise">
                        {[
                          t("learn.card.lessons", { count: module.lessons.length }),
                          minutes(moduleMinutes(module)),
                        ].join(" · ")}
                      </span>
                      <Icon
                        name="chev-d"
                        className="size-4 shrink-0 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <ul className="mb-4 ml-4 flex flex-col gap-1 border-l-2 border-lime-clair pl-5">
                      {module.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex min-h-9 items-center gap-3 text-sm text-sapin/90"
                        >
                          <Icon
                            name={lesson.kind === "quiz" ? "quiz" : "video"}
                            className="size-4 shrink-0 text-ardoise"
                          />
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {lesson.isPreview && (
                            <Link
                              href={previewHref}
                              className="rounded-pill bg-lime px-2.5 py-0.5 text-[11px] font-semibold text-sapin"
                            >
                              {t("learn.course.previewBadge")}
                            </Link>
                          )}
                          <span className="shrink-0 text-xs text-ardoise">
                            {lesson.kind === "quiz"
                              ? t("learn.player.toc.quiz.questions", {
                                  count: lesson.quiz?._count.questions ?? 0,
                                })
                              : lesson.durationSec > 0 && clock(lesson.durationSec)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-5 self-start lg:col-start-2 lg:row-start-2">
          <section className="flex flex-col gap-2 rounded-[24px] bg-blanc p-6">
            <h2 className="text-[20px] font-semibold">{t("learn.course.prerequisites.text")}</h2>
            <p className="text-sm leading-6">
              {course.prerequisites || t("learn.course.prerequisites.none")}
            </p>
          </section>
          {course.instructor && (
            <section className="flex flex-col gap-3 rounded-[24px] bg-blanc p-6">
              <h2 className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
                {t("learn.course.instructor.text")}
              </h2>
              <p className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sapin text-lg font-bold text-lime"
                >
                  {initialsOf(course.instructor)}
                </span>
                <span className="text-base font-semibold">{course.instructor}</span>
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
