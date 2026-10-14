import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { CheckList } from "@/components/site/sections";
import { Alert, Badge, Button, ButtonLink } from "@/components/ui";
import { languageName } from "@/lib/dates";
import { enrollAction, toggleSavedCourseAction } from "@/server/actions/learn";
import { lessonsOf, type LearnerCourse } from "@/server/services/learn";

/** The course before the learner starts it: what it teaches, its program, start or lock (partie 07 § 3). */
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

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/learn"
        className="flex items-center gap-1 self-start font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t("learn.course.back")}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col items-start gap-3">
            <Badge tone={isFree ? "learn" : "sapin"}>
              {isFree || !planName
                ? t("learn.card.badge.free")
                : t("learn.course.requiredPlan", { plan: planName })}
            </Badge>
            <h1 className="text-h1">{course.title}</h1>
            <p className="text-lg leading-8 text-ardoise">{course.summary}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
              <li>
                {t("learn.course.level", { level: t(`trainings.filters.level.${course.level}`) })}
              </li>
              <li>{t("learn.course.duration", { hours })}</li>
              <li>{t("learn.course.language", { language: languageName(course.language) })}</li>
              <li>{t("learn.card.lessons", { count: lessons.length })}</li>
            </ul>
            {course.certificateEnabled && (
              <p className="flex items-center gap-2 text-[15px]">
                <Icon name="certificat" className="size-5" />
                {t("learn.course.certificate")}
              </p>
            )}
          </header>

          <section className="flex flex-col gap-3 rounded-card bg-blanc p-5 md:p-6">
            <h2 className="text-h2">{t("learn.course.about")}</h2>
            <p className="text-[17px] leading-8">{course.description}</p>
            {course.objectives.length > 0 && (
              <>
                <h2 className="mt-2 text-h2">{t("learn.course.outcomes")}</h2>
                <CheckList items={course.objectives} />
              </>
            )}
            <h2 className="mt-2 text-h2">{t("learn.course.prerequisites.text")}</h2>
            <p className="text-[15px] leading-7">
              {course.prerequisites || t("learn.course.prerequisites.none")}
            </p>
            {course.instructor && (
              <>
                <h2 className="mt-2 text-h2">{t("learn.course.instructor.text")}</h2>
                <p className="text-[15px]">{course.instructor}</p>
              </>
            )}
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="course-program">
            <h2 id="course-program" className="text-h2">
              {t("learn.course.program")}
            </h2>
            <ol className="flex flex-col gap-3">
              {course.modules.map((module) => (
                <li key={module.id} className="rounded-card bg-blanc p-5">
                  <h3 className="font-semibold">
                    {t("learn.player.toc.module", { number: module.order, title: module.title })}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center gap-2">
                        <Icon
                          name={lesson.kind === "quiz" ? "quiz" : "cours-video"}
                          className="size-4 shrink-0"
                        />
                        {lesson.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-3 self-start rounded-card bg-blanc p-5">
          {open ? (
            <form action={enrollAction}>
              <input type="hidden" name="slug" value={course.slug} />
              <Button type="submit" size="lg" fullWidth>
                {t("learn.course.start")}
              </Button>
            </form>
          ) : (
            <Alert tone="info" title={t("learn.lock.title", { plan: planName ?? "" })}>
              {t("learn.lock.body", { plan: planName ?? "" })}
            </Alert>
          )}
          {!open && (
            <ButtonLink href="/tarifs" fullWidth>
              {t("learn.lock.cta")}
            </ButtonLink>
          )}
          {!open && preview && (
            <ButtonLink href={`/formations/${course.slug}`} variant="tertiary" fullWidth>
              {t("learn.lock.preview")}
            </ButtonLink>
          )}
          <form action={toggleSavedCourseAction}>
            <input type="hidden" name="slug" value={course.slug} />
            <Button type="submit" variant="tertiary" fullWidth aria-pressed={saved}>
              {saved ? t("learn.card.saved") : t("learn.card.save")}
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
