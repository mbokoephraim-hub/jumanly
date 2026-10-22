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
import { careerPointView, RecruiterPreview } from "@/components/talent/profile/panels";
import {
  ExperienceScreen,
  HeadScreen,
  PROFILE_WINDOWS,
  ProjectScreen,
  SearchScreen,
  SkillScreen,
  type ProfileWindow,
} from "@/components/talent/profile/screens";
import { OpenSectionsOnWide, WideLink } from "@/components/talent/profile/window";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { SidePanel } from "@/components/talent/web/dialog";
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
import { phoneTalentRedirect } from "@/server/phone-routes";
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

/** Completeness parts → the screen that fills them (on a tablet or a computer: `wide`). */
const fillers: Record<string, string> = {
  identity: "/app/profil/modifier",
  summary: "/app/profil/modifier",
  experience: "/app/profil/experience",
  education: "/app/profil?section=etudes#etudes",
  skills: "/app/profil/competence",
  languages: "/app/profil?section=langues#langues",
  preferences: "/app/profil/recherche",
};

const wideFillers: Record<string, string> = {
  identity: "/app/profil?fenetre=modifier",
  summary: "/app/profil?fenetre=modifier",
  experience: "/app/profil?fenetre=experience",
  skills: "/app/profil?fenetre=competence",
  preferences: "/app/profil?fenetre=recherche",
};

/** On a phone, the sections keep the order of the planche talent-4 § 3 (`order`). */
const phoneOrder: Record<SectionId, string> = {
  competences: "t-w4-o2",
  projets: "t-w4-o3",
  experiences: "t-w4-o4",
  etudes: "t-w4-o5",
  attestations: "t-w4-o6",
  langues: "t-w4-o7",
  recherche: "t-w4-o8",
};

function Section({
  id,
  icon,
  tone,
  title,
  aside,
  open,
  className,
  children,
}: {
  id: SectionId;
  className?: string;
  icon: TalentIconName;
  tone: "former" | "accomp" | "oppo";
  title: string;
  aside: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <details id={id} open={open} className={cx("t-verre t-sect", phoneOrder[id], className)}>
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
 * On a tablet or a computer (planche web talent-4 § 4 et 5): the head in one card, then two
 * columns (skills, projects, experiences | completeness, « Ce que je cherche », attestations,
 * studies, languages), every section open; the screens open as windows over the profile and
 * « Faire le point » and « Vu par un recruteur » as panels at the right (`?fenetre=`).
 */
export default async function ProfilePage({ searchParams }: PageProps<"/app/profil">) {
  const params = await searchParams;
  if (one(params.photo) === "1") redirect("/app/profil/modifier?photo=1");
  const user = await requireUser("/app/profil");
  // Modèle B (B5, B9): the profile is the Carrière tab on a phone, and its form « Modifier le
  // profil ». A return of a former form (`?ok=`, `?erreur=`) keeps this page.
  if (one(params.fenetre) === "modifier") await phoneTalentRedirect(user.id, "/app/career/profil");
  if (Object.keys(params).length === 0 || params.section)
    await phoneTalentRedirect(user.id, "/app/career/cv");
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
  const fenetre = PROFILE_WINDOWS.find((name) => name === one(params.fenetre));
  const error = fenetre ? undefined : one(params.erreur);

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
  const chips = [
    ...profile.desiredJobTitles,
    ...profile.desiredLocations,
    ...profile.desiredContracts.map((value) => td(`profil.contract.${value}`)),
    ...profile.remotePreferences.map((value) => td(`profil.remote.${value}`)),
  ];
  const searchMore = [
    profile.salaryMin ? t("talentW4.profile.salary", { amount: profile.salaryMin }) : null,
    td(`profil.availability.${profile.availability}`),
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
    <div className="t-flux t-profil t-w4 t-large">
      <div className="t-w4-pfh">
        <div className="t-pf-cov">
          <ProfileCover />
        </div>
        <div className="t-pf-top">
          <BackButton fallback="/app/compte" label={t("profil.back")} className="t-press" />
          <span className="flex gap-2">
            <SheetButton
              target="pf-partager"
              className="t-bi t-press"
              label={t("profil.share.open")}
            >
              <TalentIcon name="partager" size="s" />
            </SheetButton>
            <WideLink
              href="/app/profil/modifier"
              wide="/app/profil?fenetre=modifier"
              className="t-bi t-press"
              aria-label={t("profil.edit")}
            >
              <TalentIcon name="modifier" size="s" />
            </WideLink>
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
          <WideLink
            href="/app/profil/point"
            wide="/app/profil?fenetre=point"
            className="t-bt t-p t-m t-pl t-press"
          >
            <OrbiMark size={20} />
            {t("profil.point")}
          </WideLink>
          <WideLink
            href="/app/profil/apercu"
            wide="/app/profil?fenetre=apercu"
            className="t-bt t-sec t-m t-press"
          >
            <TalentIcon name="profil" size="s" />
            {t("profil.recruiterView")}
          </WideLink>
        </div>
      </div>

      {ok && (
        <Notice tone="ok">
          {t(
            `profil.saved.${(["photo", "partage", "prive", "visibilite"] as const).find((key) => key === ok) ?? "default"}`,
          )}
        </Notice>
      )}
      {error && <Notice tone="err">{t("profil.error")}</Notice>}

      <div className="t-w4-g2 t-w4-pfg">
        <div className="t-w4-col">
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
                <WideLink
                  key={item.id}
                  href={`/app/profil/competence?id=${item.id}`}
                  wide={`/app/profil?fenetre=competence&id=${item.id}`}
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
                </WideLink>
              );
            })}
            <WideLink
              href="/app/profil/competence"
              wide="/app/profil?fenetre=competence"
              className="t-ajout t-s t-press"
            >
              <TalentIcon name="plus" size="s" />
              {t("profil.skills.add")}
            </WideLink>
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
                    <WideLink
                      key={project.id}
                      href={`/app/profil/projet?id=${project.id}`}
                      wide={`/app/profil?fenetre=projet&id=${project.id}`}
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
                    </WideLink>
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
              <WideLink
                href="/app/profil/projet"
                wide="/app/profil?fenetre=projet"
                className="t-ajout t-s t-press"
              >
                <TalentIcon name="plus" size="s" />
                {t("profil.projects.add")}
              </WideLink>
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
              <WideLink
                key={experience.id}
                href={`/app/profil/experience?id=${experience.id}`}
                wide={`/app/profil?fenetre=experience&id=${experience.id}`}
                className="t-ex t-press"
              >
                <b>{experience.title}</b>
                <span>
                  {[
                    experience.company,
                    `${monthYear(experience.startDate)} – ${
                      experience.endDate
                        ? monthYear(experience.endDate)
                        : t("profil.experience.now")
                    }`,
                  ].join(" · ")}
                </span>
                {experience.description && (
                  <span className="t-w4-web t-w4-ex-d">
                    {experience.description.split("\n")[0]}
                  </span>
                )}
              </WideLink>
            ))}
            <WideLink
              href="/app/profil/experience"
              wide="/app/profil?fenetre=experience"
              className="t-ajout t-s t-press"
            >
              <TalentIcon name="plus" size="s" />
              {t("profil.experience.add")}
            </WideLink>
          </Section>
        </div>

        <div className="t-w4-col">
          <WideLink
            href={next ? fillers[next]! : "/app/profil/point"}
            wide={next ? (wideFillers[next] ?? fillers[next]!) : "/app/profil?fenetre=point"}
            className="t-verre t-compl t-w4-o1 t-press"
          >
            <span
              className="t-anneau"
              style={{ "--p": percent } as React.CSSProperties}
              aria-hidden
            >
              <b>{t("profil.completeness.ring", { percent })}</b>
            </span>
            <span className="t-t">
              <b>{t("profil.completeness.title", { percent })}</b>
              <span>
                {next ? td(`profil.completeness.next.${next}`) : t("profil.completeness.done")}
              </span>
            </span>
            <TalentIcon name="suivant" size="s" />
          </WideLink>
          <section aria-labelledby="pf-cherche" className="t-verre t-w4-cherche t-w4-web">
            <h2 id="pf-cherche">
              {t("profil.search.title")}
              <WideLink href="/app/profil/recherche" wide="/app/profil?fenetre=recherche">
                {t("talentW4.profile.edit")}
              </WideLink>
            </h2>
            {chips.length > 0 ? (
              <ul className="t-puces">
                {chips.map((chip) => (
                  <li key={chip} className="t-puce t-on">
                    {chip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="t-vide-t">{t("talentW4.profile.searchEmpty")}</p>
            )}
            <span>{searchMore}</span>
          </section>

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
                    education.endYear ??
                      (education.startYear ? t("profil.education.ongoing") : null),
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
                    aria-label={t("profil.languages.remove", {
                      language: languageName(language.code),
                    })}
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
            className="t-w4-tel"
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
        </div>
      </div>
      <OpenSectionsOnWide selector=".t-profil .t-sect" />

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

      {fenetre && <ProfileWindowView name={fenetre} params={params} userId={user.id} />}
    </div>
  );
}

/**
 * A screen of the profile over « Mon profil » on a tablet or a computer (planche web talent-4
 * § 4 et 5): the forms in a centred window, « Faire le point » and « Vu par un recruteur » in a
 * panel at the right. Keyed by the address, so a new choice opens a new window.
 */
async function ProfileWindowView({
  name,
  params,
  userId,
}: {
  name: ProfileWindow;
  params: Record<string, string | string[] | undefined>;
  userId: string;
}) {
  const t = await getTranslations();
  const key = `${name}-${one(params.id) ?? ""}-${one(params.q) ?? ""}-${one(params.erreur) ?? ""}`;
  switch (name) {
    case "modifier":
      return <HeadScreen key={key} mode="fenetre" params={params} />;
    case "experience":
      return <ExperienceScreen key={key} mode="fenetre" params={params} />;
    case "competence":
      return <SkillScreen key={key} mode="fenetre" params={params} />;
    case "projet":
      return <ProjectScreen key={key} mode="fenetre" params={params} />;
    case "recherche":
      return <SearchScreen key={key} mode="fenetre" params={params} />;
    case "apercu":
      return (
        <SidePanel
          key={key}
          id="pfw-apercu"
          title={t("profil.preview.title")}
          closeLabel={t("talentW4.window.close")}
          openParam="fenetre"
          defaultOpen
          head={
            <span className="t-w4-ph-h">
              <span className="t-cases t-w4-ambre" aria-hidden>
                <TalentIcon name="profil" size="s" />
              </span>
              <span className="t-t">
                <b>{t("profil.preview.title")}</b>
                <span>{t("talentW4.profile.previewText")}</span>
              </span>
            </span>
          }
          className="t-w4-volet"
        >
          <RecruiterPreview userId={userId} />
        </SidePanel>
      );
    case "point": {
      const { body, why } = await careerPointView(userId, "ptw");
      return (
        <>
          <SidePanel
            key={key}
            id="pfw-point"
            title={t("point.title")}
            closeLabel={t("talentW4.window.close")}
            openParam="fenetre"
            defaultOpen
            head={
              <span className="t-w4-ph-h">
                <OrbiMark size={40} />
                <span className="t-t">
                  <b>{t("point.title")}</b>
                  <span>{t("talentW4.profile.pointText")}</span>
                </span>
              </span>
            }
            className="t-w4-volet t-w4-point"
          >
            {body}
            <Link href="/app/profil?orbi=1" className="t-verre t-compo t-w4-demande">
              <TalentIcon name="plus" size="s" />
              <span>{t("talentW4.profile.askOrbi")}</span>
              <span className="t-bi t-env" aria-hidden>
                <TalentIcon name="envoyer" size="s" />
              </span>
            </Link>
          </SidePanel>
          {why}
        </>
      );
    }
  }
}
