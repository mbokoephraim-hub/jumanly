"use client";

/* eslint-disable @next/next/no-img-element -- banner of a company: one picture, already reduced */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { followCompanyAction } from "@/server/actions/explore";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import type { PostView } from "../fil/data";
import { PostCard, type PostSheet } from "../fil/post";
import { PostSheets, type SendTarget } from "../fil/sheets";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CompanyMark, ConnectButton, OfferRow, Verified } from "./cards";
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
  verified: boolean;
  /** « @baobabfintech · Fintech · Kinshasa ». */
  handle: string;
  /** The first sentence of its presentation, under its name. */
  tagline: string | null;
  about: string | null;
  size: string | null;
  sector: string | null;
  seat: string | null;
  since: string;
  website: string | null;
  followers: number;
  following: boolean;
  offers: { view: OfferView; line: string }[];
  members: {
    id: string;
    /** Null when their profile is not visible: their name and title only. */
    href: string | null;
    name: string;
    initials: string;
    tone: number;
    image: string | null;
    title: string | null;
    link: "none" | "sent" | "connected";
  }[];
};

/**
 * The page of a company (Modèle B, planche Entreprise, rangée 09): its banner, its mark, « Suivre »,
 * who it is and its numbers, then « Publications · À propos · Offres · Membres ». « À propos » opens
 * first. The way back is the page before.
 */
export function PhoneCompany({
  company,
  posts,
  targets,
  initialTab = "apropos",
}: {
  company: CompanyPageView;
  posts: PostView[];
  targets: SendTarget[];
  initialTab?: Tab;
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
    const url = window.location.href;
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
    <div className="nb-page nb-ex nb-ex-profil">
      <div className="nb-ex-banniere" data-ton={company.tone}>
        {company.banner ? (
          <img src={company.banner} alt={t("company.banner", { name: company.name })} />
        ) : null}
        <div className="nb-ex-banniere-b">
          <span className="nb-ex-rond">
            <PhoneBack fallback="/app/jobs" label={t("company.back")} />
          </span>
          <button
            type="button"
            className="nb-ex-rond"
            aria-label={t("company.more")}
            onClick={() => setMenu(true)}
          >
            <PhoneIcon name="plusOptions" size={22} />
          </button>
        </div>
      </div>

      <div className="nb-ex-id">
        <div className="nb-ex-id-haut">
          <span className="nb-ex-id-mark">
            <CompanyMark
              initials={company.initials}
              logo={company.logo}
              tone={company.tone}
              size={92}
            />
          </span>
          <span className="nb-ex-id-actions">
            <button
              type="button"
              className="nb-ex-suivre"
              data-suivi={following ? "" : undefined}
              aria-pressed={following}
              disabled={pending}
              onClick={follow}
            >
              {following ? t("company.following") : t("company.follow")}
            </button>
          </span>
        </div>
        <h1 className="nb-ex-id-nom">
          {company.name}
          {company.verified ? <Verified label={t("verified")} size={22} /> : null}
        </h1>
        <p className="nb-meta nb-ex-id-handle">{company.handle}</p>
        {company.tagline ? <p className="nb-ex-id-ligne">{company.tagline}</p> : null}
        <p className="nb-ex-id-chiffres">
          {company.size ? <span>{t("company.employees", { size: company.size })}</span> : null}
          <span>{t("company.followers", { count: followers })}</span>
          <span>{t("company.offers", { count: company.offers.length })}</span>
        </p>
      </div>

      <div className="nb-ex-onglets" role="tablist" aria-label={t("company.tabs")}>
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

      <div id="ent-panneau" role="tabpanel" aria-labelledby={`ent-${tab}`}>
        {tab === "publications" ? (
          <>
            {posts.filter((post) => !gone.includes(post.id)).length === 0 ? (
              <p className="nb-ex-vide">{t("company.noPosts", { name: company.name })}</p>
            ) : null}
            {posts
              .filter((post) => !gone.includes(post.id))
              .map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSheet={(target, sheet) => setOpen({ post: target, sheet })}
                />
              ))}
          </>
        ) : null}

        {tab === "apropos" ? (
          <div className="nb-ex-apropos">
            <h2 className="nb-ex-groupe">{t("company.about")}</h2>
            <p className="nb-ex-texte">
              {company.about ?? t("company.noAbout", { name: company.name })}
            </p>
            <h2 className="nb-ex-groupe">{t("company.brief")}</h2>
            <div className="nb-ex-bref">
              {company.size ? (
                <Fact
                  label={t("company.size")}
                  value={t("company.sizeValue", { size: company.size })}
                />
              ) : null}
              {company.sector ? <Fact label={t("company.sector")} value={company.sector} /> : null}
              {company.seat ? <Fact label={t("company.seat")} value={company.seat} /> : null}
              <Fact label={t("company.since")} value={company.since} />
            </div>
            {company.website ? (
              <a
                href={company.website}
                className="nb-ex-site"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("company.website")}
                <PhoneIcon name="lien" size={16} />
              </a>
            ) : null}
          </div>
        ) : null}

        {tab === "offres" ? (
          company.offers.length === 0 ? (
            <p className="nb-ex-vide">{t("company.noOffers", { name: company.name })}</p>
          ) : (
            company.offers.map(({ view, line }) => (
              <OfferRow key={view.id} offer={view} line={line} />
            ))
          )
        ) : null}

        {tab === "membres" ? (
          <div className="nb-ex-membres">
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
            <p className="nb-ex-sous">
              {t("company.membersCount", { count: company.members.length })}
            </p>
            {query.trim() && members.length === 0 ? (
              <p className="nb-ex-vide">{t("company.noMember", { query: query.trim() })}</p>
            ) : null}
            {members.map((member) => (
              <div key={member.id} className="nb-ex-pers">
                <MemberLink href={member.href}>
                  <FilAvatar
                    initials={member.initials}
                    image={member.image}
                    tone={member.tone}
                    org={false}
                    size={56}
                  />
                  <span className="nb-ex-pers-texte">
                    <b>{member.name}</b>
                    {member.title ? <span>{member.title}</span> : null}
                    {member.link === "connected" ? (
                      <small>{t("company.memberConnected")}</small>
                    ) : null}
                  </span>
                </MemberLink>
                {member.link === "connected" && member.href ? (
                  <Link href={member.href} className="nb-ex-connecter" data-etat="message">
                    {t("message")}
                  </Link>
                ) : member.href ? (
                  <ConnectButton person={member} />
                ) : null}
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
      </PhoneSheet>
    </div>
  );
}

function MemberLink({ href, children }: { href: string | null; children: ReactNode }) {
  return href ? (
    <Link href={href} className="nb-ex-pers-l">
      {children}
    </Link>
  ) : (
    <span className="nb-ex-pers-l">{children}</span>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="nb-ex-fait">
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}
