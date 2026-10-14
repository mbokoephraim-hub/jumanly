import { getTranslations } from "next-intl/server";
import { Alert, Button, PlanLock, RadioGroup, Select, TextArea } from "@/components/ui";
import { submitScorecardAction } from "@/server/actions/hire-advanced";
import type { ScorecardCriterion, ScorecardView } from "@/server/services/evaluation";
import { recommendations } from "@/server/services/evaluation";

const recommendationKey = {
  strong_yes: "strongYes",
  yes: "yes",
  no: "no",
  strong_no: "strongNo",
} as const;
type Recommendation = keyof typeof recommendationKey;

/**
 * « Grille d'évaluation » on the candidate page (`hire.scorecards`). The others' opinions stay
 * hidden until the member has sent their own, so as not to influence them.
 */
export async function ScorecardPanel({
  applicationId,
  criteria,
  view,
  canEvaluate,
  lockedPlan,
  ok,
  error,
}: {
  applicationId: string;
  criteria: ScorecardCriterion[];
  view: ScorecardView | null;
  canEvaluate: boolean;
  lockedPlan: string | null;
  ok: boolean;
  error: boolean;
}) {
  const t = await getTranslations("hire.scorecard");
  const label = (value: string) =>
    t(
      `recommendation.${recommendationKey[(value in recommendationKey ? value : "no") as Recommendation]}`,
    );

  return (
    <section
      id="evaluation"
      aria-labelledby="evaluation-title"
      className="flex flex-col gap-4 rounded-card bg-blanc p-6"
    >
      <h2 id="evaluation-title" className="text-h2">
        {t("title")}
      </h2>
      {!view ? (
        <PlanLock plan={lockedPlan ?? ""} description={t("locked", { plan: lockedPlan ?? "" })} />
      ) : (
        <>
          {ok && <Alert tone="success" title={t("submitted")} />}
          {error && <Alert tone="error" title={t("invalid")} />}
          {canEvaluate && criteria.length > 0 && (
            <details open={!view.mine || error} className="rounded-md bg-creme p-4">
              <summary className="cursor-pointer font-medium">
                {view.mine ? t("update") : t("mine")}
              </summary>
              <form action={submitScorecardAction} className="mt-4 flex flex-col gap-5">
                <input type="hidden" name="application" value={applicationId} />
                {criteria.map((criterion, index) => {
                  const previous = view.mine?.ratings.find((item) => item.name === criterion.name);
                  return (
                    <div key={criterion.name} className="flex flex-col gap-2">
                      <input type="hidden" name="criterion" value={criterion.name} />
                      <RadioGroup
                        legend={
                          criterion.description
                            ? `${criterion.name} · ${criterion.description}`
                            : criterion.name
                        }
                        name={`rating-${index}`}
                        required
                        defaultValue={previous ? String(previous.rating) : undefined}
                        options={([1, 2, 3, 4, 5] as const).map((value) => ({
                          value: String(value),
                          label: `${value} · ${t(`rating.${value}`)}`,
                        }))}
                      />
                      <TextArea
                        id={`scorecard-comment-${index}`}
                        name={`comment-${index}`}
                        rows={2}
                        maxLength={500}
                        label={t("comment")}
                        defaultValue={previous?.comment ?? ""}
                      />
                    </div>
                  );
                })}
                <Select
                  id="scorecard-recommendation"
                  name="recommendation"
                  required
                  label={t("recommendation.text")}
                  placeholder={t("recommendation.text")}
                  defaultValue={view.mine?.recommendation ?? ""}
                  options={recommendations.map((value) => ({ value, label: label(value) }))}
                />
                <TextArea
                  id="scorecard-comment"
                  name="comment"
                  rows={3}
                  maxLength={2000}
                  label={t("comment")}
                  defaultValue={view.mine?.comment ?? ""}
                />
                <Button type="submit" variant="secondary" className="self-start">
                  {view.mine ? t("update") : t("submit")}
                </Button>
              </form>
            </details>
          )}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">{t("others.text")}</h3>
            {view.hidden ? (
              <p className="text-sm text-ardoise">{t("others.hidden")}</p>
            ) : view.count === 0 ? (
              <p className="text-sm text-ardoise">{t("empty")}</p>
            ) : (
              <>
                {view.average !== null && (
                  <p className="font-medium">
                    {t("average", { average: view.average, count: view.count })}
                  </p>
                )}
                <ul className="flex flex-col gap-2 text-sm">
                  {view.others.map((card, index) => (
                    <li key={index} className="flex flex-col gap-1 rounded-md bg-creme p-3">
                      <span>
                        {t("reviewer", {
                          memberName: card.reviewerName,
                          average: card.average,
                          recommendation: label(card.recommendation),
                        })}
                      </span>
                      {card.comment && <span className="whitespace-pre-line">{card.comment}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {view.pending.length > 0 && (
              <p className="text-sm text-ardoise">
                {t("pending", { names: view.pending.join(", ") })}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
