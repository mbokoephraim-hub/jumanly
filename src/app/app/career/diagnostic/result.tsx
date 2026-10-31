import Link from "next/link";
import type { CSSProperties } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { PROGRESSION_HREF } from "./welcome";
import { OrbiSpark } from "@/components/phone/cv/marks";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { PlanSummary } from "@/components/talent/profile/plan-summary";
import { dynamic } from "@/i18n/dynamic";
import {
  miniPlanLinks,
  stepLinks,
  type DiagnosticV2,
  type Priority,
} from "@/server/services/diagnostic";
import {
  bandFor,
  dimensionLinks,
  stageFloors,
  stages,
  type Dimension,
} from "@/server/services/diagnostic-scoring";
import "@/styles/diagnostic-resultat.css";

const dimensionArt: Record<Dimension, MenuArtName> = {
  clarity: "career",
  skills: "trainings",
  experience: "companies",
  tools: "cv",
  interviews: "recruiters",
  search: "connect",
};
const priorityArt: Record<Priority, MenuArtName> = {
  role: "career",
  skills: "trainings",
  experience: "portfolio",
  cv: "cv",
  interview: "recruiters",
  search: "jobs",
  network: "connect",
};
const priorityHref = (priority: Priority) =>
  miniPlanLinks[priority] ?? (priority === "interview" ? stepLinks.interview : "/app/jobs");

/**
 * Result of the diagnostic, redone 31/10/2026 (Ephraïm): the score and the stage on a dark card
 * with the four stages drawn, Orbi's word, « À faire maintenant » (the three priorities, each with
 * a free action and where to do it), the six themes with their drawing (tap: what it means and
 * what to do), the strengths, and « Pourquoi ces notes ? » with the points of every answer
 * (fixed rules). « Refaire » and « Mon plan » at the bottom, the PDF to share at the top.
 */
export async function DiagnosticResult({
  userId,
  id,
  date,
  result,
  summary,
  strengthTexts,
  miniPlan,
  notice,
}: {
  userId: string;
  id: string;
  date: Date;
  result: DiagnosticV2;
  /** The summary written for the personalized level, read as Orbi's bubble. */
  summary: string | null;
  /** The strengths and mini plan sentences written by Orbi (personalized level). */
  strengthTexts?: string[];
  miniPlan?: { priority: Priority; text: string }[];
  notice: string | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const name = (key: string) => d(`career.diagnostic.dimension.${key}.name`);

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-h">
        <FlowHead
          back={PROGRESSION_HREF}
          history={false}
          backLabel={t("diag.back")}
          title={t("diag.title")}
          end={
            <a
              href={`/app/career/diagnostic/pdf?bilan=${id}`}
              className="t-bi t-press"
              aria-label={t("diag.share")}
              download
            >
              <TalentIcon name="partager" size="s" />
            </a>
          }
        />
        <p className="t-w4-sub t-w4-web">{t("talentW4.diagnostic.subtitle")}</p>
        <a
          href={`/app/career/diagnostic/pdf?bilan=${id}`}
          className="t-bt t-sec t-m t-press t-w4-web"
          download
        >
          <TalentIcon name="partager" size="s" />
          {t("talentW4.diagnostic.share")}
        </a>
      </div>
      <div className="t-w4-g2e">
        <div className="t-w4-col">
          {notice && <Notice tone="err">{notice}</Notice>}
          <section aria-labelledby="dg-niveau" className="dg-r-hero">
            <div className="dg-r-top">
              <span
                className="dg-r-ring"
                style={{ "--p": result.score } as CSSProperties}
                aria-hidden
              >
                <b>{result.score}</b>
                <small>{t("diag.result.outOf")}</small>
              </span>
              <div className="dg-r-t">
                <span className="dg-r-badge">{t("diag.result.badge")}</span>
                <h2 id="dg-niveau">{d(`diag.headline.${result.stage}`)}</h2>
                <span className="sr-only">{t("diag.score", { score: result.score })}</span>
                {result.roles[0] && (
                  <span className="dg-r-role">
                    {t("diag.result.role", { role: result.roles[0] })}
                  </span>
                )}
              </div>
            </div>
            <p className="dg-r-stage">{d(`career.diagnostic.stage.${result.stage}Text`)}</p>
            <ol className="dg-r-echelle" aria-label={t("diag.result.scale")}>
              {stages.map((stage) => (
                <li
                  key={stage}
                  className={stage === result.stage ? "dg-r-ici" : undefined}
                  aria-current={stage === result.stage ? "step" : undefined}
                >
                  <i aria-hidden />
                  <span>{d(`career.diagnostic.stage.${stage}`)}</span>
                  <small>{stageFloors[stage]}</small>
                </li>
              ))}
            </ol>
            <p className="dg-r-date">
              {t("diag.date", {
                date: format.dateTime(date, { day: "numeric", month: "long", year: "numeric" }),
              })}
            </p>
          </section>

          <div className="dg-r-orbi">
            <span className="dg-r-orbi-ic" aria-hidden>
              <OrbiSpark size={20} />
            </span>
            <p>{summary ?? d(`diag.result.word.${result.stage}`)}</p>
          </div>

          <section aria-labelledby="dg-faire" className="dg-r-sec">
            <h2 id="dg-faire">{t("diag.result.todo")}</h2>
            <ol className="dg-r-todo">
              {result.priorities.map((priority, index) => {
                const text =
                  miniPlan?.find((item) => item.priority === priority)?.text ??
                  d(`career.diagnostic.miniPlan.step.${priority}.text`);
                return (
                  <li key={priority} data-rang={index + 1}>
                    <MenuArt name={priorityArt[priority]} size="sm" />
                    <div className="dg-r-todo-t">
                      <b>{d(`career.diagnostic.miniPlan.step.${priority}.title`)}</b>
                      <p>{text}</p>
                      <Link href={priorityHref(priority)} className="dg-r-go t-press">
                        {t("diag.result.go")}
                        <TalentIcon name="suivant" size="xs" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="dg-themes" className="dg-r-sec">
            <h2 id="dg-themes">{t("diag.result.themes")}</h2>
            <p className="dg-r-aide">{t("diag.result.themesHint")}</p>
            <ul className="dg-r-dims" aria-label={t("diag.scores")}>
              {result.dimensions.map((item) => {
                const band = bandFor(item.score);
                return (
                  <li key={item.key}>
                    <details className="dg-r-dim" data-bande={band}>
                      <summary className="t-press">
                        <MenuArt name={dimensionArt[item.key]} size="sm" />
                        <span className="dg-r-dim-n">
                          <b>{name(item.key)}</b>
                          <span className="dg-r-barre" aria-hidden>
                            <i style={{ width: `${Math.max(4, item.score)}%` }} />
                          </span>
                        </span>
                        <span className="dg-r-note">
                          {item.score}
                          <span className="sr-only">{t("diag.result.outOfLong")}</span>
                        </span>
                      </summary>
                      <div className="dg-r-dim-d">
                        <p>{d(`career.diagnostic.dimension.${item.key}.finding.${band}`)}</p>
                        <Link href={dimensionLinks[item.key]} className="dg-r-go t-press">
                          {d(`career.diagnostic.dimension.${item.key}.action`)}
                          <TalentIcon name="suivant" size="xs" />
                        </Link>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="dg-atouts" className="dg-r-sec">
            <h2 id="dg-atouts">{t("career.diagnostic.result.strengths")}</h2>
            {(strengthTexts?.length ?? 0) + result.strengths.length > 0 ? (
              <ul className="dg-r-atouts">
                {(strengthTexts?.length
                  ? strengthTexts
                  : result.strengths.map((key) => d(`career.diagnostic.rule.strength.${key}`))
                ).map((text) => (
                  <li key={text}>
                    <span className="dg-r-coche" aria-hidden>
                      <TalentIcon name="valider" size="xs" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dg-r-aide">{t("career.diagnostic.rule.strength.none")}</p>
            )}
          </section>
          <div className="t-w4-pqr">
            <SheetButton target="dg-pourquoi" className="t-pq t-press">
              <TalentIcon name="pourquoi" />
              {t("diag.why.cta")}
            </SheetButton>
            <Link
              href="/app/career/diagnostic?refaire=1"
              className="t-bt t-sec t-m t-press t-w4-web"
            >
              {t("talentW4.diagnostic.again")}
            </Link>
          </div>
        </div>
        <section aria-labelledby="dg-plan" className="t-w4-col t-w4-web">
          <div className="t-w4-sec">
            <h2 id="dg-plan">{t("plan.title")}</h2>
          </div>
          <PlanSummary userId={userId} />
        </section>
      </div>
      <Sheet id="dg-pourquoi" title={t("diag.why.title")} closeLabel={t("diag.why.close")}>
        <div className="t-pq-d">
          <p className="t-vide-t">{t("diag.why.intro")}</p>
          {result.dimensions.map((item) => (
            <section key={item.key} aria-labelledby={`dg-pq-${item.key}`}>
              <h3 id={`dg-pq-${item.key}`}>
                <span>{name(item.key)}</span>
                <span>{t("diag.score", { score: item.score })}</span>
              </h3>
              <ul>
                {item.reasons.map((reason) => (
                  <li key={reason.code}>
                    <span>{d(`career.diagnostic.dimension.reason.${reason.code}`)}</span>
                    <b>
                      {t("career.diagnostic.dimension.points", {
                        points: reason.points,
                        max: reason.max,
                      })}
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Sheet>
      <div className="t-verre t-fort t-bas-f t-w4-tel">
        <Link href="/app/career/diagnostic?refaire=1" className="t-bt t-sec t-m t-press">
          {t("diag.again")}
        </Link>
        <Link href="/app/career/plan" className="t-bt t-p t-pl t-press">
          {t("diag.plan")}
        </Link>
      </div>
    </div>
  );
}
