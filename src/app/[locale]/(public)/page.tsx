import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand";
import { Icon } from "@/components/brand/icon";
import {
  ArrowLink,
  Eyebrow,
  FaqAccordion,
  LimeCtaBand,
  MarketingSection,
  SectionHead,
  SiteButton,
  lead,
  sectionTitle,
  stagger,
} from "@/components/site/marketing";
import { MenuArt, type MenuArtName } from "@/components/site/menu-art";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicCourseCard, PublicJobCard } from "@/components/site/public-cards";
import { cx } from "@/lib/cx";
import { formatUsd } from "@/lib/money";
import { withoutPlaceholders } from "@/lib/placeholders";
import { joinHref, signupOpen } from "@/lib/signup";
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
      art: "talents",
    },
    {
      key: "rh",
      href: "/recruteurs",
      art: "recruiters",
    },
    {
      key: "companies",
      href: "/entreprises",
      art: "companies",
    },
  ] as const;

  const steps = [
    { key: "step1", art: "trainings" },
    { key: "step2", art: "cv" },
    { key: "step3", art: "jobs" },
    { key: "step4", art: "connect" },
  ] as const;

  // Prices are read from the plans in the database, never written in the code.
  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));
  const families = [
    {
      key: "talents",
      price: t("home.pricing.talents.price", { price: price(highestPrice(plans, "talent")) }),
      art: "talents",
    },
    {
      key: "rh",
      price: t("home.pricing.rh.price", { price: price(highestPrice(plans, "rh")) }),
      art: "recruiters",
    },
    {
      key: "companies",
      price: t("home.pricing.companies.price", { price: price(lowestPaidPrice(plans, "company")) }),
      art: "companies",
    },
    {
      key: "partners",
      price: t("home.pricing.partners.price"),
      art: "partners",
    },
  ] as const;

  const commitments = [
    ["free", "free"],
    ["ai", "why"],
    ["privacy", "privacy"],
    ["payment", "payment"],
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

  // « Learn. Grow. Connect. », word by word for the scrolling band.
  const heroWords = t("home.hero.title").split(" ");
  const matchValue = splitLastNumber(t("home.hero.visual.matchShort"))?.value ?? 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <MotionRoot />

      {/* Hero (31/10/2026): on the cream band, the big gradient card. « Learn. Grow. Connect. »
          scrolls slowly across it (still with reduced motion), one short line, one button. */}
      <section className="jm-section-clair px-3 pt-3 pb-10 sm:px-5 lg:pt-5 lg:pb-16">
        <div className="jm-hero-card relative mx-auto flex max-w-[1240px] flex-col items-center gap-8 overflow-hidden rounded-[32px] pt-14 pb-12 text-center lg:gap-10 lg:rounded-[44px] lg:pt-24 lg:pb-20">
          <h1 className="w-full">
            <span className="sr-only">{t("home.hero.title")}</span>
            <span aria-hidden className="jm-marquee block">
              <span className="jm-marquee-track">
                {[0, 1].map((copy) => (
                  <span
                    key={copy}
                    className={cx("jm-marquee-group", copy === 1 && "jm-marquee-copy")}
                  >
                    {heroWords.map((word, index) => (
                      <span
                        key={word}
                        className={cx(
                          "jm-marquee-word",
                          index % 2 === 1 ? "jm-hero-highlight" : "text-[#fbf9f4]",
                        )}
                      >
                        {word}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </span>
          </h1>
          <p
            className={cx(
              lead,
              "jm-rise max-w-[520px] px-6 text-[#d9e6e1] lg:text-xl lg:leading-8",
            )}
            style={stagger(1)}
          >
            {t("home.hero.short")}
          </p>
          <div className="jm-rise" style={stagger(2)}>
            <SiteButton href={joinHref()} tone="lime" className="jm-cta-glow">
              {signupOpen ? t("home.hero.ctaPrimary") : t("nav.waitlist")}
            </SiteButton>
          </div>
          <ul
            aria-hidden
            className="jm-rise mt-2 flex items-end justify-center gap-2.5 sm:gap-3 lg:gap-5"
            style={stagger(3)}
          >
            {(["trainings", "career", "jobs", "recruiters", "connect"] as const).map(
              (art, index) => (
                <li
                  key={art}
                  className="jm-hero-art"
                  style={{ animationDelay: `${index * -1.1}s` }}
                >
                  <MenuArt
                    name={art}
                    size="lg"
                    className="shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)] max-sm:size-[54px] max-sm:rounded-[16px]"
                  />
                </li>
              ),
            )}
          </ul>
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
              className="jm-card jm-lift group relative flex flex-col overflow-hidden rounded-[24px] p-6 lg:p-7"
              style={stagger(index)}
            >
              <div className="flex items-center justify-between gap-3">
                <MenuArt name={audience.art} size="lg" />
                <span className="text-xs font-semibold text-feuille-fonce">
                  {t(`home.audiences.${audience.key}.label`)}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 pt-6">
                <h3 className="text-[22px] leading-7 font-semibold tracking-[-0.025em]">
                  {t(`home.audiences.${audience.key}.title`)}
                </h3>
                <p className="text-[15px] leading-6 text-ardoise">
                  {t(`home.audiences.${audience.key}.text`)}
                </p>
                <div className="flex-1" />
                <ArrowLink href={audience.href} stretched className="mt-2 text-feuille-fonce">
                  {t(`home.audiences.${audience.key}.cta`)}
                </ArrowLink>
              </div>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Journey: four numbered steps, on the light « Crème doux » */}
      <MarketingSection tone="clair" innerClassName="flex flex-col gap-12">
        <div className="flex flex-col gap-10">
          <div data-reveal>
            <SectionHead
              eyebrow={t("home.journey.eyebrow")}
              title={t("home.journey.title")}
              text={t("home.journey.subtitle")}
            />
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li
                key={step.key}
                data-reveal
                className="jm-card jm-lift flex flex-col gap-4 rounded-[24px] p-6"
                style={stagger(index)}
              >
                <div className="flex items-start justify-between">
                  <MenuArt name={step.art} size="lg" />
                  {/* A decorative watermark: drawn by CSS, so it is not text that has to meet the
                      contrast ratio (the step is named by its heading). */}
                  <span
                    aria-hidden
                    data-n={String(t(`home.journey.${step.key}.number`)).padStart(2, "0")}
                    className="text-[40px] leading-none font-semibold tracking-[-0.04em] text-sapin/15 before:content-[attr(data-n)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-2 text-lg leading-7 font-semibold tracking-[-0.015em]">
                    {t(`home.journey.${step.key}.title`)}
                  </h3>
                  <p className="text-[15px] leading-6 text-ardoise">
                    {t(`home.journey.${step.key}.text`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
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
            art="trainings"
          />
          <li
            data-reveal
            className="jm-lift relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-sapin p-6 text-blanc lg:p-8"
          >
            <AiOrb size={52} className="jm-pulse" />
            <h3 className="text-2xl leading-[30px] font-semibold tracking-[-0.025em]">
              {t("home.modules.intelligence.name")}
            </h3>
            <p className="relative text-[15px] leading-6 text-blanc/80">
              {t("home.modules.intelligence.text")}
            </p>
            <div
              aria-hidden
              className="relative mt-auto flex flex-col gap-2 rounded-[18px] bg-nuit p-4 text-blanc"
            >
              <span className="text-sm font-semibold">{t("home.hero.visual.matchTitle")}</span>
              <span className="h-2 overflow-hidden rounded-pill bg-blanc/12">
                <span
                  className="jm-fill block h-full rounded-pill bg-lime"
                  style={{ width: `${matchValue}%` }}
                />
              </span>
              <span className="text-xs font-semibold text-lime">
                <CountUp text={t("home.hero.visual.matchShort")} />
              </span>
            </div>
            <Link
              href="/comment-fonctionne-le-matching"
              className="relative inline-flex items-center gap-2 self-start py-2 text-sm font-semibold text-lime underline-offset-4 hover:underline"
            >
              <Icon name="eye" className="size-4" />
              {t("common.why")}
            </Link>
          </li>
          <ModuleCard
            name={t("home.modules.career.name")}
            text={t("home.modules.career.text")}
            art="career"
          />
          <ModuleCard
            name={t("home.modules.jobs.name")}
            text={t("home.modules.jobs.text")}
            art="jobs"
          />
          <ModuleCard
            name={t("home.modules.hire.name")}
            text={t("home.modules.hire.text")}
            art="recruiters"
          />
          <ModuleCard
            name={t("home.modules.connect.name")}
            text={t("home.modules.connect.text")}
            art="connect"
          />
        </ul>
      </MarketingSection>

      {/* Trainings, on the light « Crème doux » */}
      <MarketingSection tone="clair" innerClassName="flex flex-col gap-10">
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
          <ArrowLink href={joinHref({ profil: "rh" })} className="text-feuille-fonce">
            {t("home.jobs.recruiterCta")}
          </ArrowLink>
        </div>
      </MarketingSection>

      {/* Plans, on the light « Crème doux »: prices read from the database */}
      <MarketingSection
        tone="clair"
        innerClassName="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16"
      >
        <div data-reveal className="flex flex-col gap-6 lg:w-[400px] lg:shrink-0">
          <SectionHead
            eyebrow={t("home.pricing.eyebrow")}
            title={t("home.pricing.title")}
            text={t("home.pricing.subtitle")}
          />
          <p className="jm-card flex items-center gap-3 rounded-[18px] px-4 py-3 text-sm leading-5 text-ardoise">
            <MenuArt name="payment" />
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
              className="jm-card jm-lift flex flex-col gap-3 rounded-[24px] p-6 lg:p-7"
              style={stagger(index)}
            >
              <MenuArt name={family.art} size="lg" />
              <h3 className="text-base leading-6 font-semibold">
                {t(`home.pricing.${family.key}.name`)}
              </h3>
              <p className="text-[28px] leading-[34px] font-semibold tracking-[-0.03em] text-feuille-fonce">
                <CountUp text={family.price} />
              </p>
              <p className="text-sm leading-[22px] text-ardoise">
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
              className="jm-card jm-lift flex flex-col gap-4 rounded-[24px] p-6 lg:p-7"
              style={stagger(index)}
            >
              <MenuArt name={icon} size="lg" />
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

      {/* FAQ, on the light « Crème doux » */}
      <MarketingSection
        tone="clair"
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:w-[380px] lg:shrink-0">
          <Eyebrow>{t("home.faq.eyebrow")}</Eyebrow>
          <h2 className={cx(sectionTitle, "lg:max-w-[300px]")}>{t("home.faq.title")}</h2>
          <SiteButton href="/faq" tone="light" className="self-start">
            {t("home.faq.cta")}
          </SiteButton>
        </div>
        <div data-reveal className="min-w-0 flex-1" style={stagger(1)}>
          <FaqAccordion onWhite items={faqItems(messages, overrides, "home.faq")} />
        </div>
      </MarketingSection>

      <LimeCtaBand
        spacedTop
        title={t("home.finalCta.title")}
        text={t("home.finalCta.text")}
        actions={
          <>
            <SiteButton href={joinHref()}>{t("home.finalCta.primary")}</SiteButton>
            {signupOpen && (
              <SiteButton href="/connexion" tone="light">
                {t("home.finalCta.secondary")}
              </SiteButton>
            )}
          </>
        }
      />
    </>
  );
}

/** A card of the modules bento: icon, name and text. */
function ModuleCard({
  name,
  text,
  art,
  className,
}: {
  name: string;
  text: string;
  art: MenuArtName;
  className?: string;
}) {
  return (
    <li
      data-reveal
      className={cx("jm-card jm-lift flex flex-col gap-3 rounded-[24px] p-6 lg:p-8", className)}
    >
      <MenuArt name={art} size="lg" />
      <h3 className="pt-2 text-[22px] leading-7 font-semibold tracking-[-0.02em]">{name}</h3>
      <p className="text-[15px] leading-6 text-ardoise">{text}</p>
    </li>
  );
}
