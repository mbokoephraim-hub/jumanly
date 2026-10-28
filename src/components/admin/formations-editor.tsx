import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { IconTile, Tag, adminCard, adminLabel, adminTitle } from "@/components/admin/kit";
import { courseStatusTone } from "@/components/admin/formations-list";
import { ReadinessRing } from "@/components/admin/formations-studio";
import { Icon, type IconName } from "@/components/brand/icon";
import { Button, ButtonLink, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { setCourseStatusAction } from "@/server/actions/course-admin";
import {
  courseReadiness,
  courseStatuses,
  editorStepOf,
  editorSteps,
  type AdminCourse,
  type EditorStep,
  type ReadinessStep,
} from "@/server/services/course-admin";

/** The step of the guided path « Prête à publier ? » each editor step stands for. */
const readinessOf = Object.fromEntries(
  Object.entries(editorStepOf).map(([readiness, step]) => [step, readiness]),
) as Partial<Record<EditorStep, ReadinessStep>>;

type Translate = Awaited<ReturnType<typeof getTranslations<"admin.courses">>>;

/** Name of a step: the step of the guided path, or « Documents » (no publication check). */
const stepName = (t: Translate, step: EditorStep) => {
  const readiness = readinessOf[step];
  return readiness ? t(`v2.step.${readiness}`) : t("v3.editor.documents.step");
};

export const editorHref = (courseId: string, step: EditorStep, anchor = "") =>
  `/admin/formations/${courseId}?etape=${step}${anchor}`;

/** The icon of each editor step: the step menu shows icons, the name in a bubble (28/10/2026). */
export const stepIcon: Record<EditorStep, IconName> = {
  informations: "edit",
  public: "objectif",
  programme: "liste",
  documents: "doc",
  quiz: "quiz",
  attestation: "certificat",
  publication: "partager",
};

/**
 * The steps of the course editor (Admin v3, étape 4; simplified 28/10/2026): a narrow column of
 * icons on a computer, the name in a bubble on hover or focus, so the editing frame gets the room;
 * a row of icons to scroll on a phone, the current step with its name. Each shows whether it is
 * complete.
 */
export async function EditorStepNav({
  course,
  current,
  documents,
}: {
  course: AdminCourse;
  current: EditorStep;
  /** Number of PDF documents: the « Documents » step is ticked when there is one. */
  documents: number;
}) {
  const t = await getTranslations("admin.courses");
  const readiness = courseReadiness(course);
  const done = (step: EditorStep) =>
    step === "documents"
      ? documents > 0
      : (readiness.steps.find((item) => item.step === readinessOf[step])?.done ?? false);
  const bubble =
    "pointer-events-none absolute top-1/2 left-[calc(100%+10px)] z-20 hidden -translate-y-1/2 rounded-[10px] bg-sapin px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-blanc opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block";
  return (
    <nav
      aria-label={t("v3.editor.nav")}
      className="jm-admin-card min-w-0 rounded-[22px] bg-blanc p-1.5 lg:sticky lg:top-4 lg:w-16 lg:p-2"
    >
      <ol className="relative flex items-center gap-1.5 overflow-x-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
        <li className="shrink-0">
          <Link
            href="/admin/formations"
            aria-label={t("v3.editor.studio")}
            className="group relative grid size-11 place-items-center rounded-[14px] text-ardoise hover:bg-creme hover:text-sapin"
          >
            <Icon name="chev-l" className="size-[18px]" />
            <span aria-hidden className={bubble}>
              {t("v3.editor.studio")}
            </span>
          </Link>
        </li>
        <li aria-hidden className="h-6 w-px shrink-0 bg-brume lg:h-px lg:w-8" />
        {editorSteps.map((step) => {
          const on = step === current;
          const complete = done(step);
          const name = stepName(t, step);
          return (
            <li key={step} className="shrink-0">
              <Link
                href={editorHref(course.id, step)}
                aria-current={on ? "step" : undefined}
                className={cx(
                  "group relative flex h-11 items-center gap-2 rounded-[14px] text-[13px] font-semibold whitespace-nowrap lg:w-11 lg:justify-center lg:px-0",
                  on
                    ? "bg-sapin bg-(image:--jm-degrade-rail-h) pr-3.5 pl-3 text-lime shadow-[0_10px_24px_-14px_rgb(15_63_55/0.8)] lg:pr-0 lg:pl-0"
                    : "w-11 justify-center text-sapin hover:bg-creme",
                )}
              >
                <Icon name={stepIcon[step]} className="size-5 shrink-0" />
                {/* On a phone the current step shows its name; elsewhere the bubble does. */}
                <span className={cx(on ? "text-blanc lg:sr-only" : "sr-only")}>{name}</span>
                {complete && (
                  <span
                    aria-hidden
                    className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-lime text-sapin ring-2 ring-blanc"
                  >
                    <Icon name="check" className="size-2.5" />
                  </span>
                )}
                <span aria-hidden className={bubble}>
                  {name}
                </span>
                <span className="sr-only">
                  {" "}
                  {complete ? t("v2.readiness.done") : t("v2.readiness.todo")}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Title and introduction of the current step, with its icon and its position. */
export async function EditorStepIntro({ step }: { step: EditorStep }) {
  const t = await getTranslations("admin.courses");
  const index = editorSteps.indexOf(step);
  return (
    <div className="flex items-start gap-3 px-1">
      <span
        aria-hidden
        className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-lime-clair text-sapin"
      >
        <Icon name={stepIcon[step]} className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={adminLabel}>
          {t("v3.editor.position", { number: index + 1, total: editorSteps.length })}
        </p>
        <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[24px] lg:leading-8">
          {stepName(t, step)}
        </h2>
        <p className="max-w-[80ch] text-[13px] leading-[19px] text-ardoise">
          {t(`v3.editor.intro.${step}`)}
        </p>
      </div>
    </div>
  );
}

/** Previous and next step, at the foot of each step. */
export async function EditorStepPager({
  course,
  step,
  form,
}: {
  course: AdminCourse;
  step: EditorStep;
  /** The step saves a form: a reminder to save before moving on. */
  form?: boolean;
}) {
  const t = await getTranslations("admin.courses");
  const index = editorSteps.indexOf(step);
  const previous = editorSteps[index - 1];
  const next = editorSteps[index + 1];
  return (
    <div className="flex flex-col gap-2.5 px-1 pt-1">
      {form && next && (
        <p className="text-[11.5px] leading-4 text-ardoise">{t("v3.editor.saveFirst")}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {previous ? (
          <ButtonLink
            href={editorHref(course.id, previous)}
            variant="tertiary"
            size="sm"
            icon={<Icon name="chev-l" />}
          >
            {t("v3.editor.previous", { name: stepName(t, previous) })}
          </ButtonLink>
        ) : (
          <span />
        )}
        {next && (
          <ButtonLink href={editorHref(course.id, next)} size="sm">
            {t("v3.editor.next", { name: stepName(t, next) })}
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/**
 * « Prête à publier ? » (Admin v2, étape 6; Admin v3, étape 4): the ring of the checks met, what
 * is missing, each linked to its step, then the preview « comme un talent » and « Dupliquer ».
 * A sticky column on a computer.
 */
export async function CourseReadinessCard({
  course,
  step,
}: {
  course: AdminCourse;
  step: EditorStep;
}) {
  const t = await getTranslations("admin.courses");
  const readiness = courseReadiness(course);
  const base = `/admin/formations/${course.id}`;
  const link =
    "inline-flex h-9 items-center gap-1.5 rounded-pill bg-blanc px-3.5 text-[12.5px] font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme";
  const missing = readiness.steps.flatMap((item) =>
    item.missing.map((problem) => ({ problem, step: editorStepOf[item.step] })),
  );
  return (
    <section
      id="preparation"
      aria-labelledby="preparation-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-4")}
    >
      <div className="flex items-center gap-3.5">
        <ReadinessRing
          percent={readiness.percent}
          text={t("v2.readiness.percent", { percent: readiness.percent })}
          label={t("v2.readiness.label", { percent: readiness.percent })}
          large
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="preparation-title" className="text-[16px] leading-[22px] font-semibold">
            {t("v2.readiness.title")}
          </h2>
          <p className="text-[12px] leading-[17px] text-ardoise">
            {course.status === "published"
              ? t("v2.readiness.published")
              : readiness.ready
                ? t("v2.readiness.ready")
                : t("v2.readiness.missing", { count: readiness.problems.length })}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className={adminLabel}>{t("v3.editor.aside.title")}</p>
        {missing.length === 0 ? (
          <p className="flex items-start gap-2 rounded-[12px] bg-lime-clair px-3 py-2.5 text-[12px] leading-[17px]">
            <Icon name="check" className="mt-px size-3.5 shrink-0" />
            {t("v3.editor.aside.none")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {missing.map((item) => (
              <li key={item.problem}>
                <Link
                  href={editorHref(course.id, item.step)}
                  className="flex items-start gap-2 rounded-[12px] bg-creme px-3 py-2 text-[12px] leading-[17px] hover:bg-brume"
                >
                  <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-ambre" />
                  <span className="flex-1">{t(`publish.problem.${item.problem}`)}</span>
                  <Icon name="chev-r" className="mt-0.5 size-3.5 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className={adminLabel}>{t("v3.editor.aside.actions")}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${base}/apercu`} className={link}>
            <Icon name="eye" aria-hidden className="size-3.5" />
            {t("v2.preview")}
          </Link>
          <Link
            href={`${base}?etape=${step}&action=dupliquer#preparation`}
            scroll={false}
            className={link}
          >
            <Icon name="doc" aria-hidden className="size-3.5" />
            {t("v2.duplicate.text")}
          </Link>
          {course.status === "published" && (
            <Link href={`/formations/${course.slug}`} className={link}>
              <Icon name="suivant" aria-hidden className="size-3.5" />
              {t("viewPublic")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * « Quiz » step: every quiz of the program, where it sits, its questions and its threshold, and
 * whether it still needs questions; « Modifier les questions » opens the quiz beside the list.
 */
export async function QuizOverview({
  course,
  openLessonId,
}: {
  course: AdminCourse;
  openLessonId?: string;
}) {
  const t = await getTranslations("admin.courses");
  const quizzes = course.modules.flatMap((module, index) =>
    module.lessons
      .filter((lesson) => lesson.kind === "quiz")
      .map((lesson) => ({ lesson, module, number: index + 1 })),
  );
  return (
    <section
      id="quiz-liste"
      aria-labelledby="quiz-liste-title"
      className={cx(adminCard, "flex flex-col gap-3.5")}
    >
      <h2 id="quiz-liste-title" className={adminTitle}>
        {t("v3.editor.quiz.title")}
      </h2>
      {quizzes.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-[16px] bg-creme px-4 py-4">
          <p className="text-[13px] text-ardoise">{t("v3.editor.quiz.empty")}</p>
          <ButtonLink
            href={editorHref(course.id, "programme")}
            variant="secondary"
            size="sm"
            icon={<Icon name="plus" />}
          >
            {t("v3.editor.quiz.toProgram")}
          </ButtonLink>
        </div>
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2">
          {quizzes.map(({ lesson, module, number }) => {
            const count = lesson.quiz?.questions.length ?? 0;
            return (
              <li
                key={lesson.id}
                className={cx(
                  "flex flex-col gap-2.5 rounded-[18px] bg-creme/70 p-3.5 ring-[1.5px] ring-inset",
                  lesson.id === openLessonId ? "ring-sapin" : "ring-brume/70",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <IconTile icon="quiz" tone="bg-neon/45" size={34} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[11px] leading-4 text-ardoise">
                      {t("module.number", { number })} · {module.title}
                    </span>
                    <span className="text-[13.5px] leading-[18px] font-semibold">
                      {lesson.title}
                    </span>
                  </div>
                  {count > 0 ? (
                    <Tag tone="success">{t("v3.editor.quiz.ready")}</Tag>
                  ) : (
                    <Tag tone="warning">{t("status.draft")}</Tag>
                  )}
                </div>
                <p className="text-[11.5px] leading-4 text-ardoise">
                  {lesson.quiz
                    ? t("quiz.meta", {
                        count,
                        score: lesson.quiz.passingScore,
                        attempts: lesson.quiz.maxAttempts,
                      })
                    : null}
                </p>
                {count === 0 && (
                  <p className="text-[11.5px] leading-4 font-medium text-ambre-texte">
                    {t("v3.editor.quiz.missing")}
                  </p>
                )}
                <Link
                  href={`/admin/formations/${course.id}?etape=quiz&lecon=${lesson.id}#quiz`}
                  className="inline-flex items-center gap-1.5 self-start text-[12.5px] font-semibold underline underline-offset-4"
                >
                  <Icon name="edit" className="size-3.5" />
                  {t("v3.editor.quiz.edit", { title: lesson.title })}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {course.certificateEnabled && (
        <p className="flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11.5px] leading-4">
          <Icon name="info" className="mt-px size-3.5 shrink-0" />
          {t("v3.editor.quiz.certificate")}
        </p>
      )}
    </section>
  );
}

/**
 * « Publication » step: the recap of the guided path, each step done or with what it misses,
 * then « Publier » and the status change, with an optional reason kept in the journal.
 */
export async function PublicationCard({ course }: { course: AdminCourse }) {
  const t = await getTranslations("admin.courses");
  const readiness = courseReadiness(course);
  return (
    <section
      id="publication"
      aria-labelledby="publication-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-4")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="publication-title" className={adminTitle}>
          {t("v3.editor.publication.recap")}
        </h2>
        <Tag tone={courseStatusTone[course.status]}>
          {t("v3.editor.publication.current", { status: t(`status.${course.status}`) })}
        </Tag>
      </div>
      <p className="text-[12.5px] leading-[18px] text-ardoise">
        {readiness.ready ? t("v3.editor.publication.ready") : t("v3.editor.publication.notReady")}
      </p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {readiness.steps.map((item, index) => (
          <li
            key={item.step}
            className={cx(
              "flex items-start gap-2.5 rounded-[14px] p-3 ring-[1.5px] ring-inset",
              item.done ? "bg-lime-clair ring-transparent" : "bg-blanc ring-brume",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold",
                item.done ? "bg-sapin text-blanc" : "bg-creme",
              )}
            >
              {item.done ? <Icon name="check" className="size-3.5" /> : index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] leading-[18px] font-semibold">
                {t(`v2.step.${item.step}`)}
                <span className="sr-only">
                  {" "}
                  {item.done ? t("v2.readiness.done") : t("v2.readiness.todo")}
                </span>
              </span>
              {item.missing.map((problem) => (
                <span key={problem} className="text-[11.5px] leading-4 text-ardoise">
                  {t(`publish.problem.${problem}`)}
                </span>
              ))}
              {item.step === "audience" && !item.done && (
                <span className="text-[11.5px] leading-4 text-ardoise">
                  {t("v2.readiness.advice")}
                </span>
              )}
            </span>
            {!item.done && item.step !== "publish" && (
              <Link
                href={editorHref(course.id, editorStepOf[item.step])}
                className="shrink-0 self-center text-[12px] font-semibold underline underline-offset-4"
              >
                {t("v3.editor.publication.go")}
                <span className="sr-only"> {t(`v2.step.${item.step}`)}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 rounded-[18px] bg-creme/70 p-4">
        {course.status !== "published" && (
          <form action={setCourseStatusAction}>
            <input type="hidden" name="course" value={course.id} />
            <input type="hidden" name="status" value="published" />
            <Button type="submit" icon={<Icon name="suivant" />}>
              {t("publish.text")}
            </Button>
          </form>
        )}
        <form
          action={setCourseStatusAction}
          className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-start"
        >
          <input type="hidden" name="course" value={course.id} />
          <Select
            id="course-status"
            name="status"
            label={t("status.text")}
            defaultValue={course.status}
            options={courseStatuses.map((status) => ({
              value: status,
              label: t(`status.${status}`),
            }))}
          />
          <TextField
            id="course-status-reason"
            name="reason"
            label={t("v3.editor.publication.reason")}
            hint={t("v3.editor.publication.reasonHint")}
            maxLength={500}
          />
          <Button type="submit" variant="secondary" size="sm" className="self-start">
            {t("status.change")}
          </Button>
        </form>
        <p className="text-[11px] leading-[15px] text-ardoise">{t("editorOnly")}</p>
      </div>
    </section>
  );
}
