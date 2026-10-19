import { useTranslations } from "next-intl";
import { criterionText, statusText, useCriterionDetail } from "@/components/matching/talent-why";
import { dynamic } from "@/i18n/dynamic";
import type { MatchExplanation } from "@/server/matching/types";

/**
 * The criteria of « Pourquoi 86 % ? » (planche talent-1 § 4): each one with what was found, its
 * bar and one sentence built from the facts of the calculation, never invented.
 */
export function WhyCriteria({ explanation }: { explanation: MatchExplanation }) {
  const t = useTranslations();
  const d = dynamic(t);
  const detail = useCriterionDetail();
  return (
    <ul className="t-crit">
      {explanation.criteria
        .filter((criterion) => criterion.status !== "not_applicable")
        .map((criterion) => {
          const value = Math.round(criterion.value * 100);
          const sentence = detail(criterion);
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
