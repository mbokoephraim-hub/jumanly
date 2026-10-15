import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader } from "@/components/admin/kit";
import {
  CourseAttestationCard,
  RevokeCertificateSection,
} from "@/components/admin/formations-attestation";
import { CourseFicheCard } from "@/components/admin/formations-fiche";
import {
  CourseFilterBar,
  CourseListCard,
  filterCourses,
  readCourseFilters,
} from "@/components/admin/formations-list";
import { CourseModulesCard, LessonEditor } from "@/components/admin/formations-modules";
import { Alert } from "@/components/ui";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { getCourseForAdmin, listCoursesForAdmin } from "@/server/services/course-admin";

const problems = ["lessons", "instructor", "summary", "quiz"] as const;

/**
 * Course editor (partie 07 § 12, mockup 07-06): the list on the left; on the right the course card,
 * the modules and lessons, the attestation and publication, then the revocation of an attestation.
 */
export default async function AdminCourse({
  params,
  searchParams,
}: PageProps<"/admin/formations/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const course = await getCourseForAdmin(db, id);
  if (!course) notFound();
  const t = await getTranslations("admin.courses");
  const param = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const all = await listCoursesForAdmin(db);
  const filters = readCourseFilters(query);
  const courses = filterCourses(all, filters);
  const lesson = course.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.id === param("lecon"));
  const publication = param("publication")
    .split(",")
    .filter((item): item is (typeof problems)[number] =>
      (problems as readonly string[]).includes(item),
    );

  return (
    <>
      <AdminPageHeader title={t("title")} />
      <CourseFilterBar
        base={`/admin/formations/${course.id}`}
        courses={all}
        filters={filters}
        shown={courses.length}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <CourseListCard courses={courses} filters={filters} currentId={course.id} />
        <div className="flex min-w-0 flex-col gap-4">
          {param("ok") === "creee" && <Alert tone="success" title={t("created")} />}
          {param("ok") === "fiche" && <Alert tone="success" title={t("saved")} />}
          {param("ok") === "statut" && (
            <Alert
              tone="success"
              title={course.status === "published" ? t("published") : t("status.saved")}
            />
          )}
          {param("erreur") === "fiche" && <Alert tone="error" title={t("invalid")} />}
          {param("inconnues") && (
            <Alert tone="warning" title={t("skillsUnknown", { names: param("inconnues") })} />
          )}
          {publication.length > 0 && (
            <Alert tone="error" title={t("publish.check")}>
              <ul className="list-disc pl-5">
                {publication.map((problem) => (
                  <li key={problem}>{t(`publish.problem.${problem}`)}</li>
                ))}
              </ul>
            </Alert>
          )}

          <CourseFicheCard course={course} />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <CourseModulesCard course={course} openLessonId={lesson?.id} />
            <CourseAttestationCard course={course} />
          </div>
          {lesson && <LessonEditor course={course} lessonId={lesson.id} query={param} />}
          <RevokeCertificateSection course={course} query={param} />
        </div>
      </div>
    </>
  );
}
