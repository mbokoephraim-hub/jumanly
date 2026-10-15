import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { card, cardTitle, CareerTabs, pillClass } from "@/components/career/kit";
import { CopyField } from "@/components/partner/copy-field";
import { Pattern } from "@/components/site/marketing";
import { Alert, Checkbox, PlanLock, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import {
  deleteProjectAction,
  savePortfolioSettingsAction,
  saveProjectAction,
} from "@/server/actions/portfolio";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { listPublicPlans, talentPlanFor } from "@/server/services/plans";
import {
  listProjects,
  MAX_PROJECTS,
  PORTFOLIO_KEY,
  portfolioAccents,
  portfolioLayouts,
  portfolioLevel,
  type PortfolioProject,
} from "@/server/services/portfolio";
import { ensureProfile } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("career.portfolio");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Portfolio (partie 07 § 3, `career.portfolio.level`): projects, presentation and the public
 * page the talent chooses to share.
 */
export default async function PortfolioPage({ searchParams }: PageProps<"/app/career/portfolio">) {
  const query = await searchParams;
  const user = await requireUser("/app/career/portfolio");
  const t = await getTranslations();
  const [tier, plans, profile] = await Promise.all([
    portfolioLevel(db, user.id),
    listPublicPlans(db),
    ensureProfile(db, user.id),
  ]);
  const header = (
    <>
      <AppPageHeader eyebrow={t("career.portfolio.subtitle")} title={t("career.portfolio.title")} />
      <CareerTabs active="portfolio" />
    </>
  );
  if (tier === "none") {
    return (
      <>
        {header}
        <PlanLock
          plan={talentPlanFor(plans, PORTFOLIO_KEY, ["standard", "enriched"])}
          description={t("career.portfolio.empty")}
        />
      </>
    );
  }
  const projects = await listProjects(db, profile.id);
  const enriched = tier === "enriched";
  const url = profile.portfolioSlug ? `${siteUrl()}/portfolio/${profile.portfolioSlug}` : null;
  const editing = projects.find((project) => project.id === query.modifier);
  const notice =
    query.ok === "projet" || query.ok === "presentation"
      ? t("career.portfolio.saved")
      : query.ok === "supprime"
        ? t("career.portfolio.deleted")
        : null;
  const error =
    query.erreur === "limit"
      ? t("career.portfolio.limit", { max: MAX_PROJECTS })
      : query.erreur
        ? t("career.portfolio.error")
        : null;
  const isPublic = profile.portfolioPublic && url;

  return (
    <>
      {header}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex flex-wrap items-center gap-3 text-[13px] text-ardoise">
          <span
            className={cx(
              "flex h-7 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold text-sapin",
              isPublic ? "bg-lime-clair" : "bg-gris-clair",
            )}
          >
            <Icon name={isPublic ? "eye" : "eye-off"} className="size-3.5" />
            {isPublic ? t("career.portfolio.publicBadge") : t("career.portfolio.privateBadge")}
          </span>
          {t("career.portfolio.count", { count: projects.length })}
        </p>
        <div className="flex flex-wrap gap-2">
          {isPublic && (
            <Link href={`/portfolio/${profile.portfolioSlug}`} className={pillClass("outline")}>
              <Icon name="eye" className="size-4" />
              {t("career.portfolio.preview")}
            </Link>
          )}
          {projects.length < MAX_PROJECTS && (
            <a href="#nouveau" className={pillClass("dark")}>
              <Icon name="plus" className="size-4" />
              {t("career.portfolio.project.add")}
            </a>
          )}
        </div>
      </div>
      {notice && <Alert tone="success" title={notice} />}
      {error && <Alert tone="error" title={error} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section id="projets" aria-labelledby="projects-title" className="scroll-mt-24">
            <h2 id="projects-title" className="sr-only">
              {t("career.portfolio.projects")}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project, index) => {
                const cover = covers[index % covers.length]!;
                return (
                  <li
                    key={project.id}
                    id={`projet-${project.id}`}
                    className="flex scroll-mt-24 flex-col gap-2 rounded-[24px] bg-blanc p-3 pb-4"
                  >
                    <div
                      className={cx("relative h-[140px] overflow-hidden rounded-[18px]", cover.bg)}
                    >
                      <Pattern name={cover.motif} size={220} opacity={0.6} />
                      <span className="absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-[14px] bg-blanc text-sapin">
                        <Icon name={cover.icon} className="size-5" />
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 px-2 pt-1">
                      {project.date && (
                        <p className="text-xs font-semibold text-feuille-fonce">
                          {formatMonth(project.date)}
                        </p>
                      )}
                      <h3 className="text-[17px] leading-snug font-semibold">{project.title}</h3>
                      {project.result && (
                        <p className="line-clamp-2 text-xs leading-[17px] text-ardoise">
                          {project.result}
                        </p>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 px-2 pt-1">
                      <ul className="flex min-w-0 flex-wrap gap-1.5">
                        {project.skills.slice(0, 3).map((skill) => (
                          <li
                            key={skill}
                            className="rounded-pill bg-gris-clair px-2.5 py-1 text-[11px] font-semibold"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/app/career/portfolio?modifier=${project.id}#edition`}
                        aria-label={[t("career.portfolio.project.edit"), project.title].join(" · ")}
                        title={t("career.portfolio.project.edit")}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-creme"
                      >
                        <Icon name="edit" className="size-4" />
                      </Link>
                    </div>
                  </li>
                );
              })}
              {projects.length < MAX_PROJECTS && (
                <li>
                  <a
                    href="#nouveau"
                    className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 rounded-[24px] p-6 text-center ring-2 ring-brume [ring-style:dashed] ring-inset hover:bg-blanc/60"
                    style={{ outline: "none" }}
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-lime">
                      <Icon name="plus" className="size-5" />
                    </span>
                    <span className="text-[15px] font-semibold">
                      {t("career.portfolio.project.add")}
                    </span>
                    <span className="max-w-[260px] text-xs text-ardoise">
                      {t("career.portfolio.empty")}
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </section>

          {editing ? (
            <section
              id="edition"
              aria-labelledby="edit-title"
              className={cx(card, "flex scroll-mt-24 flex-col gap-4 lg:p-[26px]")}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="edit-title" className={cardTitle}>
                  {editing.title}
                </h2>
                <Link href="/app/career/portfolio" className={pillClass("outline", "sm")}>
                  {t("career.portfolio.project.add")}
                </Link>
              </div>
              <form
                key={JSON.stringify(editing)}
                action={saveProjectAction}
                className="flex flex-col gap-3"
              >
                <input type="hidden" name="id" value={editing.id} />
                <ProjectFields prefix={editing.id} project={editing} />
                <button type="submit" className={pillClass("dark", "md", "self-start")}>
                  {t("career.portfolio.project.save")}
                </button>
              </form>
              <details className="border-t border-brume pt-4">
                <summary className="cursor-pointer text-[13px] font-semibold text-ardoise">
                  {t("career.portfolio.project.delete.cta")}
                </summary>
                <form
                  action={deleteProjectAction}
                  className="mt-3 flex flex-col items-start gap-2 rounded-[16px] bg-creme p-4"
                >
                  <input type="hidden" name="id" value={editing.id} />
                  <p className="text-sm">{t("career.portfolio.project.delete.confirm")}</p>
                  <button type="submit" className={pillClass("outline", "sm")}>
                    {t("career.portfolio.project.delete.cta")}
                  </button>
                </form>
              </details>
            </section>
          ) : (
            projects.length < MAX_PROJECTS && (
              <form
                key={projects.length}
                id="nouveau"
                action={saveProjectAction}
                aria-labelledby="new-project-title"
                className={cx(card, "flex scroll-mt-24 flex-col gap-3 lg:p-[26px]")}
              >
                <h2 id="new-project-title" className={cardTitle}>
                  {t("career.portfolio.project.add")}
                </h2>
                <ProjectFields prefix="new" />
                <button type="submit" className={pillClass("dark", "md", "self-start")}>
                  {t("career.portfolio.project.save")}
                </button>
              </form>
            )
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section aria-labelledby="public-title" className={cx(card, "flex flex-col gap-3")}>
            <h2 id="public-title" className={cardTitle}>
              {t("career.portfolio.public.text")}
            </h2>
            {isPublic ? (
              <>
                <p className="text-[13px] leading-5">{t("career.portfolio.public.on", { url })}</p>
                <CopyField
                  id="portfolio-url"
                  label={t("career.portfolio.public.text")}
                  value={url}
                  copyLabel={t("career.portfolio.public.copy")}
                  copiedLabel={t("career.linkedin.copied")}
                />
                <Link
                  href={`/portfolio/${profile.portfolioSlug}`}
                  className={pillClass("dark", "sm", "self-start")}
                >
                  <Icon name="eye" className="size-4" />
                  {t("career.portfolio.preview")}
                </Link>
              </>
            ) : (
              <p className="text-[13px]">{t("career.portfolio.public.off")}</p>
            )}
          </section>

          <form
            key={profile.updatedAt.toISOString()}
            id="presentation"
            action={savePortfolioSettingsAction}
            aria-labelledby="settings-title"
            className={cx(card, "flex scroll-mt-24 flex-col gap-4")}
          >
            <h2 id="settings-title" className={cardTitle}>
              {t("career.portfolio.settings")}
            </h2>
            {enriched ? (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-2 text-sm font-semibold">
                    {t("career.portfolio.layout")}
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {portfolioLayouts.map((layout) => (
                      <label
                        key={layout}
                        className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[16px] bg-creme p-2 text-xs font-semibold ring-1 ring-brume ring-inset has-checked:ring-2 has-checked:ring-sapin has-focus-visible:outline-2 has-focus-visible:outline-sapin"
                      >
                        <input
                          type="radio"
                          name="layout"
                          value={layout}
                          defaultChecked={profile.portfolioLayout === layout}
                          className="sr-only"
                        />
                        <span aria-hidden className="flex h-12 w-full gap-1 rounded-[10px] p-1.5">
                          {layout === "grid" ? (
                            <>
                              <span className="flex-1 rounded bg-sapin" />
                              <span className="flex-1 rounded bg-brume" />
                              <span className="flex-1 rounded bg-brume" />
                            </>
                          ) : (
                            <span className="flex-1 rounded bg-sapin" />
                          )}
                        </span>
                        {t(`career.portfolio.layoutOption.${layout}`)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Select
                  id="portfolio-accent"
                  name="accent"
                  label={t("career.portfolio.accent.text")}
                  defaultValue={profile.portfolioAccent ?? "sapin"}
                  options={(Object.keys(portfolioAccents) as (keyof typeof portfolioAccents)[]).map(
                    (accent) => ({
                      value: accent,
                      label: t(`career.portfolio.accent.${accent}`),
                    }),
                  )}
                />
              </>
            ) : (
              <p className="flex items-center gap-2 rounded-[14px] bg-creme px-3.5 py-3 text-[13px] font-semibold">
                <Icon name="lock" className="size-4 shrink-0" />
                {t("career.portfolio.enrichedLocked", {
                  plan: talentPlanFor(plans, PORTFOLIO_KEY, ["enriched"]),
                })}
              </p>
            )}
            <TextArea
              id="portfolio-intro"
              name="intro"
              label={t("career.portfolio.intro")}
              defaultValue={profile.portfolioIntro ?? ""}
              maxLength={1500}
              rows={4}
            />
            <Checkbox
              id="portfolio-public"
              name="public"
              label={t("career.portfolio.public.toggle")}
              defaultChecked={profile.portfolioPublic}
              hint={t("career.portfolio.public.privacy")}
            />
            <button type="submit" className={pillClass("dark", "sm", "self-start")}>
              {t("career.portfolio.saveSettings")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const covers = [
  { bg: "bg-brume", motif: "motif-trajectoires-clair", icon: "statistiques" },
  { bg: "bg-lime", motif: "motif-pastilles-lime", icon: "mobile-money" },
  { bg: "bg-lime-clair", motif: "motif-reseau-clair", icon: "equipe" },
  { bg: "bg-sapin", motif: "motif-orbites-sombre", icon: "career" },
] as const satisfies readonly { bg: string; motif: string; icon: IconName }[];

/** "2026-10" → "octobre 2026". */
function formatMonth(value: string) {
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        date,
      );
}

async function ProjectFields({ prefix, project }: { prefix: string; project?: PortfolioProject }) {
  const t = await getTranslations("career.portfolio.project");
  const id = (name: string) => `project-${prefix}-${name}`;
  return (
    <>
      <TextField
        id={id("title")}
        name="title"
        label={t("title")}
        defaultValue={project?.title}
        maxLength={120}
        required
      />
      <TextArea
        id={id("context")}
        name="context"
        label={t("context")}
        defaultValue={project?.context}
        maxLength={1500}
        rows={3}
      />
      <TextArea
        id={id("role")}
        name="role"
        label={t("role")}
        defaultValue={project?.role}
        maxLength={800}
        rows={2}
      />
      <TextArea
        id={id("result")}
        name="result"
        label={t("result")}
        defaultValue={project?.result}
        maxLength={1500}
        rows={2}
      />
      <TextField
        id={id("skills")}
        name="skills"
        label={t("skills")}
        hint={t("skillsHint")}
        defaultValue={project?.skills.join(", ")}
        maxLength={500}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id={id("link")}
          name="link"
          type="url"
          label={t("link")}
          defaultValue={project?.link ?? ""}
          maxLength={500}
        />
        <TextField
          id={id("date")}
          name="date"
          type="month"
          label={t("date")}
          defaultValue={project?.date ?? ""}
        />
      </div>
      <TextArea
        id={id("media")}
        name="media"
        label={t("media")}
        hint={t("mediaHint")}
        defaultValue={project?.media.join("\n")}
        maxLength={2000}
        rows={2}
      />
    </>
  );
}
