/* eslint-disable @next/next/no-img-element -- product previews are static WebP files already sized */
import type { CSSProperties } from "react";
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
  Pattern,
  SectionHead,
  Shape,
  lead,
  outlineOnLime,
  Glow,
  ImmersiveBackdrop,
  PathLine,
  PoseCycle,
  iaFlow,
  sectionTitle,
  signatureLight,
  stagger,
} from "@/components/site/marketing";
import { EntryChooser } from "@/components/site/entry-chooser";
import { InstallApp } from "@/components/site/install-app";
import { CountUp, MotionRoot } from "@/components/site/motion";
import { PublicCourseCard, PublicJobCard } from "@/components/site/public-cards";
import { ButtonLink, buttonClasses } from "@/components/ui";
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
      card: "text-sapin",
      gradient: signatureLight,
      tag: "bg-sapin text-neon",
      action: "bg-sapin text-lime",
      character: { name: "kofi", poses: ["joie", "salut"] },
    },
    {
      key: "rh",
      href: "/recruteurs",
      card: "text-sapin",
      gradient: "linear-gradient(135deg, #E3F67C 0%, #BFEFDF 40%, #A6F26B 75%, #E3F67C 100%)",
      tag: "bg-sapin text-neon",
      action: "bg-sapin text-lime",
      character: { name: "nadia", poses: ["montre", "joie"] },
    },
    {
      key: "companies",
      href: "/entreprises",
      card: "text-blanc",
      gradient: "linear-gradient(135deg, #0F3F37 0%, #14745F 45%, #0B1A1F 80%, #0F3F37 100%)",
      tag: "bg-lime text-sapin",
      action: "bg-lime text-sapin",
      character: { name: "diallo", poses: ["salut", "montre"] },
    },
  ] as const;

  const steps = [
    { key: "step1", icon: "learn" },
    { key: "step2", icon: "cv" },
    { key: "step3", icon: "jobs" },
    { key: "step4", icon: "connect" },
  ] as const;

  const modules: {
    key: "learn" | "career" | "jobs" | "hire" | "connect";
    icon: IconName;
    card: string;
    preview: string;
  }[] = [
    { key: "learn", icon: "learn", card: "bg-lime", preview: "talents-module-learn" },
    { key: "career", icon: "career", card: "bg-neon", preview: "talents-module-career" },
    { key: "jobs", icon: "jobs", card: "bg-menthe-claire", preview: "talents-module-jobs" },
    { key: "hire", icon: "hire", card: "bg-lime-clair", preview: "accueil-module-hire" },
    { key: "connect", icon: "connect", card: "bg-brume", preview: "talents-module-connect" },
  ];

  // Prices are read from the plans in the database, never written in the code.
  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));
  const families = [
    {
      key: "talents",
      price: t("home.pricing.talents.price", { price: price(highestPrice(plans, "talent")) }),
      icon: "profil",
      featured: true,
    },
    {
      key: "rh",
      price: t("home.pricing.rh.price", { price: price(highestPrice(plans, "rh")) }),
      icon: "hire",
      featured: false,
    },
    {
      key: "companies",
      price: t("home.pricing.companies.price", { price: price(lowestPaidPrice(plans, "company")) }),
      icon: "entreprise",
      featured: false,
    },
    {
      key: "partners",
      price: t("home.pricing.partners.price"),
      icon: "certificat",
      featured: false,
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
  const matchValue = splitLastNumber(t("home.hero.visual.matchShort"))?.value ?? 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(structuredData) }}
      />
      <MotionRoot />

      {/* Hero: entering the Jumanly universe, on the depth gradient */}
      <MarketingSection
        tone="profondeur"
        scene
        spotlight
        className="pt-12 pb-16 lg:pt-20 lg:pb-28"
        background={<ImmersiveBackdrop />}
      >
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:gap-14">
          <div className="flex flex-col gap-6 xl:w-[560px] xl:shrink-0">
            <div className="jm-rise" style={stagger(0)}>
              <Eyebrow dark>{t("home.hero.eyebrow")}</Eyebrow>
            </div>
            <h1 className="text-[40px] leading-[44px] font-semibold tracking-[-0.035em] lg:text-[76px] lg:leading-[80px]">
              {titleWords.map((word, index) => (
                <span key={word} className="jm-word block" style={stagger(index)}>
                  {word}
                </span>
              ))}
              <span
                className="jm-word jm-flow block bg-clip-text text-transparent"
                style={{ ...stagger(titleWords.length), backgroundImage: signatureLight }}
              >
                {lastWord}
              </span>
            </h1>
            {/* Talent or recruiter, then « S'inscrire » or « Se connecter »: always in view. */}
            <div className="jm-rise" style={stagger(3)}>
              <EntryChooser
                texts={{
                  question: t("home.entry.question"),
                  signup: t("home.entry.signup"),
                  login: t("home.entry.login"),
                  talent: {
                    label: t("home.entry.talent.label"),
                    text: t("home.entry.talent.text"),
                  },
                  rh: { label: t("home.entry.rh.label"), text: t("home.entry.rh.text") },
                }}
              />
            </div>
            <p className={cx(lead, "jm-rise text-blanc/80")} style={stagger(4)}>
              {t("home.hero.subtitle")}
            </p>
            <ul
              className="jm-rise flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-5 xl:flex-nowrap"
              style={stagger(5)}
            >
              {(["reassurance1", "reassurance2", "reassurance3"] as const).map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-xs leading-[17px] font-medium whitespace-nowrap text-blanc/85"
                >
                  <Icon name="check" className="size-4 text-lime" />
                  {t(`home.hero.${key}`)}
                </li>
              ))}
            </ul>
            <InstallApp
              id="jm-installer-accueil"
              buttonClassName={cx(buttonClasses({ variant: "inverse", size: "md" }), "h-auto py-2")}
              dialogClassName={installDialog}
              trigger={
                <>
                  <Icon name="telecharger" className="text-lime" />
                  <span className="flex flex-col items-start text-left">
                    {t("system.install.button")}
                    <span className="text-xs font-medium text-blanc/75">
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
            matchShort={t("home.hero.visual.matchShort")}
          />
        </div>
      </MarketingSection>

      {/* For whom? Three cards whose gradient flows, characters in motion */}
      <MarketingSection
        scene
        innerClassName="flex flex-col gap-12"
        background={
          <>
            <Glow className="-top-40 -left-32 size-[460px] bg-lime/35" />
            <Glow className="-right-40 -bottom-40 size-[520px] bg-menthe/25" delay={-8} />
          </>
        }
      >
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
              className={cx(
                "jm-flow jm-lift relative flex min-h-[400px] flex-col gap-3 overflow-hidden rounded-box px-5 pt-5 lg:min-h-[480px] lg:rounded-card lg:px-7 lg:pt-7",
                audience.card,
              )}
              style={{ ...stagger(index), backgroundImage: audience.gradient }}
            >
              <Shape
                name={audience.key === "companies" ? "forme-orbites-lime" : "forme-orbites-sapin"}
                className="jm-drift -right-24 -bottom-24 w-[320px] opacity-20"
              />
              <span
                className={cx(
                  "relative inline-flex h-6 items-center self-start rounded-pill px-2.5 text-[11px] font-semibold",
                  audience.tag,
                )}
              >
                {t(`home.audiences.${audience.key}.label`)}
              </span>
              <h3 className="relative text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t(`home.audiences.${audience.key}.title`)}
              </h3>
              <p className="relative text-[15px] leading-[23px] opacity-90">
                {t(`home.audiences.${audience.key}.text`)}
              </p>
              <ArrowLink
                href={audience.href}
                stretched
                className={cx(
                  "mt-1 self-start rounded-pill px-4 py-2.5 shadow-[0_10px_24px_rgba(11,26,31,0.18)]",
                  audience.action,
                )}
              >
                {t(`home.audiences.${audience.key}.cta`)}
              </ArrowLink>
              <div className="flex-1" />
              <div className="relative -mr-3 flex justify-end">
                <span className="lg:hidden">
                  <PoseCycle {...audience.character} height={200} />
                </span>
                <span className="hidden lg:block">
                  <PoseCycle {...audience.character} height={230} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {/* Journey: a path that draws itself, a light that walks it */}
      <MarketingSection
        tone="sapin"
        scene
        background={
          <>
            <Pattern name="motif-trajectoires-sombre" size={420} opacity={0.25} />
            <Glow className="top-1/3 -left-40 size-[420px] bg-feuille/30" />
          </>
        }
        innerClassName="flex flex-col gap-14"
      >
        <div data-reveal>
          <SectionHead
            center
            dark
            eyebrow={t("home.journey.eyebrow")}
            title={t("home.journey.title")}
            text={t("home.journey.subtitle")}
          />
        </div>
        <ol data-reveal className="relative grid gap-5 lg:grid-cols-4 lg:gap-6">
          <JourneyPath />
          {steps.map((step, index) => (
            <li key={step.key} className="relative flex gap-4 lg:flex-col lg:items-center">
              {index < steps.length - 1 && (
                // Mobile: a segment down to the next disc, drawn one after the other.
                <span aria-hidden className="absolute top-7 -bottom-12 left-[27px] w-0.5 lg:hidden">
                  <PathLine id={`jm-path-${index}`} vertical delay={0.2 + index * 0.9} />
                </span>
              )}
              <span
                aria-hidden
                className="jm-glow relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-signature text-xl font-semibold text-sapin ring-4 ring-sapin"
                style={stagger(index)}
              >
                {t(`home.journey.${step.key}.number`)}
              </span>
              <div className="jm-lift flex flex-1 flex-col gap-3 rounded-box bg-blanc/7 p-5 ring-1 ring-blanc/12 backdrop-blur-sm ring-inset lg:w-full lg:rounded-card lg:p-6">
                <IconTile icon={step.icon} size={48} className="bg-lime text-sapin" />
                <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em]">
                  {t(`home.journey.${step.key}.title`)}
                </h3>
                <p className="text-[15px] leading-[23px] text-blanc/75">
                  {t(`home.journey.${step.key}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </MarketingSection>

      {/* Modules: each one with its icon and a live preview of its screen */}
      <MarketingSection
        scene
        background={
          <>
            <Pattern name="motif-orbites-clair" size={520} opacity={0.5} />
            <Glow className="top-20 -right-40 size-[480px] bg-lime/30" delay={-5} />
          </>
        }
        innerClassName="flex flex-col gap-12"
      >
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("home.modules.eyebrow")}
            title={t("home.modules.title")}
            text={t("home.modules.subtitle")}
          />
        </div>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {modules.map((module, index) => (
            <li
              key={module.key}
              data-reveal
              className={cx(
                "jm-lift flex flex-col gap-3 overflow-hidden rounded-box p-5 text-sapin lg:rounded-card lg:p-7",
                module.card,
              )}
              style={stagger(index % 3)}
            >
              <IconTile
                icon={module.icon}
                size={56}
                className="bg-gradient-depth text-lime shadow-[0_10px_24px_rgba(11,26,31,0.25)]"
              />
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
                {t(`home.modules.${module.key}.name`)}
              </h3>
              <p className="text-[15px] leading-[23px] opacity-80">
                {t(`home.modules.${module.key}.text`)}
              </p>
              <div className="relative mt-auto -mr-5 -mb-5 h-44 overflow-hidden rounded-tl-md shadow-[0_-6px_30px_rgba(11,26,31,0.18)] lg:-mr-7 lg:-mb-7 lg:h-52">
                <img
                  src={`/apercus/${module.preview}.webp`}
                  alt=""
                  width={1350}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="jm-pan-shot size-full object-cover object-left-top"
                  style={{ animationDelay: `${index * -3}s` }}
                />
              </div>
            </li>
          ))}
          <li
            data-reveal
            className="jm-flow jm-lift relative flex flex-col gap-3 overflow-hidden rounded-box p-5 text-blanc lg:rounded-card lg:p-7"
            style={{ ...stagger(2), backgroundImage: iaFlow }}
          >
            <Shape
              name="forme-orbites-lime"
              className="jm-drift -right-[90px] -bottom-[90px] w-[300px] opacity-25"
            />
            <AiOrb size={48} className="jm-pulse" />
            <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:text-2xl lg:leading-[30px]">
              {t("home.modules.intelligence.name")}
            </h3>
            <p className="relative text-[15px] leading-[23px] text-blanc/85">
              {t("home.modules.intelligence.text")}
            </p>
            <div
              aria-hidden
              className="relative mt-auto flex flex-col gap-2 rounded-md bg-blanc/10 p-4 ring-1 ring-blanc/15 ring-inset"
            >
              <span className="text-sm font-semibold">{t("home.hero.visual.matchTitle")}</span>
              <span className="h-2 overflow-hidden rounded-pill bg-blanc/15">
                <span
                  className="jm-fill block h-full rounded-pill bg-gradient-signature"
                  style={{ width: `${matchValue}%` }}
                />
              </span>
              <span className="text-xs text-neon">
                <CountUp text={t("home.hero.visual.matchShort")} />
              </span>
            </div>
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

      {/* Trainings, on the AI gradient */}
      <MarketingSection
        tone="ia"
        scene
        background={<Pattern name="motif-pastilles-lime" size={300} opacity={0.12} />}
        innerClassName="flex flex-col gap-10"
      >
        <div
          data-reveal
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <SectionHead
            dark
            eyebrow={t("home.trainings.eyebrow")}
            title={t("home.trainings.title")}
            text={t("home.trainings.subtitle")}
          />
          <ButtonLink
            href="/formations"
            variant="inverse"
            iconAfter={chevron}
            className="self-end lg:self-auto"
          >
            {t("home.trainings.cta")}
          </ButtonLink>
        </div>
        {courses.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {courses.map((course, index) => (
              <li
                key={course.slug}
                data-reveal
                className={cx("jm-lift rounded-box", index >= 2 && "hidden sm:block")}
                style={stagger(index)}
              >
                <PublicCourseCard course={course} plans={plans} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-box bg-blanc/10 p-6 text-blanc/85">{t("home.trainings.empty")}</p>
        )}
      </MarketingSection>

      {/* Latest jobs */}
      <MarketingSection
        tone="lime"
        scene
        background={<Glow className="-top-32 right-1/4 size-[420px] bg-lime/50" delay={-11} />}
        innerClassName="flex flex-col gap-10"
      >
        <div
          data-reveal
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <SectionHead
            eyebrow={t("home.jobs.eyebrow")}
            title={t("home.jobs.title")}
            text={t("home.jobs.subtitle")}
          />
          <ButtonLink
            href="/offres"
            variant="secondary"
            iconAfter={chevron}
            className="self-end lg:self-auto"
          >
            {t("home.jobs.cta")}
          </ButtonLink>
        </div>
        {latest.jobs.length > 0 ? (
          <ul className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            {latest.jobs.map((job, index) => (
              <li
                key={job.slug}
                data-reveal
                className={cx("jm-lift rounded-box", index >= 2 && "hidden lg:block")}
                style={stagger(index)}
              >
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

      {/* Plans: glass cards on the depth gradient, prices read from the database */}
      <MarketingSection
        tone="profondeur"
        scene
        background={
          <>
            <Pattern name="motif-orbites-sombre" size={460} opacity={0.3} />
            <Glow className="-top-40 left-1/4 size-[520px] bg-feuille/30" />
            <Glow className="-right-32 -bottom-48 size-[460px] bg-menthe/20" delay={-9} />
          </>
        }
        innerClassName="flex flex-col gap-10"
      >
        <div data-reveal>
          <SectionHead
            center
            dark
            eyebrow={t("home.pricing.eyebrow")}
            title={t("home.pricing.title")}
            text={t("home.pricing.subtitle")}
          />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {families.map((family, index) => (
            <li
              key={family.key}
              data-reveal="zoom"
              className={cx(
                "jm-lift flex flex-col gap-3 rounded-box p-5 backdrop-blur-sm lg:rounded-card lg:p-7",
                family.featured
                  ? "jm-ring bg-blanc/12"
                  : "bg-blanc/7 ring-1 ring-blanc/12 ring-inset",
              )}
              style={stagger(index)}
            >
              <IconTile
                icon={family.icon}
                size={48}
                className={
                  family.featured ? "bg-gradient-signature text-sapin" : "bg-lime text-sapin"
                }
              />
              <h3 className="text-[15px] leading-6 font-semibold">
                {t(`home.pricing.${family.key}.name`)}
              </h3>
              <p className="text-[26px] leading-8 font-semibold tracking-[-0.02em] text-neon">
                <CountUp text={family.price} />
              </p>
              <p className="text-sm leading-[22px] text-blanc/75">
                {t(`home.pricing.${family.key}.text`)}
              </p>
            </li>
          ))}
        </ul>
        <div
          data-reveal
          className="flex flex-col gap-4 rounded-box bg-blanc/7 px-6 py-[18px] ring-1 ring-blanc/12 ring-inset sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-3 text-xs leading-[17px] font-medium text-blanc/85">
            <Icon name="mobile-money" className="size-5 shrink-0 text-lime" />
            {t("home.pricing.payment")}
          </p>
          <ButtonLink href="/tarifs" iconAfter={chevron}>
            {t("home.pricing.cta")}
          </ButtonLink>
        </div>
      </MarketingSection>

      {/* Commitments */}
      <MarketingSection tone="lime" scene innerClassName="flex flex-col gap-12">
        <div data-reveal>
          <SectionHead
            center
            eyebrow={t("home.trust.eyebrow")}
            title={t("home.trust.title")}
            text={t("home.trust.subtitle")}
          />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {commitments.map(([key, icon], index) => (
            <li
              key={key}
              data-reveal
              className="jm-lift flex flex-col gap-3 rounded-box bg-blanc/75 p-5 lg:rounded-card lg:p-7"
              style={stagger(index)}
            >
              <IconTile icon={icon} className="bg-gradient-depth text-lime" />
              <h3 className="text-xl leading-[26px] font-semibold tracking-[-0.015em] lg:leading-[30px]">
                {t(`home.trust.${key}.title`)}
              </h3>
              <p className="text-[15px] leading-[23px] text-ardoise">
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
      <MarketingSection
        scene
        innerClassName="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20"
      >
        <div data-reveal className="flex flex-col gap-5 lg:w-[380px] lg:shrink-0">
          <Eyebrow>{t("home.faq.eyebrow")}</Eyebrow>
          <h2 className={cx(sectionTitle, "lg:max-w-[260px]")}>{t("home.faq.title")}</h2>
          <ButtonLink href="/faq" variant="tertiary" iconAfter={chevron} className="self-start">
            {t("home.faq.cta")}
          </ButtonLink>
          <span className="hidden lg:block">
            <PoseCycle name="fatou" poses={["montre", "joie"]} height={240} />
          </span>
        </div>
        <div data-reveal className="min-w-0 flex-1" style={stagger(1)}>
          <FaqAccordion items={faqItems(messages, overrides, "home.faq")} />
        </div>
      </MarketingSection>

      <LimeCtaBand
        animated
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
 * Desktop journey line: across the discs, from the first column's center to the last one's,
 * with the AI orb walking it. Decorative.
 */
function JourneyPath() {
  return (
    <li aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="absolute top-[27px] right-[12.5%] left-[12.5%] h-0.5">
        <PathLine id="jm-path" vertical={false} />
        <span
          className="jm-travel-x absolute top-1/2 size-5 -translate-1/2 rounded-full bg-ai-orb shadow-[0_0_24px_rgba(166,242,107,0.9)]"
          style={{ left: "100%" }}
        />
      </div>
    </li>
  );
}

/**
 * Hero visual: the app as if in use. The dashboard scrolls slowly in its window, the phone
 * floats, the match card and the certificate badge pop in, the score counts up and its bar fills.
 * Decorative labels belong to the illustration, described by the image's alternative text.
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
  const shadow = "shadow-[0_40px_80px_rgba(0,0,0,0.45)]";
  const match = splitLastNumber(matchShort)?.value ?? 0;
  return (
    <>
      {/* Desktop: 640 px stage */}
      <div className="jm-rise relative hidden h-[640px] min-w-0 flex-1 xl:block" style={stagger(2)}>
        <div className="absolute inset-y-0 right-0 left-[30px] overflow-hidden rounded-[40px] bg-blanc/6 ring-1 ring-blanc/12 ring-inset">
          <Shape
            name="forme-halo-couleur"
            className="jm-drift -top-40 -right-40 w-[560px] opacity-60"
          />
          <div className="jm-float-slow absolute top-[84px] left-[70px]">
            <div
              className={cx(
                "h-[440px] w-[720px] overflow-hidden rounded-md ring-1 ring-blanc/20",
                shadow,
              )}
            >
              <img
                src="/apercus/accueil-tableau-de-bord-desktop.webp"
                alt={alt}
                width={720}
                height={512}
                fetchPriority="high"
                className="jm-screen w-[720px] max-w-none"
                style={{ "--jm-scroll": "-72px" } as CSSProperties}
              />
            </div>
          </div>
        </div>
        <div className="jm-float absolute top-[250px] left-0">
          <div
            className={cx(
              "h-[380px] w-[196px] overflow-hidden rounded-[28px] ring-4 ring-nuit",
              shadow,
            )}
          >
            <img
              src="/apercus/accueil-tableau-de-bord-mobile.webp"
              alt=""
              width={196}
              height={424}
              className="jm-screen w-[196px] max-w-none"
              style={{ "--jm-scroll": "-44px", animationDelay: "-5s" } as CSSProperties}
            />
          </div>
        </div>
        <div className="jm-breathe absolute -right-[30px] bottom-0">
          <Character name="amani" pose="telephone" height={280} />
        </div>
        <div
          aria-hidden
          className="jm-pop absolute bottom-[46px] left-[240px] flex w-[260px] flex-col gap-2 rounded-md bg-blanc px-4 py-3 text-sapin shadow-[0_18px_40px_rgba(11,26,31,0.35)]"
          style={stagger(0)}
        >
          <div className="flex items-center gap-2.5">
            <AiOrb size={30} className="jm-pulse" />
            <div className="flex flex-col">
              <span className="text-xs leading-[17px] font-semibold">{matchTitle}</span>
              <span className="text-[11px] leading-[15px] text-ardoise">
                <CountUp text={matchText} />
              </span>
            </div>
          </div>
          <span className="h-1.5 overflow-hidden rounded-pill bg-brume">
            <span
              className="jm-fill block h-full rounded-pill bg-gradient-signature"
              style={{ width: `${match}%` }}
            />
          </span>
        </div>
        <div
          aria-hidden
          className="jm-pop absolute top-[22px] right-[250px] flex items-center gap-2.5 rounded-pill bg-lime py-2 pr-4 pl-2 text-sapin shadow-[0_0_32px_rgba(166,242,107,0.5)]"
          style={stagger(1)}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-sapin text-lime">
            <Icon name="certificat" className="size-4" />
          </span>
          <span className="text-xs leading-[17px] font-semibold">{badge}</span>
        </div>
      </div>

      {/* Mobile and tablet: the phone on a glass panel */}
      <div
        className="jm-rise relative mt-2 h-[400px] overflow-hidden rounded-card bg-blanc/6 ring-1 ring-blanc/12 ring-inset xl:hidden"
        style={stagger(5)}
      >
        <Shape
          name="forme-halo-couleur"
          className="jm-drift -top-24 -right-24 w-[360px] opacity-60"
        />
        <div className="jm-float absolute top-[30px] left-1/2 -translate-x-1/2">
          <div className="h-[340px] w-[210px] overflow-hidden rounded-[26px] shadow-[0_20px_40px_rgba(0,0,0,0.45)] ring-4 ring-nuit">
            <img
              src="/apercus/accueil-tableau-de-bord-mobile.webp"
              alt={alt}
              width={210}
              height={454}
              className="jm-screen w-[210px] max-w-none"
              style={{ "--jm-scroll": "-114px" } as CSSProperties}
            />
          </div>
        </div>
        <span
          aria-hidden
          className="jm-pop absolute bottom-[22px] left-3 inline-flex h-[34px] items-center gap-1.5 rounded-pill bg-blanc px-3 text-[11px] font-semibold text-sapin"
          style={stagger(0)}
        >
          <AiOrb size={18} />
          <CountUp text={matchShort} />
        </span>
        <span
          aria-hidden
          className="jm-pop absolute top-4 right-3 flex size-9 items-center justify-center rounded-full bg-lime text-sapin shadow-[0_0_24px_rgba(166,242,107,0.55)]"
          style={stagger(1)}
        >
          <Icon name="certificat" className="size-4" />
        </span>
      </div>
    </>
  );
}
