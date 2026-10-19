import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  RadioGroup,
  Select,
  TextField,
  segmentedItem,
  segmentedList,
} from "@/components/ui";
import { countryOptions } from "@/config/countries";
import { formatDate } from "@/lib/dates";
import { DELETION_GRACE_DAYS, PASSWORD_MIN } from "@/lib/password";
import { cx } from "@/lib/cx";
import { dynamic } from "@/i18n/dynamic";
import {
  changePassword,
  revokeOtherSessions,
  revokeSession,
  scheduleDeletion,
  setTwoFactor,
  updateAccount,
  updateDisplay,
  updatePrivacy,
} from "@/server/actions/settings";
import { auth } from "@/server/auth";
import { getSession, requireUser, type CurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { ownedOrganization } from "@/server/services/accounts";
import { AppPageHeader } from "@/components/app/page-header";
import { TabRail } from "@/components/motion/tab-rail";
import { Icon } from "@/components/brand/icon";
import { AppearanceSwitch } from "@/components/account/account-controls";
import { pillClass } from "@/components/career/kit";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.seo");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

const tabIcons = {
  compte: "profil",
  securite: "securite",
  confidentialite: "confidentialite",
  donnees: "doc",
} as const;

const tabs = [
  { id: "compte", key: "account" },
  { id: "securite", key: "security" },
  { id: "confidentialite", key: "privacy" },
  { id: "donnees", key: "data" },
] as const;
type TabId = (typeof tabs)[number]["id"];

type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** « Paramètres » (partie 07): account, security, privacy and data. */
export default async function SettingsPage({ searchParams }: PageProps<"/app/parametres">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres");
  const t = await getTranslations();
  const active: TabId = tabs.find((tab) => tab.id === one(params.onglet))?.id ?? "compte";
  const plan = await resolvePlan(db, { type: "user", id: user.id });
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <AppPageHeader title={t("settings.title")} />
      <nav aria-label={t("settings.title")} className="lg:hidden">
        <TabRail name="parametres" className="bg-transparent! p-0!">
          <div className={segmentedList}>
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/app/parametres?onglet=${tab.id}`}
                aria-current={tab.id === active ? "page" : undefined}
                className={segmentedItem(tab.id === active)}
              >
                {t(`settings.tab.${tab.key}`)}
              </Link>
            ))}
          </div>
        </TabRail>
      </nav>
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_290px]">
        <div className="hidden flex-col gap-4 lg:flex">
          <nav
            aria-label={t("settings.title")}
            className="flex flex-col gap-1 rounded-[24px] bg-blanc p-3"
          >
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/app/parametres?onglet=${tab.id}`}
                aria-current={tab.id === active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-sm font-medium",
                  tab.id === active ? "bg-sapin text-blanc" : "text-sapin hover:bg-creme",
                )}
              >
                <Icon
                  name={tabIcons[tab.id]}
                  className={cx("size-[18px]", tab.id === active && "text-neon")}
                />
                {t(`settings.tab.${tab.key}`)}
              </Link>
            ))}
          </nav>
          {plan && (
            <section className="flex flex-col gap-2 rounded-[24px] bg-sapin p-5 text-blanc">
              <p className="text-[11px] font-semibold tracking-[0.09em] text-neon uppercase">
                {t("settings.account.plan.text")}
              </p>
              <p className="text-xl font-semibold">{plan.planName}</p>
              <Link href="/app/abonnement" className={pillClass("lime", "sm", "self-start")}>
                {t("settings.account.plan.manage")}
              </Link>
            </section>
          )}
        </div>
        <div className="min-w-0">
          {active === "compte" && <AccountTab user={user} params={params} />}
          {active === "securite" && <SecurityTab user={user} params={params} />}
          {active === "confidentialite" && <PrivacyTab user={user} params={params} />}
          {active === "donnees" && <DataTab user={user} params={params} />}
        </div>
        <aside className="hidden flex-col gap-4 xl:flex">
          {active !== "donnees" && (
            <section className="flex flex-col gap-2 rounded-[24px] bg-blanc p-5">
              <h2 className="text-[15px] font-semibold">{t("settings.data.title")}</h2>
              <p className="text-xs text-ardoise">{t("settings.data.export.desc")}</p>
              <Link
                href="/app/parametres?onglet=donnees"
                className={pillClass("outline", "sm", "self-start")}
              >
                <Icon name="telecharger" className="size-4" />
                {t("settings.data.export.cta")}
              </Link>
            </section>
          )}
          {active !== "securite" && (
            <section className="flex flex-col gap-2 rounded-[24px] bg-blanc p-5">
              <h2 className="text-[15px] font-semibold">{t("settings.tab.security")}</h2>
              <Link
                href="/app/parametres?onglet=securite"
                className="flex items-center justify-between gap-2 text-sm hover:underline"
              >
                {t("settings.security.2fa.text")}
                <span
                  className={cx(
                    "rounded-pill px-2.5 py-0.5 text-[11px] font-semibold",
                    user.twoFactorEnabled ? "bg-menthe-clair text-[#0B5E49]" : "bg-brume",
                  )}
                >
                  {user.twoFactorEnabled
                    ? t("settings.security.2fa.on")
                    : t("settings.security.2fa.off")}
                </span>
              </Link>
            </section>
          )}
          <p className="flex items-start gap-2 px-1 text-xs text-ardoise">
            <Icon name="info" className="size-3.5 shrink-0" />
            {t("settings.data.contact")}
          </p>
        </aside>
      </div>
    </div>
  );
}

/** Switch made of a native checkbox, so that the form posts it like any other field. */
function Toggle({
  id,
  name,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm leading-5 font-medium text-sapin">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-xs leading-[17px] text-ardoise">
            {hint}
          </p>
        )}
      </div>
      <input
        id={id}
        name={name}
        value="on"
        type="checkbox"
        role="switch"
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="relative mt-0.5 h-[26px] w-11 shrink-0 cursor-pointer appearance-none rounded-pill bg-brume transition-colors before:absolute before:top-[3px] before:left-[3px] before:size-5 before:rounded-full before:bg-blanc before:shadow-sm before:transition-transform checked:bg-sapin checked:before:translate-x-[18px] checked:before:bg-lime focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapin motion-reduce:transition-none motion-reduce:before:transition-none"
      />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[24px] bg-blanc p-5 lg:p-7" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

async function AccountTab({ user, params }: { user: CurrentUser; params: Params }) {
  const t = await getTranslations();
  const td = dynamic(t);
  const plan = await resolvePlan(db, { type: "user", id: user.id });
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: "active" },
    include: { organization: { select: { name: true } } },
  });
  return (
    <div className="flex flex-col gap-6">
      {one(params.ok) && <Alert tone="success" title={t("settings.saved")} />}
      {one(params.erreur) && <Alert tone="error" title={t("settings.error")} />}
      <Panel title={t("settings.account.title")}>
        <form action={updateAccount} className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="firstName"
            name="firstName"
            label={t("signup.account.firstName.label")}
            defaultValue={user.firstName ?? ""}
            required
            autoComplete="given-name"
          />
          <TextField
            id="lastName"
            name="lastName"
            label={t("signup.account.lastName.label")}
            defaultValue={user.lastName ?? ""}
            required
            autoComplete="family-name"
          />
          <Select
            id="country"
            name="country"
            label={t("settings.account.country")}
            defaultValue={user.country ?? ""}
            required
            placeholder={t("signup.account.country.placeholder")}
            options={countryOptions("code")}
          />
          <TextField
            id="city"
            name="city"
            label={t("settings.account.city")}
            defaultValue={user.city ?? ""}
            required
            autoComplete="address-level2"
          />
          <div className="sm:col-span-2">
            <Button type="submit">{t("settings.save")}</Button>
          </div>
        </form>
        <div className="flex flex-wrap items-center gap-3 border-t border-brume pt-4">
          <span className="font-medium">{t("settings.account.email.text")}</span>
          <span>{user.email}</span>
          {user.emailVerified && (
            <Badge tone="success">{t("settings.account.email.verified")}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium">{t("settings.account.plan.text")}</span>
          <span>{t("settings.account.plan.value", { plan: plan?.planName ?? "" })}</span>
          <ButtonLink href="/app/abonnement" variant="tertiary" size="sm">
            {t("settings.account.plan.manage")}
          </ButtonLink>
        </div>
      </Panel>
      <Panel title={t("settings.display.title")}>
        <form action={updateDisplay} className="flex flex-col items-start gap-4">
          <Toggle
            id="reduceMotion"
            name="reduceMotion"
            defaultChecked={user.reduceMotion}
            label={t("settings.display.reduceMotion.text")}
            hint={t("settings.display.reduceMotion.hint")}
          />
          <Button type="submit">{t("settings.save")}</Button>
        </form>
        {/* Moved here from « Compte » (lot 6); lot 7 redraws this page. */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-brume pt-5">
          <span className="font-medium">{t("accountPage.appearance.label")}</span>
          <AppearanceSwitch
            current={user.appearance}
            labels={{
              group: t("accountPage.appearance.label"),
              auto: t("accountPage.appearance.auto"),
              light: t("accountPage.appearance.light"),
              dark: t("accountPage.appearance.dark"),
              saved: t("accountPage.appearance.saved"),
            }}
          />
        </div>
        <div className="mt-5 flex flex-col items-start gap-1.5 border-t border-brume pt-5">
          <ButtonLink
            href="/app/parametres?onglet=compte&arrivee=1&revoir=1"
            variant="tertiary"
            size="sm"
            iconAfter={<Icon name="play" className="size-3.5" />}
          >
            {t("settings.display.replayIntro.text")}
          </ButtonLink>
          <p className="text-sm text-ardoise">{t("settings.display.replayIntro.hint")}</p>
        </div>
      </Panel>
      <Panel title={t("settings.account.memberships.text")}>
        {memberships.length === 0 ? (
          <p className="text-sm text-ardoise">{t("settings.account.memberships.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {memberships.map((membership) => (
              <li key={membership.id}>
                {t("settings.account.memberships.role", {
                  org: membership.organization.name,
                  role: td(`org.roles.${membership.role}.text`),
                })}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/** "Chrome · Android" from a user agent; good enough to recognise one's devices. */
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
  const name = [browser, system].filter(Boolean).join(" · ");
  return name || null;
}

async function SecurityTab({ user, params }: { user: CurrentUser; params: Params }) {
  const t = await getTranslations();
  const td = dynamic(t);
  const current = await getSession();
  const sessions = await auth.api.listSessions({ headers: await headers() }).catch(() => []);
  const hasPassword = Boolean(
    await db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    }),
  );
  const ok = one(params.ok);
  const error = one(params.erreur);
  const errorText =
    error === "wrongPassword"
      ? t("settings.security.password.wrong")
      : error && td.has(`auth.error.${error}`)
        ? td(`auth.error.${error}`, { min: PASSWORD_MIN })
        : error
          ? t("settings.error")
          : null;
  return (
    <div className="flex flex-col gap-6">
      {one(params.raison) === "deux-etapes" && (
        <Alert tone="warning" title={t("settings.security.2fa.required")} />
      )}
      {ok === "password" && (
        <Alert tone="success" title={t("settings.security.password.changed")} />
      )}
      {ok === "session" && (
        <Alert tone="success" title={t("settings.security.sessions.loggedOut")} />
      )}
      {ok === "2fa" && <Alert tone="success" title={t("settings.security.2fa.changed")} />}
      {errorText && <Alert tone="error" title={errorText} />}
      {hasPassword && (
        <Panel title={t("settings.security.password.change")}>
          <form action={changePassword} className="flex max-w-md flex-col gap-4">
            <TextField
              id="current"
              name="current"
              type="password"
              label={t("settings.security.password.current")}
              required
              autoComplete="current-password"
            />
            <TextField
              id="password"
              name="password"
              type="password"
              label={t("settings.security.password.new")}
              hint={t("auth.error.passwordTooShort", { min: PASSWORD_MIN })}
              required
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
            />
            <TextField
              id="confirm"
              name="confirm"
              type="password"
              label={t("settings.security.password.confirm")}
              required
              autoComplete="new-password"
            />
            <div>
              <Button type="submit">{t("settings.save")}</Button>
            </div>
          </form>
        </Panel>
      )}
      <Panel title={t("settings.security.2fa.text")}>
        <p className="text-sm text-ardoise">{t("settings.security.2fa.desc")}</p>
        <div>
          <Badge tone={user.twoFactorEnabled ? "success" : "neutral"}>
            {user.twoFactorEnabled ? t("settings.security.2fa.on") : t("settings.security.2fa.off")}
          </Badge>
        </div>
        {hasPassword && (
          <form action={setTwoFactor} className="flex max-w-md flex-col gap-4">
            <input type="hidden" name="enable" value={user.twoFactorEnabled ? "0" : "1"} />
            <TextField
              id="twofa-password"
              name="password"
              type="password"
              label={t("settings.security.2fa.password")}
              required
              autoComplete="current-password"
            />
            <div>
              <Button type="submit" variant={user.twoFactorEnabled ? "secondary" : "primary"}>
                {user.twoFactorEnabled
                  ? t("settings.security.2fa.disable")
                  : t("settings.security.2fa.enable")}
              </Button>
            </div>
          </form>
        )}
      </Panel>
      <Panel title={t("settings.security.sessions.text")}>
        <ul className="flex flex-col divide-y divide-brume">
          {sessions.map((session) => {
            const isCurrent = session.token === current?.session.token;
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="flex items-center gap-2">
                  {t("settings.security.sessions.since", {
                    device:
                      deviceName(session.userAgent) ?? t("settings.security.sessions.unknown"),
                    date: formatDate(session.createdAt),
                  })}
                  {isCurrent && (
                    <Badge tone="sapin">{t("settings.security.sessions.current")}</Badge>
                  )}
                </span>
                {!isCurrent && (
                  <form action={revokeSession}>
                    <input type="hidden" name="token" value={session.token} />
                    <Button type="submit" variant="tertiary" size="sm">
                      {t("settings.security.sessions.logout")}
                    </Button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
        {sessions.length > 1 && (
          <form action={revokeOtherSessions}>
            <Button type="submit" variant="secondary" size="sm">
              {t("settings.security.sessions.logoutAll")}
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}

async function PrivacyTab({ user, params }: { user: CurrentUser; params: Params }) {
  const t = await getTranslations();
  const profile = await db.talentProfile.findUnique({
    where: { userId: user.id },
    select: { visibility: true, matchingEnabled: true, acceptsContactRequests: true },
  });
  return (
    <div className="flex flex-col gap-6">
      {one(params.ok) && <Alert tone="success" title={t("settings.saved")} />}
      <Panel title={t("settings.privacy.title")}>
        <form action={updatePrivacy} className="flex flex-col gap-6">
          <RadioGroup
            legend={t("settings.privacy.visibility.text")}
            name="visibility"
            defaultValue={profile?.visibility ?? "private"}
            options={(["private", "recruiters", "anonymous"] as const).map((value) => ({
              value,
              label: t(`talent.profile.visibility.${value}.text`),
              hint: t(`talent.profile.visibility.${value}.desc`),
            }))}
          />
          <p className="text-sm text-ardoise">{t("talent.profile.visibility.always")}</p>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-label">{t("settings.privacy.ai.text")}</legend>
            <div className="flex flex-col gap-3 rounded-[18px] bg-creme p-4 text-sm">
              <p className="font-semibold">{t("ai.consent.title")}</p>
              <p className="text-ardoise">{t("ai.consent.intro")}</p>
              <ul className="flex flex-col gap-2.5">
                {(
                  [
                    ["uses", "check", "text-feuille-fonce"],
                    ["never", "eye-off", "text-[#B3261E]"],
                    ["control", "transparence", "text-sapin"],
                  ] as const
                ).map(([key, icon, tone]) => (
                  <li key={key} className="flex gap-2.5">
                    <Icon name={icon} className={cx("mt-0.5 size-4 shrink-0", tone)} />
                    <span>
                      <strong className="font-semibold">{t(`ai.consent.${key}.title`)}</strong>
                      {" · "}
                      <span className="text-ardoise">{t(`ai.consent.${key}.body`)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ardoise">{t("ai.consent.optional")}</p>
            </div>
            <Toggle
              id="ai"
              name="ai"
              defaultChecked={Boolean(user.aiConsentAt)}
              label={t("settings.privacy.ai.desc")}
              hint={t("settings.privacy.ai.hint")}
            />
            <Toggle
              id="matching"
              name="matching"
              defaultChecked={profile?.matchingEnabled ?? true}
              label={t("settings.privacy.ai.matching.text")}
              hint={t("settings.privacy.ai.matching.hint")}
            />
            <Link href="/comment-fonctionne-le-matching" className="text-sm underline">
              {t("settings.privacy.ai.learnMore")}
            </Link>
          </fieldset>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-label">
              {t("settings.privacy.contactRequests.legend")}
            </legend>
            <Toggle
              id="contact-requests"
              name="contactRequests"
              defaultChecked={profile?.acceptsContactRequests ?? true}
              label={t("settings.privacy.contactRequests.text")}
              hint={t("settings.privacy.contactRequests.hint")}
            />
          </fieldset>
          <Toggle
            id="newsletter"
            name="newsletter"
            defaultChecked={user.newsletter}
            label={t("settings.notifications.group.news")}
          />
          <div>
            <Button type="submit">{t("settings.save")}</Button>
          </div>
        </form>
        <Link href="/confidentialite" className="text-sm underline">
          {t("settings.privacy.policy")}
        </Link>
      </Panel>
    </div>
  );
}

async function DataTab({ user, params }: { user: CurrentUser; params: Params }) {
  const t = await getTranslations();
  const org = await ownedOrganization(db, user.id);
  const error = one(params.erreur);
  const hasPassword = Boolean(
    await db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    }),
  );
  return (
    <div className="flex flex-col gap-6">
      {error === "confirm" && (
        <Alert tone="error" title={t("settings.data.delete.confirm.error")} />
      )}
      {error === "wrongPassword" && (
        <Alert tone="error" title={t("settings.security.password.wrong")} />
      )}
      <Panel title={t("settings.data.export.text")}>
        <p className="text-sm text-ardoise">{t("settings.data.export.nowDesc")}</p>
        <div>
          <a href="/app/parametres/export" download className="font-medium underline">
            {t("settings.data.export.now")}
          </a>
        </div>
      </Panel>
      <Panel title={t("settings.data.delete.text")}>
        <p className="text-sm">{t("settings.data.delete.desc")}</p>
        {org ? (
          <Alert tone="warning" title={t("settings.data.delete.ownerBlock", { org: org.name })} />
        ) : (
          <details>
            <summary className="cursor-pointer font-medium text-corail-fonce underline">
              {t("settings.data.delete.cta")}
            </summary>
            <form
              action={scheduleDeletion}
              className="mt-4 flex max-w-md flex-col gap-4 rounded-md bg-creme p-4"
            >
              <p className="font-semibold">{t("settings.data.delete.confirm.title")}</p>
              <p className="text-sm">
                {t("settings.data.delete.confirm.body", { days: DELETION_GRACE_DAYS })}
              </p>
              <TextField
                id="delete-confirm"
                name="confirm"
                label={t("settings.data.delete.confirm.type")}
                required
                autoComplete="off"
              />
              {hasPassword && (
                <TextField
                  id="delete-password"
                  name="password"
                  type="password"
                  label={t("settings.data.delete.confirm.password")}
                  required
                  autoComplete="current-password"
                />
              )}
              <div>
                <Button type="submit" variant="danger">
                  {t("settings.data.delete.confirm.cta")}
                </Button>
              </div>
            </form>
          </details>
        )}
      </Panel>
      <p className="text-sm text-ardoise">{t("settings.data.contact")}</p>
    </div>
  );
}
