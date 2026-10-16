import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AuditHistory } from "@/components/admin/audit";
import { AdminDone, AdminPageHeader } from "@/components/admin/kit";
import {
  CourseAttestationCard,
  RevokeCertificateSection,
} from "@/components/admin/formations-attestation";
import {
  CourseReadinessCard,
  EditorStepIntro,
  EditorStepNav,
  EditorStepPager,
  PublicationCard,
  QuizOverview,
} from "@/components/admin/formations-editor";
import { CourseDocumentsCard, LessonDocuments } from "@/components/admin/formations-documents";
import { CourseAttestationForm, CourseFicheCard } from "@/components/admin/formations-fiche";
import { DuplicateCoursePanel } from "@/components/admin/formations-readiness";
import { CourseModulesCard, LessonEditor } from "@/components/admin/formations-modules";
import { Alert } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  getCourseForAdmin,
  isEditorStep,
  programTotals,
  publishProblemKeys,
  type EditorStep,
} from "@/server/services/course-admin";
import { listCourseDocuments } from "@/server/services/course-documents";

/**
 * Course editor (partie 07 § 12, mockup 07-06; Admin v3, étape 4): the course in the banner, the
 * steps on the left (`?etape=`), the current step in the middle and « Prête à publier ? » on the
 * right. A lesson opens in a panel beside the program (`?lecon=`), a quiz beside the quiz list.
 */
export default async function AdminCourse({
  params,
  searchParams,
}: PageProps<"/admin/formations/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireCourseEditor();
  if (!user) notFound();
  const course = await getCourseForAdmin(db, id);
  if (!course) notFound();
  const t = await getTranslations("admin.courses");
  const param = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const step: EditorStep = isEditorStep(param("etape"))
    ? (param("etape") as EditorStep)
    : "informations";
  const coverError = param("erreur").startsWith("couverture-") ? param("erreur").slice(11) : "";
  const lesson =
    step === "programme" || step === "quiz"
      ? course.modules
          .flatMap((module) => module.lessons)
          .find(
            (item) => item.id === param("lecon") && (step === "programme" || item.kind === "quiz"),
          )
      : undefined;
  const publication = param("publication")
    .split(",")
    .filter((item): item is (typeof publishProblemKeys)[number] =>
      (publishProblemKeys as readonly string[]).includes(item),
    );
  const totals = programTotals(course);
  const documents = await listCourseDocuments(db, course.id);

  return (
    <>
      <AdminPageHeader
        title={course.title}
        eyebrow={t("v3.eyebrow")}
        stats={[
          { label: t("v3.editor.stats.status"), value: t(`status.${course.status}`) },
          { label: t("v3.editor.stats.modules"), value: totals.modules },
          { label: t("v3.editor.stats.lessons"), value: totals.lessons },
          {
            label: t("v3.editor.stats.duration"),
            value: t("v3.editor.stats.minutes", { minutes: totals.minutes }),
          },
        ]}
      />
      <div
        className={cx(
          "grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]",
          !lesson && "xl:grid-cols-[220px_minmax(0,1fr)_300px]",
        )}
      >
        <EditorStepNav course={course} current={step} documents={documents.length} />
        <div className="flex min-w-0 flex-col gap-4">
          {param("ok") === "creee" && <Alert tone="success" title={t("created")} />}
          {param("ok") === "modele" && <Alert tone="success" title={t("v3.createdFromTemplate")} />}
          {param("ok") === "copie" && <Alert tone="success" title={t("v2.duplicate.done")} />}
          {(coverError === "fileType" ||
            coverError === "fileSize" ||
            coverError === "notFound") && (
            <Alert tone="error" title={t(`v2.cover.error.${coverError}`)} />
          )}
          {param("ok") === "fiche" && (
            <AdminDone title={t("saved")} journal={{ type: "course", id: course.id }} />
          )}
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
          {param("action") === "dupliquer" && <DuplicateCoursePanel course={course} step={step} />}

          <EditorStepIntro step={step} />
          {(step === "informations" || step === "public") && (
            <CourseFicheCard course={course} step={step} />
          )}
          {(step === "programme" || step === "quiz") && (
            <div
              className={cx(
                "grid grid-cols-[minmax(0,1fr)] items-start gap-4",
                lesson && "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]",
              )}
            >
              {step === "programme" ? (
                <CourseModulesCard course={course} openLessonId={lesson?.id} />
              ) : (
                <QuizOverview course={course} openLessonId={lesson?.id} />
              )}
              {lesson && (
                <div className="xl:sticky xl:top-4">
                  <LessonEditor
                    course={course}
                    lessonId={lesson.id}
                    query={param}
                    step={step}
                    documents={
                      <LessonDocuments
                        course={course}
                        lessonId={lesson.id}
                        documents={documents}
                        step={step}
                        query={param}
                      />
                    }
                  />
                </div>
              )}
            </div>
          )}
          {step === "documents" && (
            <CourseDocumentsCard course={course} documents={documents} query={param} />
          )}
          {step === "attestation" && (
            <>
              <CourseAttestationForm course={course} />
              <CourseAttestationCard course={course} />
              {user.platformRole === "platform_admin" && (
                <RevokeCertificateSection course={course} query={param} />
              )}
            </>
          )}
          {step === "publication" && (
            <>
              <PublicationCard course={course} />
              <AuditHistory targetType="course" targetId={course.id} />
            </>
          )}
          <EditorStepPager
            course={course}
            step={step}
            form={step === "informations" || step === "public"}
          />
        </div>
        {!lesson && (
          <div className="lg:col-start-2 xl:sticky xl:top-4 xl:col-start-auto">
            <CourseReadinessCard course={course} step={step} />
          </div>
        )}
      </div>
    </>
  );
}
