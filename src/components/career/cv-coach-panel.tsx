import Link from "next/link";
import { useTranslations } from "next-intl";
import { AiOrb } from "@/components/brand/ai-orb";
import { Icon } from "@/components/brand/icon";
import { Alert, Badge, Button } from "@/components/ui";
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
}) {
  const t = useTranslations();
  return (
    <section
      id="coach"
      aria-labelledby="coach-title"
      className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
    >
      <div className="flex items-center gap-2">
        <AiOrb />
        <h2 id="coach-title" className="text-h2">
          {t("ai.cvCoach.title")}
        </h2>
      </div>

      <div className="flex flex-col gap-1 rounded-card bg-creme p-4">
        <p className="text-label">{t("ai.cvCoach.analysis")}</p>
        <p className="text-h1">{t("ai.cvCoach.score.text", { score: score.total })}</p>
        <p className="font-medium">
          {t("ai.cvCoach.score.label", { level: t(`ai.cvCoach.score.level.${score.level}`) })}
        </p>
        <p className="text-sm text-ardoise">
          {t("ai.cvCoach.score.detail.text", {
            ats: score.ats,
            impact: score.impact,
            keywords: score.keywords,
          })}
        </p>
        <details>
          <summary className="cursor-pointer text-sm font-medium underline">
            {t("ai.card.why")}
          </summary>
          <p className="mt-2 text-sm">{t("ai.cvCoach.score.explain")}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {(["ats", "impact", "keywords"] as const).map((key) => (
              <li key={key}>
                {[t(`ai.cvCoach.score.${key}.text`), t(`ai.cvCoach.score.${key}.desc`)].join(" : ")}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {missingKeywords.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-h3 font-semibold">{t("ai.cvCoach.keywords.title")}</h3>
          <ul className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword) => (
              <li key={keyword}>
                <Badge tone="ai">{keyword}</Badge>
              </li>
            ))}
          </ul>
          <p className="text-sm text-ardoise">{t("ai.cvCoach.keywords.hint")}</p>
        </div>
      )}

      {outcome.coach === "unavailable" && <Alert tone="error" title={t("ai.card.error")} />}
      {outcome.coach === "empty" && <Alert title={t("ai.cvCoach.empty")} />}
      {outcome.suggestion === "applied" && (
        <Alert tone="success" title={t("ai.card.applied.text")} />
      )}
      {outcome.suggestion === "ignored" && <Alert title={t("ai.card.ignored")} />}
      {outcome.suggestion === "obsolete" && <Alert title={t("ai.cvCoach.obsolete")} />}

      {coach.state === "consent" ? (
        <Alert title={t("ai.consent.declined.state")}>
          <Link href="/app/parametres?onglet=confidentialite" className="font-medium underline">
            {t("ai.consent.declined.cta")}
          </Link>
        </Alert>
      ) : coach.state === "entitlement" || (coach.state === "quota" && !credits?.limit) ? (
        <div className="flex flex-col gap-2">
          {coach.plan && <p>{t("ai.cvCoach.locked.free", { plan: coach.plan })}</p>}
          <h3 className="text-h3 font-semibold">{t("ai.cvCoach.tips.free.title")}</h3>
          <p className="text-sm">{t("ai.cvCoach.tips.free.body")}</p>
        </div>
      ) : coach.state === "quota" ? (
        <Alert tone="warning" title={t("ai.credits.reached.title")}>
          {coach.resetsAt ? t("ai.credits.reached.body", { date: coach.resetsAt }) : null}
        </Alert>
      ) : (
        <form action={runCoachAction} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={documentId} />
          <Button type="submit" variant="secondary" className="self-start">
            {suggestions.length > 0 ? t("ai.cvCoach.reanalyze") : t("ai.cvCoach.analyze")}
          </Button>
          <p className="text-sm text-ardoise">
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

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-semibold">{t("ai.cvCoach.priority", { count: suggestions.length })}</p>
          <ul className="flex flex-col gap-3">
            {suggestions.map(({ id, payload }) => (
              <li key={id} className="flex flex-col gap-2 rounded-card border border-brume p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <AiOrb />
                  {payload.kind === "headlineSkill"
                    ? t("ai.cvCoach.suggestion.headlineSkill.title", { skill: payload.skill ?? "" })
                    : t(`ai.cvCoach.suggestion.${payload.kind}.title`)}
                </p>
                {payload.after !== null ? (
                  <p className="text-sm">
                    {t("ai.cvCoach.suggestion.quantify.body", {
                      before: payload.before,
                      after: payload.after,
                    })}
                  </p>
                ) : (
                  <>
                    {payload.before && <p className="text-sm italic">{payload.before}</p>}
                    <p className="text-sm text-ardoise">{t("ai.cvCoach.adviceOnly")}</p>
                  </>
                )}
                <details>
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium underline">
                    <Icon name="transparence" className="size-4" />
                    {t("ai.card.why")}
                  </summary>
                  <p className="mt-1 text-sm">
                    {payload.kind === "headlineSkill"
                      ? percents[payload.skill ?? ""] && targetTitle
                        ? t("ai.cvCoach.suggestion.headlineSkill.why", {
                            percent: percents[payload.skill ?? ""] ?? 0,
                            jobTitle: targetTitle,
                          })
                        : t("ai.disclaimer.noInvention")
                      : t(`ai.cvCoach.suggestion.${payload.kind}.why`)}
                  </p>
                </details>
                <div className="flex flex-wrap gap-2">
                  {payload.after !== null && (
                    <form action={decideSuggestionAction}>
                      <input type="hidden" name="id" value={documentId} />
                      <input type="hidden" name="suggestion" value={id} />
                      <input type="hidden" name="decision" value="applied" />
                      <Button type="submit" size="sm">
                        {t("ai.card.apply")}
                      </Button>
                    </form>
                  )}
                  <form action={decideSuggestionAction}>
                    <input type="hidden" name="id" value={documentId} />
                    <input type="hidden" name="suggestion" value={id} />
                    <input type="hidden" name="decision" value="ignored" />
                    <Button type="submit" size="sm" variant="tertiary">
                      {t("ai.card.ignore")}
                    </Button>
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
      <p className="text-sm text-ardoise">
        {[t("ai.cvCoach.footer"), t("ai.disclaimer.noInvention")].join(" ")}
      </p>
    </section>
  );
}
