import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileCover, ProjectArt } from "@/components/talent/art";
import { TalentAvatar } from "@/components/talent/avatar";
import { BackButton } from "@/components/talent/back-button";
import { CopyButton } from "@/components/talent/copy-button";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { countryName } from "@/config/countries";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { languageName } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import {
  addLanguage,
  deleteEducation,
  removeLanguage,
  saveEducation,
} from "@/server/actions/profile";
import { setPortfolioPublicAction } from "@/server/actions/portfolio";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { talentAttestations } from "@/server/services/attestations";
import { listProjects, portfolioLevel } from "@/server/services/portfolio";
import {
  cefrLevels,
  completeness,
  getFullProfile,
  languageLevels,
  parseProfileLanguages,
} from "@/server/services/profile";
import { profileLanguageCodes, educationLevels, proofOf } from "@/server/services/profile-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profil");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const sections = [
  "competences",
  "projets",
  "experiences",
  "etudes",
  "attestations",
  "langues",
  "recherche",
] as const;
type SectionId = (typeof sections)[number];

/** Old addresses of the profile (`?partie=`, `?section=`) → the section they meant. */
const former: Record<string, SectionId> = {
  competences: "competences",
  experiences: "experiences",
  formations: "etudes",
  langues: "langues",
  preferences: "recherche",
  projets: "projets",
};

/** Completeness parts → the screen that fills them. */
const fillers: Record<string, string> = {
  identity: "/app/profil/modifier",
  summary: "/app/profil/modifier",
  experience: "/app/profil/experience",
  education: "/app/profil?section=etudes#etudes",
  skills: "/app/profil/competence",
  languages: "/app/profil?section=langues#langues",
  preferences: "/app/profil/recherche",
};

function Section({
  id,
  icon,
  tone,
  title,
  aside,
  open,
  children,
}: {
  id: SectionId;
  icon: TalentIconName;
  tone: "former" | "accomp" | "oppo";
  title: string;
  aside: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} open={open} className="t-verre t-sect">
      <summary className="t-sh">
        <span className={cx("t-cases", `t-g-${tone}`)} aria-hidden>
          <TalentIcon name={icon} size="s" />
        </span>
        <b>{title}</b>
        <small>{aside}</small>
        <TalentIcon name="suivant" size="s" className="t-chev" />
      </summary>
      <div className="t-sc">{children}</div>
    </details>
  );
}

/**
 * Mon profil (planche talent-4 § 3): the cover, the person, « Faire le point » and the
 * recruiter's view, the completeness, then sections that fold. Each skill shows its proof; the
 * portfolio became « Projets ». Each section opens its own screen or sheet to change it.
 */
export default async function ProfilePage({ searchParams }: PageProps<"/app/profil">) {
  const params = await searchParams;
  if (one(params.photo) === "1") redirect("/app/profil/modifier?photo=1");
  const user = await requireUser("/app/profil");
  const t = await getTranslations();
  const td = dynamic(t);
  const [profile, attestations, level] = await Promise.all([
    getFullProfile(db, user.id),
    talentAttestations(db, user.id),
    portfolioLevel(db, user.id),
  ]);
  const projects = await listProjects(db, profile.id);
  const { percent, missing } = completeness(profile);
  const languages = parseProfileLanguages(profile.languages);
  const shown = attestations.filter((attestation) => attestation.onProfile);

  const asked =
    former[one(params.partie) ?? ""] ??
    sections.find((id) => id === one(params.section) || id === one(params.ok));
  const opened: SectionId = asked ?? "competences";
  const ok = one(params.ok);
  const error = one(params.erreur);

  const role = profile.headline || profile.desiredJobTitles[0];
  const aim = profile.targetJob || profile.desiredJobTitles[0];
  const place = [role, user.city].filter(Boolean).join(" · ");
  const next = missing[0];
  const topEducation = profile.educations[0];
  const searchLine = [
    profile.desiredContracts[0] && td(`profil.contract.${profile.desiredContracts[0]}`),
    profile.desiredLocations[0],
  ]
    .filter(Boolean)
    .join(" · ");
  const shareUrl = profile.portfolioSlug ? `${siteUrl()}/portfolio/${profile.portfolioSlug}` : "";
  const proofs = new Map([
    ...attestations.map((item) => [item.id, item.courseTitle] as const),
    ...projects.map((item) => [item.id, item.title] as const),
  ]);
  const monthYear = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" }).format(
      date,
    );

  return (
    <div className="t-flux t-profil">
      <div className="t-pf-cov">
        <ProfileCover />
      </div>
      <div className="t-pf-top">
        <BackButton fallback="/app/compte" label={t("profil.back")} className="t-press" />
        <span className="flex gap-2">
          <SheetButton target="pf-partager" className="t-bi t-press" label={t("profil.share.open")}>
            <TalentIcon name="partager" size="s" />
          </SheetButton>
          <Link href="/app/profil/modifier" className="t-bi t-press" aria-label={t("profil.edit")}>
            <TalentIcon name="modifier" size="s" />
          </Link>
        </span>
      </div>

      <div className="t-pf-id">
        <TalentAvatar name={user.name} image={user.image} />
        <h1>{user.name}</h1>
        {place && <p>{place}</p>}
        {aim && (
          <span className="t-cap">
            <i aria-hidden />
            {t("profil.aim", { job: aim })}
          </span>
        )}
      </div>
      <div className="t-pf-act">
        <Link href="/app/profil/point" className="t-bt t-p t-m t-pl t-press">
          <OrbiMark size={20} />
          {t("profil.point")}
        </Link>
        <Link href="/app/profil/apercu" className="t-bt t-sec t-m t-press">
          <TalentIcon name="profil" size="s" />
          {t("profil.recruiterView")}
        </Link>
      </div>

      {ok && (
        <Notice tone="ok">
          {t(
            `profil.saved.${(["photo", "partage", "prive", "visibilite"] as const).find((key) => key === ok) ?? "default"}`,
          )}
        </Notice>
      )}
      {error && <Notice tone="err">{t("profil.error")}</Notice>}

      <Link href={next ? fillers[next]! : "/app/profil/point"} className="t-verre t-compl t-press">
        <span className="t-anneau" style={{ "--p": percent } as React.CSSProperties} aria-hidden>
          <b>{t("profil.completeness.ring", { percent })}</b>
        </span>
        <span className="t-t">
          <b>{t("profil.completeness.title", { percent })}</b>
          <span>
            {next ? td(`profil.completeness.next.${next}`) : t("profil.completeness.done")}
          </span>
        </span>
        <TalentIcon name="suivant" size="s" />
      </Link>

      <Section
        id="competences"
        icon="cap"
        tone="former"
        title={t("profil.skills.title")}
        aside={String(profile.skills.length)}
        open={opened === "competences"}
      >
        {profile.skills.length === 0 && <p className="t-vide-t">{t("profil.skills.empty")}</p>}
        {profile.skills.map((item) => {
          const proof = proofOf(item);
          return (
            <Link
              key={item.id}
              href={`/app/profil/competence?id=${item.id}`}
              className="t-prv t-press"
            >
              <b>{item.skill.name}</b>
              <span className={cx("t-pr", proof === "none" && "t-n")}>
                {proof === "certificate" && <TalentIcon name="certificat" size="xs" />}
                {proof === "project" && <TalentIcon name="realisation" size="xs" />}
                {td(`profil.proof.${proof}`)}
                {item.proofRef && proofs.get(item.proofRef) && (
                  <span className="sr-only">
                    {t("profil.proof.named", { name: proofs.get(item.proofRef)! })}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
        <Link href="/app/profil/competence" className="t-ajout t-s t-press">
          <TalentIcon name="plus" size="s" />
          {t("profil.skills.add")}
        </Link>
      </Section>

      <Section
        id="projets"
        icon="realisation"
        tone="oppo"
        title={t("profil.projects.title")}
        aside={String(projects.length)}
        open={opened === "projets"}
      >
        {projects.length > 0 && (
          <div className="t-projs">
            {projects.map((project) => {
              const image = project.files.findIndex((file) => file.type.startsWith("image/"));
              return (
                <Link
                  key={project.id}
                  href={`/app/profil/projet?id=${project.id}`}
                  className="t-re t-press"
                >
                  {image >= 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a private file, served by its route
                    <img src={`/api/projets/${project.id}/${image}`} alt="" loading="lazy" />
                  ) : (
                    <ProjectArt kind={project.files.length > 0 ? "pdf" : "board"} />
                  )}
                  <b>{project.title}</b>
                  {!project.visible && (
                    <span className="t-re-p">{t("profil.projects.private")}</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        {level === "none" ? (
          <Link href="/app/abonnement" className="t-li t-press">
            <span className="t-cases" aria-hidden>
              <TalentIcon name="cadenas" size="s" />
            </span>
            <span className="t-t">
              <b>{t("profil.projects.locked")}</b>
              <span>{t("profil.projects.lockedText")}</span>
            </span>
            <TalentIcon name="suivant" />
          </Link>
        ) : (
          <Link href="/app/profil/projet" className="t-ajout t-s t-press">
            <TalentIcon name="plus" size="s" />
            {t("profil.projects.add")}
          </Link>
        )}
      </Section>

      <Section
        id="experiences"
        icon="entreprise"
        tone="accomp"
        title={t("profil.experience.title")}
        aside={String(profile.experiences.length)}
        open={opened === "experiences"}
      >
        {profile.experiences.length === 0 && (
          <p className="t-vide-t">{t("profil.experience.empty")}</p>
        )}
        {profile.experiences.map((experience) => (
          <Link
            key={experience.id}
            href={`/app/profil/experience?id=${experience.id}`}
            className="t-ex t-press"
          >
            <b>{experience.title}</b>
            <span>
              {[
                experience.company,
                `${monthYear(experience.startDate)} – ${
                  experience.endDate ? monthYear(experience.endDate) : t("profil.experience.now")
                }`,
              ].join(" · ")}
            </span>
          </Link>
        ))}
        <Link href="/app/profil/experience" className="t-ajout t-s t-press">
          <TalentIcon name="plus" size="s" />
          {t("profil.experience.add")}
        </Link>
      </Section>

      <Section
        id="etudes"
        icon="former"
        tone="former"
        title={t("profil.education.title")}
        aside={
          topEducation
            ? td(`profil.education.short.${topEducation.level}`)
            : String(profile.educations.length)
        }
        open={opened === "etudes"}
      >
        {profile.educations.length === 0 && (
          <p className="t-vide-t">{t("profil.education.empty")}</p>
        )}
        {profile.educations.map((education) => (
          <SheetButton
            key={education.id}
            target={`pf-etude-${education.id}`}
            className="t-ex t-press"
          >
            <b>{education.degree}</b>
            <span>
              {[
                education.school,
                education.endYear ?? (education.startYear ? t("profil.education.ongoing") : null),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </SheetButton>
        ))}
        <SheetButton target="pf-etude-new" className="t-ajout t-s t-press">
          <TalentIcon name="plus" size="s" />
          {t("profil.education.add")}
        </SheetButton>
      </Section>

      <Section
        id="attestations"
        icon="certificat"
        tone="former"
        title={t("profil.attestations.title")}
        aside={String(shown.length)}
        open={opened === "attestations"}
      >
        {shown.length === 0 && <p className="t-vide-t">{t("profil.attestations.empty")}</p>}
        {shown.map((attestation) => (
          <Link
            key={attestation.id}
            href={`/app/learn/attestations/${attestation.code}`}
            className="t-ex t-press"
          >
            <b>{attestation.courseTitle}</b>
            <span>{t("profil.attestations.line", { code: attestation.code })}</span>
          </Link>
        ))}
        <Link href="/app/learn/mes-formations?vue=attestations" className="t-ajout t-s t-press">
          {t("profil.attestations.manage")}
        </Link>
      </Section>

      <Section
        id="langues"
        icon="document"
        tone="accomp"
        title={t("profil.languages.title")}
        aside={String(languages.length)}
        open={opened === "langues"}
      >
        {languages.length === 0 && <p className="t-vide-t">{t("profil.languages.empty")}</p>}
        {languages.map((language) => (
          <div key={language.code} className="t-prv">
            <b>{languageName(language.code)}</b>
            <span className="t-pr t-n">
              {[td(`profil.languages.level.${language.level}`), language.cefr]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <form action={removeLanguage}>
              <input type="hidden" name="code" value={language.code} />
              <button
                type="submit"
                className="t-bi t-xs t-press"
                aria-label={t("profil.languages.remove", { language: languageName(language.code) })}
              >
                <TalentIcon name="fermer" size="xs" />
              </button>
            </form>
          </div>
        ))}
        <SheetButton target="pf-langue" className="t-ajout t-s t-press">
          <TalentIcon name="plus" size="s" />
          {t("profil.languages.add")}
        </SheetButton>
      </Section>

      <Section
        id="recherche"
        icon="cap"
        tone="oppo"
        title={t("profil.search.title")}
        aside={searchLine || "—"}
        open={opened === "recherche"}
      >
        <dl className="t-masque t-nu">
          <div className="t-l">
            <dt>{t("profil.search.jobs")}</dt>
            <dd>{profile.desiredJobTitles.join(", ") || "—"}</dd>
          </div>
          <div className="t-l">
            <dt>{t("profil.search.places")}</dt>
            <dd>
              {profile.desiredLocations.join(", ") ||
                (user.country ? countryName(user.country) : "—")}
            </dd>
          </div>
          <div className="t-l">
            <dt>{t("profil.search.contracts")}</dt>
            <dd>
              {[
                ...profile.desiredContracts.map((value) => td(`profil.contract.${value}`)),
                ...profile.remotePreferences.map((value) => td(`profil.remote.${value}`)),
              ].join(", ") || "—"}
            </dd>
          </div>
          <div className="t-l">
            <dt>{t("profil.search.available")}</dt>
            <dd>{td(`profil.availability.${profile.availability}`)}</dd>
          </div>
        </dl>
        <Link href="/app/profil/recherche" className="t-ajout t-s t-press">
          <TalentIcon name="modifier" size="s" />
          {t("profil.search.edit")}
        </Link>
      </Section>

      {/* Études: one sheet to add, one per study to change or remove. */}
      {[undefined, ...profile.educations].map((education) => (
        <Sheet
          key={education?.id ?? "new"}
          id={education ? `pf-etude-${education.id}` : "pf-etude-new"}
          title={education ? t("profil.education.edit") : t("profil.education.add")}
          closeLabel={t("offer.close")}
        >
          <form action={saveEducation} className="t-flux">
            {education && <input type="hidden" name="id" value={education.id} />}
            <div className="t-champ">
              <label htmlFor={`pf-ed-degree-${education?.id ?? "new"}`}>
                {t("profil.education.degree")}
              </label>
              <span className="t-verre t-saisie">
                <input
                  id={`pf-ed-degree-${education?.id ?? "new"}`}
                  name="degree"
                  defaultValue={education?.degree ?? ""}
                  required
                  maxLength={160}
                  placeholder={t("profil.education.degreePlaceholder")}
                />
              </span>
            </div>
            <div className="t-champ">
              <label htmlFor={`pf-ed-school-${education?.id ?? "new"}`}>
                {t("profil.education.school")}
              </label>
              <span className="t-verre t-saisie">
                <input
                  id={`pf-ed-school-${education?.id ?? "new"}`}
                  name="school"
                  defaultValue={education?.school ?? ""}
                  required
                  maxLength={160}
                />
              </span>
            </div>
            <div className="t-champ">
              <label htmlFor={`pf-ed-level-${education?.id ?? "new"}`}>
                {t("profil.education.level")}
              </label>
              <span className="t-verre t-saisie">
                <select
                  id={`pf-ed-level-${education?.id ?? "new"}`}
                  name="level"
                  defaultValue={education?.level ?? "bachelor"}
                >
                  {educationLevels.map((value) => (
                    <option key={value} value={value}>
                      {td(`profil.education.short.${value}`)}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <input type="hidden" name="field" value={education?.field ?? ""} />
            <div className="t-dates">
              <div className="t-champ">
                <label htmlFor={`pf-ed-start-${education?.id ?? "new"}`}>
                  {t("profil.education.start")}
                </label>
                <span className="t-verre t-saisie">
                  <input
                    id={`pf-ed-start-${education?.id ?? "new"}`}
                    name="startYear"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    defaultValue={education?.startYear ?? ""}
                    placeholder="2021"
                  />
                </span>
              </div>
              <div className="t-champ">
                <label htmlFor={`pf-ed-end-${education?.id ?? "new"}`}>
                  {t("profil.education.end")}
                </label>
                <span className="t-verre t-saisie">
                  <input
                    id={`pf-ed-end-${education?.id ?? "new"}`}
                    name="endYear"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    defaultValue={education?.endYear ?? ""}
                    placeholder="2024"
                  />
                </span>
              </div>
            </div>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("profil.save")}
            </button>
            {education && (
              <button
                type="submit"
                formAction={deleteEducation}
                formNoValidate
                className="t-bt t-sec t-pl t-danger t-press"
              >
                {t("profil.education.remove")}
              </button>
            )}
          </form>
        </Sheet>
      ))}

      <Sheet id="pf-langue" title={t("profil.languages.add")} closeLabel={t("offer.close")}>
        <form action={addLanguage} className="t-flux">
          <div className="t-champ">
            <label htmlFor="pf-lg-code">{t("profil.languages.language")}</label>
            <span className="t-verre t-saisie">
              <select id="pf-lg-code" name="code" defaultValue="fr">
                {profileLanguageCodes.map((code) => (
                  <option key={code} value={code}>
                    {languageName(code)}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <fieldset className="t-fs">
            <legend className="t-lab-c">{t("profil.languages.levelLabel")}</legend>
            <div className="t-puces">
              {languageLevels.map((value, index) => (
                <label key={value} className="t-puce">
                  <input type="radio" name="level" value={value} defaultChecked={index === 1} />
                  {td(`profil.languages.level.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="t-champ">
            <label htmlFor="pf-lg-cefr">{t("profil.languages.cefr")}</label>
            <span className="t-verre t-saisie">
              <select id="pf-lg-cefr" name="cefr" defaultValue="">
                <option value="">{t("profil.languages.cefrNone")}</option>
                {cefrLevels.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <button type="submit" className="t-bt t-p t-pl t-press">
            {t("profil.languages.save")}
          </button>
        </form>
      </Sheet>

      <Sheet
        id="pf-partager"
        title={t("profil.share.title")}
        closeLabel={t("offer.close")}
        openParam="partager"
        defaultOpen={one(params.partager) === "1"}
      >
        {level === "none" ? (
          <>
            <p className="t-vide-t">{t("profil.share.locked")}</p>
            <Link href="/app/abonnement" className="t-bt t-sec t-pl t-press">
              {t("profil.share.plans")}
            </Link>
          </>
        ) : (
          <>
            <p className="t-vide-t">{t("profil.share.text")}</p>
            <form action={setPortfolioPublicAction} className="t-verre t-liste">
              <label className="t-li">
                <span className="t-t">
                  <b>{t("profil.share.public")}</b>
                  <span>{t("profil.share.publicText")}</span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  name="public"
                  defaultChecked={profile.portfolioPublic}
                  className="sr-only"
                />
                <span aria-hidden className="t-sw" />
              </label>
              <button type="submit" className="t-li t-press">
                <span className="t-t">
                  <b>{t("profil.share.save")}</b>
                </span>
              </button>
            </form>
            {profile.portfolioPublic && shareUrl && (
              <CopyButton
                value={shareUrl}
                label={t("profil.share.copy")}
                copied={t("profil.share.copied")}
                className="t-bt t-p t-pl t-press"
              />
            )}
          </>
        )}
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("profil.share.privacy")}</span>
        </p>
      </Sheet>
    </div>
  );
}
