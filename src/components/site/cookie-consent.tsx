"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  OPEN_COOKIE_SETTINGS,
  readConsentCookie,
  serializeConsent,
  type Consent,
} from "@/lib/consent";

function saveConsent(consent: Consent) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(consent)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Cookie banner without dark patterns: "Tout accepter" and "Tout refuser" carry the same weight.
 * Shown until a choice is saved; the footer link reopens the settings.
 */
export function CookieConsent() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<Consent>({ analytics: false, preferences: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = readConsentCookie(document.cookie);
    // Reading the cookie is only possible in the browser, after the first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current) setDraft(current);
    else setVisible(true);
    const open = () => {
      setDraft(readConsentCookie(document.cookie) ?? { analytics: false, preferences: false });
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
  }, []);

  function decide(consent: Consent) {
    saveConsent(consent);
    setDraft(consent);
    setVisible(false);
    setSettingsOpen(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  }

  const all = { analytics: true, preferences: true };
  const none = { analytics: false, preferences: false };

  return (
    <>
      {visible && !settingsOpen && (
        <section
          aria-labelledby="cookie-banner-title"
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-3xl flex-col gap-4 rounded-card border border-brume bg-blanc p-5 text-sapin md:inset-x-6 md:p-6"
        >
          <div className="flex flex-col gap-2">
            <h2 id="cookie-banner-title" className="text-lg font-semibold">
              {t("banner.title")}
            </h2>
            <p className="text-[15px] leading-6 text-ardoise">
              {t("banner.text")}{" "}
              <Link href="/cookies" className="font-medium text-sapin underline">
                {t("banner.policyLink")}
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => decide(all)}>
              {t("banner.acceptAll")}
            </Button>
            <Button variant="secondary" onClick={() => decide(none)}>
              {t("banner.rejectAll")}
            </Button>
            <Button variant="tertiary" onClick={() => setSettingsOpen(true)}>
              {t("banner.customize")}
            </Button>
          </div>
        </section>
      )}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t("modal.title")}
        actions={
          <>
            <Button variant="tertiary" onClick={() => decide(none)}>
              {t("modal.rejectAll")}
            </Button>
            <Button variant="tertiary" onClick={() => decide(all)}>
              {t("modal.acceptAll")}
            </Button>
            <Button variant="secondary" onClick={() => decide(draft)}>
              {t("modal.save")}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <p>{t("modal.intro")}</p>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-[15px] leading-6 font-medium text-sapin">
                {t("modal.necessary.title")}
              </p>
              <p className="text-caption">{t("modal.necessary.text")}</p>
            </div>
            <span className="shrink-0 text-sapin text-caption">{t("modal.necessary.status")}</span>
          </div>
          {settingsOpen && (
            <>
              <Switch
                id="consent-analytics"
                label={t("modal.analytics.title")}
                hint={t("modal.analytics.text")}
                checked={draft.analytics}
                onChange={(analytics) => setDraft((d) => ({ ...d, analytics }))}
              />
              <Switch
                id="consent-preferences"
                label={t("modal.preferences.title")}
                hint={t("modal.preferences.text")}
                checked={draft.preferences}
                onChange={(preferences) => setDraft((d) => ({ ...d, preferences }))}
              />
            </>
          )}
        </div>
      </Modal>
      <p role="status" className="sr-only">
        {saved ? t("toast.saved") : ""}
      </p>
    </>
  );
}

/** Footer link "Gérer les cookies": reopens the settings. */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}
      className="hover:text-lime"
    >
      {label}
    </button>
  );
}
