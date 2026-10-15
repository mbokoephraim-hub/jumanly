import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  AdminFilterBar,
  FilterMenu,
  IconTile,
  Tag,
  adminCard,
  type TagTone,
} from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import {
  catalogLevelOptions,
  courseStatuses,
  type CourseStats,
  type listCoursesForAdmin,
} from "@/server/services/course-admin";

/**
 * Course list of Jumanly Admin (mockup 07-06): the filter bar (title, status, theme, catalog level)
 * and the card « Formations » with each course and its status. Shared by /admin/formations and the
 * editor /admin/formations/[id].
 */

type Course = Awaited<ReturnType<typeof listCoursesForAdmin>>[number];
type Status = (typeof courseStatuses)[number];

export const courseStatusTone: Record<Status, TagTone> = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "outline",
};
const tileTone: Record<Status, string> = {
  draft: "bg-brume",
  review: "bg-menthe-claire",
  published: "bg-lime",
  archived: "bg-creme",
};

export type CourseFilters = { q: string; statut: string; theme: string; niveau: string };

export function readCourseFilters(query: Record<string, string | string[] | undefined>) {
  const one = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  return {
    q: one("q").trim().slice(0, 120),
    statut: one("statut"),
    theme: one("theme"),
    niveau: one("niveau"),
  } satisfies CourseFilters;
}

export function filterCourses(courses: Course[], filters: CourseFilters) {
  const q = filters.q.toLocaleLowerCase("fr");
  return courses.filter(
    (course) =>
      (!q || course.title.toLocaleLowerCase("fr").includes(q)) &&
      (!filters.statut || course.status === filters.statut) &&
      (!filters.theme || course.category === filters.theme) &&
      (!filters.niveau || course.requiredLevel === filters.niveau),
  );
}

/** Query string of the list filters, with one of them changed. */
export function courseFilterQuery(filters: CourseFilters, change: Partial<CourseFilters> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...change })) {
    if (value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function CourseFilterBar({
  base,
  courses,
  filters,
  shown,
}: {
  base: string;
  courses: Course[];
  filters: CourseFilters;
  shown: number;
}) {
  const t = await getTranslations("admin.courses");
  const themes = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort();
  const options = (key: keyof CourseFilters, values: { value: string; label: string }[]) =>
    [{ value: "", label: t("filter.all") }, ...values].map((option) => ({
      href: `${base}${courseFilterQuery(filters, { [key]: option.value })}`,
      label: option.label,
      current: filters[key] === option.value,
    }));
  return (
    <AdminFilterBar
      action={base}
      searchLabel={t("filter.search")}
      q={filters.q}
      hidden={{ statut: filters.statut, theme: filters.theme, niveau: filters.niveau }}
      aside={
        <span className="text-[12.5px] text-ardoise">{t("filter.count", { count: shown })}</span>
      }
    >
      <FilterMenu
        label={t("status.text")}
        group="course-status"
        options={options(
          "statut",
          courseStatuses.map((status) => ({ value: status, label: t(`status.${status}`) })),
        )}
      />
      {themes.length > 0 && (
        <FilterMenu
          label={t("field.theme")}
          group="course-theme"
          options={options(
            "theme",
            themes.map((theme) => ({ value: theme, label: theme })),
          )}
        />
      )}
      <FilterMenu
        label={t("filter.catalog")}
        group="course-catalog"
        options={options(
          "niveau",
          [...catalogLevelOptions, "specialized" as const].map((level) => ({
            value: level,
            label:
              level === "specialized" ? t("field.specialized") : t(`field.catalogLevel.${level}`),
          })),
        )}
      />
    </AdminFilterBar>
  );
}

/** The card « Formations »: each course with its status; the current one on Lime clair. */
export async function CourseListCard({
  courses,
  filters,
  currentId,
  detailed = false,
  stats,
}: {
  courses: Course[];
  filters: CourseFilters;
  currentId?: string;
  /** On /admin/formations: the catalog level, lessons, learners and last change of each course. */
  detailed?: boolean;
  /** Learners, completion, quiz average and attestations of each course (Admin v2, étape 6). */
  stats?: Map<string, CourseStats>;
}) {
  const t = await getTranslations("admin.courses");
  const learn = await getTranslations("learn.card");
  const query = courseFilterQuery(filters);
  return (
    <section
      aria-labelledby="admin-courses-list-title"
      className={cx(adminCard, "flex flex-col gap-1 p-3.5 lg:p-3.5")}
    >
      <div className="flex items-center justify-between gap-3 px-1 pt-1 pb-2.5">
        <h2
          id="admin-courses-list-title"
          className="text-[16px] leading-[22px] font-semibold tracking-[-0.01em]"
        >
          {t("title")}
        </h2>
        <ButtonLink href="/admin/formations#course-new-title" size="sm" icon={<Icon name="plus" />}>
          {t("new")}
        </ButtonLink>
      </div>
      {courses.length === 0 ? (
        <p className="px-2.5 py-3 text-[13px] leading-5 text-ardoise">
          {Object.values(filters).some(Boolean) ? t("filter.empty") : t("list.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {courses.map((course) => {
            const current = course.id === currentId;
            const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
            return (
              <li key={course.id}>
                <Link
                  href={`/admin/formations/${course.id}${query}`}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-2.5 rounded-[14px] p-2.5 transition-colors",
                    current ? "bg-lime-clair" : "hover:bg-creme",
                  )}
                >
                  <IconTile icon="learn" tone={tileTone[course.status]} />
                  <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <span className="text-[12.5px] leading-4 font-semibold">{course.title}</span>
                    <Tag tone={courseStatusTone[course.status]}>{t(`status.${course.status}`)}</Tag>
                    {detailed && (
                      <span className="text-[11px] leading-[15px] text-ardoise">
                        {t(stats ? "v2.listMeta" : "listMeta", {
                          access:
                            course.requiredLevel === "specialized"
                              ? t("field.specialized")
                              : t(`field.catalogLevel.${course.requiredLevel}`),
                          lessons: learn("lessons", { count: lessons }),
                          learners: course.enrollmentCount,
                        })}
                        {" · "}
                        {t("updatedAt", { date: formatDate(course.updatedAt) })}
                      </span>
                    )}
                    {detailed && stats?.get(course.id) && (
                      <CourseStatsLine stats={stats.get(course.id)!} />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

async function CourseStatsLine({ stats }: { stats: CourseStats }) {
  const t = await getTranslations("admin.courses.v2.stats");
  if (stats.enrolled === 0 || stats.completion === null)
    return <span className="text-[11px] leading-[15px] text-ardoise">{t("empty")}</span>;
  return (
    <span className="text-[11px] leading-[15px] font-medium text-sapin">
      {t("label", {
        enrolled: stats.enrolled,
        completion: t("completion", { value: stats.completion }),
        quiz: stats.quizAverage === null ? t("none") : t("quiz", { value: stats.quizAverage }),
        certificates: stats.certificates,
      })}
    </span>
  );
}
