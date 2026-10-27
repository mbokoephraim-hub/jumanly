"use client";

/* eslint-disable @next/next/no-img-element -- banner and logo of a company: already reduced */
import "@/styles/phone-apropos.css";
import "@/styles/phone-entreprise-page.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { followCompanyAction } from "@/server/actions/explore";
import type { SocialKind } from "@/lib/social-links";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import type { PostView } from "../fil/data";
import { PostCard, type PostSheet } from "../fil/post";
import { PostSheets, type SendTarget } from "../fil/sheets";
import { PhoneIcon } from "../icon";
import { SOCIAL_PATHS, VerifiedMark } from "../profil/profile";
import { PhoneSheet } from "../sheet";
import { ConnectButton, OfferRow } from "./cards";
import type { OfferView } from "./data";

const TABS = ["publications", "apropos", "offres", "membres"] as const;
type Tab = (typeof TABS)[number];

export type CompanyPageView = {
  slug: string;
  name: string;
  initials: string;
  tone: number;
  logo: string | null;
  banner: string | null;
  /** The banner's colour when no picture is uploaded (the theme chosen at sign-up). */
  bannerColor: string;
  verified: boolean;
  /** « @jumanly ». */
  handle: string;
  socials: { kind: SocialKind; href: string; label: string }[];
  /** The seat with its flag; null for an international company or an unknown seat. */
  place: { flag: string; flagLabel: string; text: string } | null;
  international: boolean;
  hiringNow: boolean;
  /** The first sentence of its presentation, under its name. */
  tagline: string | null;
  about: string | null;
  size: string | null;
  sector: string | null;
  /** The sector split into its domains (« Banque, Assurance »). */
  domains: string[];
  founded: { year: string; age: string | null } | null;
  seat: string | null;
  since: string;
  website: string | null;
  websiteLabel: string | null;
  followers: number;
  following: boolean;
  offers: { view: OfferView; line: string }[];
  /** The company's recruiters, each one's profile open to everyone. */
  members: {
    id: string;
    href: string;
    name: string;
    initials: string;
    tone: number;
    image: string | null;
    title: string | null;
    role: string;
    link: "none" | "sent" | "connected";
    self: boolean;
  }[];
};

/**
 * The page of a company on the phone, in the identity of a person's profile (Ephraïm 27/10/2026):
 * the banner, the square logo with its networks, the name, the handle, the seat with its flag (or
 * « International »), the presentation and its chips, « Suivre » (or « Modifier » for its
 * administrators), then « Publications · À propos · Offres · Membres ».
 */
export function PhoneCompany({
  company,
  posts,
  targets,
  initialTab = "publications",
  own,
}: {
  company: CompanyPageView;
  posts: PostView[];
  targets: SendTarget[];
  initialTab?: Tab;
  /** The recruiter's own company: who administers it, « Modifier », « Publier ». */
  own?: { note: string; edit: string | null; publish: string | null };
}) {
  const t = useTranslations("phoneExplorer");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [following, setFollowing] = useState(company.following);
  const [followers, setFollowers] = useState(company.followers);
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const index = TABS.indexOf(tab);
  const shown = posts.filter((post) => !gone.includes(post.id));

  const follow = () =>
    start(async () => {
      const result = await followCompanyAction(company.slug);
      if (!result.ok) {
        showToast({ message: t("company.followError"), tone: "error" });
        return;
      }
      setFollowing(result.value);
      setFollowers((count) => count + (result.value ? 1 : -1));
    });
  const share = async () => {
    setMenu(false);
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: company.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast({ message: t("company.shared") });
    } catch {}
  };
  const members = company.members.filter((member) =>
    member.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="nb-page nb-pf nb-co">
      <header className="nb-pf-barre">
        <span className="nb-pf-rb">
          <PhoneBack fallback="/app/jobs" label={t("company.back")} />
        </span>
        <span className="nb-pf-titre">{t("company.title")}</span>
        <span className="nb-pf-barre-d">
          <button
            type="button"
            className="nb-pf-rb"
            aria-label={t("company.share")}
            onClick={share}
          >
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
          <button
            type="button"
            className="nb-pf-rb"
            aria-label={t("company.more")}
            onClick={() => setMenu(true)}
          >
            <PhoneIcon name="plusOptions" size={17} />
          </button>
        </span>
      </header>

      <div className="nb-pf-banniere" style={{ background: company.bannerColor }}>
        {company.banner ? (
          <img src={company.banner} alt={t("company.banner", { name: company.name })} />
        ) : (
          <svg viewBox="0 0 350 88" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <g fill="none" stroke="#A6F26B" strokeWidth="14" strokeOpacity=".22">
              <circle cx="300" cy="10" r="46" />
              <circle cx="300" cy="10" r="86" />
              <circle cx="300" cy="10" r="126" />
            </g>
            <circle cx="44" cy="70" r="5" fill="var(--nb-lime)" />
          </svg>
        )}
        {company.domains[0] ? <span className="nb-pf-banniere-t">{company.domains[0]}</span> : null}
      </div>

      <div className="nb-pf-photo-l">
        <span className="nb-co-logo" data-ton={company.tone}>
          {company.logo ? <img src={company.logo} alt="" /> : <b>{company.initials}</b>}
        </span>
        {company.socials.length > 0 ? (
          <ul className="nb-pf-reseaux" aria-label={t("company.socials")}>
            {company.socials.map((item) => (
              <li key={item.kind}>
                <a
                  href={item.href}
                  className="nb-pf-so"
                  aria-label={item.label}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
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
          {company.name}
          {company.verified ? <VerifiedMark label={t("verified")} /> : null}
        </h1>
        <p className="nb-pf-alias">{company.handle}</p>
        {company.international ? (
          <p className="nb-pf-lieu">
            <span className="nb-co-globe" aria-hidden>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={SOCIAL_PATHS.website} />
              </svg>
            </span>
            <span>{t("company.international")}</span>
          </p>
        ) : company.place ? (
          <p className="nb-pf-lieu">
            {company.place.flag ? (
              <span className="nb-pf-drapeau" role="img" aria-label={company.place.flagLabel}>
                {company.place.flag}
              </span>
            ) : null}
            <span>{company.place.text}</span>
          </p>
        ) : null}
        {company.tagline ? <p className="nb-pf-bio">{company.tagline}</p> : null}
        <div className="nb-pf-chips">
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
            {t.rich("company.followersChip", {
              count: followers,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </span>
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
            {t.rich("company.offersChip", {
              count: company.offers.length,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </span>
          {company.size ? (
            <span className="nb-pf-st">{t("company.employees", { size: company.size })}</span>
          ) : null}
          {company.hiringNow ? (
            <span className="nb-pf-st" data-recrute="">
              <i className="nb-pf-point" aria-hidden />
              {t("company.hiring")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="nb-pf-actions">
        {own?.edit ? (
          <Link href={own.edit} className="nb-pf-bt nb-co-modifier">
            <PhoneIcon name="modifier" size={17} />
            {t("company.edit")}
          </Link>
        ) : (
          <button
            type="button"
            className="nb-pf-bt"
            data-etat={following ? "connected" : "none"}
            aria-pressed={following}
            disabled={pending}
            onClick={follow}
          >
            {following ? t("company.following") : t("company.follow")}
          </button>
        )}
        {own?.publish ? (
          <Link href={own.publish} className="nb-pf-bt" data-etat="chat">
            {t("company.publish")}
          </Link>
        ) : (
          <button type="button" className="nb-pf-bt" data-etat="chat" onClick={share}>
            {t("company.share")}
          </button>
        )}
      </div>
      {own ? (
        <p className="nb-co-own">
          <PhoneIcon name="organisation" size={16} />
          {own.note}
        </p>
      ) : null}

      <div className="nb-pf-onglets">
        <div className="nb-pf-seg" role="tablist" aria-label={t("company.tabs")}>
          <span
            className="nb-pf-ind"
            style={{
              width: `calc((100% - 6px) / ${TABS.length})`,
              transform: `translateX(${index * 100}%)`,
            }}
            aria-hidden
          />
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`ent-${key}`}
              aria-selected={tab === key}
              aria-controls="ent-panneau"
              onClick={() => setTab(key)}
            >
              {key === "offres"
                ? t("company.tab.offres", { count: company.offers.length })
                : t(`company.tab.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <div
        id="ent-panneau"
        role="tabpanel"
        aria-labelledby={`ent-${tab}`}
        className="nb-pf-pane"
        key={tab}
      >
        {tab === "publications" ? (
          shown.length === 0 ? (
            <p className="nb-pf-vide">{t("company.noPosts", { name: company.name })}</p>
          ) : (
            shown.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSheet={(target, sheet) => setOpen({ post: target, sheet })}
              />
            ))
          )
        ) : null}

        {tab === "apropos" ? (
          <>
            <h2 className="nb-pf-h">{t("company.whoWeAre")}</h2>
            <div className="nb-pf-presente">
              <p className="nb-co-texte">
                {company.about ?? t("company.noAbout", { name: company.name })}
              </p>
            </div>
            <h2 className="nb-pf-h" data-loin="">
              {t("company.brief")}
            </h2>
            <div className="nb-co-faits">
              {company.founded ? (
                <Fact
                  icon="agenda"
                  label={t("company.founded")}
                  value={company.founded.year}
                  note={company.founded.age}
                />
              ) : null}
              {company.size ? (
                <Fact
                  icon="personne"
                  label={t("company.employeesLabel")}
                  value={t("company.sizeValue", { size: company.size })}
                />
              ) : null}
              {company.seat ? (
                <Fact icon="organisation" label={t("company.seat")} value={company.seat} />
              ) : null}
              <Fact icon="horloge" label={t("company.since")} value={company.since} />
            </div>
            {company.domains.length > 0 ? (
              <>
                <h2 className="nb-pf-h" data-loin="">
                  {t("company.domains")}
                </h2>
                <div className="nb-pf-presente">
                  <ul className="nb-pf-domaines" aria-label={t("company.domains")}>
                    {company.domains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
            {company.website ? (
              <>
                <h2 className="nb-pf-h" data-loin="">
                  {t("company.contact")}
                </h2>
                <a
                  href={company.website}
                  className="nb-co-site"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PhoneIcon name="lien" size={16} />
                  <span>{company.websiteLabel ?? t("company.website")}</span>
                </a>
              </>
            ) : null}
          </>
        ) : null}

        {tab === "offres" ? (
          company.offers.length === 0 ? (
            <p className="nb-pf-vide">{t("company.noOffers", { name: company.name })}</p>
          ) : (
            <div className="nb-co-offres">
              {company.offers.map(({ view, line }) => (
                <OfferRow key={view.id} offer={view} line={line} />
              ))}
            </div>
          )
        ) : null}

        {tab === "membres" ? (
          <div className="nb-co-membres">
            {company.members.length > 4 ? (
              <label className="nb-ex-recherche nb-ex-recherche-m">
                <PhoneIcon name="recherche" size={20} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={t("company.membersSearch")}
                  placeholder={t("company.membersSearch")}
                />
              </label>
            ) : null}
            <h2 className="nb-pf-h">
              {t("company.recruiters", { count: company.members.length })}
            </h2>
            {company.members.length === 0 ? (
              <p className="nb-pf-vide">{t("company.noRecruiter", { name: company.name })}</p>
            ) : null}
            {query.trim() && members.length === 0 ? (
              <p className="nb-pf-vide">{t("company.noMember", { query: query.trim() })}</p>
            ) : null}
            {members.map((member) => (
              <div key={member.id} className="nb-co-membre">
                <Link href={member.href} className="nb-co-membre-l">
                  <FilAvatar
                    initials={member.initials}
                    image={member.image}
                    tone={member.tone}
                    org={false}
                    size={52}
                  />
                  <span className="nb-co-membre-t">
                    <b>{member.name}</b>
                    <span>{member.title ?? member.role}</span>
                    <small>
                      {member.title ? member.role : null}
                      {member.link === "connected"
                        ? `${member.title ? " · " : ""}${t("company.memberConnected")}`
                        : null}
                    </small>
                  </span>
                </Link>
                {member.self ? null : member.link === "connected" ? (
                  <Link href={member.href} className="nb-ex-connecter" data-etat="message">
                    {t("company.seeProfile")}
                  </Link>
                ) : (
                  <ConnectButton person={member} />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <PostSheets
        post={open?.post ?? null}
        sheet={open?.sheet ?? null}
        onSheet={(sheet) => setOpen((current) => (current ? { ...current, sheet } : current))}
        onClose={() => setOpen(null)}
        onHidden={(post) => setGone((current) => [...current, post.id])}
        targets={targets}
      />

      <PhoneSheet
        open={menu}
        onClose={() => setMenu(false)}
        label={t("company.menu", { name: company.name })}
        closeLabel={t("apply.close")}
      >
        <b className="nb-ex-feuille-t">{t("company.menu", { name: company.name })}</b>
        <button type="button" className="nb-opt nb-fil-opt" onClick={share}>
          <PhoneIcon name="lien" size={20} />
          {t("company.menuShare")}
        </button>
        {own?.edit ? (
          <Link href={own.edit} className="nb-opt nb-fil-opt">
            <PhoneIcon name="modifier" size={20} />
            {t("company.edit")}
          </Link>
        ) : null}
      </PhoneSheet>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  note,
}: {
  icon: "agenda" | "personne" | "organisation" | "horloge";
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <span className="nb-co-fait">
      <i aria-hidden>
        <PhoneIcon name={icon} size={17} />
      </i>
      <small>{label}</small>
      <b>{value}</b>
      {note ? <em>{note}</em> : null}
    </span>
  );
}
