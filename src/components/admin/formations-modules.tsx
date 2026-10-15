import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { IconTile, Tag, adminCard, adminTitle } from "@/components/admin/kit";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, Checkbox, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { VideoUploader } from "@/components/admin/video-uploader";
import { videoProvider } from "@/server/adapters/video";
import {
  addLessonAction,
  addModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  deleteQuestionAction,
  renameModuleAction,
  saveQuestionAction,
  updateLessonAction,
  updateQuizAction,
  uploadLessonVideoAction,
} from "@/server/actions/course-admin";
import {
  answerForEditor,
  lessonKinds,
  questionTypes,
  type AdminCourse,
} from "@/server/services/course-admin";
import { lessonParagraphs, parseResources } from "@/server/services/learn";

type Lesson = AdminCourse["modules"][number]["lessons"][number];

const kindLabel = (kind: string) => (kind === "text" ? "textLesson" : kind) as "textLesson";
const kindTile: Record<string, { icon: IconName; tone: string }> = {
  video: { icon: "video", tone: "bg-lime-clair" },
  text: { icon: "doc", tone: "bg-menthe-claire" },
  exercise: { icon: "objectif", tone: "bg-creme" },
  quiz: { icon: "quiz", tone: "bg-neon/45" },
  resource: { icon: "telecharger", tone: "bg-brume" },
};
const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * « Modules » card of mockup 07-06: one panel per module (the one being edited is open), its
 * lessons with their details, and the forms to add a lesson or a module.
 */
export async function CourseModulesCard({
  course,
  openLessonId,
}: {
  course: AdminCourse;
  openLessonId?: string;
}) {
  const t = await getTranslations("admin.courses");
  const hidden = <input type="hidden" name="course" value={course.id} />;
  const openModule =
    course.modules.find((module) => module.lessons.some((item) => item.id === openLessonId))?.id ??
    course.modules[0]?.id;

  return (
    <section
      aria-labelledby="programme-title"
      className={cx(adminCard, "flex min-w-0 flex-col gap-3")}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="programme-title" className={cx(adminTitle, "lg:text-[22px]")}>
          {t("modules")}
        </h2>
        <ButtonLink
          href="#module-new-title"
          variant="tertiary"
          size="sm"
          icon={<Icon name="plus" />}
        >
          {t("module.add")}
        </ButtonLink>
      </div>
      <div id="programme" className="flex scroll-mt-6 flex-col gap-2">
        {course.modules.length === 0 && (
          <p className="text-[13px] text-ardoise">{t("modulesEmpty")}</p>
        )}
        {course.modules.map((module) => (
          <div key={module.id}>
            <details
              open={module.id === openModule}
              className="group/module rounded-[18px] open:bg-creme open:p-3"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[12px] p-1 text-[13px] font-semibold group-open/module:px-1 group-open/module:pt-0.5 group-open/module:pb-1.5 hover:bg-creme [&::-webkit-details-marker]:hidden">
                <span>
                  {t("module.number", { number: module.order })} · {module.title}
                </span>
                <Icon
                  name="chev-r"
                  className="size-4 shrink-0 transition-transform group-open/module:rotate-90"
                />
              </summary>
              <div className="flex flex-col gap-2 pt-1">
                {module.lessons.length === 0 ? (
                  <p className="px-1 text-[12.5px] text-ardoise">{t("module.empty")}</p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {module.lessons.map((item) => (
                      <LessonRow
                        key={item.id}
                        courseId={course.id}
                        lesson={item}
                        current={item.id === openLessonId}
                      />
                    ))}
                  </ol>
                )}
                <form
                  action={addLessonAction}
                  className="flex flex-col gap-2.5 rounded-[14px] bg-blanc p-3"
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
                  <Button
                    type="submit"
                    variant="tertiary"
                    size="sm"
                    icon={<Icon name="plus" />}
                    className="self-start bg-blanc"
                  >
                    {t("lesson.add")}
                  </Button>
                </form>
                <div className="flex flex-col gap-2 rounded-[14px] bg-blanc p-3">
                  <form action={renameModuleAction} className="flex flex-col gap-2.5">
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
                    <Button type="submit" variant="tertiary" size="sm" className="self-start">
                      {t("module.rename")}
                    </Button>
                  </form>
                  <form action={deleteModuleAction} className="self-start">
                    {hidden}
                    <input type="hidden" name="module" value={module.id} />
                    <Button
                      type="submit"
                      variant="tertiary"
                      size="sm"
                      className="text-corail-fonce"
                    >
                      {t("module.delete")}
                    </Button>
                  </form>
                </div>
              </div>
            </details>
          </div>
        ))}
        <form
          action={addModuleAction}
          className="mt-1 flex flex-col gap-2.5 border-t border-brume pt-3"
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
          <Button
            type="submit"
            variant="tertiary"
            icon={<Icon name="plus" />}
            className="self-start"
          >
            {t("module.add")}
          </Button>
        </form>
      </div>
    </section>
  );
}

async function LessonRow({
  courseId,
  lesson,
  current,
}: {
  courseId: string;
  lesson: Lesson;
  current: boolean;
}) {
  const t = await getTranslations("admin.courses");
  const tile = kindTile[lesson.kind] ?? kindTile.text!;
  const resources = parseResources(lesson.resources).length;
  const meta =
    lesson.kind === "quiz" && lesson.quiz
      ? [
          t("quiz.meta", {
            count: lesson.quiz.questions.length,
            score: lesson.quiz.passingScore,
            attempts: lesson.quiz.maxAttempts,
          }),
        ]
      : [
          lesson.durationSec > 0 ? clock(lesson.durationSec) : null,
          t(`lesson.kind.${kindLabel(lesson.kind)}`),
          lesson.transcript ? t("lesson.transcript") : null,
          resources > 0 ? t("lesson.resourcesCount", { count: resources }) : null,
        ].filter(Boolean);
  return (
    <li
      className={cx(
        "flex items-center gap-2.5 rounded-[12px] bg-blanc px-3 py-2.5",
        current && "ring-2 ring-sapin ring-inset",
      )}
    >
      <IconTile icon={tile.icon} tone={tile.tone} size={30} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[12.5px] leading-4 font-semibold">{lesson.title}</span>
        <span className="text-[11px] leading-[15px] text-ardoise">{meta.join(" · ")}</span>
        {(lesson.isPreview || lesson.jobSpecific) && (
          <span className="flex flex-wrap gap-1 pt-0.5">
            {lesson.isPreview && <Tag tone="success">{t("lesson.previewBadge")}</Tag>}
            {lesson.jobSpecific && <Tag tone="menthe">{t("lesson.jobSpecific.badge")}</Tag>}
          </span>
        )}
      </span>
      <Link
        href={`/admin/formations/${courseId}?lecon=${lesson.id}#lecon`}
        aria-label={t("lesson.editNamed", { title: lesson.title })}
        className="touch-target grid size-8 shrink-0 place-items-center rounded-full hover:bg-creme"
      >
        <Icon name="edit" className="size-4" />
      </Link>
      <form action={deleteLessonAction}>
        <input type="hidden" name="course" value={courseId} />
        <input type="hidden" name="lesson" value={lesson.id} />
        <button
          type="submit"
          aria-label={t("lesson.deleteNamed", { title: lesson.title })}
          className="touch-target grid size-8 shrink-0 place-items-center rounded-full text-corail-fonce hover:bg-down-fond"
        >
          <Icon name="fermer" className="size-4" />
        </button>
      </form>
    </li>
  );
}

/** Editor of one lesson (`?lecon=`), with its quiz when it is one. */
export async function LessonEditor({
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
      aria-labelledby="lecon-title"
      className={cx(adminCard, "flex scroll-mt-6 flex-col gap-4")}
    >
      <div className="flex items-center gap-3">
        <IconTile icon={(kindTile[lesson.kind] ?? kindTile.text!).icon} tone="bg-lime-clair" />
        <h2 id="lecon-title" className={cx(adminTitle, "flex-1")}>
          {t("lesson.editing", { title: lesson.title })}
        </h2>
        <Link
          href={`/admin/formations/${course.id}#programme`}
          aria-label={t("back")}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-creme hover:bg-brume"
        >
          <Icon name="fermer" className="size-4" />
        </Link>
      </div>
      {query("ok") === "lecon" && <Alert tone="success" title={t("lesson.saved")} />}
      {query("erreur") === "lecon" && <Alert tone="error" title={t("invalid")} />}
      {ignored > 0 && (
        <Alert tone="warning" title={t("lesson.resourcesInvalid", { count: ignored })} />
      )}
      <form action={updateLessonAction} className="grid gap-3.5 md:grid-cols-2">
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
          icon="video"
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
            rows={7}
          />
        </div>
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
        <TextArea
          id="lesson-transcript"
          name="transcript"
          label={t("lesson.transcript")}
          defaultValue={lesson.transcript ?? ""}
          rows={3}
        />
        <Checkbox
          id="lesson-preview"
          name="isPreview"
          label={t("lesson.isPreview")}
          defaultChecked={lesson.isPreview}
        />
        <Checkbox
          id="lesson-job-specific"
          name="jobSpecific"
          label={t("lesson.jobSpecific.text")}
          hint={t("lesson.jobSpecific.hint")}
          defaultChecked={lesson.jobSpecific}
        />
        <Button type="submit" variant="secondary" className="justify-self-start">
          {t("lesson.save")}
        </Button>
      </form>

      {lesson.kind === "video" && <LessonVideo course={course} lesson={lesson} query={query} />}

      {lesson.kind === "quiz" && lesson.quiz && (
        <div id="quiz" className="flex scroll-mt-6 flex-col gap-3.5 border-t border-brume pt-4">
          <h3 className="text-[16px] leading-[22px] font-semibold">{t("quiz.title")}</h3>
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
            <Button type="submit" variant="secondary" className="sm:mb-1">
              {t("quiz.save")}
            </Button>
          </form>
          {lesson.quiz.questions.length === 0 && (
            <p className="text-[13px] text-ardoise">{t("quiz.empty")}</p>
          )}
          {[...lesson.quiz.questions, null].map((question, index) => {
            const prefix = `question-${question?.id ?? "new"}`;
            return (
              <form
                key={question?.id ?? "new"}
                action={saveQuestionAction}
                className="grid gap-3 rounded-[18px] bg-creme p-4 md:grid-cols-2"
              >
                {hidden}
                <input type="hidden" name="question" value={question?.id ?? ""} />
                <p className="text-[13px] font-semibold md:col-span-2">
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
                <div className="flex flex-wrap gap-2.5 md:col-span-2">
                  <Button type="submit" variant="secondary" size="sm">
                    {t("quiz.question.save")}
                  </Button>
                  {question && (
                    <Button
                      type="submit"
                      variant="tertiary"
                      size="sm"
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

/**
 * The video of a lesson (Admin v2, étape 6): sent from the computer, straight to the video
 * provider when one is configured, through the site otherwise (small files); then where its
 * encoding stands.
 */
async function LessonVideo({
  course,
  lesson,
  query,
}: {
  course: AdminCourse;
  lesson: AdminCourse["modules"][number]["lessons"][number];
  query: (key: string) => string;
}) {
  const t = await getTranslations("admin.courses.video");
  const provider = videoProvider();
  const direct =
    provider.id === "bunny" &&
    !!process.env.BUNNY_STREAM_LIBRARY_ID &&
    !!process.env.BUNNY_STREAM_API_KEY;
  const status = lesson.videoId ? await provider.status(lesson.videoId).catch(() => null) : null;
  const error = query("erreur").startsWith("video-") ? query("erreur").slice(6) : "";
  return (
    <div
      id="lecon-video"
      className="flex scroll-mt-6 flex-col gap-3 rounded-[16px] bg-creme/60 p-4"
    >
      <h3 className="text-[15px] leading-5 font-semibold">{t("title")}</h3>
      {query("ok") === "video" && <Alert tone="success" title={t("saved")} />}
      {(error === "fileType" || error === "fileSize") && (
        <Alert tone="error" title={t(`error.${error}`)} />
      )}
      <p className="text-[12.5px]">
        {!lesson.videoId
          ? t("state.none")
          : status === null
            ? t("state.ready")
            : status.state === "ready"
              ? t("state.ready")
              : status.state === "failed"
                ? t("state.failed")
                : t("state.processing", { progress: status.progress })}
      </p>
      {direct ? (
        <VideoUploader
          courseId={course.id}
          lessonId={lesson.id}
          labels={{
            file: t("file"),
            hint: t("hintDirect"),
            send: t("send"),
            sending: t("sending"),
            done: t("done"),
            error: t("error.upload"),
          }}
        />
      ) : (
        <form action={uploadLessonVideoAction} className="flex flex-col gap-2">
          <input type="hidden" name="course" value={course.id} />
          <input type="hidden" name="lesson" value={lesson.id} />
          <label htmlFor="lesson-video-file" className="text-[13px] font-semibold">
            {t("file")}
          </label>
          <input
            id="lesson-video-file"
            name="video"
            type="file"
            required
            accept="video/mp4,video/webm"
            aria-describedby="lesson-video-file-hint"
            className="text-[13px] file:mr-3 file:h-9 file:rounded-pill file:border-0 file:bg-blanc file:px-4 file:font-semibold"
          />
          <p id="lesson-video-file-hint" className="text-[11.5px] text-ardoise">
            {t("hintSite")}
          </p>
          <Button type="submit" variant="secondary" size="sm" className="self-start">
            {t("send")}
          </Button>
        </form>
      )}
      <p className="text-[11.5px] text-ardoise">{t("captions")}</p>
    </div>
  );
}
