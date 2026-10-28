"use client";

import "@/styles/phone-reglages.css";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { signOut } from "@/server/actions/auth";
import { becomeRecruiterAction } from "@/server/actions/hire";
import {
  saveCareerNotificationsAction,
  saveCareerPrivacyAction,
} from "@/server/actions/career-phone";
import { changeEmailAction } from "@/server/actions/settings";
import {
  PHONE_THEME_EVENT,
  PHONE_THEMES,
  readPhoneTheme,
  savePhoneTheme,
  type PhoneTheme,
} from "@/lib/phone-theme";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon, type phoneIcons } from "../icon";
import { PhoneSheet } from "../sheet";

/** A page of the settings (planches Carrière-parametres to -aide): « Retour », the title. */
export function SettingsFrame({
  title,
  back,
  children,
}: {
  title: string;
  back: string;
  children: ReactNode;
}) {
  const t = useTranslations("phoneCareer.reglages");
  return (
    <div className="nb-page nb-ca-form nb-ca-reglages">
      <header className="nb-ca-form-barre" data-retour-texte="">
        <PhoneBack fallback={back} label={t("back")} text={t("back")} />
        <h1>{title}</h1>
        <span />
      </header>
      {children}
    </div>
  );
}

type IconName = keyof typeof phoneIcons;

/** The coloured tile in front of a row (Modèle B: a square rounded on its four corners). */
function Tile({ icon, tone = "lime" }: { icon: IconName; tone?: string }) {
  return (
    <i className="nb-rg-ic" data-ton={tone} aria-hidden>
      <PhoneIcon name={icon} size={19} stroke={1.9} />
    </i>
  );
}

/** A group of rows: its title, then one rounded card. */
function Group({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section className="nb-rg-groupe" aria-labelledby={id}>
      <p className="nb-ca-gr" id={id}>
        {title}
      </p>
      <div className="nb-rg-bloc">{children}</div>
    </section>
  );
}

function Row({
  href,
  children,
  end,
  icon,
  tone,
}: {
  href: string;
  children: ReactNode;
  end?: ReactNode;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <Link href={href} className="nb-ca-it" data-ligne="">
      {icon ? <Tile icon={icon} tone={tone} /> : null}
      <span>{children}</span>
      {end ? <small>{end}</small> : null}
      <PhoneIcon name="chevron" size={18} />
    </Link>
  );
}

/**
 * « Paramètres » (planche Carrière-parametres, feuille Carrière-deco): the account, the plan, the
 * privacy, the application, then « Se déconnecter » after a confirmation.
 */
export function PhoneSettings({
  name,
  image,
  initials,
  tone,
  email,
  plan,
  language,
  install,
  recruiter,
}: {
  name: string;
  image: string | null;
  initials: string;
  tone: number;
  email: string;
  plan: string;
  language: string;
  /** « Installer l'appli », drawn by the server (its texts are not sent to the browser). */
  install: ReactNode;
  /** The person already works in a recruiter space (« Ouvrir »), or may open one. */
  recruiter: "open" | "become";
}) {
  const t = useTranslations("phoneCareer.reglages");
  const [hiring, setHiring] = useState(false);
  return (
    <SettingsFrame title={t("title")} back="/app/career/cv">
      <Link href="/app/career/profil" className="nb-rg-moi">
        <FilAvatar initials={initials} image={image} tone={tone} org={false} size={58} square />
        <span>
          <b>{name}</b>
          <small className="nb-meta">{email}</small>
          <em>{t("editProfile")}</em>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      <Group title={t("account")} id="rg-compte">
        <Row href="/app/career/profil" icon="personne">
          {t("namePhoto")}
        </Row>
        <Row href="/app/fil/mes-publications" icon="document" tone="menthe">
          {t("posts")}
        </Row>
        <EmailRow email={email} />
        <Row href="/app/parametres/securite" icon="cadenas" tone="menthe">
          {t("password")}
        </Row>
      </Group>
      <Group title={t("subscription")} id="rg-formule">
        <Row href="/app/abonnement" end={<em>{plan}</em>} icon="signet" tone="ambre">
          {t("plan")}
        </Row>
      </Group>
      <Group title={t("recruiter.group")} id="rg-recrutement">
        {recruiter === "open" ? (
          <form action={becomeRecruiterAction}>
            <button type="submit" className="nb-ca-it" data-ligne="">
              <Tile icon="organisation" tone="bleu" />
              <span>
                {t("recruiter.open")}
                <small className="nb-meta">{t("recruiter.openText")}</small>
              </span>
              <PhoneIcon name="chevron" size={18} />
            </button>
          </form>
        ) : (
          <button type="button" className="nb-ca-it" data-ligne="" onClick={() => setHiring(true)}>
            <Tile icon="organisation" tone="bleu" />
            <span>
              {t("recruiter.become")}
              <small className="nb-meta">{t("recruiter.becomeText")}</small>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        )}
      </Group>
      <Group title={t("privacyGroup")} id="rg-vie-privee">
        <Row href="/app/parametres/confidentialite" icon="cacher" tone="menthe">
          {t("privacy")}
        </Row>
        <Row href="/app/parametres/notifications" icon="cloche" tone="ambre">
          {t("notifications")}
        </Row>
      </Group>
      <Group title={t("application")} id="rg-appli">
        <div className="nb-ca-it" data-ligne="">
          <Tile icon="messages" tone="bleu" />
          <span>{t("language")}</span>
          <small>{language}</small>
        </div>
        <ThemeRow />
        <Row href="/app/compte/aide" icon="idee">
          {t("help")}
        </Row>
        {install}
      </Group>
      <SignOut />
      <PhoneSheet
        open={hiring}
        onClose={() => setHiring(false)}
        label={t("recruiter.question")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("recruiter.question")}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("recruiter.questionText")}</p>
        <form action={becomeRecruiterAction} className="nb-ca-feuille-b">
          <button type="submit" className="nb-bouton" data-large="" data-plein="">
            {t("recruiter.confirm")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setHiring(false)}
          >
            {t("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </SettingsFrame>
  );
}

/** « Se déconnecter », after a confirmation. */
function SignOut() {
  const t = useTranslations("phoneCareer.reglages");
  const [leaving, setLeaving] = useState(false);
  return (
    <>
      <div className="nb-rg-bloc nb-rg-sortie">
        <button
          type="button"
          className="nb-ca-it nb-ca-sortir"
          data-ligne=""
          onClick={() => setLeaving(true)}
        >
          <Tile icon="fleche" tone="corail" />
          <span>{t("signOut")}</span>
        </button>
      </div>
      <PhoneSheet
        open={leaving}
        onClose={() => setLeaving(false)}
        label={t("signOutQuestion")}
        closeLabel={t("close")}
      >
        <b className="nb-ex-feuille-t">{t("signOutQuestion")}</b>
        <p className="nb-meta nb-ca-feuille-d">{t("signOutText")}</p>
        <form action={signOut} className="nb-ca-feuille-b">
          <button type="submit" className="nb-bouton" data-large="" data-plein-rouge="">
            {t("signOut")}
          </button>
          <button
            type="button"
            className="nb-bouton"
            data-large=""
            data-contour=""
            onClick={() => setLeaving(false)}
          >
            {t("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}

/**
 * The e-mail, and « Changer d'adresse »: a link goes to the new address; the address changes
 * once it is opened (Ephraïm, 27/10/2026). Until then, the old one keeps working.
 */
/**
 * « Apparence » (Ephraïm, 27/10/2026): Sombre, Clair « Crème doux » or « Comme mon téléphone ».
 * Kept on this phone and applied at once (PhoneThemeRoot); talent and recruiter alike.
 */
function subscribeTheme(onChange: () => void) {
  window.addEventListener(PHONE_THEME_EVENT, onChange);
  return () => window.removeEventListener(PHONE_THEME_EVENT, onChange);
}

function ThemeRow() {
  const t = useTranslations("phoneCareer.reglages");
  const [open, setOpen] = useState(false);
  // Read from this phone (localStorage); the server does not know it and draws « Sombre ».
  const theme = useSyncExternalStore(subscribeTheme, readPhoneTheme, () => "sombre" as const);
  const choose = (value: PhoneTheme) => savePhoneTheme(value);
  return (
    <>
      <button type="button" className="nb-ca-it" data-ligne="" onClick={() => setOpen(true)}>
        <Tile icon="apparence" tone="ambre" />
        <span>{t("theme.title")}</span>
        <small>{t(`theme.${theme}`)}</small>
        <PhoneIcon name="chevron" size={18} />
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("theme.title")}
        closeLabel={t("close")}
      >
        <div className="nb-ca-feuille">
          <b className="nb-ex-feuille-t" id="rg-theme">
            {t("theme.title")}
          </b>
          <p className="nb-meta">{t("theme.text")}</p>
          <div role="radiogroup" aria-labelledby="rg-theme" className="nb-rg-bloc">
            {PHONE_THEMES.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={theme === key}
                className="nb-ca-it"
                data-ligne=""
                onClick={() => choose(key)}
              >
                <i className="nb-rg-apercu" data-theme={key} aria-hidden />
                <span>
                  {t(`theme.${key}`)}
                  <small className="nb-meta">{t(`theme.${key}Text`)}</small>
                </span>
                <i className="nb-ca-radio" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </PhoneSheet>
    </>
  );
}

function EmailRow({ email }: { email: string }) {
  const t = useTranslations("phoneCareer.reglages");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const send = () =>
    start(async () => {
      const result = await changeEmailAction(value);
      if (!result.ok) {
        showToast({ message: t(`emailChange.${result.error}`), tone: "error" });
        return;
      }
      setOpen(false);
      setValue("");
      showToast({ message: t("emailChange.sent", { email: result.email }) });
    });
  return (
    <>
      <button type="button" className="nb-ca-it" data-ligne="" onClick={() => setOpen(true)}>
        <Tile icon="email" tone="bleu" />
        <span>
          {t("email")}
          <small className="nb-meta">{email}</small>
        </span>
        <small>
          <em>{t("emailChange.action")}</em>
        </small>
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("emailChange.title")}
        closeLabel={t("close")}
      >
        <form
          className="nb-ca-feuille"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <b className="nb-ex-feuille-t">{t("emailChange.title")}</b>
          <p className="nb-meta">{t("emailChange.text", { email })}</p>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            className="nb-ca-in"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t("emailChange.placeholder")}
            aria-label={t("emailChange.label")}
            required
            maxLength={254}
          />
          <button
            type="submit"
            className="nb-bouton"
            data-large=""
            data-plein=""
            disabled={pending || !value.trim()}
          >
            {t("emailChange.send")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}

/**
 * « Paramètres » of a recruiter on the phone (Ephraïm, 27/10/2026): the same page as a talent's,
 * with the recruiter's own rows: the team (add a recruiter), the company's plan, the recruiter's
 * notifications, the journal of the profiles opened.
 */
export function PhoneRecruiterSettings({
  name,
  image,
  initials,
  tone,
  email,
  org,
  plan,
  admin,
  language,
  install,
}: {
  name: string;
  image: string | null;
  initials: string;
  tone: number;
  email: string;
  org: string;
  plan: string;
  /** The page's administrator: the team and the company's profile. */
  admin: boolean;
  language: string;
  install: ReactNode;
}) {
  const t = useTranslations("phoneCareer.reglages");
  return (
    <SettingsFrame title={t("title")} back="/app/hire/compte">
      <Link href="/app/hire/compte/profil" className="nb-rg-moi">
        <FilAvatar initials={initials} image={image} tone={tone} org={false} size={58} square />
        <span>
          <b>{name}</b>
          <small className="nb-meta">{t("rh.line", { org })}</small>
          <em>{t("editProfile")}</em>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      <Group title={t("account")} id="rg-compte">
        <Row href="/app/hire/compte/profil/modifier" icon="personne">
          {t("namePhoto")}
        </Row>
        <EmailRow email={email} />
        <Row href="/app/parametres/securite" icon="cadenas" tone="menthe">
          {t("password")}
        </Row>
        <Row href="/app/fil/mes-publications" icon="document" tone="menthe">
          {t("posts")}
        </Row>
      </Group>
      <Group title={t("rh.group", { org })} id="rg-equipe">
        <Row href="/app/hire/compte/equipe" icon="talents" tone="bleu">
          {admin ? t("rh.teamAdmin") : t("rh.team")}
        </Row>
        {admin ? (
          <Row href="/app/hire/entreprise/profil" icon="organisation" tone="bleu">
            {t("rh.company")}
          </Row>
        ) : null}
        <Row href="/app/hire/compte/formule" end={<em>{plan}</em>} icon="signet" tone="ambre">
          {t("plan")}
        </Row>
      </Group>
      <Group title={t("privacyGroup")} id="rg-vie-privee">
        <Row href="/app/hire/compte/notifications" icon="cloche" tone="ambre">
          {t("notifications")}
        </Row>
        <Row href="/app/hire/compte/confidentialite" icon="cacher" tone="menthe">
          {t("privacy")}
        </Row>
        <Row href="/app/parametres/consultations" icon="document" tone="menthe">
          {t("rh.journal")}
        </Row>
      </Group>
      <Group title={t("application")} id="rg-appli">
        <Row href="/app/hire/compte/langue" end={language} icon="messages" tone="bleu">
          {t("language")}
        </Row>
        <ThemeRow />
        <Row href="/app/hire/compte/aide" icon="idee">
          {t("help")}
        </Row>
        {install}
      </Group>
      <SignOut />
    </SettingsFrame>
  );
}

function Switch({
  label,
  hint,
  on,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="nb-ca-it" data-ligne="">
      <span>
        {label}
        {hint ? <small className="nb-meta">{hint}</small> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className="nb-switch"
        disabled={disabled}
        onClick={() => onChange(!on)}
      >
        <span />
      </button>
    </div>
  );
}

type Privacy = {
  visibility: "private" | "recruiters" | "anonymous";
  matching: boolean;
  contactRequests: boolean;
  ai: boolean;
  newsletter: boolean;
};

/** Saves a change at once; the switch goes back if it did not work. */
function useInstant<T>(initial: T, save: (value: T) => Promise<{ ok: boolean }>) {
  const t = useTranslations("phoneCareer.reglages");
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const change = (next: T) => {
    const before = value;
    setValue(next);
    start(async () => {
      const result = await save(next).catch(() => null);
      if (result?.ok) showToast({ message: t("saved") });
      else {
        setValue(before);
        showToast({ message: t("error"), tone: "error" });
      }
    });
  };
  return { value, change, pending };
}

/**
 * « Confidentialité » (planche Carrière-confid): who sees the profile, the options, the data.
 * Applying is always possible, whatever is chosen.
 */
export function PrivacyForm({ initial }: { initial: Privacy }) {
  const t = useTranslations("phoneCareer.reglages");
  const { value, change, pending } = useInstant(initial, saveCareerPrivacyAction);
  const set = (patch: Partial<Privacy>) => change({ ...value, ...patch });
  return (
    <SettingsFrame title={t("privacy")} back="/app/parametres">
      <p className="nb-ca-gr" id="ca-qui">
        {t("whoSees")}
      </p>
      <div role="radiogroup" aria-labelledby="ca-qui" className="nb-rg-bloc">
        {(["recruiters", "anonymous", "private"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value.visibility === key}
            className="nb-ca-it"
            data-ligne=""
            disabled={pending}
            onClick={() => set({ visibility: key })}
          >
            <span>
              {t(`visibility.${key}`)}
              <small className="nb-meta">{t(`visibility.${key}Text`)}</small>
            </span>
            <i className="nb-ca-radio" aria-hidden />
          </button>
        ))}
      </div>
      <Group title={t("options")}>
        <Switch
          label={t("matching")}
          hint={t("matchingText")}
          on={value.matching}
          onChange={(matching) => set({ matching })}
          disabled={pending}
        />
        <Switch
          label={t("contactRequests")}
          on={value.contactRequests}
          onChange={(contactRequests) => set({ contactRequests })}
          disabled={pending}
        />
        <Switch
          label={t("ai")}
          hint={t("aiText")}
          on={value.ai}
          onChange={(ai) => set({ ai })}
          disabled={pending}
        />
        <Switch
          label={t("newsletter")}
          on={value.newsletter}
          onChange={(newsletter) => set({ newsletter })}
          disabled={pending}
        />
      </Group>
      <Group title={t("data")}>
        <a href="/app/parametres/export" download className="nb-ca-it" data-ligne="">
          <span>{t("download")}</span>
          <PhoneIcon name="chevron" size={18} />
        </a>
        <Link href="/app/parametres/consultations" className="nb-ca-it" data-ligne="">
          <span>{t("views")}</span>
          <PhoneIcon name="chevron" size={18} />
        </Link>
        <Link href="/app/parametres?supprimer=1" className="nb-ca-it nb-ca-sortir" data-ligne="">
          <span>{t("deleteAccount")}</span>
        </Link>
      </Group>
    </SettingsFrame>
  );
}

type Notifications = { categories: Record<string, boolean>; emails: boolean };

/** « Notifications » (planche Carrière-notif): one switch per kind, then the e-mails. */
export function NotificationsForm({ initial }: { initial: Notifications }) {
  const t = useTranslations("phoneCareer.reglages");
  const { value, change, pending } = useInstant(initial, (next) =>
    saveCareerNotificationsAction({
      categories: Object.entries(next.categories)
        .filter(([, on]) => on)
        .map(([key]) => key),
      emails: next.emails,
    }),
  );
  return (
    <SettingsFrame title={t("notifications")} back="/app/parametres">
      <Group title={t("onPhone")}>
        {Object.entries(value.categories).map(([key, on]) => (
          <Switch
            key={key}
            label={t(`category.${key}` as "category.applications")}
            hint={t(`category.${key}Text` as "category.applicationsText")}
            on={on}
            disabled={pending}
            onChange={(next) =>
              change({ ...value, categories: { ...value.categories, [key]: next } })
            }
          />
        ))}
      </Group>
      <Group title={t("byEmail")}>
        <Switch
          label={t("emails")}
          hint={t("emailsText")}
          on={value.emails}
          disabled={pending}
          onChange={(emails) => change({ ...value, emails })}
        />
      </Group>
    </SettingsFrame>
  );
}

/** « Aide et contact » (planche Carrière-aide): the frequent questions, then the e-mail only. */
export function PhoneHelp({
  email,
  questions,
}: {
  email: string;
  questions: { id: string; question: string; answer: string }[];
}) {
  const t = useTranslations("phoneCareer.reglages");
  return (
    <SettingsFrame title={t("help")} back="/app/parametres">
      <Group title={t("faq")}>
        {questions.map((item) => (
          <details key={item.id} className="nb-ca-faq">
            <summary className="nb-ca-it" data-ligne="">
              <span>{item.question}</span>
              <PhoneIcon name="plus" size={16} />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </Group>
      <Group title={t("writeTeam")}>
        <a href={`mailto:${email}`} className="nb-ca-it nb-ca-mail" data-ligne="">
          <Tile icon="email" tone="bleu" />
          <span>
            <b>{email}</b>
            <small className="nb-meta">{t("answerByEmail")}</small>
          </span>
        </a>
      </Group>
    </SettingsFrame>
  );
}
