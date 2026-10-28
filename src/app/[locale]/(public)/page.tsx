/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { AiOrb, Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  ArrowLink,
  ButtonDisc,
  Eyebrow,
  FaqAccordion,
  FloatCard,
  IconTile,
  LimeCtaBand,
  MarketingSection,
  PhotoFrame,
  PoseCycle,
  SectionHead,
  Shape,
  SiteButton,
  StatRow,
  heroTitle,
  lead,
  sectionTitle,
  siteButtonClasses,
  stagger,
} from "@/components/site/marketing";
import { InstallApp } from "@/components/site/install-app";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicCourseCard, PublicJobCard } from "@/components/site/public-cards";
import { buttonClasses } from "@/components/ui";
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
import { splitLastNumber } from "@/lib/numbers";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("home.seo");
  return pageMetadata({
    path: "/",
    title: t("title"),
    description: t("description"),
    ogTitle: t("ogTitle"),
    ogDescription: t("ogDescription"),
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await applySiteLocale(params);
  const t = await getTranslations();
  const tInstall = await getTranslations("system.install");
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
      frame: "lime",
      character: { name: "kofi", pose: "joie" },
    },
    {
      key: "rh",
      href: "/recruteurs",
      frame: "menthe",
      character: { name: "nadia", pose: "montre" },
    },
    {
      key: "companies",
      href: "/entreprises",
      frame: "sapin",
      character: { name: "diallo", pose: "salut" },
    },
  ] as const;

  const steps = [
    { key: "step1", icon: "learn" },
    { key: "step2", icon: "cv" },
    { key: "step3", icon: "jobs" },
    { key: "step4", icon: "connect" },
  ] as const;

  // Prices are read from the plans in the database, never written in the code.
  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));
  const families = [
    {
      key: "talents",
      price: t("home.pricing.talents.price", { price: price(highestPrice(plans, "talent")) }),
      icon: "profil",
    },
    {
      key: "rh",
      price: t("home.pricing.rh.price", { price: price(highestPrice(plans, "rh")) }),
      icon: "hire",
    },
    {
      key: "companies",
      price: t("home.pricing.companies.price", { price: price(lowestPaidPrice(plans, "company")) }),
      icon: "entreprise",
    },
    {
      key: "partners",
      price: t("home.pricing.partners.price"),
      icon: "certificat",
    },
  ] as const;

  const commitments = [
    ["free", "check"],
    ["ai", "eye"],
    ["privacy", "lock"],
    ["payment", "mobile-money"],
  ] as const;

  const stats = (["free", "modules", "why", "payment"] as const).map((key) => ({
    value: t(`home.stats.${key}.value`),
    label: t(`home.stats.${key}.label`),
  }));

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

  // « Learn. Grow. Connect. »: the last word on a Nuit pill.
  const titleWords = t("home.hero.title").split(" ");
  const lastWord = titleWords.pop();
  const matchValue = splitLastNumber(t("home.hero.visual.matchShort"))?.value ?? 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <MotionRoot />

      {/* Hero: a Lime clair panel, the title very large, the app in a picture with its cards */}
      <section className="bg-papier px-2 pt-2 sm:px-3 lg:px-4 lg:pt-3">
        <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[32px] bg-lime-clair px-5 pt-10 pb-8 text-sapin lg:rounded-[48px] lg:px-14 lg:pt-20 lg:pb-12">
          <Shape
            name="forme-orbites-sapin"
            className="jm-drift -top-56 -left-56 w-[640px] opacity-[0.06]"
          />
          <span
            aria-hidden
            className="absolute -right-40 -bottom-40 size-[560px] rounded-full bg-lime/50 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-[1200px] flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
            <div className="flex flex-col gap-6 lg:w-[600px] lg:shrink-0">
              <div className="jm-rise" style={stagger(0)}>
                <Eyebrow>{t("home.hero.eyebrow")}</Eyebrow>
              </div>
              <h1 className={heroTitle}>
                {titleWords.map((word, index) => (
                  <span
                    key={word}
                    className="jm-word mr-[0.22em] inline-block"
                    style={stagger(index)}
                  >
                    {word}
                  </span>
                ))}
                <span
                  className="jm-word inline-block rounded-[0.32em] bg-nuit px-[0.18em] pb-[0.06em] text-lime"
                  style={stagger(titleWords.length)}
                >
                  {lastWord}
                </span>
              </h1>
              <p className={cx(lead, "jm-rise max-w-[540px] text-sapin/85")} style={stagger(3)}>
                {t("home.hero.subtitle")}
              </p>
              <div className="jm-rise flex flex-col gap-3 sm:flex-row" style={stagger(4)}>
                <SiteButton href={signupHref({ profil: "talent" })}>
                  {t("home.hero.ctaPrimary")}
                </SiteButton>
                <SiteButton href="/recruteurs" tone="light">
                  {t("home.hero.ctaSecondary")}
                </SiteButton>
              </div>
              <ul className="jm-rise flex flex-wrap gap-2" style={stagger(5)}>
                {(["reassurance1", "reassurance2", "reassurance3"] as const).map((key) => (
                  <li
                    key={key}
                    className="flex items-center gap-1.5 rounded-pill bg-blanc/70 py-1.5 pr-3 pl-1.5 text-xs leading-[17px] font-semibold"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-lime">
                      <Icon name="check" className="size-3" />
                    </span>
                    {t(`home.hero.${key}`)}
                  </li>
                ))}
              </ul>
              <InstallApp
                id="jm-installer-accueil"
                buttonClassName="inline-flex items-center gap-3 self-start rounded-pill py-1 pr-4 pl-1 text-left text-sm font-semibold hover:bg-blanc/60"
                dialogClassName={installDialog}
                trigger={
                  <>
                    <span className="flex size-10 items-center justify-center rounded-full bg-sapin text-lime">
                      <Icon name="telecharger" className="size-5" />
                    </span>
                    <span className="flex flex-col items-start">
                      {t("system.install.button")}
                      <span className="text-xs font-medium text-sapin/75">
                        {t("system.install.text")}
                      </span>
                    </span>
                  </>
                }
                steps={<InstallSteps t={tInstall} id="jm-installer-accueil" />}
              />
            </div>
            <HeroVisual
              alt={t("home.hero.imageAlt")}
              badge={t("home.hero.visual.badge")}
              matchTitle={t("home.hero.visual.matchTitle")}
              matchText={t("home.hero.visual.matchText")}
              notification={t("home.hero.visual.notification")}
              notificationText={t("home.hero.visual.notificationText")}
              match={matchValue}
            />
          </div>
          <div className="relative mx-auto mt-10 max-w-[1200px] rounded-[28px] bg-blanc/70 px-2 py-6 lg:mt-16 lg:py-8">
            <h2 className="sr-only">{t("home.stats.label")}</h2>
            <StatRow items={stats} />
          </div>
        </div>
      </section>

      {/* For whom? Three cards, each with its picture */}
      <MarketingSection innerClassName="flex flex-col gap-12">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("home.audiences.eyebrow")}
            title={t("home.audiences.title")}
            text={t("home.audiences.subtitle")}
          />
        </div>
        <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
          {audiences.map((audience, index) => (
            <li
              key={audience.key}
              data-reveal
              className="jm-lift group relative flex flex-col overflow-hidden rounded-[32px] bg-blanc p-2 ring-1 ring-sapin/6"
              style={stagger(index)}
            >
              <PhotoFrame
                tone={audience.frame}
                character={{ ...audience.character, height: 230 }}
                className="h-[260px]"
              >
                <span className="absolute top-4 left-4 inline-flex h-7 items-center rounded-pill bg-blanc px-3 text-xs font-semibold text-sapin">
                  {t(`home.audiences.${audience.key}.label`)}
                </span>
              </PhotoFrame>
              <div className="flex flex-1 flex-col gap-3 px-4 pt-5 pb-4 lg:px-5">
                <h3 className="text-[22px] leading-7 font-semibold tracking-[-0.025em]">
                  {t(`home.audiences.${audience.key}.title`)}
                </h3>
                <p className="text-[15px] leading-6 text-ardoise">
                  {t(`home.audiences.${audience.key}.text`)}
                </p>
                <div className="flex-1" />
                <Link
                  href={audience.href}
                  className={cx(
                    siteButtonClasses("dark", "md"),
                    "mt-2 self-start after:absolute after:inset-0",
                  )}
                >
                  {t(`home.audiences.${audience.key}.cta`)}
                  <ButtonDisc size="md" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Journey: four numbered steps beside the app on a phone */}
      <MarketingSection
        tone="blanc"
        innerClassName="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20"
      >
        <div className="flex flex-col gap-8 lg:flex-1">
          <div data-reveal>
            <SectionHead
              eyebrow={t("home.journey.eyebrow")}
              title={t("home.journey.title")}
              text={t("home.journey.subtitle")}
            />
          </div>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li
                key={step.key}
                data-reveal
                className="jm-lift flex gap-4 rounded-[24px] bg-papier p-4 ring-1 ring-sapin/6 lg:p-5"
                style={stagger(index)}
              >
                <span
                  aria-hidden
                  className={cx(
                    "flex size-12 shrink-0 items-center justify-center rounded-full text-[17px] font-semibold",
                    index === 0 ? "bg-nuit text-lime" : "bg-lime text-sapin",
                  )}
                >
                  {String(t(`home.journey.${step.key}.number`)).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-2 text-lg leading-7 font-semibold tracking-[-0.015em]">
                    {t(`home.journey.${step.key}.title`)}
                    <Icon name={step.icon} className="size-[18px] text-feuille-fonce" />
                  </h3>
                  <p className="text-[15px] leading-6 text-ardoise">
                    {t(`home.journey.${step.key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal="zoom" className="lg:w-[460px] lg:shrink-0">
          <PhotoFrame tone="sapin" className="h-[520px] lg:h-[600px]">
            <div className="jm-float absolute top-10 left-1/2 -translate-x-1/2">
              <div className="h-[480px] w-[230px] overflow-hidden rounded-[30px] shadow-[0_30px_60px_rgba(0,0,0,0.45)] ring-[6px] ring-nuit lg:h-[520px] lg:w-[250px]">
                <img
                  src="/apercus/talents-tableau-de-bord-mobile.webp"
                  alt={t("home.hero.imageAlt")}
                  width={250}
                  height={541}
                  loading="lazy"
                  className="jm-screen w-full max-w-none"
                  style={{ "--jm-scroll": "-60px" } as CSSProperties}
                />
              </div>
            </div>
            <FloatCard className="jm-pop bottom-10 left-3 flex items-center gap-2.5 lg:-left-8">
              <span className="flex size-9 items-center justify-center rounded-full bg-lime">
                <Icon name="certificat" className="size-[18px]" />
              </span>
              <span className="text-[13px] leading-[18px] font-semibold">
                {t("home.hero.visual.badge")}
              </span>
            </FloatCard>
          </PhotoFrame>
        </div>
      </MarketingSection>

      {/* Modules: a bento of the five services and the AI that links them */}
      <MarketingSection innerClassName="flex flex-col gap-12">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("home.modules.eyebrow")}
            title={t("home.modules.title")}
            text={t("home.modules.subtitle")}
          />
        </div>
        <ul className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <ModuleCard
            name={t("home.modules.learn.name")}
            text={t("home.modules.learn.text")}
            icon="learn"
            preview="talents-module-learn"
            className="lg:col-span-2"
            wide
          />
          <li
            data-reveal
            className="jm-lift relative flex flex-col gap-4 overflow-hidden rounded-[32px] bg-sapin p-6 text-blanc lg:p-8"
          >
            <Shape
              name="forme-orbites-lime"
              className="jm-drift -right-24 -bottom-24 w-[300px] opacity-20"
            />
            <AiOrb size={52} className="jm-pulse" />
            <h3 className="text-2xl leading-[30px] font-semibold tracking-[-0.025em]">
              {t("home.modules.intelligence.name")}
            </h3>
            <p className="relative text-[15px] leading-6 text-blanc/80">
              {t("home.modules.intelligence.text")}
            </p>
            <div
              aria-hidden
              className="relative mt-auto flex flex-col gap-2 rounded-[20px] bg-blanc p-4 text-sapin"
            >
              <span className="text-sm font-semibold">{t("home.hero.visual.matchTitle")}</span>
              <span className="h-2 overflow-hidden rounded-pill bg-brume">
                <span
                  className="jm-fill block h-full rounded-pill bg-lime"
                  style={{ width: `${matchValue}%` }}
                />
              </span>
              <span className="text-xs font-semibold text-feuille-fonce">
                <CountUp text={t("home.hero.visual.matchShort")} />
              </span>
            </div>
            <Link
              href="/comment-fonctionne-le-matching"
              className="relative inline-flex items-center gap-2 self-start rounded-pill bg-lime py-2 pr-4 pl-2 text-sm font-semibold text-sapin"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-nuit text-lime">
                <Icon name="eye" className="size-4" />
              </span>
              {t("common.why")}
            </Link>
          </li>
          <ModuleCard
            name={t("home.modules.career.name")}
            text={t("home.modules.career.text")}
            icon="career"
            preview="talents-module-career"
          />
          <ModuleCard
            name={t("home.modules.jobs.name")}
            text={t("home.modules.jobs.text")}
            icon="jobs"
            preview="talents-module-jobs"
            tint
          />
          <ModuleCard
            name={t("home.modules.hire.name")}
            text={t("home.modules.hire.text")}
            icon="hire"
            preview="accueil-module-hire"
          />
          <ModuleCard
            name={t("home.modules.connect.name")}
            text={t("home.modules.connect.text")}
            icon="connect"
            preview="talents-module-connect"
            className="lg:col-span-3"
            wide
          />
        </ul>
      </MarketingSection>

      {/* Trainings */}
      <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
        <div
          data-reveal
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <SectionHead
            eyebrow={t("home.trainings.eyebrow")}
            title={t("home.trainings.title")}
            text={t("home.trainings.subtitle")}
          />
          <SiteButton href="/formations" tone="light" className="self-start lg:self-auto">
            {t("home.trainings.cta")}
          </SiteButton>
        </div>
        {courses.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {courses.map((course, index) => (
              <li
                key={course.slug}
                data-reveal
                className={cx("jm-lift rounded-[28px]", index >= 2 && "hidden sm:block")}
                style={stagger(index)}
              >
                <PublicCourseCard course={course} plans={plans} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[28px] bg-papier p-6 text-ardoise">{t("home.trainings.empty")}</p>
        )}
      </MarketingSection>

      {/* Latest jobs */}
      <MarketingSection innerClassName="flex flex-col gap-10">
        <div
          data-reveal
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <SectionHead
            eyebrow={t("home.jobs.eyebrow")}
            title={t("home.jobs.title")}
            text={t("home.jobs.subtitle")}
          />
          <SiteButton href="/offres" className="self-start lg:self-auto">
            {t("home.jobs.cta")}
          </SiteButton>
        </div>
        {latest.jobs.length > 0 ? (
          <ul className="grid gap-4 lg:grid-cols-2 lg:gap-5">
            {latest.jobs.map((job, index) => (
              <li
                key={job.slug}
                data-reveal
                className={cx("jm-lift rounded-[28px]", index >= 2 && "hidden lg:block")}
                style={stagger(index)}
              >
                <PublicJobCard job={job} now={latest.now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[28px] bg-blanc p-6 text-ardoise">{t("home.jobs.empty")}</p>
        )}
        <div className="lg:flex lg:justify-center">
          <ArrowLink href={signupHref({ profil: "rh" })} className="text-feuille-fonce">
            {t("home.jobs.recruiterCta")}
          </ArrowLink>
        </div>
      </MarketingSection>

      {/* Plans: a Sapin panel, prices read from the database */}
      <MarketingSection
        tone="sapin"
        background={
          <Shape
            name="forme-orbites-lime"
            className="-bottom-64 -left-64 w-[720px] opacity-[0.08]"
          />
        }
        innerClassName="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <SectionHead
            dark
            eyebrow={t("home.pricing.eyebrow")}
            title={t("home.pricing.title")}
            text={t("home.pricing.subtitle")}
          />
          <p className="flex items-center gap-3 rounded-[20px] bg-blanc/8 px-4 py-3 text-sm leading-5 text-blanc/85 ring-1 ring-blanc/12 ring-inset">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-sapin">
              <Icon name="mobile-money" className="size-[18px]" />
            </span>
            {t("home.pricing.payment")}
          </p>
          <SiteButton href="/tarifs" tone="lime" className="self-start">
            {t("home.pricing.cta")}
          </SiteButton>
        </div>
        <ul className="grid flex-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {families.map((family, index) => (
            <li
              key={family.key}
              data-reveal="zoom"
              className={cx(
                "jm-lift flex flex-col gap-3 rounded-[28px] p-6 lg:p-7",
                index === 0
                  ? "bg-lime text-sapin"
                  : "bg-blanc/8 text-blanc ring-1 ring-blanc/12 ring-inset",
              )}
              style={stagger(index)}
            >
              <IconTile
                icon={family.icon}
                size={48}
                className={index === 0 ? "bg-nuit text-lime" : "bg-lime text-sapin"}
              />
              <h3 className="text-base leading-6 font-semibold">
                {t(`home.pricing.${family.key}.name`)}
              </h3>
              <p
                className={cx(
                  "text-[28px] leading-[34px] font-semibold tracking-[-0.03em]",
                  index === 0 ? "text-sapin" : "text-lime",
                )}
              >
                <CountUp text={family.price} />
              </p>
              <p
                className={cx(
                  "text-sm leading-[22px]",
                  index === 0 ? "text-sapin/85" : "text-blanc/75",
                )}
              >
                {t(`home.pricing.${family.key}.text`)}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Commitments */}
      <MarketingSection innerClassName="flex flex-col gap-12">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("home.trust.eyebrow")}
            title={t("home.trust.title")}
            text={t("home.trust.subtitle")}
          />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {commitments.map(([key, icon], index) => (
            <li
              key={key}
              data-reveal
              className="jm-lift flex flex-col gap-4 rounded-[28px] bg-blanc p-6 ring-1 ring-sapin/6 lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={icon} className="bg-lime-clair text-sapin" />
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.02em]">
                {t(`home.trust.${key}.title`)}
              </h3>
              <p className="text-[15px] leading-6 text-ardoise">{t(`home.trust.${key}.text`)}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {testimonials.length > 0 && (
        <MarketingSection tone="blanc" innerClassName="flex flex-col gap-10">
          <SectionHead center title={t("home.testimonials.title")} />
          <ul className="grid gap-3.5 md:grid-cols-3 lg:gap-5">
            {testimonials.map((text) => (
              <li key={text} className="rounded-[28px] bg-papier p-7 text-[15px] leading-7">
                {text}
              </li>
            ))}
          </ul>
        </MarketingSection>
      )}

      {/* FAQ */}
      <MarketingSection
        tone="blanc"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:w-[380px] lg:shrink-0">
          <Eyebrow>{t("home.faq.eyebrow")}</Eyebrow>
          <h2 className={cx(sectionTitle, "lg:max-w-[300px]")}>{t("home.faq.title")}</h2>
          <SiteButton href="/faq" tone="light" className="self-start">
            {t("home.faq.cta")}
          </SiteButton>
          <span className="hidden lg:block">
            <PoseCycle name="fatou" poses={["montre", "joie"]} height={240} />
          </span>
        </div>
        <div data-reveal className="min-w-0 flex-1" style={stagger(1)}>
          <FaqAccordion onWhite items={faqItems(messages, overrides, "home.faq")} />
        </div>
      </MarketingSection>

      <LimeCtaBand
        spacedTop
        title={t("home.finalCta.title")}
        text={t("home.finalCta.text")}
        character={{ name: "kofi", pose: "joie", height: 340, mobileHeight: 260 }}
        actions={
          <>
            <SiteButton href={signupHref()}>{t("home.finalCta.primary")}</SiteButton>
            <SiteButton href="/connexion" tone="light">
              {t("home.finalCta.secondary")}
            </SiteButton>
          </>
        }
      />
    </>
  );
}

/** A card of the modules bento: icon, name, text and a preview of the screen. */
function ModuleCard({
  name,
  text,
  icon,
  preview,
  className,
  wide = false,
  tint = false,
}: {
  name: string;
  text: string;
  icon: IconName;
  preview: string;
  className?: string;
  /** Text beside the preview from desktop up. */
  wide?: boolean;
  /** Lime clair ground instead of white. */
  tint?: boolean;
}) {
  return (
    <li
      data-reveal
      className={cx(
        "jm-lift flex flex-col gap-4 overflow-hidden rounded-[32px] p-6 text-sapin ring-1 ring-sapin/6 lg:p-8",
        tint ? "bg-lime-clair" : "bg-blanc",
        wide && "lg:flex-row lg:items-center lg:gap-10 lg:pr-0 lg:pb-0",
        className,
      )}
    >
      <div className={cx("flex flex-col gap-3", wide && "lg:w-[340px] lg:shrink-0 lg:pb-8")}>
        <IconTile icon={icon} size={52} className="bg-nuit text-lime" />
        <h3 className="text-2xl leading-[30px] font-semibold tracking-[-0.025em]">{name}</h3>
        <p className="text-[15px] leading-6 text-ardoise">{text}</p>
      </div>
      <div
        className={cx(
          "relative mt-auto -mr-6 -mb-6 h-44 overflow-hidden rounded-tl-[22px] bg-papier shadow-[0_-8px_30px_rgba(11,26,31,0.12)] lg:-mr-8 lg:-mb-8 lg:h-52",
          wide && "lg:mr-0 lg:mb-0 lg:h-64 lg:flex-1",
        )}
      >
        <img
          src={`/apercus/${preview}.webp`}
          alt=""
          width={1350}
          height={800}
          loading="lazy"
          decoding="async"
          className="jm-pan-shot size-full object-cover object-left-top"
        />
      </div>
    </li>
  );
}

const installDialog =
  "mx-auto mt-auto mb-0 w-full max-w-none rounded-t-[28px] bg-blanc p-6 pb-8 text-sapin shadow-float backdrop:bg-nuit/55 sm:mb-auto sm:max-w-md sm:rounded-[28px]";

/** The three steps of Safari on iPhone (« Installer l'appli »), in the dialog of the hero. */
function InstallSteps({
  t,
  id,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"system.install">>>;
  id: string;
}) {
  const steps = [
    { key: "step1", icon: "partager" },
    { key: "step2", icon: "ajouter" },
    { key: "step3", icon: "valider" },
  ] as const;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id={`${id}-t`} className="text-xl leading-7 font-semibold tracking-[-0.01em]">
          {t("ios.title")}
        </h2>
        <form method="dialog">
          <button
            type="submit"
            aria-label={t("ios.close")}
            className="-mt-1 -mr-2 flex size-11 items-center justify-center rounded-full text-sapin hover:bg-sapin/6"
          >
            <Icon name="fermer" />
          </button>
        </form>
      </div>
      <p className="text-sm leading-5 text-ardoise">{t("ios.intro")}</p>
      <ol aria-label={t("ios.steps")} className="flex flex-col gap-4">
        {steps.map(({ key, icon }, index) => (
          <li key={key} className="flex items-start gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold text-sapin"
            >
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              <b className="flex items-center gap-2 text-[15px] leading-5 font-semibold">
                {t(`ios.${key}.title`)}
                <Icon name={icon} className="size-[18px] shrink-0 text-sapin/70" />
              </b>
              <span className="text-sm leading-5 text-ardoise">{t(`ios.${key}.text`)}</span>
            </span>
          </li>
        ))}
      </ol>
      <form method="dialog">
        <button
          type="submit"
          className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
        >
          {t("ios.done")}
        </button>
      </form>
    </div>
  );
}

/**
 * Hero picture: the app on a phone in a Sapin frame, a character, and the cards of a real day on
 * Jumanly floating over it (a compatible offer with its score, a new offer, a certificate).
 * Decorative labels belong to the illustration, described by the image's alternative text.
 */
function HeroVisual({
  alt,
  badge,
  matchTitle,
  matchText,
  notification,
  notificationText,
  match,
}: {
  alt: string;
  badge: string;
  matchTitle: string;
  matchText: string;
  notification: string;
  notificationText: string;
  match: number;
}) {
  return (
    <div className="jm-rise relative min-w-0 flex-1" style={stagger(2)}>
      <PhotoFrame tone="sapin" className="h-[440px] sm:h-[520px] lg:ml-8 lg:h-[600px]">
        <div className="jm-float absolute top-8 left-1/2 -translate-x-1/2 lg:top-12 lg:left-[44%]">
          <div className="h-[400px] w-[190px] overflow-hidden rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.45)] ring-[6px] ring-nuit sm:h-[470px] sm:w-[220px] lg:h-[520px] lg:w-[240px]">
            <img
              src="/apercus/accueil-tableau-de-bord-mobile.webp"
              alt={alt}
              width={240}
              height={519}
              fetchPriority="high"
              className="jm-screen w-full max-w-none"
              style={{ "--jm-scroll": "-90px" } as CSSProperties}
            />
          </div>
        </div>
        <div className="jm-breathe absolute right-0 bottom-0 max-sm:hidden lg:-right-4">
          <Character name="amani" pose="telephone" height={260} />
        </div>
      </PhotoFrame>
      <FloatCard
        className="jm-pop top-6 -left-1 flex w-[230px] flex-col gap-2 sm:w-[260px] lg:top-24 lg:-left-6"
        style={stagger(0)}
      >
        <div className="flex items-center gap-2.5">
          <AiOrb size={30} className="jm-pulse" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] leading-[18px] font-semibold">{matchTitle}</span>
            <span className="text-[11px] leading-[15px] text-ardoise">
              <CountUp text={matchText} />
            </span>
          </div>
        </div>
        <span className="h-1.5 overflow-hidden rounded-pill bg-brume">
          <span
            className="jm-fill block h-full rounded-pill bg-lime"
            style={{ width: `${match}%` }}
          />
        </span>
      </FloatCard>
      <FloatCard
        className="jm-pop -right-1 bottom-24 flex items-center gap-2.5 py-2.5 pr-4 pl-2.5 lg:right-auto lg:bottom-16 lg:left-0"
        style={stagger(1)}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-lime text-sapin">
          <Icon name="notification" className="size-[18px]" />
        </span>
        <span className="flex flex-col">
          <span className="text-[13px] leading-[18px] font-semibold">{notification}</span>
          <span className="text-[11px] leading-[15px] text-ardoise">{notificationText}</span>
        </span>
      </FloatCard>
      <span
        aria-hidden
        className="jm-pop absolute top-4 right-4 flex items-center gap-2 rounded-pill bg-lime py-1.5 pr-3.5 pl-1.5 text-xs font-semibold text-sapin shadow-[0_10px_30px_rgba(11,26,31,0.25)] max-sm:hidden lg:top-8 lg:right-8"
        style={stagger(2)}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-nuit text-lime">
          <Icon name="certificat" className="size-3.5" />
        </span>
        {badge}
      </span>
    </div>
  );
}
