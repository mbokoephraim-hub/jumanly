import Link from "next/link";
import type { CSSProperties } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import type { DiagnosticV2 } from "@/server/services/diagnostic";

/**
 * Result of the diagnostic (planche talent-4 § 5, « Diagnostic »): the global score in its ring,
 * the stage, the six notes out of 100 and « Pourquoi ces notes ? » with the points of every
 * answer (fixed rules `diagnostic_scoring_v2`). « Refaire » and « Mon plan » at the bottom, the
 * PDF to share at the top.
 */
export async function DiagnosticResult({
  id,
  date,
  result,
  summary,
  notice,
}: {
  id: string;
  date: Date;
  result: DiagnosticV2;
  /** The summary written for the personalized level, read as Orbi's bubble. */
  summary: string | null;
  notice: string | null;
}) {
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const name = (key: string) => d(`career.diagnostic.dimension.${key}.name`);

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/profil/point"
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
      {notice && <Notice tone="err">{notice}</Notice>}
      <section aria-labelledby="dg-niveau" className="t-verre t-diag-h">
        <span className="t-anneau" style={{ "--p": result.score } as CSSProperties}>
          <b aria-hidden>{result.score}</b>
        </span>
        <div className="t-t">
          <h2 id="dg-niveau">{d(`diag.headline.${result.stage}`)}</h2>
          <span className="sr-only">{t("diag.score", { score: result.score })}</span>
          <span>{t("diag.rules")}</span>
          <span className="sr-only">
            {t("diag.date", {
              date: format.dateTime(date, { day: "numeric", month: "long", year: "numeric" }),
            })}
          </span>
        </div>
      </section>
      {summary && (
        <div className="t-bulle-o">
          <OrbiMark size={32} />
          <div className="t-verre t-corps">
            <span>{summary}</span>
          </div>
        </div>
      )}
      <dl className="t-verre t-dims" aria-label={t("diag.scores")}>
        {result.dimensions.map((item) => (
          <div key={item.key} className="t-dim">
            <dt>{name(item.key)}</dt>
            <dd className="t-barre" aria-hidden>
              <i style={{ width: `${item.score}%` }} />
            </dd>
            <dd>
              <b>{item.score}</b>
            </dd>
          </div>
        ))}
      </dl>
      <SheetButton target="dg-pourquoi" className="t-pq t-press">
        <TalentIcon name="pourquoi" />
        {t("diag.why.cta")}
      </SheetButton>
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
      <div className="t-verre t-fort t-bas-f">
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
