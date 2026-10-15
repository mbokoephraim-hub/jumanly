/* eslint-disable @next/next/no-img-element -- covers are served by /medias at a known width */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Tag } from "@/components/admin/kit";
import { courseStatusTone } from "@/components/admin/formations-list";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import type { CourseStats, listCoursesForAdmin } from "@/server/services/course-admin";
import { coverAt } from "@/server/services/course-media";

/**
 * Studio formations (Admin v3, étape 3): the gallery of courses. Each card shows its cover (or a
 * generated one in the brand gradients), status, access, duration, program size and figures; a
 * draft shows its « prête à publier » ring.
 */

type Course = Awaited<ReturnType<typeof listCoursesForAdmin>>[number];

// Generated covers: one brand gradient per theme, always the same for a given theme.
const coverTones = [
  "bg-[linear-gradient(135deg,#d9fa72_0%,#7de36b_50%,#1e9a64_100%)] text-sapin",
  "bg-[linear-gradient(135deg,#0f3f37_0%,#14745f_55%,#2fd3a6_100%)] text-blanc",
  "bg-[linear-gradient(160deg,#0f3f37_0%,#0b1a1f_100%)] text-blanc",
  "bg-[linear-gradient(135deg,#e3f67c_0%,#bfefdf_100%)] text-sapin",
] as const;

function toneOf(theme: string) {
  let hash = 0;
  for (const char of theme) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return coverTones[hash % coverTones.length];
}

/** A cover drawn from the theme when no image was sent: brand gradient, dots, Learn icon. */
export function GeneratedCover({ title, theme }: { title: string; theme: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "relative flex size-full items-end overflow-hidden p-4",
        toneOf(theme || title),
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.16)_1.2px,transparent_1.4px)] bg-size-[16px_16px]" />
      <span className="absolute -top-6 -right-6 size-36 rounded-full bg-blanc/12" />
      <span className="absolute top-8 right-10 size-16 rounded-full bg-blanc/10" />
      <span className="relative grid size-14 place-items-center rounded-[18px] bg-blanc/25 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)] backdrop-blur-sm">
        <Icon name="learn" className="size-7" />
      </span>
    </span>
  );
}

/** Readiness ring of a draft (0 to 100). */
function ReadinessRing({ percent, text, label }: { percent: number; text: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-blanc/95 shadow-[0_6px_16px_rgba(11,26,31,0.18)]"
      style={{
        backgroundImage: `conic-gradient(var(--color-feuille) ${percent}%, var(--color-brume) 0)`,
      }}
    >
      <span className="grid size-[34px] place-items-center rounded-full bg-blanc text-[10.5px] font-semibold text-sapin">
        {text}
      </span>
    </span>
  );
}

export async function CourseGallery({
  courses,
  stats,
  readiness,
  query,
}: {
  courses: Course[];
  stats: Map<string, CourseStats>;
  readiness: Map<string, number>;
  query: string;
}) {
  const [t, learn] = await Promise.all([
    getTranslations("admin.courses"),
    getTranslations("learn.card"),
  ]);
  return (
    <ul
      aria-label={t("title")}
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {courses.map((course) => {
        const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
        const figures = stats.get(course.id);
        const percent = readiness.get(course.id);
        const access =
          course.requiredLevel === "specialized"
            ? t("field.specialized")
            : t(`field.catalogLevel.${course.requiredLevel}`);
        return (
          <li key={course.id}>
            <Link
              href={`/admin/formations/${course.id}${query}`}
              className="jm-admin-card group flex h-full flex-col overflow-hidden rounded-[24px] bg-blanc focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)] focus-visible:outline-none"
            >
              <span className="relative block aspect-video overflow-hidden">
                {course.coverUrl ? (
                  <img
                    src={coverAt(course.coverUrl, 480)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                ) : (
                  <GeneratedCover title={course.title} theme={course.category} />
                )}
                <span className="absolute top-3 right-3">
                  <Tag tone={courseStatusTone[course.status]} className="shadow-sm">
                    {t(`status.${course.status}`)}
                  </Tag>
                </span>
                {percent !== undefined && course.status !== "published" && (
                  <span className="absolute right-3 bottom-3">
                    <ReadinessRing
                      percent={percent}
                      text={t("v2.readiness.percent", { percent })}
                      label={t("v2.readiness.label", { percent })}
                    />
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-2 p-4">
                {course.category && (
                  <span className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-ardoise uppercase">
                    {course.category}
                  </span>
                )}
                <span className="text-[15px] leading-5 font-semibold tracking-[-0.01em]">
                  {course.title}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <Tag tone="neutral" icon="lock">
                    {access}
                  </Tag>
                  <Tag tone="menthe" icon="horloge">
                    {t("v3.gallery.duration", { minutes: course.durationMinutes })}
                  </Tag>
                </span>
                <span className="text-[12px] leading-4 text-ardoise">
                  {t("v3.gallery.program", { modules: course.modules.length })}
                  {" · "}
                  {learn("lessons", { count: lessons })}
                </span>
                <span className="mt-auto border-t border-brume pt-2.5 text-[11.5px] leading-4">
                  {!figures || figures.enrolled === 0 || figures.completion === null ? (
                    <span className="text-ardoise">{t("v2.stats.empty")}</span>
                  ) : (
                    <span className="font-medium">
                      {t("v2.stats.label", {
                        enrolled: figures.enrolled,
                        completion: t("v2.stats.completion", { value: figures.completion }),
                        quiz:
                          figures.quizAverage === null
                            ? t("v2.stats.none")
                            : t("v2.stats.quiz", { value: figures.quizAverage }),
                        certificates: figures.certificates,
                      })}
                    </span>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
