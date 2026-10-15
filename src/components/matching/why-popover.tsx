import Link from "next/link";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { dynamic } from "@/i18n/dynamic";
import type { MatchExplanation } from "@/server/matching/types";
import { criterionText } from "./talent-why";

/** Score on the AI gradient; opens its « Pourquoi ? » panel (a native popover). */
export function ScoreButton({
  id,
  score,
  aria,
  large,
}: {
  id: string;
  score: string;
  aria: string;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      popoverTarget={`why-${id}`}
      aria-label={aria}
      className={
        large
          ? "inline-flex h-8 items-center gap-1 rounded-pill bg-gradient-ai px-3 text-[13px] font-bold text-blanc transition-transform hover:scale-105"
          : "inline-flex h-7 items-center gap-1 rounded-pill bg-gradient-ai px-2.5 text-[11.5px] font-bold text-blanc transition-transform hover:scale-105"
      }
    >
      <Icon name="intelligence" className="size-3.5 text-neon" />
      {score}
    </button>
  );
}

/**
 * The « Pourquoi ? » of a score for the recruiting team, as a native popover (§ 8.6): the main
 * reasons (every criterion at the « explainable » level), the missing skills and the rule that
 * the AI never decides. Opened by a `ScoreButton` with the same id.
 */
export function WhyPopover({
  id,
  name,
  match,
  explainable,
  explainPlan,
  link,
}: {
  id: string;
  name: string;
  match: MatchExplanation;
  explainable: boolean;
  explainPlan: string | null;
  link?: { href: string; label: string };
}) {
  const t = useTranslations();
  const d = dynamic(t);
  const reasons = explainable
    ? match.criteria
    : match.criteria
        .filter((criterion) => criterion.status === "met" || criterion.status === "partial")
        .sort((a, b) => b.weight * b.value - a.weight * a.value)
        .slice(0, 3);
  return (
    <div
      id={`why-${id}`}
      popover="auto"
      className="m-0 max-h-[calc(100dvh-24px)] w-auto overflow-y-auto rounded-[26px] border-0 bg-gradient-ai p-5 text-blanc shadow-float backdrop:bg-sapin/25 max-lg:inset-x-3 max-lg:top-auto max-lg:bottom-3 lg:inset-auto lg:top-24 lg:right-8 lg:w-[340px] lg:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
          <AiOrb size={24} />
          {t("ai.card.why")}
        </p>
        <button
          type="button"
          popoverTarget={`why-${id}`}
          popoverTargetAction="hide"
          aria-label={t("ai.card.whyClose")}
          className="grid size-8 place-items-center rounded-full hover:bg-blanc/10"
        >
          <Icon name="fermer" className="size-4" />
        </button>
      </div>
      <p className="mt-2 text-[18px] leading-6 font-semibold">
        {t("match.why.recruiter.title", { score: match.score, candidateName: name })}
      </p>
      <p className="mt-1.5 text-[12px] leading-[17px] text-blanc/80">
        {t("match.why.recruiter.intro")}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {reasons.map((criterion) => {
          const points = Math.round(criterion.weight * criterion.value);
          return (
            <li key={criterion.key} className="flex flex-col gap-1.5">
              <p className="flex justify-between gap-3 text-[12px] leading-4">
                <span>{d(`match.criterion.${criterionText[criterion.key]}.text`)}</span>
                <span className="shrink-0 font-semibold">
                  {t("match.criterion.points", { points, weight: criterion.weight })}
                </span>
              </p>
              <span aria-hidden className="block h-1.5 overflow-hidden rounded-pill bg-blanc/15">
                <span
                  className="jm-gauge block h-full origin-left rounded-pill bg-lime"
                  style={{
                    transform: `scaleX(${criterion.weight ? points / criterion.weight : 0})`,
                  }}
                />
              </span>
            </li>
          );
        })}
      </ul>
      {explainPlan && (
        <p className="mt-3 text-[12px] text-blanc/80">
          {t("match.why.recruiter.suggestionsOnly", { plan: explainPlan })}
        </p>
      )}
      {explainable && match.missingSkills.length > 0 && (
        <p className="mt-4 rounded-[16px] bg-sapin/55 p-3.5 text-[12px] leading-[17px]">
          <strong>{t("match.why.recruiter.missing.title")}</strong>{" "}
          {match.missingSkills
            .map((missing) =>
              t("match.why.recruiter.missing.item", {
                skill: missing.skill,
                kind: t(`match.why.recruiter.missing.kind.${missing.importance}`),
              }),
            )
            .join(", ")}
        </p>
      )}
      <p className="mt-4 text-[12px] leading-[17px] text-neon">{t("match.why.recruiter.rule")}</p>
      {link && (
        <Link
          href={link.href}
          className="mt-3 inline-flex text-[12px] font-semibold underline underline-offset-4"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
