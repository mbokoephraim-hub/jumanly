"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from "react";
import { showToast } from "@/components/motion/toaster";
import {
  addSuggestedSkillsAction,
  setCareerAvailabilityAction,
} from "@/server/actions/career-phone";
import { deleteCv, duplicateCv, setPrimaryCv } from "@/server/actions/cv";
import { deleteCvsAction, renameCvAction, setCvColorAction } from "@/server/actions/cv-flow";
import { PROFILE_COLORS, PROFILE_PALETTE, type ProfileColor } from "@/lib/profile-colors";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";
import { PhotoViewer } from "../profil/photo-viewer";
import { AboutCard, ringOf, SOCIAL_PATHS, VerifiedMark } from "../profil/profile";
import { PhoneSheet } from "../sheet";
import type { Availability, CareerView } from "./data";
import { CvExportButton } from "./cv-export";
import { CareerSearch } from "./search";
import { ShareSheet } from "./share";
import { LanguagesSheet, SkillsSheet } from "./sheets";

type Sheet = "share" | "competences" | "langues";

const TABS = ["profil", "cv", "portfolio", "progression", "candidatures"] as const;
type Tab = (typeof TABS)[number];

/** A tint of a palette colour (« #A6F26B » → « #A6F26B1F »). */
const tint = (color: string, alpha: string) => `${color}${alpha}`;

/** The colour of each availability (maquette Carriere.dc.html, DISPO). */
const AVAILABILITY_COLOR: Record<Availability, string> = {
  open: "var(--nb-menthe)",
  listening: "var(--nb-ambre)",
  not_looking: "var(--nb-brume)",
};

/** The colours of the next steps of « Progression », in order. */
const STEP_COLORS = ["#F4C463", "#FF8A7A", "#2FD3A6"] as const;

function Svg({ d, size = 15, width = 2.2 }: { d: string; size?: number; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const PEN = "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4";
const CAMERA = "M4 8h3l2-3h6l2 3h3v11H4zM12 9.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z";
const PLUS = "M12 5v14M5 12h14";
const SHARE = "M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5";
const EYE =
  "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z";
const STAR =
  "M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z";

/** Orbi's mint disc with its star, without the dot (cards of the CV tab). */
function OrbiStar({ size = 40 }: { size?: number }) {
  return (
    <span className="nb-cr-etoile" style={{ width: size, height: size }} aria-hidden>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 48 48">
        <path d={STAR} fill="#0B1A1F" />
      </svg>
    </span>
  );
}

/** A ring in percent with its value in the middle (« 70 % », « 2/5 »). */
function Ring({
  percent,
  color,
  size,
  children,
}: {
  percent: number;
  color: string;
  size: number;
  children: ReactNode;
}) {
  return (
    <span
      className="nb-cr-anneau"
      style={
        {
          width: size,
          height: size,
          background: `conic-gradient(${color} 0 ${percent}%, var(--nb-haute) ${percent}% 100%)`,
          "--trou": `${size - 10}px`,
        } as CSSProperties
      }
    >
      <span>{children}</span>
    </span>
  );
}

/**
 * Carrière on the phone (docs/carriere-v3, validated 26/10/2026, captures 01 to 05): the person's
 * own profile with the head of a profile (banner, photo and its ring, networks, chips), what
 * differs in one's own space (pencils, « Profil complété », « Modifier · Partager · Voir comme les
 * autres »), then « Profil · CV · Portfolio · Progression · Candidatures » in a segment that stays
 * at the top; past the head, a small identity folds above it. Kept mounted under the pages.
 */
export function PhoneCareer({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  const tp = useTranslations("phoneProfile");
  const [tab, setTab] = useState<Tab>("profil");
  const [searching, setSearching] = useState(false);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [cvMenu, setCvMenu] = useState<CareerView["cvs"][number] | null>(null);
  const [suggestion, setSuggestion] = useState(view.suggestion);
  const [availability, setAvailability] = useState(view.availabilityKey);
  const [folded, setFolded] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [pending, start] = useTransition();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const person = view.person;

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

  // « Ajouter des compétences », « Langues et lieux », « Nouveau CV » asked from another screen
  // (Progression's next steps, the search): `?ajouter=` opens the sheet over the profile.
  const here = pathname === "/app/career/cv";
  const asked = here ? params.get("ajouter") : null;
  const tabAsked = here ? params.get("onglet") : null;
  const newAsked = here && params.get("nouveau") === "1";
  useEffect(() => {
    if (!TABS.includes(tabAsked as Tab)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setTab(tabAsked as Tab);
    // « Supprimer » from the menu or the reader comes back here (Ephraïm, 27/10).
    if (params.get("ok") === "supprime") showToast({ message: t("cv.deleted") });
    router.replace("/app/career/cv", { scroll: false });
  }, [tabAsked, router, params, t]);
  useEffect(() => {
    if (asked !== "competences" && asked !== "langues") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setTab("profil");
    setSheet(asked);
    router.replace("/app/career/cv", { scroll: false });
  }, [asked, router]);
  useEffect(() => {
    if (newAsked) router.replace("/app/career/cv/nouveau");
  }, [newAsked, router]);

  // Past the head, the small identity folds above the tabs (maquette, réglage `replie`).
  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setFolded(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [searching]);

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
    <div className="nb-page nb-ca nb-pf nb-cr">
      {searching ? (
        <CareerSearch
          items={view.search}
          plan={view.plan}
          onClose={() => setSearching(false)}
          onNewCv={() => {
            setSearching(false);
            router.push("/app/career/cv/nouveau");
          }}
        />
      ) : (
        <>
          <header className="nb-tete-onglet">
            <h1>{t("title")}</h1>
            <span className="nb-cr-ronds">
              <button
                type="button"
                className="nb-pf-rb"
                aria-label={t("search")}
                onClick={() => setSearching(true)}
              >
                <PhoneIcon name="recherche" size={18} />
              </button>
              <Link href="/app/parametres" className="nb-pf-rb nb-cr-rb" aria-label={t("settings")}>
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
              {view.cap ? t("cap", { job: view.cap }) : t("noCap")}
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
                <span className="nb-pf-tag nb-cr-formule">{view.planTag}</span>
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
            <div className="nb-pf-chips">
              <span className="nb-pf-st">
                <Svg
                  d="M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.6c1.6.8 2.6 2.4 3 4.9"
                  size={13}
                />
                {tp.rich("connections", {
                  count: person.connections,
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </span>
              {person.domain ? (
                <span className="nb-pf-st" data-ambre="">
                  <Svg d="M3.5 8.5h17v11h-17zM8.5 8.5V5.5h7v3" size={13} />
                  {person.domain}
                </span>
              ) : null}
              {view.contracts ? (
                <span className="nb-pf-st" data-ciel="">
                  <Svg
                    d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z"
                    size={13}
                  />
                  {tp.rich("seeks", { contract: view.contracts, b: (chunks) => <b>{chunks}</b> })}
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

          <div ref={sentinel} className="nb-cr-repere" aria-hidden />
          <div className="nb-pf-onglets nb-cr-onglets" data-replie={folded ? "" : undefined}>
            <div className="nb-cr-mini" aria-hidden={!folded} inert={!folded}>
              <span className="nb-cr-mini-photo" style={{ background: ringOf(person.ring) }}>
                <FilAvatar
                  initials={view.initials}
                  image={view.image}
                  tone={view.tone}
                  org={false}
                  size={32}
                />
              </span>
              <span className="nb-cr-mini-t">
                <b>{view.name}</b>
                <small>{t("folded", { percent: view.percent })}</small>
              </span>
              <button
                type="button"
                className="nb-pf-rb"
                aria-label={t("search")}
                onClick={() => setSearching(true)}
              >
                <PhoneIcon name="recherche" size={18} />
              </button>
            </div>
            <Segment tab={tab} onPick={setTab} label={t("tabs")} names={(key) => t(`tab.${key}`)} />
          </div>

          <div
            id="car-panneau"
            role="tabpanel"
            aria-labelledby={`car-${tab}`}
            className="nb-pf-pane"
            key={tab}
          >
            {tab === "profil" ? (
              <ProfilePanel
                view={view}
                suggestion={suggestion}
                adding={pending}
                onAdd={addSuggestion}
                onSheet={setSheet}
              />
            ) : null}
            {tab === "cv" ? <CvPanel view={view} onMenu={setCvMenu} /> : null}
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
      <CvMenu cv={cvMenu} onClose={() => setCvMenu(null)} />
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
    </div>
  );
}

/**
 * « Profil · CV · Portfolio · Progression · Candidatures »: each tab as wide as its word, the
 * Lime pill sliding under the chosen one.
 */
function Segment({
  tab,
  onPick,
  label,
  names,
}: {
  tab: Tab;
  onPick: (tab: Tab) => void;
  label: string;
  names: (tab: Tab) => string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const button = box.current?.querySelector<HTMLElement>(`#car-${tab}`);
      if (button) setPill({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [tab]);
  return (
    <div
      ref={box}
      className="nb-cr-seg"
      role="tablist"
      aria-label={label}
      data-mesure={pill ? "" : undefined}
    >
      <span
        className="nb-cr-ind"
        style={pill ? { left: pill.left, width: pill.width } : { opacity: 0 }}
        aria-hidden
      />
      {TABS.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          id={`car-${key}`}
          aria-selected={tab === key}
          aria-controls="car-panneau"
          onClick={() => onPick(key)}
        >
          {names(key)}
        </button>
      ))}
    </div>
  );
}

function Heading({
  title,
  action,
  far,
}: {
  title: string;
  action?: { label: string; aria: string; href?: string; onClick?: () => void };
  far?: boolean;
}) {
  return (
    <h2 className="nb-pf-h nb-cr-h" data-loin={far ? "" : undefined}>
      {title}
      {action?.href ? (
        <Link href={action.href} aria-label={action.aria}>
          {action.label}
        </Link>
      ) : action ? (
        <button type="button" onClick={action.onClick} aria-label={action.aria}>
          {action.label}
        </button>
      ) : null}
    </h2>
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
              <span className="nb-pf-lg" style={{ background: item.color }} aria-hidden>
                {item.initials}
              </span>
              <div>
                <h3>
                  {item.title}
                  {item.current ? <span className="nb-pf-tag">{tp("current")}</span> : null}
                </h3>
                <p className="nb-pf-xp-ent">
                  {item.company} · <span style={{ color: item.color }}>{item.type}</span>
                </p>
                <p className="nb-pf-xp-d">{item.dates}</p>
                {item.points.length > 0 ? (
                  <ul className="nb-pf-pts">
                    {item.points.map((point, n) => (
                      <li key={n}>
                        <i style={{ background: item.color }} aria-hidden />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
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
      {view.educationRows.length === 0 ? (
        <p className="nb-pf-vide">{t("educationEmpty")}</p>
      ) : (
        view.educationRows.map((item) => (
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

function CvPanel({
  view,
  onMenu,
}: {
  view: CareerView;
  onMenu: (cv: CareerView["cvs"][number]) => void;
}) {
  const t = useTranslations("phoneCareer");
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  // CVs gone from the server leave the selection.
  const ids = view.cvs.map((cv) => cv.id);
  const selected = ids.filter((id) => chosen.has(id));
  const all = selected.length === ids.length && ids.length > 0;
  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const stop = () => {
    setSelecting(false);
    setChosen(new Set());
    setConfirm(false);
  };
  const remove = () =>
    start(async () => {
      const result = await deleteCvsAction(selected).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("form.error"), tone: "error" });
        return;
      }
      showToast({ message: t("cv.select.deleted", { count: result.count }) });
      stop();
    });
  return (
    <div className="nb-cr-pad">
      {view.adapt && !selecting ? (
        <div className="nb-cr-carte nb-cr-orbi">
          <OrbiStar />
          <p>{view.adapt.text}</p>
          <Link href={view.adapt.href} className="nb-cr-pastille">
            {t("cv.adaptButton")}
          </Link>
        </div>
      ) : null}
      {view.cvs.length > 0 ? (
        <div className="nb-cr-cv-barre">
          {selecting ? (
            <>
              <b role="status">{t("cv.select.count", { count: selected.length })}</b>
              <button type="button" onClick={() => setChosen(all ? new Set() : new Set(ids))}>
                {all ? t("cv.select.none") : t("cv.select.all")}
              </button>
              <button type="button" onClick={stop}>
                {t("cancel")}
              </button>
            </>
          ) : (
            <>
              <b>{t("cv.library", { count: view.cvs.length })}</b>
              <button type="button" onClick={() => setSelecting(true)}>
                {t("cv.select.start")}
              </button>
            </>
          )}
        </div>
      ) : null}
      {view.cvs.length > 0 ? (
        <ul className="nb-cr-grille" data-selection={selecting ? "" : undefined}>
          {view.cvs.map((cv, at) => {
            const isChosen = chosen.has(cv.id);
            const page = (
              <>
                <span
                  className="nb-cr-cv-page"
                  style={{ "--accent": cv.color } as CSSProperties}
                  aria-hidden
                >
                  <i data-titre="" />
                  <i data-sous="" />
                  <i />
                  <i data-w="85" />
                  <i data-w="70" />
                  <i data-section="" />
                  <i />
                  <i data-w="80" />
                </span>
                <em className="nb-cr-cv-note" data-defaut={cv.primary ? "" : undefined}>
                  {cv.primary
                    ? t("cv.primary")
                    : cv.file
                      ? t("cv.imported")
                      : t("cv.score", { score: cv.score })}
                </em>
                <span className="nb-cr-cv-t">
                  <b>
                    {cv.tag ? <i className="nb-cr-cv-pastille" aria-hidden /> : null}
                    {cv.title}
                  </b>
                  <small>{cv.meta}</small>
                </span>
              </>
            );
            return (
              <li
                key={cv.id}
                className="nb-cr-carte nb-cr-cv"
                data-choisi={isChosen ? "" : undefined}
                data-teinte={cv.tag ? "" : undefined}
                style={
                  {
                    animationDelay: `${at * 0.08}s`,
                    "--teinte": cv.tag?.hex,
                  } as CSSProperties
                }
              >
                {selecting ? (
                  <button
                    type="button"
                    className="nb-cr-cv-l"
                    role="checkbox"
                    aria-checked={isChosen}
                    aria-label={cv.title}
                    onClick={() => toggle(cv.id)}
                  >
                    {page}
                    <span className="nb-cr-cv-coche" aria-hidden>
                      {isChosen ? <PhoneIcon name="coche" size={14} stroke={3} /> : null}
                    </span>
                  </button>
                ) : (
                  <>
                    <Link href={`${cv.href}/lire`} className="nb-cr-cv-l">
                      {page}
                    </Link>
                    <button
                      type="button"
                      className="nb-cr-cv-plus"
                      aria-label={t("cv.more", { title: cv.title })}
                      onClick={() => onMenu(cv)}
                    >
                      <PhoneIcon name="plusOptions" size={18} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="nb-pf-vide nb-cr-vide-cv">{t("cv.empty")}</p>
      )}
      {selecting ? (
        <div className="nb-cr-cv-actions">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={selected.length === 0 || pending}
            onClick={() => setConfirm(true)}
          >
            {t("cv.select.delete", { count: selected.length })}
          </button>
        </div>
      ) : (
        <Link href="/app/career/cv/nouveau" className="nb-cr-nouveau">
          {t("cv.newLong")}
        </Link>
      )}
      <PhoneSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        label={t("cv.select.deleteQuestion", { count: selected.length })}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">
          {t("cv.select.deleteQuestion", { count: selected.length })}
        </b>
        <p className="nb-meta nb-ca-feuille-d">{t("cv.menu.deleteText")}</p>
        <div className="nb-ca-feuille-b">
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-plein-rouge=""
            disabled={pending}
            onClick={remove}
          >
            {t("cv.select.delete", { count: selected.length })}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setConfirm(false)}
          >
            {t("cancel")}
          </button>
        </div>
      </PhoneSheet>
    </div>
  );
}

function CvMenu({ cv, onClose }: { cv: CareerView["cvs"][number] | null; onClose: () => void }) {
  const t = useTranslations("phoneCareer");
  const [confirm, setConfirm] = useState(false);
  const [naming, setNaming] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const close = () => {
    setConfirm(false);
    setNaming(null);
    onClose();
  };
  const fail = () => showToast({ message: t("form.error"), tone: "error" });
  const rename = (title: string) =>
    cv &&
    start(async () => {
      const result = await renameCvAction(cv.id, title).catch(() => null);
      if (!result?.ok) return fail();
      showToast({ message: t("cv.menu.renamed") });
      close();
    });
  const paint = (color: ProfileColor | null) =>
    cv &&
    start(async () => {
      const result = await setCvColorAction(cv.id, color).catch(() => null);
      if (!result?.ok) return fail();
      close();
    });
  return (
    <PhoneSheet
      open={cv !== null}
      onClose={close}
      label={cv?.title ?? t("cv.new")}
      closeLabel={t("close")}
    >
      {cv && naming !== null ? (
        <form
          className="nb-cr-cv-nom"
          onSubmit={(event) => {
            event.preventDefault();
            if (naming.trim()) rename(naming.trim());
          }}
        >
          <label htmlFor="cr-cv-nom" className="nb-ex-feuille-t">
            {t("cv.menu.rename")}
          </label>
          <input
            id="cr-cv-nom"
            value={naming}
            maxLength={80}
            required
            autoFocus
            onChange={(event) => setNaming(event.target.value)}
          />
          <span className="nb-cr-cv-idees">
            {[t("cv.menu.namePrimary"), t("cv.menu.nameSecond"), t("cv.menu.nameThird")].map(
              (idea) => (
                <button key={idea} type="button" onClick={() => setNaming(idea)}>
                  {idea}
                </button>
              ),
            )}
          </span>
          <button
            type="submit"
            className="nb-bouton"
            data-large=""
            data-plein=""
            disabled={pending || !naming.trim()}
          >
            {t("cv.menu.renameSave")}
          </button>
        </form>
      ) : cv && confirm ? (
        <>
          <b className="nb-ex-feuille-t">{t("cv.menu.deleteQuestion", { title: cv.title })}</b>
          <p className="nb-meta nb-ca-feuille-d">{t("cv.menu.deleteText")}</p>
          <form action={deleteCv} className="nb-ca-feuille-b">
            <input type="hidden" name="id" value={cv.id} />
            <input type="hidden" name="retour" value="cv" />
            <button type="submit" className="nb-bouton" data-large="" data-plein-rouge="">
              {t("cv.menu.delete")}
            </button>
            <button
              type="button"
              className="nb-bouton"
              data-large=""
              data-contour=""
              onClick={() => setConfirm(false)}
            >
              {t("cancel")}
            </button>
          </form>
        </>
      ) : cv ? (
        <>
          <b className="nb-ex-feuille-t">{cv.title}</b>
          <div className="nb-cr-cv-teintes" role="group" aria-label={t("cv.menu.color")}>
            <span>{t("cv.menu.color")}</span>
            <button
              type="button"
              aria-pressed={cv.tag === null}
              aria-label={t("cv.menu.colorNone")}
              data-aucune=""
              disabled={pending}
              onClick={() => paint(null)}
            />
            {PROFILE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-pressed={cv.tag?.key === color}
                aria-label={t(`cv.menu.colors.${color}`)}
                style={{ background: PROFILE_PALETTE[color] }}
                disabled={pending}
                onClick={() => paint(color)}
              />
            ))}
          </div>
          <button type="button" className="nb-opt nb-fil-opt" onClick={() => setNaming(cv.title)}>
            {t("cv.menu.rename")}
          </button>
          <Link href={`${cv.href}/lire`} className="nb-opt nb-fil-opt">
            {t("cv.menu.read")}
          </Link>
          {cv.file ? (
            <>
              <a href={`${cv.href}/fichier?telecharger=1`} className="nb-opt nb-fil-opt" download>
                {t("cv.menu.download")}
              </a>
              {/* The file stays as it is; a copy made in Jumanly can be changed. */}
              <form action={duplicateCv}>
                <input type="hidden" name="id" value={cv.id} />
                <button type="submit" className="nb-opt nb-fil-opt">
                  {t("cv.menu.editable")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href={`${cv.href}?etape=contenu`} className="nb-opt nb-fil-opt">
                {t("cv.menu.edit")}
              </Link>
              <CvExportButton
                id={cv.id}
                title={cv.title}
                label={t("cv.menu.export")}
                className="nb-opt nb-fil-opt"
              />
              <Link href={`${cv.href}?adapter=`} className="nb-opt nb-fil-opt">
                {t("cv.menu.adapt")}
              </Link>
              <form action={duplicateCv}>
                <input type="hidden" name="id" value={cv.id} />
                <button type="submit" className="nb-opt nb-fil-opt">
                  {t("cv.menu.duplicate")}
                </button>
              </form>
            </>
          )}
          {!cv.primary ? (
            <form action={setPrimaryCv}>
              <input type="hidden" name="id" value={cv.id} />
              <input type="hidden" name="retour" value="liste" />
              <button type="submit" className="nb-opt nb-fil-opt">
                {t("cv.menu.primaryLong")}
              </button>
            </form>
          ) : null}
          <button
            type="button"
            className="nb-opt nb-fil-opt"
            data-danger=""
            onClick={() => setConfirm(true)}
          >
            {t("cv.menu.delete")}
          </button>
        </>
      ) : null}
    </PhoneSheet>
  );
}

function PortfolioPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  return (
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
          <small>{t("portfolio.addText")}</small>
        </Link>
      </li>
    </ul>
  );
}

function ProgressionPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  const progression = view.progression;
  const stages = ["discovery", "building", "ready", "competitive"] as const;
  return (
    <div className="nb-cr-pad">
      <div className="nb-cr-carte nb-cr-stade">
        <p className="nb-cr-sur">{t("progression.stageLabel")}</p>
        <p className="nb-cr-stade-n">{progression.stage}</p>
        <p className="nb-cr-stade-d">{progression.next}</p>
        {progression.diagnostic ? (
          <Link href="/app/career/diagnostic" className="nb-cr-pastille nb-cr-faire">
            {t("progression.diagnostic")}
          </Link>
        ) : null}
        <ol className="nb-cr-frise" aria-label={t("progression.stageLabel")}>
          {stages.map((stage, index) => (
            <li
              key={stage}
              data-fait={index <= progression.stageIndex ? "" : undefined}
              aria-current={index === progression.stageIndex ? "step" : undefined}
            >
              <span aria-hidden />
              {t(`progression.stage.${stage}`)}
            </li>
          ))}
        </ol>
      </div>
      <div className="nb-cr-chiffres">
        <div className="nb-cr-carte">
          <Ring percent={progression.coursesPercent} color="#C3A6FF" size={52}>
            {progression.courses}
          </Ring>
          <small>{t("progression.courses")}</small>
        </div>
        <div className="nb-cr-carte">
          <Ring percent={progression.percent} color="var(--nb-lime)" size={52}>
            {t("completeValue", { percent: progression.percent })}
          </Ring>
          <small>{t("progression.profile")}</small>
        </div>
        <div className="nb-cr-carte">
          <Ring percent={progression.applicationsPercent} color="#7CC4FF" size={52}>
            {progression.applications}
          </Ring>
          <small>{t("progression.applications")}</small>
        </div>
      </div>
      {progression.steps.length > 0 ? (
        <>
          <h2 className="nb-pf-h nb-cr-h0">{t("progression.steps")}</h2>
          <ol className="nb-cr-etapes">
            {progression.steps.map((step, index) => {
              const color = STEP_COLORS[index % STEP_COLORS.length]!;
              return (
                <li key={step.title}>
                  <Link href={step.href}>
                    <span
                      className="nb-cr-num"
                      style={{ background: tint(color, "33"), color }}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="nb-cr-etape-t">
                      <b>{step.title}</b>
                      <small>{step.detail}</small>
                    </span>
                    <PhoneIcon name="chevron" size={16} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
      <TrainingBlock training={view.training} />
    </div>
  );
}

/**
 * « Mes entraînements » (demande d'Ephraïm du 29/10/2026): the interview simulation, kept for
 * people who applied with a plan that includes it, what to prepare, and the follow-up of the marks.
 */
function TrainingBlock({ training }: { training: CareerView["training"] }) {
  const t = useTranslations("phoneCareer");
  const follow = training.followUp;
  return (
    <section className="nb-cr-entr" aria-labelledby="nb-cr-entr-h">
      <h2 id="nb-cr-entr-h" className="nb-pf-h nb-cr-h0">
        {t("training.title")}
      </h2>
      <div className="nb-cr-carte nb-cr-sim" data-ouvert={training.open ? "" : undefined}>
        <span className="nb-cr-sim-i" aria-hidden>
          <PhoneIcon name={training.open ? "micro" : "cadenas"} size={20} />
        </span>
        <div className="nb-cr-sim-t">
          <b>{t("training.sim.title")}</b>
          <small>{training.open ? t("training.sim.open") : t("training.sim.reserved")}</small>
        </div>
        {training.open ? (
          <Link href={training.start} className="nb-bouton" data-plein="">
            {t("training.sim.start")}
          </Link>
        ) : (
          <ul className="nb-cr-sim-c">
            <li data-fait={training.applied ? "" : undefined}>
              <span aria-hidden>
                {training.applied ? <PhoneIcon name="coche" size={14} /> : null}
              </span>
              <span>{t("training.sim.applied")}</span>
              {training.applied ? (
                <em>{t("training.sim.done")}</em>
              ) : (
                <Link href="/app/jobs">{t("training.sim.appliedCta")}</Link>
              )}
            </li>
            <li data-fait={training.plan ? "" : undefined}>
              <span aria-hidden>{training.plan ? <PhoneIcon name="coche" size={14} /> : null}</span>
              <span>{t("training.sim.plan", { plan: training.planName ?? "none" })}</span>
              {training.plan ? (
                <em>{t("training.sim.done")}</em>
              ) : (
                <Link href="/app/abonnement/formules">{t("training.sim.planCta")}</Link>
              )}
            </li>
            <li className="nb-cr-sim-gratuit">{t("training.sim.free")}</li>
          </ul>
        )}
      </div>

      {training.preparations.length > 0 ? (
        <>
          <p className="nb-cr-sur nb-cr-entr-s">{t("training.prepare")}</p>
          <ol className="nb-cr-etapes">
            {training.preparations.map((item, index) => {
              const color = STEP_COLORS[index % STEP_COLORS.length]!;
              return (
                <li key={item.key}>
                  <Link href={item.href}>
                    <span
                      className="nb-cr-num"
                      style={{ background: tint(color, "33"), color }}
                      aria-hidden
                    >
                      <PhoneIcon name={item.locked ? "cadenas" : "idee"} size={17} />
                    </span>
                    <span className="nb-cr-etape-t">
                      <b>{item.title}</b>
                      <small>{item.detail}</small>
                    </span>
                    {item.locked ? (
                      <em className="nb-cr-verrou">{t("training.reservedTag")}</em>
                    ) : (
                      <PhoneIcon name="chevron" size={16} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      <p className="nb-cr-sur nb-cr-entr-s">{t("training.followTitle")}</p>
      {follow ? (
        <div className="nb-cr-carte nb-cr-suivi">
          <div className="nb-cr-suivi-h">
            <Ring
              percent={follow.last}
              color={follow.last >= 70 ? "var(--nb-lime)" : "#F4C463"}
              size={56}
            >
              {follow.last}
            </Ring>
            <span>
              <small>{t("training.follow.last")}</small>
              <b>{follow.count}</b>
              {follow.change ? <em>{follow.change}</em> : null}
            </span>
          </div>
          <ul className="nb-cr-suivi-c">
            {follow.criteria.map((item) => (
              <li key={item.key}>
                <span>{item.label}</span>
                <span className="nb-cr-suivi-b" aria-hidden>
                  <i
                    style={{
                      width: `${item.score}%`,
                      background: item.score >= 70 ? "var(--nb-lime)" : "#F4C463",
                    }}
                  />
                </span>
                <b>{item.score}</b>
              </li>
            ))}
          </ul>
          <p className="nb-cr-suivi-p">{t("training.follow.why")}</p>
          <div className="nb-cr-suivi-l">
            <Link href={follow.report}>{t("training.follow.report")}</Link>
            <Link href="/app/career/entretiens">{t("training.follow.all")}</Link>
          </div>
        </div>
      ) : (
        <p className="nb-cr-carte nb-cr-suivi nb-cr-suivi-vide">{t("training.follow.empty")}</p>
      )}
    </section>
  );
}

function ApplicationsPanel({ view }: { view: CareerView }) {
  const t = useTranslations("phoneCareer");
  if (view.applications.length === 0)
    return (
      <div className="nb-cr-pad nb-cr-vide-c">
        <p className="nb-ex-texte">{t("applications.empty")}</p>
        <Link href="/app/jobs" className="nb-bouton" data-plein="">
          {t("applications.explore")}
        </Link>
      </div>
    );
  const steps = ["sent", "viewed", "interview", "answer"] as const;
  return (
    <ul className="nb-cr-pad nb-cr-cands">
      {view.applications.map((row, at) => (
        <li key={row.id} style={{ animationDelay: `${at * 0.07}s` }}>
          <Link href={row.href} className="nb-cr-carte nb-cr-cand">
            <span className="nb-cr-cand-h">
              <span className="nb-cr-logo" data-ton={row.tone} aria-hidden>
                {row.initials}
              </span>
              <span className="nb-cr-cand-t">
                <b>{row.title}</b>
                <small>{row.meta}</small>
              </span>
              {row.score !== null ? (
                <em
                  className="nb-cr-score"
                  data-fort={row.score >= 75 ? "" : undefined}
                  aria-label={t("applications.scoreLabel", { score: row.score })}
                >
                  {t("applications.score", { score: row.score })}
                </em>
              ) : null}
            </span>
            <ol
              className="nb-cr-frise"
              aria-label={t("applications.where", { status: row.status })}
            >
              {steps.map((key, index) => (
                <li
                  key={key}
                  data-fait={index <= row.step ? "" : undefined}
                  aria-current={index === row.step ? "step" : undefined}
                >
                  <span aria-hidden />
                  {t(`applications.step.${key}`)}
                </li>
              ))}
            </ol>
            {row.answer ? (
              <p className="nb-cr-note" data-reponse="">
                {row.answer}
              </p>
            ) : row.interview ? (
              <p className="nb-cr-note">{row.interview}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
