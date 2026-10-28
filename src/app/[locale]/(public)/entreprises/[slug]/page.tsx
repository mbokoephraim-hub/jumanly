import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Character } from "@/components/brand";
import { Icon, type IconName } from "@/components/brand/icon";
import { IconTile, Pattern, Shape, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { CatalogJobCard } from "@/components/site/public-cards";
import { ButtonLink, CompanyLogo } from "@/components/ui";
import { cx } from "@/lib/cx";
import { pageMetadata } from "@/lib/seo";
import { getCompany, getSitemapEntries, staticSlugParams } from "@/server/queries/public";
import { applySiteLocale } from "@/i18n/site-locale";

// Same rendering as a job page: known slugs are prerendered, a new one renders in full.
export const instant = false;

export async function generateStaticParams() {
  const { companySlugs } = await getSitemapEntries();
  return staticSlugParams(companySlugs);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/entreprises/[slug]">): Promise<Metadata> {
  await applySiteLocale(params);
  const { slug } = await params;
  const t = await getTranslations("companyPage");
  const company = await getCompany(slug);
  if (!company) return { title: t("notFound.title"), robots: { index: false } };
  return pageMetadata({
    path: `/entreprises/${company.slug}`,
    title: t("seo.title", { company: company.name }),
    description: t("seo.description", { company: company.name }),
    noindex: company.jobs.length === 0,
  });
}

/** Public page of a recruiting organization (mockup 01-14): presentation, badge and open jobs. */
export default async function CompanyPage({ params }: PageProps<"/[locale]/entreprises/[slug]">) {
  await applySiteLocale(params);
  const { slug } = await params;
  const t = await getTranslations();
  const company = await getCompany(slug);
  if (!company) notFound();
  const { now } = company;
  const facts: { icon: IconName; text: string }[] = [
    company.sector
      ? { icon: "entreprise" as const, text: t("companyPage.sector", { sector: company.sector }) }
      : null,
    company.size
      ? { icon: "equipe" as const, text: t("companyPage.size", { size: company.size }) }
      : null,
    company.city && company.country
      ? {
          icon: "localisation" as const,
          text: t("companyPage.location", { city: company.city, country: company.country }),
        }
      : null,
  ].filter((item): item is { icon: "entreprise" | "equipe" | "localisation"; text: string } =>
    Boolean(item),
  );
  const organization = {
    name: company.name,
    verifiedAt: company.verifiedAt,
    logo: company.logo,
    banner: company.banner,
  };

  return (
    <>
      <MotionRoot />
      <section className="bg-creme pb-10 lg:pb-16">
        <div
          data-scene
          className="relative h-[180px] overflow-hidden bg-gradient-depth lg:h-[300px]"
        >
          <Pattern name="motif-reseau-sombre" size={460} opacity={0.5} />
          <Shape
            name="forme-halo-couleur"
            className="jm-drift -top-[200px] right-10 w-[600px] opacity-50"
          />
          <Shape
            name="forme-trajectoire-lime"
            className="jm-float-slow -bottom-10 left-[35%] w-[420px] opacity-90 max-lg:hidden"
          />
        </div>
        <div className={cx(wrap, "relative -mt-12 lg:-mt-[70px]")}>
          <div
            className="jm-rise flex flex-col gap-5 rounded-[28px] bg-blanc px-5 pt-0 pb-6 shadow-[0_20px_50px_rgba(15,63,55,0.12)] lg:flex-row lg:items-end lg:gap-6 lg:rounded-[32px] lg:px-8 lg:py-7"
            style={stagger(0)}
          >
            <span className="-mt-12 self-start rounded-[30px] ring-[6px] ring-blanc lg:-mt-20">
              <CompanyLogo
                name={company.name}
                size="lg"
                className="size-24! rounded-[30px]! text-[34px]! lg:size-32! lg:rounded-[38px]! lg:text-[44px]!"
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.03em] lg:text-[40px] lg:leading-[46px]">
                  {company.name}
                </h1>
                {company.verifiedAt && (
                  <span
                    title={t("org.verification.badge.tooltip")}
                    className="inline-flex h-[30px] items-center gap-1.5 rounded-pill bg-menthe-claire px-3 text-xs font-semibold"
                  >
                    <Icon name="check" className="size-3.5" />
                    {t("companyPage.verified")}
                  </span>
                )}
                {company.hiringNow && (
                  <span className="inline-flex h-[30px] items-center rounded-pill bg-lime px-3 text-xs font-semibold text-sapin">
                    {t("companyPage.hiringNow")}
                  </span>
                )}
              </div>
              {facts.length > 0 && (
                <ul className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
                  {facts.map((fact) => (
                    <li key={fact.text} className="flex items-center gap-2">
                      <Icon name={fact.icon} className="size-4 shrink-0 text-feuille-fonce" />
                      {fact.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                rel="noopener noreferrer nofollow"
                className="inline-flex h-11 items-center gap-2 self-start rounded-pill px-[18px] text-sm font-semibold ring-[1.5px] ring-brume ring-inset hover:bg-creme lg:self-auto"
              >
                <Icon name="lien" className="size-4" />
                {t("companyPage.website")}
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="bg-creme pb-14 lg:pb-24">
        <div className={cx(wrap, "flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14")}>
          <div className="flex min-w-0 flex-1 flex-col gap-10 lg:gap-12">
            {company.description && (
              <div data-reveal className="flex flex-col gap-3.5">
                <h2 className="text-2xl leading-[30px] font-semibold tracking-[-0.015em]">
                  {t("companyPage.about.title")}
                </h2>
                <p className="text-[15.5px] leading-[25px] whitespace-pre-line">
                  {company.description}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div data-reveal className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[30px] leading-9 font-semibold tracking-[-0.03em] lg:text-[40px] lg:leading-[46px]">
                  {t("companyPage.jobs.title")}
                </h2>
                <span className="inline-flex h-[30px] items-center rounded-pill bg-lime px-3 text-xs font-semibold">
                  {t("companyPage.jobs.count", { count: company.jobs.length })}
                </span>
              </div>
              {company.jobs.length === 0 ? (
                <EmptyJobs
                  label={t("companyPage.jobs.empty")}
                  cta={t("companyPage.jobs.emptyCta")}
                />
              ) : (
                <ul className="flex flex-col gap-4">
                  {company.jobs.map((job, index) => (
                    <li key={job.id} data-reveal style={stagger(index % 3)}>
                      <CatalogJobCard job={{ ...job, organization }} now={now} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <aside className="flex flex-col gap-4 lg:w-[360px] lg:shrink-0">
            <div data-reveal className="flex flex-col gap-3.5 rounded-[28px] bg-menthe-claire p-6">
              <span className="jm-float self-start">
                <IconTile icon="portefeuille" size={48} className="bg-sapin text-lime" />
              </span>
              <p className="text-lg leading-6 font-semibold">{t("common.freeApplications")}</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function EmptyJobs({ label, cta }: { label: string; cta: string }) {
  return (
    <div
      data-reveal
      className="flex items-center gap-4 rounded-[24px] bg-blanc px-5 py-5 ring-[1.5px] ring-brume ring-inset"
    >
      <span className="jm-breathe shrink-0">
        <Character name="fatou" pose="perplexe" height={90} />
      </span>
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm leading-[21px]">{label}</p>
        <ButtonLink href="/offres" variant="tertiary" size="sm">
          {cta}
        </ButtonLink>
      </div>
    </div>
  );
}
