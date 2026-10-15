import Link from "next/link";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  AiBrand,
  AiPanel,
  card,
  cardTitle,
  IconTile,
  pillClass,
  Why,
} from "@/components/career/kit";
import { CountUp } from "@/components/motion/count-up";
import { Gauge } from "@/components/motion/gauge";
import { Radar } from "@/components/motion/radar";
import { StageTrack } from "@/components/motion/stage-track";
import { Alert } from "@/components/ui";
import { PlanLock } from "@/components/ui/plan-lock";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { remindDiagnosticAction } from "@/server/actions/diagnostic";
import {
  miniPlanLinks,
  type DiagnosticV2,
  type PersonalizedResult,
} from "@/server/services/diagnostic";
import {
  bandFor,
  dimensionLinks,
  evolution,
  stageFloors,
  stages,
  type Dimension,
} from "@/server/services/diagnostic-scoring";

const dimensionIcons: Record<Dimension, IconName> = {
  clarity: "objectif",
  skills: "competence",
  experience: "portefeuille",
  tools: "doc",
  interviews: "message",
  search: "recherche",
};

/**
 * Result of the diagnostic v2 (docs/experience-animee § 5.5): global level on the four-stage
 * trajectory, radar of the six dimensions (with the previous one dashed, and a table), each
 * dimension with its finding, its « Pourquoi ? » and its most useful action, three priorities,
 * evolution, PDF and « Refaire dans 30 jours ».
 */
export async function DiagnosticResultV2({
  id,
  result,
  personal,
  previous,
  reminder,
  reminded,
  upgrades,
  aside,
}: {
  id: string;
  result: DiagnosticV2;
  personal: PersonalizedResult | null;
  previous: { date: Date; result: DiagnosticV2 | null } | null;
  reminder: Date | null;
  reminded: Date | null;
  /** What the talent could add with a paid plan, with the cheapest plan that opens it. */
  upgrades: { code: string; icon: IconName; plan: string }[];
  /** History and privacy note, at the end of the side column. */
  aside?: ReactNode;
}) {
  const t = await getTranslations("career.diagnostic");
  const tCommon = await getTranslations("common");
  const d = dynamic(t);
  const name = (key: Dimension) => d(`dimension.${key}.name`);
  const short = (key: Dimension) => d(`dimension.${key}.short`);
  const before = previous?.result ?? null;
  const deltas = before ? evolution(result.dimensions, before.dimensions) : null;
  const deltaOf = (key: Dimension) => deltas?.find((item) => item.key === key)?.delta ?? null;
  const globalDelta = before ? result.score - before.score : null;
  const axes = result.dimensions.map((item) => ({
    key: item.key,
    label: short(item.key),
    value: item.score,
  }));
  const radarText = result.dimensions.map((item) => `${name(item.key)} ${item.score}`).join(", ");
  const trackStages = stages.map((key, index) => {
    const from = stageFloors[key];
    const to = index === stages.length - 1 ? 100 : stageFloors[stages[index + 1]!] - 1;
    return { key, label: d(`stage.${key}`), range: t("stage.range", { from, to }), from, to };
  });
  const strengths =
    personal && personal.strengthTexts.length > 0
      ? personal.strengthTexts
      : result.strengths.length === 0
        ? [t("rule.strength.none")]
        : result.strengths.map((key) => d(`rule.strength.${key}`));

  const deltaBadge = (delta: number | null) => {
    if (delta === null) return null;
    const text =
      delta > 0
        ? t("result.evolution.up", { value: delta })
        : delta < 0
          ? t("result.evolution.down", { value: -delta })
          : t("result.evolution.same");
    return (
      <span
        className={cx(
          "inline-flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-xs font-semibold",
          delta > 0
            ? "bg-lime-clair text-feuille-fonce"
            : delta < 0
              ? "bg-creme text-corail-fonce"
              : "bg-gris-clair text-ardoise",
        )}
      >
        <span aria-hidden>{delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : "="}</span>
        <span className="sr-only">{text}</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-5">
        <section aria-labelledby="global-level" className={cx(card, "flex flex-col gap-5")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="global-level" className={cardTitle}>
                {t("result.global")}
              </h2>
              <p className="text-sm text-ardoise">{d(`stage.${result.stage}Text`)}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="flex items-baseline gap-1.5">
                <span className="text-[44px] leading-none font-semibold tracking-tight">
                  <CountUp value={result.score} />
                </span>
                <span className="text-sm text-ardoise">{t("result.outOf")}</span>
              </p>
              <span className="rounded-pill bg-lime px-3 py-1 text-sm font-semibold text-sapin">
                {d(`stage.${result.stage}`)}
              </span>
              {deltaBadge(globalDelta)}
            </div>
          </div>
          <StageTrack
            stages={trackStages}
            score={result.score}
            current={result.stage}
            label={t("result.track")}
            hereLabel={t("result.youAreHere")}
          />
          <p className="text-xs text-ardoise">
            {[
              t("result.offers", { count: result.offers }),
              t("result.questions", { count: result.questions }),
            ].join(" · ")}
          </p>
        </section>

        <AiPanel labelledBy="mini-plan">
          <AiBrand />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="mini-plan" className="text-[20px] leading-tight font-semibold">
              {t("miniPlan.title")}
            </h2>
            <span className="rounded-pill bg-lime px-3 py-1 text-xs font-semibold text-sapin">
              {t("miniPlan.free")}
            </span>
          </div>
          <p className="text-sm leading-6 text-blanc/90">{t("miniPlan.intro")}</p>
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {result.priorities.map((key, index) => {
              const href = miniPlanLinks[key];
              const written = personal?.miniPlan?.find((item) => item.priority === key)?.text;
              return (
                <li
                  key={key}
                  data-reveal
                  className="flex flex-col gap-2 rounded-[18px] bg-sapin/60 p-4 ring-1 ring-blanc/10"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-lime text-sm font-semibold text-sapin">
                    {index + 1}
                  </span>
                  <p className="text-[15px] leading-5 font-semibold">
                    {d(`miniPlan.step.${key}.title`)}
                  </p>
                  <p className="text-[13px] leading-5 text-blanc/90">
                    {written ?? d(`miniPlan.step.${key}.text`)}
                  </p>
                  {href && (
                    <Link
                      href={href}
                      className="mt-auto flex items-center gap-1 pt-1 text-[13px] font-semibold text-neon hover:underline"
                    >
                      {t("rule.step.cta")}
                      <Icon name="chev-r" className="size-3.5" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          <Why dark>{t("miniPlan.why")}</Why>
        </AiPanel>

        {upgrades.length > 0 && (
          <section aria-labelledby="upgrades" className={cx(card, "flex flex-col gap-4")}>
            <div className="flex flex-col gap-1">
              <h2 id="upgrades" className={cardTitle}>
                {t("upgrade.title")}
              </h2>
              <p className="text-sm text-ardoise">{t("upgrade.intro")}</p>
            </div>
            <ul className="flex flex-col divide-y divide-brume">
              {upgrades.map((item) => (
                <li key={item.code} className="flex flex-wrap items-center gap-3 py-3">
                  <IconTile icon={item.icon} tone="bg-gris-clair" size="sm" />
                  <span className="min-w-0 flex-1 basis-48 text-[14px] leading-5 font-medium">
                    {d(`upgrade.item.${item.code}`)}
                  </span>
                  <PlanLock plan={item.plan} compact />
                </li>
              ))}
            </ul>
            <Link href="/tarifs" className={pillClass("dark", "md", "self-start")}>
              {tCommon("seePlans")}
              <Icon name="chev-r" className="size-4" />
            </Link>
          </section>
        )}

        <section aria-labelledby="radar-title" className={cx(card, "flex flex-col gap-4")}>
          <h2 id="radar-title" className={cardTitle}>
            {t("result.radar")}
          </h2>
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[380px]">
              <Radar
                id="result"
                axes={axes}
                previous={before ? before.dimensions.map((item) => item.score) : null}
                title={t("result.radar")}
                description={radarText}
                size={240}
                animate
              />
              {before && (
                <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ardoise">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2.5 w-5 rounded-sm border-2 border-sapin bg-lime/45"
                    />
                    {t("radar.current")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden className="w-5 border-t-2 border-dashed border-ardoise" />
                    {t("radar.previous")}
                  </span>
                </p>
              )}
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">{t("radar.caption")}</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">{t("radar.dimension")}</th>
                  <th scope="col">{t("radar.score")}</th>
                  {deltas && <th scope="col">{t("radar.delta")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brume">
                {result.dimensions.map((item) => (
                  <tr key={item.key}>
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                      {name(item.key)}
                    </th>
                    <td className="py-2.5 text-right font-semibold whitespace-nowrap">
                      {item.score}
                      <span className="font-normal text-ardoise"> {t("result.outOf")}</span>
                    </td>
                    {deltas && (
                      <td className="py-2.5 pl-3 text-right">{deltaBadge(deltaOf(item.key))}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="detail-title" className="flex flex-col gap-3">
          <h2 id="detail-title" className={cx(cardTitle, "px-1")}>
            {t("result.detail")}
          </h2>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.dimensions.map((item) => (
              <li key={item.key} className={cx(card, "flex flex-col gap-3")}>
                <div className="flex items-center gap-3">
                  <IconTile icon={dimensionIcons[item.key]} tone="bg-lime-clair" size="sm" />
                  <h3 className="min-w-0 flex-1 text-[15px] font-semibold">{name(item.key)}</h3>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {t("dimension.score", { score: item.score })}
                  </span>
                </div>
                <Gauge value={item.score} />
                <p className="text-sm leading-6">
                  {d(`dimension.${item.key}.finding.${bandFor(item.score)}`)}
                </p>
                <details className="group rounded-[14px] bg-creme px-3.5 py-2.5 text-sm">
                  <summary className="cursor-pointer font-semibold text-up-texte marker:content-none">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="info" className="size-4" />
                      {tCommon("why")}
                    </span>
                  </summary>
                  <p className="mt-2 text-xs text-ardoise">{t("dimension.whyIntro")}</p>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {item.reasons.map((reason) => (
                      <li key={reason.code} className="flex justify-between gap-3 text-[13px]">
                        <span>{d(`dimension.reason.${reason.code}`)}</span>
                        <span
                          className={cx(
                            "whitespace-nowrap",
                            reason.points === 0 ? "text-ardoise" : "font-semibold",
                          )}
                        >
                          {t("dimension.points", { points: reason.points, max: reason.max })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
                <Link
                  href={dimensionLinks[item.key]}
                  className="mt-auto flex items-center gap-1 text-[13px] font-semibold text-up-texte hover:underline"
                >
                  {d(`dimension.${item.key}.action`)}
                  <Icon name="chev-r" className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section aria-labelledby="priorities" className={cx(card, "flex flex-col gap-4")}>
            <h2 id="priorities" className={cardTitle}>
              {t("result.priorities")}
            </h2>
            <ol className="flex flex-col gap-3">
              {result.priorities.map((key, index) => (
                <li key={key} className="flex gap-3 text-[15px] leading-6 font-semibold">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sapin text-sm text-lime">
                    {index + 1}
                  </span>
                  {d(`rule.priority.${key}`)}
                </li>
              ))}
            </ol>
            <Link href="/app/career/plan" className={pillClass("dark", "md", "mt-auto self-start")}>
              {t("result.createPlan")}
              <Icon name="chev-r" className="size-4" />
            </Link>
          </section>
          <section aria-labelledby="strengths" className={cx(card, "flex flex-col gap-4")}>
            <h2 id="strengths" className={cardTitle}>
              {t("result.strengths")}
            </h2>
            {result.skills.length > 0 && (
              <p className="text-sm">
                {t("result.namedSkills", { skills: result.skills.join(", ") })}
              </p>
            )}
            <ul className="flex flex-col gap-3">
              {strengths.map((text) => (
                <li key={text} className="flex gap-3 text-[15px] leading-6">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime-clair text-feuille">
                    <Icon name="check" className="size-3" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="evolution" className={cx(card, "flex flex-col gap-3")}>
          <h2 id="evolution" className={cardTitle}>
            {t("result.evolution.title")}
          </h2>
          {before && previous ? (
            <>
              <p className="text-sm text-ardoise">
                {t("result.evolution.since", { date: previous.date })}
              </p>
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {result.dimensions.map((item) => (
                  <li key={item.key} className="flex flex-col gap-1 rounded-[16px] bg-creme p-3">
                    <span className="text-xs text-ardoise">{short(item.key)}</span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-semibold">{item.score}</span>
                      {deltaBadge(deltaOf(item.key))}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ardoise">
              {previous ? t("result.legacy") : t("result.evolution.first")}
            </p>
          )}
        </section>

        {result.roles.length > 0 && (
          <section aria-labelledby="roles" className={cx(card, "flex flex-col gap-4")}>
            <h2 id="roles" className={cardTitle}>
              {t("result.roles")}
            </h2>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {result.roles.map((role) => (
                <li key={role} className="flex flex-col gap-2 rounded-[18px] bg-creme p-4">
                  <p className="text-[15px] font-semibold">{role}</p>
                  <Link
                    href={`/app/jobs?q=${encodeURIComponent(role)}`}
                    className="flex items-center gap-1 text-[13px] font-semibold text-up-texte hover:underline"
                  >
                    {t("result.exploreJobs")}
                    <Icon name="chev-r" className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-5">
        <AiPanel>
          <AiBrand />
          {personal && personal.summary && (
            <p className="text-sm leading-6 whitespace-pre-line">{personal.summary}</p>
          )}
          <p className="text-[13px] leading-5 text-blanc/85">
            {personal ? t("result.personalized.note") : t("result.simple.note")}
          </p>
        </AiPanel>
        <section className={cx(card, "flex flex-col gap-3")}>
          <a
            href={`/app/career/diagnostic/pdf?bilan=${id}`}
            className={pillClass("outline")}
            download
          >
            <Icon name="telecharger" className="size-4" />
            {t("result.download")}
          </a>
          {reminder ? (
            <Alert
              tone="success"
              title={
                reminded
                  ? t("result.remind.sent", { date: reminded })
                  : t("result.remind.done", { date: reminder })
              }
            />
          ) : (
            <form action={remindDiagnosticAction} className="flex flex-col gap-1.5">
              <input type="hidden" name="id" value={id} />
              <button type="submit" className={cx(pillClass("outline"), "w-full")}>
                <Icon name="calendrier" className="size-4" />
                {t("result.remind.cta")}
              </button>
              <p className="text-center text-xs text-ardoise">{t("result.remind.hint")}</p>
            </form>
          )}
          <Link href="/app/career/diagnostic" className={pillClass("outline")}>
            {t("restart")}
          </Link>
        </section>
        {aside}
      </aside>
    </div>
  );
}
