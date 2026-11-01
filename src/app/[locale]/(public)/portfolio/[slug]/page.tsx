import { intlLocale } from "@/lib/display-locale";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Eyebrow, stagger, wrap } from "@/components/site/marketing";
import { MotionRoot } from "@/components/site/motion";
import { ShareButton } from "@/components/site/share-button";
import { Skeleton } from "@/components/ui";
import { cx } from "@/lib/cx";
import { db } from "@/server/db";
import { publicPortfolio } from "@/server/services/portfolio";
import { applySiteLocale } from "@/i18n/site-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/portfolio/[slug]">): Promise<Metadata> {
  await applySiteLocale(params);
  const t = await getTranslations("career.portfolio.page");
  // A person's page, public by its link only: never indexed (partie 10, données personnelles).
  return { title: { absolute: t("seo") }, robots: { index: false, follow: false } };
}

type Project = NonNullable<Awaited<ReturnType<typeof publicPortfolio>>>["projects"][number];

/** Covers of the project cards, in turn (mockup 01-16): pattern, background and icon. */
const covers: { pattern: string; className: string; icon: IconName }[] = [
  { pattern: "motif-points-lime", className: "bg-[#DCE775]", icon: "statistiques" },
  { pattern: "motif-pastilles-clair", className: "bg-menthe-claire", icon: "mobile-money" },
  { pattern: "motif-reseau-lime", className: "bg-lime", icon: "equipe" },
];

const chip = "rounded-pill px-3 py-1.5 text-xs font-semibold";

/** Public portfolio of a talent (partie 07 § 1, `/portfolio/[slug]`, mockup 01-16), when published. */
export default function PublicPortfolioPage({ params }: PageProps<"/[locale]/portfolio/[slug]">) {
  return (
    <>
      <MotionRoot />
      <section className="bg-papier px-2 pt-2 pb-16 sm:px-3 lg:px-4 lg:pt-3 lg:pb-24">
        <div
          data-scene
          className="relative mx-auto h-[150px] max-w-[1400px] overflow-hidden rounded-[32px] bg-lime-clair lg:h-[320px] lg:rounded-[48px]"
        ></div>
        <div className={cx(wrap, "relative")}>
          <Suspense fallback={<Skeleton className="mt-8 h-96 rounded-card" />}>
            <Portfolio params={params} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

async function Portfolio({
  params,
}: {
  params: PageProps<"/[locale]/portfolio/[slug]">["params"];
}) {
  await applySiteLocale(params);
  const { slug } = await params;
  const t = await getTranslations("career.portfolio");
  const portfolio = await publicPortfolio(db, decodeURIComponent(slug).slice(0, 80));
  if (!portfolio) {
    return (
      <div role="status" className="mt-10 rounded-[28px] bg-blanc p-8">
        <h1 className="text-h2">{t("page.unavailable")}</h1>
      </div>
    );
  }
  const initials = portfolio.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const skills = [...new Set(portfolio.projects.flatMap((project) => project.skills))];
  const [first, ...others] = portfolio.projects;
  const featured = portfolio.layout === "grid" ? undefined : first;
  const rest = featured ? others : portfolio.projects;

  return (
    <>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-7">
        <div
          aria-hidden
          className="jm-pop -mt-14 flex size-28 shrink-0 items-center justify-center rounded-full bg-lime text-[40px] font-bold text-sapin ring-[6px] ring-creme lg:-mt-24 lg:size-[184px] lg:text-[64px]"
        >
          {initials}
        </div>
        <div className="jm-rise flex flex-1 flex-col gap-2">
          <Eyebrow>{t("page.eyebrow")}</Eyebrow>
          {/* The site is dark (Modèle B) and the accents are dark greens: the name stays in the text
              color so that it can be read (WCAG 2.2 AA). */}
          <h1 className="text-[34px] leading-[1.05] font-bold tracking-tight lg:text-[54px]">
            {portfolio.name}
          </h1>
          {portfolio.headline && (
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Icon name="up" className="size-4 text-feuille-fonce" />
              {portfolio.headline}
            </p>
          )}
        </div>
        <ShareButton
          label={t("page.share")}
          copiedLabel={t("page.shareCopied")}
          className="h-10! self-start rounded-pill bg-blanc! px-4 text-[13px]! font-semibold ring-[1.5px] ring-brume ring-inset lg:self-center"
        />
      </header>

      {(portfolio.intro || skills.length > 0) && (
        <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          {portfolio.intro ? (
            <p
              data-reveal
              className="text-lg leading-8 whitespace-pre-line lg:text-xl lg:leading-[32px]"
            >
              {portfolio.intro}
            </p>
          ) : (
            <span />
          )}
          {skills.length > 0 && (
            <div data-reveal className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-[0.12em] text-ardoise uppercase">
                {t("project.skills")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <li key={skill} className={cx(chip, "bg-lime-clair text-sapin")}>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 flex items-center justify-between gap-4 lg:mt-16">
        <h2 className="text-[28px] font-bold tracking-tight lg:text-4xl">{t("page.projects")}</h2>
        <span className={cx(chip, "bg-brume text-sapin")}>
          {t("page.count", { count: portfolio.projects.length })}
        </span>
      </div>

      {portfolio.projects.length === 0 ? (
        <p className="mt-6 rounded-[24px] bg-blanc p-6">{t("page.empty")}</p>
      ) : (
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {featured && <ProjectCard project={featured} index={0} wide />}
          {rest.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={featured ? index + 1 : index} />
          ))}
        </ul>
      )}
      <p className="mt-10 text-sm text-ardoise">{t("page.footer")}</p>
    </>
  );
}

async function ProjectCard({
  project,
  index,
  wide = false,
}: {
  project: Project;
  index: number;
  wide?: boolean;
}) {
  const t = await getTranslations("career.portfolio");
  const cover = covers[index % covers.length]!;
  const month = new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const date = project.date
    ? month.format(new Date(`${project.date}-01T00:00:00Z`)).replace(/^./, (c) => c.toUpperCase())
    : null;
  return (
    <li
      data-reveal
      style={stagger(index % 3)}
      className={cx(
        "jm-lift flex flex-col gap-4 rounded-[28px] bg-blanc p-3.5 shadow-[0_12px_32px_rgba(15,63,55,0.06)]",
        wide && "md:col-span-2 lg:flex-row lg:gap-6",
      )}
    >
      <div
        aria-hidden
        className={cx(
          "relative h-[160px] shrink-0 overflow-hidden rounded-[20px]",
          wide && "lg:h-auto lg:min-h-[340px] lg:w-[48%]",
          cover.className,
        )}
      >
        <span className="absolute bottom-3.5 left-3.5 flex size-12 items-center justify-center rounded-[14px] bg-blanc text-sapin">
          <Icon name={cover.icon} className="size-5" />
        </span>
        {project.media.length > 0 && (
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-pill bg-blanc px-2.5 py-1 text-[11px] font-semibold">
            <Icon name="doc" className="size-3" />
            {t("page.files", { count: project.media.length })}
          </span>
        )}
      </div>
      <div className={cx("flex flex-1 flex-col gap-3 px-2 pb-3", wide && "lg:py-4 lg:pr-4")}>
        <div className="flex items-start justify-between gap-4">
          <h3 className={cx("font-bold", wide ? "text-xl lg:text-2xl" : "text-lg")}>
            {project.title}
          </h3>
          {date && <p className="shrink-0 pt-1 text-xs text-ardoise">{date}</p>}
        </div>
        <dl className="flex flex-col gap-2.5">
          {(["context", "role", "result"] as const).map((key) =>
            project[key] ? (
              <div key={key} className="flex flex-col gap-0.5">
                <dt className="text-[11px] font-semibold tracking-[0.1em] text-ardoise uppercase">
                  {t(`project.${key}`)}
                </dt>
                <dd className="text-sm leading-[21px] whitespace-pre-line">{project[key]}</dd>
              </div>
            ) : null,
          )}
        </dl>
        {project.skills.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold tracking-[0.1em] text-ardoise uppercase">
              {t("project.skills")}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {project.skills.map((skill) => (
                <li key={skill} className={cx(chip, "bg-lime-clair text-sapin")}>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.media.length > 0 && (
          <ul aria-label={t("page.media")} className="flex flex-col gap-1">
            {project.media.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1.5 text-xs break-all text-feuille-fonce underline"
                >
                  <Icon name="clip" className="size-3.5 shrink-0" />
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
        {project.link && (
          <a
            href={project.link}
            rel="noopener noreferrer nofollow"
            className="mt-auto flex items-center gap-1.5 self-start pt-2 text-sm font-semibold text-feuille-fonce"
          >
            <Icon name="lien" className="size-4" />
            {t("project.link")}
          </a>
        )}
      </div>
    </li>
  );
}
