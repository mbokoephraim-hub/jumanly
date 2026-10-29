import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  ArrowLink,
  CheckChips,
  CheckLine,
  FloatCard,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  SectionHead,
  SiteButton,
  SiteHero,
  lead,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicPlanCards } from "@/components/site/pricing";
import { cx } from "@/lib/cx";
import { PipelinePreview } from "@/components/site/previews";
import { formatUsd } from "@/lib/money";
import { pageMetadata } from "@/lib/seo";
import { joinHref } from "@/lib/signup";
import { getPublicPlans } from "@/server/queries/public";
import { lowestPaidPrice } from "@/server/services/plans";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/recruteurs">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("recruiters.seo");
  const from = lowestPaidPrice(await getPublicPlans(), "rh");
  return pageMetadata({
    path: "/recruteurs",
    title: t("title"),
    description: t("description", { price: from === null ? "" : formatUsd(from) }),
  });
}

/** Hire cards (mockup 01-04): tile colors of each advantage. */
const benefits = [
  { key: "pipeline", icon: "hire", tile: "bg-lime-clair text-sapin" },
  { key: "cv", icon: "doc", tile: "bg-neon text-sapin" },
  { key: "matching", icon: "intelligence", tile: "bg-nuit text-lime" },
  { key: "messaging", icon: "message", tile: "bg-menthe-claire text-sapin" },
] as const satisfies { key: string; icon: IconName; tile: string }[];

const guarantees = [
  { key: "item1", icon: "confidentialite" },
  { key: "item2", icon: "securite" },
  { key: "item3", icon: "statistiques" },
  { key: "item4", icon: "entreprise" },
] as const satisfies { key: string; icon: IconName }[];

/** Avatars of the Companies band, in the mockup's colors. */
const avatarTones = [
  "bg-lime text-sapin",
  "bg-neon text-sapin",
  "bg-menthe-claire text-sapin",
  "bg-[#1c3a2c] text-lime",
];

export default async function RecruitersPage({ params }: PageProps<"/[locale]/recruteurs">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const plans = await getPublicPlans();
  const companyFrom = lowestPaidPrice(plans, "company");
  const signup = joinHref({ profil: "rh" });

  return (
    <>
      <MotionRoot />

      <SiteHero
        eyebrow={t("recruiters.hero.eyebrow")}
        title={t("recruiters.hero.title")}
        text={t("recruiters.hero.text")}
        actions={
          <>
            <SiteButton href={signup}>{t("recruiters.hero.cta")}</SiteButton>
            <SiteButton href="/tarifs#rh" tone="light">
              {t("recruiters.hero.secondary")}
            </SiteButton>
          </>
        }
        extra={<CheckChips items={[t("recruiters.hero.badge")]} />}
        visual={
          <HeroVisual
            alt={t("recruiters.hero.imageAlt")}
            chipTitle={t("recruiters.hero.visual.title")}
            chipText={t("recruiters.hero.visual.text")}
          />
        }
      />

      {/* Jumanly Hire */}
      <MarketingSection innerClassName="flex flex-col gap-10 lg:gap-12">
        <div data-reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-20">
          <SectionHead
            eyebrow={t("recruiters.benefits.eyebrow")}
            title={t("recruiters.benefits.title")}
          />
          <p className={cx(lead, "text-ardoise lg:flex-1")}>{t("recruiters.intro.text")}</p>
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {benefits.map((benefit, index) => (
            <li
              key={benefit.key}
              data-reveal
              className="jm-lift flex flex-col gap-3 rounded-[28px] bg-blanc p-6 ring-1 ring-sapin/6 lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={benefit.icon} className={benefit.tile} />
              <h3 className="mt-1 text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                {t(`recruiters.benefits.${benefit.key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-ardoise">
                {t(`recruiters.benefits.${benefit.key}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Explainable matching */}
      <MarketingSection
        tone="blanc"
        scene
        innerClassName="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-6 lg:flex-1">
          <span className="inline-flex items-center gap-2 self-start rounded-pill bg-nuit py-1 pr-3.5 pl-1 text-[13px] font-semibold text-blanc">
            <AiOrb size={24} className="jm-pulse" />
            {t("recruiters.matching.eyebrow")}
          </span>
          <h2 className={sectionTitle}>{t("recruiters.matching.title")}</h2>
          <p className={cx(lead, "text-ardoise")}>{t("recruiters.matching.text")}</p>
          <ul className="flex flex-col gap-3">
            {(["point1", "point2", "point3"] as const).map((key) => (
              <CheckLine key={key}>{t(`recruiters.matching.${key}`)}</CheckLine>
            ))}
          </ul>
          <ArrowLink href="/comment-fonctionne-le-matching" className="text-feuille-fonce">
            {t("recruiters.matching.link")}
          </ArrowLink>
        </div>
        <ExampleCard />
      </MarketingSection>

      {/* Commitments */}
      <MarketingSection tone="sapin" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead
            center
            dark
            eyebrow={t("recruiters.guarantees.eyebrow")}
            title={t("recruiters.guarantees.title")}
          />
        </div>
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {guarantees.map((item, index) => (
            <li
              key={item.key}
              data-reveal
              className="jm-lift flex flex-col gap-3.5 rounded-[28px] bg-blanc/8 p-6 ring-1 ring-blanc/12 ring-inset lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={item.icon} size={48} className="bg-lime text-sapin" />
              <p className="text-[15.5px] leading-6">{t(`recruiters.guarantees.${item.key}`)}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* RH plans */}
      <MarketingSection tone="lime" innerClassName="flex flex-col gap-10">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("recruiters.plans.eyebrow")}
            title={t("recruiters.plans.title")}
            text={t("recruiters.plans.text")}
          />
        </div>
        <div data-reveal="zoom">
          <PublicPlanCards plans={plans} family="rh" />
        </div>
        <div
          data-reveal
          className="flex flex-col gap-4 rounded-[28px] bg-blanc py-3 pr-3 pl-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-sm font-medium">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-clair">
              <Icon name="mobile-money" className="size-5" />
            </span>
            {t("recruiters.plans.payment")}
          </p>
          <SiteButton href="/tarifs#rh" className="self-start sm:self-auto">
            {t("recruiters.plans.cta")}
          </SiteButton>
        </div>
      </MarketingSection>

      {/* Upsell to Jumanly for Companies */}
      <section className="bg-papier pt-14 lg:pt-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 xl:px-0">
          <div
            data-reveal
            className="jm-lift relative flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-nuit px-6 py-7 text-blanc lg:flex-row lg:items-center lg:px-11 lg:py-9"
          >
            <span aria-hidden className="jm-float relative flex">
              {t("recruiters.upsell.initials")
                .split(",")
                .map((initials, index) => (
                  <span
                    key={initials}
                    className={cx(
                      "flex size-11 items-center justify-center rounded-full text-[13px] font-semibold ring-2 ring-nuit",
                      index > 0 && "-ml-2",
                      avatarTones[index % avatarTones.length],
                    )}
                  >
                    {initials.trim()}
                  </span>
                ))}
              <span className="-ml-2 flex size-11 items-center justify-center rounded-full bg-neon text-[15px] font-semibold text-sapin ring-2 ring-nuit">
                {t("recruiters.upsell.more")}
              </span>
            </span>
            <div className="relative flex flex-1 flex-col gap-2">
              <h2 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t("recruiters.upsell.title")}
              </h2>
              <p className="text-[15px] leading-6 text-blanc/75">
                {t("recruiters.upsell.text", {
                  price: companyFrom === null ? "" : formatUsd(companyFrom),
                })}
              </p>
            </div>
            <SiteButton href="/entreprises" tone="lime" className="relative lg:self-center">
              {t("recruiters.upsell.cta")}
            </SiteButton>
          </div>
        </div>
      </section>

      <section aria-hidden className="h-14 bg-papier lg:h-24" />
      <LimeCtaBand
        title={t("recruiters.finalCta.title")}
        text={t("recruiters.finalCta.text")}
        actions={<SiteButton href={signup}>{t("recruiters.finalCta.primary")}</SiteButton>}
      />
    </>
  );
}

/**
 * Hero picture: the Hire pipeline in a Sapin frame, Nadia pointing at it and the « 3 profils
 * suggérés » card. The labels belong to the illustration, described by its alternative.
 */
function HeroVisual({
  alt,
  chipTitle,
  chipText,
}: {
  alt: string;
  chipTitle: string;
  chipText: string;
}) {
  return (
    <>
      <div className="relative pt-4 pb-20 lg:py-16 lg:pl-8">
        <PipelinePreview label={alt} className="jm-float-slow" />
      </div>
      <FloatCard
        className="jm-pop bottom-2 left-3 z-2 flex items-center gap-2.5 lg:bottom-4 lg:-left-2"
        style={stagger(0)}
      >
        <AiOrb size={28} className="jm-pulse" />
        <span className="flex flex-col">
          <span className="text-xs leading-[17px] font-semibold">{chipTitle}</span>
          <span className="text-[11px] leading-[15px] text-ardoise">{chipText}</span>
        </span>
      </FloatCard>
    </>
  );
}

/**
 * Example of a scored application (mockup 01-04): score on the AI gradient, criteria, the
 * « Pourquoi ? » and the two human actions. An illustration: its buttons do nothing.
 */
async function ExampleCard() {
  const t = await getTranslations();
  const score = 87;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const criteria = [
    { key: "requiredSkills", value: 92, status: "met" },
    { key: "experience", value: 80, status: "met" },
    { key: "languages", value: 100, status: "met" },
    { key: "preferredSkills", value: 55, status: "partial" },
  ] as const;
  const name = t("recruiters.example.name");

  return (
    <figure
      data-reveal="zoom"
      className="relative lg:w-[520px] lg:shrink-0"
      aria-label={t("recruiters.matching.imageAlt")}
    >
      <div
        aria-hidden
        className="absolute -inset-x-3 -top-5 bottom-8 rounded-[40px] bg-lime-clair lg:-top-[30px] lg:-right-[30px] lg:bottom-10 lg:left-10"
      />
      <div className="relative flex flex-col gap-4 rounded-[28px] bg-blanc p-5 shadow-[0_30px_60px_rgba(11,26,31,0.16)] ring-1 ring-sapin/6 lg:p-[26px]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lime text-[17px] font-semibold text-sapin"
          >
            {t("recruiters.example.initials")}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{name}</span>
            <span className="text-[11px] leading-[15px] text-ardoise">
              {t("recruiters.example.role")}
            </span>
          </span>
          <span className="relative flex size-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" aria-hidden className="absolute inset-0 size-full -rotate-90">
              <defs>
                <linearGradient id="recruteurs-score" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0F3F37" />
                  <stop offset="1" stopColor="#2FD3A6" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" stroke="#DCE5E1" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                stroke="url(#recruteurs-score)"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - score / 100)}
              />
            </svg>
            <span className="relative text-[15px] font-semibold">
              <CountUp text={t("match.score.value", { score })} />
            </span>
          </span>
        </div>
        <p className="flex flex-wrap gap-2">
          <span className="inline-flex h-[26px] items-center gap-1.5 rounded-pill bg-gradient-ai px-2.5 text-[11px] font-semibold text-blanc">
            <Icon name="intelligence" className="size-3" />
            {t("match.score.compact", { score })}
          </span>
          <span className="inline-flex h-[26px] items-center rounded-pill bg-brume px-2.5 text-[11px] font-semibold">
            {t("match.band.veryHigh.text")}
          </span>
        </p>
        <ul className="flex flex-col gap-3">
          {criteria.map((criterion, index) => (
            <li key={criterion.key} className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between gap-2 text-xs leading-[17px]">
                {t(`match.criterion.${criterion.key}.text`)}
                <span
                  className={cx(
                    "inline-flex h-[22px] items-center rounded-pill px-2.5 text-[11px] font-semibold",
                    criterion.status === "met"
                      ? "bg-lime-clair text-up-texte"
                      : "bg-ambre-fond text-ambre-texte",
                  )}
                >
                  {t(`match.criterion.status.${criterion.status}`)}
                </span>
              </span>
              <span className="block h-2 overflow-hidden rounded-pill bg-brume">
                <span
                  className="jm-fill block h-full rounded-pill bg-gradient-ai"
                  style={{ width: `${criterion.value}%`, animationDelay: `${1.2 + index * 0.2}s` }}
                />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 rounded-[16px] bg-papier px-3.5 py-3">
          <span className="flex items-center gap-2 text-xs leading-[17px] font-semibold">
            <Icon name="eye" className="size-4 shrink-0" />
            {t("match.why.recruiter.title", { score, candidateName: name })}
          </span>
          <span className="text-[11px] leading-[15px] text-ardoise">
            {t("recruiters.example.intro")}
          </span>
          <span className="text-[11px] leading-[15px] text-ambre-texte">
            {t("recruiters.example.missing")}
          </span>
        </div>
        <div aria-hidden className="flex flex-wrap gap-2">
          <span className="inline-flex h-8 items-center rounded-pill bg-nuit px-[13px] text-xs font-semibold text-blanc">
            {t("recruiters.example.shortlist")}
          </span>
          <span className="inline-flex h-8 items-center rounded-pill px-[13px] text-xs font-semibold ring-[1.5px] ring-brume ring-inset">
            {t("recruiters.example.message")}
          </span>
        </div>
        <p className="flex items-start gap-1.5 text-[11px] leading-[15px] text-ardoise">
          <Icon name="info" className="mt-px size-3.5 shrink-0" />
          {t("match.why.recruiter.rule")}
        </p>
      </div>
    </figure>
  );
}
