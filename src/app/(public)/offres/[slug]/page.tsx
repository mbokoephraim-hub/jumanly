import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { JobBody } from "@/components/site/job-body";
import { JobListing } from "@/components/site/listings";
import { Breadcrumb } from "@/components/site/navigation-bits";
import { ShareButton } from "@/components/site/share-button";
import { Alert, Badge, ButtonLink, VerifiedBadge } from "@/components/ui";
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
  if (!data) return { title: { absolute: t("job.notFound.title") }, robots: { index: false } };
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

  return (
    <>
      {open && (
        <script
          type="application/ld+json"
          // JSON-LD is built from database values, serialized with "<" escaped.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <section className="bg-creme">
        <div className="mx-auto grid max-w-7xl gap-8 page-x py-10 md:py-14 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col items-start gap-5">
            <Breadcrumb
              items={[{ label: t("job.breadcrumb.jobs"), href: "/offres" }, { label: job.title }]}
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone="jobs">{contract}</Badge>
              <Badge tone="neutral">{remote}</Badge>
            </div>
            <h1 className="text-display">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-lg">
              <Link
                href={`/entreprises/${job.organization.slug}`}
                className="font-semibold underline"
              >
                {t("job.header.company", { company })}
              </Link>
              {job.organization.verifiedAt && (
                <span title={t("job.header.verifiedHelp")}>
                  <VerifiedBadge />
                </span>
              )}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
              <li className="flex items-center gap-1.5">
                <Icon name="localisation" className="size-5" />
                {t("job.header.location", { city: job.city, country: job.country })}
              </li>
              <li className="flex items-center gap-1.5">
                <Icon name="portefeuille" className="size-5" />
                {salary ?? t("job.header.salaryHidden")}
              </li>
              {job.publishedAt && (
                <li className="flex items-center gap-1.5">
                  <Icon name="horloge" className="size-5" />
                  {t("job.header.published", { date: formatDate(job.publishedAt) })}
                </li>
              )}
              {job.closesAt && (
                <li className="flex items-center gap-1.5">
                  <Icon name="calendrier" className="size-5" />
                  {t("job.header.deadline", { date: formatDate(job.closesAt) })}
                </li>
              )}
            </ul>
          </div>
          <aside className="flex flex-col gap-4 self-start rounded-card bg-blanc p-6">
            {open ? (
              <>
                <ButtonLink href={applyHref} size="lg" fullWidth>
                  {t("job.cta.apply")}
                </ButtonLink>
                <p className="text-ardoise text-caption">{t("job.cta.applyNote")}</p>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink
                    href={signupHref({ profil: "talent", suite: `/offres/${job.slug}` })}
                    variant="tertiary"
                    icon={<Icon name="favori" className="size-4" />}
                  >
                    {t("job.cta.save")}
                  </ButtonLink>
                  <ShareButton label={t("job.cta.share")} copiedLabel={t("job.cta.shareCopied")} />
                </div>
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
          </aside>
        </div>
      </section>

      <section className="bg-blanc">
        <div className="mx-auto grid max-w-7xl gap-10 page-x py-12 lg:grid-cols-[1.6fr_1fr]">
          <JobBody job={job} />
          <div className="flex flex-col gap-4 self-start">
            <div className="flex flex-col gap-3 rounded-card bg-gradient-ai p-6 text-blanc">
              <h2 className="text-h2">{t("job.match.title")}</h2>
              <p className="text-[15px] leading-6">{t("job.match.text")}</p>
              <div>
                <ButtonLink href={loginHref(`/app/jobs/${job.slug}`)}>
                  {t("job.match.cta")}
                </ButtonLink>
              </div>
            </div>
            {job.organization.description && (
              <div className="flex flex-col gap-3 rounded-card bg-creme p-6">
                <h2 className="text-h2">{t("job.company.title", { company })}</h2>
                <p className="text-[15px] leading-6">{job.organization.description}</p>
              </div>
            )}
            <Alert title={t("job.safety.text")}>
              <Link
                href={loginHref(`/app/jobs/${job.slug}?signaler=1#signaler`)}
                className="font-medium underline"
              >
                {t("job.cta.report")}
              </Link>
            </Alert>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section id="similaires" className="bg-creme">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 page-x py-12">
            <h2 className="text-h1">{t("job.similar.title")}</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {similar.map((item) => (
                <li key={item.slug} className="flex [&>article]:flex-1">
                  <JobListing job={item} now={now} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
