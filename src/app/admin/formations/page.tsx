import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminEmpty, AdminPageHeader } from "@/components/admin/kit";
import {
  CourseFilterBar,
  CourseListCard,
  courseFilterQuery,
  filterCourses,
  readCourseFilters,
} from "@/components/admin/formations-list";
import { CourseGallery } from "@/components/admin/formations-studio";
import { Icon } from "@/components/brand/icon";
import { ButtonLink, segmentedItem, segmentedList } from "@/components/ui";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  courseStats,
  listCoursesForAdmin,
  readinessPercents,
  studioFigures,
} from "@/server/services/course-admin";

/**
 * Studio formations (Admin v3, étape 3; partie 07 § 12): content editors and administrators. The
 * gallery of courses (or the compact list, `?vue=liste`) with the filters, the Studio figures in
 * the banner, and « Nouvelle formation », which opens /admin/formations/nouvelle.
 */
export default async function AdminCourses({ searchParams }: PageProps<"/admin/formations">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const t = await getTranslations("admin.courses");
  const all = await listCoursesForAdmin(db);
  const filters = readCourseFilters(params);
  const courses = filterCourses(all, filters);
  const list = params.vue === "liste";
  const [stats, readiness, figures] = await Promise.all([
    courseStats(
      db,
      courses.map((course) => course.id),
    ),
    readinessPercents(
      db,
      courses.filter((course) => course.status !== "published").map((course) => course.id),
    ),
    studioFigures(db, new Date()),
  ]);
  const query = courseFilterQuery(filters);
  const viewHref = (view: "galerie" | "liste") => {
    const next = new URLSearchParams(query.slice(1));
    if (view === "liste") next.set("vue", "liste");
    const text = next.toString();
    return `/admin/formations${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title={t("v3.title")}
        eyebrow={t("v3.eyebrow")}
        subtitle={t("v3.subtitle")}
        stats={[
          { label: t("v3.figures.published"), value: figures.published },
          { label: t("v3.figures.drafts"), value: figures.drafts },
          { label: t("v3.figures.enrolled"), value: figures.enrolled },
          { label: t("v3.figures.certificates"), value: figures.certificates },
        ]}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink
            href="/admin/formations/nouvelle"
            icon={<Icon name="plus" />}
            className="w-full sm:w-fit"
          >
            {t("new")}
          </ButtonLink>
          <ButtonLink
            href="/admin/formations/video"
            variant="secondary"
            icon={<Icon name="play" />}
            className="w-full sm:w-fit"
          >
            {t("quick.title")}
          </ButtonLink>
          <ButtonLink
            href="/admin/formations/domaines"
            variant="secondary"
            icon={<Icon name="grid" />}
            className="w-full sm:w-fit"
          >
            {t("domains.link")}
          </ButtonLink>
          <ButtonLink
            href="/admin/formations/parcours"
            variant="secondary"
            icon={<Icon name="objectif" />}
            className="w-full sm:w-fit"
          >
            {t("paths.link")}
          </ButtonLink>
        </div>
        <nav aria-label={t("v3.view.label")} className={segmentedList}>
          {(["galerie", "liste"] as const).map((view) => {
            const current = (view === "liste") === list;
            return (
              <Link
                key={view}
                href={viewHref(view)}
                aria-current={current ? "page" : undefined}
                className={segmentedItem(current)}
              >
                <Icon name={view === "liste" ? "liste" : "grid"} className="size-4" />
                {t(`v3.view.${view}`)}
              </Link>
            );
          })}
        </nav>
      </div>
      <CourseFilterBar
        base="/admin/formations"
        courses={all}
        filters={filters}
        shown={courses.length}
        keep={list ? { vue: "liste" } : undefined}
      />
      {courses.length === 0 ? (
        <AdminEmpty
          icon="learn"
          character={{ name: "fatou", pose: "montre" }}
          title={Object.values(filters).some(Boolean) ? t("filter.empty") : t("list.empty")}
          action={
            <ButtonLink href="/admin/formations/nouvelle" icon={<Icon name="plus" />}>
              {t("new")}
            </ButtonLink>
          }
        />
      ) : list ? (
        <CourseListCard courses={courses} filters={filters} stats={stats} detailed />
      ) : (
        <CourseGallery courses={courses} stats={stats} readiness={readiness} query={query} />
      )}
    </>
  );
}
