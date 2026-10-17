import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { cx } from "@/lib/cx";
import { documentHref } from "@/server/services/course-documents";

export type DocumentItem = { id: string; title: string; kind: string; pages: number; size: number };

const kinds = ["support", "exercises", "reading", "template", "answer_key", "other"] as const;
export const documentKind = (kind: string) =>
  (kinds as readonly string[]).includes(kind) ? (kind as (typeof kinds)[number]) : "other";

/**
 * PDF documents of a course for talents and visitors (Admin v3, étape 5): title, type, pages and
 * size, and the download, which the route checks again. Only documents the viewer may download
 * are passed in.
 */
export async function CourseDocumentList({
  documents,
  title,
  id,
  className,
  single = false,
}: {
  documents: DocumentItem[];
  title: string;
  id: string;
  className?: string;
  /** One column (a narrow side column). */
  single?: boolean;
}) {
  const t = await getTranslations("learn.documents");
  if (documents.length === 0) return null;
  const size = (bytes: number) =>
    bytes < 1024 * 1024
      ? t("size.kb", { size: Math.max(1, Math.round(bytes / 1024)) })
      : t("size.mb", { size: (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") });
  return (
    <section aria-labelledby={id} className={cx("flex scroll-mt-24 flex-col gap-3", className)}>
      <h2 id={id} className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {title}
      </h2>
      <ul className={cx("grid gap-3", !single && "md:grid-cols-2")}>
        {documents.map((document, key) => (
          <li
            key={document.id}
            className="flex items-center gap-3 rounded-[18px] border border-brume bg-blanc p-3.5"
          >
            <span
              className={cx(
                "flex size-11 shrink-0 items-center justify-center rounded-xl",
                key % 2 === 0 ? "bg-lime-clair" : "bg-ambre-fond",
              )}
            >
              <Icon name="doc" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">{document.title}</span>
              <span className="text-xs text-ardoise">
                {t("meta", {
                  kind: t(`kind.${documentKind(document.kind)}`),
                  pages: document.pages,
                  size: size(document.size),
                })}
              </span>
            </span>
            <a
              href={documentHref(document.id)}
              aria-label={t("downloadNamed", { title: document.title })}
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline"
            >
              <Icon name="telecharger" className="size-4" />
              <span aria-hidden>{t("download")}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The PDFs Jumanly makes from a course (Admin v3, étape 6): the programme for everyone, the full
 * support for a talent who follows the course, to read offline on a slow network.
 */
export async function CoursePdfLinks({
  slug,
  support = false,
  id,
  className,
}: {
  slug: string;
  support?: boolean;
  id: string;
  className?: string;
}) {
  const t = await getTranslations("learn.pdf");
  const links = [
    { href: `/formations/${slug}/programme`, label: t("programme"), hint: t("programmeHint") },
    ...(support
      ? [{ href: `/app/learn/${slug}/support`, label: t("support"), hint: t("supportHint") }]
      : []),
  ];
  return (
    <section aria-labelledby={id} className={cx("flex flex-col gap-3", className)}>
      <h2 id={id} className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {t("title")}
      </h2>
      <ul className="grid gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="group flex items-center gap-3 rounded-[18px] border border-brume bg-blanc p-3.5 transition-colors hover:border-sapin/30"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime-clair">
                <Icon name="telecharger" className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold underline-offset-4 group-hover:underline">
                  {link.label}
                </span>
                <span className="text-xs text-ardoise">{link.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
