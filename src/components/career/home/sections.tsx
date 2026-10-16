import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Character } from "@/components/brand/character";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { cx } from "@/lib/cx";
import type { Journey } from "@/server/services/career-journey";
import { ScoreDial } from "./art";

/** Entrance of a block (class `jm-ch-in`): rises 14 px and fades in, 80 ms after the previous one (§ 7). */
const enter = (index: number) => ({ style: { "--i": index } as CSSProperties });

function Spark({ className, style }: { className: string; style?: CSSProperties }) {
  return <span className={cx("jm-ch-spark jm-float absolute", className)} style={style} />;
}

/** A small fact of the Career head: an icon, a title and one line. */
function Fact({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[140px] items-center gap-2 rounded-[14px] bg-creme px-3 py-2 text-[11px] leading-[1.3] text-sapin">
      {icon}
      <span className="min-w-0">
        <b className="block text-xs">{title}</b>
        <small className="text-[11px] text-ardoise">{sub}</small>
      </span>
    </div>
  );
}

const chip = (tone: "lime" | "sapin", icon: IconName) => (
  <span
    className={cx(
      "grid size-[30px] shrink-0 place-items-center rounded-[10px]",
      tone === "lime" ? "bg-lime text-sapin" : "bg-sapin text-neon",
    )}
  >
    <Icon name={icon} className="size-4" />
  </span>
);

/**
 * The head of the Career home (BRIEF-CAREER-V2 § 3, lightened in Admin v4 étape 5): one white card
 * with the four-step journey, the real CV score, the next step and the two buttons. The page title
 * and its lead sit above, in the page header.
 */
export async function CareerHero({
  journey,
  diagnosticAt,
  cv,
  continueHref,
  diagnosticHref,
}: {
  journey: Journey;
  diagnosticAt: Date | null;
  /** Real CV score and its level label, or null without a CV. */
  cv: { score: number; band: string } | null;
  continueHref: string;
  diagnosticHref: string;
}) {
  const t = await getTranslations("career.home");
  const format = await getFormatter();
  const stepLabel = (key: string) => t(`journey.step.${key}` as "journey.step.point");
  const next = journey.current ? stepLabel(journey.current) : t("journey.finished");

  return (
    <section
      aria-labelledby="career-hero-title"
      {...enter(0)}
      className="jm-ch-in grid gap-4 rounded-[22px] border border-sapin/8 bg-blanc p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-8"
    >
      <div id="career-journey" className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-ardoise">
          <h2 id="career-hero-title" className="text-[15px] font-semibold text-sapin">
            {t("journey.title")}
          </h2>
          <span>{t("journey.count", { done: journey.done })}</span>
        </div>
        <span aria-hidden className="block h-1.5 overflow-hidden rounded-md bg-gris-clair">
          <span
            className="jm-gauge block h-full origin-left rounded-md bg-[image:var(--jm-degrade-signature)]"
            style={{ transform: `scaleX(${journey.progress / 100})` }}
          />
        </span>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
          {journey.steps.map((step, index) => (
            <li
              key={step.key}
              aria-current={step.state === "current" ? "step" : undefined}
              className={cx(
                "flex min-w-0 items-start gap-2 text-xs leading-[1.3]",
                step.state === "next" ? "text-ardoise" : "text-sapin",
              )}
            >
              <span
                aria-hidden
                className={cx(
                  "grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-[11px] font-semibold",
                  step.state === "done" && "border-lime bg-lime text-sapin",
                  step.state === "current" &&
                    "border-sapin text-sapin shadow-[0_0_0_4px_rgb(166_242_107/0.3)]",
                  step.state === "next" && "border-sapin/20",
                )}
              >
                {step.state === "done" ? <Icon name="check" className="size-[13px]" /> : index + 1}
              </span>
              <span className="min-w-0">
                {stepLabel(step.key)}
                <small className="block text-[11px] text-ardoise">
                  {step.key === "point" && step.state === "done" && diagnosticAt
                    ? format.dateTime(diagnosticAt, { dateStyle: "medium" })
                    : t(`journey.state.${step.state}`)}
                </small>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 xl:w-[360px]">
        <div className="flex flex-wrap gap-2">
          <Fact
            icon={cv ? <ScoreDial score={cv.score} size={30} /> : chip("lime", "cv")}
            title={t("float.cv")}
            sub={cv ? t("float.cvSub", { score: cv.score, band: cv.band }) : t("cv.none")}
          />
          <Fact icon={chip("sapin", "suivant")} title={t("float.next")} sub={next} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={continueHref} className={pillClass("lime", "md")}>
            {t("journey.continue")}
            <Icon name="chev-r" className="size-4" />
          </Link>
          <Link href={diagnosticHref} className={pillClass("outline")}>
            {diagnosticAt ? t("diagnostic.cta.view") : t("diagnostic.cta.start")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Head of a group: the step number, the title and its lead (§ 2). */
export function CareerGroup({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string;
  index: number;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      {...enter(index)}
      className="jm-ch-in flex flex-col gap-3.5"
    >
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <span
          aria-hidden
          className="grid size-[34px] place-items-center rounded-xl bg-sapin text-sm font-semibold text-neon"
        >
          {index}
        </span>
        <h2
          id={`${id}-title`}
          className="text-[22px] leading-tight font-semibold tracking-[-0.02em]"
        >
          {title}
        </h2>
        <p className="w-full text-[13px] text-ardoise sm:ml-auto sm:w-auto">{lead}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4">{children}</div>
    </section>
  );
}

/**
 * Offer band (§ 6), shown only while a Career tool is locked: the plan chosen by `upgradeOffer`,
 * the tools it opens, its price and the plans page. Sapin text on the Signature gradient.
 */
export async function CareerUpgradeBand({
  plan,
  price,
  tools,
  index,
}: {
  plan: string;
  price: string;
  tools: string[];
  index: number;
}) {
  const t = await getTranslations("career.home");
  return (
    <section
      id="career-upgrade"
      aria-labelledby="career-upgrade-title"
      {...enter(index)}
      className="jm-ch-in relative isolate grid overflow-hidden rounded-[32px] bg-[image:var(--jm-degrade-signature)] text-sapin xl:grid-cols-[minmax(0,1fr)_300px]"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(400px_240px_at_90%_100%,rgb(15_63_55/0.35),transparent_70%)]"
      />
      <div className="flex flex-col gap-3.5 px-[22px] py-[26px] lg:px-10 lg:py-[34px]">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase before:h-0.5 before:w-[22px] before:rounded-sm before:bg-sapin">
          {t("upgrade.eyebrow", { plan })}
        </p>
        <h2
          id="career-upgrade-title"
          className="max-w-[20ch] text-[23px] leading-tight font-semibold tracking-[-0.02em] lg:text-[28px]"
        >
          {t("upgrade.title", { count: tools.length })}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <li
              key={tool}
              className="flex items-center gap-1.5 rounded-pill bg-blanc/70 px-3 py-[7px] text-[13px] font-medium"
            >
              <Icon name="valider" className="size-[15px] text-feuille-fonce" />
              {tool}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-[18px]">
          <p className="flex flex-wrap items-baseline gap-2 text-[13px]">
            <b className="text-[30px] font-semibold tracking-[-0.03em] whitespace-nowrap">
              {t("upgrade.price", { price })}
            </b>
            {t("upgrade.period")}
          </p>
          <Link href="/app/abonnement" className={pillClass("dark")}>
            {t("upgrade.cta")}
            <Icon name="chev-r" className="size-4" />
          </Link>
        </div>
      </div>
      <div aria-hidden className="relative hidden min-h-[240px] xl:block">
        <span className="absolute bottom-0.5 left-[56%] h-[46px] w-[230px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(15_63_55/0.35),transparent)]" />
        <div className="jm-float absolute bottom-2.5 left-[56%] -translate-x-1/2">
          <Character name="fatou" pose="montre" height={220} />
        </div>
        <Spark className="top-10 left-[24%] size-4 bg-sapin" style={{ animationDelay: "-1.5s" }} />
        <Spark
          className="top-[110px] right-[16%] size-[11px] bg-blanc"
          style={{ animationDelay: "-4.5s" }}
        />
      </div>
    </section>
  );
}
