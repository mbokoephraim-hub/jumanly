import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
import {
  addLessonAction,
  addModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  deleteQuestionAction,
  renameModuleAction,
  revokeCertificateAction,
  saveQuestionAction,
  setCourseStatusAction,
  updateCourseAction,
  updateLessonAction,
  updateQuizAction,
} from "@/server/actions/course-admin";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  answerForEditor,
  catalogLevelOptions,
  courseStatuses,
  getCourseForAdmin,
  lessonKinds,
  questionTypes,
  type AdminCourse,
} from "@/server/services/course-admin";
import { lessonParagraphs, parseResources } from "@/server/services/learn";

const statusTones = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "neutral",
} as const;
const problems = ["lessons", "instructor", "summary", "quiz"] as const;
const kindLabel = (kind: string) => (kind === "text" ? "textLesson" : kind) as "textLesson";

/** Course editor (partie 07 § 12): fields, modules, lessons, quizzes, status and attestations. */
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
  const levels = await getTranslations("trainings.filters.level");
  const param = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const lessons = course.modules.flatMap((module) => module.lessons);
  const lesson = lessons.find((item) => item.id === param("lecon"));
  const publication = param("publication")
    .split(",")
    .filter((item): item is (typeof problems)[number] =>
      (problems as readonly string[]).includes(item),
    );
  const hidden = <input type="hidden" name="course" value={course.id} />;

  return (
    <>
      <Link
        href="/admin/formations"
        className="self-start font-semibold underline underline-offset-4"
      >
        {t("back")}
      </Link>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-h1">{course.title}</h1>
        <Badge tone={statusTones[course.status]}>{t(`status.${course.status}`)}</Badge>
        {course.status === "published" && (
          <ButtonLink href={`/formations/${course.slug}`} variant="tertiary" size="sm">
            {t("viewPublic")}
          </ButtonLink>
        )}
      </header>

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

      <form
        action={setCourseStatusAction}
        className="flex flex-col gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-end"
      >
        {hidden}
        <div className="flex-1">
          <Select
            id="course-status"
            name="status"
            label={t("status.text")}
            hint={t("publish.check")}
            defaultValue={course.status}
            options={courseStatuses.map((status) => ({
              value: status,
              label: t(`status.${status}`),
            }))}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("status.change")}
        </Button>
      </form>

      <CourseFields course={course} levels={courseLevelOptions(levels)} />

      <section
        id="programme"
        className="flex scroll-mt-6 flex-col gap-4"
        aria-labelledby="programme-title"
      >
        <h2 id="programme-title" className="text-h2">
          {t("modules")}
        </h2>
        {course.modules.length === 0 && <p className="text-ardoise">{t("modulesEmpty")}</p>}
        {course.modules.map((module) => (
          <div key={module.id} className="flex flex-col gap-3 rounded-card bg-blanc p-5">
            <form
              action={renameModuleAction}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              {hidden}
              <input type="hidden" name="module" value={module.id} />
              <div className="flex-1">
                <TextField
                  id={`module-${module.id}-title`}
                  name="title"
                  label={t("module.number", { number: module.order })}
                  defaultValue={module.title}
                  required
                  maxLength={160}
                />
              </div>
              <Button type="submit" variant="tertiary" size="sm">
                {t("module.rename")}
              </Button>
            </form>
            {module.lessons.length === 0 ? (
              <p className="text-sm text-ardoise">{t("module.empty")}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {module.lessons.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brume p-3"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{item.title}</span>
                      <Badge>{t(`lesson.kind.${kindLabel(item.kind)}`)}</Badge>
                      {item.isPreview && <Badge tone="learn">{t("lesson.previewBadge")}</Badge>}
                      {item.jobSpecific && (
                        <Badge tone="career">{t("lesson.jobSpecific.badge")}</Badge>
                      )}
                    </span>
                    <span className="flex gap-2">
                      <ButtonLink
                        href={`/admin/formations/${course.id}?lecon=${item.id}#lecon`}
                        variant="tertiary"
                        size="sm"
                      >
                        {t("lesson.edit")}
                      </ButtonLink>
                      <form action={deleteLessonAction}>
                        {hidden}
                        <input type="hidden" name="lesson" value={item.id} />
                        <Button type="submit" variant="tertiary" size="sm">
                          {t("lesson.delete")}
                        </Button>
                      </form>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <form
              action={addLessonAction}
              className="grid gap-3 border-t border-brume pt-3 sm:grid-cols-[1fr_200px_auto] sm:items-end"
            >
              {hidden}
              <input type="hidden" name="module" value={module.id} />
              <TextField
                id={`module-${module.id}-lesson`}
                name="title"
                label={t("lesson.title")}
                required
                maxLength={160}
              />
              <Select
                id={`module-${module.id}-kind`}
                name="kind"
                label={t("lesson.kind.text")}
                defaultValue="video"
                options={lessonKinds.map((kind) => ({
                  value: kind,
                  label: t(`lesson.kind.${kindLabel(kind)}`),
                }))}
              />
              <Button type="submit" variant="secondary">
                {t("lesson.add")}
              </Button>
            </form>
            <form action={deleteModuleAction} className="self-end">
              {hidden}
              <input type="hidden" name="module" value={module.id} />
              <Button type="submit" variant="tertiary" size="sm">
                {t("module.delete")}
              </Button>
            </form>
          </div>
        ))}
        <form
          action={addModuleAction}
          className="flex flex-col gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-end"
        >
          {hidden}
          <div className="flex-1">
            <TextField
              id="module-new-title"
              name="title"
              label={t("module.title")}
              required
              maxLength={160}
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("module.add")}
          </Button>
        </form>
      </section>

      {lesson && <LessonEditor course={course} lessonId={lesson.id} query={param} />}

      <section
        id="attestation"
        className="flex scroll-mt-6 flex-col gap-3 rounded-card bg-blanc p-5"
        aria-labelledby="attestation-title"
      >
        <h2 id="attestation-title" className="text-h2">
          {t("certificate.revoke.text")}
        </h2>
        {param("attestation") === "revoquee" && (
          <Alert tone="success" title={t("certificate.revoke.done")} />
        )}
        {param("attestation") === "introuvable" && (
          <Alert tone="error" title={t("certificate.revoke.notFound")} />
        )}
        <form
          action={revokeCertificateAction}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          {hidden}
          <div className="flex-1">
            <TextField
              id="certificate-revoke-code"
              name="code"
              label={t("certificate.revoke.code")}
              required
              maxLength={20}
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("certificate.revoke.submit")}
          </Button>
        </form>
      </section>
    </>
  );
}

function courseLevelOptions(levels: (key: "beginner" | "intermediate" | "advanced") => string) {
  return (["beginner", "intermediate", "advanced"] as const).map((level) => ({
    value: level,
    label: levels(level),
  }));
}

async function CourseFields({
  course,
  levels,
}: {
  course: AdminCourse;
  levels: { value: string; label: string }[];
}) {
  const t = await getTranslations("admin.courses");
  return (
    <section
      id="fiche"
      className="flex scroll-mt-6 flex-col gap-4 rounded-card bg-blanc p-5"
      aria-labelledby="fiche-title"
    >
      <h2 id="fiche-title" className="text-h2">
        {t("details")}
      </h2>
      <form action={updateCourseAction} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="course" value={course.id} />
        <TextField
          id="course-title"
          name="title"
          label={t("field.title")}
          defaultValue={course.title}
          required
          minLength={3}
          maxLength={160}
        />
        <TextField
          id="course-slug"
          name="slug"
          label={t("field.slug")}
          hint={t("field.slugHint")}
          defaultValue={course.slug}
          maxLength={80}
        />
        <div className="md:col-span-2">
          <TextField
            id="course-summary"
            name="summary"
            label={t("field.summary")}
            defaultValue={course.summary}
            maxLength={300}
          />
        </div>
        <div className="md:col-span-2">
          <TextArea
            id="course-description"
            name="description"
            label={t("field.description")}
            defaultValue={course.description}
            maxLength={5000}
            rows={5}
          />
        </div>
        <div className="md:col-span-2">
          <TextArea
            id="course-objectives"
            name="objectives"
            label={t("field.outcomes")}
            hint={t("field.outcomesHint")}
            defaultValue={course.objectives.join("\n")}
            maxLength={3000}
          />
        </div>
        <TextField
          id="course-audience"
          name="audience"
          label={t("field.audience")}
          defaultValue={course.audience}
          maxLength={500}
        />
        <TextField
          id="course-category"
          name="category"
          label={t("field.theme")}
          defaultValue={course.category}
          maxLength={80}
        />
        <Select
          id="course-level"
          name="level"
          label={t("field.level")}
          defaultValue={course.level}
          options={levels}
        />
        <TextField
          id="course-language"
          name="language"
          label={t("field.language")}
          hint={t("field.languageHint")}
          defaultValue={course.language}
          required
          maxLength={8}
        />
        <TextField
          id="course-duration"
          name="durationMinutes"
          type="number"
          min={1}
          label={t("field.duration")}
          defaultValue={String(course.durationMinutes)}
          required
        />
        <TextField
          id="course-instructor"
          name="instructor"
          label={t("field.instructor")}
          defaultValue={course.instructor ?? ""}
          maxLength={120}
        />
        <Select
          id="course-required-level"
          name="requiredLevel"
          label={t("field.catalogLevel.text")}
          defaultValue={course.requiredLevel}
          options={catalogLevelOptions.map((level) => ({
            value: level,
            label: t(`field.catalogLevel.${level}`),
          }))}
        />
        <TextField
          id="course-job-families"
          name="jobFamilies"
          label={t("field.jobFamilies.text")}
          hint={t("field.jobFamilies.hint")}
          defaultValue={course.jobFamilies.join(", ")}
          maxLength={500}
        />
        <TextField
          id="course-cover"
          name="coverUrl"
          label={t("field.cover")}
          defaultValue={course.coverUrl ?? ""}
          maxLength={500}
        />
        <div className="md:col-span-2">
          <TextArea
            id="course-prerequisites"
            name="prerequisites"
            label={t("field.prerequisites")}
            defaultValue={course.prerequisites ?? ""}
            maxLength={1000}
            rows={2}
          />
        </div>
        <div className="md:col-span-2">
          <TextField
            id="course-skills"
            name="skills"
            label={t("field.skills.text")}
            hint={[t("field.skills.hint"), t("field.skillsFormat")].join(" ")}
            defaultValue={course.skills.map((item) => item.skill.name).join(", ")}
            maxLength={500}
          />
        </div>
        <div className="md:col-span-2">
          <Checkbox
            id="course-certificate"
            name="certificateEnabled"
            label={t("certificate.enabled")}
            defaultChecked={course.certificateEnabled}
          />
        </div>
        <Button type="submit" className="self-start">
          {t("save")}
        </Button>
      </form>
    </section>
  );
}

async function LessonEditor({
  course,
  lessonId,
  query,
}: {
  course: AdminCourse;
  lessonId: string;
  query: (key: string) => string;
}) {
  const t = await getTranslations("admin.courses");
  const lesson = course.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.id === lessonId)!;
  const hidden = (
    <>
      <input type="hidden" name="course" value={course.id} />
      <input type="hidden" name="lesson" value={lesson.id} />
    </>
  );
  const ignored = Number(query("ignorees")) || 0;
  return (
    <section
      id="lecon"
      className="flex scroll-mt-6 flex-col gap-4 rounded-card bg-blanc p-5"
      aria-labelledby="lecon-title"
    >
      <h2 id="lecon-title" className="text-h2">
        {t("lesson.editing", { title: lesson.title })}
      </h2>
      {query("ok") === "lecon" && <Alert tone="success" title={t("lesson.saved")} />}
      {query("erreur") === "lecon" && <Alert tone="error" title={t("invalid")} />}
      {ignored > 0 && (
        <Alert tone="warning" title={t("lesson.resourcesInvalid", { count: ignored })} />
      )}
      <form action={updateLessonAction} className="grid gap-4 md:grid-cols-2">
        {hidden}
        <TextField
          id="lesson-title"
          name="title"
          label={t("lesson.title")}
          defaultValue={lesson.title}
          required
          maxLength={160}
        />
        <Select
          id="lesson-kind"
          name="kind"
          label={t("lesson.kind.text")}
          defaultValue={lesson.kind}
          options={lessonKinds.map((kind) => ({
            value: kind,
            label: t(`lesson.kind.${kindLabel(kind)}`),
          }))}
        />
        <TextField
          id="lesson-video"
          name="videoId"
          label={t("lesson.video.id")}
          hint={t("lesson.video.hint")}
          defaultValue={lesson.videoId ?? ""}
          maxLength={300}
        />
        <TextField
          id="lesson-duration"
          name="durationMinutes"
          type="number"
          min={0}
          label={t("lesson.duration")}
          defaultValue={String(Math.round(lesson.durationSec / 60))}
        />
        <div className="md:col-span-2">
          <TextArea
            id="lesson-content"
            name="paragraphs"
            label={t("lesson.content")}
            hint={t("lesson.contentHint")}
            defaultValue={lessonParagraphs(lesson.content).join("\n\n")}
            rows={8}
          />
        </div>
        <div className="md:col-span-2">
          <TextArea
            id="lesson-resources"
            name="resources"
            label={t("lesson.resources")}
            hint={t("lesson.resourcesHint")}
            defaultValue={parseResources(lesson.resources)
              .map((resource) => [resource.title, resource.url, resource.type].join(" | "))
              .join("\n")}
            rows={3}
          />
        </div>
        <div className="md:col-span-2">
          <TextArea
            id="lesson-transcript"
            name="transcript"
            label={t("lesson.transcript")}
            defaultValue={lesson.transcript ?? ""}
            rows={4}
          />
        </div>
        <div className="md:col-span-2">
          <Checkbox
            id="lesson-preview"
            name="isPreview"
            label={t("lesson.isPreview")}
            defaultChecked={lesson.isPreview}
          />
        </div>
        <div className="md:col-span-2">
          <Checkbox
            id="lesson-job-specific"
            name="jobSpecific"
            label={t("lesson.jobSpecific.text")}
            hint={t("lesson.jobSpecific.hint")}
            defaultChecked={lesson.jobSpecific}
          />
        </div>
        <Button type="submit" className="self-start">
          {t("lesson.save")}
        </Button>
      </form>

      {lesson.kind === "quiz" && lesson.quiz && (
        <div id="quiz" className="flex scroll-mt-6 flex-col gap-4 border-t border-brume pt-4">
          <h3 className="font-semibold text-h3">{t("quiz.title")}</h3>
          {query("ok") === "quiz" && <Alert tone="success" title={t("quiz.saved")} />}
          {query("erreur") === "question" && (
            <Alert tone="error" title={t("quiz.question.invalid")} />
          )}
          {query("erreur") === "quiz" && <Alert tone="error" title={t("invalid")} />}
          <form
            action={updateQuizAction}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            {hidden}
            <TextField
              id="quiz-pass"
              name="passingScore"
              type="number"
              min={1}
              max={100}
              label={t("quiz.passScore")}
              defaultValue={String(lesson.quiz.passingScore)}
              required
            />
            <TextField
              id="quiz-attempts"
              name="maxAttempts"
              type="number"
              min={0}
              max={20}
              label={t("quiz.attempts")}
              defaultValue={String(lesson.quiz.maxAttempts)}
              required
            />
            <Button type="submit" variant="secondary">
              {t("quiz.save")}
            </Button>
          </form>
          {lesson.quiz.questions.length === 0 && <p className="text-ardoise">{t("quiz.empty")}</p>}
          {[...lesson.quiz.questions, null].map((question, index) => {
            const prefix = `question-${question?.id ?? "new"}`;
            return (
              <form
                key={question?.id ?? "new"}
                action={saveQuestionAction}
                className="grid gap-3 rounded-md border border-brume p-4 md:grid-cols-2"
              >
                {hidden}
                <input type="hidden" name="question" value={question?.id ?? ""} />
                <p className="font-semibold md:col-span-2">
                  {question
                    ? t("quiz.question.number", { number: index + 1 })
                    : t("quiz.question.add")}
                </p>
                <div className="md:col-span-2">
                  <TextField
                    id={`${prefix}-prompt`}
                    name="prompt"
                    label={t("quiz.question.prompt")}
                    defaultValue={question?.prompt ?? ""}
                    required
                    minLength={3}
                    maxLength={500}
                  />
                </div>
                <Select
                  id={`${prefix}-type`}
                  name="type"
                  label={t("quiz.question.type")}
                  defaultValue={question?.type ?? "single"}
                  options={questionTypes.map((type) => ({
                    value: type,
                    label: t(`quiz.questionType.${type}`),
                  }))}
                />
                <TextArea
                  id={`${prefix}-answer`}
                  name="answer"
                  label={t("quiz.question.answer")}
                  hint={t("quiz.question.answerHint")}
                  defaultValue={question ? answerForEditor(question) : ""}
                  required
                  rows={2}
                />
                <TextArea
                  id={`${prefix}-options`}
                  name="options"
                  label={t("quiz.question.options")}
                  defaultValue={question?.options.join("\n") ?? ""}
                  rows={4}
                />
                <TextArea
                  id={`${prefix}-explanation`}
                  name="explanation"
                  label={t("quiz.question.explanation")}
                  defaultValue={question?.explanation ?? ""}
                  rows={4}
                />
                <div className="flex gap-3 md:col-span-2">
                  <Button type="submit" variant="secondary">
                    {t("quiz.question.save")}
                  </Button>
                  {question && (
                    <Button
                      type="submit"
                      variant="tertiary"
                      formAction={deleteQuestionAction}
                      formNoValidate
                    >
                      {t("quiz.question.delete")}
                    </Button>
                  )}
                </div>
              </form>
            );
          })}
        </div>
      )}
    </section>
  );
}
