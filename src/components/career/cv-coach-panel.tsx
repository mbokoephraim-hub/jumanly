import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Orbi } from "@/components/brand/character";
import { Icon } from "@/components/brand/icon";
import { pillClass, ScoreRing } from "@/components/career/kit";
import { Alert } from "@/components/ui";
import { cx } from "@/lib/cx";
import { decideSuggestionAction, runCoachAction } from "@/server/actions/cv";
import type { CoachSuggestion, CvScore } from "@/server/services/cv-coach";

export type CoachState =
  | { state: "ready" }
  | { state: "consent" }
  | { state: "entitlement" | "quota"; plan: string | null; resetsAt: Date | null };

/**
 * « Coach IA » next to the CV editor: the CV score by rules (free), then the AI suggestions with
 * « Appliquer » / « Ignorer », each with its « Pourquoi ? ». Nothing changes without a click.
 */
export function CvCoachPanel({
  documentId,
  score,
  coach,
  credits,
  suggestions,
  missingKeywords,
  percents,
  targetTitle,
  outcome,
  criteria,
}: {
  documentId: string;
  score: CvScore;
  coach: CoachState;
  credits: { used: number; limit: number } | null;
  suggestions: { id: string; payload: CoachSuggestion }[];
  missingKeywords: string[];
  percents: Record<string, number>;
  targetTitle: string | null;
  outcome: { coach?: string; suggestion?: string };
  /** The three criteria of the score, as bars (`CriteriaBars`). */
  criteria: ReactNode;
}) {
  const t = useTranslations();
  const box = "rounded-[20px] bg-sapin/35 p-4 ring-1 ring-blanc/10";
  return (
    <section
      id="coach"
      aria-labelledby="coach-title"
      className="relative flex scroll-mt-28 flex-col gap-4 overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#2FD3A6_0%,#14745F_35%,#0F3F37_100%)] p-5 text-blanc"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full ring-1 ring-blanc/20"
      />
      <div className="relative flex items-center gap-3">
        <span className="jm-float block">
          <Orbi size={40} />
        </span>
        <div className="flex flex-col">
          <h2 id="coach-title" className="text-[17px] font-semibold">
            {t("ai.cvCoach.title")}
          </h2>
          <p className="text-xs text-blanc/75">{t("ai.cvCoach.analysis")}</p>
        </div>
      </div>

      <div className="relative flex flex-col gap-3.5 rounded-[20px] bg-blanc/10 p-4 ring-1 ring-blanc/15 backdrop-blur-sm">
        <div className="flex items-center gap-3.5">
          <ScoreRing
            value={score.total}
            label={t("ai.cvCoach.score.text", { score: score.total })}
            size={76}
            dark
          />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[15px] leading-tight font-semibold">
              {t("ai.cvCoach.score.label", { level: t(`ai.cvCoach.score.level.${score.level}`) })}
            </p>
            <p className="text-xs leading-[17px] text-blanc/75">{t("career.cv.score.noAi")}</p>
          </div>
        </div>
        {criteria}
        <details className="text-xs">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold text-neon lg:min-h-0">
            <Icon name="eye" className="size-3.5" />
            {t("ai.card.why")}
          </summary>
          <p className="mt-2 leading-[17px] text-blanc/85">{t("ai.cvCoach.score.explain")}</p>
          <ul className="mt-2 flex flex-col gap-1 text-blanc/85">
            {(["ats", "impact", "keywords"] as const).map((key) => (
              <li key={key}>
                {[t(`ai.cvCoach.score.${key}.text`), t(`ai.cvCoach.score.${key}.desc`)].join(" : ")}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {outcome.coach === "unavailable" && <Alert tone="error" title={t("ai.card.error")} />}
      {outcome.coach === "empty" && <Alert title={t("ai.cvCoach.empty")} />}
      {outcome.suggestion === "applied" && (
        <Alert tone="success" title={t("ai.card.applied.text")} />
      )}
      {outcome.suggestion === "ignored" && <Alert title={t("ai.card.ignored")} />}
      {outcome.suggestion === "obsolete" && <Alert title={t("ai.cvCoach.obsolete")} />}

      {suggestions.length > 0 && (
        <div className="relative flex flex-col gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
            {t("ai.cvCoach.priority", { count: suggestions.length })}
          </p>
          <ul className="flex flex-col gap-3">
            {suggestions.map(({ id, payload }) => (
              <li key={id} className={cx(box, "flex flex-col gap-2.5")}>
                <p className="flex items-start gap-2 text-[15px] leading-5 font-semibold">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-lime" />
                  {payload.kind === "headlineSkill"
                    ? t("ai.cvCoach.suggestion.headlineSkill.title", { skill: payload.skill ?? "" })
                    : t(`ai.cvCoach.suggestion.${payload.kind}.title`)}
                </p>
                {payload.after !== null ? (
                  <p className="text-sm leading-5 text-blanc/90">
                    {t("ai.cvCoach.suggestion.quantify.body", {
                      before: payload.before,
                      after: payload.after,
                    })}
                  </p>
                ) : (
                  <>
                    {payload.before && <p className="text-sm italic">{payload.before}</p>}
                    <p className="text-xs text-blanc/75">{t("ai.cvCoach.adviceOnly")}</p>
                  </>
                )}
                <p className="flex gap-2 text-xs leading-[17px] text-blanc/85">
                  <Icon name="eye" className="mt-px size-4 shrink-0 text-neon" />
                  <span>
                    <strong className="text-blanc">{t("ai.card.why")}</strong>{" "}
                    {payload.kind === "headlineSkill"
                      ? percents[payload.skill ?? ""] && targetTitle
                        ? t("ai.cvCoach.suggestion.headlineSkill.why", {
                            percent: percents[payload.skill ?? ""] ?? 0,
                            jobTitle: targetTitle,
                          })
                        : t("ai.disclaimer.noInvention")
                      : t(`ai.cvCoach.suggestion.${payload.kind}.why`)}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {payload.after !== null && (
                    <form action={decideSuggestionAction}>
                      <input type="hidden" name="id" value={documentId} />
                      <input type="hidden" name="suggestion" value={id} />
                      <input type="hidden" name="decision" value="applied" />
                      <button type="submit" className={pillClass("lime", "sm")}>
                        {t("ai.card.apply")}
                      </button>
                    </form>
                  )}
                  <form action={decideSuggestionAction}>
                    <input type="hidden" name="id" value={documentId} />
                    <input type="hidden" name="suggestion" value={id} />
                    <input type="hidden" name="decision" value="ignored" />
                    <button type="submit" className={pillClass("ghost", "sm")}>
                      {t("ai.card.ignore")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {outcome.coach === "done" && suggestions.length === 0 && (
        <p className="text-sm">{t("ai.cvCoach.allDone")}</p>
      )}

      {missingKeywords.length > 0 && (
        <div className="relative flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
            {t("ai.cvCoach.keywords.title")}
          </h3>
          <p className="text-xs leading-[17px] text-blanc/80">{t("ai.cvCoach.keywords.hint")}</p>
          <ul className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword) => (
              <li
                key={keyword}
                className="flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold ring-1 ring-blanc/40 ring-inset"
              >
                <Icon name="plus" className="size-3 text-neon" />
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      )}

      {coach.state === "consent" ? (
        <Alert title={t("ai.consent.declined.state")}>
          <Link href="/app/parametres?onglet=confidentialite" className="font-medium underline">
            {t("ai.consent.declined.cta")}
          </Link>
        </Alert>
      ) : coach.state === "entitlement" || (coach.state === "quota" && !credits?.limit) ? (
        <div className="relative flex flex-col gap-3">
          {coach.plan && (
            <p className="flex items-start gap-2.5 text-[13px] leading-[18px]">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-lime px-2.5 py-1 text-[11px] font-semibold text-sapin">
                <Icon name="lock" className="size-3" />
                {coach.plan}
              </span>
              <span>{t("ai.cvCoach.locked.free", { plan: coach.plan })}</span>
            </p>
          )}
          <div className={cx(box, "flex flex-col gap-1.5")}>
            <h3 className="text-sm font-semibold">{t("ai.cvCoach.tips.free.title")}</h3>
            <p className="flex gap-2 text-[13px] leading-[18px] text-blanc/85">
              <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime" />
              {t("ai.cvCoach.tips.free.body")}
            </p>
          </div>
        </div>
      ) : coach.state === "quota" ? (
        <Alert tone="warning" title={t("ai.credits.reached.title")}>
          {coach.resetsAt ? t("ai.credits.reached.body", { date: coach.resetsAt }) : null}
        </Alert>
      ) : (
        <form
          action={runCoachAction}
          className="relative flex flex-wrap items-center justify-between gap-2"
        >
          <input type="hidden" name="id" value={documentId} />
          <button
            type="submit"
            className="flex items-center gap-1.5 text-[13px] font-semibold text-neon hover:underline"
          >
            <Icon name="intelligence" className="size-4" />
            {suggestions.length > 0 ? t("ai.cvCoach.reanalyze") : t("ai.cvCoach.analyze")}
          </button>
          <p className="text-xs text-blanc/75">
            {[
              t("ai.cvCoach.cost", { count: 2 }),
              credits && credits.limit >= 0
                ? t("ai.credits.usage", { used: credits.used, quota: credits.limit })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </form>
      )}

      <Link
        href="/app/career/entretiens"
        className="relative flex h-11 items-center justify-center gap-2 rounded-pill bg-blanc text-[15px] font-semibold text-sapin hover:bg-creme"
      >
        <Icon name="mic" className="size-4" />
        {t("career.cv.simulateInterview")}
      </Link>
      <p className="relative text-center text-xs leading-[17px] text-blanc/75">
        {[t("ai.cvCoach.footer"), t("ai.disclaimer.noInvention")].join(" ")}
      </p>
    </section>
  );
}
