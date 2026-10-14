import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge, Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { publicPortfolio } from "@/server/services/portfolio";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.portfolio.page");
  // A person's page, public by its link only: never indexed (partie 10, données personnelles).
  return { title: { absolute: t("seo") }, robots: { index: false, follow: false } };
}

/** Public portfolio of a talent (partie 07 § 1, `/portfolio/[slug]`), when published. */
export default function PublicPortfolioPage({ params }: PageProps<"/portfolio/[slug]">) {
  return (
    <section className="bg-creme">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 page-x py-12 md:py-16">
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <Portfolio params={params} />
        </Suspense>
      </div>
    </section>
  );
}

async function Portfolio({ params }: { params: PageProps<"/portfolio/[slug]">["params"] }) {
  const { slug } = await params;
  const t = await getTranslations("career.portfolio");
  const portfolio = await publicPortfolio(db, decodeURIComponent(slug).slice(0, 80));
  if (!portfolio) {
    return (
      <div role="status" className="rounded-card bg-blanc p-6">
        <h1 className="text-h2">{t("page.unavailable")}</h1>
      </div>
    );
  }
  const month = new Intl.DateTimeFormat("fr", { month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <>
      <header
        className="flex flex-col gap-3 border-l-8 pl-5"
        style={{ borderColor: portfolio.accent }}
      >
        <h1 className="text-display">{t("page.title", { name: portfolio.name })}</h1>
        {portfolio.headline && <p className="text-lg font-medium">{portfolio.headline}</p>}
        {portfolio.intro && (
          <p className="text-lg leading-8 whitespace-pre-line text-ardoise">{portfolio.intro}</p>
        )}
      </header>
      {portfolio.projects.length === 0 ? (
        <p>{t("page.empty")}</p>
      ) : (
        <ul className={cx("grid gap-4", portfolio.layout === "grid" && "md:grid-cols-2")}>
          {portfolio.projects.map((project) => (
            <li key={project.id} className="flex flex-col gap-3 rounded-card bg-blanc p-6">
              <div
                aria-hidden
                className="h-1.5 w-16 rounded-pill"
                style={{ backgroundColor: portfolio.accent }}
              />
              <h2 className="text-h2">{project.title}</h2>
              {project.date && (
                <p className="text-sm text-ardoise">
                  {month.format(new Date(`${project.date}-01T00:00:00Z`))}
                </p>
              )}
              <dl className="flex flex-col gap-2">
                {(["context", "role", "result"] as const).map((key) =>
                  project[key] ? (
                    <div key={key}>
                      <dt className="font-semibold">{t(`project.${key}`)}</dt>
                      <dd className="whitespace-pre-line">{project[key]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              {project.skills.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label={t("project.skills")}>
                  {project.skills.map((skill) => (
                    <li key={skill}>
                      <Badge tone="career">{skill}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {project.media.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{t("page.media")}</p>
                  <ul className="flex flex-col gap-1">
                    {project.media.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          rel="noopener noreferrer nofollow"
                          className="break-all underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {project.link && (
                <a
                  href={project.link}
                  rel="noopener noreferrer nofollow"
                  className="self-start font-medium underline"
                >
                  {t("page.open")}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-ardoise">{t("page.footer")}</p>
    </>
  );
}
