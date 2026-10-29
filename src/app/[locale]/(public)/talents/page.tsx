import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  CheckChips,
  CheckLine,
  Eyebrow,
  FloatCard,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  SectionHead,
  SiteButton,
  SiteHero,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { cx } from "@/lib/cx";
import { MatchesPreview } from "@/components/site/previews";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { joinHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/talents">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("talents.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "talent");
  return pageMetadata({
    path: "/talents",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

type ModuleKey = "learn" | "career" | "jobs" | "connect";

/** The four modules, one card each. */
const modules: { key: ModuleKey; icon: IconName }[] = [
  { key: "learn", icon: "learn" },
  { key: "career", icon: "career" },
  { key: "jobs", icon: "jobs" },
  { key: "connect", icon: "connect" },
];

export default async function TalentsPage({ params }: PageProps<"/[locale]/talents">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const signup = joinHref({ profil: "talent" });

  return (
    <>
      <MotionRoot />

      <SiteHero
        eyebrow={t("talents.hero.eyebrow")}
        title={t("talents.hero.title")}
        text={t("talents.hero.text")}
        actions={
          <>
            <SiteButton href={signup}>{t("talents.hero.cta")}</SiteButton>
            <SiteButton href="/tarifs#talents" tone="light">
              {t("talents.hero.secondary")}
            </SiteButton>
          </>
        }
        extra={<CheckChips items={[t("talents.hero.badge")]} />}
        visual={
          <HeroVisual
            alt={t("talents.hero.imageAlt")}
            badge={t("talents.hero.visual.badge")}
            matchTitle={t("talents.hero.visual.matchTitle")}
            matchText={t("talents.hero.visual.matchText")}
          />
        }
      />

      {/* One account */}
      <MarketingSection className="pb-10 lg:pb-14">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("talents.intro.eyebrow")}
            title={t("talents.intro.title")}
            text={t("talents.intro.text")}
          />
        </div>
      </MarketingSection>

      {/* Modules: four cards */}
      <MarketingSection
        scene
        className="pt-0 lg:pt-0"
        innerClassName="grid gap-4 md:grid-cols-2 lg:gap-5"
      >
        {modules.map((module, index) => (
          <div
            key={module.key}
            data-reveal
            className="jm-card jm-lift flex flex-col gap-4 rounded-[24px] p-6 lg:p-9"
            style={stagger(index)}
          >
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-2.5 self-start text-[13px] font-semibold text-neon">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#1c3a2c] text-lime">
                  <Icon name={module.icon} className="size-[18px]" />
                </span>
                {t(`talents.${module.key}.label`)}
              </span>
              <h3 className="text-[26px] leading-8 font-semibold tracking-[-0.03em] lg:text-[30px] lg:leading-9">
                {t(`talents.${module.key}.title`)}
              </h3>
              <p className="text-base leading-[26px] text-ardoise">
                {t(`talents.${module.key}.text`)}
              </p>
              {module.key === "career" && (
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  <Link
                    href="/comment-fonctionne-le-matching"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  >
                    <Icon name="eye" className="size-4" />
                    {t("common.why")}
                  </Link>
                  <span className="text-[11px] leading-[15px] text-ardoise">
                    · {t("talents.career.decide")}
                  </span>
                </p>
              )}
              {module.key === "jobs" && (
                <p className="flex items-center gap-2 text-xs font-semibold text-feuille-fonce">
                  <Icon name="check" className="size-4" />
                  {t("talents.hero.badge")}
                </p>
              )}
            </div>
          </div>
        ))}
      </MarketingSection>

      {/* Guarantees and visibility */}
      <MarketingSection
        tone="sapin"
        innerClassName="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-6">
          <Eyebrow dark>{t("talents.guarantees.eyebrow")}</Eyebrow>
          <h2 className={sectionTitle}>{t("talents.guarantees.title")}</h2>
          <ul className="flex flex-col gap-4">
            {(["item1", "item2", "item3", "item4"] as const).map((key) => (
              <CheckLine key={key} dark>
                {t(`talents.guarantees.${key}`)}
              </CheckLine>
            ))}
          </ul>
        </div>
        <div
          data-reveal="zoom"
          className="flex flex-col gap-4 rounded-[32px] bg-blanc p-6 text-sapin lg:p-9"
          style={stagger(1)}
        >
          <IconTile icon="confidentialite" className="bg-nuit text-lime" />
          <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
            {t("talents.privacy.title")}
          </h3>
          <p className="text-[15px] leading-6 text-ardoise">{t("talents.privacy.text")}</p>
          {/* Illustration of the visibility setting, which lives in the talent's profile. */}
          <ul aria-hidden className="flex flex-col gap-2">
            {(
              [
                ["private", "lock"],
                ["recruiters", "eye"],
                ["anonymous", "profil"],
              ] as const
            ).map(([key, icon]) => {
              const on = key === "recruiters";
              return (
                <li
                  key={key}
                  className={cx(
                    "flex items-center gap-3 rounded-[16px] px-4 py-3.5",
                    on
                      ? "bg-lime text-sapin"
                      : "bg-papier text-sapin ring-1 ring-sapin/8 ring-inset",
                  )}
                >
                  <Icon name={icon} className="size-[18px] shrink-0" />
                  <span className="flex-1 text-sm font-semibold">
                    {t(`talent.profile.visibility.${key}.text`)}
                  </span>
                  <span
                    className={cx(
                      "flex size-[22px] shrink-0 items-center justify-center rounded-full",
                      on ? "bg-nuit" : "ring-[1.5px] ring-sapin/30 ring-inset",
                    )}
                  >
                    {on && <span className="size-2 rounded-full bg-lime" />}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </MarketingSection>

      {/* Plans */}
      <MarketingSection tone="lime" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("talents.plans.eyebrow")}
            title={t("talents.plans.title")}
            text={t("talents.plans.text")}
          />
        </div>
        <div data-reveal="zoom">
          <PublicPlanCards plans={plans} family="talent" />
        </div>
        <div
          data-reveal
          className="flex flex-col gap-4 rounded-[28px] bg-blanc py-3 pr-3 pl-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-sm font-medium">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-clair">
              <Icon name="mobile-money" className="size-5" />
            </span>
            {t("talents.plans.payment")}
          </p>
          <SiteButton href="/tarifs#talents" className="self-start sm:self-auto">
            {t("talents.plans.cta")}
          </SiteButton>
        </div>
      </MarketingSection>

      {/* Partner licence */}
      <section className="bg-papier pt-14 lg:pt-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="jm-lift relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-blanc px-6 py-7 text-sapin ring-1 ring-sapin/6 lg:flex-row lg:items-center lg:px-11 lg:py-9"
          >
            <span
              aria-hidden
              className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-nuit text-lime"
            >
              <Icon name="certificat" className="size-[30px]" />
            </span>
            <div className="relative flex flex-1 flex-col gap-2">
              <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.02em] lg:text-2xl lg:leading-[30px]">
                {t("talents.partners.title")}
              </h2>
              <p className="text-[15px] leading-6 text-ardoise">{t("talents.partners.text")}</p>
            </div>
            <SiteButton href="/activer" tone="lime" className="relative self-start lg:self-center">
              {t("talents.partners.cta")}
            </SiteButton>
          </div>
        </div>
      </section>

      <section aria-hidden className="h-14 bg-papier lg:h-24" />
      <LimeCtaBand
        title={t("talents.finalCta.title")}
        text={t("talents.finalCta.text")}
        actions={<SiteButton href={signup}>{t("talents.finalCta.primary")}</SiteButton>}
      />
    </>
  );
}

/**
 * Hero picture: two phone screens in a Sapin frame, Kofi with his phone and two floating cards.
 * Decorative labels are part of the illustration, described by the image's alternative text.
 */
function HeroVisual({
  alt,
  badge,
  matchTitle,
  matchText,
}: {
  alt: string;
  badge: string;
  matchTitle: string;
  matchText: string;
}) {
  return (
    <>
      <div className="relative pt-14 pb-20 lg:py-20 lg:pl-8">
        <MatchesPreview label={alt} className="jm-float-slow" />
      </div>
      <FloatCard
        className="jm-pop top-0 right-3 flex items-center gap-2.5 lg:top-4 lg:-right-4"
        style={stagger(0)}
      >
        <AiOrb size={28} className="jm-pulse" />
        <div className="flex flex-col">
          <span className="text-xs leading-[17px] font-semibold">{matchTitle}</span>
          <span className="text-[11px] leading-[15px] text-ardoise">
            <CountUp text={matchText} />
          </span>
        </div>
      </FloatCard>
      <FloatCard
        className="jm-pop bottom-4 left-3 flex items-center gap-2.5 lg:-left-2"
        style={stagger(1)}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-lime text-sapin">
          <Icon name="certificat" className="size-4" />
        </span>
        <span className="text-xs leading-[17px] font-semibold">{badge}</span>
      </FloatCard>
    </>
  );
}
