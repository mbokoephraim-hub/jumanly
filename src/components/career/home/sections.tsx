import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Character, Orbi } from "@/components/brand/character";
import { Icon, type IconName } from "@/components/brand/icon";
import { pillClass } from "@/components/career/kit";
import { Pattern } from "@/components/site/marketing";
import { cx } from "@/lib/cx";
import type { Journey } from "@/server/services/career-journey";
import { ScoreDial } from "./art";

/** Entrance of a block (class `jm-ch-in`): rises 14 px and fades in, 80 ms after the previous one (§ 7). */
const enter = (index: number) => ({ style: { "--i": index } as CSSProperties });

function Spark({ className, style }: { className: string; style?: CSSProperties }) {
  return <span className={cx("jm-ch-spark jm-float absolute", className)} style={style} />;
}

/** A white floating card of the hero's scene. */
function FloatCard({
  className,
  delay,
  icon,
  title,
  sub,
}: {
  className: string;
  delay: string;
  icon: ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div
      className={cx(
        "jm-float absolute flex items-center gap-2 rounded-[18px] bg-blanc/96 px-[11px] py-[9px] text-[11px] leading-[1.3] text-sapin shadow-[0_24px_50px_-20px_rgb(0_0_0/0.55)] sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-xs",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {icon}
      <span>
        <b className="block text-xs sm:text-[13px]">{title}</b>
        <small className="text-[11px] text-ardoise">{sub}</small>
      </span>
    </div>
  );
}

const chip = (tone: "lime" | "sapin", icon: IconName) => (
  <span
    className={cx(
      "grid size-7 shrink-0 place-items-center rounded-[11px] sm:size-[34px]",
      tone === "lime" ? "bg-lime text-sapin" : "bg-sapin text-neon",
    )}
  >
    <Icon name={icon} className="size-4 sm:size-5" />
  </span>
);

/**
 * The hero of the Career home (BRIEF-CAREER-V2 § 3): the title, the four-step journey and its
 * buttons on the left; a decorative scene on the right (Amani, Orbi, orbits and three cards
 * carrying the real CV score, the diagnostic date and the next step).
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
  const title = t("heroTitle");
  const accent = t("heroTitleAccent");
  const [before, after] = title.includes(accent) ? title.split(accent) : [title, null];
  const stepLabel = (key: string) => t(`journey.step.${key}` as "journey.step.point");
  const next = journey.current ? stepLabel(journey.current) : t("journey.finished");

  return (
    <section
      aria-labelledby="career-hero-title"
      {...enter(0)}
      className="jm-ch-in relative isolate grid overflow-hidden rounded-[32px] bg-[image:var(--jm-degrade-profondeur)] text-blanc xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
    >
      <div aria-hidden className="absolute -inset-[15%] -z-10">
        <span className="jm-drift absolute inset-0 bg-[radial-gradient(420px_300px_at_78%_55%,rgb(166_242_107/0.28),transparent_70%),radial-gradient(380px_260px_at_98%_0%,rgb(47_211_166/0.3),transparent_70%),radial-gradient(500px_300px_at_10%_100%,rgb(30_154_100/0.35),transparent_70%)] [animation-duration:24s]" />
      </div>
      <Pattern
        name="motif-trajectoires-sombre"
        size={320}
        opacity={0.35}
        className="-z-10 [mask-image:linear-gradient(90deg,transparent_25%,#000)]"
      />

      <div className="flex min-w-0 flex-col gap-[18px] px-[22px] pt-[26px] pb-2 lg:py-9 lg:pr-2 lg:pl-11">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.16em] text-neon uppercase before:h-0.5 before:w-[22px] before:rounded-sm before:bg-neon">
          {t("eyebrow")}
        </p>
        <h2
          id="career-hero-title"
          className="max-w-[13ch] text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance lg:text-[46px]"
        >
          {before}
          {after !== null && (
            <>
              <span className="jm-ch-accent">{accent}</span>
              {after}
            </>
          )}
        </h2>
        <p className="max-w-[46ch] text-sm leading-[1.6] font-light text-[#C9DDD6] lg:text-base">
          {t("heroLead")}
        </p>

        <div
          id="career-journey"
          className="flex max-w-[560px] flex-col gap-3 rounded-[22px] border border-blanc/10 bg-blanc/6 px-[18px] py-4 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-[#C9DDD6]">
            <h3 className="text-[13px] font-semibold text-blanc">{t("journey.title")}</h3>
            <span>{t("journey.count", { done: journey.done })}</span>
          </div>
          <span aria-hidden className="block h-1.5 overflow-hidden rounded-md bg-blanc/12">
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
                  step.state === "next" ? "text-[#A9C3BB]" : "text-blanc",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px] text-[11px] font-semibold",
                    step.state === "done" && "border-lime bg-lime text-sapin",
                    step.state === "current" &&
                      "border-lime text-lime shadow-[0_0_0_4px_rgb(166_242_107/0.15)]",
                    step.state === "next" && "border-blanc/25",
                  )}
                >
                  {step.state === "done" ? (
                    <Icon name="check" className="size-[13px]" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0">
                  {stepLabel(step.key)}
                  <small className="block text-[11px] text-[#A9C3BB]">
                    {step.key === "point" && step.state === "done" && diagnosticAt
                      ? format.dateTime(diagnosticAt, { dateStyle: "medium" })
                      : t(`journey.state.${step.state}`)}
                  </small>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href={continueHref}
            className={pillClass("lime", "md", "shadow-[0_14px_30px_-14px_rgb(166_242_107/0.9)]")}
          >
            {t("journey.continue")}
            <Icon name="chev-r" className="size-4" />
          </Link>
          <Link href={diagnosticHref} className={pillClass("ghost")}>
            {diagnosticAt ? t("diagnostic.cta.view") : t("diagnostic.cta.start")}
          </Link>
        </div>
      </div>

      <div aria-hidden className="relative min-h-[310px] sm:min-h-[340px] xl:min-h-[400px]">
        <div className="absolute top-[54%] left-1/2 size-[320px] -translate-1/2 sm:size-[440px]">
          <span className="absolute inset-0 rounded-full border-[1.5px] border-menthe/28" />
          <span className="absolute inset-[44px] rounded-full border-[1.5px] border-lime/25 sm:inset-[60px]" />
          <span className="jm-ch-orbit absolute inset-[88px] rounded-full border-[1.5px] border-dashed border-neon/25 sm:inset-[120px]" />
        </div>
        <div className="jm-float absolute top-[30px] right-[18%]" style={{ animationDelay: "-3s" }}>
          <Orbi size={38} />
        </div>
        <Spark className="top-[70px] left-[46%] size-4 bg-neon" />
        <Spark
          className="right-[14%] bottom-[120px] size-[11px] bg-neon"
          style={{ animationDelay: "-4.5s" }}
        />
        <span className="absolute bottom-[34px] left-1/2 h-[46px] w-[230px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(166_242_107/0.55),rgb(166_242_107/0))] blur-[2px]" />
        <div className="jm-float absolute bottom-11 left-1/2 -translate-x-1/2 drop-shadow-[0_20px_30px_rgb(0_0_0/0.35)]">
          <span className="block sm:hidden">
            <Character name="amani" pose="joie" height={230} />
          </span>
          <span className="hidden sm:block">
            <Character name="amani" pose="joie" height={290} />
          </span>
        </div>
        <FloatCard
          className="top-[18px] left-[3%] -rotate-4 sm:top-[46px] sm:left-[6%]"
          delay="-1.5s"
          icon={cv ? <ScoreDial score={cv.score} size={38} /> : chip("lime", "cv")}
          title={t("float.cv")}
          sub={cv ? t("float.cvSub", { score: cv.score, band: cv.band }) : t("cv.none")}
        />
        <FloatCard
          className="bottom-[54px] left-[3%] rotate-3 sm:bottom-[96px] sm:left-[2%]"
          delay="-4.5s"
          icon={chip("lime", "objectif")}
          title={diagnosticAt ? t("float.diagnostic") : t("diagnostic.none")}
          sub={
            diagnosticAt
              ? t("float.diagnosticSub", { date: diagnosticAt })
              : t("diagnostic.cta.start")
          }
        />
        <FloatCard
          className="top-[150px] right-[3%] rotate-4 sm:top-[120px] sm:right-[5%]"
          delay="-3s"
          icon={chip("sapin", "suivant")}
          title={t("float.next")}
          sub={next}
        />
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
