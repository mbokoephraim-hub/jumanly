import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { IconTile, Tag, adminCard, adminTitle } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, Checkbox, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  addCourseDocumentAction,
  deleteCourseDocumentAction,
  moveCourseDocumentAction,
  updateCourseDocumentAction,
} from "@/server/actions/course-admin";
import type { AdminCourse } from "@/server/services/course-admin";
import {
  documentHref,
  documentKinds,
  documentVisibilities,
  type CourseDocumentRow,
} from "@/server/services/course-documents";

type Translate = Awaited<ReturnType<typeof getTranslations<"admin.courses.v3.editor.documents">>>;

const kindTone: Record<string, string> = {
  support: "bg-lime-clair",
  exercises: "bg-neon/45",
  reading: "bg-menthe-claire",
  template: "bg-creme",
  answer_key: "bg-ambre-fond",
  other: "bg-brume",
};

/** « 820 Ko », « 2,4 Mo ». */
export function documentSize(t: Translate, bytes: number) {
  return bytes < 1024 * 1024
    ? t("size.kb", { size: Math.max(1, Math.round(bytes / 1024)) })
    : t("size.mb", { size: (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") });
}

const errorCodes = [
  "champs",
  "fileType",
  "fileSize",
  "unreadable",
  "encrypted",
  "notFound",
] as const;

/** The result of the last document action, read from the address. */
async function DocumentAlerts({ query }: { query: (key: string) => string }) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  const error = query("erreur").startsWith("document-") ? query("erreur").slice(9) : "";
  return (
    <>
      {query("ok") === "document" && <Alert tone="success" title={t("saved")} />}
      {query("ok") === "document-supprime" && <Alert tone="success" title={t("deleted")} />}
      {(errorCodes as readonly string[]).includes(error) && (
        <Alert tone="error" title={t(`error.${error as (typeof errorCodes)[number]}`)} />
      )}
    </>
  );
}

/** Title, type, lesson, who downloads it and the specialized right: the fields of a document. */
async function DocumentFields({
  prefix,
  course,
  document,
  lessonId,
}: {
  prefix: string;
  course: AdminCourse;
  document?: CourseDocumentRow;
  /** Sent from a lesson panel: the document belongs to that lesson. */
  lessonId?: string;
}) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id={`${prefix}-title`}
          name="title"
          label={t("field.title")}
          defaultValue={document?.title}
          required
          minLength={2}
          maxLength={160}
        />
        <Select
          id={`${prefix}-kind`}
          name="kind"
          label={t("field.kind")}
          defaultValue={document?.kind ?? "support"}
          options={documentKinds.map((kind) => ({ value: kind, label: t(`kind.${kind}`) }))}
        />
      </div>
      {lessonId ? (
        <input type="hidden" name="lesson" value={lessonId} />
      ) : (
        <Select
          id={`${prefix}-lesson`}
          name="lesson"
          label={t("field.lesson")}
          defaultValue={document?.lessonId ?? ""}
          options={[
            { value: "", label: t("wholeCourse") },
            ...course.modules.flatMap((module, index) =>
              module.lessons.map((lesson, position) => ({
                value: lesson.id,
                label: `${index + 1}.${position + 1} · ${lesson.title}`,
              })),
            ),
          ]}
        />
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] leading-[18px] font-semibold">
          {t("field.visibility")}
        </legend>
        <div className="grid gap-2">
          {documentVisibilities.map((visibility) => (
            <Checkbox
              key={visibility}
              id={`${prefix}-visibility-${visibility}`}
              type="radio"
              name="visibility"
              value={visibility}
              label={t(`visibility.${visibility}`)}
              defaultChecked={(document?.visibility ?? "enrolled") === visibility}
              className="[&_label]:text-[13px]"
            />
          ))}
        </div>
        <p className="text-[11.5px] leading-4 text-ardoise">{t("answerKey")}</p>
      </fieldset>
      <Checkbox
        id={`${prefix}-specialized`}
        name="specialized"
        label={t("field.specialized")}
        defaultChecked={document?.specialized ?? false}
        className="[&_label]:text-[13px]"
      />
    </>
  );
}

/** The file input of a PDF, with its limits. */
async function PdfInput({ id, replace = false }: { id: string; replace?: boolean }) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {replace ? t("field.replace") : t("file")}
      </label>
      <input
        id={id}
        name="file"
        type="file"
        accept="application/pdf"
        required={!replace}
        aria-describedby={`${id}-hint`}
        className="text-[13px] file:mr-3 file:h-9 file:rounded-pill file:border-0 file:bg-creme file:px-4 file:font-semibold"
      />
      <p id={`${id}-hint`} className="text-[11.5px] leading-4 text-ardoise">
        {replace ? t("field.replaceHint") : t("fileHint")}
      </p>
    </div>
  );
}

/** One document: its type, pages, size, downloads and lesson, then its actions. */
async function DocumentRow({
  course,
  document,
  first,
  last,
  hidden,
}: {
  course: AdminCourse;
  document: CourseDocumentRow;
  first: boolean;
  last: boolean;
  hidden: ReactNode;
}) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  const lesson = course.modules
    .flatMap((module) => module.lessons)
    .find((item) => item.id === document.lessonId);
  const move =
    "touch-target grid size-8 shrink-0 place-items-center rounded-full text-sapin hover:bg-creme disabled:pointer-events-none disabled:opacity-30";
  const prefix = `document-${document.id}`;
  return (
    <li
      id={prefix}
      className="flex scroll-mt-6 flex-col gap-2 rounded-[18px] bg-creme/70 p-3 ring-[1.5px] ring-brume/70 ring-inset"
    >
      <div className="flex items-start gap-2.5">
        <IconTile icon="doc" tone={kindTone[document.kind] ?? "bg-brume"} size={36} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13.5px] leading-[18px] font-semibold">{document.title}</span>
          <span className="text-[11.5px] leading-4 text-ardoise">
            {t("meta", {
              kind: t(`kind.${document.kind}`),
              pages: document.pages,
              size: documentSize(t, document.size),
              downloads: document.downloads,
            })}
          </span>
          <span className="flex flex-wrap gap-1 pt-1">
            <Tag
              tone={
                document.visibility === "public"
                  ? "success"
                  : document.visibility === "team"
                    ? "warning"
                    : "neutral"
              }
            >
              {t(`visibility.${document.visibility}`)}
            </Tag>
            {document.specialized && <Tag tone="menthe">{t("specializedTag")}</Tag>}
            <Tag>{lesson ? t("lesson", { title: lesson.title }) : t("wholeCourse")}</Tag>
          </span>
        </div>
        <form action={moveCourseDocumentAction} className="flex shrink-0">
          {hidden}
          <input type="hidden" name="document" value={document.id} />
          <button
            type="submit"
            name="direction"
            value="up"
            disabled={first}
            aria-label={t("moveUp", { title: document.title })}
            className={move}
          >
            <Icon name="chev-r" className="size-4 -rotate-90" />
          </button>
          <button
            type="submit"
            name="direction"
            value="down"
            disabled={last}
            aria-label={t("moveDown", { title: document.title })}
            className={move}
          >
            <Icon name="chev-r" className="size-4 rotate-90" />
          </button>
        </form>
        <a
          href={documentHref(document.id)}
          aria-label={t("download", { title: document.title })}
          className="touch-target grid size-8 shrink-0 place-items-center rounded-full hover:bg-blanc"
        >
          <Icon name="telecharger" className="size-4" />
        </a>
      </div>
      <details className="group/doc rounded-[14px] bg-blanc px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12.5px] font-semibold [&::-webkit-details-marker]:hidden">
          <Icon name="chev-r" className="size-3.5 transition-transform group-open/doc:rotate-90" />
          {t("edit", { title: document.title })}
        </summary>
        <form
          action={updateCourseDocumentAction}
          className="flex flex-col gap-3 pt-3"
          aria-label={t("edit", { title: document.title })}
        >
          {hidden}
          <input type="hidden" name="document" value={document.id} />
          <DocumentFields prefix={prefix} course={course} document={document} />
          <PdfInput id={`${prefix}-file`} replace />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="secondary" size="sm">
              {t("save")}
            </Button>
            <Button
              type="submit"
              variant="tertiary"
              size="sm"
              formAction={deleteCourseDocumentAction}
              formNoValidate
              className="text-corail-fonce"
            >
              {t("delete", { title: document.title })}
            </Button>
          </div>
        </form>
      </details>
    </li>
  );
}

/**
 * « Documents » step of the editor (Admin v3, étape 5): the PDF files of the course and who may
 * download them, then the form to send a new one. Plain forms: works without JavaScript.
 */
export async function CourseDocumentsCard({
  course,
  documents,
  query,
}: {
  course: AdminCourse;
  documents: CourseDocumentRow[];
  query: (key: string) => string;
}) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  const hidden = <input type="hidden" name="course" value={course.id} />;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section
        id="documents"
        aria-labelledby="documents-title"
        className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3.5")}
      >
        <h2 id="documents-title" className={adminTitle}>
          {t("title")}
        </h2>
        <DocumentAlerts query={query} />
        {documents.length === 0 ? (
          <p className="rounded-[16px] border-[1.5px] border-dashed border-brume px-4 py-5 text-center text-[13px] text-ardoise">
            {t("empty")}
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {documents.map((document, index) => (
              <DocumentRow
                key={document.id}
                course={course}
                document={document}
                first={index === 0}
                last={index === documents.length - 1}
                hidden={hidden}
              />
            ))}
          </ol>
        )}
        <p className="flex items-start gap-2 text-[11.5px] leading-4 text-ardoise">
          <Icon name="lien" className="mt-px size-3.5 shrink-0" />
          {t("links")}
        </p>
      </section>
      <form
        action={addCourseDocumentAction}
        aria-labelledby="document-new-heading"
        className={cx(adminCard, "flex flex-col gap-3.5")}
      >
        {hidden}
        <h2 id="document-new-heading" className={adminTitle}>
          {t("add")}
        </h2>
        <PdfInput id="document-new-file" />
        <DocumentFields prefix="document-new" course={course} />
        <Button type="submit" icon={<Icon name="plus" />} className="self-start">
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}

/** The documents of one lesson, in its panel, with a short form to attach a new one. */
export async function LessonDocuments({
  course,
  lessonId,
  documents,
  step,
  query,
}: {
  course: AdminCourse;
  lessonId: string;
  documents: CourseDocumentRow[];
  step: "programme" | "quiz";
  query: (key: string) => string;
}) {
  const t = await getTranslations("admin.courses.v3.editor.documents");
  const own = documents.filter((document) => document.lessonId === lessonId);
  const hidden = (
    <>
      <input type="hidden" name="course" value={course.id} />
      <input type="hidden" name="panel" value={lessonId} />
      <input type="hidden" name="etape" value={step} />
    </>
  );
  return (
    <div
      id="lecon-documents"
      className="flex scroll-mt-6 flex-col gap-3 rounded-[16px] bg-creme/60 p-4"
    >
      <h3 className="text-[15px] leading-5 font-semibold">{t("panel")}</h3>
      <DocumentAlerts query={query} />
      {own.length === 0 ? (
        <p className="text-[12.5px] text-ardoise">{t("panelEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {own.map((document) => (
            <li
              key={document.id}
              className="flex items-center gap-2.5 rounded-[12px] bg-blanc px-3 py-2"
            >
              <IconTile icon="doc" tone={kindTone[document.kind] ?? "bg-brume"} size={28} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12.5px] leading-4 font-semibold">{document.title}</span>
                <span className="text-[11px] leading-[15px] text-ardoise">
                  {t(`kind.${document.kind}`)} · {t(`visibility.${document.visibility}`)}
                </span>
              </span>
              <a
                href={documentHref(document.id)}
                aria-label={t("download", { title: document.title })}
                className="touch-target grid size-8 shrink-0 place-items-center rounded-full hover:bg-creme"
              >
                <Icon name="telecharger" className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <details className="group/add rounded-[14px] bg-blanc px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[12.5px] font-semibold [&::-webkit-details-marker]:hidden">
          <Icon name="plus" className="size-3.5" />
          {t("add")}
        </summary>
        <form action={addCourseDocumentAction} className="flex flex-col gap-3 pt-3">
          {hidden}
          <PdfInput id="lesson-document-file" />
          <DocumentFields prefix="lesson-document" course={course} lessonId={lessonId} />
          <Button type="submit" variant="secondary" size="sm" className="self-start">
            {t("submit")}
          </Button>
        </form>
      </details>
      <p className="text-[11.5px] leading-4 text-ardoise">{t("links")}</p>
    </div>
  );
}
