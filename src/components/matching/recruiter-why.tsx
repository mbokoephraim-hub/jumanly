import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { ScoreBadge } from "@/components/ui";
import { dynamic } from "@/i18n/dynamic";
import type { MatchExplanation } from "@/server/matching/types";
import { CriterionList, criterionText } from "./talent-why";

/**
 * The score of an application for the recruiting team (§ 8.6), by `hire.matching.level`:
 * « suggestions » shows the score and the three main reasons; « explainable » adds the detail by
 * criterion with its evidence and the points to verify in interview. Never a decision.
 */
export function RecruiterWhy({
  explanation,
  candidateName,
  matchingLevel,
  explainPlan,
  disputed,
}: {
  explanation: MatchExplanation;
  candidateName: string;
  matchingLevel: "suggestions" | "explainable";
  /** Name of the plan that opens the detail, for the « suggestions » level. */
  explainPlan: string | null;
  disputed: boolean;
}) {
  const t = useTranslations();
  const d = dynamic(t);
  const reasons = explanation.criteria
    .filter((criterion) => criterion.status === "met" || criterion.status === "partial")
    .sort((a, b) => b.weight * b.value - a.weight * a.value)
    .slice(0, 3);
  const unknown = explanation.criteria.filter((criterion) => criterion.status === "unknown");
  const toVerify = [
    ...explanation.knockouts.map((knockout) => knockout.label),
    ...unknown.map((criterion) =>
      t("match.why.recruiter.verify.unknown", {
        criterion: d(`match.criterion.${criterionText[criterion.key]}.text`),
      }),
    ),
  ];
  return (
    <section
      aria-labelledby="score-title"
      className="flex flex-col gap-3 rounded-card bg-blanc p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="score-title" className="text-h2">
          {t("hire.application.score.title")}
        </h2>
        <ScoreBadge score={explanation.score} band={explanation.band} />
      </div>
      {disputed && <p className="text-sm text-ambre-fonce">{t("match.why.recruiter.disputed")}</p>}
      <details className="group">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium underline">
          <Icon name="transparence" className="size-4" />
          {t("hire.application.score.why")}
        </summary>
        <div className="mt-3 flex flex-col gap-4 text-[15px]">
          <p className="font-semibold">
            {t("match.why.recruiter.title", { score: explanation.score, candidateName })}
          </p>
          {matchingLevel === "suggestions" ? (
            <>
              <ul className="flex flex-col gap-1">
                {reasons.map((criterion) => (
                  <li key={criterion.key} className="flex gap-2">
                    <Icon name="valider" className="mt-1 size-4 shrink-0" />
                    {[
                      d(`match.criterion.${criterionText[criterion.key]}.text`),
                      t("match.criterion.percent", { percent: Math.round(criterion.value * 100) }),
                    ].join(" · ")}
                  </li>
                ))}
              </ul>
              {explainPlan && (
                <p className="text-sm text-ardoise">
                  {t("match.why.recruiter.suggestionsOnly", { plan: explainPlan })}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm">{t("match.why.recruiter.intro")}</p>
              <CriterionList explanation={explanation} audience="recruiter" />
              {explanation.missingSkills.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{t("match.why.recruiter.missing.title")}</h3>
                  <ul className="flex flex-col gap-0.5 text-sm">
                    {explanation.missingSkills.map((missing) => (
                      <li key={missing.skillId}>
                        {t("match.why.recruiter.missing.item", {
                          skill: missing.skill,
                          kind: t(`match.why.recruiter.missing.kind.${missing.importance}`),
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {toVerify.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{t("ai.cvAnalysis.questions.text")}</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {toVerify.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <p className="text-sm text-ardoise">{t("match.why.recruiter.neverUsed")}</p>
        </div>
      </details>
      <p className="text-sm">{t("match.why.recruiter.rule")}</p>
    </section>
  );
}
