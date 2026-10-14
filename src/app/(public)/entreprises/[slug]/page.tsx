import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/site/navigation-bits";
import { ButtonLink, EmptyState, VerifiedBadge } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { getCompany, getSitemapEntries } from "@/server/queries/public";
import { contractFilterOf } from "@/server/services/jobs";

// Same rendering as a job page: known slugs are prerendered, a new one renders in full.
export const instant = false;

export async function generateStaticParams() {
  const { companySlugs } = await getSitemapEntries();
  return companySlugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/entreprises/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations("companyPage");
  const company = await getCompany(slug);
  if (!company) return { title: { absolute: t("notFound.title") }, robots: { index: false } };
  return pageMetadata({
    path: `/entreprises/${company.slug}`,
    title: t("seo.title", { company: company.name }),
    description: t("seo.description", { company: company.name }),
    noindex: company.jobs.length === 0,
  });
}

/** Public page of a recruiting organization (E8): presentation, badge and open jobs. */
export default async function CompanyPage({ params }: PageProps<"/entreprises/[slug]">) {
  const { slug } = await params;
  const t = await getTranslations();
  const company = await getCompany(slug);
  if (!company) notFound();
  const facts = [
    company.sector ? t("companyPage.sector", { sector: company.sector }) : null,
    company.size ? t("companyPage.size", { size: company.size }) : null,
    company.city && company.country
      ? t("companyPage.location", { city: company.city, country: company.country })
      : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 page-x py-10">
      <Breadcrumb items={[{ label: t("nav.jobs"), href: "/offres" }, { label: company.name }]} />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display">{company.name}</h1>
          {company.verifiedAt && (
            <span title={t("org.verification.badge.tooltip")}>
              <VerifiedBadge />
            </span>
          )}
        </div>
        {facts.length > 0 && (
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-ardoise">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}
        {company.website && (
          <a
            href={company.website}
            rel="noopener noreferrer nofollow"
            className="self-start font-medium underline"
          >
            {t("companyPage.website")}
          </a>
        )}
      </header>

      {company.description && (
        <section
          aria-labelledby="presentation"
          className="flex flex-col gap-3 rounded-card bg-blanc p-6"
        >
          <h2 id="presentation" className="text-h2">
            {t("companyPage.about.title")}
          </h2>
          <p className="text-[15px] leading-6 whitespace-pre-line">{company.description}</p>
        </section>
      )}

      <section aria-labelledby="offres" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="offres" className="text-h2">
            {t("companyPage.jobs.title")}
          </h2>
          <p className="text-ardoise">
            {t("companyPage.jobs.count", { count: company.jobs.length })}
          </p>
        </div>
        {company.jobs.length === 0 ? (
          <EmptyState
            title={t("companyPage.jobs.empty")}
            action={
              <ButtonLink href="/offres" variant="secondary">
                {t("companyPage.jobs.emptyCta")}
              </ButtonLink>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {company.jobs.map((job) => (
              <li key={job.id} className="flex flex-col gap-1 rounded-card bg-blanc p-5">
                <Link href={`/offres/${job.slug}`} className="font-semibold underline">
                  {job.title}
                </Link>
                <span className="text-sm text-ardoise">
                  {t("companyPage.jobs.row", {
                    city: job.city,
                    contract: t(`jobs.search.contract.${contractFilterOf(job.contractType)}`),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
