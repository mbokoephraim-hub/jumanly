"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { showToast } from "@/components/motion/toaster";
import type { AudienceFigures, AudiencePeriod } from "@/lib/audience";
import {
  addSuggestedSkillsAction,
  setCareerAvailabilityAction,
} from "@/server/actions/career-phone";
import { PhoneBack } from "../back";
import type { PostView } from "../fil/data";
import { PostCard, type PostSheet } from "../fil/post";
import { PostSheets, type SendTarget } from "../fil/sheets";
import { PhoneIcon } from "../icon";
import { ExperienceLogo, ExperienceMeta, ExperiencePoints } from "../profil/experience-head";
import { PhotoViewer } from "../profil/photo-viewer";
import { AboutCard, PlanMark, ringOf, SOCIAL_PATHS, VerifiedMark } from "../profil/profile";
import { AudienceStats } from "../profil/stats";
import type { Availability, CareerView } from "./data";
import { CAMERA, EYE, Heading, PEN, PLUS, Ring, Segment, SHARE, Svg, tint } from "./kit";
import { ShareSheet } from "./share";
import { LanguagesSheet, SkillsSheet } from "./sheets";

type Sheet = "share" | "competences" | "langues";

const TABS = ["publications", "apropos", "realisations", "statistiques"] as const;
type Tab = (typeof TABS)[number];

/** The colour of each availability (maquette Carriere.dc.html, DISPO). */
const AVAILABILITY_COLOR: Record<Availability, string> = {
  open: "var(--nb-menthe)",
  listening: "var(--nb-ambre)",
  not_looking: "var(--nb-brume)",
};

/**
 * « Mon profil » on the phone (demande d'Ephraïm du 29/10/2026): what others see of the person,
 * out of Carrière, opened from the round photo at the top of every tab. The head of
 * docs/carriere-v3 (banner, photo and its ring, networks, chips, « Profil complété », « Modifier ·
 * Partager · Voir comme les autres »), then « Publications · À propos · Réalisations ·
 * Statistiques ».
 */
export function PhoneMyProfile({
  view,
  posts,
  targets,
  stats,
}: {
  view: CareerView;
  posts: PostView[];
  targets: SendTarget[];
  stats: Record<AudiencePeriod, AudienceFigures>;
}) {
  const t = useTranslations("phoneCareer");
  const tp = useTranslations("phoneProfile");
  const [tab, setTab] = useState<Tab>("apropos");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [suggestion, setSuggestion] = useState(view.suggestion);
  const [availability, setAvailability] = useState(view.availabilityKey);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const person = view.person;
  const shown = posts.filter((post) => !gone.includes(post.id));

  // A new value from the server (another screen changed it) replaces the local one.
  const [seen, setSeen] = useState({ suggestion: view.suggestion, availability });
  if (
    seen.suggestion?.skillId !== view.suggestion?.skillId ||
    seen.availability !== view.availabilityKey
  ) {
    setSeen({ suggestion: view.suggestion, availability: view.availabilityKey });
    setSuggestion(view.suggestion);
    setAvailability(view.availabilityKey);
  }

  // `?onglet=` opens a tab, `?ajouter=competences|langues` its sheet over « À propos » (the next
  // steps of Progression, the search of Carrière).
  const here = pathname === "/app/profil";
  const tabAsked = here ? params.get("onglet") : null;
  const asked = here ? params.get("ajouter") : null;
  useEffect(() => {
    if (!TABS.includes(tabAsked as Tab) && asked !== "competences" && asked !== "langues") return;
    /* eslint-disable react-hooks/set-state-in-effect -- follows the address */
    if (TABS.includes(tabAsked as Tab)) setTab(tabAsked as Tab);
    if (asked === "competences" || asked === "langues") {
      setTab("apropos");
      setSheet(asked);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    router.replace("/app/profil", { scroll: false });
  }, [tabAsked, asked, router]);

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
  const nextAvailability = () => {
    const keys = view.availabilities.map((item) => item.key);
    const next = keys[(keys.indexOf(availability) + 1) % keys.length]!;
    const before = availability;
    setAvailability(next);
    start(async () => {
      const result = await setCareerAvailabilityAction(next).catch(() => null);
      if (!result?.ok) {
        setAvailability(before);
        showToast({ message: t("form.error"), tone: "error" });
      }
    });
  };
  const availabilityLabel =
    view.availabilities.find((item) => item.key === availability)?.label ?? view.availability;

  return (
    <div className="nb-page nb-ca nb-pf nb-cr nb-moi">
      <header className="nb-pf-barre">
        <span className="nb-pf-rb">
          <PhoneBack fallback="/app/career/cv" label={tp("back")} />
        </span>
        <h1 className="nb-pf-titre">{t("me.title")}</h1>
        <span className="nb-pf-barre-d">
          <Link href="/app/parametres" className="nb-pf-rb" aria-label={t("settings")}>
            <PhoneIcon name="reglages" size={18} />
          </Link>
        </span>
      </header>

      <div
        className="nb-pf-banniere"
        style={{ background: person.bannerColor.background } as CSSProperties}
      >
        {view.banner ? (
          // eslint-disable-next-line @next/next/no-img-element -- the person's own upload
          <img src={view.banner} alt="" />
        ) : (
          <svg viewBox="0 0 350 88" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <g fill="none" stroke="#A6F26B" strokeWidth="14" strokeOpacity=".35">
              <circle cx="300" cy="10" r="46" />
              <circle cx="300" cy="10" r="86" />
              <circle cx="300" cy="10" r="126" />
            </g>
            <circle cx="44" cy="70" r="5" fill="var(--nb-lime)" />
          </svg>
        )}
        <Link href="/app/career/profil" className="nb-cr-crayon" aria-label={t("bannerEdit")}>
          <Svg d={PEN} size={14} />
        </Link>
        <span className="nb-pf-banniere-t">
          {/* The professional title first, the Cap of the sign-up otherwise (Ephraïm 29/10/2026). */}
          {view.title ?? (view.cap ? t("cap", { job: view.cap }) : t("noCap"))}
        </span>
      </div>

      <div className="nb-pf-photo-l">
        <span className="nb-pf-photo" style={{ background: ringOf(person.ring) }}>
          {/* A touch brings the photo forward (PhotoViewer): change, crop or initials. */}
          <button
            type="button"
            className="nb-cr-photo-bt"
            onClick={() => setPhotoOpen(true)}
            aria-label={t("photoOpen")}
          >
            {view.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- the person's own photo
              <img src={view.image} alt="" />
            ) : (
              <span className="nb-pf-photo-i nb-cr-initiales" aria-hidden>
                {view.initials}
              </span>
            )}
          </button>
          <button
            type="button"
            className="nb-cr-appareil"
            onClick={() => setPhotoOpen(true)}
            aria-label={t("photoEdit")}
          >
            <Svg d={CAMERA} size={12} width={2.6} />
          </button>
        </span>
        <ul className="nb-pf-reseaux" aria-label={tp("socials")}>
          {person.socials.map((item) => (
            <li key={item.kind}>
              <a
                href={item.href}
                className="nb-pf-so"
                aria-label={item.label}
                {...(item.kind === "email"
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer nofollow" })}
              >
                <Svg d={SOCIAL_PATHS[item.kind]} size={15} width={1.9} />
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/app/career/profil"
              className="nb-pf-so nb-cr-so-plus"
              aria-label={t("socialAdd")}
            >
              <Svg d={PLUS} size={14} width={2.4} />
            </Link>
          </li>
        </ul>
      </div>

      <div className="nb-pf-id">
        <h2 className="nb-cr-nom">
          {view.name}
          {person.verified ? <VerifiedMark label={tp("verified")} /> : null}
          {view.planTag ? (
            <PlanMark tier={view.planTier} label={tp("planMark", { plan: view.planTag })} />
          ) : null}
        </h2>
        <p className="nb-pf-alias">{person.handle}</p>
        {person.place ? (
          <p className="nb-pf-lieu">
            {person.place.flag ? (
              <span className="nb-pf-drapeau" role="img" aria-label={person.place.flagLabel}>
                {person.place.flag}
              </span>
            ) : null}
            <span>{person.place.text}</span>
          </p>
        ) : null}
        {person.bio ? <p className="nb-pf-bio">{person.bio}</p> : null}
        {/* « N abonnés · entreprise · disponibilité » on one compact line (Ephraïm 29/10/2026). */}
        <div className="nb-pf-chips" data-ligne="">
          <span className="nb-pf-st">
            <Svg
              d="M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.6c1.6.8 2.6 2.4 3 4.9"
              size={12}
            />
            {tp.rich("followers", {
              count: person.followers,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </span>
          {person.domain ? (
            <span className="nb-pf-st" data-ambre="">
              <Svg d="M3.5 8.5h17v11h-17zM8.5 8.5V5.5h7v3" size={12} />
              {person.domain}
            </span>
          ) : null}
          <button
            type="button"
            className="nb-pf-st nb-cr-dispo"
            onClick={nextAvailability}
            aria-label={t("availabilityChange", { current: availabilityLabel })}
          >
            <i style={{ background: AVAILABILITY_COLOR[availability] }} aria-hidden />
            {availabilityLabel}
          </button>
          {view.contracts ? (
            <span className="nb-pf-st" data-ciel="">
              <Svg
                d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z"
                size={12}
              />
              {tp.rich("seeks", { contract: view.contracts, b: (chunks) => <b>{chunks}</b> })}
            </span>
          ) : null}
        </div>

        <div className="nb-cr-carte nb-cr-complet">
          <Ring percent={view.percent} color="var(--nb-lime)" size={48}>
            {t("completeValue", { percent: view.percent })}
          </Ring>
          <span className="nb-cr-complet-t">
            <b>{t("complete")}</b>
            {view.completion.text ? <small>{view.completion.text}</small> : null}
          </span>
          {suggestion ? (
            <button
              type="button"
              className="nb-cr-pastille"
              onClick={addSuggestion}
              disabled={pending}
              aria-label={t("suggestionAddLabel", { skill: suggestion.skill })}
            >
              {t("suggestionAdd")}
            </button>
          ) : view.completion.href ? (
            <Link href={view.completion.href} className="nb-cr-pastille">
              {t("completionGo")}
            </Link>
          ) : null}
        </div>
        <div className="nb-cr-actions">
          <Link href="/app/career/profil" className="nb-cr-bt" data-creme="">
            <Svg d={PEN} />
            {t("edit")}
          </Link>
          <button type="button" className="nb-cr-bt" onClick={() => setSheet("share")}>
            <Svg d={SHARE} width={2} />
            {t("share")}
          </button>
          <Link
            href={`/app/personnes/${person.id}?apercu=1`}
            className="nb-cr-bt nb-cr-oeil"
            aria-label={t("seeAsOthers")}
          >
            <Svg d={EYE} size={17} width={2} />
          </Link>
        </div>
      </div>

      <div className="nb-pf-onglets nb-cr-onglets">
        <Segment
          tabs={TABS}
          tab={tab}
          onPick={setTab}
          label={tp("tabs")}
          names={(key) => tp(`tab.${key}`)}
          prefix="moi"
          panel="moi-panneau"
        />
      </div>

      <div
        id="moi-panneau"
        role="tabpanel"
        aria-labelledby={`moi-${tab}`}
        className="nb-pf-pane"
        key={tab}
      >
        {tab === "publications" ? (
          <div className="nb-moi-pubs">
            <Link href="/app/fil/publier" className="nb-cr-nouveau">
              {t("me.publish")}
            </Link>
            {shown.length === 0 ? (
              <p className="nb-pf-vide">{t("me.noPosts")}</p>
            ) : (
              <>
                {shown.map((post) => (
                  <PostCard
                    key={post.key}
                    post={post}
                    onSheet={(target, kind) => setOpen({ post: target, sheet: kind })}
                  />
                ))}
                <Link href="/app/fil/mes-publications" className="nb-moi-lien">
                  {t("me.managePosts")}
                  <PhoneIcon name="chevron" size={16} />
                </Link>
              </>
            )}
          </div>
        ) : null}
        {tab === "apropos" ? (
          <ProfilePanel
            view={view}
            suggestion={suggestion}
            adding={pending}
            onAdd={addSuggestion}
            onSheet={setSheet}
          />
        ) : null}
        {tab === "realisations" ? <RealisationsPanel view={view} /> : null}
        {tab === "statistiques" ? (
          <div className="nb-cr-pad">
            <AudienceStats figures={stats} />
          </div>
        ) : null}
      </div>

      <ShareSheet
        open={sheet === "share"}
        onClose={() => setSheet(null)}
        name={view.name}
        share={view.share}
      />
      <PhotoViewer
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        image={view.image}
        initials={view.initials}
        name={view.name}
        ring={ringOf(person.ring)}
        editable
      />
      <SkillsSheet
        open={sheet === "competences"}
        onClose={() => setSheet(null)}
        suggestions={view.sheets.skills}
      />
      {sheet === "langues" ? (
        <LanguagesSheet open onClose={() => setSheet(null)} choices={view.sheets} />
      ) : null}
      <PostSheets
        post={open?.post ?? null}
        sheet={open?.sheet ?? null}
        onSheet={(kind) => setOpen((current) => (current ? { ...current, sheet: kind } : current))}
        onClose={() => setOpen(null)}
        onHidden={(post) => setGone((current) => [...current, post.id])}
        targets={targets}
      />
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
  const tp = useTranslations("phoneProfile");
  const person = view.person;
  const add = t("add");
  const modify = t("modify");
  // « Études » then « Certifications » (Ephraïm, 29/10/2026): the attestations earned on Jumanly.
  const studies = view.educationRows.filter((item) => !item.jumanly);
  const certificates = view.educationRows.filter((item) => item.jumanly);
  return (
    <>
      <Heading
        title={t("about")}
        action={{
          label: person.about ? modify : add,
          aria: `${person.about ? modify : add} : ${t("about")}`,
          href: "/app/career/profil/apropos",
        }}
      />
      {person.about ? (
        <AboutCard about={person.about} />
      ) : (
        <div className="nb-pf-presente">
          <p>
            <Link href="/app/career/profil/apropos">{t("aboutEmpty")}</Link>
          </p>
        </div>
      )}
      <Heading
        title={t("skills")}
        action={{
          label: add,
          aria: `${add} : ${t("skills")}`,
          onClick: () => onSheet("competences"),
        }}
      />
      {person.skills.length === 0 ? (
        <p className="nb-pf-vide">{t("skillsEmpty")}</p>
      ) : (
        <>
          <div className="nb-pf-barre-f" aria-hidden>
            {person.families.map((family, at) => (
              <span
                key={family.label}
                style={{
                  flex: family.share,
                  background: family.color,
                  animationDelay: `${at * 0.1}s`,
                }}
              />
            ))}
          </div>
          <ul className="nb-pf-legende">
            {person.families.map((family) => (
              <li key={family.label}>
                <i style={{ background: family.color }} aria-hidden />
                {family.label}
              </li>
            ))}
          </ul>
        </>
      )}
      <ul className="nb-pf-comp">
        {person.skills.map((skill, at) => (
          <li
            key={skill.name}
            className="nb-pf-sk"
            style={{
              background: tint(skill.color, "1F"),
              borderColor: tint(skill.color, "55"),
              color: skill.color,
              animationDelay: `${at * 0.05}s`,
            }}
          >
            <i style={{ background: skill.color }} aria-hidden />
            {skill.name}
            {skill.verified ? (
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                role="img"
                aria-label={tp("skillVerified")}
              >
                <circle cx="12" cy="12" r="10" fill={skill.color} />
                <path
                  d="m7.5 12.5 3 3 6-6.5"
                  fill="none"
                  stroke="#0B1A1F"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </li>
        ))}
        {suggestion ? (
          <li>
            <button
              type="button"
              className="nb-pf-sk nb-cr-sk-plus"
              onClick={onAdd}
              disabled={adding}
              aria-label={t("suggestionAddLabel", { skill: suggestion.skill })}
            >
              <Svg d={PLUS} size={12} width={2.6} />
              {suggestion.skill}
            </button>
          </li>
        ) : null}
      </ul>

      <Heading
        far
        title={t("experiences")}
        action={{
          label: add,
          aria: `${add} : ${t("experiences")}`,
          href: "/app/career/profil/experience/nouvelle",
        }}
      />
      {person.experiences.length === 0 ? (
        <p className="nb-pf-vide">{t("experienceEmpty")}</p>
      ) : (
        person.experiences.map((item, at) => {
          const href = `/app/career/profil/experience/${item.id}`;
          return (
            <div key={item.id} className="nb-pf-xp nb-cr-xp">
              {at < person.experiences.length - 1 ? (
                <span
                  className="nb-pf-fil"
                  style={{ background: `linear-gradient(${item.color}, rgba(255,255,255,.08))` }}
                  aria-hidden
                />
              ) : null}
              <ExperienceLogo item={item} />
              <div>
                <h3>{item.title}</h3>
                <ExperienceMeta item={item} label={tp("companyPage", { company: item.company })} />
                <ExperiencePoints item={item} points={item.points} />
                <Link
                  href={href}
                  className="nb-cr-point"
                  style={{ color: item.color }}
                  aria-label={t("pointAddLabel", { title: item.title })}
                >
                  {t("pointAdd")}
                </Link>
              </div>
              <Link
                href={href}
                className="nb-cr-ed"
                aria-label={t("experienceEdit", { title: item.title })}
              >
                <Svg d={PEN} size={13} />
              </Link>
            </div>
          );
        })
      )}

      <Heading
        title={t("education")}
        action={{
          label: add,
          aria: `${add} : ${t("education")}`,
          href: "/app/career/profil/formation/nouvelle",
        }}
      />
      {studies.length === 0 ? (
        <p className="nb-pf-vide">{t("educationEmpty")}</p>
      ) : (
        studies.map((item) => (
          <Link key={item.id} href={item.href} className="nb-pf-form nb-cr-form">
            <span aria-hidden data-jumanly={item.jumanly ? "" : undefined}>
              <PhoneIcon name="formation" size={17} />
            </span>
            <span>
              <b>{item.title}</b>
              <small>{item.line}</small>
            </span>
            {item.jumanly ? <span className="nb-pf-tag nb-cr-jumanly">{t("jumanly")}</span> : null}
          </Link>
        ))
      )}

      <Heading
        title={t("me.certificates")}
        action={{
          label: t("me.certificatesAdd"),
          aria: t("me.certificatesAddLabel"),
          href: "/app/learn",
        }}
      />
      {certificates.length === 0 ? (
        <p className="nb-pf-vide">{t("me.certificatesEmpty")}</p>
      ) : (
        certificates.map((item) => (
          <Link key={item.id} href={item.href} className="nb-pf-form nb-cr-form">
            <span aria-hidden data-jumanly="">
              <PhoneIcon name="formation" size={17} />
            </span>
            <span>
              <b>{item.title}</b>
              <small>{item.line}</small>
            </span>
            <span className="nb-pf-tag nb-cr-jumanly">{t("jumanly")}</span>
          </Link>
        ))
      )}

      <Heading
        far
        title={t("languagesTitle")}
        action={{
          label: modify,
          aria: `${modify} : ${t("languagesTitle")}`,
          onClick: () => onSheet("langues"),
        }}
      />
      {person.languages.length === 0 ? (
        <p className="nb-pf-vide">{t("languagesEmpty")}</p>
      ) : (
        <ul className="nb-pf-langues">
          {person.languages.map((language) => (
            <li key={language.name}>
              <b>{language.name}</b>
              <span className="nb-pf-niv" aria-hidden>
                {[1, 2, 3, 4, 5].map((bar) => (
                  <i key={bar} data-on={bar <= language.level ? "" : undefined} />
                ))}
              </span>
              <small>{language.label}</small>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function RealisationsPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  return (
    <>
      <p className="nb-moi-intro">{t("me.worksIntro")}</p>
      <ul className="nb-cr-grille nb-cr-pad">
        {view.projects.map((project, at) => (
          <li
            key={project.id}
            className="nb-cr-carte nb-cr-real"
            style={{ animationDelay: `${at * 0.06}s` }}
          >
            <Link href={project.href} className="nb-cr-real-l">
              <span className="nb-cr-real-img" style={{ background: project.ground }} aria-hidden>
                {project.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- private file, served by the API
                  <img src={project.cover} alt="" loading="lazy" />
                ) : (
                  <svg viewBox="0 0 160 112">
                    <g fill="none" stroke="#FFFFFF" strokeOpacity=".25" strokeWidth="12">
                      <circle cx="140" cy="0" r="40" />
                      <circle cx="140" cy="0" r="72" />
                    </g>
                  </svg>
                )}
                {project.featured ? (
                  <em className="nb-pf-tag nb-cr-avant">{t("portfolio.featured")}</em>
                ) : null}
              </span>
              <span className="nb-cr-real-t">
                <b>{project.title}</b>
                {project.skills.length > 0 ? (
                  <span className="nb-pf-real-s">
                    {project.skills.map((skill) => (
                      <span
                        key={skill.name}
                        style={{ background: tint(skill.color, "22"), color: skill.color }}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </span>
                ) : (
                  <small>{project.line}</small>
                )}
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/app/career/portfolio/nouvelle" className="nb-cr-ajout">
            <Svg d={PLUS} size={22} width={2.4} />
            <b>{t("portfolio.add")}</b>
            <small>{t("me.worksAddText")}</small>
          </Link>
        </li>
      </ul>
    </>
  );
}
