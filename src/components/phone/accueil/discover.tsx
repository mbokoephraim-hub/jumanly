"use client";

/* eslint-disable @next/next/no-img-element -- a 92 px illustration */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LOGO_SVG, OrbiDisc, PhoneIcon, WORDMARK_SVG } from "../icon";
import { OPENING_ID } from "../opening-script";
import { DISCOVER_SEEN_KEY as SEEN_KEY } from "./discover-flag";

const LONG_MS = 3900;
const SHORT_MS = 1700;
const REDUCED_MS = 900;
const SLIDES = ["s1", "s2", "s3"] as const;

const MARK = `<svg width="72" height="72" viewBox="0 0 120 120" aria-hidden="true" style="display:block;overflow:visible"><rect width="120" height="120" rx="30" fill="#A6F26B"/><g transform="translate(2.25 -4.35) scale(1.1)"><path class="nb-lg-trait" d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="#0F3F37" stroke-width="17" stroke-linecap="round" stroke-dasharray="72"/><circle class="nb-lg-tete" cx="70" cy="31" r="11.5" fill="#0F3F37"/></g></svg>`;
const WORD = WORDMARK_SVG.replace('width="150" height="37.9"', 'width="222" height="56.1"').replace(
  "<circle ",
  '<circle class="nb-lg-point" ',
);

function Opening({ leaving }: { leaving: boolean }) {
  const t = useTranslations("phoneAccueil.opening");
  return (
    <div className="nb-spl" data-part={leaving ? "" : undefined} role="img" aria-label={t("aria")}>
      <span className="nb-spl-halo" />
      <div className="nb-spl-long">
        <div className="nb-lgs">
          <div className="nb-lgs-in" dangerouslySetInnerHTML={{ __html: MARK }} />
        </div>
        <div className="nb-lgt" dangerouslySetInnerHTML={{ __html: WORD }} />
      </div>
      <p className="nb-slogan" aria-hidden>
        <span>{t("learn")}</span> <span>{t("grow")}</span> <span>{t("connect")}</span>
      </p>
      <p className="nb-porteur" aria-hidden>
        {t("by")}
      </p>
      <div className="nb-spl-court">
        <span className="nb-onde" />
        <div className="nb-lgs-in" dangerouslySetInnerHTML={{ __html: MARK }} />
      </div>
    </div>
  );
}

/** The cards over each screen: decorative, they show what the space looks like. */
function Illustration({ slide }: { slide: (typeof SLIDES)[number] }) {
  const t = useTranslations("phoneAccueil.welcome.card");
  if (slide === "s1")
    return (
      <span className="nb-illu" key="s1">
        <span
          className="nb-illu-carte"
          data-flotte=""
          style={{ "--r": "-4deg" } as React.CSSProperties}
        >
          <span className="nb-illu-image" data-ton="ambre">
            <svg viewBox="0 0 272 126" preserveAspectRatio="xMidYMid slice" aria-hidden>
              <g fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="22">
                <circle cx="20" cy="63" r="62" />
                <circle cx="252" cy="63" r="62" />
              </g>
            </svg>
            <span>{t("courseMark")}</span>
          </span>
          <span className="nb-illu-corps">
            <b>{t("course")}</b>
            <span className="nb-meta">{t("lesson")}</span>
            <span className="nb-illu-barre">
              <i />
            </span>
            <span className="nb-illu-tags">
              <span className="nb-tag">{t("level")}</span>
              <span className="nb-tag" data-lime="">
                {t("free")}
              </span>
            </span>
          </span>
        </span>
        <span
          className="nb-illu-bulle"
          data-flotte2=""
          data-place="s1"
          style={{ "--r": "5deg" } as React.CSSProperties}
        >
          <span className="nb-illu-ok">
            <PhoneIcon name="coche" size={18} stroke={2.6} />
          </span>
          <span>
            <b>{t("certificate")}</b>
            <span className="nb-meta">{t("obtained")}</span>
          </span>
        </span>
      </span>
    );
  if (slide === "s2")
    return (
      <span className="nb-illu" key="s2">
        <span
          className="nb-illu-profil"
          data-flotte=""
          style={{ "--r": "-2deg" } as React.CSSProperties}
        >
          <span className="nb-illu-anneau">
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,.1)"
                strokeWidth="5"
              />
              <circle
                cx="56"
                cy="56"
                r="52"
                fill="none"
                stroke="#A6F26B"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="228.7 326.7"
              />
            </svg>
            <img src="/modele-b/accueil-portrait.jpg" alt="" width={92} height={92} />
          </span>
          <b>{t("name")}</b>
          <span className="nb-meta">{t("cap")}</span>
          <span className="nb-illu-pct">{t("complete")}</span>
        </span>
        <span
          className="nb-illu-bulle"
          data-orbi=""
          data-flotte2=""
          data-place="s2"
          style={{ "--r": "-3deg" } as React.CSSProperties}
        >
          <OrbiDisc size={30} />
          <span>{t("tip")}</span>
        </span>
      </span>
    );
  return (
    <span className="nb-illu" key="s3">
      <span
        className="nb-illu-carte"
        data-flotte=""
        style={{ "--r": "3deg" } as React.CSSProperties}
      >
        <span className="nb-illu-image" data-ton="sapin">
          <span>{t("companyMark")}</span>
        </span>
        <span className="nb-illu-corps">
          <b>{t("job")}</b>
          <span className="nb-illu-org">{t("company")}</span>
          <span className="nb-illu-tags">
            <span className="nb-tag">{t("contract")}</span>
            <span className="nb-tag">{t("mode")}</span>
            <span className="nb-tag" data-lime="">
              {t("match")}
            </span>
          </span>
        </span>
      </span>
      <span
        className="nb-illu-bulle"
        data-flotte2=""
        data-place="s3"
        style={{ "--r": "-2deg" } as React.CSSProperties}
      >
        <span className="nb-illu-av">{t("fromMark")}</span>
        <span>
          <b>{t("from")}</b>
          <span className="nb-illu-msg">{t("message")}</span>
        </span>
      </span>
    </span>
  );
}

/** The recruiter's three screens (Modèle B recruteur, M2): an offer, the pipeline, a decision. */
function RecruiterIllustration({ slide }: { slide: (typeof SLIDES)[number] }) {
  const t = useTranslations("phoneRhAccueil.welcome.card");
  if (slide === "s1")
    return (
      <span className="nb-illu" key="r1">
        <span
          className="nb-rh-illu-offre"
          data-flotte=""
          style={{ "--r": "-3deg" } as React.CSSProperties}
        >
          <span className="nb-illu-tags">
            <span className="nb-tag" data-lime="">
              {t("live")}
            </span>
            <span className="nb-tag" data-plein="">
              {t("new")}
            </span>
          </span>
          <b>{t("job")}</b>
          <span className="nb-meta">{t("jobMeta")}</span>
          <span className="nb-rh-illu-chiffres">
            {(
              [
                ["412", "views"],
                ["6", "days"],
                ["38", "applications"],
              ] as const
            ).map(([figure, key]) => (
              <span key={key}>
                <b>{figure}</b>
                {t(key)}
              </span>
            ))}
          </span>
        </span>
        <span
          className="nb-rh-illu-orbi"
          data-flotte2=""
          data-place="r1"
          style={{ "--r": "4deg" } as React.CSSProperties}
        >
          <OrbiDisc size={28} />
          <span>{t("drafted")}</span>
        </span>
      </span>
    );
  if (slide === "s2")
    return (
      <span className="nb-illu" key="r2">
        <span
          className="nb-rh-illu-offre"
          data-large=""
          data-flotte=""
          style={{ "--r": "-2deg" } as React.CSSProperties}
        >
          <span className="nb-rh-illu-etapes">
            {(
              [
                ["18", "received"],
                ["9", "shortlist"],
                ["5", "interview"],
                ["1", "offer"],
              ] as const
            ).map(([figure, key]) => (
              <span key={key} data-on={key === "interview" ? "" : undefined}>
                <b>{figure}</b>
                {t(key)}
              </span>
            ))}
          </span>
          {(
            [
              ["c1", "86 %"],
              ["c2", "81 %"],
            ] as const
          ).map(([key, score]) => (
            <span key={key} className="nb-rh-illu-cand">
              <span className="nb-rh-illu-av">{t(`${key}Mark`)}</span>
              <span>
                <b>{t(`${key}Name`)}</b>
                <span className="nb-meta">{t(`${key}Meta`)}</span>
              </span>
              <b className="nb-rh-illu-score">{score}</b>
            </span>
          ))}
        </span>
        <span
          className="nb-rh-illu-orbi"
          data-flotte2=""
          data-place="r2"
          style={{ "--r": "3deg" } as React.CSSProperties}
        >
          <OrbiDisc size={28} />
          <span>{t("read")}</span>
        </span>
      </span>
    );
  return (
    <span className="nb-illu" key="r3">
      <span
        className="nb-rh-illu-entretien"
        data-flotte=""
        style={{ "--r": "3deg" } as React.CSSProperties}
      >
        <span className="nb-rh-illu-quand">{t("when")}</span>
        <b>{t("c1Name")}</b>
        <span className="nb-rh-illu-ou">{t("where")}</span>
        <span className="nb-rh-illu-etoiles" role="img" aria-label={t("stars")}>
          {[0, 1, 2, 3, 4].map((index) => (
            <svg key={index} width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"
                fill={index < 4 ? "#14745F" : "#C9D0CC"}
              />
            </svg>
          ))}
        </span>
      </span>
      <span
        className="nb-illu-bulle"
        data-flotte2=""
        data-place="r3"
        style={{ "--r": "-3deg" } as React.CSSProperties}
      >
        <span className="nb-illu-ok">
          <PhoneIcon name="coche" size={18} stroke={2.6} />
        </span>
        <span>
          <b>{t("decision")}</b>
          <span className="nb-meta">{t("replies")}</span>
        </span>
      </span>
    </span>
  );
}

export function PhoneDiscover({ recruiter = false }: { recruiter?: boolean }) {
  const t = useTranslations(recruiter ? "phoneRhAccueil.welcome" : "phoneAccueil.welcome");
  const common = useTranslations("phoneAccueil.welcome");
  const [phase, setPhase] = useState<"ouverture" | "depart" | "bienvenue">("ouverture");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    // The logo of the launch, if any, gives way to this opening.
    document.getElementById(OPENING_ID)?.remove();
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(SEEN_KEY));
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduced ? REDUCED_MS : seen ? SHORT_MS : LONG_MS;
    const leave = window.setTimeout(() => setPhase("depart"), wait);
    const done = window.setTimeout(() => setPhase("bienvenue"), wait + 340);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  const key = SLIDES[slide];
  return (
    <div className="nb-page nb-decouvrir">
      <div className="nb-bienvenue" data-ecran="" inert={phase === "ouverture"}>
        <div className="nb-bienvenue-logo">
          <span
            dangerouslySetInnerHTML={{
              __html: LOGO_SVG.replace('width="58" height="58"', 'width="30" height="30"'),
            }}
          />
          <span
            dangerouslySetInnerHTML={{
              __html: WORDMARK_SVG.replace('width="150" height="37.9"', 'width="96" height="24.3"'),
            }}
          />
        </div>
        <button
          type="button"
          className="nb-bienvenue-scene"
          aria-label={common("next")}
          onClick={() => setSlide((slide + 1) % SLIDES.length)}
        >
          {recruiter ? <RecruiterIllustration slide={key} /> : <Illustration slide={key} />}
        </button>
        <div className="nb-bienvenue-texte" aria-live="polite">
          <p className="nb-mot">{t(`${key}.word`)}</p>
          <h1>{t(`${key}.title`)}</h1>
          <p className="nb-sous">{t(`${key}.text`)}</p>
        </div>
        <div className="nb-points-sl">
          {SLIDES.map((item, index) => (
            <button
              key={item}
              type="button"
              aria-label={common("dot", { n: index + 1, word: t(`${item}.word`) })}
              aria-current={index === slide || undefined}
              onClick={() => setSlide(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="nb-bas-fixe">
          <Link
            href={recruiter ? "/inscription?profil=rh" : "/inscription"}
            className="nb-bp"
            prefetch
          >
            {common("signup")}
          </Link>
          <Link href={recruiter ? "/connexion?profil=rh" : "/connexion"} className="nb-bs" prefetch>
            {common("login")}
          </Link>
        </div>
      </div>
      {phase !== "bienvenue" ? <Opening leaving={phase === "depart"} /> : null}
    </div>
  );
}
