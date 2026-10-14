import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { card, CareerTabs, IconTile, pillClass } from "@/components/career/kit";
import { Alert, EmptyState } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { createCv } from "@/server/actions/cv";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { MAX_CVS } from "@/server/services/cv";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.cv");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/** « Mes CV »: the list, and a new CV filled from the profile. */
export default async function CvListPage({ searchParams }: PageProps<"/app/career/cv">) {
  const params = await searchParams;
  const user = await requireUser("/app/career/cv");
  const t = await getTranslations("career.cv");
  const cvs = await db.document.findMany({
    where: { kind: "cv", profile: { userId: user.id } },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, isPrimary: true, updatedAt: true },
  });
  const tHome = await getTranslations("career.home");
  const create = (
    <form action={createCv}>
      <button type="submit" disabled={cvs.length >= MAX_CVS} className={pillClass("dark", "sm")}>
        <Icon name="plus" className="size-4" />
        {t("new")}
      </button>
    </form>
  );
  return (
    <>
      <AppPageHeader
        eyebrow={tHome("eyebrow")}
        title={t("myCvs")}
        actions={cvs.length > 0 ? create : undefined}
      />
      <CareerTabs active="cv" />
      {params.ok === "supprime" && <Alert tone="success" title={t("deleted")} />}
      {(params.erreur === "limite" || cvs.length >= MAX_CVS) && (
        <Alert tone={params.erreur ? "error" : "info"} title={t("limit", { max: MAX_CVS })} />
      )}
      {cvs.length === 0 ? (
        <EmptyState title={t("empty")} description={t("fromProfileHint")} action={create} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cvs.map((cv) => (
            <li key={cv.id} className={cx(card, "flex flex-col gap-4")}>
              <div className="flex items-start justify-between gap-3">
                <IconTile icon="doc" />
                {cv.isPrimary && (
                  <span className="rounded-pill bg-lime-clair px-2.5 py-1 text-[11px] font-semibold">
                    {t("default")}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">
                  <Link href={`/app/career/cv/${cv.id}`} className="hover:underline">
                    {cv.title}
                  </Link>
                </h2>
                <p className="text-[13px] text-ardoise">
                  {t("updated", { date: formatDate(cv.updatedAt) })}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 border-t border-brume pt-3">
                <Link href={`/app/career/cv/${cv.id}`} className={pillClass("dark", "sm")}>
                  {t("open")}
                </Link>
                <a href={`/app/career/cv/${cv.id}/pdf`} className={pillClass("outline", "sm")}>
                  <Icon name="telecharger" className="size-4" />
                  {t("export.text")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
