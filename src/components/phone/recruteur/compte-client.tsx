"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { signOut } from "@/server/actions/auth";
import { savePostAction } from "@/server/actions/feed";
import { switchSpace } from "@/server/actions/hire";
import {
  rhLeaveOrganizationAction,
  rhProposeColleagueAction,
  rhSaveNotificationsAction,
} from "@/server/actions/phone-rh-compte";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon, type PhoneIconName } from "../icon";
import { PhoneSheet } from "../sheet";

/** A page of Compte (planches 136 to 147): « Compte » to go back, the title, the content. */
export function RhCompteFrame({
  title,
  sub,
  back = "/app/hire/compte",
  backText,
  footer,
  children,
}: {
  title: string;
  sub?: string;
  back?: string;
  backText?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("phoneRhCompte");
  const text = backText ?? t("backCompte");
  return (
    <div className="nb-page nb-rc" data-pied={footer ? "" : undefined}>
      <header className="nb-rc-barre">
        <PhoneBack fallback={back} label={text} text={text} />
      </header>
      <h1 className="nb-rc-titre">{title}</h1>
      {sub ? <p className="nb-rc-sous">{sub}</p> : null}
      {children}
      {footer ? <div className="nb-rc-pied">{footer}</div> : null}
    </div>
  );
}

export function RhCompteRow({
  href,
  icon,
  title,
  line,
}: {
  href: string;
  icon: PhoneIconName;
  title: string;
  line?: string;
}) {
  const inner = (
    <>
      <span className="nb-rc-ic" aria-hidden>
        <PhoneIcon name={icon} size={20} />
      </span>
      <span className="nb-rc-t">
        <b>{title}</b>
        {line ? <small>{line}</small> : null}
      </span>
      <PhoneIcon name="chevron" size={18} />
    </>
  );
  return href.startsWith("mailto:") ? (
    <a href={href} className="nb-rc-ligne">
      {inner}
    </a>
  ) : (
    <Link href={href} className="nb-rc-ligne">
      {inner}
    </Link>
  );
}

export type RhHubData = {
  name: string;
  image: string | null;
  initials: string;
  orgInitials: string;
  orgLogo: string | null;
  org: string;
  orgId: string;
  orgSlug: string;
  /** « Rattachée à … » or the request that waits. */
  card: string;
  attached: boolean;
  jobTitle: string | null;
  admin: string | null;
  isAdmin: boolean;
};

function Mark({
  initials,
  image,
  className,
}: {
  initials: string;
  image: string | null;
  className?: string;
}) {
  return (
    <span className={className ? `nb-rc-ini ${className}` : "nb-rc-ini"} aria-hidden>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small avatar
        <img src={image} alt="" />
      ) : (
        initials
      )}
    </span>
  );
}

/**
 * The hub of Compte (planche Recruteur-compte): the recruiter's card, « Changer de profil » (feuille
 * Recruteur-basculer), the rows drawn by the server, then « Se déconnecter » after a confirmation
 * (feuille Recruteur-deconnexion).
 */
export function RhCompteHub({
  data,
  bell,
  children,
}: {
  data: RhHubData;
  bell: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("phoneRhCompte");
  const [sheet, setSheet] = useState<"switch" | "logout" | null>(null);
  const close = () => setSheet(null);
  return (
    <div className="nb-page nb-rc nb-rc-hub">
      <header className="nb-rc-barre nb-rc-barre-hub">
        <PhoneBack fallback="/app/hire" label={t("back")} text={t("back")} />
        {bell}
      </header>
      <Link href="/app/hire/compte/profil" className="nb-rc-carte" aria-label={t("card.label")}>
        <span className="nb-rc-av">
          <Mark initials={data.initials} image={data.image} className="nb-rc-ini-l" />
          {data.attached ? (
            <Mark initials={data.orgInitials} image={data.orgLogo} className="nb-rc-logo" />
          ) : null}
        </span>
        <span className="nb-rc-t">
          <b>{data.name}</b>
          {data.jobTitle ? <small>{data.jobTitle}</small> : null}
          <em data-attente={data.attached ? undefined : ""}>
            {data.attached ? <PhoneIcon name="coche" size={14} stroke={2.4} /> : null}
            {data.card}
          </em>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      <button type="button" className="nb-rc-bascule" onClick={() => setSheet("switch")}>
        <span className="nb-rc-pile" aria-hidden>
          <Mark initials={data.initials} image={null} />
          <Mark initials="T" image={null} className="nb-rc-ini-t" />
          <Mark initials={data.orgInitials} image={null} className="nb-rc-ini-o" />
        </span>
        <span className="nb-rc-t">
          <b>{t("switch.title")}</b>
          <small>{t("switch.line")}</small>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </button>
      {children}
      <button type="button" className="nb-rc-sortir" onClick={() => setSheet("logout")}>
        {t("row.logout")}
      </button>

      <PhoneSheet
        open={sheet === "switch"}
        onClose={close}
        label={t("switch.title")}
        closeLabel={t("switch.cancel")}
      >
        <div className="nb-rc-feuille">
          <b className="nb-ex-feuille-t">{t("switch.title")}</b>
          <p className="nb-meta">{t("switch.note")}</p>
          <ul className="nb-rc-profils" aria-label={t("switch.title")}>
            <li>
              <button type="button" className="nb-rc-profil" aria-current="true" onClick={close}>
                <Mark initials={data.initials} image={data.image} className="nb-rc-ini-m" />
                <span className="nb-rc-t">
                  <b>{data.name}</b>
                  <small>{t("switch.recruiter", { org: data.org })}</small>
                </span>
                <PhoneIcon name="coche" size={18} stroke={2.4} />
                <span className="sr-only">{t("switch.current")}</span>
              </button>
            </li>
            <li>
              <form action={switchSpace}>
                <input type="hidden" name="space" value="personal" />
                <button type="submit" className="nb-rc-profil">
                  <Mark initials={data.initials} image={null} className="nb-rc-ini-m nb-rc-ini-t" />
                  <span className="nb-rc-t">
                    <b>{t("switch.talentName", { name: data.name })}</b>
                    <small>{t("switch.talent", { org: data.org })}</small>
                  </span>
                  <PhoneIcon name="chevron" size={18} />
                </button>
              </form>
            </li>
            <li>
              <Link
                href={data.isAdmin ? "/app/hire/entreprise" : `/app/entreprises/${data.orgSlug}`}
                className="nb-rc-profil"
              >
                <Mark
                  initials={data.orgInitials}
                  image={data.orgLogo}
                  className="nb-rc-ini-m nb-rc-ini-o"
                />
                <span className="nb-rc-t">
                  <b>{data.org}</b>
                  <small>
                    {data.isAdmin
                      ? t("switch.companyAdmin")
                      : data.admin
                        ? t("switch.companyOther", { admin: data.admin })
                        : t("switch.companyOtherNoAdmin")}
                  </small>
                </span>
                <PhoneIcon name="chevron" size={18} />
              </Link>
            </li>
          </ul>
          <button type="button" className="nb-bouton" data-large="" onClick={close}>
            {t("switch.cancel")}
          </button>
        </div>
      </PhoneSheet>

      <PhoneSheet
        open={sheet === "logout"}
        onClose={close}
        label={t("logout.title")}
        closeLabel={t("logout.cancel")}
      >
        <div className="nb-rc-feuille nb-rc-centre">
          <b className="nb-ex-feuille-t">{t("logout.title")}</b>
          <p className="nb-meta">{t("logout.text")}</p>
          <form action={signOut} className="nb-rc-boutons">
            <button type="submit" className="nb-bouton" data-large="" data-plein="">
              {t("logout.confirm")}
            </button>
            <button type="button" className="nb-bouton" data-large="" onClick={close}>
              {t("logout.cancel")}
            </button>
          </form>
        </div>
      </PhoneSheet>
    </div>
  );
}

/**
 * « Modifier mon profil » (planche Recruteur-compte-modifier): the hook (Orbi proposes one, the
 * person reads it before saving), the badge, who sees the phone, the company.
 */
export function RhProfileEdit({
  initial,
  orbi,
  company,
  action,
  error,
}: {
  initial: {
    headline: string;
    bioSource: "recruiter" | "talent";
    hiringNow: boolean;
    contactsFor: string;
    seeking: string;
  };
  /** Orbi's hook, written from the profile's domains (deterministic, no credit). */
  orbi: string;
  company: ReactNode;
  action: (formData: FormData) => Promise<void>;
  error: boolean;
}) {
  const t = useTranslations("phoneRhCompte.edit");
  const [headline, setHeadline] = useState(initial.headline);
  const [bio, setBio] = useState(initial.bioSource);
  const [hiring, setHiring] = useState(initial.hiringNow);
  const [seeking, setSeeking] = useState(initial.seeking);
  const [contacts, setContacts] = useState(
    initial.contactsFor === "connections" ? "interview" : initial.contactsFor,
  );
  return (
    <form action={action} className="nb-rc-form">
      <label className="nb-rc-champ">
        <span>{t("headline")}</span>
        <textarea
          name="headline"
          rows={4}
          maxLength={280}
          value={headline}
          placeholder={t("headlinePlaceholder")}
          onChange={(event) => setHeadline(event.target.value)}
          aria-invalid={error || undefined}
        />
      </label>
      {error ? (
        <p className="nb-rc-erreur" role="alert">
          {t("error")}
        </p>
      ) : null}
      <button type="button" className="nb-rc-orbi" onClick={() => setHeadline(orbi)}>
        <OrbiDisc size={26} />
        {t("orbi")}
      </button>
      <p className="nb-rc-note">{t("orbiNote")}</p>
      {/* The bio of the profile: this hook or the talent profile's (Ephraïm 29/10/2026). */}
      <p className="nb-rc-label" id="rc-bio">
        {t("bioSource")}
      </p>
      <div className="nb-rc-chips" role="radiogroup" aria-labelledby="rc-bio">
        {(["recruiter", "talent"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={bio === key}
            className="nb-rc-chip"
            onClick={() => setBio(key)}
          >
            {t(`bio.${key}`)}
          </button>
        ))}
      </div>
      <input type="hidden" name="bioSource" value={bio} />
      <label className="nb-rc-champ" id="recherche">
        <span>{t("seeking")}</span>
        <textarea
          name="seeking"
          rows={5}
          maxLength={400}
          value={seeking}
          placeholder={t("seekingPlaceholder")}
          onChange={(event) => setSeeking(event.target.value)}
        />
      </label>
      <p className="nb-rc-note">{t("seekingCount", { count: seeking.length })}</p>
      <div className="nb-rc-bloc nb-rc-interrupteur">
        <span className="nb-rc-t">
          <b>{t("hiringNow")}</b>
          <small>{t("hiringNowLine")}</small>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={hiring}
          aria-label={t("hiringNow")}
          className="nb-switch"
          onClick={() => setHiring(!hiring)}
        >
          <span />
        </button>
        {hiring ? <input type="hidden" name="hiringNow" value="on" /> : null}
      </div>
      <p className="nb-rc-label" id="rc-contacts">
        {t("contactsFor")}
      </p>
      <div className="nb-rc-chips" role="radiogroup" aria-labelledby="rc-contacts">
        {(["interview", "nobody"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={contacts === key}
            className="nb-rc-chip"
            onClick={() => setContacts(key)}
          >
            {t(`contacts.${key}`)}
          </button>
        ))}
      </div>
      <input type="hidden" name="contactsFor" value={contacts} />
      <p className="nb-rc-label">{t("company")}</p>
      {company}
      <div className="nb-rc-pied">
        <button type="submit" className="nb-bouton" data-large="" data-plein="">
          {t("save")}
        </button>
      </div>
    </form>
  );
}

/** « Publications enregistrées » (planche Recruteur-compte-enregistres): the signet removes one. */
export function RhSavedList({ rows }: { rows: { id: string; title: string; by: string }[] }) {
  const t = useTranslations("phoneRhCompte.saved");
  const [gone, setGone] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const left = rows.filter((row) => !gone.includes(row.id));
  if (left.length === 0) return <p className="nb-rc-vide">{t("empty")}</p>;
  return (
    <ul className="nb-rc-liste" aria-label={t("title")}>
      {left.map((row) => (
        <li key={row.id} className="nb-rc-enr">
          <Link href={`/app/fil/${row.id}`} className="nb-rc-t">
            <b>{row.title}</b>
            <small>{row.by}</small>
          </Link>
          <button
            type="button"
            className="nb-rc-signet"
            aria-label={t("remove", { title: row.title })}
            aria-pressed="true"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await savePostAction(row.id);
                if (!result.ok) return;
                setGone((list) => [...list, row.id]);
                showToast({ message: t("removed") });
              })
            }
          >
            <PhoneIcon name="signet" size={20} />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** « Proposer un collègue » (feuille Recruteur-equipe-proposer). */
export function RhProposeColleague({
  label,
  text,
  submit,
  placeholder,
}: {
  label: string;
  text: string;
  submit: string;
  placeholder: string;
}) {
  const t = useTranslations("phoneRhCompte.team");
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="nb-rc-pied">
        <button
          type="button"
          className="nb-bouton"
          data-large=""
          data-plein=""
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      </div>
      <PhoneSheet open={open} onClose={() => setOpen(false)} label={label} closeLabel={t("cancel")}>
        <form action={rhProposeColleagueAction} className="nb-rc-feuille">
          <b className="nb-ex-feuille-t">{label}</b>
          <p className="nb-meta">{text}</p>
          <label className="nb-rc-champ">
            <span>{t("email")}</span>
            <input
              type="email"
              name="email"
              required
              maxLength={200}
              autoComplete="off"
              placeholder={placeholder}
            />
          </label>
          <button type="submit" className="nb-bouton" data-large="" data-plein="">
            {submit}
          </button>
          <button type="button" className="nb-bouton" data-large="" onClick={() => setOpen(false)}>
            {t("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}

type Switches = { categories: Record<string, boolean>; emails: boolean };

/** « Notifications » of the recruiter (planche Recruteur-compte-notifications), saved at once. */
export function RhNotificationSwitches({ initial }: { initial: Switches }) {
  const t = useTranslations("phoneRhCompte.notifs");
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const change = (next: Switches) => {
    const before = value;
    setValue(next);
    start(async () => {
      const result = await rhSaveNotificationsAction({
        categories: Object.entries(next.categories)
          .filter(([, on]) => on)
          .map(([key]) => key as "messages"),
        emails: next.emails,
      }).catch(() => null);
      if (result?.ok) showToast({ message: t("saved") });
      else setValue(before);
    });
  };
  const row = (key: string, label: string, line: string, on: boolean, flip: () => void) => (
    <div key={key} className="nb-rc-bloc nb-rc-interrupteur" data-ligne="">
      <span className="nb-rc-t">
        <b>{label}</b>
        <small>{line}</small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className="nb-switch"
        disabled={pending}
        onClick={flip}
      >
        <span />
      </button>
    </div>
  );
  return (
    <>
      {Object.entries(value.categories).map(([key, on]) =>
        row(key, t(key as "messages"), t(`${key}Line` as "messagesLine"), on, () =>
          change({ ...value, categories: { ...value.categories, [key]: !on } }),
        ),
      )}
      {row("emails", t("emails"), t("emailsLine"), value.emails, () =>
        change({ ...value, emails: !value.emails }),
      )}
      <p className="nb-rc-note">{t("note")}</p>
    </>
  );
}

/** « Quitter l'entreprise » after a confirmation (planche Recruteur-compte-confidentialite). */
export function RhLeaveOrganization({ org }: { org: string }) {
  const t = useTranslations("phoneRhCompte.privacy");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nb-rc-lien" data-ambre="" onClick={() => setOpen(true)}>
        {t("leaveLink")}
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("leaveConfirmTitle", { org })}
        closeLabel={t("leaveCancel")}
      >
        <form action={rhLeaveOrganizationAction} className="nb-rc-feuille nb-rc-centre">
          <b className="nb-ex-feuille-t">{t("leaveConfirmTitle", { org })}</b>
          <p className="nb-meta">{t("leaveConfirmText")}</p>
          <button type="submit" className="nb-bouton" data-large="" data-plein-rouge="">
            {t("leaveConfirm")}
          </button>
          <button type="button" className="nb-bouton" data-large="" onClick={() => setOpen(false)}>
            {t("leaveCancel")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}
