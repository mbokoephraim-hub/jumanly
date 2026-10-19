import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { deleteProjectAction, saveProjectAction } from "@/server/actions/portfolio";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  listProjects,
  portfolioLevel,
  PROJECT_FILES_MAX,
  projectText,
} from "@/server/services/portfolio";
import { ensureProfile } from "@/server/services/profile";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil.projects");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Nouveau projet » (planche talent-4 § 3): up to 6 photos or PDF, a title, what was done (the
 * problem, the role, the result in figures), the skills used and « Visible par les recruteurs ».
 * Projects come with `career.portfolio.level`; without it the page goes back to the profile.
 */
export default async function ProjectPage({ searchParams }: PageProps<"/app/profil/projet">) {
  const params = await searchParams;
  const user = await requireUser("/app/profil/projet");
  const t = await getTranslations();
  if ((await portfolioLevel(db, user.id)) === "none")
    redirect("/app/profil?section=projets#projets");
  const profile = await ensureProfile(db, user.id);
  const [projects, skills] = await Promise.all([
    listProjects(db, profile.id),
    db.profileSkill.findMany({
      where: { profileId: profile.id },
      include: { skill: { select: { name: true } } },
      orderBy: { level: "desc" },
      take: 20,
    }),
  ]);
  const project = projects.find((item) => item.id === one(params.id));
  const offered = [
    ...new Set([...(project?.skills ?? []), ...skills.map((item) => item.skill.name)]),
  ];
  const error = one(params.erreur);

  return (
    <div className="t-flux t-od-bas">
      <FlowHead
        back="/app/profil?section=projets#projets"
        backLabel={t("profil.back")}
        title={project ? t("profil.projects.edit") : t("profil.projects.new")}
      />
      {error && (
        <Notice tone="err">
          {error === "file" || error === "limit"
            ? t(`profil.projects.error.${error}`, { max: PROJECT_FILES_MAX })
            : t("profil.error")}
        </Notice>
      )}
      <form
        id="pf-projet"
        action={saveProjectAction}
        encType="multipart/form-data"
        className="t-flux"
      >
        {project && <input type="hidden" name="id" value={project.id} />}
        <label className="t-depot t-s t-press">
          <span className="t-cases" aria-hidden>
            <TalentIcon name="photo" size="s" />
          </span>
          <b>{t("profil.projects.files")}</b>
          <span>{t("profil.projects.filesHelp", { max: PROJECT_FILES_MAX })}</span>
          <input
            type="file"
            name="files"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
          />
        </label>
        {project && project.files.length > 0 && (
          <fieldset className="t-fs">
            <legend className="t-ck-t">{t("profil.projects.kept")}</legend>
            <div className="t-puces">
              {project.files.map((file, index) => (
                <label key={file.key} className="t-puce t-press">
                  <input type="checkbox" name="keep" value={file.key} defaultChecked />
                  <TalentIcon
                    name={file.type === "application/pdf" ? "document" : "photo"}
                    size="xs"
                  />
                  <span className="max-w-[180px] truncate">{file.name || `${index + 1}`}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="t-champ">
          <label htmlFor="pf-pj-title">{t("profil.projects.titleLabel")}</label>
          <span className="t-verre t-saisie">
            <input
              id="pf-pj-title"
              name="title"
              required
              maxLength={120}
              defaultValue={project?.title ?? ""}
              placeholder={t("profil.projects.titlePlaceholder")}
            />
          </span>
        </div>
        <div className="t-champ">
          <label htmlFor="pf-pj-text">{t("profil.projects.text")}</label>
          <textarea
            id="pf-pj-text"
            name="context"
            rows={4}
            maxLength={3000}
            defaultValue={project ? projectText(project) : ""}
            placeholder={t("profil.projects.textPlaceholder")}
            className="t-verre t-saisie t-zone"
          />
        </div>
        <fieldset className="t-fs">
          <legend className="t-lab-c">{t("profil.projects.skills")}</legend>
          <div className="t-puces">
            {offered.map((skill) => (
              <label key={skill} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="skills"
                  value={skill}
                  defaultChecked={project?.skills.includes(skill)}
                />
                {skill}
              </label>
            ))}
          </div>
          <span className="t-verre t-saisie">
            <TalentIcon name="plus" size="s" />
            <label htmlFor="pf-pj-new" className="sr-only">
              {t("profil.projects.addSkill")}
            </label>
            <input
              id="pf-pj-new"
              name="newSkills"
              maxLength={300}
              placeholder={t("profil.projects.addSkill")}
            />
          </span>
        </fieldset>
        <label className="t-li t-nu">
          <span className="t-t">
            <b>{t("profil.projects.visible")}</b>
            <span>{t("profil.projects.visibleText")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="visible"
            defaultChecked={project?.visible ?? true}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
      </form>
      {project && (
        <form action={deleteProjectAction}>
          <input type="hidden" name="id" value={project.id} />
          <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
            {t("profil.projects.remove")}
          </button>
        </form>
      )}
      <div className="t-verre t-fort t-bas-f">
        <button type="submit" form="pf-projet" className="t-bt t-p t-pl t-press">
          {t("profil.save")}
        </button>
      </div>
    </div>
  );
}
