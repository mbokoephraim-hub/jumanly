"use client";

import "@/styles/phone-apropos.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GoldSeal } from "../badge-or";
import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { connectAction, reportPersonAction } from "@/server/actions/explore";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import type { PostView } from "../fil/data";
import { PostCard, type PostSheet } from "../fil/post";
import { PostSheets, type SendTarget } from "../fil/sheets";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { EducationList, ItemVerifiedMark } from "./education-rows";
import { ExperienceLogo, ExperienceMeta, ExperiencePoints } from "./experience-head";
import { PhotoViewer } from "./photo-viewer";
import { PROFILE_TABS, type ProfileTab, type ProfileView } from "./data";

const REASONS = ["harassment", "impersonation", "spam", "inappropriate", "other"] as const;

/** Réalisations clés shown before « Voir plus » (3 to 4 are advised). */
const POINTS_SHOWN = 4;

/** The networks' drawings (maquette `Profil.dc.html`, ICS). */
export const SOCIAL_PATHS = {
  linkedin:
    "M4.5 3.5h15a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM8 10.5v6M8 7.5v.01M12 16.5v-3.5a2 2 0 0 1 4 0v3.5M12 10.5v6",
  instagram:
    "M8 3.5h8A4.5 4.5 0 0 1 20.5 8v8a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 16V8A4.5 4.5 0 0 1 8 3.5zM12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zM17.2 6.8v.01",
  email:
    "M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM3.5 7l8.5 6 8.5-6",
  x: "M4.5 4h4l11 16h-4zM19.5 4l-6.3 7M10.8 13 4.5 20",
  facebook:
    "M14.5 8H17V4.5h-2.5A4 4 0 0 0 10.5 8.5V11H8v3.5h2.5V21H14v-6.5h2.6l.4-3.5h-3V9a1 1 0 0 1 1-1z",
  website:
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.4 2.4 3.4 5.2 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.2-3.4-8.5s1-6.1 3.4-8.5z",
} as const;

/** The ring around the photo: the colours of the first five skills, in equal parts. */
export function ringOf(colors: string[]) {
  if (colors.length === 0) return "var(--nb-surface)";
  if (colors.length === 1) return colors[0]!;
  const step = 100 / colors.length;
  return `conic-gradient(${colors
    .map(
      (color, index) => `${color} ${Math.round(index * step)}% ${Math.round((index + 1) * step)}%`,
    )
    .join(", ")})`;
}

/** A tint of a palette colour (« #A6F26B » → « #A6F26B1F »). */
const tint = (color: string, alpha: string) => `${color}${alpha}`;

/** The profile's verified seal, beside the name: gold like every verified mark (31/10/2026). */
export function VerifiedMark({ label, size = 18 }: { label: string; size?: number }) {
  return <GoldSeal size={size} label={label} />;
}

/**
 * The mark of a paid plan after the name (Ephraïm 29/10/2026): no word, one icon per level, none
 * for a free plan. 1: a sky spark, 2: a mint bolt, 3: a gold crown.
 */
export function PlanMark({
  tier,
  label,
  size = 18,
}: {
  tier: 0 | 1 | 2 | 3;
  label: string;
  size?: number;
}) {
  if (tier === 0) return null;
  return (
    <svg
      className="nb-pf-formule"
      data-niveau={tier}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {tier === 1 ? (
        <>
          <circle cx="12" cy="12" r="10.5" fill="#1E4E79" />
          <path
            d="M12 5.5l1.6 4.9 4.9 1.6-4.9 1.6-1.6 4.9-1.6-4.9-4.9-1.6 4.9-1.6z"
            fill="#7CC4FF"
          />
        </>
      ) : tier === 2 ? (
        <>
          <path d="M12 1.8l8.9 5.1v10.2L12 22.2l-8.9-5.1V6.9z" fill="#2E2557" />
          <path d="M13.2 5.5 7.8 13h3.8l-1 5.5 5.6-7.6h-3.9z" fill="#B9A6FF" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10.5" fill="#F2C230" />
          <path
            d="M6.5 15.8 5.6 8.6l3.6 2.8L12 6.6l2.8 4.8 3.6-2.8-.9 7.2z"
            fill="#5A3D0B"
            strokeLinejoin="round"
          />
          <path d="M7 17.6h10" stroke="#5A3D0B" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/**
 * The profile of a person on the phone (docs/profil-personne, maquette `Profil.dc.html`): the
 * compact head (banner 4:1, photo with its ring, networks, name, handle, flag and local time,
 * bio, chips, connections in common), then `actions` (« Se connecter » and « Chat », or the
 * recruiter's card), then « Publications · À propos · Réalisations · Portfolio ».
 */
export function PersonProfile({
  person,
  posts,
  targets,
  title,
  back,
  actions,
  more,
  initialTab = "apropos",
  own,
}: {
  person: ProfileView;
  posts: PostView[];
  targets: SendTarget[];
  /** « Profil » or « Candidat ». */
  title: string;
  back: string;
  /** Between the head and the tabs. */
  actions: ReactNode;
  /** « ··· »: the recruiter's menu; the profile's own (share, report) when left out. */
  more?: { label: string; onOpen: () => void };
  initialTab?: ProfileTab;
  /** One's own recruiter profile: the pencils of each section, the photo to change, « Statistiques ». */
  own?: OwnProfile;
}) {
  const t = useTranslations("phoneProfile");
  const tx = useTranslations("phoneExplorer.person");
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [menu, setMenu] = useState<"menu" | "report" | null>(null);
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [unfolded, setUnfolded] = useState<string[]>(
    person.experiences.slice(0, 1).map((e) => e.id),
  );
  const [pending, start] = useTransition();
  const [photoOpen, setPhotoOpen] = useState(false);
  const shown = posts.filter((post) => !gone.includes(post.id));
  // A recruiter has no portfolio; on their own profile, « Statistiques » (and their dashboard).
  const tabs: readonly ProfileTab[] = person.recruiter
    ? own
      ? ["publications", "apropos", "realisations", "statistiques"]
      : ["publications", "apropos", "realisations"]
    : PROFILE_TABS;
  const index = tabs.indexOf(tab);
  const educationLabels = {
    verified: t("itemVerified"),
    verifiedHelp: t("verifiedHelp"),
    document: t("documentJoined"),
    jumanly: t("jumanly"),
    openImage: (title: string) => t("openImage", { title }),
  };
  const edit = (title: string, href: string | undefined, label?: string) =>
    own && href ? (
      <Link href={href} aria-label={`${label ?? t("own.edit")} : ${title}`}>
        {label ?? t("own.edit")}
      </Link>
    ) : null;

  const share = async () => {
    setMenu(null);
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: person.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast({ message: t("shared") });
    } catch {}
  };
  const report = (reason: (typeof REASONS)[number]) =>
    start(async () => {
      const result = await reportPersonAction(person.id, reason);
      setMenu(null);
      showToast(
        result.ok ? { message: tx("reported") } : { message: tx("reportError"), tone: "error" },
      );
    });

  return (
    <div className="nb-page nb-pf">
      <header className="nb-pf-barre">
        <span className="nb-pf-rb">
          <PhoneBack fallback={back} label={t("back")} />
        </span>
        <span className="nb-pf-titre">{title}</span>
        <span className="nb-pf-barre-d">
          <button type="button" className="nb-pf-rb" aria-label={t("share")} onClick={share}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
          </button>
          {own ? (
            <Link href={own.account.href} className="nb-pf-rb" aria-label={own.account.label}>
              <PhoneIcon name="reglages" size={18} />
            </Link>
          ) : (
            <button
              type="button"
              className="nb-pf-rb"
              aria-label={more?.label ?? t("more")}
              onClick={more ? more.onOpen : () => setMenu("menu")}
            >
              <PhoneIcon name="plusOptions" size={17} />
            </button>
          )}
        </span>
      </header>

      <div
        className="nb-pf-banniere"
        style={{ background: person.bannerColor.background } as CSSProperties}
      >
        {person.banner ? (
          // eslint-disable-next-line @next/next/no-img-element -- the person's own upload
          <img src={person.banner} alt="" />
        ) : (
          <svg viewBox="0 0 350 88" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <g fill="none" stroke={person.bannerColor.motif} strokeWidth="14" strokeOpacity=".5">
              <circle cx="300" cy="10" r="46" />
              <circle cx="300" cy="10" r="86" />
              <circle cx="300" cy="10" r="126" />
            </g>
            <circle cx="44" cy="70" r="5" fill="var(--nb-lime)" />
          </svg>
        )}
        {person.bannerTitle ? <span className="nb-pf-banniere-t">{person.bannerTitle}</span> : null}
      </div>

      <div className="nb-pf-photo-l">
        <span className="nb-pf-photo" style={{ background: ringOf(person.ring) }}>
          {/* A touch brings the photo forward, the screen behind blurs (PhotoViewer). */}
          <button
            type="button"
            className="nb-cr-photo-bt"
            onClick={() => setPhotoOpen(true)}
            aria-label={t("photoOpen")}
          >
            {person.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- the person's own photo
              <img src={person.image} alt="" />
            ) : (
              <span className="nb-pf-photo-i" aria-hidden>
                <FilAvatar
                  initials={person.initials}
                  image={null}
                  tone={person.tone}
                  org={false}
                  size={92}
                />
              </span>
            )}
          </button>
          {person.online ? (
            <span className="nb-pf-enligne" role="img" aria-label={t("activity.now")} />
          ) : null}
        </span>
        {person.socials.length > 0 ? (
          <ul className="nb-pf-reseaux" aria-label={t("socials")}>
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
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d={SOCIAL_PATHS[item.kind]} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="nb-pf-id">
        <h1>
          {person.name}
          {person.verified ? (
            person.premium ? (
              <VerifiedMark label={t("verified")} />
            ) : null
          ) : (
            <span className="nb-pf-tag" data-gris="">
              {t("notVerified")}
            </span>
          )}
        </h1>
        <p className="nb-pf-alias">{person.handle}</p>
        {person.place ? (
          <p className="nb-pf-lieu">
            {person.place.flag ? (
              <span className="nb-pf-drapeau" role="img" aria-label={person.place.flagLabel}>
                {person.place.flag}
              </span>
            ) : null}
            <span>{person.place.text}</span>
            {person.place.time ? (
              <span className="nb-pf-heure">{t("timeLine", { time: person.place.time })}</span>
            ) : null}
          </p>
        ) : null}
        {person.recruiter?.post ? (
          <p className="nb-pf-poste">
            {person.recruiter.organization
              ? t("recruiter.postAt", {
                  post: person.recruiter.post,
                  org: person.recruiter.organization.name,
                })
              : person.recruiter.post}
          </p>
        ) : null}
        {person.bio ? <p className="nb-pf-bio">{person.bio}</p> : null}
        <div className="nb-pf-chips" data-ligne="">
          <span className="nb-pf-st">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--nb-lime)"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M16 4.8a3.4 3.4 0 0 1 0 6.4M18.5 14.6c1.6.8 2.6 2.4 3 4.9" />
            </svg>
            {t.rich("followers", { count: person.followers, b: (chunks) => <b>{chunks}</b> })}
          </span>
          {person.domain ? (
            <span className="nb-pf-st">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--nb-ambre)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3.5 8.5h17v11h-17zM8.5 8.5V5.5h7v3" />
              </svg>
              {person.domain}
            </span>
          ) : null}
          {person.contract ? (
            <span className="nb-pf-st">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7CC4FF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="8.5" />
                <path d="m15.5 8.5-2 5-5 2 2-5z" />
              </svg>
              {t.rich("seeks", { contract: person.contract, b: (chunks) => <b>{chunks}</b> })}
            </span>
          ) : null}
          {person.recruiter?.hiringNow ? (
            <span className="nb-pf-st" data-recrute="">
              <i className="nb-pf-point" aria-hidden />
              {t("recruiter.hiringNow")}
            </span>
          ) : null}
          {person.recruiter ? <span className="nb-pf-st">{person.recruiter.offers}</span> : null}
          {person.activity ? (
            <span className="nb-pf-st">
              <i className="nb-pf-point" aria-hidden />
              {person.activity}
            </span>
          ) : null}
        </div>
        {person.common ? (
          <p className="nb-pf-commun">
            <span className="nb-pf-commun-av" aria-hidden>
              {person.common.people.map((item, at) =>
                item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a member's photo
                  <img key={at} src={item.image} alt="" />
                ) : (
                  <span key={at} style={{ background: item.color }}>
                    {item.initials}
                  </span>
                ),
              )}
            </span>
            <span>{person.common.line}</span>
          </p>
        ) : null}
      </div>

      {actions}

      <div className="nb-pf-onglets">
        <div
          className="nb-pf-seg"
          role="tablist"
          aria-label={t("tabs")}
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          <span
            className="nb-pf-ind"
            style={{
              width: `calc((100% - 6px) / ${tabs.length})`,
              transform: `translateX(${index * 100}%)`,
            }}
            aria-hidden
          />
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`pf-${key}`}
              aria-selected={tab === key}
              aria-controls="pf-panneau"
              onClick={() => setTab(key)}
            >
              {t(`tab.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div
        id="pf-panneau"
        role="tabpanel"
        aria-labelledby={`pf-${tab}`}
        className="nb-pf-pane"
        key={tab}
      >
        {tab === "apropos" ? (
          <>
            {own ? (
              <h2 className="nb-pf-h nb-cr-h">
                {t("own.about")}
                {edit(t("own.about"), own.edits.about, person.about ? undefined : t("own.add"))}
              </h2>
            ) : null}
            {person.about ? (
              <AboutCard about={person.about} />
            ) : own ? (
              <div className="nb-pf-presente">
                <p>
                  <Link href={own.edits.about}>{t("own.aboutEmpty")}</Link>
                </p>
              </div>
            ) : null}
            {person.recruiter && (person.recruiter.seeking || own) ? (
              <>
                <h2 className="nb-pf-h nb-cr-h" data-loin="">
                  {t("recruiter.seeking")}
                  {edit(t("recruiter.seeking"), own?.edits.seeking)}
                </h2>
                <div className="nb-pf-presente">
                  {person.recruiter.seeking ? (
                    <p>{person.recruiter.seeking}</p>
                  ) : own ? (
                    <p>
                      <Link href={own.edits.seeking}>{t("own.seekingEmpty")}</Link>
                    </p>
                  ) : null}
                  {person.recruiter.domains.length > 0 ? (
                    <ul className="nb-pf-domaines" aria-label={t("recruiter.domains")}>
                      {person.recruiter.domains.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </>
            ) : null}
            {person.recruiter && person.skills.length === 0 ? null : (
              <h2 className="nb-pf-h" data-loin={person.recruiter ? "" : undefined}>
                {t("skills")} <span>{person.skillsCount}</span>
              </h2>
            )}
            {person.recruiter && person.skills.length === 0 ? null : person.skills.length === 0 ? (
              <p className="nb-pf-vide">{t("noSkills", { name: person.first })}</p>
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
                      {skill.verified ? <GoldSeal size={15} label={t("skillVerified")} /> : null}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h2 className={own ? "nb-pf-h nb-cr-h" : "nb-pf-h"} data-loin="">
              <span className="nb-pf-h-t">
                {t("experiences")} <span>{person.experiencesCount}</span>
              </span>
              {edit(t("experiences"), own?.edits.experience, t("own.add"))}
            </h2>
            {person.experiences.length === 0 ? (
              <p className="nb-pf-vide">{t("noExperience")}</p>
            ) : (
              person.experiences.map((item, at) => {
                const all = unfolded.includes(item.id);
                const points = all ? item.points : item.points.slice(0, POINTS_SHOWN);
                return (
                  <div key={item.id} className="nb-pf-xp">
                    {at < person.experiences.length - 1 ? (
                      <span
                        className="nb-pf-fil"
                        style={{
                          background: `linear-gradient(${item.color}, rgba(255,255,255,.08))`,
                        }}
                        aria-hidden
                      />
                    ) : null}
                    <ExperienceLogo item={item} />
                    <div>
                      <h3>
                        {item.title}
                        {item.verified ? (
                          <ItemVerifiedMark label={t("itemVerified")} help={t("verifiedHelp")} />
                        ) : null}
                      </h3>
                      <ExperienceMeta
                        item={item}
                        label={t("companyPage", { company: item.company })}
                      />
                      <ExperiencePoints item={item} points={points} />
                      {item.points.length > POINTS_SHOWN ? (
                        <button
                          type="button"
                          className="nb-pf-plus"
                          style={{ color: item.color }}
                          aria-expanded={all}
                          onClick={() =>
                            setUnfolded((current) =>
                              all ? current.filter((id) => id !== item.id) : [...current, item.id],
                            )
                          }
                        >
                          {all
                            ? t("less")
                            : t("moreLines", { count: item.points.length - POINTS_SHOWN })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}

            {person.diplomas.length > 0 || own ? (
              <>
                <h2 className={own ? "nb-pf-h nb-cr-h" : "nb-pf-h"}>
                  {t("diplomas")}
                  {edit(t("diplomas"), own?.edits.education, t("own.add"))}
                </h2>
                {person.diplomas.length === 0 ? (
                  <p className="nb-pf-vide">{t("own.diplomasEmpty")}</p>
                ) : null}
                <EducationList rows={person.diplomas} labels={educationLabels} />
              </>
            ) : null}

            {person.certificates.length > 0 || own ? (
              <>
                <h2 className={own ? "nb-pf-h nb-cr-h" : "nb-pf-h"}>
                  {t("certificates")}
                  {edit(t("certificates"), own?.edits.certificate, t("own.add"))}
                </h2>
                {person.certificates.length === 0 ? (
                  <p className="nb-pf-vide">{t("own.certificatesEmpty")}</p>
                ) : null}
                <EducationList rows={person.certificates} labels={educationLabels} />
              </>
            ) : null}

            {person.languages.length > 0 || own ? (
              <>
                <h2 className={own ? "nb-pf-h nb-cr-h" : "nb-pf-h"} data-loin="">
                  {t("languages")}
                  {own?.edits.languages}
                </h2>
                {person.languages.length === 0 ? (
                  <p className="nb-pf-vide">{t("own.languagesEmpty")}</p>
                ) : null}
                <ul className="nb-pf-langues">
                  {person.languages.map((item) => (
                    <li key={item.name}>
                      <b>
                        {item.flag ? (
                          <span className="nb-pf-drapeau" aria-hidden>
                            {item.flag}
                          </span>
                        ) : null}
                        {item.name}
                      </b>
                      <span
                        className="nb-pf-niv"
                        role="img"
                        aria-label={t("level", { level: item.level })}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <i key={n} data-on={n <= item.level ? "" : undefined} />
                        ))}
                      </span>
                      <small>{item.label}</small>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : null}

        {tab === "publications" ? (
          shown.length === 0 ? (
            <p className="nb-pf-vide">{t("noPosts", { name: person.first })}</p>
          ) : (
            shown.map((post) => (
              <PostCard
                key={post.key}
                post={post}
                onSheet={(target, sheet) => setOpen({ post: target, sheet })}
              />
            ))
          )
        ) : null}

        {tab === "realisations" && own ? (
          <h2 className="nb-pf-h nb-cr-h">
            {t("tab.realisations")}
            {edit(t("tab.realisations"), own.edits.projects, t("own.add"))}
          </h2>
        ) : null}
        {tab === "statistiques" ? (
          <>
            {own?.stats}
            {own?.suivi}
          </>
        ) : null}

        {tab === "realisations" ? (
          person.works.length === 0 ? (
            <p className="nb-pf-vide">{t("noWorks", { name: person.first })}</p>
          ) : (
            <ul className="nb-pf-reals">
              {person.works.map((work, at) => {
                const body = (
                  <>
                    <span className="nb-pf-real-c" style={{ background: work.color }}>
                      {work.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- the person's own picture
                        <img src={work.cover} alt="" />
                      ) : (
                        <svg viewBox="0 0 160 112" aria-hidden>
                          <g fill="none" stroke="#FFFFFF" strokeOpacity=".25" strokeWidth="12">
                            <circle cx="140" cy="0" r="40" />
                            <circle cx="140" cy="0" r="72" />
                          </g>
                        </svg>
                      )}
                      <span className="nb-pf-tag" data-sombre="">
                        {work.kind}
                      </span>
                    </span>
                    <span className="nb-pf-real-t">
                      <b>{work.title}</b>
                      {work.skills.length > 0 ? (
                        <span className="nb-pf-real-s">
                          {work.skills.map((skill) => (
                            <span
                              key={skill.name}
                              style={{ background: tint(skill.color, "22"), color: skill.color }}
                            >
                              {skill.name}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </>
                );
                return (
                  <li
                    key={work.id}
                    className="nb-pf-real"
                    style={{ animationDelay: `${at * 0.06}s` }}
                  >
                    {work.href ? <Link href={work.href}>{body}</Link> : <div>{body}</div>}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}

        {tab === "portfolio" ? (
          person.files.length === 0 ? (
            <p className="nb-pf-vide">{t("noFiles", { name: person.first })}</p>
          ) : (
            <ul className="nb-pf-port">
              {person.files.map((file, at) => (
                <li key={file.id} style={{ animationDelay: `${at * 0.06}s` }}>
                  <a
                    href={file.href}
                    {...(file.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer nofollow" }
                      : {})}
                  >
                    <span
                      className="nb-pf-port-k"
                      style={{ background: tint(file.color, "2E"), color: file.color }}
                      aria-hidden
                    >
                      {file.badge}
                    </span>
                    <span className="nb-pf-port-t">
                      <b>{file.title}</b>
                      <small>{file.line}</small>
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      <PhotoViewer
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        image={person.image}
        initials={person.initials}
        name={person.name}
        ring={ringOf(person.ring)}
        editable={Boolean(own)}
      />
      <PostSheets
        post={open?.post ?? null}
        sheet={open?.sheet ?? null}
        onSheet={(sheet) => setOpen((current) => (current ? { ...current, sheet } : current))}
        onClose={() => setOpen(null)}
        onHidden={(post) => setGone((current) => [...current, post.id])}
        targets={targets}
      />

      {more ? null : (
        <PhoneSheet
          open={menu !== null}
          onClose={() => setMenu(null)}
          label={
            menu === "report"
              ? tx("report", { name: person.first })
              : tx("menu", { name: person.name })
          }
          closeLabel={t("close")}
        >
          {menu === "report" ? (
            <>
              <b className="nb-ex-feuille-t">{tx("report", { name: person.first })}</b>
              <p className="nb-meta">{tx("reportNote", { name: person.first })}</p>
              {REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="nb-opt nb-fil-opt"
                  disabled={pending}
                  onClick={() => report(reason)}
                >
                  {tx(`reason.${reason}`)}
                </button>
              ))}
              <button
                type="button"
                className="nb-bouton"
                data-large=""
                onClick={() => setMenu(null)}
              >
                {tx("cancel")}
              </button>
            </>
          ) : (
            <>
              <b className="nb-ex-feuille-t">{tx("menu", { name: person.name })}</b>
              <button type="button" className="nb-opt nb-fil-opt" onClick={share}>
                <PhoneIcon name="lien" size={20} />
                {tx("menuShare")}
              </button>
              <button type="button" className="nb-opt nb-fil-opt" onClick={() => setMenu("report")}>
                <PhoneIcon name="signaler" size={20} />
                {tx("menuReport")}
              </button>
            </>
          )}
        </PhoneSheet>
      )}
    </div>
  );
}

/**
 * « Se connecter » (Lime) → « Demande envoyée » → « Connectés »; « Chat » only once connected:
 * no message without an accepted connection (docs/profil-personne § En-tête 10).
 */
export function ConnectionActions({ person }: { person: ProfileView }) {
  const t = useTranslations("phoneProfile");
  const [link, setLink] = useState(person.link);
  const [pending, start] = useTransition();
  const connect = () =>
    start(async () => {
      const result = await connectAction(person.id);
      if (!result.ok) {
        showToast({ message: t("connectError"), tone: "error" });
        return;
      }
      const next = result.value === "accepted" || link === "received" ? "connected" : "sent";
      // The button itself now reads « Demande envoyée » / « Connectés » : no toast.
      setLink(next);
    });
  return (
    <div className="nb-pf-actions">
      {link === "connected" ? (
        <span className="nb-pf-bt" data-etat="connected">
          <PhoneIcon name="coche" size={16} />
          {t("connected")}
        </span>
      ) : link === "sent" ? (
        <span className="nb-pf-bt" data-etat="sent">
          <PhoneIcon name="horloge" size={16} />
          {t("sent")}
        </span>
      ) : (
        <button
          type="button"
          className="nb-pf-bt"
          data-etat="none"
          disabled={pending}
          onClick={connect}
        >
          <PhoneIcon name="plus" size={16} />
          {link === "received" ? t("accept") : t("connect")}
        </button>
      )}
      {link === "connected" && person.conversationId ? (
        <Link href={`/app/messages/${person.conversationId}`} className="nb-pf-bt" data-etat="chat">
          <PhoneIcon name="messages" size={16} />
          {t("chat")}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * « À propos », before the skills (décision d'Ephraïm du 27/10/2026): the person's own title and
 * up to 400 characters on who they are and what they do.
 */
export function AboutCard({ about }: { about: NonNullable<ProfileView["about"]> }) {
  return (
    <div className="nb-pf-presente">
      {about.title ? <h3>{about.title}</h3> : null}
      <p>{about.text}</p>
    </div>
  );
}

/** One's own recruiter profile (Ephraïm 27/10/2026): where each section is changed. */
export type OwnProfile = {
  edits: {
    about: string;
    seeking: string;
    experience: string;
    education: string;
    certificate: string;
    projects: string;
    /** « Langues et lieux »: its own button and sheet. */
    languages: ReactNode;
  };
  /** « Statistiques »: who came to the profile and the posts, then the recruiter's dashboard. */
  stats: ReactNode;
  suivi: ReactNode;
  /** The round at the top right in place of « ··· »: the account. */
  account: { href: string; label: string };
};
