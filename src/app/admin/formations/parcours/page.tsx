import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Alert, Badge, Button, ButtonLink, EmptyState, TextField } from "@/components/ui";
import { createPathAction } from "@/server/actions/learn-paths";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import { listPathsForAdmin } from "@/server/services/learn-paths";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.courses.paths");
  return { title: t("title"), robots: { index: false } };
}

const statusTone = {
  draft: "neutral",
  review: "warning",
  published: "success",
  archived: "outline",
} as const;

/** Learning paths (Learn v2, étape 2): content editors and administrators list and create them. */
export default async function AdminPaths({
  searchParams,
}: PageProps<"/admin/formations/parcours">) {
  if (!(await requireCourseEditor())) notFound();
  const params = await searchParams;
  const t = await getTranslations("admin.courses.paths");
  const paths = await listPathsForAdmin(db);

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        eyebrow={t("eyebrow")}
        subtitle={t("subtitle")}
        action={
          <ButtonLink
            href="/admin/formations"
            variant="secondary"
            icon={<Icon name="chev-l" />}
            size="sm"
          >
            {t("back")}
          </ButtonLink>
        }
      />
      {params.erreur === "titre" && <Alert tone="error" title={t("new.error")} />}

      {paths.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {paths.map((path) => (
            <li key={path.id} className={`${adminCard} flex items-center gap-4`}>
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-lime"
              >
                <Icon name="objectif" className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/admin/formations/parcours/${path.id}`}
                  className="truncate text-[16px] font-semibold hover:underline"
                >
                  {path.title}
                </Link>
                <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ardoise">
                  <Badge tone={statusTone[path.status]}>{t(`status.${path.status}`)}</Badge>
                  {path.domain && <span>{path.domain.name}</span>}
                  <span>{t("courses", { count: path._count.courses })}</span>
                  <span>{t("followers", { count: path._count.followers })}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section id="nouveau" aria-labelledby="new-path" className={`${adminCard} scroll-mt-24`}>
        <h2 id="new-path" className="mb-4 text-[18px] font-semibold">
          {t("new.title")}
        </h2>
        <form action={createPathAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <TextField
              id="path-new-title"
              name="title"
              label={t("new.field")}
              required
              minLength={3}
              maxLength={120}
            />
          </div>
          <Button type="submit" icon={<Icon name="plus" />} className="w-full sm:w-fit">
            {t("new.submit")}
          </Button>
        </form>
      </section>
    </>
  );
}
