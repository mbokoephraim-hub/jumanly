"use client";

/* eslint-disable @next/next/no-img-element -- logos and photos of Explorer: small, already reduced */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { connectAction } from "@/server/actions/explore";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";
import type { CompanyView, OfferView, PersonView } from "./data";

/** The green check of a verified company (planche Offres). */
export function Verified({ label, size = 15 }: { label: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className="nb-ex-verif"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="m7.5 12.5 3 3 6-6.5"
        fill="none"
        stroke="var(--nb-nuit)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The square mark of a company: its logo, or its initials in its colour. */
export function CompanyMark({
  initials,
  logo,
  tone,
  size = 52,
  white = false,
}: {
  initials: string;
  logo: string | null;
  tone: number;
  size?: number;
  /** On a coloured cover: a white tile with the initials in the colour (planche Offres). */
  white?: boolean;
}) {
  return (
    <span
      className="nb-ex-logo"
      data-ton={tone}
      data-blanc={white ? "" : undefined}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.32),
        borderRadius: Math.round(size * 0.28),
      }}
      aria-hidden
    >
      {logo ? <img src={logo} alt="" width={size} height={size} /> : initials}
    </span>
  );
}

/** The score of an offer: lime from 75 %, dark under (planche Offres). */
export function Score({ score }: { score: number | null }) {
  const t = useTranslations("phoneExplorer");
  if (score === null) return null;
  return (
    <span className="nb-ex-score" data-fort={score >= 75 ? "" : undefined}>
      {t("score", { score })}
    </span>
  );
}

/**
 * A company of « Entreprises qui recrutent » (Ephraïm, 03/11/2026), in the family of the offer cards:
 * its banner as a band (or its colour and rings), its logo set on the edge, its name, then Offres ·
 * Secteur · Ville, and at the bottom « Recrute en ce moment » and « Voir l'entreprise ».
 */
export function CompanyCard({ company }: { company: CompanyView }) {
  const t = useTranslations("phoneExplorer");
  const hiring = company.offers > 0;
  return (
    <article className="nb-ex-ec" data-ton={company.tone}>
      <div className="nb-ex-ec-bande" aria-hidden>
        {company.banner ? <img src={company.banner} alt="" /> : null}
      </div>
      <div className="nb-ex-ec-corps">
        <span className="nb-ex-ec-logo">
          <CompanyMark
            initials={company.initials}
            logo={company.logo}
            tone={company.tone}
            size={58}
          />
        </span>
        <h3 className="nb-ex-ec-nom">
          <Link href={company.href}>{company.name}</Link>
          {company.verified ? <Verified label={t("companyCardVerified")} size={16} /> : null}
        </h3>
        <dl className="nb-rh-oc-stats">
          <div>
            <dt>{t("companyCardOffers")}</dt>
            <dd data-plein={hiring ? "" : undefined}>{company.offers}</dd>
          </div>
          <div>
            <dt>{t("companyCardSector")}</dt>
            <dd>{company.sector ?? t("companyCardNone")}</dd>
          </div>
          <div>
            <dt>{t("companyCardCity")}</dt>
            <dd>{company.city ?? t("companyCardNone")}</dd>
          </div>
        </dl>
      </div>
      <div className="nb-rh-oc-pied">
        {hiring ? (
          <span className="nb-ex-ec-recrute">
            <i className="nb-rh-pouls" aria-hidden />
            {t("companyCardHiring")}
          </span>
        ) : (
          <span className="nb-rh-oc-aucune">{t("companyCardQuiet")}</span>
        )}
        <Link
          href={company.href}
          className="nb-rh-oc-plusbt"
          aria-label={t("companyCard", { name: company.name })}
        >
          {t("companyCardSee")}
        </Link>
      </div>
    </article>
  );
}

/** One offer in a list (« Tout voir », search, saved): mark, title, line, score. */
export function OfferRow({
  offer,
  line,
  muted,
}: {
  offer: OfferView;
  line: string;
  muted?: string;
}) {
  return (
    <Link href={offer.href} className="nb-ex-ligne">
      <CompanyMark initials={offer.initials} logo={offer.logo} tone={offer.tone} size={46} />
      <span className="nb-ex-ligne-texte">
        <b>{offer.title}</b>
        <small>{line}</small>
      </span>
      {muted ? <span className="nb-ex-ferme">{muted}</span> : <Score score={offer.score} />}
    </Link>
  );
}

/** One company in a list: mark, name, line, « Voir ›». */
export function CompanyRow({ company, line }: { company: CompanyView; line: string }) {
  const t = useTranslations("phoneExplorer");
  return (
    <Link href={company.href} className="nb-ex-ligne">
      <CompanyMark initials={company.initials} logo={company.logo} tone={company.tone} size={46} />
      <span className="nb-ex-ligne-texte">
        <b>{company.name}</b>
        <small>{line}</small>
      </span>
      <span className="nb-ex-voir">{t("search.see")}</span>
    </Link>
  );
}

/**
 * « Se connecter » of a person: asks at once and becomes « Envoyée » (or « Connecté » when they had
 * asked first). Nothing is decided for the other person: they accept or not.
 */
export function ConnectButton({
  person,
  onLink,
  size = "m",
  label,
}: {
  person: { id: string; name: string; link: PersonView["link"] };
  onLink?: (link: PersonView["link"]) => void;
  size?: "m" | "l";
  /** « Accepter » when they asked first. */
  label?: string;
}) {
  const t = useTranslations("phoneExplorer");
  const [link, setLink] = useState(person.link);
  const [pending, start] = useTransition();
  if (link !== "none")
    return (
      <span className="nb-ex-connecter" data-taille={size} data-etat={link}>
        {link === "connected" ? t("connected") : t("sent")}
      </span>
    );
  return (
    <button
      type="button"
      className="nb-ex-connecter"
      data-taille={size}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await connectAction(person.id);
          if (!result.ok) {
            showToast({ message: t("connectError"), tone: "error" });
            return;
          }
          const next = result.value === "accepted" ? "connected" : "sent";
          setLink(next);
          // The button itself now reads « Demande envoyée » / « Connectés » : no toast.
          onLink?.(next);
        })
      }
    >
      {label ?? t("connect")}
    </button>
  );
}

/** One person to know: photo (or initials), name, line, why, and « Se connecter ». */
export function PersonRow({ person, reason = true }: { person: PersonView; reason?: boolean }) {
  return (
    <div className="nb-ex-pers">
      <Link href={person.href} className="nb-ex-pers-l">
        <span className="nb-ex-pers-av" data-anneau={person.ring ? "" : undefined}>
          <FilAvatar
            initials={person.initials}
            image={person.image}
            tone={person.tone}
            org={false}
            size={reason ? 56 : 52}
          />
        </span>
        <span className="nb-ex-pers-texte">
          <b>{person.name}</b>
          {person.line ? <span>{person.line}</span> : null}
          {reason ? <small>{person.reason}</small> : null}
        </span>
      </Link>
      <ConnectButton person={person} />
    </div>
  );
}

/** The bookmark of Explorer, with the number of saved offers. */
export function SavedLink({ count }: { count: number }) {
  const t = useTranslations("phoneExplorer");
  return (
    <Link
      href="/app/jobs/enregistrees"
      className="nb-rond nb-ex-signet"
      aria-label={t("savedBadge", { count })}
    >
      <PhoneIcon name="signet" size={22} />
      {count > 0 ? (
        <span className="nb-compteur" aria-hidden>
          {count > 99 ? t("savedBadgeMany") : count}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * An offer of « Offres pour vous » (Ephraïm, 03/11/2026): the notched card of the recruiter's
 * offers, for the talent. « En cours » in the notch, the company, the title, then Pour vous ·
 * Salaire · Date limite, no description. At the bottom, plain silhouettes for the people who
 * applied (never a face or a name: just to show others apply), and « Voir plus » to the offer.
 */
export function ExplorerOfferCard({ offer }: { offer: OfferView }) {
  const t = useTranslations("phoneExplorer.card");
  const count = offer.card.applicants;
  const shown = Math.min(count, 3);
  return (
    <article className="nb-rh-oc nb-ex-oc">
      <div className="nb-rh-oc-corps">
        <span className="nb-rh-oc-org">
          <CompanyMark initials={offer.initials} logo={offer.logo} tone={offer.tone} size={44} />
          <span>{offer.company}</span>
          {offer.verified ? <Verified label={offer.company} size={16} /> : null}
        </span>
        <h3 className="nb-rh-oc-t">
          <Link href={offer.href}>{offer.title}</Link>
        </h3>
        <dl className="nb-rh-oc-stats">
          <div>
            <dt>{t("match")}</dt>
            <dd data-score={offer.score !== null ? "" : undefined}>
              {offer.score !== null ? t("matchValue", { score: offer.score }) : t("noMatch")}
            </dd>
          </div>
          <div>
            <dt>{t("salaryLabel")}</dt>
            <dd>{offer.card.salary ?? t("noSalary")}</dd>
          </div>
          <div>
            <dt>{t("deadline")}</dt>
            <dd>{offer.card.closes ?? t("noDeadline")}</dd>
          </div>
        </dl>
      </div>
      <div className="nb-rh-oc-pied">
        {count > 0 ? (
          <span className="nb-rh-oc-faces" role="img" aria-label={t("applicants", { count })}>
            {Array.from({ length: shown }, (_, index) => (
              <span
                key={index}
                className="nb-rh-oc-face nb-ex-oc-ombre"
                style={{ zIndex: 4 - index }}
              >
                <PhoneIcon name="personne" size={18} />
              </span>
            ))}
            {count > shown ? (
              <span className="nb-rh-oc-plus">{t("more", { count: count - shown })}</span>
            ) : null}
          </span>
        ) : (
          <span className="nb-rh-oc-aucune">{t("first")}</span>
        )}
        <Link href={offer.href} className="nb-rh-oc-plusbt">
          <span aria-hidden>{t("see")}</span>
          <span className="sr-only">{t("seeLabel", { title: offer.title })}</span>
        </Link>
      </div>
      <span className="nb-rh-oc-encoche">
        <i className="nb-rh-oc-k1" aria-hidden />
        <i className="nb-rh-oc-k2" aria-hidden />
        <span className="nb-rh-statut nb-rh-oc-etat" data-statut="published">
          <i className="nb-rh-pouls" aria-hidden />
          {t("open")}
        </span>
      </span>
    </article>
  );
}
