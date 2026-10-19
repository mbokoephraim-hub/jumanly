import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { SettingsNav } from "@/components/talent/settings-nav";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { dynamic } from "@/i18n/dynamic";
import { formatShortDate } from "@/lib/dates";
import { PASSWORD_MIN } from "@/lib/password";
import {
  changePassword,
  revokeOtherSessions,
  revokeSession,
  setTwoFactor,
} from "@/server/actions/settings";
import { auth } from "@/server/auth";
import { getSession, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { toHireSettings } from "@/server/settings-redirect";
import { inOrganizationSpace } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("securite");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** « Chrome · Android » from a user agent: enough to recognise one's devices. */
function deviceName(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : null;
  const system = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  return [browser, system].filter(Boolean).join(" · ") || null;
}

const providers = ["google", "linkedin", "apple"] as const;

/**
 * Sécurité (planche talent-4 § 8): the address used to sign in, the password, the double check by
 * e-mail code, the linked accounts, and the devices signed in, each one can be signed out.
 */
export default async function SecurityPage({
  searchParams,
}: PageProps<"/app/parametres/securite">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres/securite");
  if (await inOrganizationSpace(user.id)) toHireSettings("securite", params);
  const t = await getTranslations();
  const d = dynamic(t);
  const [current, sessions, accounts] = await Promise.all([
    getSession(),
    auth.api.listSessions({ headers: await headers() }).catch(() => []),
    db.account.findMany({ where: { userId: user.id }, select: { providerId: true } }),
  ]);
  const hasPassword = accounts.some((account) => account.providerId === "credential");
  const linked = providers.filter((provider) =>
    accounts.some((account) => account.providerId === provider),
  );
  const ok = one(params.ok);
  const error = one(params.erreur);
  const errorText =
    error === "wrongPassword"
      ? t("securite.password.wrong")
      : error && d.has(`auth.error.${error}`)
        ? d(`auth.error.${error}`, { min: PASSWORD_MIN })
        : error
          ? t("parametres.error")
          : null;
  const ordered = [...sessions].sort(
    (a, b) =>
      Number(b.token === current?.session.token) - Number(a.token === current?.session.token) ||
      b.updatedAt.getTime() - a.updatedAt.getTime(),
  );

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-tel">
        <FlowHead
          back="/app/parametres"
          backLabel={t("securite.back")}
          title={t("securite.title")}
          end={
            <Link href="/app/parametres" className="t-bi t-press" aria-label={t("securite.close")}>
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
      </div>
      <h1 className="t-w4-web t-w4-ph1">{t("parametres.title")}</h1>
      <div className="t-w4-prm">
        <SettingsNav on="securite" />
        <div className="t-w4-col">
          <h2 className="t-w4-web t-w4-h3">{t("securite.title")}</h2>
          {one(params.raison) === "deux-etapes" && (
            <Notice tone="err">{t("securite.twoFactor.required")}</Notice>
          )}
          {ok === "password" && <Notice tone="ok">{t("securite.password.changed")}</Notice>}
          {ok === "session" && <Notice tone="ok">{t("securite.devices.loggedOut")}</Notice>}
          {ok === "2fa" && <Notice tone="ok">{t("securite.twoFactor.changed")}</Notice>}
          {errorText && <Notice tone="err">{errorText}</Notice>}

          <ul aria-label={t("securite.title")} className="t-verre t-liste t-lignes">
            <li className="t-li">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{t("securite.email.title")}</b>
                <span>{user.email}</span>
              </span>
            </li>
            <li>
              {hasPassword ? (
                <SheetButton target="securite-mdp" className="t-li t-press">
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name="modifier" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("securite.password.title")}</b>
                    <span>{t("securite.password.text")}</span>
                  </span>
                  <TalentIcon name="suivant" className="t-w4-tel" />
                  <span className="t-w4-web t-bt t-sec t-s" aria-hidden>
                    {t("talentW4.settings.change")}
                  </span>
                </SheetButton>
              ) : (
                <Link href="/mot-de-passe-oublie" className="t-li t-press">
                  <span className="t-cases" aria-hidden>
                    <TalentIcon name="modifier" size="s" />
                  </span>
                  <span className="t-t">
                    <b>{t("securite.password.create")}</b>
                    <span>{t("securite.password.none")}</span>
                  </span>
                  <TalentIcon name="suivant" />
                </Link>
              )}
            </li>
            <li>
              <SheetButton target="securite-2fa" className="t-li t-press">
                <span className="t-cases t-c1" aria-hidden>
                  <TalentIcon name="cadenas" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("securite.twoFactor.title")}</b>
                  <span>{t("securite.twoFactor.text")}</span>
                </span>
                <span
                  role="img"
                  aria-label={
                    user.twoFactorEnabled
                      ? t("settings.security.2fa.on")
                      : t("settings.security.2fa.off")
                  }
                  className={user.twoFactorEnabled ? "t-sw t-on" : "t-sw"}
                />
              </SheetButton>
            </li>
            <li className="t-li">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="connexion" size="s" />
              </span>
              <span className="t-t">
                <b>{t("securite.linked.title")}</b>
                <span>
                  {linked.length > 0
                    ? linked.map((provider) => t(`securite.linked.${provider}`)).join(", ")
                    : t("securite.linked.none")}
                </span>
              </span>
            </li>
          </ul>

          <span className="t-ck-t" id="securite-appareils">
            {t("securite.devices.title")}
          </span>
          <ul aria-labelledby="securite-appareils" className="t-verre t-liste t-lignes t-w4-dev">
            {ordered.map((session) => {
              const isCurrent = session.token === current?.session.token;
              const device = deviceName(session.userAgent) ?? t("securite.devices.unknown");
              return (
                <li key={session.id} className="t-li">
                  <span className="t-t">
                    <b>{isCurrent ? t("securite.devices.current") : device}</b>
                    <span>
                      {isCurrent
                        ? device
                        : t("securite.devices.since", { date: formatShortDate(session.createdAt) })}
                    </span>
                  </span>
                  {isCurrent ? (
                    <span className="t-st t-pre">{t("securite.devices.active")}</span>
                  ) : (
                    <form action={revokeSession}>
                      <input type="hidden" name="token" value={session.token} />
                      <button
                        type="submit"
                        className="t-v t-lien t-press"
                        aria-label={t("securite.devices.logoutAria", { device })}
                      >
                        {t("securite.devices.logout")}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
          {sessions.length > 1 && (
            <form action={revokeOtherSessions}>
              <button type="submit" className="t-bt t-sec t-pl t-press">
                {t("securite.devices.logoutAll")}
              </button>
            </form>
          )}
        </div>
      </div>
      {hasPassword && (
        <Sheet
          id="securite-mdp"
          title={t("securite.password.sheet")}
          closeLabel={t("securite.close")}
          defaultOpen={Boolean(error) && error !== "wrongPassword"}
        >
          <form action={changePassword} className="t-flux">
            {(
              [
                ["current", "current-password", t("securite.password.current")],
                ["password", "new-password", t("securite.password.new")],
                ["confirm", "new-password", t("securite.password.confirm")],
              ] as const
            ).map(([name, complete, label]) => (
              <div key={name} className="t-champ">
                <label className="t-lab-c" htmlFor={`securite-${name}`}>
                  {label}
                </label>
                <span className="t-verre t-saisie">
                  <input
                    id={`securite-${name}`}
                    name={name}
                    type="password"
                    required
                    minLength={name === "current" ? undefined : PASSWORD_MIN}
                    autoComplete={complete}
                  />
                </span>
                {name === "password" && (
                  <span className="t-aide-c">
                    {t("securite.password.hint", { min: PASSWORD_MIN })}
                  </span>
                )}
              </div>
            ))}
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("securite.password.save")}
            </button>
          </form>
        </Sheet>
      )}

      <Sheet
        id="securite-2fa"
        title={t("securite.twoFactor.title")}
        closeLabel={t("securite.close")}
      >
        {hasPassword ? (
          <form action={setTwoFactor} className="t-flux">
            <input type="hidden" name="enable" value={user.twoFactorEnabled ? "0" : "1"} />
            <p className="t-vide-t">{t("settings.security.2fa.desc")}</p>
            <div className="t-champ">
              <label className="t-lab-c" htmlFor="securite-2fa-mdp">
                {t("securite.twoFactor.sheet")}
              </label>
              <span className="t-verre t-saisie">
                <input
                  id="securite-2fa-mdp"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </span>
            </div>
            <button
              type="submit"
              className={
                user.twoFactorEnabled ? "t-bt t-sec t-pl t-press" : "t-bt t-p t-pl t-press"
              }
            >
              {user.twoFactorEnabled
                ? t("securite.twoFactor.disable")
                : t("securite.twoFactor.enable")}
            </button>
          </form>
        ) : (
          <p className="t-gar">
            <TalentIcon name="aide" size="s" />
            <span>{t("securite.twoFactor.noPassword")}</span>
          </p>
        )}
      </Sheet>
    </div>
  );
}
