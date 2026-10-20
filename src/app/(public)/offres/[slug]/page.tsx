import type { Metadata } from "next";
import { ViewBeacon } from "@/components/jobs/view-beacon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AiOrb } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { JobBody } from "@/components/site/job-body";
import { Pattern, Shape, iaFlow, sectionTitle, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { CatalogJobCard } from "@/components/site/public-cards";
import { ShareButton } from "@/components/site/share-button";
import { Alert, ButtonLink, CompanyLogo } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { loginHref, signupHref } from "@/lib/signup";
import { getJob, getSitemapEntries, staticSlugParams } from "@/server/queries/public";
import { contractFilterOf, remoteFilterOf } from "@/server/services/jobs";

// Known slugs are prerendered; a new one renders in full before responding, so that search engines
// get the whole page and a real 404 for an unknown slug.
export const instant = false;

export async function generateStaticParams() {
  const { jobSlugs } = await getSitemapEntries();
  return staticSlugParams(jobSlugs);
}

export async function generateMetadata({ params }: PageProps<"/offres/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations();
  const data = await getJob(slug);
  if (!data) return { title: t("job.notFound.title"), robots: { index: false } };
  const { job } = data;
  const values = { title: job.title, company: job.organization.name, city: job.city };
  return pageMetadata({
    path: `/offres/${job.slug}`,
    title: t("job.seo.title", values),
    description: t("job.seo.description", {
      ...values,
      contract: t(`jobs.search.contract.${contractFilterOf(job.contractType)}`),
    }),
    noindex: !data.open,
  });
}

/** schema.org JobPosting, so that search engines can list the offer. */
const employmentTypes: Record<string, string> = {
  cdi: "FULL_TIME",
  cdd: "TEMPORARY",
  stage: "INTERN",
  mission: "CONTRACTOR",
  freelance: "CONTRACTOR",
  alternance: "OTHER",
  volontariat: "VOLUNTEER",
};

export default async function JobPage({ params }: PageProps<"/offres/[slug]">) {
  const { slug } = await params;
  const t = await getTranslations();
  const data = await getJob(slug);
  if (!data) notFound();
  const { job, similar, now, open } = data;

  const company = job.organization.name;
  const contract = t(`jobs.search.contract.${contractFilterOf(job.contractType)}`);
  const remote = t(`jobs.search.remote.${remoteFilterOf(job.remote)}`);
  const salary =
    job.salaryMin !== null && job.salaryMax !== null
      ? t("ui.salary.range", { min: formatUsd(job.salaryMin), max: formatUsd(job.salaryMax) })
      : job.salaryMin !== null
        ? t("ui.salary.from", { min: formatUsd(job.salaryMin) })
        : null;
  const applyHref = signupHref({ profil: "talent", suite: `/app/jobs/${job.slug}` });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString(),
    validThrough: job.closesAt?.toISOString(),
    employmentType: employmentTypes[job.contractType],
    identifier: { "@type": "PropertyValue", name: company, value: job.slug },
    hiringOrganization: {
      "@type": "Organization",
      name: company,
      ...(job.organization.slug
        ? { sameAs: `${siteUrl()}/entreprises/${job.organization.slug}` }
        : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: job.city, addressCountry: job.country },
    },
    jobLocationType: job.remote === "remote" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements:
      job.remote === "remote" ? { "@type": "Country", name: job.country } : undefined,
    // Salaries are stored in USD cents per month.
    baseSalary:
      job.salaryMin !== null
        ? {
            "@type": "MonetaryAmount",
            currency: job.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin / 100,
              ...(job.salaryMax !== null ? { maxValue: job.salaryMax / 100 } : {}),
              unitText: "MONTH",
            },
          }
        : undefined,
    // Applying goes through a free Jumanly account first.
    directApply: false,
    url: `${siteUrl()}/offres/${job.slug}`,
  };

  const facts: { icon: IconName; text: string; tone: string }[] = [
    {
      icon: "localisation",
      text: t("job.header.location", { city: job.city, country: job.country }),
      tone: "bg-menthe-claire",
    },
    { icon: "doc", text: contract, tone: "bg-blanc" },
    { icon: "accueil", text: remote, tone: "bg-blanc" },
    { icon: "portefeuille", text: salary ?? t("job.header.salaryHidden"), tone: "bg-blanc" },
  ];
  const orgFacts = [job.organization.sector, job.organization.size].filter(Boolean).join(" · ");
  const ghost =
    "h-10! flex-1 rounded-pill bg-blanc! px-4 text-[13px]! font-semibold ring-[1.5px] ring-brume ring-inset";

  return (
    <>
      <ViewBeacon slug={job.slug} />
      {open && (
        <script
          type="application/ld+json"
          // JSON-LD is built from database values, serialized with "<" escaped.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <MotionRoot />

      {/* Header: company, title, facts and the free application */}
      <section
        data-scene
        className="relative overflow-hidden bg-creme pt-6 pb-10 lg:pt-10 lg:pb-12"
      >
        <Pattern name="motif-trajectoires-clair" size={420} opacity={0.5} />
        <div
          className={cx(
            wrap,
            "relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16",
          )}
        >
          <div className="flex min-w-0 flex-col items-start gap-4">
            <nav aria-label={t("ui.breadcrumb")} className="jm-rise" style={stagger(0)}>
              <ol className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[18px]">
                <li className="flex items-center gap-1.5">
                  <Link href="/offres" className="font-medium text-feuille-fonce hover:underline">
                    {t("job.breadcrumb.jobs")}
                  </Link>
                  <Icon name="chev-r" className="size-3.5 text-ardoise" />
                </li>
                <li
                  aria-current="page"
                  className="max-w-[240px] truncate font-medium sm:max-w-none"
                >
                  {job.title}
                </li>
              </ol>
            </nav>
            <div className="jm-rise flex items-center gap-3.5" style={stagger(1)}>
              <CompanyLogo
                name={company}
                size="lg"
                className="size-14! rounded-[16px]! text-xl! lg:size-16!"
              />
              <div className="flex flex-col gap-0.5">
                {job.organization.slug ? (
                  <Link
                    href={`/entreprises/${job.organization.slug}`}
                    className="text-[15px] font-semibold hover:underline"
                  >
                    {t("job.header.company", { company })}
                  </Link>
                ) : (
                  <span className="text-[15px] font-semibold">
                    {t("job.header.company", { company })}
                  </span>
                )}
                {job.organization.verifiedAt && (
                  <p className="flex flex-wrap items-center gap-x-1 text-xs leading-4">
                    <span className="inline-flex items-center gap-1 font-medium text-feuille-fonce">
                      <Icon name="check" className="size-3.5" />
                      {t("job.header.verified")}
                    </span>
                    <span className="text-ardoise max-sm:hidden">
                      {"· "}
                      {t("job.header.verifiedHelp")}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <h1
              className="jm-word text-[34px] leading-[38px] font-semibold tracking-[-0.035em] lg:text-[48px] lg:leading-[52px]"
              style={stagger(2)}
            >
              {job.title}
            </h1>
            <ul className="jm-rise flex flex-wrap gap-2" style={stagger(3)}>
              {facts.map((fact) => (
                <li
                  key={fact.text}
                  className={cx(
                    "inline-flex min-h-7 items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold",
                    fact.tone,
                  )}
                >
                  <Icon name={fact.icon} className="size-3.5" />
                  {fact.text}
                </li>
              ))}
            </ul>
            <p
              className="jm-rise flex flex-wrap gap-x-5 gap-y-1 text-xs leading-[17px] text-ardoise"
              style={stagger(4)}
            >
              {job.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="horloge" className="size-3.5" />
                  {t("job.header.published", { date: formatDate(job.publishedAt) })}
                </span>
              )}
              {job.closesAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendrier" className="size-3.5" />
                  {t("job.header.deadline", { date: formatDate(job.closesAt) })}
                </span>
              )}
            </p>
          </div>
          <div className="jm-rise flex flex-col gap-3 lg:w-[330px] lg:shrink-0" style={stagger(4)}>
            {open ? (
              <>
                <ButtonLink
                  href={applyHref}
                  size="lg"
                  fullWidth
                  iconAfter={<Icon name="chev-r" />}
                  className="shadow-[0_10px_30px_rgba(166,242,107,0.45)]"
                >
                  {t("job.cta.apply")}
                </ButtonLink>
                <div className="flex gap-2.5">
                  <ButtonLink
                    href={signupHref({ profil: "talent", suite: `/offres/${job.slug}` })}
                    variant="tertiary"
                    icon={<Icon name="favori" className="size-4" />}
                    className={ghost}
                  >
                    {t("job.cta.save")}
                  </ButtonLink>
                  <ShareButton
                    label={t("job.cta.share")}
                    copiedLabel={t("job.cta.shareCopied")}
                    className={ghost}
                  />
                </div>
                <p className="text-center text-xs leading-[17px] text-ardoise">
                  {t("job.cta.applyNote")}
                </p>
              </>
            ) : (
              <Alert
                tone="warning"
                title={t("job.closed.title")}
                action={
                  <ButtonLink href="#similaires" variant="secondary" size="sm">
                    {t("job.closed.cta")}
                  </ButtonLink>
                }
              >
                {t("job.closed.text")}
              </Alert>
            )}
          </div>
        </div>
      </section>

      <section className="bg-blanc py-12 lg:py-16">
        <div className={cx(wrap, "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14")}>
          <div className="min-w-0 flex-1">
            <JobBody job={job} />
          </div>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:w-[380px] lg:shrink-0">
            <div
              data-reveal
              className="jm-flow relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-gradient-ai p-6 text-blanc"
              style={{ backgroundImage: iaFlow }}
            >
              <Shape
                name="forme-orbites-lime"
                className="jm-drift -top-24 -right-24 w-[260px] opacity-20 brightness-0 invert"
              />
              <p className="relative flex items-center gap-2.5">
                <AiOrb size={28} className="jm-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
                  {t("matchingPage.eyebrow")}
                </span>
              </p>
              <h2 className="relative text-xl leading-[26px] font-semibold">
                {t("job.match.title")}
              </h2>
              <div aria-hidden className="relative flex items-center gap-4">
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full text-xl font-semibold ring-4 ring-blanc/25">
                  <Icon name="intelligence" className="size-5 text-lime" />
                </span>
                <span className="flex flex-1 flex-col gap-2">
                  <span className="h-1.5 w-full rounded-pill bg-blanc/25" />
                  <span className="h-1.5 w-4/5 rounded-pill bg-blanc/20" />
                  <span className="h-1.5 w-3/5 rounded-pill bg-blanc/15" />
                </span>
              </div>
              <p className="relative text-[13.5px] leading-5 text-blanc/85">
                {t("job.match.text")}
              </p>
              <div className="relative flex items-center justify-between gap-3">
                <ButtonLink
                  href={loginHref(`/app/jobs/${job.slug}`)}
                  size="sm"
                  className="h-10 px-4"
                >
                  {t("job.match.cta")}
                </ButtonLink>
                <Link
                  href="/comment-fonctionne-le-matching"
                  className="jm-tap inline-flex items-center gap-1.5 text-xs font-semibold text-neon hover:underline"
                >
                  <Icon name="eye" className="size-3.5" />
                  {t("common.why")}
                </Link>
              </div>
            </div>
            <div
              data-reveal
              className="flex flex-col gap-2 rounded-[24px] bg-blanc p-5 ring-[1.5px] ring-brume ring-inset"
            >
              <p className="flex items-start gap-3 text-[13px] leading-5">
                <Icon name="securite" className="mt-0.5 size-[18px] shrink-0 text-feuille-fonce" />
                {t("job.safety.text")}
              </p>
              <Link
                href={loginHref(`/app/jobs/${job.slug}?signaler=1#signaler`)}
                className="jm-tap ml-[30px] inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
              >
                <Icon name="notification" className="size-3.5" />
                {t("job.cta.report")}
              </Link>
            </div>
            {(job.organization.description || orgFacts) && (
              <div data-reveal className="flex flex-col gap-3 rounded-[24px] bg-creme p-5">
                <h2 className="text-lg font-semibold">{t("job.company.title", { company })}</h2>
                <p className="flex items-center gap-3">
                  <CompanyLogo name={company} size="md" className="size-11! rounded-[12px]!" />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{company}</span>
                    {orgFacts && <span className="text-xs text-ardoise">{orgFacts}</span>}
                  </span>
                </p>
                {job.organization.description && (
                  <p className="line-clamp-4 text-[13.5px] leading-5 text-ardoise">
                    {job.organization.description}
                  </p>
                )}
                {job.organization.slug && (
                  <Link
                    href={`/entreprises/${job.organization.slug}`}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-feuille-fonce hover:underline"
                  >
                    {t("job.company.cta")}
                    <Icon name="chev-r" className="size-4" />
                  </Link>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>

      {similar.length > 0 && (
        <section id="similaires" className="scroll-mt-20 bg-creme py-12 lg:py-20">
          <div className={cx(wrap, "flex flex-col gap-6 lg:gap-8")}>
            <h2 data-reveal className={sectionTitle}>
              {t("job.similar.title")}
            </h2>
            <ul className="grid gap-4 md:grid-cols-3 lg:gap-5">
              {similar.map((item, index) => (
                <li key={item.slug} data-reveal style={stagger(index)}>
                  <CatalogJobCard job={item} now={now} compact />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
