"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/brand/icon";
import { TextField } from "@/components/ui/text-field";
import { cx } from "@/lib/cx";
import { ENTRY_ROLE_STORAGE, entryRoles, pickEntryRole, type EntryRole } from "@/lib/auth-entry";
import { startSignup } from "@/server/actions/auth";
import { SocialButtons, type SocialProvider } from "./social-buttons";

export type EntryMode = "login" | "signup";

export type AuthEntryLabels = {
  rolesLabel: string;
  roles: Record<EntryRole, string>;
  tabs: { aria: string; login: string; signup: string };
  social: { label: string; signupLabel: string; continue: string; signup: string };
  orEmail: string;
  who: string;
  profiles: Record<EntryRole, string>;
  email: { label: string; placeholder: string };
  continue: string;
  free: string;
  payment: string;
};

const roleIcons: Record<EntryRole, IconName> = {
  talent: "cv",
  rh: "profil",
  company: "entreprise",
};
const roleTiles: Record<EntryRole, string> = {
  talent: "bg-lime-clair",
  rh: "bg-menthe-claire",
  company: "bg-[#F1F7C9]",
};
const paths: Record<EntryMode, string> = { login: "/connexion", signup: "/inscription" };

/**
 * Entry screen of /connexion and /inscription (docs/refonte-connexion/BRIEF-CONNEXION-V2.md):
 * the stage on the left (its profile selector), the form on the right with the « Se connecter /
 * Créer un compte » switch. The profile comes from `?profil=`, then the last choice on this
 * device, else Talent, and stays the same on both sides. The switch changes the address without
 * reloading, so going back and sharing the link stay right. Without JavaScript, the page opens
 * on its own tab and the tabs are plain links.
 */
export function AuthEntry({
  initialMode,
  initialRole,
  roleFromQuery,
  labels,
  logo,
  stage,
  stageFoot,
  sideTop,
  sideFoot,
  loginHead,
  loginBody,
  signupHead,
  signupLegal,
  providers,
  socialAction,
  next,
  signupHidden,
}: {
  initialMode: EntryMode;
  initialRole: EntryRole;
  /** `?profil=` was given: it wins over the choice remembered on this device. */
  roleFromQuery: boolean;
  labels: AuthEntryLabels;
  logo: ReactNode;
  stage: ReactNode;
  stageFoot: ReactNode;
  sideTop: ReactNode;
  sideFoot: ReactNode;
  loginHead: ReactNode;
  loginBody: ReactNode;
  signupHead: ReactNode;
  signupLegal: ReactNode;
  providers: SocialProvider[];
  socialAction: (provider: string, formData: FormData) => Promise<void>;
  /** Safe return path (`?suite=`). */
  next?: string;
  /** Sign-up parameters carried to the plan step (`forfait`, `suite`). */
  signupHidden: Record<string, string | undefined>;
}) {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState(initialRole);
  const [switched, setSwitched] = useState(false);

  useEffect(() => {
    if (roleFromQuery) return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(ENTRY_ROLE_STORAGE);
    } catch {
      // Storage blocked (private window): Talent stays.
    }
    const remembered = pickEntryRole(null, stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the remembered choice only exists in the browser
    if (remembered !== initialRole) setRole(remembered);
  }, [roleFromQuery, initialRole]);

  const choose = (next: EntryRole) => {
    if (next === role) return;
    setSwitched(true);
    setRole(next);
    try {
      window.localStorage.setItem(ENTRY_ROLE_STORAGE, next);
    } catch {
      // Not remembered: nothing else changes.
    }
  };

  const switchMode = (event: MouseEvent<HTMLAnchorElement>, next: EntryMode) => {
    event.preventDefault();
    if (next === mode) return;
    setMode(next);
    window.history.replaceState(null, "", `${paths[next]}${window.location.search}`);
  };

  const social = (signup: boolean) =>
    providers.length > 0 && (
      <>
        <SocialButtons
          providers={providers}
          label={signup ? labels.social.signupLabel : labels.social.label}
          aria={signup ? labels.social.signup : labels.social.continue}
          // In the sign-up tab, the buttons send the whole form (its « Vous êtes » choice).
          action={socialAction}
        />
        <p className="jm-ae-sep">{labels.orEmail}</p>
      </>
    );

  return (
    <div className="jm-ae" data-role={role} data-switched={switched ? "" : undefined}>
      {/* <MotionRoot> may mark the scene in view before this part hydrates. */}
      <section className="jm-ae-stage" data-scene suppressHydrationWarning>
        <div className="jm-ae-stage-top">
          <span className="jm-ae-brand">{logo}</span>
          <div className="jm-ae-roles" role="group" aria-label={labels.rolesLabel}>
            {entryRoles.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={item === role}
                onClick={() => choose(item)}
              >
                <Icon name={roleIcons[item]} className="size-4" />
                {labels.roles[item]}
              </button>
            ))}
          </div>
        </div>
        <div className="jm-ae-scene">{stage}</div>
        <div className="jm-ae-stage-foot">{stageFoot}</div>
      </section>

      <section className="jm-ae-side">
        <div className="jm-ae-side-top">{sideTop}</div>
        <main id="content" className="jm-ae-zone">
          <div className="jm-ae-card">
            <div
              role="tablist"
              aria-label={labels.tabs.aria}
              className="jm-ae-mode"
              data-mode={mode}
            >
              {(["login", "signup"] as const).map((item) => (
                <a
                  key={item}
                  id={`entry-tab-${item}`}
                  href={paths[item]}
                  role="tab"
                  aria-selected={item === mode}
                  aria-controls={`entry-panel-${item}`}
                  onClick={(event) => switchMode(event, item)}
                >
                  {item === "login" ? labels.tabs.login : labels.tabs.signup}
                </a>
              ))}
            </div>

            <div
              id="entry-panel-login"
              role="tabpanel"
              aria-labelledby="entry-tab-login"
              hidden={mode !== "login"}
              className="jm-ae-panel"
            >
              {loginHead}
              {providers.length > 0 && (
                <form className="contents">
                  <input type="hidden" name="profil" value={role} />
                  {next && <input type="hidden" name="next" value={next} />}
                  {social(false)}
                </form>
              )}
              {loginBody}
            </div>

            <div
              id="entry-panel-signup"
              role="tabpanel"
              aria-labelledby="entry-tab-signup"
              hidden={mode !== "signup"}
              className="jm-ae-panel"
            >
              {signupHead}
              <form action={startSignup} noValidate className="jm-ae-panel">
                {Object.entries(signupHidden).map(([name, value]) =>
                  value ? <input key={name} type="hidden" name={name} value={value} /> : null,
                )}
                {next && <input type="hidden" name="next" value={next} />}
                <fieldset className="flex flex-col gap-[9px]">
                  <legend className="jm-ae-label mb-[9px]">{labels.who}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {entryRoles.map((item) => (
                      <label key={item} className="jm-ae-who">
                        <input
                          type="radio"
                          name="profil"
                          value={item}
                          checked={item === role}
                          onChange={() => choose(item)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={cx(
                            "flex size-9 items-center justify-center rounded-[12px]",
                            roleTiles[item],
                          )}
                        >
                          <Icon name={roleIcons[item]} className="size-[18px]" />
                        </span>
                        {labels.profiles[item]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {social(true)}
                <TextField
                  id="entry-signup-email"
                  name="email"
                  type="email"
                  icon="message"
                  autoComplete="email"
                  label={labels.email.label}
                  placeholder={labels.email.placeholder}
                  className="jm-ae-input"
                />
                <button type="submit" className="jm-ae-submit">
                  {labels.continue}
                  <span aria-hidden className="jm-ae-arrow">
                    <Icon name="suivant" className="size-4" />
                  </span>
                </button>
                <p className="flex flex-wrap justify-center gap-3.5 text-xs text-ardoise">
                  {[labels.free, labels.payment].map((text) => (
                    <span key={text} className="flex items-center gap-1.5">
                      <Icon name="check" className="size-3.5 text-feuille-fonce" />
                      {text}
                    </span>
                  ))}
                </p>
              </form>
              <div className="jm-ae-foot">{signupLegal}</div>
            </div>
          </div>
        </main>
        <div className="jm-ae-side-foot">{sideFoot}</div>
      </section>
    </div>
  );
}
