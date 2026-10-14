import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CopyField } from "@/components/partner/copy-field";
import {
  Alert,
  Button,
  ButtonLink,
  Checkbox,
  EmptyState,
  PlanLock,
  Select,
  TextArea,
  TextField,
} from "@/components/ui";
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
  return { title: { absolute: t("title") }, robots: { index: false } };
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
      <Link href="/app/career" className="text-sm underline">
        {t("career.home.eyebrow")}
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("career.portfolio.title")}</h1>
        <p className="text-ardoise">{t("career.portfolio.subtitle")}</p>
      </header>
    </>
  );
  if (tier === "none") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <PlanLock
          plan={talentPlanFor(plans, PORTFOLIO_KEY, ["standard", "enriched"])}
          description={t("career.portfolio.empty")}
        />
      </div>
    );
  }
  const projects = await listProjects(db, profile.id);
  const enriched = tier === "enriched";
  const url = profile.portfolioSlug ? `${siteUrl()}/portfolio/${profile.portfolioSlug}` : null;
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

  return (
    <div className="flex flex-col gap-6">
      {header}
      {notice && <Alert tone="success" title={notice} />}
      {error && <Alert tone="error" title={error} />}

      <form
        key={profile.updatedAt.toISOString()}
        id="presentation"
        action={savePortfolioSettingsAction}
        className="flex scroll-mt-24 flex-col gap-4 rounded-card bg-blanc p-6"
      >
        <h2 className="text-h2">{t("career.portfolio.settings")}</h2>
        <TextArea
          id="portfolio-intro"
          name="intro"
          label={t("career.portfolio.intro")}
          defaultValue={profile.portfolioIntro ?? ""}
          maxLength={1500}
          rows={4}
        />
        {enriched ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="portfolio-layout"
              name="layout"
              label={t("career.portfolio.layout")}
              defaultValue={profile.portfolioLayout}
              options={portfolioLayouts.map((layout) => ({
                value: layout,
                label: t(`career.portfolio.layoutOption.${layout}`),
              }))}
            />
            <Select
              id="portfolio-accent"
              name="accent"
              label={t("career.portfolio.accent.text")}
              defaultValue={profile.portfolioAccent ?? "sapin"}
              options={(Object.keys(portfolioAccents) as (keyof typeof portfolioAccents)[]).map(
                (accent) => ({ value: accent, label: t(`career.portfolio.accent.${accent}`) }),
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-ardoise">
            {t("career.portfolio.enrichedLocked", {
              plan: talentPlanFor(plans, PORTFOLIO_KEY, ["enriched"]),
            })}
          </p>
        )}
        <Checkbox
          id="portfolio-public"
          name="public"
          label={t("career.portfolio.public.toggle")}
          defaultChecked={profile.portfolioPublic}
        />
        <p className="text-sm text-ardoise">{t("career.portfolio.public.privacy")}</p>
        <div>
          <Button type="submit" variant="secondary">
            {t("career.portfolio.saveSettings")}
          </Button>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-card bg-blanc p-6">
        <h2 className="text-h2">{t("career.portfolio.public.text")}</h2>
        {profile.portfolioPublic && url ? (
          <>
            <p className="text-sm">{t("career.portfolio.public.on", { url })}</p>
            <CopyField
              id="portfolio-url"
              label={t("career.portfolio.public.text")}
              value={url}
              copyLabel={t("career.portfolio.public.copy")}
              copiedLabel={t("career.linkedin.copied")}
            />
            <ButtonLink
              href={`/portfolio/${profile.portfolioSlug}`}
              variant="tertiary"
              size="sm"
              className="self-start"
            >
              {t("career.portfolio.preview")}
            </ButtonLink>
          </>
        ) : (
          <p className="text-sm">{t("career.portfolio.public.off")}</p>
        )}
      </section>

      <section id="projets" aria-labelledby="projects-title" className="flex flex-col gap-3">
        <h2 id="projects-title" className="text-h2">
          {t("career.portfolio.projects")}
        </h2>
        {projects.length === 0 ? (
          <EmptyState title={t("career.portfolio.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => (
              <li
                key={project.id}
                id={`projet-${project.id}`}
                className="flex scroll-mt-24 flex-col gap-2 rounded-card bg-blanc p-5"
              >
                <h3 className="text-h3 font-semibold">{project.title}</h3>
                {project.result && <p className="text-sm">{project.result}</p>}
                <details>
                  <summary className="cursor-pointer text-sm font-medium underline">
                    {t("career.portfolio.project.edit")}
                  </summary>
                  <form
                    key={JSON.stringify(project)}
                    action={saveProjectAction}
                    className="mt-3 flex flex-col gap-3"
                  >
                    <input type="hidden" name="id" value={project.id} />
                    <ProjectFields prefix={project.id} project={project} />
                    <div>
                      <Button type="submit" size="sm">
                        {t("career.portfolio.project.save")}
                      </Button>
                    </div>
                  </form>
                  <form action={deleteProjectAction} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="id" value={project.id} />
                    <p className="text-sm text-ardoise">
                      {t("career.portfolio.project.delete.confirm")}
                    </p>
                    <div>
                      <Button type="submit" size="sm" variant="tertiary">
                        {t("career.portfolio.project.delete.cta")}
                      </Button>
                    </div>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {projects.length < MAX_PROJECTS && (
        <form
          key={projects.length}
          id="nouveau"
          action={saveProjectAction}
          className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-6"
        >
          <h2 className="text-h2">{t("career.portfolio.project.add")}</h2>
          <ProjectFields prefix="new" />
          <div>
            <Button type="submit">{t("career.portfolio.project.save")}</Button>
          </div>
        </form>
      )}
    </div>
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
