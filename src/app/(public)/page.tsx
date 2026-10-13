import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { CourseListing, JobListing } from "@/components/site/listings";
import {
  CtaBand,
  FaqList,
  FeatureGrid,
  PageHero,
  Section,
  Steps,
} from "@/components/site/sections";
import { ButtonLink } from "@/components/ui";
import { formatUsd } from "@/lib/money";
import { withoutPlaceholders } from "@/lib/placeholders";
import { signupHref } from "@/lib/signup";
import { getFeaturedCourses, getLatestJobs, getPublicPlans } from "@/server/queries/public";
import { highestPrice, lowestPaidPrice } from "@/server/services/plans";
import { pageMetadata } from "@/lib/seo";

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

export default async function HomePage() {
  const t = await getTranslations();
  const [plans, courses, latest] = await Promise.all([
    getPublicPlans(),
    getFeaturedCourses(),
    getLatestJobs(),
  ]);

  const audiences = [
    { key: "talents", href: "/talents", icon: "profil" },
    { key: "rh", href: "/recruteurs", icon: "hire" },
    { key: "companies", href: "/entreprises", icon: "entreprise" },
  ] as const;

  const modules: {
    key: "learn" | "career" | "jobs" | "hire" | "connect" | "intelligence";
    icon: IconName;
  }[] = [
    { key: "learn", icon: "learn" },
    { key: "career", icon: "career" },
    { key: "jobs", icon: "jobs" },
    { key: "hire", icon: "hire" },
    { key: "connect", icon: "connect" },
    { key: "intelligence", icon: "intelligence" },
  ];

  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));
  const families = [
    {
      key: "talents",
      price: t("home.pricing.talents.price", { price: price(highestPrice(plans, "talent")) }),
    },
    { key: "rh", price: t("home.pricing.rh.price", { price: price(highestPrice(plans, "rh")) }) },
    {
      key: "companies",
      price: t("home.pricing.companies.price", { price: price(lowestPaidPrice(plans, "company")) }),
    },
    { key: "partners", price: t("home.pricing.partners.price") },
  ] as const;

  const testimonials = (["item1", "item2", "item3"] as const)
    .map((key) => withoutPlaceholders(t(`home.testimonials.${key}`)))
    .filter((text): text is string => text !== null);

  return (
    <>
      <PageHero
        eyebrow={t("home.hero.eyebrow")}
        title={t("home.hero.title")}
        text={t("home.hero.subtitle")}
        actions={
          <>
            <ButtonLink href={signupHref({ profil: "talent" })} size="lg">
              {t("home.hero.ctaPrimary")}
            </ButtonLink>
            <ButtonLink href="/recruteurs" variant="tertiary" size="lg">
              {t("home.hero.ctaSecondary")}
            </ButtonLink>
          </>
        }
        badge={
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-sapin">
            {(["reassurance1", "reassurance2", "reassurance3"] as const).map((key) => (
              <li key={key} className="flex items-center gap-2">
                <Icon name="valider" className="size-5 text-feuille" />
                {t(`home.hero.${key}`)}
              </li>
            ))}
          </ul>
        }
        aside={<Character name="amani" pose="salut" height={360} />}
      />

      <Section
        title={t("home.audiences.title")}
        subtitle={t("home.audiences.subtitle")}
        tone="blanc"
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {audiences.map((audience) => (
            <li
              key={audience.key}
              className="group relative flex flex-col gap-3 rounded-card bg-creme p-6"
            >
              <Icon name={audience.icon} duo className="size-10" />
              <p className="text-eyebrow text-feuille-fonce">
                {t(`home.audiences.${audience.key}.label`)}
              </p>
              <h3 className="text-h2">{t(`home.audiences.${audience.key}.title`)}</h3>
              <p className="text-[15px] leading-6 text-ardoise">
                {t(`home.audiences.${audience.key}.text`)}
              </p>
              <Link
                href={audience.href}
                className="mt-auto flex items-center gap-1 font-semibold group-hover:underline after:absolute after:inset-0"
              >
                {t(`home.audiences.${audience.key}.cta`)}
                <Icon name="suivant" className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("home.journey.title")} subtitle={t("home.journey.subtitle")}>
        <Steps
          items={(["step1", "step2", "step3", "step4"] as const).map((step) => ({
            number: t(`home.journey.${step}.number`),
            title: t(`home.journey.${step}.title`),
            text: t(`home.journey.${step}.text`),
          }))}
        />
      </Section>

      <Section title={t("home.modules.title")} subtitle={t("home.modules.subtitle")} tone="blanc">
        <FeatureGrid
          tone="creme"
          items={modules.map((module) => ({
            icon: module.icon,
            title: t(`home.modules.${module.key}.name`),
            text: t(`home.modules.${module.key}.text`),
          }))}
        />
      </Section>

      <Section title={t("home.trainings.title")} subtitle={t("home.trainings.subtitle")}>
        {courses.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {courses.map((course) => (
              <li key={course.slug} className="flex">
                <CourseListing course={course} plans={plans} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ardoise">{t("home.trainings.empty")}</p>
        )}
        <div>
          <ButtonLink href="/formations" variant="secondary">
            {t("home.trainings.cta")}
          </ButtonLink>
        </div>
      </Section>

      <Section title={t("home.jobs.title")} subtitle={t("home.jobs.subtitle")} tone="blanc">
        {latest.jobs.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {latest.jobs.map((job) => (
              <li key={job.slug} className="flex [&>article]:flex-1 [&>article]:bg-creme">
                <JobListing job={job} now={latest.now} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ardoise">{t("home.jobs.empty")}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/offres" variant="secondary">
            {t("home.jobs.cta")}
          </ButtonLink>
          <Link href={signupHref({ profil: "rh" })} className="px-2 font-semibold underline">
            {t("home.jobs.recruiterCta")}
          </Link>
        </div>
      </Section>

      <Section title={t("home.pricing.title")} subtitle={t("home.pricing.subtitle")}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {families.map((family) => (
            <li key={family.key} className="flex flex-col gap-2 rounded-card bg-blanc p-6">
              <h3 className="text-lg font-semibold">{t(`home.pricing.${family.key}.name`)}</h3>
              <p className="text-h2">{family.price}</p>
              <p className="text-[15px] leading-6 text-ardoise">
                {t(`home.pricing.${family.key}.text`)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ButtonLink href="/tarifs" variant="secondary">
            {t("home.pricing.cta")}
          </ButtonLink>
          <p className="text-sm text-ardoise">{t("home.pricing.payment")}</p>
        </div>
      </Section>

      <Section title={t("home.trust.title")} subtitle={t("home.trust.subtitle")} tone="blanc">
        <FeatureGrid
          columns={4}
          tone="creme"
          items={(
            [
              ["free", "valider"],
              ["ai", "transparence"],
              ["privacy", "confidentialite"],
              ["payment", "mobile-money"],
            ] as const
          ).map(([key, icon]) => ({
            icon,
            title: t(`home.trust.${key}.title`),
            text: t(`home.trust.${key}.text`),
          }))}
        />
      </Section>

      {testimonials.length > 0 && (
        <Section title={t("home.testimonials.title")}>
          <ul className="grid gap-4 md:grid-cols-3">
            {testimonials.map((text) => (
              <li key={text} className="rounded-card bg-blanc p-6 text-[15px] leading-7">
                {text}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t("home.faq.title")}>
        <FaqList
          items={(["1", "2", "3", "4"] as const).map((n) => ({
            question: t(`home.faq.q${n}`),
            answer: t(`home.faq.a${n}`),
          }))}
        />
        <div>
          <ButtonLink href="/faq" variant="tertiary">
            {t("home.faq.cta")}
          </ButtonLink>
        </div>
      </Section>

      <CtaBand
        title={t("home.finalCta.title")}
        text={t("home.finalCta.text")}
        actions={
          <>
            <ButtonLink href={signupHref()} size="lg">
              {t("home.finalCta.primary")}
            </ButtonLink>
            <ButtonLink href="/connexion" size="lg" variant="inverse">
              {t("home.finalCta.secondary")}
            </ButtonLink>
          </>
        }
      />
    </>
  );
}
