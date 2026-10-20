import { useTranslations } from "next-intl";
import { criterionText, statusText, useCriterionDetail } from "@/components/matching/talent-why";
import { dynamic } from "@/i18n/dynamic";
import type { MatchExplanation } from "@/server/matching/types";

const recruiterSentences = new Set(["skills_required", "skills_preferred", "experience"]);

/**
 * The criteria of « Pourquoi 86 % ? » (planche talent-1 § 4): each one with what was found, its
 * bar and one sentence built from the facts of the calculation, never invented.
 */
export function WhyCriteria({
  explanation,
  recruiter = false,
}: {
  explanation: MatchExplanation;
  /** For the recruiting team: only the sentences that do not speak to the talent (« votre profil »). */
  recruiter?: boolean;
}) {
  const t = useTranslations();
  const d = dynamic(t);
  const detail = useCriterionDetail();
  return (
    <ul className="t-crit">
      {explanation.criteria
        .filter((criterion) => criterion.status !== "not_applicable")
        .map((criterion) => {
          const value = Math.round(criterion.value * 100);
          const sentence =
            recruiter &&
            (criterion.status === "unknown" ||
              !(
                recruiterSentences.has(criterion.key) ||
                (criterion.key === "location" && criterion.status === "met")
              ))
              ? null
              : detail(criterion);
          return (
            <li key={criterion.key} className="t-c">
              <div className="t-h">
                <b>{d(`match.criterion.${criterionText[criterion.key]}.text`)}</b>
                <span>{d(`match.criterion.status.${statusText[criterion.status]}`)}</span>
              </div>
              <span
                className="t-j"
                role="img"
                aria-label={t("offer.why.value", { percent: value })}
              >
                <i style={{ width: `${value}%` }} />
              </span>
              {sentence && <p>{sentence}</p>}
            </li>
          );
        })}
    </ul>
  );
}
