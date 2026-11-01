import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { MenuArt } from "@/components/site/menu-art";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { classCounts, rankByClass } from "@/server/services/hire-classes";
import { allowedFilters, blindName, parseFilters, passes } from "@/server/services/hire-filters";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhTri.table");
  return { title: t("seo"), robots: { index: false } };
}

const sorts = ["classe", "score", "potentiel", "confiance", "experience", "date"] as const;
type Sort = (typeof sorts)[number];
const confidenceRank = { low: 0, medium: 1, high: 2 } as const;

/**
 * « Vue tableau » on a computer (« Logique du recrutement », sur ordinateur): every candidate of the
 * offer in a table whose columns sort (class, compatibility, potential, confidence, experience,
 * date), with the saved filters of the offer and a selection to compare up to four. The same logic
 * as the phone, with more room and no extra step.
 */
export default async function TablePage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/tableau">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx } = await requireHire(`/app/hire/offres/${id}/tableau`, "readApplications");
  const t = await getTranslations("phoneRhTri");
  const to = await getTranslations("phoneRhOffres");
  const format = await getFormatter();
  const board = await atsBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const job = board.job;
  const sort: Sort = sorts.find((value) => value === query.tri) ?? "classe";
  const descending = query.ordre !== "asc";
  const now = new Date();
  const ranked = rankByClass(board.rows);
  const filters = allowedFilters(parseFilters(job.pipelineFilters), board.filtersLevel);
  const visible = ranked.filter((row) => row.status !== "withdrawn" && passes(row, filters, now));
  const value = (row: (typeof ranked)[number]): number => {
    switch (sort) {
      case "score":
        return row.score ?? -1;
      case "potentiel":
        return row.potential.value;
      case "confiance":
        return confidenceRank[row.confidence.after.level] * 1000 + row.confidence.after.value;
      case "experience":
        return row.years;
      case "date":
        return row.createdAt.getTime();
      default:
        return -ranked.indexOf(row);
    }
  };
  const rows = [...visible].sort((a, b) =>
    descending ? value(b) - value(a) : value(a) - value(b),
  );
  const base = `/app/hire/offres/${job.id}/tableau`;
  const sortHref = (key: Sort) =>
    `${base}?tri=${key}&ordre=${key === sort && descending ? "asc" : "desc"}`;
  const nameOf = (row: (typeof ranked)[number]) =>
    job.blindSort && !row.shortlisted
      ? t("blind.name", { index: blindName(ranked.indexOf(row)) })
      : row.name;
  const compareForm = `table-comparer-${job.id}`;
  const header = (key: Sort, label: string) => (
    <th
      scope="col"
      aria-sort={key === sort ? (descending ? "descending" : "ascending") : undefined}
    >
      <Link href={sortHref(key)}>{label}</Link>
    </th>
  );

  return (
    <div className="nb-page jm-pieces jm-tableau">
      <header className="jm-pieces-h">
        <Link href={`/app/hire/offres/${job.id}`} className="jm-pieces-retour">
          {t("table.back")}
        </Link>
        <h1>
          <MenuArt name="pipeline" size="sm" />
          {t("table.title")}
        </h1>
        <p>{job.title}</p>
      </header>
      {board.withScores ? (
        <ul className="jm-tableau-classes">
          {classCounts(ranked).map((item) => (
            <li key={item.key} data-classe={item.key}>
              <b>{item.count}</b>
              {to(`classes.${item.key}`)}
            </li>
          ))}
        </ul>
      ) : null}
      <form id={compareForm} action={`/app/hire/offres/${job.id}/comparer`} method="get">
        <div className="jm-comparer-defile">
          <table className="jm-comparer-t jm-tableau-t">
            <caption className="sr-only">{t("table.caption")}</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">{t("compare.pick")}</span>
                </th>
                <th scope="col">{t("table.name")}</th>
                {header("classe", t("compare.class"))}
                {header("score", t("notes.compatibility"))}
                {header("potentiel", t("notes.potential"))}
                {header("confiance", t("notes.confidence"))}
                {header("experience", t("compare.years"))}
                <th scope="col">{t("documents.title")}</th>
                <th scope="col">{t("compare.stage")}</th>
                {header("date", t("table.date"))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-classe={row.orbiClass ?? undefined}>
                  <td>
                    <input
                      type="checkbox"
                      name="ids"
                      value={row.id}
                      aria-label={t("table.pick", { name: nameOf(row) })}
                    />
                  </td>
                  <th scope="row">
                    <Link href={`/app/hire/candidats/${row.id}`}>{nameOf(row)}</Link>
                    {row.headline ? <small>{row.headline}</small> : null}
                  </th>
                  <td>{row.orbiClass ? t(`class.${row.orbiClass}`) : t("compare.none")}</td>
                  <td>
                    {row.score !== null
                      ? t("notes.percent", { value: row.score })
                      : t("compare.none")}
                  </td>
                  <td>
                    {row.star
                      ? t("notes.star")
                      : t("notes.percent", { value: row.potential.value })}
                  </td>
                  <td>{t(`notes.level.${row.confidence.after.level}`)}</td>
                  <td>{t("sentence.years", { count: row.years })}</td>
                  <td>
                    {row.documents.asked
                      ? t("compare.documents", {
                          received: row.documents.received,
                          asked: row.documents.asked,
                        })
                      : t("compare.none")}
                  </td>
                  <td>{row.stage.name}</td>
                  <td>{format.dateTime(row.createdAt, { day: "numeric", month: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="jm-pieces-meta">{to("pipeline.empty")}</p> : null}
        <p className="jm-pieces-meta">
          {board.withScores ? to("classes.rule") : to("candidates.ruleNoScore")}
        </p>
        <button type="submit" className="jm-pieces-envoyer">
          {t("compare.button")}
        </button>
      </form>
      <p className="jm-pieces-meta jm-tableau-liens">
        <Link href={`/app/hire/offres/${job.id}/resultats`}>{t("results.title")}</Link>
        <Link href={`/app/hire/offres/${job.id}/verification`}>{t("pieces.title")}</Link>
      </p>
    </div>
  );
}
