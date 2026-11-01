import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MenuArt } from "@/components/site/menu-art";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import { atsBoard } from "@/server/services/hire-ats";
import { classCounts, rankByClass } from "@/server/services/hire-classes";
import { blindName } from "@/server/services/hire-filters";
import { listPublicPlans, orgPlanFor } from "@/server/services/plans";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneRhTri.results");
  return { title: t("seo"), robots: { index: false } };
}

/** Names shown at most in « Fort potentiel »; the others are one tap away in the pipeline. */
const SHOWN = 6;

/**
 * « Résultats de l'analyse » (« Logique du recrutement », les formules): the moment the recruiter
 * sees what Orbi found. With the matching of the plan (`hire.matching.level`), the four classes and
 * who is in « Fort potentiel », with a link to each summary. Without it, the number of « Fort
 * potentiel » only, never who they are, and the plan that shows them. Nobody is rejected here.
 */
export default async function ResultsPage({
  params,
}: PageProps<"/app/hire/offres/[id]/resultats">) {
  const { id } = await params;
  const { ctx } = await requireHire(`/app/hire/offres/${id}/resultats`, "readApplications");
  const t = await getTranslations("phoneRhTri");
  const to = await getTranslations("phoneRhOffres");
  const board = await atsBoard(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const { job } = board;
  const pipeline = `/app/hire/offres/${job.id}?vue=candidats`;
  const active = board.rows.filter((row) => row.status === "active");
  const ranked = rankByClass(board.rows);
  const nameOf = (row: (typeof ranked)[number]) =>
    job.blindSort && !row.shortlisted
      ? t("blind.name", { index: blindName(ranked.indexOf(row)) })
      : row.name;

  const header = (
    <header className="jm-pieces-h">
      <Link href={pipeline} className="jm-pieces-retour">
        {t("back")}
      </Link>
      <h1>
        <MenuArt name="why" size="sm" />
        {t("results.title")}
      </h1>
      <p>{job.title}</p>
    </header>
  );

  if (!board.withScores) {
    const plan = orgPlanFor(await listPublicPlans(db), "hire.matching.level", ["explainable"]);
    return (
      <div className="nb-page jm-pieces jm-resultats">
        {header}
        <section className="jm-resultats-grand" data-classe="fort" aria-labelledby="res-fort">
          <b id="res-fort">{board.hiddenStrong}</b>
          <span>
            {t("results.hiddenCount", { count: board.hiddenStrong, total: active.length })}
          </span>
        </section>
        {board.hiddenStrong > 0 ? (
          <ul className="jm-resultats-liste jm-resultats-flou" aria-hidden>
            {Array.from({ length: Math.min(board.hiddenStrong, 3) }, (_, index) => (
              <li key={index} data-classe="fort">
                <i />
              </li>
            ))}
          </ul>
        ) : null}
        <section className="jm-pieces-s jm-pieces-lock" aria-labelledby="res-formule">
          <h2 id="res-formule">
            <MenuArt name="pricing" size="xs" />
            {t("results.lockTitle")}
          </h2>
          <p className="jm-pieces-meta">
            {plan ? t("results.lockPlan", { plan }) : t("results.lockNoPlan")}
          </p>
          <Link href="/app/abonnement/formules" className="jm-pieces-envoyer">
            {t("results.lockSee")}
          </Link>
        </section>
        <p className="jm-pieces-meta">{t("results.ruleNoPlan")}</p>
        <p className="jm-pieces-meta">
          <Link href={pipeline}>{t("results.open")}</Link>
        </p>
      </div>
    );
  }

  const strong = ranked.filter((row) => row.status === "active" && row.orbiClass === "fort");
  return (
    <div className="nb-page jm-pieces jm-resultats">
      {header}
      <p className="jm-pieces-compte">
        {t("results.classed", {
          classed: active.filter((row) => row.orbiClass !== null).length,
          total: active.length,
        })}
      </p>
      <ul className="jm-tableau-classes">
        {classCounts(active).map((item) => (
          <li key={item.key} data-classe={item.key}>
            <b>{item.count}</b>
            <Link href={`${pipeline}&classe=${item.key}`}>{to(`classes.${item.key}`)}</Link>
          </li>
        ))}
      </ul>
      <section className="jm-pieces-s" aria-labelledby="res-liste">
        <h2 id="res-liste">{to("classes.fort")}</h2>
        {strong.length === 0 ? (
          <p className="jm-pieces-meta">{t("results.noneStrong")}</p>
        ) : (
          <ul className="jm-resultats-liste">
            {strong.slice(0, SHOWN).map((row) => (
              <li key={row.id} data-classe="fort">
                <Link href={`${pipeline}&fiche=${row.id}`}>{nameOf(row)}</Link>
                {row.star ? <span>{t("notes.star")}</span> : null}
                <span className="jm-resultats-score">
                  {row.score !== null ? t("notes.percent", { value: row.score }) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {strong.length > SHOWN ? (
          <p className="jm-pieces-meta">
            <Link href={`${pipeline}&classe=fort`}>
              {to("classes.open", { count: strong.length })}
            </Link>
          </p>
        ) : null}
      </section>
      <p className="jm-pieces-meta">{to("classes.rule")}</p>
      <p className="jm-pieces-meta">
        <Link href={pipeline}>{t("results.open")}</Link>
      </p>
    </div>
  );
}
