import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button, EmptyState } from "@/components/ui";
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
  const create = (
    <form action={createCv}>
      <Button type="submit" disabled={cvs.length >= MAX_CVS}>
        {t("new")}
      </Button>
    </form>
  );
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-eyebrow text-ardoise">{t("title")}</p>
          <h1 className="text-h1">{t("myCvs")}</h1>
        </div>
        {cvs.length > 0 && create}
      </header>
      {params.ok === "supprime" && <Alert tone="success" title={t("deleted")} />}
      {(params.erreur === "limite" || cvs.length >= MAX_CVS) && (
        <Alert tone={params.erreur ? "error" : "info"} title={t("limit", { max: MAX_CVS })} />
      )}
      {cvs.length === 0 ? (
        <EmptyState title={t("empty")} description={t("fromProfileHint")} action={create} />
      ) : (
        <ul className="flex flex-col gap-3">
          {cvs.map((cv) => (
            <li
              key={cv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-blanc p-5"
            >
              <span className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Link href={`/app/career/cv/${cv.id}`} className="font-semibold underline">
                    {cv.title}
                  </Link>
                  {cv.isPrimary && <Badge tone="career">{t("default")}</Badge>}
                </span>
                <span className="text-sm text-ardoise">
                  {t("updated", { date: formatDate(cv.updatedAt) })}
                </span>
              </span>
              <span className="flex flex-wrap gap-3 text-sm">
                <Link href={`/app/career/cv/${cv.id}`} className="underline">
                  {t("open")}
                </Link>
                <a href={`/app/career/cv/${cv.id}/pdf`} className="underline">
                  {t("export.text")}
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
