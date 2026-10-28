/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
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
  PhoneShot,
  PhotoFrame,
  SectionHead,
  SiteButton,
  SiteHero,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
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

/** Zigzag rows: the picture takes the module's tint, plain, with a large orbit. */
const modules: { key: ModuleKey; icon: IconName; tint: string }[] = [
  { key: "learn", icon: "learn", tint: "bg-lime-clair" },
  { key: "career", icon: "career", tint: "bg-neon/60" },
  { key: "jobs", icon: "jobs", tint: "bg-menthe-claire" },
  { key: "connect", icon: "connect", tint: "bg-blanc" },
];

export default async function TalentsPage({ params }: PageProps<"/[locale]/talents">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const signup = signupHref({ profil: "talent" });

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

      {/* Modules, in zigzag */}
      <MarketingSection
        scene
        className="pt-0 lg:pt-0"
        innerClassName="flex flex-col gap-14 lg:gap-[88px]"
      >
        {modules.map((module, index) => (
          <div
            key={module.key}
            className={cx(
              "flex flex-col gap-5 lg:items-center lg:gap-[72px]",
              index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse",
            )}
          >
            <div data-reveal className="flex flex-col gap-4 lg:w-[440px] lg:shrink-0">
              <span className="inline-flex h-9 items-center gap-2 self-start rounded-pill bg-blanc py-1 pr-4 pl-1 text-[13px] font-semibold text-sapin ring-1 ring-sapin/8">
                <span className="flex size-7 items-center justify-center rounded-full bg-nuit text-lime">
                  <Icon name={module.icon} className="size-3.5" />
                </span>
                {t(`talents.${module.key}.label`)}
              </span>
              <h3 className="text-[30px] leading-[36px] font-semibold tracking-[-0.035em] lg:text-[40px] lg:leading-[46px]">
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
            <div
              data-reveal="zoom"
              className={cx(
                "jm-lift relative h-[240px] min-w-0 overflow-hidden rounded-[28px] pt-5 pl-5 ring-1 ring-sapin/6 lg:h-[440px] lg:flex-1 lg:rounded-[40px] lg:pt-12 lg:pl-12",
                module.tint,
              )}
              style={stagger(1)}
            >
              <span
                aria-hidden
                className="absolute -top-24 -right-24 size-[320px] rounded-full border-[40px] border-sapin/5"
              />
              <img
                src={`/apercus/talents-module-${module.key}.webp`}
                alt={t(`talents.${module.key}.imageAlt`)}
                width={675}
                height={400}
                loading="lazy"
                decoding="async"
                className="jm-float-slow relative w-[390px] max-w-none rounded-tl-[16px] shadow-[0_10px_30px_rgba(11,26,31,0.18)] lg:w-[675px] lg:rounded-tl-[22px] lg:shadow-[0_20px_50px_rgba(11,26,31,0.2)]"
                style={{ animationDelay: `${index * -2}s` }}
              />
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
        character={{ name: "fatou", pose: "joie", height: 330, mobileHeight: 250 }}
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
      <PhotoFrame
        tone="sapin"
        character={{ name: "kofi", pose: "telephone", height: 300 }}
        className="h-[440px] sm:h-[520px] lg:h-[600px] [&>div]:justify-end [&>div]:pr-2"
      >
        <div className="jm-float-slow absolute top-10 left-6 sm:left-14 lg:top-14">
          <PhoneShot src="talents-tableau-de-bord-mobile" alt={alt} width={200} priority />
        </div>
        <div
          className="jm-float absolute top-28 left-[180px] max-sm:hidden sm:left-[250px] lg:top-36"
          style={{ animationDelay: "-2s" }}
        >
          <PhoneShot src="talents-offre-mobile" width={180} />
        </div>
      </PhotoFrame>
      <FloatCard
        className="jm-pop top-4 right-3 flex items-center gap-2.5 lg:top-10 lg:-right-4"
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
        className="jm-pop bottom-8 left-3 flex items-center gap-2.5 bg-lime! lg:-left-6"
        style={stagger(1)}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-nuit text-lime">
          <Icon name="certificat" className="size-4" />
        </span>
        <span className="text-xs leading-[17px] font-semibold">{badge}</span>
      </FloatCard>
    </>
  );
}
