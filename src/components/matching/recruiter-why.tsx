import { useFormatter, useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import type { MatchExplanation } from "@/server/matching/types";
import { criterionText } from "./talent-why";

/**
 * The score of an application for the recruiting team (§ 8.6, mockup 04-05), on the AI gradient:
 * a ring with the score and its band, then « Pourquoi ? ». By `hire.matching.level`:
 * « suggestions » shows the three main reasons; « explainable » adds every criterion with its
 * weight and points, the criteria met or partly met, the missing skills and the points to verify
 * in interview. Never a decision.
 */
export function RecruiterWhy({
  explanation,
  candidateName,
  matchingLevel,
  explainPlan,
  disputed,
  weightsHref,
}: {
  explanation: MatchExplanation;
  candidateName: string;
  matchingLevel: "suggestions" | "explainable";
  /** Name of the plan that opens the detail, for the « suggestions » level. */
  explainPlan: string | null;
  disputed: boolean;
  /** Where the team changes the weights of the job, when it may. */
  weightsHref?: string;
}) {
  const t = useTranslations();
  const format = useFormatter();
  const d = dynamic(t);
  const name = (key: MatchExplanation["criteria"][number]["key"]) =>
    d(`match.criterion.${criterionText[key]}.text`);
  const counted = explanation.criteria.filter((criterion) => criterion.status !== "not_applicable");
  const shown =
    matchingLevel === "explainable"
      ? counted
      : counted
          .filter((criterion) => criterion.status === "met" || criterion.status === "partial")
          .sort((a, b) => b.weight * b.value - a.weight * a.value)
          .slice(0, 3);
  const met = counted.filter((criterion) => criterion.status === "met");
  const partial = counted.filter((criterion) => criterion.status === "partial");
  const unknown = counted.filter((criterion) => criterion.status === "unknown");
  const toVerify = [
    ...explanation.knockouts.map((knockout) => knockout.label),
    ...unknown.map((criterion) =>
      t("match.why.recruiter.verify.unknown", { criterion: name(criterion.key) }),
    ),
  ];
  const sources = [
    ...new Set(
      counted.flatMap((criterion) => (criterion.evidence ?? []).map((item) => item.verified)),
    ),
  ];
  const ring = 2 * Math.PI * 34;
  const lab = "text-[11px] font-semibold tracking-[0.12em] text-neon uppercase";

  return (
    <section
      id="score"
      aria-labelledby="score-title"
      className="relative flex flex-col gap-4 overflow-hidden rounded-[26px] bg-gradient-ai p-5 text-blanc lg:p-[22px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full ring-1 ring-blanc/15"
      />
      <div className="relative flex items-center gap-4">
        <span className="relative grid size-[84px] shrink-0 place-items-center">
          <svg viewBox="0 0 80 80" aria-hidden className="absolute inset-0 size-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="7"
              className="stroke-blanc/15"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              className="jm-ring stroke-lime"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - explanation.score / 100)}
            />
          </svg>
          <span className="text-[20px] font-semibold">
            {t("ui.percent", { value: explanation.score })}
          </span>
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="score-title" className={lab}>
            {t("hire.application.score.title")}
          </h2>
          <p className="text-[18px] leading-6 font-semibold">
            {t("hire.application.score.value", {
              score: explanation.score,
              band: t(`match.band.${explanation.band}.text`),
            })}
          </p>
          <p className="text-[12px] text-blanc/75">
            {t("hire.application.score.computed", {
              time: format.relativeTime(new Date(explanation.computedAt)),
            })}
          </p>
        </div>
      </div>
      {disputed && (
        <p className="relative rounded-[14px] bg-ambre/25 px-3 py-2 text-[12px]">
          {t("match.why.recruiter.disputed")}
        </p>
      )}
      <details open className="group relative flex flex-col">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[14px] font-semibold text-neon [&::-webkit-details-marker]:hidden">
          <Icon name="eye" className="size-4" />
          {t("hire.application.score.why")}
          <Icon
            name="chev-d"
            className="ml-auto size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[16px] leading-[22px] font-semibold">
              {t("match.why.recruiter.title", { score: explanation.score, candidateName })}
            </p>
            <p className="text-[12px] leading-[17px] text-blanc/80">
              {t("match.why.recruiter.intro")}
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {shown.map((criterion) => {
              const points = Math.round(criterion.weight * criterion.value);
              return (
                <li key={criterion.key} className="flex flex-col gap-1.5">
                  <p className="flex items-baseline justify-between gap-3 text-[12px] leading-4">
                    <span>{name(criterion.key)}</span>
                    <span className="shrink-0">
                      {matchingLevel === "explainable" && (
                        <span className="text-blanc/70">
                          {t("match.criterion.weight", { weight: criterion.weight })}{" "}
                        </span>
                      )}
                      <strong>
                        {t("match.criterion.points", { points, weight: criterion.weight })}
                      </strong>
                    </span>
                  </p>
                  <span
                    aria-hidden
                    className="block h-1.5 overflow-hidden rounded-pill bg-blanc/15"
                  >
                    <span
                      className="jm-gauge block h-full origin-left rounded-pill bg-lime"
                      style={{ transform: `scaleX(${criterion.value})` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
          {matchingLevel === "suggestions" && explainPlan && (
            <p className="text-[12px] text-blanc/80">
              {t("match.why.recruiter.suggestionsOnly", { plan: explainPlan })}
            </p>
          )}
          {matchingLevel === "explainable" && (
            <>
              {met.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className={lab}>{t("match.why.recruiter.met.title")}</h3>
                  <p className="flex gap-2 text-[12px] leading-[17px]">
                    <Icon name="check" className="mt-px size-3.5 shrink-0 text-lime" />
                    {met.map((criterion) => name(criterion.key)).join(" · ")}
                  </p>
                </div>
              )}
              {partial.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className={lab}>{t("match.why.recruiter.partial.title")}</h3>
                  <p className="flex gap-2 text-[12px] leading-[17px]">
                    <Icon name="objectif" className="mt-px size-3.5 shrink-0 text-lime" />
                    {partial.map((criterion) => name(criterion.key)).join(" · ")}
                  </p>
                </div>
              )}
              {explanation.missingSkills.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className={lab}>{t("match.why.recruiter.missing.title")}</h3>
                  <ul className="flex flex-col gap-1 text-[12px] leading-[17px]">
                    {explanation.missingSkills.map((missing) => (
                      <li key={missing.skillId} className="flex gap-2">
                        <Icon name="plus" className="mt-px size-3.5 shrink-0 text-lime" />
                        {t("match.why.recruiter.missing.item", {
                          skill: missing.skill,
                          kind: t(`match.why.recruiter.missing.kind.${missing.importance}`),
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {sources.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className={lab}>{t("match.why.recruiter.evidence.text")}</h3>
                  <p className="flex flex-wrap gap-1.5">
                    {sources.map((verified) => (
                      <span
                        key={String(verified)}
                        className="rounded-pill bg-blanc/12 px-2.5 py-1 text-[11px] font-semibold"
                      >
                        {verified
                          ? t("match.why.recruiter.evidence.verified")
                          : t("match.why.recruiter.evidence.declared")}
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {toVerify.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className={lab}>{t("ai.cvAnalysis.questions.text")}</h3>
                  <ul className="flex flex-col gap-1 text-[12px] leading-[17px]">
                    {toVerify.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Icon name="message" className="mt-px size-3.5 shrink-0 text-lime" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-1.5 rounded-[16px] bg-sapin/55 p-3.5 text-[12px] leading-[17px]">
            <p>{t("match.why.recruiter.neverUsed")}</p>
            <p className="font-semibold text-neon">{t("match.why.recruiter.rule")}</p>
          </div>
          {weightsHref && (
            <a
              href={weightsHref}
              className="self-start rounded-pill bg-blanc/12 px-3.5 py-2 text-[12px] font-semibold ring-1 ring-blanc/30 hover:bg-blanc/20"
            >
              {t("match.why.recruiter.weights.edit")}
            </a>
          )}
        </div>
      </details>
      <p className="relative flex items-center gap-2 text-[11px] text-blanc/70">
        <AiOrb size={18} />
        {t("ai.brand")}
      </p>
    </section>
  );
}
