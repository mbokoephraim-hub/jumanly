/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { AiOrb, Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  ArrowLink,
  Eyebrow,
  FaqAccordion,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  NumberDisc,
  Pattern,
  SectionHead,
  Shape,
  lead,
  outlineOnLime,
  sectionTitle,
} from "@/components/site/marketing";
import { PublicCourseCard, PublicJobCard } from "@/components/site/public-cards";
import { ButtonLink } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { withoutPlaceholders } from "@/lib/placeholders";
import { signupHref } from "@/lib/signup";
import {
  getContentOverrides,
  getFeaturedCourses,
  getLatestJobs,
  getPublicPlans,
} from "@/server/queries/public";
import { faqItems } from "@/server/services/contents";
import { highestPrice, lowestPaidPrice } from "@/server/services/plans";
import { jsonLdScript, pageMetadata, siteJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.seo");
  return pageMetadata({
    path: "/",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
  });
}

const chevron = <Icon name="chev-r" />;

export default async function HomePage() {
  const t = await getTranslations();
  const [plans, courses, latest, messages, overrides] = await Promise.all([
    getPublicPlans(),
    getFeaturedCourses(),
    getLatestJobs(),
    getMessages(),
    getContentOverrides(),
  ]);

  const audiences = [
    {
      key: "talents",
      href: "/talents",
      card: "bg-lime text-sapin",
      tag: "bg-sapin text-neon",
      link: "text-sapin",
      character: { name: "kofi", pose: "joie" },
    },
    {
      key: "rh",
      href: "/recruteurs",
      card: "bg-neon text-sapin",
      tag: "bg-sapin text-neon",
      link: "text-sapin",
      character: { name: "nadia", pose: "montre" },
    },
    {
      key: "companies",
      href: "/entreprises",
      card: "bg-sapin text-blanc",
      tag: "bg-lime text-sapin",
      link: "text-lime",
      character: { name: "diallo", pose: "salut" },
    },
  ] as const;

  const steps = [
    { key: "step1", icon: "learn", disc: "bg-lime text-sapin" },
    { key: "step2", icon: "cv", disc: "bg-neon text-sapin" },
    { key: "step3", icon: "jobs", disc: "bg-menthe-claire text-sapin" },
    { key: "step4", icon: "connect", disc: "bg-sapin text-lime" },
  ] as const;

  const modules: {
    key: "learn" | "career" | "jobs" | "hire" | "connect";
    icon: IconName;
    card: string;
  }[] = [
    { key: "learn", icon: "learn", card: "bg-lime" },
    { key: "career", icon: "career", card: "bg-neon" },
    { key: "jobs", icon: "jobs", card: "bg-menthe-claire" },
    { key: "hire", icon: "hire", card: "bg-brume" },
    { key: "connect", icon: "connect", card: "bg-blanc" },
  ];

  // Prices are read from the plans in the database, never written in the code.
  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));
  const families = [
    {
      key: "talents",
      price: t("home.pricing.talents.price", { price: price(highestPrice(plans, "talent")) }),
      icon: "profil",
      card: "bg-creme text-sapin",
      tile: "bg-blanc text-sapin",
    },
    {
      key: "rh",
      price: t("home.pricing.rh.price", { price: price(highestPrice(plans, "rh")) }),
      icon: "hire",
      card: "bg-creme text-sapin",
      tile: "bg-blanc text-sapin",
    },
    {
      key: "companies",
      price: t("home.pricing.companies.price", { price: price(lowestPaidPrice(plans, "company")) }),
      icon: "entreprise",
      card: "bg-sapin text-blanc",
      tile: "bg-lime text-sapin",
    },
    {
      key: "partners",
      price: t("home.pricing.partners.price"),
      icon: "certificat",
      card: "bg-lime text-sapin",
      tile: "bg-sapin text-lime",
    },
  ] as const;

  const commitments = [
    ["free", "check"],
    ["ai", "eye"],
    ["privacy", "lock"],
    ["payment", "mobile-money"],
  ] as const;

  // The testimonials block stays hidden as long as it only holds placeholders.
  const testimonials = (["item1", "item2", "item3"] as const)
    .map((key) => withoutPlaceholders(t(`home.testimonials.${key}`)))
    .filter((text): text is string => text !== null);

  const structuredData = siteJsonLd({
    name: t("common.brand"),
    description: t("home.seo.description"),
    slogan: t("common.slogan"),
    publisher: t("common.seo.publisher"),
    emails: [t("footer.col.contact.pro"), t("footer.col.contact.general")],
  });

  // « Learn. Grow. Connect. »: the last word on the signature gradient.
  const titleWords = t("home.hero.title").split(" ");
  const lastWord = titleWords.pop();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />

      {/* Hero */}
      <MarketingSection className="pt-10 pb-14 lg:pt-16 lg:pb-24">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:gap-14">
          <div className="flex flex-col gap-6 xl:w-[560px] xl:shrink-0">
            <Eyebrow>{t("home.hero.eyebrow")}</Eyebrow>
            <h1 className="text-[36px] leading-10 font-semibold tracking-[-0.035em] lg:text-[76px] lg:leading-[78px]">
              {titleWords.map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
              <span className="block bg-gradient-signature bg-clip-text text-transparent">
                {lastWord}
              </span>
            </h1>
            <p className={cx(lead, "text-ardoise")}>{t("home.hero.subtitle")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={signupHref({ profil: "talent" })} size="lg" iconAfter={chevron}>
                {t("home.hero.ctaPrimary")}
              </ButtonLink>
              <ButtonLink href="/recruteurs" variant="tertiary" size="lg">
                {t("home.hero.ctaSecondary")}
              </ButtonLink>
            </div>
            <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 xl:flex-nowrap">
              {(["reassurance1", "reassurance2", "reassurance3"] as const).map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-xs leading-[17px] font-medium whitespace-nowrap"
                >
                  <Icon name="check" className="size-4 text-feuille-fonce" />
                  {t(`home.hero.${key}`)}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual
            alt={t("home.hero.imageAlt")}
            badge={t("home.hero.visual.badge")}
            matchTitle={t("home.hero.visual.matchTitle")}
            matchText={t("home.hero.visual.matchText")}
            matchShort={t("home.hero.visual.matchShort")}
          />
        </div>
      </MarketingSection>

      {/* For whom? */}
      <MarketingSection tone="blanc" innerClassName="flex flex-col gap-12">
        <SectionHead
          center
          eyebrow={t("home.audiences.eyebrow")}
          title={t("home.audiences.title")}
          text={t("home.audiences.subtitle")}
        />
        <ul className="grid gap-3.5 md:grid-cols-3 lg:gap-5">
          {audiences.map((audience) => (
            <li
              key={audience.key}
              className={cx(
                "relative flex min-h-[380px] flex-col gap-3 overflow-hidden rounded-box px-5 pt-5 lg:min-h-[470px] lg:rounded-card lg:px-7 lg:pt-7",
                audience.card,
              )}
            >
              <span
                className={cx(
                  "inline-flex h-6 items-center self-start rounded-pill px-2.5 text-[11px] font-semibold",
                  audience.tag,
                )}
              >
                {t(`home.audiences.${audience.key}.label`)}
              </span>
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t(`home.audiences.${audience.key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] opacity-85">
                {t(`home.audiences.${audience.key}.text`)}
              </p>
              <ArrowLink href={audience.href} stretched className={audience.link}>
                {t(`home.audiences.${audience.key}.cta`)}
              </ArrowLink>
              <div className="flex-1" />
              <div className="-mr-3 flex justify-end">
                <span className="lg:hidden">
                  <Character {...audience.character} height={200} />
                </span>
                <span className="hidden lg:block">
                  <Character {...audience.character} height={230} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Journey */}
      <MarketingSection innerClassName="flex flex-col gap-12">
        <SectionHead
          center
          eyebrow={t("home.journey.eyebrow")}
          title={t("home.journey.title")}
          text={t("home.journey.subtitle")}
        />
        <ol className="relative grid gap-3.5 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <li
            aria-hidden
            className="absolute top-[50px] right-[60px] left-[60px] hidden h-[3px] rounded-[3px] bg-[linear-gradient(90deg,#A6F26B,#E3F67C,#BFEFDF,#0F3F37)] lg:block"
          />
          {steps.map((step) => (
            <li
              key={step.key}
              className="relative flex flex-col gap-3 rounded-box bg-blanc p-5 lg:rounded-card lg:p-7"
            >
              <div className="flex items-center justify-between">
                <NumberDisc className={step.disc}>
                  {t(`home.journey.${step.key}.number`)}
                </NumberDisc>
                <IconTile icon={step.icon} size={48} className="bg-creme text-sapin" />
              </div>
              <h3 className="mt-2 text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t(`home.journey.${step.key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-ardoise">
                {t(`home.journey.${step.key}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      {/* Modules */}
      <MarketingSection
        tone="sapin"
        background={<Pattern name="motif-reseau-sombre" opacity={0.25} />}
        innerClassName="flex flex-col gap-12"
      >
        <SectionHead
          center
          dark
          eyebrow={t("home.modules.eyebrow")}
          title={t("home.modules.title")}
          text={t("home.modules.subtitle")}
        />
        <ul className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {modules.map((module) => (
            <li
              key={module.key}
              className={cx(
                "flex flex-col gap-3 rounded-box p-5 text-sapin lg:rounded-card lg:p-7",
                module.card,
              )}
            >
              <IconTile icon={module.icon} className="bg-sapin text-lime" />
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t(`home.modules.${module.key}.name`)}
              </h3>
              <p className="text-[15px] leading-[23px] opacity-80">
                {t(`home.modules.${module.key}.text`)}
              </p>
            </li>
          ))}
          <li className="relative flex flex-col gap-3 overflow-hidden rounded-box bg-gradient-ai p-5 text-blanc lg:rounded-card lg:p-7">
            <Shape
              name="forme-orbites-lime"
              className="-right-[90px] -bottom-[90px] w-[300px] opacity-25"
            />
            <AiOrb size={40} />
            <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("home.modules.intelligence.name")}
            </h3>
            <p className="relative text-[15px] leading-[23px] text-blanc/85">
              {t("home.modules.intelligence.text")}
            </p>
            <Link
              href="/comment-fonctionne-le-matching"
              className="relative inline-flex items-center gap-1.5 self-start font-semibold text-neon hover:underline"
            >
              <Icon name="eye" className="size-4" />
              {t("common.why")}
            </Link>
          </li>
        </ul>
      </MarketingSection>

      {/* Trainings */}
      <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead
            eyebrow={t("home.trainings.eyebrow")}
            title={t("home.trainings.title")}
            text={t("home.trainings.subtitle")}
          />
          <ButtonLink
            href="/formations"
            variant="tertiary"
            iconAfter={chevron}
            className="self-end lg:self-auto"
          >
            {t("home.trainings.cta")}
          </ButtonLink>
        </div>
        {courses.length > 0 ? (
          <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {courses.map((course, index) => (
              <li key={course.slug} className={cx(index >= 2 && "hidden sm:block")}>
                <PublicCourseCard course={course} plans={plans} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-box bg-creme p-6 text-ardoise">{t("home.trainings.empty")}</p>
        )}
      </MarketingSection>

      {/* Latest jobs */}
      <MarketingSection innerClassName="flex flex-col gap-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead
            eyebrow={t("home.jobs.eyebrow")}
            title={t("home.jobs.title")}
            text={t("home.jobs.subtitle")}
          />
          <ButtonLink
            href="/offres"
            variant="tertiary"
            iconAfter={chevron}
            className="self-end lg:self-auto"
          >
            {t("home.jobs.cta")}
          </ButtonLink>
        </div>
        {latest.jobs.length > 0 ? (
          <ul className="grid gap-3.5 lg:grid-cols-2 lg:gap-5">
            {latest.jobs.map((job, index) => (
              <li key={job.slug} className={cx(index >= 2 && "hidden lg:block")}>
                <PublicJobCard job={job} now={latest.now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-box bg-blanc p-6 text-ardoise">{t("home.jobs.empty")}</p>
        )}
        <div className="lg:flex lg:justify-center">
          <ArrowLink
            href={signupHref({ profil: "rh" })}
            className="w-full justify-between text-feuille-fonce lg:w-auto lg:justify-center"
          >
            {t("home.jobs.recruiterCta")}
          </ArrowLink>
        </div>
      </MarketingSection>

      {/* Plans */}
      <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
        <SectionHead
          center
          eyebrow={t("home.pricing.eyebrow")}
          title={t("home.pricing.title")}
          text={t("home.pricing.subtitle")}
        />
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {families.map((family) => (
            <li
              key={family.key}
              className={cx(
                "flex flex-col gap-3 rounded-box p-5 lg:rounded-card lg:p-7",
                family.card,
              )}
            >
              <IconTile icon={family.icon} size={48} className={family.tile} />
              <h3 className="text-[15px] leading-6 font-semibold">
                {t(`home.pricing.${family.key}.name`)}
              </h3>
              <p className="text-[26px] leading-8 font-semibold tracking-[-0.02em]">
                {family.price}
              </p>
              <p className="text-sm leading-[22px] opacity-80">
                {t(`home.pricing.${family.key}.text`)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4 rounded-box bg-creme px-6 py-[18px] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-xs leading-[17px] font-medium">
            <Icon name="mobile-money" className="size-5 shrink-0" />
            {t("home.pricing.payment")}
          </p>
          <ButtonLink href="/tarifs" variant="secondary" iconAfter={chevron}>
            {t("home.pricing.cta")}
          </ButtonLink>
        </div>
      </MarketingSection>

      {/* Commitments */}
      <MarketingSection tone="sapin" innerClassName="flex flex-col gap-12">
        <SectionHead
          center
          dark
          eyebrow={t("home.trust.eyebrow")}
          title={t("home.trust.title")}
          text={t("home.trust.subtitle")}
        />
        <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {commitments.map(([key, icon]) => (
            <li
              key={key}
              className="flex flex-col gap-3 rounded-box bg-blanc/7 p-5 ring-1 ring-blanc/12 ring-inset lg:rounded-card lg:p-7"
            >
              <IconTile icon={icon} className="bg-lime text-sapin" />
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:leading-[30px]">
                {t(`home.trust.${key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-blanc/70">
                {t(`home.trust.${key}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {testimonials.length > 0 && (
        <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
          <SectionHead center title={t("home.testimonials.title")} />
          <ul className="grid gap-3.5 md:grid-cols-3 lg:gap-5">
            {testimonials.map((text) => (
              <li key={text} className="rounded-card bg-creme p-7 text-[15px] leading-7">
                {text}
              </li>
            ))}
          </ul>
        </MarketingSection>
      )}

      {/* FAQ */}
      <MarketingSection innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20">
        <div className="flex flex-col gap-5 lg:w-[380px] lg:shrink-0">
          <Eyebrow>{t("home.faq.eyebrow")}</Eyebrow>
          <h2 className={cx(sectionTitle, "lg:max-w-[260px]")}>{t("home.faq.title")}</h2>
          <ButtonLink href="/faq" variant="tertiary" iconAfter={chevron} className="self-start">
            {t("home.faq.cta")}
          </ButtonLink>
          <span className="hidden lg:block">
            <Character name="fatou" pose="montre" height={240} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <FaqAccordion items={faqItems(messages, overrides, "home.faq")} />
        </div>
      </MarketingSection>

      <LimeCtaBand
        title={t("home.finalCta.title")}
        text={t("home.finalCta.text")}
        character={{ name: "kofi", pose: "joie", height: 340, mobileHeight: 260 }}
        actions={
          <>
            <ButtonLink href={signupHref()} variant="secondary" size="lg" iconAfter={chevron}>
              {t("home.finalCta.primary")}
            </ButtonLink>
            <ButtonLink href="/connexion" variant="tertiary" size="lg" className={outlineOnLime}>
              {t("home.finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}

/**
 * Hero visual (mockup 01-01): previews of the app, desktop and mobile, on a Sapin panel with the
 * « Trajectoires » pattern, Amani with her phone, and two floating cards. Decorative labels are
 * part of the illustration, described by the image's alternative text.
 */
function HeroVisual({
  alt,
  badge,
  matchTitle,
  matchText,
  matchShort,
}: {
  alt: string;
  badge: string;
  matchTitle: string;
  matchText: string;
  matchShort: string;
}) {
  const shadow = "shadow-[0_30px_60px_rgba(0,0,0,0.35)]";
  return (
    <>
      {/* Desktop: 640 px stage */}
      <div className="relative hidden h-[640px] min-w-0 flex-1 xl:block">
        <div className="absolute inset-y-0 right-0 left-[30px] overflow-hidden rounded-[40px] bg-sapin">
          <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.4} />
          <Shape name="forme-halo-couleur" className="-top-40 -right-40 w-[560px] opacity-55" />
          <img
            src="/apercus/accueil-tableau-de-bord-desktop.webp"
            alt={alt}
            width={720}
            height={512}
            fetchPriority="high"
            className={cx(
              "absolute top-[84px] left-[70px] w-[720px] max-w-none rounded-md",
              shadow,
            )}
          />
        </div>
        <img
          src="/apercus/accueil-tableau-de-bord-mobile.webp"
          alt=""
          width={196}
          height={424}
          className={cx("absolute top-[250px] left-0 w-[196px] rounded-[28px]", shadow)}
        />
        <div className="absolute -right-[30px] bottom-0">
          <Character name="amani" pose="telephone" height={280} />
        </div>
        <div
          aria-hidden
          className="absolute bottom-[46px] left-[240px] flex items-center gap-2.5 rounded-md bg-blanc px-4 py-3 shadow-[0_18px_40px_rgba(11,26,31,0.22)]"
        >
          <AiOrb size={30} />
          <div className="flex flex-col">
            <span className="text-xs leading-[17px] font-semibold">{matchTitle}</span>
            <span className="text-[11px] leading-[15px] text-ardoise">{matchText}</span>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute top-[22px] right-[250px] flex items-center gap-2.5 rounded-pill bg-lime py-2 pr-4 pl-2"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-sapin text-lime">
            <Icon name="certificat" className="size-4" />
          </span>
          <span className="text-xs leading-[17px] font-semibold">{badge}</span>
        </div>
      </div>

      {/* Mobile and tablet: phone preview on a 380 px panel */}
      <div className="relative mt-2 h-[380px] overflow-hidden rounded-card bg-sapin xl:hidden">
        <Pattern name="motif-trajectoires-sombre" size={300} opacity={0.4} />
        <img
          src="/apercus/accueil-tableau-de-bord-mobile.webp"
          alt={alt}
          width={210}
          height={454}
          className="absolute top-[34px] left-1/2 w-[210px] -translate-x-1/2 rounded-[26px] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
        />
        <span
          aria-hidden
          className="absolute bottom-[22px] left-3 inline-flex h-[34px] items-center gap-1.5 rounded-pill bg-blanc px-3 text-[11px] font-semibold"
        >
          <AiOrb size={18} />
          {matchShort}
        </span>
      </div>
    </>
  );
}
