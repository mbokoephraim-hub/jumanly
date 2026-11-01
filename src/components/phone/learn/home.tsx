"use client";

import "@/styles/phone-onglets.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { OrbiDisc, PhoneIcon } from "../icon";
import { MeAvatar } from "../me";
import { askOrbiFrom } from "../orbi-bus";
import type { CourseCard, FormationView } from "./data";
import { CourseArt, CourseCover, CourseLine } from "./parts";
import { FormationSearch } from "./search";

const TABS = ["pour-vous", "mes-cours", "attestations"] as const;
type Tab = (typeof TABS)[number];
const TAB_KEYS = {
  "pour-vous": "forYou",
  "mes-cours": "mine",
  attestations: "attestations",
} as const;

function CourseTile({ course }: { course: CourseCard }) {
  const t = useTranslations("phoneLearn");
  return (
    <Link href={course.href} className="nb-fo-tuile">
      <span
        className="nb-fo-tuile-haut"
        data-ton={course.tone}
        data-couv={course.cover ? "" : undefined}
        aria-hidden
      >
        {course.cover ? (
          <CourseCover src={course.cover} />
        ) : (
          <>
            <svg viewBox="0 0 272 126" preserveAspectRatio="xMidYMid slice">
              <g fill="none" stroke="#FFFFFF" strokeOpacity=".2" strokeWidth="22">
                <circle cx="20" cy="63" r="62" />
                <circle cx="252" cy="63" r="62" />
              </g>
            </svg>
            <span>{course.initials}</span>
          </>
        )}
      </span>
      <span className="nb-fo-tuile-bas">
        <b>{course.title}</b>
        <small className="nb-meta">{course.line}</small>
        <span className="nb-fo-tags">
          <span className="nb-fo-tag">{course.level}</span>
          <span className="nb-fo-tag" data-ton={course.free ? "lime" : "plan"}>
            {course.free ? t("free") : course.price}
          </span>
        </span>
      </span>
    </Link>
  );
}

/**
 * The Formation tab on the phone (Modèle B, lot B7, planche Formation): the search, then « Pour
 * vous · Mes cours · Attestations » in place. Kept mounted under the pages, like the other tabs.
 */
export function PhoneFormation({ view }: { view: FormationView }) {
  const t = useTranslations("phoneLearn");
  const [tab, setTab] = useState<Tab>("pour-vous");
  const [searching, setSearching] = useState(false);
  const [start, setStart] = useState<"cours" | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // `?onglet=attestations`: the rubric a page of the tab goes back to.
  const asked = pathname === "/app/learn" ? params.get("onglet") : null;
  useEffect(() => {
    if (!TABS.includes(asked as Tab)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
    setTab(asked as Tab);
    setSearching(false);
    router.replace("/app/learn", { scroll: false });
  }, [asked, router]);

  const cards = view.forOffers.filter((course) => !domain || course.domain === domain);

  return (
    <div className="nb-page nb-fo nb-fo-accueil">
      <header className="nb-tete-onglet">
        <h1>{t("title")}</h1>
        {/* Paramètres in place of the avatar, as on the Fil (Ephraïm, 27/10/2026). */}
        <Link href="/app/parametres" className="nb-rond" aria-label={t("settings")}>
          <PhoneIcon name="reglages" size={23} />
        </Link>
        <MeAvatar />
      </header>

      <FormationSearch
        open={searching}
        start={start}
        onOpen={() => setSearching(true)}
        onClose={() => {
          setSearching(false);
          setStart(null);
        }}
        current={view.current}
        skills={view.skills}
      />

      {searching ? null : (
        <>
          <div className="nb-fo-onglets" role="tablist" aria-label={t("tabs")}>
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`fo-${key}`}
                aria-selected={tab === key}
                aria-controls="fo-panneau"
                onClick={() => setTab(key)}
              >
                {t(`tab.${TAB_KEYS[key]}`)}
              </button>
            ))}
          </div>

          <div id="fo-panneau" role="tabpanel" aria-labelledby={`fo-${tab}`}>
            {tab === "pour-vous" ? (
              <>
                {view.current ? (
                  <>
                    <div className="nb-ex-sec">
                      <h2 id="fo-reprendre">{t("resume.title")}</h2>
                      <button
                        type="button"
                        className="nb-fo-tout"
                        onClick={() => setTab("mes-cours")}
                      >
                        {t("tab.mine")}
                      </button>
                    </div>
                    {/* « Reprendre » (Ephraïm, 01/11/2026): the cover small with its progress, the
                        title once, the time left, one lime button that pulses, Orbi inside. */}
                    <div className="nb-fo-reprendre">
                      <Link
                        href={view.current.href}
                        className="nb-fo-continuer"
                        aria-label={t("resume.label", { course: view.current.title })}
                      >
                        <span className="nb-fo-rp-haut">
                          <span
                            className="nb-fo-vign"
                            data-ton={view.current.tone}
                            data-couv={view.current.cover ? "" : undefined}
                            aria-hidden
                          >
                            {view.current.cover ? (
                              <CourseCover src={view.current.cover} />
                            ) : (
                              <CourseArt />
                            )}
                            <span className="nb-fo-lire">
                              <PhoneIcon name="lecture" size={14} fill="currentColor" />
                            </span>
                            <span className="nb-fo-vign-barre">
                              <i style={{ width: `${view.current.progress}%` }} />
                            </span>
                          </span>
                          <span className="nb-fo-rp-t">
                            <span className="nb-fo-sur">{view.current.lesson}</span>
                            <b>{view.current.title}</b>
                            <small className="nb-meta">{view.current.left}</small>
                          </span>
                        </span>
                        <span className="nb-fo-rp-bas">
                          <span className="nb-fo-rp-pc">
                            {t("percent", { value: view.current.progress })}
                          </span>
                          <span className="nb-fo-barre" aria-hidden>
                            <i style={{ width: `${view.current.progress}%` }} />
                          </span>
                          <span className="nb-fo-rp-bouton">{t("resume.action")}</span>
                        </span>
                      </Link>
                      {view.advice ? (
                        <div className="nb-fo-conseil">
                          <OrbiDisc size={26} />
                          <span>
                            {view.advice.lead}
                            <br />
                            {view.advice.end}
                          </span>
                          <button
                            type="button"
                            aria-label={t("why")}
                            onClick={() => askOrbiFrom("cours")}
                          >
                            <PhoneIcon name="question" size={18} stroke={2} />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div className="nb-fo-vide">
                    <b>{t("empty.title")}</b>
                    <p className="nb-meta">{t("empty.text")}</p>
                  </div>
                )}

                <div className="nb-ex-sec">
                  <h2 id="fo-offres">{t("forOffers")}</h2>
                  <button
                    type="button"
                    className="nb-fo-tout"
                    aria-label={t("seeAllOf", { section: t("forOffers") })}
                    onClick={() => {
                      setStart("cours");
                      setSearching(true);
                    }}
                  >
                    {t("seeAll")}
                  </button>
                </div>
                {view.chips.length > 0 ? (
                  <div
                    className="nb-ex-rangee nb-ex-filtres"
                    role="group"
                    aria-label={t("domains")}
                  >
                    <button
                      type="button"
                      className="nb-ex-chip"
                      aria-pressed={domain === null}
                      onClick={() => setDomain(null)}
                    >
                      {t("all")}
                    </button>
                    {view.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="nb-ex-chip"
                        aria-pressed={domain === chip}
                        onClick={() => setDomain(domain === chip ? null : chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : null}
                {cards.length === 0 ? (
                  <p className="nb-ex-vide">{t("noCourses")}</p>
                ) : (
                  <div className="nb-ex-rangee nb-fo-tuiles" aria-labelledby="fo-offres">
                    {cards.map((course) => (
                      <CourseTile key={course.slug} course={course} />
                    ))}
                  </div>
                )}

                <div className="nb-ex-sec">
                  <h2>{view.interview.title}</h2>
                </div>
                {view.interview.line ? (
                  <p className="nb-fo-entretien nb-meta">{view.interview.line}</p>
                ) : null}
                <Link href={view.interview.href} className="nb-fo-ligne">
                  <OrbiDisc size={48} />
                  <span className="nb-fo-ligne-t">
                    <b>{t("practice")}</b>
                    <small className="nb-meta">{t("practiceLine")}</small>
                  </span>
                  <PhoneIcon name="chevron" size={16} />
                </Link>
              </>
            ) : null}

            {tab === "mes-cours" ? (
              <div className="nb-fo-mes">
                <p className="nb-fo-gr">{t("inProgress")}</p>
                {view.inProgress.length === 0 ? (
                  <p className="nb-ex-vide">{t("noProgress")}</p>
                ) : (
                  view.inProgress.map((row) => <CourseLine key={row.slug} row={row} />)
                )}
                <p className="nb-fo-gr">{t("finishedGroup")}</p>
                {view.finished.length === 0 ? (
                  <p className="nb-ex-vide">{t("noFinished")}</p>
                ) : (
                  view.finished.map((row) => <CourseLine key={row.slug} row={row} />)
                )}
                <p className="nb-fo-gr">{t("saved")}</p>
                {view.saved.length === 0 ? (
                  <p className="nb-ex-vide">{t("noSaved")}</p>
                ) : (
                  view.saved.map((row) => <CourseLine key={row.slug} row={row} />)
                )}
              </div>
            ) : null}

            {tab === "attestations" ? (
              <div className="nb-fo-atts">
                <p className="nb-fo-gr">{view.certificatesTitle}</p>
                {view.certificates.map((item) => (
                  <Link key={item.id} href={item.href} className="nb-fo-att">
                    <span className="nb-fo-coche" aria-hidden>
                      <PhoneIcon name="coche" size={22} stroke={2.6} />
                    </span>
                    <span>
                      <b>{item.title}</b>
                      <small>{item.line}</small>
                    </span>
                    <PhoneIcon name="chevron" size={16} />
                  </Link>
                ))}
                <p className="nb-meta nb-fo-note">{t("certificatesNote")}</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
