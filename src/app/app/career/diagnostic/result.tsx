import Link from "next/link";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { PROGRESSION_HREF } from "./welcome";
import { OrbiSpark } from "@/components/phone/cv/marks";
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
import { stages } from "@/server/services/diagnostic-scoring";
import "@/styles/diagnostic-resultat.css";

const priorityHref = (priority: Priority) =>
  miniPlanLinks[priority] ?? (priority === "interview" ? stepLinks.interview : "/app/jobs");

/**
 * Result of the diagnostic, kept to what leads to an action (Ephraïm, 31/10/2026): the score and
 * the stage on a dark card with the four stages drawn, then « À faire maintenant », the three
 * priorities as links, and « Pourquoi ces notes ? » with the points of every answer (fixed rules).
 * « Refaire » and « Mon plan » at the bottom, the PDF to share at the top.
 */
export async function DiagnosticResult({
  userId,
  id,
  result,
  summary,
  notice,
}: {
  userId: string;
  id: string;
  result: DiagnosticV2;
  /** Orbi's summary, only for the personalized level. */
  summary: string | null;
  notice: string | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
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
                <h2 id="dg-niveau">{d(`diag.headline.${result.stage}`)}</h2>
                <span className="sr-only">{t("diag.score", { score: result.score })}</span>
                {result.roles[0] && <span className="dg-r-role">{result.roles[0]}</span>}
              </div>
            </div>
            <ol className="dg-r-echelle" aria-label={t("diag.result.scale")}>
              {stages.map((stage) => (
                <li
                  key={stage}
                  className={stage === result.stage ? "dg-r-ici" : undefined}
                  aria-current={stage === result.stage ? "step" : undefined}
                >
                  <i aria-hidden />
                  <span>{d(`career.diagnostic.stage.${stage}`)}</span>
                </li>
              ))}
            </ol>
          </section>

          {summary && (
            <div className="dg-r-orbi">
              <span className="dg-r-orbi-ic" aria-hidden>
                <OrbiSpark size={18} />
              </span>
              <p>{summary}</p>
            </div>
          )}

          <section aria-labelledby="dg-faire" className="dg-r-sec">
            <h2 id="dg-faire">{t("diag.result.todo")}</h2>
            <ol className="dg-r-todo">
              {result.priorities.map((priority, index) => (
                <li key={priority}>
                  <Link href={priorityHref(priority)} className="t-press">
                    <span className="dg-r-n" aria-hidden>
                      {index + 1}
                    </span>
                    <b>{d(`career.diagnostic.miniPlan.step.${priority}.title`)}</b>
                    <TalentIcon name="suivant" size="s" />
                  </Link>
                </li>
              ))}
            </ol>
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
