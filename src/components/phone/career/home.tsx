"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { addSuggestedSkillsAction } from "@/server/actions/career-phone";
import { CompanyMark } from "../explorer/cards";
import { FilAvatar } from "../fil/avatar";
import { OrbiDisc, PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { CareerEntry, CareerView } from "./data";
import { CareerSearch } from "./search";
import { ShareSheet } from "./share";
import { LanguagesSheet, SkillsSheet } from "./sheets";

type Sheet = "share" | "cv" | "competences" | "langues";

const TABS = ["profil", "cv", "portfolio", "progression", "candidatures"] as const;
type Tab = (typeof TABS)[number];

/**
 * The Carrière tab on the phone (Modèle B, lot B5, planche Carrière): the person's banner, photo,
 * Cap and how complete the profile is, then « Profil · CV · Portfolio · Progression · Candidatures »
 * in place. Kept mounted under the pages, like the other tabs.
 */
export function PhoneCareer({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  const [tab, setTab] = useState<Tab>("profil");
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const params = useSearchParams();
  const router = useRouter();

  // « Ajouter des compétences », « Langues et lieux », « Nouveau CV » asked from another screen
  // (Progression's next steps, the search): `?ajouter=` opens the sheet over the profile.
  const asked = params.get("ajouter") ?? (params.get("nouveau") === "1" ? "cv" : null);
  useEffect(() => {
    if (asked !== "competences" && asked !== "langues" && asked !== "cv") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setTab(asked === "cv" ? "cv" : "profil");
    setSheet(asked);
    router.replace("/app/career/cv", { scroll: false });
  }, [asked, router]);
  const [cvMenu, setCvMenu] = useState<CareerView["cvs"][number] | null>(null);
  const [suggestion, setSuggestion] = useState(view.suggestion);
  const [pending, start] = useTransition();

  const addSuggestion = () => {
    if (!suggestion) return;
    start(async () => {
      const result = await addSuggestedSkillsAction([suggestion.skillId]).catch(() => null);
      if (result?.ok) {
        showToast({ message: t("suggestionAdded", { skill: suggestion.skill }) });
        setSuggestion(null);
      }
    });
  };

  return (
    <div className="nb-page nb-ex nb-ca">
      <div className="nb-ca-banniere" data-ton={view.tone} aria-hidden>
        <svg viewBox="0 0 390 150" preserveAspectRatio="none">
          <g fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2">
            <path d="M0 70 C 90 30, 180 110, 270 60 S 390 40, 390 40" />
            <path d="M0 100 C 100 60, 190 140, 280 90 S 390 70, 390 70" />
          </g>
        </svg>
      </div>
      <div className="nb-ca-haut">
        <p className="nb-ca-sur">{t("eyebrow")}</p>
        <span className="nb-ca-ronds">
          <button
            type="button"
            className="nb-ex-rond"
            aria-label={t("search")}
            aria-expanded={searching}
            onClick={() => setSearching(true)}
          >
            <PhoneIcon name="recherche" size={20} />
          </button>
          <Link href="/app/parametres" className="nb-ex-rond" aria-label={t("settings")}>
            <PhoneIcon name="reglages" size={20} />
          </Link>
        </span>
      </div>

      {searching ? (
        <CareerSearch
          items={view.search}
          plan={view.plan}
          onClose={() => setSearching(false)}
          onNewCv={() => {
            setSearching(false);
            setTab("cv");
            setSheet("cv");
          }}
        />
      ) : (
        <>
          <div className="nb-ex-id nb-ca-id">
            <div className="nb-ex-id-haut">
              <span className="nb-ex-id-photo">
                <FilAvatar
                  initials={view.initials}
                  image={view.image}
                  tone={view.tone}
                  org={false}
                  size={96}
                />
              </span>
              <span className="nb-ex-id-actions">
                <button
                  type="button"
                  className="nb-bouton"
                  data-contour=""
                  onClick={() => setSheet("share")}
                >
                  {t("share")}
                </button>
                <Link href="/app/career/profil" className="nb-bouton" data-creme="">
                  {t("edit")}
                </Link>
              </span>
            </div>
            <h1 className="nb-ex-id-nom">{view.name}</h1>
            <p className="nb-meta nb-ex-id-handle">{view.handle}</p>
            <div className="nb-ca-puces">
              <span className="nb-ca-cap">
                {view.cap ? t("cap", { job: view.cap }) : t("noCap")}
              </span>
              <span className="nb-ca-dispo">{view.availability}</span>
            </div>
            <div className="nb-ca-complet">
              <span>{t("complete")}</span>
              <b>{t("completeValue", { percent: view.percent })}</b>
            </div>
            <span
              className="nb-ca-barre"
              role="progressbar"
              aria-label={t("complete")}
              aria-valuenow={view.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${view.percent}%` }} />
            </span>
          </div>

          <div className="nb-ex-onglets nb-ca-onglets" role="tablist" aria-label={t("tabs")}>
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`car-${key}`}
                aria-selected={tab === key}
                aria-controls="car-panneau"
                onClick={() => setTab(key)}
              >
                {t(`tab.${key}`)}
              </button>
            ))}
          </div>

          <div id="car-panneau" role="tabpanel" aria-labelledby={`car-${tab}`}>
            {tab === "profil" ? (
              <ProfilePanel
                view={view}
                suggestion={suggestion}
                adding={pending}
                onAdd={addSuggestion}
                onSheet={setSheet}
              />
            ) : null}
            {tab === "cv" ? (
              <CvPanel view={view} onNew={() => setSheet("cv")} onMenu={setCvMenu} />
            ) : null}
            {tab === "portfolio" ? <PortfolioPanel view={view} /> : null}
            {tab === "progression" ? <ProgressionPanel view={view} /> : null}
            {tab === "candidatures" ? <ApplicationsPanel view={view} /> : null}
          </div>
        </>
      )}

      <ShareSheet
        open={sheet === "share"}
        onClose={() => setSheet(null)}
        name={view.name}
        share={view.share}
      />
      <PhoneSheet
        open={sheet === "cv"}
        onClose={() => setSheet(null)}
        label={t("cv.new")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("cv.new")}</b>
        <Link href="/app/career/cv/modeles" className="nb-opt nb-ca-opt">
          <b>{t("cv.fromTemplate")}</b>
          <small>{t("cv.fromTemplateText")}</small>
        </Link>
        <Link href="/app/career/cv/importer" className="nb-opt nb-ca-opt">
          <b>{t("cv.import")}</b>
          <small>{t("cv.importText")}</small>
        </Link>
        <Link href="/app/career/cv/modeles?orbi=1" className="nb-opt nb-ca-opt" data-orbi="">
          <b>{t("cv.orbi")}</b>
          <small>{t("cv.orbiText")}</small>
        </Link>
      </PhoneSheet>
      <CvMenu cv={cvMenu} onClose={() => setCvMenu(null)} />
      <SkillsSheet
        open={sheet === "competences"}
        onClose={() => setSheet(null)}
        suggestions={view.sheets.skills}
      />
      {sheet === "langues" ? (
        <LanguagesSheet open onClose={() => setSheet(null)} choices={view.sheets} />
      ) : null}
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href?: string; onClick?: () => void; aria: string } | null;
  children: React.ReactNode;
}) {
  return (
    <section className="nb-ca-sec" aria-label={title}>
      <div className="nb-ca-sec-t">
        <h2>{title}</h2>
        {action?.href ? (
          <Link href={action.href} aria-label={action.aria}>
            {action.label}
          </Link>
        ) : action ? (
          <button type="button" onClick={action.onClick} aria-label={action.aria}>
            {action.label}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Entry({ entry, edit }: { entry: CareerEntry; edit: string }) {
  return (
    <div className="nb-ex-entree nb-ca-entree">
      <CompanyMark initials={entry.initials} logo={null} tone={entry.tone} size={48} />
      <span>
        <b>{entry.title}</b>
        <small>{entry.when}</small>
      </span>
      {entry.href ? (
        <Link href={entry.href} className="nb-ca-lien" aria-label={`${edit} : ${entry.title}`}>
          {edit}
        </Link>
      ) : null}
    </div>
  );
}

function ProfilePanel({
  view,
  suggestion,
  adding,
  onAdd,
  onSheet,
}: {
  view: CareerView;
  suggestion: CareerView["suggestion"];
  adding: boolean;
  onAdd: () => void;
  onSheet: (sheet: "competences" | "langues") => void;
}) {
  const t = useTranslations("phoneCareer");
  const modify = t("modify");
  const add = t("add");
  return (
    <div className="nb-ca-profil">
      {suggestion ? (
        <div className="nb-ca-orbi">
          <OrbiDisc size={44} />
          <p>{suggestion.text}</p>
          <button type="button" onClick={onAdd} disabled={adding}>
            {t("suggestionAdd")}
          </button>
        </div>
      ) : null}

      <Section
        title={t("about")}
        action={{
          label: modify,
          href: "/app/career/profil/apropos",
          aria: `${modify} : ${t("about")}`,
        }}
      >
        <p className="nb-ex-texte">{view.about ?? t("aboutEmpty")}</p>
      </Section>

      <Section
        title={t("skills")}
        action={{
          label: add,
          onClick: () => onSheet("competences"),
          aria: `${add} : ${t("skills")}`,
        }}
      >
        {view.skills.length > 0 ? (
          <div className="nb-ex-comp">
            {view.skills.map((skill) => (
              <span key={skill.id}>{skill.name}</span>
            ))}
          </div>
        ) : (
          <p className="nb-ex-texte nb-meta">{t("skillsEmpty")}</p>
        )}
      </Section>

      <Section
        title={t("experience")}
        action={{
          label: add,
          href: "/app/career/profil/experience/nouvelle",
          aria: `${add} : ${t("experience")}`,
        }}
      >
        {view.experiences.length > 0 ? (
          view.experiences.map((entry) => <Entry key={entry.id} entry={entry} edit={modify} />)
        ) : (
          <p className="nb-ex-texte nb-meta">{t("experienceEmpty")}</p>
        )}
      </Section>

      <Section
        title={t("education")}
        action={{
          label: add,
          href: "/app/career/profil/formation/nouvelle",
          aria: `${add} : ${t("education")}`,
        }}
      >
        {view.educations.length > 0 ? (
          view.educations.map((entry) => <Entry key={entry.id} entry={entry} edit={modify} />)
        ) : (
          <p className="nb-ex-texte nb-meta">{t("educationEmpty")}</p>
        )}
      </Section>

      <Section
        title={t("languages")}
        action={{
          label: modify,
          onClick: () => onSheet("langues"),
          aria: `${modify} : ${t("languages")}`,
        }}
      >
        {view.places.length > 0 ? (
          <div className="nb-ex-comp">
            {view.places.map((place) => (
              <span key={place}>{place}</span>
            ))}
          </div>
        ) : (
          <p className="nb-ex-texte nb-meta">{t("languagesEmpty")}</p>
        )}
      </Section>
    </div>
  );
}

/** A small CV page drawn in CSS (planche Carrière-CV): never the real content. */
function CvThumb({ strong }: { strong: boolean }) {
  return (
    <span className="nb-ca-cv-mini" data-fort={strong ? "" : undefined} aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function CvPanel({
  view,
  onNew,
  onMenu,
}: {
  view: CareerView;
  onNew: () => void;
  onMenu: (cv: CareerView["cvs"][number]) => void;
}) {
  const t = useTranslations("phoneCareer");
  return (
    <div className="nb-ca-liste">
      <button type="button" className="nb-ca-cv nb-ca-cv-nouveau" onClick={onNew}>
        <span className="nb-ca-cv-plus" aria-hidden>
          <PhoneIcon name="plus" size={22} />
        </span>
        <span>
          <b>{t("cv.new")}</b>
          <small>{t("cv.newText")}</small>
        </span>
      </button>
      {view.cvs.map((cv, index) => (
        <div key={cv.id} className="nb-ca-cv">
          <Link href={cv.href} className="nb-ca-cv-l">
            <CvThumb strong={index % 2 === 0} />
            <span>
              <b>{cv.title}</b>
              <small>{cv.line}</small>
              <span className="nb-ca-tags">
                {cv.tags.map((tag) => (
                  <em key={tag.text} data-fort={tag.strong ? "" : undefined}>
                    {tag.text}
                  </em>
                ))}
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="nb-ca-plus"
            aria-label={t("cv.more", { title: cv.title })}
            onClick={() => onMenu(cv)}
          >
            <PhoneIcon name="plusOptions" size={22} />
          </button>
        </div>
      ))}
      {view.adapt ? (
        <div className="nb-ca-orbi">
          <OrbiDisc size={44} />
          <p>{view.adapt.text}</p>
          <Link href={view.adapt.href}>{t("cv.adaptButton")}</Link>
        </div>
      ) : null}
    </div>
  );
}

function CvMenu({ cv, onClose }: { cv: CareerView["cvs"][number] | null; onClose: () => void }) {
  const t = useTranslations("phoneCareer");
  return (
    <PhoneSheet
      open={cv !== null}
      onClose={onClose}
      label={cv?.title ?? t("cv.new")}
      closeLabel={t("close")}
    >
      {cv ? (
        <>
          <b className="nb-ex-feuille-t">{cv.title}</b>
          <Link href={cv.href} className="nb-opt nb-fil-opt">
            {t("cv.menu.edit")}
          </Link>
          <Link href={`${cv.href}?exporter=1`} className="nb-opt nb-fil-opt">
            {t("cv.menu.export")}
          </Link>
          <Link href={`/app/career/cv/${cv.id}/adapter`} className="nb-opt nb-fil-opt">
            {t("cv.menu.adapt")}
          </Link>
          <Link href={`${cv.href}?action=dupliquer`} className="nb-opt nb-fil-opt">
            {t("cv.menu.duplicate")}
          </Link>
          {!cv.primary ? (
            <Link href={`${cv.href}?action=defaut`} className="nb-opt nb-fil-opt">
              {t("cv.menu.primary")}
            </Link>
          ) : null}
          <Link href={`${cv.href}?action=supprimer`} className="nb-opt nb-fil-opt" data-danger="">
            {t("cv.menu.delete")}
          </Link>
        </>
      ) : null}
    </PhoneSheet>
  );
}

function PortfolioPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  return (
    <div className="nb-ca-reals">
      {view.projects.map((project) => (
        <Link key={project.id} href={project.href} className="nb-ca-real">
          <span className="nb-ex-real-img" data-ton={project.tone} aria-hidden>
            {project.featured ? <em className="nb-ca-avant">{t("portfolio.featured")}</em> : null}
            <svg viewBox="0 0 160 110" fill="none">
              <path
                d="M18 82 L58 56 L90 70 L128 32 L150 44"
                stroke="rgba(255,255,255,.7)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <b>{project.title}</b>
          <small>{project.line}</small>
        </Link>
      ))}
      <Link href="/app/career/portfolio/nouvelle" className="nb-ca-real nb-ca-real-ajout">
        <span className="nb-ca-cv-plus" aria-hidden>
          <PhoneIcon name="plus" size={22} />
        </span>
        <b>{t("portfolio.add")}</b>
        <small>{t("portfolio.addText")}</small>
      </Link>
    </div>
  );
}

function ProgressionPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  const progression = view.progression;
  const stages = ["discovery", "building", "ready", "competitive"] as const;
  return (
    <div className="nb-ca-prog">
      <p className="nb-ca-groupe">{t("progression.stageLabel")}</p>
      <p className="nb-ca-stade">{progression.stage}</p>
      <p className="nb-meta">{progression.next}</p>
      {progression.diagnostic ? (
        <Link href="/app/career/diagnostic" className="nb-bouton" data-plein="" data-large="">
          {t("progression.diagnostic")}
        </Link>
      ) : null}
      <ol className="nb-ca-stades" aria-label={t("progression.stageLabel")}>
        {stages.map((stage, index) => (
          <li
            key={stage}
            data-etat={
              index < progression.stageIndex
                ? "fait"
                : index === progression.stageIndex
                  ? "actuel"
                  : undefined
            }
            aria-current={index === progression.stageIndex ? "step" : undefined}
          >
            <span aria-hidden />
            {t(`progression.stage.${stage}`)}
          </li>
        ))}
      </ol>
      <div className="nb-ca-chiffres">
        <span>
          <b>{progression.courses}</b>
          <small>{t("progression.courses")}</small>
        </span>
        <span>
          <b>{t("completeValue", { percent: progression.percent })}</b>
          <small>{t("progression.profile")}</small>
        </span>
        <span>
          <b>{progression.applications}</b>
          <small>{t("progression.applications")}</small>
        </span>
      </div>
      {progression.steps.length > 0 ? (
        <>
          <p className="nb-ca-groupe">{t("progression.steps")}</p>
          {progression.steps.map((step) => (
            <Link key={step.text} href={step.href} className="nb-ca-etape">
              <span className="nb-ca-rond" aria-hidden />
              <span>{step.text}</span>
              <small>{t("progression.open")}</small>
            </Link>
          ))}
        </>
      ) : null}
    </div>
  );
}

function ApplicationsPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  if (view.applications.length === 0)
    return (
      <div className="nb-ca-vide">
        <p className="nb-ex-texte">{t("applications.empty")}</p>
        <Link href="/app/jobs" className="nb-bouton" data-plein="">
          {t("applications.explore")}
        </Link>
      </div>
    );
  return (
    <div className="nb-ca-liste">
      {view.applications.map((row) => (
        <Link key={row.id} href={row.href} className="nb-ca-cand">
          <CompanyMark initials={row.initials} logo={null} tone={row.tone} size={48} />
          <span className="nb-ca-cand-c">
            <span className="nb-ca-cand-t">
              <b>{row.title}</b>
              <em data-fort={row.strong ? "" : undefined}>{row.status}</em>
            </span>
            <small>{row.line}</small>
            <span
              className="nb-ca-barres"
              role="img"
              aria-label={t("applications.steps", { count: row.bars })}
            >
              {[1, 2, 3, 4].map((bar) => (
                <i key={bar} data-plein={bar <= row.bars ? "" : undefined} />
              ))}
            </span>
            <small data-fort={row.noteStrong ? "" : undefined}>{row.note}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}
