"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type TouchEvent,
} from "react";
import { showToast } from "@/components/motion/toaster";
import { deleteCv, duplicateCv, setPrimaryCv } from "@/server/actions/cv";
import { deleteCvsAction, renameCvAction, setCvColorAction } from "@/server/actions/cv-flow";
import { PROFILE_COLORS, PROFILE_PALETTE, type ProfileColor } from "@/lib/profile-colors";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import type { CareerView } from "./data";
import { CvExportButton } from "./cv-export";
import { OrbiStar, Ring, Segment, tint } from "./kit";
import { CareerSearch } from "./search";

const TABS = ["progression", "candidatures", "documents"] as const;
type Tab = (typeof TABS)[number];

/** The colours of the next steps of « Progression », in order. */
const STEP_COLORS = ["#F4C463", "#FF8A7A", "#2FD3A6"] as const;

/** A cover letter of « Mes documents ». */
export type LetterRow = { id: string; title: string; line: string; href: string };

/** A saved offer of « Candidatures › Enregistrées ». */
export type SavedOffer = {
  id: string;
  href: string;
  title: string;
  company: string;
  city: string;
  initials: string;
  tone: number;
  logo: string | null;
  score: number | null;
  open: boolean;
};

/**
 * Carrière on the phone (demande d'Ephraïm du 29/10/2026): the person at the top left (their
 * round photo, their name, how complete their profile is), then « Progression · Candidatures ·
 * Mes documents ». What others see of them (banner, bio, skills, réalisations) lives in « Mon
 * profil », opened by the photo. Kept mounted under the pages.
 */
export function PhoneCareer({
  view,
  letters,
  saved,
  portfolio,
}: {
  view: CareerView;
  letters: LetterRow[];
  saved: SavedOffer[];
  /** The public portfolio's address, once published. */
  portfolio: string | null;
}) {
  const t = useTranslations("phoneCareer");
  // « Candidatures » opens first, in the middle: Progression on its left, Mes documents on its
  // right, reached by a tap on the tabs or a swipe (Ephraïm, 30/10/2026).
  const [tab, setTab] = useState<Tab>("candidatures");
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    // A row that scrolls sideways keeps its own swipe.
    const inRow = (event.target as HTMLElement).closest("[data-rangee]");
    swipe.current = touch && !inRow ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = swipe.current;
    const touch = event.changedTouches[0];
    swipe.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const next = TABS[TABS.indexOf(tab) + (dx < 0 ? 1 : -1)];
    if (next) {
      setTab(next);
      window.scrollTo({ top: 0 });
    }
  };
  const [searching, setSearching] = useState(false);
  const [cvMenu, setCvMenu] = useState<CareerView["cvs"][number] | null>(null);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // An address of the former Carrière (`?onglet=profil|cv|portfolio`, `?ajouter=`, `?vue=lettres`)
  // still leads to its place: the profile's parts are now in « Mon profil ».
  const here = pathname === "/app/career/cv";
  const tabAsked = here ? params.get("onglet") : null;
  const asked = here ? params.get("ajouter") : null;
  const lettersAsked = here && params.get("vue") === "lettres";
  const newAsked = here && params.get("nouveau") === "1";
  useEffect(() => {
    if (!tabAsked && !lettersAsked) return;
    if (tabAsked === "profil") {
      router.replace("/app/profil");
      return;
    }
    if (tabAsked === "portfolio") {
      router.replace("/app/profil?onglet=realisations");
      return;
    }
    const next: Tab | null = TABS.includes(tabAsked as Tab)
      ? (tabAsked as Tab)
      : tabAsked === "cv" || lettersAsked
        ? "documents"
        : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    if (next) setTab(next);
    // « Supprimer » from the menu or the reader comes back here (Ephraïm, 27/10).
    if (params.get("ok") === "supprime") showToast({ message: t("cv.deleted") });
    router.replace("/app/career/cv", { scroll: false });
  }, [tabAsked, lettersAsked, router, params, t]);
  useEffect(() => {
    if (asked === "competences" || asked === "langues")
      router.replace(`/app/profil?ajouter=${asked}`);
  }, [asked, router]);
  useEffect(() => {
    if (newAsked) router.replace("/app/career/cv/nouveau");
  }, [newAsked, router]);

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
          {/* The person and the tabs stay at the top while the page scrolls. */}
          <div className="nb-cr-collant">
            <header className="nb-tete-onglet nb-cr-tete">
              <h1 className="sr-only">{t("title")}</h1>
              {/* The person at the top left: their photo as large as the round buttons, their
                name and how complete the profile is; a tap opens « Mon profil ». */}
              <Link
                href="/app/profil"
                className="nb-cr-moi"
                aria-label={t("me.open", { name: view.name })}
              >
                <FilAvatar
                  initials={view.initials}
                  image={view.image}
                  tone={view.tone}
                  org={false}
                  me
                  size={44}
                />
                <span className="nb-cr-moi-t">
                  <b>{view.name}</b>
                  <small>{t("me.complete", { percent: view.percent })}</small>
                  <span className="nb-cr-moi-barre" aria-hidden>
                    <span style={{ width: `${view.percent}%` }} />
                  </span>
                </span>
              </Link>
              <span className="nb-cr-ronds">
                <button
                  type="button"
                  className="nb-pf-rb"
                  aria-label={t("search")}
                  onClick={() => setSearching(true)}
                >
                  <PhoneIcon name="recherche" size={18} />
                </button>
                <Link
                  href="/app/parametres"
                  className="nb-pf-rb nb-cr-rb"
                  aria-label={t("settings")}
                >
                  <PhoneIcon name="reglages" size={18} />
                </Link>
              </span>
            </header>

            <div className="nb-pf-onglets nb-cr-onglets">
              <Segment
                tabs={TABS}
                tab={tab}
                onPick={setTab}
                label={t("tabs")}
                names={(key) => t(`tab.${key}`)}
                prefix="car"
                panel="car-panneau"
              />
            </div>
          </div>

          <div
            id="car-panneau"
            role="tabpanel"
            aria-labelledby={`car-${tab}`}
            className="nb-pf-pane nb-cr-glisse"
            key={tab}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {tab === "progression" ? (
              <ProgressionPanel view={view} letters={letters} onTab={setTab} />
            ) : null}
            {tab === "candidatures" ? <ApplicationsPanel view={view} saved={saved} /> : null}
            {tab === "documents" ? (
              <DocumentsPanel
                view={view}
                letters={letters}
                portfolio={portfolio}
                onMenu={setCvMenu}
              />
            ) : null}
          </div>
        </>
      )}

      <CvMenu cv={cvMenu} onClose={() => setCvMenu(null)} />
    </div>
  );
}

function ProgressionPanel({
  view,
  letters,
  onTab,
}: {
  view: CareerView;
  letters: LetterRow[];
  onTab: (tab: Tab) => void;
}) {
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
      <FollowUp view={view} letters={letters} onTab={onTab} />
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
 * « Où en sont mes documents et mes candidatures » (Ephraïm, 29/10/2026): four tiles, each one
 * opening its place (Mes documents, Réalisations of the profile, Candidatures).
 */
function FollowUp({
  view,
  letters,
  onTab,
}: {
  view: CareerView;
  letters: LetterRow[];
  onTab: (tab: Tab) => void;
}) {
  const t = useTranslations("phoneCareer");
  const primary = view.cvs.find((cv) => cv.primary) ?? view.cvs[0] ?? null;
  const active = view.applications.filter((row) => !row.answer).length;
  const interviews = view.applications.filter((row) => row.interview).length;
  const featured = view.projects.filter((project) => project.featured).length;
  return (
    <section className="nb-cr-suivi-doc" aria-labelledby="nb-cr-suivi-h">
      <h2 id="nb-cr-suivi-h" className="nb-pf-h nb-cr-h0">
        {t("follow.title")}
      </h2>
      <ul>
        <li>
          <button type="button" className="nb-cr-carte" onClick={() => onTab("documents")}>
            <i style={{ background: "var(--nb-lime)" }} aria-hidden />
            <b>{view.cvs.length}</b>
            <span>{t("follow.cvs", { count: view.cvs.length })}</span>
            <small>
              {primary && !primary.file
                ? t("follow.cvScore", { score: primary.score })
                : primary
                  ? t("follow.cvFile")
                  : t("follow.cvNone")}
            </small>
          </button>
        </li>
        <li>
          <button type="button" className="nb-cr-carte" onClick={() => onTab("documents")}>
            <i style={{ background: "#F4C463" }} aria-hidden />
            <b>{letters.length}</b>
            <span>{t("follow.letters", { count: letters.length })}</span>
            <small>{letters.length > 0 ? t("follow.lettersReady") : t("follow.lettersNone")}</small>
          </button>
        </li>
        <li>
          <Link href="/app/profil?onglet=realisations" className="nb-cr-carte">
            <i style={{ background: "#C3A6FF" }} aria-hidden />
            <b>{view.projects.length}</b>
            <span>{t("follow.works", { count: view.projects.length })}</span>
            <small>
              {view.projects.length > 0
                ? t("follow.worksFeatured", { count: featured })
                : t("follow.worksNone")}
            </small>
          </Link>
        </li>
        <li>
          <button type="button" className="nb-cr-carte" onClick={() => onTab("candidatures")}>
            <i style={{ background: "#7CC4FF" }} aria-hidden />
            <b>{active}</b>
            <span>{t("follow.active", { count: active })}</span>
            <small>
              {interviews > 0
                ? t("follow.interviews", { count: interviews })
                : view.applications.length > 0
                  ? t("follow.applied", { count: view.applications.length })
                  : t("follow.noneYet")}
            </small>
          </button>
        </li>
      </ul>
    </section>
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

function ApplicationsPanel({ view, saved }: { view: CareerView; saved: SavedOffer[] }) {
  const t = useTranslations("phoneCareer");
  const [list, setList] = useState<"sent" | "saved">("sent");
  const steps = ["sent", "viewed", "interview", "answer"] as const;
  return (
    <div className="nb-cr-pad">
      <div className="nb-cr-filtre" role="group" aria-label={t("apps.which")}>
        <button type="button" aria-pressed={list === "sent"} onClick={() => setList("sent")}>
          {t("apps.sent", { count: view.applications.length })}
        </button>
        <button type="button" aria-pressed={list === "saved"} onClick={() => setList("saved")}>
          {t("apps.saved", { count: saved.length })}
        </button>
      </div>
      {list === "saved" ? (
        saved.length === 0 ? (
          <div className="nb-cr-vide-c">
            <p className="nb-ex-texte">{t("apps.savedEmpty")}</p>
            <Link href="/app/jobs" className="nb-bouton" data-contour="">
              {t("apps.firstCta")}
            </Link>
          </div>
        ) : (
          <ul className="nb-cr-cands">
            {saved.map((offer, at) => (
              <li key={offer.id} style={{ animationDelay: `${at * 0.07}s` }}>
                <Link href={offer.href} className="nb-cr-carte nb-cr-cand">
                  <span className="nb-cr-cand-h">
                    <span className="nb-cr-logo" data-ton={offer.tone} aria-hidden>
                      {offer.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a company logo
                        <img src={offer.logo} alt="" />
                      ) : (
                        offer.initials
                      )}
                    </span>
                    <span className="nb-cr-cand-t">
                      <b>{offer.title}</b>
                      <small>
                        {t("apps.savedLine", { company: offer.company, city: offer.city })}
                      </small>
                    </span>
                    {offer.score !== null ? (
                      <em
                        className="nb-cr-score"
                        data-fort={offer.score >= 75 ? "" : undefined}
                        aria-label={t("applications.scoreLabel", { score: offer.score })}
                      >
                        {t("applications.score", { score: offer.score })}
                      </em>
                    ) : null}
                  </span>
                  <p className="nb-cr-note" data-reponse={offer.open ? undefined : ""}>
                    {offer.open ? t("apps.savedOpen") : t("apps.savedClosed")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : view.applications.length === 0 ? (
        <div className="nb-cr-vide-c nb-cr-premiere">
          <span className="nb-cr-premiere-i" aria-hidden>
            <PhoneIcon name="explorer" size={26} />
          </span>
          <b>{t("apps.firstTitle")}</b>
          <p className="nb-ex-texte">{t("applications.empty")}</p>
          <Link href="/app/jobs" className="nb-bouton" data-plein="">
            {t("apps.firstCta")}
          </Link>
        </div>
      ) : (
        <>
          <p className="nb-moi-intro">{t("apps.hint")}</p>
          <ul className="nb-cr-cands">
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
        </>
      )}
    </div>
  );
}

/**
 * « Mes documents » (Ephraïm, 29/10/2026): the CVs, the cover letters and the portfolio on one
 * screen. Each section is a row of cards that scrolls sideways (Ephraïm, 30/10/2026).
 */
function DocumentsPanel({
  view,
  letters,
  portfolio,
  onMenu,
}: {
  view: CareerView;
  letters: LetterRow[];
  portfolio: string | null;
  onMenu: (cv: CareerView["cvs"][number]) => void;
}) {
  const t = useTranslations("phoneCareer");
  return (
    <>
      <section aria-labelledby="nb-doc-cv">
        <h2 id="nb-doc-cv" className="nb-pf-h nb-cr-h nb-doc-h">
          {t("docs.cv")}
        </h2>
        <CvPanel view={view} onMenu={onMenu} />
      </section>

      <section aria-labelledby="nb-doc-lettres">
        <h2 id="nb-doc-lettres" className="nb-pf-h nb-cr-h nb-doc-h" data-loin="">
          {t("docs.letters")}
        </h2>
        <div className="nb-cr-pad">
          {letters.length === 0 ? (
            <p className="nb-pf-vide">{t("docs.lettersEmpty")}</p>
          ) : (
            <ul className="nb-doc-rangee" data-rangee="">
              {letters.map((letter) => (
                <li key={letter.id} className="nb-doc-case">
                  <Link href={letter.href} className="nb-cr-carte nb-doc-lettre">
                    <span className="nb-doc-i" data-lettre="" aria-hidden>
                      <PhoneIcon name="document" size={19} />
                    </span>
                    <span className="nb-doc-t">
                      <b>{letter.title}</b>
                      <small>{letter.line}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/app/career/lettres/nouvelle" className="nb-cr-nouveau">
            {t("docs.letterNew")}
          </Link>
        </div>
      </section>

      <section aria-labelledby="nb-doc-port">
        <h2 id="nb-doc-port" className="nb-pf-h nb-cr-h nb-doc-h" data-loin="">
          {t("docs.portfolio")}
        </h2>
        <div className="nb-cr-pad">
          <ul className="nb-doc-rangee" data-rangee="">
            <li className="nb-doc-case" data-large="">
              <div className="nb-cr-carte nb-doc-port">
                <span className="nb-doc-i" data-on={portfolio ? "" : undefined} aria-hidden>
                  <PhoneIcon name="lien" size={19} />
                </span>
                <span className="nb-doc-t">
                  <b>{portfolio ? t("docs.portfolioOn") : t("docs.portfolioOff")}</b>
                  <small>{t("docs.portfolioCount", { count: view.projects.length })}</small>
                </span>
              </div>
            </li>
            {view.projects.map((project) => (
              <li key={project.id} className="nb-doc-case">
                <Link
                  href={project.href}
                  className="nb-cr-carte nb-doc-projet"
                  style={{ "--fond": project.ground } as CSSProperties}
                >
                  <span className="nb-doc-projet-img" aria-hidden>
                    {project.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- stored picture
                      <img src={project.cover} alt="" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="nb-doc-t">
                    <b>{project.title}</b>
                    <small>{project.line}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="nb-doc-bts">
            {portfolio ? (
              <a href={portfolio} className="nb-bouton" data-contour="">
                {t("docs.portfolioSee")}
              </a>
            ) : null}
            <Link href="/app/profil?onglet=realisations" className="nb-bouton" data-contour="">
              {t("docs.portfolioManage")}
            </Link>
          </div>
        </div>
      </section>
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
        <ul className="nb-doc-rangee" data-rangee="" data-selection={selecting ? "" : undefined}>
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
