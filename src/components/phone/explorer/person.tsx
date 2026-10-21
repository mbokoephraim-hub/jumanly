"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { reportPersonAction } from "@/server/actions/explore";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import type { PostView } from "../fil/data";
import { PostCard, type PostSheet } from "../fil/post";
import { PostSheets, type SendTarget } from "../fil/sheets";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { CompanyMark, ConnectButton, Verified } from "./cards";

const TABS = ["publications", "apropos", "realisations"] as const;
type Tab = (typeof TABS)[number];
const REASONS = ["harassment", "impersonation", "spam", "inappropriate", "other"] as const;

export type PersonPageView = {
  id: string;
  name: string;
  initials: string;
  tone: number;
  image: string | null;
  verified: boolean;
  /** « @patrick.ilunga · Kinshasa ». */
  handle: string;
  title: string | null;
  company: { name: string; href: string | null } | null;
  connections: number;
  common: number;
  link: "none" | "sent" | "connected" | "received";
  conversationId: string | null;
  about: string | null;
  skills: string[];
  experiences: { id: string; initials: string; tone: number; title: string; when: string }[];
  educations: { id: string; initials: string; tone: number; title: string; when: string }[];
  works: { id: string; title: string; line: string; tone: number }[];
};

/**
 * The page of a person (Modèle B, planche Personne, rangée 10): the banner, the photo, « Message »
 * once connected and « Se connecter », who they are, their numbers, then « Publications · À propos
 * · Réalisations ». Their details come only when their profile is visible or the two are connected
 * (checked on the server).
 */
export function PhonePerson({
  person,
  posts,
  targets,
}: {
  person: PersonPageView;
  posts: PostView[];
  targets: SendTarget[];
}) {
  const t = useTranslations("phoneExplorer");
  const [tab, setTab] = useState<Tab>("apropos");
  const [link, setLink] = useState(person.link);
  const [menu, setMenu] = useState<"menu" | "report" | null>(null);
  const [open, setOpen] = useState<{ post: PostView; sheet: PostSheet } | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const first = person.name.split(" ")[0] ?? person.name;

  const share = async () => {
    setMenu(null);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: person.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast({ message: t("person.shared") });
    } catch {}
  };
  const report = (reason: (typeof REASONS)[number]) =>
    start(async () => {
      const result = await reportPersonAction(person.id, reason);
      setMenu(null);
      showToast(
        result.ok
          ? { message: t("person.reported") }
          : { message: t("person.reportError"), tone: "error" },
      );
    });
  const note =
    link === "connected"
      ? t("person.noteConnected")
      : link === "sent"
        ? t("person.noteSent", { name: first })
        : link === "received"
          ? t("person.noteReceived", { name: first })
          : t("person.noteNone");
  const shown = posts.filter((post) => !gone.includes(post.id));

  return (
    <div className="nb-page nb-ex nb-ex-profil">
      <div className="nb-ex-banniere nb-ex-vagues" data-ton={person.tone}>
        <svg viewBox="0 0 390 150" preserveAspectRatio="none" aria-hidden>
          <g fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="2">
            <path d="M0 70 C 90 30, 180 110, 270 60 S 390 40, 390 40" />
            <path d="M0 100 C 100 60, 190 140, 280 90 S 390 70, 390 70" />
            <path d="M0 130 C 110 90, 200 170, 290 120 S 390 100, 390 100" />
          </g>
          <circle cx="330" cy="30" r="22" fill="var(--nb-lime)" opacity=".85" />
        </svg>
        <div className="nb-ex-banniere-b">
          <span className="nb-ex-rond">
            <PhoneBack fallback="/app/jobs" label={t("person.back")} />
          </span>
          <button
            type="button"
            className="nb-ex-rond"
            aria-label={t("person.more")}
            onClick={() => setMenu("menu")}
          >
            <PhoneIcon name="plusOptions" size={22} />
          </button>
        </div>
      </div>

      <div className="nb-ex-id nb-ex-id-pers">
        <div className="nb-ex-id-haut">
          <span className="nb-ex-id-photo">
            <FilAvatar
              initials={person.initials}
              image={person.image}
              tone={person.tone}
              org={false}
              size={124}
            />
          </span>
          <span className="nb-ex-id-actions">
            {link === "connected" && person.conversationId ? (
              <Link
                href={`/app/messages/${person.conversationId}`}
                className="nb-ex-rond-c"
                aria-label={t("person.message", { name: first })}
              >
                <PhoneIcon name="messages" size={20} />
              </Link>
            ) : null}
            <ConnectButton
              person={{ id: person.id, name: first, link: link === "received" ? "none" : link }}
              onLink={setLink}
              size="l"
              label={link === "received" ? t("person.accept") : undefined}
            />
          </span>
        </div>
        <h1 className="nb-ex-id-nom">
          {person.name}
          {person.verified ? <Verified label={t("person.verified")} size={22} /> : null}
        </h1>
        <p className="nb-meta nb-ex-id-handle">{person.handle}</p>
        {person.title ? (
          <p className="nb-ex-id-ligne">
            {person.company
              ? t.rich("person.at", {
                  title: person.title,
                  company: person.company.name,
                  org: (chunks) =>
                    person.company?.href ? (
                      <Link href={person.company.href} className="nb-ex-id-org" data-lien="">
                        {chunks}
                      </Link>
                    ) : (
                      <b className="nb-ex-id-org">{chunks}</b>
                    ),
                })
              : person.title}
          </p>
        ) : null}
        <p className="nb-ex-id-chiffres">
          <span>{t("person.connections", { count: person.connections })}</span>
          {person.common > 0 ? <span>{t("person.common", { count: person.common })}</span> : null}
        </p>
        <p className="nb-ex-id-note">{note}</p>
      </div>

      <div className="nb-ex-onglets" role="tablist" aria-label={t("person.tabs")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`pers-${key}`}
            aria-selected={tab === key}
            aria-controls="pers-panneau"
            onClick={() => setTab(key)}
          >
            {key === "realisations"
              ? t("person.tab.realisations", { count: person.works.length })
              : t(`person.tab.${key}`)}
          </button>
        ))}
      </div>

      <div id="pers-panneau" role="tabpanel" aria-labelledby={`pers-${tab}`}>
        {tab === "publications" ? (
          <>
            {shown.length === 0 ? (
              <p className="nb-ex-vide">{t("person.noPosts", { name: first })}</p>
            ) : null}
            {shown.map((post) => (
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
            <h2 className="nb-ex-groupe">{t("person.about")}</h2>
            <p className="nb-ex-texte">{person.about ?? t("person.noAbout", { name: first })}</p>
            {person.skills.length > 0 ? (
              <>
                <h2 className="nb-ex-groupe">{t("person.skills")}</h2>
                <div className="nb-ex-comp">
                  {person.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </>
            ) : null}
            {person.experiences.length > 0 ? (
              <>
                <h2 className="nb-ex-groupe">{t("person.experience")}</h2>
                {person.experiences.map((item) => (
                  <Entry key={item.id} {...item} />
                ))}
              </>
            ) : null}
            {person.educations.length > 0 ? (
              <>
                <h2 className="nb-ex-groupe">{t("person.education")}</h2>
                {person.educations.map((item) => (
                  <Entry key={item.id} {...item} />
                ))}
              </>
            ) : null}
          </div>
        ) : null}

        {tab === "realisations" ? (
          person.works.length === 0 ? (
            <p className="nb-ex-vide">{t("person.noWorks", { name: first })}</p>
          ) : (
            <div className="nb-ex-reals">
              {person.works.map((work) => (
                <article key={work.id} className="nb-ex-real">
                  <span className="nb-ex-real-img" data-ton={work.tone} aria-hidden>
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
                  <b>{work.title}</b>
                  <small>{work.line}</small>
                </article>
              ))}
            </div>
          )
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
        open={menu !== null}
        onClose={() => setMenu(null)}
        label={
          menu === "report"
            ? t("person.report", { name: first })
            : t("person.menu", { name: person.name })
        }
        closeLabel={t("apply.close")}
      >
        {menu === "report" ? (
          <>
            <b className="nb-ex-feuille-t">{t("person.report", { name: first })}</b>
            <p className="nb-meta">{t("person.reportNote", { name: first })}</p>
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className="nb-opt nb-fil-opt"
                disabled={pending}
                onClick={() => report(reason)}
              >
                {t(`person.reason.${reason}`)}
              </button>
            ))}
            <button type="button" className="nb-bouton" data-large="" onClick={() => setMenu(null)}>
              {t("person.cancel")}
            </button>
          </>
        ) : (
          <>
            <b className="nb-ex-feuille-t">{t("person.menu", { name: person.name })}</b>
            <button type="button" className="nb-opt nb-fil-opt" onClick={share}>
              <PhoneIcon name="lien" size={20} />
              {t("person.menuShare")}
            </button>
            {link !== "none" ? (
              <button type="button" className="nb-opt nb-fil-opt" onClick={() => setMenu("report")}>
                <PhoneIcon name="signaler" size={20} />
                {t("person.menuReport")}
              </button>
            ) : null}
          </>
        )}
      </PhoneSheet>
    </div>
  );
}

function Entry({
  initials,
  tone,
  title,
  when,
}: {
  initials: string;
  tone: number;
  title: string;
  when: string;
}) {
  return (
    <div className="nb-ex-entree">
      <CompanyMark initials={initials} logo={null} tone={tone} size={48} />
      <span>
        <b>{title}</b>
        <small>{when}</small>
      </span>
    </div>
  );
}
