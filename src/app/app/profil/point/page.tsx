import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { careerPoint, type PointLine } from "@/server/services/career-point";
import { catalogLevelOf, opensCourse } from "@/server/services/learn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("point");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

/**
 * « Faire le point » (planche talent-4 § 5), opened from « Mon profil »: Orbi's summary, the
 * strengths, what to reinforce and the next action, then the diagnostic and the plan. Fixed rules
 * (src/server/services/career-point.ts): the same facts give the same advice, with its « Pourquoi ? ».
 */
export default async function CareerPointPage() {
  const user = await requireUser("/app/profil/point");
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const catalog = await catalogLevelOf(db, user.id);
  const point = await careerPoint(db, user.id, (required) => opensCourse(catalog, required));
  const dimension = (key: string) => d(`career.diagnostic.dimension.${key}.name`);

  const text = (line: PointLine, side: "strength" | "weak") => {
    switch (line.code) {
      case "certificate":
        return t("point.strength.certificate", { name: line.name });
      case "result":
        return t("point.strength.result");
      case "proven":
        return t("point.strength.proven", { count: line.count });
      case "dimension":
        return d(`point.${side}.dimension`, { name: dimension(line.key), score: line.score });
      case "skill":
        return t("point.weak.skill", { skill: line.skill, count: line.count, total: line.total });
      case "noResult":
        return t("point.weak.noResult");
      case "noExperience":
        return t("point.weak.noExperience");
    }
  };

  const next = point.next;
  const nextLine =
    next.kind === "course"
      ? t("point.next.course", { course: next.title, minutes: next.minutes })
      : next.kind === "priority"
        ? d(`career.diagnostic.miniPlan.step.${next.priority}.title`)
        : next.kind === "profile"
          ? t("point.next.profile")
          : t("point.next.diagnostic");
  const nextHref =
    next.kind === "course"
      ? `/app/learn/${next.slug}`
      : next.kind === "priority"
        ? next.href
        : next.kind === "profile"
          ? "/app/profil"
          : "/app/career/diagnostic";
  const target = point.role
    ? point.city
      ? t("point.summary.targetCity", { role: point.role, city: point.city })
      : t("point.summary.target", { role: point.role })
    : null;

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/profil"
        backLabel={t("point.back")}
        title={t("point.title")}
        end={
          <Link href="/app/profil" className="t-bi t-press" aria-label={t("point.close")}>
            <TalentIcon name="fermer" size="s" />
          </Link>
        }
      />
      <div className="t-bulle-o">
        <OrbiMark size={32} />
        <div className="t-verre t-corps">
          <span>
            {point.stage ? d(`point.summary.${point.stage}`) : t("point.summary.none")}
            {target && " "}
            {target}
          </span>
        </div>
      </div>

      <section aria-labelledby="pt-atouts" className="t-verre t-fb-c">
        <h2 id="pt-atouts" className="t-h4">
          {t("point.strengths")}
        </h2>
        {point.strengths.length === 0 ? (
          <p className="t-vide-t">{t("point.strength.none")}</p>
        ) : (
          point.strengths.map((line) => (
            <div key={JSON.stringify(line)} className="t-pt t-ok">
              <i aria-hidden>
                <TalentIcon name="valider" size="xs" />
              </i>
              <span>{text(line, "strength")}</span>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="pt-renforcer" className="t-verre t-fb-c">
        <h2 id="pt-renforcer" className="t-h4">
          {t("point.weaknesses")}
        </h2>
        {point.weaknesses.length === 0 ? (
          <p className="t-vide-t">{t("point.weak.none")}</p>
        ) : (
          point.weaknesses.map((line) => (
            <div key={JSON.stringify(line)} className="t-pt t-ko">
              <i aria-hidden>
                <TalentIcon name="plus" size="xs" />
              </i>
              <span>{text(line, "weak")}</span>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="pt-action" className="t-rebond t-point-n">
        <h2 id="pt-action" className="t-h4">
          <b>{t("point.next.title")}</b>
        </h2>
        <span>{nextLine}</span>
        <Link href={nextHref} className="t-bt t-sec t-s t-press">
          {t("point.next.start")}
        </Link>
      </section>

      <div className="t-pqs">
        <SheetButton target="pt-pourquoi" className="t-pq t-press">
          <TalentIcon name="pourquoi" />
          {t("point.why.cta")}
        </SheetButton>
        <Link href="/app/career/diagnostic" className="t-pq t-press">
          <TalentIcon name="progression" />
          {t("point.diagnostic")}
        </Link>
      </div>

      <Sheet id="pt-pourquoi" title={t("point.why.title")} closeLabel={t("point.why.close")}>
        <p className="t-vide-t">{t("point.why.intro")}</p>
        <ul className="t-pq-l">
          <li>
            <TalentIcon name="progression" size="s" />
            <span>
              {point.diagnostic
                ? t("point.why.diagnostic", {
                    date: format.dateTime(point.diagnostic.date, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                    score: point.diagnostic.score,
                  })
                : t("point.why.noDiagnostic")}
            </span>
          </li>
          {point.offers !== null && (
            <li>
              <TalentIcon name="offre" size="s" />
              <span>{t("point.why.offers", { count: point.offers })}</span>
            </li>
          )}
          <li>
            <TalentIcon name="profil" size="s" />
            <span>{t("point.why.profile")}</span>
          </li>
          <li>
            <TalentIcon name="confidentialite" size="s" />
            <span>{t("point.why.never")}</span>
          </li>
        </ul>
      </Sheet>
    </div>
  );
}
