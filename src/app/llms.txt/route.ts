import { getTranslations } from "next-intl/server";
import { formatUsd } from "@/lib/money";
import { siteUrl } from "@/lib/seo";
import { getLlmsEntries, getPublicPlans } from "@/server/queries/public";
import { buildLlmsTxt } from "@/server/services/llms";
import { lowestPaidPrice } from "@/server/services/plans";

/**
 * Summary of the public site for AI assistants (ChatGPT, Claude, Perplexity…), at /llms.txt.
 * Only public pages: the connected space, profiles and portfolios are never listed.
 */
export async function GET() {
  const t = await getTranslations();
  const base = siteUrl();
  const [plans, entries] = await Promise.all([getPublicPlans(), getLlmsEntries()]);
  const price = (cents: number | null) => (cents === null ? "" : formatUsd(cents));

  const page = (path: string, title: string, description: string) => ({
    title,
    url: `${base}${path === "/" ? "" : path}`,
    description,
  });
  const pages = [
    page("/", t("home.seo.title"), t("home.seo.description")),
    page("/a-propos", t("about.seo.title"), t("about.seo.description")),
    page(
      "/talents",
      t("talents.seo.title"),
      t("talents.seo.description", { price: price(lowestPaidPrice(plans, "talent")) }),
    ),
    page(
      "/recruteurs",
      t("recruiters.seo.title"),
      t("recruiters.seo.description", { price: price(lowestPaidPrice(plans, "rh")) }),
    ),
    page(
      "/entreprises",
      t("companies.seo.title"),
      t("companies.seo.description", { price: price(lowestPaidPrice(plans, "company")) }),
    ),
    page("/partenaires", t("partners.seo.title"), t("partners.seo.description")),
    page("/formations", t("trainings.seo.title"), t("trainings.seo.description")),
    page("/offres", t("jobs.seo.title"), t("jobs.seo.description")),
    page("/tarifs", t("pricing.seo.title"), t("pricing.seo.description")),
    page(
      "/comment-fonctionne-le-matching",
      t("matchingPage.meta.title"),
      t("matchingPage.meta.description"),
    ),
    page("/faq", t("faq.seo.title"), t("faq.seo.description")),
    page("/contact", t("contact.seo.title"), t("contact.seo.description")),
  ];

  const body = buildLlmsTxt({
    title: t("common.brand"),
    summary: t("llms.summary"),
    facts: [
      t("llms.facts.free"),
      t("llms.facts.ai"),
      t("llms.facts.payment"),
      t("llms.facts.contact"),
      t("common.signature"),
    ],
    sections: [
      { heading: t("llms.sections.pages"), links: pages },
      {
        heading: t("llms.sections.courses"),
        links: entries.courses.map((course) => ({
          title: course.title,
          url: `${base}/formations/${course.slug}`,
          description: course.summary,
        })),
      },
      {
        heading: t("llms.sections.jobs"),
        links: entries.jobs.map((job) => ({
          title: t("llms.job", {
            title: job.title,
            company: job.organization.name,
            city: job.city,
          }),
          url: `${base}/offres/${job.slug}`,
        })),
      },
      {
        heading: t("llms.sections.more"),
        links: [{ title: t("llms.sitemap"), url: `${base}/sitemap.xml` }],
      },
    ],
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
