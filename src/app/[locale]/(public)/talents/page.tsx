/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AiOrb, Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  Eyebrow,
  Glow,
  IconTile,
  ImmersiveBackdrop,
  LimeCtaBand,
  MarketingSection,
  Pattern,
  SectionHead,
  Shape,
  lead,
  sectionTitle,
  signatureLight,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { signupHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]/talents">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("talents.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "talent");
  return pageMetadata({
    path: "/talents",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

const chevron = <Icon name="chev-r" />;

type ModuleKey = "learn" | "career" | "jobs" | "connect";

/** Zigzag rows (mockup 01-03): the panel takes the module's color, as a gradient that flows. */
const modules: { key: ModuleKey; icon: IconName; tint: string; gradient: string; tag: string }[] = [
  { key: "learn", icon: "learn", tint: "bg-lime", gradient: signatureLight, tag: "bg-lime" },
  {
    key: "career",
    icon: "career",
    tint: "bg-neon",
    gradient: "linear-gradient(135deg, #E3F67C 0%, #D9FA72 40%, #BFEFDF 75%, #E3F67C 100%)",
    tag: "bg-neon",
  },
  {
    key: "jobs",
    icon: "jobs",
    tint: "bg-menthe-claire",
    gradient: "linear-gradient(135deg, #BFEFDF 0%, #E4FAD0 40%, #A6F26B 75%, #BFEFDF 100%)",
    tag: "bg-menthe-claire",
  },
  {
    key: "connect",
    icon: "connect",
    tint: "bg-brume",
    gradient: "linear-gradient(135deg, #DCE5E1 0%, #BFEFDF 45%, #E3F67C 80%, #DCE5E1 100%)",
    tag: "bg-blanc ring-[1.5px] ring-brume ring-inset",
  },
];

export default async function TalentsPage({ params }: PageProps<"/[locale]/talents">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const signup = signupHref({ profil: "talent" });

  return (
    <>
      <MotionRoot />

      {/* Hero, on the depth gradient */}
      <MarketingSection
        tone="profondeur"
        scene
        spotlight
        className="pt-12 pb-16 lg:pt-[72px] lg:pb-24"
        background={<ImmersiveBackdrop />}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-14">
          <div className="relative z-1 flex flex-col gap-6 xl:w-[540px] xl:shrink-0">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow dark>{t("talents.hero.eyebrow")}</Eyebrow>
            </div>
            <h1
              className="jm-word text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[56px] lg:leading-[60px]"
              style={stagger(1)}
            >
              {t("talents.hero.title")}
            </h1>
            <p className={cx(lead, "jm-rise text-blanc/80")} style={stagger(3)}>
              {t("talents.hero.text")}
            </p>
            <div className="jm-rise flex flex-col gap-3 sm:flex-row" style={stagger(4)}>
              <ButtonLink
                href={signup}
                size="lg"
                iconAfter={chevron}
                className="shadow-[0_0_32px_rgba(166,242,107,0.45)]"
              >
                {t("talents.hero.cta")}
              </ButtonLink>
              <ButtonLink href="/tarifs#talents" variant="inverse" size="lg">
                {t("talents.hero.secondary")}
              </ButtonLink>
            </div>
            <p
              className="jm-rise inline-flex items-center gap-2 self-start rounded-pill bg-blanc py-2 pr-4 pl-2.5 text-[13.5px] leading-5 font-semibold text-sapin"
              style={stagger(5)}
            >
              <Icon name="check" className="size-[18px] text-feuille-fonce" />
              {t("talents.hero.badge")}
            </p>
          </div>
          <HeroVisual
            alt={t("talents.hero.imageAlt")}
            badge={t("talents.hero.visual.badge")}
            matchTitle={t("talents.hero.visual.matchTitle")}
            matchText={t("talents.hero.visual.matchText")}
          />
        </div>
      </MarketingSection>

      {/* One account */}
      <MarketingSection
        className="pb-10 lg:pb-14"
        background={<Glow className="-top-40 -left-32 size-[460px] bg-lime/35" />}
      >
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
        background={<Glow className="top-1/2 -right-40 size-[520px] bg-menthe/25" delay={-8} />}
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
              <span
                className={cx(
                  "inline-flex h-[30px] items-center gap-1.5 self-start rounded-pill px-3.5 text-xs font-semibold text-sapin",
                  module.tag,
                )}
              >
                <Icon name={module.icon} className="size-3.5" />
                {t(`talents.${module.key}.label`)}
              </span>
              <h3 className="text-[28px] leading-[34px] font-semibold tracking-[-0.025em] lg:text-[32px] lg:leading-[38px]">
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
                "jm-flow jm-lift relative h-[220px] min-w-0 overflow-hidden rounded-box pt-4 pl-4 lg:h-[420px] lg:flex-1 lg:rounded-[32px] lg:pt-10 lg:pl-10",
                module.tint,
              )}
              style={{ ...stagger(1), backgroundImage: module.gradient }}
            >
              <Shape
                name="forme-orbites-sapin"
                className="jm-drift -top-[90px] -right-[90px] hidden w-[300px] opacity-12 lg:block"
              />
              <img
                src={`/apercus/talents-module-${module.key}.webp`}
                alt={t(`talents.${module.key}.imageAlt`)}
                width={675}
                height={400}
                loading="lazy"
                decoding="async"
                className="jm-float-slow relative w-[390px] max-w-none rounded-tl-sm shadow-[0_10px_30px_rgba(11,26,31,0.18)] lg:w-[675px] lg:rounded-tl-[16px] lg:shadow-[0_20px_50px_rgba(11,26,31,0.2)]"
                style={{ animationDelay: `${index * -2}s` }}
              />
            </div>
          </div>
        ))}
      </MarketingSection>

      {/* Guarantees and visibility */}
      <MarketingSection
        tone="profondeur"
        scene
        background={
          <>
            <Pattern name="motif-reseau-sombre" opacity={0.22} />
            <Glow className="-top-40 left-1/4 size-[520px] bg-feuille/30" />
            <Glow className="-right-32 -bottom-48 size-[460px] bg-menthe/20" delay={-9} />
          </>
        }
        innerClassName="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-6">
          <Eyebrow dark>{t("talents.guarantees.eyebrow")}</Eyebrow>
          <h2 className={sectionTitle}>{t("talents.guarantees.title")}</h2>
          <ul className="flex flex-col gap-4">
            {(["item1", "item2", "item3", "item4"] as const).map((key, index) => (
              <li
                key={key}
                data-reveal
                className="flex items-start gap-3 text-base leading-6"
                style={stagger(index)}
              >
                <span
                  aria-hidden
                  className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-lime text-sapin"
                >
                  <Icon name="check" className="size-3.5" />
                </span>
                {t(`talents.guarantees.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <div
          data-reveal="zoom"
          className="jm-ring flex flex-col gap-4 rounded-box bg-blanc/10 p-6 backdrop-blur-sm lg:rounded-card lg:p-9"
          style={stagger(1)}
        >
          <IconTile icon="confidentialite" className="bg-lime text-sapin" />
          <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
            {t("talents.privacy.title")}
          </h3>
          <p className="text-[15px] leading-6 text-blanc/70">{t("talents.privacy.text")}</p>
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
                      ? "bg-lime text-sapin shadow-[0_0_28px_rgba(166,242,107,0.45)]"
                      : "bg-blanc/7 text-blanc ring-1 ring-blanc/14 ring-inset",
                  )}
                >
                  <Icon name={icon} className="size-[18px] shrink-0" />
                  <span className="flex-1 text-sm font-semibold">
                    {t(`talent.profile.visibility.${key}.text`)}
                  </span>
                  <span
                    className={cx(
                      "flex size-[22px] shrink-0 items-center justify-center rounded-full",
                      on ? "bg-sapin" : "ring-[1.5px] ring-blanc/40 ring-inset",
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
      <MarketingSection
        tone="lime"
        scene
        background={<Glow className="-top-32 right-1/4 size-[420px] bg-lime/50" delay={-11} />}
        innerClassName="flex flex-col gap-10"
      >
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
          className="flex flex-col gap-4 rounded-box bg-blanc px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-sm font-medium">
            <Icon name="mobile-money" className="size-[22px] shrink-0" />
            {t("talents.plans.payment")}
          </p>
          <ButtonLink
            href="/tarifs#talents"
            variant="secondary"
            iconAfter={chevron}
            className="self-start sm:self-auto"
          >
            {t("talents.plans.cta")}
          </ButtonLink>
        </div>
      </MarketingSection>

      {/* Partner licence */}
      <section data-scene className="bg-creme pt-14 lg:pt-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="jm-flow jm-lift relative flex flex-col gap-6 overflow-hidden rounded-[32px] bg-neon px-6 py-7 text-sapin lg:flex-row lg:items-center lg:px-11 lg:py-9"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #E3F67C 0%, #D9FA72 35%, #BFEFDF 70%, #E3F67C 100%)",
            }}
          >
            <Pattern name="motif-pastilles-lime" opacity={0.35} />
            <span
              aria-hidden
              className="jm-float relative flex size-16 shrink-0 items-center justify-center rounded-sm bg-gradient-depth text-lime"
            >
              <Icon name="certificat" className="size-[30px]" />
            </span>
            <div className="relative flex flex-1 flex-col gap-2">
              <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t("talents.partners.title")}
              </h2>
              <p className="text-[15px] leading-6 opacity-85">{t("talents.partners.text")}</p>
            </div>
            <ButtonLink
              href="/activer"
              variant="secondary"
              size="lg"
              iconAfter={chevron}
              className="relative self-start lg:self-center"
            >
              {t("talents.partners.cta")}
            </ButtonLink>
          </div>
        </div>
      </section>

      <LimeCtaBand
        animated
        spacedTop
        title={t("talents.finalCta.title")}
        text={t("talents.finalCta.text")}
        character={{ name: "fatou", pose: "joie", height: 330, mobileHeight: 250 }}
        actions={
          <ButtonLink href={signup} variant="secondary" size="lg" iconAfter={chevron}>
            {t("talents.finalCta.primary")}
          </ButtonLink>
        }
      />
    </>
  );
}

/**
 * Hero visual (mockup 01-03): two phone screens on a Sapin panel with the « Trajectoires » pattern,
 * Kofi with his phone and two floating cards. Decorative labels are part of the illustration,
 * described by the image's alternative text.
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
  const shadow = "shadow-[0_30px_60px_rgba(0,0,0,0.32)]";
  return (
    <>
      {/* Desktop: 640 px stage */}
      <div
        className="jm-rise relative hidden h-[640px] min-w-0 flex-1 overflow-hidden rounded-[40px] bg-blanc/6 ring-1 ring-blanc/12 ring-inset xl:block"
        style={stagger(4)}
      >
        <Shape
          name="forme-halo-couleur"
          className="jm-drift -top-40 -right-40 w-[560px] opacity-60"
        />
        <div className="jm-float-slow absolute top-14 left-[90px]">
          <img
            src="/apercus/talents-tableau-de-bord-mobile.webp"
            alt={alt}
            width={250}
            height={541}
            fetchPriority="high"
            className={cx("w-[250px] rounded-[28px]", shadow)}
          />
        </div>
        <div
          className="jm-float absolute top-[150px] left-[330px]"
          style={{ animationDelay: "-2s" }}
        >
          <img
            src="/apercus/talents-offre-mobile.webp"
            alt=""
            width={210}
            height={454}
            className={cx("w-[210px] rounded-[28px] opacity-96", shadow)}
          />
        </div>
        <div className="jm-breathe absolute right-1.5 bottom-0">
          <Character name="kofi" pose="telephone" height={330} />
        </div>
        <div
          aria-hidden
          className="jm-pop absolute bottom-[120px] left-6 z-2 flex items-center gap-2.5 rounded-md bg-lime px-4 py-3 text-sapin shadow-[0_0_32px_rgba(166,242,107,0.5)]"
          style={stagger(1)}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-sapin text-lime">
            <Icon name="certificat" className="size-4" />
          </span>
          <span className="text-xs leading-[17px] font-semibold">{badge}</span>
        </div>
        <div
          aria-hidden
          className="jm-pop absolute top-[30px] right-[180px] z-2 flex items-center gap-2.5 rounded-md bg-blanc px-4 py-3 text-sapin shadow-[0_18px_40px_rgba(11,26,31,0.35)]"
          style={stagger(0)}
        >
          <AiOrb size={28} className="jm-pulse" />
          <div className="flex flex-col">
            <span className="text-xs leading-[17px] font-semibold">{matchTitle}</span>
            <span className="text-[11px] leading-[15px] text-ardoise">
              <CountUp text={matchText} />
            </span>
          </div>
        </div>
      </div>

      {/* Mobile and tablet: one phone on a 400 px panel */}
      <div
        className="jm-rise relative h-[400px] overflow-hidden rounded-card bg-blanc/6 ring-1 ring-blanc/12 ring-inset xl:hidden"
        style={stagger(6)}
      >
        <Shape
          name="forme-halo-couleur"
          className="jm-drift -top-24 -right-24 w-[360px] opacity-60"
        />
        <div className="jm-float absolute top-[30px] left-1/2 -translate-x-1/2">
          <img
            src="/apercus/talents-tableau-de-bord-mobile.webp"
            alt={alt}
            width={200}
            height={433}
            className={cx("w-[200px] rounded-[28px]", shadow)}
          />
        </div>
        <div className="jm-breathe absolute -right-2 -bottom-1.5">
          <Character name="kofi" pose="telephone" height={210} />
        </div>
      </div>
    </>
  );
}
