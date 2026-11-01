import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MenuArt } from "@/components/site/menu-art";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { rankByClass } from "@/server/services/hire-classes";
import { blindName } from "@/server/services/hire-filters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhTri.compare");
  return { title: t("seo"), robots: { index: false } };
}

/** Up to four candidates side by side (two fit a phone, the others scroll). */
const MAX = 4;

/**
 * « Comparer » (« Logique du recrutement »): two to four candidates of one offer side by side,
 * criterion by criterion, with the same facts as the summary. Nothing here ranks them for the
 * recruiter beyond Orbi's notes; the recruiter decides.
 */
export default async function ComparePage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/comparer">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/comparer`, "readApplications");
  const t = await getTranslations("phoneRhTri");
  const board = await atsBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const asked = (Array.isArray(query.ids) ? query.ids : query.ids ? [query.ids] : [])
    .flatMap((value) => value.split(","))
    .map((value) => value.slice(0, 60));
  const ranked = rankByClass(board.rows);
  const rows = ranked.filter((row) => asked.includes(row.id)).slice(0, MAX);
  const back = `/app/hire/offres/${board.job.id}?vue=candidats`;
  const nameOf = (row: (typeof rows)[number]) =>
    board.job.blindSort && !row.shortlisted
      ? t("blind.name", { index: blindName(ranked.indexOf(row)) })
      : row.name;
  const lines: { key: string; label: string; value: (row: (typeof rows)[number]) => string }[] = [
    {
      key: "class",
      label: t("compare.class"),
      value: (row) => (row.orbiClass ? t(`class.${row.orbiClass}`) : t("compare.none")),
    },
    {
      key: "score",
      label: t("notes.compatibility"),
      value: (row) =>
        row.score !== null ? t("notes.percent", { value: row.score }) : t("compare.none"),
    },
    {
      key: "potential",
      label: t("notes.potential"),
      value: (row) =>
        row.star ? t("notes.star") : t("notes.percent", { value: row.potential.value }),
    },
    {
      key: "confidence",
      label: t("notes.confidence"),
      value: (row) => t(`notes.level.${row.confidence.after.level}`),
    },
    {
      key: "years",
      label: t("compare.years"),
      value: (row) => t("sentence.years", { count: row.years }),
    },
    {
      key: "skills",
      label: t("skills.title"),
      value: (row) => (row.matched.length ? row.matched.join(", ") : t("compare.none")),
    },
    {
      key: "missing",
      label: t("compare.missing"),
      value: (row) =>
        row.toCheck.length ? row.toCheck.slice(0, 3).join(", ") : t("compare.nothing"),
    },
    {
      key: "documents",
      label: t("documents.title"),
      value: (row) =>
        row.documents.asked
          ? t("compare.documents", {
              received: row.documents.received,
              asked: row.documents.asked,
            })
          : t("compare.none"),
    },
    { key: "city", label: t("compare.city"), value: (row) => row.city ?? t("compare.none") },
    {
      key: "criteria",
      label: t("criteria.title"),
      value: (row) =>
        row.missedCriteria.length
          ? t("compare.criteriaMissed", { list: row.missedCriteria.join(", ") })
          : t("compare.nothing"),
    },
    { key: "stage", label: t("compare.stage"), value: (row) => row.stage.name },
  ];

  return (
    <div className="nb-page jm-pieces jm-comparer">
      <header className="jm-pieces-h">
        <Link href={back} className="jm-pieces-retour">
          {t("back")}
        </Link>
        <h1>
          <MenuArt name="people" size="sm" />
          {t("compare.title")}
        </h1>
        <p>{board.job.title}</p>
      </header>
      {rows.length < 2 ? (
        <p className="jm-pieces-s">{t("compare.pickTwo")}</p>
      ) : (
        <div className="jm-comparer-defile">
          <table className="jm-comparer-t">
            <caption className="sr-only">{t("compare.caption")}</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t("compare.criterion")}</span>
                </th>
                {rows.map((row) => (
                  <th key={row.id} scope="col" data-classe={row.orbiClass ?? undefined}>
                    <Link href={`/app/hire/offres/${board.job.id}?vue=candidats&fiche=${row.id}`}>
                      {nameOf(row)}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key}>
                  <th scope="row">{line.label}</th>
                  {rows.map((row) => (
                    <td key={row.id}>{line.value(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="jm-pieces-meta">{t("compare.rule")}</p>
    </div>
  );
}
