"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { showToast } from "@/components/motion/toaster";
import { signOut } from "@/server/actions/auth";
import { becomeRecruiterAction } from "@/server/actions/hire";
import {
  saveCareerNotificationsAction,
  saveCareerPrivacyAction,
} from "@/server/actions/career-phone";
import { PhoneBack } from "../back";
import { FilAvatar } from "../fil/avatar";
import { PhoneIcon } from "../icon";
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

function Row({ href, children, end }: { href: string; children: ReactNode; end?: ReactNode }) {
  return (
    <Link href={href} className="nb-ca-it" data-ligne="">
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
  const [leaving, setLeaving] = useState(false);
  const [hiring, setHiring] = useState(false);
  return (
    <SettingsFrame title={t("title")} back="/app/career/cv">
      <Link href="/app/career/profil" className="nb-ca-it nb-ca-moi" data-ligne="">
        <FilAvatar initials={initials} image={image} tone={tone} org={false} size={52} />
        <span>
          <b>{name}</b>
          <small className="nb-meta">{t("editProfile")}</small>
        </span>
        <PhoneIcon name="chevron" size={18} />
      </Link>
      <p className="nb-ca-gr">{t("account")}</p>
      <Row href="/app/career/profil">{t("namePhoto")}</Row>
      <div className="nb-ca-it" data-ligne="">
        <span>{t("email")}</span>
        <small>{email}</small>
      </div>
      <Row href="/app/parametres/securite">{t("password")}</Row>
      <p className="nb-ca-gr">{t("subscription")}</p>
      <Row href="/app/abonnement" end={<em>{plan}</em>}>
        {t("plan")}
      </Row>
      <p className="nb-ca-gr">{t("recruiter.group")}</p>
      {recruiter === "open" ? (
        <form action={becomeRecruiterAction}>
          <button type="submit" className="nb-ca-it" data-ligne="">
            <span>
              {t("recruiter.open")}
              <small className="nb-meta">{t("recruiter.openText")}</small>
            </span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        </form>
      ) : (
        <button type="button" className="nb-ca-it" data-ligne="" onClick={() => setHiring(true)}>
          <span>
            {t("recruiter.become")}
            <small className="nb-meta">{t("recruiter.becomeText")}</small>
          </span>
          <PhoneIcon name="chevron" size={18} />
        </button>
      )}
      <p className="nb-ca-gr">{t("privacyGroup")}</p>
      <Row href="/app/parametres/confidentialite">{t("privacy")}</Row>
      <Row href="/app/parametres/notifications">{t("notifications")}</Row>
      <p className="nb-ca-gr">{t("application")}</p>
      <div className="nb-ca-it" data-ligne="">
        <span>{t("language")}</span>
        <small>{language}</small>
      </div>
      <Row href="/app/compte/aide">{t("help")}</Row>
      {install}
      <button
        type="button"
        className="nb-ca-it nb-ca-sortir"
        data-ligne=""
        onClick={() => setLeaving(true)}
      >
        {t("signOut")}
      </button>
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
      <div role="radiogroup" aria-labelledby="ca-qui">
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
      <p className="nb-ca-gr">{t("options")}</p>
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
      <p className="nb-ca-gr">{t("data")}</p>
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
      <p className="nb-ca-gr">{t("onPhone")}</p>
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
      <p className="nb-ca-gr">{t("byEmail")}</p>
      <Switch
        label={t("emails")}
        hint={t("emailsText")}
        on={value.emails}
        disabled={pending}
        onChange={(emails) => change({ ...value, emails })}
      />
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
      <p className="nb-ca-gr">{t("faq")}</p>
      {questions.map((item) => (
        <details key={item.id} className="nb-ca-faq">
          <summary className="nb-ca-it" data-ligne="">
            <span>{item.question}</span>
            <PhoneIcon name="plus" size={16} />
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
      <p className="nb-ca-gr">{t("writeTeam")}</p>
      <a href={`mailto:${email}`} className="nb-ca-it nb-ca-mail" data-ligne="">
        <span>
          <b>{email}</b>
          <small className="nb-meta">{t("answerByEmail")}</small>
        </span>
      </a>
    </SettingsFrame>
  );
}
