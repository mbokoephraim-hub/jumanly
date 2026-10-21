import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FlowHead } from "@/components/talent/flow-head";
import { SettingsNav } from "@/components/talent/settings-nav";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { SegmentRadios, SwitchRow } from "@/components/talent/settings-controls";
import { DesktopNotificationsSetting } from "@/components/recruiter/desktop-notifications";
import { cx } from "@/lib/cx";
import { getActiveSpace } from "@/server/hire-context";
import { updateNotifications } from "@/server/actions/settings";
import { requireUser } from "@/server/auth/session";
import { NOTIFICATION_CATEGORIES } from "@/server/services/notifications";
import { toHireSettings } from "@/server/settings-redirect";
import { inPartnerSpaceOnly } from "@/server/talent-space";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifReglages");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

const icons: Record<(typeof NOTIFICATION_CATEGORIES)[number], [TalentIconName, string?]> = {
  applications: ["candidature", "t-c2"],
  messages: ["message", "t-c2"],
  learning: ["former", "t-c1"],
  billing: ["portefeuille"],
};

/**
 * Notifications (planche talent-4 § 8): one switch per category, the e-mail channel for the
 * reminders, and the newsletter. One form: each switch saves it.
 */
export default async function NotificationSettingsPage({
  searchParams,
}: PageProps<"/app/parametres/notifications">) {
  const params = await searchParams;
  const user = await requireUser("/app/parametres/notifications");
  const space = await getActiveSpace(user.id);
  if (await inPartnerSpaceOnly(user.id)) toHireSettings("notifications", params);
  const t = await getTranslations();
  const muted = new Set(user.notificationsMuted);

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-tel">
        <FlowHead
          back="/app/parametres"
          backLabel={t("notifReglages.back")}
          title={t("notifReglages.title")}
          end={
            <Link
              href="/app/parametres"
              className="t-bi t-press"
              aria-label={t("parametres.close")}
            >
              <TalentIcon name="fermer" size="s" />
            </Link>
          }
        />
      </div>
      <h1 className="t-w4-web t-w4-ph1">{t("parametres.title")}</h1>
      <div className="t-w4-prm">
        <SettingsNav on="notifications" />
        <div className="t-w4-col">
          <h2 className="t-w4-web t-w4-h3">{t("notifReglages.title")}</h2>
          {one(params.ok) && <Notice tone="ok">{t("parametres.saved")}</Notice>}
          {one(params.erreur) && <Notice tone="err">{t("parametres.error")}</Notice>}

          <form action={updateNotifications} className="t-flux">
            <ul aria-label={t("notifReglages.list")} className="t-verre t-liste t-lignes">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const [icon, tone] = icons[category];
                return (
                  <li key={category}>
                    <SwitchRow
                      name="category"
                      value={category}
                      defaultChecked={!muted.has(category)}
                      icon={
                        <span className={cx("t-cases", tone)} aria-hidden>
                          <TalentIcon name={icon} size="s" />
                        </span>
                      }
                      title={t(`notifReglages.${category}.title`)}
                      text={t(`notifReglages.${category}.text`)}
                    />
                  </li>
                );
              })}
              <li>
                <SwitchRow
                  name="newsletter"
                  defaultChecked={user.newsletter}
                  icon={
                    <span className="t-cases t-c3" aria-hidden>
                      <TalentIcon name="notification" size="s" />
                    </span>
                  }
                  title={t("notifReglages.newsletter.title")}
                  text={t("notifReglages.newsletter.text")}
                />
              </li>
            </ul>

            <span className="t-ck-t" id="notif-canal">
              {t("notifReglages.channel.title")}
            </span>
            <SegmentRadios
              name="emails"
              labelledBy="notif-canal"
              current={user.notificationEmails ? "1" : "0"}
              options={[
                { value: "1", label: t("notifReglages.channel.both") },
                { value: "0", label: t("notifReglages.channel.app") },
              ]}
            />
            <p className="t-gar">
              <TalentIcon name="confidentialite" size="s" />
              <span>{t("notifReglages.channel.note")}</span>
            </p>
            <noscript>
              <button type="submit" className="t-bt t-sec t-pl">
                {t("parametres.save")}
              </button>
            </noscript>
          </form>
          {/* Web recruiter lot 4: the computer's notifications, asked for here and only here. */}
          {space && (
            <ul
              aria-label={t("hireWeb.desktop.group")}
              className="t-verre t-liste t-lignes t-rw-web t-rw-desk"
            >
              <li>
                <DesktopNotificationsSetting
                  labels={{
                    title: t("hireWeb.desktop.title"),
                    text: t("hireWeb.desktop.text"),
                    blocked: t("hireWeb.desktop.blocked"),
                    unsupported: t("hireWeb.desktop.unsupported"),
                  }}
                />
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
