import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CountrySheet } from "@/components/access/country-sheet";
import { TalentAvatar } from "@/components/talent/avatar";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { PhotoEditor } from "@/components/talent/profile/photo-editor";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { CenteredDialog } from "@/components/talent/web/dialog";
import { cx } from "@/lib/cx";
import {
  deleteExperience,
  removeSkill,
  saveExperience,
  saveHeadAction,
  saveSearch,
  saveSkill,
} from "@/server/actions/profile";
import { deleteProjectAction, saveProjectAction } from "@/server/actions/portfolio";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { talentAttestations } from "@/server/services/attestations";
import { listCountries, listLocalities } from "@/server/services/places";
import {
  listProjects,
  portfolioLevel,
  PROJECT_FILES_MAX,
  projectText,
} from "@/server/services/portfolio";
import {
  dateToMonth,
  ensureProfile,
  normalize,
  PROFILE_SUMMARY_MAX,
} from "@/server/services/profile";
import { WindowClose } from "./window";

/**
 * The screens that change « Mon profil » (planche talent-4 § 3; web : planche web talent-4 § 4):
 * the head, an experience, a skill, a project, « Ce que je cherche ». On a phone each one is its
 * own page (`mode: "page"`, the button in the bar at the bottom); on a tablet or a computer the
 * same form opens in a window over the profile (`mode: "fenetre"`, `/app/profil?fenetre=…`), with
 * « Annuler » and the button at its foot. The ids differ between the two (Next keeps a page left
 * hidden in the document).
 */
export type ScreenMode = "page" | "fenetre";
export type ScreenParams = Record<string, string | string[] | undefined>;
/** The windows of the profile, by their `?fenetre=` value. */
export const PROFILE_WINDOWS = [
  "modifier",
  "experience",
  "competence",
  "projet",
  "recherche",
  "apercu",
  "point",
] as const;
export type ProfileWindow = (typeof PROFILE_WINDOWS)[number];

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

async function Frame({
  mode,
  name,
  title,
  back,
  formId,
  notices,
  submit,
  after,
  outside,
  wide = true,
  children,
}: {
  mode: ScreenMode;
  name: ProfileWindow;
  title: string;
  back: string;
  formId: string;
  notices?: ReactNode;
  /** Label of the button that sends the form; `false` keeps it disabled. */
  submit: { label: string; disabled?: boolean };
  /** Below the form (« Supprimer »). */
  after?: ReactNode;
  /** Sheets opened from the form: outside the window, which closes when they open. */
  outside?: ReactNode;
  /** The window of 640 px (planche `.dlg.l`) rather than 520 px. */
  wide?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations();
  const button = (
    <button
      type="submit"
      form={formId}
      disabled={submit.disabled}
      className={cx("t-bt t-p t-pl t-press", mode === "fenetre" && "t-m")}
    >
      {submit.label}
    </button>
  );
  if (mode === "page") {
    return (
      <div className="t-flux t-od-bas">
        <FlowHead back={back} backLabel={t("profil.back")} title={title} />
        {notices}
        {children}
        {after}
        <div className="t-verre t-fort t-bas-f">{button}</div>
        {outside}
      </div>
    );
  }
  return (
    <>
      <CenteredDialog
        id={`pfw-${name}`}
        title={title}
        closeLabel={t("talentW4.window.close")}
        openParam="fenetre"
        defaultOpen
        className={cx("t-w4-dlg", wide && "t-w4-dlg-l")}
      >
        {notices}
        {children}
        {after}
        <div className="t-bts">
          <WindowClose className="t-bt t-sec t-m t-press">
            {t("talentW4.window.cancel")}
          </WindowClose>
          {button}
        </div>
      </CenteredDialog>
      {outside}
    </>
  );
}

/** Hidden fields that bring an error back to the right screen (page or window). */
function Back({ mode, page, name }: { mode: ScreenMode; page: string; name: ProfileWindow }) {
  return mode === "page" ? (
    <input type="hidden" name="retour" value={page} />
  ) : (
    <>
      <input type="hidden" name="retour" value="/app/profil" />
      <input type="hidden" name="fenetre" value={name} />
    </>
  );
}

/** « Modifier le profil »: the photo, the title, the summary, the country and the city. */
export async function HeadScreen({ mode, params }: { mode: ScreenMode; params: ScreenParams }) {
  const user = await requireUser("/app/profil/modifier");
  const t = await getTranslations();
  const [profile, countries, localities] = await Promise.all([
    ensureProfile(db, user.id),
    listCountries(db),
    listLocalities(db),
  ]);
  const cities = (localities[user.country ?? ""] ?? [])
    .filter((row) => row.kind === "city")
    .map((row) => row.name);
  const error = one(params.erreur);
  const ok = one(params.ok);
  const p = mode === "page" ? "pf" : "pfw";

  const photo = (
    <div className={cx("t-ph-ed", mode === "fenetre" && "t-w4-ph")}>
      <TalentAvatar name={user.name} image={user.image} className="t-av-l" />
      <SheetButton target={`${p}-photo`} className="t-bi t-press" label={t("profil.head.photo")}>
        <TalentIcon name="photo" size="s" />
      </SheetButton>
    </div>
  );
  const rule = (
    <p className="t-gar">
      <TalentIcon name="confidentialite" size="s" />
      <span>{t("profil.head.photoRule")}</span>
    </p>
  );
  const headline = (
    <div className="t-champ">
      <label htmlFor={`${p}-headline`}>{t("profil.head.headline")}</label>
      <span className="t-verre t-saisie">
        <input
          id={`${p}-headline`}
          name="headline"
          maxLength={120}
          defaultValue={profile.headline ?? ""}
          placeholder={t("profil.head.headlinePlaceholder")}
        />
      </span>
    </div>
  );
  const summary = (
    <div className="t-champ">
      <label htmlFor={`${p}-summary`}>{t("profil.head.summary")}</label>
      <textarea
        id={`${p}-summary`}
        name="summary"
        rows={mode === "page" ? 4 : 3}
        maxLength={PROFILE_SUMMARY_MAX}
        defaultValue={profile.summary ?? ""}
        placeholder={t("profil.head.summaryPlaceholder")}
        aria-describedby={`${p}-summary-aide`}
        className="t-verre t-saisie t-zone"
      />
      <span id={`${p}-summary-aide`} className="t-aide-c">
        {t("profil.head.summaryHelp", { max: PROFILE_SUMMARY_MAX })}
      </span>
    </div>
  );
  const country = (
    <div className="t-champ">
      <CountrySheet
        countries={countries.map(({ code, name }) => ({ code, name }))}
        initial={user.country ?? "CD"}
        labels={{
          label: t("profil.head.country"),
          choose: t("access.onboarding.places.chooseCountry"),
          title: t("access.countries.title"),
          search: t("access.countries.search"),
          none: t("access.countries.none"),
          close: t("access.countries.close"),
          sections: {
            central: t("access.countries.section.central"),
            westEast: t("access.countries.section.westEast"),
            outside: t("access.countries.section.outside"),
            all: t("access.countries.section.all"),
          },
        }}
      />
    </div>
  );
  const city = (
    <div className="t-champ">
      <label htmlFor={`${p}-city`}>{t("profil.head.city")}</label>
      <span className="t-verre t-saisie">
        <TalentIcon name="localisation" size="s" />
        <input
          id={`${p}-city`}
          name="city"
          required
          maxLength={120}
          autoComplete="address-level2"
          list={`${p}-cities`}
          defaultValue={user.city ?? ""}
        />
        <datalist id={`${p}-cities`}>
          {cities.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </span>
    </div>
  );

  return (
    <Frame
      mode={mode}
      name="modifier"
      title={t("profil.head.title")}
      back="/app/profil"
      formId={`${p}-tete`}
      submit={{ label: t("profil.save") }}
      notices={
        <>
          {ok === "photo" && <Notice tone="ok">{t("profil.head.photoSaved")}</Notice>}
          {ok === "photo-retiree" && <Notice tone="ok">{t("profil.head.photoRemoved")}</Notice>}
          {error && (
            <Notice tone="err">
              {error === "type" || error === "size" || error === "photo"
                ? t(`profil.head.photoError.${error}`)
                : t("profil.error")}
            </Notice>
          )}
        </>
      }
      outside={
        <Sheet
          id={`${p}-photo`}
          title={t("profil.head.photo")}
          closeLabel={t("offer.close")}
          openParam={mode === "page" ? "photo" : undefined}
          defaultOpen={mode === "page" && one(params.photo) === "1"}
        >
          <PhotoEditor
            current={user.image ?? undefined}
            hasPhoto={Boolean(user.image)}
            labels={{
              take: t("profil.head.photoTake"),
              choose: t("profil.head.photoChoose"),
              remove: t("profil.head.photoRemove"),
              never: t("profil.head.photoRule"),
              zoom: t("profil.head.photoZoom"),
              save: t("profil.save"),
              empty: t("profil.head.photoEmpty"),
              drag: t("profil.head.photoDrag"),
            }}
          />
        </Sheet>
      }
    >
      {mode === "page" ? (
        <>
          {photo}
          <form id={`${p}-tete`} action={saveHeadAction} className="t-flux">
            <Back mode={mode} page="/app/profil/modifier" name="modifier" />
            {headline}
            {summary}
            {country}
            {city}
          </form>
          {rule}
        </>
      ) : (
        <>
          <div className="t-w4-ph-l">
            {photo}
            {rule}
          </div>
          <form id={`${p}-tete`} action={saveHeadAction} className="t-flux">
            <Back mode={mode} page="/app/profil/modifier" name="modifier" />
            <div className="t-w4-duo">
              {headline}
              {country}
            </div>
            {city}
            {summary}
          </form>
        </>
      )}
    </Frame>
  );
}

/** « Nouvelle expérience »: the job, the organization, the dates (or « Poste actuel »), the result. */
export async function ExperienceScreen({
  mode,
  params,
}: {
  mode: ScreenMode;
  params: ScreenParams;
}) {
  const user = await requireUser("/app/profil/experience");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const id = one(params.id);
  const experience = id
    ? await db.experience.findFirst({ where: { id, profileId: profile.id } })
    : null;
  const error = one(params.erreur);
  const p = mode === "page" ? "pf" : "pfw";

  const job = (
    <div className="t-champ">
      <label htmlFor={`${p}-exp-title`}>{t("profil.experience.job")}</label>
      <span className="t-verre t-saisie">
        <input
          id={`${p}-exp-title`}
          name="title"
          required
          maxLength={120}
          defaultValue={experience?.title ?? ""}
          placeholder={t("profil.experience.jobPlaceholder")}
        />
      </span>
    </div>
  );
  const company = (
    <div className="t-champ">
      <label htmlFor={`${p}-exp-company`}>{t("profil.experience.company")}</label>
      <span className="t-verre t-saisie">
        <input
          id={`${p}-exp-company`}
          name="company"
          required
          maxLength={120}
          defaultValue={experience?.company ?? ""}
        />
      </span>
    </div>
  );

  return (
    <Frame
      mode={mode}
      name="experience"
      title={experience ? t("profil.experience.edit") : t("profil.experience.new")}
      back="/app/profil?section=experiences#experiences"
      formId={`${p}-exp`}
      submit={{ label: experience ? t("profil.save") : t("profil.experience.addCta") }}
      notices={
        error && (
          <Notice tone="err">
            {error === "endBeforeStart" ? t("profil.experience.endBeforeStart") : t("profil.error")}
          </Notice>
        )
      }
      after={
        experience && (
          <form action={deleteExperience}>
            <input type="hidden" name="id" value={experience.id} />
            <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
              {t("profil.experience.remove")}
            </button>
          </form>
        )
      }
    >
      <form id={`${p}-exp`} action={saveExperience} className="t-flux">
        <Back mode={mode} page="/app/profil/experience" name="experience" />
        {experience && <input type="hidden" name="id" value={experience.id} />}
        {mode === "page" ? (
          <>
            {job}
            {company}
          </>
        ) : (
          <div className="t-w4-duo">
            {job}
            {company}
          </div>
        )}
        <div className="t-dates">
          <div className="t-champ">
            <label htmlFor={`${p}-exp-start`}>{t("profil.experience.start")}</label>
            <span className="t-verre t-saisie">
              <input
                id={`${p}-exp-start`}
                name="start"
                type="month"
                required
                defaultValue={dateToMonth(experience?.startDate)}
              />
            </span>
          </div>
          <div className="t-champ">
            <label htmlFor={`${p}-exp-end`}>{t("profil.experience.end")}</label>
            <span className="t-verre t-saisie">
              <input
                id={`${p}-exp-end`}
                name="end"
                type="month"
                defaultValue={dateToMonth(experience?.endDate)}
              />
            </span>
          </div>
        </div>
        <label className="t-li t-nu">
          <span className="t-t">
            <b>{t("profil.experience.current")}</b>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="current"
            defaultChecked={Boolean(experience && !experience.endDate)}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
        <div className="t-champ">
          <label htmlFor={`${p}-exp-result`}>{t("profil.experience.result")}</label>
          <textarea
            id={`${p}-exp-result`}
            name="description"
            rows={3}
            maxLength={3000}
            defaultValue={experience?.description ?? ""}
            placeholder={t("profil.experience.resultPlaceholder")}
            aria-describedby={`${p}-exp-aide`}
            className="t-verre t-saisie t-zone"
          />
          <span id={`${p}-exp-aide`} className="t-aide-c">
            {t("profil.experience.resultHelp")}
          </span>
        </div>
      </form>
    </Frame>
  );
}

const levels = [
  [1, "beginner"],
  [2, "intermediate"],
  [3, "advanced"],
] as const;

/**
 * « Ajouter une compétence »: find the skill in the reference list, choose the level, then what
 * proves it: one of my attestations, one of my projects, or nothing.
 */
export async function SkillScreen({ mode, params }: { mode: ScreenMode; params: ScreenParams }) {
  const user = await requireUser("/app/profil/competence");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const id = one(params.id);
  const current = id
    ? await db.profileSkill.findFirst({
        where: { id, profileId: profile.id },
        include: { skill: { select: { name: true } } },
      })
    : null;
  const q = (one(params.q) ?? "").trim().slice(0, 80);
  const [found, attestations, projects] = await Promise.all([
    q.length >= 2
      ? db.skill.findMany({
          where: {
            OR: [{ name: { contains: q, mode: "insensitive" } }, { aliases: { has: q } }],
          },
          orderBy: { name: "asc" },
          take: 8,
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    talentAttestations(db, user.id),
    listProjects(db, profile.id),
  ]);
  // The exact match first: « sql » → SQL, then SQL avancé, PostgreSQL.
  const wanted = normalize(q);
  const matches = [...found].sort(
    (a, b) => Number(normalize(b.name) === wanted) - Number(normalize(a.name) === wanted),
  );
  const chosen = current?.skill.name ?? matches[0]?.name;
  const level = Math.min(current?.level ?? 2, 4);
  const proof = current?.proofRef
    ? `${current.proof}:${current.proofRef}`
    : current?.proof
      ? "keep"
      : "";
  const error = one(params.erreur);
  const p = mode === "page" ? "pf" : "pfw";

  return (
    <Frame
      mode={mode}
      name="competence"
      wide={false}
      title={mode === "fenetre" && !current ? t("profil.skills.add") : t("profil.skills.title")}
      back="/app/profil?section=competences#competences"
      formId={`${p}-sk`}
      submit={{
        disabled: !chosen,
        label: current
          ? t("profil.save")
          : matches.length === 1 && chosen
            ? t("profil.skills.addNamed", { skill: chosen })
            : t("profil.skills.add"),
      }}
      notices={
        error && (
          <Notice tone="err">
            {error === "unknownSkill" || error === "max"
              ? t(`profil.skills.error.${error}`)
              : t("profil.error")}
          </Notice>
        )
      }
      after={
        current && (
          <form action={removeSkill}>
            <input type="hidden" name="id" value={current.id} />
            <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
              {t("profil.skills.remove")}
            </button>
          </form>
        )
      }
    >
      {!current && (
        <form
          action={mode === "page" ? "/app/profil/competence" : "/app/profil"}
          className="t-verre t-rech"
          role="search"
        >
          {mode === "fenetre" && <input type="hidden" name="fenetre" value="competence" />}
          <TalentIcon name="recherche" size="s" />
          <label htmlFor={`${p}-sk-q`} className="sr-only">
            {t("profil.skills.search")}
          </label>
          <input
            id={`${p}-sk-q`}
            name="q"
            type="search"
            defaultValue={q}
            minLength={2}
            maxLength={80}
            placeholder={t("profil.skills.search")}
            autoComplete="off"
          />
        </form>
      )}

      <form id={`${p}-sk`} action={saveSkill} className="t-flux">
        <Back mode={mode} page="/app/profil/competence" name="competence" />
        {current && <input type="hidden" name="id" value={current.id} />}
        {q && <input type="hidden" name="q" value={q} />}
        {current ? (
          <input type="hidden" name="skill" value={current.skill.name} />
        ) : q && matches.length === 0 ? (
          <p className="t-vide-t">{t("profil.skills.none", { query: q })}</p>
        ) : (
          matches.length > 0 && (
            <fieldset className="t-fs">
              <legend className="sr-only">{t("profil.skills.pick")}</legend>
              <div className="t-puces">
                {matches.map((skill, index) => (
                  <label key={skill.id} className="t-puce t-press">
                    <input
                      type="radio"
                      name="skill"
                      value={skill.name}
                      defaultChecked={index === 0}
                      required
                    />
                    <TalentIcon name="valider" size="xs" />
                    {skill.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        )}
        {current && <p className="t-h2s">{current.skill.name}</p>}

        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.skills.level")}</legend>
          <div className="t-seg">
            {levels.map(([value, key]) => (
              <label key={value}>
                <input type="radio" name="level" value={value} defaultChecked={level === value} />
                {t(`profil.skills.levels.${key}`)}
              </label>
            ))}
            {level === 4 && (
              <label>
                <input type="radio" name="level" value={4} defaultChecked />
                {t("profil.skills.levels.expert")}
              </label>
            )}
          </div>
        </fieldset>

        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.skills.proof")}</legend>
          <div className="t-verre t-liste t-lignes t-choix-l">
            {current?.proof && !current.proofRef && (
              <label className="t-li">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="valider" size="s" />
                </span>
                <span className="t-t">
                  <b>{t(`profil.proof.${current.proof === "link" ? "link" : "experience"}`)}</b>
                  <span>{t("profil.skills.keepProof")}</span>
                </span>
                <input type="radio" name="preuve" value="keep" defaultChecked className="sr-only" />
                <span className="t-radio" aria-hidden />
              </label>
            )}
            {attestations.map((attestation) => (
              <label key={attestation.id} className="t-li">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="certificat" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("profil.skills.attestation")}</b>
                  <span>{attestation.courseTitle}</span>
                </span>
                <input
                  type="radio"
                  name="preuve"
                  value={`certificate:${attestation.id}`}
                  defaultChecked={proof === `certificate:${attestation.id}`}
                  className="sr-only"
                />
                <span className="t-radio" aria-hidden />
              </label>
            ))}
            {projects.map((project) => (
              <label key={project.id} className="t-li">
                <span className="t-cases t-c3" aria-hidden>
                  <TalentIcon name="realisation" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("profil.skills.project")}</b>
                  <span>{project.title}</span>
                </span>
                <input
                  type="radio"
                  name="preuve"
                  value={`project:${project.id}`}
                  defaultChecked={proof === `project:${project.id}`}
                  className="sr-only"
                />
                <span className="t-radio" aria-hidden />
              </label>
            ))}
            <label className="t-li">
              <span className="t-cases" aria-hidden>
                <TalentIcon name="modifier" size="s" />
              </span>
              <span className="t-t">
                <b>{t("profil.skills.declared")}</b>
                <span>{t("profil.skills.declaredText")}</span>
              </span>
              <input
                type="radio"
                name="preuve"
                value=""
                defaultChecked={proof === ""}
                className="sr-only"
              />
              <span className="t-radio" aria-hidden />
            </label>
          </div>
        </fieldset>
        {current?.verified && <p className="t-vide-t">{t("profil.skills.verified")}</p>}
      </form>
    </Frame>
  );
}

/**
 * « Nouveau projet »: up to 6 photos or PDF, a title, what was done, the skills used and
 * « Visible par les recruteurs ». Projects come with `career.portfolio.level`.
 */
export async function ProjectScreen({ mode, params }: { mode: ScreenMode; params: ScreenParams }) {
  const user = await requireUser("/app/profil/projet");
  const t = await getTranslations();
  if ((await portfolioLevel(db, user.id)) === "none") {
    if (mode === "fenetre") return null;
    redirect("/app/profil?section=projets#projets");
  }
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
  const p = mode === "page" ? "pf" : "pfw";

  const files = (
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
  );
  const title = (
    <div className="t-champ">
      <label htmlFor={`${p}-pj-title`}>{t("profil.projects.titleLabel")}</label>
      <span className="t-verre t-saisie">
        <input
          id={`${p}-pj-title`}
          name="title"
          required
          maxLength={120}
          defaultValue={project?.title ?? ""}
          placeholder={t("profil.projects.titlePlaceholder")}
        />
      </span>
    </div>
  );
  const text = (
    <div className="t-champ">
      <label htmlFor={`${p}-pj-text`}>{t("profil.projects.text")}</label>
      <textarea
        id={`${p}-pj-text`}
        name="context"
        rows={mode === "page" ? 4 : 3}
        maxLength={3000}
        defaultValue={project ? projectText(project) : ""}
        placeholder={t("profil.projects.textPlaceholder")}
        className="t-verre t-saisie t-zone"
      />
    </div>
  );

  return (
    <Frame
      mode={mode}
      name="projet"
      title={project ? t("profil.projects.edit") : t("profil.projects.new")}
      back="/app/profil?section=projets#projets"
      formId={`${p}-projet`}
      submit={{ label: t("profil.save") }}
      notices={
        error && (
          <Notice tone="err">
            {error === "file" || error === "limit"
              ? t(`profil.projects.error.${error}`, { max: PROJECT_FILES_MAX })
              : t("profil.error")}
          </Notice>
        )
      }
      after={
        project && (
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit" className="t-bt t-sec t-pl t-danger t-press">
              {t("profil.projects.remove")}
            </button>
          </form>
        )
      }
    >
      <form
        id={`${p}-projet`}
        action={saveProjectAction}
        encType="multipart/form-data"
        className="t-flux"
      >
        {mode === "fenetre" && <input type="hidden" name="fenetre" value="projet" />}
        {project && <input type="hidden" name="id" value={project.id} />}
        {mode === "page" ? (
          <>
            {files}
            {title}
            {text}
          </>
        ) : (
          <div className="t-w4-duo t-w4-duo-s">
            {files}
            <div className="t-flux t-serre">
              {title}
              {text}
            </div>
          </div>
        )}
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
            <label htmlFor={`${p}-pj-new`} className="sr-only">
              {t("profil.projects.addSkill")}
            </label>
            <input
              id={`${p}-pj-new`}
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
    </Frame>
  );
}

const contracts = ["cdi", "cdd", "internship", "freelance", "apprenticeship", "partTime"] as const;
const modes = ["onsite", "hybrid", "remote"] as const;

/** The values already chosen, kept unless unticked. */
function Chips({ name, values }: { name: string; values: string[] }) {
  return values.map((value) => (
    <label key={value} className="t-puce t-press">
      <input type="checkbox" name={name} value={value} defaultChecked />
      {value}
    </label>
  ));
}

/**
 * « Ce que je cherche »: the jobs aimed at, where to work, contract and mode, the wished salary
 * (seen only by the person and the recruiters they apply to) and whether they are available now.
 */
export async function SearchScreen({ mode, params }: { mode: ScreenMode; params: ScreenParams }) {
  const user = await requireUser("/app/profil/recherche");
  const t = await getTranslations();
  const profile = await ensureProfile(db, user.id);
  const error = typeof params.erreur === "string";
  const p = mode === "page" ? "pf" : "pfw";

  return (
    <Frame
      mode={mode}
      name="recherche"
      title={t("profil.search.title")}
      back="/app/profil?section=recherche#recherche"
      formId={`${p}-rech`}
      submit={{ label: t("profil.save") }}
      notices={error && <Notice tone="err">{t("profil.error")}</Notice>}
    >
      <form id={`${p}-rech`} action={saveSearch} className="t-flux">
        <Back mode={mode} page="/app/profil/recherche" name="recherche" />
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.jobs")}</legend>
          <div className="t-puces">
            <Chips name="jobs" values={profile.desiredJobTitles} />
          </div>
          <span className="t-verre t-saisie">
            <TalentIcon name="plus" size="s" />
            <label htmlFor={`${p}-rech-job`} className="sr-only">
              {t("profil.search.addJob")}
            </label>
            <input
              id={`${p}-rech-job`}
              name="newJob"
              maxLength={300}
              placeholder={t("profil.search.addJob")}
            />
          </span>
        </fieldset>
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.places")}</legend>
          <div className="t-puces">
            <Chips name="places" values={profile.desiredLocations} />
          </div>
          <span className="t-verre t-saisie">
            <TalentIcon name="localisation" size="s" />
            <label htmlFor={`${p}-rech-place`} className="sr-only">
              {t("profil.search.addPlace")}
            </label>
            <input
              id={`${p}-rech-place`}
              name="newPlace"
              maxLength={300}
              placeholder={t("profil.search.addPlace")}
            />
          </span>
        </fieldset>
        <fieldset className="t-fs">
          <legend className="t-ck-t">{t("profil.search.contracts")}</legend>
          <div className="t-puces">
            {contracts.map((value) => (
              <label key={value} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="contracts"
                  value={value}
                  defaultChecked={profile.desiredContracts.includes(value)}
                />
                {t(`profil.contract.${value}`)}
              </label>
            ))}
            {modes.map((value) => (
              <label key={value} className="t-puce t-press">
                <input
                  type="checkbox"
                  name="remote"
                  value={value}
                  defaultChecked={profile.remotePreferences.includes(value)}
                />
                {t(`profil.remote.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="t-champ">
          <label htmlFor={`${p}-rech-salary`}>{t("profil.search.salary")}</label>
          <span className="t-verre t-saisie">
            <TalentIcon name="salaire" size="s" />
            <input
              id={`${p}-rech-salary`}
              name="salaryMin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              defaultValue={profile.salaryMin ?? ""}
              placeholder={t("profil.search.salaryPlaceholder")}
              aria-describedby={`${p}-rech-salary-aide`}
            />
          </span>
          <span id={`${p}-rech-salary-aide`} className="t-aide-c">
            {t("profil.search.salaryHelp")}
          </span>
        </div>
        <label className="t-li t-nu">
          <span className="t-t">
            <b>{t("profil.search.availableNow")}</b>
            <span>{t("profil.search.availableText")}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            name="available"
            defaultChecked={profile.availability === "open"}
            className="sr-only"
          />
          <span aria-hidden className="t-sw" />
        </label>
      </form>
    </Frame>
  );
}
